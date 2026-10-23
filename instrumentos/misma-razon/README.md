# La misma razón

Canek Zapata · 23 de octubre de 2026 · versión 0.1.0 (`misma-razon-0.1.0`).

```text
pulsos por segundo = f / K
```

> ¿Qué debe cambiar una voz para volver a encontrarse con las otras, y qué pierde al hacerlo?

Cada voz pulsa tantas veces por segundo como su frecuencia dividida entre K. Es
una **regla del instrumento**, no un hecho físico. La fase de cada voz se
**hereda** de un acorde al siguiente, así que cambiar una altura cambia cuándo
esa voz podrá volver a encontrarse con las demás. **La afinación escribe los
encuentros**: una llegada se puede preparar, demorar o dejar pasar casi
inadvertida.

## Antecedentes

- **El Rhythmicon** de Henry Cowell y Léon Theremin (1931), que conserva el
  Smithsonian. Relacionaba el armónico n con n pulsos.
- **En Rejilla:**
  - el **loop 01** relaciona el armónico h con h pulsos por segundo;
  - **El tiempo es la altura** construye un canon donde tempo y transposición
    cambian con la misma razón.

Lo propio de este instrumento es la fase heredada y el costo de encontrarse.
Esta formulación sale de la crítica de Canek a la primera propuesta.

## Lo que la ley dice, y lo que no

- **Decide cuánto pulsa una voz, no cómo suena una balada.** «Balada» es una
  intención compositiva. Acentos, conducción de voces, duración de los acordes y
  melodía son decisiones aparte.
- **El registro también decide el tiempo:** una octava arriba, el doble de
  pulsos.
- **Mayor y menor justos sobre la misma raíz audible R**, con ataques
  alineados al principio, vuelven a coincidir las tres voces en:
  - mayor `R·(1, 5/4, 3/2)`: **4K/R**;
  - menor `R·(1, 6/5, 3/2)`: **10K/R**.

  Con K = 3R, eso da 12 y 30 s. La diferencia viene de sus proporciones
  racionales, no de un origen «armónico» o «subarmónico». Una coincidencia total
  tardía tampoco implica que no haya coincidencias parciales.
- **«Subarmónico» no cambia nada por sí mismo.** F/6 : F/5 : F/4 son las mismas
  frecuencias que 10:12:15 sobre F/60: con F = 660 Hz, las dos dan 110, 132 y
  165 Hz. Bajo esta ley son el mismo objeto.
- **La ley es estricta.** No hay mapa del círculo ni lenguas de Arnold. Si
  alguna vez se permite que el ritmo se desvíe, habrá que declarar si f/K pasa a
  ser una tasa objetivo o una media.

## Dos maneras de llegar

Para que un grupo de voces ataque junto en un instante T:

1. **Desafinar.** Desde el inicio de una sección anterior, cada voz multiplica
   su frecuencia por un factor c, de modo que su fase llegue a un entero
   exactamente en T.
   - Se elige el entero más cercano, así que la pérdida es `|1200·log₂ c|` cents,
     y está acotada por `1200·log₂(1 + ½/A)`, donde A son los pulsos de la
     preparación.
   - **Prepararse desde lejos cuesta menos cents.**
   - La afinación modificada se mantiene en toda la preparación: también cambia
     los encuentros intermedios.
2. **Esperar.** Se conserva la afinación justa y se alarga el acorde anterior
   hasta que el grupo coincide dentro de τ. Las tasas son racionales, así que el
   patrón de ataques se repite con periodo P. Por eso esperar tiene tres
   respuestas posibles:
   - **llega**, con su demora;
   - **nunca**, si en todo un periodo no hay coincidencia, entonces no la habrá;
   - **no dentro de la espera**, si se agotó el tiempo permitido antes de P.

## La balada

Es una progresión I–vi–IV–V–I en entonación justa, con referencia do3 =
130,81 Hz y K = 130,81 Hz (do3 pulsa una vez por segundo). Tiene cuatro voces:

| Acorde | Bajo | Tenor | Alto | Soprano | Duración |
|---|---|---|---|---|---|
| I | do2 | mi3 | sol3 | do4 | 8 s |
| vi | la1 | mi3 | la3 | do4 | 8 s |
| IV | fa2 | fa3 | la3 | do4 | 8 s |
| V | sol2 | re3 | sol3 | si3 | 8 s |
| I | do2 | mi3 | sol3 | do4 | 10 s |

Cuatro versiones (la gráfica es `muestras/encuentros.png`):

