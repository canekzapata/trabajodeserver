// renderizar.mjs — la reescritura retrospectiva de una frase, como audio.
//   node renderizar.mjs <ataques|alturas|mixto> salida.wav
// Forma: la frase como se tocó → la historia que sostiene su regreso (3 vueltas)
//        → sólo lo que volvió (1 vuelta) → la historia otra vez (2 vueltas).
// Escribe además salida.json con la negociación completa.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { negociar, VERSION } from './bucle.mjs';
import { reescritura } from './sintesis.mjs';

export const CFG = { L: 16, d: 4, n: 4 };
export const FRASE = [[0, 60], [2, 62], [3, 63], [6, 67], [8, 61], [12, 65]];
export const RESTR = { maxVoces: 4, choques: [1] };
export const PASO = 0.2;

export function pieza(prioridad, sr = 48000) {
  const res = negociar(FRASE, CFG, RESTR, { prioridad, callar: 8 });
  if (!res.H) throw new Error(`sin historia: ${res.estado}`);
  const r = reescritura({ frase: FRASE, H: res.H, tocada: res.tocada, L: CFG.L, paso: PASO, sr });
  return { ...r, res };
}

export function wav16(audio, sr) {
  const n = audio.length, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, audio[i])) * 32767), 44 + i * 2);
  return b;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [prioridad, salida] = process.argv.slice(2);
  if (!['ataques', 'alturas', 'mixto'].includes(prioridad) || !salida) { console.error('uso: node renderizar.mjs <ataques|alturas|mixto> salida.wav'); process.exit(1); }
  const { audio, res, pico, ganancia, inicios } = pieza(prioridad);
  const w = wav16(audio, 48000);
  const sha = createHash('sha256').update(w).digest('hex');
  writeFileSync(salida, w);
  writeFileSync(salida.replace(/\.wav$/, '.json'), JSON.stringify({
    version: VERSION, sha256: sha, cfg: CFG, restricciones: RESTR, prioridad, paso: PASO, inicios_s: inicios, pico_antes_de_ganancia: pico, ganancia,
    estado: res.estado, costo: res.costo, empates: res.empates, nodos: res.nodos,
    cambios: res.elegida.map((e) => ({ original: e.original, ahora: e.nota, cambio: e.cambio })),
    historia: res.H,
  }, null, 1));
  console.log(`${salida}  ${(audio.length / 48000).toFixed(1)} s  ${res.estado} costo=${res.costo} empates=${res.empates}  ${res.H.length} notas  pico=${pico.toFixed(3)}  sha256=${sha.slice(0, 12)}`);
}
