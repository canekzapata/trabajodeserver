// renderizar.mjs — una partitura de gestos → WAV + JSON (energía de cada modo cada 50 ms).
//   node renderizar.mjs <guardar|puertas|arpegio|espejo|sala|cerca|toma.json> salida.wav
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Coro, disenar, VERSION } from './motor.mjs';
import { PARTITURAS, aplicar, mezclar } from './tomas.mjs';

export function tocar(p, sr = 48000, diseno = disenar(p.diseno || {})) {
  const c = new Coro(sr, diseno), n = Math.round(p.fin * sr), out = [new Float32Array(n), new Float32Array(n)];
  const esc = { mezcla: 0, cantor: 2 }, ev = [...p.eventos], paso = Math.round(0.05 * sr), traza = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    while (ev.length && ev[0][0] * sr <= i) aplicar(c, ev.shift()[1], esc);
    const o = c.muestra(esc.cantor), [l, r] = mezclar(o, esc); out[0][i] = l; out[1][i] = r; acc += (l * l + r * r) / 2;
    if ((i + 1) % paso === 0) {
      traza.push({ t: +((i + 1) / sr).toFixed(2), modos: c.enModos().map((e) => +e.toExponential(3)), guardada: +c.guardada().toExponential(3), db: +(10 * Math.log10(acc / paso + 1e-15)).toFixed(1), escucha: esc.mezcla });
      acc = 0;
    }
  }
  return { out, traza, modos: c.modos.map(({ f, oscuro }) => ({ f, oscuro })) };
}

export function wav16([L, R], sr) { // estéreo: boca izquierda y boca derecha
  const n = L.length, b = Buffer.alloc(44 + n * 4), q = (x) => Math.round(Math.max(-1, Math.min(1, x)) * 32767);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { b.writeInt16LE(q(L[i]), 44 + i * 4); b.writeInt16LE(q(R[i]), 46 + i * 4); }
  return b;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [fuente, salida] = process.argv.slice(2);
  const p = PARTITURAS[fuente] || (fuente && fuente.endsWith('.json') ? JSON.parse(readFileSync(fuente, 'utf8')) : null);
  if (!p || !salida) { console.error('uso: node renderizar.mjs <' + Object.keys(PARTITURAS).join('|') + '|toma.json> salida.wav'); process.exit(1); }
  const { out, traza, modos } = tocar(p);
  const w = wav16(out, 48000), sha = createHash('sha256').update(w).digest('hex');
  let pico = 0; for (const x of [...out[0], ...out[1]]) pico = Math.max(pico, Math.abs(x));
  writeFileSync(salida, w);
  writeFileSync(salida.replace(/\.wav$/, '.json'), JSON.stringify({ version: VERSION, fuente, nota: p.nota, sha256: sha, pico, diseno: disenar(p.diseno || {}), modos, partitura: p, traza }));
  console.log(`${salida}  pico=${pico.toFixed(3)}  sha256=${sha.slice(0, 12)}`);
}
