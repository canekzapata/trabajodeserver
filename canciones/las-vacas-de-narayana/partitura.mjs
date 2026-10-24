// partitura.mjs — «Las vacas de Narayana». Ska; el problema de las vacas de Nārāyaṇa Paṇḍita; Lachenmann.
//   node partitura.mjs   → partitura.json
//
// El problema (Gaṇita Kaumudī, 1356; citado de memoria): una vaca pare una ternera cada año; cada ternera, desde el
// principio de su cuarto año, pare también una cada año. ¿Cuántas hay al cabo de veinte años? N(n) = N(n−1) + N(n−3):
// 1, 2, 3, 4, 6, 9, 13, 19, 28, 41, 60, … 2745.
//
// LA LEY DE MÁS DE 30 INSTRUMENTOS (Canek) se cumple con la manada: cada vaca es un instrumento. La vaca del año 0 es el
// skank del piano; cada ternera es el siguiente instrumento de la lista y hereda el material de su madre, transformado
// según su lugar entre sus hermanas. En el año 9 hay 41 vacas y 34 instrumentos: desde ahí, cada vaca nueva engrosa el
// linaje de su antepasada con instrumento (más ataques), y la manada se oye como masa.
// LACHENMANN: con la manada crece la concreción. Desde el año 8 (28 vacas) cada evento puede volverse acción —madera del
// arco, aire por el metal, llaves del clarinete, golpe en la caja del piano— con una probabilidad que llega a 1 en el año 20.
// El skank sobrevive como acción: el contratiempo del ska es ya un gesto concreto (mano que apaga, raspado).
import { writeFileSync } from 'node:fs';

export const BPM = 168, BEAT = 60 / BPM, BAR = 4 * BEAT, S16 = BEAT / 4;
export const ANOS = 20;
// ── la manada, vaca por vaca ──
export const VACAS = [{ id: 0, nace: -3, madre: null, orden: 0 }];          // la primera ya es madura en el año 0
export const N = [1];
for (let y = 1; y <= ANOS; y++) {
  const madres = VACAS.filter((v) => y - v.nace >= 3);   // madura: cumplió tres años antes de este
  for (const m of madres) { const orden = VACAS.filter((v) => v.madre === m.id).length + 1; VACAS.push({ id: VACAS.length, nace: y, madre: m.id, orden }); }
  N.push(VACAS.length);
}
// ── los instrumentos: la lista que la manada recorre (decisión de la pieza: primero el ska, después la manada) ──
export const LISTA = [
  ['piano', 'Piano (skank)', 'skank'], ['contrabajo', 'Contrabajo (walking)', 'bajo'], ['fotones', 'Batería de fotones', 'bateria'],
  ['trombon', 'Trombón', 'riff'], ['trompeta', 'Trompeta', 'riff'], ['clarinete', 'Clarinete', 'riff'],
  ['organo', 'Órgano de divisores con memoria', 'skank'], ['violin', 'Violín (pizz)', 'skank'], ['tambor', 'Tambor que habla', 'cuenta'],
  ['garganta', 'Garganta de montaña (el mugido)', 'manada'], ['cuerpo', 'Cuerpo de acción (raspado)', 'skank'], ['tamtam', 'Tam-tam con superbola', 'manada'],
  ['androide', 'Bajo de androide', 'bajo'], ['viola', 'Viola', 'pad'], ['chelo', 'Chelo', 'pad'],
  ['pajaro', 'Pájaro (siringe)', 'manada'], ['agua', 'Agua (gotas)', 'manada'], ['vozagua', 'Voz de agua', 'manada'],
  ['waterphone', 'Waterphone', 'manada'], ['opera', 'Gong de ópera', 'manada'], ['fput', 'Cuerda que recuerda', 'pad'],
  ['sampleador', 'Sampleador de espacio-tiempo', 'memoria'], ['trompo', 'Trompo', 'trompo'], ['boca', 'Boca de tres tiempos', 'manada'],
  ['cuerdatt', 'Cuerda de cuerpos incompatibles', 'riff'], ['pianott', 'Piano de tres presentes', 'skank'], ['arpa', 'Arpa que presta su vibración', 'skank'],
  ['cristal', 'Cristal orbital', 'riff'], ['estacion', 'Cuerdas de estación', 'pad'], ['terminal', 'Terminal vectorial', 'riff'],
  ['plasma', 'Plumón de plasma', 'manada'], ['sala', 'Sala plegada que se toca', 'pad'], ['viento', 'Viento', 'viento'], ['coro', 'Coro inaudible', 'coro'],
].map(([clave, nombre, funcion], i) => ({ clave, nombre, funcion, vaca: i, entra: VACAS[i].nace < 0 ? 0 : VACAS[i].nace }));
// cada vaca sin instrumento propio pertenece al linaje de su antepasada más cercana que sí lo tiene
const linaje = (id) => (id < LISTA.length ? id : linaje(VACAS[id].madre));
export const MANADA = (inst, y) => VACAS.filter((v) => v.nace <= y && linaje(v.id) === inst).length;   // cuántas vacas suena ese instrumento

