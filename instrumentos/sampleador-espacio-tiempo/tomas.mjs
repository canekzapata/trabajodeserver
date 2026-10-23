// tomas.mjs — una misma partitura de gestos leída de varias maneras. La usan la página y renderizar.mjs.
// Gestos: [segundos, acción]. Acciones: nota (f en Hz, o 0 para soltar), pulsar, golpear, params, cristalizar.
const LA2 = 110, DO3 = 130.81, RE3 = 146.83, MI3 = 164.81, SOL3 = 196;
const melodia = [[0.2, LA2], [1.7, DO3], [3.2, MI3], [4.7, RE3], [6.2, DO3], [7.7, LA2], [9.2, SOL3], [10.7, MI3]];
export const GESTOS = [
  [0, { pulsar: { x: 0.3, A: 0.4 } }],
  [5.4, { golpear: { x: 0.72, A: 2.2 } }],
  ...melodia.flatMap(([t, f]) => [[t, { nota: f }], [t + 1.3, { nota: 0 }]]),
];
export const DUR = 12.6;
export const TOMAS = {
  presente: { p: { tau0: 0, beta: 0 }, nota: 'el cabezal lee el presente: el timbre sigue a la cuerda' },
  pasado: { p: { tau0: 1.5, beta: 0 }, nota: 'el cabezal lee la cuerda de hace 1,5 s: el golpe de 5,4 s se oye a los 6,9 s' },
  oblicuo: { p: { tau0: 0.8, beta: 0.9 }, nota: 'corte oblicuo β = 0,9: el extremo derecho se lee 0,56 s más atrás que el izquierdo' },
  memoria: { p: { tau0: 0, g: 6, alfa: 0.4 }, nota: 'cuerda viscoelástica (Volterra, α = 0,4, g = 6): la forma recuerda y se suaviza' },
  kirchhoff: { p: { tau0: 0, kappa: 1.5 }, nota: 'Kirchhoff κ = 1,5: estirada, la cuerda se mueve más rápido' },
  estrato: { p: { tau0: 0 }, extra: [[3.0, { cristalizar: true }], [6.0, { params: { mezcla: 0.5 } }], [7.0, { params: { mezcla: 1 } }]], nota: 'a los 3 s se cristaliza la forma; desde los 6 s el cabezal lee ese estrato' },
};
