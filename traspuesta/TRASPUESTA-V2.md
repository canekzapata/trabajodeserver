# El futuro de Traspuesta (Traspuesta v2)

Canek Zapata · Rejilla · 23 de octubre de 2026.

Documento de diseño escrito a petición de Canek. Para escribirlo se leyó el
código de `research/montanas-topograficas/` y las partituras de Rejilla que leen
terreno. No se ejecutó Traspuesta ni se produjo audio. Las fórmulas que se
proponen vienen con su fuente o se marcan como decisión de diseño.

> **traspuesta** · f. Elevación del terreno que impide ver lo que hay detrás de ella.
> (María Moliner, citada en el atlas)

---

## 1. Qué es Traspuesta hoy

Es una edición de **2 000 láminas topográficas para plotter**. Cada semilla:

- levanta un terreno de uno de **24 arquetipos** (monte aislado, cordillera,
  cañón, estratovolcán, karst, atolón, meandros, tierras malas, tepuyes…);
- tiene una escala física (ancho en km, relieve en m, altitud base);
- se forma por **eras**: algunos arquetipos guardan una historia, como
  «sedimentos en capas → plegamiento → erosión»;
- se erosiona, abre ríos y lagos, y mide cimas, collados, cráteres, coladas,
  cenotes, tómbolos…;
- **pone a cada rasgo un nombre que es cierto**: el glosario (Moliner, INEGI
  1:50 000, USGS/GNIS) sólo permite «cerro» o «cueto» si la medida cumple la
  definición;
- se dibuja en 8 hojas (perfiles, curvas, díptico, torre, bloque, proyección,
  historia en cuatro tiempos, corte A–A′) y 3 registros, con letra de un solo
  trazo para la pluma.

El núcleo es determinista y corre igual en navegador y en Node
(`nucleo.js`, `terreno.js`). Misma semilla, misma montaña.

### Lo que la música ya tomó de Traspuesta

Al menos 16 partituras de `research/rejilla/` mencionan el terreno o Traspuesta en su código. Dos ejemplos:

- **Lo que el agua dibuja** (Tierras malas 67): el perfil de la cárcava Yucha
  Ka'nu es la partitura del slide. La lluvia es una nube de glisandos al estilo
  de Xenakis, y cada gota erosiona con la ley de potencia de corriente, así que
  el coro siguiente toca la cárcava ya cambiada.
- **Lo que tapa la traspuesta** (terreno 420048): el relieve de 2 750 m con
  curvas cada 250 m da una escala de 11 escalones que no repite la octava. Sus
  grados son las cumbres de las siluetas, y la cancioncilla canta las cumbres en
  orden.

### Lo que todavía no se usa

1. **La palabra misma.** Traspuesta es *lo que impide ver lo de atrás*. La
   música todavía no tiene *lo que impide oír lo de atrás*.
2. **Quien escucha.** Casi siempre la pieza recorre el terreno, pero nadie está
   parado en él. El trueno de *Lo que el agua dibuja* es la excepción, y
   funcionó.
3. **El tiempo del mundo.** Las eras y la historia en cuatro tiempos existen en
   el visor, pero las piezas leen sobre todo el estado final.
4. **La edición como continente.** Cada pieza toma una lámina. Las 2 000 no
   forman un mundo continuo, aunque `panorama.js` ya cose varias.
5. **Un contrato de datos.** Cada partitura vuelve a leer `h-*.f32` y calcula
   sus propias medidas. No hay una API musical común.

---

## 2. La idea central de la v2: la escucha como traspuesta

**Traspuesta v1 calcula lo que se ve. Traspuesta v2 calcula también lo que se
oye, desde dónde y qué se tapa.**

Se coloca a alguien que escucha en un punto del terreno y fuentes sonoras en
otros: un río, un pájaro, un pueblo, el viento en un collado. Entre cada fuente
y quien escucha, el relieve decide:

| Fenómeno | Cálculo | Fuente o estatus |
|---|---|---|
| **Visibilidad** | Línea de visión sobre el perfil entre fuente y oyente (viewshed) | Técnica estándar de SIG |
| **Sombra acústica de una cresta** | Diferencia de camino δ por encima del filo, número de Fresnel `N = 2δ/λ` y atenuación aproximada `ΔL ≈ 10·log₁₀(3 + 20N)` dB | Aproximación de Maekawa para barrera delgada. Depende de la frecuencia: los graves rodean la montaña y los agudos se pierden |
| **Retardo** | Distancia / 343 m/s | Ya se usa con el trueno |
| **Divergencia** | −6 dB por cada vez que se duplica la distancia (fuente puntual) | Física básica |
| **Eco en una pared** | Reflexión en el acantilado o cañón más cercano, con retardo 2d/c | Decisión de diseño: se elige qué pared refleja |

Con esto, **lo que la cresta tapa se convierte en un filtro paso bajo que
depende del lugar**. Caminar es componer: al subir al collado aparece de golpe
el agudo del río del otro valle; al bajar se apaga primero el brillo y queda el
grave.

