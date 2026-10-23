// pruebas.mjs — pruebas que pueden fallar.  node pruebas.mjs
// Comprueban la señal y la física. No comprueban lo que alguien oye.
import { createHash } from 'node:crypto';
import { Trompo, PATRONES, BLOQUE, sectorEn } from './motor.mjs';
import { renderizar, tomaDesdeGestos, DEMOS, wav16 } from './renderizar.mjs';

const SR = 48000;
let fallas = 0;
const ok = (cond, nombre, detalle = '') => { console.log(`${cond ? 'ok   ' : 'FALLA'}  ${nombre}${detalle ? '  · ' + detalle : ''}`); if (!cond) fallas++; };
const correr = (t, seg) => { const n = Math.round(seg * SR); const out = new Float32Array(n); t.procesar(out, n); return out; };

// 1. Rozamiento viscoso: ω(t) = ω₀·e^(−b t / I)
{
  const t = new Trompo(SR, { viscoso: 0.5, seco: 0, peso: 1 });
  t.omega = 4; correr(t, 2);
  const esperado = 4 * Math.exp(-1);
  ok(Math.abs(t.omega - esperado) / esperado < 1e-3, 'viscoso: caída exponencial', `ω(2 s)=${t.omega.toFixed(5)} esperado ${esperado.toFixed(5)}`);
}

// 2. Rozamiento seco: se detiene en t = I·ω₀/μ y no se invierte
{
  const t = new Trompo(SR, { viscoso: 0, seco: 0.5, peso: 2 });
  t.omega = 4;
  let tParada = null;
  for (let i = 0; i < 20 * SR; i++) { t.paso(); if (tParada === null && t.omega === 0) tParada = (i + 1) / SR; }
  ok(tParada !== null && Math.abs(tParada - 16) < 0.002, 'seco: parada en tiempo finito', `t=${tParada} esperado 16 s`);
  ok(t.omega === 0, 'seco: queda detenido, sin invertir el giro');
}

// 3. La mano quieta frena, no invierte, y se detiene
{
  const t = new Trompo(SR, { viscoso: 0, seco: 0 });
  t.omega = 6; t.ponerEntrada({ mano: true, wMano: 0, presion: 0.5 });
  let monotona = true, prev = t.omega;
  for (let i = 0; i < 3 * SR; i++) { t.paso(); if (t.omega > prev + 1e-12 || t.omega < -1e-9) monotona = false; prev = t.omega; }
  ok(monotona && Math.abs(t.omega) < 1e-6, 'mano quieta: frena hasta detener sin invertir', `ω final ${t.omega.toExponential(2)}`);
}

// 4. Conteo exacto de eventos a velocidad constante, en ambos sentidos
for (const signo of [1, -1]) {
  const t = new Trompo(SR, { viscoso: 0, seco: 0 }, PATRONES['ocho-iguales']());
  t.theta = 0.03; t.omega = 5 * signo; correr(t, 10);
  ok(t.contador.eventos === 400, `eventos: 8 marcas × 5 vueltas/s × 10 s, sentido ${signo > 0 ? '+' : '−'}`, `${t.contador.eventos} de 400`);
}

// 5. Misma tasa de eventos con distinto número de sectores (para comparar organizaciones)
{
  const a = new Trompo(SR, { viscoso: 0, seco: 0 }, PATRONES['ocho-iguales']()); a.theta = 0.01; a.omega = 5; correr(a, 4);
  const cuatro = Array.from({ length: 4 }, (_, k) => ({ fase: k / 4, tipo: 'clic', nota: 2400, dur: 0.003 }));
  const b = new Trompo(SR, { viscoso: 0, seco: 0 }, cuatro); b.theta = 0.01; b.omega = 10; correr(b, 4);
  ok(a.contador.eventos === b.contador.eventos, 'misma densidad: 8 sectores a 5 v/s = 4 sectores a 10 v/s', `${a.contador.eventos} y ${b.contador.eventos}`);
}

