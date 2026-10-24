// escena3d.mjs — el coro inaudible como corredor caminable. WebGL sin bibliotecas.
// La física y el sonido son los de worklet.mjs; aquí solo cambia cómo se ve y cómo se escucha.
// El color de cada columna es la mezcla de las notas que guarda (ámbar 220 → oro 264 → oro pálido 330
// con el acorde por omisión); los anillos azules, la mezcla de las que pueden sonar.
import { disenar, modos as modosDe, N, C_AIRE } from './motor.mjs';
import { PARTITURAS } from './tomas.mjs';

const $ = (id) => document.getElementById(id);
const AUMENTO = 5; // los desplazamientos de puerta se dibujan cinco veces más grandes
const ORO = [[0.86, 0.42, 0.13], [0.96, 0.7, 0.28], [1.0, 0.92, 0.62]];
const AZUL = [[0.3, 0.48, 0.86], [0.5, 0.72, 0.95], [0.75, 0.9, 1.0]];

// ---------- sonido ----------
let ctx = null, nodo = null, preparando = null, estado = null, diseno = disenar(), lista = modosDe(diseno);
async function arrancar() {
  ctx = new AudioContext({ latencyHint: 'interactive' });
  await ctx.audioWorklet.addModule('worklet.mjs');
  nodo = new AudioWorkletNode(ctx, 'coro', { outputChannelCount: [2] });
  nodo.connect(ctx.destination);
  nodo.port.onmessage = (e) => {
    const m = e.data;
    if (m.tipo === 'estado') estado = m;
    else if (m.tipo === 'diseno' && m.diseno.factible) { diseno = m.diseno; lista = modosDe(diseno); }
  };
  $('sonido').setAttribute('aria-pressed', 'true');
}
const listo = async () => { preparando ||= arrancar(); await preparando; if (ctx.state !== 'running') await ctx.resume(); };
const gesto = async (g) => { await listo(); nodo.port.postMessage({ tipo: 'gesto', g }); };
$('sonido').onclick = async () => {
  if (ctx && ctx.state === 'running') { await ctx.suspend(); $('sonido').setAttribute('aria-pressed', 'false'); }
  else await listo();
};
$('cerrar').onclick = () => gesto({ cerrar: true });
$('apagar').onclick = async () => { await listo(); nodo.port.postMessage({ tipo: 'apagar' }); };
for (const [nombre, p] of Object.entries(PARTITURAS)) { const o = document.createElement('option'); o.value = nombre; o.textContent = nombre; $('partitura').appendChild(o); }
$('partitura').onchange = async () => {
  const p = PARTITURAS[$('partitura').value]; $('partitura').value = ''; if (!p) return;
  await listo(); nodo.port.postMessage({ tipo: 'partitura', partitura: p });
};
$('plegar').onclick = () => { const pl = $('panel').classList.toggle('plegado'); $('plegar').textContent = pl ? '+' : '–'; };
if (innerWidth < 600) $('plegar').onclick();

// ---------- WebGL ----------
const cv = $('escena'), gl = cv.getContext('webgl', { antialias: true });
if (!gl) { $('aviso').style.display = 'grid'; throw new Error('sin WebGL'); }

function programa(vs, fs) {
  const p = gl.createProgram();
  for (const [t, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p, s);
  }
  gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const nom = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[nom] = gl.getUniformLocation(p, nom); }
  return { p, u, aP: gl.getAttribLocation(p, 'aP'), aN: gl.getAttribLocation(p, 'aN'), aUV: gl.getAttribLocation(p, 'aUV') };
}

