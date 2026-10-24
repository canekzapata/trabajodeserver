// motor.mjs — Cuerpo de acción. Lo que se toca es la acción: dónde, cuánta fuerza, qué velocidad, con qué.
// La técnica no se elige: sale del contacto, y el instrumento mide qué régimen produjo.
//
// El cuerpo es una sola línea s ∈ [0, 1] con cinco comarcas, cada una un resonador distinto:
//   anclaje estriado (rígido, con crestas) · cuerda (guía de ondas) · puente (pocos modos secos)
//   · placa (modos dispersivos, f_k ∝ k²) · cavidad (modos anchos y amortiguados)
// El acople entre comarcas va en un solo sentido: cuerda → puente → placa → cavidad (declarado: el cuerpo no
// devuelve energía a la cuerda). Lo que suena es la radiación del puente, la placa, la cavidad y el anclaje.
//
// El contacto (McIntyre–Schumacher–Woodhouse con cerdas LuGre): en el punto de contacto el cuerpo tiene una
// velocidad libre v_h y una admitancia instantánea Y (v = v_h + Y·f). La fricción tiene estado: la deflexión z de
// las cerdas. f = F·(σ0·z + σ1·ż), con ż = Δv − σ0|Δv|z/g(Δv) y g la curva de Stribeck del material.
// En régimen deslizante estacionario f = F·g(Δv); al pegarse, las cerdas se tensan sin saltar de rama.
// Unidades: tiempo en muestras; velocidades en unidades de onda por muestra (como en la sonda).

export const VERSION = 'cuerpo-de-accion-0.1.0';

export const COMARCAS = [
  { nombre: 'anclaje', desde: 0.0, hasta: 0.12 },
  { nombre: 'cuerda', desde: 0.12, hasta: 0.62 },
  { nombre: 'puente', desde: 0.62, hasta: 0.7 },
  { nombre: 'placa', desde: 0.7, hasta: 0.88 },
  { nombre: 'cavidad', desde: 0.88, hasta: 1.0 },
];
export const comarca = (s) => COMARCAS.find((c) => s < c.hasta) || COMARCAS[4];

export const MATERIALES = {
  crin: { mus: 0.8, mud: 0.3, vs: 0.02, s0: 60, s1: 0.6 },
  madera: { mus: 0.5, mud: 0.38, vs: 0.03, s0: 120, s1: 0.4 },
  yema: { mus: 0.9, mud: 0.6, vs: 0.05, s0: 15, s1: 2.5 },
  una: { mus: 0.45, mud: 0.3, vs: 0.01, s0: 200, s1: 0.2 },
};

// banco modal: ω en rad/muestra, amortiguamiento por muestra, masa modal; φ_k(ξ) = sen(kπξ)
class Modal {
  constructor(sr, frecs, q, masa, pesoRad) {
    this.w = frecs.map((f) => (2 * Math.PI * f) / sr);
    this.d = frecs.map((f, k) => Math.exp(-(Math.PI * f) / (q[k] || q[0]) / sr));
    this.M = masa; this.q = new Float64Array(frecs.length); this.v = new Float64Array(frecs.length);
    this.rad = pesoRad;
  }
  phi(k, xi) { return Math.sin((k + 1) * Math.PI * Math.min(0.98, Math.max(0.02, xi))); }
  // velocidad libre en ξ tras el paso sin fuerza, y admitancia instantánea en ξ
  libre(xi) { let v = 0, Y = 0; for (let k = 0; k < this.w.length; k++) { const p = this.phi(k, xi); v += p * (this.v[k] * this.d[k] - this.w[k] ** 2 * this.q[k]); Y += (p * p) / this.M; } return { v, Y }; }
  paso(f = 0, xi = 0.5, fExt = 0, xiExt = 0.3) {
    let r = 0;
    for (let k = 0; k < this.w.length; k++) {
      const fk = f * this.phi(k, xi) + fExt * this.phi(k, xiExt);
      this.v[k] = this.v[k] * this.d[k] - this.w[k] ** 2 * this.q[k] + fk / this.M;
      this.q[k] += this.v[k];
      r += this.v[k] / (k + 1) ** 0.5;
    }
    return r * this.rad;
  }
  velocidadEn(xi) { let v = 0; for (let k = 0; k < this.w.length; k++) v += this.phi(k, xi) * this.v[k]; return v; }
}

class Linea { constructor(n) { this.b = new Float64Array(Math.max(1, n)); this.i = 0; } paso(x) { const y = this.b[this.i]; this.b[this.i] = x; this.i = (this.i + 1) % this.b.length; return y; } }

