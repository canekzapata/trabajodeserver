# Bucle

Canek Zapata · 23 de octubre de 2026 · versión 0.1.0 (`bucle-0.1.0`).

> Sólo suena lo que puede sostener su propio regreso.

Escribes una frase y le impones un regreso. Para que la frase y su regreso
pertenezcan a la misma historia, algo tiene que cambiar. El instrumento busca
lo mínimo que debe ceder, según las prioridades que declares, y lo deja oír:
la frase tal como la escribiste, después la historia reescrita, en la que tu
intervención adquirió antecedentes que no tenía.

Viene de *Nóstos de nadie*: la distancia entre lo que se envía y lo que vuelve
como relato. La reformulación del modelo es de Canek. Separó tres marcos que
la propuesta inicial mezclaba (realimentación de audio, simetría de conjuntos y
consistencia cuántica) y corrigió qué promete cada uno.

## Qué modelo es, y cuál no

**Es un modelo clásico y discreto**, inspirado en los problemas de consistencia
con curvas temporales cerradas que estudian Friedman, Novikov y colaboradores
(1990).

- **No implementa** ese principio, que es una hipótesis sobre escenarios
  físicos y no una ley establecida.
- **Tampoco es el modelo de Deutsch** (1991), que usa operadores de densidad y
  tiene estados fijos incluso donde la descripción clásica es inconsistente.

El modelo, paso por paso:

- **Tiempo:** un ciclo de L pasos, que es la curva cerrada. Una nota es
  `(t, p)`: un paso y una altura MIDI.
- **El regreso** manda cada nota d pasos al pasado y la transpone n semitonos
  dentro de su octava:

  ```text
  R(t, p) = (t − d mod L,  12·⌊p/12⌋ + (p + n) mod 12)
  ```

- **Consistencia.** Una historia H es consistente si `R(H) = H`. Cada nota es el
  regreso de otra, y también lo son las tuyas. La ganancia es unitaria: lo que
  vuelve no se debilita. Por eso la historia puede sostenerse sin entrada nueva.
- **Las órbitas.** Cada nota recorre una órbita: una curva cerrada en el toro
  `Z_L × Z_12`, de tamaño `mcm(L/mcd(d,L), 12/mcd(n,12))`. La historia mínima que
  contiene una frase es la unión de sus órbitas, y **siempre existe**. La
  imposibilidad sólo aparece cuando se añaden restricciones que pueden chocar.

## Las restricciones y la negociación

- **Lo que la historia no admite:** más de k voces en un paso, o ciertas clases
  de intervalo sonando juntas en un paso (por omisión, el semitono). Las dos
  restricciones son monótonas: añadir notas nunca repara una violación. Eso
  permite una búsqueda exacta.
- **Lo que la frase puede ceder.** Cada nota puede:
  - quedarse;
  - mover su altura ±1–3 semitonos;
  - mover su ataque ±1–2 pasos;
  - callar, con un costo declarado o prohibido.

  La prioridad decide qué cuesta:
  - **ataques:** los pasos no se mueven y ceden las alturas;
  - **alturas:** las alturas no se mueven y ceden los ataques;
  - **mixto:** las dos cuestan lo mismo.
- **La búsqueda** es por ramificación y poda. Termina en una de tres respuestas
  distintas:
  - **óptima:** la búsqueda fue completa. Da el costo mínimo y cuántas historias
    empatan. La regla de elección entre empates es la primera en el orden
    declarado: quedarse, alturas antes que ataques, arriba antes que abajo,
    después antes que antes.
  - **presupuesto agotado:** no concluye nada. No es una prueba de imposibilidad.
  - **ninguna:** la búsqueda fue completa y las restricciones son incompatibles
    con la frase.

  Que el cálculo no converja no es lo mismo que no haya solución.
- **Callar.** Si callar está permitido, la historia más barata puede ser el
  silencio: la frase no llega a sonar.

## Qué se escucha

Son objetos distintos, y cada uno tiene su botón:

| Botón | Qué es |
|---|---|
| la frase como la escribiste | u, antes de negociar, sin bucle |
| la historia | H completa, en bucle |
| tus notas | la frase después de ceder, u′ ⊂ H |
| sólo lo que volvió | H ∖ u′ |
| la reescritura completa | u → H (3 vueltas) → H ∖ u′ → H (2 vueltas) |

Hay dos timbres: **madera** para tus notas, que también son regresos, y
**vidrio** para las que sólo volvieron. Es una interpretación declarada, no un
dato del modelo.

## Otro modelo, separado: regreso con pérdida

`ecoConsistente()` resuelve `x = R_g(u + x)` en tiempo lineal, con adelanto Δ,
transposición n y ganancia `0 < g < 1`. Es contractivo y tiene solución única,
`x = Σ R_g^k(u)`, truncada bajo un umbral declarado. Sin entrada, su única
solución es el silencio. Los regresos preceden a la nota que los causa porque
el adelanto está en la transformación, no porque lo dé el punto fijo.

Con transposición de 4 y g = ½, un do da do–mi–sol♯. El conjunto es invariante,
pero las amplitudes no: 1,143 / 0,571 / 0,286. Este modelo está en el motor y en
las pruebas. La página usa el discreto.

