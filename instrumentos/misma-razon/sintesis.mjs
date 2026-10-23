// sintesis.mjs — un canto continuo que se rearticula en cada pulso. Lo usan la página y Node.
// Interpretación declarada, no dato del modelo:
// - la altura cambia en la frontera de la sección (con un deslizamiento de 60 ms), sin ataque nuevo;
// - cada ataque es una crecida de la voz, no un golpe: la voz nunca se calla del todo;
// - timbre aditivo de 8 parciales con dos formantes cerca de «o» (500 y 900 Hz).
import { ataques, frecuencias, inicios } from './razon.mjs';

const PAN = [0, -0.35, 0.35, 0.1];
const NIVEL = [1.0, 0.7, 0.65, 0.6];

function pesos(f) {
  const a = [];
  for (let k = 1; k <= 8; k++) {
    const fk = k * f;
    a.push(fk > 9000 ? 0 : (1 / k) * (1 + 2 * Math.exp(-(((fk - 500) / 160) ** 2)) + 1.2 * Math.exp(-(((fk - 900) / 220) ** 2))));
  }
  const s = Math.hypot(...a); return a.map((x) => x / s);
}

export function cantar(partitura, sr = 48000, cola = 3) {
  const { ataques: A, T } = ataques(partitura);
  const F = frecuencias(partitura);
  const dur = T[T.length - 1] + cola, n = Math.round(dur * sr);
  const L = new Float32Array(n), R = new Float32Array(n);
  const nv = F[0].length;
  for (let v = 0; v < nv; v++) {
    const mios = A.filter((a) => a.v === v).map((a) => a.t);
    const fases = new Float64Array(8);
    let s = 0, k = 0, f = F[0][v], w = pesos(f);
    const gl = Math.cos((PAN[v] + 1) * Math.PI / 4), gr = Math.sin((PAN[v] + 1) * Math.PI / 4);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      while (s + 1 < F.length && t >= T[s + 1]) s++;
      // deslizamiento de 60 ms hacia la frecuencia de la sección
      const meta = F[s][v];
      f += (meta - f) * (1 - Math.exp(-1 / (0.06 * sr / 5)));
      if (i % 256 === 0) w = pesos(f);
      while (k + 1 < mios.length && mios[k + 1] <= t) k++;
      // crecida: suma de los dos últimos ataques; cada una decae en ~0.6 de su periodo
      const per = partitura.K / f;
      let crec = 0;
      for (const j of [k, k - 1]) {
        if (j < 0 || mios[j] > t) continue;
        const d = t - mios[j];
        crec += (1 - Math.exp(-d / 0.05)) * Math.exp(-d / (0.6 * per));
      }
      const fin = t > T[T.length - 1] ? Math.exp(-(t - T[T.length - 1]) / 0.8) : 1;
      const amp = NIVEL[v] * (0.28 + 0.72 * Math.min(1.2, crec)) * fin * Math.min(1, t / 0.3);
      let x = 0;
      for (let h = 0; h < 8; h++) {
        fases[h] += 2 * Math.PI * f * (h + 1) / sr;
        if (fases[h] > 1e4) fases[h] %= 2 * Math.PI;
        x += w[h] * Math.sin(fases[h]);
      }
      L[i] += x * amp * gl; R[i] += x * amp * gr;
    }
  }
  let pico = 0;
  for (let i = 0; i < n; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
  const g = pico > 0 ? 0.794 / pico : 1;
  for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
  return { L, R, pico, ganancia: g, dur };
}
