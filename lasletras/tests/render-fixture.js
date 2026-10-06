"use strict";

var fs = require("fs");
var path = require("path");
var motor = require("../js/architecture.js");
var typewriter = require("../js/typewriter.js");

var FRAME = { x: 38, y: 38, width: 924, height: 924 };
function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fit(surface) {
  var xs = surface.map(function (item) { return item.rawX + item.perturbX; });
  var ys = surface.map(function (item) { return item.rawY + item.perturbY; });
  var minX = Math.min.apply(Math, xs), maxX = Math.max.apply(Math, xs);
  var minY = Math.min.apply(Math, ys), maxY = Math.max.apply(Math, ys);
  var rawWidth = Math.max(1, maxX - minX), rawHeight = Math.max(1, maxY - minY);
  var scale = Math.min(FRAME.width / rawWidth, FRAME.height / rawHeight, 3.75);
  var originX = FRAME.x + (FRAME.width - rawWidth * scale) / 2;
  var originY = FRAME.y + (FRAME.height - rawHeight * scale) / 2;
  var fontSize = Math.max(9, Math.min(34, 13 * scale));
  return surface.map(function (item) {
    return Object.assign({}, item, {
      sx: originX + (item.rawX + item.perturbX - minX) * scale,
      sy: originY + (item.rawY + item.perturbY - minY) * scale,
      fontSize: fontSize
    });
  });
}

function render(seed, output) {
  var piece = motor.build({ seed: seed });
  var progress = process.env.TYPEWRITER_PROGRESS === undefined
    ? 1 : Math.max(0, Math.min(1, Number(process.env.TYPEWRITER_PROGRESS)));
  var state = {};
  var surface = fit(piece.surface);
  piece.surface = surface;
  var schedule = typewriter.createSchedule(piece, seed);
  schedule.events.forEach(function (event) {
    if (event.at <= schedule.durationMs * progress) state[event.index] = event.value;
  });
  var glyphs = surface.map(function (item, index) {
    return Object.assign({}, item, { glyph: progress >= 1 ? item.glyph : state[index] || "" });
  }).filter(function (item) { return item.glyph; }).map(function (item) {
    var color = item.anomaly ? piece.colors.anomalia : piece.colors[item.face] || piece.colors.frente;
    return '<text x="' + item.sx.toFixed(2) + '" y="' + item.sy.toFixed(2) + '" font-size="' + item.fontSize.toFixed(2) +
      '" fill="' + color + '" opacity="' + item.opacity.toFixed(3) + '" text-anchor="middle" dominant-baseline="central">' +
      escapeXml(item.glyph) + "</text>";
  }).join("\n");
  var svg = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">\n' +
    '<style>@font-face{font-family:Architecture;src:url(../../fonts/Ac437_ApricotPortable.ttf)} text{font-family:Architecture,monospace}</style>\n' +
    '<rect width="1000" height="1000" fill="' + piece.colors.papel + '"/>\n' + glyphs + "\n</svg>";
  fs.writeFileSync(output, svg);
  return { seed: seed, output: output, piece: piece, progress: progress, schedule: schedule };
}

var outputDir = process.argv[2] || path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
var seeds = process.argv.slice(3);
if (!seeds.length) seeds = ["arquitectura-0", "arquitectura-1", "arquitectura-2"];
seeds.forEach(function (seed, index) {
  var safe = String(seed).replace(/[^a-z0-9_-]+/gi, "-");
  var result = render(seed, path.join(outputDir, String(index + 1).padStart(2, "0") + "-" + safe + ".svg"));
  console.log(JSON.stringify({ seed: seed, file: result.output, progress: result.progress,
    durationMs: result.schedule.durationMs, corrections: result.schedule.correctedMistakes, species: result.piece.meta.speciesKey,
    genes: result.piece.geometry.genealogy || null }));
});
