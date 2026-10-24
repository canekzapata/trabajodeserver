# Coro inaudible

Canek Zapata · 24 de octubre de 2026 · versión 0.1.0 (`coro-inaudible-0.1.0`).

> Seis cantores en un corredor. Cuando la distancia entre ellos es exacta, tres
> notas quedan guardadas: se ven vibrar, la sala no las oye. Abrir a un cantor
> las deja salir.

En los *Unsichtbare Chöre* de *Donnerstag aus Licht* (Stockhausen), el coro se
oye y no se ve. Aquí es al revés: el coro se ve y no se oye. Lo que guarda es
un estado ligado en el continuo (BIC) por interferencia, la subradiancia de
Dicke en una línea. Las referencias son de memoria.

La propuesta y la corrección del cálculo (`M_jl = e^{ik|x_j − x_l|}`) vienen de
la conversación del 24 de octubre.

## El modelo

```text
da_j/dt = −i(Ω a)_j − ½(γ + γi) a_j − ½γ Σ_{l≠j} a_l(t − |p_j − p_l|) − √(γ/2) s_entra(t − p_j)
boca izquierda = √(γ/2) Σ a_l(t − p_l)
boca derecha   = √(γ/2) Σ a_l(t − (L − p_l)) + s_entra(t − L)
```

- **Seis resonadores iguales,** con amplitudes complejas de frecuencia positiva
  (modos acoplados).
- **Ω** es una cadena simétrica de acoples entre vecinos.
- **El tubo es una línea de retardo real:** lo que un cantor emite llega a los
  demás tarde, con la fase que le toca. **No hay aproximación de Markov.** Las
  posiciones p_j se miden en tiempo de viaje; el corredor mide 6 × 15,6 m.
- **La integración es exacta en la parte local.** Lo retrasado entra a mitad de
  paso, con interpolación de Lagrange cúbica.
- **Valores por omisión:** γ = 3/s hacia el tubo y γi = 1/40 s de pérdida
  interna (una nota guardada dura unos 40 s).
- **Las dos bocas son dos canales.** La izquierda y la derecha dan a la sala por
  lados opuestos. Sumarlas en mono cancelaría exactamente todo lo antisimétrico
  mientras el coro sea simétrico. Lo descubrí porque la toma *espejo* daba
  −150 dB.

## El acorde se diseña

**Por qué quedan notas guardadas.** La fila es simétrica, así que sus modos son
simétricos o antisimétricos. Cuando la separación es un periodo entero de una
nota (Bragg), los antisimétricos empujan con un lado lo que jalan con el otro, y
no radian.

**Para que eso valga en un tubo con retardo, y no solo en el modelo
instantáneo,** cada nota guardada debe ser un **armónico de c/d**. Si no, la
condición de Bragg se cumple para una nota y no para las otras. Por eso, el
acorde se pide como armónicos de una base:

- **Por omisión:** base 22 Hz, armónicos 10 · 12 · 15, es decir **220 · 264 ·
  330 Hz** (la menor justa).
- Entre cantores hay 343/22 = 15,6 m.

El acorde que propuse antes (la · do · si) **no sirve:** no son armónicos de una
base razonable.

**El problema inverso.** El bloque antisimétrico de la cadena es
`[[0, c1, 0], [c1, 0, c2], [0, c2, −c3]]`, con frecuencias relativas a un eje f0.
Sus valores propios son las notas guardadas. Igualando coeficientes:

```text
c3 = −e1      c1² = −e3/e1      c2² = −e2 − c1²
```

donde e1, e2 y e3 son las funciones simétricas de las tres notas.

- **El bloque simétrico es el negativo del antisimétrico,** así que **la sala oye
  el espejo del acorde alrededor de f0.**
- **El eje sirve si los acoples salen reales:** con la base de 22 Hz, solo 253 o
  286 Hz.
- **Con f0 = 286,** el coro guarda 10 : 12 : 15 y la sala oye **242 · 308 · 352
  Hz = 11 : 14 : 16.** Esas son la tríada menor justa adentro y un acorde de
  undécimo y séptimo armónico afuera.
- **Acoples:** 38,1 · 31,1 · 44,0 · 31,1 · 38,1 Hz.

## Qué se comprobó

`node pruebas.mjs`: 9 pruebas, todas pasan.

