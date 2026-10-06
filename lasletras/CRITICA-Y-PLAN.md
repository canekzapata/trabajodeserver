# Crítica y plan — *las letras* / ESPACIO ESCULTÓRICO

*6 de octubre de 2026 · leída en v0.21 · con la vara de `APRENDIDO.md` de *Traspuesta*.*

El plan tiene cuatro partes: **crítica → mejoras → álbum → nombres para llamar a las
esculturas**. Todo lo que se afirma aquí se midió sobre la serie real (semillas `1…1500`
con `experimentos/medir.js`; empaste en 600 semillas con `experimentos/empaste.js`) o se
vio en la muestra `experimentos/muestra-1-16.png`. Lo que no se midió, se marca.

---

## 0. En una línea

*Las letras* tiene **un motor de formas riquísimo y un gesto temporal fuerte (la escritura)**,
pero hoy **la letra no se lee, la frase no causa nada en 4 de cada 5 piezas, nada es común y
nada es raro, y las esculturas no tienen nombre**. *Traspuesta* cerró porque cada rótulo salía
del dato, la rareza se medía y cada lámina tenía nombre. Eso es lo que le falta a esta.

---

## 1. Lo que hay, medido

| | v0.21 |
|---|---|
| Especies | genealogía 58 % · ensamblajes 18 % · arco 8.5 % · espera 6 % · entrelazada 5 % · no euclidiana 4 % |
| Estructuras de la genealogía | 34, **ninguna arriba de 4.3 %** (la más común: MASA ARQUEADA) |
| Cubiertas | 14; NINGUNA 8.7 %, ANILLO SUPERIOR 8.1 %… |
| Alfabetos | 24, entre 2 % y 5.3 % cada uno (casi plano) |
| Frases | 98 en total; una frase sale hasta **41 veces** en 1 500 |
| Instrucciones leídas de la frase | **HABITAR (ninguna palabra clave) 40 %** |
| Signos por pieza | p10 845 · mediana 1 597 · p90 3 867 · máx **13 355** |
| Cuerpo de letra | p10 21 px · mediana 26 · p90 33 (de 9 a 34 según el encuadre) |
| Ocupación del eje corto | mediana 0.83, p10 0.58 (el loop v0.20 funcionó) |
| **Empaste** (signos con un vecino a menos de 0.45 cuerpos) | arco **19 %** · espera 63 % · ensamblajes 71 % · genealogía **82–89 %** · entrelazada 89 % |
| Construcción | 5 ms la mediana, 80 ms el peor caso: hay margen de sobra para medir |

---

## 2. Crítica

### 2.1 El motor

**Lo fuerte.**
- La **genealogía** (planta / estructura / vacío / cubierta / anexo / deformación) es una
  gramática de verdad, no una permutación. Y el catálogo es hermoso y tiene genealogía
  propia: la serpiente de Goeritz, el hipar de Candela, el hiperboloide de Shújov, Möbius.
- **La regla de grosor (v0.21)** es la mejor decisión reciente: el cuerpo restringe el
  alfabeto sin gastar más azar. Es el mismo tipo de regla que en *Traspuesta* "un nombre
  sólo sale donde el terreno cumple": el signo sólo sale donde el cuerpo lo aguanta.
- Determinismo real, forks por rasgo en muchos sitios, construcción rapidísima.

**Lo débil.**

1. **La frase es coartada en el 78 % de la serie.** En `build()` la frase se interpreta
   (`Corpus.interpretar`), pero sólo `arco`, `espera`, `entrelazada` y `noeuclidiana` leen esa
   interpretación. **La genealogía y los ensamblajes (58 % + 18 %) sólo copian los nombres
   de las instrucciones a la geometría; la frase no les mueve un vóxel.** Además la frase se
   elige *después* de la especie y de su lista: la forma escoge la frase, no al revés. Y en
   las especies donde sí actúa, 40 % de las frases no traen ninguna palabra clave (HABITAR).
   El README dice "frases como cargas". Hoy es falso para casi todas las láminas. *Traspuesta*
   lo diría así: **un rótulo que no sale del dato es decorativo.**
