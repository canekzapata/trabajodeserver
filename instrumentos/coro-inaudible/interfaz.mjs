// interfaz.mjs — el corredor, las seis notas y el tiempo. La física corre en worklet.mjs.
import { disenar, modos as modosDe, N } from './motor.mjs';
import { PARTITURAS } from './tomas.mjs';

const $ = (id) => document.getElementById(id);
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const COL = { oro: css('--oro'), voz: css('--voz'), tinta: css('--tinta'), tenue: css('--tenue'), linea: css('--linea'), boca: css('--boca') };

let ctx = null, nodo = null, preparando = null, estado = null, diseno = disenar(), lista = modosDe(diseno), ultimo = 2;
const historia = []; // [guardada, db] a 30 Hz

async function arrancar() {
  ctx = new AudioContext({ latencyHint: 'interactive' });
  await ctx.audioWorklet.addModule('worklet.mjs');
  nodo = new AudioWorkletNode(ctx, 'coro', { outputChannelCount: [2] });
  nodo.connect(ctx.destination);
  nodo.port.onmessage = (e) => {
    const m = e.data;
    if (m.tipo === 'estado') { estado = m; historia.push([m.guardada, m.db]); if (historia.length > 600) historia.shift(); }
    else if (m.tipo === 'diseno') mostrarDiseno(m.diseno);
    else if (m.tipo === 'toma') bajar(m.toma);
  };
  nodo.port.postMessage({ tipo: 'afinar', diseno: { base: diseno.base, armonicos: diseno.armonicos, eje: diseno.f0 } });
  enviarEscucha();
  $('sonido').setAttribute('aria-pressed', 'true');
}
const listo = async () => { preparando ||= arrancar(); await preparando; if (ctx.state !== 'running') await ctx.resume(); };
const gesto = async (g) => { await listo(); nodo.port.postMessage({ tipo: 'gesto', g }); };

$('sonido').onclick = async () => {
  if (ctx && ctx.state === 'running') { await ctx.suspend(); $('sonido').setAttribute('aria-pressed', 'false'); }
  else { await listo(); $('sonido').setAttribute('aria-pressed', 'true'); }
};
$('cerrar').onclick = () => { gesto({ cerrar: true }); $('sep').value = 0; ponerSep(); };
$('apagar').onclick = async () => { await listo(); nodo.port.postMessage({ tipo: 'apagar' }); };
$('pulso').onclick = () => gesto({ pulso: 1 });
$('grabar').onclick = async () => {
  await listo();
  const on = $('grabar').getAttribute('aria-pressed') !== 'true';
  $('grabar').setAttribute('aria-pressed', String(on));
  nodo.port.postMessage({ tipo: on ? 'grabar' : 'parar' });
};
function bajar(toma) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(toma, null, 1)], { type: 'application/json' }));
  a.download = `coro-toma-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`; a.click();
}
const ponerSep = () => { const v = +$('sep').value; $('o-sep').textContent = `${v >= 0 ? '+' : ''}${(v / 10).toFixed(2)} %`; return 1 + v / 1000; };
$('sep').oninput = () => gesto({ separar: ponerSep() });
ponerSep();
function enviarEscucha() {
  const g = { escucha: +$('mezcla').value, cantor: +$('cantor').value };
  $('o-mezcla').textContent = g.escucha === 0 ? 'sala' : g.escucha === 1 ? 'cerca' : g.escucha.toFixed(2);
  if (nodo) nodo.port.postMessage({ tipo: 'gesto', g });
}
$('mezcla').oninput = enviarEscucha; $('cantor').onchange = enviarEscucha; enviarEscucha();

