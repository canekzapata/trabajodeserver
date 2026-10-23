// interfaz.mjs — la página: el disco, la mano y el recorrido.
// El sonido y la física corren en el worklet; aquí sólo se envían gestos y se dibuja lo que informa.
import { Trompo, PATRONES, sectorEn } from './motor.mjs';

const $ = (s) => document.querySelector(s);
const lienzo = $('#disco'), ctx = lienzo.getContext('2d');
const trazaL = $('#traza'), tctx = trazaL.getContext('2d');

// colores de igual luminancia (OKLCH L=0.72, C=0.11), en luz lineal para promediar
const PALETA = [
  ['amarillo', [0.492, 0.37, 0.074]], ['cañaveral', [0.212, 0.466, 0.171]], ['aguamarina', [0.047, 0.496, 0.421]],
  ['azul', [0.153, 0.399, 0.799]], ['violeta', [0.429, 0.298, 0.741]], ['rosa', [0.69, 0.243, 0.425]],
  ['rojo', [0.755, 0.248, 0.221]], ['naranja', [0.68, 0.294, 0.103]],
];
const aSRGB = (c) => {
  const e = (x) => { x = Math.min(1, Math.max(0, x)); return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055; };
  return `rgb(${Math.round(e(c[0]) * 255)},${Math.round(e(c[1]) * 255)},${Math.round(e(c[2]) * 255)})`;
};

const estado = {
  patron: PATRONES['ocho-colores'](), nombrePatron: 'ocho-colores', modo: 'impulsos', dientes: 20,
  theta: 0, omega: 0, tAudio: 0, recibido: performance.now(),
  thetaCuadro: 0, imagen: 'exposicion', eventos: 0,
  traza: [], mano: null, sonido: true, grabando: false,
};
let audio = null, nodo = null, salida = null;

function coloresDe(patron) {
  // cada marca conserva su color aunque se añadan o quiten otras
  return patron.map((e) => e.color || PALETA[0][1]);
}
function colorear(patron) {
  patron.forEach((e, k) => { if (!e.color) e.color = PALETA[k % PALETA.length][1]; });
  return patron;
}
colorear(estado.patron);

// ── audio ──
async function iniciarAudio() {
  if (audio) return;
  audio = new AudioContext({ latencyHint: 'interactive' });
  await audio.audioWorklet.addModule(new URL('./worklet.mjs', import.meta.url));
  nodo = new AudioWorkletNode(audio, 'trompo', { numberOfInputs: 0, outputChannelCount: [2] });
  salida = audio.createGain(); salida.gain.value = estado.sonido ? 1 : 0;
  nodo.connect(salida).connect(audio.destination);
  nodo.port.onmessage = (ev) => {
    const m = ev.data;
    if (m.tipo === 'estado') {
      estado.theta = m.theta; estado.omega = m.omega; estado.tAudio = m.tiempo; estado.recibido = performance.now();
      estado.eventos = m.eventos;
    } else if (m.tipo === 'toma') guardarToma(m.toma);
  };
  enviar({ tipo: 'patron', patron: limpio(estado.patron) });
  enviar({ tipo: 'params', params: leerParams() });
}
const enviar = (m) => nodo && nodo.port.postMessage(m);
const limpio = (patron) => patron.map(({ fase, tipo, nota, dur }) => ({ fase, tipo, nota, dur }));

