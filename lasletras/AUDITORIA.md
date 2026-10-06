# AUDITORÍA — ESPACIO ESCULTÓRICO / lasletras

Edición Verse del generador `arquitecturasunicode`. Estado revisado: v0.21.

## Cómo abrir

```bash
# desde la raíz del repositorio
python3 -m http.server 8080
```

- Hash explícito: `http://localhost:8080/lasletras/?hash=lo-que-sea`
- Payload Verse: `?payload=eyJoYXNoIjoi...`,`editionNumber`}
- Sin parámetros: genera hash aleatorio. **Ver §2.**

Tests:

```bash
node lasletras/tests/smoke.js
node lasletras/tests/typewriter.js
node lasletras/tests/gif.js
node lasletras/tests/presentation.js
```

## 1 · Estado general

La pieza es determinista: misma semilla = misma especie, forma, frase, color, anomalía, alfabeto y horario de escritura. El motor (`js/architecture.js`) construye un espacio escultórico en 3D voxelar, lo proyecta, lo escribe con un alfabeto elegido por el grosor de la forma, y lo anima carácter por carácter.

Flujo vertical:

```
js/rng.js        semilla → xfnv1a + mulberry32
js/corpus.js     frases, 24 alfabetos, paletas, colores
js/architecture.js motor geométrico: 6 especies, ~34 estructuras, color, proyección
js/typewriter.js horario determinista de ráfagas, pausas, errores y correcciones
js/verse.js      lee payload/hash, reencuadra al cuadrado, renderiza SVG, info panel, features
js/gif-export.js reconstruye la animación en canvas y descarga GIF con gifenc
```

## 2 · Problema de determinismo: `Math.random()` en `js/verse.js`

`verse.js:33-41` usa `crypto.getRandomValues` cuando existe, pero cae a `Math.random()` si no. En entornos sin `crypto` (algunos iframes, headless antiguos, políticas restrictivas), dos recargas sin hash generan semillas distintas.

**Regla:** la pieza nunca debe depender de `Math.random()` para ninguna decisión. Si `crypto.getRandomValues` no está disponible, debe pedir un hash explícito o fallar, nunca acuñar una semilla no reproducible.

## 3 · Problema estructural: `js/architecture.js` es un monolito

El archivo tiene ~4021 líneas y acumula:

- utilidades de color (HSL, contraste, color foráneo);
- selección semilla → especie, forma, color, alfabeto, anomalía;
- geometría voxelar para 6 especies (`arco`, `espera`, `entrelazada`, `noeuclidiana`, `escultura`, `gramatica`);
- proyección, perturbación, estadísticas;
- catálogos de pesos para todas las morfologías.

**Consecuencias:**

- Una mutación en una especie puede afectar a otra porque comparten el mismo espacio y el mismo `rng` raíz en `build()`.
- No es posible unit-testear una sola especie sin cargar todo el archivo.
- El costo de añadir una nueva estructura es alto.

**Recomendación:** partir en `js/architecture/{color.js,geometry.js,weights.js,species/}` y exportar `ARQ_MOTOR.build` desde `js/architecture/index.js`.

## 4 · Riesgos menores

### 4.1 `js/gif-export.js` deja basura y revoca la URL a ciegas

- `exportAnimation` crea un `<canvas>` que nunca se remueve.
- `download()` revoca la `ObjectURL` tras `1200 ms` arbitrarios; en descargas lentas o Safari, el navegador puede cancelar la descarga.

### 4.2 CSS `color-mix()` sin fallback

`index.html` usa `color-mix(in srgb, ...)` para el fondo del panel de información. Si el entorno de renderizado no lo soporta, el panel queda sin fondo.

### 4.3 Precarga de fuentes incompleta

Solo se precarga `Ac437_ApricotPortable.ttf`. Las fuentes exóticas (`Electronics`, jeroglíficos, Lineal B) se cargan vía `@font-face` sin precarga. Si la semilla elige grafía exótica, el primer fotograma puede usar fallback o glifos vacíos.

### 4.4 No hay tests de render SVG contra fixture

`tests/smoke.js` y `tests/typewriter.js` verifican distribución y determinismo del horario, pero no comparan la salida SVG final. Un cambio que desplace glifos o rompa una cara no se detectaría automáticamente.

### 4.5 `window.__ARQ_TYPEWRITER_SCHEDULE` expuesto

`js/verse.js:353` deja el horario en `window` como depuración. Es inocuo en Verse, pero es un resquicio.

## 5 · Lo que está bien y debe conservarse

- **Determinismo real.** Misma semilla reconstruye exactamente el mismo mundo.
- **Separación de capas.** Motor, corpus, typewriter, render y GIF export son archivos independientes.
- **Carga de fuentes.** `document.fonts.ready` + `font-display: block` evitan flash de fallback.
- **Integración Verse.** `?payload=base64(JSON)` y `window.$artifact.features` están bien implementados.
- **Accesibilidad.** SVG con `<title>` y `<desc>`; panel con ARIA; toggle es un botón real.

## 6 · Siguientes mutaciones recomendadas

1. **Eliminar el fallback a `Math.random()` en `js/verse.js`.**
2. **Partir `js/architecture.js` en módulos** antes de añadir más estructuras.
3. **Añadir un test de render SVG** contra una fixture golden para una semilla fija.
4. **Precargar las fuentes exóticas** o verificar que `document.fonts.ready` las incluye.
5. **Limpiar el canvas del GIF y revocar la URL de forma segura.**
6. **Añadir fallback a `color-mix()`** en el panel de información.

## 7 · Referencias clave

- `js/verse.js` — payload, render, info panel, features.
- `js/architecture.js` — motor completo (demasiado grande).
- `js/corpus.js` — frases, alfabetos, paletas.
- `js/typewriter.js` — horario determinista de escritura.
- `js/gif-export.js` — exportación a GIF.
- `tests/smoke.js` — determinismo y distribuciones.
- `tests/typewriter.js` — horario de escritura.
- `index.html` — layout, fuentes, CSS con `color-mix()`.
