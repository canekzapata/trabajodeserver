// Experimento L-jardín: un compositor de jardines escultóricos.
//
// No se carga solo. jardin-parche.js inserta el texto de estas dos funciones
// dentro de una COPIA de js/architecture.js (antes de `function build`), así
// que tienen a mano todo el motor: SurfaceBuilder, VoxelField, visibleFaces,
// addArchedMass, addSphere, addHipar, addFoldedSerpent, addSculpturalLoop,
// project, glyphFor, disturb, fitToPage… El motor real no se toca.
//
// Regla: no hay figuras nuevas. El jardín es composición: pocos cuerpos del
// vocabulario que ya existe, puestos en un SITIO con relaciones (eje, umbral,
// escala, vacío) y un suelo que actúa. Dos variantes:
//   PEDREGAL             — lava, un sendero que cruza un arco-umbral, muros y
//                          a veces un espejo de agua; esculturas fuera del eje
//                          (los jardines del Pedregal, Barragán con Goeritz).
//   ESPACIO ESCULTÓRICO  — un anillo de prismas alrededor de lava intacta, y
//                          cuerpos afuera a distintas escalas (CU, 1979).
// Coordenadas: x a lo ancho, y en profundidad (planta), z hacia arriba.

/* eslint-disable no-unused-vars */
function makeGarden(traits, interpretation, rng, variant) {
  var builder = new SurfaceBuilder();
  var footprints = [];          // planta ocupada: la lava no crece encima
  var pieces = [];              // registro para la ficha
  var side = traits.direction < 0 ? "left" : "right";
  var madness = traits.madness * 0.6;   // el jardín es más sereno que el edificio

  // Asienta en el suelo (z mínimo = 0) los puntos agregados desde `start`.
  function settle(start, lift) {
    var minZ = Infinity;
    for (var i = start; i < builder.points.length; i += 1) minZ = Math.min(minZ, builder.points[i].z);
    if (!isFinite(minZ)) return;
    for (var j = start; j < builder.points.length; j += 1) builder.points[j].z += (lift || 0) - minZ;
  }
  function occupy(x0, x1, y0, y1) { footprints.push({ x0: x0, x1: x1, y0: y0, y1: y1 }); }
  function occupied(x, y) {
    return footprints.some(function (f) { return x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1; });
  }
  function spec(body, x, y, w, h, d) { return sculpturalSpec(body, x, y, w, h, d, madness, side); }

  // --- piezas del vocabulario -------------------------------------------------
  function block(body, x, y, w, d, h, step) {
    // Prisma recto: frente, lateral del lado de la luz y cubierta.
    step = step || 0.85;
    var lat = traits.direction >= 0 ? x + w : x;
    for (var z = 0; z <= h; z += step) {
      for (var bx = 0; bx <= w; bx += step) builder.add(body, "frente", x + bx, y, z, body + ":f:" + bx.toFixed(1) + ":" + z.toFixed(1));
      for (var by = step; by <= d; by += step) builder.add(body, "lateral", lat, y + by, z, body + ":l:" + by.toFixed(1) + ":" + z.toFixed(1));
    }
    for (var tx = 0; tx <= w; tx += step) {
      for (var ty = step; ty <= d; ty += step) builder.add(body, "techo", x + tx, y + ty, h, body + ":t:" + tx.toFixed(1) + ":" + ty.toFixed(1));
    }
  }
  function lava(cx, cy, rx, ry, density, keepOut) {
    // Malpaís: rejilla con huecos, borde irregular y bloques sueltos. Es suelo,
    // así que casi todo es cubierta; algunas piedras levantan un frente.
    var phase = rng.float(0, TAU);
    for (var y = cy - ry; y <= cy + ry; y += 1.35) {
      for (var x = cx - rx; x <= cx + rx; x += 1.35) {
        var ang = Math.atan2((y - cy) / ry, (x - cx) / rx);
        var edge = 0.82 + 0.18 * Math.sin(ang * 5 + phase) + 0.08 * Math.sin(ang * 13 + phase * 2);
        var r = Math.sqrt(Math.pow((x - cx) / rx, 2) + Math.pow((y - cy) / ry, 2));
        if (r > edge) continue;
        if (keepOut && keepOut(x, y)) continue;
        if (occupied(x, y) || !rng.chance(density)) continue;
        var jx = x + rng.float(-0.45, 0.45), jy = y + rng.float(-0.45, 0.45), z = rng.float(0, 0.7);
        builder.add("lava", "techo", jx, jy, z, "lava:" + x.toFixed(1) + ":" + y.toFixed(1));
        if (rng.chance(0.16)) builder.add("lava", "frente", jx, jy - 0.4, z + 0.8, "roca:" + x.toFixed(1) + ":" + y.toFixed(1));
      }
    }
  }
  function water(x0, x1, y0, y1) {
    // Espejo de agua: la única superficie regular del jardín.
    for (var y = y0; y <= y1; y += 1.0) {
      for (var x = x0; x <= x1; x += 1.0) builder.add("agua", "lateral", x, y, 0.05, "agua:" + x.toFixed(1) + ":" + y.toFixed(1));
    }
    occupy(x0 - 0.5, x1 + 0.5, y0 - 0.5, y1 + 0.5);
    pieces.push("ESPEJO DE AGUA");
  }
  function wall(x0, x1, y, h, thick) {
    var start = builder.points.length;
    block("muro", Math.min(x0, x1), y, Math.abs(x1 - x0), thick, h);
    occupy(Math.min(x0, x1) - 0.6, Math.max(x0, x1) + 0.6, y - 0.6, y + thick + 0.6);
    pieces.push("MURO");
    return start;
  }
  function arch(x, y, w, h, d) {
    var start = builder.points.length;
    addArchedMass(builder, spec("arco", x, y, w, h, d), rng.fork("arco-" + y.toFixed(0)));
    settle(start);
    occupy(x - w / 2 - 0.5, x + w / 2 + 0.5, y - 0.5, y + d + 0.5);
    pieces.push("ARCO");
  }
  // Escultura del vocabulario, asentada en el suelo y con su planta ocupada.
  function sculpture(kind, x, y, scale) {
    var start = builder.points.length, r = rng.fork("escultura-" + kind + "-" + x.toFixed(0));
    if (kind === "ARCO") addArchedMass(builder, spec("arco", x, y, 11 * scale, 13 * scale, 3.5 * scale), r);
    else if (kind === "ESFERA") addSphere(builder, Object.assign(spec("esfera", x, y, 7 * scale, 7 * scale, 3.5 * scale), { solid: true }), r);
    else if (kind === "CASCARÓN") addHipar(builder, Object.assign(spec("cascarón", x, y, 15 * scale, 8 * scale, 4 * scale), { noBase: true }), r);
    else if (kind === "SERPIENTE") addFoldedSerpent(builder, spec("serpiente", x, y, 18 * scale, 7 * scale, 3 * scale), r);
    else if (kind === "LAZO") addSculpturalLoop(builder, spec("lazo", x, y, 12 * scale, 11 * scale, 3 * scale), r);
    else if (kind === "PIRÁMIDE") addPyramid(builder, Object.assign(spec("pirámide", x, y, 9 * scale, 9 * scale, 4 * scale), { noBase: true }), r);
    else if (kind === "ESTELA") {
      block("estela", x - 1.2 * scale, y, 2.4 * scale, 1.2 * scale, r.float(7, 12) * scale, 0.85);
    } else if (kind === "TORRES") {
      // Grupo de prismas altos de alturas distintas, para verse de paso.
      var n = r.int(3, 5);
      for (var i = 0; i < n; i += 1) {
        block("torre-" + i, x + (i - n / 2) * 3.2 * scale + r.float(-0.6, 0.6), y + r.float(-1.5, 1.5),
          2.2 * scale, 1.7 * scale, r.float(12, 24) * scale, 0.85);
      }
    }
    // addSculpturalLoop ignora baseY (vive en y = 0): se lleva a su lugar.
    if (kind === "LAZO") for (var li = start; li < builder.points.length; li += 1) builder.points[li].y += y;
    settle(start);
    var w = (kind === "SERPIENTE" ? 18 : kind === "CASCARÓN" ? 15 : kind === "TORRES" ? 16 : kind === "ESTELA" ? 4 : 10) * scale;
    occupy(x - w / 2, x + w / 2, y - 4 * scale, y + 4 * scale);
    pieces.push(kind + (scale > 1.4 ? " MONUMENTAL" : ""));
  }

  // --- en pantalla: casi nada encima de otra cosa -----------------------------
  // Canek: "hay que tener mucho cuidado de que casi nada se sobreescriba atrás,
  // porque se vuelve confuso". Cada pieza se prueba en pantalla antes de
  // quedarse: si su silueta toca la de otra pieza, se quita y se busca otro
  // lugar. Y el suelo (lava, losas, agua) se borra donde quedaría bajo una pieza.
  var cam = traits.camera || { up: 0.5, shear: 0.2 };
  var GROUND = { lava: 1, losa: 1, agua: 1 };
  var placed = [];               // siluetas en pantalla de las piezas que se quedaron
  function screenBox(start, end) {
    var b = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    for (var i = start; i < end; i += 1) {
      var pt = builder.points[i], sx = pt.x + pt.y * cam.shear, sy = -pt.z - pt.y * cam.up;
      if (sx < b.x0) b.x0 = sx; if (sx > b.x1) b.x1 = sx; if (sy < b.y0) b.y0 = sy; if (sy > b.y1) b.y1 = sy;
    }
    return b;
  }
  function boxesTouch(a, b, m) { return a.x0 - m < b.x1 && b.x0 - m < a.x1 && a.y0 - m < b.y1 && b.y0 - m < a.y1; }
  // Construye una pieza con `make`; si en pantalla toca a otra, la deshace.
  function tryPiece(make, label, margin) {
    var start = builder.points.length, foot = footprints.length, made = pieces.length;
    make();
    var box = screenBox(start, builder.points.length);
    var clash = placed.some(function (other) { return boxesTouch(box, other, margin === undefined ? 1.2 : margin); });
    if (clash || !isFinite(box.x0)) {
      builder.points.length = start; footprints.length = foot; pieces.length = made;
      return false;
    }
    placed.push(box);
    return true;
  }
  // Borra el suelo que cae dentro de la silueta de cualquier pieza.
  function clearGroundUnderPieces() {
    var cell = 0.9, covered = {};
    builder.points.forEach(function (pt) {
      if (GROUND[pt.body]) return;
      var cx = Math.floor((pt.x + pt.y * cam.shear) / cell), cy = Math.floor((-pt.z - pt.y * cam.up) / cell);
      for (var dx = -1; dx <= 1; dx += 1) for (var dy = -1; dy <= 1; dy += 1) covered[(cx + dx) + "," + (cy + dy)] = 1;
    });
    builder.points = builder.points.filter(function (pt) {
      if (!GROUND[pt.body]) return true;
      return !covered[Math.floor((pt.x + pt.y * cam.shear) / cell) + "," + Math.floor((-pt.z - pt.y * cam.up) / cell)];
    });
  }

  // --- composición ------------------------------------------------------------
  var relation;
  if (variant === "ESPACIO ESCULTÓRICO") {
    // Sin anillo trazado: el círculo lo forman las piezas mismas, alrededor de
    // un vacío de lava intacta. Las del fondo son altas y grandes; las del
    // frente, bajas, para no tapar el vacío ni a las de atrás.
    var R = rng.float(15, 20), cx = 0, cy = R + 4;
    var vocab = ["ARCO", "ESFERA", "CASCARÓN", "SERPIENTE", "LAZO", "PIRÁMIDE", "TORRES", "ESTELA"];
    var count = rng.int(6, 9), phase0 = rng.float(0, TAU), placedCount = 0, usedKinds = {};
    for (var k = 0; k < count; k += 1) {
      var ok = false;
      for (var attempt = 0; attempt < 7 && !ok; attempt += 1) {
        var ang = phase0 + (k + rng.float(-0.22, 0.22)) / count * TAU;
        var back = (Math.sin(ang) + 1) / 2;                 // 0 frente · 1 fondo
        var kind = rng.pick(vocab.filter(function (q) { return (usedKinds[q] || 0) < 2; }));
        if (back < 0.3) kind = rng.pick(["PIRÁMIDE", "ESTELA", "ESFERA", "SERPIENTE"]);
        var scale = (0.55 + back * 1.15) * rng.float(0.85, 1.1) * Math.pow(0.85, attempt);
        var px = cx + Math.cos(ang) * R * rng.float(0.95, 1.08), py = cy + Math.sin(ang) * R * rng.float(0.95, 1.08);
        ok = tryPiece(function () { sculpture(kind, px, py, scale); }, kind, 0.9);
        if (ok) { usedKinds[kind] = (usedKinds[kind] || 0) + 1; placedCount += 1; }
      }
    }
    // El vacío: lava densa e intacta adentro, y apenas un borde afuera.
    lava(cx, cy, R * 0.82, R * 0.82, 0.8);
    lava(cx, cy, R * 1.25, R * 1.25, 0.22, function (x, y) { return Math.hypot(x - cx, y - cy) < R * 0.86; });
    relation = "VACÍO CENTRAL · " + placedCount + " PIEZAS EN CÍRCULO";
    clearGroundUnderPieces();
    builder.points.forEach(function (pt) {
      var d = Math.hypot(pt.x - cx, pt.y - cy);
      var turn = (Math.atan2(pt.y - cy, pt.x - cx) + Math.PI / 2 + TAU * 2) % TAU / TAU;
      pt.walk = d < R * 0.84 ? 0.82 + 0.18 * (1 - d / R) : turn * 0.8;
    });
  } else {
    variant = "PEDREGAL";
    var depthMax = rng.float(50, 62), xp = rng.float(-3, 3), half = rng.float(1.9, 2.6);
    var archY = rng.float(16, 26), archW = rng.float(11, 14);
    // Umbral: el arco a horcajadas del sendero. Es la primera pieza: manda.
    tryPiece(function () { arch(xp, archY, archW, rng.float(12, 16), rng.float(3, 4.5)); }, "ARCO");
    // Muros: más bajos y delgados que antes, y sólo si no tapan nada.
    var wallSide = rng.chance(0.5) ? 1 : -1;
    for (var wtry = 0; wtry < 5; wtry += 1) {
      var wallY = rng.float(archY + 10, depthMax - 4), wl = rng.float(10, 17), wh = rng.float(4.5, 8);
      if (tryPiece(function () { wall(xp + wallSide * (half + 2), xp + wallSide * (half + 2 + wl), wallY, wh, 0.9); }, "MURO")) break;
    }
    if (rng.chance(0.5)) {
      for (var w2 = 0; w2 < 4; w2 += 1) {
        var wy2 = rng.float(3, archY - 3);
        if (tryPiece(function () { wall(xp - wallSide * (half + 3), xp - wallSide * rng.float(9, 14), wy2, rng.float(3, 5), 0.8); }, "MURO")) break;
      }
    }
    // Esculturas fuera del eje, sin tocar a nadie en pantalla.
    var choices = ["ESFERA", "SERPIENTE", "CASCARÓN", "LAZO", "PIRÁMIDE", "ESTELA"];
    var n = rng.int(2, 3), taken = [];
    for (var s = 0; s < n; s += 1) {
      var kd = rng.pick(choices.filter(function (q) { return taken.indexOf(q) < 0; }));
      for (var st = 0; st < 7; st += 1) {
        var sx = xp + rng.pick([-1, 1]) * rng.float(8, 17);
        var sy = rng.float(3, depthMax - 3);
        var sc = (s === 0 ? rng.float(1, 1.4) : rng.float(0.65, 0.95)) * Math.pow(0.88, st);
        if (tryPiece(function () { sculpture(kd, sx, sy, sc); }, kd)) { taken.push(kd); break; }
      }
    }
    // Espejo de agua: suelo; se queda donde nadie lo tape.
    if (rng.chance(0.5)) {
      var wx0 = xp + wallSide * (half + 2.5), wx1 = xp + wallSide * rng.float(10, 16), wyy = rng.float(4, depthMax - 10);
      water(Math.min(wx0, wx1), Math.max(wx0, wx1), wyy, wyy + rng.float(4, 7));
    }
    // El sendero: losas a pasos, de la entrada al fondo (se cruza el umbral).
    for (var ly = 1; ly < depthMax; ly += rng.float(2.4, 3.1)) {
      var lw = half * rng.float(1.2, 1.6), lx = xp + rng.float(-0.35, 0.35);
      for (var px2 = -lw / 2; px2 <= lw / 2; px2 += 0.8) {
        for (var py2 = 0; py2 <= 1.2; py2 += 0.8) builder.add("losa", "techo", lx + px2, ly + py2, 0.15, "losa:" + ly.toFixed(1) + ":" + px2.toFixed(1) + ":" + py2);
      }
    }
    // Lava: agrupada en manchones, no esparcida; nunca sobre el sendero.
    var patches = rng.int(4, 7);
    for (var pt0 = 0; pt0 < patches; pt0 += 1) {
      var pcx = xp + rng.pick([-1, 1]) * rng.float(half + 4, 20), pcy = rng.float(2, depthMax - 2);
      lava(pcx, pcy, rng.float(4, 9), rng.float(4, 8), 0.7, function (x) { return Math.abs(x - xp) < half + 0.6; });
    }
    pieces.unshift("SENDERO");
    relation = "SENDERO Y UMBRAL";
    clearGroundUnderPieces();
    builder.points.forEach(function (pt) { pt.walk = pt.y / depthMax + 0.18 * Math.min(1, Math.abs(pt.x - xp) / 25); });
  }

  return {
    surface: builder.points,
    geometry: {
      kind: "JARDÍN", variant: variant, relation: relation, pieces: pieces, walk: "RECORRIDO",
      bodies: pieces.length, interpretation: interpretation.nombres.slice()
    }
  };
}

