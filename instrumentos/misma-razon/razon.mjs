// razon.mjs — La misma razón: cada voz pulsa f/K veces por segundo.
// La ley es una regla del instrumento, no un hecho físico. Antecedentes: el Rhythmicon de
// Cowell y Theremin (1931) y, en Rejilla, el loop 01 y «El tiempo es la altura».
// Lo propio de este instrumento: la fase se hereda entre acordes, así que cambiar una altura
// cambia cuándo esa voz podrá encontrarse con las demás. Encontrarse cuesta cents o tiempo.

export const VERSION = 'misma-razon-0.1.0';

// ── partitura ──
// secciones: [{ nombre, dur (s), voces: [razón respecto de la referencia] }]
// estado de cada voz: fase en pulsos. Un ataque ocurre cuando la fase alcanza un entero.
// fases: 'heredar' (por omisión) | 'reiniciar' (todas a 0 al empezar cada sección: llegada programada)
// afinacion[s][v]: factor c que multiplica la frecuencia de la voz v en la sección s (1 = justa)

export function frecuencias(partitura) {
  const { ref, secciones } = partitura;
  return secciones.map((s, i) => s.voces.map((r, v) => ref * r * ((partitura.afinacion && partitura.afinacion[i] && partitura.afinacion[i][v]) || 1)));
}

export function inicios(partitura) {
  const t = [0];
  for (const s of partitura.secciones) t.push(t[t.length - 1] + s.dur);
  return t;
}

// ataques exactos: la fase es lineal por tramos, así que cada ataque se resuelve en forma cerrada
export function ataques(partitura) {
  const { K, secciones } = partitura;
  const F = frecuencias(partitura), T = inicios(partitura);
  const nv = secciones[0].voces.length;
  const fase = new Array(nv).fill(0);
  const out = []; // { v, t, s, n }
  const cuenta = new Array(nv).fill(0);
  for (let v = 0; v < nv; v++) { out.push({ v, t: 0, s: 0, n: 0 }); }
  const fasesInicio = [];
  for (let s = 0; s < secciones.length; s++) {
    if (partitura.fases === 'reiniciar' && s > 0) {
      for (let v = 0; v < nv; v++) { fase[v] = 0; out.push({ v, t: T[s], s, n: ++cuenta[v] }); }
    }
    fasesInicio.push(fase.slice());
    for (let v = 0; v < nv; v++) {
      const r = F[s][v] / K;
      // siguiente entero estrictamente mayor que la fase actual
      let N = Math.floor(fase[v] + 1e-12) + 1;
      for (;;) {
        const t = T[s] + (N - fase[v]) / r;
        if (t >= T[s + 1] - 1e-12) break;
        out.push({ v, t, s, n: ++cuenta[v] });
        N++;
      }
      fase[v] += r * secciones[s].dur;
      // un ataque exactamente en la frontera pertenece a la sección siguiente
      if (Math.abs(fase[v] - Math.round(fase[v])) < 1e-9) {
        fase[v] = Math.round(fase[v]);
        if (s + 1 < secciones.length && partitura.fases !== 'reiniciar') out.push({ v, t: T[s + 1], s: s + 1, n: ++cuenta[v] });
        else if (s + 1 === secciones.length) out.push({ v, t: T[s + 1], s: s + 1, n: ++cuenta[v] });
      }
    }
  }
  fasesInicio.push(fase.slice());
  out.sort((a, b) => a.t - b.t || a.v - b.v);
  return { ataques: out, fasesInicio, T, F };
}

// encuentros: ataques de voces distintas dentro de una tolerancia τ (decisión declarada, no umbral perceptivo)
export function encuentros(lista, nv, tau = 0.025) {
  const out = [];
  let i = 0;
  while (i < lista.length) {
    let j = i + 1;
    while (j < lista.length && lista[j].t - lista[i].t <= tau) j++;
    const voces = [...new Set(lista.slice(i, j).map((a) => a.v))].sort();
    if (voces.length >= 2) out.push({ t: lista[i].t, voces, total: voces.length === nv });
    i = j;
  }
  return out;
}

// primera coincidencia total posterior a 0, para voces de frecuencias fijas que empiezan alineadas.
// Con razones racionales, es el mínimo común múltiplo de los periodos.
export function recurrencia(frecs, K) {
  // frecs: fracciones exactas [num, den] de una unidad de frecuencia u; devuelve el tiempo en unidades de 1/u
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  // periodo de cada voz: K·den/num (con u = 1), como fracción reducida
  const per = frecs.map(([num, den]) => { const g = gcd(den, num); return [den / g, num / g]; });
  // mcm de fracciones reducidas = mcm de numeradores / mcd de denominadores
  let [a, b] = per[0];
  for (const [c, d] of per.slice(1)) { a = (a * c) / gcd(a, c); b = gcd(b, d); }
  return (a / b) * K;
}

