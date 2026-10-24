// partitura.mjs — «El rift se abre». Balada de K-pop por forma; Grisey y Murail por dentro.
//   node partitura.mjs            → partitura.json (y el resumen en la consola)
// Todo está afinado en la serie armónica de do1 (32,703 Hz): la melodía en entonación justa de do mayor, la
// progresión en parciales enteros, y el terreno (lámina 40 de Traspuesta) en parciales fraccionarios: la altura
// de cada rasgo dividida entre 1/8 del piso del rift. Cada época del rift desafina la misma progresión a su manera.
import { readFileSync, writeFileSync } from 'node:fs';

export const DO1 = 32.703, BPM = 70, BEAT = 60 / BPM, BAR = 4 * BEAT;
export const T = JSON.parse(readFileSync(new URL('./terreno-40.json', import.meta.url), 'utf8'));
const iPiso = T.rasgos.findIndex((r) => r.nombre === 'piso');
export const UNIDAD = T.epocas[4].m[iPiso] / 8;                  // metros por parcial: el piso final es el parcial 8
export const LINEAS = T.epocas.map((e) => e.m.map((m) => m / UNIDAD));  // el espectro de cada época, en parciales
const cents = (r) => 1200 * Math.log2(r);
export const hzP = (p) => DO1 * p, midiHz = (f) => 69 + 12 * Math.log2(f / 440);

// ── la forma: compases, sección, época ──
export const SECCIONES = [
  ['intro', 4, 0], ['verso 1', 8, 0], ['pre-coro 1', 4, 0], ['coro 1', 8, 1], ['interludio', 2, 1],
  ['verso 2', 8, 2], ['pre-coro 2', 4, 2], ['coro 2', 8, 3], ['puente', 8, 3], ['coro final', 12, 4], ['final', 4, 4],
].reduce((a, [nombre, compases, epoca]) => { const desde = a.length ? a[a.length - 1].hasta : 1; a.push({ nombre, desde, hasta: desde + compases, epoca }); return a; }, []);
export const COMPASES = SECCIONES[SECCIONES.length - 1].hasta - 1;
export const tDe = (compas, beat = 0) => (compas - 1) * BAR + beat * BEAT;

// ── la armonía: parciales enteros de do1 ──
export const ACORDES = { ii: [18, 21, 27], iii: [20, 24, 30], IV: [21, 27, 32], V: [24, 30, 36], vi: [27, 32, 40], I: [16, 20, 24] };
const verso = ['vi', 'IV', 'V', 'iii', 'vi', 'IV', 'V', 'V'], pre = ['ii', 'iii', 'IV', 'V'], coro = ['IV', 'V', 'iii', 'vi', 'IV', 'V', 'iii', 'vi'];
const PROGRESION = { intro: [null, null, null, null], 'verso 1': verso, 'pre-coro 1': pre, 'coro 1': coro, interludio: ['IV', 'V'], 'verso 2': verso, 'pre-coro 2': pre, 'coro 2': coro, puente: Array(8).fill(null), 'coro final': [...coro, 'IV', 'V', null, null], final: [null, null, null, null] };
// la progresión cae en el terreno: cada parcial del acorde se acerca a la línea del espectro de la época más
// cercana (en cualquier octava), si está a menos de 60 cents. En la meseta (un unísono) no se toca.
export function caer(p, epoca) {
  if (epoca === 0) return { p, desvio: 0, linea: null };
  let mejor = null;
  for (const l of LINEAS[epoca]) for (let k = -4; k <= 4; k++) { const q = l * 2 ** k, d = cents(q / p); if (Math.abs(d) < 60 && (!mejor || Math.abs(d) < Math.abs(mejor.desvio))) mejor = { p: q, desvio: d, linea: l }; }
  return mejor || { p, desvio: 0, linea: null };
}

