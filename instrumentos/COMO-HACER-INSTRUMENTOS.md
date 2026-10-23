# Cómo hacer instrumentos (y cómo un instrumento también puede ser net art)

Canek Zapata · Rejilla · 23 de octubre de 2026.

Guía de trabajo escrita a petición de Canek. Reúne lo que ya acordamos en
[INSTRUCCIONES-PARA-CREAR.md], [COMPOSITOR.md], *Matemáticas para componer*
(22 oct) y `WEB_DESIGN_PROTOCOL.exe`. La parte III propone un instrumento nuevo,
el **Arpa de umbral**, y su traducción a una pieza 2D y 3D.

Este documento es un diseño. No se construyó ningún motor ni se produjo o
escuchó audio. Los únicos cálculos ejecutados son los de la sección III.3, y se
pueden repetir con [`arpa-de-umbral/comprobar_rips.py`](arpa-de-umbral/comprobar_rips.py).

---

## I. Cómo hacer un instrumento

### 1. Qué llamamos instrumento

Un preset o un timbre no es todavía un instrumento. Un instrumento es un
**estado que evoluciona**, al que un gesto modifica y que alguien puede
escuchar. Las preguntas mínimas son cinco:

| Pregunta | Ejemplo en la campana p-ádica |
|---|---|
| ¿Qué guarda? (estado) | Desplazamiento y velocidad de 64 regiones |
| ¿Cómo cambia solo? (evolución) | Osciladores acoplados, Verlet, amortiguamiento |
| ¿Qué le hace el gesto? (excitación y control) | Golpe en una región; plegar el acoplamiento mientras suena |
| ¿Desde dónde se escucha? (observación) | Captación estéreo por familia módulo 8 |
| ¿Qué no puede hacer otro instrumento? | Cambiar quién es vecino de quién sin reiniciar la vibración |

Si la última respuesta es «nada», conviene usar un instrumento existente.
Rejilla ya tiene 231 fichas y varias familias en `research/rejilla/`.

### 2. Empezar por el gesto, no por la ecuación

Antes de escribir código, llenar esta ficha. Si una línea queda vacía, el
instrumento todavía no existe.

```text
NOMBRE PROVISIONAL:
GESTO PRINCIPAL:        (qué hace la mano: golpear, frotar, plegar, soplar, arrastrar…)
PREGUNTA COMPOSITIVA:   (qué relación nueva hace posible; ver Matemáticas para componer §1)
ESTADO:                 (variables, unidades, tamaño)
EVOLUCIÓN:              (ecuación o regla; continua o discreta)
OBSERVACIÓN:            (captación, mezcla, espacialización)
CONTROLES:              (qué parámetro consume cada control y cuándo)
INVARIANTE:             (qué se conserva al cambiar un control: fase, energía, desplazamiento…)
PÉRDIDA:                (qué se disipa o se olvida)
ACONTECIMIENTO:         (qué cambio de estado puede volverse forma musical)
TÉCNICA CONOCIDA:       (con fuente)
DECISIÓN ORIGINAL:      (lo que inventamos nosotros)
HIPÓTESIS PERCEPTIVA:   (qué creemos que se oirá; se verifica escuchando, no calculando)
PRUEBA QUE PUEDE FALLAR:
```

Las tres últimas líneas vienen de INSTRUCCIONES-PARA-CREAR: hay que distinguir
la técnica conocida, la decisión original y la hipótesis perceptiva.

### 3. Elegir la familia de técnica

| Técnica | Estado | Funciona bien para | Cuidado con |
|---|---|---|---|
| **Modal** (suma de resonadores) | Amplitud y fase por modo | Campanas, placas, golpes, cuerpos inventados | Sólo es lineal; modos y sus caídas deben salir de un modelo declarado |
| **Masa-resorte / red** | Desplazamiento y velocidad por nodo | Cuerpos cuyo acoplamiento cambia mientras suenan | Paso de tiempo y estabilidad; el trabajo que hacen los controles |
| **Guía de ondas** (Karplus-Strong, delays) | Líneas de retardo | Cuerdas, tubos, anillos | Afinación fina con retardo fraccional; pérdidas por filtro |
| **Fuente-filtro** | Excitación más formantes | Voces, bocas, vientos | Recorridos de formantes y prosodia |
| **FM / modulación** | Fases | Metales, electrónica | Las gráficas deben mostrar los índices, no sólo el espectro |
| **Red de retardos** (FDN) | Buffers y matriz | Salas, cámaras, memorias | Estabilidad: matriz unitaria o con pérdidas |
| **Espectral Rejilla** | Columnas complejas `Z[c,k]` | Escribir directamente el sonido como imagen | Declarar la ruta; el brillo no es energía acústica |

