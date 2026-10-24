// interfaz.mjs — la mano sobre el cuerpo, el mapa que se pinta tocando y la partitura de acción.
import { COMARCAS } from './motor.mjs';
import { PARTITURAS } from './tomas.mjs';

const $ = (s) => document.querySelector(s);
const COL = { helm: '#d9b25f', dos: '#6fa8d6', aper: '#d0574b', pegado: '#57534c', tinta: '#e8e2d6', tenue: '#8a8379', linea: '#2c2925' };
let audio = null, nodo = null, salida = null, preparando = null, ultimo = null;
const puntos = [], traza = [];

// ── audio ──
function iniciar() { return (preparando ||= arrancar()); }
async function arrancar() {
  audio = new AudioContext();
  await audio.audioWorklet.addModule(new URL('./worklet.mjs', import.meta.url));
  nodo = new AudioWorkletNode(audio, 'cuerpo', { numberOfInputs: 0, outputChannelCount: [2] });
  salida = audio.createGain(); salida.gain.value = 0; nodo.connect(salida).connect(audio.destination);
  nodo.port.onmessage = (e) => recibir(e.data);
}
const enviar = (m) => nodo && nodo.port.postMessage(m);
async function asegurar() {
  await iniciar(); await audio.resume();
  const b = $('#sonido'); if (b.getAttribute('aria-pressed') !== 'true') { b.setAttribute('aria-pressed', 'true'); salida.gain.setTargetAtTime(1, audio.currentTime, 0.03); }
}
$('#sonido').addEventListener('click', async (e) => { const b = e.currentTarget; await iniciar(); await audio.resume(); const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); salida.gain.setTargetAtTime(on ? 1 : 0, audio.currentTime, 0.03); });
$('#apagar').addEventListener('click', () => enviar({ tipo: 'apagar' }));
$('#grabar').addEventListener('click', async (e) => { const b = e.currentTarget; await asegurar(); const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); b.textContent = on ? 'parar y guardar' : 'grabar toma'; enviar({ tipo: on ? 'grabar' : 'parar' }); });
$('#borrar').addEventListener('click', () => { puntos.length = 0; });

// ── controles ──
const F10 = (id) => 10 ** +$('#' + id).value; // escala logarítmica de la fuerza
const mostrar = () => { $('#o-F').value = F10('F').toFixed(2); $('#o-Fmax').value = F10('Fmax').toFixed(2); };
['F', 'Fmax'].forEach((id) => $('#' + id).addEventListener('input', mostrar));
$('#material').addEventListener('change', () => enviar({ tipo: 'mano', mano: { material: $('#material').value } }));
Object.entries(PARTITURAS).forEach(([nombre, p]) => {
  const b = document.createElement('button'); b.textContent = nombre;
  b.addEventListener('click', async () => { await asegurar(); enviar({ tipo: 'partitura', partitura: p }); $('#nota-partitura').textContent = p.nota; });
  $('#partituras').appendChild(b);
});

// ── la mano ──
const lc = $('#cuerpo');
const sDe = (ev) => { const r = lc.getBoundingClientRect(); return Math.min(0.995, Math.max(0.005, (ev.clientY - r.top - 10) / (r.height - 20))); };
let mano = null;
function fuerza(ev) { return ev.pointerType === 'pen' && ev.pressure > 0 ? ev.pressure * F10('Fmax') * 10 : F10('F'); }
lc.addEventListener('pointerdown', async (ev) => {
  await asegurar(); lc.setPointerCapture(ev.pointerId);
  mano = { x: ev.clientX, t: performance.now(), v: 0 };
  enviar({ tipo: 'mano', mano: { s: sDe(ev), F: fuerza(ev), v: 0, material: $('#material').value } });
});
lc.addEventListener('pointermove', (ev) => {
  if (!mano) return;
  const ahora = performance.now(), dt = Math.max(1, ahora - mano.t) / 1000;
  const v = ((ev.clientX - mano.x) / dt) * 0.0005; // 200 px/s → v = 0,1
  mano.v = mano.v * 0.6 + Math.max(-0.4, Math.min(0.4, v)) * 0.4; mano.x = ev.clientX; mano.t = ahora;
  enviar({ tipo: 'mano', mano: { s: sDe(ev), F: fuerza(ev), v: mano.v } });
});
const soltar = () => { if (!mano) return; mano = null; enviar({ tipo: 'mano', mano: { F: 0, v: 0 } }); };
lc.addEventListener('pointerup', soltar); lc.addEventListener('pointercancel', soltar);
// la mano quieta deja de frotar: la velocidad decae
setInterval(() => { if (mano && performance.now() - mano.t > 60 && mano.v !== 0) { mano.v *= 0.5; if (Math.abs(mano.v) < 0.002) mano.v = 0; enviar({ tipo: 'mano', mano: { v: mano.v } }); } }, 50);
lc.addEventListener('wheel', (ev) => { ev.preventDefault(); const r = $('#F'); r.value = Math.max(-2, Math.min(1.4, +r.value - Math.sign(ev.deltaY) * 0.05)); mostrar(); if (mano) enviar({ tipo: 'mano', mano: { F: F10('F') } }); }, { passive: false });
// teclado
let sTecla = 0.52, frotando = false;
lc.addEventListener('keydown', async (ev) => {
  const k = ev.key;
  if (['ArrowUp', 'ArrowDown', ' ', '+', '-'].includes(k)) ev.preventDefault(); else return;
  await asegurar();
  if (k === 'ArrowUp') sTecla = Math.max(0.005, sTecla - 0.01);
  if (k === 'ArrowDown') sTecla = Math.min(0.995, sTecla + 0.01);
  if (k === '+' || k === '-') { const r = $('#F'); r.value = +r.value + (k === '+' ? 0.05 : -0.05); mostrar(); }
  if (k === ' ') frotando = true;
  enviar({ tipo: 'mano', mano: { s: sTecla, F: frotando ? F10('F') : 0, v: frotando ? 0.1 : 0, material: $('#material').value } });
});
lc.addEventListener('keyup', (ev) => { if (ev.key === ' ') { frotando = false; enviar({ tipo: 'mano', mano: { F: 0, v: 0 } }); } });

