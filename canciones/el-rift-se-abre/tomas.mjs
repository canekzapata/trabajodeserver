// tomas.mjs — una toma corta por instrumento, cada una en su pasaje de la partitura, y la comparación del coro.
//   node tomas.mjs <carpeta> [nombre…]      (antes: node partitura.mjs y node voz.cjs <carpeta>/voz.f32)
// Lo acordado con Canek: partitura y tomas cortas; la canción completa espera su crítica.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as Pt from './partitura.mjs';
import { Coro, disenar } from '../../instrumentos/coro-inaudible/motor.mjs';
import { Cuerpo, medir } from '../../instrumentos/cuerpo-de-accion/motor.mjs';
import { Cuerda as CuerdaFPUT } from '../../instrumentos/cuerda-que-recuerda/motor.mjs';

const SR = 48000, R = process.env.REJILLA || '/home/user/canekzapata/rejilla', req = createRequire(import.meta.url);
const OBJ = `${R}/research/rejilla/objetos/motor`, TRAS = `${R}/research/rejilla/lo-que-tapa-la-traspuesta/motor`;
const Metal = req(`${OBJ}/metal.js`), CuerdaR = req(`${OBJ}/cuerda.js`), Gong = req(`${OBJ}/gong.js`), Piano = req(`${OBJ}/piano.js`);
const Garganta = req(`${TRAS}/garganta.js`), Viento = req(`${TRAS}/viento.js`);
const { BEAT, BAR, tDe, hzP, midiHz, LINEAS, ARMONIA, MELODIA, TROMBON, ARCO, RIOS, LAGOS, CORO, SECCIONES, GARGANTA, VIENTO } = Pt;
const carpeta = process.argv[2], pedidas = process.argv.slice(3);
const sec = (n) => SECCIONES.find((s) => s.nombre === n);
const estereo = (n) => [new Float32Array(n), new Float32Array(n)];
const sumar = (dst, src, desde = 0, g = 1, pan = 0) => { const [L, Rr] = dst, l = g * Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2, r = g * Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2;
  if (Array.isArray(src)) { for (let i = 0; i < src[0].length && i + desde < L.length; i++) if (i + desde >= 0) { L[i + desde] += g * src[0][i]; Rr[i + desde] += g * src[1][i]; } }
  else for (let i = 0; i < src.length && i + desde < L.length; i++) if (i + desde >= 0) { L[i + desde] += l * src[i]; Rr[i + desde] += r * src[i]; } };
const pico = (x) => { let p = 0; for (const c of x) for (const v of c) p = Math.max(p, Math.abs(v)); return p; };
const rms = (a, i0, i1) => { let s = 0; for (let i = i0; i < i1; i++) s += a[i] * a[i]; return Math.sqrt(s / Math.max(1, i1 - i0)); };