export class Cuerpo {
  constructor(sr, p = {}) {
    this.sr = sr;
    this.p = { f0: 110, perdida: 0.996, crestasHz: 2000, ganancia: 0.12, acoples: [0.08, 3, 0.15], ...p };
    this.P = Math.round(sr / this.p.f0) - 4; // retardo extra medido de las reflexiones con paso bajo: ~4 muestras por periodo
    this.Z = 1;
    this.cuerda = null; this.armarCuerda(0.2);
    // comarcas resonantes (frecuencias en Hz). El último número es cuánto radia cada una: se ajustó para que el
    // mismo gesto (F = 1, v = 0,1) dé niveles comparables en todas; es mezcla declarada, no medición acústica
    this.anclaje = new Modal(sr, [1830, 2710, 4120], [40], 60, 9);
    this.puente = new Modal(sr, [2380, 3150, 5200], [25], 25, 5);
    this.placa = new Modal(sr, Array.from({ length: 16 }, (_, k) => 92 * (k + 1) ** 2).filter((f) => f < 15000), [30], 40, 0.04);
    this.cavidad = new Modal(sr, [118, 236, 410, 655, 980, 1450], [6], 10, 1.8);
    // la mano
    this.mano = { s: 0.4, F: 0, v: 0, material: 'crin' };
    this.z = 0; this.dv = 0; this.xb = 0; // cerdas, velocidad relativa, recorrido del arco (para las crestas)
    this.pegado = true; this.deslizar = 0;
    this.dc = { x: 0, y: 0, a: Math.exp((-2 * Math.PI * 20) / sr) };
    this.vContacto = 0; this.fContacto = 0;
  }

  // la cuerda: guía de ondas partida en el punto de contacto β (distancia al puente, en fracción de la cuerda)
  armarCuerda(beta) {
    const P = this.P, nb = Math.max(1, Math.round((beta * P) / 2)), nn = Math.max(1, Math.round(((1 - beta) * P) / 2));
    const viejo = this.cuerda;
    this.cuerda = { beta, nb, nn, aP: new Linea(nb), deP: new Linea(nb), aC: new Linea(nn), deC: new Linea(nn), lpP: 0, lpC: 0, wP: 0, wC: 0 };
    if (viejo) { this.cuerda.lpP = viejo.lpP; this.cuerda.lpC = viejo.lpC; } // mover el arco reinicia la partición de la cuerda (declarado)
  }
  beta(s) { const c = COMARCAS[1]; return Math.min(0.96, Math.max(0.03, (c.hasta - s) / (c.hasta - c.desde))); }

  ponerMano(m) {
    const antes = comarca(this.mano.s).nombre;
    Object.assign(this.mano, m);
    if (comarca(this.mano.s).nombre === 'cuerda') {
      const b = this.beta(this.mano.s), nb = Math.max(1, Math.round((b * this.P) / 2));
      if (antes !== 'cuerda' || nb !== this.cuerda.nb) this.trasladarArco(b);
    }
  }
  // mover el punto de contacto sobre la cuerda conservando la onda: se rehacen las líneas con el contenido actual
  trasladarArco(beta) {
    const c = this.cuerda, P = this.P;
    // reconstruir la onda que viaja hacia el puente y hacia la cejilla como un solo anillo de 2·(nb+nn) muestras
    const ida = [], vuelta = [];
    for (let i = 0; i < c.nb; i++) { ida.push(c.aP.b[(c.aP.i + i) % c.aP.b.length]); vuelta.push(c.deP.b[(c.deP.i + i) % c.deP.b.length]); }
    const idaC = [], vueltaC = [];
    for (let i = 0; i < c.nn; i++) { idaC.push(c.aC.b[(c.aC.i + i) % c.aC.b.length]); vueltaC.push(c.deC.b[(c.deC.i + i) % c.deC.b.length]); }
    this.armarCuerda(beta);
    const n = this.cuerda;
    // reparto aproximado: se conservan las muestras más recientes de cada tramo (la forma cerca del arco)
    const llenar = (lin, arr) => { const L = lin.b.length; for (let i = 0; i < L; i++) lin.b[i] = arr[Math.floor((i * arr.length) / L)] || 0; lin.i = 0; };
    llenar(n.aP, ida); llenar(n.deP, vuelta); llenar(n.aC, idaC); llenar(n.deC, vueltaC);
    n.wP = c.wP; n.wC = c.wC;
  }

  g(dv) { const m = MATERIALES[this.mano.material]; return m.mud + ((m.mus - m.mud) * m.vs) / (m.vs + Math.abs(dv)); } // curva hiperbólica (la de la sonda)

