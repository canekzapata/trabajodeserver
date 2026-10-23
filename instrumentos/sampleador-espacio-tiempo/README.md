# Sampleador de espacio-tiempo

Canek Zapata · 23 de octubre de 2026 · versión 0.1.0 (`sampleador-espacio-tiempo-0.1.0`).

> La cuerda se mueve despacio y guarda su historia. Tocar una nota es leer su
> forma muchas veces por segundo; el cabezal decide desde qué momento del pasado,
> y si lo hace en un corte recto u oblicuo.

Una cuerda lenta, de unos 0,8 Hz, se mueve a ritmo de mano y guarda 4 s de su
historia `u(x, t)`. Un cabezal recorre la cuerda de 0 a 1 tantas veces por
segundo como la nota que se toca. **La forma de la cuerda es la forma de onda:
la nota da la altura y la cuerda da el timbre.** Es síntesis escaneada (Verplank,
Mathews y Shaw, 2000; citado de memoria) con tres añadidos, cada uno con su
modelo y su prueba.

## Qué se corrigió de la página de laboratorio 3D

La página que llegó tenía la idea correcta (leer cortes de la historia de una
cuerda), pero casi todo lo que mostraba o sonaba estaba escrito a mano:

- **El sonido no salía de la cuerda.** Eran 14 osciladores armónicos fijos
  (f₀·m) con amplitudes tomadas de proyecciones. Aquí, lo que suena es la cuerda
  leída.
- **El «Doppler relativista»** era un factor inventado (`0,28·β`, `×0,04·g`). La
  **«costura invariante de Lorentz» en 440 Hz** era un filtro que hundía el
  volumen alrededor de 440 Hz, y la «Siringua» era un seno fijo. Ninguno de los
  tres tiene base; se quitaron.
- **Las lecturas eran texto fijo:** «Fidelidad K 99,98 %», «Rango 14 × 48 (sin
  pérdida)», «−29,4 dB (protegida)». La «pendiente log-log» solo repetía −α.
  Aquí el error del núcleo y su pendiente se calculan.
- **«Takens» y «Kirchhoff» estaban en el título, pero no en el código.** Aquí
  Kirchhoff es la tensión que depende del estiramiento, y Takens es un retrato
  de retardos declarado como herramienta para mirar.
- **Los tiempos no cuadraban.** La historia avanzaba cada 0,045 s × 48 = 2,16 s,
  pero el cabezal la leía como si fueran 3,8 s, y el pasado inicial estaba
  sembrado con otro paso. La física corría al ritmo de los cuadros de pantalla,
  con una fuerza automática arbitraria, y recortaba la cuerda a ±1,35.
- **El núcleo se normalizaba con todos los términos,** pero solo se sumaban los
  impares.
- **«Universo bloque: ningún estado muere»** era falso: el búfer era finito.
- **Dependía de servidores externos** (Tailwind, Three.js, Google Fonts).

## El modelo

```text
u_tt = c²(1 + κ ∫u_x² dx) u_xx − γ u_t − g ∫ K(s) [u(t) − u(t−s)] ds + mano
```

- **La cuerda:** 64 puntos, extremos fijos, L = 1, integrada con Verlet a
  1500 Hz, a partir del reloj de audio y no de la pantalla. Con c = 1,6 L/s, el
  modo 1 dura 1,25 s.
- **Kirchhoff (1876):** la tensión crece con el estiramiento total. Estirada, la
  cuerda se mueve más rápido.
- **Volterra, memoria hereditaria viscoelástica:**
  - El núcleo es K(s) ∝ s^(−α), aproximado por **16 elementos de Maxwell en
    paralelo** (una serie de Prony), con constantes de tiempo de 0,002 a 200 s.
  - Es el modelo de Maxwell generalizado de la viscoelasticidad: la cuerda
    disipa, y **la energía total, contando la que guardan los elementos, nunca
    sube**.
  - El núcleo tiene un horizonte. Por eso su pendiente es algo más empinada que
    −α, sobre todo con α pequeño. Para α = 0,2 va de −0,25 a −0,33 entre 0,05 y
    2 s; para α ≥ 0,4 queda a menos de 0,08 de −α. La página muestra esa
    pendiente.
- **El cabezal:** lee `u(x, t − τ(x))` con `τ(x) = τ₀ + β(x − ½)L/c`, de modo
  que **Δτ entre extremos = βL/c**.
  - Con β ≠ 0, es el plano de simultaneidad de un observador que se mueve a β·c
    respecto de la cuerda: la relatividad de la simultaneidad.
  - Se omite el factor γ de Lorentz, que solo cambia la escala.
  - La historia se interpola en x y en τ.
  - τ₀, β y la mezcla se deslizan en ~40 ms para que moverlos no produzca saltos.
- **Estratos:** cristalizar guarda la forma actual. El cabezal puede leer ese
  estrato, mezclado con el corte vivo. El estrato no actúa sobre la cuerda.
- **Takens (1981):** la página pone una sonda (x = 0,3) contra sí misma
  retardada. Es un retrato para mirar el movimiento; no se afirma reconstruir un
  atractor.

**Del espacio al espectro.** Al leer de 0 a 1, un modo espacial par `sin(2mπx)`
da **un tono puro en m·f**: comprobado, con el resto de armónicos por debajo de
10⁻⁶. Los modos impares dan una onda con armónicos, porque la lectura los corta
en un ciclo no entero.

