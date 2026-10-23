// motor.mjs — el trompo: un disco con inercia y rozamiento que lleva un patrón escrito.
// Física y sonido puros: sin DOM ni Web Audio. Lo usan el AudioWorklet (worklet.mjs),
// el renderizador de Node (renderizar.mjs) y las pruebas (pruebas.mjs).
//
// Unidades: θ en vueltas, ω en vueltas/s, torques en vueltas/s² por unidad de inercia.
// El patrón nunca se borra ni se promedia: el giro sólo cambia cómo se lee.

export const VERSION = 'trompo-0.1.0';
export const BLOQUE = 128; // muestras por bloque, igual que el AudioWorklet

// ── azar sembrado (xfnv1a + mulberry32, como en poesiasexp) ──
export function hashSemilla(v) {
  const s = String(v);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 16; h = Math.imul(h, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16;
  return h >>> 0;
}
export function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── patrones ──
// Cada evento vive en una fase del disco (0–1) y tiene su propia voz.
// tipo 'clic': impulso brevísimo; tipo 'tono': barra golpeada de tres modos.
// dur: caída del modo principal en segundos (constante de tiempo).
const ESCALA = [196, 220, 261.63, 293.66, 329.63, 392, 440, 523.25];
export const PATRONES = {
  'ocho-iguales': () => Array.from({ length: 8 }, (_, k) => ({ fase: k / 8, tipo: 'clic', nota: 2400, dur: 0.003 })),
  'ocho-colores': () => Array.from({ length: 8 }, (_, k) => ({ fase: k / 8, tipo: 'tono', nota: ESCALA[(k * 3) % 8], dur: 0.35 })),
  'ritmo': () => [0, 3, 6, 8, 11, 14].map((p, k) => ({ fase: p / 16, tipo: k % 3 === 0 ? 'tono' : 'clic', nota: k % 3 === 0 ? [110, 165, 147.83][k / 3 | 0] || 110 : 1800 + 400 * k, dur: k % 3 === 0 ? 0.6 : 0.004 })),
  'un-golpe': () => [{ fase: 0, tipo: 'tono', nota: 220, dur: 0.5 }],
};

const RAZONES_TONO = [1, 2.756, 5.404]; // barra libre, primeros tres modos
const AMPS_TONO = [1, 0.45, 0.2];
const RAZONES_CLIC = [1, 2.13];
const AMPS_CLIC = [1, 0.6];

export const PARAMS_INICIALES = {
  modo: 'impulsos',      // 'impulsos' | 'ausente'
  peso: 1,               // inercia
  viscoso: 0.08,         // rozamiento viscoso del eje, 1/s
  seco: 0.05,            // rozamiento seco del eje, vueltas/s²
  manoMax: 14,           // torque máximo de la mano a presión 1, vueltas/s²
  manoAcople: 40,        // qué tan rápido la mano iguala su velocidad, 1/s
  empujeMax: 8,          // torque de teclado, vueltas/s²
  barajar: false,        // condición de control: voces permutadas en cada vuelta
  semilla: 'trompo',
  dientes: 20,           // modo ausente: ciclos de la pista por vuelta
  armonicos: [2, 3, 4, 5],
  ganancia: 0.5,
};

export class Trompo {
  constructor(sr, params = {}, patron = PATRONES['ocho-colores']()) {
    this.sr = sr; this.dt = 1 / sr;
    this.p = { ...PARAMS_INICIALES, ...params };
    this.theta = 0; this.omega = 0;
    this.entrada = { mano: false, wMano: 0, presion: 0, empuje: 0 };
    this.wManoSuave = 0;
    this.dc = { x: 0, y: 0, a: Math.exp(-2 * Math.PI * 5 / sr) };
    this.contador = { eventos: 0, limitador: 0, muestras: 0 };
    this.vueltaBarajada = null; this.mapa = null;
    this.ponerPatron(patron);
  }

  ponerPatron(patron) {
    this.patron = patron.map((e) => ({ ...e, fase: ((e.fase % 1) + 1) % 1 })).sort((a, b) => a.fase - b.fase);
    // cada evento tiene su resonador; si un patrón nuevo trae el mismo número de eventos
    // se conserva la vibración en curso
    const viejos = this.voces || [];
    this.voces = this.patron.map((e, k) => {
      const tono = e.tipo === 'tono';
      const raz = tono ? RAZONES_TONO : RAZONES_CLIC, amp = tono ? AMPS_TONO : AMPS_CLIC;
      return raz.map((r, m) => {
        const f = Math.min(e.nota * r, this.sr * 0.45);
        const tau = e.dur / Math.sqrt(r);
        const g = Math.exp(-this.dt / tau), w = 2 * Math.PI * f * this.dt;
        const prev = viejos[k] && viejos[k][m];
        return { cr: g * Math.cos(w), ci: g * Math.sin(w), a: amp[m], re: prev ? prev.re : 0, im: prev ? prev.im : 0 };
      });
    });
    this.vueltaBarajada = null;
  }

  // estado completo, para que una toma se pueda recalcular desde su primera muestra
  instantanea() {
    return {
      theta: this.theta, omega: this.omega, wManoSuave: this.wManoSuave,
      dc: { x: this.dc.x, y: this.dc.y }, entrada: { ...this.entrada }, params: { ...this.p },
      patron: this.patron.map((e) => ({ ...e })),
      voces: this.voces.map((v) => v.map((m) => [m.re, m.im])),
    };
  }
  static desde(sr, s) {
    const t = new Trompo(sr, s.params, s.patron);
    t.theta = s.theta; t.omega = s.omega; t.wManoSuave = s.wManoSuave;
    t.dc.x = s.dc.x; t.dc.y = s.dc.y; t.entrada = { ...s.entrada };
    s.voces.forEach((v, k) => v.forEach(([re, im], m) => { t.voces[k][m].re = re; t.voces[k][m].im = im; }));
    return t;
  }

  ponerParams(cambios) { Object.assign(this.p, cambios); this.vueltaBarajada = null; }
  ponerEntrada(e) { Object.assign(this.entrada, e); }

  // voz que suena en la posición k durante la vuelta n (sólo cambia si barajar está activo)
  voz(k, n) {
    if (!this.p.barajar) return k;
    if (this.vueltaBarajada !== n) {
      const r = mulberry32(hashSemilla(this.p.semilla + ':' + n));
      const m = this.patron.map((_, i) => i);
      for (let i = m.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [m[i], m[j]] = [m[j], m[i]]; }
      this.mapa = m; this.vueltaBarajada = n;
    }
    return this.mapa[k];
  }

  // un paso de física: semi-implícito, con rozamiento seco que nunca invierte el giro
  paso() {
    const p = this.p, e = this.entrada, dt = this.dt;
    this.wManoSuave += (e.wMano - this.wManoSuave) * (1 - Math.exp(-dt / 0.01));
    let tau = e.empuje - p.viscoso * this.omega;
    if (e.mano) {
      const max = p.manoMax * e.presion;
      tau += Math.max(-max, Math.min(max, p.manoAcople * (this.wManoSuave - this.omega)));
    }
    let w = this.omega + (tau / p.peso) * dt;
    const df = (p.seco / p.peso) * dt;
    if (w > df) w -= df; else if (w < -df) w += df; else w = 0;
    this.omega = w;
    const t0 = this.theta;
    this.theta += w * dt;
    return t0;
  }

  // genera n muestras mono en out[desde…]
  procesar(out, n, desde = 0) {
    const p = this.p;
    for (let i = 0; i < n; i++) {
      const t0 = this.paso(), t1 = this.theta;
      let x = 0;
      if (p.modo === 'impulsos') {
        if (t1 !== t0) {
          const lo = Math.min(t0, t1), hi = Math.max(t0, t1);
          for (let k = 0; k < this.patron.length; k++) {
            const f = this.patron[k].fase;
            // cruces de la marca k: enteros n con lo < n + f ≤ hi
            let c = Math.floor(hi - f) - Math.floor(lo - f);
            if (c > 4) c = 4; // a velocidades absurdas no se acumulan golpes sin fin
            for (let j = 0; j < c; j++) {
              const vuelta = Math.floor(hi - f) - j;
              const v = this.voces[this.voz(k, vuelta)];
              for (const m of v) m.im += m.a;
              this.contador.eventos++;
            }
          }
        }
        for (const v of this.voces) for (const m of v) {
          const re = m.re * m.cr - m.im * m.ci, im = m.re * m.ci + m.im * m.cr;
          m.re = re; m.im = im; x += im;
        }
        x *= 0.12;
      } else {
        // pista óptica: componentes h·D por vuelta, sin la fundamental D
        const ph = 2 * Math.PI * p.dientes * t1;
        for (const h of p.armonicos) x += Math.sin(h * ph);
        x *= 0.25;
        // y las voces de impulsos se apagan solas
        for (const v of this.voces) for (const m of v) {
          const re = m.re * m.cr - m.im * m.ci, im = m.re * m.ci + m.im * m.cr;
          m.re = re; m.im = im; x += im * 0.12;
        }
      }
      // bloqueo de continua: un disco detenido no suena
      const y = x - this.dc.x + this.dc.a * this.dc.y;
      this.dc.x = x; this.dc.y = y;
      let s = y * p.ganancia;
      if (Math.abs(s) > 0.9) { this.contador.limitador++; s = Math.sign(s) * (0.9 + 0.1 * Math.tanh((Math.abs(s) - 0.9) / 0.1)); }
      out[desde + i] = s;
      this.contador.muestras++;
    }
    // resonancias ya inaudibles a cero: evita números desnormalizados en el hilo de audio
    for (const v of this.voces) for (const m of v) if (Math.abs(m.re) + Math.abs(m.im) < 1e-12) { m.re = 0; m.im = 0; }
    if (Math.abs(this.dc.y) < 1e-15) this.dc.y = 0;
    if (Math.abs(this.omega) < 1e-12) this.omega = 0;
  }

  // tasas declaradas (sección «tres tasas» del README)
  tasas() {
    const r = Math.abs(this.omega);
    return { vueltas: r, eventos: r * this.patron.length, motivo: r, dientes: r * this.p.dientes };
  }

  // color medio de un arco del disco [a, b) en vueltas, en luz lineal (integración de exposición)
  static colorMedio(patron, colores, a, b) {
    if (b < a) [a, b] = [b, a];
    const L = b - a;
    if (L < 1e-9) return colores[sectorEn(patron, a)];
    const acc = [0, 0, 0];
    const vueltas = Math.floor(L);
    if (vueltas > 0) { const m = mediaTotal(patron, colores); for (let c = 0; c < 3; c++) acc[c] += m[c] * vueltas; }
    let x = a + vueltas;
    while (x < b - 1e-12) {
      const k = sectorEn(patron, x);
      const f = ((x % 1) + 1) % 1;
      let finFase;
      if (k + 1 < patron.length) finFase = patron[k + 1].fase;
      else finFase = f < patron[0].fase ? patron[0].fase : patron[0].fase + 1;
      const y = Math.min(Math.max(x - f + finFase, x + 1e-9), b);
      for (let c = 0; c < 3; c++) acc[c] += colores[k][c] * (y - x);
      x = y;
    }
    return acc.map((v) => v / L);
  }
}

// sector k: desde la fase del evento k hasta la del siguiente
export function sectorEn(patron, x) {
  const f = ((x % 1) + 1) % 1;
  let k = patron.length - 1;
  for (let i = 0; i < patron.length; i++) if (patron[i].fase <= f + 1e-12) k = i;
  return k;
}
function mediaTotal(patron, colores) {
  const acc = [0, 0, 0];
  for (let k = 0; k < patron.length; k++) {
    const largo = (k + 1 < patron.length ? patron[k + 1].fase : patron[0].fase + 1) - patron[k].fase;
    for (let c = 0; c < 3; c++) acc[c] += colores[k][c] * largo;
  }
  return acc;
}
