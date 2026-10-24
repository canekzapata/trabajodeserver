import { cuerda, regimen } from './sonda.mjs';
const betas = [0.04, 0.06, 0.09, 0.13, 0.19, 0.28];
const Fs = Array.from({ length: 33 }, (_, i) => 0.005 * 10 ** (i / 10));
for (const vb of [0.05, 0.1]) {
  console.log(`\nvb = ${vb}`);
  const fronteras = [];
  for (const beta of betas) {
    const fila = Fs.map((F) => regimen(cuerda({ beta, F, vb })));
    const hel = Fs.filter((F, i) => fila[i].nombre === 'Helmholtz');
    const fmin = hel.length ? Math.min(...hel) : null, fmax = hel.length ? Math.max(...hel) : null;
    fronteras.push([beta, fmin, fmax]);
    console.log(`β=${beta}  ` + fila.map((r) => ({ 'pegado': '·', 'aperiódico': 'x', 'Helmholtz': 'H' })[r.nombre] || (r.porPeriodo > 1.5 ? '2' : 's')).join(''), `  Helmholtz F ∈ [${fmin?.toFixed(3)}, ${fmax?.toFixed(3)}]`);
  }
  const ok = fronteras.filter((f) => f[1]);
  const pend = (k) => { const xs = ok.map((f) => Math.log(f[0])), ys = ok.map((f) => Math.log(f[k])); const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length; return xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / xs.reduce((a, x) => a + (x - mx) ** 2, 0); };
  console.log(`pendiente log-log de F_min contra β: ${pend(1).toFixed(2)} (Schelleng: −2) · de F_max: ${pend(2).toFixed(2)} (Schelleng: −1)`);
  globalThis['F' + vb] = fronteras;
}
const r = globalThis['F0.1'].map((f, i) => [f[0], f[1] && globalThis['F0.05'][i][1] ? f[1] / globalThis['F0.05'][i][1] : null, f[2] && globalThis['F0.05'][i][2] ? f[2] / globalThis['F0.05'][i][2] : null]);
console.log('\nrazón de fronteras al duplicar vb (Schelleng: 2 y 2):', r.map(([b, a, c]) => `β=${b}: ${a?.toFixed(2)} / ${c?.toFixed(2)}`).join(' · '));