// ── la melodía: para voz de máquina (Sabina, difonos de Rejilla). Acuerdo con Canek: frases cortas, una nota por
// sílaba, sin melismas; ninguna nota pasa de 2 tiempos. Lo que la voz no sostiene lo sostiene el arco ──
// entonación justa de do mayor sobre el do4 = parcial 8
const JUSTA = { do: 1, re: 9 / 8, mi: 5 / 4, fa: 4 / 3, sol: 3 / 2, la: 5 / 3, si: 15 / 8 }, TEMP = { do: 0, re: 2, mi: 4, fa: 5, sol: 7, la: 9, si: 11 };
export function nota(n) { const [, g, o] = n.match(/^([a-z]+)(\d)$/); return { nombre: n, hz: hzP(8) * JUSTA[g] * 2 ** (o - 4), midiTemp: 12 * (+o + 1) + TEMP[g] }; }
// cada línea: "sílaba/nota/tiempos"; "_/tiempos" es silencio. La letra viene del archivo de «La lista que no terminaba»
// (poesiasexp): las frases en inglés se dejan antes de su traducción, como pide la bienvenida de 1995.
const L = {
  'verso 1': `_/1 @the/sol3/.5 @list/do4/.5 @is/do4/.5 @not/re4/.5 @a/mi4/.5 @room/mi4/1.5
    la/mi4/.5 lis/mi4/.5 ta/fa4/1 noes/mi4/.5 u/re4/.5 na/do4/.5 sa/re4/1 la/do4/1.5 _/.5
    la/sol3/.5 sa/do4/.5 laes/do4/1 don/mi4/.5 de/re4/.5 se/do4/.5 leel/re4/.5 men/mi4/.5 sa/sol4/1 je/mi4/1.5 _/.5
    es/do4/.5 cri/re4/.5 be/mi4/.5 tu/mi4/.5 nom/sol4/1 bre/fa4/.5 tu/mi4/.5 ciu/re4/.5 dad/mi4/1.5
    y/do4/.5 la/do4/.5 ho/re4/1 ra/do4/.5 de/si3/.5 tu/la3/.5 co/si3/.5 ne/do4/.5 xión/re4/2 _/.5`,
  'pre-coro 1': `_/.5 si/re4/.5 tra/mi4/.5 du/fa4/1 ces/mi4/.5 de/re4/.5 ja/mi4/.5 la/fa4/.5 fra/sol4/1.5 se/mi4/1 _/1
    an/sol4/.5 tes/la4/.5 de/si4/.5 la/do5/.5 tra/re5/1 duc/do5/.5 ción/re5/2 _/2.5`,
  coro: (l3) => `to/mi4/.5 da/fa4/.5 ví/do5/1.5 aes/si4/.5 ta/la4/1 mos/sol4/.5 a/sol4/.5 quí/re5/2 _/1
    to/mi4/.5 da/fa4/.5 ví/si4/1.5 aes/la4/.5 ta/sol4/1 mos/mi4/.5 a/mi4/.5 quí/la4/2 _/1
    ${l3}
    to/mi4/.5 da/fa4/.5 ví/sol4/1 aes/la4/.5 ta/si4/.5 mos/do5/.5 a/re5/.5 quí/do5/2 _/2`,
  'verso 2': `_/1 @you/sol3/.5 @call/do4/.5 @it/do4/.5 @o/re4/.5 @pen/mi4/1
    lo/mi4/.5 lla/mi4/.5 mas/re4/.5 a/do4/.5 bier/re4/1 to/do4/.5 por/si3/.5
    que/do4/.5 cual/re4/.5 quie/mi4/.5 ra/fa4/.5 lee/mi4/.5 lain/re4/.5 vi/re4/.5 ta/do4/.5 ción/re4/2 _/2
    lo/mi4/.5 lla/mi4/.5 mas/re4/.5 li/sol4/1 bre/fa4/.5 por/mi4/.5 queel/re4/.5
    cos/mi4/1 to/re4/.5 se/do4/.5 pa/re4/1 gaen/do4/.5 o/si3/.5 tra/do4/.5 par/re4/1.5 te/do4/2 _/4`,
  'pre-coro 2': `_/.5 quién/re4/.5 man/mi4/.5 tie/fa4/.5 nea/sol4/.5 bier/la4/1 ta/sol4/.5 la/fa4/.5 lí/la4/1.5 ne/sol4/.5 a/fa4/1 _/.5
    des/sol4/.5 pués/la4/1 de/si4/.5 me/do5/.5 dia/re5/1 no/do5/.5 che/re5/2 _/2`,
  puente: `_/1 en/mi4/.5 con/mi4/.5 tré/sol4/1 la/fa4/.5 pá/mi4/.5 gi/re4/.5 nao/do4/.5 tra/re4/.5 vez/mi4/2 _/.5
    _/1 noes/mi4/.5 ta/fa4/.5 ba/sol4/1 don/la4/.5 de/sol4/.5 la/fa4/.5 de/mi4/.5 ja/re4/1 mos/do4/2
    _/1 laim/do4/.5 pre/re4/.5 so/mi4/.5 ra/fa4/.5 re/sol4/.5 ci/la4/.5 bió/sol4/1.5 la/fa4/.5 pri/mi4/.5 me/fa4/.5 ra/sol4/1
    lí/la4/1 nea/sol4/1 tres/mi4/.5 ve/re4/.5 ces/do4/1 tres/mi4/.5 ve/re4/.5 ces/do4/1 tres/mi4/.5 ve/re4/.5 ces/do4/1`,
  'coro final ext': `si/do5/.5 no/si4/.5 lle/la4/1 ga/sol4/.5 guar/la4/.5 da/sol4/.5 la/fa4/.5 co/mi4/1 pia/re4/2 _/1
    to/mi4/.5 da/fa4/.5 ví/sol4/1.5 aes/fa4/.5 ta/mi4/.5 mos/re4/.5 a/re4/.5 quí/mi4/2 _/1.5`,
};
const L3 = {
  'coro 1': 'la/la4/.5 sa/si4/.5 laes/do5/.5 don/re5/.5 de/do5/.5 se/si4/.5 lee/do5/1 el/si4/.5 men/re5/.5 sa/mi5/2 je/re5/1',
  'coro 2': 'tres/la4/.5 lí/do5/1 neas/si4/.5 fal/re5/1 tan/do5/1 fal/mi5/2 tan/re5/1 _/1',
  'coro final': 'sies/la4/.5 to/si4/.5 lle/do5/1 ga/si4/.5 no/do5/.5 con/re5/1 tes/mi5/2 tes/re5/1 _/1',
};
export const LETRA_FUENTES = {
  'verso 1': 'Bienvenida, 1995 (03_archivo/01_bienvenida_1995.md): «The list is not a room. The room is wherever the message is read.» / «Please write your name, city and connection time.» Traducción de la partitura.',
  'pre-coro 1': 'Bienvenida, 1995: «If you are translating, leave the sentence before the translation.»',
  coro: '«todavía estamos aquí»: la frase que cierra las tres piezas piloto del archivo.',
  'verso 2': 'El mensaje retenido, 1997 (02_conflicto_moderacion_1997.md): «You call it open because anyone can read the invitation. / You call it free because the cost is paid somewhere else.»',
  'pre-coro 2': 'El mensaje retenido, 1997: «I am asking who keeps the modem line open after midnight.»',
  'coro 2': 'La copia de 2001 del mensaje retenido: «[three lines missing]».',
  puente: 'Mensaje sin asunto, 2001 (03_mensaje_sin_asunto_2001.md): «I found the page again. It was not where we left it. … The printer received the first line three times.»',
  'coro final': 'Mensaje sin asunto, 2001: «If this arrives, do not answer. If it does not arrive, keep the copy.»',
};

