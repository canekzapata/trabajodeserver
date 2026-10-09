// Caras completas para los cuerpos de vóxel, sobre una COPIA del motor.
// visibleFaces() sólo emite frente, un costado (el de la luz) y techo: lo que se
// ve desde la cámara fija. Para girar, este parche emite también la cara de
// atrás (como frente) y el otro costado (como lateral). js/architecture.js no
// se toca.
(function (root) {
  var A = '      if (!field.has(x, y, z + 1)) {\n        faces.push({ face: "techo", body: body || "solo", voxel: voxel, x: x + 0.5, y: y + 0.5, z: z + 1 });\n      }\n    });\n    return faces;';
  var B = '      if (!field.has(x, y, z + 1)) {\n        faces.push({ face: "techo", body: body || "solo", voxel: voxel, x: x + 0.5, y: y + 0.5, z: z + 1 });\n      }\n' +
    '      if (!field.has(x, y + 1, z)) faces.push({ face: "frente", body: body || "solo", voxel: voxel + ":atras", x: x + 0.5, y: y + 1, z: z + 0.5 });\n' +
    '      if (!field.has(x - sideDirection, y, z)) faces.push({ face: "lateral", body: body || "solo", voxel: voxel + ":otro", x: sideDirection > 0 ? x : x + 1, y: y + 0.5, z: z + 0.5 });\n' +
    '    });\n    return faces;';
  function parchar(src) {
    if (src.split(A).length !== 2) throw new Error("el parche de caras completas ya no encaja");
    return src.replace(A, B);
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { parchar: parchar };
  else root.GIRAR_PARCHE = { parchar: parchar };
})(typeof window !== "undefined" ? window : globalThis);
