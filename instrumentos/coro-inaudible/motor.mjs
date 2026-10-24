// motor.mjs — el coro inaudible. Seis resonadores en un tubo abierto, con retardos reales entre ellos.
//
//   da_j/dt = −i(Ω a)_j − (γ/2 + γi/2) a_j − (γ/2) Σ_{l≠j} a_l(t − |p_j − p_l|) − √(γ/2) s_entra(t − p_j)
// Las dos bocas dan a la sala por lados opuestos: izquierda y derecha son dos canales. (Sumarlas
// en mono cancelaría exactamente todo lo antisimétrico mientras el coro sea simétrico.)
//   sale_izq = √(γ/2) Σ a_l(t − p_l)      sale_der = √(γ/2) Σ a_l(t − (L − p_l)) + s_entra(t − L)
//
// a_j son amplitudes complejas de frecuencia positiva (modos acoplados). Ω es una cadena simétrica
// de acoples entre vecinos. p_j son las posiciones medidas en tiempo de viaje (s). Cuando la
// distancia entre vecinos es un periodo entero de una nota (Bragg), las notas antisimétricas no
// radian: quedan guardadas. No hay aproximación de Markov: el tubo es una línea de retardo.
export const VERSION = 'coro-inaudible-0.1.0';
export const N = 6;
export const C_AIRE = 343;
const TAU = 2 * Math.PI;

// ---------- diseño del acorde: el problema inverso de la cadena ----------
// Bloque antisimétrico (u1,u2,u3,−u3,−u2,−u1): [[0,c1,0],[c1,0,c2],[0,c2,−c3]] (en Hz, relativo al eje).
// Sus valores propios son las notas guardadas: c3 = −e1, c1² = −e3/e1, c2² = −e2 − c1².
export function disenar({ base = 22, armonicos = [10, 12, 15], eje = null } = {}) {
  const guardadas = armonicos.map((n) => n * base);
  const prueba = (f0) => {
    const l = guardadas.map((f) => f - f0);
    const e1 = l[0] + l[1] + l[2], e2 = l[0] * l[1] + l[0] * l[2] + l[1] * l[2], e3 = l[0] * l[1] * l[2];
    if (Math.abs(e1) < 1e-9) return null;
    const c3 = -e1, c1q = -e3 / e1, c2q = -e2 - c1q;
    if (c1q < 9 || c2q < 9) return null; // acoples de al menos 3 Hz: si no, la cadena casi se parte
    return { f0, c1: Math.sqrt(c1q), c2: Math.sqrt(c2q), c3 };
  };
  const ejes = [];
  const lo = Math.min(...guardadas) - base, hi = Math.max(...guardadas) + base;
  for (let k = Math.ceil((2 * lo) / base); k * base / 2 <= hi; k++) { const r = prueba((k * base) / 2); if (r) ejes.push(r.f0); }
  const f0 = eje ?? (ejes.length ? ejes[Math.floor(ejes.length / 2)] : null);
  const r = f0 == null ? null : prueba(f0);
  if (!r) return { factible: false, base, armonicos, guardadas, ejes };
  const acoples = [r.c1, r.c2, r.c3, r.c2, r.c1];
  return { factible: true, base, armonicos, guardadas, ejes, f0, acoples, espejo: guardadas.map((f) => 2 * f0 - f).reverse() };
}

// ---------- valores propios de una matriz real simétrica (Jacobi cíclico) ----------
export function eigSim(A0, n = N) {
  const A = Float64Array.from(A0), V = new Float64Array(n * n);
  for (let i = 0; i < n; i++) V[i * n + i] = 1;
  for (let barrido = 0; barrido < 60; barrido++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p * n + q] ** 2;
    if (off < 1e-22) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const apq = A[p * n + q]; if (Math.abs(apq) < 1e-300) continue;
      const th = (A[q * n + q] - A[p * n + p]) / (2 * apq);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k * n + p], akq = A[k * n + q]; A[k * n + p] = c * akp - s * akq; A[k * n + q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p * n + k], aqk = A[q * n + k]; A[p * n + k] = c * apk - s * aqk; A[q * n + k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = V[k * n + p], vkq = V[k * n + q]; V[k * n + p] = c * vkp - s * vkq; V[k * n + q] = s * vkp + c * vkq; }
    }
  }
  const orden = [...Array(n).keys()].sort((x, y) => A[x * n + x] - A[y * n + y]);
  return { valores: orden.map((k) => A[k * n + k]), vectores: orden.map((k) => Array.from({ length: n }, (_, j) => V[j * n + k])) };
}