const SOLIDO = programa(`
attribute vec3 aP; attribute vec3 aN; uniform mat4 uVP; uniform mat4 uM; varying vec3 vP; varying vec3 vN;
void main(){ vec4 w = uM * vec4(aP, 1.0); vP = w.xyz; vN = mat3(uM) * aN; gl_Position = uVP * w; }`, `
precision mediump float;
varying vec3 vP; varying vec3 vN;
uniform vec3 uCol; uniform vec3 uEmis; uniform vec3 uCam; uniform vec3 uNiebla; uniform float uRejilla;
uniform vec4 uLuz[8]; uniform vec3 uLuzCol[8];
void main(){
  vec3 n = normalize(vN); vec3 c = uCol * 0.05;
  for (int i = 0; i < 8; i++) {
    vec3 d = uLuz[i].xyz - vP; float r2 = dot(d, d);
    float l = max(dot(n, normalize(d)), 0.0) * 0.75 + 0.25;
    c += uCol * uLuzCol[i] * uLuz[i].w * l / (1.0 + r2 * 0.25);
  }
  if (uRejilla > 0.0) { vec2 g = abs(fract(vP.xz) - 0.5); c += vec3(0.035) * smoothstep(0.47, 0.5, max(g.x, g.y)) * uRejilla; }
  c += uEmis;
  float f = exp(-length(vP - uCam) * 0.022);
  gl_FragColor = vec4(mix(uNiebla, c, f), 1.0);
}`);

const BRILLO = programa(`
attribute vec2 aUV; uniform mat4 uVP; uniform vec3 uC; uniform vec3 uR; uniform vec3 uU; uniform vec2 uTam; varying vec2 vUV;
void main(){ vUV = aUV; vec3 p = uC + uR * aUV.x * uTam.x + uU * aUV.y * uTam.y; gl_Position = uVP * vec4(p, 1.0); }`, `
precision mediump float;
varying vec2 vUV; uniform vec3 uCol; uniform float uA; uniform float uModo; uniform float uRad;
void main(){
  float r = length(vUV), a;
  if (uModo < 0.5) a = exp(-r * r * 4.0); else a = exp(-pow((r - uRad) / 0.045, 2.0));
  a *= uA * (1.0 - smoothstep(0.9, 1.0, r));
  gl_FragColor = vec4(uCol * a, 1.0);
}`);

function malla(datos, conNormal) {
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(datos), gl.STATIC_DRAW);
  return { b, n: datos.length / (conNormal ? 6 : 2), conNormal };
}
// cubo unitario centrado
const CUBO = (() => {
  const d = [], caras = [[[1, 0, 0], [0, 1, 0], [0, 0, 1]], [[-1, 0, 0], [0, 1, 0], [0, 0, -1]], [[0, 1, 0], [0, 0, 1], [1, 0, 0]], [[0, -1, 0], [0, 0, -1], [1, 0, 0]], [[0, 0, 1], [1, 0, 0], [0, 1, 0]], [[0, 0, -1], [-1, 0, 0], [0, 1, 0]]];
  for (const [n, u, v] of caras) {
    const q = (a, b) => [0, 1, 2].map((k) => n[k] * 0.5 + u[k] * a * 0.5 + v[k] * b * 0.5);
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) d.push(...q(a, b), ...n);
  }
  return malla(d, true);
})();
// cilindro de radio 1, de y = 0 a y = 1
const CILINDRO = (() => {
  const d = [], k = 28;
  for (let i = 0; i < k; i++) {
    const a0 = (i / k) * 2 * Math.PI, a1 = ((i + 1) / k) * 2 * Math.PI, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    d.push(c0, 0, s0, c0, 0, s0, c1, 0, s1, c1, 0, s1, c1, 1, s1, c1, 0, s1, c0, 0, s0, c0, 0, s0, c1, 1, s1, c1, 0, s1, c0, 1, s0, c0, 0, s0);
    d.push(0, 1, 0, 0, 1, 0, c1, 1, s1, 0, 1, 0, c0, 1, s0, 0, 1, 0);
  }
  return malla(d, true);
})();
const CUADRO = malla([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1], false);

// ---------- matrices (por columnas) ----------
const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
const perspectiva = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, (2 * f * n) / (n - f), 0]); };
const mirarA = (e, c) => {
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], nor = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
  const cruz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], pto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const z = nor(sub(e, c)), x = nor(cruz([0, 1, 0], z)), y = cruz(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -pto(x, e), -pto(y, e), -pto(z, e), 1]);
};
const modelo = (tx, ty, tz, sx, sy, sz) => new Float32Array([sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, tx, ty, tz, 1]);

