import { cuerda, regimen } from './sonda.mjs';
const n = 240000, beta = 0.13, vb = 0.1;
const lo = 0.3, hi = 8;
// sube de lo a hi en la primera mitad y baja en la segunda (rampa exponencial lenta: 2,5 s por sentido)
const Fr = (t) => { const u = t < n / 2 ? t / (n / 2) : 2 - t / (n / 2); return lo * (hi / lo) ** u; };
const r = cuerda({ beta, F: 0, vb, n, Frampa: Fr });
const ven = 2400, filas = [];
for (let a = ven; a + ven <= n; a += ven) {
  const sub = { vbow: r.vbow.slice(a, a + ven), desl: r.desl.slice(a, a + ven) };
  const g = regimen(sub, 0);
  filas.push([a, Fr(a + ven / 2), g.nombre]);
}
const subida = filas.filter((f) => f[0] < n / 2), bajada = filas.filter((f) => f[0] >= n / 2);
const borde = (lista) => { const out = []; for (let i = 1; i < lista.length; i++) if (lista[i][2] !== lista[i - 1][2]) out.push(`${lista[i - 1][2]} → ${lista[i][2]} en F≈${lista[i][1].toFixed(2)}`); return out; };
console.log('subiendo:', borde(subida).join(' | '));
console.log('bajando: ', borde(bajada).join(' | '));