2. **Nada es común, así que nada es raro.** 34 estructuras entre 0.3 % y 4.3 %, 24 alfabetos
   entre 2 % y 5 %, 14 cubiertas. Es la misma enfermedad que *Traspuesta* curó con `FRANJAS`
   ("las montañas deberían ser lo común"): cada forma nueva le quitó sorteo a las demás, y
   ya no hay clásicos. El "motivo recurrente arco + anillo" que el README promete existe,
   pero se pierde entre 33 vecinos.
3. **El orden del azar es frágil.** `decide()` mezcla extracciones secuenciales del mismo
   `rng` (`rng.pick(ARCH_VOIDS)`, `rng.int(30, 95)`…) con forks parchados por versión
   (`-v07`, `-v13`, `luna-visible-v13`). Cada parche es una cicatriz de "no mover lo
   anterior". *Traspuesta*: **una tirada por rasgo** desde el principio, y ventanas de
   sorteo que esquivan las **semillas protegidas**. Aquí no hay semillas protegidas.
4. **Monolito de 4 021 líneas.** La auditoría tiene razón, pero ojo con el orden: partirlo es
   caro y arriesga el determinismo. Primero van el test dorado (§4, L0) y las favoritas; se
   parte cuando una mutación de la gramática lo pida, no antes.
5. **No hay ocultamiento.** `surface.sort` ordena por `rawY` en pantalla, no por profundidad,
   y nada esconde lo de atrás. Todas las superficies son transparentes. De ahí sale el
   empaste del §2.2. *Traspuesta* nació de lo contrario: el **horizonte flotante**, cada
   perfil esconde al de atrás, y de ahí salió hasta el título.
6. **Hay una sola vista.** Es una proyección oblicua con `unit = 15`. Con el dato 3D ya
   hecho (cada signo tiene `x, y, z`, cara y cuerpo), la pieza podría dibujar planta, alzado
   y corte, que son las hojas que dibuja un arquitecto. *Traspuesta*: **la montaña no es la
   imagen, es un dato**, y cada vista lo traduce.
7. **Hay dos copias del motor** (la vertical `../` y esta) que el README llama "copia". Con
   el tiempo se van a separar en silencio.

### 2.2 La forma de verse

1. **La letra no se lee.** Es el problema central de una pieza que se llama *las letras*. En
   la genealogía, del 82 % al 89 % de los signos tienen otro encima a menos de medio cuerpo.
   La letra se vuelve mancha, trama o grisado, como el arte ASCII de sombreado, y su
   identidad se pierde (`N`, `C`, `O`, `)`). La única especie donde la letra se lee es **el
   arco voxelar (19 %)**, y las láminas más fuertes de la muestra son justo las que dejan
   ver la letra (`H K 0`, `N C O`). El empaste también hace que las caras se confundan: el
   reparto frente / lateral / cubierta, que es la idea más fina del motor, se ahoga.
2. **El volumen se lee por acumulación, no por oclusión.** Las formas de una sola línea
   (lazo, nudo, serpiente, hipar) se ven espléndidas porque su curva sobrevive a la
   transparencia. Las genealogías de muchas partes (muestra: 2, 7, 8, 16) se vuelven un
   montón: suman piezas, pero no hacen escultura.
3. **El cuerpo de la letra cambia con el encuadre** (de 9 a 34 px). Una pieza chica recibe
   letras gordas y se empasta más. En *Traspuesta* la tinta tenía un peso de plotter fijo. Aquí
   no existe un "cuerpo de la serie".
4. **La letra nunca gira.** El signo es siempre vertical, aunque la superficie sea una
   reglada que pide seguir sus generatrices. *Traspuesta* hizo exactamente eso con el río
   (**la letra se dobla con el cauce**), y el hipar y la serpiente lo están pidiendo.
5. **El tic del suelo.** En 13 de las 16 láminas de la muestra hay una fila de signos como
   línea de tierra, y en varias va partida en dos tramos. Es una firma involuntaria que se
   repite en especies que no tienen nada que ver.
6. **El color.** El 70 % es genealogía HSL con umbral de contraste: funciona, pero HSL no es
   perceptual, y salen pares turbios (muestra: 2, café sobre beige; 16, oscuro sobre oscuro).
   *Traspuesta* usó OKLCh y `MT.neon(h)`, el croma máximo que cabe en sRGB para cada tono.
   Sin medir todavía qué fracción de la serie es turbia.