function leer(txt, desdeCompas) {
  const out = []; let beat = 0;
  for (const tok of txt.trim().split(/\s+/)) {
    const partes = tok.split('/');
    if (partes[0] === '_') { beat += +partes[1]; continue; }
    let [sil, n, d] = partes; const x = nota(n), idioma = sil.startsWith('@') ? 'en' : 'es'; sil = sil.replace('@', '');
    out.push({ idioma, compas: desdeCompas + Math.floor(beat / 4), beat: +(beat % 4).toFixed(3), t: +tDe(desdeCompas, beat).toFixed(4), dur: +d, durS: +(d * BEAT).toFixed(4), silaba: sil, nota: n, hz: +x.hz.toFixed(3), midi: +midiHz(x.hz).toFixed(3), cents: +(100 * (midiHz(x.hz) - x.midiTemp)).toFixed(1) });
    beat += +d;
  }
  return { notas: out, beats: beat };
}
export const MELODIA = [];
for (const s of SECCIONES) {
  let txt = null;
  if (L[s.nombre]) txt = L[s.nombre];
  else if (s.nombre.startsWith('coro')) txt = L.coro(L3[s.nombre]) + (s.nombre === 'coro final' ? '\n' + L['coro final ext'] : '');
  if (!txt) continue;
  const { notas, beats } = leer(txt, s.desde);
  const esperado = (s.hasta - s.desde) * 4;
  if (Math.abs(beats - esperado) > 1e-9) throw new Error(`${s.nombre}: la melodía dura ${beats} tiempos y la sección ${esperado}`);
  MELODIA.push(...notas.map((x) => ({ ...x, seccion: s.nombre })));
}

