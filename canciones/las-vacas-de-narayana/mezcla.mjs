// mezcla.mjs — los stems de «Las vacas de Narayana» (instrumentos de JavaScript), la mezcla y el espacio.
//   node mezcla.mjs <carpeta> stems [clave…]   → <carpeta>/stems/<clave>.f32   (los de Python: python3 tt.py <carpeta>)
//   node mezcla.mjs <carpeta> mezcla           → <carpeta>/mezcla.wav, stems-mezcla/, mezcla.json
// Cada evento marcado «acción» (Lachenmann) se vuelve la técnica concreta de su instrumento.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import * as Pt from './partitura.mjs';
import { Coro, disenar } from '../../instrumentos/coro-inaudible/motor.mjs';
import { Cuerpo } from '../../instrumentos/cuerpo-de-accion/motor.mjs';
import { Cuerda as CuerdaFPUT } from '../../instrumentos/cuerda-que-recuerda/motor.mjs';
import { Sampleador } from '../../instrumentos/sampleador-espacio-tiempo/motor.mjs';
import { Trompo, PATRONES } from '../../instrumentos/trompo/motor.mjs';

const SR = 48000, R = process.env.REJILLA || '/home/user/canekzapata/rejilla', req = createRequire(import.meta.url);
const OBJ = `${R}/research/rejilla/objetos/motor`, TRAS = `${R}/research/rejilla/lo-que-tapa-la-traspuesta/motor`;
const Metal = req(`${OBJ}/metal.js`), CuerdaR = req(`${OBJ}/cuerda.js`), Gong = req(`${OBJ}/gong.js`), Piano = req(`${OBJ}/piano.js`), Clarinete = req(`${OBJ}/clarinete.js`),
  Tambor = req(`${OBJ}/tambor.js`), Pajaro = req(`${OBJ}/pajaro.js`), Agua = req(`${OBJ}/agua.js`), VozAgua = req(`${OBJ}/vozagua.js`), Waterphone = req(`${OBJ}/waterphone.js`),
  Garganta = req(`${TRAS}/garganta.js`), Viento = req(`${TRAS}/viento.js`);
const { PARTES, LISTA, SECCIONES, CORO, BAR, BEAT, tDe, CONCRECION, N } = Pt;
const [carpeta, modo] = process.argv.slice(2);
const DUR = Pt.tDe(Pt.COMPASES + 1) + 4, NS = Math.round(DUR * SR);
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const mono = (y) => { const o = [new Float32Array(NS), new Float32Array(NS)]; for (let i = 0; i < Math.min(NS, y.length); i++) { o[0][i] = y[i]; o[1][i] = y[i]; } return o; };
const P = (k) => PARTES[k];
const ventanas = (ev, win, f) => { const o = new Float32Array(NS); for (const e of ev) { const y = f(e), i0 = Math.round(e.t * SR); for (let i = 0; i < y.length && i0 + i < NS; i++) o[i0 + i] += y[i] * Math.min(1, (y.length - i) / 2400); } return mono(o); };
// los números del tambor, en palabras
const TXT = ['una', 'dos', 'tres', 'cuatro', 'seis', 'nueve', 'trece', 'diecinueve', 'veintiocho', 'cuarenta y una', 'sesenta', 'ochenta y ocho', 'ciento veintinueve', 'ciento ochenta y nueve', 'doscientas setenta y siete', 'cuatrocientas seis', 'quinientas noventa y cinco', 'ochocientas setenta y dos', 'mil doscientas setenta y ocho', 'mil ochocientas setenta y tres', 'dos mil setecientas cuarenta y cinco'];
const cuerdaR = (inst, tipoNota, tipoAccion, extra = {}) => mono(CuerdaR.render({ dur: DUR, instrumento: inst, eventos: P(extra.clave || inst).map((e) => ({ t: e.t, m: e.m, v: e.v, dur: e.dur, tipo: e.accion ? tipoAccion : tipoNota, casa: extra.casa || 0 })) }, SR));
const metal = (voz) => mono(Metal.render({ dur: DUR, voz, sordina: 'abierta', notas: P(voz).map((e) => ({ t: e.t, dur: e.dur, m: e.m, tipo: e.accion ? 'aire' : 'lengua', v: e.v })) }, SR));

