# Las vacas de Narayana

Canek Zapata · 24 de octubre de 2026 · ska · 168 bpm · 120 compases · 2:55 ·
[escuchar](muestras/las-vacas-de-narayana-b35967ade358.m4a)

> Una vaca pare una ternera cada año; cada ternera, desde el principio de su
> cuarto año, pare también una cada año. ¿Cuántas hay al cabo de veinte años?
> Cada vaca es un instrumento: la ley de más de 30 instrumentos la cumple la
> manada. Cuando no quedan instrumentos nuevos, la manada se vuelve masa, y el
> ska se vuelve música concreta instrumental.

**Fuentes:**
- **El problema** es de Nārāyaṇa Paṇḍita, *Gaṇita Kaumudī* (1356). Lo cito de
  memoria; el enunciado cantado es una paráfrasis.
- **La recurrencia** es N(n) = N(n−1) + N(n−3): 1, 2, 3, 4, 6, 9, 13, 19, 28,
  41, 60, 88, 129, 189, 277, 406, 595, 872, 1278, 1873, **2745**.
- **La práctica de Lachenmann** que tomo es la *musique concrète
  instrumentale*: el sonido como información sobre la acción que lo produce.
- **Acuerdos:** [`../ACUERDOS.md`](../ACUERDOS.md). La voz es de máquina, las
  voces de apoyo se componen, se prefieren instrumentos que vocalizan, rige la
  ley de más de 30 instrumentos, y sin ronda de propuestas.

## La manada es la orquesta

- **La simulación:** `partitura.mjs` simula la manada vaca por vaca: quién
  nace, de qué madre y en qué año. Una vaca pare desde que cumplió tres años.
- **La vaca 0 es el skank del piano.** Cada ternera es el siguiente instrumento
  de la lista y **entra a la canción el año en que nace**:

| Año | Vacas | Entra |
|---|---|---|
| 0 | 1 | piano (skank) |
| 1 | 2 | contrabajo (walking) |
| 2 | 3 | batería de fotones |
| 3 | 4 | trombón |
| 4 | 6 | trompeta, clarinete |
| 5 | 9 | órgano de divisores, violín pizz, tambor que habla |
| 6 | 13 | Garganta de montaña (el mugido), Cuerpo de acción (raspado), tam-tam con superbola, bajo de androide |
| 7 | 19 | viola, chelo, pájaro, agua, voz de agua, waterphone |
| 8 | 28 | gong de ópera, Cuerda que recuerda, Sampleador, trompo, boca de tres tiempos, cuerda de cuerpos incompatibles, piano de tres presentes, arpa que presta su vibración, cristal orbital |
| 9 | 41 | cuerdas de estación, terminal vectorial, plumón de plasma, sala plegada, viento, **Coro inaudible** |

- **Son 34 instrumentos de la manada más Sabina: 35.** En el año 9 hay 41
  vacas y 34 instrumentos.
- **Desde el año 9,** cada vaca nueva engrosa el linaje de su antepasada más
  cercana con instrumento: más ataques del mismo instrumento.
- **Los 2745 del año 20** no son 2745 sonidos. Son la saturación de los linajes,
  y el número lo dicen el tambor y Sabina.

**La herencia.** Cada instrumento hereda la celda de su madre: cuatro grados
diatónicos. Se transforma según su lugar entre sus hermanas:
- la primera ternera sube una tercera;
- la segunda la toca en retrógrado;
- la tercera, en inversión.

Por ejemplo, el trombón es la tercera hija de la vaca 0 y toca la celda
invertida: 0, −2, −4, −2.

**La palabra de Narayana es la manada.**
- La sustitución a→ab, b→c, c→a crece exactamente como la recurrencia: sus
  longitudes son 1, 2, 3, 4, 6, 9, 13, 19, 28, 41…
- Cada letra es una vaca: **a** es madura (pare), **b** tiene un año, **c**
  tiene dos.
- **Los ataques de la manada caen en las «a»:** suenan las vacas que paren.
- La fracción de «a» tiende a ψ − 1 = 0,46557, donde ψ es la razón de la
  recurrencia (x³ = x² + 1).

**La armonía también la escribe la recurrencia.** La raíz de cada año es
r(n) = r(n−1) + r(n−3) mod 7, en grados de do mayor, empezando por I, IV y V:

I IV V V I V ii ii vi vii° I vi V V iii vii° IV vi V I vi.

Cada año dura cuatro compases: raíz, +3, +4, raíz.

## El ska y Lachenmann

- **El ska:**
  - skank en contratiempo: piano, violín pizz, órgano, Cuerpo de acción
    raspando el anclaje;
  - walking de contrabajo y bajo de androide;
  - batería con bombo en 1 y 3, caja en 2 y 4, charles a corcheas y *one drop*
    en los coros;
  - metales que responden a la voz en los compases 3 y 4 de cada año.