Esto no es una metáfora. Es una operación que se puede medir y que falla si el
terreno no la produce: en una llanura de meandros sin crestas, la v2 debe
sonar casi igual que la v1.

**Hoja nueva para la pluma: «curvas de escucha».** Para una fuente dada, las
líneas de igual atenuación sobre la planta. Se trazan con la misma pluma que
las curvas de nivel y muestran por dónde «se oye» el río. Es la primera hoja de
Traspuesta que dibuja algo que no se ve.

---

## 3. Capas nuevas del mismo mundo

Ninguna capa cambia las alturas de la v1 (ver §5). Cada capa declara su ley,
lo que la música consume y una prueba que puede fallar.

### 3.1 Agua que llega tarde

- **Ley.** Acumulación de flujo sobre la red de drenaje que ya existe. Una
  tormenta tarda en llegar a la boca (tiempo de concentración) y produce un
  hidrograma con subida, pico y recesión.
- **Música.** La lluvia cae arriba y la crecida llega abajo minutos después: un
  crescendo retardado y una forma con consecuencia. Los afluentes entran en el
  orden real de su distancia.
- **Prueba.** Con la misma tormenta, el pico tarda más en una cuenca larga que en
  una corta.

### 3.2 Sol y sombra a lo largo del día

- **Ley.** Insolación por pendiente y orientación (sombreado de relieve) para
  cada hora, con sombra proyectada por las crestas.
- **Música.** Una pieza que dura un día: cada ladera entra a la luz como una voz.
  Una barranca honda sólo tiene unos minutos de sol, y ese es su solo.
- **Prueba.** La ladera norte recibe menos horas que la sur, en el hemisferio
  declarado.

### 3.3 Viento en los collados

- **Ley.** Exposición y encauzamiento: el viento se acelera en los collados y
  puertos que ya se miden y nombran. Es una aproximación declarada, no
  dinámica de fluidos.
- **Música.** Los collados son tubos. Se reutilizan los motores de viento y
  garganta de *Lo que tapa la traspuesta* (`motor/viento.js`, `sondas/tubo.cjs`)
  con el largo y el ancho medidos del collado.
- **Prueba.** Un collado más estrecho da una altura más aguda en el modelo de
  tubo.

### 3.4 Pisos de vida

- **Ley.** Franjas por altitud y orientación (pisos de vegetación), declaradas
  como regla de diseño y no como ecología real de un lugar.
- **Música.** Cada piso tiene su fauna sonora. Los pájaros de `aves-que-aprenden`
  sólo cantan en su franja, y una pieza que sube cambia de coro.
- **Prueba.** Mover el límite de la franja cambia quién canta, y no sólo el color.

### 3.5 Caminos y pueblos

- **Ley.** Ruta de menor esfuerzo con la función de Tobler,
  `v = 6·e^(−3.5·|S + 0.05|)` km/h, donde S es la pendiente. Los pueblos se
  ponen en sitios elegidos por regla: agua cercana, poca pendiente, un collado
  como paso.
- **Música.** El recorrido dura lo que tarda una persona: la subida es lenta y
  densa, la bajada rápida. Entre dos pueblos, el transporte óptimo de *Matemáticas
  para componer* §7 decide qué voces viajan por qué camino.
- **Prueba.** La ruta calculada rodea el cerro en vez de cruzarlo cuando la
  pendiente lo justifica, y el tiempo de ida es distinto del de vuelta.

### 3.6 Nombres que se cantan

- **Ley.** Ya existe: el nombre es verdadero respecto de la medida.
- **Música.** Los topónimos dan prosodia y vocales a la voz de Sabina y al
  fonetizador. El orden en que aparecen al caminar da el texto.
- **Cuidado.** Los nombres en mixteco u otras lenguas y sus glosas deben
  revisarse con hablantes antes de cantarlos como si fueran correctos.

### 3.7 Tiempo geológico

- **Ley.** Las eras que el visor ya calcula: «sedimentos → plegamiento →
  erosión».
- **Música.** La forma de la pieza es la historia del terreno. Cada era es una
  sección, y la retícula de *Lo que tapa la traspuesta* se puede recalcular en
  cada era: la escala cambia porque cambió el relieve.
- **Prueba.** Las alturas de la escala de la primera era son distintas de las de
  la última.

---

## 4. La edición como continente

- **Coser** las 2 000 láminas en un solo mundo con bordes continuos. `panorama.js`
  ya cose seis para la portada. Hay que declarar si se cose por arquetipo, por
  semilla vecina o por regla.
- **Viajes entre láminas.** Una pieza puede ser un recorrido de una lámina a otra,
  del atolón a las tierras malas, con caminos (§3.5) y escucha (§2).
- **Tiempo real.** Enlazar con `netart/pais-que-se-calcula`, cuyo autómata crece
  una celda por segundo desde el 2 de octubre de 2026. El continente tendría una
  orilla que avanza, y la misma pieza sonaría distinta según la fecha, sin dejar
  de ser reproducible con la fecha como dato.

