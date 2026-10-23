// pruebas.mjs — pruebas que pueden fallar.  node pruebas.mjs
import { createHash } from 'node:crypto';
import { ataques, encuentros, recurrencia, desafinarPara, esperarPara, inicios, fraccion } from './razon.mjs';
import { BALADA, versiones } from './balada.mjs';
import { cantar } from './sintesis.mjs';

let fallas = 0;
const ok = (c, nombre, det = '') => { console.log(`${c ? 'ok   ' : 'FALLA'}  ${nombre}${det ? '  · ' + det : ''}`); if (!c) fallas++; };
const R = 130.8128;

// 1. La ley: dentro de una sección, el intervalo entre ataques de una voz es exactamente K/f
{
  const { ataques: A, F } = ataques(BALADA);
  let peor = 0;
  for (let v = 0; v < 4; v++) {
    const t = A.filter((a) => a.v === v && a.s === 3).map((a) => a.t);
    for (let i = 1; i < t.length; i++) peor = Math.max(peor, Math.abs(t[i] - t[i - 1] - BALADA.K / F[3][v]));
  }
  ok(peor < 1e-9, 'ley: intervalo entre ataques = K/f en cada voz', `error máximo ${peor.toExponential(1)} s`);
}

// 2. Fase heredada: el primer ataque tras un cambio de acorde lo decide la fase que traía la voz
{
  const { ataques: A, fasesInicio, F, T } = ataques(BALADA);
  let bien = true;
  for (let s = 1; s < 5; s++) for (let v = 0; v < 4; v++) {
    const ph = fasesInicio[s][v];
    const esperado = Math.abs(ph - Math.round(ph)) < 1e-9 ? T[s] : T[s] + (Math.floor(ph) + 1 - ph) * BALADA.K / F[s][v];
    const real = A.find((a) => a.v === v && a.t >= T[s] - 1e-9).t;
    if (Math.abs(real - esperado) > 1e-9) bien = false;
  }
  ok(bien, 'fase heredada: el primer ataque de cada acorde sale de la fase anterior');
}

// 3. Reiniciar: todas las voces atacan al empezar cada acorde
{
  const p = { ...BALADA, fases: 'reiniciar' };
  const { ataques: A, T } = ataques(p);
  ok(T.slice(0, 5).every((t) => [0, 1, 2, 3].every((v) => A.some((a) => a.v === v && Math.abs(a.t - t) < 1e-9))), 'reiniciar: llegada programada en cada acorde');
}

// 4. Mayor y menor justos sobre la misma raíz audible R, con K = 3R: 4K/R = 12 s y 10K/R = 30 s
{
  const K = 3;
  const mayor = recurrencia([[1, 1], [5, 4], [3, 2]], K), menor = recurrencia([[1, 1], [6, 5], [3, 2]], K);
  ok(Math.abs(mayor - 12) < 1e-12 && Math.abs(menor - 30) < 1e-12, 'recurrencia total: mayor 12 s, menor 30 s (K = 3R)', `${mayor} y ${menor}`);
  // y con ataques reales
  const sec = (voces) => ({ ref: R, K: 3 * R, fases: 'heredar', secciones: [{ dur: 31, voces }] });
  const total = (p) => encuentros(ataques(p).ataques, 3, 1e-6).filter((e) => e.total && e.t > 0).map((e) => e.t);
  ok(Math.abs(total(sec([1, 5 / 4, 3 / 2]))[0] - 12) < 1e-6 && Math.abs(total(sec([1, 6 / 5, 3 / 2]))[0] - 30) < 1e-6, 'recurrencia total medida en los ataques: 12 s y 30 s');
}

// 5. F/6 : F/5 : F/4 y 10:12:15 sobre F/60 son las mismas frecuencias y la misma recurrencia
{
  const F = 660;
  const a = [F / 6, F / 5, F / 4], b = [10, 12, 15].map((k) => (k * F) / 60);
  const ra = recurrencia([[1, 6], [1, 5], [1, 4]], 1), rb = recurrencia([[10, 60], [12, 60], [15, 60]], 1);
  ok(a.every((x, i) => Math.abs(x - b[i]) < 1e-12) && ra === rb, 'menor «subarmónico» = menor 10:12:15: misma cosa', `${a.join(', ')} Hz; recurrencia ${ra}`);
}

