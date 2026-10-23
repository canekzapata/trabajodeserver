// motor.mjs — Sampleador de espacio-tiempo.
// Una cuerda lenta (se mueve a ritmo de mano, ~1 Hz) guarda toda su historia u(x, t). Un cabezal la lee a
// ritmo de audio a lo largo de un corte del espacio-tiempo: la forma de la cuerda es la forma de onda.
// Es síntesis escaneada (Verplank, Mathews y Shaw, 2000) con tres añadidos, cada uno con su modelo:
//
//  · Volterra: memoria hereditaria viscoelástica. Fuerza −g ∫K(s)[u(t) − u(t−s)] ds con K(s) ∝ s^(−α),
//    aproximada por una serie de Prony (elementos de Maxwell en paralelo). Disipa: la energía total,
//    contando la guardada en los elementos, nunca sube.
//  · Kirchhoff (1876): la tensión crece con el estiramiento total, c²_ef = c²(1 + κ ∫u_x² dx).
//  · Corte oblicuo: el cabezal lee u(x, t − τ(x)) con τ(x) = τ₀ + β(x − ½)L/c. Es el plano de simultaneidad
//    de un observador que se mueve a β·c respecto de la cuerda (sin el factor γ, que sólo cambia la escala).
//    Takens (1981) aparece sólo como retrato de retardos de una sonda, para mirar; no se afirma reconstruir nada.

export const VERSION = 'sampleador-espacio-tiempo-0.1.0';

// ── núcleo de memoria: s^(−α) = (1/Γ(α)) ∫ e^(−s/θ) θ^(−α) d(ln θ), discretizado en θ log-espaciados ──
function gamma(z) { // Lanczos
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5; return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
}
export function nucleo(alfa, { thMin = 0.002, thMax = 200, M = 16 } = {}) {
  const th = [], c = [], d = Math.log(thMax / thMin) / (M - 1);
  for (let j = 0; j < M; j++) { const t = thMin * Math.exp(j * d); th.push(t); c.push((t ** -alfa * d) / gamma(alfa)); }
  // forma normalizada: K(s) = Σ w_j e^(−s/θ_j)/θ_j, con Σ w_j = 1 (∫K = 1)
  const w = c.map((cj, j) => cj * th[j]); const s = w.reduce((a, b) => a + b, 0);
  const K = (sx) => th.reduce((acc, t, j) => acc + (w[j] / s) * Math.exp(-sx / t) / t, 0);
  return { th, w: w.map((x) => x / s), K };
}
// Dos medidas distintas del núcleo:
//  · errorNucleo: error de la discretización (16 exponenciales) contra la integral continua con los mismos
//    cortes θ ∈ [0,002; 200] s, tras ajustar la constante. Mide la serie de Prony, no el modelo.
//  · pendiente: d ln K / d ln s. Por el horizonte θ_max la cola se corta, y la pendiente es algo más empinada
//    que −α, sobre todo para α pequeño. Es una propiedad declarada del instrumento: la memoria tiene horizonte.
export function errorNucleo(alfa, s0 = 0.05, s1 = 2) {
  const n = nucleo(alfa), L0 = Math.log(0.002), L1 = Math.log(200), M = 4000;
  const cont = (sx) => { let a = 0; for (let i = 0; i <= M; i++) { const t = Math.exp(L0 + ((L1 - L0) * i) / M); a += (i === 0 || i === M ? 0.5 : 1) * t ** -alfa * Math.exp(-sx / t); } return a; };
  const r = []; for (let i = 0; i <= 100; i++) { const sx = s0 * (s1 / s0) ** (i / 100); r.push(n.K(sx) / cont(sx)); }
  const C = r.reduce((a, b) => a + b, 0) / r.length;
  return Math.max(...r.map((x) => Math.abs(x / C - 1)));
}
export function pendiente(alfa, sx) { const n = nucleo(alfa); return (Math.log(n.K(sx * 1.1)) - Math.log(n.K(sx / 1.1))) / (2 * Math.log(1.1)); }

