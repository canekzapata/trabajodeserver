// motor.mjs — Cuerda que recuerda: una cadena Fermi–Pasta–Ulam–Tsingou α-β integrada de verdad.
// Nada se dibuja a mano: el sonido es una captación de las velocidades de la cadena y todas las
// medidas (energía por modo, fase, forma, energía total) salen del estado integrado.
//
//   q̈_i = V'(r_i) − V'(r_{i−1}) − γ q̇_i,   r_i = q_{i+1} − q_i,   extremos fijos q_0 = q_{N+1} = 0
//   V(r) = r²/2 + α r³/3 + β r⁴/4
//
// Unidades de la cadena: masa = rigidez = 1. El modo k lineal tiene ω_k = 2 sen(kπ / 2(N+1)).
// El reloj musical se fija escalando el tiempo: el modo 1 lineal suena a f0 Hz. Los demás modos
// quedan donde la cadena los pone (inarmónicos, más bajos que k·f0).

export const VERSION = 'cuerda-que-recuerda-0.1.0';

export class Cadena {
  constructor(N = 32, p = {}) {
    this.N = N;
    this.p = { alfa: 0, beta: 1, gamma: 0, ...p };
    this.q = new Float64Array(N); this.v = new Float64Array(N); this.a = new Float64Array(N);
    this.t = 0;
    // modos normales lineales: S[k][i] = √(2/(N+1)) sen((k+1)(i+1)π/(N+1))
    this.S = Array.from({ length: N }, (_, k) => Float64Array.from({ length: N }, (_, i) => Math.sqrt(2 / (N + 1)) * Math.sin(((k + 1) * (i + 1) * Math.PI) / (N + 1))));
    this.w = Float64Array.from({ length: N }, (_, k) => 2 * Math.sin(((k + 1) * Math.PI) / (2 * (N + 1))));
    this.ref = null; // estado modal de referencia (el golpe), para medir regresos
    this.fuerzas();
  }

  dVdr(r) { const { alfa, beta } = this.p; return r + alfa * r * r + beta * r * r * r; }
  V(r) { const { alfa, beta } = this.p; return (r * r) / 2 + (alfa * r * r * r) / 3 + (beta * r * r * r * r) / 4; }

  fuerzas() {
    const { q, a, N } = this;
    let fizq = this.dVdr(q[0]); // resorte entre la pared izquierda y la masa 0
    for (let i = 0; i < N; i++) {
      const r = (i + 1 < N ? q[i + 1] : 0) - q[i];
      const fder = this.dVdr(r);
      a[i] = fder - fizq;
      fizq = fder;
    }
  }

  // Verlet de velocidad; la pérdida γ se aplica como amortiguamiento exacto de la velocidad en cada medio paso
  paso(dt) {
    const { q, v, a, N } = this;
    const amort = Math.exp(-this.p.gamma * dt / 2);
    for (let i = 0; i < N; i++) { v[i] = v[i] * amort + 0.5 * dt * a[i]; q[i] += dt * v[i]; }
    this.fuerzas();
    for (let i = 0; i < N; i++) v[i] = (v[i] + 0.5 * dt * a[i]) * amort;
    this.t += dt;
  }

  energia() {
    const { q, v, N } = this;
    let E = 0, prev = 0;
    for (let i = 0; i < N; i++) { E += 0.5 * v[i] * v[i] + this.V(q[i] - prev); prev = q[i]; }
    return E + this.V(0 - prev);
  }

  // amplitudes modales complejas z_k = ω_k Q_k + i P_k  (|z_k|²/2 = energía armónica del modo k)
  modos() {
    const { q, v, S, w, N } = this;
    const re = new Float64Array(N), im = new Float64Array(N), e = new Float64Array(N);
    for (let k = 0; k < N; k++) {
      let Q = 0, P = 0; const s = S[k];
      for (let i = 0; i < N; i++) { Q += s[i] * q[i]; P += s[i] * v[i]; }
      re[k] = w[k] * Q; im[k] = P; e[k] = 0.5 * (re[k] * re[k] + im[k] * im[k]);
    }
    return { re, im, e };
  }

  // ── golpes: se suman al estado que ya vibra ──
  // 'modo1': desplazamiento en la forma del modo 1 (simétrico; el caso clásico de 1955)
  // 'local': impulso de velocidad gaussiano en la posición x ∈ (0,1), con energía igual a la del modo 1 de la misma amplitud
  // imperfeccion: desplazamiento mínimo y asimétrico (en la masa 5) que siembra la ruptura de simetría.
  //   Con 0, la única semilla es el redondeo numérico: el instante del olvido dependería de la aritmética.
  golpe({ tipo = 'modo1', A = 6, x = 0.3, ancho = 0.06, imperfeccion = 0 } = {}) {
    const { q, v, N } = this;
    if (tipo === 'modo1') for (let i = 0; i < N; i++) q[i] += A * this.S[0][i];
    else {
      const perfil = Float64Array.from({ length: N }, (_, i) => Math.exp(-((((i + 1) / (N + 1) - x) / ancho) ** 2)));
      const norma = Math.hypot(...perfil);
      // energía cinética ½|v|² = ½ ω1² A²
      const esc = (this.w[0] * A) / norma;
      for (let i = 0; i < N; i++) v[i] += esc * perfil[i];
    }
    if (imperfeccion) q[Math.min(5, N - 1)] += imperfeccion;
    this.fuerzas();
    this.marcar();
  }

