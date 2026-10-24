// cancion.mjs — «Los testigos dicen la misma altura». Lámina 7 de Traspuesta (NDENTHO̱, cerros testigo).
//   node cancion.mjs salida.wav
// Cuatro cerros conservan la altura de una meseta que ya no existe. Cada uno es un Coro inaudible
// afinado a su altura: guarda la tríada de la meseta y la sala sólo oye su espejo. El llano es el
// Sampleador de espacio-tiempo: su cuerda tiene la forma del perfil que pasa por los testigos y canta
// los cerros gastados leyendo cada vez más atrás. Todos los coros se tocan a la vez; se oyen en canon
// porque el sonido tarda en llegar desde cada cerro hasta el testigo más alto, donde se escucha.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Coro, disenar } from '../../instrumentos/coro-inaudible/motor.mjs';
import { Sampleador } from '../../instrumentos/sampleador-espacio-tiempo/motor.mjs';

export const SR = 48000, DUR = 156;
export const T = JSON.parse(readFileSync(new URL('./terreno-7.json', import.meta.url), 'utf8'));
// decisiones de la pieza (no vienen del terreno)
export const RE3 = 146.83;                 // el llano suena en re3
export const CENTS_POR_M = 2;              // 2 cents por metro sobre el llano
export const C_SON = 343;                  // m/s: el canon es el tiempo de vuelo del sonido
export const altura = (m) => RE3 * 2 ** (((m - T.llano) * CENTS_POR_M) / 1200);
const escucha = T.testigos.reduce((a, b) => (b.m > a.m ? b : a));         // se escucha parado en el más alto
export const testigos = T.testigos.map((p) => {
  const km = Math.hypot(p.u - escucha.u, p.v - escucha.v), f = altura(p.m);
  return { ...p, km, retardo: (km * 1000) / C_SON, f, diseno: disenar({ base: f / 12, armonicos: [10, 12, 15], eje: (13 * f) / 12 }) };
}).sort((a, b) => a.retardo - b.retardo);
// los gastados, de sur a norte (el orden del perfil): cada uno dura según su prominencia
export const melodia = [...T.gastados].sort((a, b) => a.v - b.v).map((p) => ({ ...p, f: altura(p.m), dur: 2.4 + p.prom / 30 }));

// la forma de la cuerda: el perfil por los testigos, sin la recta entre sus extremos (la cuerda está fija)
function forma(x) {
  const P = T.perfil.m, n = P.length - 1, k = x * n, i = Math.min(n - 1, Math.floor(k)), f = k - i;
  const h = P[i] * (1 - f) + P[i + 1] * f, recta = P[0] * (1 - x) + P[n] * x;
  return ((h - recta) / (T.techo - T.llano)) * 0.32;
}

// la partitura: [s, gesto]
export const EVENTOS = (() => {
  const e = [];
  e.push([0, { llano: { f: RE3, gate: 1, params: { tau0: 0, g: 0 } } }], [3, { cristalizar: true }]);
  e.push([24, { golpe: true }]);                                               // todos los testigos a la vez
  e.push([46, { llano: { gate: 0 } }]);
  let t = 56; e.push([t - 0.5, { llano: { params: { g: 4, alfa: 0.4 } } }]);
  const total = melodia.reduce((s, n) => s + n.dur + 0.6, 0);
  for (const n of melodia) {                                                   // la erosión: cada vez más atrás
    const tau0 = (2.6 * (t - 56)) / total;
    // cada cerro gastado vuelve a poner el perfil en la cuerda, con la fuerza de lo que le queda de altura
    e.push([t, { llano: { f: n.f, gate: 1, params: { tau0 }, excitar: (n.m - T.llano) / (T.techo - T.llano) } }], [t + n.dur, { llano: { gate: 0 } }]);
    t += n.dur + 0.6;
  }
  e.push([104, { puertas: 45 }]);                                              // todos abren a la vez
  e.push([104, { llano: { f: testigos[0].f, gate: 1, params: { tau0: 0, g: 0, mezcla: 1, ganancia: 0.22, ataque: 4, suelta: 5 } } }]); // el llano lee el estrato: la meseta
  e.push([140, { cerrar: true }], [146, { llano: { gate: 0 } }]);
  return e.sort((a, b) => a[0] - b[0]);
})();