  // resuelve el contacto: dada la velocidad libre vh y la admitancia Y, devuelve la fuerza de fricción
  contacto(vh, Y, Fn) {
    const m = MATERIALES[this.mano.material], vb = this.mano.v, z0 = this.z;
    if (Fn <= 1e-9) { this.z = z0 * 0.5; this.pegado = true; return 0; }
    const fz = (dv) => { const z1 = (z0 + dv) / (1 + (m.s0 * Math.abs(dv)) / this.g(dv)); return { z1, f: Fn * (m.s0 * z1 + m.s1 * (z1 - z0)) }; };
    const h = (dv) => vb - dv - vh - Y * fz(dv).f; // cero cuando la velocidad del cuerpo es consistente
    // raíces en un intervalo amplio; se elige la más cercana a la velocidad relativa anterior (continuidad)
    const B = Math.abs(vb - vh) + 0.5 * Fn * Y * m.mus + 0.05, N = 32;
    const raices = []; let x0 = -B, h0 = h(x0);
    for (let k = 1; k <= N; k++) {
      const x1 = -B + (2 * B * k) / N, h1 = h(x1);
      if (h0 === 0) raices.push(x0);
      else if (h0 * h1 < 0) { let lo = x0, hi = x1, hl = h0; for (let it = 0; it < 30; it++) { const mm = 0.5 * (lo + hi), hm = h(mm); if (hl * hm <= 0) hi = mm; else { lo = mm; hl = hm; } } raices.push(0.5 * (lo + hi)); }
      x0 = x1; h0 = h1;
    }
    const dv = raices.length ? raices.reduce((a, r) => (Math.abs(r - this.dv) < Math.abs(a - this.dv) ? r : a)) : vb - vh;
    const { z1, f } = fz(dv);
    this.z = z1; this.dv = dv;
    const pegadoAhora = Math.abs(dv) < 0.3 * m.vs;
    if (this.pegado && !pegadoAhora) this.deslizar++;
    this.pegado = pegadoAhora;
    return f;
  }

  muestra() {
    const mano = this.mano, com = comarca(mano.s).nombre, c = this.cuerda;
    // crestas: el anclaje modula la fuerza normal con el recorrido del arco. La mano cruza crestasHz·|v| crestas
    // por segundo (con v = 0,1 → 200 por segundo: unas crestas de 0,5 mm a 10 cm/s)
    this.xb += (Math.abs(mano.v) * this.p.crestasHz) / this.sr;
    let Fn = mano.F;
    if (com === 'anclaje' && Fn > 0) { const fase = this.xb % 1; const u = ((fase < 0 ? fase + 1 : fase) - 0.5) / 0.08; Fn *= 0.25 + 2.2 * Math.exp(-(u * u)); }
    let fC = 0, salidaPuente;
    // ── cuerda ──
    const vhC = c.wP + c.wC;
    if (com === 'cuerda') fC = this.contacto(vhC, 1 / (2 * this.Z), Fn);
    const salePuente = c.wC + fC / (2 * this.Z), saleCej = c.wP + fC / (2 * this.Z);
    const llegaPuente = c.aP.paso(salePuente); c.lpP = 0.5 * llegaPuente + 0.5 * c.lpP;
    c.wP = c.deP.paso(-this.p.perdida * c.lpP);
    const llegaCej = c.aC.paso(saleCej); c.lpC = 0.5 * llegaCej + 0.5 * c.lpC;
    c.wC = c.deC.paso(-this.p.perdida * c.lpC);
    if (com === 'cuerda') { this.vContacto = vhC + fC / (2 * this.Z); this.fContacto = fC; }
    // ── comarcas resonantes ──
    const tocar = (nombre, banco) => {
      if (com !== nombre) return [0, 0.5];
      const co = comarca(mano.s), xi = (mano.s - co.desde) / (co.hasta - co.desde);
      const { v, Y } = banco.libre(xi);
      const f = this.contacto(v, Y, Fn);
      this.vContacto = v + Y * f; this.fContacto = f;
      return [f, xi];
    };
    const [fA, xA] = tocar('anclaje', this.anclaje);
    const rA = this.anclaje.paso(fA, xA);
    const [fB, xB] = tocar('puente', this.puente);
    const rB = this.puente.paso(fB, xB, 2 * this.Z * llegaPuente * this.p.acoples[0], 0.4); // la cuerda empuja el puente
    const [fP, xP] = tocar('placa', this.placa);
    const rP = this.placa.paso(fP, xP, this.puente.velocidadEn(0.4) * this.p.acoples[1], 0.37); // el puente empuja la placa
    const [fV, xV] = tocar('cavidad', this.cavidad);
    const rV = this.cavidad.paso(fV, xV, this.placa.velocidadEn(0.5) * this.p.acoples[2], 0.5); // la placa empuja el aire
    if (Fn <= 1e-9 && mano.F <= 1e-9) { this.vContacto = 0; this.fContacto = 0; }
    // lo que se oye: la fuerza de la cuerda sobre el puente (como un micrófono de puente) más la radiación del cuerpo
    salidaPuente = 4 * llegaPuente + rA + rB + rP + rV;
    const y = salidaPuente - this.dc.x + this.dc.a * this.dc.y; this.dc.x = salidaPuente; this.dc.y = y;
    let o = y * this.p.ganancia;
    if (!Number.isFinite(o)) { this.apagar(); o = 0; }
    return Math.max(-1, Math.min(1, Math.abs(o) > 0.9 ? Math.sign(o) * (0.9 + 0.1 * Math.tanh((Math.abs(o) - 0.9) / 0.1)) : o));
  }