// ---------- cámara y cuerpo ----------
const cam = { x: -14, y: 1.6, z: 0.6, yaw: 0, pitch: 0.02 }, meta = { activo: false };
const teclas = new Set();
const sep = () => C_AIRE / diseno.base;
const posX = (j) => { const s = estado ? estado.s : 1, cm = estado ? estado.cm[j] : 0; return s * (j + 0.5) * sep() + (AUMENTO * cm) / 100; };
const largo = () => N * (estado ? estado.s : 1) * sep();
const dir = () => [Math.cos(cam.pitch) * Math.cos(cam.yaw), Math.sin(cam.pitch), Math.cos(cam.pitch) * Math.sin(cam.yaw)];
let VP = null, ancho = 1, alto = 1;
function proyectar(p) {
  const v = [0, 1, 2, 3].map((r) => VP[r] * p[0] + VP[4 + r] * p[1] + VP[8 + r] * p[2] + VP[12 + r]);
  if (v[3] <= 0.05) return null;
  return [(v[0] / v[3] * 0.5 + 0.5) * ancho, (1 - (v[1] / v[3] * 0.5 + 0.5)) * alto, v[3]];
}
function columnaEn(px, py) {
  let mejor = -1, dm = 1e9;
  for (let j = 0; j < N; j++) {
    const a = proyectar([posX(j), 0.3, 0]), b = proyectar([posX(j), 3.0, 0]); if (!a || !b) continue;
    const rx = Math.max(18 * devicePixelRatio, (a[1] - b[1]) * 0.18);
    if (px > a[0] - rx && px < a[0] + rx && py < a[1] && py > b[1] && a[2] < dm) { dm = a[2]; mejor = j; }
  }
  return mejor;
}

let arr = null;
cv.addEventListener('pointerdown', (e) => {
  cv.focus(); cv.setPointerCapture(e.pointerId);
  const d = devicePixelRatio, j = columnaEn(e.offsetX * d, e.offsetY * d);
  if (j >= 0) {
    const a = proyectar([posX(j), 1.6, 0]), b = proyectar([posX(j) + 1, 1.6, 0]);
    const pxPorM = a && b ? (b[0] - a[0]) / d : 40; // con signo: hacia dónde queda +x en pantalla
    arr = { tipo: 'columna', j, x0: e.offsetX, y0: e.offsetY, cm0: estado ? estado.cm[j] : 0, pxPorM: Math.abs(pxPorM) < 4 ? Math.sign(pxPorM || 1) * 4 : pxPorM, movio: false };
  } else arr = { tipo: 'mirar', x: e.offsetX, y: e.offsetY };
});
cv.addEventListener('pointermove', (e) => {
  if (!arr) return;
  if (arr.tipo === 'mirar') {
    cam.yaw += (e.offsetX - arr.x) * 0.005; cam.pitch = Math.max(-1.2, Math.min(1.2, cam.pitch - (e.offsetY - arr.y) * 0.005));
    arr.x = e.offsetX; arr.y = e.offsetY; meta.activo = false;
  } else {
    const dx = e.offsetX - arr.x0; if (Math.abs(dx) > 5) arr.movio = true;
    if (arr.movio) { const cm = Math.max(-60, Math.min(60, arr.cm0 + (dx / arr.pxPorM) * 100 / AUMENTO)); gesto({ mover: arr.j, cm: +cm.toFixed(2) }); }
  }
});
cv.addEventListener('pointerup', () => {
  if (arr && arr.tipo === 'columna' && !arr.movio) $('modo').value === 'espejo' ? gesto({ espejo: arr.j }) : gesto({ golpe: arr.j });
  arr = null;
});
cv.addEventListener('pointercancel', () => { arr = null; });
addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT') return;
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'shift'].includes(k)) { teclas.add(k); meta.activo = false; e.preventDefault(); }
  else if (k >= '1' && k <= '6') $('modo').value === 'espejo' ? gesto({ espejo: +k - 1 }) : gesto({ golpe: +k - 1 });
  else if (k === '0') gesto({ cerrar: true });
});
addEventListener('keyup', (e) => teclas.delete(e.key.toLowerCase()));
for (const [id, k] of [['adelante', 'arrowup'], ['atras', 'arrowdown']]) {
  $(id).addEventListener('pointerdown', () => { teclas.add(k); meta.activo = false; });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) $(id).addEventListener(ev, () => teclas.delete(k));
}
$('a-sala').onclick = () => Object.assign(meta, { activo: true, x: -14, z: 0.6, yaw: 0 });
$('ir').onchange = () => { const j = +$('ir').value - 1; $('ir').value = ''; if (j < 0) return; const lejos = innerWidth < innerHeight ? 3.6 : 2.4; Object.assign(meta, { activo: true, x: posX(j) - lejos, z: 1.0, yaw: Math.atan2(-1.0, lejos) }); };

