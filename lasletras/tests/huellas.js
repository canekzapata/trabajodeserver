// v0.22 contra v0.21: sólo deben cambiar las semillas que tienen cintas, y
// exactamente como el experimento aprobado (experimentos/cierre-parche.js).
// Las favoritas (tests/favoritas.json) no pueden cambiar sin quedar anotadas.
"use strict";
var assert = require("assert");
var fs = require("fs");
var path = require("path");
var huella = require("./huella.js").huella;
var leer = function (f) { return JSON.parse(fs.readFileSync(path.join(__dirname, f), "utf8")); };
var v021 = leer("huellas-v021.json"), esperadas = leer("huellas-v022-esperadas.json");
var favoritas = fs.existsSync(path.join(__dirname, "favoritas.json")) ? leer("favoritas.json") : { semillas: [], cambios_aceptados: {} };

var cambian = 0, porEspecie = {};
Object.keys(esperadas).forEach(function (seed) {
  var h = huella(seed);
  assert.strictEqual(h.hash, esperadas[seed].hash, "semilla " + seed + ": no coincide con el experimento aprobado");
  if (h.hash !== v021[seed].hash) {
    cambian += 1;
    porEspecie[h.especie] = (porEspecie[h.especie] || 0) + 1;
  }
});
// El arco y la espera no tienen cintas: no se mueven ni un signo.
assert(!porEspecie.arco && !porEspecie.espera, "arco y espera no deben cambiar");
favoritas.semillas.forEach(function (seed) {
  if (!v021[seed]) return;
  var h = huella(seed);
  if (h.hash !== v021[seed].hash) {
    assert(favoritas.cambios_aceptados[seed], "la favorita " + seed + " cambió y no está en cambios_aceptados");
  }
});
console.log("huellas ok ·", cambian, "de", Object.keys(esperadas).length, "semillas cambian (cintas cerradas) ·", JSON.stringify(porEspecie));
