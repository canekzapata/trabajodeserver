// tomas.mjs — partituras de acción: dónde, cuánta fuerza, qué velocidad, con qué. Ninguna nota escrita.
// s: lugar en el cuerpo (anclaje 0–0,12 · cuerda 0,12–0,62 · puente 0,62–0,7 · placa 0,7–0,88 · cavidad 0,88–1)
// En la cuerda, s = 0,62 − 0,5·β (β = distancia al puente).
const S = (beta) => 0.62 - 0.5 * beta;
const P = (t, s, F, v, extra = {}) => [t, { s, F, v, ...extra }];
export const PARTITURAS = {
  isla: {
    nota: 'la nota bella como frontera: entra de golpe a la isla, aprieta hasta romperla y vuelve a bajar',
    puntos: [P(0, S(0.2), 0.8, 0.1), P(3, S(0.2), 0.8, 0.1), P(8, S(0.2), 25, 0.1, { curva: 'exp' }), P(13, S(0.2), 0.8, 0.1, { curva: 'exp' }), P(15, S(0.2), 0.8, 0.1), P(15.2, S(0.2), 0, 0)],
  },
  camino: {
    nota: 'la misma fuerza por dos caminos: de golpe (Helmholtz) y por una rampa lenta desde abajo (dos deslizamientos)',
    puntos: [P(0, S(0.2), 1, 0.1), P(4, S(0.2), 1, 0.1), P(4.05, S(0.2), 0, 0), P(5, S(0.2), 0, 0), P(5.05, S(0.2), 0.15, 0.1), P(9, S(0.2), 1, 0.1, { curva: 'exp' }), P(13, S(0.2), 1, 0.1), P(13.2, S(0.2), 0, 0)],
  },
  geografia: {
    nota: 'el mismo gesto recorre el cuerpo: cuerda → puente → placa → cavidad; lo que cambia es lo que resiste',
    puntos: [P(0, S(0.35), 1, 0.1), P(3, S(0.35), 1, 0.1), P(6, 0.66, 1, 0.1), P(9, 0.79, 1, 0.1), P(12, 0.94, 1, 0.1), P(14, 0.94, 1, 0.1), P(14.2, 0.94, 0, 0)],
  },
  raspado: {
    nota: 'el anclaje estriado: la mano acelera y el raspado pasa de ritmo (40 crestas/s) a altura (600/s)',
    puntos: [P(0, 0.06, 1, 0.02), P(12, 0.06, 1, 0.3, { curva: 'exp' }), P(13, 0.06, 1, 0.3), P(13.2, 0.06, 0, 0)],
  },
  presion: {
    nota: 'presión sin arco: la fuerza sube sin movimiento (silencio); después el arco empieza a moverse',
    puntos: [P(0, S(0.15), 0, 0), P(4, S(0.15), 3, 0), P(6, S(0.15), 3, 0), P(12, S(0.15), 3, 0.12), P(14, S(0.15), 3, 0.12), P(14.2, S(0.15), 0, 0)],
  },
  materiales: {
    nota: 'el mismo gesto con crin, madera, yema y uña',
    puntos: [P(0, S(0.2), 0.8, 0.1, { material: 'crin' }), P(3.5, S(0.2), 0.8, 0.1, { material: 'crin' }), P(3.51, S(0.2), 0.8, 0.1, { material: 'madera' }), P(7, S(0.2), 0.8, 0.1, { material: 'madera' }), P(7.01, S(0.2), 0.8, 0.1, { material: 'yema' }), P(10.5, S(0.2), 0.8, 0.1, { material: 'yema' }), P(10.51, S(0.2), 0.8, 0.1, { material: 'una' }), P(14, S(0.2), 0.8, 0.1, { material: 'una' }), P(14.2, S(0.2), 0, 0, { material: 'una' })],
  },
};
export const duracion = (p) => p.puntos[p.puntos.length - 1][0] + 2;