// ── el material: cada vaca hereda la celda de su madre ──
// celda = 4 grados diatónicos (relativos a la raíz del acorde). Transformación por el lugar de la ternera entre sus hermanas:
// 1.ª: sube una tercera (+2) · 2.ª: retrógrado · 3.ª: inversión sobre el primer grado · y así, en ciclo
export const CELDAS = [];
for (const v of VACAS.slice(0, LISTA.length)) {
  if (v.madre === null) { CELDAS.push([0, 2, 4, 2]); continue; }
  const m = CELDAS[v.madre], k = ((v.orden - 1) % 3) + 1;
  CELDAS.push(k === 1 ? m.map((d) => d + 2) : k === 2 ? [...m].reverse() : m.map((d) => 2 * m[0] - d));
}
// ── la armonía: la recurrencia también escribe la progresión. Raíz del año r(n) = r(n−1) + r(n−3) mod 7 (grados de
// do mayor), con r(0..2) = I, IV, V. Cada año: raíz, raíz+3, raíz+4, raíz (los cuatro compases) ──
export const RAIZ = [0, 3, 4]; for (let y = 3; y <= ANOS; y++) RAIZ.push((RAIZ[y - 1] + RAIZ[y - 3]) % 7);
const ESCALA = [0, 2, 4, 5, 7, 9, 11], GRADO = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
export const midiGrado = (g, oct = 4) => 12 * (oct + 1) + 12 * Math.floor(g / 7) + ESCALA[((g % 7) + 7) % 7];
// ── la palabra de Narayana: a→ab, b→c, c→a (su matriz tiene x³ = x² + 1; la razón de crecimiento es ψ ≈ 1,4656).
// Las «a» son los ataques de la manada en la rejilla de semicorcheas ──
let W = 'a'; while (W.length < 4000) W = [...W].map((c) => ({ a: 'ab', b: 'c', c: 'a' })[c]).join('');
export const PALABRA = W;
export const PSI = 1.465571231876768;

// ── la forma ──
const S = [['intro', 8, 0]]; let y = 1;
const anos = (desde, hasta, nombre) => { for (let k = desde; k <= hasta; k++) S.push([nombre || `año ${k}`, 4, k]); };
anos(1, 6); S.push(['coro A', 8, 6]); anos(7, 12); S.push(['coro B', 8, 12]); anos(13, 16); anos(17, 20); S.push(['coro final', 8, 20]); S.push(['salida', 8, 20]);
export const SECCIONES = S.reduce((a, [nombre, compases, ano]) => { const desde = a.length ? a[a.length - 1].hasta : 1; a.push({ nombre, desde, hasta: desde + compases, ano, puente: ano >= 13 && ano <= 16 && nombre.startsWith('año') }); return a; }, []);
export const COMPASES = SECCIONES[SECCIONES.length - 1].hasta - 1;
export const tDe = (c, beat = 0) => (c - 1) * BAR + beat * BEAT;
export const anoEn = (c) => SECCIONES.find((s) => c >= s.desde && c < s.hasta).ano;
// la concreción (Lachenmann): 0 hasta 28 vacas, 1 en 2745, en escala logarítmica
export const CONCRECION = (a) => Math.max(0, Math.min(1, Math.log(N[a] / 28) / Math.log(2745 / 28)));
const hash = (...x) => { let h = 2166136261; for (const c of x.join('|')) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 100000) / 100000; };