function leerParams() {
  return {
    modo: $('#modo').value, peso: +$('#peso').value, viscoso: +$('#viscoso').value, seco: +$('#seco').value,
    barajar: $('#barajar').getAttribute('aria-pressed') === 'true',
  };
}
for (const id of ['peso', 'viscoso', 'seco']) $('#' + id).addEventListener('input', () => enviar({ tipo: 'params', params: leerParams() }));
$('#modo').addEventListener('change', () => { estado.modo = $('#modo').value; enviar({ tipo: 'params', params: leerParams() }); });
$('#patron').addEventListener('change', () => {
  estado.nombrePatron = $('#patron').value;
  estado.patron = colorear(PATRONES[estado.nombrePatron]());
  enviar({ tipo: 'patron', patron: limpio(estado.patron) });
});
$('#imagen').addEventListener('change', () => { estado.imagen = $('#imagen').value; });
$('#barajar').addEventListener('click', (e) => {
  const b = e.currentTarget, v = b.getAttribute('aria-pressed') !== 'true';
  b.setAttribute('aria-pressed', v); b.textContent = v ? 'sí' : 'no';
  enviar({ tipo: 'params', params: leerParams() });
});
$('#sonido').addEventListener('click', (e) => {
  estado.sonido = !estado.sonido; e.currentTarget.setAttribute('aria-pressed', estado.sonido);
  if (salida) salida.gain.setTargetAtTime(estado.sonido ? 1 : 0, audio.currentTime, 0.02);
});
$('#grabar').addEventListener('click', async (e) => {
  await iniciarAudio();
  estado.grabando = !estado.grabando;
  e.currentTarget.setAttribute('aria-pressed', estado.grabando);
  e.currentTarget.textContent = estado.grabando ? 'parar y guardar' : 'grabar toma';
  enviar({ tipo: estado.grabando ? 'grabar' : 'parar' });
});
$('#empezar').addEventListener('click', async () => { await iniciarAudio(); $('#inicio').remove(); lienzo.focus(); });

async function guardarToma(toma) {
  const texto = JSON.stringify(toma);
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
  const hex = [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  a.download = `toma-trompo-${hex.slice(0, 12)}.json`;
  a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  avisar(`toma guardada (${(toma.bloques * toma.bloque / toma.sr).toFixed(1)} s). node renderizar.mjs ${a.download} toma.wav la recalcula.`);
}

let avisoT = 0;
function avisar(t) { const a = $('#aviso'); a.textContent = t; a.style.opacity = 1; clearTimeout(avisoT); avisoT = setTimeout(() => (a.style.opacity = 0), 3500); }

// ── geometría ──
let W = 0, H = 0, cx = 0, cy = 0, R = 0, dpr = 1;
function medir() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  const r = lienzo.getBoundingClientRect();
  W = r.width; H = r.height;
  lienzo.width = W * dpr; lienzo.height = H * dpr;
  // el disco no se centra: se recarga hacia la izquierda y abajo, cerca del recorrido
  R = Math.min(W, H) * (W < 600 ? 0.45 : 0.4);
  cx = W < 600 ? W / 2 : Math.max(R + 24, W * 0.44);
  cy = W < 600 ? H / 2 : Math.min(H - R - 18, H * 0.54);
  const t = trazaL.getBoundingClientRect();
  trazaL.width = t.width * dpr; trazaL.height = t.height * dpr;
}
window.addEventListener('resize', medir);

// θ estimado ahora, a partir del último informe del worklet
function thetaAhora() {
  if (!audio) return estado.theta;
  const dt = Math.min(0.1, audio.currentTime - estado.tAudio);
  return estado.theta + estado.omega * Math.max(0, dt);
}

// ── la mano ──
const angulo = (x, y) => Math.atan2(y - cy, x - cx) / (2 * Math.PI); // vueltas, sentido horario en pantalla
function entrada(e) { enviar({ tipo: 'entrada', entrada: e }); }
lienzo.addEventListener('pointerdown', async (ev) => {
  await iniciarAudio();
  if (audio.state !== 'running') await audio.resume();
  const r = lienzo.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
  if (Math.hypot(x - cx, y - cy) > R * 1.08) return;
  lienzo.setPointerCapture(ev.pointerId);
  const presion = ev.shiftKey ? 0.12 : (ev.pointerType === 'pen' && ev.pressure > 0 ? 0.2 + ev.pressure : 0.6);
  estado.mano = { a: angulo(x, y), t: performance.now(), w: 0, presion };
  entrada({ mano: true, wMano: 0, presion });
});
lienzo.addEventListener('pointermove', (ev) => {
  if (!estado.mano) return;
  const r = lienzo.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
  const a = angulo(x, y), ahora = performance.now();
  let d = a - estado.mano.a; d -= Math.round(d);
  const dt = Math.max(1, ahora - estado.mano.t) / 1000;
  // velocidad de la mano en vueltas/s, suavizada; cerca del centro el ángulo es inestable
  const cerca = Math.hypot(x - cx, y - cy) > R * 0.15;
  const w = cerca ? d / dt : estado.mano.w;
  estado.mano.w = estado.mano.w * 0.6 + w * 0.4;
  estado.mano.a = a; estado.mano.t = ahora;
  entrada({ mano: true, wMano: estado.mano.w, presion: ev.shiftKey ? 0.12 : estado.mano.presion });
});
const soltar = () => { if (!estado.mano) return; estado.mano = null; entrada({ mano: false, wMano: 0 }); };
lienzo.addEventListener('pointerup', soltar);
lienzo.addEventListener('pointercancel', soltar);
// una mano que deja de moverse sigue apoyada: su velocidad vuelve a cero y frena
setInterval(() => {
  if (estado.mano && performance.now() - estado.mano.t > 50 && estado.mano.w !== 0) {
    estado.mano.w *= 0.5; if (Math.abs(estado.mano.w) < 0.01) estado.mano.w = 0;
    entrada({ mano: true, wMano: estado.mano.w, presion: estado.mano.presion });
  }
}, 40);

