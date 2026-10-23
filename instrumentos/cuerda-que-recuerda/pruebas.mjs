// pruebas.mjs — pruebas que pueden fallar.  node pruebas.mjs
// Las cifras de referencia vienen de sondas independientes en NumPy (23 oct): mismo modelo, otro código.
import { createHash } from 'node:crypto';
import { Cadena, Cuerda } from './motor.mjs';

let fallas = 0;
const ok = (c, nombre, det = '') => { console.log(`${c ? 'ok   ' : 'FALLA'}  ${nombre}${det ? '  · ' + det : ''}`); if (!c) fallas++; };

// recorre la cadena y devuelve la historia de E₁/E con el mínimo y el regreso posterior
function recorrido({ alfa = 0, beta = 0, A, periodos = 400, dt = 0.05, tipo = 'modo1' }) {
  const c = new Cadena(32, { alfa, beta });
  c.golpe({ tipo, A });
  const T1 = (2 * Math.PI) / c.w[0];
  const pasos = Math.round((periodos * T1) / dt), cada = Math.round((0.5 * T1) / dt);
  const h = [];
  let paresMax = 0, E0 = c.energia(), deriva = 0;
  for (let n = 0; n <= pasos; n++) {
    if (n % cada === 0) {
      const m = c.medidas();
      h.push({ per: m.periodos, e1: m.e[0] / m.total, re: m.regresoEnergia, forma: m.forma, desfase: m.desfase1 });
      paresMax = Math.max(paresMax, m.pares);
      deriva = Math.max(deriva, Math.abs(c.energia() - E0) / E0);
    }
    c.paso(dt);
  }
  let i0 = 0; h.forEach((x, i) => { if (x.e1 < h[i0].e1) i0 = i; });
  let ir = i0; for (let i = i0; i < h.length; i++) if (h[i].e1 > h[ir].e1) ir = i;
  return { h, min: h[i0], vuelta: h[ir], paresMax, deriva };
}

// 1. Lineal: sin no linealidad no hay intercambio
{
  const r = recorrido({ A: 6, periodos: 100 });
  ok(r.min.e1 > 0.999999, 'lineal: la energía no sale del modo 1', `mínimo ${r.min.e1.toFixed(7)}`);
}

// 2. Conservación de energía (γ = 0): Verlet no conserva exactamente, pero la deriva debe ser pequeña
{
  const r = recorrido({ beta: 1, A: 8, periodos: 300 });
  ok(r.deriva < 1e-3, 'β, A = 8: energía total conservada', `deriva relativa máxima ${r.deriva.toExponential(2)}`);
}

// 3. β: la memoria según la fuerza del golpe (referencia NumPy: A=6 → 0,65 y vuelve a 1,000; A=8 → 0,28 y vuelve a 0,999)
{
  const a6 = recorrido({ beta: 1, A: 6, periodos: 200 });
  ok(Math.abs(a6.min.e1 - 0.653) < 0.02 && a6.vuelta.e1 > 0.99, 'β, A = 6: baja a ~65 % y vuelve', `min ${a6.min.e1.toFixed(3)} @${a6.min.per.toFixed(0)}, vuelve ${a6.vuelta.e1.toFixed(3)} @${a6.vuelta.per.toFixed(0)} periodos`);
  const a8 = recorrido({ beta: 1, A: 8, periodos: 300 });
  ok(Math.abs(a8.min.e1 - 0.28) < 0.03 && a8.vuelta.e1 > 0.99, 'β, A = 8: baja a ~28 % y vuelve', `min ${a8.min.e1.toFixed(3)} @${a8.min.per.toFixed(0)}, vuelve ${a8.vuelta.e1.toFixed(3)} @${a8.vuelta.per.toFixed(0)}`);
  // A = 12: intercambia y vuelve muchas veces, hasta que la simetría se rompe y la energía se reparte.
  // El instante del olvido depende de la imperfección sembrada (≈ logarítmicamente).
  const olvido = (imperfeccion) => {
    const c = new Cadena(32, { beta: 1 }); c.golpe({ A: 12, imperfeccion });
    const T1 = (2 * Math.PI) / c.w[0], dt = 0.075, cada = Math.round((0.5 * T1) / dt);
    let regresos = 0, bajo = false;
    for (let n = 0; n * dt < 2400 * T1; n++) {
      if (n % cada === 0) {
        const m = c.medidas();
        if (m.pares > 0.05) return { per: m.periodos, regresos };
        if (m.regresoEnergia < 0.9) bajo = true;
        if (bajo && m.regresoEnergia > 0.97) { regresos++; bajo = false; }
      }
      c.paso(dt);
    }
    return { per: Infinity, regresos };
  };
  const o4 = olvido(1e-4), o8 = olvido(1e-8), o12 = olvido(1e-12);
  ok(o4.per < o8.per && o8.per < o12.per && o12.regresos >= 3, 'β, A = 12: recuerda y luego olvida; más imperfección, olvido más temprano',
    `ruptura a los ${[o4, o8, o12].map((o) => (o.per / 110).toFixed(1) + ' s').join(' / ')} con imperfección 1e-4 / 1e-8 / 1e-12`);
  // paridad: golpe simétrico con β sólo alimenta modos impares (en aritmética exacta)
  ok(a6.paresMax < 1e-20, 'β, golpe simétrico: los modos pares quedan en cero', `máximo ${a6.paresMax.toExponential(1)}`);
}