export class Hoja {
  constructor(p = {}) {
    this.p = { N: 64, c: 1.6, gamma: 0.15, kappa: 0, g: 0, alfa: 0.4, tasa: 1500, historia: 4, ...p };
    const N = this.p.N;
    this.dx = 1 / (N + 1);
    this.u = new Float64Array(N); this.v = new Float64Array(N); this.a = new Float64Array(N);
    this.mano = null;
    this.ponerMemoria();
    this.t = 0;
    // historia: anillo de cuadros a la tasa de física
    this.F = Math.round(this.p.tasa * this.p.historia) + 2;
    this.hist = new Float32Array(this.F * N); this.cabeza = 0; this.llenos = 1;
    this.fuerzas();
  }
  ponerMemoria() {
    const n = nucleo(this.p.alfa); this.th = n.th; this.w = n.w;
    if (!this.z || this.z.length !== n.th.length) this.z = n.th.map(() => Float64Array.from(this.u || []));
  }
  ponerParams(c) { const a0 = this.p.alfa; Object.assign(this.p, c); if (c.alfa !== undefined && c.alfa !== a0) this.ponerMemoria(); this.fuerzas(); }

  estiramiento() { const { u, dx } = this; let s = 0, prev = 0; for (let i = 0; i < u.length; i++) { s += ((u[i] - prev) / dx) ** 2 * dx; prev = u[i]; } return s + (prev / dx) ** 2 * dx; }
  c2() { return this.p.c * this.p.c * (1 + this.p.kappa * this.estiramiento()); }

  fuerzas() {
    const { u, a, dx, p } = this, N = u.length, c2 = this.c2() / (dx * dx);
    for (let i = 0; i < N; i++) {
      const l = i ? u[i - 1] : 0, r = i + 1 < N ? u[i + 1] : 0;
      let f = c2 * (l - 2 * u[i] + r);
      if (p.g) { let m = 0; for (let j = 0; j < this.w.length; j++) m += this.w[j] * this.z[j][i]; f -= p.g * (u[i] - m); }
      a[i] = f;
    }
    if (this.mano) { const { x, y, k } = this.mano; for (let i = 0; i < N; i++) { const d = ((i + 1) * dx - x) / 0.05; a[i] += k * Math.exp(-d * d) * (y - u[i]); } }
  }

  paso() {
    const dt = 1 / this.p.tasa, { u, v, a } = this, N = u.length;
    const am = Math.exp(-this.p.gamma * dt / 2);
    for (let i = 0; i < N; i++) { v[i] = v[i] * am + 0.5 * dt * a[i]; u[i] += dt * v[i]; }
    // elementos de Maxwell: ż_j = (u − z_j)/θ_j, exacto para u constante en el paso
    if (this.p.g) for (let j = 0; j < this.th.length; j++) { const e = Math.exp(-dt / this.th[j]), z = this.z[j]; for (let i = 0; i < N; i++) z[i] = u[i] + (z[i] - u[i]) * e; }
    else for (let j = 0; j < this.th.length; j++) this.z[j].set(u);
    this.fuerzas();
    for (let i = 0; i < N; i++) v[i] = (v[i] + 0.5 * dt * a[i]) * am;
    this.t += dt;
    this.cabeza = (this.cabeza + 1) % this.F; this.llenos = Math.min(this.F, this.llenos + 1);
    this.hist.set(u, this.cabeza * N);
  }

  // energía de la cuerda (con Kirchhoff) y la guardada en los elementos de Maxwell
  energia() {
    const { u, v, dx, p } = this; let cin = 0;
    for (let i = 0; i < u.length; i++) cin += 0.5 * v[i] * v[i];
    const S = this.estiramiento();
    const pot = (0.5 * p.c * p.c * (S + 0.5 * p.kappa * S * S)) / dx; // ∫ en unidades de masa por punto
    let mem = 0;
    if (p.g) for (let j = 0; j < this.th.length; j++) for (let i = 0; i < u.length; i++) mem += 0.5 * p.g * this.w[j] * (u[i] - this.z[j][i]) ** 2;
    return { cuerda: cin + pot, memoria: mem, total: cin + pot + mem };
  }

  // ── golpes ──
  pulsar(x0 = 0.3, A = 0.4) { const { u, dx } = this; for (let i = 0; i < u.length; i++) { const x = (i + 1) * dx; u[i] += A * (x < x0 ? x / x0 : (1 - x) / (1 - x0)); } this.fuerzas(); }
  golpear(x0 = 0.5, A = 2, ancho = 0.06) { const { v, dx } = this; for (let i = 0; i < v.length; i++) { const d = ((i + 1) * dx - x0) / ancho; v[i] += A * Math.exp(-d * d); } }
  ponerForma(f) { for (let i = 0; i < this.u.length; i++) this.u[i] = f((i + 1) * this.dx); this.v.fill(0); this.z.forEach((z) => z.set(this.u)); this.fuerzas(); }

