// bucle.mjs — una frase que debe negociar las condiciones de su propio regreso.
// Modelo clásico y discreto, inspirado en los problemas de consistencia con curvas temporales
// cerradas (Novikov y otros, 1990). No es ese principio ni el modelo cuántico de Deutsch (1991).
//
// El tiempo es un ciclo de L pasos. Una nota es (t, p): paso y altura MIDI entera.
// El regreso R manda cada nota d pasos al pasado y la transpone n semitonos dentro de su octava:
//     R(t, p) = (t − d mod L, 12·⌊p/12⌋ + (p + n) mod 12)
// Una historia H es consistente si R(H) = H: cada nota es el regreso de otra.
// La historia mínima que contiene una frase es la unión de sus órbitas; siempre existe.
// Las restricciones (voces por paso, choques) pueden hacerla imposible: entonces la frase negocia.

export const VERSION = 'bucle-0.1.0';

const mod = (a, m) => ((a % m) + m) % m;
export const clave = (t, p) => t * 256 + p;
export const desclave = (k) => [Math.floor(k / 256), k % 256];

export function regreso(nota, { L, d, n }) {
  const [t, p] = nota;
  return [mod(t - d, L), 12 * Math.floor(p / 12) + mod(p + n, 12)];
}

// órbita de una nota bajo R: una curva cerrada en el toro Z_L × Z_12
export function orbita(nota, cfg) {
  const vista = new Set(), out = [];
  let x = nota;
  while (!vista.has(clave(...x))) { vista.add(clave(...x)); out.push(x); x = regreso(x, cfg); }
  return out;
}