function mover(dt) {
  const v = (teclas.has('shift') ? 16 : 5) * dt, giro = 1.6 * dt;
  if (teclas.has('arrowleft')) cam.yaw -= giro; if (teclas.has('arrowright')) cam.yaw += giro;
  const f = [Math.cos(cam.yaw), Math.sin(cam.yaw)], l = [Math.sin(cam.yaw), -Math.cos(cam.yaw)];
  let dx = 0, dz = 0;
  if (teclas.has('arrowup') || teclas.has('w')) { dx += f[0]; dz += f[1]; }
  if (teclas.has('arrowdown') || teclas.has('s')) { dx -= f[0]; dz -= f[1]; }
  if (teclas.has('a')) { dx += l[0]; dz += l[1]; } if (teclas.has('d')) { dx -= l[0]; dz -= l[1]; }
  cam.x += dx * v; cam.z += dz * v;
  if (meta.activo) {
    const k = 1 - Math.exp(-dt * 2.5); cam.x += (meta.x - cam.x) * k; cam.z += (meta.z - cam.z) * k;
    let dy = meta.yaw - cam.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); cam.yaw += dy * k; cam.pitch += (0.02 - cam.pitch) * k;
    if (Math.hypot(meta.x - cam.x, meta.z - cam.z) < 0.02) meta.activo = false;
  }
  // dentro del corredor no se atraviesan las paredes
  const L = largo();
  if (cam.x > -0.3 && cam.x < L + 0.3) cam.z = Math.max(-1.75, Math.min(1.75, cam.z));
  else if (Math.abs(cam.z) > 1.75 && cam.x > -0.6 && cam.x < L + 0.6) cam.x = cam.x < L / 2 ? -0.6 : L + 0.6;
  cam.x = Math.max(-60, Math.min(L + 60, cam.x)); cam.z = Math.max(-40, Math.min(40, cam.z));
}

// ---------- la escucha sigue al cuerpo ----------
let escuchaEnviada = { mezcla: -1, cantor: -1 };
function escuchar() {
  let j = 0, dm = 1e9; for (let i = 0; i < N; i++) { const d = Math.hypot(cam.x - posX(i), cam.z); if (d < dm) { dm = d; j = i; } }
  const mezcla = +Math.max(0, Math.min(1, (4.5 - dm) / 3.4)).toFixed(2);
  if (nodo && (Math.abs(mezcla - escuchaEnviada.mezcla) >= 0.02 || (mezcla > 0 && j !== escuchaEnviada.cantor))) {
    escuchaEnviada = { mezcla, cantor: j }; nodo.port.postMessage({ tipo: 'gesto', g: { escucha: mezcla, cantor: j } });
  }
  return { mezcla, j };
}