// ── medidas ──
const nombre = (m) => (m.regimen === 'quieto' ? 'quieto' : m.regimen === 'aperiódico' ? 'aperiódico' : Math.abs(m.desl - 1) < 0.1 ? 'Helmholtz' : m.desl < 0.05 ? 'deslizamiento continuo' : `${m.desl.toFixed(1)} deslizamientos por periodo`);
const colorDe = (n) => (n === 'Helmholtz' ? COL.helm : n === 'aperiódico' ? COL.aper : n === 'quieto' ? COL.pegado : COL.dos);
function recibir(d) {
  if (d.tipo === 'toma') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d.toma)], { type: 'application/json' })); a.download = `toma-cuerpo-${Date.now()}.json`; a.click(); return; }
  if (d.tipo !== 'medida') return;
  ultimo = d;
  const activo = d.mano.F > 0 && Math.abs(d.mano.v) > 0.005;
  const n = activo ? (d.comarca === 'cuerda' ? nombre(d.m) : d.m.regimen) : 'quieto';
  traza.push({ t: performance.now() / 1000, s: d.mano.s, F: d.mano.F, v: d.mano.v, n }); while (traza.length && traza[0].t < performance.now() / 1000 - 20) traza.shift();
  if (activo && d.comarca === 'cuerda') puntos.push({ beta: d.beta, F: d.mano.F / (Math.abs(d.mano.v) / 0.1), n });
  $('#regimen').textContent = activo ? `${d.comarca}: ${n}` : d.mano.F > 0 ? 'presión sin movimiento: no suena' : '';
  $('#regimen').style.color = colorDe(n);
  $('#l-com').textContent = d.comarca; $('#l-beta').textContent = d.beta ? d.beta.toFixed(3) : '—';
  $('#l-F').textContent = d.mano.F.toFixed(2); $('#l-v').textContent = d.mano.v.toFixed(3);
  $('#l-desl').textContent = activo ? d.m.desl.toFixed(2) : '—';
  $('#l-hz').textContent = activo && d.m.periodicidad > 0.9 ? `${d.m.hz.toFixed(1)} Hz` : '—';
  $('#l-db').textContent = activo ? d.m.db.toFixed(1) + ' dB' : '—'; $('#l-cen').textContent = activo ? d.m.centroide.toFixed(0) + ' Hz' : '—';
}

// ── dibujo ──
function preparar(c) { const dpr = Math.min(2, devicePixelRatio || 1), r = c.getBoundingClientRect(); if (c.width !== Math.round(r.width * dpr)) { c.width = r.width * dpr; c.height = r.height * dpr; } const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height); g.font = '11px ui-monospace, monospace'; return [g, r.width, r.height]; }

