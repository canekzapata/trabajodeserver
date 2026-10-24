// pruebas.mjs — lo que «Las vacas de Narayana» afirma y puede fallar.  node pruebas.mjs [carpeta]
import { readFileSync, existsSync } from 'node:fs';
import { N, VACAS, LISTA, MANADA, PARTES, CELDAS, RAIZ, VOCES, CONCRECION, PALABRA, PSI, SECCIONES, BEAT } from './partitura.mjs';

let fallos = 0;
const prueba = (nombre, ok, detalle) => { console.log(`${ok ? 'pasa ' : 'FALLA'}  ${nombre}\n       ${detalle}`); if (!ok) fallos++; };
const carpeta = process.argv[2];

// 1. el problema: N(n) = N(n−1) + N(n−3), y 2745 al cabo de veinte años
{
  const rec = N.every((x, n) => n < 3 || x === N[n - 1] + N[n - 3]);
  prueba('la manada cumple N(n) = N(n−1) + N(n−3) y llega a 2745 en el año 20', rec && N[20] === 2745 && N.slice(0, 6).join() === '1,2,3,4,6,9', N.join(' '));
}
// 2. la genealogía: toda madre tenía al menos tres años cumplidos al parir
{
  const ok = VACAS.every((v) => v.madre === null || v.nace - VACAS[v.madre].nace >= 3);
  const r = N[20] / N[19];
  prueba('cada ternera nace de una madre con tres años cumplidos; la razón N(20)/N(19) se acerca a ψ (x³ = x² + 1)', ok && Math.abs(r - PSI) < 0.01, `${VACAS.length} vacas; N(20)/N(19) = ${r.toFixed(5)}, ψ = ${PSI.toFixed(5)}`);
}
// 3. la ley de más de 30 instrumentos: cada uno es una vaca, entra al nacer y suena
{
  const entran = LISTA.every((x) => x.entra === Math.max(0, VACAS[x.vaca].nace));
  const suenan = LISTA.filter((x) => PARTES[x.clave].length > 0 || x.clave === 'coro').length;
  const tope = LISTA.findIndex((x) => x.entra === 9);
  prueba('más de 30 instrumentos (más Sabina), cada uno entra el año en que nace su vaca, todos tienen eventos', LISTA.length > 30 && entran && suenan === LISTA.length,
    `${LISTA.length} de la manada + Sabina = ${LISTA.length + 1}; todos dentro en el año ${Math.max(...LISTA.map((x) => x.entra))}; vacas en ese año: ${N[9]}`);
}
// 4. la herencia: cada celda es la de su madre transformada (tercera, retrógrado o inversión)
{
  const ok = VACAS.slice(1, LISTA.length).every((v) => { const m = CELDAS[v.madre], c = CELDAS[v.id], k = ((v.orden - 1) % 3) + 1;
    return JSON.stringify(c) === JSON.stringify(k === 1 ? m.map((d) => d + 2) : k === 2 ? [...m].reverse() : m.map((d) => 2 * m[0] - d)); });
  prueba('cada instrumento hereda la celda de su madre transformada según su lugar entre sus hermanas', ok, `vaca 0: ${CELDAS[0]} · trombón (vaca 3): ${CELDAS[3]} · Coro (vaca 33): ${CELDAS[33]}`);
}
// 5. la concreción (Lachenmann): la fracción de acciones sigue a la manada
{
  const fr = (a) => { const e = Object.values(PARTES).flat().filter((x) => x.ano === a); return e.length ? e.filter((x) => x.accion).length / e.length : 0; };
  const f = [7, 10, 14, 17, 20].map(fr), c = [7, 10, 14, 17, 20].map(CONCRECION);
  prueba('la fracción de eventos que son acción crece con la manada: 0 antes de 28 vacas, todo en 2745', f[0] === 0 && f[4] === 1 && f.every((x, k) => Math.abs(x - c[k]) < 0.12),
    `años 7 / 10 / 14 / 17 / 20: acción ${f.map((x) => x.toFixed(2)).join(' / ')} (esperado ${c.map((x) => x.toFixed(2)).join(' / ')})`);
}
// 6. la voz de máquina y las voces compuestas
{
  const todas = Object.values(VOCES).flat(), maxDur = Math.max(...todas.map((n) => n.dur));
  const igual = (v) => VOCES[v].filter((n) => VOCES.principal.some((m) => Math.abs(m.t - n.t) < 1e-3 && m.dur === n.dur && m.silaba === n.silaba)).length / VOCES[v].length;
  prueba('voces: silábicas, ninguna nota de más de 2 tiempos; la alta y la baja con texto y ritmo propios (cantan N(n−1) y N(n−3))', maxDur <= 2 && igual('alta') < 0.1 && igual('baja') < 0.1,
    `principal ${VOCES.principal.length} · alta ${VOCES.alta.length} · baja ${VOCES.baja.length} sílabas; nota más larga ${maxDur} tiempos`);
}
// 7. la palabra de Narayana (a→ab, b→c, c→a): sus longitudes siguen la recurrencia y la fracción de «a» tiende a ψ − 1
{
  const L = []; let w = 'a'; for (let k = 0; k < 16; k++) { L.push(w.length); w = [...w].map((c) => ({ a: 'ab', b: 'c', c: 'a' })[c]).join(''); }
  const rec = L.every((x, k) => k < 3 || x === L[k - 1] + L[k - 3]), a = [...PALABRA].filter((c) => c === 'a').length / PALABRA.length;
  prueba('la palabra de Narayana crece como la manada y su fracción de «a» tiende a ψ − 1', rec && Math.abs(a - (PSI - 1)) < 0.001, `longitudes ${L.slice(0, 12).join(' ')} · fracción de «a» ${a.toFixed(5)} (ψ − 1 = ${(PSI - 1).toFixed(5)})`);
}
// 8. la mezcla y el master
if (carpeta && existsSync(`${carpeta}/mezcla.json`) && existsSync(`${carpeta}/master.json`)) {
  const mz = JSON.parse(readFileSync(`${carpeta}/mezcla.json`, 'utf8')), ms = JSON.parse(readFileSync(`${carpeta}/master.json`, 'utf8'));
  const max = Math.max(...mz.informe.map((x) => x.instrumentos_sonando)), vs = mz.informe.filter((x) => x.voces_sobre_resto_db !== null).map((x) => x.voces_sobre_resto_db);
  prueba('master a −14 LUFS, −1 dBTP; más de 30 instrumentos sonando a la vez; ningún stem falta', Math.abs(ms.master.I_LUFS + 14) <= 0.2 && ms.master.pico_verdadero_dBTP <= -1 && max > 30 && !mz.faltan.length,
    `master ${ms.master.I_LUFS} LUFS, ${ms.master.pico_verdadero_dBTP} dBTP, LRA ${ms.master.LRA_LU} LU; hasta ${max} stems sonando en una sección; voces sobre el resto ${Math.min(...vs)} a ${Math.max(...vs)} dB`);
} else console.log('salta  (sin mezcla: node pruebas.mjs <carpeta>)');
console.log(fallos ? `\n${fallos} fallan` : '\ntodas pasan');
process.exit(fallos ? 1 : 0);
