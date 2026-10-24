# El rift se abre

Canek Zapata · 24 de octubre de 2026 · 70 compases, 70 bpm, 4:02 ·
[escuchar el master](muestras/el-rift-se-abre-12913b3270c2.m4a)

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

## La mezcla y el master

Canek eligió el coro espectral y la mezcla con las decisiones propuestas:

- sin batería;
- el inglés con el fonetizador inglés;
- el fa que choca se queda;
- −14 LUFS;
- el espacio tomado del rift.

**Lo que se completó en la partitura:**
- **Intro:** la Garganta, con el tubo plano de la meseta, canta su unísono (mi3).
- **Interludio:** dos ríos adelantados.
- **Final:** la Garganta, con el tubo de la supercaldera, en el piso (do3). La
  voz calla.

**El inglés:**
- El fonetizador inglés de Rejilla (`g2p-en`, por reglas) da ARPABET, y cada
  fonema se reescribe con el más cercano que el banco español de Sabina tiene:
  *the* → «da», *room* → «rum», *call* → «kal».
- **Las reglas se equivocan en *open*:** sale «a-pen». Se deja: es una máquina
  leyendo.

**Los stems** (`mezcla.mjs`):
- Son 11 instrumentos más el espacio, completos.
- **Cada stem se lleva a un mismo nivel cuando suena** y después recibe los dB
  de la tabla `MEZCLA`. Sin eso, el contrabajo sacaba 21 dB más que la viola
  por su modelo.
- **El paneo sale del corte del rift:** el hombro oeste a la izquierda, el este
  a la derecha, y cada lago y cada río en su lugar.
- **La automatización** sube el Coro al abrirse las puertas (+6 y +16 dB) y la
  voz 2 dB en los coros.
- **El espacio** es una red de retardos de 8 líneas. Su RT60 sale de la hondura
  del rift en cada época (0,6 s + 1 s por km): meseta 0,6 s, estiramiento
  2,15 s, después 1,7 s. Es decisión de mezcla.
- **Los stems de `stems-mezcla/`** son los que suenan en la mezcla. Su suma es
  `mezcla.wav`, con un error máximo de 1,5·10⁻⁵.

**El master** (`master.sh`):
- Ganancia lineal y un limitador suave, sin compresión ni control automático de
  ganancia.
- **Resultado: −14,0 LUFS, −1,1 dBTP, LRA 6,8 LU** (la mezcla tenía 7,0).
- Un primer intento con `loudnorm` cayó en modo dinámico y se descartó.

**Niveles por sección** (`muestras/mezcla.json`):
- La voz queda entre −0,8 y +2,5 dB sobre el resto mientras canta: conduce sin
  tapar, que es la lección de Luciérnagas.
- Ningún tramo baja de −60 dB.

**Lo que se ve al abrir las puertas** (compás 65, `muestras/master.png`):
- **mi4 y sol4 salen de golpe:** −27 y −49 dB contra vecinos por debajo de
  −70.
- **Se vacían en unos 4 s.**
- **do4 se queda y sostiene el final**, entre −33 y −41 dB.
- La canción termina en la fundamental de la tónica que nunca había sonado. Es
  la misma física de *Los testigos*: la puerta del cantor 1 suelta primero la
  nota del medio y la aguda.

## Segunda mezcla: voces compuestas e instrumentos que vocalizan

Canek, después de la primera mezcla, dijo tres cosas:

- «hacer 2 líneas más de la voz principal y usar instrumentos que vocalizan
  para que se sintiera más coherente»;
- «la voz de Sabina desnuda es muy… desnuda»;
- «no necesariamente son idénticas esas voces, las tienes que componer».

### Las dos voces, compuestas

Las canta Sabina. Las dos usan solo tonos del acorde ya caído en el terreno; en
los compases sin acorde, el I. Son silábicas y ninguna nota pasa de 2 tiempos.
Un primer intento de doble idéntica y de armonía paralela se descartó por la
tercera indicación.

**La alta, «la que traduce».** La lista del archivo se llama `still-here`.
- **Texto:** responde en los huecos con el original en inglés:
  - *still here* tras cada «aquí»;
  - *leave the sentence* en el pre-coro 1;
  - *after midnight* en el pre-coro 2, encima de «después de medianoche»;
  - *is read*, *three lines missing* y *do not answer*;
  - *keep the copy* contra «guarda la copia».
- **Su última respuesta,** *still here*, cae sobre el I justo cuando el Coro lo
  suelta.