const STEMS = {
  piano: () => mono(Piano.render({ dur: DUR, eventos: P('piano').map((e) => ({ t: e.t, m: e.m, v: e.v, dur: e.dur, tipo: e.accion ? 'caja' : 'apagada' })) }, SR)),
  contrabajo: () => cuerdaR('contrabajo', 'pizz', 'bartok'),
  violin: () => cuerdaR('violin', 'pizz', 'legno', { casa: 0.35 }),
  viola: () => cuerdaR('viola', 'arco', 'ponticello'),
  chelo: () => cuerdaR('chelo', 'arco', 'ponticello'),
  trombon: () => metal('trombon'), trompeta: () => metal('trompeta'),
  clarinete: () => mono(Clarinete.render({ dur: DUR, eventos: P('clarinete').map((e) => ({ t: e.t, m: e.m, v: e.v, dur: e.dur, tipo: e.accion ? 'llaves' : 'normal' })) }, SR)),
  tambor: () => mono(Tambor.render({ dur: DUR, semilla: 1356, eventos: P('tambor').map((e) => ({ t: e.t, tipo: 'habla', texto: TXT[e.ano], m: e.m, dur: 0.15, v: e.v, alto: 3 })) }, SR)),
  garganta: () => { const perfil = Float32Array.from({ length: 64 }, (_, i) => 0.3 + 0.7 * Math.sin(Math.PI * i / 63) ** 2); // un cuerpo de vaca: angosto en los extremos
    return mono(Garganta.render({ dur: DUR, largo: 3, perfil, eventos: P('garganta').map((e) => ({ t: e.t, dur: e.dur, nota: e.m, fonemas: e.accion ? ['u'] : ['m', 'u'], v: e.v, aprende: e.accion ? 0 : 0.55, ronco: e.accion ? 0.9 : 0.3 })) }, SR)); },
  cuerpo: () => { // el raspado del anclaje estriado: el skank como acción concreta
    const c = new Cuerpo(SR), y = new Float32Array(NS), ev = P('cuerpo'); let k = 0, fin = -1;
    for (let i = 0; i < NS; i++) { const t = i / SR; while (k < ev.length && ev[k].t <= t) { fin = ev[k].t + ev[k].dur; k++; } if (i % 32 === 0) c.ponerMano(t < fin ? { s: 0.05, F: 1.2, v: 0.25, material: 'una' } : { F: 0, v: 0 }); y[i] = c.muestra(); }
    return mono(y); },
  // el gong, evento por evento en ventanas de 4 s (de una vez, 487 golpes tardaban más de 10 minutos)
  tamtam: () => ventanas(P('tamtam'), 4, (e) => Gong.render({ dur: 4, semilla: 6, eventos: [e.accion ? { t: 0.01, tipo: 'roce', dur: 0.2, v: 0.95 } : { t: 0.01, tipo: 'roce', dur: e.dur, v: e.v }] }, SR)),
  opera: () => ventanas(P('opera'), 4, (e) => Gong.render({ dur: 4, semilla: 7, eventos: [e.accion ? { t: 0.01, tipo: 'cruce', m: e.m, v: e.v, abre: 2 } : { t: 0.01, tipo: 'opera', m: e.m, v: e.v, sube: -3.5 }] }, SR)),
  pajaro: () => mono(Pajaro.render({ dur: DUR, eventos: P('pajaro').map((e) => (e.accion ? { t: e.t, tipo: 'pico', v: e.v } : { t: e.t, tipo: 'silbido', m: e.m, m2: e.m - 5, dur: e.dur, v: e.v })) }, SR)),
  agua: () => mono(Agua.render({ dur: DUR, eventos: P('agua').map((e) => (e.accion ? { t: e.t, tipo: 'guiro', m: e.m, v: e.v, dur: 0.25, n: 7 } : { t: e.t, tipo: 'gota', m: e.m, v: e.v })) }, SR)),
  vozagua: () => mono(VozAgua.render({ dur: DUR, eventos: P('vozagua').map((e, i) => ({ t: e.t, dur: Math.max(0.25, e.dur), texto: ['mu', 'va', 'ca'][i % 3], nota: e.m, modo: e.accion ? 'susurro' : 'canto', voz: 0.9, v: e.v })) }, SR)),
  waterphone: () => mono(Waterphone.render({ dur: DUR, semilla: 1356, eventos: P('waterphone').map((e) => (e.accion ? { t: e.t, tipo: 'bola', m: e.m, dur: e.dur, v: e.v } : { t: e.t, tipo: 'arco', m: e.m, dur: e.dur, v: e.v })) }, SR)),
  fput: () => { const o = new Float32Array(NS); for (const e of P('fput')) { const c = new CuerdaFPUT(SR, { f0: hz(e.m), beta: 1, gamma: 0.15, ganancia: 0.35 }); c.c.golpe({ tipo: 'modo1', A: e.accion ? 9 : 3 }); const n = Math.round(e.dur * SR), y = new Float32Array(n); c.procesar(y, n); const i0 = Math.round(e.t * SR); for (let i = 0; i < n && i0 + i < NS; i++) o[i0 + i] += y[i] * Math.min(1, (n - i) / (0.3 * SR)); } return mono(o); },
  sampleador: () => { // lee la cuerda tres tiempos atrás (el «hace tres años» de la recurrencia, en pequeño)
    const s = new Sampleador(SR, { f: 110, tau0: 3 * BEAT, historia: 6, g: 3, alfa: 0.4, ganancia: 1.2, suelta: 0.4 }), y = new Float32Array(NS), ev = P('sampleador'); let k = 0, fin = -1;
    for (let i = 0; i < NS; i += 128) { const t = i / SR; while (k < ev.length && ev[k].t <= t) { s.p.f = hz(ev[k].m); s.h.pulsar(0.3, ev[k].accion ? 0.8 : 0.4); s.gate = 1; fin = ev[k].t + ev[k].dur; k++; } if (t > fin) s.gate = 0; s.procesar(y, Math.min(128, NS - i), i); }
    return mono(y); },
  trompo: () => { // cada año la mano lo hace girar y lo suelta: sus impulsos se espacian mientras se frena
    const tr = new Trompo(SR, { ganancia: 0.5 }, PATRONES.ritmo()), y = new Float32Array(NS), ev = P('trompo'); let k = 0, suelta = -1;
    for (let i = 0; i < NS; i += 128) { const t = i / SR; while (k < ev.length && ev[k].t <= t) { tr.ponerEntrada({ mano: true, wMano: ev[k].vueltas, presion: 1 }); suelta = t + 0.5; k++; } if (suelta > 0 && t > suelta) { tr.ponerEntrada({ mano: false }); suelta = -1; } tr.procesar(y, Math.min(128, NS - i), i); }
    return mono(y); },
  viento: () => { const ev = P('viento'), t0 = ev[0].t, perfil = Float32Array.from({ length: 64 }, (_, i) => 0.2 + 0.8 * Math.abs(Math.sin(i * 0.37) * Math.cos(i * 0.11)));
    const w = Viento.render({ dur: DUR - t0, perfiles: [[0, perfil]], vel: ev.map((e) => [e.t - t0, 3 + 10 * e.v]), estria: [[0, 0]], semilla: 1356 }, SR);
    const o = [new Float32Array(NS), new Float32Array(NS)], i0 = Math.round(t0 * SR); for (let i = 0; i < w.L.length && i0 + i < NS; i++) { o[0][i0 + i] = w.L[i]; o[1][i0 + i] = w.R[i]; } return o; },
  coro: () => { const c = new Coro(SR, disenar({ base: CORO.base, armonicos: CORO.armonicos }), { gammaInterna: CORO.gammaInterna }), o = [new Float32Array(NS), new Float32Array(NS)];
    const iG = Math.round(CORO.golpe * SR), iP = Math.round(CORO.puertas * SR); for (let i = 0; i < NS; i++) { if (i === iG) c.golpear(0, 1); if (i === iP) c.mover(0, CORO.cm); if (i < iG) continue; const x = c.muestra(); o[0][i] = x.izq; o[1][i] = x.der; } return o; },
  ...Object.fromEntries(['principal', 'alta', 'baja'].map((capa) => [`voz-${capa}`, () => { const V = new Float32Array(readFileSync(`${carpeta}/voz-${capa}.f32`).buffer.slice(0)), m = new Float32Array(NS); for (let i = 0; i < NS && 2 * i + 1 < V.length; i++) m[i] = (V[2 * i] + V[2 * i + 1]) / 2; return mono(m); }])),
};

