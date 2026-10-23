// renderizar.mjs — una toma como WAV + JSON (energía, c efectiva y quimógrafo de la cuerda).
//   node renderizar.mjs <presente|pasado|oblicuo|memoria|kirchhoff|estrato> salida.wav
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Sampleador, VERSION } from './motor.mjs';
import { GESTOS, DUR, TOMAS } from './tomas.mjs';

export function aplicar(s, a) {
  if (a.nota !== undefined) { if (a.nota) { s.p.f = a.nota; s.gate = 1; } else s.gate = 0; }
  if (a.pulsar) s.h.pulsar(a.pulsar.x, a.pulsar.A);
  if (a.golpear) s.h.golpear(a.golpear.x, a.golpear.A);
  if (a.params) s.ponerParams(a.params);
  if (a.cristalizar) s.cristalizar();
}

export function tomar(nombre, sr = 48000) {
  const T = TOMAS[nombre];
  const s = new Sampleador(sr, { ...T.p });
  const gestos = [...GESTOS, ...(T.extra || [])].sort((a, b) => a[0] - b[0]);
  const n = Math.round(DUR * sr), out = new Float32Array(n), cuadro = Math.round(sr / 50);
  const kimo = [], energia = [];
  let g = 0;
  for (let i = 0; i < n; i += cuadro) {
    const t = i / sr;
    while (g < gestos.length && gestos[g][0] <= t + 1e-9) aplicar(s, gestos[g++][1]);
    kimo.push(Array.from({ length: 32 }, (_, k) => +s.h.u[2 * k].toFixed(4)));
    const e = s.h.energia(); energia.push([+t.toFixed(2), +e.cuerda.toFixed(6), +e.memoria.toFixed(6), +Math.sqrt(s.h.c2()).toFixed(4)]);
    s.procesar(out, Math.min(cuadro, n - i), i);
  }
  return { out, s, T, kimo, energia };
}

export function wav16(a, sr) {
  const n = a.length, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a[i])) * 32767), 44 + i * 2);
  return b;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [nombre, salida] = process.argv.slice(2);
  if (!TOMAS[nombre] || !salida) { console.error('uso: node renderizar.mjs <' + Object.keys(TOMAS).join('|') + '> salida.wav'); process.exit(1); }
  const { out, s, T, kimo, energia } = tomar(nombre);
  const w = wav16(out, 48000), sha = createHash('sha256').update(w).digest('hex');
  writeFileSync(salida, w);
  let pico = 0; for (const x of out) pico = Math.max(pico, Math.abs(x));
  writeFileSync(salida.replace(/\.wav$/, '.json'), JSON.stringify({ version: VERSION, toma: nombre, nota: T.nota, sha256: sha, parametros: { ...s.p, ...s.h.p }, pico, cuadro_s: 0.02, energia_columnas: ['t', 'cuerda', 'memoria', 'c_efectiva'], energia, kimografo: kimo }));
  console.log(`${salida}  pico=${pico.toFixed(3)}  sha256=${sha.slice(0, 12)}`);
}