export function tocar({ sr = SR, dur = DUR, alPaso } = {}) {
  const n = Math.round(dur * sr), L = new Float32Array(n), R = new Float32Array(n);
  const coros = testigos.map((w) => ({ w, c: new Coro(sr, w.diseno, { gammaInterna: 1 / 120 }), pend: [], d: Math.round(w.retardo * sr), g: 1 / (1 + w.km / 4) }));
  const s = new Sampleador(sr, { f: RE3, ganancia: 1.2, suelta: 0.6, ataque: 0.05 });
  s.h.ponerForma(forma);
  // cada coro recibe los gestos con su retardo de vuelo: es lo mismo que retrasar lo que se oye de él
  for (const [t, g] of EVENTOS) for (const k of coros) {
    if (g.golpe) k.pend.push([Math.round(t * sr) + k.d, (c) => c.golpear(0, 1)]);
    if (g.puertas) k.pend.push([Math.round(t * sr) + k.d, (c) => c.mover(0, g.puertas)]);
    if (g.cerrar) k.pend.push([Math.round(t * sr) + k.d, (c) => c.cerrar()]);
  }
  const ll = EVENTOS.filter(([, g]) => g.llano || g.cristalizar).map(([t, g]) => [Math.round(t * sr), g]);
  const traza = [], cada = Math.round(0.1 * sr), buf = new Float32Array(1);
  let acL = 0, acC = 0, acS = 0;
  for (let i = 0; i < n; i++) {
    while (ll.length && ll[0][0] <= i) {
      const g = ll.shift()[1];
      if (g.cristalizar) s.cristalizar();
      if (g.llano && g.llano.excitar) { const h = s.h; for (let j = 0; j < h.u.length; j++) h.u[j] += g.llano.excitar * forma((j + 1) * h.dx); h.fuerzas(); }
      if (g.llano) { if (g.llano.params) s.ponerParams(g.llano.params); if (g.llano.f) s.p.f = g.llano.f; if (g.llano.gate !== undefined) s.gate = g.llano.gate; }
    }
    s.procesar(buf, 1); const vs = buf[0] * 0.55;
    let l = vs, r = vs, cl = 0, cr = 0;
    for (const k of coros) {
      while (k.pend.length && k.pend[0][0] <= i) k.pend.shift()[1](k.c);
      if (i < (k.arranca ??= Math.round(24 * sr) + k.d) - 1) continue;     // antes del golpe el coro calla: no se calcula
      const o = k.c.muestra(0);
      const near = k.w === testigos[0] ? 0.18 : 0;                          // estamos parados sobre el primero
      cl += k.g * (0.45 * o.izq * (1 - near) + 0.5 * near * o.cerca);
      cr += k.g * (0.45 * o.der * (1 - near) + 0.5 * near * o.cerca);
    }
    l += cl; r += cr; L[i] = l; R[i] = r;
    acL += vs * vs; acC += (cl * cl + cr * cr) / 2; acS += (l * l + r * r) / 2;
    if ((i + 1) % cada === 0) {
      traza.push({ t: +((i + 1) / sr).toFixed(1), llano_db: +(10 * Math.log10(acL / cada + 1e-15)).toFixed(1), coros_db: +(10 * Math.log10(acC / cada + 1e-15)).toFixed(1), total_db: +(10 * Math.log10(acS / cada + 1e-15)).toFixed(1), guardada: coros.map((k) => +k.c.guardada().toExponential(2)), tau0: +s.suave.tau0.toFixed(2), f: +s.p.f.toFixed(2), gate: s.gate });
      acL = acC = acS = 0; if (alPaso) alPaso(traza[traza.length - 1]);
    }
  }
  return { L, R, traza };
}

export function wav16([L, R], sr, g = 1) {
  const n = L.length, b = Buffer.alloc(44 + n * 4), q = (x) => Math.round(Math.max(-1, Math.min(1, x * g)) * 32767);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(q(L[i]), 44 + i * 4); b.writeInt16LE(q(R[i]), 46 + i * 4); }
  return b;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const salida = process.argv[2] || 'los-testigos.wav', t0 = Date.now();
  console.log('testigos', testigos.map((w) => `${w.m} m → ${w.f.toFixed(2)} Hz, ${w.km.toFixed(2)} km, ${w.retardo.toFixed(1)} s`).join(' | '));
  console.log('melodía', melodia.map((n) => `${n.m} m → ${n.f.toFixed(1)} Hz (${n.dur.toFixed(1)} s)`).join(' · '));
  const { L, R, traza } = tocar();
  let pico = 0; for (let i = 0; i < L.length; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
  const g = 0.89 / pico, w = wav16([L, R], SR, g), sha = createHash('sha256').update(w).digest('hex'); // pico a −1 dBFS
  writeFileSync(salida, w);
  writeFileSync(salida.replace(/\.wav$/, '.json'), JSON.stringify({ cancion: 'Los testigos dicen la misma altura', sha256: sha, ganancia: g, pico_crudo: pico, terreno: T, decisiones: { RE3, CENTS_POR_M, C_SON }, testigos: testigos.map(({ diseno, ...w }) => ({ ...w, guardadas: diseno.guardadas, espejo: diseno.espejo })), melodia, eventos: EVENTOS, traza }));
  console.log(`${salida}  ${((Date.now() - t0) / 1000).toFixed(0)} s de cálculo  pico crudo ${pico.toFixed(3)}  sha256 ${sha.slice(0, 12)}`);
}
