/*
  gif-export.js — reconstruye y descarga la coreografía de una semilla.

  Dibuja directamente en canvas con la fuente ya cargada en el documento.
  No graba la pantalla ni consulta un servidor: vuelve a ejecutar el horario
  determinista del typewriter y lo codifica localmente con gifenc.
*/
(function (root) {
  "use strict";

  var clamp = function (value, min, max) { return Math.max(min, Math.min(max, value)); };

  // Mismas familias que el SVG, para que el GIF conserve intrusiones y grafías.
  var CANVAS_FONT = {
    egipcio: '"Jeroglífico Egipcio", "Unicode Backup", monospace',
    anatolio: '"Jeroglífico Anatolio", "Unicode Backup", monospace',
    linealb: '"Lineal B", "Unicode Backup", monospace',
    electronica: '"Electrónica", "Architecture Mono", monospace'
  };
  var BASE_FONT = '"Architecture Mono", "Unicode Backup", monospace';

  function drawText(ctx, item, glyph, color, alpha, scale, dx, dy, kind) {
    if (!glyph) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.font = (item.sfont * scale) + 'px ' + (kind && CANVAS_FONT[kind] ? CANVAS_FONT[kind] : BASE_FONT);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(glyph, (item.sx + (dx || 0)) * scale, (item.sy + (dy || 0)) * scale);
    ctx.restore();
  }

  // De atrás hacia adelante por profundidad 3D, igual que el SVG (v0.22).
  function paintOrder(piece) {
    if (piece.__paintOrder) return piece.__paintOrder;
    var order = piece.surface.map(function (item, index) { return index; });
    order.sort(function (a, b) {
      var da = piece.surface[a].depth || 0, db = piece.surface[b].depth || 0;
      return db - da || a - b;
    });
    piece.__paintOrder = order;
    return order;
  }

  function renderFrame(ctx, width, height, piece, state, faceColor) {
    var scale = width / 1000;
    var order = paintOrder(piece);
    ctx.globalAlpha = 1;
    ctx.fillStyle = piece.colors.papel;
    ctx.fillRect(0, 0, width, height);

    if (piece.traits.carbon) {
      order.forEach(function (index) {
        var item = piece.surface[index];
        if (!item.glyph || state[index] !== item.glyph) return;
        drawText(ctx, item, item.baseGlyph, piece.colors.carbon, 0.16, scale,
          piece.traits.direction * 3.2, 2.4, item.baseFontKind);
      });
    }

    order.forEach(function (index) {
      var item = piece.surface[index];
      if (!item.glyph || !state[index]) return;
      drawText(ctx, item, state[index], item.forcedColor || faceColor(piece, item), item.opacity, scale, 0, 0, item.fontKind);
    });

  }

  function download(bytes, filename) {
    var blob = new Blob([bytes], { type: "image/gif" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
  }

  async function exportAnimation(options) {
    if (!root.GIFENC) throw new Error("El codificador GIF no está disponible.");
    var piece = options.piece;
    var schedule = options.schedule;
    var dimension = options.dimension || 600;
    var totalFrames = clamp(Math.round(schedule.durationMs / 210), 18, 34);
    var frameDelay = Math.max(70, Math.round(schedule.durationMs / Math.max(1, totalFrames - 1)));
    var canvas = document.createElement("canvas");
    canvas.width = dimension;
    canvas.height = dimension;
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    var state = {};
    var cursor = 0;
    var gif = root.GIFENC.GIFEncoder();

    for (var frame = 0; frame < totalFrames; frame += 1) {
      var at = schedule.durationMs * frame / Math.max(1, totalFrames - 1);
      while (cursor < schedule.events.length && schedule.events[cursor].at <= at) {
        state[schedule.events[cursor].index] = schedule.events[cursor].value;
        cursor += 1;
      }
      var finalFrame = frame === totalFrames - 1;
      if (finalFrame) {
        piece.surface.forEach(function (item, index) {
          if (item.glyph) state[index] = item.glyph;
        });
      }
      renderFrame(ctx, dimension, dimension, piece, state, options.faceColor);
      var rgba = ctx.getImageData(0, 0, dimension, dimension).data;
      var palette = root.GIFENC.quantize(rgba, 128, { format: "rgb444" });
      var indexed = root.GIFENC.applyPalette(rgba, palette, "rgb444");
      gif.writeFrame(indexed, dimension, dimension, {
        palette: palette,
        delay: finalFrame ? 1100 : frameDelay,
        repeat: 0
      });
      if (options.onProgress) options.onProgress((frame + 1) / totalFrames);
      if (frame % 2 === 1) await new Promise(function (resolve) { root.requestAnimationFrame(resolve); });
    }

    gif.finish();
    var bytes = gif.bytes();
    download(bytes, options.filename || "espacio-escultorico.gif");
    return { bytes: bytes.length, frames: totalFrames, durationMs: schedule.durationMs };
  }

  root.ARQ_GIF_EXPORTER = { exportAnimation: exportAnimation };
})(typeof window !== "undefined" ? window : globalThis);