Se pueden combinar, pero hay que decir qué parte usa cada técnica.

### 4. Un solo motor, varios usos

Patrón que ya funcionó en la campana p-ádica:

```text
motor.mjs            física pura: estado + paso(dt) + excitar() + controles; sin DOM ni audio
├── worklet.mjs      AudioWorklet: el navegador toca en vivo
├── renderizar.mjs   Node: WAV offline, muestra por muestra, reproducible
├── instrumento.py   envoltura Python para Rejilla (llama a Node; no duplica ecuaciones)
└── pruebas.mjs      casos pequeños, controles, identidad worklet = render
```

Reglas:

- **No duplicar ecuaciones.** Si Python y JS calculan lo mismo por separado,
  tarde o temprano divergen.
- **Arreglos `Float64Array`** en el motor. Convertir a 32 bits sólo a la salida.
- **Cambiar un control nunca reinicia el estado.** Si es necesario reiniciar,
  hacerlo como un acto explícito («apagar»).
- **Semilla centralizada.** Nada de `Math.random()` disperso.
- El motor expone también **envolventes** (RMS por región en ventanas de 1024
  muestras, por ejemplo). Las imágenes las leen a ellas, no a la señal de audio
  (ver parte II).

### 5. La tabla que más importa: dato → control → evento

COMPOSITOR §10 dice que una variable guardada en JSON pero ignorada al
interpretar todavía no tiene consecuencia sonora. Para cada parámetro:

| Dato | Unidad | Control | Lo consume | Cuándo | Qué se oye | Cómo comprobarlo |
|---|---|---|---|---|---|---|
| (ej.) tensión | adimensional | perilla | rigidez K | cada muestra, rampa de 45 ms | separación de modos | autovalores antes y después |

Si una fila no tiene «Qué se oye», borrarla o explicar por qué se conserva.

### 6. Estabilidad, niveles y seguridad

- Verificar que la señal sea finita en cada bloque (`Number.isFinite`), sin DC
  y sin clipping.
- Integradores explícitos: comprobar el paso de tiempo contra la frecuencia
  modal más alta (para Verlet, `ω_max·dt < 2`).
- Si un control realiza trabajo (cambiar la rigidez cambia la energía), medirlo
  y limitarlo.
- Poner un limitador al final, y registrar si se activó.
- Las comparaciones secas mantienen la ganancia original. Sólo el máster se
  normaliza (la campana usó −18 LUFS; para escuchar en plataformas, −14 LUFS
  y −1 dBTP).

### 7. Pruebas que pueden fallar

1. **Caso pequeño calculable a mano**: 1, 2 o 4 nodos; frecuencia esperada
   contra frecuencia medida.
2. **Control que elimina la operación**: misma excitación sin la idea central
   (geometría fija, acoplamiento cero…). Si suena igual, la idea no llega al
   sonido.
3. **Continuidad**: cambiar un control a mitad de una nota no debe producir un
   clic, salvo que el clic sea el acontecimiento.
4. **Reproducibilidad**: misma partitura y misma semilla dan el mismo SHA-256 del
   WAV.
5. **Identidad en vivo y offline**: worklet = render, muestra por muestra.
6. **Escucha humana**: declararla aparte. Las pruebas numéricas no la sustituyen.

### 8. Entregables (resumen de INSTRUCCIONES-PARA-CREAR)

- Audio final y una muestra aislada del instrumento.
- Partitura editable y receta con parámetros, semilla y SHA-256.
- PNG final, PNGs numerados de etapas reales y gráficas del motor.
- GIF del proceso real: hasta 10 s y 15 MB.
- `proceso/README.md` con lo que se comprobó y lo que no.
- Carpeta de salida exclusiva: nombre, semilla y 12 caracteres de SHA. Nunca
  sobrescribir.

Para la biblioteca, una ficha en `biblioteca-de-instrumentos/fichas/`:

```json
{
  "id": "arpa-umbral",
  "nombre": "Arpa de umbral",
  "familia": "redes · cuerdas por proximidad (complejo de Rips)",
  "motor": "umbral",
  "fisica": { "c": 440, "epsilon": 1.0, "puntos": "hexagono", "perdida": 0.996 },
  "notas": "Una cuerda aparece entre dos puntos cuando su distancia no supera ε.",
  "procedencia": { "nace": "…", "fecha": "2026-10-23", "archivo": "…", "sha256": "…" }
}
```

