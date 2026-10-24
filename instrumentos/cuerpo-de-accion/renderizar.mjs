// renderizar.mjs — una partitura de acción → WAV + JSON (acción y régimen medido cada 0,1 s).
//   node renderizar.mjs <isla|camino|geografia|raspado|presion|materiales|toma.json> salida.wav
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Cuerpo, medir, manoEn, comarca, VERSION } from './motor.mjs';
import { PARTITURAS, duracion } from './tomas.mjs';

export function tocar(partitura, sr = 48000, alPaso) {
  const c = new Cuerpo(sr), n = Math.round(duracion(partitura) * sr), out = new Float32Array(n);
  const ven = Math.round(0.1 * sr), vc = new Float64Array(ven), ov = new Float64Array(ven); let d0 = 0;
  const traza = [];
  for (let i = 0; i < n; i++) {
    if (i % 32 === 0) c.ponerMano(manoEn(partitura, i / sr));
    const o = c.muestra(); out[i] = o; const j = i % ven; vc[j] = c.vContacto; ov[j] = o;
    if (j === ven - 1) {
      const m = medir(vc, ov, sr, c.P, c.deslizar - d0); d0 = c.deslizar;
      const mano = c.mano, com = comarca(mano.s).nombre;
      traza.push({ t: +((i + 1) / sr).toFixed(2), s: +mano.s.toFixed(4), F: +mano.F.toFixed(4), v: +mano.v.toFixed(4), material: mano.material, comarca: com, beta: com === 'cuerda' ? +c.beta(mano.s).toFixed(3) : null, regimen: m.regimen, desl: +m.porPeriodo.toFixed(2), hz: +m.hz.toFixed(2), db: +(20 * Math.log10(m.rms + 1e-12)).toFixed(1), centroide: +m.centroide.toFixed(0) });
      if (alPaso) alPaso(traza[traza.length - 1]);
    }
  }
  return { out, traza };
}

export function wav16(a, sr) {
  const n = a.length, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a[i])) * 32767), 44 + i * 2);
  return b;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [fuente, salida] = process.argv.slice(2);
  const partitura = PARTITURAS[fuente] || (fuente && fuente.endsWith('.json') ? JSON.parse(readFileSync(fuente, 'utf8')) : null);
  if (!partitura || !salida) { console.error('uso: node renderizar.mjs <' + Object.keys(PARTITURAS).join('|') + '|toma.json> salida.wav'); process.exit(1); }
  const { out, traza } = tocar(partitura);
  const w = wav16(out, 48000), sha = createHash('sha256').update(w).digest('hex');
  writeFileSync(salida, w);
  let pico = 0; for (const x of out) pico = Math.max(pico, Math.abs(x));
  writeFileSync(salida.replace(/\.wav$/, '.json'), JSON.stringify({ version: VERSION, fuente, nota: partitura.nota, sha256: sha, pico, partitura, traza }));
  console.log(`${salida}  pico=${pico.toFixed(3)}  sha256=${sha.slice(0, 12)}`);
}
