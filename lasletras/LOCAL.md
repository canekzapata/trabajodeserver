# Abrir *las letras* en local

Todo funciona sin internet: motor, fuentes y páginas van en esta carpeta.

## 1. Servir la carpeta

Las páginas cargan fuentes y scripts con rutas relativas, así que hay que
abrirlas desde un servidor local (no con doble clic: el navegador bloquea las
fuentes con `file://`). Desde esta carpeta (`lasletras/`):

```bash
python3 -m http.server 8080
```

(En Windows: `py -m http.server 8080`. Con Node: `npx serve -l 8080`.)

## 2. Abrir

- Taller con todo: <http://localhost:8080/experimentos/>
- La pieza (v0.22): <http://localhost:8080/?hash=3>
- Escribir y girar: <http://localhost:8080/experimentos/paginas/escribir-girar.html?hash=58>

## 3. Pruebas

```bash
node tests/huellas.js      # v0.22 contra v0.21 y contra lo aprobado
node tests/smoke.js        # distribuciones y determinismo (tarda unos minutos)
node tests/typewriter.js
node tests/gif.js
node tests/presentation.js
```

## 4. Rearmar las páginas de experimentos

Las páginas de `experimentos/paginas/` son autónomas: llevan el motor dentro.
Si cambias el motor o un experimento, vuelve a armarlas:

```bash
for m in profundidad cierre jardin girar escribir-girar; do
  python3 experimentos/comparador/construir.py experimentos/paginas/$m.html $m "../../fonts/"
done
```

## 5. Proteger tus favoritas

Escribe tus semillas en `tests/favoritas.json` (`"semillas": [3, 58, …]`). Si un
cambio al motor las mueve, `node tests/huellas.js` falla hasta que lo anotes en
`cambios_aceptados`.
