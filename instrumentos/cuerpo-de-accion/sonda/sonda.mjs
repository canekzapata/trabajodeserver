// Sonda: cuerda frotada (guía de ondas) + fricción tipo McIntyre–Schumacher–Woodhouse.
// Mide el régimen desde la señal: deslizamientos por periodo y periodicidad.
const P = 200;               // periodo de la cuerda en muestras (240 Hz a 48 kHz)
const Z = 1, MUS = 0.8, MUD = 0.3, V0 = 0.02;
const mu = (d) => MUD + (MUS - MUD) * V0 / (V0 + Math.abs(d));

function Linea(n) { this.b = new Float64Array(Math.max(1, n)); this.i = 0; }
Linea.prototype.paso = function (x) { const y = this.b[this.i]; this.b[this.i] = x; this.i = (this.i + 1) % this.b.length; return y; };

export function cuerda({ beta, F, vb, n = 24000, perdida = 0.995, Frampa = null }) {
  const nb = Math.round(beta * P / 2), nn = Math.round((1 - beta) * P / 2);
  const aPuente = new Linea(nb), dePuente = new Linea(nb), aCejilla = new Linea(nn), deCejilla = new Linea(nn);
  let lpP = 0, lpC = 0, pegado = true, delta = 0;
  const vbow = new Float64Array(n), salida = new Float64Array(n), desl = new Uint8Array(n);
  let wP = 0, wC = 0; // ondas que llegan al arco desde el puente y desde la cejilla
  for (let t = 0; t < n; t++) {
    const Ft = Frampa ? Frampa(t) : F;
    const vh = wP + wC;
    let v, f;
    const libre = vb - vh;
    if (pegado && Math.abs(2 * Z * libre) <= MUS * Ft) { v = vb; f = 2 * Z * (v - vh); delta = 0; }
    else {
      // rama deslizante: 2Z(vb − Δ − vh) = F μ(Δ) sgn(Δ), Δ del signo de vb − vh
      const s = Math.sign(libre) || 1, A = Math.abs(libre);
      const g = (d) => 2 * Z * (A - d) - Ft * mu(d);
      // raíces en (0, A]: se busca la más cercana a la anterior; al despegar, la más lejana (salto)
      const raices = []; let prev = g(1e-9), x0 = 1e-9; const pasos = 60;
      for (let k = 1; k <= pasos; k++) { const x1 = (A * k) / pasos, g1 = g(x1); if (prev * g1 <= 0) { let lo = x0, hi = x1; for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; if (g(lo) * g(m) <= 0) hi = m; else lo = m; } raices.push((lo + hi) / 2); } prev = g1; x0 = x1; }
      if (!raices.length) { v = vb; f = 2 * Z * (v - vh); pegado = true; delta = 0; }
      else {
        const d = pegado ? raices[raices.length - 1] : raices.reduce((a, r) => (Math.abs(r - Math.abs(delta)) < Math.abs(a - Math.abs(delta)) ? r : a));
        delta = s * d; v = vb - delta; f = 2 * Z * (v - vh); pegado = false;
        // vuelve a pegarse cuando la velocidad relativa cruza cero
        if (d < 1e-6) pegado = true;
      }
    }
    vbow[t] = v; desl[t] = pegado ? 0 : 1;
    const salePuente = wC + f / (2 * Z), saleCejilla = wP + f / (2 * Z);
    // reflexiones con pérdida: −1 y paso bajo de un polo
    const llegaPuente = aPuente.paso(salePuente); lpP = 0.5 * llegaPuente + 0.5 * lpP; salida[t] = llegaPuente;
    wP = dePuente.paso(-perdida * lpP);
    const llegaCej = aCejilla.paso(saleCejilla); lpC = 0.5 * llegaCej + 0.5 * lpC;
    wC = deCejilla.paso(-perdida * lpC);
  }
  return { vbow, salida, desl };
}

export function regimen(r, desde = 12000) {
  const { vbow, desl } = r, n = vbow.length;
  let m = 0; for (let t = desde; t < n; t++) m = Math.max(m, Math.abs(vbow[t]));
  // deslizamientos (subidas de desl) por periodo
  let ev = 0; for (let t = desde + 1; t < n; t++) if (desl[t] && !desl[t - 1]) ev++;
  const porPeriodo = ev / ((n - desde) / P);
  // periodicidad: correlación normalizada en el retardo (buscado cerca de P)
  const corr = (L) => { let a = 0, b = 0, c = 0; for (let t = desde; t + L < n; t++) { a += vbow[t] * vbow[t + L]; b += vbow[t] ** 2; c += vbow[t + L] ** 2; } return a / Math.sqrt(b * c + 1e-30); };
  let mejor = -1, Lm = P; for (let L = P - 12; L <= P + 12; L++) { const c = corr(L); if (c > mejor) { mejor = c; Lm = L; } }
  let nombre;
  if (porPeriodo < 0.05) nombre = 'pegado';
  else if (mejor < 0.9) nombre = 'aperiódico';
  else if (Math.abs(porPeriodo - 1) < 0.1) nombre = 'Helmholtz';
  else nombre = `${porPeriodo.toFixed(1)} desl./periodo`;
  return { nombre, porPeriodo, corr: mejor, periodo: Lm };
}
