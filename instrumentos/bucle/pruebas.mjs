// pruebas.mjs — pruebas que pueden fallar.  node pruebas.mjs
import { regreso, orbita, clausura, esConsistente, negociar, opciones, ecoConsistente, invariantes, clave } from './bucle.mjs';

let fallas = 0;
const ok = (c, nombre, det = '') => { console.log(`${c ? 'ok   ' : 'FALLA'}  ${nombre}${det ? '  · ' + det : ''}`); if (!c) fallas++; };
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const NOMBRES = ['do', 'do♯', 're', 'mi♭', 'mi', 'fa', 'fa♯', 'sol', 'sol♯', 'la', 'si♭', 'si'];
const nombres = (s) => NOMBRES.filter((_, i) => s & (1 << i)).join('–');

// 1. Simetrías de conjuntos de clases de altura (la tabla de Canek, sobre los 4096 conjuntos)
{
  const casos = [[3, 8, 'do–mi♭–fa♯–la'], [4, 16, 'do–mi–sol♯'], [2, 4, 'do–re–mi–fa♯–sol♯–si♭'], [7, 2, null]];
  for (const [n, cuantos, minima] of casos) {
    const inv = invariantes(n);
    const conDo = inv.filter((s) => s & 1).sort((a, b) => a.toString(2).split('1').length - b.toString(2).split('1').length)[0];
    ok(inv.length === cuantos && (minima ? nombres(conDo) === minima : inv.length === 2 && inv.includes(0) && inv.includes(4095)),
      `T${n}: ${inv.length} conjuntos invariantes`, minima ? `órbita mínima con do: ${nombres(conDo)}` : 'sólo vacío y total cromático');
  }
}

// 2. Órbitas: curvas cerradas de tamaño mcm(L/mcd(d,L), 12/mcd(n,12))
{
  let bien = true;
  for (const L of [8, 12, 16]) for (let d = 1; d < L; d++) for (let n = 0; n < 12; n++) {
    const o = orbita([0, 60], { L, d, n });
    if (o.length !== lcm(L / gcd(d, L), 12 / gcd(n, 12))) bien = false;
  }
  ok(bien, 'tamaño de órbita = mcm(L/mcd(d,L), 12/mcd(n,12)) en todos los casos');
}

// 3. La clausura es consistente, contiene la frase, y cada nota es el regreso de otra
{
  const cfg = { L: 16, d: 3, n: 5 };
  const frase = [[0, 60], [3, 64], [7, 67], [10, 62]];
  const H = clausura(frase, cfg);
  const s = new Set(H.map((x) => clave(...x)));
  const deOtra = H.every((x) => H.some((y) => clave(...regreso(y, cfg)) === clave(...x)));
  ok(esConsistente(H, cfg) && frase.every((x) => s.has(clave(...x))) && deOtra, 'clausura: consistente, contiene la frase, toda nota es regreso de otra', `${H.length} notas`);
  ok(!esConsistente(frase, cfg), 'la frase sola no es consistente');
}

// 4. Regreso con pérdida: sin entrada, silencio; con entrada, punto fijo con residuo por debajo del umbral
{
  const p = { delta: 0.5, n: 4, g: 0.5, umbral: 1e-4 };
  ok(ecoConsistente([], p).length === 0, 'con pérdida: sin entrada la única solución es el silencio');
  const u = [{ t: 4, p: 60, a: 1 }];
  const x = ecoConsistente(u, p);
  // R_g(u + x) debe dar x, salvo lo que el truncado dejó fuera
  const Rg = [...u, ...x].map((e) => ({ t: e.t - p.delta, p: e.p + p.n, a: e.a * p.g }));
  const masa = (l) => l.reduce((s, e) => s + e.a, 0);
  const residuo = Math.abs(masa(Rg) - masa(x)) / masa(x);
  ok(residuo < 2 * p.umbral, 'con pérdida: x = R_g(u + x) salvo el truncado', `residuo relativo ${residuo.toExponential(2)}`);
  ok(x.every((e) => e.t < 4), 'con pérdida: los regresos preceden a la nota que los causa (adelanto declarado)');
  // el conjunto de clases es invariante bajo T4; las amplitudes no
  const clases = new Set(x.map((e) => e.p % 12)); clases.add(0);
  const amps = [0, 4, 8].map((c) => x.filter((e) => e.p % 12 === c).reduce((s, e) => s + e.a, 0) + (c === 0 ? 1 : 0));
  ok(clases.size === 3 && clases.has(4) && clases.has(8) && new Set(amps.map((a) => a.toFixed(6))).size > 1,
    'con pérdida: do da do–mi–sol♯; el conjunto es invariante, las amplitudes no', amps.map((a) => a.toFixed(3)).join(' / '));
}