// ── los números, en sílabas (para Sabina y el tambor) ──
export const NUMEROS = {
  0: 'u-na', 1: 'dos', 2: 'tres', 3: 'cua-tro', 4: 'seis', 5: 'nue-ve', 6: 'tre-ce', 7: 'die-ci-nue-ve', 8: 'vein-tio-cho', 9: 'cua-ren-tay-u-na',
  10: 'se-sen-ta', 11: 'o-chen-tay-o-cho', 12: 'cien-to-vein-ti-nue-ve', 13: 'cien-too-chen-tay-nue-ve', 14: 'dos-cien-tas-se-ten-tay-sie-te',
  15: 'cua-tro-cien-ta-seis', 16: 'qui-nien-tas-no-ven-tay-cin-co', 17: 'o-cho-cien-tas-se-ten-tay-dos', 18: 'mil-dos-cien-tas-se-ten-tay-o-cho',
  19: 'mil-o-cho-cien-tas-se-ten-tay-tres', 20: 'dos-mil-se-te-cien-tas-cua-ren-tay-cin-co',
};
export const ANO = { 1: 'u-no', 2: 'dos', 3: 'tres', 4: 'cua-tro', 5: 'cin-co', 6: 'seis', 7: 'sie-te', 8: 'o-cho', 9: 'nue-ve', 10: 'diez', 11: 'on-ce', 12: 'do-ce', 17: 'die-ci-sie-te', 18: 'die-cio-cho', 19: 'die-ci-nue-ve', 20: 'vein-te' };

// ── los eventos de cada instrumento (genéricos: t, dur, m, v, accion; los adapta mezcla.mjs) ──
export const PARTES = Object.fromEntries(LISTA.map((x) => [x.clave, []]));
for (let c = 1; c <= COMPASES; c++) {
  const sec = SECCIONES.find((s) => c >= s.desde && c < s.hasta), a = sec.ano, k = (c - sec.desde) % 4, t0 = tDe(c);
  const raiz = RAIZ[a] + [0, 3, 4, 0][k], acorde = [0, 2, 4].map((d) => raiz + d), conc = CONCRECION(a);
  const coro = sec.nombre.startsWith('coro'), salida = sec.nombre === 'salida', puente = sec.puente;
  for (const ins of LISTA) {
    if (a < ins.entra) continue;
    const P = PARTES[ins.clave], celda = CELDAS[ins.vaca], vacas = MANADA(ins.vaca, a), ev = (t, dur, m, v, extra = {}) => {
      const i = P.length, accion = hash(ins.clave, i) < conc;
      P.push({ t: +t.toFixed(4), dur: +dur.toFixed(4), m: +m.toFixed(3), v: +v.toFixed(3), accion, compas: c, ano: a, ...extra });
    };
    // en el puente (años 13–16) el ska se calla: sólo la manada, el conteo y la memoria (Lachenmann a solas)
    if (puente && ['skank', 'bajo', 'bateria', 'riff', 'pad'].includes(ins.funcion) && ins.clave !== 'cuerpo') continue;
    if (salida && !['coro', 'skank', 'manada', 'viento'].includes(ins.funcion)) continue;
    switch (ins.funcion) {
      case 'skank': {      // contratiempos: la mano que apaga. El arpa y el piano de tres presentes van a semicorcheas
        const posic = ['arpa', 'pianott'].includes(ins.clave) ? [3, 7, 11, 15] : [2, 6, 10, 14];
        for (const p of posic) acorde.forEach((g, j) => ins.clave === 'cuerpo' ? j === 0 && ev(t0 + p * S16, S16 * 1.5, 0, 0.7) : ev(t0 + p * S16, S16 * 1.6, midiGrado(g + celda[j % 4] * 0, ins.clave === 'violin' ? 5 : 4), 0.55));
        break;
      }
      case 'bajo': {       // walking de ska: negras; los grados de la celda sobre la raíz
        const oct = ins.clave === 'androide' ? 1 : 2;
        [0, 4, 8, 12].forEach((p, j) => ev(t0 + p * S16, BEAT * 0.9, midiGrado(raiz + celda[j], oct), 0.75));
        break;
      }
      case 'bateria': {    // bombo en 1 y 3, caja en 2 y 4 (el «one drop» cae en los coros: bombo sólo en 3), charles a corcheas
        for (let p = 0; p < 16; p += 2) ev(t0 + p * S16, 0.05, 88, p % 4 === 2 ? 0.55 : 0.35, { pieza: 'charles' });
        (coro ? [8] : [0, 8]).forEach((p) => ev(t0 + p * S16, 0.18, 36, 0.9, { pieza: 'bombo' }));
        [4, 12].forEach((p) => ev(t0 + p * S16, 0.12, 50, 0.8, { pieza: 'caja' }));
        break;
      }
      case 'riff': {       // los metales responden a la voz: compases 3 y 4 de cada año (en los coros, todos)
        if (!coro && k < 2) break;
        const ritmo = [0, 3, 6, 8, 11, 14], oct = { trombon: 3, clarinete: 4, trompeta: 5, cuerdatt: 4, cristal: 6, terminal: 5 }[ins.clave];
        ritmo.forEach((p, j) => ev(t0 + p * S16, S16 * (j === ritmo.length - 1 ? 2 : 1.6), midiGrado(raiz + celda[j % 4], oct), 0.7));
        break;
      }
      case 'pad': {        // la armonía sostenida, un compás
        const oct = { viola: 4, chelo: 3, fput: 3, estacion: 4, sala: 3 }[ins.clave];
        if (ins.clave === 'fput') { if (k === 0) ev(t0, 4 * BAR, midiGrado(raiz, oct), 0.6); break; }
        acorde.forEach((g, j) => ev(t0, BAR * 0.98, midiGrado(g, oct + (j === 2 && ins.clave === 'chelo' ? 1 : 0)), 0.45));
        break;
      }
      case 'manada': {     // la manada: ataques en las «a» de la palabra de Narayana; cuantas más vacas, más ataques
        const cupo = Math.min(16, 1 + Math.round(2.2 * Math.log2(vacas))), oct = { garganta: 2, tamtam: 2, pajaro: 6, agua: 5, vozagua: 4, waterphone: 4, opera: 4, boca: 3, plasma: 4 }[ins.clave];
        const offset = (ins.vaca * 37 + c * 16) % (PALABRA.length - 16); let n = 0;
        for (let p = 0; p < 16 && n < cupo; p++) if (PALABRA[offset + p] === 'a' && hash(ins.clave, c, p) < cupo / 8) { ev(t0 + p * S16, ['garganta', 'tamtam', 'opera', 'waterphone'].includes(ins.clave) ? BEAT * 2 : S16 * 2, midiGrado(raiz + celda[n % 4], oct), 0.5); n++; }
        break;
      }
      case 'cuenta': {     // el tambor que habla dice cuántas hay, en el segundo compás de cada año (contesta a la voz)
        if (k === 1 && sec.nombre.startsWith('año')) ev(t0, BAR, midiGrado(raiz, 2), 0.8, { texto: NUMEROS[a] });
        break;
      }
      case 'memoria': {    // el sampleador lee la manada de hace tres años: el término N(n−3) de la recurrencia
        if (a >= 3 && k === 0) ev(t0, 2 * BAR, midiGrado(RAIZ[a - 3], 3), 0.6, { ano_leido: a - 3 });
        break;
      }
      case 'trompo': { if (k === 0) ev(t0, 4 * BAR, 0, Math.min(1, 0.3 + 0.1 * Math.log2(vacas)), { vueltas: +(BPM / 60 / 4 * (1 + 0.1 * Math.log2(vacas))).toFixed(3) }); break; }
      case 'viento': { if (k === 0) ev(t0, 4 * BAR, 0, Math.min(1, 0.2 + 0.08 * Math.log2(N[a]))); break; }
      case 'coro': break;
    }
  }
}
// el Coro inaudible: guarda el acorde del año 0 (la primera vaca: I) al nacer su vaca, y lo suelta en la salida
export const CORO = { golpe: tDe(SECCIONES.find((s) => s.ano === LISTA.find((x) => x.clave === 'coro').entra && s.nombre.startsWith('año')).desde, 0.5), puertas: tDe(SECCIONES.find((s) => s.nombre === 'salida').desde), cm: 40, armonicos: [8, 10, 12], base: 32.703, gammaInterna: 1 / 240 };