### 9. Componer para él

Un instrumento se termina cuando una pieza lo necesita. COMPOSITOR §12 pide
proponer opciones A, B, C y una D extraña pero realizable. Después, una prueba
de oído: ¿la pieza se podría tocar con otro instrumento sin perder nada? Si la
respuesta es sí, todavía no compusimos para él.

---

## II. ¿El instrumento puede ser también net art en 2D o 3D?

Sí, cuando el estado del instrumento tiene **forma**: posiciones, conexiones,
regiones o un cuerpo. La campana 3D pop ya lo hizo: la escultura es el mismo
cuerpo que suena, y entrar en una familia cambia la escucha.

### 1. Un estado, varios observadores

```text
                motor.mjs (estado único)
        ┌──────────────┼──────────────────┐
   AudioWorklet     envolventes        geometría
   (oído)           RMS / energía      puntos, aristas, caras
        │              │                  │
     sonido         canvas 2D          WebGL 3D
```

Reglas, tomadas del protocolo (§14) y de lo que aprendimos en la campana:

- **El audio no depende del frame.** Corre en el worklet. Si la pestaña se
  congela, el sonido sigue o se detiene limpiamente.
- **La imagen no es un analizador de frecuencias.** Muestra el estado del cuerpo
  (dónde vibra, qué está conectado), no su espectro.
- **No fingir oscilación.** Dibujar la vibración real submuestreada a 60 fps
  produce aliasing. Mejor engrosar o iluminar según la envolvente RMS. En reposo,
  la escultura no aparenta resonar.
- **Golpe ≠ flash.** Buscar relaciones de demora, residuo o memoria.
- **La navegación puede ser un control del instrumento.** El scroll, la cámara o
  el historial pueden mover un parámetro con sentido, y hay que declarar cuál.

### 2. Ficha del protocolo para la versión net art

```text
OPERACIÓN POÉTICA:     ¿qué le pasa al lector cuando toca?
UNIDAD MÍNIMA:         ¿punto, cuerda, región, celda?
ACCIÓN DEL LECTOR:     ¿qué parámetro del motor mueve?
TRANSFORMACIÓN:        ¿qué cambia en el estado, no sólo en la pantalla?
FORMA DE MEMORIA:      ¿qué recuerda el sistema de este recorrido?
CONDICIÓN DE SALIDA:   ¿cómo se apaga, se abandona, se reinicia?
COSAS QUE NO DEBE PARECER: visualizador de Winamp, demo de Three.js, plantilla
```

### 3. Técnica y conservación

- **2D**: `<canvas>` o SVG. No hace falta ninguna biblioteca.
- **3D**: WebGL 2. Three.js vendorizado con versión fija y licencia en
  `PROCEDENCIA.json`, como en la campana.
- El audio empieza después de un gesto, porque así lo exigen los navegadores.
- Respetar `prefers-reduced-motion`, ofrecer control por teclado y una vista móvil
  pensada como traducción, no como reducción.
- Exportar una postal PNG con su receta y un WAV de la toma con su estado
  inicial. Así una sesión se puede reconstruir.
- Todo local: sin CDN ni servicios. Probar con capturas en escritorio y en móvil,
  y mirarlas.

---

## III. Instrumento nuevo: Arpa de umbral

### 1. Cuatro opciones (COMPOSITOR §12)

| | Idea | Matemática | Por qué sí | Por qué no todavía |
|---|---|---|---|---|
| A | **Arena que se redistribuye**: una membrana cargada de masas que se mueven por un plan de transporte óptimo; al moverse la masa cambian los modos | Transporte óptimo + membrana cargada | Primer motor de transporte en Rejilla; la imagen de la arena es natural | Los modos de una membrana cargada son caros de recalcular en tiempo real |
| B | **Anillo de tres promesas**: tres resonadores con afinaciones que no cierran el ciclo (0, 0, 100 cents) | Cohomología de un ciclo | Escena ya escrita en el documento de matemáticas | Es más una forma de pieza que un instrumento; se cruza con `monodromia-berry-ep2` y `criba-mobius-grisey` |
| C | **Arpa de umbral**: puntos en el plano; una cuerda aparece cuando dos puntos están a distancia ≤ ε; los ciclos sin rellenar suenan como anillos | Homología persistente (Vietoris–Rips) | La topología se vuelve acontecimiento audible y visible a la vez; es perfecta para net art | Hay que componer los nacimientos y las muertes, no sólo sonificarlos |
| D | **Cámara del octaedro**: extensión de C en la que el hexágono, a cierta escala, encierra una cavidad (β₂ = 1) en la que se puede entrar en 3D | Igual que C, dimensión 2 | Es extraña pero calculable (ver III.3) | Depende de que C funcione primero |

