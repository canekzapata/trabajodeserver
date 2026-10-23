// pruebas.mjs — pruebas que pueden fallar.  node pruebas.mjs
import { createHash } from 'node:crypto';
import { Hoja, Sampleador, nucleo, errorNucleo, pendiente, leerForma } from './motor.mjs';

let fallas = 0;
const ok = (c, nombre, det = '') => { console.log(`${c ? 'ok   ' : 'FALLA'}  ${nombre}${det ? '  · ' + det : ''}`); if (!c) fallas++; };
const correr = (h, seg) => { for (let i = 0; i < Math.round(seg * h.p.tasa); i++) h.paso(); };

// 1. El núcleo: la serie de Prony reproduce la integral continua; la pendiente es la de s^(−α) salvo el horizonte
{
  const A = [0.2, 0.4, 0.6, 0.8];
  const e = A.map((a) => errorNucleo(a));
  ok(e.every((x) => x < 0.03), 'núcleo: 16 exponenciales = integral continua con los mismos cortes', A.map((a, i) => `α=${a}: ${(e[i] * 100).toFixed(2)} %`).join(' · '));
  const pend = A.map((a) => [0.05, 2].map((s) => pendiente(a, s)));
  ok(pend.slice(1).every((p, i) => p.every((x) => Math.abs(x + A[i + 1]) < 0.08)), 'pendiente ≈ −α en [0,05; 2] s para α ≥ 0,4 (el horizonte la empina para α pequeño)',
    A.map((a, i) => `α=${a}: ${pend[i][0].toFixed(2)} a ${pend[i][1].toFixed(2)}`).join(' · '));
}

// 2. Los elementos de Maxwell calculan la misma integral que la convolución directa
{
  const h = new Hoja({ N: 4, g: 1, alfa: 0.5, c: 0 });
  const n = nucleo(0.5), dt = 1 / h.p.tasa, serie = [];
  for (let k = 0; k < 3 * h.p.tasa; k++) { h.u[0] = Math.sin(2 * Math.PI * 0.7 * k * dt) + 0.3 * Math.sin(2 * Math.PI * 3.1 * k * dt); serie.push(h.u[0]); h.paso(); }
  // convolución discreta con el mismo núcleo (más la memoria del estado inicial, que era 0 = u(0))
  let conv = 0; const T = serie.length;
  for (let k = 0; k < T; k++) { const s = (T - 1 - k) * dt; conv += serie[k] * n.th.reduce((a, t, j) => a + n.w[j] * (Math.exp(-s / t) - Math.exp(-(s + dt) / t)), 0); }
  const maxwell = n.w.reduce((a, w, j) => a + w * h.z[j][0], 0);
  ok(Math.abs(maxwell - conv) < 2e-3, 'Maxwell en paralelo = convolución con K', `${maxwell.toFixed(5)} contra ${conv.toFixed(5)}`);
}

// 3. Sin pérdida ni memoria, la energía de la cuerda se conserva
{
  const h = new Hoja({ gamma: 0, g: 0 }); h.pulsar(0.3, 0.4);
  const E0 = h.energia().total; let peor = 0;
  for (let i = 0; i < 10 * h.p.tasa; i++) { h.paso(); if (i % 100 === 0) peor = Math.max(peor, Math.abs(h.energia().total - E0) / E0); }
  ok(peor < 2e-3, 'γ = g = 0: energía conservada 10 s', `deriva ${peor.toExponential(2)}`);
}

// 4. La memoria disipa: con γ = 0, la energía total (cuerda + elementos) nunca sube, y baja
{
  const h = new Hoja({ gamma: 0, g: 3, alfa: 0.4 }); h.pulsar(0.3, 0.4);
  const E0 = h.energia().total; let prev = E0, sube = false;
  for (let i = 0; i < 10 * h.p.tasa; i++) { h.paso(); if (i % 50 === 0) { const e = h.energia().total; if (e > prev * (1 + 2e-4)) sube = true; prev = e; } }
  ok(!sube && prev < 0.97 * E0, 'memoria viscoelástica: disipa sin pérdida explícita', `E(10 s)/E(0) = ${(prev / E0).toFixed(3)}`);
}