## Tomas

Todas usan la misma partitura de gestos:
- pulsar la cuerda en x = 0,3 a los 0 s;
- golpearla en x = 0,72 a los 5,4 s;
- melodía la2 · do3 · mi3 · re3 · do3 · la2 · sol3 · mi3, una nota cada 1,5 s.

Llevan la misma ganancia, sin normalizar.

| Toma | Cabezal y cuerda | Nivel |
|---|---|---|
| [presente](muestras/sampleador-presente-a611b64dbe0c.m4a) | τ₀ = 0: el timbre sigue a la cuerda | −22,1 LUFS |
| [pasado](muestras/sampleador-pasado-7c23b7636188.m4a) | τ₀ = 1,5 s: el golpe de 5,4 s se oye a los 6,9 s; antes de los 1,5 s no hay pasado y hay silencio | −21,6 LUFS |
| [oblicuo](muestras/sampleador-oblicuo-e8b0a32e7e33.m4a) | τ₀ = 0,8 s, β = 0,9: el extremo derecho se lee 0,56 s más atrás que el izquierdo | −19,2 LUFS |
| [memoria](muestras/sampleador-memoria-ac6dd317c5b5.m4a) | Volterra con α = 0,4 y g = 6: la cuerda recuerda su forma y se suaviza | −21,0 LUFS |
| [kirchhoff](muestras/sampleador-kirchhoff-d0b67f4f9fba.m4a) | κ = 1,5: estirada, la cuerda se mueve más rápido | −20,6 LUFS |
| [estrato](muestras/sampleador-estrato-c61c0785d55b.m4a) | Se cristaliza a los 3 s; desde los 6 s el cabezal lee ese estrato, y el timbre se congela | −19,9 LUFS |

`muestras/hojas.png` muestra, para cada toma, la cuerda u(x, t) con los cortes
que lee el cabezal en t = 2, 6 y 10 s, junto al espectrograma. Las tomas son
posteriores al deslizamiento del cabezal y la mezcla: el estrato ya no tiene el
clic que producía el salto de la mezcla a los 6 s. Las otras cinco no mueven el
cabezal y salieron idénticas, muestra por muestra.

## Abrir

```sh
python3 -m http.server 8769 --directory instrumentos/sampleador-espacio-tiempo
# http://127.0.0.1:8769/
node renderizar.mjs <presente|pasado|oblicuo|memoria|kirchhoff|estrato> salida.wav
node pruebas.mjs
```

En la página:
- Las teclas A S D F G H J K tocan mientras se mantienen. «Sostener» deja la
  nota sonando.
- La cuerda se pulsa, se golpea o se arrastra con la mano.
- Un clic en la historia mueve el cabezal a ese momento del pasado.
- Se pueden cristalizar estratos y leerlos.
- No usa bibliotecas ni red.

## Qué se comprobó

`node pruebas.mjs`: 10 pruebas, todas pasan.

- **El núcleo:**
  - La serie de Prony reproduce la integral continua con los mismos cortes, con
    un error menor al 2,2 %.
  - La pendiente se acerca a −α donde corresponde.
- **Maxwell en paralelo** da la misma integral que la convolución directa con K.
- **Energía:**
  - Sin pérdida ni memoria se conserva (deriva de 3·10⁻⁵ en 10 s).
  - La memoria disipa sin que la energía total suba nunca.
- **Kirchhoff:** con más amplitud el periodo se acorta (1,247 → 1,099 s); sin
  κ, el periodo es 2L/c.
- **El cabezal:**
  - Δτ = βL/c.
  - Leer τ = 0,5 s devuelve la forma de hace 0,5 s.
- **Del espacio al espectro:** el modo sin(4πx) da un tono puro en 2f.
- **El sonido es reproducible.**

En Chromium sin pantalla (Playwright) se probaron:

- la toma oblicua con una nota, cristalizar y arrastrar la cuerda, y la vista de
  390 px;
- sin errores en la consola, y se miraron las capturas.

## Qué no se comprobó

- **Escucha humana.** El agente no escuchó las muestras.
- **Si el retraso y el corte oblicuo se oyen** como «leer el pasado» o solo como
  cambios de timbre.
- **La cuerda lenta, vista por el oído.** Su forma cambia cada ~1,25 s, así que
  el timbre también evoluciona despacio. Con c alto se acerca a una modulación
  audible.
- **La relación entre g y α y la sensación de memoria** no está explorada.
- **Las referencias** (Verplank, Mathews y Shaw; Kirchhoff; Takens) son de
  memoria.

## Archivos

| Archivo | Qué es |
|---|---|
| `motor.mjs` | `Hoja` (cuerda, memoria, Kirchhoff, historia) y `Sampleador` (cabezal, estratos, nota, salida) |
| `worklet.mjs` | El motor en el AudioWorklet; manda la forma y el corte a la página |
| `tomas.mjs` | La partitura de gestos y las seis lecturas |
| `index.html`, `interfaz.mjs` | Historia, cuerda, corte, retrato de retardos y controles |
| `renderizar.mjs` | Toma → WAV + JSON con energía y quimógrafo |
| `pruebas.mjs` | Las 10 pruebas |
| `muestras/` | M4A de las seis tomas y la gráfica `hojas.png` |
