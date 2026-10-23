// interfaz.mjs — golpear la cuerda, escucharla y ver lo que el motor mide. Nada se dibuja a mano.
import { Cadena } from './motor.mjs';
import { TOMAS } from './tomas.mjs';

const $ = (s) => document.querySelector(s);
const N = 32;
const COL = { energia: '#e7e3da', forma: '#e2685c', modo1: '#6fa8d6', acento: '#d9b25f', tenue: '#7f8691', linea: '#252b33' };
let audio = null, nodo = null, salida = null;
let ultimo = null;
const historia = []; // {t, reg, forma, e1, e}
const VENTANA = 12; // s

// ── controles ──
const ids = ['A', 'x', 'ancho', 'alfa', 'beta', 'gamma', 'sonda', 'sigma'];
const fmt = { A: (v) => v.toFixed(1), x: (v) => v.toFixed(2), ancho: (v) => v.toFixed(2), alfa: (v) => v.toFixed(2), beta: (v) => v.toFixed(2), gamma: (v) => v.toFixed(2), sonda: (v) => v.toFixed(2), sigma: (v) => v.toFixed(2) };
const mostrar = () => ids.forEach((id) => ($('#o-' + id).value = fmt[id](+$('#' + id).value)));
const params = () => ({ alfa: +$('#alfa').value, beta: +$('#beta').value, gamma: +$('#gamma').value, f0: +$('#f0').value, sonda: +$('#sonda').value, sigma: +$('#sigma').value });
const golpe = () => ({ tipo: $('#tipo').value, A: +$('#A').value, x: +$('#x').value, ancho: +$('#ancho').value, imperfeccion: +$('#imperfeccion').value });
for (const id of [...ids, 'f0']) $('#' + id).addEventListener('input', () => { mostrar(); enviar({ tipo: 'params', params: params() }); });

async function iniciar() {
  if (audio) return;
  audio = new AudioContext();
  await audio.audioWorklet.addModule(new URL('./worklet.mjs', import.meta.url));
  nodo = new AudioWorkletNode(audio, 'cuerda', { numberOfInputs: 0, outputChannelCount: [2] });
  salida = audio.createGain(); salida.gain.value = 0;
  nodo.connect(salida).connect(audio.destination);
  nodo.port.onmessage = (e) => recibir(e.data);
  enviar({ tipo: 'params', params: params() });
}
const enviar = (m) => nodo && nodo.port.postMessage(m);

$('#sonido').addEventListener('click', async (e) => {
  const boton = e.currentTarget; // currentTarget deja de existir después de await
  await iniciar(); await audio.resume();
  const on = boton.getAttribute('aria-pressed') !== 'true';
  boton.setAttribute('aria-pressed', on);
  salida.gain.setTargetAtTime(on ? 1 : 0, audio.currentTime, 0.03);
});
$('#golpear').addEventListener('click', async () => {
  await iniciar(); await audio.resume();
  if ($('#sonido').getAttribute('aria-pressed') !== 'true') $('#sonido').click();
  historia.length = 0;
  enviar({ tipo: 'golpe', golpe: golpe() });
});
$('#apagar').addEventListener('click', () => { historia.length = 0; enviar({ tipo: 'apagar' }); });
document.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', async () => {
  const T = TOMAS[b.dataset.p];
  $('#alfa').value = T.p.alfa ?? 0; $('#beta').value = T.p.beta ?? 0; $('#gamma').value = 0;
  $('#tipo').value = T.golpe.tipo; $('#A').value = T.golpe.A;
  if (T.golpe.x !== undefined) $('#x').value = T.golpe.x;
  $('#ancho').value = T.golpe.ancho ?? 0.06;
  $('#imperfeccion').value = String(T.golpe.imperfeccion ?? 0) === '0' ? '0' : String(T.golpe.imperfeccion);
  mostrar();
  await iniciar(); await audio.resume();
  enviar({ tipo: 'params', params: params() });
  enviar({ tipo: 'apagar' });
  $('#golpear').click();
  $('#aviso').textContent = T.nota;
}));

function recibir(d) {
  ultimo = d;
  if (d.estallo) $('#aviso').textContent = 'La cadena estalló (con α y sin β el potencial no está acotado): se apagó.';
  if (d.regreso !== null) historia.push({ t: d.t, reg: d.regreso, forma: d.forma, e1: d.e[0], e: d.e });
  while (historia.length && historia[0].t < d.t - VENTANA) historia.shift();
  $('#l-per').textContent = d.periodos.toFixed(0);
  $('#l-reg').textContent = d.regreso === null ? '—' : (d.regreso * 100).toFixed(1) + ' %';
  $('#l-for').textContent = d.forma === null ? '—' : (d.forma * 100).toFixed(1) + ' %';
  $('#l-des').textContent = d.desfase === null ? '—' : d.desfase.toFixed(2) + ' rad';
  $('#l-E').textContent = d.E0 ? `${d.E.toExponential(3)} (${((d.E / d.E0 - 1) * 100).toFixed(3)} %)` : d.E.toExponential(3);
  $('#l-par').textContent = d.pares > 1e-4 ? (d.pares * 100).toFixed(1) + ' %' : (d.pares * 100).toExponential(0) + ' %';
  $('#l-ent').textContent = d.entropia.toFixed(2) + ' bits';
}

// ── dibujo ──
function preparar(c) {
  const dpr = Math.min(2, devicePixelRatio || 1), r = c.getBoundingClientRect();
  if (c.width !== Math.round(r.width * dpr)) { c.width = r.width * dpr; c.height = r.height * dpr; }
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, r.width, r.height);
  return [x, r.width, r.height];
}

