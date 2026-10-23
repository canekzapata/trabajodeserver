// renderizar.mjs — las versiones de la balada como WAV estéreo + JSON con ataques y encuentros.
//   node renderizar.mjs <heredada|reiniciada|cerca|lejos> salida.wav
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { VERSION, ataques, encuentros, inicios } from './razon.mjs';
import { versiones } from './balada.mjs';
import { cantar } from './sintesis.mjs';

export function wav16(L, R, sr) {
  const n = L.length, b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(sr, 24);
  b.writeUInt32LE(sr * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  const q = (x) => Math.round(Math.max(-1, Math.min(1, x)) * 32767);
  for (let i = 0; i < n; i++) { b.writeInt16LE(q(L[i]), 44 + i * 4); b.writeInt16LE(q(R[i]), 46 + i * 4); }
  return b;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [nombre, salida] = process.argv.slice(2);
  const V = versiones();
  if (!V[nombre] || !V[nombre].partitura || !salida) { console.error('uso: node renderizar.mjs <heredada|reiniciada|cerca|lejos> salida.wav'); process.exit(1); }
  const p = V[nombre].partitura, sr = 48000;
  const { L, R, pico, ganancia } = cantar(p, sr);
  const w = wav16(L, R, sr);
  const sha = createHash('sha256').update(w).digest('hex');
  writeFileSync(salida, w);
  const { ataques: A } = ataques(p);
  const E = encuentros(A, p.secciones[0].voces.length, 0.025);
  writeFileSync(salida.replace(/\.wav$/, '.json'), JSON.stringify({
    version: VERSION, version_nombre: nombre, nota: V[nombre].nota, sha256: sha, K: p.K, ref: p.ref, fases: p.fases,
    secciones: p.secciones.map((s) => s.nombre), inicios: inicios(p), afinacion: p.afinacion || null, informe: V[nombre].informe || null,
    pico_antes_de_ganancia: pico, ganancia, tau: 0.025,
    ataques: A.map((a) => [a.v, +a.t.toFixed(6)]), encuentros: E.map((e) => ({ t: +e.t.toFixed(4), voces: e.voces, total: e.total })),
  }, null, 1));
  console.log(`${salida}  ${(L.length / sr).toFixed(1)} s  ataques=${A.length} encuentros=${E.length} totales=${E.filter((e) => e.total).length}  sha256=${sha.slice(0, 12)}`);
}