7. **Los lenguajes son anacrónicos para el marco.** PARAMETRISMO es de 2008 y
   DECONSTRUCTIVISMO de 1988 (MoMA), mientras que la pieza dice situarse en la escultura y la
   arquitectura experimental mexicana del siglo XX. EXPRESIONISMO MODERNO es casi literalmente
   la *arquitectura emocional* de Goeritz (1953), pero no lo dice. (Propuesta en §6.6.)

### 2.3 Cómo se produce

- **La bitácora es buena** (README por versión, CRITICA, AUDITORIA, LOOP_STATE). Le falta lo
  que hizo funcionar a *Traspuesta*: **números antes de decidir** y **experimento aparte
  con antes/después**. v0.20 lo hizo (ocupación de 3.3 % a 1.2 %) y es la mejor entrada del
  README. Las demás versiones suman formas sin medir qué le quitan a la serie.
- **Casi todas las versiones agregan** (más estructuras, más alfabetos, más intrusión). Casi
  ninguna quita ni concentra. Ya hay vocabulario de sobra. Lo que falta es edición.
- **No hay favoritas ni GIFs protegidos.** Cualquier cambio puede mover una lámina que
  Canek ya ama, y nadie se entera.
- **No hay edición ni congelamiento.** Verse acuña hashes al azar, y para un álbum o una
  exposición hace falta una edición de semillas fijas y una v1.0 intocable.
- `CRITICA.md` (la anterior) propone sitio, erosión e intruso traductor. Las tres siguen
  siendo buenas, pero ninguna toca el problema de que la letra no se lee ni el de la frase
  coartada. Este documento las reordena.

### 2.4 Limitaciones de fondo (hay que decidirlas, no son bugs)

- **SVG `<text>` con miles de nodos.** Con 13 355 signos y copia carbón son ~27 000 nodos. Va
  bien en navegador, pero el GIF y una eventual impresión grande lo van a sentir. Una vista
  en rejilla (§4, L2) reduce los signos de 3 a 5 veces (medido: 3 441 → 1 141, 3 420 → 651).
- **Depende de las fuentes.** Apricot y Symbola deciden cómo se ve todo. Un glifo que cae
  a la fuente de reserva cambia la pieza. Ya se verifica a mano, falta un test.
- **El formato token premia la pasividad.** No hay gesto del visitante, y está bien. Pero el
  álbum y la sala de exposición sí pueden tener lo que el token no tiene (vistas, cédula,
  recorrido).

---

## 3. Lo que *Traspuesta* enseña y *las letras* todavía no hace

| Lección de `APRENDIDO.md` | En *las letras* hoy | Qué haría |
|---|---|---|
| La forma es un dato; cada vista lo traduce | una sola vista | planta · alzado · axonométrica · rejilla desde el mismo `surface` |
| Todo rótulo se lee del dato | la frase no causa nada en 78 %; título = nombre de especie | nombres y cédula medidos (§6); frase medida (§4, L7) |
| Una tirada por rasgo; semillas protegidas | sorteo secuencial + forks parchados; sin favoritas | `FAVORITAS` + test dorado antes de tocar nada |
| La rareza se mide, no se diseña (`RAREZA.md`, `FRANJAS`) | 34 estructuras planas | tabla de rareza y franjas: clásicos ~50 %, raros 0.2–3 % |
| Si no se ve, no pasó | genes que no se ven (vacío, anexo, lenguaje) siguen rotulados | medir visibilidad de cada gen; si no se ve, no se rotula |
| Horizonte flotante: lo de adelante esconde lo de atrás | todo transparente, 80 %+ empaste | ocultamiento por celda (experimento ya hecho, §4, L2) |
| La letra se dobla con el río | la letra no gira | girar el signo con la generatriz en cuerpos reglados |
| Medir la ocupación | hecho en v0.20 ✔ | mantener como prueba |
| Pasar toda mejora global por los casos de frontera | — | correr cada cambio sobre las favoritas y sobre las 6 especies |
| Experimento aparte, Canek decide viéndolo | casi nunca | `experimentos/` con antes/después (iniciado) |
| Edición y v1.0 congelada | no hay | edición de semillas fijas + álbum + v1.0 |
| Nombres: regla, fuentes, nada sagrado, reparto al acuñar | no hay nombres | §6 |

---

## 4. Mejoras, en loops (orden propuesto)

Cada loop lleva su número, se mide antes y después, y Canek lo decide viendo la imagen.