// Los modos de la cadena, en orden de frecuencia; oscuro = antisimétrico (v_j = −v_{N−1−j}).
export function modos(diseno) {
  const O = new Float64Array(N * N);
  for (let j = 0; j < N; j++) O[j * N + j] = diseno.f0;
  diseno.acoples.forEach((c, j) => { O[j * N + j + 1] = c; O[(j + 1) * N + j] = c; });
  const { valores, vectores } = eigSim(O);
  return valores.map((f, m) => {
    const v = vectores[m]; let anti = 0; for (let j = 0; j < N; j++) anti += (v[j] + v[N - 1 - j]) ** 2;
    return { f, v, oscuro: anti < 1e-12 };
  });
}

// La regla de oro: cuánto radia cada modo con las posiciones dadas (s), sin retardos de reacción.
//   Γ_m = (γ/2)(|Σ v_j e^{iω p_j}|² + |Σ v_j e^{−iω p_j}|²)
export function fugas(lista, posiciones, gamma) {
  return lista.map(({ f, v }) => {
    let a = 0, b = 0, w = TAU * f;
    for (let j = 0; j < N; j++) { a += v[j] * Math.cos(w * posiciones[j]); b += v[j] * Math.sin(w * posiciones[j]); }
    return gamma * (a * a + b * b); // las dos bocas dan lo mismo: |S+| = |S−| con v real
  });
}

const HIST = 1 << 15, MASK = HIST - 1;