// ---------- el acorde ----------
function leerDiseno(conEje) {
  const base = +$('base').value, armonicos = [+$('n1').value, +$('n2').value, +$('n3').value].sort((a, b) => a - b);
  return disenar({ base, armonicos, eje: conEje ? +$('eje').value || null : null });
}
function llenarEjes() {
  const d = leerDiseno(false), sel = $('eje'), prev = +sel.value;
  sel.innerHTML = d.ejes.map((f) => `<option value="${f}">${f} Hz</option>`).join('') || '<option value="">ninguno</option>';
  if (d.ejes.includes(prev)) sel.value = prev; else if (d.factible) sel.value = d.f0;
  $('afinar').disabled = !d.factible;
  if (!d.factible) $('diseno').textContent = `${d.guardadas.join(' · ')} Hz: ninguna cadena simétrica de seis los guarda (los acoples saldrían imaginarios o casi nulos).`;
  else mostrarDiseno(leerDiseno(true), true);
}
function mostrarDiseno(d, vista) {
  if (!d.factible) return;
  if (!vista) { diseno = d; lista = modosDe(d); }
  const sep = (343 / d.base).toFixed(1);
  $('diseno').innerHTML = `${vista && d !== diseno ? 'Al afinar: ' : ''}guarda <b>${d.guardadas.join(' · ')} Hz</b>; la sala oye el espejo <b>${d.espejo.join(' · ')} Hz</b>, alrededor de ${d.f0} Hz. Acoples ${d.acoples.slice(0, 3).map((c) => c.toFixed(1)).join(', ')} Hz (simétricos). Entre cantores: ${sep} m de aire, un periodo exacto de cada nota guardada.`;
}
for (const id of ['base', 'n1', 'n2', 'n3']) $(id).oninput = llenarEjes;
$('eje').onchange = () => mostrarDiseno(leerDiseno(true), true);
$('afinar').onclick = async () => { const d = leerDiseno(true); await listo(); nodo.port.postMessage({ tipo: 'afinar', diseno: { base: d.base, armonicos: d.armonicos, eje: d.f0 } }); };
llenarEjes(); mostrarDiseno(diseno);

// ---------- partituras ----------
for (const [nombre, p] of Object.entries(PARTITURAS)) {
  const b = document.createElement('button'); b.textContent = nombre;
  b.onclick = async () => { await listo(); $('sep').value = 0; ponerSep(); $('mezcla').value = 0; enviarEscucha(); nodo.port.postMessage({ tipo: 'partitura', partitura: p }); $('nota-partitura').textContent = p.nota; };
  $('partituras').appendChild(b);
}

// ---------- el corredor ----------
const cv = $('corredor'), g = cv.getContext('2d');
function medir(c) { const r = c.getBoundingClientRect(), d = devicePixelRatio || 1; if (c.width !== Math.round(r.width * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); } return { W: c.width, H: c.height, d }; }
const geo = () => {
  const { W, H, d } = medir(cv), m = 34 * d, paso = (W - 2 * m) / N, sVis = estado ? 1 + (estado.s - 1) * 25 : 1;
  const xc = W / 2, porCm = paso / 120;
  const x = (j) => xc + ((j + 0.5) * paso - (W - 2 * m) / 2) * sVis + (estado ? estado.cm[j] : 0) * porCm;
  return { W, H, d, m, paso, x, y: H * 0.55, porCm };
};
let arrastre = null;
const cantorEn = (px) => { const G = geo(); let mejor = -1, dm = 1e9; for (let j = 0; j < N; j++) { const dd = Math.abs(G.x(j) - px); if (dd < dm) { dm = dd; mejor = j; } } return dm < G.paso * 0.45 ? mejor : -1; };
cv.addEventListener('pointerdown', (e) => {
  const d = devicePixelRatio || 1, j = cantorEn(e.offsetX * d); if (j < 0) return;
  cv.setPointerCapture(e.pointerId);
  arrastre = { j, x0: e.offsetX * d, cm0: estado ? estado.cm[j] : 0, movio: false };
  ultimo = j; $('cantor').value = j; enviarEscucha();
});
cv.addEventListener('pointermove', (e) => {
  if (!arrastre) return;
  const d = devicePixelRatio || 1, dx = e.offsetX * d - arrastre.x0;
  if (Math.abs(dx) > 4 * d) arrastre.movio = true;
  if (arrastre.movio) { const cm = Math.max(-60, Math.min(60, arrastre.cm0 + dx / geo().porCm)); gesto({ mover: arrastre.j, cm: +cm.toFixed(2) }); }
});
const soltar = () => {
  if (!arrastre) return;
  if (!arrastre.movio) $('modo').value === 'espejo' ? gesto({ espejo: arrastre.j }) : gesto({ golpe: arrastre.j });
  arrastre = null;
};
cv.addEventListener('pointerup', soltar); cv.addEventListener('pointercancel', () => { arrastre = null; });
cv.addEventListener('keydown', (e) => {
  if (e.key >= '1' && e.key <= '6') { ultimo = +e.key - 1; $('modo').value === 'espejo' ? gesto({ espejo: ultimo }) : gesto({ golpe: ultimo }); }
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { const cm = Math.max(-60, Math.min(60, (estado ? estado.cm[ultimo] : 0) + (e.key === 'ArrowRight' ? 5 : -5))); gesto({ mover: ultimo, cm }); }
  else if (e.key === '0') $('cerrar').onclick();
  else return;
  e.preventDefault();
});