**L0 — Higiene que protege lo demás** (barato, primero)
- `FAVORITAS` en un archivo: las semillas que Canek ya quiere, más las de los GIF y los
  previews. Un test que compare su SVG contra un archivo dorado (ya existe
  `tests/render-fixture.js`; extenderlo a la lista).
- Quitar el `Math.random()` de `verse.js` (auditoría §2).

**L1 — Rareza medida y franjas**
- Generar `RAREZA.md` sobre 2 000 semillas: especie, estructura, cubierta, alfabeto,
  intrusión, grafía exótica, combinaciones.
- Rehacer el sorteo de estructuras como franjas: **5 o 6 clásicos** que sostienen la serie
  (masa arqueada, arcadas, torre helicoidal, esferas, zigurats, bóvedas) con ~50 % entre
  todos, un medio y una cola de raros reales (Möbius, hipar, serpiente entre 0.5 y 1.5 %).
  Lo mismo con los alfabetos: unos cuantos de letra (CNO, MECÁNICA, PARÉNTESIS, PÓRTICO)
  como base, y los exóticos como rareza.
- Puntaje de rareza = suma de −log₂ de la frecuencia de cada rasgo, en `features`.

**L2 — La letra se lee: ocultamiento por celda** *(experimento hecho)*
- `experimentos/rejilla.html?hash=N`: cada celda monoespaciada guarda sólo el signo más
  cercano al ojo, como una máquina de escribir de verdad. El resultado está en
  `experimentos/rejilla-antes-despues.png`: la letra se lee (`CNCNO…`), las caras se
  separan, y salen de 3 a 5 veces menos signos. **Lo que se pierde:** en el toro y el nudo
  se va la lectura del tubo que daba la transparencia, y la profundidad usa `item.y` de manera
  cruda (en algunas especies el signo no es consistente: falta medirlo).
- Decisión de Canek: (a) reemplazar, (b) volverlo **vista** (segunda hoja), (c) volverlo
  **rasgo raro**, "escrita a máquina", en ~15 % de la serie. Mi recomendación es **(b) + (c)**:
  la transparencia es identidad de la serie y la rejilla es su mejor contrapunto.

**L3 — Vistas: planta, alzado, axonométrica**
- Del mismo `surface` 3D salen tres proyecciones. Planta (z arriba) y alzado (sin
  profundidad) con ocultamiento. Para el álbum, una lámina = axonométrica + una vista
  técnica enfrente, como en *Traspuesta*. Se puede usar la **proyección exacta**: la planta
  girada para que las líneas de unión coincidan.

**L4 — La letra se dobla**
- En los cuerpos reglados y delgados (hipar, serpiente, cinta, Möbius, voluta, onda), cada
  signo gira con la tangente local de su generatriz (`rotate` en SVG; el GIF lo replica).
  Prueba primero en hipar: la doble familia de rectas debería verse como tejido.

**L5 — Un cuerpo de letra para la serie**
- Fijar un rango estrecho (por ejemplo 18–24 px) y que el encuadre ajuste la separación
  y no el tamaño. Medir el empaste antes y después; meta: mediana de la genealogía
  debajo de 50 %.

**L6 — El sitio, situado** (la mutación 1 de `CRITICA.md`, ahora con lugar)
- El suelo deja de ser una fila de signos y pasa a ser una condición. Los sitios vienen de
  la experiencia mexicana:
  - **PEDREGAL**: el malpaís de lava del Xitle, donde están Ciudad Universitaria y el
    Espacio Escultórico. Suelo irregular, apoyos de distinta altura.
  - **LAGO**: la subsidencia del suelo lacustre de la Ciudad de México. La pieza se hunde y
    se inclina, como Bellas Artes.
  - **PERIFÉRICO**: la escultura para verse desde el coche, como las Torres de Satélite o
    la Ruta de 1968. Perspectiva rasante y alargada.
  - **LLANO**: suelo plano, el de hoy, pero raro.
- No se dibuja el sitio, sólo actúa (regla de la crítica anterior). De paso se cura el tic
  del suelo partido.

**L7 — La frase: o causa, o se mide**
- Opción A: **la frase manda.** Se elige primero, y sus instrucciones restringen especie y
  estructura (SEPARAR → espera o díptico; ENTRELAZAR → nudo o lazo; CORONAR → anillo).