// ── voz: la línea de Sabina, recortada ──
let VOZ = null;
const voz = (t0, t1) => {
  VOZ ||= new Float32Array(readFileSync(`${carpeta}/voz.f32`).buffer.slice(0));
  const n = Math.round((t1 - t0) * SR), o = estereo(n), i0 = Math.round(t0 * SR);
  for (let i = 0; i < n; i++) { o[0][i] = VOZ[2 * (i0 + i)] || 0; o[1][i] = VOZ[2 * (i0 + i) + 1] || 0; }
  return o;
};
// ── la armonía: contrabajo (raíz) y viola (el acorde, una octava abajo de sus parciales), arco largo ──
function armonia(t0, t1, { temperada = false } = {}) {
  const dur = t1 - t0, ac = ARMONIA.filter((a) => a.t >= t0 - 1e-6 && a.t < t1);
  const tm = (hz) => (temperada ? Math.round(midiHz(hz)) : midiHz(hz));
  const viola = CuerdaR.render({ dur, instrumento: 'viola', eventos: ac.flatMap((a) => a.tonos.map((x) => ({ t: a.t - t0, m: tm(x.hz / 2), v: 0.42, dur: BAR * 0.97, tipo: 'tasto' }))) }, SR);
  const cb = CuerdaR.render({ dur, instrumento: 'contrabajo', eventos: ac.map((a) => ({ t: a.t - t0, m: tm(a.bajo), v: 0.6, dur: BAR * 0.95, tipo: 'arco' })) }, SR);
  const o = estereo(viola.length); sumar(o, viola, 0, 0.5, 0.25); sumar(o, cb, 0, 0.6, -0.15); return o;
}
// ── la resonancia: Cuerda que recuerda en cada línea del espectro de una época ──
function resonancia(epoca, dur, { A = 3, g = 0.06 } = {}) {
  const n = Math.round(dur * SR), o = estereo(n), lineas = LINEAS[epoca], vistas = new Set();
  lineas.forEach((p, k) => {
    let hz = hzP(p); while (hz > 700) hz /= 2; while (hz < 90) hz *= 2;   // al registro del ensamble
    const clave = Math.round(midiHz(hz) * 4); if (vistas.has(clave)) return; vistas.add(clave);          // el unísono de la meseta suena una vez
    const c = new CuerdaFPUT(SR, { f0: hz, beta: 1, gamma: 0.25, ganancia: 0.35 }); c.c.golpe({ tipo: 'modo1', A });
    const b = new Float32Array(n); c.procesar(b, n); sumar(o, b, 0, g, (k / (lineas.length - 1)) * 1.4 - 0.7);
  });
  return o;
}
// ── trombón ──
const trombon = (a, dur) => Metal.render({ dur, voz: 'trombon', sordina: a.sordina, wah: a.sordina === 'plunger' ? [[0, 0.15], [0.6, 1], [1.6, 0.25]] : undefined, notas: [{ t: 0.02, dur: Math.min(1.8, dur - 0.3), m: midiHz(a.hz), tipo: 'lengua', v: a.v }] }, SR);
// ── el arco: Cuerpo de acción en la nota alta ──
function arco(a) {
  const c = new Cuerpo(SR, { f0: a.hz }), n = Math.round((a.dur + 0.8) * SR), y = new Float32Array(n), F = (u) => { const k = a.F; if (u <= k[0][0]) return k[0][1]; for (let i = 1; i < k.length; i++) if (u <= k[i][0]) { const f = (u - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * f; } return k[k.length - 1][1]; };
  const ven = Math.round(0.1 * SR), vc = new Float64Array(ven), ov = new Float64Array(ven); let d0 = 0; const reg = [];
  for (let i = 0; i < n; i++) {
    const u = i / SR, sonando = u < a.dur;
    if (i % 32 === 0) c.ponerMano({ s: 0.52, F: sonando ? F(u) : 0, v: sonando ? 0.1 : 0, material: 'crin' });
    y[i] = c.muestra(); vc[i % ven] = c.vContacto; ov[i % ven] = y[i];
    if (i % ven === ven - 1) { const m = medir(vc, ov, SR, c.P, c.deslizar - d0); d0 = c.deslizar; if (sonando) reg.push({ t: +u.toFixed(1), F: +F(u).toFixed(2), regimen: m.regimen, desl: +m.porPeriodo.toFixed(2), hz: +m.hz.toFixed(1) }); }
  }
  return { y, reg };
}

const TOMAS = {
  // la voz de máquina en el coro 1, sola
  'voz-coro-1': () => { const s = sec('coro 1'); return { o: voz(tDe(s.desde), tDe(s.hasta)), nota: 'Sabina canta el coro 1: «todavía estamos aquí»; una nota por sílaba, frases cortas.' } },
  // la misma progresión en el estiramiento (coro 1) y en lagos y volcanes (coro 2)
  'progresion-dos-epocas': () => {
    const a = sec('coro 1'), b = sec('coro 2'), x = armonia(tDe(a.desde), tDe(a.desde + 4)), y = armonia(tDe(b.desde), tDe(b.desde + 4));
    const o = estereo(x[0].length + y[0].length + SR); sumar(o, x, 0); sumar(o, y, x[0].length + SR);
    return { o, nota: 'IV–V–iii–vi dos veces: en el estiramiento (coro 1) y en lagos y volcanes (coro 2). Los parciales caen en líneas distintas del terreno.' };
  },
  // ataque y resonancia: las cinco épocas
  'ataques-y-resonancias': () => {
    const d = 5.2, o = estereo(Math.round(5 * d * SR));
    TROMBON.forEach((a, k) => { sumar(o, trombon(a, d), Math.round(k * d * SR), 0.5, 0); sumar(o, resonancia(a.epoca, d - 0.3), Math.round((k * d + 0.35) * SR), 1); });
    return { o, nota: 'Los cinco ataques del trombón (do2), uno por época, y la resonancia que sigue: Cuerda que recuerda en las líneas del espectro de esa época. La meseta es un unísono.' };
  },
  // el arco en las tres notas altas
  'arco-tres-notas-altas': () => {
    const partes = ARCO.map(arco), o = estereo(partes.reduce((s, p) => s + p.y.length + SR / 2, 0)); let i = 0;
    partes.forEach((p) => { sumar(o, p.y, i, 0.9, 0); i += p.y.length + SR / 2; });
    return { o, nota: 'Cuerpo de acción en mi3, dos octavas bajo la nota alta de cada coro (la altura de la meseta): dentro de la isla, sacado de la isla, y llegado por rampa.', medidas: ARCO.map((a, k) => ({ seccion: a.seccion, modo: a.modo, regimen: partes[k].reg })) };
  },
  // el coro inaudible: el golpe del principio y las puertas del final (la simulación corre toda la canción)
  'coro-inaudible': () => {
    const c = new Coro(SR, disenar({ base: CORO.base, armonicos: CORO.armonicos }), { gammaInterna: CORO.gammaInterna });
    const t1 = CORO.puertas + 2 * BAR + 4, n = Math.round(t1 * SR), A = estereo(Math.round(9 * SR)), B = estereo(Math.round((t1 - CORO.puertas + 2) * SR));
    const iG = Math.round(CORO.golpe * SR), iP = Math.round(CORO.puertas * SR), guard = [];
    for (let i = 0; i < n; i++) {
      if (i === iG) c.golpear(0, 1); if (i === iP) c.mover(0, CORO.cm);
      const o = c.muestra();
      if (i < A[0].length) { A[0][i] = o.izq; A[1][i] = o.der; }
      const j = i - (iP - 2 * SR); if (j >= 0 && j < B[0].length) { B[0][j] = o.izq; B[1][j] = o.der; }
      if (i % (SR * 10) === 0) guard.push([+(i / SR).toFixed(0), +c.guardada().toFixed(4)]);
    }
    const o = estereo(A[0].length + SR + B[0].length); sumar(o, A, 0, 0.5); sumar(o, B, A[0].length + SR, 0.5);
    return { o, nota: `El golpe del compás 1 (la sala oye el espejo 9 : 11 : 13) y, ${(CORO.puertas - 9).toFixed(0)} s después, las puertas del compás 65: sale el I guardado (do4 · mi4 · sol4).`, medidas: { guardada: guard } };
  },
  // los ríos: la trompeta con harmon
  rios: () => {
    const a = sec('verso 2'), t0 = tDe(a.desde), t1 = t0 + 20, rs = RIOS.filter((r) => r.t < t1);
    const y = Metal.render({ dur: t1 - t0 + 2, voz: 'trompeta', sordina: 'harmon', notas: rs.map((r) => ({ t: r.t - t0, dur: r.dur, m: midiHz(r.hzDe), m2: midiHz(r.hzA), tipo: 'normal', v: r.v })) }, SR);
    const o = estereo(y.length); sumar(o, y, 0, 0.6, 0); return { o, nota: `Los primeros ${rs.length} ríos del verso 2: glisandos de trompeta con harmon de un hombro (12,4 o 14,9) a un lago del fondo (6,0 · 6,1 · 10,0 parciales).` };
  },
  // los lagos: el gong se llena en el pre-coro 2; el lago colgado en el coro 2
  lagos: () => {
    const a = sec('pre-coro 2'), t0 = tDe(a.desde), t1 = tDe(sec('coro 2').desde + 3) + 4, ls = LAGOS.filter((l) => l.t >= t0 && l.t < t1);
    const y = Gong.render({ dur: t1 - t0, semilla: 40, eventos: ls.map((l) => (l.tipo === 'tamtam' ? { t: l.t - t0, tipo: 'tamtam', m: midiHz(l.hz), v: l.v, dureza: 0.3 } : { t: l.t - t0, tipo: 'cruce', m: midiHz(l.hz), v: l.v, abre: 1.5 })) }, SR);
    const o = estereo(y.length); sumar(o, y, 0, 0.5, 0); return { o, nota: 'Pre-coro 2: los mensajes llegan a los lagos del fondo y el gong se llena (la bandeja de moderación). En el coro 2, el lago colgado (13,2 parciales): el gong de dos alturas que se cruzan.' };
  },
  // el puente: la garganta con el corte del rift y el viento sobre la supercaldera, con la voz
  puente: () => {
    const s = sec('puente'), t0 = tDe(s.desde), dur = tDe(s.hasta) - t0, aCorte = (c) => { const mn = Math.min(...c), mx = Math.max(...c); return Float32Array.from(c, (x) => 0.15 + 0.85 * (x - mn) / (mx - mn)); };
    const g = Garganta.render({ dur, largo: GARGANTA.largo, perfil: aCorte(GARGANTA.cortes[3]), perfiles: [[0, aCorte(GARGANTA.cortes[3])], [dur * 0.7, aCorte(GARGANTA.cortes[4])]],
      eventos: [0, 2, 4, 6].map((k) => ({ t: k * BAR, dur: 2 * BAR - 0.2, nota: midiHz(hzP(LINEAS[4][0]) / 2), fonemas: [['a'], ['o'], ['a'], ['u']][k / 2], v: 0.5, aprende: 0.25, ronco: 0.4 })) }, SR);
    const w = Viento.render({ dur, perfiles: [[0, aCorte(VIENTO.corte)]], vel: [[0, 4], [dur / 2, 9], [dur, 5]], estria: [[0, 0]], semilla: 40 }, SR);
    const o = estereo(g.length); sumar(o, g, 0, 0.18, 0); sumar(o, [w.L, w.R], 0, 0.1); sumar(o, voz(t0, t0 + dur), 0, 0.7);
    return { o, nota: 'El puente desnudo: la Garganta de montaña con el corte del rift (época IV → V) en el piso (do3), el Viento sobre la supercaldera y Sabina: «encontré la página otra vez… tres veces».' };
  },
  // la prueba de la pregunta 5: el coro convencional contra el nuestro
  'coro-convencional': () => {
    const s = sec('coro 1'), t0 = tDe(s.desde), t1 = tDe(s.hasta), dur = t1 - t0;
    const ac = ARMONIA.filter((a) => a.t >= t0 && a.t < t1);
    const pn = Piano.render({ dur: dur + 2, eventos: ac.flatMap((a) => [...a.tonos.map((x) => ({ t: a.t - t0, m: Math.round(midiHz(x.hz / 2)), v: 0.4, dur: BAR })), { t: a.t - t0, m: Math.round(midiHz(a.bajo)), v: 0.5, dur: BAR }]) }, SR);
    const o = estereo(pn.length); sumar(o, pn, 0, 0.35, 0); sumar(o, armonia(t0, t1, { temperada: true }), 0, 0.5);
    // la voz convencional: la misma melodía, temperada (Sabina otra vez, pero redondeada: se anota, no se rehace aquí)
    sumar(o, voz(t0, t1), 0, 0.8);
    return { o, nota: 'Coro 1 «convencional»: piano y cuerdas en temperamento igual, la progresión sin terreno. (La voz es la misma toma justa: su diferencia con el temperado es de −14 a +4 cents.)' };
  },
  'coro-espectral': () => {
    const s = sec('coro 1'), t0 = tDe(s.desde), t1 = tDe(s.hasta), dur = t1 - t0;
    const o = estereo(Math.round((dur + 2) * SR)); sumar(o, armonia(t0, t1), 0, 0.5); sumar(o, resonancia(1, dur + 2, { g: 0.03 }), 0, 1); sumar(o, voz(t0, t1), 0, 0.8);
    const a = ARCO[0], r = arco(a); sumar(o, r.y, Math.round((a.t - t0) * SR), 0.5, 0.1);
    return { o, nota: 'Coro 1 nuestro: la progresión caída en el estiramiento, la resonancia del espectro de la época y el arco en la nota alta (dentro de la isla).' };
  },
};

const res = {};
for (const nombre of pedidas.length ? pedidas : Object.keys(TOMAS)) {
  const t = Date.now(), { o, nota, medidas } = TOMAS[nombre](), p = pico(o), g = p > 0 ? 0.89 / p : 1;
  const n = o[0].length, b = Buffer.alloc(44 + n * 4), q = (x) => Math.round(Math.max(-1, Math.min(1, x * g)) * 32767);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(q(o[0][i]), 44 + i * 4); b.writeInt16LE(q(o[1][i]), 46 + i * 4); }
  const sha = createHash('sha256').update(b).digest('hex').slice(0, 12);
  writeFileSync(`${carpeta}/${nombre}.wav`, b);
  res[nombre] = { sha, segundos: +(n / SR).toFixed(1), nota, medidas };
  console.log(`${nombre.padEnd(24)} ${(n / SR).toFixed(1)} s  ${((Date.now() - t) / 1000).toFixed(0)} s de cálculo  ${sha}`);
}
writeFileSync(`${carpeta}/tomas.json`, JSON.stringify(res, null, 1));