// ---------- lo que guarda y lo que suena cada columna, nota por nota ----------
function columnas() {
  const out = [];
  for (let j = 0; j < N; j++) out.push({ guarda: 0, suena: 0, cG: [0, 0, 0], cS: [0, 0, 0] });
  if (!estado) return out;
  let io = 0, is = 0;
  lista.forEach(({ v, oscuro }) => {
    let br = 0, bi = 0; for (let l = 0; l < N; l++) { br += v[l] * estado.re[l]; bi += v[l] * estado.im[l]; }
    const col = oscuro ? ORO[Math.min(2, io++)] : AZUL[Math.min(2, is++)];
    for (let j = 0; j < N; j++) {
      const w = (br * br + bi * bi) * v[j] * v[j], c = out[j];
      if (oscuro) { c.guarda += w; for (let k = 0; k < 3; k++) c.cG[k] += w * col[k]; }
      else { c.suena += w; for (let k = 0; k < 3; k++) c.cS[k] += w * col[k]; }
    }
  });
  for (const c of out) { for (let k = 0; k < 3; k++) { c.cG[k] = c.guarda > 1e-12 ? c.cG[k] / c.guarda : ORO[1][k]; c.cS[k] = c.suena > 1e-12 ? c.cS[k] / c.suena : AZUL[1][k]; } }
  return out;
}