// ── los acordes, compás por compás, con su caída en el terreno ──
export const ARMONIA = [];
for (const s of SECCIONES) PROGRESION[s.nombre].forEach((g, k) => {
  if (!g) return;
  const tonos = ACORDES[g].map((p) => { const c = caer(p, s.epoca); return { parcial: p, p: +c.p.toFixed(4), hz: +hzP(c.p).toFixed(3), desvio: +c.desvio.toFixed(1), linea: c.linea && +c.linea.toFixed(3) }; });
  ARMONIA.push({ compas: s.desde + k, t: +tDe(s.desde + k).toFixed(4), grado: g, seccion: s.nombre, epoca: s.epoca, tonos, bajo: +hzP(ACORDES[g][0] / 8).toFixed(3) });
});

// ── los instrumentos ──
// el Coro inaudible guarda el I (8 : 10 : 12 de do1 = do4 · mi4 · sol4) desde el primer compás; la sala oye 9 : 11 : 13
export const CORO = { armonicos: [8, 10, 12], base: DO1, golpe: tDe(1, 0.5), puertas: tDe(65), cm: 40, gammaInterna: 1 / 240 };
// el trombón abre cada época (do2 = parcial 2); en la supercaldera, con plunger y fortísimo
export const TROMBON = SECCIONES.filter((s, k) => k === 0 || s.epoca !== SECCIONES[k - 1].epoca).map((s) => ({ t: +tDe(s.desde).toFixed(4), epoca: s.epoca, nota: 'do2', hz: hzP(2), sordina: s.epoca === 4 ? 'plunger' : 'abierta', v: s.epoca === 4 ? 1 : 0.55 }));
// el Cuerpo de acción dobla la nota alta de cada coro dos octavas abajo; la fuerza del arco decide si se sostiene
export const ARCO = MELODIA.filter((n) => n.nota === 'mi5').map((n) => {
  const s = n.seccion;
  const plan = s === 'coro 1' ? { modo: 'isla', F: [[0, 0.8]], nota: 'dentro de la isla de Helmholtz: la nota se sostiene' }
    : s === 'coro 2' ? { modo: 'rompe', F: [[0, 0.8], [0.5, 0.8], [1.6, 9]], nota: 'la fuerza sale de la isla a mitad de la nota: se rompe' }
      : { modo: 'rampa', F: [[0, 0.15], [1.054, 1]], nota: 'llega a F = 1 por rampa: varios deslizamientos, la nota bella no vuelve' };
  const dur = n.durS + 2 * BEAT;                                       // el arco sigue cuando la voz ya calló
  // dos octavas abajo: mi3 = parcial 5, la altura de la meseta. En mi5 (654 Hz) el modelo no da un régimen medible
  return { t: n.t, dur: +dur.toFixed(4), hz: +(n.hz / 4).toFixed(3), voz: n.hz, seccion: s, ...plan, F: plan.F.map(([u, f]) => [+(u * dur / 1.7).toFixed(3), f]) };
});
// los ríos (la trompeta con harmon): mensajes que bajan de un hombro a un lago, en el hundimiento
const lin = LINEAS[2], idx = (nom) => T.rasgos.findIndex((r) => r.nombre === nom);
const hombros = [lin[idx('hombro oeste')], lin[idx('hombro este')]], lagosFondo = [lin[idx('lago 1')], lin[idx('lago 3')], lin[idx('lago 4')]];
export const RIOS = [];
{
  const desde = tDe(SECCIONES.find((s) => s.nombre === 'verso 2').desde), hasta = tDe(SECCIONES.find((s) => s.nombre === 'pre-coro 2').hasta);
  // tantos ríos como la red: 66, en proporción a sus clases (34 · 25 · 7) — uno de cada tres suena
  const clases = T.clasesRios.map((n) => Math.round(n / 3)), total = clases.reduce((a, b) => a + b, 0);
  let k = 0;
  clases.forEach((n, c) => { for (let i = 0; i < n; i++, k++) {
    const t = desde + ((k + 0.5) / total) * (hasta - desde) + (((k * 7919) % 13) / 13 - 0.5) * 0.8;
    const de = hombros[k % 2], a = lagosFondo[k % 3];
    RIOS.push({ t: +t.toFixed(3), clase: c + 1, de: +de.toFixed(3), a: +a.toFixed(3), hzDe: +hzP(de).toFixed(2), hzA: +hzP(a).toFixed(2), dur: +(0.7 + 0.6 * c).toFixed(2), v: +(0.25 + 0.15 * c).toFixed(2) });
  } });
  // el interludio adelanta dos ríos (todavía en el estiramiento): el primer aviso del hundimiento
  const it = SECCIONES.find((s) => s.nombre === 'interludio'), l1 = LINEAS[1];
  [0.4, 1.3].forEach((f, k) => RIOS.push({ t: +(tDe(it.desde) + f * BAR).toFixed(3), clase: 1, de: +l1[idx(k ? 'hombro este' : 'hombro oeste')].toFixed(3), a: +l1[idx('lago 1')].toFixed(3), hzDe: +hzP(l1[idx(k ? 'hombro este' : 'hombro oeste')]).toFixed(2), hzA: +hzP(l1[idx('lago 1')]).toFixed(2), dur: 1.2, v: 0.25, interludio: true }));
  RIOS.sort((a, b) => a.t - b.t);
}
// los lagos (gong): se llenan en los pre-coros; el lago colgado (el canal paralelo) en el coro 2 y el coro final
export const LAGOS = [];
for (const s of SECCIONES.filter((x) => x.nombre.startsWith('pre-coro'))) {
  const n = 16, ls = [idx('lago 1'), idx('lago 3'), idx('lago 4')];
  for (let i = 0; i < n; i++) { const tt = tDe(s.desde) + (i / n) ** 0.7 * (s.hasta - s.desde) * BAR; const l = LINEAS[s.epoca === 0 ? 1 : s.epoca][ls[i % 3]]; LAGOS.push({ t: +tt.toFixed(3), tipo: 'tamtam', hz: +hzP(l).toFixed(2), v: +(0.15 + 0.35 * i / n).toFixed(2), lago: T.rasgos[ls[i % 3]].nombre }); }
}
for (const s of SECCIONES.filter((x) => x.nombre === 'coro 2' || x.nombre === 'coro final')) LAGOS.push({ t: +tDe(s.desde + 2).toFixed(3), tipo: 'cruce', hz: +hzP(LINEAS[s.epoca][idx('lago 2')]).toFixed(2), v: 0.5, lago: 'lago 2 (colgado)' });
// la resonancia: Cuerda que recuerda en cada línea del espectro de la época (después de cada ataque del trombón)
export const RESONANCIA = TROMBON.map((a, k) => ({ t: a.t, hasta: k + 1 < TROMBON.length ? TROMBON[k + 1].t : tDe(COMPASES + 1), epoca: a.epoca, lineas: LINEAS[a.epoca].map((p) => ({ p: +p.toFixed(3), hz: +hzP(p).toFixed(2) })) }));
// la garganta canta con el corte del rift de su época; el viento sopla sobre el corte de la supercaldera en el puente
export const GARGANTA = { largo: 2, aprende: 0.65, cortes: T.epocas.map((e) => e.corte),
  // la intro: el tubo de la meseta (plano) canta su unísono, mi3; el final: el tubo de la supercaldera en el piso (do3)
  eventos: [
    { t: tDe(1, 1), dur: 3 * BAR, nota: midiHz(hzP(5)), fonemas: ['a'], v: 0.5, aprende: 0.2, ronco: 0.3, epoca: 0, seccion: 'intro' },
    { t: tDe(67), dur: 4 * BAR - 1, nota: midiHz(hzP(LINEAS[4][0]) / 2), fonemas: ['u'], v: 0.45, aprende: 0.25, ronco: 0.35, epoca: 4, seccion: 'final' },
    ...[0, 2, 4, 6].map((k) => ({ t: tDe(47 + k), dur: 2 * BAR - 0.2, nota: midiHz(hzP(LINEAS[4][0]) / 2), fonemas: [['a'], ['o'], ['a'], ['u']][k / 2], v: 0.5, aprende: 0.25, ronco: 0.4, epoca: k < 6 ? 3 : 4, seccion: 'puente' })),
  ] };
