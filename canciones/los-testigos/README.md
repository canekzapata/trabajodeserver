# Los testigos dicen la misma altura

Canek Zapata · 24 de octubre de 2026 · 2:36 · estéreo ·
[escuchar](muestras/los-testigos-95d70fedb1f7.m4a)

> Cuatro cerros conservan la altura de una meseta que ya no existe. Cada uno
> guarda la nota de la meseta y la sala sólo oye su espejo. El llano canta los
> cerros gastados, leyendo cada vez más atrás. Al final se abren las puertas:
> el texto que no se había encontrado sale, en canon, con el retardo de la
> distancia.

Poemas: *El archivo no recuerda* e *Índice del río* («el texto que todavía no
ha sido encontrado»), en `poesiasexp/poemario`. Instrumentos:
[Coro inaudible](../../instrumentos/coro-inaudible/) y
[Sampleador de espacio-tiempo](../../instrumentos/sampleador-espacio-tiempo/).

## El terreno

**Fuente:** Traspuesta, lámina 7, **NDENTHO̱** («summit of the hill»).

- **Arquetipo:** cerros testigo, en 11 km.
- **Historia:** meseta → erosión → mesas, cerros y agujas.
- **Cómo se sacan los datos:** `datos.mjs` corre `MT.terreno("7")` del motor
  de Rejilla y guarda `terreno-7.json`.

| | Altura | Prominencia | Lugar |
|---|---|---|---|
| **Testigos** (a menos de 10 m de la cumbre más alta) | 1 770,0 · 1 769,7 · 1 768,6 · 1 765,9 m | 540 · 418 · 484 · 489 m | todos en la franja oeste |
| **Cerros gastados** | 1 747 · 1 475 · 1 398 · 1 395 · 1 316 · 1 299 m | 111 · 190 · 11 · 83 · 54 · 16 m | |
| **Llano** (mediana del terreno) | 1 272,9 m | | |

**Los cuatro testigos están a 4,1 m uno de otro.** Es lo que queda de la
superficie de la meseta. La siguiente cumbre está 23 m más abajo. Los dos más
altos difieren en 0,3 m: casi, pero no exactamente, lo mismo.

## Decisiones de la pieza (no vienen del terreno)

- **El llano es re3** (146,83 Hz) y **cada metro vale 2 cents.** Los testigos
  caen en 260,7 · 260,7 · 260,3 · 259,5 Hz, un do4 bajo. Laten entre sí hasta
  8 cents.
- **Se escucha parado en el testigo más alto.** Todos los gestos ocurren a la
  vez en los cuatro cerros. Se oyen en canon porque el sonido tarda en llegar,
  a 343 m/s:

  | Testigo | Distancia | Retardo |
  |---|---|---|
  | 1 | 0 km | 0 s |
  | 2 | 1,06 km | 3,1 s |
  | 3 | 3,87 km | 11,3 s |
  | 4 | 8,35 km | 24,3 s |

  La distancia también atenúa, como 1/(1 + km/4).
- **Cada testigo es un Coro inaudible.** Su acorde guardado es 10 : 12 : 15 con
  la nota del cerro en el medio. La sala oye el espejo, 11 : 14 : 16:
  - 1 770 m guarda 217,3 · 260,7 · 325,9 Hz;
  - la sala oye 239,0 · 304,2 · 347,7 Hz.

  Para esta pieza, la pérdida interna es de 1/120 s, en vez de 1/40: es piedra.
  Sobre el primer testigo, un 18 % de la escucha es de cerca.
- **El llano es el Sampleador.**
  - Su cuerda tiene la forma del perfil de 9,9 km que pasa por los cuatro
    testigos, sin la recta entre los extremos, porque la cuerda está fija.
  - Esa forma es su timbre.
  - En la erosión, cada cerro gastado vuelve a poner el perfil en la cuerda,
    con la fuerza de la altura que le queda.

## La forma

| s | Sección | Qué pasa |
|---|---|---|
| 0–24 | **Llano** | La cuerda con la forma del terreno suena en re3. A los 3 s se cristaliza: ese estrato es la meseta |
| 24–50 | **Golpe** | Los cuatro testigos se golpean a la vez y llegan a los 24, 27, 35 y 48 s. Cada golpe es un destello del espejo (304 y 348 Hz); después, la de 239 Hz se demora. Un tercio de cada golpe queda guardado |
| 56–90 | **Erosión** | El llano canta los seis cerros gastados de sur a norte: 154 · 254 · 169 · 151 · 185 · 170 Hz, cada uno tanto tiempo como su prominencia. El cabezal lee cada vez más atrás (τ₀ de 0 a 2,3 s), con memoria de Volterra |
| 104–140 | **Puertas** | Todos los testigos abren a la vez (45 cm). Llegan a los 104, 107, 115 y 128 s. Sale la nota de la meseta (260 Hz) y la aguda; el llano lee el estrato de la meseta en esa nota |
| 140–156 | **Cierre** | Se cierran las puertas. **La grave del acorde (217 Hz) no se fue: sigue guardada** |

`muestras/los-testigos.png`: el perfil, el espectrograma (oro = lo guardado,
azul = el espejo) y la energía guardada en cada testigo.

## Qué se comprobó

`node pruebas.mjs`: 7 pruebas, todas pasan.

- `terreno-7.json` es lo que da hoy `MT.terreno("7")`.
- **Los testigos:** son cuatro cumbres a menos de 10 m entre sí (4,1 m de
  dispersión). La siguiente está a 1 747 m.
- **Cada coro guarda la nota de su cerro,** con un error de menos de 0,01 cents.
- **Las entradas del canon** son distancia / 343 m/s.
- **Lo que guarda una puerta:**
  - Un golpe guarda 0,34.
  - Con la puerta de 45 cm, en 3 s se va el 99,9 % de la nota de la meseta y
    el 99,8 % de la aguda.
  - **La grave conserva el 35 %.**
- **La erosión** canta los cerros gastados en el orden del perfil.
- **Reproducible:** los primeros 30 s salen idénticos.

**Master:** −22,1 LUFS integrados, LRA 14,2 LU, pico −0,8 dBFS. Está
normalizado sólo por pico, sin compresión.

## Qué no se comprobó

- **Escucha humana:** el agente no escuchó la canción. Lo que se dice del sonido
  sale del espectrograma y de los niveles.
- **Si el canon de 24 s se oye** como canon o como cuatro sucesos sueltos.
- **El llano:** el timbre del perfil es tan grave y lento que, en los primeros
  24 s, se oye sobre todo como un re con un vaivén lento.
- **Las decisiones** (re3, 2 cents/m, la atenuación, el 18 % de cercanía) son de
  diseño, y otras darían otra pieza.

## Abrir

```sh
node cancion.mjs salida.wav      # ~50 s de cálculo; escribe también salida.json
node pruebas.mjs
python3 figura.py salida.wav muestras/los-testigos.png
REJILLA=/ruta/a/rejilla node datos.mjs   # volver a sacar los datos de Traspuesta
```