- **La concreción (Lachenmann):**
  - Desde el año 8 (28 vacas), cada evento puede volverse **acción**. La
    probabilidad crece con el logaritmo de la manada y llega a 1 en el año 20.
  - **Cada instrumento tiene su acción:**
    - el piano golpea la caja;
    - las cuerdas tocan col legno, pizz Bartók o ponticello;
    - los metales soplan aire sin nota;
    - el clarinete toca solo llaves;
    - el pájaro da golpes de pico;
    - el agua hace de güiro;
    - el waterphone y el tam-tam suenan con superbola;
    - la voz de agua susurra.
  - **El skank sobrevive como acción:** el contratiempo del ska ya es un gesto
    concreto (la mano que apaga, el raspado).
- **El puente (años 13–16):** se calla el ska y queda la manada sola. Suenan
  17 instrumentos, la cuenta del tambor y la memoria.

## Las voces (Sabina)

- **La principal:**
  - en la intro dice el enunciado en frases cortas;
  - en cada año dice «año siete», y **el tambor que habla contesta cuántas
    hay** («diecinueve»): pregunta y respuesta, que es la frase de la
    percusión (pregunta 8);
  - al final canta sola «dos mil setecientas cuarenta y cinco».
- **En los coros se canta la recurrencia a tres voces:**
  - la principal pregunta «¿cuántas vacas?» y canta la suma, N(n);
  - **la alta** responde «el año pasado» y N(n−1);
  - **la baja**, «hace tres años» y N(n−3).

  Son líneas compuestas, con su propio texto y ritmo.

## La mezcla y el master

- **Stems:** 37, más el espacio. Los 12 motores de *Instrumentos de tres
  tiempos* corren en Python (`tt.py`); el resto en JavaScript (`mezcla.mjs`).
- **Cada stem se lleva a un mismo nivel cuando suena,** con dB por función:
  - ska al frente;
  - la manada y los colchones debajo;
  - la voz con automatización: sube con la manada, más en los coros, y baja
    3 dB en la intro para no dominar.
- **El paneo del ska es el de un escenario:** el piano a la derecha, el órgano a
  la izquierda, el ritmo al centro. La manada se reparte por número de vaca.
- **El espacio:** su RT60 crece con la concreción, de 0,8 a 1,6 s (decisión de
  mezcla).
- **Las voces quedan entre −2,7 y +4,2 dB sobre el resto.** El punto más bajo
  es el año 9, cuando entran los últimos instrumentos; el más alto, la salida.
- **Hasta 36 stems suenan en la misma sección:** 33 de la manada más las 3
  voces de Sabina.
- **Master:** −14,1 LUFS, −1,0 dBTP, LRA 9,0 LU. La mezcla tenía 11,5. El
  limitador trabaja más que en *El rift se abre* porque la mezcla tiene picos
  altos.

`muestras/vacas.png`:
- vacas por año;
- instrumentos sonando por sección;
- la curva de concreción;
- el espectrograma del master.

## Qué se comprobó

`node pruebas.mjs <carpeta>`: 8 pruebas, todas pasan.

1. **La manada** cumple la recurrencia y llega a 2745 en el año 20.
2. **Ninguna ternera nace de una madre con menos de tres años cumplidos.**
   N(20)/N(19) = 1,46556, contra ψ = 1,46557.
3. **La ley:** 34 instrumentos más Sabina; cada uno entra el año en que nace
   su vaca y todos tienen eventos.
4. **Cada celda es la de su madre transformada.**
5. **La fracción de acciones sigue a la manada:** 0 / 0,16 / 0,51 / 0,75 / 1
   en los años 7, 10, 14, 17 y 20.
6. **Las voces:** silábicas, ninguna nota de más de 1 tiempo; la alta y la
   baja tienen texto y ritmo propios.
7. **La palabra de Narayana** crece como la manada y su fracción de «a» es
   0,46557 = ψ − 1.
8. **El master** está a −14 LUFS y −1 dBTP, suenan más de 30 stems a la vez y
   no falta ninguno.

## Qué no se comprobó

- **Escucha:** el agente no escuchó la canción. Las afirmaciones sobre el
  sonido salen de niveles y del espectrograma.
- **Si el ska se oye como ska** con instrumentos de modelado físico, y si la
  concreción final se oye como Lachenmann o como desorden.
- **Si el tambor que habla se entiende** cuando dice números largos
  («mil ochocientas setenta y tres»).
- **El gong:** se renderiza evento por evento (de una vez tardaba más de 10
  minutos), y la acción del tam-tam es un roce corto de superbola, no un golpe.
- **El Sampleador** lee la cuerda tres tiempos atrás: es el «hace tres años»
  de la recurrencia en pequeño, no tres años de música.
- **La referencia a Nārāyaṇa** es de memoria.

## Abrir

```sh
node partitura.mjs                                   # partitura.json
node voz.cjs <carpeta>/voz-principal.f32 principal  # y alta, baja
python3 tt.py <carpeta>                              # los 12 motores de Python
node mezcla.mjs <carpeta> stems                      # los demás (unos 5 min)
node mezcla.mjs <carpeta> mezcla                     # mezcla.wav, stems-mezcla/, mezcla.json
sh master.sh <carpeta>                               # master.wav, master.json
node pruebas.mjs <carpeta>
python3 figura.py <carpeta> muestras/vacas.png
```