// teclado: flechas empujan, espacio frena
const teclas = new Set();
lienzo.addEventListener('keydown', async (ev) => {
  if (ev.repeat) return;
  if (['ArrowLeft', 'ArrowRight', ' '].includes(ev.key)) ev.preventDefault(); else return;
  await iniciarAudio(); if (audio.state !== 'running') await audio.resume();
  teclas.add(ev.key);
  if (ev.key === ' ') entrada({ mano: true, wMano: 0, presion: ev.shiftKey ? 0.12 : 0.6 });
  else entrada({ empuje: ev.key === 'ArrowRight' ? 8 : -8 });
});
lienzo.addEventListener('keyup', (ev) => {
  teclas.delete(ev.key);
  if (ev.key === ' ') entrada({ mano: false, wMano: 0 });
  if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') entrada({ empuje: 0 });
});

// editar: sólo con el disco detenido
lienzo.addEventListener('dblclick', (ev) => {
  const r = lienzo.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
  const d = Math.hypot(x - cx, y - cy);
  if (d < R * 0.7 || d > R * 1.08) return;
  if (Math.abs(estado.omega) > 0.05) { avisar('Sólo se reescribe lo que se alcanza a distinguir: detén el disco.'); return; }
  let fase = angulo(x, y) - thetaAhora(); fase = ((Math.round(fase * 48) / 48) % 1 + 1) % 1;
  const k = estado.patron.findIndex((e) => Math.abs(((e.fase - fase + 1.5) % 1) - 0.5) < 1.5 / 48);
  if (k >= 0) { if (estado.patron.length > 1) estado.patron.splice(k, 1); }
  else {
    const libres = PALETA.filter(([, c]) => !estado.patron.some((e) => e.color === c));
    const n = estado.patron.length;
    estado.patron.push({ fase, tipo: 'tono', nota: [196, 220, 261.63, 293.66, 329.63, 392, 440, 523.25][(n * 3) % 8], dur: 0.35, color: (libres[0] || PALETA[n % 8])[1] });
  }
  estado.patron.sort((a, b) => a.fase - b.fase);
  enviar({ tipo: 'patron', patron: limpio(estado.patron) });
});

