// interfaz.mjs — tocar el sampleador y mirar lo que lee. Todo lo dibujado viene del worklet.
import { TOMAS } from './tomas.mjs';
import { errorNucleo, pendiente } from './motor.mjs';

const $ = (s) => document.querySelector(s);
let audio = null, nodo = null, salida = null, ultimo = null;
const HIST = 4, hoja = [], sonda = []; // historia local para dibujar (≈ 30 cuadros/s)
const ESCALA = [['A', 110], ['S', 130.81], ['D', 146.83], ['F', 164.81], ['G', 196], ['H', 220], ['J', 261.63], ['K', 293.66]];
const NOMBRES = ['la2', 'do3', 're3', 'mi3', 'sol3', 'la3', 'do4', 're4'];

const ids = ['tau0', 'beta', 'mezcla', 'c', 'gamma', 'kappa', 'g', 'alfa', 'retardo'];
const mostrar = () => {
  ids.forEach((id) => ($('#o-' + id).value = (+$('#' + id).value).toFixed(2)));
  const c = +$('#c').value, b = +$('#beta').value, a = +$('#alfa').value;
  $('#l-dt').textContent = `${(b / c).toFixed(3)} s (βL/c)`;
  $('#l-k').textContent = `${(errorNucleo(a) * 100).toFixed(1)} % · ${pendiente(a, 0.05).toFixed(2)} a ${pendiente(a, 2).toFixed(2)}`;
};
const params = () => Object.fromEntries(['tau0', 'beta', 'mezcla', 'c', 'gamma', 'kappa', 'g', 'alfa'].map((k) => [k, +$('#' + k).value]));
ids.forEach((id) => $('#' + id).addEventListener('input', () => { mostrar(); enviar({ tipo: 'params', params: params() }); }));

let preparando = null; // una sola inicialización aunque lleguen varios gestos a la vez
function iniciar() { return (preparando ||= arrancar()); }
async function arrancar() {
  audio = new AudioContext();
  await audio.audioWorklet.addModule(new URL('./worklet.mjs', import.meta.url));
  nodo = new AudioWorkletNode(audio, 'sampleador', { numberOfInputs: 0, outputChannelCount: [2] });
  salida = audio.createGain(); salida.gain.value = 0; nodo.connect(salida).connect(audio.destination);
  nodo.port.onmessage = (e) => recibir(e.data);
  enviar({ tipo: 'params', params: params() });
}
const enviar = (m) => nodo && nodo.port.postMessage(m);
async function asegurar() {
  await iniciar(); await audio.resume();
  const b = $('#sonido'); if (b.getAttribute('aria-pressed') !== 'true') { b.setAttribute('aria-pressed', 'true'); salida.gain.setTargetAtTime(1, audio.currentTime, 0.03); }
}
$('#sonido').addEventListener('click', async (e) => {
  const b = e.currentTarget; await iniciar(); await audio.resume();
  const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on);
  salida.gain.setTargetAtTime(on ? 1 : 0, audio.currentTime, 0.03);
});
$('#pulsar').addEventListener('click', async () => { await asegurar(); enviar({ tipo: 'pulsar', x: 0.3, A: 0.4 }); });
$('#golpear').addEventListener('click', async () => { await asegurar(); enviar({ tipo: 'golpear', x: 0.72, A: 2.2 }); });
$('#apagar').addEventListener('click', () => enviar({ tipo: 'apagar' }));
$('#cristalizar').addEventListener('click', async () => { await asegurar(); enviar({ tipo: 'cristalizar' }); });
$('#estrato').addEventListener('change', () => enviar({ tipo: 'estrato', i: +$('#estrato').value }));

// ── notas ──
let sostener = false, sonando = null;
const tocar = async (f, on) => { await asegurar(); if (on) { sonando = f; enviar({ tipo: 'nota', f, gate: 1 }); } else if (!sostener && sonando === f) { sonando = null; enviar({ tipo: 'nota', gate: 0 }); } };
ESCALA.forEach(([k, f], i) => {
  const b = document.createElement('button'); b.textContent = `${k} ${NOMBRES[i]}`;
  b.addEventListener('pointerdown', () => tocar(f, true)); b.addEventListener('pointerup', () => tocar(f, false)); b.addEventListener('pointerleave', () => tocar(f, false));
  $('#teclas').appendChild(b);
});
addEventListener('keydown', (e) => { if (e.repeat || e.target.tagName === 'INPUT') return; const n = ESCALA.find(([k]) => k === e.key.toUpperCase()); if (n) tocar(n[1], true); });
addEventListener('keyup', (e) => { const n = ESCALA.find(([k]) => k === e.key.toUpperCase()); if (n) tocar(n[1], false); });
$('#sostener').addEventListener('click', (e) => { sostener = !sostener; e.currentTarget.setAttribute('aria-pressed', sostener); e.currentTarget.textContent = sostener ? 'sí' : 'no'; if (!sostener) { sonando = null; enviar({ tipo: 'nota', gate: 0 }); } });