| Afirmación | Medido |
|---|---|
| El problema inverso da las notas pedidas | 220 · 264 · 330 Hz, error 3·10⁻¹² cents |
| En Bragg, las tres antisimétricas no radian **en el tubo con retardo** | fuga 1–1,6·10⁻⁴/s, el residuo de la interpolación (una vida de ~6000 s). Las audibles: 0,15 / 1,7 / 16 por s |
| **Golpear a un cantor guarda la mitad solo si el coro se oye a tiempo** | Markov: 0,500. Con γ = 0,25 / 1 / 3 / 8 por s: 0,481 / 0,433 / 0,349 / 0,244 |
| Abrir una puerta: la fuga crece como δ² (cantor 1, el doble de δ) | cociente 3,88 / 3,94 / 4,00 |
| Cada cantor suelta primero una nota distinta | cantor 1 → 264 Hz; cantores 2 y 3 → 220 Hz; **el centro casi no suelta la aguda** (0,0011 contra 0,075 por s) |
| Reciprocidad: un pulso desde la sala no carga lo guardado | 4·10⁻¹¹ de la energía que el pulso dejó en el coro |
| Fuera de Bragg (+0,4 %), las guardadas salen en orden de vida | 0,5 s (330) · 4,0 s (264) · 27,6 s (220) |
| Tras un golpe, la boca oye el espejo, no lo guardado | picos en 242 · 308 · 353,5 Hz; las guardadas, 42–56 dB por debajo |
| Reproducible | misma huella |

Tres de estos resultados **no los esperaba:**

1. **El coro tarda en cerrarse.** Un estado oscuro necesita que las voces de
   todos hayan llegado a todos. Durante los primeros 5T (0,23 s), lo que guarda
   cada cantor todavía radia. Con γ = 3, se guarda 0,35 del golpe y no la mitad.
   Se acerca a ½ solo cuando γ·5T → 0.
2. **La regla de oro solo vale lejos de las notas audibles.**
   - Para 220 Hz acierta con un error del 5–7 %.
   - Para 330 Hz, que está entre 308 y 352, la fuga real es de 2 a 8 veces
     menor que la prevista: lo que se escapa rebota en los otros cantores.
   - Con el cantor 3, la ley δ² se rompe para esa nota (cociente 6,9 en vez
     de 4).
   - La página muestra la vida según la regla de oro, con esa advertencia.
3. **El golpe en espejo no es silencioso.** El transitorio sale por las bocas
   durante ~0,5 s; después, unos −71 dB hasta que se abre una puerta (no medí de dónde viene ese resto).

## Tomas

Las seis tomas son estéreo, con la misma ganancia y sin normalizar. La gráfica
`muestras/coro.png` muestra la energía de cada modo y el nivel en la sala.

| Toma | Lo que hace | Nivel |
|---|---|---|
| [guardar](muestras/coro-guardar-51ac243d32f2.m4a) | Golpe al cantor 1. Destello, y la nota de 242 Hz se demora varios segundos (vida ≈ 6,7 s). A los 6 s se abre su puerta (30 cm): salen 264 y 330 Hz; 220 Hz sale despacio. Al cerrar, lo que queda vuelve a guardarse | −25,2 LUFS |
| [puertas](muestras/coro-puertas-919a0b2ff4b0.m4a) | Golpe a los cantores 1 y 3; se abren por turno las puertas 1, 3 y 2. Cada puerta vacía otra parte del acorde | −21,7 LUFS |
| [arpegio](muestras/coro-arpegio-0daf4d4f9013.m4a) | Golpe, y a los 4 s todo el coro se separa 0,4 %: 330 Hz sale en medio segundo, 264 Hz despacio y 220 Hz casi no sale | −26,9 LUFS |
| [espejo](muestras/coro-espejo-6d0319f85fdb.m4a) | Golpe en espejo (cantores 1 y 6, en contrafase): un clic y luego silencio. A los 5 s se abre el cantor 2 y aparece el acorde que estaba adentro | −21,1 LUFS |
| [sala](muestras/coro-sala-d929287de842.m4a) | Dos pulsos llegan desde la sala; al abrir la puerta no sale nada, porque no había nada guardado | −32,1 LUFS |
| [cerca](muestras/coro-cerca-9e3d36e58307.m4a) | Golpe; de los 3 a los 8 s la escucha entra al cantor 3: se oye lo guardado | −20,8 LUFS |

## Tocar

- **Clic en un cantor:** golpearlo, o golpearlo en espejo.
- **Arrastrarlo de lado:** abrir su puerta, hasta ±60 cm. «Cerrar las puertas»
  devuelve a todos a su lugar.