// Recorrido: reacomoda el horario del typewriter para que la máquina escriba
// el jardín en el orden en que se camina. Cada signo conserva su tropiezo
// (error → borrado → corrección); sólo se mueve en el tiempo.
function walkSchedule(piece, schedule) {
  var first = {}, writing = schedule.durationMs - 430;
  schedule.events.forEach(function (e) { if (first[e.index] === undefined) first[e.index] = e.at; });
  var visible = Object.keys(first).map(Number);
  var rng = new Azar.RNG(piece.meta.seed).fork("recorrido");
  visible.sort(function (a, b) {
    return (piece.surface[a].walk || 0) + rng.float(-0.025, 0.025) - (piece.surface[b].walk || 0);
  });
  var rank = {};
  visible.forEach(function (index, i) { rank[index] = Math.round(0.015 * writing + i / Math.max(1, visible.length - 1) * 0.94 * writing); });
  var events = schedule.events.map(function (e) { return Object.assign({}, e, { at: e.at - first[e.index] + rank[e.index] }); });
  var priority = { error: 0, erase: 1, correct: 2 };
  events.sort(function (a, b) { return a.at - b.at || priority[a.kind] - priority[b.kind] || a.index - b.index; });
  return Object.assign({}, schedule, { events: events, durationMs: Math.max(schedule.durationMs, events[events.length - 1].at + 120) });
}