function dibCuerpo() {
  const [g, W, H] = preparar(lc), Y = (s) => 10 + s * (H - 20), cx = W * 0.55;
  for (const co of COMARCAS) {
    const y0 = Y(co.desde), y1 = Y(co.hasta);
    g.fillStyle = COL.tenue; g.fillText(co.nombre, 8, (y0 + y1) / 2 + 4);
    g.strokeStyle = COL.tinta; g.fillStyle = 'rgba(232,226,214,.08)';
    if (co.nombre === 'anclaje') { g.fillRect(cx - 34, y0, 68, y1 - y0); for (let y = y0 + 3; y < y1; y += 5) { g.beginPath(); g.moveTo(cx - 34, y); g.lineTo(cx + 34, y); g.stroke(); } }
    if (co.nombre === 'cuerda') { g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx, y0); g.lineTo(cx, y1); g.stroke(); g.fillStyle = COL.tenue; g.textAlign = 'right'; g.fillText('lejos del puente', W - 6, y0 + 14); g.fillText('cerca del puente', W - 6, y1 - 6); g.textAlign = 'left'; }
    if (co.nombre === 'puente') { g.fillRect(cx - 40, y0 + 2, 80, y1 - y0 - 4); g.strokeRect(cx - 40, y0 + 2, 80, y1 - y0 - 4); }
    if (co.nombre === 'placa') { g.beginPath(); for (let y = y0; y <= y1; y += 2) { const x = cx + 30 * Math.sin((y - y0) * 0.25) * Math.sin(((y - y0) / (y1 - y0)) * Math.PI); y === y0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    if (co.nombre === 'cavidad') { g.beginPath(); g.ellipse(cx, (y0 + y1) / 2, 46, (y1 - y0) / 2 - 3, 0, 0, 7); g.stroke(); }
    g.strokeStyle = COL.linea; g.beginPath(); g.moveTo(0, y1); g.lineTo(W, y1); g.stroke();
  }
  if (ultimo && ultimo.mano.F > 0) {
    const y = Y(ultimo.mano.s), r = 3 + 5 * Math.log10(1 + ultimo.mano.F * 3);
    g.fillStyle = ultimo.mano.v ? COL.helm : COL.tenue; g.beginPath(); g.arc(cx + Math.max(-60, Math.min(60, ultimo.mano.v * 400)), y, r, 0, 7); g.fill();
  }
}

function dibMapa() {
  const [g, W, H] = preparar($('#mapa')), m = 40;
  const X = (b) => m + ((Math.log(b) - Math.log(0.03)) / (Math.log(0.96) - Math.log(0.03))) * (W - m - 10);
  const Yf = (F) => H - 24 - ((Math.log(F) - Math.log(0.05)) / (Math.log(40) - Math.log(0.05))) * (H - 40);
  g.strokeStyle = COL.linea; g.strokeRect(m, 16, W - m - 10, H - 40);
  g.fillStyle = COL.tenue; g.fillText('β (distancia al puente) →', W - 190, H - 6); g.fillText('F (v = 0,1)', 4, 12);
  for (const b of [0.05, 0.1, 0.2, 0.5]) g.fillText(String(b), X(b) - 8, H - 10);
  for (const F of [0.1, 1, 10]) g.fillText(String(F), 8, Yf(F) + 4);
  g.setLineDash([4, 4]); g.strokeStyle = 'rgba(232,226,214,.25)';
  for (const [p, F1] of [[-1, 3], [-2, 0.4]]) { g.beginPath(); g.moveTo(X(0.03), Yf(F1 * (0.03 / 0.2) ** p)); g.lineTo(X(0.96), Yf(F1 * (0.96 / 0.2) ** p)); g.stroke(); }
  g.setLineDash([]);
  for (const p of puntos) { if (p.F < 0.05 || p.F > 40) continue; g.fillStyle = colorDe(p.n); g.beginPath(); g.arc(X(p.beta), Yf(p.F), 3, 0, 7); g.fill(); }
  if (!puntos.length) { g.fillStyle = COL.tenue; g.fillText('el mapa se pinta tocando la cuerda', m + 12, 34); }
}

function dibTabla() {
  const [g, W, H] = preparar($('#tabla')), ahora = performance.now() / 1000, Y = (s) => 10 + s * (H - 20), X = (t) => W - 8 - ((ahora - t) / 20) * (W - 16);
  for (const co of COMARCAS) { g.strokeStyle = COL.linea; g.beginPath(); g.moveTo(0, Y(co.hasta)); g.lineTo(W, Y(co.hasta)); g.stroke(); }
  g.fillStyle = COL.tenue; g.fillText('partitura de acción · 20 s · grosor: fuerza · color: lo que produjo', 8, H - 4);
  for (let i = 1; i < traza.length; i++) {
    const a = traza[i - 1], b = traza[i]; if (b.F <= 0) continue;
    g.strokeStyle = colorDe(b.n); g.lineWidth = 1 + 2.5 * Math.log10(1 + b.F * 3);
    g.beginPath(); g.moveTo(X(a.t), Y(a.s)); g.lineTo(X(b.t), Y(b.s)); g.stroke();
    if (Math.abs(b.v) > 0.005) { g.lineWidth = 1; g.beginPath(); g.moveTo(X(b.t), Y(b.s)); g.lineTo(X(b.t), Y(b.s) - Math.sign(b.v) * Math.min(14, Math.abs(b.v) * 80)); g.stroke(); }
  }
}

function cuadro() { dibCuerpo(); dibMapa(); dibTabla(); requestAnimationFrame(cuadro); }
mostrar(); requestAnimationFrame(cuadro);