- **Regla de alturas:** empieza en el tono más cercano a mi5 y responde
  bajando.
- **Registro:** sol4–la5. Son 42 sílabas.

**La baja, «el archivo».**
- **En los versos dice las fechas de los mensajes:** «tres de noviembre, mil
  novecientos noventa y cinco»; «dieciocho de junio, noventa y siete…
  retenido».
- **En los coros canta el estribillo en aumentación** (×2), con su contorno una
  octava abajo, ajustado al tono más cercano.
- **En el coro final dice «septiembre cero»,** la fecha imposible del archivo,
  y termina en «aquí» sobre el I.
- **Fuera del contorno compuesto,** la conducción es lisa: el tono más cercano
  a la nota anterior. En las fechas eso la deja recitando sobre una nota.
- **Registro:** sol2–re4. Son 85 sílabas.

**Cuánto se parecen a la melodía:** solo el 7 % (alta) y el 13 % (baja) de sus
notas coinciden con ella en ataque y duración, y casi ninguna en sílaba. El 78 %
de los ataques de la baja cae junto a uno de la melodía, pero es inevitable: la
melodía va en corcheas y la baja en negras y blancas.

### Los instrumentos que vocalizan (Rejilla)

| Antes | Ahora | Por qué |
|---|---|---|
| Viola | **Coro de gargantas:** tres *Gargantas de montaña*, una por tono del acorde, en vocales (u en los versos, o en los pre-coros, a en los coros) | El tubo de cada una es el corte del rift de la época: el rift canta los acordes |
| Gong (lagos) | **Voz de agua:** burbujas en los formantes. Cada mensaje que llega a un lago dice una palabra de la nota del moderador («retenido», «aclaración», «acusación», «nombres», «fechas», «propuesta»); el lago colgado hace gárgaras, «todavía» | La bandeja de moderación se oye como agua que habla |
| Trompeta con harmon (ríos) | **Pájaro:** una siringe física que silba deslizándose | El glissando lo hace un órgano vocal |
| (sin percusión) | **Tambor que habla:** dice «retenido para aclaración», «acusación personal», «nombres, fechas y una propuesta» en el verso 2 y pregunta «¿para quién?» en el pre-coro 2 | La única percusión, y con frases (pregunta 8); habla la moderación |
| Trombón abierto | **Trombón con plunger** en los cinco ataques | El «ua» de una boca |

### La mezcla

- **Voz:** el envío al espacio pasa de 0,16 a 0,25. La alta va a la izquierda
  (−0,35) y la baja a la derecha (+0,35), las dos a −6 dB.
- **Gargantas:** −3 dB en los versos, donde casi empataban con la voz.
- **Master:** −14,0 LUFS, −1,1 dBTP, LRA 7,0 LU (la mezcla tenía 7,1).
- **La voz principal** queda entre −0,7 y +2,3 dB sobre el resto mientras
  canta, sin huecos.
- **Los stems son 14 más el espacio:** voz, voz alta, voz baja, gargantas,
  contrabajo, resonancia, trombón, arco, Coro, ríos (pájaro), lagos (voz de
  agua), tambor, Garganta y viento.

## Qué se comprobó

`node pruebas.mjs <carpeta-con-voz.f32>`: 8 pruebas, todas pasan.

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
7. **Las voces de apoyo** son silábicas, tienen notas de 2 tiempos como
   máximo, texto y ritmo propios, y cantan tonos del acorde caído.
8. **El master** está a −14 LUFS y −1 dBTP sin perder rango; la voz no pasa
   de +3 dB sobre el resto, y no hay huecos.

## Qué no se comprobó y qué falta

- **Escucha:** el agente no escuchó las tomas.
- **La mezcla se juzgó por mediciones,** no por oído. El balance fino (sobre
  todo la resonancia y los ríos) es lo primero que hay que escuchar.
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
node voz.cjs <carpeta>/voz-principal.f32 principal   # y alta, baja (las voces compuestas)
node mezcla.mjs <carpeta> stems   # los 14 stems completos (unos 4 min)
node mezcla.mjs <carpeta> mezcla  # mezcla.wav, stems-mezcla/ y mezcla.json
sh master.sh <carpeta>            # master.wav y master.json
python3 figura_master.py <carpeta>/master.wav partitura.json muestras/master.png
node pruebas.mjs <carpeta>
python3 figura.py partitura.json muestras/partitura.png
```