// 6. Fundamental ausente: energía en 200–500 Hz, nada en 100 Hz, periodicidad de 10 ms
{
  const t = new Trompo(SR, { modo: 'ausente', viscoso: 0, seco: 0, dientes: 20 });
  t.omega = 5; // 20 dientes × 5 v/s = 100 Hz
  correr(t, 1); // dejar asentar el bloqueo de continua
  const x = correr(t, 1);
  const dft = (f) => { let re = 0, im = 0; for (let i = 0; i < x.length; i++) { const a = 2 * Math.PI * f * i / SR; re += x[i] * Math.cos(a); im -= x[i] * Math.sin(a); } return Math.hypot(re, im) / x.length; };
  const e100 = dft(100), e200 = dft(200), e500 = dft(500);
  const db = 20 * Math.log10(e100 / e200);
  ok(db < -80 && e500 > 0.05, 'ausente: sin componente en 100 Hz', `100 Hz a ${db.toFixed(1)} dB de 200 Hz`);
  const ac = (lag) => { let s = 0; for (let i = 0; i + lag < x.length; i++) s += x[i] * x[i + lag]; return s; };
  let mejor = 0, lagMejor = 0;
  for (let lag = 48; lag < 1200; lag++) { const v = ac(lag); if (v > mejor) { mejor = v; lagMejor = lag; } }
  ok(lagMejor === 480, 'ausente: periodicidad compatible con 100 Hz', `máximo de autocorrelación en ${(lagMejor / SR * 1000).toFixed(2)} ms`);
}

// 7. Barajar conserva densidad, rompe el periodo del motivo y es reproducible
{
  const voces = (barajar) => {
    const t = new Trompo(SR, { barajar, semilla: 's', viscoso: 0, seco: 0 }, PATRONES['ocho-colores']());
    return [0, 1, 2, 3].map((n) => t.patron.map((_, k) => t.voz(k, n)).join(','));
  };
  const fijo = voces(false), bar = voces(true), bar2 = voces(true);
  ok(new Set(fijo).size === 1, 'sin barajar: el motivo es el mismo en cada vuelta');
  ok(new Set(bar).size > 1 && bar.join() === bar2.join(), 'barajado: cambia por vuelta y se repite con la misma semilla');
}

// 8. Toma: misma toma, misma muestra (huella), señal finita y sin limitador en las demos
{
  const huellas = [];
  for (let i = 0; i < 2; i++) {
    const { audio } = renderizar(tomaDesdeGestos(DEMOS.impulsos));
    huellas.push(createHash('sha256').update(wav16(audio, SR)).digest('hex'));
  }
  ok(huellas[0] === huellas[1], 'reproducible: dos renders de la demo dan la misma huella', huellas[0].slice(0, 12));
  for (const nombre of Object.keys(DEMOS)) {
    const { audio, trompo } = renderizar(tomaDesdeGestos(DEMOS[nombre]));
    let finita = true, pico = 0;
    for (const v of audio) { if (!Number.isFinite(v)) finita = false; pico = Math.max(pico, Math.abs(v)); }
    ok(finita && trompo.contador.limitador === 0, `demo ${nombre}: finita y sin limitador`, `pico ${pico.toFixed(3)}`);
  }
}

// 9. Retomar desde una instantánea a mitad de una toma da las mismas muestras
{
  const toma = tomaDesdeGestos(DEMOS.impulsos);
  let foto = null;
  const corte = 600;
  const { audio } = renderizar(toma, (b, t) => { if (b === corte - 1) foto = t.instantanea(); });
  const resto = { ...toma, inicial: foto, bloques: toma.bloques - corte, cambios: toma.cambios.filter((c) => c.b >= corte).map((c) => ({ b: c.b - corte, m: c.m })) };
  const b = renderizar(resto).audio;
  let igual = true;
  for (let i = 0; i < b.length; i++) if (b[i] !== audio[corte * BLOQUE + i]) { igual = false; break; }
  ok(igual, 'instantánea: retomar a mitad de la toma reproduce cada muestra');
}

// 10. El patrón se conserva: tras girar y frenar, el disco tiene las mismas marcas y voces
{
  const t = new Trompo(SR, {}, PATRONES['ritmo']());
  const antes = JSON.stringify(t.patron);
  t.omega = 30; correr(t, 3); t.ponerEntrada({ mano: true, wMano: 0, presion: 1 }); correr(t, 4);
  ok(JSON.stringify(t.patron) === antes && t.omega === 0, 'el giro no cambia el patrón: frenar lo devuelve legible');
}

// 11. Integración de exposición: un arco de una vuelta completa da el color medio ponderado
{
  const pat = [{ fase: 0 }, { fase: 0.25 }];
  const col = [[1, 0, 0], [0, 0, 1]];
  const m = Trompo.colorMedio(pat, col, 0.1, 1.1);
  ok(Math.abs(m[0] - 0.25) < 1e-9 && Math.abs(m[2] - 0.75) < 1e-9, 'exposición: media ponderada por arco', m.map((v) => v.toFixed(3)).join(' '));
  const quieto = Trompo.colorMedio(pat, col, 0.3, 0.3);
  ok(quieto[2] === 1 && sectorEn(pat, 0.3) === 1, 'exposición: disco quieto muestra su sector');
}

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\ntodas las pruebas pasaron');
process.exit(fallas ? 1 : 0);