// ── puntos de partida: el cuerpo y el cabezal de cada toma ──
Object.entries(TOMAS).forEach(([nombre, T]) => {
  const b = document.createElement('button'); b.textContent = nombre;
  b.addEventListener('click', async () => {
    const base = { tau0: 0, beta: 0, mezcla: 0, c: 1.6, gamma: 0.15, kappa: 0, g: 0, alfa: 0.4, ...T.p };
    Object.entries(base).forEach(([k, v]) => ($('#' + k).value = v));
    mostrar(); await asegurar(); enviar({ tipo: 'params', params: params() });
    enviar({ tipo: 'apagar' }); enviar({ tipo: 'pulsar', x: 0.3, A: 0.4 });
    $('#aviso').textContent = T.nota + (nombre === 'estrato' ? ' (aquí: cristaliza tú y sube «leer estrato»)' : '');
  });
  $('#presets').appendChild(b);
});

// ── la mano: arrastrar la cuerda ──
const lc = $('#cuerda');
const mano = (ev) => { const r = lc.getBoundingClientRect(); return { x: Math.min(0.97, Math.max(0.03, (ev.clientX - r.left) / r.width)), y: -((ev.clientY - r.top) / r.height - 0.5) * 1.2, k: 400 }; };
lc.addEventListener('pointerdown', async (ev) => { await asegurar(); lc.setPointerCapture(ev.pointerId); enviar({ tipo: 'mano', mano: mano(ev) }); });
lc.addEventListener('pointermove', (ev) => { if (lc.hasPointerCapture(ev.pointerId)) enviar({ tipo: 'mano', mano: mano(ev) }); });
lc.addEventListener('pointerup', () => enviar({ tipo: 'mano', mano: null }));
$('#hoja').addEventListener('click', (ev) => { const r = ev.currentTarget.getBoundingClientRect(); const t = ((ev.clientX - r.left - 30) / (r.width - 38)) * HIST; $('#tau0').value = Math.max(0, Math.min(3.5, t)).toFixed(2); mostrar(); enviar({ tipo: 'params', params: params() }); });

function recibir(d) {
  ultimo = d;
  hoja.push({ t: d.t, u: d.u }); while (hoja.length && hoja[0].t < d.t - HIST) hoja.shift();
  sonda.push({ t: d.t, s: d.u[9] }); while (sonda.length && sonda[0].t < d.t - 6) sonda.shift();
  $('#l-c').textContent = d.c.toFixed(3) + ' L/s';
  $('#l-ec').textContent = d.energia.cuerda.toExponential(2);
  $('#l-em').textContent = d.energia.memoria.toExponential(2);
  $('#l-es').textContent = d.estratos;
  const sel = $('#estrato');
  if (sel.options.length - 1 !== d.estratos) {
    sel.innerHTML = '<option value="-1">sin estratos</option>' + Array.from({ length: d.estratos }, (_, i) => `<option value="${i}">estrato ${i + 1}</option>`).join('');
    sel.value = d.estrato;
  }
}

// ── dibujo ──
function preparar(c) {
  const dpr = Math.min(2, devicePixelRatio || 1), r = c.getBoundingClientRect();
  if (c.width !== Math.round(r.width * dpr)) { c.width = r.width * dpr; c.height = r.height * dpr; }
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height); g.font = '10px ui-monospace, monospace';
  return [g, r.width, r.height];
}
const color = (v, m) => { const a = Math.min(1, Math.abs(v) / m); return v >= 0 ? `rgba(226,104,92,${a})` : `rgba(111,168,214,${a})`; };