- Opción B: **la frase se mide**, como los nombres. Sólo sale una frase cuya afirmación la
  pieza cumple ("dos volúmenes se tocan en el punto menos estable" sólo en un equilibrio).
- En los dos casos: quitar o rehacer las 14 frases en inglés (o volverlas rasgo raro
  explícito), ampliar el corpus para que ninguna frase salga más de ~10 veces en la
  edición, y cambiar el registro, que hoy es borgiano y genérico ("el edificio recuerda…"),
  por uno que tenga sitio (§6).

**L8 — Erosión / el error que sigue** (lo que pide `LOOP_STATE`)
- Con el ocultamiento (L2), la erosión se vuelve legible: al borrar un signo de adelante
  aparece el de atrás. **La ruina descubre el interior.** Eso le da a la desescritura un
  sentido estructural, no de fundido.

**L9 — Partir el motor**, cuando L6 o L8 lo pidan, y con el test dorado de L0 vigilando.

**L10 — Edición, álbum y v1.0.** (§5)

---

## 5. El álbum

### 5.1 Qué es

Una **edición cerrada de semillas fijas** (propuesta: láminas 1–1000, semilla N = lámina N,
como *Traspuesta*). De ahí sale **un álbum curado de 48 láminas en 8 salas**. Cada sala es
un momento del cruce entre **letra, arquitectura y escultura en México en el siglo XX**. El
cruce es el tema de la pieza: no se trata sólo de escultura, sino de la letra que se vuelve
espacio.

Cada sala se arma con un **filtro sobre rasgos medidos** (no a mano), y de lo que el filtro
deja, Canek escoge seis.

### 5.2 Las salas

| Sala | Momento | Qué láminas entran (filtro) |
|---|---|---|
| **I. IDEOGRAMA** | Tablada, *Li-Po y otros poemas* (1920): el poema que se dibuja | piezas donde **la letra se lee**: arco voxelar, vista rejilla, alfabetos de letra (CNO, MECÁNICA, PARÉNTESIS, PÓRTICO) |
| **II. ESTRIDENTÓPOLIS** | estridentismo (*Actual No. 1*, 1921), la ciudad radiofónica, Germán Cueto | antenas parabólicas, torres, piezas fragmentadas (hoy DECONSTRUCTIVISMO), copia carbón |
| **III. ARQUITECTURA EMOCIONAL** | Goeritz, El Eco y su manifiesto (1953) | serpiente, muros y pantallas, torres altas, temperatura FEBRIL, hoy EXPRESIONISMO |
| **IV. CASCARONES** | Candela: Rayos Cósmicos (1951), Los Manantiales (1958) | hipar, onda, onda estacionaria, paraboloide, cúpula inversa |
| **V. LA RUTA** | las esculturas monumentales a la orilla del Periférico (1968) | ensamblajes monumentales sin suelo: esfera, hipar y paraboloide monumentales, equilibrio de tres cuerpos |
| **VI. DISCO VISUAL** | Paz y Rojo, *Discos visuales* y *Topoemas* (1968): el texto que gira | lazos, anillos, espirales, voluta, Möbius, nudo |
| **VII. MÁQUINA ESTÉTICA** | Felguérez y la computadora (años setenta) | genealogías con muchas partes, cubos encajados, CIRCUITOS, PUNTOS, piezas con intrusión |
| **VIII. ESPACIO ESCULTÓRICO** | el anillo sobre la lava de CU (1979) | anillos y anillo superior; con L6, las piezas en sitio PEDREGAL |

*(Los años y las atribuciones se verifican con fuente antes de imprimirlos. Es la misma
regla que con las lenguas de* Traspuesta*: nada entra sin registro.)*

### 5.3 Cada página

- A la izquierda, la lámina axonométrica (estado final de la escritura).
- A la derecha, su **vista técnica** (planta o rejilla, L2/L3) y la **cédula** (§6.5).
- Por sala: **un GIF de la escritura** de ≤ 10 s y ≤ 5 MB (regla de *Traspuesta*) y un texto
  de sala corto que diga qué une a esas láminas, medido, sin explicar la obra.

### 5.4 Formatos

1. **Visor web** del álbum, con portada, salas y ficha tocable, igual que el atlas de
   *Traspuesta*. El nomenclátor de §6 vive ahí.
