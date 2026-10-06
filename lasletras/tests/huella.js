// Huella de una semilla: lo que la lámina ES (signos, posición, cara, color,
// opacidad), sin importar el orden en que se pinta. Sirve para comparar
// versiones del motor. node lasletras/tests/huella.js grabar ARCHIVO [N]
"use strict";
var crypto = require("crypto");
var fs = require("fs");
var motorBase = require("../js/architecture.js");

function huella(seed, motor) {
  var piece = (motor || motorBase).build({ seed: String(seed) });
  var filas = piece.surface.filter(function (s) { return s.glyph; }).map(function (s) {
    return [s.glyph, (s.rawX + s.perturbX).toFixed(3), (s.rawY + s.perturbY).toFixed(3), s.face,
      s.anomaly ? 1 : 0, s.forcedColor || "", s.opacity.toFixed(3), s.fontKind || ""].join("|");
  }).sort();
  return {
    especie: piece.meta.speciesKey,
    hash: crypto.createHash("sha1").update(filas.join("\n") + "\n" + piece.meta.phrase + "\n" + piece.colors.papel).digest("hex").slice(0, 16)
  };
}
module.exports = { huella: huella };

if (require.main === module && process.argv[2] === "grabar") {
  var archivo = process.argv[3], n = Number(process.argv[4] || 400), datos = {};
  for (var i = 1; i <= n; i += 1) datos[i] = huella(i);
  fs.writeFileSync(archivo, JSON.stringify(datos, null, 0).replace(/},"/g, '},\n"') + "\n");
  console.log("grabadas", n, "huellas en", archivo);
}