function dibHoja() {
  const [g, W, H] = preparar($('#hoja')), m = 30, w = W - m - 8, h = H - 22;
  g.fillStyle = '#7f8691'; g.fillText('ahora', m, H - 6); g.fillText(`${HIST} s atrás →`, W - 70, H - 6); g.fillText('x', 12, 14);
  if (!hoja.length) return;
  const t1 = hoja[hoja.length - 1].t, mx = Math.max(0.05, ...hoja.flatMap((f) => f.u.map(Math.abs)));
  hoja.forEach((f, j) => {
    const x = m + ((t1 - f.t) / HIST) * w, dxp = Math.max(1, w / (HIST * 30) + 0.5);
    f.u.forEach((v, i) => { g.fillStyle = color(v, mx); g.fillRect(x, 8 + h - ((i + 1) / 33) * h - h / 66, dxp, h / 32 + 0.5); });
  });
  // el corte del cabezal: τ(x) = τ₀ + β(x − ½)/c
  const p = params(); g.strokeStyle = '#e2685c'; g.lineWidth = 2; g.beginPath();
  for (let k = 0; k <= 20; k++) { const x = k / 20, tau = Math.max(0, Math.min(HIST, p.tau0 + (p.beta * (x - 0.5)) / p.c)); const px = m + (tau / HIST) * w, py = 8 + h - x * h; k ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke();
}

function dibCuerda() {
  const [g, W, H] = preparar($('#cuerda')), m = 16;
  g.strokeStyle = '#252b33'; g.beginPath(); g.moveTo(m, H / 2); g.lineTo(W - m, H / 2); g.stroke();
  g.fillStyle = '#7f8691'; g.fillText('la cuerda ahora · arrastra para sostenerla', m, 14);
  if (!ultimo) return;
  const u = [0, ...ultimo.u, 0], X = (i) => m + (i / (u.length - 1)) * (W - 2 * m), Y = (v) => H / 2 - (v / 1.2) * H;
  g.strokeStyle = '#e7e3da'; g.lineWidth = 1.5; g.beginPath(); u.forEach((v, i) => (i ? g.lineTo(X(i), Y(v)) : g.moveTo(X(i), Y(v)))); g.stroke();
  const xs = m + 0.3 * (W - 2 * m); g.fillStyle = '#6fa8d6'; g.fillRect(xs - 1, H - 12, 2, 8); g.fillText('sonda', xs + 4, H - 4);
}

function dibCorte() {
  const [g, W, H] = preparar($('#corte'));
  g.fillStyle = '#7f8691'; g.fillText('lo que lee el cabezal = un periodo de la onda', 8, 14);
  if (!ultimo) return;
  const c = ultimo.corte, mx = Math.max(0.05, ...c.map(Math.abs));
  g.strokeStyle = '#252b33'; g.beginPath(); g.moveTo(8, H / 2); g.lineTo(W - 8, H / 2); g.stroke();
  g.strokeStyle = '#e2685c'; g.lineWidth = 2; g.beginPath();
  c.forEach((v, i) => { const x = 8 + (i / (c.length - 1)) * (W - 16), y = H / 2 - (v / mx) * (H * 0.38); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
  g.fillStyle = '#7f8691'; g.fillText(`${ultimo.env > 0.01 ? 'sonando a ' + ultimo.f.toFixed(1) + ' Hz' : 'en silencio'}`, 8, H - 6);
}

function dibTakens() {
  const [g, W, H] = preparar($('#takens'));
  g.fillStyle = '#7f8691'; g.fillText('s(t) contra s(t − d)', 8, 14);
  const d = +$('#retardo').value; if (sonda.length < 3) return;
  const mx = Math.max(0.02, ...sonda.map((p) => Math.abs(p.s))), cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) * 0.4;
  g.strokeStyle = 'rgba(111,168,214,.7)'; g.lineWidth = 1; g.beginPath();
  let j = 0, primero = true;
  for (const p of sonda) {
    while (j < sonda.length - 1 && sonda[j + 1].t <= p.t - d) j++;
    if (sonda[j].t > p.t - d) continue;
    const x = cx + (p.s / mx) * R, y = cy - (sonda[j].s / mx) * R;
    primero ? g.moveTo(x, y) : g.lineTo(x, y); primero = false;
  }
  g.stroke();
}

function cuadro() { dibHoja(); dibCuerda(); dibCorte(); dibTakens(); requestAnimationFrame(cuadro); }
mostrar(); requestAnimationFrame(cuadro);
