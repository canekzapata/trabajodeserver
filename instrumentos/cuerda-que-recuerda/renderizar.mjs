// renderizar.mjs — un golpe y lo que la cuerda hace con él, como WAV + traza de medidas.
//   node renderizar.mjs <lineal|beta6|beta8|beta12|alfa4|local8> salida.wav
// Misma ganancia de captación en todas las tomas (sin normalizar), para poder compararlas.
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Cuerda, VERSION } from './motor.mjs';
import { TOMAS } from './tomas.mjs';
export { TOMAS };

export const DUR = 20, F0 = 110, GANANCIA = 2.2;

export function tomar(nombre, sr = 48000) {
  const T = TOMAS[nombre];
  const s = new Cuerda(sr, { f0: F0, ganancia: GANANCIA, ...T.p });
  s.c.golpe(T.golpe);
  const n = DUR * sr, out = new Float32Array(n), bloque = sr / 100, traza = [];
  for (let i = 0; i < n; i += bloque) {
    const m = s.c.medidas();
    traza.push([+(i / sr).toFixed(3), +(m.e[0] / m.total).toFixed(5), +m.regresoEnergia.toFixed(5), +m.forma.toFixed(5), +m.desfase1.toFixed(4), +m.E.toFixed(6), +m.pares.toExponential(2), +m.entropia.toFixed(4), Array.from(m.e.slice(0, 8), (x) => +(x / m.total).toFixed(4))]);
    s.procesar(out, Math.min(bloque, n - i), i);
  }
  return { out, traza, s, T };
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
  const { out, traza, s, T } = tomar(nombre);
  const w = wav16(out, 48000), sha = createHash('sha256').update(w).digest('hex');
  writeFileSync(salida, w);
  let pico = 0; for (const x of out) pico = Math.max(pico, Math.abs(x));
  writeFileSync(salida.replace(/\.wav$/, '.json'), JSON.stringify({
    version: VERSION, toma: nombre, nota: T.nota, sha256: sha, f0: F0, ganancia: GANANCIA, parametros: s.p, golpe: T.golpe, pico, limitador: s.limitador,
    columnas: ['t_s', 'E1_fraccion', 'regreso_energia', 'forma', 'desfase1_rad', 'E_total', 'pares', 'entropia_bits', 'E1..E8_fraccion'], traza,
  }));
  console.log(`${salida}  pico=${pico.toFixed(3)} limitador=${s.limitador} sha256=${sha.slice(0, 12)}`);
}
