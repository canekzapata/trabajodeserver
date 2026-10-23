// worklet.mjs — el trompo suena aquí, fuera del hilo de la página.
// Las entradas se aplican sólo en el borde de un bloque y se anotan con su número:
// la toma se puede volver a calcular muestra por muestra con renderizar.mjs.
import { Trompo, PATRONES, BLOQUE, VERSION } from './motor.mjs';

class ProcesadorTrompo extends AudioWorkletProcessor {
  constructor() {
    super();
    this.t = new Trompo(sampleRate);
    this.bloque = 0;
    this.pendientes = [];
    this.registro = null; // toma en curso
    this.port.onmessage = (ev) => this.pendientes.push(ev.data);
  }

  aplicar(m) {
    const t = this.t;
    if (m.tipo === 'patron' && !m.patron) m = { tipo: 'patron', nombre: m.nombre, patron: PATRONES[m.nombre]() };
    if (m.tipo === 'entrada') t.ponerEntrada(m.entrada);
    else if (m.tipo === 'params') t.ponerParams(m.params);
    else if (m.tipo === 'patron') t.ponerPatron(m.patron || PATRONES[m.nombre]());
    else if (m.tipo === 'grabar') {
      this.registro = {
        version: VERSION, sr: sampleRate, bloque: BLOQUE, desdeBloque: this.bloque,
        inicial: t.instantanea(),
        cambios: [],
      };
      return;
    } else if (m.tipo === 'parar') {
      if (this.registro) {
        this.registro.bloques = this.bloque - this.registro.desdeBloque;
        this.port.postMessage({ tipo: 'toma', toma: this.registro });
        this.registro = null;
      }
      return;
    }
    if (this.registro) this.registro.cambios.push({ b: this.bloque - this.registro.desdeBloque, m });
  }

  process(_in, outputs) {
    for (const m of this.pendientes) this.aplicar(m);
    this.pendientes.length = 0;
    const out = outputs[0];
    const L = out[0];
    this.t.procesar(L, L.length);
    for (let c = 1; c < out.length; c++) out[c].set(L);
    this.bloque++;
    if (this.bloque % 4 === 0) {
      const t = this.t;
      this.port.postMessage({
        tipo: 'estado', theta: t.theta, omega: t.omega, tiempo: currentTime,
        eventos: t.contador.eventos, limitador: t.contador.limitador, grabando: !!this.registro,
      });
    }
    return true;
  }
}
registerProcessor('trompo', ProcesadorTrompo);