  // ── lectura del espacio-tiempo: u(x, t − τ), interpolada en x y en τ ──
  leer(x, tau) {
    const N = this.p.N, dx = this.dx;
    const k = Math.min(Math.max(tau, 0) * this.p.tasa, this.llenos - 1.001);
    const k0 = Math.floor(k), fr = k - k0;
    const f0 = (this.cabeza - k0 + this.F) % this.F, f1 = (f0 - 1 + this.F) % this.F;
    const pos = x / dx - 1, i0 = Math.floor(pos), fi = pos - i0;
    const val = (f, i) => (i < 0 || i >= N ? 0 : this.hist[f * N + i]);
    const a = val(f0, i0) * (1 - fi) + val(f0, i0 + 1) * fi;
    const b = k0 + 1 < this.llenos ? val(f1, i0) * (1 - fi) + val(f1, i0 + 1) * fi : a;
    return a * (1 - fr) + b * fr;
  }
}

// lee una forma fija (un estrato) en x
export function leerForma(forma, x) {
  const N = forma.length, pos = x * (N + 1) - 1, i0 = Math.floor(pos), fi = pos - i0;
  const v = (i) => (i < 0 || i >= N ? 0 : forma[i]);
  return v(i0) * (1 - fi) + v(i0 + 1) * fi;
}

// ── el instrumento ──
export class Sampleador {
  constructor(sr, p = {}) {
    this.sr = sr;
    this.p = { f: 110, tau0: 0, beta: 0, mezcla: 0, ganancia: 2.0, ataque: 0.01, suelta: 0.25, ...p };
    this.h = new Hoja(p);
    this.porCuadro = sr / this.h.p.tasa; this.cont = 0;
    this.fase = 0; this.gate = 0; this.env = 0;
    this.estratos = []; this.estrato = -1;
    this.dc = { x: 0, y: 0, a: Math.exp(-2 * Math.PI * 8 / sr) };
    // el cabezal y la mezcla se deslizan (~40 ms): moverlos no produce saltos en la forma de onda
    this.suave = { tau0: this.p.tau0, beta: this.p.beta, mezcla: this.p.mezcla };
    this.ks = 1 - Math.exp(-1 / (0.04 * sr));
  }
  ponerParams(c) { Object.assign(this.p, c); this.h.ponerParams(c); }
  tau(x, p = this.p) { return p.tau0 + p.beta * (x - 0.5) / this.h.p.c; } // L = 1
  cristalizar() { this.estratos.push({ forma: Float64Array.from(this.h.u), t: this.h.t }); if (this.estratos.length > 5) this.estratos.shift(); this.estrato = this.estratos.length - 1; }
  muestra(x) {
    const q = this.suave;
    let s = this.h.leer(x, this.tau(x, q));
    if (this.estrato >= 0 && q.mezcla > 1e-6) s = s * (1 - q.mezcla) + q.mezcla * leerForma(this.estratos[this.estrato].forma, x);
    return s;
  }
  procesar(out, n, desde = 0) {
    const { p } = this, ka = 1 - Math.exp(-1 / (p.ataque * this.sr)), ks = 1 - Math.exp(-1 / (p.suelta * this.sr));
    for (let j = 0; j < n; j++) {
      if (++this.cont >= this.porCuadro) { this.cont -= this.porCuadro; this.h.paso(); }
      for (const k of ['tau0', 'beta', 'mezcla']) this.suave[k] += (p[k] - this.suave[k]) * this.ks;
      this.fase += p.f / this.sr; if (this.fase >= 1) this.fase -= 1;
      const s = this.muestra(this.fase);
      this.env += ((this.gate ? 1 : 0) - this.env) * (this.gate ? ka : ks);
      const y = s - this.dc.x + this.dc.a * this.dc.y; this.dc.x = s; this.dc.y = y;
      let o = y * this.env * p.ganancia;
      if (!Number.isFinite(o)) o = 0;
      out[desde + j] = Math.max(-1, Math.min(1, o));
    }
  }
}