// 5. No converger no es no tener solución: x = −(1 + x) tiene x = −½; iterar desde 0 alterna
{
  let x = 0; const vistos = [];
  for (let i = 0; i < 6; i++) { x = -(1 + x); vistos.push(x); }
  ok(vistos.join() === '-1,0,-1,0,-1,0' && -(1 + -0.5) === -0.5, 'x = −(1+x): la iteración alterna 0, −1; la solución −½ existe');
}

// 6. Negociar: la clausura viola las voces; la frase cede lo mínimo y la historia cumple
const CFG = { L: 16, d: 4, n: 4 };
const FRASE = [[0, 60], [2, 62], [3, 63], [6, 67], [8, 61], [12, 65]];
{
  const r = { maxVoces: 4, choques: [1] };
  const sin = clausura(FRASE, CFG);
  const res = negociar(FRASE, CFG, r, { prioridad: 'mixto' });
  const porPaso = Array.from({ length: CFG.L }, (_, t) => res.H.filter((x) => x[0] === t).map((x) => x[1]));
  const cumple = porPaso.every((ps) => ps.length <= 4 && ps.every((a) => ps.every((b) => a === b || Math.min(((a - b) % 12 + 12) % 12, ((b - a) % 12 + 12) % 12) !== 1)));
  ok(res.estado === 'optima' && res.costo > 0 && cumple && esConsistente(res.H, CFG),
    'negociar: óptima, con costo, cumple restricciones y es consistente', `costo ${res.costo}, empates ${res.empates}, ${sin.length} → ${res.H.length} notas, ${res.nodos} nodos`);
}

// 7. Prioridades: 'ataques' conserva pasos; 'alturas' conserva alturas
{
  const r = { maxVoces: 4, choques: [1] };
  const a = negociar(FRASE, CFG, r, { prioridad: 'ataques', callar: 8 });
  const b = negociar(FRASE, CFG, r, { prioridad: 'alturas', callar: 8 });
  ok(a.elegida.every((e) => !e.nota || e.nota[0] === e.original[0]), 'prioridad ataques: ningún paso se movió', a.elegida.map((e) => e.cambio).join(', '));
  ok(b.elegida.every((e) => !e.nota || e.nota[1] === e.original[1]), 'prioridad alturas: ninguna altura se movió', b.elegida.map((e) => e.cambio).join(', '));
}

// 8. Ninguna historia: tres notas por paso con dos voces permitidas y sin poder callar
{
  const res = negociar([[0, 60]], CFG, { maxVoces: 2 }, { prioridad: 'mixto' });
  ok(res.estado === 'ninguna', 'ninguna: búsqueda completa sin solución', `${res.nodos} nodos`);
  const conCallar = negociar([[0, 60], [5, 64]], CFG, { maxVoces: 2 }, { prioridad: 'mixto', callar: 5 });
  ok(conCallar.estado === 'optima' && conCallar.tocada.length === 0, 'con callar permitido: la frase no llega a sonar', `costo ${conCallar.costo}`);
}

// 9. Presupuesto agotado no se confunde con imposibilidad
{
  const res = negociar(FRASE, CFG, { maxVoces: 4, choques: [1] }, { prioridad: 'mixto', presupuesto: 5 });
  ok(res.estado === 'presupuesto' && res.empates === null, 'presupuesto agotado: no concluye ni óptima ni ninguna');
}

// 10. La poda no pierde soluciones: comparación con fuerza bruta en un caso pequeño
{
  const cfg = { L: 8, d: 2, n: 3 };
  const frase = [[0, 60], [1, 61], [4, 64]];
  const r = { maxVoces: 3, choques: [1, 2] };
  const neg = { prioridad: 'mixto', callar: 4, maxAltura: 2, maxPaso: 1 };
  const res = negociar(frase, cfg, r, neg);
  const ops = frase.map((x) => opciones(x, cfg, { prioridad: 'mixto', ...neg }));
  let mejor = Infinity, empates = 0;
  const cumple = (H) => { for (let t = 0; t < cfg.L; t++) { const ps = H.filter((x) => x[0] === t).map((x) => x[1]); if (ps.length > r.maxVoces) return false; for (const a of ps) for (const b of ps) if (a !== b && r.choques.includes(Math.min(((a - b) % 12 + 12) % 12, ((b - a) % 12 + 12) % 12))) return false; } return true; };
  for (const a of ops[0]) for (const b of ops[1]) for (const c of ops[2]) {
    const H = clausura([a, b, c].filter((o) => o.nota).map((o) => o.nota), cfg);
    if (!cumple(H)) continue;
    const k = a.costo + b.costo + c.costo;
    if (k < mejor) { mejor = k; empates = 1; } else if (k === mejor) empates++;
  }
  ok(res.costo === mejor && res.empates === empates, 'poda exacta: mismo costo y empates que la fuerza bruta', `costo ${mejor}, empates ${empates}`);
}

console.log(fallas ? `\n${fallas} prueba(s) fallaron` : '\ntodas las pruebas pasaron');
process.exit(fallas ? 1 : 0);