// ── dibujo ──
const BINS = 360;
function dibujarDisco(t0, t1) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const pat = estado.patron, col = coloresDe(pat);
  const exp = estado.imagen === 'exposicion';
  // cada cuña de pantalla en α recibe, durante el cuadro, el material de fase α − θ
  for (let i = 0; i < BINS; i++) {
    const a0 = i / BINS, a1 = (i + 1) / BINS, am = (a0 + a1) / 2;
    const c = exp ? Trompo.colorMedio(pat, col, am - t1, am - t0) : col[sectorEn(pat, am - t1)];
    ctx.fillStyle = aSRGB(c);
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, a0 * 2 * Math.PI - 0.004, a1 * 2 * Math.PI + 0.004);
    ctx.closePath(); ctx.fill();
  }
  // pista óptica del modo ausente: un anillo leído por la luz
  if (estado.modo === 'ausente') {
    const D = estado.dientes, H5 = [2, 3, 4, 5];
    for (let i = 0; i < 720; i++) {
      const a0 = i / 720, am = (i + 0.5) / 720;
      // media exacta de sen(2πk(α − θ)) mientras θ va de t0 a t1
      let s = 0; const L = t1 - t0;
      for (const h of H5) {
        const k = 2 * Math.PI * h * D;
        s += exp && Math.abs(L) > 1e-7 ? (Math.cos(k * (am - t1)) - Math.cos(k * (am - t0))) / (k * L) : Math.sin(k * (am - t1));
      }
      s /= 4;
      const g = Math.round(128 + 110 * s);
      ctx.strokeStyle = `rgb(${g},${g},${g})`; ctx.lineWidth = R * 0.07;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, a0 * 2 * Math.PI, (a0 + 1 / 720) * 2 * Math.PI + 0.003); ctx.stroke();
    }
  }
  // marcas: dónde el disco golpea
  ctx.strokeStyle = 'rgba(29,27,24,.75)'; ctx.lineWidth = 1.5;
  for (const e of pat) {
    const a = (e.fase + t1) * 2 * Math.PI;
    const alfa = exp ? Math.max(0.08, 1 - Math.abs(t1 - t0) * pat.length * 1.5) : 1;
    ctx.globalAlpha = alfa;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 0.93, cy + Math.sin(a) * R * 0.93); ctx.lineTo(cx + Math.cos(a) * R * 1.04, cy + Math.sin(a) * R * 1.04); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // la lectura fija: donde suena
  ctx.fillStyle = '#1d1b18';
  ctx.beginPath(); ctx.moveTo(cx + R * 1.06, cy); ctx.lineTo(cx + R * 1.12, cy - 5); ctx.lineTo(cx + R * 1.12, cy + 5); ctx.fill();
  // eje
  ctx.fillStyle = '#f4f2ec'; ctx.beginPath(); ctx.arc(cx, cy, Math.max(3, R * 0.025), 0, 2 * Math.PI); ctx.fill();
}

// recorrido: velocidad en el tiempo; la mano que frena se dibuja más oscura
const VENTANA = 90;
function dibujarTraza(ahora) {
  const w = trazaL.width / dpr, h = trazaL.height / dpr;
  tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  tctx.clearRect(0, 0, w, h);
  const tr = estado.traza;
  const max = Math.max(4, ...tr.map((p) => Math.abs(p.w)));
  tctx.fillStyle = '#8a857b'; tctx.font = '11px ui-monospace, monospace';
  tctx.fillText(`recorrido · ${max.toFixed(0)} v/s`, 10, 14);
  for (let i = 1; i < tr.length; i++) {
    const p = tr[i - 1], q = tr[i];
    const x0 = w - (ahora - p.t) / VENTANA * w, x1 = w - (ahora - q.t) / VENTANA * w;
    const y0 = h - 6 - Math.abs(p.w) / max * (h - 24), y1 = h - 6 - Math.abs(q.w) / max * (h - 24);
    tctx.strokeStyle = q.g === 'frena' ? '#1d1b18' : q.g === 'impulsa' ? '#3a6ea5' : '#b9b3a6';
    tctx.lineWidth = q.g === 'libre' ? 1 : 2;
    tctx.beginPath(); tctx.moveTo(x0, y0); tctx.lineTo(x1, y1); tctx.stroke();
  }
}

let ultimo = performance.now();
function cuadro(ahora) {
  const t1 = thetaAhora();
  const t0 = estado.thetaCuadro === null ? t1 : estado.thetaCuadro;
  estado.thetaCuadro = t1;
  dibujarDisco(t0, t1);
  const s = ahora / 1000;
  if (ahora - ultimo > 50) {
    ultimo = ahora;
    const m = estado.mano, frenando = (m && Math.abs(m.w) < Math.abs(estado.omega)) || teclas.has(' ');
    const g = frenando ? 'frena' : (m || teclas.has('ArrowLeft') || teclas.has('ArrowRight')) ? 'impulsa' : 'libre';
    estado.traza.push({ t: s, w: estado.omega, g });
    while (estado.traza.length && estado.traza[0].t < s - VENTANA) estado.traza.shift();
    const r = Math.abs(estado.omega);
    $('#t-vueltas').textContent = r.toFixed(2);
    $('#t-eventos').textContent = (r * estado.patron.length).toFixed(1);
    $('#t-motivo').textContent = r.toFixed(2);
    $('#t-pista').textContent = estado.modo === 'ausente' ? `${(r * estado.dientes).toFixed(1)} (sin ella)` : '—';
  }
  dibujarTraza(s);
  requestAnimationFrame(cuadro);
}
document.addEventListener('visibilitychange', () => { estado.thetaCuadro = null; });

medir();
estado.thetaCuadro = null;
requestAnimationFrame(cuadro);
