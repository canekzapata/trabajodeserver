# Cuerpo de acción

Canek Zapata · 24 de octubre de 2026 · versión 0.1.0 (`cuerpo-de-accion-0.1.0`).

> Lo que se toca es la acción: dónde, cuánta fuerza, qué velocidad, con qué. La
> nota bella es una isla estrecha; el instrumento no la elige, mide si llegaste.

Un instrumento lachenmanniano en el sentido de la *musique concrète
instrumentale*: el sonido como información sobre las condiciones mecánicas que
lo producen. No hay técnicas en un menú (ponticello, flautando, col legno): la
técnica sale del contacto. Cada 0,1 s, el instrumento **mide en la señal** qué
régimen produjo la acción:

- Helmholtz (un deslizamiento por periodo);
- varios deslizamientos;
- aperiódico;
- raspado;
- quieto.

La propuesta, la crítica que fijó el cuerpo inventado y el mapeo de la mano
vienen de la conversación del 23 y 24 de octubre. La sonda previa está en
[`sonda/`](sonda/README.md).

## El cuerpo: una línea con cinco comarcas

| Comarca | s | Qué es |
|---|---|---|
| anclaje estriado | 0–0,12 | Rígido, tres modos agudos y **crestas**: la fuerza normal se modula con el recorrido del arco, a 2000·\|v\| crestas por segundo (v = 0,1 → 200/s) |
| cuerda | 0,12–0,62 | Guía de ondas partida en el punto de contacto; β = distancia al puente; 110 Hz |
| puente | 0,62–0,70 | Tres modos secos (2,4; 3,2; 5,2 kHz) |
| placa | 0,70–0,88 | Modos dispersivos, f_k = 92·k² Hz |
| cavidad | 0,88–1 | Seis modos anchos y amortiguados |

**Acople:** cuerda → puente → placa → cavidad, **en un solo sentido**. El cuerpo
no devuelve energía a la cuerda; es una simplificación declarada.

**Lo que suena:** la fuerza de la cuerda sobre el puente (como un micrófono de
puente) más la radiación de cada comarca. Los pesos de radiación se ajustaron
para que el mismo gesto (F = 1, v = 0,1) dé niveles comparables en todas, entre
−19 y −27 dB. Eso es mezcla, no acústica medida.

**Mover el contacto sobre la cuerda** reparte la onda entre los dos tramos de
forma aproximada.

## El contacto

- **El método:** McIntyre–Schumacher–Woodhouse. En el punto de contacto, el
  cuerpo tiene una velocidad libre v_h y una admitancia instantánea Y, y se
  resuelve `v = v_h + Y·f` contra la fricción.
- **Las cerdas (LuGre):** la fricción tiene estado, la deflexión de las cerdas
  z, con `f = F·(σ0·z + σ1·ż)`. En deslizamiento estacionario da la curva de
  Stribeck hiperbólica de la sonda, `μ = μd + (μs − μd)·v_s/(v_s + |Δv|)`.
  Entre varias soluciones se elige la continua.
- **Cuatro materiales:** crin, madera del arco, yema y uña. Cada uno con su μs,
  μd, v_s y la rigidez y el amortiguamiento de sus cerdas.

## La mano

- **Vertical:** dónde, el lugar en el cuerpo.
- **Arrastre horizontal:** la velocidad del arco (200 px/s → v = 0,1).
- **Fuerza:**
  - con lápiz, la presión real (`PointerEvent.pressure`) por la fuerza máxima;
  - con ratón, el valor del deslizador, que la rueda cambia mientras se aprieta.
- **La mano quieta deja de frotar.** La presión sin movimiento no suena.
- **Teclado:** ↑ ↓ dónde, espacio frota, + − fuerza.

## Lo que mide y muestra

- **El mapa de Schelleng medido.** Cada ventana de 0,1 s con la mano en la
  cuerda deja un punto: β contra F normalizada a v = 0,1, coloreado por lo que
  la señal tuvo. Las rayas de pendiente −1 y −2 son referencia, no fronteras
  calculadas.
- **La partitura de acción** de los últimos 20 s: lugar, fuerza (grosor) y
  velocidad (ticks), coloreada por el régimen.
- **Lecturas:** deslizamientos por periodo, altura, nivel y centroide.
- **Grabar toma** guarda la acción, muestra por muestra en escalones;
  `node renderizar.mjs toma.json salida.wav` la recalcula.

## Lo que mostró

**Pruebas** (`node pruebas.mjs`: 8 pruebas, todas pasan):

| Afirmación | Medido |
|---|---|
| La presión sin movimiento no suena | rms = 0 |
| Helmholtz en β = 0,2, F = 0,8, v = 0,1, con la altura de la cuerda | 1,01 deslizamientos/periodo, 110,1 Hz |
| **Apretar no es subir el volumen:** en la isla, el nivel no cambia y crece la energía aguda | −23,4 / −23,4 / −23,1 dB; energía > 2 kHz 0,42 / 0,72 / 1,05 % (F = 0,4 / 0,8 / 1,6) |
| La velocidad del arco sí sube el volumen | el doble de v (y de F): +5,97 dB |
| Fuera de la isla | F = 0,2: 2 deslizamientos · F = 9: 8 · F = 25: aperiódico |
| **El camino decide** | F = 1 de golpe: Helmholtz (1,01) · la misma F por rampa lenta desde 0,15: **2 deslizamientos** (1,98) |
| Raspado del anclaje a v = 0,1 | 203,6 pulsos/s (esperado 200) |
| Reproducible | misma huella |

