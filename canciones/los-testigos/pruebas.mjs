// pruebas.mjs — lo que la canción afirma y puede fallar.  node pruebas.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { T, testigos, melodia, altura, C_SON, tocar } from './cancion.mjs';
import { Coro } from '../../instrumentos/coro-inaudible/motor.mjs';

let fallos = 0;
const prueba = (nombre, ok, detalle) => { console.log(`${ok ? 'pasa ' : 'FALLA'}  ${nombre}\n       ${detalle}`); if (!ok) fallos++; };
const cents = (a, b) => 1200 * Math.log2(a / b);
const SR = 48000;

// 1. los datos salen del motor de Traspuesta tal como están guardados
{
  const R = process.env.REJILLA || '/home/user/canekzapata/rejilla', tmp = `/tmp/testigos-${process.pid}.json`;
  if (existsSync(`${R}/research/montanas-topograficas/terreno.js`)) {
    execFileSync('node', [new URL('./datos.mjs', import.meta.url).pathname, tmp], { env: { ...process.env, REJILLA: R } });
    const a = readFileSync(tmp, 'utf8'), b = readFileSync(new URL('./terreno-7.json', import.meta.url), 'utf8');
    prueba('terreno-7.json es lo que da MT.terreno("7") hoy', a === b, `sha ${createHash('sha256').update(a).digest('hex').slice(0, 12)}`);
  } else console.log('salta  (no está Rejilla: REJILLA=/ruta node pruebas.mjs)');
}
// 2. los testigos: cuatro cumbres a la altura de la meseta, con su espejo de cents
{
  const m = T.testigos.map((p) => p.m), sp = Math.max(...m) - Math.min(...m);
  prueba('cuatro cumbres conservan la meseta, a menos de 10 m entre ellas', m.length === 4 && sp < 10,
    `${m.join(' / ')} m (dispersión ${sp.toFixed(1)} m = ${(2 * sp).toFixed(1)} cents); la siguiente cumbre: ${Math.max(...T.gastados.map((p) => p.m))} m`);
}
// 3. cada coro guarda la nota de su testigo
{
  const err = testigos.map((w) => { const g = w.diseno.guardadas; return Math.abs(cents(g[1], w.f)); });
  prueba('cada Coro guarda la altura de su cerro (nota del medio del acorde guardado)', testigos.every((w) => w.diseno.factible) && Math.max(...err) < 0.01,
    testigos.map((w) => `${w.m} m: guarda ${w.diseno.guardadas.map((f) => f.toFixed(1)).join('·')} Hz, la sala oye ${w.diseno.espejo.map((f) => f.toFixed(1)).join('·')}`).join('\n       '));
}
// 4. el canon es el tiempo de vuelo
{
  const ok = testigos.every((w) => Math.abs(w.retardo - (Math.hypot(w.u - testigos[0].u, w.v - testigos[0].v) * 1000) / C_SON) < 1e-9);
  prueba('las entradas del canon son distancia / 343 m/s desde el testigo más alto', ok && testigos[0].retardo === 0,
    testigos.map((w) => `${w.km.toFixed(2)} km → ${w.retardo.toFixed(2)} s`).join(' · '));
}
// 5. un testigo guarda al golpe y su puerta suelta primero la nota de la meseta
{
  const w = testigos[0], c = new Coro(SR, w.diseno, { gammaInterna: 1 / 120 }); c.golpear(0, 1); const e0 = c.energia();
  for (let i = 0; i < SR * 3; i++) c.muestra();
  const g0 = c.guardada() / e0, m0 = c.enModos(); c.mover(0, 45);
  for (let i = 0; i < SR * 3; i++) c.muestra();
  const m1 = c.enModos(), osc = c.modos.map((x, k) => (x.oscuro ? k : -1)).filter((k) => k >= 0);
  const quedan = osc.map((k) => m1[k] / m0[k]);
  prueba('golpe: se guarda un tercio; puerta de 45 cm: en 3 s se van la nota de la meseta y la aguda, la grave se queda', g0 > 0.3 && g0 < 0.4 && quedan[1] < 0.05 && quedan[2] < 0.05 && quedan[0] > 0.3,
    `guardado ${g0.toFixed(3)} del golpe; tras 3 s de puerta quedan ${osc.map((k, j) => `${c.modos[k].f.toFixed(1)} Hz: ${(100 * quedan[j]).toFixed(1)} %`).join(' · ')}`);
}
// 6. la melodía de la erosión son los cerros gastados, de sur a norte
{
  const ok = melodia.every((n, k) => Math.abs(cents(n.f, altura(n.m))) < 1e-9 && (k === 0 || n.v >= melodia[k - 1].v));
  prueba('la erosión canta los cerros gastados en el orden del perfil', ok, melodia.map((n) => `${n.m} m → ${n.f.toFixed(1)} Hz`).join(' · '));
}
// 7. reproducible
{
  const h = () => { const { L, R } = tocar({ dur: 30 }); return createHash('sha256').update(Buffer.from(L.buffer)).update(Buffer.from(R.buffer)).digest('hex').slice(0, 12); };
  const a = h(), b = h();
  prueba('los primeros 30 s salen idénticos dos veces', a === b, `huella ${a}`);
}
console.log(fallos ? `\n${fallos} fallan` : '\ntodas pasan');
process.exit(fallos ? 1 : 0);
