# Cuerda que recuerda

Canek Zapata · 23 de octubre de 2026 · versión 0.1.0 (`cuerda-que-recuerda-0.1.0`).

> Golpeas la cuerda. La energía sale del modo que tocaste. ¿Vuelve? ¿Vuelve la
> mezcla de parciales, o también la forma de la onda?

Es una cadena de Fermi–Pasta–Ulam–Tsingou **integrada en vivo**. Lo que suena es
la cadena: una captación de la velocidad de sus masas. Lo que se mide sale del
mismo estado integrado. **Nada se dibuja a mano**: no hay curvas de regreso
guionadas, ni umbrales de equipartición elegidos, ni desfases inventados.

## Procedencia

- **La selección y el diseño** (prioridades, controles, la distinción entre el
  regreso de la energía y el regreso de la fase, la prueba con dos energías) son
  del cuaderno de Canek, *Misterios matemáticos que pueden convertirse en
  instrumentos de Rejilla* (23 oct).
- **La página de laboratorio 3D** que llegó antes guionaba la dinámica:
  amplitudes como funciones fijas del tiempo, un umbral de Chirikov constante y
  osciladores armónicos en lugar de los modos de la cadena. De ella se conservan
  ideas de interfaz: la brújula de radio √E₁ y ángulo de fase, el ancho de la
  sonda, la energía local por masa y los regímenes de partida. Su código no se
  usa.
- **Antecedente en Rejilla:** el *Solitón Subarmónico de Toda–KdV* usa
  envolventes analíticas de KdV como voces. Aquí, en cambio, se simula el cuerpo
  golpeado. La recurrencia de FPUT se explica por la cercanía a la red de Toda y
  a KdV (Zabusky y Kruskal), así que los dos instrumentos son parientes.

## El modelo

```text
q̈ᵢ = V′(rᵢ) − V′(rᵢ₋₁) − γ q̇ᵢ,   rᵢ = qᵢ₊₁ − qᵢ,   q₀ = q₃₃ = 0
V(r) = r²/2 + α r³/3 + β r⁴/4
```

- **La cadena:** 32 masas, con masa y rigidez 1, integrada con Verlet de
  velocidad y dos subpasos por muestra.
- **El reloj:** el modo 1 lineal suena en f₀ (110 Hz por omisión). Los demás
  modos quedan donde la cadena los pone, **por debajo de k·f₀**: −2, −5, −16 y
  −41 cents en los modos 2, 3, 5 y 8. Es el timbre propio de la cadena, no un
  error.
- **La escucha:** la velocidad de las masas, pesada por una campana gaussiana
  alrededor de un lugar, de ancho σ. Los modos que tienen un nodo ahí callan.
- **El golpe:** se suma a lo que ya vibra. Hay dos formas:
  - **modo 1:** el desplazamiento en la forma del modo 1, simétrico. Es el caso
    del informe de 1955.
  - **local:** un impulso de velocidad gaussiano en un lugar, con la misma
    energía que el modo 1 de igual amplitud.
- **La imperfección:** un desplazamiento mínimo y asimétrico que siembra la
  ruptura de simetría. Con 0, la única semilla es el redondeo de la aritmética.

## Las medidas

| Medida | Qué es |
|---|---|
| **regreso de energía** | 1 − ½ Σ\|pₖ − pₖ⁰\|: qué tanto se parece el reparto de energía entre modos al del golpe |
| **regreso de forma** | \|⟨z, z⁰⟩\| / (\|z\|\|z⁰\|), con zₖ = ωₖQₖ + iPₖ: mismas proporciones y fases relativas que al golpear, salvo una rotación común |
| **desfase del modo 1** | La fase del modo 1 respecto de la que tendría con evolución lineal desde el golpe |
| **energía total** | La del potencial completo. Con γ = 0 debe conservarse |
| **modos pares** | La fracción de energía en los modos 2, 4, 6…: es el testigo de la simetría |

Una advertencia sobre la forma: en una cadena **lineal** la forma también se
pierde, por dispersión, porque los modos son inarmónicos. Por eso se compara
siempre con el control lineal.

## Lo que mostró

Con 110 Hz, golpe en modo 1 y la misma ganancia de captación en todo, sin
normalizar:

| Toma | Qué pasa | Nivel |
|---|---|---|
| [lineal](muestras/cuerda-lineal-80b609a6abb3.m4a) | El modo 1 conserva todo (control) | −19,3 LUFS |
| [β, A = 6](muestras/cuerda-beta6-89b6561d5b51.m4a) | Baja al 65 % y **vuelve al 100 %** cada **1,39 s** (153 periodos), durante los 20 s | −18,6 LUFS |
| [β, A = 8](muestras/cuerda-beta8-9aed127bed54.m4a) | Baja al 28 % y vuelve al 99,9 % cada **1,06 s** (~117 periodos); los regresos pierden ~0,1 % por ciclo | −15,8 LUFS |
| [β, A = 12, imperfección 1e-8](muestras/cuerda-beta12-0461b757534d.m4a) | **Recuerda y después olvida:** regresa cada 0,66 s hasta ~7,5 s; ahí la simetría se rompe, los modos pares toman energía y el reparto ya no vuelve | −13,7 LUFS |
| [β, A = 12, imperfección 1e-4](muestras/cuerda-beta12b-9d628b206b34.m4a) | El mismo golpe **olvida antes**, hacia los 4,8 s | −12,7 LUFS |
| [α = 0,25, A = 4](muestras/cuerda-alfa4-79e04d43370a.m4a) | Intercambia casi todo (baja al 6 %) y vuelve al 98 % a 1,41 s. Los regresos siguientes son cada vez más parciales | −20,9 LUFS |
| [golpe local en el centro](muestras/cuerda-centro6-110842e8a5d2.m4a) | Simétrico (x = 0,5, ancho 0,15, A = 6): el reparto vuelve al ~98 % cada ~1,37 s | −18,7 LUFS |
| [golpe local de lado](muestras/cuerda-local8-1dfff2ce9802.m4a) | Asimétrico (x = 0,3, A = 8): **no vuelve** en 20 s | −15,2 LUFS |