**Partituras de acción** (con la misma ganancia, sin normalizar; la gráfica es
`muestras/acciones.png`):

| Partitura | Lo que hizo | Nivel |
|---|---|---|
| [isla](muestras/cuerpo-isla-aeea2a3e9320.m4a) | Entra de golpe a Helmholtz y la sostiene **hasta F ≈ 5,5**, más arriba que las pruebas estáticas. Se rompe a aperiódico y, al bajar la fuerza hasta 0,8, **no vuelve**: termina en varios deslizamientos. Romper la nota la pierde | −22,2 LUFS |
| [camino](muestras/cuerpo-camino-071fb2204494.m4a) | F = 1 de golpe: Helmholtz. La misma F por rampa lenta: varios deslizamientos todo el tiempo | −24,7 LUFS |
| [geografía](muestras/cuerpo-geografia-06c01d740e9b.m4a) | El mismo gesto (F = 1, v = 0,1) recorre el cuerpo. Cuerda en β = 0,35: periódico, por momentos a la mitad de la altura. Puente: 55 Hz. Placa: chirrido periódico agudo (≥ 2 kHz). Cavidad: aperiódico | −20,9 LUFS |
| [raspado](muestras/cuerpo-raspado-fe0d6a088d52.m4a) | La mano acelera en el anclaje. Muchas veces la periodicidad sigue a las crestas (115 → 110, 185 → 182, 465 → 462, 600 → 600), pero **en algunos tramos se engancha a otra cosa** (325 esperados → 46 medidos; 395 → 131) | −17,5 LUFS |
| [presión](muestras/cuerpo-presion-2a38e5c2e46d.m4a) | La fuerza sube sin movimiento: silencio. Cuando el arco empieza a moverse, la nota aparece en Helmholtz | −17,6 LUFS |
| [materiales](muestras/cuerpo-materiales-8605c6cbcfdc.m4a) | El mismo gesto con crin, madera, yema y uña: los cuatro en Helmholtz y al mismo nivel (−23,5 dB), **con brillos distintos**: centroide 2675 / 1846 / 2704 / 1285 Hz | −24,9 LUFS |

**Para componer:**
- El mismo gesto no da el mismo sonido: depende de cómo se llegó.
- Romper la nota bella cuesta perderla.
- La fuerza se oye como brillo y frontera, no como volumen.

## Lo que no hace, o no se comprobó

- **No baja la altura cerca de F_max.** La altura medida en la isla no baja: no
  se reproduce el *flattening*. El afilamiento de la esquina sí aparece, como
  brillo.
- **Las fronteras con la velocidad del arco solo se duplican a medias.** En la
  sonda algebraica las dos fronteras se duplicaban; con cerdas, la rejilla
  gruesa no permite afirmarlo con limpieza.
- **El enganche del raspado a resonancias** se observa en tramos, pero no está
  medido contra los modos del anclaje. Queda como hipótesis por comprobar.
- **Simplificaciones:** el acople en un solo sentido, los pesos de radiación y
  el reparto de la onda al mover el contacto son decisiones de diseño.
- **Costo:** el contacto se resuelve con un barrido de raíces por muestra. En
  Node corre unas tres veces más rápido que el tiempo real; en el navegador usa
  una parte notable de un núcleo.
- **Escucha humana:** el agente no escuchó las muestras. La pregunta de la obra
  sigue abierta: **¿se escucha la acción como acción?**
- **Referencias de memoria:** Schelleng (1973), McIntyre, Schumacher y
  Woodhouse (1983), LuGre (Canudas de Wit y colaboradores, 1995) y las obras de
  Lachenmann.

## Abrir

```sh
python3 -m http.server 8770 --directory instrumentos/cuerpo-de-accion
# http://127.0.0.1:8770/
node renderizar.mjs <isla|camino|geografia|raspado|presion|materiales|toma.json> salida.wav
node pruebas.mjs
```

## Archivos

| Archivo | Qué es |
|---|---|
| `motor.mjs` | Cuerpo de cinco comarcas, contacto con cerdas, medición del régimen y partituras de acción |
| `worklet.mjs` | El cuerpo en el AudioWorklet: mide cada 0,1 s y graba tomas |
| `tomas.mjs` | Seis partituras de acción, sin notas escritas |
| `index.html`, `interfaz.mjs` | La mano sobre el cuerpo, el mapa medido y la partitura de acción |
| `renderizar.mjs` | Partitura o toma → WAV + JSON (acción y régimen cada 0,1 s) |
| `pruebas.mjs` | Las 8 pruebas |
| `sonda/` | La sonda de Schelleng e histéresis previa (sin cerdas) |
| `muestras/` | M4A de las seis partituras y la gráfica `acciones.png` |
