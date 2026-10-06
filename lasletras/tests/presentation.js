"use strict";

var assert = require("assert");
var childProcess = require("child_process");
var fs = require("fs");
var os = require("os");
var path = require("path");

var root = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var verse = fs.readFileSync(path.join(root, "js", "verse.js"), "utf8");
var gif = fs.readFileSync(path.join(root, "js", "gif-export.js"), "utf8");

assert(html.indexOf('id="info-panel"') >= 0, "Verse debe incluir una ficha HTML desplegable");
assert(html.indexOf('id="info-toggle"') >= 0, "debe existir el acceso discreto de información");
assert(html.indexOf('id="gif-export"') >= 0, "el acceso GIF debe vivir fuera del SVG");
assert(verse.indexOf("width: SIZE - 76, height: SIZE - 76") >= 0,
  "la obra debe usar un marco cuadrado de 924 × 924");
assert(verse.indexOf("scale = Math.min(scale, 3.75)") >= 0,
  "las formas pequeñas deben poder crecer más que en v0.9");
assert(verse.indexOf("addColophon") < 0 && verse.indexOf("colophonLines") < 0,
  "el colofón visible debe desaparecer del SVG");
assert(gif.indexOf("drawColophon") < 0 && gif.indexOf("options.colophon") < 0,
  "el GIF debe contener únicamente la escritura");

var output = fs.mkdtempSync(path.join(os.tmpdir(), "espacio-presentacion-"));
var result = childProcess.spawnSync(process.execPath, [
  path.join(__dirname, "render-fixture.js"), output, "espacio-escultorico-24"
], { encoding: "utf8" });
assert.strictEqual(result.status, 0, result.stderr);
var fixture = fs.readFileSync(path.join(output, "01-espacio-escultorico-24.svg"), "utf8");
assert(fixture.indexOf("ESPACIO ESCULTÓRICO") < 0, "la imagen final no debe imprimir el título");
assert(fixture.indexOf("espacio-escultorico-24") < 0, "la imagen final no debe imprimir la semilla");
assert(fixture.indexOf("<text") >= 0, "la arquitectura debe conservar sus glifos");
fs.rmSync(output, { recursive: true, force: true });

console.log(JSON.stringify({
  frame: "924 × 924",
  visibleColophon: false,
  gifTextOverlay: false,
  infoLayer: "HTML / bajo demanda"
}, null, 2));