**Propuesta: C, con D como segundo movimiento.** C es el único territorio del
documento de matemáticas (homología persistente) que todavía no tiene
instrumento, y su estado ya es un dibujo.

### 2. Cómo funciona

**Estado.** n puntos `xᵢ` en el plano o el espacio (n ≤ 12), un umbral ε y,
por cada cuerda viva, su guía de ondas.

**Regla de Rips.** Para un ε dado:

- Una **arista** (cuerda) existe entre i y j si `d(xᵢ,xⱼ) ≤ ε`.
- Una **cara** (membrana) existe cuando sus tres aristas existen.
- Una **cavidad** existe cuando hay caras que encierran un volumen sin rellenar.

**Sonido** (decisiones originales, no simulación medida):

| Objeto topológico | Cómo suena | Física de referencia |
|---|---|---|
| Arista de longitud L | Cuerda fija en ambos extremos, `f = c / 2L` | Cuerda ideal: `f₁ = (1/2L)·√(T/μ)`. Con T y μ iguales en todas, la altura sólo depende de la longitud. Las cuerdas largas aparecen más tarde y suenan más graves. |
| Ciclo sin rellenar (β₁) | **Anillo**: una línea de retardo cerrada de perímetro P, `f = c / P`, alimentada por los puentes de sus cuerdas | Una cuerda cerrada sobre sí misma (condición periódica) |
| Cara (triángulo) | Membrana que acopla sus tres cuerdas y **amortigua el anillo** que la rodea | Analogía declarada: no simula una membrana real |
| Cavidad (β₂) | Cámara: red de retardos cerrada que sólo existe mientras la cavidad existe | Analogía declarada |
| Nacimiento o muerte de una clase | Acontecimiento: el anillo nace con un pulso suave y muere entregando su energía a las caras | Regla de diseño; la energía transferida se mide |

**Gestos:**

- **Pulsar** una cuerda: la excitación habitual.
- **Abrir o cerrar ε** con la rueda o el scroll: nacen y mueren cuerdas,
  membranas y anillos *mientras suenan*.
- **Arrastrar** un punto: cambian las longitudes, y con ellas las alturas por
  glissando continuo. En algún momento cambia la topología.
- **Respirar**: ε oscila lentamente según una partitura.

**Invariante.** Cambiar ε o mover puntos no reinicia las cuerdas que siguen
vivas. Al cambiar la longitud se conserva la energía de la guía de ondas,
interpolando el retardo fraccional. Una cuerda que muere entrega su energía a
las cuerdas vecinas en 30 ms, sin cortarse.

### 3. Lo que ya se calculó

Polígonos regulares de lado 1, con distancia euclidiana, complejo de Rips y
coeficientes en ℤ/2. Se obtuvo con `comprobar_rips.py` el 23 de octubre:

| Figura | ε | (β₀, β₁, β₂) | Lo que pasa |
|---|---|---|---|
| Cuadrado | 0.5 | (4, 0, 0) | Cuatro puntos sin cuerdas: silencio |
| | 1 – 1.41 | (1, 1, 0) | Cuatro cuerdas y un anillo vivo |
| | ≥ √2 | (1, 0, 0) | Llegan las diagonales, se rellena y el anillo muere |
| Pentágono | 1 – 1.61 | (1, 1, 0) | Cinco cuerdas y un anillo |
| | ≥ φ | (1, 0, 0) | Llegan las diagonales y el anillo muere |
| Hexágono | 1 – 1.73 | (1, 1, 0) | Seis cuerdas y un anillo |
| | √3 – 2 | **(1, 0, 1)** | Se forma un octaedro: aparece una **cavidad** |
| | ≥ 2 | (1, 0, 0) | Llegan las diagonales largas y la cavidad se llena |

Consecuencias armónicas, porque la altura es proporcional a 1/L:

- **Cuadrado**: el anillo muere exactamente cuando llegan las diagonales, que
  suenan un **tritono** debajo de los lados (√2 → 600 cents).
- **Pentágono**: las diagonales llegan una proporción áurea debajo (φ → 833
  cents, entre una sexta menor y una mayor).
- **Hexágono**: las diagonales cortas (√3 → 951 cents) crean la cavidad, y las
  largas, una **octava** debajo (2 → 1200 cents), la destruyen.
- **El anillo del cuadrado** (P = 4) suena `c/4`, una octava debajo de sus lados
  (`c/2`).

