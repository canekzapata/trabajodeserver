// worklet.mjs — el coro suena aquí: dos bocas (izquierda, derecha) y la escucha de cerca.
import { Coro, disenar, fugas, C_AIRE } from './motor.mjs';
import { aplicar, mezclar } from './tomas.mjs';

class ProcesadorCoro extends AudioWorkletProcessor {
  constructor() {
    super();
    this.diseno = disenar(); this.c = new Coro(sampleRate, this.diseno);
    this.esc = { mezcla: 0, cantor: 2 }; this.cola = []; this.partitura = null; this.toma = null;
    this.acc = 0; this.k = 0; this.cada = Math.round(sampleRate / 30);
    this.port.onmessage = (e) => this.cola.push(e.data);
  }
  gesto(g) {
    aplicar(this.c, g, this.esc);
    if (this.toma) this.toma.eventos.push([+((this.c.n - this.toma.desde) / sampleRate).toFixed(4), g]);
  }
  process(_i, outputs) {
    const c = this.c;
    for (const m of this.cola) {
      if (m.tipo === 'gesto') { this.partitura = null; this.gesto(m.g); }
      else if (m.tipo === 'afinar') { const d = disenar(m.diseno); if (d.factible) { this.diseno = d; c.afinar(d); } this.port.postMessage({ tipo: 'diseno', diseno: d }); }
      else if (m.tipo === 'partitura') { c.apagar(); c.cerrar(); this.esc.mezcla = 0; this.partitura = { ev: [...m.partitura.eventos], n0: c.n, fin: m.partitura.fin }; }
      else if (m.tipo === 'apagar') { this.partitura = null; c.apagar(); }
      else if (m.tipo === 'grabar') { c.apagar(); c.cerrar(); this.toma = { nota: 'toma en vivo', diseno: { base: this.diseno.base, armonicos: this.diseno.armonicos, eje: this.diseno.f0 }, desde: c.n, eventos: [[0, { cerrar: true }], [0, { escucha: this.esc.mezcla, cantor: this.esc.cantor }]] }; }
      else if (m.tipo === 'parar' && this.toma) { const t = this.toma; this.toma = null; t.fin = +((c.n - t.desde) / sampleRate + 1).toFixed(2); delete t.desde; this.port.postMessage({ tipo: 'toma', toma: t }); }
    }
    this.cola.length = 0;
    const L = outputs[0][0], R = outputs[0][1] || outputs[0][0];
    for (let i = 0; i < L.length; i++) {
      const p = this.partitura;
      if (p) {
        const t = (c.n - p.n0) / sampleRate;
        while (p.ev.length && p.ev[0][0] <= t) aplicar(c, p.ev.shift()[1], this.esc);
        if (t > p.fin) this.partitura = null;
      }
      const o = c.muestra(this.esc.cantor), [l, r] = mezclar(o, this.esc);
      L[i] = l; R[i] = r; this.acc += (l * l + r * r) / 2;
      if (++this.k === this.cada) {
        const pos = c.posiciones(c.sObj, c.oObj);
        this.port.postMessage({
          tipo: 'estado', re: Array.from(c.re), im: Array.from(c.im), modos: c.enModos(), guardada: c.guardada(),
          db: 10 * Math.log10(this.acc / this.cada + 1e-15), s: c.s, cm: Array.from(c.o, (x) => x * C_AIRE * 100),
          fugas: fugas(c.modos, pos, c.gamma), escucha: { ...this.esc }, partitura: !!this.partitura, grabando: !!this.toma,
        });
        this.k = 0; this.acc = 0;
      }
    }
    return true;
  }
}
registerProcessor('coro', ProcesadorCoro);
