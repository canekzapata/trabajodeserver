// tomas.mjs — los puntos de partida: un cuerpo y un golpe. Los usan la página y renderizar.mjs.
export const TOMAS = {
  lineal: { p: { alfa: 0, beta: 0 }, golpe: { tipo: 'modo1', A: 6 }, nota: 'control: sin no linealidad, el modo 1 se queda con todo' },
  beta6: { p: { beta: 1 }, golpe: { tipo: 'modo1', A: 6 }, nota: 'β = 1: la energía sale y vuelve entera' },
  beta8: { p: { beta: 1 }, golpe: { tipo: 'modo1', A: 8 }, nota: 'β = 1, golpe más fuerte: se va más lejos y tarda más en volver' },
  beta12: { p: { beta: 1 }, golpe: { tipo: 'modo1', A: 12, imperfeccion: 1e-8 }, nota: 'β = 1, golpe fuerte con imperfección 1e-8: recuerda unos segundos y después olvida' },
  beta12b: { p: { beta: 1 }, golpe: { tipo: 'modo1', A: 12, imperfeccion: 1e-4 }, nota: 'β = 1, mismo golpe con imperfección 1e-4: olvida antes' },
  alfa4: { p: { alfa: 0.25, beta: 0 }, golpe: { tipo: 'modo1', A: 4 }, nota: 'α = 0,25: con un golpe suave intercambia casi todo y vuelve' },
  centro6: { p: { beta: 1 }, golpe: { tipo: 'local', A: 6, x: 0.5, ancho: 0.15 }, nota: 'β = 1, golpe local en el centro (simétrico): recuerda' },
  local8: { p: { beta: 1 }, golpe: { tipo: 'local', A: 8, x: 0.3 }, nota: 'β = 1, golpe local en 0,3 (asimétrico): no vuelve' },
};
