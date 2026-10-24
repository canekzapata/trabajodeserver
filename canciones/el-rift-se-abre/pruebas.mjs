// pruebas.mjs — lo que la partitura y las tomas afirman y puede fallar.  node pruebas.mjs [carpeta-con-voz.f32]
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { T, LINEAS, MELODIA, ARMONIA, ARCO, CORO, SECCIONES, ACORDES, BEAT, hzP } from './partitura.mjs';
import { disenar } from '../../instrumentos/coro-inaudible/motor.mjs';
import { Cuerpo, medir } from '../../instrumentos/cuerpo-de-accion/motor.mjs';

let fallos = 0;
const prueba = (nombre, ok, detalle) => { console.log(`${ok ? 'pasa ' : 'FALLA'}  ${nombre}\n       ${detalle}`); if (!ok) fallos++; };
const cents = (a, b) => 1200 * Math.log2(a / b), SR = 48000;

// 1. el terreno sale del motor
{
  const R = process.env.REJILLA || '/home/user/canekzapata/rejilla', tmp = `/tmp/rift-${process.pid}.json`;
  if (existsSync(`${R}/research/montanas-topograficas/terreno.js`)) {
    execFileSync('node', [new URL('./datos.mjs', import.meta.url).pathname, tmp], { env: { ...process.env, REJILLA: R } });
    prueba('terreno-40.json es lo que da MT.terreno("40", {forma}) hoy', readFileSync(tmp, 'utf8') === readFileSync(new URL('./terreno-40.json', import.meta.url), 'utf8'), `épocas: ${T.historia.join(' → ')}`);
  } else console.log('salta  (no está Rejilla)');
}
// 2. la voz de máquina: una nota por sílaba, ninguna de más de 2 tiempos, frases cortas
{
  const maxDur = Math.max(...MELODIA.map((n) => n.dur));
  let frase = 0, maxFrase = 0, fin = null;
  for (const n of MELODIA) { if (fin !== null && n.t - fin > 1e-6) frase = 0; frase += n.dur; maxFrase = Math.max(maxFrase, frase); fin = n.t + n.durS; }
  const unaPorSilaba = MELODIA.every((n) => n.silaba && !/\s/.test(n.silaba));
  prueba('voz de máquina: silábica, notas de 2 tiempos como máximo, frases de 3 compases como máximo', unaPorSilaba && maxDur <= 2 && maxFrase <= 12,
    `${MELODIA.length} sílabas; nota más larga ${maxDur} tiempos; frase más larga sin silencio ${maxFrase} tiempos`);
}
// 3. el Coro guarda la tónica que la progresión nunca toca
{
  const d = disenar({ base: CORO.base, armonicos: CORO.armonicos }), tocaI = ARMONIA.some((a) => a.grado === 'I');
  const okI = d.guardadas.every((f, k) => Math.abs(cents(f, hzP(ACORDES.I[k] / 2))) < 1e-6), okE = d.espejo.every((f, k) => Math.abs(f / CORO.base - [9, 11, 13][k]) < 1e-9);
  prueba('el Coro guarda do4 · mi4 · sol4 (8 : 10 : 12) y la sala oye 9 : 11 : 13; la progresión no toca el I', d.factible && okI && okE && !tocaI,
    `guarda ${d.guardadas.map((f) => f.toFixed(2)).join(' · ')} Hz; espejo ${d.espejo.map((f) => f.toFixed(2)).join(' · ')} Hz; eje ${d.f0.toFixed(2)} Hz`);
}
// 4. la progresión cae en el terreno: cada tono desviado está sobre una línea de su época, a menos de 60 cents
{
  let ok = true, n = 0, max = 0;
  for (const a of ARMONIA) for (const x of a.tonos) {
    if (a.epoca === 0 && x.desvio !== 0) ok = false;
    if (x.desvio) { n++; max = Math.max(max, Math.abs(x.desvio)); const sobre = LINEAS[a.epoca].some((l) => [-4, -3, -2, -1, 0, 1, 2, 3, 4].some((k) => Math.abs(cents(x.p, l * 2 ** k)) < 0.05)); if (!sobre || Math.abs(x.desvio) >= 60) ok = false; }
  }
  const por = SECCIONES.filter((s) => s.nombre.startsWith('coro')).map((s) => { const ts = ARMONIA.filter((a) => a.seccion === s.nombre).flatMap((a) => a.tonos); return `${s.nombre}: ${ts.filter((x) => x.desvio).length}/${ts.length} tonos movidos`; });
  prueba('cada tono movido cae en una línea del espectro de su época (a menos de 0,05 cents: la partitura guarda 4 decimales); la meseta no mueve nada', ok, `${n} tonos movidos, desvío máximo ${max.toFixed(0)} cents · ${por.join(' · ')}`);
}
// 5. el arco hace lo que la partitura dice
{
  const correr = (a) => {
    const c = new Cuerpo(SR, { f0: a.hz }), n = Math.round(a.dur * SR), ven = SR / 10, vc = new Float64Array(ven), ov = new Float64Array(ven); let d0 = 0; const r = [];
    const F = (u) => { const k = a.F; if (u <= k[0][0]) return k[0][1]; for (let i = 1; i < k.length; i++) if (u <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * (u - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return k[k.length - 1][1]; };
    for (let i = 0; i < n; i++) { if (i % 32 === 0) c.ponerMano({ s: 0.52, F: F(i / SR), v: 0.1, material: 'crin' }); const y = c.muestra(); vc[i % ven] = c.vContacto; ov[i % ven] = y;
      if (i % ven === ven - 1) { const m = medir(vc, ov, SR, c.P, c.deslizar - d0); d0 = c.deslizar; r.push(m); } }
    return r.slice(3);
  };
  const [isla, rompe, rampa] = ARCO.map(correr);
  const okIsla = isla.every((m) => m.regimen === 'periódico' && Math.abs(m.porPeriodo - 1) < 0.1);
  const okRompe = rompe.slice(0, 5).every((m) => m.regimen === 'periódico') && rompe.slice(-2).every((m) => m.regimen === 'aperiódico');
  const okRampa = rampa.every((m) => m.porPeriodo > 1.8);
  prueba('arco en mi3: coro 1 se sostiene; coro 2 empieza periódico y termina aperiódico; coro final llega por rampa y no vuelve', okIsla && okRompe && okRampa,
    `coro 1: ${isla.map((m) => m.porPeriodo.toFixed(2)).join(' ')} desl./periodo · coro 2: ${rompe.map((m) => m.regimen.slice(0, 5)).join(' ')} · coro final: ${rampa.map((m) => m.porPeriodo.toFixed(2)).join(' ')}`);
}
// 6. Sabina canta afinado (si está la toma de voz)
{
  const f = `${process.argv[2] || '.'}/voz.f32`;
  if (existsSync(f)) {
    const V = new Float32Array(readFileSync(f).buffer.slice(0));
    const largas = [...MELODIA].sort((a, b) => b.durS - a.durS).slice(0, 12);
    const err = largas.map((n) => {
      const i0 = Math.round((n.t + n.durS * 0.35) * SR), L = Math.round(0.12 * SR), x = new Float64Array(L); for (let i = 0; i < L; i++) x[i] = V[2 * (i0 + i)];
      let mejor = 0, lag = 0; const lo = Math.floor(SR / (n.hz * 1.15)), hi = Math.ceil(SR / (n.hz / 1.15));
      for (let l = lo; l <= hi; l++) { let s = 0, a = 0, b = 0; for (let i = 0; i + l < L; i++) { s += x[i] * x[i + l]; a += x[i] * x[i]; b += x[i + l] * x[i + l]; } const r = s / Math.sqrt(a * b + 1e-12); if (r > mejor) { mejor = r; lag = l; } }
      // refinamiento parabólico
      const ac = (l) => { let s = 0; for (let i = 0; i + l < L; i++) s += x[i] * x[i + l]; return s; }, y0 = ac(lag - 1), y1 = ac(lag), y2 = ac(lag + 1), d = (y0 - y2) / (2 * (y0 - 2 * y1 + y2));
      return cents(SR / (lag + (Math.abs(d) < 1 ? d : 0)), n.hz);
    });
    prueba('Sabina afina las 12 notas más largas a menos de 20 cents', err.every((e) => Math.abs(e) < 20), err.map((e) => `${e >= 0 ? '+' : ''}${e.toFixed(0)}`).join(' ') + ' cents');
  } else console.log('salta  (sin voz.f32: node voz.cjs <carpeta>/voz.f32; node pruebas.mjs <carpeta>)');
}
console.log(fallos ? `\n${fallos} fallan` : '\ntodas pasan');
process.exit(fallos ? 1 : 0);