// 6. El registro también decide el tiempo: una octava arriba, la mitad del periodo
{
  const { ataques: A } = ataques({ ref: R, K: R, fases: 'heredar', secciones: [{ dur: 4, voces: [1, 2] }] });
  const t0 = A.filter((a) => a.v === 0).map((a) => a.t), t1 = A.filter((a) => a.v === 1).map((a) => a.t);
  ok(Math.abs((t0[1] - t0[0]) / (t1[1] - t1[0]) - 2) < 1e-12, 'octava: periodo a la mitad');
}

// 7. Desafinar: las voces atacan exactamente en T y la pérdida respeta la cota 1200·log₂(1 + ½/A)
{
  for (const desde of [0, 2, 3]) {
    const d = desafinarPara(BALADA, { T: 32, desde, voces: [0, 1, 2, 3] });
    const { ataques: A } = ataques(d.partitura);
    const llegan = [0, 1, 2, 3].every((v) => A.some((a) => a.v === v && Math.abs(a.t - 32) < 1e-9));
    const cota = d.informe.every((i) => Math.abs(i.cents) <= 1200 * Math.log2(1 + 0.5 / (i.pulsos / i.c)) + 1e-9);
    ok(llegan && cota, `desafinar desde la sección ${desde + 1}: las cuatro voces llegan juntas a 32 s`, d.informe.map((i) => `${i.cents.toFixed(1)}c`).join(' '));
  }
}

// 8. Esperar: «nunca» se comprueba contra una ventana mucho más larga; «llega» da el instante correcto
{
  const nunca = esperarPara(BALADA, { seccion: 3, voces: [1, 2, 3], tau: 0.025, maxEspera: 120 });
  const largo = { ...BALADA, secciones: BALADA.secciones.map((s, i) => (i === 3 ? { ...s, dur: s.dur + 300 } : s)) };
  const T3 = inicios(BALADA)[4];
  const E = encuentros(ataques(largo).ataques.filter((a) => [1, 2, 3].includes(a.v) && a.t >= T3), 3, 0.025);
  ok(nunca.estado === 'nunca' && !E.some((e) => e.voces.length === 3), 'esperar en V: el trío nunca coincide (verificado en 300 s)', `periodo del patrón ${nunca.periodo.toFixed(3)} s`);
  const llega = esperarPara(BALADA, { seccion: 2, voces: [2, 3], tau: 0.025 });
  ok(llega.estado === 'llega' && Math.abs(llega.demora - 2) < 1e-9, 'esperar en IV: alto y soprano coinciden 2 s después');
}

// 9. Fracciones: las razones de la partitura se recuperan exactas
ok([[9, 8], [15, 8], [5, 12]].every(([n, d]) => { const [a, b] = fraccion(n / d); return a === n && b === d; }), 'fracciones exactas de las razones justas');

// 10. Reproducible y sin recorte
{
  const corta = { ...BALADA, secciones: BALADA.secciones.slice(0, 2) };
  const h = [0, 1].map(() => { const { L, R } = cantar(corta, 16000, 0.5); return createHash('sha256').update(Buffer.from(L.buffer)).update(Buffer.from(R.buffer)).digest('hex'); });
  const { L } = cantar(corta, 16000, 0.5);
  let pico = 0, finito = true; for (const x of L) { if (!Number.isFinite(x)) finito = false; pico = Math.max(pico, Math.abs(x)); }
  ok(h[0] === h[1] && finito && pico <= 0.7945, 'síntesis reproducible, finita, pico −2 dBFS', h[0].slice(0, 12));
}

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\ntodas las pruebas pasaron');
process.exit(fallas ? 1 : 0);
