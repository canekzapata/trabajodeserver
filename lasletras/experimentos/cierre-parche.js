// Parche de experimento sobre una COPIA del motor (js/architecture.js no se toca).
// Lo usan cierre.html (navegador) y cierre-medir.js (node). Opciones en
// globalThis.__CIERRE:
//   sinCortes    las cintas ya no se cortan con `skip` (los falsos «pasa por
//                debajo» de nudos, lazos, cápsulas, espirales y hélices);
//   densidad     las cintas se muestrean por longitud de arco: a lo más `paso`
//                unidades (0.62 ≈ 0.7 de un signo; un signo mide ~0.87 u) entre
//                muestras; hoy el número es fijo, sea corta o larga la cinta.
//                Sólo agrega muestras donde faltan: nunca quita;
//   sinAusencias el error «ausencia» ya no borra signos;
//   registro     arreglo donde se anota, por cinta, su longitud y su paso.
(function (root) {
  var REEMPLAZOS = [
    ["var samples = spec.samples || 96;",
     "var samples = spec.samples || 96;\n" +
     "    var __C = root.__CIERRE || {};\n" +
     "    var __len = 0, __prev = spec.path(0);\n" +
     "    for (var __k = 1; __k <= 600; __k += 1) { var __q = spec.path(__k / 600);\n" +
     "      __len += Math.sqrt(Math.pow(__q.x - __prev.x, 2) + Math.pow(__q.y - __prev.y, 2) + Math.pow(__q.z - __prev.z, 2)); __prev = __q; }\n" +
     "    if (__C.densidad) samples = Math.max(samples, Math.ceil(__len / (__C.paso || 0.62)));\n" +
     "    if (__C.registro) __C.registro.push({ key: spec.key, len: __len, samples: samples, paso: __len / samples, cortes: !!spec.skip, ancho: spec.width, across: spec.across || 6 });"],
    ["if (spec.skip && spec.skip(t, sample, p)) continue;",
     "if (!__C.sinCortes && spec.skip && spec.skip(t, sample, p)) continue;"],
    ['if (kind === "ausencia") item.glyph = "";',
     'if (kind === "ausencia" && !(root.__CIERRE || {}).sinAusencias) item.glyph = "";']
  ];
  function parchar(src) {
    REEMPLAZOS.forEach(function (r) {
      if (src.split(r[0]).length !== 2) throw new Error("el parche ya no encaja: " + r[0].slice(0, 40));
      src = src.replace(r[0], r[1]);
    });
    return src;
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { parchar: parchar };
  else root.CIERRE_PARCHE = { parchar: parchar };
})(typeof window !== "undefined" ? window : globalThis);
