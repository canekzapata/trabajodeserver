// Inserta makeGarden y buildGarden (jardin-motor.js) en una COPIA del motor y
// expone buildGarden en ARQ_MOTOR. Lo usan jardin-medir.js y la página del
// jardín. js/architecture.js no se toca.
(function (root) {
  function parchar(src, jardinSrc) {
    var ancla = "  function build(options) {";
    var api = "  var api = {\n    build: build,";
    if (src.split(ancla).length !== 2 || src.split(api).length !== 2) throw new Error("el parche del jardín ya no encaja");
    return src.replace(ancla, jardinSrc + "\n" + ancla).replace(api, "  var api = {\n    buildGarden: buildGarden,\n    walkSchedule: walkSchedule,\n    build: build,");
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { parchar: parchar };
  else root.JARDIN_PARCHE = { parchar: parchar };
})(typeof window !== "undefined" ? window : globalThis);