2. **PDF para imprimir**, 48 láminas + cédulas.
3. Más adelante, la **prueba en plotter o máquina de escribir** de la vista rejilla. Si la
   rejilla es monoespaciada, una lámina se puede escribir en una máquina de escribir real.

### 5.5 Título del álbum (lo decide Canek)

- *Paseo de signos*, por el Paseo de las Esculturas de CU.
- *Pedregal tipográfico*.
- *Espacio escultórico — álbum de 48 láminas*, el más sobrio.

---

## 6. Texto para llamar a las esculturas

### 6.1 La regla

> **Un nombre sólo sale donde la escultura cumple lo que dice.**

Es la misma regla de *Traspuesta*. Cada pieza se mide: proporción alto/ancho, número de
cuerpos, si flota, si tiene vano pasante, si es reglada o anticlástica, si se tuerce,
simetría, centro de masa respecto del apoyo, densidad, color dominante y alfabeto. Los
umbrales se calibran **en percentiles sobre la edición**, así que "ESBELTA" describe a la
cuarta parte de las piezas que de verdad lo son.

### 6.2 Forma del nombre

`GENÉRICO` + `COMPLEMENTO MEDIDO` (+ `MATERIAL TIPOGRÁFICO` en la cédula), con estos patrones:

- **Serie numerada**, el patrón del geometrismo mexicano: genérico + número
  (ESTRUCTURA 7, VARIANTE 12). Sale sólo cuando la pieza es pariente cercana de otras de la
  edición (misma estructura y cubierta). El número cuenta a sus hermanas.
- **Mensaje**, en la estela de los *Mensajes* de Goeritz: para las piezas cuya letra se lee
  (rejilla, arco), MENSAJE + complemento.
- **Calificativo pegado**: TORRE ESBELTA, CASCARÓN VOLADO.
- **Lugar**, sólo con el sitio de L6: DEL PEDREGAL, DEL LAGO, DEL PERIFÉRICO.

### 6.3 Genéricos (cada uno pide su medida)

| Genérico | Lo que la pieza tiene que cumplir |
|---|---|
| TORRE · ESTELA · SEÑAL · FUSTE | alto/ancho en el cuartil superior; un solo cuerpo vertical |
| MURO · PANTALLA · BIOMBO | ancho ≫ profundidad; frente dominante |
| PUERTA · PORTAL · VANO | vacío pasante (ARCO, PORTAL, TÚNEL) visible después del ocultamiento |
| CASCARÓN · PARAGUAS · VELA · MEMBRANA | superficie reglada o anticlástica (hipar, onda, paraboloide) |
| PLIEGUE · ZIGZAG | serpiente, voladizos alternos |
| NUDO · LAZO · CINTA · TRENZA | entrelazada, Möbius, doble hélice |
| ESFERA · ASTRO · GLOBO | esfera dominante |
| EQUILIBRIO · APOYO | ensamblaje con centro de masa fuera de su base |
| DÍPTICO · PAR | especie *espera* |
| RECINTO · CÁMARA · PASAJE | no euclidiana |
| PABELLÓN · CASA · CONSTRUCCIÓN · MAQUETA | genealogía; MAQUETA si la pieza es chica en el cuadro |

### 6.4 Complementos medidos

- **Postura:** DE PIE, TENDIDA, DE CANTO, INCLINADA, SUSPENDIDA, SIN SUELO, VOLADA.
- **Proporción y gesto:** ESBELTA, ACHATADA, TORCIDA, QUEBRADA, ABIERTA, HUECA, DOBLE,
  GEMELA, TRIPLE.
- **Material de construcción**, medido del color de la pieza (tono y luminosidad en OKLCh),
  con vocabulario de la construcción mexicana: DE TEZONTLE (rojo oscuro poroso), DE
  RECINTO (gris basáltico), DE CANTERA (rosa o crema), DE CHILUCA (gris claro), DE ADOBE,
  DE CONCRETO, DE TABIQUE, DE TEPETATE. Sólo sale si el color cae en el rango de la piedra.
  Es el equivalente del "piso altitudinal" de *Traspuesta*.
