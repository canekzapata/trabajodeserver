/*
  typewriter.js — la arquitectura se escribe por familias materiales.

  El horario es puro y determinista: una semilla produce siempre las mismas
  ráfagas, pausas, equivocaciones y correcciones. El reproductor usa un solo
  requestAnimationFrame, incluso en láminas con miles de signos.
*/
(function (root) {
  "use strict";

  var Azar = root.ARQ_AZAR;
  if (typeof module !== "undefined" && module.exports) Azar = Azar || require("./rng.js");

  var clamp = function (value, min, max) { return Math.max(min, Math.min(max, value)); };
  var screenX = function (item) {
    return item.sx === undefined ? item.rawX + (item.perturbX || 0) : item.sx;
  };
  var screenY = function (item) {
    return item.sy === undefined ? item.rawY + (item.perturbY || 0) : item.sy;
  };

  function ranges(items) {
    var xs = items.map(function (entry) { return screenX(entry.item); });
    var ys = items.map(function (entry) { return screenY(entry.item); });
    return {
      minX: Math.min.apply(Math, xs), maxX: Math.max.apply(Math, xs),
      minY: Math.min.apply(Math, ys), maxY: Math.max.apply(Math, ys)
    };
  }

  function normalized(value, min, max) {
    return (value - min) / Math.max(1, max - min);
  }

  function materialScore(entry, face, bounds, rng) {
    var x = normalized(screenX(entry.item), bounds.minX, bounds.maxX);
    var y = normalized(screenY(entry.item), bounds.minY, bounds.maxY);
    var noise = rng.next();
    // Ninguna familia recorre líneas estrictas: la coordenada dominante se
    // mezcla con otra dirección y con ruido sembrado.
    if (face === "frente") return (1 - y) * 0.58 + x * 0.17 + noise * 0.25;
    if (face === "lateral") return y * 0.2 + (1 - x) * 0.48 + noise * 0.32;
    return x * 0.34 + y * 0.22 + noise * 0.44;
  }

  function makeBreaths(rng) {
    var count = rng.int(2, 4);
    var breaths = [];
    for (var i = 0; i < count; i += 1) {
      breaths.push({ at: rng.float(0.16, 0.82), size: rng.float(0.025, 0.075) });
    }
    breaths.sort(function (a, b) { return a.at - b.at; });
    return breaths;
  }

  function breathe(progress, breaths) {
    var total = breaths.reduce(function (sum, breath) { return sum + breath.size; }, 0);
    var compressed = progress * (1 - total);
    breaths.forEach(function (breath) {
      if (progress >= breath.at) compressed += breath.size;
    });
    return clamp(compressed, 0, 1);
  }

  function wrongGlyph(piece, finalGlyph, rng) {
    var alternatives = (piece.meta.alphabet || []).concat([
      piece.palette.frente, piece.palette.lateral, piece.palette.techo,
      piece.palette.sombra, piece.palette.anomalia
    ]).filter(function (glyph, index, list) {
      return glyph && glyph !== finalGlyph && list.indexOf(glyph) === index;
    });
    return rng.pick(alternatives) || piece.palette.anomalia || "?";
  }

  function createSchedule(piece, seed) {
    var rng = new Azar.RNG(seed).fork("typewriter-v09");
    var visible = [];
    piece.surface.forEach(function (item, index) {
      if (item.glyph) visible.push({ item: item, index: index });
    });
    var bounds = ranges(visible);
    var density = Math.log(Math.max(2, visible.length)) / Math.log(10);
    var durationMs = Math.round(clamp(
      2200 + piece.traits.madness * 3300 + density * 330 + rng.float(0, 1050),
      2400, 8200
    ));
    var correctionRoom = 430;
    var writingDuration = durationMs - correctionRoom;
    var windows = {
      frente: { start: 0.015, end: 0.78 },
      lateral: { start: 0.1, end: 0.87 },
      techo: { start: 0.19, end: 0.94 }
    };
    var mistakeRate = clamp(0.025 + piece.traits.error / 180 + piece.traits.madness * 0.035, 0.025, 0.14);
    var events = [];
    var families = {};
    var correctedMistakes = 0;

    ["frente", "lateral", "techo"].forEach(function (face) {
      var familyRng = rng.fork("familia-" + face);
      var family = visible.filter(function (entry) { return entry.item.face === face; });
      var breaths = makeBreaths(familyRng.fork("respiraciones"));
      family.forEach(function (entry) {
        entry.score = materialScore(entry, face, bounds, familyRng);
      });
      family.sort(function (a, b) { return a.score - b.score || a.index - b.index; });
      families[face] = family.length;
      family.forEach(function (entry, rank) {
        var progress = family.length < 2 ? 0.5 : rank / (family.length - 1);
        progress = breathe(progress, breaths);
        var window = windows[face];
        var revealAt = Math.round((window.start + progress * (window.end - window.start)) * writingDuration);
        revealAt += familyRng.int(-22, 22);
        revealAt = Math.max(0, revealAt);
        var typoRng = familyRng.fork("signo-" + entry.index);
        var makesMistake = !entry.item.anomaly && typoRng.chance(mistakeRate);
        if (makesMistake) {
          correctedMistakes += 1;
          var eraseAt = revealAt + typoRng.int(58, 165);
          var correctAt = eraseAt + typoRng.int(46, 185);
          events.push({ at: revealAt, index: entry.index, kind: "error", value: wrongGlyph(piece, entry.item.glyph, typoRng) });
          events.push({ at: eraseAt, index: entry.index, kind: "erase", value: "" });
          events.push({ at: correctAt, index: entry.index, kind: "correct", value: entry.item.glyph });
        } else {
          events.push({ at: revealAt, index: entry.index, kind: "correct", value: entry.item.glyph });
        }
      });
    });

    events.sort(function (a, b) {
      var priority = { error: 0, erase: 1, correct: 2 };
      return a.at - b.at || priority[a.kind] - priority[b.kind] || a.index - b.index;
    });
    var lastEvent = events.length ? events[events.length - 1].at : 0;
    durationMs = Math.max(2400, durationMs, lastEvent + 120);
    return {
      events: events,
      durationMs: durationMs,
      correctedMistakes: correctedMistakes,
      mistakeRate: mistakeRate,
      families: families,
      visibleGlyphs: visible.length
    };
  }

  function play(schedule, applyEvent, complete) {
    var cursor = 0;
    var started = null;
    var stopped = false;
    function frame(now) {
      if (stopped) return;
      if (started === null) started = now;
      var elapsed = now - started;
      while (cursor < schedule.events.length && schedule.events[cursor].at <= elapsed) {
        applyEvent(schedule.events[cursor]);
        cursor += 1;
      }
      if (elapsed < schedule.durationMs) root.requestAnimationFrame(frame);
      else {
        while (cursor < schedule.events.length) { applyEvent(schedule.events[cursor]); cursor += 1; }
        if (complete) complete();
      }
    }
    root.requestAnimationFrame(frame);
    return function stop() { stopped = true; };
  }

  var api = { createSchedule: createSchedule, play: play };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ARQ_TYPEWRITER = api;
})(typeof window !== "undefined" ? window : globalThis);
