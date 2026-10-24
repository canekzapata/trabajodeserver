// datos.mjs — el rift de la lámina 40 (EL ALCOR DEL PINAR) época por época, del motor de Traspuesta.
//   REJILLA=/ruta/a/rejilla node datos.mjs [salida.json]
// Las épocas son las etapas que el motor guarda al formar el terreno (forma = 0, ¼, ½, ¾, 1: llanura, forma,
// relieve, primera erosión, erosión). En cada una se miden los mismos rasgos, en el mismo lugar.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';

const R = process.env.REJILLA || '/home/user/canekzapata/rejilla', MTD = `${R}/research/montanas-topograficas`;
globalThis.window = globalThis;
const req = createRequire(import.meta.url);
req(`${MTD}/nucleo.js`); req(`${MTD}/terreno.js`);
const MT = globalThis.MT, SEMILLA = 40;
const fin = MT.terreno(String(SEMILLA), {}), K = fin.anchoKm, G = fin.G;
const ed = JSON.parse(readFileSync(`${MTD}/edicion/edicion.json`, 'utf8')).filas.find((f) => f[0] === SEMILLA);
const r1 = (x) => +x.toFixed(1), r3 = (x) => +x.toFixed(3);

// el corte transversal: la media de cada columna (u), como en la conversación
const corte = (T) => { const c = []; for (let x = 0; x < G; x++) { let s = 0; for (let y = 0; y < G; y++) s += T.h[y * G + x]; c.push(T.alt(s / G)); } return c; };
const cf = corte(fin);
const iPiso = cf.indexOf(Math.min(...cf)), iEste = cf.indexOf(Math.max(...cf.slice(iPiso))), iOeste = cf.indexOf(Math.max(...cf.slice(0, iPiso + 1)));
// los rasgos que se siguen: piso, hombros, las tres cumbres más prominentes y los cuatro lagos
const picos = [...fin.rasgos.picos].sort((a, b) => b.prom - a.prom).slice(0, 3);
const lagos = fin.hidro.lagos;
const rasgos = [
  { nombre: 'piso', tipo: 'corte', i: iPiso }, { nombre: 'hombro oeste', tipo: 'corte', i: iOeste }, { nombre: 'hombro este', tipo: 'corte', i: iEste },
  ...picos.map((p, k) => ({ nombre: `cumbre ${k + 1}`, tipo: 'punto', u: p.u, v: p.v })),
  ...lagos.map((l, k) => ({ nombre: `lago ${k + 1}`, tipo: 'lago', u: l.u, v: l.v, nivel: l.nivel })),
];
const ETAPAS = [0, 0.25, 0.5, 0.75, 1];
const epocas = ETAPAS.map((f, k) => {
  const T = f === 1 ? fin : MT.terreno(String(SEMILLA), { forma: f }), c = corte(T);
  const m = rasgos.map((q) => q.tipo === 'corte' ? c[q.i] : q.tipo === 'lago' && f === 1 ? T.alt(q.nivel) : T.alt(T.sample(q.u, q.v)));
  return { epoca: fin.historia[k] || `etapa ${k}`, forma: f, relieve: T.relieve, base: T.base, m: m.map(r1), corte: c.filter((_, i) => i % 6 === 0).map(r1) };
});
const datos = {
  fuente: 'Traspuesta (Rejilla, research/montanas-topograficas): MT.terreno("40", {forma})', semilla: SEMILLA,
  lamina: { nombre: ed[1], glosa: ed[2], arquetipo: fin.nombre }, anchoKm: K, historia: fin.historia, eventos: fin.eventos,
  rasgos: rasgos.map((q) => ({ nombre: q.nombre, tipo: q.tipo, km: q.tipo === 'corte' ? r3((q.i / (G - 1)) * K) : [r3(q.u * K), r3(q.v * K)] })),
  rios: fin.hidro.rios.length, clasesRios: [1, 2, 3].map((c) => fin.hidro.rios.filter((x) => x.clase === c).length),
  epocas,
};
writeFileSync(process.argv[2] || new URL('./terreno-40.json', import.meta.url), JSON.stringify(datos, null, 1) + '\n');
console.log(datos.lamina, datos.historia, 'ríos', datos.rios, datos.clasesRios);
console.log(datos.rasgos.map((q) => q.nombre + ' ' + JSON.stringify(q.km)).join(' | '));
for (const e of epocas) console.log(e.epoca.padEnd(18), 'forma', e.forma, 'rel', e.relieve, 'base', e.base, '|', e.m.join(' '));