- **Temperatura:** SERENA, INESTABLE o FEBRIL (ya existe en los rasgos).
- **Lugar:** con L6.
- Ningún complemento contradice a su genérico (`CHOCA`, como en *Traspuesta*). Un genérico
  que ya dice su complemento casi nunca lo repite (TORRE ESBELTA sale 1 de cada 4 veces).
  Ningún complemento se repite dentro de la misma sala del álbum.

### 6.5 La cédula

Es el texto de museo. Todo se lee del dato. (Ejemplo de forma: los números son ilustrativos.)

```
CASCARÓN VOLADO DE TEZONTLE
Espacio escultórico · lámina 0417 · sala IV, Cascarones

1 284 paréntesis y 3 oes sobre cartulina ácida
Hipar en paraguas, cuatro cuadrantes; sin suelo
Escrito en 4.6 s, con 23 correcciones
Parentesco: el cascarón de Félix Candela
«la superficie sale por donde debía continuar»
```

- La **técnica** dice qué signos y cuántos, sobre qué papel (nombre de la paleta). El
  alfabeto es el material, como el concreto o el bronce en una cédula real.
- El **parentesco** reconoce de dónde viene la forma (Goeritz para la serpiente, Candela
  para el hipar, Shújov para el hiperboloide). Es la "fuente propia" de cada nombre en
  *Traspuesta*: se acredita, no se imita.
- La **frase** va al final como epígrafe, y sólo si se cumple (§4, L7).
- Edición inglesa con `?lang=en` y el título en `crudo`, como en *Traspuesta*.

### 6.6 Los lenguajes, renombrados (propuesta)

| Hoy | Propuesta | Por qué |
|---|---|---|
| SIN MANIFIESTO | SIN MANIFIESTO | queda |
| EXPRESIONISMO MODERNO | **ARQUITECTURA EMOCIONAL** | es lo que hace: empuje, curvatura emotiva (Goeritz, 1953) |
| DECONSTRUCTIVISMO | **ESTRIDENTISMO** | bandas desplazadas y cizalladas: el dinamismo fragmentado de los veinte, no el de 1988 |
| PARAMETRISMO | **CASCARÓN** u **ORGANICISMO** | campos continuos que ondulan: más Candela que Schumacher |

La geometría no cambia, cambian el rótulo y el feature. Decide Canek.

### 6.7 Lo que queda fuera (el "nada sagrado" de esta pieza)

- **Ningún título copia el nombre de una obra real** (ni EL ECO, ni TORRES DE SATÉLITE, ni
  LOS MANANTIALES, ni LA SERPIENTE como título completo). Los genéricos sí; los nombres
  propios de obra, no.
- **Ningún nombre de artista como título** ("homenaje a…"). Los artistas viven en el
  *parentesco* de la cédula y en los textos de sala.
- **Ningún nombre de deidad o lugar sagrado prehispánico**, aunque sea bello.
- **Nada de citas largas** de manifiestos: se toma el patrón y el vocabulario, no el texto.

### 6.8 Repetición y reparto

Hay que medirla en cuanto exista el primer nomenclátor. Las lecciones de *Traspuesta* ya
sirven: diagnosticar dónde se junta la repetición antes de agregar palabras, y repartir al
acuñar con 12 tiradas por lámina, las más limitadas escogen primero, y tope de ~4
repeticiones por título en la edición.

---

## 7. Lo que decide Canek

1. ¿La rejilla reemplaza, es vista, es rasgo raro o las dos últimas? (recomiendo vista + rasgo raro)
2. ¿La frase manda (A) o se mide (B)? (recomiendo B, más honesta y más barata)
3. ¿Se renombran los lenguajes (§6.6)?
4. Tamaño de la edición (1 000), número de láminas del álbum (48) y título.
5. ¿Qué semillas son favoritas protegidas? (antes de L1)
6. ¿Se mantienen las frases en inglés?

## 8. Archivos de este loop

- `CRITICA-Y-PLAN.md`: este documento.
- `experimentos/medir.js`: tabla de la serie (`node lasletras/experimentos/medir.js 1500`).
- `experimentos/empaste.js`: empaste por especie.
- `experimentos/rejilla.html`: ocultamiento por celda, antes/después (`?hash=N`).
- `experimentos/rejilla-antes-despues.png`: semillas 3, 6, 11 y 15.
- `experimentos/muestra-1-16.png`: estado final de las semillas 1–16 (`?still=1`).

El motor no se tocó. Ninguna semilla cambió.