La escala de observación (ε) se oye como armonía que desciende. Cada polígono
lleva su intervalo característico. El hexágono es la opción D: una cámara que
sólo existe mientras las cuerdas más graves están entre 951 cents (entre una
sexta mayor y una séptima menor) y una octava debajo de los lados.

Estos cálculos verifican la topología y los intervalos ideales. No verifican
cómo suena el anillo, si la muerte del ciclo se percibe ni la estabilidad del
motor.

### 4. Tabla dato → control → evento (borrador)

| Dato | Control | Lo consume | Qué se oye |
|---|---|---|---|
| ε | rueda / scroll / partitura | conjunto de aristas, caras y cavidades | nacen y mueren cuerdas, anillos y cámara |
| posición `xᵢ` | arrastre | longitudes → retardos | glissandi; cambios de topología |
| c | perilla «tensión» | todas las alturas | transposición global sin cambiar la topología |
| pérdida | perilla «apagado» | filtro de lazo | caída de cuerdas y anillos |
| peso de membrana | perilla | acoplamiento y amortiguación del anillo | qué tan rápido «se rellena» un hueco |
| captación | cámara (3D) / cursor (2D) | mezcla por distancia al oyente | qué parte del cuerpo oímos |

### 5. Pruebas que pueden fallar

1. La cuerda de L = 1 con c = 440 suena a 220 Hz, medido por autocorrelación.
2. El anillo del cuadrado suena una octava debajo de sus lados.
3. Control: misma excitación con «membrana = 0». El anillo **no** debe morir al
   llegar las diagonales. Si suena igual con y sin membrana, la topología no
   llega al sonido.
4. Abrir ε de 0.9 a 1.5 durante una nota: no hay clics, la energía es continua y
   se registra cuánta energía transfiere la muerte del anillo.
5. Los números de Betti del motor en tiempo real coinciden con
   `comprobar_rips.py` en los tres polígonos.
6. Reproducibilidad: el SHA-256 del WAV es igual en dos renders.

### 6. Como pieza de net art

**2D: «Lo que el umbral teje»** (canvas, sin bibliotecas)

```text
OPERACIÓN POÉTICA:  bajar la página es cambiar la escala desde la que se mira;
                    las relaciones que parecían un hueco se rellenan.
UNIDAD MÍNIMA:      punto de tinta.
ACCIÓN DEL LECTOR:  scroll = ε; clic = pulsar; arrastre = mover un punto.
TRANSFORMACIÓN:     cuerdas como líneas cuyo grosor es su RMS real;
                    membranas como velos translúcidos;
                    un ciclo vivo es un hueco que todavía brilla por dentro.
FORMA DE MEMORIA:   abajo se dibuja el código de barras de persistencia del
                    recorrido del propio lector: cuándo nació y murió cada hueco
                    mientras bajaba y subía. Volver a subir no borra ese registro.
CONDICIÓN DE SALIDA: subir hasta ε = 0 deja sólo puntos y silencio; la barra queda.
NO DEBE PARECER:    diagrama de un libro de topología, ni visualizador.
```

**3D: «Cámara del octaedro»** (WebGL 2)

- Los puntos viven en el espacio; el hexágono puede desplegarse.
- Cuando ε pasa √3, el cuerpo se cierra en un octaedro, y el lector puede
  **entrar**: la cámara dentro de la cavidad activa la escucha de la cámara.
- Cuando ε llega a 2, la cavidad se llena y el lector queda fuera.
- Es la misma lógica de Inside/Outside de la campana 3D pop, con una diferencia:
  aquí el interior existe sólo durante un intervalo de escala.

### 7. Siguientes pasos, si se autoriza

1. Escribir `motor.mjs` con las cuerdas (guías de ondas con retardo fraccional),
   los anillos y las membranas, más el cálculo incremental del complejo
   (n ≤ 12 da como máximo 66 aristas y 220 triángulos).
2. Escribir `renderizar.mjs` y las pruebas 1–6. Sacar las primeras muestras:
   cuadrado abriendo ε, y la misma toma con membrana = 0.
3. Hacer la versión 2D, con capturas en escritorio y móvil.
4. Escuchar, y sólo entonces componer la pieza y decidir si D merece existir.

[INSTRUCCIONES-PARA-CREAR.md]: https://github.com/canekzapata/rejilla/blob/main/INSTRUCCIONES-PARA-CREAR.md
[COMPOSITOR.md]: https://github.com/canekzapata/rejilla/blob/main/research/rejilla/COMPOSITOR.md
