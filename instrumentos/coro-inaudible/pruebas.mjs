// pruebas.mjs — afirmaciones del coro inaudible que pueden fallar.  node pruebas.mjs
import { createHash } from 'node:crypto';
import { disenar, modos, Coro, fugas, N } from './motor.mjs';

const SR = 48000;
let fallos = 0;
const prueba = (nombre, ok, detalle) => { console.log(`${ok ? 'pasa ' : 'FALLA'}  ${nombre}\n       ${detalle}`); if (!ok) fallos++; };
const D = disenar();
const cents = (a, b) => 1200 * Math.log2(a / b);
const correr = (c, seg, cada) => { for (let i = 0; i < Math.round(seg * SR); i++) { const o = c.muestra(); if (cada) cada(i, o); } };
const pendiente = (t, y) => { const n = t.length, mt = t.reduce((a, b) => a + b) / n, my = y.reduce((a, b) => a + b) / n; let a = 0, b = 0; for (let k = 0; k < n; k++) { a += (t[k] - mt) * (y[k] - my); b += (t[k] - mt) ** 2; } return a / b; };
const tasa = (m, o, s = 1) => {
  const c = new Coro(SR, D, { gammaInterna: 0 }); c.fijar(o, s); c.preparar(m); const t = [], y = [];
  correr(c, 4, (i) => { if (i % 4800 === 0 && i >= SR * 0.6) { t.push(i / SR); y.push(Math.log(c.enModos()[m])); } });
  return -pendiente(t, y);
};
const oscuros = modos(D).map((x, m) => (x.oscuro ? m : -1)).filter((m) => m >= 0);

