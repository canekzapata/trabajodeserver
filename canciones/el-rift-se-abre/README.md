# El rift se abre

Canek Zapata · 24 de octubre de 2026 · **partitura y tomas** (la canción completa espera la crítica) ·
70 compases, 70 bpm, 4:00

> Balada de K-pop por forma; Grisey y Murail por dentro. La lista de correo de
> 1995–2001 sobre un rift que se abre: la plaza era un unísono, la progresión se
> desafina distinto en cada época, y la tónica que la canción nunca toca está
> guardada desde el primer compás.

- **Terreno:** Traspuesta, lámina 40, **EL ALCOR DEL PINAR** (rift, 44,5 km,
  2 810 m de relieve).
- **Texto:** *La lista que no terminaba*, en `poesiasexp/poemario`.
- **Método:** `COMPOSITOR.md` de Rejilla.
- **Acuerdos:** [`../ACUERDOS.md`](../ACUERDOS.md). La voz es de máquina, con
  frases cortas y sin melismas.

## Afinación: qué escalas usa

No es etíope ni carnática. Son tres capas, todas sobre la **serie armónica de
do1** (32,703 Hz):

| Capa | Sistema | Qué la distingue |
|---|---|---|
| **Melodía** (Sabina) | Entonación justa de do mayor, límite 5 (la diatónica de Ptolomeo y Zarlino): 1 · 9/8 · 5/4 · 4/3 · 3/2 · 5/3 · 15/8 | El mi está −14 cents bajo el temperado, el la −16 y el si −12 |
| **Acordes** | Parciales enteros de do1, límite 7. IV = 21 : 27 : 32, V = 24 : 30 : 36, iii = 20 : 24 : 30, vi = 27 : 32 : 40, ii = 18 : 21 : 27 | **El fa del acorde es el parcial 21, 27 cents bajo el fa de la melodía (4/3) y 29 bajo el temperado.** La melodía y la armonía no coinciden en el cuarto grado |
| **Terreno** | Parciales fraccionarios: la altura de cada rasgo entre 1/8 del piso del rift (193,9 m por parcial) | No es una escala: es un espectro inarmónico, distinto en cada época |

## Las épocas, medidas

`datos.mjs` corre `MT.terreno("40", {forma})` en las cinco etapas que el motor
guarda. Mide los mismos rasgos en el mismo lugar: piso, dos hombros, tres
cumbres y cuatro lagos, todo en parciales de do1.

| Época | Rasgos (parciales) | Qué pasa |
|---|---|---|
| Meseta | todo 5,00 | **Un unísono:** todos a la misma altura (970 m), mi3 |
| Estiramiento | 6,9 · 12,4 · 17,4 · 18,5 · 19,2 · 16,1 · 5,3 · 15,7 · 5,8 · 5,8 | El salto: el espectro se abre |
| Hundimiento | 8,0 · 12,4 · 14,9 · 19,5 · 15,7 · 17,4 · 6,0 · 13,2 · 6,1 · 10,0 | El hombro este baja de 17,4 a 14,9. Los lagos del fondo quedan casi armónicos (6,0, 6,1, 10,0) |
| Lagos y volcanes | igual, a menos de 2 m | **El terreno ya no cambia.** Lo que se rompe es el arco |
| Supercaldera | lagos a 6,3 · 13,3 · 6,2 · 10,1 | Los lagos se llenan 25–65 m y se salen de la serie |

**Esta correspondencia es decisión mía.** Junto los cinco nombres de la historia
del arquetipo con las cinco etapas geométricas del motor por su orden. El motor
no dice que sean lo mismo.

## Material → operación → consecuencia → pasaje

| Material | Operación | Consecuencia | Pasaje |
|---|---|---|---|
| «todavía estamos aquí» (cierra las tres piezas del archivo) | Estribillo de balada, la misma melodía tres veces | En 1995 es un saludo; en 2001 es el residuo de una firma | Coros 1, 2 y final |
| IV–V–iii–vi en parciales de do1 | **Cae en el terreno:** cada tono va a la línea más cercana del espectro de su época (en cualquier octava), si está a menos de 60 cents | La misma progresión se desafina distinto: en el coro 1 se mueven 16 de 24 tonos, en el coro 2, 22 de 24 (hasta 55 cents) | Coros |
| La tónica I (8 : 10 : 12) | **La progresión nunca la toca.** El *Coro inaudible* la guarda desde el compás 1; la sala oye su espejo 9 : 11 : 13 | **La modulación del último coro es abrir las puertas:** la plaza de 1995 suena dentro del espectro roto | Compás 1 → compás 65 |
| La nota alta de cada coro (mi5) | El *Cuerpo de acción* la dobla en mi3, la altura de la meseta. La fuerza del arco decide | Coro 1 se sostiene (isla de Helmholtz). Coro 2 se rompe (aperiódico). Coro final llega por rampa y queda en 2 deslizamientos: **la nota bella no vuelve** | Las tres notas altas |
| Cinco épocas | Modelo ataque–resonancia de *Partiels*: el trombón (do2) abre cada época y la *Cuerda que recuerda* resuena en sus líneas | La forma es la historia geológica. La meseta resuena en unísono | Compases 1, 17, 27, 39, 55 |
| 66 ríos (34 · 25 · 7 por clase) | Uno de cada tres: glissandos de trompeta con harmon de un hombro a un lago del fondo | Los mensajes caen con ritmo propio dentro de la resonancia | Verso 2 y pre-coro 2 |
| Lagos del fondo y lago colgado | Gong tamtam cada vez más denso; gong de dos alturas que se cruzan | El pre-coro crece porque se llena la bandeja de moderación. El canal paralelo suena aparte | Pre-coros; coros 2 y final |
| El corte transversal del rift | Es el tubo de la *Garganta de montaña*; el *Viento* sopla sobre el de la supercaldera | El rift respira sin progresión | Puente |