// ── las voces (Sabina): la principal pregunta y cuenta; dos voces compuestas cantan los términos de la recurrencia ──
// Acuerdos: voz de máquina, frases cortas, una nota por sílaba, ninguna nota de más de 2 tiempos; las voces de apoyo
// se componen. En el coro la recurrencia se canta en tres voces: la alta «el año pasado» N(n−1), la baja «hace tres
// años» N(n−3), la principal la suma N(n).
export const VOCES = { principal: [], alta: [], baja: [] };
const fr = (voz, c, beat, silabas, notas, durs, extra = {}) => { let b = beat; silabas.forEach((s, i) => { const d = durs[Math.min(i, durs.length - 1)], g = notas[Math.min(i, notas.length - 1)];
  VOCES[voz].push({ t: +tDe(c, b).toFixed(4), dur: d, durS: +(d * BEAT).toFixed(4), silaba: s, midi: g, compas: c, ...extra }); b += d; }); return b; };
const sil = (txt) => txt.split(/[\s-]+/).filter(Boolean);
const mel = (grados, oct = 4) => grados.map((g) => midiGrado(g, oct));
// el enunciado, en la intro (frases cortas)
const ENUNCIADO = [['u-na va-ca', [4, 4, 5, 4]], ['pa-reu-na ter-ne-ra', [2, 2, 4, 2, 0]], ['ca-da a-ño', [4, 5, 4, 2]], ['ca-da ter-ne-ra', [0, 0, 2, 4, 2]], ['des-de su cuar-to a-ño', [4, 4, 5, 7, 5, 4]], ['pa-re tam-bién', [4, 2, 0, 2]]];
{ let c = 1; ENUNCIADO.forEach(([txt, g], i) => { fr('principal', c + Math.floor(i * 4 / 3), (i * 4) % 3 === 0 ? 0 : 2, sil(txt), mel(g), [1]); }); }
// cada año: «año n: N» (dos compases); los coros: la recurrencia en tres voces
for (const s of SECCIONES) {
  if (s.nombre.startsWith('año') && !s.puente) {
    // la voz dice el año; el tambor que habla contesta cuántas hay (pregunta y respuesta)
    const n = s.ano, an = sil(ANO[n]), r = RAIZ[n];
    fr('principal', s.desde, 0, ['a', 'ño', ...an], mel([r + 4, r + 2, ...an.map((_, i) => r + [4, 5, 4, 2][i % 4])]), [1, 1, 0.5]);
  }
  if (s.nombre.startsWith('coro')) {
    const n = s.ano, r = RAIZ[n];
    for (const rep of [0, 4]) {
      fr('principal', s.desde + rep, 0, sil('¿cuán-tas va-cas?'), mel([r + 4, r + 5, r + 7, r + 4]), [1]);
      fr('alta', s.desde + rep + 1, 0, sil('el a-ño pa-sa-do'), mel([r + 7, r + 7, r + 9, r + 7, r + 6, r + 4], 4), [0.5]);
      fr('alta', s.desde + rep + 1, 3, sil(NUMEROS[n - 1]).slice(0, 8), mel(sil(NUMEROS[n - 1]).map((_, i) => r + [7, 9, 7, 4][i % 4])), [0.5]);
      fr('baja', s.desde + rep + 2, 0, sil('ha-ce tres a-ños'), mel([r, r, r + 2, r + 4, r + 2], 3), [0.5]);
      fr('baja', s.desde + rep + 2, 2.5, sil(NUMEROS[n - 3]).slice(0, 8), mel(sil(NUMEROS[n - 3]).map((_, i) => r + [0, 2, 4, 2][i % 4]), 3), [0.5]);
      const suma = sil(NUMEROS[n]);
      fr('principal', s.desde + rep + 3, 0, suma.slice(0, 12), mel(suma.map((_, i) => r + [4, 4, 5, 4, 2, 4, 5, 7][i % 8])), [suma.length > 6 ? 0.25 : 0.5]);
    }
  }
}
// la respuesta, al final: la principal canta 2745 sola, sobre el I
{ const s = SECCIONES.find((x) => x.nombre === 'salida'), num = sil(NUMEROS[20]); fr('principal', s.desde + 1, 0, num, mel(num.map((_, i) => [4, 4, 5, 4, 2, 0, 2, 4, 2, 0, 0][i % 11])), [0.5, 0.5, 1]); }
for (const v of Object.values(VOCES)) v.sort((a, b) => a.t - b.t);