**Tres hallazgos para componer:**

1. **La fuerza decide cuánto dura la memoria.** Con A = 6 y 8 los regresos son
   casi completos y estables. Con A = 12 la cuerda recuerda durante unos
   segundos y después olvida. **El instante del olvido lo decide la
   imperfección**, de forma aproximadamente logarítmica:

   | Imperfección | Olvido |
   |---|---|
   | 1e-4 | 4,8 s |
   | 1e-8 | 7,5 s |
   | 1e-12 | 12,7 s |
   | solo redondeo | 13,4 s |

   La imperfección es un control de composición: cuánto tarda la cuerda en
   olvidar.
2. **La energía y la forma son regresos distintos.** En el golpe del centro, el
   primer regreso devuelve el 98 % del reparto de energía pero solo el **66 % de
   la forma**. El segundo regreso devuelve el 99,7 % de la forma. Vuelven los
   parciales sin que vuelva la misma onda, y en el regreso siguiente vuelve
   también la onda. Es la distinción que pedía el cuaderno, medida.
3. **Dónde se golpea importa.** Con β y golpe simétrico solo participan los
   modos impares; los pares quedan en 10⁻²⁶, y el timbre tiene solo parciales
   impares. El golpe de lado, en x = 0,3, mete energía en los pares desde el
   principio y, en esta configuración, no recuerda. En barridos rápidos, los
   golpes simétricos amplios regresan muchas veces y los asimétricos regresan
   poco.

`muestras/recorridos.png` muestra, para cada toma, el regreso de energía, el
regreso de forma y E₁/E, junto con el reparto entre los modos 1–8.

## Correcciones a lo que se dijo antes en la conversación

- **«Con A = 12 no vuelve» era falso.** La sonda en NumPy cortó la ventana justo
  en el olvido. La cuerda regresa muchas veces y después olvida.
- **«A = 8 vuelve a los 232 periodos»:** ese es el segundo regreso. El ciclo es
  de ~117 periodos.

## Abrir

```sh
python3 -m http.server 8768 --directory instrumentos/cuerda-que-recuerda
# http://127.0.0.1:8768/
node renderizar.mjs <lineal|alfa4|beta6|beta8|beta12|beta12b|centro6|local8> salida.wav
node pruebas.mjs
```

La página no usa bibliotecas ni red. El sonido corre en un AudioWorklet con el
mismo motor que Node. Golpear suma al estado; «apagar» devuelve la cuerda al
reposo. Los puntos de partida cargan un cuerpo y un golpe. Si la cadena estalla
(α sin β no tiene potencial acotado), se apaga y lo avisa.

## Qué se comprobó

`node pruebas.mjs`: 15 pruebas, todas pasan.

- **Lineal:** no hay intercambio.
- **Energía conservada:** deriva relativa de 4·10⁻⁵ con A = 8 en 300 periodos.
- **Coincidencia con NumPy, con otro código:**
  - β, A = 6: baja a 0,653 en el periodo 75 y vuelve a 1,000 en el 153;
  - β, A = 8: baja a 0,281 en el periodo 174 y vuelve a 0,999 en el 232;
  - α, A = 4: baja a 0,056 en el periodo 263 y vuelve a 0,939 en el 310.
- **A = 12:** más imperfección adelanta el olvido.
- **Paridad:** se conserva con golpe simétrico.
- **Golpes:** el golpe local alimenta los pares; el local y el modal tienen la
  misma energía.
- **Forma contra energía:** en el lineal la forma se dispersa sin que cambie la
  energía.
- **Pérdida:** con γ > 0 la energía solo baja.
- **Reloj:** el modo 1 cae exactamente en f₀.
- **Sonido:** reproducible y finito.

En Chromium sin pantalla (Playwright) se probaron:

- tres puntos de partida, las lecturas en vivo (A = 12 rompe la paridad a los
  10 s) y la vista de 390 px;
- sin errores en la consola, y se miraron las capturas.

## Qué no se comprobó

- **Escucha humana.** El agente no escuchó las muestras.
- **Si los regresos se oyen como memoria** o como un vibrato lento de timbre.
- **La pérdida γ en la escucha.** Está implementada y probada, pero falta medir
  qué Q borra los regresos en tiempo audible.
- **Golpes asimétricos.** Falta un barrido sistemático de cuáles recuerdan.
- **Verlet en régimen caótico.** La deriva de energía llega a 10⁻³ en las tomas
  de A = 12 después del olvido. No afecta la parte que recuerda, pero el detalle
  fino del régimen caótico depende del integrador.
- **No hay pieza todavía:** una frase donde un acorde deje un residuo que la
  frase siguiente encuentre.

## Archivos

| Archivo | Qué es |
|---|---|
| `motor.mjs` | `Cadena` (física y medidas) y `Cuerda` (reloj musical, captación, salida) |
| `worklet.mjs` | El motor en el AudioWorklet; manda estado y medidas a la página |
| `tomas.mjs` | Los puntos de partida: cuerpo, golpe y nota |
| `index.html`, `interfaz.mjs` | Cadena, historia, tapiz de modos, brújula y controles |
| `renderizar.mjs` | Toma → WAV + JSON con traza de medidas cada 10 ms |
| `pruebas.mjs` | Las 15 pruebas |
| `muestras/` | M4A de las ocho tomas y la gráfica de recorridos |
