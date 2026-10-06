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
    if (kind === "ESFERA") addSphere(builder, Object.assign(spec("esfera", x, y, 7 * scale, 7 * scale, 3.5 * scale), { solid: true }), r);
    else if (kind === "CASCARÓN") addHipar(builder, Object.assign(spec("cascarón", x, y, 15 * scale, 8 * scale, 4 * scale), { noBase: true }), r);
    else if (kind === "SERPIENTE") addFoldedSerpent(builder, spec("serpiente", x, y, 18 * scale, 7 * scale, 3 * scale), r);
    else if (kind === "LAZO") addSculpturalLoop(builder, spec("lazo", x, y, 12 * scale, 11 * scale, 3 * scale), r);
    else if (kind === "PIRÁMIDE") addPyramid(builder, Object.assign(spec("pirámide", x, y, 9 * scale, 9 * scale, 4 * scale), { noBase: true }), r);
    else if (kind === "TORRES") {
      // Grupo de prismas altos de alturas distintas, para verse de paso.
      var n = r.int(3, 5);
      for (var i = 0; i < n; i += 1) {
        block("torre-" + i, x + (i - n / 2) * 3.2 * scale + r.float(-0.6, 0.6), y + r.float(-1.5, 1.5),
          2.2 * scale, 1.7 * scale, r.float(12, 24) * scale, 0.85);
      }
    }
    settle(start);
    var w = (kind === "SERPIENTE" ? 18 : kind === "CASCARÓN" ? 15 : kind === "TORRES" ? 16 : 10) * scale;
    occupy(x - w / 2, x + w / 2, y - 4 * scale, y + 4 * scale);
    pieces.push(kind + (scale > 1.4 ? " MONUMENTAL" : ""));
  }

  // --- composición ------------------------------------------------------------
  var relation;
  if (variant === "ESPACIO ESCULTÓRICO") {
    var R = rng.float(16, 21), cx = 0, cy = R + 8;
    // El anillo: prismas idénticos con aire entre ellos. Cierra completo.
    var count = rng.int(40, 60);
    for (var k = 0; k < count; k += 1) {
      var a = k / count * TAU;
      block("anillo-" + k, cx + Math.cos(a) * R - 0.9, cy + Math.sin(a) * R - 0.7, 1.8, 1.4, rng.float(2.6, 3.4), 0.8);
    }
    occupy(cx - R - 2, cx + R + 2, cy - R - 2, cy + R + 2);
    footprints.pop();   // el anillo no tapa la lava de adentro: se marca prisma por prisma
    for (var k2 = 0; k2 < count; k2 += 1) {
      var a2 = k2 / count * TAU;
      occupy(cx + Math.cos(a2) * R - 1.3, cx + Math.cos(a2) * R + 1.3, cy + Math.sin(a2) * R - 1.2, cy + Math.sin(a2) * R + 1.2);
    }
    pieces.push("ANILLO DE " + count + " PRISMAS");
    // Afuera: uno monumental y uno o dos chicos, a distintas distancias.
    var kinds = ["SERPIENTE", "ESFERA", "CASCARÓN", "TORRES", "PIRÁMIDE", "LAZO"];
    var outside = rng.int(1, 3), used = [];
    for (var o = 0; o < outside; o += 1) {
      var kind = rng.pick(kinds.filter(function (q) { return used.indexOf(q) < 0; }));
      used.push(kind);
      var ang = (o === 0 ? rng.pick([0.15, 0.85]) : rng.float(0.05, 0.95)) * Math.PI + Math.PI; // atrás del anillo, o a los lados
      if (o > 0 && rng.chance(0.5)) ang = rng.pick([rng.float(-0.35, 0.15), rng.float(0.85, 1.35)]) * Math.PI;
      var dist = R + rng.float(7, 11) + (o === 0 ? 4 : 0);
      sculpture(kind, cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, o === 0 ? rng.float(1.4, 1.9) : rng.float(0.8, 1.1));
    }
    // La lava: intacta y densa adentro, rala afuera.
    lava(cx, cy, R - 1.6, R - 1.6, 0.8);
    lava(cx, cy, R + 18, R + 14, 0.14, function (x, y) { return Math.hypot(x - cx, y - cy) < R + 2; });
    relation = "VACÍO CENTRAL";
    // Recorrido: se rodea el anillo por fuera empezando por el frente; la lava
    // de adentro, la que no se pisa, se escribe al final.
    builder.points.forEach(function (pt) {
      var d = Math.hypot(pt.x - cx, pt.y - cy);
      var turn = (Math.atan2(pt.y - cy, pt.x - cx) + Math.PI / 2 + TAU * 2) % TAU / TAU;
      pt.walk = d < R - 1 ? 0.82 + 0.18 * (1 - d / R) : turn * 0.8;
    });
  } else {
    variant = "PEDREGAL";
    var depthMax = rng.float(54, 66), xp = rng.float(-3, 3), half = rng.float(1.9, 2.6);
    var archY = rng.float(18, 28), archW = rng.float(11, 14);
    // Umbral: el arco a horcajadas del sendero.
    arch(xp, archY, archW, rng.float(12, 16), rng.float(3, 4.5));
    // Muros: uno largo de un lado, al fondo; a veces otro corto del otro lado.
    var wallSide = rng.chance(0.5) ? 1 : -1, wallY = rng.float(archY + 10, depthMax - 6);
    wall(xp + wallSide * (half + 2), xp + wallSide * rng.float(14, 21), wallY, rng.float(7, 12), 1.2);
    if (rng.chance(0.55)) {
      var wy2 = rng.float(4, archY - 4);
      wall(xp - wallSide * (half + 3), xp - wallSide * rng.float(10, 16), wy2, rng.float(4, 7), 1);
    }
    // Espejo de agua al pie del muro largo.
    if (rng.chance(0.55)) {
      var wx0 = xp + wallSide * (half + 3), wx1 = xp + wallSide * rng.float(12, 20);
      water(Math.min(wx0, wx1), Math.max(wx0, wx1), wallY - rng.float(7, 9), wallY - 1.5);
    }
    // Esculturas fuera del eje, entre la lava.
    var choices = ["ESFERA", "SERPIENTE", "CASCARÓN", "LAZO", "PIRÁMIDE"];
    var n = rng.int(1, 2), taken = [];
    for (var s = 0; s < n; s += 1) {
      var kd = rng.pick(choices.filter(function (q) { return taken.indexOf(q) < 0; }));
      taken.push(kd);
      var sx = xp + (s === 0 ? -wallSide : rng.pick([-1, 1])) * rng.float(10, 15);
      var sy = s === 0 ? rng.float(archY + 8, depthMax - 6) : rng.float(4, archY - 4);
      sculpture(kd, sx, sy, s === 0 ? rng.float(1.1, 1.6) : rng.float(0.7, 1));
    }
    // El sendero: losas de piedra a pasos, de la entrada al fondo; bajo el arco
    // también (el umbral se cruza caminando).
    for (var ly = 1; ly < depthMax; ly += rng.float(2.4, 3.1)) {
      var lw = half * rng.float(1.2, 1.6), lx = xp + rng.float(-0.35, 0.35);
      for (var px = -lw / 2; px <= lw / 2; px += 0.8) {
        for (var py = 0; py <= 1.2; py += 0.8) builder.add("losa", "techo", lx + px, ly + py, 0.15, "losa:" + ly.toFixed(1) + ":" + px.toFixed(1) + ":" + py);
      }
    }
    // La lava cubre todo menos el sendero.
    lava(xp, depthMax / 2, 25, depthMax / 2 + 2, 0.6, function (x) { return Math.abs(x - xp) < half; });
    pieces.unshift("SENDERO");
    relation = "SENDERO Y UMBRAL";
    // Recorrido: se camina de la entrada al fondo; lo que está lejos del
    // sendero se descubre un poco después.
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
  var camera = { up: vista.float(0.42, 0.62), shear: vista.float(0.12, 0.3) * traits.direction };
  traits.perspective = 60;
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