if (import.meta.url === `file://${process.argv[1]}`) {
  const P = { titulo: 'Las vacas de Narayana', subtitulo: 'ska; el problema de las vacas de Nārāyaṇa Paṇḍita; Lachenmann', bpm: BPM, duracion: tDe(COMPASES + 1), anos: ANOS, N, vacas: VACAS.slice(0, 60), lista: LISTA, celdas: CELDAS, raiz: RAIZ.map((r) => GRADO[r]), concrecion: N.map((_, a) => +CONCRECION(a).toFixed(3)), secciones: SECCIONES, partes: PARTES, voces: VOCES, coro: CORO, numeros: NUMEROS };
  writeFileSync(new URL('./partitura.json', import.meta.url), JSON.stringify(P) + '\n');
  console.log('N:', N.join(' '));
  console.log('raíces:', P.raiz.join(' '));
  console.log('entradas:', LISTA.map((x) => `${x.clave}@${x.entra}`).join(' '));
  console.log(`${COMPASES} compases · ${(P.duracion / 60).toFixed(2)} min · ${LISTA.length} instrumentos de la manada + Sabina · eventos: ${Object.values(PARTES).reduce((s, p) => s + p.length, 0)} · voz: ${VOCES.principal.length}/${VOCES.alta.length}/${VOCES.baja.length} sílabas`);
  console.log('concreción por año:', P.concrecion.map((c) => c.toFixed(2)).join(' '));
}