| Versión | Qué hace | Encuentros de las cuatro voces | Lo que costó |
|---|---|---|---|
| [heredada](muestras/misma-razon-heredada-c3ecb092cb44.m4a) | Nadie prepara nada | 0, 4 y 8 s, y nunca más | — |
| [reiniciada](muestras/misma-razon-reiniciada-bca094b7aeb2.m4a) | Fases a cero en cada acorde | 12 encuentros: cada acorde aterriza | La llegada está programada, no compuesta |
| [cerca](muestras/misma-razon-cerca-abb984c75a75.m4a) | Tenor, alto y soprano se desafinan durante IV y V para atacar juntos al llegar a I | 0, 4 y 8 s; a los 32 s llegan las tres voces superiores, no el bajo | tenor +29,1 · alto +22,6 · soprano 0 cents |
| [lejos](muestras/misma-razon-lejos-52b394bd7592.m4a) | Las cuatro voces se desafinan desde el principio | 0, 32, 36 y 40 s | bajo +30,6 · tenor +14,5 · alto +11,4 · soprano 0 cents; **se pierden los encuentros de 4 y 8 s** |

Lo que mostró el cálculo:

- **Desafinar las cuatro voces cuesta según cuándo empieza la preparación.**

  | Preparación desde | Bajo | Tenor | Alto | Soprano |
  |---|---|---|---|---|
  | el principio | 30,6 | 14,5 | 11,4 | 0 |
  | IV | 50,2 | 29,1 | 22,6 | 0 |
  | V | 93,6 | 63,0 | 47,4 | 0 |

  Cifras en cents. El bajo, que pulsa más despacio, es siempre el más caro de
  convencer.
- **Esperar en V no sirve.** Con las fases que traen, tenor, alto y soprano
  **nunca** coinciden: el patrón se repite cada 2,667 s sin encuentro. Se
  verificó además en 300 s. Hay que cambiar algo.
- **Esperar en IV sí funciona para dos voces:** alto y soprano coinciden 2 s
  después.
- **Llegar desde lejos tiene otro costo:** desafinar desde el principio deshace
  los encuentros que el primer acorde tenía a los 4 y 8 s. Cuando las cuatro
  voces llegan juntas a I, el acorde final recupera sus encuentros cada 4 s.

## Síntesis

Es una interpretación declarada:

- La altura cambia en la frontera del acorde, con un deslizamiento de 60 ms y
  sin ataque nuevo.
- Cada pulso es una crecida de la voz: la voz nunca se calla.
- El timbre es aditivo, de 8 parciales, con formantes cerca de «o».
- Hay una sola ganancia para toda la pieza, con pico a −2 dBFS.
- Integrado: entre −13,9 y −14,5 LUFS según la versión.

## Abrir

```sh
python3 -m http.server 8767 --directory instrumentos/misma-razon
# http://127.0.0.1:8767/
node renderizar.mjs <heredada|reiniciada|cerca|lejos> salida.wav
node pruebas.mjs
```

En la página se puede preparar una llegada propia. Se eligen el acorde de
llegada, la estrategia (desafinar o esperar), desde dónde prepararse y qué
voces deben encontrarse. La página muestra lo que costó.

## Qué se comprobó

`node pruebas.mjs`: 16 pruebas, todas pasan.

- **La ley:** el intervalo entre ataques es K/f con error de 3·10⁻¹⁵ s.
- **Fases:**
  - el primer ataque de cada acorde sale de la fase heredada;
  - reiniciar programa la llegada.
- **Recurrencias:** 12 s y 30 s, calculadas y medidas en los ataques.
- **Equivalencia:** el menor «subarmónico» y el 10:12:15 son lo mismo.
- **Registro:** una octava da la mitad del periodo.
- **Desafinar:** las cuatro voces llegan exactamente a T desde tres puntos de
  preparación, dentro de la cota.
- **Esperar:** «nunca» verificado en 300 s; «llega» a los 2 s.
- **Fracciones** exactas.
- **Síntesis** reproducible y sin recorte.

En Chromium sin pantalla (Playwright) se probaron:

- las versiones, la llegada propia con «nunca» y «llega», la reproducción y la
  vista de 390 px;
- sin errores en la consola, y se miraron las capturas.

## Qué no se comprobó

- **Escucha humana.** El agente no escuchó las muestras.
- **Si suena a balada y no a maquinaria polirrítmica.**
- **Si los encuentros preparados se perciben como llegada.**
- **Si 30 cents de desafinación se oyen como pérdida o como color.**
- **τ = 25 ms** es una decisión de diseño para contar encuentros, no un umbral
  perceptivo medido.
- **No hay melodía.** Con esta K, los armónicos 8–16 de do3 quedarían entre
  do6 y do7, pulsando de 8 a 16 veces por segundo. Una melodía cantable necesita
  otra solución de registro.

## Archivos

| Archivo | Qué es |
|---|---|
| `razon.mjs` | Ley, ataques exactos, encuentros, recurrencias, desafinar y esperar |
| `balada.mjs` | La progresión y sus cuatro versiones |
| `sintesis.mjs` | El canto que se rearticula en cada pulso; lo usan la página y Node |
| `index.html`, `interfaz.mjs` | Línea de encuentros, llegada propia y escucha |
| `renderizar.mjs` | Versiones → WAV estéreo + JSON con ataques, encuentros y costos |
| `pruebas.mjs` | Las 16 pruebas |
| `muestras/` | M4A, JSON y la gráfica de encuentros |
