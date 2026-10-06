"use strict";

var assert = require("assert");
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var root = path.join(__dirname, "..");
var vendorSource = fs.readFileSync(path.join(root, "vendor", "gifenc.min.js"), "utf8");
var context = {
  Uint8Array: Uint8Array,
  Uint8ClampedArray: Uint8ClampedArray,
  ArrayBuffer: ArrayBuffer,
  Math: Math,
  Map: Map,
  Set: Set,
  console: console
};
vm.createContext(context);
vm.runInContext(vendorSource, context);

assert(context.GIFENC, "el codificador debe publicar GIFENC");
assert.strictEqual(typeof context.GIFENC.GIFEncoder, "function");
assert.strictEqual(typeof context.GIFENC.quantize, "function");
assert.strictEqual(typeof context.GIFENC.applyPalette, "function");

var width = 4;
var height = 4;
var first = new Uint8ClampedArray(width * height * 4);
var second = new Uint8ClampedArray(width * height * 4);
for (var pixel = 0; pixel < width * height; pixel += 1) {
  var offset = pixel * 4;
  first.set(pixel % 2 ? [255, 60, 160, 255] : [8, 10, 18, 255], offset);
  second.set(pixel % 3 ? [54, 255, 190, 255] : [255, 220, 20, 255], offset);
}

var encoder = context.GIFENC.GIFEncoder();
[first, second].forEach(function (rgba, index) {
  var palette = context.GIFENC.quantize(rgba, 32, { format: "rgb444" });
  var indexed = context.GIFENC.applyPalette(rgba, palette, "rgb444");
  encoder.writeFrame(indexed, width, height, {
    palette: palette, delay: index ? 900 : 120, repeat: 0
  });
});
encoder.finish();
var bytes = encoder.bytes();

assert.strictEqual(String.fromCharCode.apply(null, bytes.slice(0, 6)), "GIF89a");
assert.strictEqual(bytes[bytes.length - 1], 0x3b, "el GIF debe terminar con trailer");
assert(bytes.length > 100, "el archivo animado no debe estar vacío");

var html = fs.readFileSync(path.join(root, "index.html"), "utf8");
var vendorAt = html.indexOf("vendor/gifenc.min.js");
var exporterAt = html.indexOf("js/gif-export.js");
var verseAt = html.indexOf("js/verse.js");
assert(vendorAt > 0 && exporterAt > vendorAt && verseAt > exporterAt,
  "el codificador y el exportador deben cargar antes de Verse");

var downloadState = { clicked: false, filename: null };
var canvasContext = {
  save: function () {}, restore: function () {},
  fillRect: function () {}, fillText: function () {},
  beginPath: function () {}, moveTo: function () {},
  lineTo: function () {}, stroke: function () {},
  getImageData: function (x, y, widthValue, heightValue) {
    var data = new Uint8ClampedArray(widthValue * heightValue * 4);
    for (var p = 0; p < widthValue * heightValue; p += 1) {
      data.set(p % 2 ? [245, 220, 230, 255] : [30, 20, 25, 255], p * 4);
    }
    return { data: data };
  }
};
context.document = {
  body: { appendChild: function () {} },
  createElement: function (name) {
    if (name === "canvas") return {
      width: 0, height: 0,
      getContext: function () { return canvasContext; }
    };
    return {
      style: {},
      click: function () {
        downloadState.clicked = true;
        downloadState.filename = this.download;
      },
      remove: function () {}
    };
  }
};
context.Blob = Blob;
context.URL = { createObjectURL: function () { return "blob:test"; }, revokeObjectURL: function () {} };
context.requestAnimationFrame = function (callback) { callback(0); };
context.setTimeout = function (callback) { callback(); };
context.window = context;
vm.runInContext(fs.readFileSync(path.join(root, "js", "gif-export.js"), "utf8"), context);

var piece = {
  colors: { papel: "#f5d9df", frente: "#24161a", lateral: "#6a293e", techo: "#b33c5a", carbon: "#174ce0" },
  traits: { carbon: true, direction: 1 },
  surface: [
    { glyph: "N", baseGlyph: "N", face: "frente", sx: 100, sy: 120, sfont: 18, opacity: 1 },
    { glyph: "C", baseGlyph: "C", face: "lateral", sx: 130, sy: 150, sfont: 18, opacity: 0.9 },
    { glyph: "O", baseGlyph: "O", face: "techo", sx: 160, sy: 110, sfont: 18, opacity: 0.8 }
  ]
};
var schedule = {
  durationMs: 2400,
  events: [
    { at: 10, index: 0, value: "N" },
    { at: 400, index: 1, value: "?" },
    { at: 520, index: 1, value: "" },
    { at: 650, index: 1, value: "C" },
    { at: 1200, index: 2, value: "O" }
  ]
};

context.ARQ_GIF_EXPORTER.exportAnimation({
  piece: piece,
  schedule: schedule,
  dimension: 8,
  faceColor: function (targetPiece, item) { return targetPiece.colors[item.face]; },
  filename: "espacio-escultorico-test.gif"
}).then(function (result) {
  assert.strictEqual(result.frames, 18);
  assert(result.bytes > 100);
  assert.strictEqual(downloadState.clicked, true);
  assert.strictEqual(downloadState.filename, "espacio-escultorico-test.gif");
  console.log(JSON.stringify({
    header: "GIF89a",
    encodedFrames: result.frames,
    downloaded: downloadState.filename,
    bytes: result.bytes,
    browserBundle: Math.round(Buffer.byteLength(vendorSource) / 1024 * 10) / 10 + " KB"
  }, null, 2));
}).catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
