// sintesis.mjs — cómo suena una historia. Lo usan la página (en un AudioBuffer) y Node, igual.
// Dos timbres, como interpretación declarada (no como dato del modelo):
//   madera: las notas que alguien tocó (también son regresos de otras)
//   vidrio: las notas que sólo llegaron de regreso
const hz = (p) => 440 * 2 ** ((p - 69) / 12);
const TIMBRES = {
  madera: { parciales: [[1, 1, 0.55], [3.99, 0.35, 0.18], [9.1, 0.12, 0.06]], ataque: 0.002, nivel: 0.22 },
  vidrio: { parciales: [[1, 1, 1.4], [2.01, 0.4, 0.9], [3.02, 0.25, 0.6], [4.23, 0.12, 0.35]], ataque: 0.012, nivel: 0.13 },
};

// suma una nota en buf a partir de la muestra i0; envolver = el final vuelve al principio (bucle sin costura)
export function nota(buf, sr, i0, p, timbre, envolver = false) {
  const T = TIMBRES[timbre], f0 = hz(p), n = Math.round(sr * 3);
  const at = T.ataque * sr;
  for (const [r, a, tau] of T.parciales) {
    const f = f0 * r; if (f > sr * 0.45) continue;
    const w = 2 * Math.PI * f / sr, k = Math.exp(-1 / (tau * sr));
    let env = a * T.nivel;
    for (let i = 0; i < n; i++) {
      let j = i0 + i;
      if (j >= buf.length) { if (!envolver) break; j %= buf.length; }
      const sube = i < at ? i / at : 1;
      buf[j] += env * sube * Math.sin(w * i);
      env *= k;
      if (env < 1e-5) break;
    }
  }
}

// una vuelta del bucle; qué: 'historia' | 'tocada' | 'regresos'
export function vuelta({ H, tocada, L, paso, sr, que = 'historia', cola = 0 }) {
  // con cola = 0 el final envuelve al principio; con cola > 0 las resonancias se dejan apagar
  const buf = new Float32Array(Math.round((L * paso + cola) * sr));
  const mias = new Set(tocada.map(([t, p]) => t * 256 + p));
  for (const [t, p] of H) {
    const mia = mias.has(t * 256 + p);
    if (que === 'tocada' && !mia) continue;
    if (que === 'regresos' && mia) continue;
    nota(buf, sr, Math.round(t * paso * sr), p, mia ? 'madera' : 'vidrio', cola === 0);
  }
  return buf;
}

// la frase como se tocó, antes de negociar (sin bucle)
export function fraseSola({ frase, L, paso, sr }) {
  const buf = new Float32Array(Math.round((L * paso + 2) * sr));
  for (const [t, p] of frase) nota(buf, sr, Math.round(t * paso * sr), p, 'madera');
  return buf;
}

// la reescritura retrospectiva completa: la frase como se tocó → la historia (3 vueltas)
// → sólo lo que volvió → la historia (2 vueltas, la última deja apagar sus colas).
// Una sola ganancia para toda la pieza: pico a −2 dBFS.
export function reescritura({ frase, H, tocada, L, paso, sr }) {
  const base = { H, tocada, L, paso, sr };
  const partes = [
    fraseSola({ frase, L, paso, sr }),
    ...Array(3).fill(vuelta({ ...base, que: 'historia' })),
    vuelta({ ...base, que: 'regresos' }),
    vuelta({ ...base, que: 'historia' }),
    vuelta({ ...base, que: 'historia', cola: 2 }),
  ];
  const out = new Float32Array(partes.reduce((s, p) => s + p.length, 0));
  let i = 0;
  for (const p of partes) { out.set(p, i); i += p.length; }
  let pico = 0; for (const v of out) pico = Math.max(pico, Math.abs(v));
  const g = pico > 0 ? 0.794 / pico : 1;
  for (let j = 0; j < out.length; j++) out[j] *= g;
  return { audio: out, pico, ganancia: g, inicios: partes.reduce((a, p) => [...a, a[a.length - 1] + p.length / sr], [0]).slice(0, -1) };
}
