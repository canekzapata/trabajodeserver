// balada.mjs — una progresión I–vi–IV–V–I en entonación justa, cuatro voces, y cuatro maneras de llegar.
// «Balada» es la intención compositiva, no algo que la ley garantice.
import { desafinarPara, esperarPara } from './razon.mjs';

export const REF = 130.8128; // do3 temperado, referencia de las razones justas
export const BALADA = {
  ref: REF,
  K: REF, // do3 pulsa una vez por segundo; do4, dos; do2, una cada dos segundos
  voces: ['bajo', 'tenor', 'alto', 'soprano'],
  fases: 'heredar',
  secciones: [
    { nombre: 'I',  dur: 8, voces: [1 / 2, 5 / 4, 3 / 2, 2] },      // do2 mi3 sol3 do4
    { nombre: 'vi', dur: 8, voces: [5 / 12, 5 / 4, 5 / 3, 2] },     // la1 mi3 la3 do4
    { nombre: 'IV', dur: 8, voces: [2 / 3, 4 / 3, 5 / 3, 2] },      // fa2 fa3 la3 do4
    { nombre: 'V',  dur: 8, voces: [3 / 4, 9 / 8, 3 / 2, 15 / 8] }, // sol2 re3 sol3 si3
    { nombre: 'I',  dur: 10, voces: [1 / 2, 5 / 4, 3 / 2, 2] },
  ],
};

const SUPERIORES = [1, 2, 3];
export function versiones() {
  const cerca = desafinarPara(BALADA, { T: 32, desde: 2, voces: SUPERIORES }); // prepararse durante IV y V
  const lejos = desafinarPara(BALADA, { T: 32, desde: 0, voces: [0, 1, 2, 3] }); // prepararse desde el principio
  const espera = esperarPara(BALADA, { seccion: 3, voces: SUPERIORES, tau: 0.025, maxEspera: 120 }); // alargar V
  return {
    heredada: { partitura: BALADA, nota: 'fases heredadas; nadie prepara la llegada' },
    reiniciada: { partitura: { ...BALADA, fases: 'reiniciar' }, nota: 'todas las fases a cero en cada acorde: llegada programada' },
    cerca: { partitura: cerca.partitura, informe: cerca.informe, nota: 'tenor, alto y soprano se desafinan durante IV y V para atacar juntos al llegar a I' },
    lejos: { partitura: lejos.partitura, informe: lejos.informe, nota: 'las cuatro voces se desafinan desde el principio para atacar juntas al llegar a I' },
    espera: { estado: espera.estado, periodo: espera.periodo, nota: 'afinación justa; alargar V hasta que tenor, alto y soprano coincidan' },
  };
}