  marcar() { const m = this.modos(); this.ref = { ...m, t: this.t, E: this.energia() }; }

  apagar() { this.q.fill(0); this.v.fill(0); this.fuerzas(); this.ref = null; }

  // ── medidas ──
  // regresoEnergia: 1 − ½ Σ|p_k − p_k⁰| (1 = misma distribución de energía entre modos que al golpear)
  // forma: |⟨z, z⁰⟩| / (|z||z⁰|) — mismas proporciones y fases relativas que al golpear, salvo una rotación común.
  //   Ojo: en una cadena lineal la forma también se pierde por dispersión (modos inarmónicos); compárese con el control lineal.
  // desfase1: fase del modo 1 respecto de la que tendría con evolución lineal desde el golpe
  medidas() {
    const m = this.modos(), N = this.N;
    let tot = 0, par = 0; for (let k = 0; k < N; k++) { tot += m.e[k]; if (k % 2 === 1) par += m.e[k]; }
    const out = { e: m.e, total: tot, E: this.energia(), pares: tot > 0 ? par / tot : 0, entropia: 0, regresoEnergia: null, forma: null, desfase1: null, periodos: (this.t * this.w[0]) / (2 * Math.PI) };
    for (let k = 0; k < N; k++) { const p = tot > 0 ? m.e[k] / tot : 0; if (p > 1e-12) out.entropia -= p * Math.log2(p); }
    if (this.ref && tot > 0) {
      const r = this.ref; let tr = 0; for (let k = 0; k < N; k++) tr += r.e[k];
      let d = 0, ar = 0, ai = 0, n0 = 0, n1 = 0;
      for (let k = 0; k < N; k++) {
        d += Math.abs(m.e[k] / tot - r.e[k] / tr);
        // ⟨z, z⁰⟩ con z = re + i·im
        ar += m.re[k] * r.re[k] + m.im[k] * r.im[k];
        ai += m.im[k] * r.re[k] - m.re[k] * r.im[k];
        n0 += r.re[k] ** 2 + r.im[k] ** 2; n1 += m.re[k] ** 2 + m.im[k] ** 2;
      }
      out.regresoEnergia = 1 - d / 2;
      out.forma = Math.hypot(ar, ai) / Math.sqrt(n0 * n1);
      // fase del modo 1: z_1 gira como e^{−iω₁t} en la evolución lineal
      const f = Math.atan2(m.im[0], m.re[0]) - Math.atan2(r.im[0], r.re[0]) + this.w[0] * (this.t - r.t);
      out.desfase1 = Math.atan2(Math.sin(f), Math.cos(f));
    }
    return out;
  }
}

// ── el instrumento: cadena + reloj musical + captación ──
// la cadena avanza 2π·f0 / (ω₁·sr) unidades de tiempo por muestra, en «sub» subpasos
export class Cuerda {
  constructor(sr, p = {}) {
    this.sr = sr;
    this.p = { N: 32, alfa: 0, beta: 1, gamma: 0, f0: 110, sonda: 0.21, sigma: 0.08, ganancia: 0.35, sub: 2, ...p };
    this.c = new Cadena(this.p.N, this.p);
    this.dc = { x: 0, y: 0, a: Math.exp(-2 * Math.PI * 10 / sr) };
    this.limitador = 0;
    this.pesos();
  }
  ponerParams(cambios) {
    Object.assign(this.p, cambios);
    Object.assign(this.c.p, { alfa: this.p.alfa, beta: this.p.beta, gamma: this.p.gamma });
    this.c.fuerzas(); this.pesos();
  }
  pesos() {
    const N = this.c.N, { sonda, sigma } = this.p;
    const w = Float64Array.from({ length: N }, (_, i) => Math.exp(-((((i + 1) / (N + 1) - sonda) / sigma) ** 2)));
    const s = w.reduce((a, b) => a + b, 0) || 1;
    this.w = w.map((x) => x / s);
  }
  dt() { return (2 * Math.PI * this.p.f0) / (this.c.w[0] * this.sr) / this.p.sub; }
  // gamma está en 1/s de tiempo musical: se convierte a unidades de la cadena
  procesar(out, n, desde = 0) {
    const c = this.c, dt = this.dt(), sub = this.p.sub;
    const gammaCadena = this.p.gamma / ((2 * Math.PI * this.p.f0) / c.w[0]);
    c.p.gamma = gammaCadena;
    for (let j = 0; j < n; j++) {
      for (let s = 0; s < sub; s++) c.paso(dt);
      let x = 0; for (let i = 0; i < c.N; i++) x += this.w[i] * c.v[i];
      const y = x - this.dc.x + this.dc.a * this.dc.y; this.dc.x = x; this.dc.y = y;
      let o = y * this.p.ganancia;
      if (!Number.isFinite(o)) { c.apagar(); o = 0; this.p.estallo = true; }
      if (Math.abs(o) > 0.9) { this.limitador++; o = Math.sign(o) * (0.9 + 0.1 * Math.tanh((Math.abs(o) - 0.9) / 0.1)); }
      out[desde + j] = o;
    }
    if (Math.abs(this.dc.y) < 1e-20) this.dc.y = 0;
  }
  // frecuencias lineales de los modos en Hz y su desviación respecto de k·f0
  frecuencias() { return Array.from(this.c.w, (w, k) => { const f = this.p.f0 * w / this.c.w[0]; return { k: k + 1, hz: f, cents: 1200 * Math.log2(f / ((k + 1) * this.p.f0)) }; }); }
}