## Los instrumentos

Ocho, como se acordó, con tres cambios que se explican abajo.

| Instrumento | Origen | Función |
|---|---|---|
| **Sabina** (Difonos) | Rejilla | La melodía, como voz de máquina |
| **Coro inaudible** | este repositorio | Guarda el I |
| **Cuerpo de acción** | este repositorio | El arco en la nota alta |
| **Cuerda que recuerda** | este repositorio | La resonancia de cada época |
| **Trombón** (metal.js) | Rejilla | Los ataques; con plunger en la supercaldera |
| **Viola y contrabajo** (cuerda.js) | Rejilla | La progresión |
| **Trompeta con harmon** (metal.js) | Rejilla | Los ríos |
| **Gong** (gong.js) | Rejilla | Los lagos |
| **Garganta de montaña y Viento** | Rejilla | El puente |

**Lo que cambió respecto de la propuesta:**

1. **El Viento no hace glissandos:** silba en las crestas de un perfil. Los ríos
   pasaron a la trompeta con harmon y el Viento quedó en el puente.
2. **El arco va en mi3 y no en mi5.** A 654 Hz el *Cuerpo de acción* no da un
   régimen medible; en 163,5 Hz sí, y es la nota de la meseta.
3. **La rampa del coro final tuvo que ser más rápida** (llega a F = 1 en 2,1 s).
   Con 3,2 s la cuerda volvía sola a Helmholtz. «El camino decide» depende de la
   velocidad del camino.

## Tomas

`tomas/`, cada una normalizada a su pico. **Sus niveles no se comparan entre sí.**

| Toma | Qué es | Duración |
|---|---|---|
| [voz-coro-1](tomas/voz-coro-1-623ed53d98ed.m4a) | Sabina sola, coro 1 | 27 s |
| [progresión, dos épocas](tomas/progresion-dos-epocas-04b4ae81189c.m4a) | IV–V–iii–vi en el estiramiento y en lagos y volcanes | 28 s |
| [ataques y resonancias](tomas/ataques-y-resonancias-e802c268d0e3.m4a) | Los cinco ataques del trombón con la resonancia de cada época | 26 s |
| [arco, tres notas altas](tomas/arco-tres-notas-altas-cd0de2ce9b3d.m4a) | Isla, rompe, rampa | 14 s |
| [coro inaudible](tomas/coro-inaudible-db68aaf9d1f7.m4a) | El golpe del compás 1 y las puertas del compás 65 (la simulación corre los 225 s; se guarda el 0,38 del golpe y le queda 0,17 al abrir) | 23 s |
| [ríos](tomas/rios-823203fc46ea.m4a) | Los primeros 10 ríos del verso 2 | 22 s |
| [lagos](tomas/lagos-2ca5992ced75.m4a) | El gong se llena en el pre-coro 2; el lago colgado en el coro 2 | 28 s |
| [puente](tomas/puente-8aeea489cb41.m4a) | Garganta, Viento y Sabina | 27 s |
| [coro convencional](tomas/coro-convencional-9adfb64a7b50.m4a) | La prueba de la pregunta 5: piano y cuerdas en temperado, sin terreno | 29 s |
| [coro espectral](tomas/coro-espectral-57e2c4c0b033.m4a) | El coro 1 nuestro: progresión caída, resonancia y arco | 29 s |

**La comparación tiene una limitación:** el coro convencional usa la misma voz
justa, no una voz temperada. Su diferencia es de −14 a +4 cents.

## Qué se comprobó

`node pruebas.mjs <carpeta-con-voz.f32>`: 6 pruebas, todas pasan.

1. `terreno-40.json` es lo que da hoy el motor.
2. **La voz de máquina:** 267 sílabas, una nota por sílaba. La más larga dura 2
   tiempos y la frase más larga sin silencio, 8 tiempos.
3. **El Coro guarda do4 · mi4 · sol4 y la sala oye 9 : 11 : 13.** La progresión
   no toca el I.
4. **Cada tono movido cae sobre una línea del espectro de su época,** y la
   meseta no mueve nada. Son 97 tonos movidos, con desvío máximo de 55 cents.
5. **El arco:** el coro 1 se sostiene en 1 deslizamiento por periodo; el coro 2
   empieza periódico y termina aperiódico; el coro final se queda en 2.
6. **Sabina afina las 12 notas más largas** con un error de +0 a +3 cents.

## Qué no se comprobó y qué falta

- **Escucha:** el agente no escuchó las tomas.
- **La mezcla de la canción** no existe todavía: es la parada acordada.
- **La pregunta 5 sigue abierta:** si el coro espectral cambia lo que el coro
  *significa* o solo lo desafina. Es lo primero que hay que oír, junto al
  convencional.
- **Riesgo propio:** el fa de la melodía (4/3) contra el fa del acorde (parcial
  21) choca 27 cents en cada IV. Puede ser la fricción buscada o un error que
  suena a desafinación.
- **Las palabras en inglés** las pronuncia el conversor español de Sabina. Es
  máquina leyendo un idioma ajeno. Rejilla tiene un fonetizador inglés que no
  usé.
- **Las traducciones del archivo al español son de la partitura;** el archivo
  las da en inglés.

## Abrir

```sh
node datos.mjs                 # el terreno (necesita Rejilla: REJILLA=/ruta)
node partitura.mjs             # partitura.json
node voz.cjs <carpeta>/voz.f32 # Sabina en Chromium sin pantalla
node tomas.mjs <carpeta>       # las 10 tomas (WAV) y tomas.json
node pruebas.mjs <carpeta>
python3 figura.py partitura.json muestras/partitura.png
```
