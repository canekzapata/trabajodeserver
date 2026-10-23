// interfaz.mjs — escribir una frase, imponerle un regreso, escuchar qué tuvo que cambiar.
import { negociar, regreso, orbita, clave } from './bucle.mjs';
import { vuelta, fraseSola, reescritura } from './sintesis.mjs';

const $ = (s) => document.querySelector(s);
const lienzo = $('#lienzo'), ctx = lienzo.getContext('2d');
const PASO = 0.2;
const NOMBRES = ['do', 'do♯', 're', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'sol♯', 'la', 'si♭', 'si'];
const nombre = (p) => `${NOMBRES[p % 12]}${Math.floor(p / 12) - 1}`;
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

const estado = {
  frase: [[0, 60], [2, 62], [3, 63], [6, 67], [8, 61], [12, 65]],
  res: null, vigente: false, cursor: [0, 60],
  sonando: null, // { fuente, inicio, dur, bucle }
};
let audio = null;

const cfg = () => ({ L: +$('#L').value, d: +$('#d').value, n: +$('#n').value });
const restr = () => ({ maxVoces: +$('#voces').value, choques: $('#choques').value ? $('#choques').value.split(',').map(Number) : [] });
const neg = () => ({ prioridad: $('#prioridad').value, callar: $('#callar').value === '' ? Infinity : +$('#callar').value });

function leyes() {
  const c = cfg();
  $('#d').max = c.L - 1; if (c.d >= c.L) $('#d').value = c.d = c.L - 1;
  $('#ley-d').textContent = c.d; $('#ley-n').textContent = c.n;
  const o = orbita([0, 60], c).length;
  $('#orbita').textContent = `cada nota cierra una órbita de ${o} notas: vuelve a sí misma tras ${o} regresos`;
}
for (const id of ['L', 'd', 'n', 'voces', 'choques', 'prioridad', 'callar']) $('#' + id).addEventListener('input', () => { leyes(); caducar(); });

function caducar() {
  if (estado.res) { estado.vigente = false; mostrar(); }
  parar();
}

// ── negociar ──
function imponer() {
  const c = cfg();
  estado.frase = estado.frase.filter(([t]) => t < c.L);
  const t0 = performance.now();
  estado.res = negociar(estado.frase, c, restr(), { ...neg(), presupuesto: 400000 });
  estado.res.ms = performance.now() - t0;
  estado.vigente = true;
  mostrar();
}
$('#negociar').addEventListener('click', imponer);

function mostrar() {
  const r = estado.res, el = $('#resultado');
  if (!r) { el.textContent = ''; return; }
  const lineas = [];
  if (r.estado === 'ninguna') lineas.push('ninguna historia: con estas restricciones la frase no puede sostener su regreso (búsqueda completa)');
  else if (r.estado === 'presupuesto') lineas.push(`presupuesto agotado (${r.nodos} nodos): ${r.H ? 'mejor encontrada, sin garantía de ser la mínima' : 'no se encontró historia; eso no prueba que no exista'}`);
  else lineas.push(`${r.tocada.length ? 'historia consistente' : 'historia consistente: el silencio'} · costo ${r.costo}${r.empates > 1 ? ` · ${r.empates} historias empatan; se elige la primera en el orden declarado` : ''}`);
  if (r.elegida) {
    const cedio = r.elegida.filter((e) => e.cambio !== 'se queda');
    lineas.push(cedio.length ? 'lo que cedió:' : 'la frase no tuvo que ceder nada');
    for (const e of cedio) lineas.push(`  ${nombre(e.original[1])} en ${e.original[0] + 1}: ${e.cambio}${e.nota && e.nota[1] !== e.original[1] ? ` → ${nombre(e.nota[1])}` : ''}`);
    if (r.tocada.length === 0) lineas.push('la frase no llega a sonar');
    else lineas.push(`${r.tocada.length} notas tuyas · ${r.H.length - r.tocada.length} sólo volvieron`);
  }
  el.innerHTML = '';
  const pre = document.createElement('span');
  if (!estado.vigente) pre.className = 'vieja';
  pre.textContent = (estado.vigente ? '' : '(la frase o las leyes cambiaron)\n') + lineas.join('\n');
  el.appendChild(pre);
}