// 5. Kirchhoff: con κ > 0 una cuerda más estirada vibra más rápido
{
  const periodo = (A, kappa) => {
    const h = new Hoja({ gamma: 0, kappa }); h.ponerForma((x) => A * Math.sin(Math.PI * x));
    let cruces = [], prev = h.u[31];
    for (let i = 0; i < 6 * h.p.tasa; i++) { h.paso(); const u = h.u[31]; if (prev < 0 && u >= 0) cruces.push(h.t); prev = u; }
    return (cruces[cruces.length - 1] - cruces[0]) / (cruces.length - 1);
  };
  const p0 = periodo(0.05, 0.5), p1 = periodo(0.4, 0.5), lin = periodo(0.4, 0);
  ok(p1 < p0 && Math.abs(lin - 1 / 0.8) / 1.25 < 0.01, 'Kirchhoff: más amplitud, periodo más corto; sin κ, f = c/2L', `periodo ${p0.toFixed(4)} s → ${p1.toFixed(4)} s; lineal ${lin.toFixed(4)} s`);
}

// 6. El cabezal: τ(1) − τ(0) = βL/c, y con β = 0 lee el cuadro de hace τ₀
{
  const s = new Sampleador(48000, { beta: 0.6, c: 1.6 });
  ok(Math.abs(s.tau(1) - s.tau(0) - 0.6 / 1.6) < 1e-12, 'corte oblicuo: Δτ entre extremos = βL/c', `${(s.tau(1) - s.tau(0)).toFixed(4)} s`);
  const h = new Hoja({ gamma: 0 }); h.pulsar(0.3, 0.4); correr(h, 1);
  const antes = Array.from({ length: 9 }, (_, i) => h.leer((i + 1) / 10, 0));
  correr(h, 0.5);
  const despues = Array.from({ length: 9 }, (_, i) => h.leer((i + 1) / 10, 0.5));
  ok(antes.every((a, i) => Math.abs(a - despues[i]) < 1e-6), 'historia: leer τ = 0,5 s devuelve la forma de hace 0,5 s');
}

// 7. Escaneo: un modo espacial par sin(2mπx) leído de 0 a 1 da un tono puro en m·f
{
  const forma = Float64Array.from({ length: 64 }, (_, i) => Math.sin(4 * Math.PI * (i + 1) / 65));
  const sr = 48000, f = 220, n = sr; const x = new Float64Array(n);
  let fase = 0; for (let j = 0; j < n; j++) { fase = (fase + f / sr) % 1; x[j] = leerForma(forma, fase); }
  const dft = (fr) => { let re = 0, im = 0; for (let j = 0; j < n; j++) { const a = 2 * Math.PI * fr * j / sr; re += x[j] * Math.cos(a); im -= x[j] * Math.sin(a); } return Math.hypot(re, im) / n; };
  const fund = dft(2 * f), resto = [f, 3 * f, 4 * f, 6 * f].map(dft);
  ok(fund > 0.45 && resto.every((r) => r < 0.01 * fund), 'modo espacial sin(4πx) → tono puro en 2f', `2f: ${fund.toFixed(3)}; f, 3f, 4f, 6f: ${resto.map((r) => r.toExponential(1)).join(' ')}`);
}

// 8. Reproducible
{
  const h = [0, 1].map(() => { const s = new Sampleador(48000, { f: 110 }); s.h.pulsar(0.3, 0.4); s.gate = 1; const o = new Float32Array(48000); s.procesar(o, o.length); return createHash('sha256').update(Buffer.from(o.buffer)).digest('hex'); });
  ok(h[0] === h[1], 'sonido reproducible', h[0].slice(0, 12));
}

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\ntodas las pruebas pasaron');
process.exit(fallas ? 1 : 0);
