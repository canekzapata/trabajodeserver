// pruebas.mjs — pruebas que pueden fallar.  node pruebas.mjs
// Lo que se afirma del instrumento sale de aquí; lo que no pasa, se reporta como no pasa.
import { createHash } from 'node:crypto';
import { Cuerpo, medir, COMARCAS } from './motor.mjs';

let fallas = 0;
const ok = (c, nombre, det = '') => { console.log(`${c ? 'ok   ' : 'FALLA'}  ${nombre}${det ? '  · ' + det : ''}`); if (!c) fallas++; };
const sr = 48000, sCuerda = (beta) => 0.62 - beta * 0.5;

export function toma(mano, seg = 0.6, p = {}) {
  const c = new Cuerpo(sr, p); c.ponerMano(mano);
  const n = Math.round(seg * sr), w = Math.round(0.25 * sr), vc = new Float64Array(w), out = new Float64Array(w), onda = new Float64Array(w);
  let d0 = 0;
  for (let i = 0; i < n; i++) { const o = c.muestra(); const j = i - (n - w); if (j === 0) d0 = c.deslizar; if (j >= 0) { vc[j] = c.vContacto; out[j] = o; onda[j] = c.cuerda.wP; } }
  return { ...medir(vc, out, sr, c.P, c.deslizar - d0), onda, out };
}
const altas = (x, desde = 2000) => { const n = 4096; let a = 0, t = 0; for (let k = 1; k < n / 2; k += 3) { let re = 0, im = 0; for (let i = 0; i < n; i++) { const g = (2 * Math.PI * k * i) / n; re += x[i] * Math.cos(g); im -= x[i] * Math.sin(g); } const e = re * re + im * im; t += e; if ((k * sr) / n > desde) a += e; } return a / t; };
const helm = (m) => m.regimen === 'periódico' && Math.abs(m.porPeriodo - 1) < 0.1;

// 1. La presión sin movimiento no suena
{ const m = toma({ s: 0.52, F: 3, v: 0 }); ok(m.rms < 1e-9, 'F > 0, v = 0: silencio', `rms ${m.rms.toExponential(1)}`); }

// 2. Helmholtz existe, con la altura de la cuerda
{ const m = toma({ s: sCuerda(0.2), F: 0.8, v: 0.1 }); ok(helm(m) && Math.abs(1200 * Math.log2(m.hz / 110)) < 10, 'cuerda, β = 0,2, F = 0,8: Helmholtz a 110 Hz', `${m.porPeriodo.toFixed(2)} desl./periodo, ${m.hz.toFixed(2)} Hz`); }

// 3. Apretar no es subir el volumen: dentro de la isla el nivel casi no cambia y crece la energía aguda
{
  const Fs = [0.4, 0.8, 1.6], ms = Fs.map((F) => toma({ s: sCuerda(0.2), F, v: 0.1 }));
  const db = ms.map((m) => 20 * Math.log10(m.rms)), hf = ms.map((m) => altas(m.onda));
  ok(ms.every(helm) && Math.max(...db) - Math.min(...db) < 1 && hf[0] < hf[1] && hf[1] < hf[2], 'en la isla: mismo nivel, más brillo al apretar',
    `nivel ${db.map((d) => d.toFixed(1)).join(' / ')} dB · energía > 2 kHz ${hf.map((h) => (h * 100).toFixed(2)).join(' / ')} %`);
}

// 4. La velocidad del arco sí sube el volumen: el doble de v, el doble de amplitud (+6 dB), en Helmholtz
{
  const a = toma({ s: sCuerda(0.2), F: 0.8, v: 0.1 }), b = toma({ s: sCuerda(0.2), F: 1.6, v: 0.2 });
  const d = 20 * Math.log10(b.rms / a.rms);
  ok(helm(a) && helm(b) && Math.abs(d - 6.02) < 1.5, 'el doble de velocidad (y de fuerza): +6 dB', `${d.toFixed(2)} dB`);
}

// 5. Fuera de la isla: con poca fuerza, dos deslizamientos; con mucha, varios; con demasiada, aperiódico
{
  const [bajo, medio, alto] = [0.2, 9, 25].map((F) => toma({ s: sCuerda(0.2), F, v: 0.1 }));
  ok(Math.abs(bajo.porPeriodo - 2) < 0.2 && medio.porPeriodo > 3 && alto.regimen === 'aperiódico', 'debajo: 2 desl. · encima: varios · mucho encima: aperiódico',
    `F=0,2: ${bajo.porPeriodo.toFixed(1)} · F=9: ${medio.porPeriodo.toFixed(1)} desl./periodo · F=25: ${alto.regimen}`);
}

// 6. El camino decide: la misma fuerza da Helmholtz si se aplica de golpe y dos deslizamientos si se llega por
//    una rampa lenta desde abajo (la cuerda queda atrapada en el régimen por el que entró)
{
  const directo = toma({ s: sCuerda(0.2), F: 1, v: 0.1 });
  const c = new Cuerpo(sr), n = 3 * sr; c.ponerMano({ s: sCuerda(0.2), F: 0.15, v: 0.1 });
  const w = 12000, vc = new Float64Array(w), out = new Float64Array(w); let d0 = 0;
  for (let t = 0; t < n; t++) { c.mano.F = 0.15 * (1 / 0.15) ** Math.min(1, t / (2 * sr)); const o = c.muestra(); const j = t - (n - w); if (j === 0) d0 = c.deslizar; if (j >= 0) { vc[j] = c.vContacto; out[j] = o; } }
  const rampa = medir(vc, out, sr, c.P, c.deslizar - d0);
  ok(helm(directo) && Math.abs(rampa.porPeriodo - 2) < 0.3, 'el camino decide: F = 1 de golpe da Helmholtz; por rampa desde 0,15 da 2 deslizamientos',
    `de golpe: ${directo.porPeriodo.toFixed(2)} · por rampa: ${rampa.porPeriodo.toFixed(2)} desl./periodo`);
}

// 7. El raspado del anclaje: a v = 0,1 la periodicidad es la de las crestas (200 por segundo)
{
  const m = toma({ s: 0.06, F: 1, v: 0.1 });
  ok(m.regimen === 'periódico' && Math.abs(m.hz - 200) / 200 < 0.03, 'anclaje, v = 0,1: pulsos a v/d = 200 por segundo', `${m.hz.toFixed(1)} Hz`);
}

// 8. Reproducible
{ const h = [0, 1].map(() => createHash('sha256').update(Buffer.from(Float64Array.from(toma({ s: 0.75, F: 1, v: 0.1 }, 0.3).out).buffer)).digest('hex')); ok(h[0] === h[1], 'sonido reproducible', h[0].slice(0, 12)); }

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\ntodas las pruebas pasaron');
process.exit(fallas ? 1 : 0);