function corredor(t) {
  const G = geo(), { W, H, d, m, y } = G;
  g.clearRect(0, 0, W, H);
  // el tubo
  g.strokeStyle = COL.linea; g.lineWidth = 1 * d;
  g.beginPath(); g.moveTo(m, y - 26 * d); g.lineTo(W - m, y - 26 * d); g.moveTo(m, y + 26 * d); g.lineTo(W - m, y + 26 * d); g.stroke();
  // las bocas: lo que sale a la sala
  const nivel = estado ? Math.max(0, Math.min(1, (estado.db + 70) / 55)) : 0;
  for (const bx of [m, W - m]) {
    const r = (10 + 30 * nivel) * d, gr = g.createRadialGradient(bx, y, 0, bx, y, r);
    gr.addColorStop(0, `rgba(159,195,224,${0.15 + 0.6 * nivel})`); gr.addColorStop(1, 'rgba(159,195,224,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(bx, y, r, 0, 7); g.fill();
  }
  g.fillStyle = COL.tenue; g.font = `${11 * d}px ui-monospace, monospace`; g.textAlign = 'center';
  g.fillText('boca izq.', m + 10 * d, y + 62 * d); g.fillText('boca der.', W - m - 10 * d, y + 62 * d);
  // los cantores
  for (let j = 0; j < N; j++) {
    const x = G.x(j), x0 = G.x.call(null, j) - (estado ? estado.cm[j] * G.porCm : 0);
    let anti = 0, sim = 0;
    if (estado) {
      const k = N - 1 - j, ar = (estado.re[j] - estado.re[k]) / 2, ai = (estado.im[j] - estado.im[k]) / 2, sr = (estado.re[j] + estado.re[k]) / 2, si = (estado.im[j] + estado.im[k]) / 2;
      anti = Math.hypot(ar, ai); sim = Math.hypot(sr, si);
    }
    if (estado && Math.abs(estado.cm[j]) > 0.5) { // la puerta abierta: desde dónde se movió
      g.strokeStyle = COL.boca; g.setLineDash([3 * d, 3 * d]); g.beginPath(); g.moveTo(x0, y - 40 * d); g.lineTo(x0, y + 40 * d); g.stroke(); g.setLineDash([]);
      g.fillStyle = COL.boca; g.fillText(`${estado.cm[j] > 0 ? '+' : ''}${estado.cm[j].toFixed(0)} cm`, x, y - 70 * d);
    }
    const esc = Math.min(1, G.paso / (150 * d)), ro = (14 + 70 * Math.sqrt(anti)) * d * esc, go = g.createRadialGradient(x, y, 0, x, y, ro);
    go.addColorStop(0, `rgba(217,178,95,${Math.min(0.9, 0.1 + 1.6 * anti)})`); go.addColorStop(1, 'rgba(217,178,95,0)');
    g.fillStyle = go; g.beginPath(); g.arc(x, y, ro, 0, 7); g.fill();
    // lo que puede salir: anillos que vibran
    if (sim > 1e-3) { g.strokeStyle = COL.voz; g.globalAlpha = Math.min(1, 0.2 + 3 * sim); for (let a = 0; a < 3; a++) { const rr = (16 + ((t / 8 + a * 12) % 36) + 40 * Math.sqrt(sim)) * d * esc; g.beginPath(); g.arc(x, y, rr, 0, 7); g.stroke(); } g.globalAlpha = 1; }
    g.fillStyle = j === ultimo ? COL.tinta : '#2f2f33'; g.strokeStyle = COL.tinta; g.lineWidth = 1 * d;
    g.beginPath(); g.arc(x, y, 9 * d, 0, 7); g.fill(); g.stroke();
    g.fillStyle = COL.tenue; g.fillText(String(j + 1), x, y + 46 * d);
  }
}

// ---------- las seis notas ----------
const cm_ = $('modos'), gm = cm_.getContext('2d');
function notas() {
  const { W, H, d } = medir(cm_); gm.clearRect(0, 0, W, H);
  const ancho = W / N, base = H - 46 * d, alto = base - 18 * d;
  const chico = ancho < 80 * d;
  gm.font = `${(chico ? 9.5 : 11) * d}px ui-monospace, monospace`; gm.textAlign = 'center';
  lista.forEach((md, k) => {
    const x = (k + 0.5) * ancho, e = estado ? estado.modos[k] : 0, h = Math.max(0, Math.min(1, (Math.log10(e + 1e-9) + 5) / 5.3)) * alto;
    gm.fillStyle = md.oscuro ? COL.oro : COL.voz; gm.globalAlpha = 0.85;
    gm.fillRect(x - ancho * 0.22, base - h, ancho * 0.44, h); gm.globalAlpha = 1;
    gm.fillStyle = COL.tinta; gm.fillText(chico ? md.f.toFixed(0) : `${md.f.toFixed(md.f % 1 ? 1 : 0)} Hz`, x, base + 15 * d);
    gm.fillStyle = md.oscuro ? COL.oro : COL.voz; gm.fillText(md.oscuro ? (chico ? 'guard.' : 'guardada') : 'suena', x, base + 29 * d);
    const fu = estado ? estado.fugas[k] : 0, vida = fu < 1e-6 ? '∞' : 1 / fu > 99 ? `${(1 / fu).toFixed(0)} s` : `${(1 / fu).toFixed(1)} s`;
    gm.fillStyle = COL.tenue; gm.fillText(chico ? vida : `vida ≈ ${vida}`, x, base + 42 * d);
  });
  gm.textAlign = 'left'; gm.fillStyle = COL.tenue; gm.fillText(chico ? 'energía (log) · vida, regla de oro' : 'energía de cada nota (log) · vida por la regla de oro, sin la reacción del tubo', 6 * d, 13 * d);
}

// ---------- el tiempo ----------
const ct = $('tiempo'), gt = ct.getContext('2d');
function tiempo() {
  const { W, H, d } = medir(ct); gt.clearRect(0, 0, W, H);
  const n = 600, linea = (f, col) => { gt.strokeStyle = col; gt.lineWidth = 1.4 * d; gt.beginPath(); historia.forEach((p, i) => { const x = W - (historia.length - i) / n * W, yv = H - 8 * d - f(p) * (H - 24 * d); i ? gt.lineTo(x, yv) : gt.moveTo(x, yv); }); gt.stroke(); };
  linea((p) => Math.max(0, Math.min(1, (Math.log10(p[0] + 1e-9) + 5) / 5.3)), COL.oro);
  linea((p) => Math.max(0, Math.min(1, (p[1] + 80) / 70)), COL.voz);
  gt.font = `${11 * d}px ui-monospace, monospace`; gt.fillStyle = COL.oro; gt.fillText('guardada', 6 * d, 13 * d); gt.fillStyle = COL.voz; gt.fillText('en la sala', 80 * d, 13 * d);
  gt.fillStyle = COL.tenue; gt.textAlign = 'right'; gt.fillText('últimos 20 s', W - 6 * d, 13 * d); gt.textAlign = 'left';
}

function cuadro(t) {
  corredor(t); notas(); tiempo();
  if (estado) {
    $('l-guard').textContent = estado.guardada.toFixed(3);
    $('l-db').textContent = `${estado.db.toFixed(1)} dB`;
    $('l-s').textContent = `${((estado.s - 1) * 100).toFixed(2)} %`;
    $('l-esc').textContent = estado.escucha.mezcla === 0 ? 'sala' : `${(estado.escucha.mezcla * 100).toFixed(0)} % cerca del ${estado.escucha.cantor + 1}`;
    $('grabar').setAttribute('aria-pressed', String(estado.grabando));
  }
  requestAnimationFrame(cuadro);
}
requestAnimationFrame(cuadro);