// ── llegar: dos maneras de que un grupo de voces ataque junto en un instante ──

// DESAFINAR: entre el inicio de la sección desde y el instante T, cada voz del grupo multiplica su
// frecuencia por c para que su fase llegue a un entero exactamente en T. Escoge el entero más cercano:
// la pérdida es |1200·log₂ c| cents. Cuanto más lejos empieza la preparación, más fina la elección.
export function desafinarPara(partitura, { T, desde, voces }) {
  const { K } = partitura;
  const base = { ...partitura, afinacion: undefined };
  const { fasesInicio, F } = ataques(base);
  const Ti = inicios(base);
  const afin = partitura.secciones.map((s) => s.voces.map(() => 1));
  const informe = [];
  for (const v of voces) {
    let A = 0; // pulsos que la voz daría, afinada justa, desde el inicio de «desde» hasta T
    for (let s = desde; s < partitura.secciones.length && Ti[s] < T; s++) A += (F[s][v] / K) * (Math.min(T, Ti[s + 1]) - Ti[s]);
    const f0 = fasesInicio[desde][v];
    const N = Math.max(Math.floor(f0 + 1e-12) + 1, Math.round(f0 + A));
    const c = (N - f0) / A;
    for (let s = desde; s < partitura.secciones.length && Ti[s] < T; s++) afin[s][v] = c;
    informe.push({ v, pulsos: N - f0, c, cents: 1200 * Math.log2(c), separacion: 1200 * Math.log2((Math.round(A) + 1) / Math.max(1, Math.round(A))) });
  }
  return { partitura: { ...partitura, afinacion: afin }, informe };
}

// ESPERAR: conservar la afinación y alargar la sección s hasta el primer instante en que todas las
// voces del grupo ataquen dentro de τ. La pérdida es la demora; puede no llegar dentro de maxEspera.
export function esperarPara(partitura, { seccion, voces, tau = 0.025, maxEspera = 60 }) {
  // Las tasas del grupo son racionales (razones justas), así que el patrón de ataques se repite con
  // periodo P = recurrencia del grupo. Si no hay encuentro en P (más τ), no lo habrá nunca.
  const fr = voces.map((v) => fraccion(partitura.secciones[seccion].voces[v] * partitura.ref / partitura.K));
  const P = recurrencia(fr, 1);
  const ventana = Math.min(maxEspera, P + tau);
  const base = { ...partitura, secciones: partitura.secciones.map((s, i) => (i === seccion ? { ...s, dur: s.dur + ventana + 1 } : s)) };
  const { ataques: A } = ataques(base);
  const Ti = inicios(partitura);
  const desdeT = Ti[seccion + 1];
  const grupo = A.filter((a) => voces.includes(a.v) && a.s === seccion && a.t >= desdeT - 1e-9 && a.t <= desdeT + ventana);
  for (let i = 0; i < grupo.length; i++) {
    const vent = grupo.filter((b) => b.t >= grupo[i].t && b.t - grupo[i].t <= tau);
    if (new Set(vent.map((b) => b.v)).size === voces.length) {
      const fin = Math.max(...vent.map((b) => b.t));
      const demora = fin - desdeT;
      const secciones = partitura.secciones.map((s, k) => (k === seccion ? { ...s, dur: s.dur + demora } : s));
      return { partitura: { ...partitura, secciones }, demora, dispersion: fin - grupo[i].t, estado: 'llega', periodo: P };
    }
  }
  return { partitura, demora: null, estado: ventana >= P + tau ? 'nunca' : 'no dentro de la espera', periodo: P };
}

// fracción con denominador pequeño (las razones justas de la partitura)
export function fraccion(x, maxDen = 10000) {
  let [h0, h1, k0, k1] = [0, 1, 1, 0], y = x;
  for (let i = 0; i < 30; i++) {
    const a = Math.floor(y);
    [h0, h1] = [h1, a * h1 + h0]; [k0, k1] = [k1, a * k1 + k0];
    if (k1 > maxDen) { h1 = h0; k1 = k0; break; }
    if (Math.abs(x - h1 / k1) < 1e-12) break;
    y = 1 / (y - a);
  }
  return [h1, k1];
}