// la mezcla: dB sobre un mismo nivel activo, paneo, envío al espacio (por función)
const FUN = Object.fromEntries(LISTA.map((x) => [x.clave, x.funcion]));
const BASE = { skank: -7, bajo: -4, bateria: -4, riff: -6, pad: -13, manada: -13, cuenta: -6, memoria: -13, trompo: -15, viento: -17, coro: -9 };
export const MEZCLA = Object.fromEntries([...LISTA.map((x) => [x.clave, [BASE[x.funcion] + ({ cuerpo: -4, androide: -3, organo: -2, fotones: 1 }[x.clave] || 0), { skank: 0.2, bajo: 0.1, bateria: 0.15, riff: 0.3, pad: 0.4, manada: 0.4, cuenta: 0.25, memoria: 0.4, trompo: 0.3, viento: 0.3, coro: 0.3 }[x.funcion]]]),
  ['voz-principal', [0, 0.25]], ['voz-alta', [-5, 0.3]], ['voz-baja', [-5, 0.3]]]);
// automatización por sección (dB): las voces suben mientras crece la manada, más en los coros (la pregunta y la cuenta
// se tienen que entender aunque suenen 35 instrumentos)
const VOZ_AUT = (sc) => sc.nombre === 'intro' ? -3 : sc.nombre.startsWith('coro') ? 9 : sc.ano >= 17 ? 5 : sc.ano >= 9 ? 7 : sc.ano >= 4 ? 4 : sc.ano >= 2 ? 2 : 0;
export const AUTOM = Object.fromEntries(['voz-principal', 'voz-alta', 'voz-baja'].map((k) => [k, Object.fromEntries(SECCIONES.map((sc) => [sc.nombre, VOZ_AUT(sc)]))]));
// el paneo: el ska como en un escenario (skank del piano a la derecha, órgano a la izquierda, ritmo al centro); la
// manada repartida por número de vaca
const PAN = { piano: 0.45, organo: -0.45, violin: 0.6, contrabajo: 0, fotones: 0, androide: 0, trombon: -0.3, trompeta: 0.3, clarinete: 0.1, tambor: -0.15, 'voz-principal': 0, 'voz-alta': -0.35, 'voz-baja': 0.35, coro: 0, viento: 0, cuerpo: 0.25 };
const panDe = (k) => PAN[k] ?? Math.sin(LISTA.findIndex((x) => x.clave === k) * 2.39) * 0.8;
// el espacio: el RT60 crece con la concreción (la manada llena el establo): 0,8 s + 0,8 s · concreción
function espacio(entrada) {
  const L = [1031, 1327, 1523, 1871, 2053, 2311, 2647, 2939], b = L.map((n) => new Float32Array(n)), w = new Int32Array(8), lp = new Float32Array(8), out = [new Float32Array(NS), new Float32Array(NS)], y = new Float32Array(8);
  const rtEn = (t) => { const c = Math.max(1, Math.min(Pt.COMPASES, Math.floor(t / BAR) + 1)); return 0.8 + 0.8 * CONCRECION(Pt.anoEn(c)); };
  let rt = rtEn(0);
  for (let i = 0; i < NS; i++) {
    if (i % 256 === 0) rt += (rtEn(i / SR) - rt) * 0.01;
    let s = 0; for (let j = 0; j < 8; j++) { y[j] = b[j][w[j]]; s += y[j]; } s *= 2 / 8; const x = (entrada[0][i] + entrada[1][i]) * 0.5;
    for (let j = 0; j < 8; j++) { const g = 10 ** (-3 * L[j] / (SR * rt)); lp[j] += 0.35 * ((y[j] - s) - lp[j]); b[j][w[j]] = x * (j % 2 ? 0.5 : -0.5) + g * (0.6 * lp[j] + 0.4 * (y[j] - s)); w[j] = (w[j] + 1) % L[j]; }
    out[0][i] = (y[0] - y[2] + y[4] - y[6]) * 0.35; out[1][i] = (y[1] - y[3] + y[5] - y[7]) * 0.35;
  }
  return out;
}

