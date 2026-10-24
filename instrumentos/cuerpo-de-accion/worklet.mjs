// worklet.mjs — el cuerpo suena aquí. Mide cada 0,1 s qué régimen produjo la acción y graba tomas.
import { Cuerpo, medir, manoEn, comarca } from './motor.mjs';

class ProcesadorCuerpo extends AudioWorkletProcessor {
  constructor() {
    super();
    this.c = new Cuerpo(sampleRate);
    this.cola = []; this.n = 0; this.partitura = null; this.t0 = 0;
    this.ven = Math.round(0.1 * sampleRate); this.vc = new Float64Array(this.ven); this.ov = new Float64Array(this.ven); this.j = 0; this.d0 = 0;
    this.toma = null;
    this.port.onmessage = (e) => this.cola.push(e.data);
  }
  aplicarMano(m) {
    this.c.ponerMano(m);
    if (this.toma) this.toma.puntos.push([this.n - this.toma.desde, { ...this.c.mano }]);
  }
  process(_i, outputs) {
    const c = this.c;
    for (const m of this.cola) {
      if (m.tipo === 'mano') { this.partitura = null; this.aplicarMano(m.mano); }
      else if (m.tipo === 'partitura') { this.partitura = m.partitura; this.t0 = this.n; c.apagar(); }
      else if (m.tipo === 'apagar') { this.partitura = null; c.apagar(); this.aplicarMano({ F: 0, v: 0 }); }
      else if (m.tipo === 'grabar') { c.apagar(); this.toma = { modo: 'escalones', nota: 'toma en vivo', desde: this.n, puntos: [[0, { ...c.mano }]] }; }
      else if (m.tipo === 'parar' && this.toma) { const t = this.toma; this.toma = null; t.puntos.push([this.n - t.desde, { ...c.mano, F: 0, v: 0 }]); this.port.postMessage({ tipo: 'toma', toma: t }); }
    }
    this.cola.length = 0;
    const L = outputs[0][0];
    for (let i = 0; i < L.length; i++) {
      if (this.partitura && (this.n - this.t0) % 32 === 0) {
        const t = (this.n - this.t0) / sampleRate;
        if (t > this.partitura.puntos[this.partitura.puntos.length - 1][0] + 2) this.partitura = null;
        else this.aplicarMano(manoEn(this.partitura, t, sampleRate));
      }
      const o = c.muestra(); L[i] = o; this.n++;
      this.vc[this.j] = c.vContacto; this.ov[this.j] = o;
      if (++this.j === this.ven) {
        this.j = 0;
        const m = medir(this.vc, this.ov, sampleRate, c.P, c.deslizar - this.d0); this.d0 = c.deslizar;
        const com = comarca(c.mano.s).nombre;
        this.port.postMessage({ tipo: 'medida', mano: { ...c.mano }, comarca: com, beta: com === 'cuerda' ? c.beta(c.mano.s) : null, m: { regimen: m.regimen, desl: m.porPeriodo, hz: m.hz, db: 20 * Math.log10(m.rms + 1e-12), centroide: m.centroide, periodicidad: m.periodicidad }, partitura: !!this.partitura, grabando: !!this.toma });
      }
    }
    for (let ch = 1; ch < outputs[0].length; ch++) outputs[0][ch].set(L);
    return true;
  }
}
registerProcessor('cuerpo', ProcesadorCuerpo);