## Simetrías de transposición

Comprobado sobre los 4096 conjuntos de clases de altura, con la tabla de Canek:

| Transposición | Órbita mínima con do | Conjuntos invariantes |
|---|---|---|
| 3 semitonos | do–mi♭–fa♯–la | 8 (uniones de esas órbitas) |
| 4 semitonos | do–mi–sol♯ | 16 |
| 2 semitonos | escala de tonos enteros | 4 (una, ambas o vacío) |
| 7 semitonos | total cromático | 2 (cromático o vacío) |

El bucle conduce a estructuras que también organizan los modos de transposición
limitada de Messiaen. No reproduce su catálogo.

## Muestras

Las dos usan la misma frase (do4 re4 mi♭4 sol4 do♯4 fa4 en los pasos 1, 3, 4,
7, 9 y 13) y el mismo regreso: L = 16, d = 4 y n = 4. Una órbita tiene 12 notas.
La restricción es de 4 voces por paso y sin semitonos. Lo que cambia es la
prioridad:

| Muestra | Prioridad | Lo que cedió | Historia | Nivel |
|---|---|---|---|---|
| [ataques](muestras/bucle-ataques-931ea0945857.m4a) | conservar ataques | do4 → do♯4; sol4 → fa♯4 (2 empatan) | 6 tuyas + 30 que volvieron | −17,3 LUFS · −2,0 dBTP |
| [alturas](muestras/bucle-alturas-9dea6a221ea2.m4a) | conservar alturas | do4 y sol4, un paso después (única) | 6 tuyas + 42 que volvieron | −16,5 LUFS · −2,0 dBTP |

Sin negociar, la clausura tendría 60 notas y violaría las restricciones. Con el
mismo costo (2), conservar los ataques produce una historia de 36 notas y
conservar las alturas, una de 48. Lo que se prioriza cambia el tamaño del mundo
que sostiene la frase.

Forma de cada muestra (26,4 s): la frase sola (5,2 s) → la historia, 3 vueltas
de 3,2 s → sólo lo que volvió → la historia, 2 vueltas. Hay una sola ganancia
para toda la pieza, con pico a −2 dBFS. Cada JSON trae la negociación completa,
y la huella es del WAV PCM16. Las capturas `muestras/negociacion-*.png` y
`ninguna-historia.png` son de la página real.

## Abrir

```sh
python3 -m http.server 8766 --directory instrumentos/bucle
# http://127.0.0.1:8766/
node renderizar.mjs ataques salida.wav   # o alturas | mixto
node pruebas.mjs
```

## Qué se comprobó

`node pruebas.mjs`: 19 pruebas, todas pasan.

- **Simetrías:** la tabla anterior sobre los 4096 conjuntos.
- **Órbitas:** el tamaño de órbita es el esperado en todas las combinaciones con
  L = 8, 12 y 16.
- **Clausura:** es consistente, contiene la frase, y toda nota es regreso de otra.
- **Regreso con pérdida:**
  - silencio sin entrada;
  - punto fijo con residuo relativo 6·10⁻⁵ bajo el truncado;
  - los regresos son anteriores a su causa;
  - amplitudes no invariantes.
- **x = −(1+x):** la iteración alterna, aunque la solución −½ existe.
- **Negociación:**
  - es óptima, cumple las restricciones y es consistente;
  - cada prioridad conserva lo que dice conservar;
  - «ninguna» aparece por búsqueda completa;
  - callar permitido da el silencio;
  - presupuesto agotado no se confunde con imposibilidad.
- **Poda exacta:** mismo costo y mismos empates que la fuerza bruta.

En Chromium sin pantalla (Playwright) se probaron:

- negociar con dos prioridades, reproducir en bucle, «ninguna historia» y la
  vista de 390 px;
- sin errores en la consola, y se miraron las capturas.

## Qué no se comprobó

- **Escucha humana.** El agente no escuchó las muestras.
- **La pregunta central.** Si se percibe que la frase «adquirió antecedentes», y
  si la diferencia entre prioridades es audible más allá del número de notas.
- **Entrada en vivo.** Tocar la frase con teclado mientras corre el bucle y
  después reescribirla aún no existe. Por ahora la frase se escribe en la
  rejilla.
- **Duración y dinámica.** El modelo sólo negocia alturas y ataques; duración,
  dinámica y registro no entran todavía.
- **Elegir entre empates.** No hay regla para elegir «la más cercana a la frase
  anterior» en una sesión con varias frases.
- **Referencias.** Las de Friedman et al. (1990) y Deutsch (1991) se citan como
  las situó Canek; no se abrieron en esta sesión.

## Archivos

| Archivo | Qué es |
|---|---|
| `bucle.mjs` | Regreso, órbitas, clausura, negociación, regreso con pérdida, simetrías |
| `sintesis.mjs` | Timbres, vueltas y reescritura; la usan la página y Node |
| `interfaz.mjs`, `index.html` | Rejilla, hilos de las órbitas, negociación y escucha |
| `renderizar.mjs` | Las muestras como WAV + JSON |
| `pruebas.mjs` | Las 19 pruebas |
| `muestras/` | M4A, JSON de negociación y capturas |
