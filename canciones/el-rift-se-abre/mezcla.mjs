// mezcla.mjs — los stems completos de «El rift se abre», la mezcla y el espacio.
//   node mezcla.mjs <carpeta> stems     → <carpeta>/stems/<stem>.f32 (estéreo intercalado, 48 kHz, seco)
//   node mezcla.mjs <carpeta> mezcla    → <carpeta>/mezcla.wav (antes del master) y mezcla.json (niveles por sección)
// Necesita <carpeta>/voz.f32 (node voz.cjs). El master (−14 LUFS, pico verdadero −1 dBTP) lo hace ffmpeg: ver README.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import * as Pt from './partitura.mjs';
import { Coro, disenar } from '../../instrumentos/coro-inaudible/motor.mjs';
import { Cuerpo } from '../../instrumentos/cuerpo-de-accion/motor.mjs';
import { Cuerda as CuerdaFPUT } from '../../instrumentos/cuerda-que-recuerda/motor.mjs';

const SR = 48000, R = process.env.REJILLA || '/home/user/canekzapata/rejilla', req = createRequire(import.meta.url);
const OBJ = `${R}/research/rejilla/objetos/motor`, TRAS = `${R}/research/rejilla/lo-que-tapa-la-traspuesta/motor`;
const Metal = req(`${OBJ}/metal.js`), CuerdaR = req(`${OBJ}/cuerda.js`), Gong = req(`${OBJ}/gong.js`), VozAgua = req(`${OBJ}/vozagua.js`), Tambor = req(`${OBJ}/tambor.js`), Pajaro = req(`${OBJ}/pajaro.js`), Garganta = req(`${TRAS}/garganta.js`), Viento = req(`${TRAS}/viento.js`);
const { T, BAR, tDe, hzP, midiHz, LINEAS, ARMONIA, TROMBON, ARCO, RIOS, LAGOS, CORO, SECCIONES, GARGANTA, GARGANTAS, VIENTO, PULSOS, ESPACIO, TAMBOR } = Pt;
const [carpeta, modo] = process.argv.slice(2);
const DUR = Pt.tDe(Pt.COMPASES + 1) + 4, N = Math.round(DUR * SR), K = T.anchoKm;
const nuevo = () => [new Float32Array(N), new Float32Array(N)];
const panLR = (pan) => [Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2, Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2];
const poner = (dst, src, desde, g = 1, pan = 0) => { const i0 = Math.round(desde * SR), [l, r] = panLR(pan);
  if (Array.isArray(src)) { for (let i = 0; i < src[0].length && i0 + i < N; i++) if (i0 + i >= 0) { dst[0][i0 + i] += g * src[0][i]; dst[1][i0 + i] += g * src[1][i]; } }
  else for (let i = 0; i < src.length && i0 + i < N; i++) if (i0 + i >= 0) { dst[0][i0 + i] += g * l * src[i]; dst[1][i0 + i] += g * r * src[i]; } };
const fundir = (y, ms = 30) => { const k = Math.round(ms * SR / 1000); for (let i = 0; i < k && i < y.length; i++) { const f = i / k; y[i] *= f; y[y.length - 1 - i] *= f; } return y; };
// el lugar de cada rasgo en el corte (oeste → este) es su paneo
const panDe = (nombre) => { const r = T.rasgos.find((x) => x.nombre === nombre), u = Array.isArray(r.km) ? r.km[0] : r.km; return Math.max(-0.9, Math.min(0.9, 2 * u / K - 1)); };