function cadena() {
  const [g, W, H] = preparar($('#cadena'));
  const m = 24, X = (i) => m + ((i + 1) / (N + 1)) * (W - 2 * m), cy = H * 0.42;
  // zona de escucha
  const p = params();
  g.fillStyle = 'rgba(217,178,95,.10)';
  for (let px = m; px < W - m; px += 2) {
    const u = (px - m) / (W - 2 * m), a = Math.exp(-(((u - p.sonda) / p.sigma) ** 2));
    g.globalAlpha = a; g.fillRect(px, 8, 2, H - 16);
  }
  g.globalAlpha = 1;
  g.fillStyle = COL.tenue; g.font = '11px ui-monospace, monospace';
  g.fillText('escucha', m + p.sonda * (W - 2 * m) - 20, 20);
  if (!ultimo) { g.fillText('golpea la cuerda', m, H - 12); return; }
  const q = ultimo.q, v = ultimo.v;
  const esc = Math.min(60, (H * 0.3) / Math.max(0.5, ...q.map(Math.abs)));
  // energía local por masa (cinética + resorte a la derecha), barras abajo
  const loc = q.map((qi, i) => 0.5 * v[i] * v[i] + 0.5 * ((i + 1 < N ? q[i + 1] : 0) - qi) ** 2);
  const mx = Math.max(1e-12, ...loc);
  g.fillStyle = 'rgba(226,104,92,.55)';
  loc.forEach((e, i) => { const h = (e / mx) * H * 0.22; g.fillRect(X(i) - 3, H - 8 - h, 6, h); });
  // la cadena
  g.strokeStyle = COL.energia; g.lineWidth = 1.2; g.beginPath(); g.moveTo(m, cy);
  q.forEach((qi, i) => g.lineTo(X(i), cy - qi * esc)); g.lineTo(W - m, cy); g.stroke();
  g.fillStyle = COL.energia; q.forEach((qi, i) => { g.beginPath(); g.arc(X(i), cy - qi * esc, 3.2, 0, 7); g.fill(); });
  g.fillStyle = COL.tenue; g.fillRect(m - 3, cy - 30, 3, 60); g.fillRect(W - m, cy - 30, 3, 60);
  g.fillText(`desplazamiento ×${esc.toFixed(0)} · barras: energía local`, m, H - 12 - H * 0.22 - 4);
}

function grafica() {
  const [g, W, H] = preparar($('#historia'));
  const m = 34, alto = H * 0.55, y0 = 14;
  g.strokeStyle = COL.linea; g.strokeRect(m, y0, W - m - 8, alto);
  g.fillStyle = COL.tenue; g.font = '10px ui-monospace, monospace';
  g.fillText('1', 18, y0 + 8); g.fillText('0', 18, y0 + alto);
  if (!historia.length) return;
  const t1 = historia[historia.length - 1].t, X = (t) => m + (1 - (t1 - t) / VENTANA) * (W - m - 8);
  const linea = (k, color, ancho, raya = []) => {
    g.strokeStyle = color; g.lineWidth = ancho; g.setLineDash(raya); g.beginPath();
    historia.forEach((h, i) => { const x = X(h.t), y = y0 + alto * (1 - h[k]); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.stroke(); g.setLineDash([]);
  };
  linea('forma', COL.forma, 1); linea('e1', COL.modo1, 1, [4, 3]); linea('reg', COL.energia, 1.6);
  g.fillStyle = COL.energia; g.fillText('regreso de energía', m + 6, y0 + 12);
  g.fillStyle = COL.forma; g.fillText('regreso de forma', m + 130, y0 + 12);
  g.fillStyle = COL.modo1; g.fillText('E₁/E', m + 240, y0 + 12);
  // tapiz: energía de los modos 1–12
  const ty = y0 + alto + 10, th = H - ty - 16, fh = th / 12;
  historia.forEach((h, i) => {
    if (!i) return;
    const xa = X(historia[i - 1].t), xb = X(h.t);
    h.e.forEach((f, k) => { g.fillStyle = `rgba(217,178,95,${Math.min(1, Math.sqrt(f))})`; g.fillRect(xa, ty + th - (k + 1) * fh, Math.max(1, xb - xa + 0.5), fh - 0.5); });
  });
  g.fillStyle = COL.tenue; g.fillText('modos 1–12 →', 2, ty + th - 2); g.fillText(`${VENTANA} s`, W - 40, H - 4);
}

function brujula() {
  const [g, W, H] = preparar($('#brujula'));
  const cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) * 0.36;
  g.strokeStyle = COL.linea; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R, cy); g.stroke();
  g.fillStyle = COL.tenue; g.font = '10px ui-monospace, monospace';
  g.fillText('radio √(E₁/E) · ángulo: desfase', 6, 14);
  if (!ultimo || ultimo.desfase === null) return;
  const r = R * Math.sqrt(ultimo.e[0]), a = ultimo.desfase;
  g.strokeStyle = COL.modo1; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + r * Math.cos(a), cy - r * Math.sin(a)); g.stroke();
  g.fillStyle = COL.modo1; g.beginPath(); g.arc(cx + r * Math.cos(a), cy - r * Math.sin(a), 4, 0, 7); g.fill();
  g.fillStyle = COL.tenue; g.fillText('fase lineal →', cx + R - 70, cy - 6);
}

function cuadro() { cadena(); grafica(); brujula(); requestAnimationFrame(cuadro); }
mostrar(); requestAnimationFrame(cuadro);