// ── escuchar ──
function parar() {
  if (estado.sonando) { try { estado.sonando.fuente.stop(); } catch {} estado.sonando = null; }
  document.querySelectorAll('[data-que]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
}
async function escuchar(que, boton) {
  if (estado.sonando && estado.sonando.que === que) { parar(); return; }
  parar();
  if (!audio) audio = new AudioContext();
  if (audio.state !== 'running') await audio.resume();
  const c = cfg(), sr = audio.sampleRate;
  let datos, bucle = true;
  if (que === 'frase') { datos = fraseSola({ frase: estado.frase, L: c.L, paso: PASO, sr }); bucle = false; }
  else {
    if (!estado.res || !estado.vigente) imponer();
    const r = estado.res;
    if (!r.H) return;
    if (que === 'reescritura') { datos = reescritura({ frase: estado.frase, H: r.H, tocada: r.tocada, L: c.L, paso: PASO, sr }).audio; bucle = false; }
    else datos = vuelta({ H: r.H, tocada: r.tocada, L: c.L, paso: PASO, sr, que });
  }
  // las vueltas en bucle se escuchan a la misma ganancia que la reescritura no normalizada
  const buf = audio.createBuffer(1, datos.length, sr);
  buf.copyToChannel(que === 'reescritura' ? datos : datos.map((v) => v * 0.5), 0);
  const fuente = audio.createBufferSource();
  fuente.buffer = buf; fuente.loop = bucle; fuente.connect(audio.destination);
  fuente.onended = () => { if (estado.sonando && estado.sonando.fuente === fuente) parar(); };
  fuente.start();
  estado.sonando = { fuente, inicio: audio.currentTime, dur: c.L * PASO, que, bucle };
  if (boton) boton.setAttribute('aria-pressed', 'true');
}
document.querySelectorAll('[data-que]').forEach((b) => b.addEventListener('click', () => escuchar(b.dataset.que, b)));

// ── rejilla ──
let geo = null;
function medir() {
  const dpr = Math.min(2, devicePixelRatio || 1), r = lienzo.getBoundingClientRect();
  lienzo.width = r.width * dpr; lienzo.height = r.height * dpr;
  geo = { dpr, W: r.width, H: r.height };
}
addEventListener('resize', medir);

function rango() {
  const ps = [60, 71, ...estado.frase.map((x) => x[1]), ...(estado.res && estado.res.H ? estado.res.H.map((x) => x[1]) : [])];
  return [Math.min(...ps) - 2, Math.max(...ps) + 2];
}
function celdas() {
  const { L } = cfg(), [lo, hi] = rango();
  const mx = 48, my = 36, w = geo.W - mx - 20, h = geo.H - my - 40;
  return { L, lo, hi, x0: mx, y0: my, cw: w / L, ch: h / (hi - lo + 1) };
}
const centro = (g, t, p) => [g.x0 + (t + 0.5) * g.cw, g.y0 + (g.hi - p + 0.5) * g.ch];

function dibujar() {
  const { dpr, W, H } = geo;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = css('--fondo'); ctx.fillRect(0, 0, W, H);
  const g = celdas(), c = cfg();
  // rejilla: do marcados, pasos de 4 más visibles
  for (let p = g.lo; p <= g.hi; p++) {
    const y = g.y0 + (g.hi - p) * g.ch;
    ctx.fillStyle = p % 12 === 0 ? css('--rejilla2') : css('--rejilla');
    ctx.fillRect(g.x0, y + g.ch - 1, g.cw * g.L, 1);
    if (p % 12 === 0) { ctx.fillStyle = css('--tenue'); ctx.font = '10px ui-monospace, monospace'; ctx.fillText(nombre(p), 8, y + g.ch * 0.7); }
  }
  for (let t = 0; t <= g.L; t++) {
    ctx.fillStyle = t % 4 === 0 ? css('--rejilla2') : css('--rejilla');
    ctx.fillRect(g.x0 + t * g.cw, g.y0, 1, g.ch * (g.hi - g.lo + 1));
  }
  const r = estado.vigente && estado.res && estado.res.H ? estado.res : null;
  // hilos: cada nota de la historia unida a su regreso (curvas cerradas en el toro)
  if (r) {
    ctx.strokeStyle = 'rgba(143,211,255,.18)'; ctx.lineWidth = 1;
    for (const x of r.H) {
      const y = regreso(x, c), [ax, ay] = centro(g, ...x), [bx, by] = centro(g, ...y);
      ctx.beginPath();
      if (y[0] < x[0]) { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }
      else { // envuelve: sale por la izquierda y entra por la derecha
        const m = (ay + by) / 2;
        ctx.moveTo(ax, ay); ctx.lineTo(g.x0, m); ctx.moveTo(g.x0 + g.L * g.cw, m); ctx.lineTo(bx, by);
      }
      ctx.stroke();
    }
  }
  const rad = Math.max(3, Math.min(g.cw, g.ch) * 0.36);
  if (r) {
    const mias = new Set(r.tocada.map((x) => clave(...x)));
    for (const x of r.H) {
      if (mias.has(clave(...x))) continue;
      const [cx, cy] = centro(g, ...x);
      ctx.strokeStyle = css('--vidrio'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, rad * 0.8, 0, 7); ctx.stroke();
    }
    // lo que cedió: dónde estaba y adónde fue
    for (const e of r.elegida) {
      if (e.cambio === 'se queda') continue;
      const [ox, oy] = centro(g, ...e.original);
      ctx.strokeStyle = css('--antes'); ctx.lineWidth = 1.2;
      ctx.strokeRect(ox - rad, oy - rad, rad * 2, rad * 2);
      if (e.nota) { const [nx, ny] = centro(g, ...e.nota); ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(nx, ny); ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(ox - rad, oy - rad); ctx.lineTo(ox + rad, oy + rad); ctx.stroke(); }
    }
    for (const x of r.tocada) { const [cx, cy] = centro(g, ...x); ctx.fillStyle = css('--madera'); ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }
  } else {
    for (const x of estado.frase) { const [cx, cy] = centro(g, ...x); ctx.fillStyle = css('--madera'); ctx.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }
  }
  // cursor de teclado
  if (document.activeElement === lienzo) {
    const [cx, cy] = centro(g, ...estado.cursor);
    ctx.strokeStyle = css('--tinta'); ctx.lineWidth = 1; ctx.strokeRect(cx - g.cw / 2 + 1, cy - g.ch / 2 + 1, g.cw - 2, g.ch - 2);
  }
  // cabeza de lectura
  const s = estado.sonando;
  if (s && audio && s.que !== 'reescritura' && s.que !== 'frase') {
    const t = ((audio.currentTime - s.inicio) % s.dur) / PASO;
    const x = g.x0 + t * g.cw;
    ctx.fillStyle = 'rgba(230,225,214,.5)'; ctx.fillRect(x, g.y0, 1.5, g.ch * (g.hi - g.lo + 1));
  }
  // pie
  ctx.fillStyle = css('--tenue'); ctx.font = '11px ui-monospace, monospace';
  ctx.fillText(`tiempo →  ${g.L} pasos · ${(g.L * PASO).toFixed(1)} s · el borde derecho sigue en el izquierdo`, g.x0, H - 14);
  requestAnimationFrame(dibujar);
}

function celdaEn(ev) {
  const r = lienzo.getBoundingClientRect(), g = celdas();
  const t = Math.floor((ev.clientX - r.left - g.x0) / g.cw), p = g.hi - Math.floor((ev.clientY - r.top - g.y0) / g.ch);
  return t >= 0 && t < g.L && p >= g.lo && p <= g.hi ? [t, p] : null;
}
function alternar([t, p]) {
  const i = estado.frase.findIndex((x) => x[0] === t && x[1] === p);
  if (i >= 0) estado.frase.splice(i, 1); else estado.frase.push([t, p]);
  caducar();
}
lienzo.addEventListener('click', (ev) => { const c = celdaEn(ev); if (c) { estado.cursor = c; alternar(c); } });
lienzo.addEventListener('keydown', (ev) => {
  const g = celdas(), [t, p] = estado.cursor;
  const mov = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[ev.key];
  if (mov) { ev.preventDefault(); estado.cursor = [(t + mov[0] + g.L) % g.L, Math.max(g.lo, Math.min(g.hi, p + mov[1]))]; }
  else if (ev.key === 'Enter') { ev.preventDefault(); alternar(estado.cursor); }
  else if (ev.key === 'n' || ev.key === 'N') imponer();
  else if (ev.key === ' ') { ev.preventDefault(); escuchar('historia', document.querySelector('[data-que=historia]')); }
});

medir(); leyes(); requestAnimationFrame(dibujar);
