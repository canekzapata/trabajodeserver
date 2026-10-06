"use strict";

var assert = require("assert");
var motor = require("../js/architecture.js");
var typewriter = require("../js/typewriter.js");

function applySchedule(piece, schedule) {
  var state = {};
  schedule.events.forEach(function (event) { state[event.index] = event.value; });
  piece.surface.forEach(function (item, index) {
    if (item.glyph) assert.strictEqual(state[index], item.glyph, "cada signo debe terminar corregido");
  });
}

function spanForFace(piece, schedule, face) {
  var times = schedule.events.filter(function (event) {
    return event.kind !== "erase" && piece.surface[event.index].face === face;
  }).map(function (event) { return event.at; });
  return { min: Math.min.apply(Math, times), max: Math.max.apply(Math, times) };
}

var samplePiece = motor.build({ seed: "la-computadora-corrige-la-cupula" });
var sample = typewriter.createSchedule(samplePiece, "la-computadora-corrige-la-cupula");
var repeated = typewriter.createSchedule(samplePiece, "la-computadora-corrige-la-cupula");
assert.deepStrictEqual(sample, repeated, "el horario debe ser determinista");
assert(sample.durationMs >= 2400, "la escritura nunca debe durar menos de 2.4 segundos");
assert(sample.correctedMistakes > 0, "una lámina densa debe corregir al menos un error transitorio");
assert.strictEqual(sample.families.frente + sample.families.lateral + sample.families.techo, sample.visibleGlyphs);
assert(sample.events.every(function (event, index, list) { return !index || event.at >= list[index - 1].at; }), "los eventos deben estar ordenados");
assert(sample.events[sample.events.length - 1].at < sample.durationMs, "la última corrección debe caber en la duración");
applySchedule(samplePiece, sample);

var front = spanForFace(samplePiece, sample, "frente");
var side = spanForFace(samplePiece, sample, "lateral");
var roof = spanForFace(samplePiece, sample, "techo");
assert(side.min < front.max && roof.min < front.max && roof.min < side.max,
  "las familias deben solaparse en vez de escribirse una después de otra");

var corrected = {};
sample.events.forEach(function (event) {
  if (!corrected[event.index]) corrected[event.index] = [];
  corrected[event.index].push(event.kind);
});
Object.keys(corrected).forEach(function (index) {
  var sequence = corrected[index];
  if (sequence.indexOf("error") === -1) return;
  assert.deepStrictEqual(sequence, ["error", "erase", "correct"], "un error debe borrarse y corregirse");
});

var durations = {};
var totalCorrections = 0;
var totalVisible = 0;
for (var i = 0; i < 240; i += 1) {
  var seed = "typewriter-audit-" + i;
  var piece = motor.build({ seed: seed });
  var schedule = typewriter.createSchedule(piece, seed);
  assert(schedule.durationMs >= 2400 && schedule.durationMs <= 8500);
  applySchedule(piece, schedule);
  durations[schedule.durationMs] = true;
  totalCorrections += schedule.correctedMistakes;
  totalVisible += schedule.visibleGlyphs;
}
assert(Object.keys(durations).length > 180, "la velocidad total debe variar ampliamente entre semillas");
assert(totalCorrections / totalVisible > 0.02 && totalCorrections / totalVisible < 0.15,
  "las equivocaciones corregidas deben ser visibles pero no dominar la pieza");

console.log(JSON.stringify({
  durationMs: sample.durationMs,
  visibleGlyphs: sample.visibleGlyphs,
  correctedMistakes: sample.correctedMistakes,
  families: sample.families,
  auditedSeeds: 240,
  distinctDurations: Object.keys(durations).length,
  correctionRate: Math.round(totalCorrections / totalVisible * 10000) / 100
}, null, 2));
