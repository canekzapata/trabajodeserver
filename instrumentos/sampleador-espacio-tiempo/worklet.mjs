// worklet.mjs — el sampleador suena aquí; la página recibe la forma de la cuerda y el corte que se lee.
import { Sampleador } from './motor.mjs';

class ProcesadorSampleador extends AudioWorkletProcessor {
  constructor() {
    super();
    this.s = new Sampleador(sampleRate);
    this.cola = []; this.n = 0;
    this.port.onmessage = (e) => this.cola.push(e.data);
  }
  process(_i, outputs) {
    const s = this.s;
    for (const m of this.cola) {
      if (m.tipo === 'params') s.ponerParams(m.params);
      else if (m.tipo === 'nota') { if (m.f) s.p.f = m.f; s.gate = m.gate ? 1 : 0; }
      else if (m.tipo === 'pulsar') s.h.pulsar(m.x, m.A);
      else if (m.tipo === 'golpear') s.h.golpear(m.x, m.A);
      else if (m.tipo === 'mano') { s.h.mano = m.mano; s.h.fuerzas(); }
      else if (m.tipo === 'cristalizar') s.cristalizar();
      else if (m.tipo === 'estrato') s.estrato = Math.min(m.i, s.estratos.length - 1);
      else if (m.tipo === 'apagar') { s.h.u.fill(0); s.h.v.fill(0); s.h.z.forEach((z) => z.fill(0)); s.h.fuerzas(); }
    }
    this.cola.length = 0;
    const out = outputs[0], L = out[0];
    s.procesar(L, L.length);
    for (let c = 1; c < out.length; c++) out[c].set(L);
    if (++this.n % 12 === 0) {
      const h = s.h, e = h.energia();
      this.port.postMessage({
        u: Array.from({ length: 32 }, (_, k) => h.u[2 * k + 1]),
        corte: Array.from({ length: 64 }, (_, k) => s.muestra((k + 0.5) / 64)),
        energia: e, c: Math.sqrt(h.c2()), t: h.t, estratos: s.estratos.length, estrato: s.estrato,
        env: s.env, f: s.p.f,
      });
    }
    return true;
  }
}
registerProcessor('sampleador', ProcesadorSampleador);
