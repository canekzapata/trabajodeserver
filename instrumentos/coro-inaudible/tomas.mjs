// tomas.mjs — partituras de gestos para el coro. Ninguna escribe notas: el acorde está en la cadena.
// Cada evento: [t (s), gesto]. Los gestos son los mismos que los de la página.
export const PARTITURAS = {
  guardar: { nota: 'Golpe al cantor 1. Silencio. A los 6 s se abre su puerta (30 cm); a los 12 s se cierra.', fin: 16,
    eventos: [[0.2, { golpe: 0 }], [6, { mover: 0, cm: 30 }], [12, { cerrar: true }]] },
  puertas: { nota: 'Golpe a los cantores 1 y 3. Después se abren, una a la vez, las puertas 1, 3 y 2.', fin: 21,
    eventos: [[0.2, { golpe: 0 }], [0.3, { golpe: 2, fase: 1.3 }], [4, { mover: 0, cm: 30 }], [7, { cerrar: true }], [9, { mover: 2, cm: 30 }], [12, { cerrar: true }], [14, { mover: 1, cm: 30 }], [17, { cerrar: true }]] },
  arpegio: { nota: 'Golpe al cantor 1; a los 4 s el coro entero se separa 0,4 %: las guardadas salen en orden de vida.', fin: 16,
    eventos: [[0.2, { golpe: 0 }], [4, { separar: 1.004 }], [12, { cerrar: true }]] },
  espejo: { nota: 'Golpe en espejo (cantores 1 y 6, en contrafase): casi todo queda adentro. A los 5 s se abre el cantor 2.', fin: 13,
    eventos: [[0.2, { espejo: 0 }], [5, { mover: 1, cm: 30 }]] },
  sala: { nota: 'Dos pulsos llegan desde la sala. A los 6 s se abre el cantor 1: no hay nada guardado.', fin: 10,
    eventos: [[0.5, { pulso: 1 }], [3, { pulso: 1 }], [6, { mover: 0, cm: 30 }]] },
  cerca: { nota: 'Golpe al cantor 1. A los 3 s la escucha entra al cantor 3: el acorde guardado. A los 8 s vuelve a la sala.', fin: 10,
    eventos: [[0.2, { golpe: 0 }], [3, { escucha: 1, cantor: 2 }], [8, { escucha: 0 }]] },
};

// aplica un gesto al coro; devuelve cambios de escucha si los hay
export function aplicar(c, g, escucha) {
  if ('golpe' in g) c.golpear(g.golpe, g.amp ?? 1, g.fase ?? 0);
  if ('espejo' in g) { c.golpear(g.espejo, g.amp ?? 1, 0); c.golpear(5 - g.espejo, g.amp ?? 1, Math.PI); }
  if ('mover' in g) c.mover(g.mover, g.cm);
  if ('separar' in g) c.separar(g.separar);
  if (g.cerrar) c.cerrar();
  if ('pulso' in g) c.pulso(g.pulso * 2, 3);
  if ('escucha' in g) { escucha.mezcla = g.escucha; if ('cantor' in g) escucha.cantor = g.cantor; }
}

// la salida: sala y cercanía, con ganancias fijas (sin normalizar entre tomas)
export const GANANCIA = { sala: 0.3, cerca: 0.5 };
export function mezclar(o, escucha) {
  const c = GANANCIA.cerca * o.cerca * escucha.mezcla, s = GANANCIA.sala * (1 - escucha.mezcla);
  return [s * o.izq + c, s * o.der + c];
}