---

## 5. Arquitectura técnica

### No romper la v1

Las 2 000 semillas de la v1 quedan **selladas**: misma semilla, mismo terreno,
mismos nombres. La v2 sólo añade capas que leen el terreno; no lo cambian. Toda
salida lleva `version: 'traspuesta-2.x'` y la huella del terreno de origen.

### Un contrato de datos para la música

Hoy cada partitura lee el terreno por su cuenta. La v2 propone un módulo común,
determinista y compartido entre navegador, Node y Python, igual que el núcleo:

```text
MT.terreno(s)                    → T (ya existe)
MT.nombra(T, s)                  → rasgos con nombre (ya existe)
MT.escucha(T, oyente, fuentes)   → por fuente: visible, δ, atenuación por banda, retardo
MT.cuenca(T)                     → red, acumulación, tiempos de concentración
MT.sol(T, hora, latitud)         → insolación y sombra
MT.camino(T, a, b)               → ruta de Tobler, tiempos de ida y vuelta
MT.paquete(s)                    → JSON musical: perfiles, rasgos, cuencas, collados,
                                   escala por curvas, con versión y SHA-256
```

`python herramientas/traspuesta.py <semilla>` llamaría a Node, como hace la
campana con `campana.py`, y devolvería el paquete. Así no se duplican
ecuaciones entre Python y JavaScript.

### Rendimiento

La escucha se calcula sobre una malla reducida (por ejemplo 90 × 90) para el
mapa y a resolución completa sólo sobre el perfil fuente-oyente. En el
navegador va en un worker (`obrero.js` ya existe para eso).

---

## 6. Traspuesta v2 como net art

**«Lo que no se oye detrás»**, un atlas que se escucha:

- La lámina se ve como siempre, trazada por la pluma.
- Al hacer clic, quien lee se para en el terreno y empieza a escuchar.
- Arrastrar es caminar: el río aparece y desaparece detrás de las crestas, y el
  eco responde desde el cañón.
- Las curvas de escucha se trazan después, como memoria del recorrido: la hoja
  conserva por dónde se oyó.
- La salida es la postal: la lámina con su recorrido y sus curvas de escucha, en
  PNG y en SVG para plotter, con receta.

Siguiendo `WEB_DESIGN_PROTOCOL.exe`:

- El audio corre en un AudioWorklet y no depende del frame.
- La imagen no es un analizador.
- El silencio detrás de una cresta es parte de la obra, no un error.

---

## 7. Lo que no hay que hacer

- **Datos sin consecuencia.** Si una capa no cambia lo que se oye, no entra en la
  partitura (COMPOSITOR §10).
- **Fingir geografía real.** Traspuesta es un mundo inventado con leyes reales y
  exageraciones declaradas («miles de años en tres tormentas»).
- **Atribuir a la naturaleza una regla elegida** (COMPOSITOR §9). Los pisos de
  vida y los pueblos son decisiones de diseño.
- **Romper semillas viejas** al «mejorar» el generador.
- **Que cada pieza use todas las capas.** Una pieza elige una o dos.

---

## 8. Hoja de ruta propuesta

| Versión | Contenido | Primera prueba |
|---|---|---|
| 2.0 | Contrato de datos (`MT.paquete`) + **escucha y oclusión** + hoja «curvas de escucha» | Lámina de cañón: fuente en el fondo, oyente arriba y oyente detrás de la cresta; medir atenuación por banda |
| 2.1 | Agua que llega tarde + sol por hora | Hidrograma de Tierras malas 67 comparado con una cuenca corta |
| 2.2 | Caminos de Tobler + pueblos + viento en collados | Ida ≠ vuelta; collado estrecho más agudo |
| 2.3 | Pisos de vida + nombres cantados (con revisión de lenguas) | Mover la franja cambia el coro |
| 2.4 | Continente cosido + enlace al País que se calcula | Bordes continuos; misma fecha, misma pieza |

**Primera pieza sugerida para estrenar la v2:** volver a *Lo que tapa la
traspuesta* con su terreno 420048, pero ahora desde dentro. La cancioncilla del
niño se oye desde el otro lado de la cumbre y llega primero sin agudos. Al
llegar al collado se oye completa. Es la misma pieza, y ahora el título es
literal.

---

## 9. Qué se comprobó y qué no

- **Leído:** `terreno.js`, `nucleo.js`, `lamina.js`, `atlas.js`, `obrero.js`,
  `panorama.js`, `vistas.js`, `visor.js`, la toponimia y `edicion.json` (2 000
  filas). También la partitura de *Lo que tapa la traspuesta* y el diseño de *Lo
  que el agua dibuja*.
- **No ejecutado:** ni Traspuesta ni ninguna capa nueva. No hay audio ni medición
  de atenuación.
- **Fórmulas:** Maekawa y Tobler son aproximaciones empíricas conocidas. Su
  precisión en un terreno inventado y su efecto perceptivo están por
  comprobarse.