if (modo === 'stems') {
  mkdirSync(`${carpeta}/stems`, { recursive: true });
  for (const k of process.argv.slice(4).length ? process.argv.slice(4) : Object.keys(STEMS)) {
    const t0 = Date.now(), o = STEMS[k](), x = new Float32Array(2 * NS); let p = 0; for (let i = 0; i < NS; i++) { x[2 * i] = o[0][i]; x[2 * i + 1] = o[1][i]; p = Math.max(p, Math.abs(o[0][i])); }
    writeFileSync(`${carpeta}/stems/${k}.f32`, Buffer.from(x.buffer)); console.log(`${k.padEnd(14)} pico ${p.toFixed(3)}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
} else if (modo === 'mezcla') {
  const total = [new Float32Array(NS), new Float32Array(NS)], envio = [new Float32Array(NS), new Float32Array(NS)], por = {}, falta = [];
  for (const [k, [db, env]] of Object.entries(MEZCLA)) {
    if (!existsSync(`${carpeta}/stems/${k}.f32`)) { falta.push(k); continue; }
    const xb = readFileSync(`${carpeta}/stems/${k}.f32`), x = new Float32Array(xb.buffer, xb.byteOffset, Math.min(2 * NS, xb.length / 4)), s = [new Float32Array(NS), new Float32Array(NS)];
    let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v));
    let e = 0, n = 0; const W = 2400; for (let i = 0; i + W <= x.length / 2; i += W) { let q = 0; for (let j = i; j < i + W; j++) q += (x[2 * j] ** 2 + x[2 * j + 1] ** 2) / 2; q /= W; if (q > (pk * 0.00316) ** 2) { e += q; n++; } }
    const g = (0.1 * 10 ** (db / 20)) / (Math.sqrt(e / Math.max(1, n)) || 1), pan = panDe(k), gl = Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2, gr = Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2;
    const cur = new Float32Array(NS).fill(1), au = AUTOM[k];
    if (au) { for (const sc of SECCIONES) { const v = 10 ** ((au[sc.nombre] || 0) / 20); for (let i = Math.round(tDe(sc.desde) * SR); i < Math.min(NS, Math.round(tDe(sc.hasta) * SR)); i++) cur[i] = v; } let yv = cur[0]; const kk = 1 - Math.exp(-3 / (0.3 * SR)); for (let i = 0; i < NS; i++) { yv += (cur[i] - yv) * kk; cur[i] = yv; } }
    for (let i = 0; i < x.length / 2; i++) { const m = (x[2 * i] + x[2 * i + 1]) / 2, d = (x[2 * i] - x[2 * i + 1]) / 2, gg = g * cur[i]; s[0][i] = gg * (gl * m + d); s[1][i] = gg * (gr * m - d); total[0][i] += s[0][i]; total[1][i] += s[1][i]; envio[0][i] += env * s[0][i]; envio[1][i] += env * s[1][i]; }
    por[k] = s;
  }
  const rev = espacio(envio); for (let i = 0; i < NS; i++) { total[0][i] += rev[0][i]; total[1][i] += rev[1][i]; }
  const db = (v) => 10 * Math.log10(v + 1e-20), canta = new Uint8Array(NS);
  for (const v of Object.values(Pt.VOCES)) for (const n of v) for (let i = Math.round(n.t * SR); i < Math.round((n.t + n.durS) * SR) && i < NS; i++) canta[i] = 1;
  const vozT = ['voz-principal', 'voz-alta', 'voz-baja'].filter((k) => por[k]);
  const informe = SECCIONES.map((sc) => {
    const i0 = Math.round(tDe(sc.desde) * SR), i1 = Math.min(NS, Math.round(tDe(sc.hasta) * SR)); let v = 0, r = 0, nv = 0, tot = 0;
    for (let i = i0; i < i1; i++) { let a = 0; for (const k of vozT) a += (por[k][0][i] ** 2 + por[k][1][i] ** 2) / 2; const t = (total[0][i] ** 2 + total[1][i] ** 2) / 2; tot += t; if (canta[i]) { v += a; r += Math.max(0, t - a); nv++; } }
    const activos = Object.entries(por).filter(([, x]) => { let e = 0; for (let i = i0; i < i1; i += 64) e += x[0][i] ** 2; return e > 1e-9; }).length;
    return { seccion: sc.nombre, ano: sc.ano, vacas: N[sc.ano], instrumentos_sonando: activos, total_db: +db(tot / (i1 - i0)).toFixed(1), voces_sobre_resto_db: nv ? +(db(v / nv) - db(r / nv)).toFixed(1) : null };
  });
  let p = 0; for (const c of total) for (const v of c) p = Math.max(p, Math.abs(v));
  const g = 0.5 / p, b = Buffer.alloc(44 + NS * 4), q = (x) => Math.round(Math.max(-1, Math.min(1, x * g)) * 32767);
  b.write('RIFF', 0); b.writeUInt32LE(36 + NS * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(NS * 4, 40);
  for (let i = 0; i < NS; i++) { b.writeInt16LE(q(total[0][i]), 44 + i * 4); b.writeInt16LE(q(total[1][i]), 46 + i * 4); }
  writeFileSync(`${carpeta}/mezcla.wav`, b);
  mkdirSync(`${carpeta}/stems-mezcla`, { recursive: true });
  for (const [k, x] of [...Object.entries(por), ['espacio', rev]]) { const y = Buffer.alloc(NS * 8); for (let i = 0; i < NS; i++) { y.writeFloatLE(x[0][i] * g, 8 * i); y.writeFloatLE(x[1][i] * g, 8 * i + 4); } writeFileSync(`${carpeta}/stems-mezcla/${k}.f32`, y); }
  writeFileSync(`${carpeta}/mezcla.json`, JSON.stringify({ mezcla: MEZCLA, automatizacion: AUTOM, faltan: falta, informe }, null, 1));
  if (falta.length) console.log('FALTAN stems:', falta.join(' '));
  for (const s of informe) console.log(s.seccion.padEnd(11), 'año', String(s.ano).padStart(2), 'vacas', String(s.vacas).padStart(4), '· instrumentos', String(s.instrumentos_sonando).padStart(2), '· total', String(s.total_db).padStart(6), '· voces sobre el resto', s.voces_sobre_resto_db);
}