- **La separación** mueve a todos (±1 %).
- **El pulso desde la sala** comprueba la reciprocidad de oído.
- **La escucha** va de la sala (las dos bocas) a cerca de un cantor (su
  amplitud).
- **El acorde guardado** se diseña con base, armónicos y eje; la página dice si
  ninguna cadena los guarda.
- **Grabar toma** guarda los gestos; `node renderizar.mjs toma.json salida.wav`
  la recalcula.
- **Teclado** (con el corredor enfocado): 1–6 golpean, ← → mueven al último, 0
  cierra.

## La versión 3D

`3d.html` + `escena3d.mjs`: el mismo `worklet.mjs`, en WebGL propio, sin
bibliotecas.

- **Seis columnas de luz** en un corredor de 94 m, con dos bocas que dan a la
  sala.
- **El oro de cada columna** es lo que guarda. Su **color** es la mezcla de las
  notas guardadas, pesada por la energía de cada una en esa columna:
  - ámbar profundo para la grave (220 Hz);
  - oro para la de en medio (264 Hz);
  - oro pálido para la aguda (330 Hz).

  Abrir una puerta cambia el color de las columnas, porque cada puerta vacía
  otras notas.
- **Los anillos azules en el piso** son lo que puede salir, con el mismo
  criterio de color en tres azules. La luz de las bocas sigue el nivel en la
  sala.
- **La escucha sigue al cuerpo.** Desde la sala se oyen las bocas. A menos de
  ~4,5 m de una columna, la mezcla pasa a lo que guarda la más cercana.
- **Tocar:** clic en una columna la golpea; arrastrarla de lado abre su
  puerta. Los desplazamientos se dibujan cinco veces más grandes; el corredor,
  en metros reales.
- **Caminar:** flechas o W A S D (mayúsculas: más rápido), o los botones
  ▲ ▼, «a la sala» e «ir junto a…». Para mirar, se arrastra en el vacío.

En Chromium sin pantalla (SwiftShader) se probaron la 3D en 1300 y en 390 px:
golpes, ir junto al cantor 2, abrir su puerta arrastrando y volver a la sala,
sin errores en la consola. Se miraron las capturas. No se probó en un teléfono
real ni con un lápiz.

En Chromium sin pantalla (Playwright) se probaron el golpe, el arrastre de una
puerta y la vista de 390 px, sin errores en la consola. Se miraron las
capturas.

## Qué no se comprobó

- **Escucha humana:** el agente no escuchó las muestras.
- **Un tubo de verdad.**
  - Las bocas no reflejan nada (están adaptadas), y el tubo no tiene pérdida
    ni dispersión.
  - Los resonadores son puntuales.
  - El acople directo entre vecinos es un dato del modelo; no se derivó de una
    geometría.
- **Los desplazamientos** cambian los retardos con suavizado de 40 ms. El
  Doppler que eso produce no se midió.
- **Costo:** en Node corre unas cuatro veces más rápido que el tiempo real.
- **Referencias de memoria:** Stockhausen, Dicke, Friedrich–Wintgen y el
  problema inverso de Jacobi (Hochstadt, Hald).

## Abrir

```sh
python3 -m http.server 8771 --directory instrumentos/coro-inaudible
# http://127.0.0.1:8771/  (y /3d.html)
node renderizar.mjs <guardar|puertas|arpegio|espejo|sala|cerca|toma.json> salida.wav
node pruebas.mjs
```

## Archivos

| Archivo | Qué es |
|---|---|
| `motor.mjs` | Diseño del acorde (problema inverso), modos, regla de oro y `Coro`: la cadena en el tubo con retardo |
| `worklet.mjs` | El coro en el AudioWorklet: dos bocas, escucha de cerca, tomas |
| `tomas.mjs` | Seis partituras de gestos y la mezcla de escucha |
| `index.html`, `interfaz.mjs` | El corredor, las seis notas, el tiempo y el diseño del acorde |
| `3d.html`, `escena3d.mjs` | El corredor caminable en WebGL; la escucha sigue a la cámara |
| `renderizar.mjs` | Partitura o toma → WAV estéreo + JSON (energía de cada modo cada 50 ms) |
| `pruebas.mjs` | Las 9 pruebas |
| `muestras/` | M4A de las seis tomas y la gráfica `coro.png` |