// 1. el diseño: las notas guardadas son las pedidas
{
  const ms = modos(D), g = ms.filter((x) => x.oscuro).map((x) => x.f), e = ms.filter((x) => !x.oscuro).map((x) => x.f);
  const err = Math.max(...g.map((f, k) => Math.abs(cents(f, D.guardadas[k]))));
  prueba('el problema inverso da la cadena cuyas notas antisimétricas son el acorde pedido', err < 1 && ms.filter((x) => x.oscuro).length === 3,
    `pedidas ${D.guardadas.join(' · ')} Hz → guardadas ${g.map((f) => f.toFixed(4)).join(' · ')} (error máx. ${err.toExponential(1)} cents); acoples ${D.acoples.map((c) => c.toFixed(2)).join(', ')} Hz; espejo ${e.map((f) => f.toFixed(2)).join(' · ')}`);
}
// 2. en Bragg, las guardadas no radian (con el tubo de retardo, no solo en Markov)
{
  const r = oscuros.map((m) => tasa(m, new Float64Array(N)));
  const rf = fugas(modos(D), new Coro(SR, D).posiciones(), 3);
  prueba('en Bragg, las tres notas antisimétricas no radian', Math.max(...r) < 1e-3,
    `tasa medida ${r.map((x) => x.toExponential(1)).join(' / ')} 1/s (residuo de la interpolación); regla de oro ${oscuros.map((m) => rf[m].toExponential(0)).join(' / ')}; los otros tres: ${rf.filter((_, m) => !oscuros.includes(m)).map((x) => x.toFixed(2)).join(' / ')} 1/s`);
}
// 3. golpear a un cantor guarda la mitad solo si el coro se oye a tiempo
{
  const frac = (g) => { const c = new Coro(SR, D, { gamma: g, gammaInterna: 0 }); c.golpear(0, 1); const e0 = c.energia(); correr(c, 2.5); return c.guardada() / e0; };
  const gs = [0.25, 1, 3, 8], f = gs.map(frac);
  const v = modos(D).filter((x) => x.oscuro).reduce((s, x) => s + x.v[0] ** 2, 0);
  prueba('golpear al cantor 1: la mitad se guarda en el límite γ·5T → 0, menos con el retardo real', Math.abs(f[0] - v) < 0.03 && f.every((x, k) => k === 0 || x < f[k - 1]),
    `Markov: ${v.toFixed(3)}. Medido con γ = ${gs.join(' / ')} 1/s (γ·5T = ${gs.map((g) => (g * 5 / D.base).toFixed(2)).join(' / ')}): ${f.map((x) => x.toFixed(3)).join(' / ')}`);
}
// 4. abrir una puerta: la fuga crece como δ² (donde la fuga no está suprimida)
{
  const par = (j) => { const o1 = new Float64Array(N), o2 = new Float64Array(N); o1[j] = 0.3 / (2 * Math.PI * 220); o2[j] = 0.6 / (2 * Math.PI * 220); return oscuros.map((m) => tasa(m, o2) / tasa(m, o1)); };
  const r = par(0), r3 = par(2);
  prueba('mover al cantor 1 el doble: cada nota guardada se fuga cuatro veces más rápido', r.every((x) => Math.abs(x / 4 - 1) < 0.1),
    `cociente ${r.map((x) => x.toFixed(2)).join(' / ')} (220 / 264 / 330 Hz). Con el cantor 3: ${r3.map((x) => x.toFixed(2)).join(' / ')}: donde la fuga casi se anula (330 Hz), domina otro orden`);
}
// 5. cada cantor es una puerta distinta (y la regla de oro solo vale lejos de los modos audibles)
{
  const filas = [0, 1, 2].map((j) => oscuros.map((m) => { const o = new Float64Array(N); o[j] = 0.3 / (2 * Math.PI * modos(D)[m].f); return tasa(m, o); }));
  const pred = [0, 1, 2].map((j) => oscuros.map((m) => { const o = new Float64Array(N); o[j] = 0.3 / (2 * Math.PI * modos(D)[m].f); return fugas(modos(D), new Coro(SR, D).posiciones(1, o), 3)[m]; }));
  const primera = filas.map((f) => f.indexOf(Math.max(...f)));
  prueba('cada cantor suelta primero una nota distinta; el centro casi no suelta la aguda', primera[0] !== primera[2] && filas[2][2] * 20 < filas[2][0],
    filas.map((f, j) => `cantor ${j + 1}: ${f.map((x) => x.toFixed(4)).join(' / ')} 1/s (regla de oro ${pred[j].map((x) => x.toFixed(4)).join(' / ')})`).join('\n       '));
}
// 6. reciprocidad: un pulso que llega de la sala no deja nada guardado
{
  const c = new Coro(SR, D, { gammaInterna: 0 }); c.pulso(1, 3); let pico = 0;
  correr(c, 4, () => { pico = Math.max(pico, c.energia()); });
  const g = c.guardada();
  prueba('un pulso desde la sala excita al coro pero no carga las notas guardadas', g < 1e-6 * pico,
    `energía máxima en el coro ${pico.toExponential(2)}; guardada a los 4 s ${g.toExponential(1)} (${(g / pico).toExponential(1)} de la máxima)`);
}
// 7. fuera de Bragg todas se escapan, en orden de vida
{
  const r = oscuros.map((m) => tasa(m, new Float64Array(N), 1.004));
  prueba('separar el coro 0,4 %: las tres guardadas se escapan, cada una a su ritmo', r.every((x) => x > 0.01) && Math.max(...r) / Math.min(...r) > 2,
    `tasas ${r.map((x) => x.toFixed(3)).join(' / ')} 1/s (vidas ${r.map((x) => (1 / x).toFixed(1)).join(' / ')} s)`);
}
// 8. la sala oye el espejo del acorde
{
  const c = new Coro(SR, D, { gammaInterna: 0 }); c.golpear(0, 1); const n = SR * 2, x = new Float64Array(n);
  correr(c, 2, (i, o) => { x[i] = o.izq; });
  const pot = (f) => { let a = 0, b = 0; for (let i = 0; i < n; i++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n); a += w * x[i] * Math.cos(2 * Math.PI * f * i / SR); b += w * x[i] * Math.sin(2 * Math.PI * f * i / SR); } return a * a + b * b; };
  const esp = []; for (let f = 150; f <= 450; f += 0.5) esp.push([f, pot(f)]);
  const picos = esp.filter((p, k) => k > 0 && k < esp.length - 1 && p[1] > esp[k - 1][1] && p[1] >= esp[k + 1][1]).sort((a, b) => b[1] - a[1]).slice(0, 3).map((p) => p[0]).sort((a, b) => a - b);
  const guard = D.guardadas.map((f) => 10 * Math.log10(pot(f) / Math.max(...esp.map((p) => p[1]))));
  prueba('tras un golpe, los tres picos en la boca izquierda son las notas espejo, no las guardadas', picos.every((f, k) => Math.abs(f - D.espejo[k]) < 3),
    `picos ${picos.join(' · ')} Hz (espejo ${D.espejo.join(' · ')}); las guardadas en la sala: ${guard.map((d) => d.toFixed(0)).join(' / ')} dB bajo el pico`);
}
// 9. reproducible
{
  const huella = () => { const c = new Coro(SR, D); c.golpear(0, 1); c.mover(2, 10); const h = createHash('sha256'); const b = new Float32Array(SR); for (let i = 0; i < SR; i++) b[i] = c.muestra().izq; h.update(Buffer.from(b.buffer)); return h.digest('hex').slice(0, 12); };
  const a = huella(), b = huella();
  prueba('el mismo gesto da la misma muestra', a === b, `huella ${a}`);
}
console.log(fallos ? `\n${fallos} fallan` : '\ntodas pasan');
process.exit(fallos ? 1 : 0);