  apagar() {
    for (const b of [this.anclaje, this.puente, this.placa, this.cavidad]) { b.q.fill(0); b.v.fill(0); }
    this.armarCuerda(this.cuerda.beta); this.cuerda.lpP = 0; this.cuerda.lpC = 0;
    this.z = 0; this.dv = 0; this.xb = 0; this.pegado = true; this.dc.x = 0; this.dc.y = 0; this.vContacto = 0; this.fContacto = 0;
  }
}

// ── medir lo que la acción produjo (sobre una ventana de la velocidad de contacto y de la salida) ──
export function medir(vc, out, sr, P, desl, ventana) {
  const n = vc.length;
  let e = 0, eo = 0; for (let i = 0; i < n; i++) { e += vc[i] * vc[i]; eo += out[i] * out[i]; }
  const rms = Math.sqrt(eo / n);
  const corr = (x, L) => { let a = 0, b = 0, c = 0; for (let i = 0; i + L < x.length; i++) { a += x[i] * x[i + L]; b += x[i] * x[i]; c += x[i + L] * x[i + L]; } return a / Math.sqrt(b * c + 1e-30); };
  // periodo dominante de la salida entre 40 Hz y 2 kHz
  let mejor = -1, Lm = 0;
  for (let L = Math.floor(sr / 2000); L <= Math.min(n / 2, Math.ceil(sr / 40)); L++) { const c = corr(out, L); if (c > mejor) { mejor = c; Lm = L; } }
  // refinamiento parabólico del periodo
  let Lf = Lm; if (Lm > 1) { const a = corr(out, Lm - 1), b = mejor, c = corr(out, Lm + 1), den = a - 2 * b + c; const d = den < 0 ? (0.5 * (a - c)) / den : 0; if (Math.abs(d) < 1) Lf = Lm + d; }
  // centroide espectral de la salida (brillo), con una DFT gruesa
  let num = 0, dentot = 0; const M = 64;
  for (let k = 1; k < M; k++) { const f = (k * sr) / (2 * M) * 0.5; let re = 0, im = 0; for (let i = 0; i < n; i += 2) { const a = (2 * Math.PI * f * i) / sr; re += out[i] * Math.cos(a); im -= out[i] * Math.sin(a); } const m = Math.hypot(re, im); num += f * m; dentot += m; }
  const periodos = n / P, porPeriodo = desl / periodos;
  const cP = corr(vc, P), quieto = Math.sqrt(e / n) < 1e-5;
  let regimen;
  if (quieto) regimen = 'quieto';
  else if (porPeriodo < 0.05 && rms < 1e-4) regimen = 'pegado';
  else if (mejor < 0.9) regimen = 'aperiódico';
  else regimen = 'periódico';
  return { rms, periodo: Lf, hz: Lf ? sr / Lf : 0, periodicidad: mejor, centroide: dentot ? num / dentot : 0, porPeriodo, corrCuerda: cP, regimen };
}

// ── partituras de acción: puntos [t, {s, F, v, material}] interpolados linealmente (el material cambia en el punto) ──
// modo 'escalones' (tomas grabadas en vivo): cada punto vale desde su muestra n hasta el siguiente, sin interpolar,
// para que la toma se vuelva a calcular muestra por muestra igual que sonó
export function manoEn(partitura, t, sr = 48000) {
  const pts = partitura.puntos;
  if (partitura.modo === 'escalones') {
    const n = Math.round(t * sr); let m = pts[0][1];
    for (const [ni, mi] of pts) { if (ni <= n) m = mi; else break; }
    return { ...m };
  }
  if (t <= pts[0][0]) return { ...pts[0][1] };
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, a] = pts[i - 1], [t1, b] = pts[i], u = (t - t0) / (t1 - t0);
      const curva = b.curva === 'exp' && a.F > 0 && b.F > 0 ? (x, y) => x * (y / x) ** u : (x, y) => x + (y - x) * u;
      return { s: a.s + (b.s - a.s) * u, F: curva(a.F, b.F), v: a.v + (b.v - a.v) * u, material: a.material || 'crin' };
    }
  }
  return { ...pts[pts.length - 1][1] };
}