// la resonancia se vuelve a pulsar al empezar cada sección (con el espectro de su época), más suave que tras un ataque
export const PULSOS = SECCIONES.map((s, k) => ({ t: tDe(s.desde), epoca: s.epoca, A: TROMBON.some((a) => Math.abs(a.t - tDe(s.desde)) < 1e-6) ? 3 : 1.8, seccion: s.nombre }));
// el espacio: RT60 = 0,6 s + 1 s por cada km de hondura del rift (los hombros sobre el piso). Decisión de mezcla
const hond = T.epocas.map((e) => ((e.m[1] + e.m[2]) / 2 - e.m[0]) / 1000);
export const ESPACIO = T.epocas.map((e, k) => ({ epoca: e.epoca, hondura_km: +hond[k].toFixed(3), rt60: +(0.6 + Math.max(0, hond[k])).toFixed(2) }));
export const VIENTO = { desde: tDe(47), hasta: tDe(55), corte: T.epocas[4].corte };

if (import.meta.url === `file://${process.argv[1]}`) {
  const P = { titulo: 'El rift se abre', subtitulo: 'balada de K-pop por forma; Grisey y Murail por dentro', bpm: BPM, compas: '4/4', do1: DO1, unidad_m_por_parcial: UNIDAD, duracion: tDe(COMPASES + 1), lamina: T.lamina, historia: T.historia, secciones: SECCIONES, lineas: LINEAS.map((l) => l.map((p) => +p.toFixed(3))), rasgos: T.rasgos.map((r) => r.nombre), acordes: ACORDES, armonia: ARMONIA, melodia: MELODIA, letra_fuentes: LETRA_FUENTES, coro: CORO, trombon: TROMBON, arco: ARCO, rios: RIOS, lagos: LAGOS, resonancia: RESONANCIA, garganta: GARGANTA, viento: VIENTO, pulsos: PULSOS, espacio: ESPACIO };
  writeFileSync(new URL('./partitura.json', import.meta.url), JSON.stringify(P, null, 1) + '\n');
  console.log(`partitura.json · ${COMPASES} compases · ${(P.duracion / 60).toFixed(2)} min · ${MELODIA.length} sílabas · ${ARMONIA.length} acordes · ${RIOS.length} ríos · ${LAGOS.length} lagos`);
  console.log('épocas (parciales):'); LINEAS.forEach((l, k) => console.log(' ', T.historia[k].padEnd(17), l.map((p) => p.toFixed(2)).join(' ')));
  for (const g of ['IV', 'V', 'iii', 'vi']) console.log(g.padEnd(4), [1, 3, 4].map((e) => `${T.historia[e].slice(0, 6)}: ` + ARMONIA.find((a) => a.grado === g && a.epoca === e)?.tonos.map((x) => `${x.parcial}${x.desvio ? (x.desvio > 0 ? '+' : '') + x.desvio.toFixed(0) + 'c' : ''}`).join(' ')).join(' | '));
  console.log('arco:', ARCO.map((a) => `${a.seccion} ${a.modo}`).join(' · '));
}