const STEMS = {
  ...Object.fromEntries([['voz', 'principal', 0], ['voz-alta', 'alta', -0.35], ['voz-baja', 'baja', 0.35]].map(([n, capa, pan]) => [n, () => {
    const V = new Float32Array(readFileSync(`${carpeta}/voz-${capa}.f32`).buffer.slice(0)), m = new Float32Array(N); for (let i = 0; i < N && 2 * i + 1 < V.length; i++) m[i] = (V[2 * i] + V[2 * i + 1]) / 2;
    const o = nuevo(); poner(o, m, 0, 1, pan); return o; }])),
  // el coro de gargantas: tres Gargantas, una por tono del acorde, con el corte del rift de cada época de tubo
  gargantas: () => {
    const o = nuevo(), aCorte = (c) => { const mn = Math.min(...c), mx = Math.max(...c); return Float32Array.from(c, (x) => (mx - mn < 1 ? 0.6 : 0.15 + 0.85 * (x - mn) / (mx - mn))); };
    const perfiles = SECCIONES.map((sc) => [tDe(sc.desde), aCorte(GARGANTA.cortes[sc.epoca])]);
    GARGANTAS.forEach((linea, k) => { const y = Garganta.render({ dur: DUR, largo: 1, perfil: perfiles[0][1], perfiles, eventos: linea.map((e) => ({ ...e, t: e.t + 0.01 })) }, SR); poner(o, y, 0, 1, [-0.45, 0, 0.45][k]); });
    return o;
  },
  tambor: () => { const o = nuevo(); poner(o, Tambor.render({ dur: DUR, semilla: 40, eventos: TAMBOR }, SR), 0, 1, -0.1); return o; },
  viola: () => { const y = CuerdaR.render({ dur: DUR, instrumento: 'viola', eventos: ARMONIA.flatMap((a) => a.tonos.map((x) => ({ t: a.t, m: midiHz(x.hz / 2), v: 0.42, dur: BAR * 0.97, tipo: 'tasto' }))) }, SR); const o = nuevo(); poner(o, y, 0, 1, 0.25); return o; },
  contrabajo: () => { const y = CuerdaR.render({ dur: DUR, instrumento: 'contrabajo', eventos: ARMONIA.map((a) => ({ t: a.t, m: midiHz(a.bajo), v: 0.6, dur: BAR * 0.95, tipo: 'arco' })) }, SR); const o = nuevo(); poner(o, y, 0, 1, -0.15); return o; },
  resonancia: () => {
    const o = nuevo();
    PULSOS.forEach((p, k) => {
      const hasta = k + 1 < PULSOS.length ? PULSOS[k + 1].t : DUR - 3, dur = hasta - p.t + 2.5, n = Math.round(dur * SR), vistas = new Set();
      LINEAS[p.epoca].forEach((l, j) => {
        let hz = hzP(l); while (hz > 700) hz /= 2; while (hz < 90) hz *= 2;
        const clave = Math.round(midiHz(hz) * 4); if (vistas.has(clave)) return; vistas.add(clave);
        const c = new CuerdaFPUT(SR, { f0: hz, beta: 1, gamma: 0.12, ganancia: 0.35 }); c.c.golpe({ tipo: 'modo1', A: p.A });
        const y = new Float32Array(n); c.procesar(y, n); const f = Math.round(2.5 * SR); for (let i = 0; i < f; i++) y[n - 1 - i] *= i / f; // se funde con la siguiente sección
        poner(o, y, p.t, 0.05, panDe(T.rasgos[j].nombre));
      });
    });
    return o;
  },
  trombon: () => { const o = nuevo(); for (const a of TROMBON) poner(o, Metal.render({ dur: 6, voz: 'trombon', sordina: a.sordina, wah: a.sordina === 'plunger' ? [[0, 0.15], [0.6, 1], [1.6, 0.25]] : undefined, notas: [{ t: 0.02, dur: 1.8, m: midiHz(a.hz), tipo: 'lengua', v: a.v }] }, SR), a.t, 1, 0); return o; },
  arco: () => {
    const o = nuevo();
    for (const a of ARCO) {
      const c = new Cuerpo(SR, { f0: a.hz }), n = Math.round((a.dur + 1) * SR), y = new Float32Array(n);
      const F = (u) => { const k = a.F; if (u <= k[0][0]) return k[0][1]; for (let i = 1; i < k.length; i++) if (u <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * (u - k[i - 1][0]) / (k[i][0] - k[i - 1][0]); return k[k.length - 1][1]; };
      for (let i = 0; i < n; i++) { const u = i / SR, s = u < a.dur; if (i % 32 === 0) c.ponerMano({ s: 0.52, F: s ? F(u) : 0, v: s ? 0.1 : 0, material: 'crin' }); y[i] = c.muestra(); }
      poner(o, y, a.t, 1, 0.1);
    }
    return o;
  },
  coro: () => {
    const c = new Coro(SR, disenar({ base: CORO.base, armonicos: CORO.armonicos }), { gammaInterna: CORO.gammaInterna }), o = nuevo();
    const iG = Math.round(CORO.golpe * SR), iP = Math.round(CORO.puertas * SR);
    for (let i = 0; i < N; i++) { if (i === iG) c.golpear(0, 1); if (i === iP) c.mover(0, CORO.cm); const x = c.muestra(); o[0][i] = x.izq; o[1][i] = x.der; }
    return o;
  },
  rios: () => { const o = nuevo(); for (const r of RIOS) poner(o, fundir(Pajaro.render({ dur: r.dur + 1.2, eventos: [{ t: 0.02, tipo: 'silbido', m: midiHz(r.hzDe), m2: midiHz(r.hzA), dur: r.dur, v: r.v }] }, SR)), r.t, 1, Math.abs(r.de - LINEAS[2][1]) < Math.abs(r.de - LINEAS[2][2]) ? panDe('hombro oeste') : panDe('hombro este')); return o; },
  lagos: () => { const o = nuevo(); for (const l of LAGOS) { const y = VozAgua.render({ dur: 3.5, eventos: [{ t: 0.02, dur: 1.4, texto: l.texto, nota: midiHz(l.hz), modo: l.modo, voz: 0.9, v: 0.4 + l.v }] }, SR); poner(o, fundir(y, 150), l.t, 1, panDe(l.lago.split(' (')[0])); } return o; },
  garganta: () => {
    const o = nuevo(), aCorte = (c) => { const mn = Math.min(...c), mx = Math.max(...c); return Float32Array.from(c, (x) => (mx - mn < 1 ? 0.6 : 0.15 + 0.85 * (x - mn) / (mx - mn))); };
    for (const e of GARGANTA.eventos) { const y = Garganta.render({ dur: e.dur + 1, largo: GARGANTA.largo, perfil: aCorte(GARGANTA.cortes[e.epoca]), eventos: [{ ...e, t: 0.02 }] }, SR); poner(o, fundir(y, 300), e.t, 0.5, 0); }
    return o;
  },
  viento: () => { const d = VIENTO.hasta - VIENTO.desde, c = VIENTO.corte, mn = Math.min(...c), mx = Math.max(...c); const w = Viento.render({ dur: d, perfiles: [[0, Float32Array.from(c, (x) => 0.15 + 0.85 * (x - mn) / (mx - mn))]], vel: [[0, 4], [d / 2, 9], [d, 5]], estria: [[0, 0]], semilla: 40 }, SR); fundir(w.L, 1500); fundir(w.R, 1500); const o = nuevo(); poner(o, [w.L, w.R], VIENTO.desde, 0.5); return o; },
};

// el espacio: FDN de 8 líneas (Householder) con amortiguación; el RT60 sigue a la época de la sección
function espacio(entrada) {
  const L = [1031, 1327, 1523, 1871, 2053, 2311, 2647, 2939], b = L.map((n) => new Float32Array(n)), w = new Int32Array(8), lp = new Float32Array(8), out = nuevo();
  const rtEn = (t) => { const s = [...SECCIONES].reverse().find((x) => tDe(x.desde) <= t) || SECCIONES[0]; return ESPACIO[s.epoca].rt60; };
  let rt = rtEn(0); const kr = 1 - Math.exp(-1 / SR), y = new Float32Array(8);
  for (let i = 0; i < N; i++) {
    if (i % 256 === 0) rt += (rtEn(i / SR) - rt) * Math.min(1, 256 * kr);
    let s = 0; for (let j = 0; j < 8; j++) { y[j] = b[j][w[j]]; s += y[j]; } s *= 2 / 8;
    const x = (entrada[0][i] + entrada[1][i]) * 0.5;
    for (let j = 0; j < 8; j++) {
      const g = 10 ** (-3 * L[j] / (SR * rt)); lp[j] += 0.35 * ((y[j] - s) - lp[j]);           // amortiguación: los agudos mueren antes
      b[j][w[j]] = x * (j % 2 ? 0.5 : -0.5) + g * (0.6 * lp[j] + 0.4 * (y[j] - s)); w[j] = (w[j] + 1) % L[j];
    }
    out[0][i] = (y[0] - y[2] + y[4] - y[6]) * 0.35; out[1][i] = (y[1] - y[3] + y[5] - y[7]) * 0.35;
  }
  return out;
}

// la mezcla: ganancia (dB), envío al espacio
// dB relativos a un mismo nivel activo. Partida: la voz conduce sin tapar; la armonía y la resonancia debajo
// automatización por sección (dB sobre la tabla), con rampas de 1,5 s en los bordes
export const AUTOM = { coro: { 'coro final': 6, final: 16 }, voz: { 'coro 1': 1, 'coro 2': 1, 'coro final': 1 }, resonancia: { final: -4 }, gargantas: { 'verso 1': -3, 'verso 2': -3 } };
export const MEZCLA = { voz: [0, 0.25], 'voz-alta': [-6, 0.35], 'voz-baja': [-6, 0.3], gargantas: [-6, 0.35], contrabajo: [-9, 0.2], resonancia: [-8, 0.4], trombon: [-3, 0.35], arco: [-7, 0.25], coro: [-5, 0.2], rios: [-10, 0.35], lagos: [-9, 0.4], tambor: [-8, 0.25], garganta: [-6, 0.3], viento: [-12, 0.2] };

if (modo === 'stems') {
  mkdirSync(`${carpeta}/stems`, { recursive: true });
  for (const nombre of process.argv.slice(4).length ? process.argv.slice(4) : Object.keys(STEMS)) {
    const t0 = Date.now(), o = STEMS[nombre](), x = new Float32Array(2 * N); for (let i = 0; i < N; i++) { x[2 * i] = o[0][i]; x[2 * i + 1] = o[1][i]; }
    writeFileSync(`${carpeta}/stems/${nombre}.f32`, Buffer.from(x.buffer));
    let p = 0; for (const v of x) p = Math.max(p, Math.abs(v));
    console.log(`${nombre.padEnd(11)} pico ${p.toFixed(3)}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
} else if (modo === 'mezcla') {
  const total = nuevo(), envio = nuevo(), por = {};
  for (const [nombre, [db, env]] of Object.entries(MEZCLA)) {
    // cada stem se lleva primero a un mismo nivel cuando suena (rms de sus ventanas de 50 ms por encima de −50 dB de su pico),
    // y después se le aplican los dB de la tabla: así la tabla dice cuánto pesa cada uno, no cuánto sacó su modelo
    const x = new Float32Array(readFileSync(`${carpeta}/stems/${nombre}.f32`).buffer.slice(0)), s = [new Float32Array(N), new Float32Array(N)];
    let pk = 0; for (const v of x) pk = Math.max(pk, Math.abs(v));
    let e = 0, n = 0; const W = 2400; for (let i = 0; i + W <= N; i += W) { let w = 0; for (let k = i; k < i + W; k++) w += (x[2 * k] ** 2 + x[2 * k + 1] ** 2) / 2; w /= W; if (w > (pk * 0.00316) ** 2) { e += w; n++; } }
    const activo = Math.sqrt(e / Math.max(1, n)) || 1, g = (0.1 * 10 ** (db / 20)) / activo;
    const curva = new Float32Array(N), au = AUTOM[nombre] || {}, rampa = 1.5 * SR;
    for (const sc of SECCIONES) { const v = 10 ** ((au[sc.nombre] || 0) / 20); for (let i = Math.round(tDe(sc.desde) * SR); i < Math.min(N, Math.round(tDe(sc.hasta) * SR)); i++) curva[i] = v; }
    for (let i = Math.round(tDe(SECCIONES[SECCIONES.length - 1].hasta) * SR); i < N; i++) curva[i] = curva[i - 1];
    { let y = curva[0]; const k = 1 - Math.exp(-3 / rampa); for (let i = 0; i < N; i++) { y += (curva[i] - y) * k; curva[i] = y; } }
    for (let i = 0; i < N; i++) { s[0][i] = g * curva[i] * x[2 * i]; s[1][i] = g * curva[i] * x[2 * i + 1]; total[0][i] += s[0][i]; total[1][i] += s[1][i]; envio[0][i] += env * s[0][i]; envio[1][i] += env * s[1][i]; }
    por[nombre] = s;
  }
  const rev = espacio(envio); for (let i = 0; i < N; i++) { total[0][i] += rev[0][i]; total[1][i] += rev[1][i]; }
  // niveles por sección: la voz contra todo lo demás, sólo donde canta (la lección de Luciérnagas)
  const db = (v) => 10 * Math.log10(v + 1e-20), canta = new Uint8Array(N);
  for (const n of Pt.MELODIA) for (let i = Math.round(n.t * SR); i < Math.round((n.t + n.durS) * SR) && i < N; i++) canta[i] = 1;
  const informe = SECCIONES.map((s) => {
    const i0 = Math.round(tDe(s.desde) * SR), i1 = Math.min(N, Math.round(tDe(s.hasta) * SR)); let v = 0, r = 0, nv = 0, tot = 0, hueco = 0, huecoMax = 0;
    for (let i = i0; i < i1; i++) {
      const a = (por.voz[0][i] ** 2 + por.voz[1][i] ** 2) / 2, t = (total[0][i] ** 2 + total[1][i] ** 2) / 2; tot += t;
      if (canta[i]) { v += a; r += Math.max(0, t - a); nv++; }
      if (i % 480 === 0) { let e = 0; for (let k = i; k < Math.min(i1, i + 480); k++) e += (total[0][k] ** 2 + total[1][k] ** 2) / 2; if (db(e / 480) < -60) { hueco += 0.01; huecoMax = Math.max(huecoMax, hueco); } else hueco = 0; }
    }
    const lvl = Object.fromEntries(Object.entries(por).map(([k, x]) => { let e = 0; for (let i = i0; i < i1; i++) e += (x[0][i] ** 2 + x[1][i] ** 2) / 2; return [k, +db(e / (i1 - i0)).toFixed(1)]; }));
    return { seccion: s.nombre, total_db: +db(tot / (i1 - i0)).toFixed(1), voz_sobre_resto_db: nv ? +(db(v / nv) - db(r / nv)).toFixed(1) : null, hueco_max_s: +huecoMax.toFixed(2), conduce: Object.entries(lvl).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, d]) => `${k} ${d}`) };
  });
  let p = 0; for (const c of total) for (const v of c) p = Math.max(p, Math.abs(v));
  const g = 0.5 / p, b = Buffer.alloc(44 + N * 4), q = (x) => Math.round(Math.max(-1, Math.min(1, x * g)) * 32767);
  b.write('RIFF', 0); b.writeUInt32LE(36 + N * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(N * 4, 40);
  for (let i = 0; i < N; i++) { b.writeInt16LE(q(total[0][i]), 44 + i * 4); b.writeInt16LE(q(total[1][i]), 46 + i * 4); }
  writeFileSync(`${carpeta}/mezcla.wav`, b);
  // los stems tal como suenan en la mezcla (con su ganancia y automatización, el espacio aparte): suman mezcla.wav
  mkdirSync(`${carpeta}/stems-mezcla`, { recursive: true });
  for (const [nombre, x] of [...Object.entries(por), ['espacio', rev]]) {
    const y = Buffer.alloc(N * 8); for (let i = 0; i < N; i++) { y.writeFloatLE(x[0][i] * g, 8 * i); y.writeFloatLE(x[1][i] * g, 8 * i + 4); }
    writeFileSync(`${carpeta}/stems-mezcla/${nombre}.f32`, y);
  }
  writeFileSync(`${carpeta}/mezcla.json`, JSON.stringify({ mezcla: MEZCLA, automatizacion: AUTOM, espacio: ESPACIO, informe }, null, 1));
  for (const s of informe) console.log(s.seccion.padEnd(12), 'total', String(s.total_db).padStart(6), '· voz sobre el resto', String(s.voz_sobre_resto_db).padStart(5), 'dB · hueco máx', s.hueco_max_s, 's ·', s.conduce.join(', '));
}
