# LOOP_STATE — LAS LETRAS / ESPACIO ESCULTÓRICO (edición Verse)

Registro de estado de la pieza. Aquí se declaran las mutaciones pendientes y
las que se ejecutan. No se borra historia: se va anexando.

---

## ESTADO ACTUAL · v0.21

La pieza está firme en lo que es: una escultura tipográfica que emerge de una
frase oculta, escrita por una máquina que se equivoca. 24 alfabetos, 34
estructuras, 12 ensamblajes. El changelog ha refinado la forma (hipar, grosor,
intrusiones) sin tocar todavía lo que la crítica considera lo que falta.

### Lo que se declara pendiente (orden de ejecución)

1. **Partir el motor antes de tocar gramática.**
   `js/architecture.js` es un monolito (~4021 líneas): utilidades de color,
   selección de semilla, geometría de 6 especies, proyección, perturbación y
   catálogos de pesos en el mismo espacio y el mismo `rng` raíz. Una mutación
   en una especie puede afectar a otra. La auditoría lo marca y no se ha hecho.
   Partirlo en `js/architecture/{color.js,geometry.js,weights.js,species/}`
   con `ARQ_MOTOR.build` exportado desde `index.js`, **antes** de la mutación
   que toca la gramática (intruso-traductor). Riesgo: romper el determinismo.
   Mitigación: test de render SVG golden contra una semilla fija.

2. **Erosión como post-escritura — la siguiente mutación temporal.**
   El typewriter es el gesto más fuerte de la pieza, pero es un nacimiento sin
   vida: termina y el objeto queda congelado. Después de la escritura debería
   haber una fase lenta, determinista e irreversible dentro de la visita que
   **desescriba** el edificio siguiendo una regla local (lo más expuesto primero,
   el núcleo después), hasta un estado de ruina que no es el vacío. Reutiliza el
   motor de escritura. El tiempo ya es el tema de la pieza; esta mutación le da
   su segunda actuación.

### Nota en el aire — el error corriendo sobre sí mismo (sin decidir)

Idea en borrador, requiere prueba: que el **sistema de errores** —el tropiezo de
encontrar un asiento donde imprimir algo que no es el carácter correcto— **siga
corriendo sobre el azar** y siga fallando, también después de la escritura.

Hoy el tropiezo es transitorio (`typewriter.js`): `error` → `erase` → `correct`,
y al final no deja huella. La intuición es: que un subconjunto de la máquina siga
buscando su sitio y **continúe equivocándose**, de modo que el edificio, una vez
escrito, no quede quieto sino que siga emitiendo signos que no son los suyos —
un fallo que no termina de corregirse.

- **A favor**: da a la pieza el tiempo vivo que le falta y le quita la rigidez
  de "objeto terminado"; es coherente con el tropiezo ya existente, no inventa
  un gesto nuevo.
- **Contra / riesgo**: puede leerse como ruido o glitch si no respeta la lógica
  estructural; puede chocar con el determinismo del token si no sale del mismo
  stream de la semilla; y puede robarle fuerza a la "fase de erosión" si ambas
  compiten por el mismo tiempo.
- **Qué probar antes de decidir**: cuánto signo por segundo sigue fallando,
  si el fallo se concentra en caras/zonas o es uniforme, y si sigue siendo
  reproducible (misma semilla → mismos fallos). Si no es reproducible o se
  vuelve ruido, se descarta a favor de la erosión.

### Lo que quedó de la crítica, como reserva

- **Frase legible en el residuo**: los vacíos de corrección acumulados forman
  la frase como segunda escritura — `N` huecos que dibujan la presencia y el
  ritmo de la frase sobre el edificio. Barata (solo cambia qué se hace con el
  `correct`), cierra el alibi (la frase se manifiesta como marca estructural,
  no como texto), no traiciona el token.
- **Intruso como traductor**: el signo exótico como operador local que cambia
  la gramática de su cara. La más profunda; exige primero partir el motor.
- **El sitio**: el soporte como campo de condiciones (pendiente, falla,
  subsidencia) en vez de plano. Casi pura en coordenadas.

---

## HISTORIAL DE LOOPS

_(anexar aquí cada mutación ejecutada, con evidencia, sin borrar las anteriores)_

### Loop C1 · crítica medida y plan (6 oct 2026)

`CRITICA-Y-PLAN.md`: crítica con la vara de *Traspuesta* y plan en cuatro partes
(mejoras L0–L10, álbum de 48 láminas en 8 salas, nombres y cédula). Hallazgos
medidos: la frase no mueve la geometría en 78 % de la serie; 34 estructuras
planas (máx 4.3 %); empaste 82–89 % en la genealogía contra 19 % en el arco.
Experimento aparte `experimentos/rejilla.html` (ocultamiento por celda). Motor
intacto.

**Corrección de Canek (C1):** el encimado transparente es el destino de la pieza,
no un defecto: es lo que da la perspectiva y el 3D. La rejilla con ocultamiento
queda **descartada** (quitaba ambos). En su lugar se propone L2: ordenar el
dibujo por profundidad sin ocultar ningún signo.

### Experimento L2 · orden de profundidad (6 oct 2026)

`experimentos/profundidad.html`: mismos signos, pintados de atrás hacia
adelante. La profundidad 3D se recupera invirtiendo `project()` (fitToPage
pisa `item.y`). Hoy 39–54 % de los encimados visibles quedan al revés. Con el
orden, los cruces de toros y lazos se leen arriba/abajo sin perder la
transparencia. Variante `?aire=` (opacidad por profundidad). Pendiente: decisión
de Canek; motor intacto.

### Experimento L2b · que las curvas cierren (6 oct 2026)

Canek aprueba el orden de profundidad ("sí mejora") y pide que círculos y
espirales cierren. Causas: 26 cortes `skip` que fingían cruces o puertas, y
muestreo fijo por cinta (paso de hasta 2.8 u en cintas largas). Parche sobre una
copia del motor: sin cortes + paso ≤ 0.62 u. Cambia 31 % de las semillas, +6 %
de signos (mediana). Comparador publicado y GIF de escritura. Pendiente:
decidir si el interior mayor y el lazo habitable conservan sus puertas.