// 4. α (control): A = 4 → baja a ~6 % y vuelve a ~94 % hacia el periodo 310
{
  const r = recorrido({ alfa: 0.25, A: 4, periodos: 400 });
  ok(r.min.e1 < 0.1 && r.vuelta.e1 > 0.9, 'α = 0,25, A = 4: baja y vuelve', `min ${r.min.e1.toFixed(3)} @${r.min.per.toFixed(0)}, vuelve ${r.vuelta.e1.toFixed(3)} @${r.vuelta.per.toFixed(0)}`);
}

// 5. Golpe asimétrico: excita modos pares desde el principio
{
  const c = new Cadena(32, { beta: 1 });
  c.golpe({ tipo: 'local', A: 6, x: 0.3 });
  ok(c.medidas().pares > 0.05, 'golpe local en 0,3: los modos pares participan', `${(c.medidas().pares * 100).toFixed(1)} % de la energía`);
}

// 6. Energía del golpe local = energía del golpe modal de la misma amplitud (en el límite lineal)
{
  const a = new Cadena(32, { beta: 0 }); a.golpe({ tipo: 'modo1', A: 3 });
  const b = new Cadena(32, { beta: 0 }); b.golpe({ tipo: 'local', A: 3, x: 0.3 });
  ok(Math.abs(a.energia() - b.energia()) / a.energia() < 1e-12, 'golpe local y modal: misma energía');
}

// 7. Regreso de energía y regreso de forma son medidas distintas: en el lineal la forma se dispersa sin pérdida de energía
//    (la energía modal medida oscila ~10⁻⁵ por el error de fase de Verlet: es del integrador, no del modelo)
{
  const c = new Cadena(32, { beta: 0 }); c.golpe({ tipo: 'local', A: 3, x: 0.3 });
  const T1 = (2 * Math.PI) / c.w[0];
  for (let n = 0; n < Math.round((7.3 * T1) / 0.05); n++) c.paso(0.05);
  const m = c.medidas();
  ok(m.regresoEnergia > 0.9999 && m.forma < 0.9, 'lineal, golpe local: la energía por modo no cambia; la forma sí', `regreso de energía ${m.regresoEnergia.toFixed(6)}, forma ${m.forma.toFixed(3)}`);
}

// 8. Pérdida: con γ > 0 la energía total sólo baja
{
  const c = new Cadena(32, { beta: 1, gamma: 0.002 }); c.golpe({ A: 6 });
  let prev = c.energia(), mono = true;
  for (let n = 0; n < 20000; n++) { c.paso(0.05); if (n % 50 === 0) { const e = c.energia(); if (e > prev * (1 + 1e-9)) mono = false; prev = e; } }
  ok(mono, 'γ > 0: la energía total sólo baja');
}

// 9. Instrumento: modos inarmónicos y sonido reproducible y finito
{
  const fr = new Cuerda(48000, { f0: 110 }).frecuencias();
  ok(Math.abs(fr[0].hz - 110) < 1e-9 && fr[1].cents < 0 && fr[7].cents < -40, 'reloj: modo 1 a 110 Hz; los demás más bajos que k·f0', [2, 3, 5, 8].map((k) => `${k}: ${fr[k - 1].cents.toFixed(1)}c`).join(' '));
  const h = [0, 1].map(() => {
    const s = new Cuerda(48000, { beta: 1 }); s.c.golpe({ A: 6 });
    const out = new Float32Array(48000); s.procesar(out, out.length);
    return createHash('sha256').update(Buffer.from(out.buffer)).digest('hex');
  });
  const s = new Cuerda(48000, { beta: 1 }); s.c.golpe({ A: 6 }); const out = new Float32Array(48000); s.procesar(out, out.length);
  ok(h[0] === h[1] && out.every(Number.isFinite), 'sonido reproducible y finito', h[0].slice(0, 12));
}

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\ntodas las pruebas pasaron');
process.exit(fallas ? 1 : 0);