// ---------- dibujar ----------
const NIEBLA = [0.03, 0.035, 0.045];
function solido(m, M, col, emis = [0, 0, 0], rejilla = 0) {
  gl.uniformMatrix4fv(SOLIDO.u.uM, false, M); gl.uniform3fv(SOLIDO.u.uCol, col); gl.uniform3fv(SOLIDO.u.uEmis, emis); gl.uniform1f(SOLIDO.u.uRejilla, rejilla);
  gl.bindBuffer(gl.ARRAY_BUFFER, m.b);
  gl.enableVertexAttribArray(SOLIDO.aP); gl.vertexAttribPointer(SOLIDO.aP, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(SOLIDO.aN); gl.vertexAttribPointer(SOLIDO.aN, 3, gl.FLOAT, false, 24, 12);
  gl.drawArrays(gl.TRIANGLES, 0, m.n);
}
function brillo(c, R, U, tam, col, a, modo = 0, rad = 0) {
  if (a < 0.003) return;
  gl.uniform3fv(BRILLO.u.uC, c); gl.uniform3fv(BRILLO.u.uR, R); gl.uniform3fv(BRILLO.u.uU, U); gl.uniform2fv(BRILLO.u.uTam, tam);
  gl.uniform3fv(BRILLO.u.uCol, col); gl.uniform1f(BRILLO.u.uA, a); gl.uniform1f(BRILLO.u.uModo, modo); gl.uniform1f(BRILLO.u.uRad, rad);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

let antes = performance.now();
function cuadro(ahora) {
  const dt = Math.min(0.05, (ahora - antes) / 1000); antes = ahora; const t = ahora / 1000;
  mover(dt); const esc = escuchar();
  const d = devicePixelRatio || 1, w = Math.round(cv.clientWidth * d), h = Math.round(cv.clientHeight * d);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  ancho = w; alto = h; gl.viewport(0, 0, w, h);
  const e = [cam.x, cam.y, cam.z], dv = dir();
  VP = mul(perspectiva(1.05, w / h, 0.05, 400), mirarA(e, [e[0] + dv[0], e[1] + dv[1], e[2] + dv[2]]));
  gl.clearColor(...NIEBLA, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);

  const L = largo(), cols = columnas(), nivel = estado ? Math.max(0, Math.min(1, (estado.db + 70) / 55)) : 0;
  let mezS = [0, 0, 0], sS = 0; for (const c of cols) { for (let k = 0; k < 3; k++) mezS[k] += c.cS[k] * c.suena; sS += c.suena; }
  mezS = sS > 1e-12 ? mezS.map((x) => x / sS) : AZUL[1];

  // luces: seis columnas (lo guardado) y dos bocas (lo que sale)
  const luz = new Float32Array(32), luzCol = new Float32Array(24);
  cols.forEach((c, j) => { luz.set([posX(j), 1.6, 0, Math.min(3, 2.2 * Math.sqrt(c.guarda) + 0.02)], j * 4); luzCol.set(c.cG, j * 3); });
  luz.set([0, 2, 0, 0.15 + 3 * nivel], 24); luzCol.set(mezS, 18);
  luz.set([L, 2, 0, 0.15 + 3 * nivel], 28); luzCol.set(mezS, 21);

  gl.useProgram(SOLIDO.p); gl.disable(gl.BLEND); gl.depthMask(true);
  gl.uniformMatrix4fv(SOLIDO.u.uVP, false, VP); gl.uniform3fv(SOLIDO.u.uCam, e); gl.uniform3fv(SOLIDO.u.uNiebla, NIEBLA);
  gl.uniform4fv(SOLIDO.u.uLuz, luz); gl.uniform3fv(SOLIDO.u.uLuzCol, luzCol);
  solido(CUBO, modelo(L / 2, -0.05, 0, L + 140, 0.1, 90), [0.5, 0.5, 0.52], [0, 0, 0], 1);       // el piso de la sala y del corredor
  for (const z of [-2.1, 2.1]) solido(CUBO, modelo(L / 2, 2, z, L, 4, 0.2), [0.42, 0.4, 0.38]);   // paredes
  solido(CUBO, modelo(L / 2, 4.1, 0, L, 0.2, 4.4), [0.3, 0.3, 0.3]);                               // techo
  for (const x of [0, L]) for (const z of [-2.6, 2.6]) solido(CUBO, modelo(x, 2.1, z, 0.3, 4.2, 1.0), [0.55, 0.52, 0.48]); // marcos de las bocas
  cols.forEach((c, j) => {
    const g = Math.min(1, 1.6 * Math.sqrt(c.guarda));
    solido(CILINDRO, modelo(posX(j), 0, 0, 0.16, 3.2, 0.16), [0.25, 0.25, 0.27], c.cG.map((k) => k * (0.06 + 0.9 * g)));
    solido(CILINDRO, modelo(posX(j), 0, 0, 0.36, 0.08, 0.36), [0.4, 0.4, 0.42]);
  });

  // brillos (aditivos, sin escribir profundidad)
  gl.useProgram(BRILLO.p); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.depthMask(false);
  gl.uniformMatrix4fv(BRILLO.u.uVP, false, VP);
  gl.bindBuffer(gl.ARRAY_BUFFER, CUADRO.b); gl.enableVertexAttribArray(BRILLO.aUV); gl.vertexAttribPointer(BRILLO.aUV, 2, gl.FLOAT, false, 8, 0);
  const R = [-Math.sin(cam.yaw), 0, Math.cos(cam.yaw)];
  cols.forEach((c, j) => {
    const x = posX(j), g = Math.sqrt(c.guarda), s = Math.sqrt(c.suena);
    brillo([x, 1.6, 0], R, [0, 1, 0], [0.55 + 0.9 * g, 1.9], c.cG, Math.min(1.3, 1.5 * g));                  // lo guardado
    for (let a = 0; a < 3; a++) {                                                                            // lo que puede salir
      const fase = (t * 0.45 + a / 3) % 1;
      brillo([x, 0.02, 0], [1, 0, 0], [0, 0, 1], [0.5 + 2.2 * fase, 0.5 + 2.2 * fase], c.cS, Math.min(1, 3 * s) * (1 - fase), 1, 0.9);
    }
    if (estado && Math.abs(estado.cm[j]) > 0.5) brillo([x - (AUMENTO * estado.cm[j]) / 100, 0.02, 0], [1, 0, 0], [0, 0, 1], [0.4, 0.4], [0.8, 0.45, 0.32], 0.8, 1, 0.8); // dónde estaba
  });
  for (const x of [0, L]) brillo([x, 2, 0], [0, 0, 1], [0, 1, 0], [2.2, 2.2], mezS, 0.12 + 1.1 * nivel); // las bocas
  gl.depthMask(true);

  if (estado) {
    $('l-guard').textContent = estado.guardada.toFixed(3);
    $('l-db').textContent = `${estado.db.toFixed(1)} dB`;
  }
  $('l-esc').textContent = esc.mezcla === 0 ? 'sala' : `${Math.round(esc.mezcla * 100)} % junto al ${esc.j + 1}`;
  requestAnimationFrame(cuadro);
}
requestAnimationFrame(cuadro);