function buildGarden(options) {
  options = options || {};
  var seed = options.seed === undefined ? 1 : options.seed;
  var traits = Object.assign({}, decide(seed, "escultura"));
  var rng = new Azar.RNG(seed).fork("jardin");
  // El jardín pide su propia cámara: más alta, para que se lea la planta
  // (el sendero, el anillo, la lava), con poco corrimiento lateral y el suelo
  // a nivel. La cámara de la pieza mira casi de frente: con ella el jardín
  // era una franja delgada a media lámina.
  var vista = rng.fork("vista");
  var camera = { up: vista.float(0.46, 0.66), shear: vista.float(0.1, 0.24) * traits.direction };
  traits.perspective = 60;
  traits.camera = camera;
  traits.tilt = 0;
  traits.species = "jardin";
  var variant = options.variant || (rng.fork("variante").chance(0.5) ? "PEDREGAL" : "ESPACIO ESCULTÓRICO");
  var interpretation = Corpus.interpretar(traits.phrase);
  var construction = makeGarden(traits, interpretation, rng.fork("composicion"), variant);
  var surface = construction.surface;
  surface.forEach(function (item) {
    item.rawX = (item.x + item.y * camera.shear) * 15;
    item.rawY = (-item.z - item.y * camera.up) * 15;
    item.depth = item.y;
    item.glyph = glyphFor(item, traits.palette, traits);
    item.baseGlyph = item.glyph;
    item.anomaly = false;
  });
  surface.sort(function (a, b) { return a.rawY - b.rawY || a.rawX - b.rawX; });
  disturb(surface, traits, rng.fork("errores"));
  var layout = fitToPage(surface);
  assignDelays(surface, "gramatica");
  var anomalyId = chooseAnomaly(surface, traits.palette, rng.fork("anomalia"));
  var exoticFontOf = function (glyph) {
    return traits.exoticGlyph && glyph === traits.exoticGlyph ? traits.exoticFontKind : null;
  };
  surface.forEach(function (item) {
    item.fontKind = item.intrusionFont || exoticFontOf(item.glyph);
    item.baseFontKind = exoticFontOf(item.baseGlyph);
  });
  var alphabet = [];
  surface.forEach(function (item) {
    if (item.baseGlyph && alphabet.indexOf(item.baseGlyph) === -1) alphabet.push(item.baseGlyph);
  });
  return {
    meta: {
      instrument: "espacio escultórico", speciesKey: "jardin", species: "jardín · " + variant.toLowerCase(),
      seed: String(seed), phrase: traits.phrase, alphabet: alphabet, palette: traits.palette.nombre,
      color: traits.colors.nombre, anomalyId: anomalyId, version: "jardín-experimento"
    },
    traits: traits, geometry: construction.geometry, palette: traits.palette, colors: traits.colors,
    layout: layout, surface: surface
  };
}
