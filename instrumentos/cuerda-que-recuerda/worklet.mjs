// worklet.mjs — la cuerda suena aquí, fuera del hilo de la página. Las medidas salen del mismo estado.
import { Cuerda } from './motor.mjs';

class ProcesadorCuerda extends AudioWorkletProcessor {
  constructor() {
    super();
    this.s = new Cuerda(sampleRate, { ganancia: 2.2 });
    this.cola = [];
    this.n = 0;
    this.port.onmessage = (e) => this.cola.push(e.data);
  }
  process(_i, outputs) {
    for (const m of this.cola) {
      if (m.tipo === 'params') this.s.ponerParams(m.params);
      else if (m.tipo === 'golpe') this.s.c.golpe(m.golpe);
      else if (m.tipo === 'apagar') { this.s.c.apagar(); this.s.c.t = 0; }
    }
    this.cola.length = 0;
    const out = outputs[0], L = out[0];
    this.s.procesar(L, L.length);
    for (let c = 1; c < out.length; c++) out[c].set(L);
    if (++this.n % 6 === 0) {
      const c = this.s.c, m = c.medidas();
      this.port.postMessage({
        q: Array.from(c.q), v: Array.from(c.v), e: Array.from(m.e.slice(0, 12), (x) => (m.total > 0 ? x / m.total : 0)),
        total: m.total, E: m.E, pares: m.pares, entropia: m.entropia, regreso: m.regresoEnergia, forma: m.forma, desfase: m.desfase1,
        periodos: m.periodos, E0: c.ref ? c.ref.E : null, estallo: !!this.s.p.estallo, limitador: this.s.limitador, t: currentTime,
      });
      this.s.p.estallo = false;
    }
    return true;
  }
}
registerProcessor('cuerda', ProcesadorCuerda);
