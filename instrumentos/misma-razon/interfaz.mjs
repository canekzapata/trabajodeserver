// interfaz.mjs — ver dónde se encuentran las voces, preparar una llegada y escuchar lo que costó.
import { ataques, encuentros, desafinarPara, esperarPara, inicios } from './razon.mjs';
import { BALADA, versiones } from './balada.mjs';
import { cantar } from './sintesis.mjs';

const $ = (s) => document.querySelector(s);
const lienzo = $('#linea'), ctx = lienzo.getContext('2d');
const V = versiones();
const NOMBRES = BALADA.voces;
const COL = ['#7a4e2d', '#c07a3a', '#5a8fb0', '#2f5d7c'];
let actual = null, audio = null, fuente = null, inicioAudio = 0;

// controles de la llegada propia
BALADA.secciones.forEach((s, i) => {
  if (i > 0) $('#destino').add(new Option(`${s.nombre} (compás ${i + 1})`, i));
  $('#desde').add(new Option(`${s.nombre} (compás ${i + 1})`, i));
});
$('#destino').value = 4; $('#desde').value = 2;
NOMBRES.forEach((n, v) => {
  const l = document.createElement('label');
  l.innerHTML = `<input type="checkbox" value="${v}" ${v > 0 ? 'checked' : ''}> ${n}`;
  $('#quienes').appendChild(l);
});

function calcular() {
  const nombre = $('#version').value;
  $('#propia').disabled = nombre !== 'propia';
  const lineas = [];
  let p;
  if (nombre !== 'propia') {
    const x = V[nombre]; p = x.partitura;
    lineas.push(x.nota);
    if (x.informe) for (const i of x.informe) lineas.push(`${NOMBRES[i.v]}: ${i.cents >= 0 ? '+' : ''}${i.cents.toFixed(1)} cents`);
  } else {
    const destino = +$('#destino').value, desde = Math.min(+$('#desde').value, destino - 1);
    const voces = [...document.querySelectorAll('#quienes input:checked')].map((e) => +e.value);
    const T = inicios(BALADA)[destino];
    if (voces.length < 2) { lineas.push('elige al menos dos voces'); p = BALADA; }
    else if ($('#como').value === 'desafinar') {
      const d = desafinarPara(BALADA, { T, desde, voces }); p = d.partitura;
      lineas.push(`llegan juntas a ${T} s desafinándose desde ${BALADA.secciones[desde].nombre}:`);
      for (const i of d.informe) lineas.push(`  ${NOMBRES[i.v]}: ${i.cents >= 0 ? '+' : ''}${i.cents.toFixed(1)} cents`);
    } else {
      const e = esperarPara(BALADA, { seccion: destino - 1, voces, tau: 0.025, maxEspera: 60 });
      p = e.partitura;
      if (e.estado === 'llega') lineas.push(`afinación justa; ${BALADA.secciones[destino - 1].nombre} se alarga ${e.demora.toFixed(2)} s hasta que coinciden (dispersión ${(e.dispersion * 1000).toFixed(1)} ms)`);
      else if (e.estado === 'nunca') lineas.push(`nunca: con estas fases, el patrón de ${voces.map((v) => NOMBRES[v]).join(', ')} se repite cada ${e.periodo.toFixed(3)} s sin coincidir. Esperar no basta; hay que cambiar algo.`);
      else lineas.push('no coinciden dentro de 60 s de espera');
    }
  }
  const { ataques: A, T } = ataques(p);
  const E = encuentros(A, 4, 0.025);
  lineas.push(`encuentros de las cuatro voces: ${E.filter((e) => e.total).map((e) => e.t.toFixed(1) + ' s').join(', ') || 'ninguno'}`);
  $('#informe').textContent = lineas.join('\n');
  actual = { p, A, E, T };
  parar();
}
for (const id of ['version', 'destino', 'como', 'desde']) $('#' + id).addEventListener('change', calcular);
$('#quienes').addEventListener('change', calcular);

// ── escuchar ──
function parar() { if (fuente) { try { fuente.stop(); } catch {} fuente = null; } $('#escuchar').setAttribute('aria-pressed', 'false'); $('#escuchar').textContent = 'escuchar'; }
$('#escuchar').addEventListener('click', async () => {
  if (fuente) { parar(); return; }
  if (!audio) audio = new AudioContext();
  await audio.resume();
  $('#escuchar').textContent = 'calculando…';
  await new Promise((r) => setTimeout(r, 30));
  const sr = audio.sampleRate > 44100 ? 32000 : audio.sampleRate;
  const { L, R } = cantar(actual.p, sr);
  const buf = audio.createBuffer(2, L.length, sr);
  buf.copyToChannel(L, 0); buf.copyToChannel(R, 1);
  fuente = audio.createBufferSource(); fuente.buffer = buf; fuente.connect(audio.destination);
  fuente.onended = () => parar();
  fuente.start(); inicioAudio = audio.currentTime;
  $('#escuchar').setAttribute('aria-pressed', 'true'); $('#escuchar').textContent = 'parar';
});

// ── dibujo ──
function dibujar() {
  const dpr = Math.min(2, devicePixelRatio || 1), r = lienzo.getBoundingClientRect();
  if (lienzo.width !== Math.round(r.width * dpr)) { lienzo.width = r.width * dpr; lienzo.height = r.height * dpr; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = r.width, H = r.height, m = 64, dur = actual.T[actual.T.length - 1] + 1;
  const x = (t) => m + (t / dur) * (W - m - 12), y = (v) => H - 34 - v * ((H - 70) / 3);
  ctx.clearRect(0, 0, W, H);
  actual.T.slice(0, -1).forEach((t, i) => {
    ctx.fillStyle = i % 2 ? '#efe9dd' : '#f7f3ea'; ctx.fillRect(x(t), 0, x(actual.T[i + 1]) - x(t), H);
    ctx.fillStyle = '#857d70'; ctx.font = '11px ui-monospace, monospace'; ctx.fillText(actual.p.secciones[i].nombre, x(t) + 4, 14);
  });
  for (const e of actual.E) {
    ctx.fillStyle = e.total ? '#c8473b' : '#e3b8b0';
    ctx.fillRect(x(e.t) - (e.total ? 1 : 0.5), 20, e.total ? 2.5 : 1, H - 40);
  }
  for (const a of actual.A) { ctx.fillStyle = COL[a.v]; ctx.beginPath(); ctx.arc(x(a.t), y(a.v), 3, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#23201b'; ctx.font = '11px ui-monospace, monospace';
  NOMBRES.forEach((n, v) => ctx.fillText(n, 6, y(v) + 4));
  ctx.fillStyle = '#857d70'; ctx.fillText('s → · rojo: encuentro de las cuatro voces · rosa: de dos o más (τ = 25 ms)', m, H - 8);
  if (fuente && audio) { const t = audio.currentTime - inicioAudio; ctx.fillStyle = 'rgba(35,32,27,.5)'; ctx.fillRect(x(t), 20, 1.5, H - 40); }
  requestAnimationFrame(dibujar);
}
calcular(); requestAnimationFrame(dibujar);
