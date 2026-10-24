// datos.mjs — saca del motor de Traspuesta (Rejilla) los datos de la lámina 7 y los guarda en terreno-7.json.
//   REJILLA=/ruta/a/rejilla node datos.mjs
// La canción lee terreno-7.json; este script sólo hace falta para volver a sacarlo del motor.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const R = process.env.REJILLA || '/home/user/canekzapata/rejilla', MTD = `${R}/research/montanas-topograficas`;
globalThis.window = globalThis;
const req = createRequire(import.meta.url);
req(`${MTD}/nucleo.js`); req(`${MTD}/terreno.js`);
const SEMILLA = 7, t = globalThis.MT.terreno(String(SEMILLA), {}), K = t.anchoKm, G = t.G;
const ed = JSON.parse(readFileSync(`${MTD}/edicion/edicion.json`, 'utf8')).filas.find((f) => f[0] === SEMILLA);
const m = (h) => t.alt(h);
const picos = t.rasgos.picos.map((p) => ({ u: p.u * K, v: p.v * K, m: m(p.h), prom: p.prom * t.relieve, collado: p.col ? m(p.col.h) : null }))
  .sort((a, b) => b.prom - a.prom);
// testigos: las cumbres a menos de 10 m de la más alta (la superficie de la meseta que se conserva)
const techo = Math.max(...picos.map((p) => p.m));
const testigos = picos.filter((p) => techo - p.m < 10).sort((a, b) => b.v - a.v);
const gastados = picos.filter((p) => techo - p.m >= 10 && p.prom >= 10);
// el llano: la mediana de las alturas del terreno
const hs = Float32Array.from(t.h).sort(); const llano = m(hs[Math.floor(hs.length / 2)]);
// el perfil: una línea quebrada que pasa por los testigos de sur a norte, muestreada en 129 puntos
const ruta = [...testigos].sort((a, b) => a.v - b.v);
const largos = ruta.slice(1).map((p, i) => Math.hypot(p.u - ruta[i].u, p.v - ruta[i].v)), total = largos.reduce((a, b) => a + b, 0);
const perfil = [];
for (let k = 0; k <= 128; k++) {
  let s = (k / 128) * total, i = 0; while (i < largos.length - 1 && s > largos[i]) { s -= largos[i]; i++; }
  const f = largos[i] ? s / largos[i] : 0, u = ruta[i].u + (ruta[i + 1].u - ruta[i].u) * f, v = ruta[i].v + (ruta[i + 1].v - ruta[i].v) * f;
  perfil.push(+m(t.sample(u / K, v / K)).toFixed(1));
}
const r = (x, n = 2) => +x.toFixed(n);
const datos = {
  fuente: 'Traspuesta (Rejilla, research/montanas-topograficas): MT.terreno("7")', semilla: SEMILLA,
  lamina: { nombre: ed[1], glosa: ed[2], arquetipo: t.nombre }, anchoKm: K, relieve: t.relieve, base: t.base, historia: t.historia,
  llano: r(llano, 1), techo: r(techo, 1),
  testigos: testigos.map((p) => ({ u: r(p.u), v: r(p.v), m: r(p.m, 1), prom: r(p.prom, 1), collado: p.collado && r(p.collado, 1) })),
  gastados: gastados.map((p) => ({ u: r(p.u), v: r(p.v), m: r(p.m, 1), prom: r(p.prom, 1), collado: p.collado && r(p.collado, 1) })),
  perfil: { km: r(total), m: perfil },
};
const txt = JSON.stringify(datos, null, 1);
writeFileSync(process.argv[2] || new URL('./terreno-7.json', import.meta.url), txt + '\n');
console.log(`terreno-7.json  ${createHash('sha256').update(txt).digest('hex').slice(0, 12)}`);
console.log(datos.lamina, 'llano', datos.llano, 'techo', datos.techo);
console.log('testigos', datos.testigos); console.log('gastados', datos.gastados);
console.log('perfil', total.toFixed(2), 'km', Math.min(...perfil), Math.max(...perfil));