export class Coro {
  constructor(sr = 48000, diseno = disenar(), { gamma = 3, gammaInterna = 1 / 40, suavizado = 0.04 } = {}) {
    this.sr = sr; this.gamma = gamma; this.gi = gammaInterna;
    this.re = new Float64Array(N); this.im = new Float64Array(N);
    this.hr = Array.from({ length: N }, () => new Float64Array(HIST));
    this.hi = Array.from({ length: N }, () => new Float64Array(HIST));
    this.n = 0;
    this.s = 1; this.sObj = 1;                       // separación global (1 = Bragg)
    this.o = new Float64Array(N); this.oObj = new Float64Array(N); // desplazamientos (s de viaje)
    this.ks = 1 - Math.exp(-1 / (suavizado * sr));
    this.pulsos = [];                                // llegan por la boca izquierda
    this.p = new Float64Array(N);
    this.ur = new Float64Array(N); this.ui = new Float64Array(N);
    this.afinar(diseno);
  }
  afinar(diseno) {
    if (!diseno.factible) throw new Error('acorde no factible');
    this.diseno = diseno; this.T = 1 / diseno.base; this.modos = modos(diseno);
    const g = (this.gamma + this.gi) / 2, dt = 1 / this.sr;
    this.Pr = new Float64Array(N * N); this.Pi = new Float64Array(N * N); this.Qr = new Float64Array(N * N); this.Qi = new Float64Array(N * N);
    for (const { f, v } of this.modos) {
      const w = TAU * f, eg = Math.exp(-g * dt);
      const er = eg * Math.cos(w * dt), ei = -eg * Math.sin(w * dt);          // e^{μ dt}, μ = −g − iω
      const nr = er - 1, ni = ei, mr = -g, mi = -w, d = mr * mr + mi * mi;   // (e^{μdt} − 1)/μ
      const qr = (nr * mr + ni * mi) / d, qi = (ni * mr - nr * mi) / d;
      for (let j = 0; j < N; j++) for (let l = 0; l < N; l++) {
        const vv = v[j] * v[l], k = j * N + l;
        this.Pr[k] += vv * er; this.Pi[k] += vv * ei; this.Qr[k] += vv * qr; this.Qi[k] += vv * qi;
      }
    }
  }
  largo() { return N * this.s * this.T; }
  posiciones(s = this.s, o = this.o) { const p = []; for (let j = 0; j < N; j++) p.push(s * (j + 0.5) * this.T + o[j]); return p; }
  // gestos
  golpear(j, amp = 1, fase = 0) { this.re[j] += amp * Math.cos(fase); this.im[j] += amp * Math.sin(fase); }
  mover(j, cm) { this.oObj[j] = cm / 100 / C_AIRE; }
  separar(s) { this.sObj = s; }
  cerrar() { this.sObj = 1; this.oObj.fill(0); }
  fijar(o = new Float64Array(N), s = 1) { this.o.set(o); this.oObj.set(o); this.s = this.sObj = s; } // sin deslizar (pruebas)
  pulso(amp = 1, ms = 3) { this.pulsos.push({ n0: this.n, amp, w: ms / 1000 }); }
  // prepara un modo como si llevara sonando desde siempre (pasado incluido)
  preparar(m, amp = 1) {
    const { f, v } = this.modos[m], w = TAU * f;
    for (let k = 0; k < HIST; k++) {
      const t = (this.n - k) / this.sr, c = Math.cos(w * t), s = -Math.sin(w * t), i = (this.n - k) & MASK;
      for (let j = 0; j < N; j++) { this.hr[j][i] = amp * v[j] * c; this.hi[j][i] = amp * v[j] * s; }
    }
    for (let j = 0; j < N; j++) { this.re[j] = this.hr[j][this.n & MASK]; this.im[j] = this.hi[j][this.n & MASK]; }
  }
  apagar() { this.re.fill(0); this.im.fill(0); for (const h of [...this.hr, ...this.hi]) h.fill(0); this.pulsos = []; }
  // historia interpolada (Lagrange cúbica) en el instante n − atras (en muestras)
  leer(j, x, out) {
    const i = Math.floor(x), f = x - i, hr = this.hr[j], hi = this.hi[j];
    const c0 = -f * (f - 1) * (f - 2) / 6, c1 = (f + 1) * (f - 1) * (f - 2) / 2, c2 = -(f + 1) * f * (f - 2) / 2, c3 = (f + 1) * f * (f - 1) / 6;
    const a = (i - 1) & MASK, b = i & MASK, c = (i + 1) & MASK, d = (i + 2) & MASK;
    out[0] = c0 * hr[a] + c1 * hr[b] + c2 * hr[c] + c3 * hr[d];
    out[1] = c0 * hi[a] + c1 * hi[b] + c2 * hi[c] + c3 * hi[d];
  }
  pulsoEn(t) { // el campo que entra por la izquierda, en la boca, al tiempo t (s desde n = 0)
    let x = 0;
    for (const q of this.pulsos) { const u = (t - q.n0 / this.sr) / q.w; if (u > 0 && u < 1) x += q.amp * 0.5 * (1 - Math.cos(TAU * u)); }
    return x;
  }
  muestra(cerca = -1) {
    const sr = this.sr, n = this.n, g2 = this.gamma / 2, rg = Math.sqrt(g2), tmp = [0, 0];
    this.s += (this.sObj - this.s) * this.ks;
    for (let j = 0; j < N; j++) this.o[j] += (this.oObj[j] - this.o[j]) * this.ks;
    const p = this.p; for (let j = 0; j < N; j++) p[j] = this.s * (j + 0.5) * this.T + this.o[j];
    for (let j = 0; j < N; j++) { this.hr[j][n & MASK] = this.re[j]; this.hi[j][n & MASK] = this.im[j]; }
    // lo que llega a cada cantor desde los demás, a mitad de paso
    const t = (n + 0.5) / sr, ur = this.ur, ui = this.ui;
    for (let j = 0; j < N; j++) {
      let sr_ = 0, si = 0;
      for (let l = 0; l < N; l++) { if (l === j) continue; this.leer(l, n + 0.5 - Math.abs(p[j] - p[l]) * sr, tmp); sr_ += tmp[0]; si += tmp[1]; }
      ur[j] = -g2 * sr_; ui[j] = -g2 * si;
      if (this.pulsos.length) ur[j] -= rg * this.pulsoEn(t - p[j]);
    }
    const re = this.re, im = this.im, nr = new Float64Array(N), ni = new Float64Array(N);
    for (let j = 0; j < N; j++) {
      let xr = 0, xi = 0;
      for (let l = 0; l < N; l++) {
        const k = j * N + l, Pr = this.Pr[k], Pi = this.Pi[k], Qr = this.Qr[k], Qi = this.Qi[k];
        xr += Pr * re[l] - Pi * im[l] + Qr * ur[l] - Qi * ui[l];
        xi += Pr * im[l] + Pi * re[l] + Qr * ui[l] + Qi * ur[l];
      }
      nr[j] = xr; ni[j] = xi;
    }
    // lo que sale por las dos bocas hacia la sala, en el instante n
    const L = N * this.s * this.T; let izq = 0, der = 0;
    for (let l = 0; l < N; l++) {
      this.leer(l, n - p[l] * sr, tmp); izq += tmp[0];
      this.leer(l, n - (L - p[l]) * sr, tmp); der += tmp[0];
    }
    izq *= rg; der *= rg;
    if (this.pulsos.length) {
      der += this.pulsoEn(n / sr - L);
      if (n - this.pulsos[0].n0 > (L + 0.1) * sr) this.pulsos.shift();
    }
    this.re.set(nr); this.im.set(ni); this.n++;
    return { izq, der, cerca: cerca >= 0 ? this.re[cerca] : 0 };
  }
  energia() { let e = 0; for (let j = 0; j < N; j++) e += this.re[j] ** 2 + this.im[j] ** 2; return e; }
  enModos() {
    return this.modos.map(({ v }) => { let r = 0, i = 0; for (let j = 0; j < N; j++) { r += v[j] * this.re[j]; i += v[j] * this.im[j]; } return r * r + i * i; });
  }
  guardada() { return this.enModos().reduce((s, e, m) => s + (this.modos[m].oscuro ? e : 0), 0); }
}
