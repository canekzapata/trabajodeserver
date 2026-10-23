// renderizar.mjs — vuelve a calcular una toma, o una partitura de gestos, fuera del navegador.
//   node renderizar.mjs toma.json salida.wav        una toma grabada en la página
//   node renderizar.mjs demo:impulsos salida.wav    partitura de demostración
//   node renderizar.mjs demo:ausente salida.wav
// Escribe además salida.json con la velocidad del disco cada 10 ms.
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Trompo, PATRONES, BLOQUE, VERSION } from './motor.mjs';

export function aplicar(t, m) {
  if (m.tipo === 'entrada') t.ponerEntrada(m.entrada);
  else if (m.tipo === 'params') t.ponerParams(m.params);
  else if (m.tipo === 'patron') t.ponerPatron(m.patron || PATRONES[m.nombre]());
}

// toma: { sr, inicial (instantánea), cambios: [{ b, m }], bloques }
export function renderizar(toma, alMuestrear) {
  const t = Trompo.desde(toma.sr, toma.inicial);
  const out = new Float32Array(toma.bloques * BLOQUE);
  const cambios = [...toma.cambios].sort((x, y) => x.b - y.b);
  let c = 0;
  for (let b = 0; b < toma.bloques; b++) {
    while (c < cambios.length && cambios[c].b === b) aplicar(t, cambios[c++].m);
    t.procesar(out, BLOQUE, b * BLOQUE);
    if (alMuestrear) alMuestrear(b, t);
  }
  return { audio: out, trompo: t };
}

// partitura de gestos en segundos → toma
export function tomaDesdeGestos({ sr = 48000, duracion, params = {}, patron = 'ocho-colores', gestos }) {
  const t = new Trompo(sr, params, PATRONES[patron]());
  const b = (s) => Math.round((s * sr) / BLOQUE);
  return {
    version: VERSION, sr, bloque: BLOQUE, inicial: t.instantanea(), bloques: b(duracion),
    cambios: gestos.map(([s, m]) => ({ b: b(s), m })),
  };
}

const E = (entrada) => ({ tipo: 'entrada', entrada });
const empujon = (s, dur, fuerza = 8) => [[s, E({ empuje: fuerza })], [s + dur, E({ empuje: 0 })]];
// acelerar con cuatro empujones, dejar girar, frenar rozando, soltar, impulsar con la mano, frenar del todo
export const GESTOS_DEMO = [
  ...empujon(0.5, 0.25), ...empujon(1.5, 0.25), ...empujon(2.5, 0.3), ...empujon(3.4, 0.3),
  [7.0, E({ mano: true, wMano: 0, presion: 0.1 })], // rozar: freno seco suave
  [9.5, E({ mano: false })],
  [12.0, E({ mano: true, wMano: 9, presion: 0.5 })], // arrastrar: la mano lleva al disco
  [13.5, E({ mano: false, wMano: 0 })],
  [16.5, E({ mano: true, wMano: 0, presion: 1 })], // sujetar
  [18.5, E({ mano: false })],
];
export const DEMOS = {
  impulsos: { duracion: 21, patron: 'ocho-colores', params: { modo: 'impulsos' }, gestos: GESTOS_DEMO },
  ausente: { duracion: 21, patron: 'ocho-colores', params: { modo: 'ausente' }, gestos: GESTOS_DEMO },
  ritmo: { duracion: 21, patron: 'ritmo', params: { modo: 'impulsos' }, gestos: GESTOS_DEMO },
};

export function wav16(audio, sr) {
  const n = audio.length, buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24); buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, audio[i])) * 32767), 44 + i * 2);
  return buf;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [fuente, salida] = process.argv.slice(2);
  if (!fuente || !salida) { console.error('uso: node renderizar.mjs <toma.json | demo:impulsos | demo:ausente | demo:ritmo> <salida.wav>'); process.exit(1); }
  const toma = fuente.startsWith('demo:') ? tomaDesdeGestos(DEMOS[fuente.slice(5)]) : JSON.parse(readFileSync(fuente, 'utf8'));
  const cada = Math.round(0.01 * toma.sr / BLOQUE) || 1;
  const traza = [];
  const { audio, trompo } = renderizar(toma, (b, t) => { if (b % cada === 0) traza.push([+(b * BLOQUE / toma.sr).toFixed(4), +t.omega.toFixed(5)]); });
  const w = wav16(audio, toma.sr);
  writeFileSync(salida, w);
  const sha = createHash('sha256').update(w).digest('hex');
  writeFileSync(salida.replace(/\.wav$/, '') + '.json', JSON.stringify({ version: VERSION, fuente, sha256: sha, eventos: trompo.contador.eventos, limitador: trompo.contador.limitador, toma, traza }, null, 1));
  console.log(`${salida}  ${(audio.length / toma.sr).toFixed(2)} s  eventos=${trompo.contador.eventos}  limitador=${trompo.contador.limitador}  sha256=${sha.slice(0, 12)}`);
}