export function clausura(frase, cfg) {
  const H = new Map();
  for (const nota of frase) for (const x of orbita(nota, cfg)) H.set(clave(...x), x);
  return [...H.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

export function esConsistente(H, cfg) {
  const s = new Set(H.map((x) => clave(...x)));
  return H.every((x) => s.has(clave(...regreso(x, cfg)))) && s.size === new Set(H.map((x) => clave(...regreso(x, cfg)))).size;
}

// ── restricciones: monótonas (añadir notas nunca repara una violación) ──
// maxVoces: notas distintas por paso. choques: clases de intervalo prohibidas en un mismo paso.
function viola(ocup, pasos, r) {
  for (const t of pasos) {
    const ps = [...ocup[t].keys()];
    if (r.maxVoces && ps.length > r.maxVoces) return true;
    if (r.choques && r.choques.length) {
      for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) {
        const ic = Math.min(mod(ps[i] - ps[j], 12), mod(ps[j] - ps[i], 12));
        if (r.choques.includes(ic)) return true;
      }
    }
  }
  return false;
}

// ── opciones de cada nota, en orden declarado ──
// prioridad 'ataques': conserva los pasos y mueve alturas; 'alturas': conserva alturas y mueve pasos;
// 'mixto': ambas cuestan lo mismo. callar: quitar la nota, con su costo (Infinity = prohibido).
export function opciones(nota, { L }, neg) {
  const [t, p] = nota;
  const wp = neg.prioridad === 'alturas' ? Infinity : 1;
  const wt = neg.prioridad === 'ataques' ? Infinity : 1;
  const out = [{ nota: [t, p], costo: 0, cambio: 'se queda' }];
  const maxP = neg.maxAltura ?? 3, maxT = neg.maxPaso ?? 2;
  for (let k = 1; k <= Math.max(maxP, maxT); k++) {
    if (k <= maxP && wp < Infinity) {
      out.push({ nota: [t, p + k], costo: wp * k, cambio: `+${k} st` });
      out.push({ nota: [t, p - k], costo: wp * k, cambio: `−${k} st` });
    }
    if (k <= maxT && wt < Infinity) {
      out.push({ nota: [mod(t + k, L), p], costo: wt * k, cambio: `${k} paso${k > 1 ? 's' : ''} después` });
      out.push({ nota: [mod(t - k, L), p], costo: wt * k, cambio: `${k} paso${k > 1 ? 's' : ''} antes` });
    }
  }
  if (Number.isFinite(neg.callar)) out.push({ nota: null, costo: neg.callar, cambio: 'calla' });
  return out.sort((a, b) => a.costo - b.costo);
}

// ── negociar: ramificación y poda, exhaustiva salvo que se agote el presupuesto ──
// Devuelve el estado con una de tres respuestas:
//   'optima'     búsqueda completa; costo mínimo y cuántas soluciones empatan
//   'presupuesto' se agotó el presupuesto: hay una mejor encontrada o ninguna, sin concluir nada
//   'ninguna'    búsqueda completa sin solución: las restricciones son incompatibles con la frase
export function negociar(frase, cfg, restr = {}, neg = {}) {
  const N = frase.length, presupuesto = neg.presupuesto ?? 300000;
  const ops = frase.map((n) => opciones(n, cfg, { prioridad: 'mixto', callar: Infinity, ...neg }));
  const orbs = ops.map((lista) => lista.map((o) => (o.nota ? orbita(o.nota, cfg) : [])));
  const ocup = Array.from({ length: cfg.L }, () => new Map());
  const poner = (orb, s) => {
    const pasos = new Set();
    for (const [t, p] of orb) { const m = ocup[t]; const v = (m.get(p) || 0) + s; if (v) m.set(p, v); else m.delete(p); pasos.add(t); }
    return pasos;
  };
  let mejor = Infinity, eleccion = null, empates = 0, nodos = 0, agotado = false;
  const actual = new Array(N);
  (function bajar(i, costo) {
    if (agotado) return;
    if (++nodos > presupuesto) { agotado = true; return; }
    if (i === N) {
      if (costo < mejor) { mejor = costo; eleccion = actual.slice(); empates = 1; }
      else if (costo === mejor) empates++;
      return;
    }
    for (let j = 0; j < ops[i].length; j++) {
      const c = costo + ops[i][j].costo;
      if (c > mejor) break; // las opciones están ordenadas por costo
      actual[i] = j;
      const pasos = poner(orbs[i][j], +1);
      if (!viola(ocup, pasos, restr)) bajar(i + 1, c);
      poner(orbs[i][j], -1);
      if (agotado) return;
    }
  })(0, 0);

  const estado = agotado ? 'presupuesto' : eleccion ? 'optima' : 'ninguna';
  if (!eleccion) return { estado, nodos, frase, empates: agotado ? null : 0 };
  const elegida = eleccion.map((j, i) => ({ original: frase[i], ...ops[i][j] }));
  const tocada = elegida.filter((e) => e.nota).map((e) => e.nota);
  const H = clausura(tocada, cfg);
  return { estado, nodos, costo: mejor, empates: agotado ? null : empates, elegida, tocada, H, frase };
}

// ── otro modelo, separado: regreso con pérdida en tiempo lineal ──
// x = R_g(u + x), con R_g = adelanto de Δ s, transposición n y ganancia g < 1 (contractiva).
// Solución única: x = Σ_{k≥1} R_g^k(u). Sin entrada (u = ∅) la única solución es el silencio.
// Se trunca cuando la amplitud baja de umbral; el truncado se declara.
export function ecoConsistente(u, { delta, n, g, umbral = 1e-3 }) {
  if (!(g > 0 && g < 1)) throw new Error('el regreso con pérdida exige 0 < g < 1');
  const x = [];
  for (const e of u) {
    let a = e.a * g, k = 1;
    while (a >= umbral) { x.push({ t: e.t - k * delta, p: e.p + k * n, a, k, de: e }); a *= g; k++; }
  }
  return x.sort((a, b) => a.t - b.t);
}

// conjuntos de clases de altura invariantes bajo T_n (para la tabla de simetrías)
export function invariantes(n) {
  const out = [];
  for (let s = 0; s < 4096; s++) {
    let r = 0;
    for (let i = 0; i < 12; i++) if (s & (1 << i)) r |= 1 << mod(i + n, 12);
    if (r === s) out.push(s);
  }
  return out;
}
