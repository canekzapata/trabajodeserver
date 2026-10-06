/*
  architecture.js — espacio escultórico

  Seis familias comparten la misma materia tipográfica:
  1. arco para una palabra ausente: masa voxelar excavada;
  2. dos edificios esperándose: cuerpos paramétricos que no se tocan;
  3. arquitecturas entrelazadas: cintas, cápsulas y pasillos que se atraviesan;
  4. geometrías que regresan: curvaturas, portales y orientaciones imposibles;
  5. arquitecturas con genealogía: planta, estructura, vacío, cubierta,
     anexo y deformación combinados por la semilla.
  6. ensamblajes escultóricos: esferas, hélices, pirámides, cubos y
     obeliscos rotos que se apoyan, atraviesan o suspenden entre sí.

  La semilla es el único parámetro público. Decide especie, frase, masa,
  vacío, perspectiva, error, relación, morfologías, alfabeto y color.
*/
(function (root) {
  "use strict";

  var Azar = root.ARQ_AZAR;
  var Corpus = root.ARQ_CORPUS;
  if (typeof module !== "undefined" && module.exports) {
    Azar = Azar || require("./rng.js");
    Corpus = Corpus || require("./corpus.js");
  }

  var clamp = function (value, min, max) { return Math.max(min, Math.min(max, value)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var voxelKey = function (x, y, z) { return x + "," + y + "," + z; };
  var TAU = Math.PI * 2;
  var MORPHOLOGIES = ["ESTRATOS", "COSTILLAS", "PANTALLA", "ANILLO", "PLIEGUE", "TÓTEM", "VÓRTICE", "CELOSÍA", "HIPERBOLOIDE", "ZIGURAT", "ACUEDUCTO", "VOLADIZOS", "MÉNSULAS", "TORRE HELICOIDAL", "CUBOS ENCAJADOS", "ESFERA", "PIRÁMIDE", "OBELISCO ROTO"];
  var ENTANGLEMENTS = ["DOBLE HÉLICE", "LAZO HABITABLE", "CÁPSULAS ENLAZADAS", "ESPIRAL ATRAVESADA", "NUDO DE LOSAS"];
  var NON_EUCLIDEAN = ["ESFERA HABITABLE", "INTERIOR MAYOR QUE EL EXTERIOR", "PASILLO RECURRENTE", "CÚPULA INVERSA", "PATIO DE HORIZONTE CURVO"];
  var SCULPTURAL_ASSEMBLIES = [
    "ESFERA MONUMENTAL", "ESFERA SOBRE HÉLICE", "HÉLICE SOBRE ESFERA", "OBELISCO ROTO",
    "PIRÁMIDES INTERPENETRADAS", "CUBOS EN ESPIRAL",
    "ARCO CON CUERPO SUSPENDIDO", "EQUILIBRIO DE TRES CUERPOS",
    "ONDA ESTACIONARIA", "LAZO ATRAVESADO", "PARABOLOIDE MONUMENTAL",
    "HIPAR MONUMENTAL"
  ];
  var ARCH_FOOTPRINTS = ["BARRA", "L", "U", "PATIO", "ANILLO", "TORRES", "BASAMENTO ESCALONADO", "CRUJÍAS PARALELAS", "PUENTE HABITADO"];
  // Las formas que antes sólo existían como especies autónomas —onda, nudo,
  // lazo— entran también aquí: cualquier cuerpo del catálogo puede ser el
  // cuerpo de una genealogía, no sólo una pieza suelta.
  // ANILLOS va en plural para no confundirse con la planta ANILLO ni con la
  // cubierta ANILLO SUPERIOR: son tres cosas distintas (huella, cuerpo, remate).
  // Lo mismo con VOLADIZOS (cuerpo apilado) frente a la cubierta VOLADIZO.
  var ARCH_STRUCTURES = ["MASA ARQUEADA", "ARCADAS", "TORRE HELICOIDAL", "MÉNSULAS", "BÓVEDAS", "ROTONDA", "CUBOS ENCAJADOS", "PIRÁMIDES", "ESFERAS", "OBELISCO ROTO", "COSTILLAS", "LOSAS", "ZIGURATS", "COLUMNAS", "PÓRTICOS", "CELOSÍAS", "PANTALLAS", "CINTAS", "ONDA", "NUDO", "LAZO", "ANILLOS", "TÓTEM", "VÓRTICE", "HIPERBOLOIDE", "VOLADIZOS", "ESPIRAL", "DOBLE HÉLICE", "CÁPSULAS ENLAZADAS", "ESPIRAL ATRAVESADA", "ESFERA HABITABLE", "MÖBIUS", "SERPIENTE", "HIPAR"];
  var ARCH_VOIDS = ["ARCO", "TÚNEL", "PATIO", "GRIETA", "PORTAL", "NÚCLEO AUSENTE"];
  var ARCH_CROWNS = [
    "NINGUNA", "ANILLO SUPERIOR", "VOLADIZO", "CÚPULA", "CÚPULA INVERSA",
    "MEDIA LUNA INVERTIDA", "ANTENA PARABÓLICA", "BLOQUE DESPLAZADO",
    "TERRAZAS", "ALETAS", "CORONA", "VOLUTA",
    "ONDA SUSPENDIDA", "NUDO SUSPENDIDO"
  ];
  var ARCH_ANNEXES = ["PUENTE INCOMPLETO", "TORRE PARÁSITA", "ESCALERA", "BALCÓN", "MEDIA LUNA", "SEGUNDO CUERPO", "NINGUNO"];
  var ARCH_DEFORMATIONS = ["INCLINAR", "CURVAR", "TORCER", "REPETIR", "EROSIONAR", "ENTRELAZAR"];
  var ARCH_LANGUAGES = ["SIN MANIFIESTO", "EXPRESIONISMO MODERNO", "DECONSTRUCTIVISMO", "PARAMETRISMO"];

  var MORPHOLOGY_WEIGHTS = [
    { nombre: "ACUEDUCTO", peso: 18 }, { nombre: "MÉNSULAS", peso: 17 },
    { nombre: "TORRE HELICOIDAL", peso: 20 }, { nombre: "COSTILLAS", peso: 16 },
    { nombre: "ANILLO", peso: 15 }, { nombre: "ZIGURAT", peso: 15 },
    { nombre: "ESTRATOS", peso: 14 }, { nombre: "CUBOS ENCAJADOS", peso: 13 },
    { nombre: "ESFERA", peso: 13 }, { nombre: "PIRÁMIDE", peso: 13 },
    { nombre: "HIPERBOLOIDE", peso: 11 }, { nombre: "VOLADIZOS", peso: 10 },
    { nombre: "OBELISCO ROTO", peso: 9 },
    { nombre: "CELOSÍA", peso: 8 }, { nombre: "VÓRTICE", peso: 7 },
    { nombre: "PLIEGUE", peso: 5 }, { nombre: "PANTALLA", peso: 4 },
    { nombre: "TÓTEM", peso: 3 }
  ];
  var ARCH_FOOTPRINT_WEIGHTS = [
    { nombre: "BARRA", peso: 16 }, { nombre: "U", peso: 14 },
    { nombre: "PATIO", peso: 14 }, { nombre: "L", peso: 10 },
    { nombre: "ANILLO", peso: 10 }, { nombre: "BASAMENTO ESCALONADO", peso: 10 },
    { nombre: "CRUJÍAS PARALELAS", peso: 10 }, { nombre: "PUENTE HABITADO", peso: 8 },
    { nombre: "TORRES", peso: 8 }
  ];
  var ARCH_STRUCTURE_WEIGHTS = [
    { nombre: "MASA ARQUEADA", peso: 22 }, { nombre: "ARCADAS", peso: 18 },
    { nombre: "TORRE HELICOIDAL", peso: 20 }, { nombre: "PIRÁMIDES", peso: 16 },
    { nombre: "MÉNSULAS", peso: 15 }, { nombre: "ESFERAS", peso: 19 },
    { nombre: "BÓVEDAS", peso: 14 }, { nombre: "ROTONDA", peso: 13 },
    { nombre: "CUBOS ENCAJADOS", peso: 12 }, { nombre: "ZIGURATS", peso: 16 },
    { nombre: "OBELISCO ROTO", peso: 11 },
    { nombre: "COSTILLAS", peso: 10 }, { nombre: "LOSAS", peso: 9 },
    { nombre: "COLUMNAS", peso: 7 }, { nombre: "PÓRTICOS", peso: 7 },
    { nombre: "CELOSÍAS", peso: 4 }, { nombre: "PANTALLAS", peso: 3 },
    { nombre: "CINTAS", peso: 3 },
    { nombre: "ONDA", peso: 8 }, { nombre: "NUDO", peso: 7 },
    { nombre: "LAZO", peso: 7 },
    { nombre: "ANILLOS", peso: 9 }, { nombre: "HIPERBOLOIDE", peso: 9 },
    { nombre: "VÓRTICE", peso: 8 }, { nombre: "VOLADIZOS", peso: 8 },
    { nombre: "ESPIRAL", peso: 7 }, { nombre: "TÓTEM", peso: 5 },
    { nombre: "DOBLE HÉLICE", peso: 7 }, { nombre: "ESFERA HABITABLE", peso: 7 },
    { nombre: "MÖBIUS", peso: 7 }, { nombre: "ESPIRAL ATRAVESADA", peso: 6 },
    { nombre: "CÁPSULAS ENLAZADAS", peso: 6 }, { nombre: "SERPIENTE", peso: 9 },
    { nombre: "HIPAR", peso: 9 }
  ];
  var ARCH_CROWN_WEIGHTS = [
    { nombre: "NINGUNA", peso: 24 }, { nombre: "ANILLO SUPERIOR", peso: 11 },
    { nombre: "TERRAZAS", peso: 11 }, { nombre: "VOLADIZO", peso: 12 },
    { nombre: "BLOQUE DESPLAZADO", peso: 9 }, { nombre: "ALETAS", peso: 8 },
    { nombre: "CÚPULA INVERSA", peso: 9 }, { nombre: "ANTENA PARABÓLICA", peso: 9 },
    { nombre: "MEDIA LUNA INVERTIDA", peso: 8 },
    { nombre: "CÚPULA", peso: 7 }, { nombre: "CORONA", peso: 4 },
    { nombre: "VOLUTA", peso: 8 },
    { nombre: "ONDA SUSPENDIDA", peso: 6 }, { nombre: "NUDO SUSPENDIDO", peso: 6 }
  ];
  var SCULPTURAL_ASSEMBLY_WEIGHTS = [
    { nombre: "ESFERA MONUMENTAL", peso: 28 },
    { nombre: "ESFERA SOBRE HÉLICE", peso: 20 },
    { nombre: "HÉLICE SOBRE ESFERA", peso: 20 },
    { nombre: "OBELISCO ROTO", peso: 16 },
    { nombre: "PIRÁMIDES INTERPENETRADAS", peso: 14 },
    { nombre: "CUBOS EN ESPIRAL", peso: 10 },
    { nombre: "ARCO CON CUERPO SUSPENDIDO", peso: 10 },
    { nombre: "EQUILIBRIO DE TRES CUERPOS", peso: 9 },
    { nombre: "ONDA ESTACIONARIA", peso: 10 },
    { nombre: "LAZO ATRAVESADO", peso: 6 },
    { nombre: "PARABOLOIDE MONUMENTAL", peso: 11 },
    { nombre: "HIPAR MONUMENTAL", peso: 12 }
  ];
  var ARCH_LANGUAGE_WEIGHTS = [
    { nombre: "SIN MANIFIESTO", peso: 34 },
    { nombre: "EXPRESIONISMO MODERNO", peso: 10 },
    { nombre: "DECONSTRUCTIVISMO", peso: 9 },
    { nombre: "PARAMETRISMO", peso: 11 }
  ];

  // --- Grosor del cuerpo y elección de alfabeto ----------------------------
  // No todo signo sirve para todo cuerpo. Un glifo macizo (□ ▲ ▓ ▨) empasta
  // una torre helicoidal, una cinta o una celosía hasta borrarla; una cornisa
  // plana (MÉNSULA) no arma volumen si el cuerpo tampoco lo trae —«dos ménsulas
  // juntas no hacen profundidad»—. Por eso la semilla ya no elige el alfabeto
  // del catálogo entero: elige del subconjunto compatible con el grosor de la
  // forma. El determinismo se conserva —una sola extracción del stream, como
  // antes—; sólo cambia de qué lista se extrae.
  var CUERPOS_DELICADOS = {
    "TORRE HELICOIDAL": 1, "CINTAS": 1, "CELOSÍAS": 1, "CELOSÍA": 1, "PANTALLAS": 1,
    "PANTALLA": 1, "ESPIRAL": 1, "HIPERBOLOIDE": 1, "VÓRTICE": 1, "ANILLOS": 1,
    "ANILLO": 1, "DOBLE HÉLICE": 1, "ESPIRAL ATRAVESADA": 1, "MÖBIUS": 1,
    "SERPIENTE": 1, "VOLADIZOS": 1, "COSTILLAS": 1, "PLIEGUE": 1, "HIPAR": 1,
    "ONDA": 1, "NUDO": 1, "LAZO": 1
  };
  var CUERPOS_MACIZOS = {
    "ESFERAS": 1, "ESFERA": 1, "PIRÁMIDES": 1, "PIRÁMIDE": 1, "CUBOS ENCAJADOS": 1,
    "ZIGURATS": 1, "ZIGURAT": 1, "MASA ARQUEADA": 1, "ROTONDA": 1, "BÓVEDAS": 1,
    "OBELISCO ROTO": 1, "ESFERA HABITABLE": 1, "ESTRATOS": 1
  };
  var ENSAMBLAJES_DELICADOS = {
    "ONDA ESTACIONARIA": 1, "PARABOLOIDE MONUMENTAL": 1, "LAZO ATRAVESADO": 1,
    "HIPAR MONUMENTAL": 1
  };

  function formThickness(species, forms) {
    if (species === "arco") return "MACIZA";              // masa voxelar excavada
    if (species === "escultura") {
      return ENSAMBLAJES_DELICADOS[forms.sculpturalAssembly] ? "DELICADA" : "MACIZA";
    }
    if (species === "entrelazada") return "DELICADA";     // cintas y cápsulas delgadas
    if (species === "noeuclidiana") return "MEDIA";       // cúpulas y portales con algo de masa
    if (species === "espera") {
      // Díptico: si cualquiera de los dos cuerpos es delgado, se le protege.
      if (CUERPOS_DELICADOS[forms.leftMorph] || CUERPOS_DELICADOS[forms.rightMorph]) return "DELICADA";
      if (CUERPOS_MACIZOS[forms.leftMorph] && CUERPOS_MACIZOS[forms.rightMorph]) return "MACIZA";
      return "MEDIA";
    }
    // Genealogía: manda la estructura principal.
    if (CUERPOS_DELICADOS[forms.archStructure]) return "DELICADA";
    if (CUERPOS_MACIZOS[forms.archStructure]) return "MACIZA";
    return "MEDIA";
  }

  function alphabetCandidates(grosor) {
    return Corpus.paletas.filter(function (p) {
      // DELICADA: fuera lo macizo (empasta) y fuera lo plano (no hay volumen que
      // lo sostenga). MEDIA: fuera sólo lo plano. MACIZA: todo cabe —incluida la
      // cornisa plana, porque el cuerpo ya trae su profundidad.
      if (grosor === "DELICADA") return p.cuerpo !== "MACIZO" && p.profundidad !== false;
      if (grosor === "MEDIA") return p.profundidad !== false;
      return true;
    });
  }

  function pickAlphabet(rng, grosor) {
    var candidates = alphabetCandidates(grosor);
    if (!candidates.length) candidates = Corpus.paletas;
    return rng.pick(candidates);                           // una sola extracción del stream
  }

  function weightedPick(items, rng) {
    var total = items.reduce(function (sum, item) { return sum + (item.peso || 1); }, 0);
    var cursor = rng.float(0, total);
    for (var i = 0; i < items.length; i += 1) {
      cursor -= items[i].peso || 1;
      if (cursor <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  function weightedName(items, rng) {
    return weightedPick(items, rng).nombre;
  }

  var GENERATIVE_COLOR_WEIGHTS = [
    { nombre: "RECURSIVA", peso: 18 },
    { nombre: "COMPLEMENTARIA BRUSCA", peso: 18 },
    { nombre: "TERMINAL ÁCIDA", peso: 16 },
    { nombre: "TRÍADA ELÉCTRICA", peso: 15 },
    { nombre: "ARCHIVO MUTANTE", peso: 14 },
    { nombre: "ANÁLOGA TENSIONADA", peso: 11 }
  ];

  function wrapHue(value) {
    value %= 360;
    return value < 0 ? value + 360 : value;
  }

  function hslToRgb(h, s, l) {
    h = wrapHue(h) / 360;
    s = clamp(s / 100, 0, 1);
    l = clamp(l / 100, 0, 1);
    if (s === 0) return [l, l, l];
    var hue = function (p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)];
  }

  function relativeLuminance(h, s, l) {
    return hslToRgb(h, s, l).map(function (channel) {
      return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    }).reduce(function (sum, channel, index) {
      return sum + channel * [0.2126, 0.7152, 0.0722][index];
    }, 0);
  }

  function contrastRatio(a, b) {
    var light = Math.max(a, b);
    var dark = Math.min(a, b);
    return (light + 0.05) / (dark + 0.05);
  }

  function contrastingHsl(h, s, l, paper, minimum) {
    var paperLum = relativeLuminance(paper.h, paper.s, paper.l);
    var direction = paper.l > 50 ? -1 : 1;
    var adjusted = l;
    var guard = 0;
    while (contrastRatio(relativeLuminance(h, s, adjusted), paperLum) < minimum && guard < 24) {
      adjusted = clamp(adjusted + direction * 3.5, 2, 98);
      guard += 1;
    }
    return "hsl(" + Math.round(wrapHue(h)) + ", " + Math.round(s) + "%, " + Math.round(adjusted) + "%)";
  }

  function channelToHex(channel) {
    var value = Math.round(clamp(channel, 0, 1) * 255);
    return (value < 16 ? "0" : "") + value.toString(16);
  }

  function hslToHex(h, s, l) {
    var rgb = hslToRgb(h, s, l);
    return "#" + channelToHex(rgb[0]) + channelToHex(rgb[1]) + channelToHex(rgb[2]);
  }

  // Matiz de cualquier color de la paleta (acepta hex, hsl() o rgb()).
  function parseHue(color) {
    var text = String(color || "").trim();
    var hsl = text.match(/hsl\(\s*([\d.]+)/i);
    if (hsl) return wrapHue(Number(hsl[1]));
    var r, g, b;
    var rgb = text.match(/rgb\(\s*([\d.]+)\D+([\d.]+)\D+([\d.]+)/i);
    if (rgb) { r = +rgb[1] / 255; g = +rgb[2] / 255; b = +rgb[3] / 255; }
    else if (text.charAt(0) === "#") {
      var hex = text.slice(1);
      if (hex.length === 3) hex = hex.replace(/./g, function (c) { return c + c; });
      if (hex.length < 6) return null;
      r = parseInt(hex.slice(0, 2), 16) / 255;
      g = parseInt(hex.slice(2, 4), 16) / 255;
      b = parseInt(hex.slice(4, 6), 16) / 255;
    } else return null;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    if (d < 0.0001) return null; // gris: no aporta matiz
    var hue;
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    return wrapHue(hue * 60);
  }

  // Un color que no está en la página: el matiz más lejano a todos los de la
  // paleta, en neón saturado. Alimenta las intrusiones de block elements.
  function foreignColorFor(colors, rng) {
    var used = ["papel", "frente", "lateral", "techo", "anomalia", "carbon"]
      .map(function (key) { return parseHue(colors[key]); })
      .filter(function (hue) { return hue !== null; });
    var offset = rng.float(0, 30);
    var bestHue = offset, bestGap = -1;
    for (var step = 0; step < 24; step += 1) {
      var candidate = wrapHue(offset + step * 15);
      var gap = used.length ? Math.min.apply(Math, used.map(function (hue) {
        var diff = Math.abs(candidate - hue) % 360;
        return diff > 180 ? 360 - diff : diff;
      })) : 180;
      if (gap > bestGap) { bestGap = gap; bestHue = candidate; }
    }
    return hslToHex(bestHue, 92, paperIsLight(colors.papel) ? 47 : 60);
  }

  // Brillo aproximado del papel para decidir cuán claro debe ser el intruso.
  function paperIsLight(color) {
    var text = String(color || "");
    var hsl = text.match(/hsl\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*([\d.]+)%/i);
    if (hsl) return Number(hsl[1]) > 50;
    var hex = text.charAt(0) === "#" ? text.slice(1) : "";
    if (hex.length === 3) hex = hex.replace(/./g, function (c) { return c + c; });
    if (hex.length >= 6) {
      var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5;
    }
    return false;
  }

  function recursiveHue(parent, depth, rng) {
    var variation = Math.max(8, 42 - depth * 8);
    var child = wrapHue(parent + rng.float(-variation / 2, variation / 2));
    if (depth < 3 && rng.chance(0.3)) return recursiveHue(child, depth + 1, rng);
    return child;
  }

  function generateColorGenealogy(rng) {
    // Adaptación determinista de la genealogía cromática del repositorio
    // canekzapata/fonts: tres semillas HSL, hijos recursivos y saltos de 120°.
    var mode = weightedName(GENERATIVE_COLOR_WEIGHTS, rng.fork("modo"));
    var base = rng.float(0, 360);
    var darkPaper = mode === "TERMINAL ÁCIDA" || (mode !== "ARCHIVO MUTANTE" && rng.chance(0.54));
    var paper = mode === "ARCHIVO MUTANTE"
      ? { h: rng.float(32, 52), s: rng.float(9, 24), l: rng.float(89, 97) }
      : darkPaper
        ? { h: wrapHue(base + rng.float(-36, 36)), s: rng.float(12, 38), l: rng.float(3, 12) }
        : { h: wrapHue(base + rng.float(-24, 24)), s: rng.float(8, 28), l: rng.float(89, 97) };
    darkPaper = paper.l < 50;

    var frontHue = base;
    var lateralHue;
    var roofHue;
    if (mode === "COMPLEMENTARIA BRUSCA") {
      lateralHue = base + 180;
      roofHue = base + rng.pick([52, 128, 232]);
    } else if (mode === "TRÍADA ELÉCTRICA") {
      lateralHue = base + 120;
      roofHue = base + 240;
    } else if (mode === "TERMINAL ÁCIDA") {
      lateralHue = base + rng.float(68, 104);
      roofHue = base + rng.float(176, 224);
    } else if (mode === "ANÁLOGA TENSIONADA") {
      lateralHue = base + rng.float(18, 38);
      roofHue = base + rng.float(178, 208);
    } else if (mode === "ARCHIVO MUTANTE") {
      frontHue = base + rng.float(-8, 8);
      lateralHue = base + rng.pick([142, 178, 214]);
      roofHue = lateralHue + rng.float(34, 82);
    } else {
      lateralHue = recursiveHue(base, 0, rng.fork("hijo-lateral"));
      roofHue = recursiveHue(lateralHue + 120, 1, rng.fork("hijo-cubierta"));
    }

    var bright = darkPaper;
    var frontL = bright ? rng.float(82, 95) : rng.float(7, 17);
    var lateralL = bright ? rng.float(66, 86) : rng.float(18, 34);
    var roofL = bright ? rng.float(70, 90) : rng.float(17, 34);
    var frontS = mode === "ARCHIVO MUTANTE" ? rng.float(18, 62) : rng.float(72, 100);
    var lateralS = rng.float(76, 100);
    var roofS = rng.float(72, 100);
    var anomalyHue = wrapHue(base + rng.pick([150, 180, 210]));
    var carbonHue = wrapHue(roofHue + 120);

    return {
      nombre: "GEN/" + mode + " " + Math.round(base) + "°",
      familia: "generativa", generativa: true, modo: mode, matiz: Math.round(base), peso: 1,
      papel: "hsl(" + Math.round(paper.h) + ", " + Math.round(paper.s) + "%, " + Math.round(paper.l) + "%)",
      frente: contrastingHsl(frontHue, frontS, frontL, paper, 7),
      lateral: contrastingHsl(lateralHue, lateralS, lateralL, paper, 3.6),
      techo: contrastingHsl(roofHue, roofS, roofL, paper, 3.6),
      anomalia: contrastingHsl(anomalyHue, 96, bright ? 72 : 34, paper, 4.5),
      carbon: contrastingHsl(carbonHue, 88, bright ? 68 : 30, paper, 3.2)
    };
  }

  function perspectiveByChance(rng) {
    var chance = rng.next();
    if (chance < 0.025) return rng.int(2, 21);       // casi frontal: raro pero posible
    if (chance < 0.11) return rng.int(22, 46);
    return rng.int(47, 94);
  }

  function madnessByChance(rng) {
    var chance = rng.next();
    if (chance < 0.48) return rng.float(0.16, 0.48);
    if (chance < 0.87) return rng.float(0.48, 0.8);
    return rng.float(0.8, 1);
  }

  function curvatureByChance(rng) {
    var chance = rng.next();
    if (chance < 0.42) return { value: rng.float(0.32, 1), className: "POSITIVA" };
    if (chance < 0.8) return { value: rng.float(-1, -0.32), className: "NEGATIVA" };
    return { value: rng.float(-0.14, 0.14), className: "CASI PLANA" };
  }

  function decide(seed, forceSpecies) {
    var rng = new Azar.RNG(seed).fork("decisiones");
    var speciesRoll = rng.next();
    var species = forceSpecies || (speciesRoll < 0.6
      ? "gramatica" : speciesRoll < 0.78 ? "escultura" : speciesRoll < 0.86
        ? "arco" : speciesRoll < 0.92 ? "espera"
          : speciesRoll < 0.97 ? "entrelazada" : "noeuclidiana");
    var madness = madnessByChance(rng.fork("temperatura"));
    var relation = rng.pick(["ESPEJO IMPERFECTO", "PARIENTES", "DESCONOCIDOS", "UNO RECUERDA MAL AL OTRO"]);
    var leftMorph = weightedName(MORPHOLOGY_WEIGHTS, rng);
    var rightMorph = relation === "ESPEJO IMPERFECTO" ? leftMorph : weightedName(MORPHOLOGY_WEIGHTS, rng);
    if (relation === "PARIENTES" && rng.chance(0.68)) rightMorph = leftMorph;
    var phrase = rng.pick(Corpus.frasesPorEspecie[species]);
    var colorRng = rng.fork("color-v07");
    var color = colorRng.chance(0.72)
      ? generateColorGenealogy(colorRng.fork("genealogia"))
      : weightedPick(Corpus.colores, colorRng.fork("editada"));
    // El alfabeto respeta el grosor del cuerpo (ver pickAlphabet). Las formas
    // que lo deciden viven todas en forks position-independent, así que se
    // adelantan aquí sin alterar ningún otro stream: la estructura de la
    // genealogía y el ensamblaje escultórico se calculan con los mismos tags
    // que abajo, de modo que rinden idénticos valores.
    var archStructure = weightedName(ARCH_STRUCTURE_WEIGHTS, rng.fork("estructura-arquitectonica"));
    var sculpturalAssembly = weightedName(SCULPTURAL_ASSEMBLY_WEIGHTS, rng.fork("ensamblaje-escultorico"));
    var formGrosor = formThickness(species, {
      leftMorph: leftMorph, rightMorph: rightMorph,
      archStructure: archStructure, sculpturalAssembly: sculpturalAssembly
    });
    // La paleta se clona: la grafía exótica puede reescribir una de sus caras
    // sin contaminar el catálogo compartido entre semillas.
    var glyphs = Object.assign({}, pickAlphabet(rng, formGrosor));
    // Grafía exótica: rara vez una cara entera de la pieza deja de ser
    // tipográfica y se vuelve jeroglífica. Es exclusiva justamente porque
    // casi no se selecciona.
    var exoticRng = rng.fork("grafia-exotica-v13");
    var exoticGlyph = null, exoticFontKind = null;
    if (exoticRng.chance(0.135)) {
      var exoticSet = exoticRng.pick(Corpus.jeroglificos.concat([Corpus.electronica]));
      exoticGlyph = exoticRng.pick(exoticSet.signos);
      exoticFontKind = exoticSet.fontKind;
      glyphs.techo = exoticGlyph; // la cubierta de la pieza habla otro sistema
    }
    // Intrusión: ≈30% de las piezas dejan colarse signos que no son de la
    // paleta —un jeroglífico suelto o un block element de un color foráneo.
    var intrusion = rng.fork("intrusion-v13").chance(0.56);
    var foreignColor = foreignColorFor(color, rng.fork("color-foraneo-v13"));
    var perspective = perspectiveByChance(rng.fork("perspectiva"));
    var curvature = curvatureByChance(rng.fork("curvatura"));
    var archFootprint = weightedName(ARCH_FOOTPRINT_WEIGHTS, rng.fork("planta-arquitectonica"));
    // archStructure ya se calculó arriba (mismo fork, mismo valor) para decidir
    // el grosor del alfabeto.
    var archVoid = rng.pick(ARCH_VOIDS);
    var archCrown = weightedName(ARCH_CROWN_WEIGHTS, rng.fork("cubierta-arquitectonica"));
    if (archStructure === "MASA ARQUEADA" && rng.chance(0.32)) archCrown = "ANILLO SUPERIOR";
    else if (archVoid === "ARCO" && rng.chance(0.16)) archCrown = "ANILLO SUPERIOR";
    else if (archStructure === "ESFERAS" && rng.chance(0.52)) {
      archCrown = rng.pick([
        "CÚPULA INVERSA", "MEDIA LUNA INVERTIDA",
        "ANTENA PARABÓLICA", "ANILLO SUPERIOR"
      ]);
    }
    // El arco puede recibir un capitel que no es cubierta sino cuerpo: la onda
    // o el nudo posados sobre el vano. Es la vía por la que las formas
    // escultóricas entran a coronar la arquitectura, no sólo a acompañarla.
    // No le quita arcos al motivo arco + anillo superior, que es recurrente:
    // sólo entra donde el anillo no fue elegido.
    if ((archStructure === "MASA ARQUEADA" || archVoid === "ARCO") &&
      archCrown !== "ANILLO SUPERIOR" &&
      rng.fork("capitel-escultorico").chance(0.22)) {
      archCrown = rng.fork("capitel-cual").pick(["ONDA SUSPENDIDA", "NUDO SUSPENDIDO"]);
    }
    // La ménsula (bóveda por aproximación de hiladas) nunca se queda sola: si
    // iba a coronarse con NINGUNA, recibe una compañera —a menudo la media luna.
    if (archStructure === "MÉNSULAS" && archCrown === "NINGUNA") {
      archCrown = rng.fork("mensula-companera").pick([
        "MEDIA LUNA INVERTIDA", "MEDIA LUNA INVERTIDA", "CÚPULA",
        "CÚPULA INVERSA", "ANILLO SUPERIOR", "TERRAZAS"
      ]);
    }
    // La media luna se veía poco fuera de la corona: se refuerza su aparición
    // como anexo lateral (misma extracción del stream, empujón vía fork).
    var archAnnex = rng.pick(ARCH_ANNEXES);
    if (rng.fork("luna-visible-v13").chance(0.1)) archAnnex = "MEDIA LUNA";

    return {
      species: species,
      phrase: phrase,
      mass: rng.int(30, 95),
      opening: rng.int(28, 88),
      perspective: perspective,
      perspectiveClass: perspective < 22 ? "CASI FRONTAL" : perspective < 47 ? "CERCANA" : "OBLICUA",
      error: rng.chance(0.06) ? rng.int(0, 2) : rng.int(3, Math.round(9 + madness * 10)),
      madness: madness,
      temperature: madness < 0.4 ? "SERENA" : madness < 0.75 ? "INESTABLE" : "FEBRIL",
      direction: rng.chance(0.5) ? 1 : -1,
      tilt: rng.chance(0.2 + madness * 0.35) ? rng.float(-0.18, 0.18) * madness : 0,
      relation: relation,
      leftMorph: leftMorph,
      rightMorph: rightMorph,
      entangleForm: rng.pick(ENTANGLEMENTS),
      entangleBodies: rng.int(2, madness > 0.78 ? 4 : 3),
      entangleTurns: rng.int(2, madness > 0.72 ? 4 : 3),
      nonEuclideanForm: rng.pick(NON_EUCLIDEAN),
      sculpturalAssembly: sculpturalAssembly,
      curvature: curvature.value,
      curvatureClass: curvature.className,
      gravityCenters: rng.int(1, madness > 0.72 ? 3 : 2),
      portals: rng.int(1, madness > 0.68 ? 4 : 3),
      orientationFault: rng.chance(0.28 + madness * 0.48),
      archFootprint: archFootprint,
      archStructure: archStructure,
      archVoid: archVoid,
      archCrown: archCrown,
      archAnnex: archAnnex,
      archDeformation: rng.pick(ARCH_DEFORMATIONS),
      archLanguage: weightedName(ARCH_LANGUAGE_WEIGHTS, rng.fork("lenguaje-arquitectonico")),
      topologicalContamination: rng.chance(0.035 + madness * 0.045)
        ? rng.pick(["HORIZONTE CURVO", "GRAVEDAD PARCIAL", "INTERIOR EXPANDIDO"])
        : "NINGUNA",
      alphabetRelation: rng.pick(["MISMO IDIOMA", "CARAS INVERTIDAS", "TRADUCCIÓN MATERIAL"]),
      palette: glyphs,
      formGrosor: formGrosor,
      colors: color,
      carbon: rng.chance(color.familia === "digital" ? 0.08 : 0.2),
      intrusion: intrusion,
      foreignColor: foreignColor,
      exoticGlyph: exoticGlyph,
      exoticFontKind: exoticFontKind
    };
  }

  function VoxelField() {
    this.cells = new Set();
    this.added = 0;
    this.removed = 0;
  }

  VoxelField.prototype.has = function (x, y, z) { return this.cells.has(voxelKey(x, y, z)); };
  VoxelField.prototype.add = function (x, y, z) {
    var k = voxelKey(x, y, z);
    if (!this.cells.has(k)) { this.cells.add(k); this.added += 1; }
  };
  VoxelField.prototype.remove = function (x, y, z) {
    if (this.cells.delete(voxelKey(x, y, z))) this.removed += 1;
  };
  VoxelField.prototype.block = function (x0, x1, y0, y1, z0, z1) {
    for (var x = x0; x < x1; x += 1) {
      for (var y = y0; y < y1; y += 1) {
        for (var z = z0; z < z1; z += 1) this.add(x, y, z);
      }
    }
  };
  VoxelField.prototype.forEach = function (callback) {
    this.cells.forEach(function (value) {
      var xyz = value.split(",").map(Number);
      callback(xyz[0], xyz[1], xyz[2]);
    });
  };

  function carveArch(field, geometry) {
    var xMin = Math.floor(geometry.center - geometry.radius - 1);
    var xMax = Math.ceil(geometry.center + geometry.radius + 1);
    for (var x = xMin; x <= xMax; x += 1) {
      var dx = Math.abs((x + 0.5) - geometry.center);
      if (dx > geometry.radius) continue;
      var crown = geometry.spring + Math.sqrt(Math.max(0, geometry.radius * geometry.radius - dx * dx));
      for (var y = -1; y <= geometry.depth; y += 1) {
        for (var z = 0; z < Math.ceil(crown); z += 1) field.remove(x, y, z);
      }
    }
  }

  function carveWindow(field, geometry, rng) {
    var side = rng.chance(0.5) ? -1 : 1;
    var center = geometry.center + side * (geometry.radius + 3);
    var bottom = geometry.spring + geometry.radius + rng.int(1, 4);
    for (var x = Math.floor(center - 1); x <= Math.ceil(center + 1); x += 1) {
      for (var y = -1; y <= geometry.depth; y += 1) {
        for (var z = bottom; z < bottom + rng.int(2, 4); z += 1) field.remove(x, y, z);
      }
    }
  }

  function erodeEdges(field, amount, rng) {
    if (amount <= 0) return;
    var candidates = [];
    field.forEach(function (x, y, z) {
      var exposed = !field.has(x - 1, y, z) || !field.has(x + 1, y, z) ||
        !field.has(x, y - 1, z) || !field.has(x, y + 1, z) || !field.has(x, y, z + 1);
      if (exposed && z > 0) candidates.push([x, y, z]);
    });
    rng.shuffle(candidates);
    var total = Math.floor(candidates.length * clamp(amount, 0, 0.14));
    for (var i = 0; i < total; i += 1) field.remove(candidates[i][0], candidates[i][1], candidates[i][2]);
  }

  function makeArchMass(traits, interpretation, rng) {
    var field = new VoxelField();
    var mass = clamp(traits.mass + interpretation.masa, 20, 100);
    var opening = clamp(traits.opening + interpretation.vano, 20, 94);
    var width = rng.int(16, 22) + Math.round(mass / 30);
    var depth = rng.int(5, 9) + Math.round(mass / 42) + Math.min(2, interpretation.profundidad);
    var lowerHeight = rng.int(13, 18) + Math.round(mass / 22);
    var upperHeight = rng.int(4, 9) + Math.round(mass / 34);
    var plinth = 1 + Math.min(2, interpretation.zocalo);

    field.block(0, width, 0, depth, 0, lowerHeight);
    var radius = clamp(Math.round(2.8 + opening / 17), 4, Math.floor(width / 2) - 2);
    var spring = clamp(Math.round(4 + opening / 15), 6, lowerHeight - radius - 1);
    var arch = { center: width / 2, radius: radius, spring: spring, depth: depth };
    carveArch(field, arch);

    if (plinth > 1) {
      field.block(-1, width + 1, -1, depth + 1, 0, plinth);
      carveArch(field, arch);
    }

    var shiftRange = 1 + Math.round(traits.madness * 4) + interpretation.desplazamiento;
    var upperShift = rng.int(-shiftRange, shiftRange);
    var upperInset = rng.int(0, 2);
    field.block(upperInset + upperShift, width - upperInset + upperShift,
      0, Math.max(3, depth - rng.int(0, 2)), lowerHeight, lowerHeight + upperHeight);

    var annexes = 1 + (rng.chance(traits.madness * 0.55) ? 1 : 0);
    for (var a = 0; a < annexes; a += 1) {
      var annexWidth = rng.int(3, 8);
      var annexHeight = rng.int(4, Math.max(6, lowerHeight - 3));
      if (rng.chance(0.5)) field.block(-annexWidth - a, 0, 1, depth - 1, 0, annexHeight);
      else field.block(width, width + annexWidth + a, 1, depth - 1, 0, annexHeight);
    }

    if (interpretation.repeticion > 0 || rng.chance(traits.madness * 0.45)) {
      var echoWidth = Math.max(6, Math.floor(width * rng.float(0.45, 0.75)));
      var echoStart = Math.floor(width / 2 - echoWidth / 2) + rng.int(-3, 3);
      var echoGap = rng.int(1, 4);
      field.block(echoStart, echoStart + echoWidth, depth + echoGap, depth + echoGap + rng.int(1, 3),
        0, Math.max(5, lowerHeight - rng.int(2, 6)));
    }

    if (interpretation.ventana || rng.chance(0.18 + traits.madness * 0.35)) carveWindow(field, arch, rng.fork("ventana"));
    erodeEdges(field, interpretation.erosion + traits.madness * 0.018, rng.fork("erosion"));

    return {
      field: field,
      geometry: {
        kind: "ARCO EXCAVADO", width: width, depth: depth,
        lowerHeight: lowerHeight, upperHeight: upperHeight,
        upperShift: upperShift, radius: radius, spring: spring, plinth: plinth
      }
    };
  }

  function visibleFaces(field, direction, body) {
    var faces = [];
    var sideDirection = direction >= 0 ? 1 : -1;
    field.forEach(function (x, y, z) {
      var voxel = voxelKey(x, y, z);
      if (!field.has(x, y - 1, z)) {
        faces.push({ face: "frente", body: body || "solo", voxel: voxel, x: x + 0.5, y: y, z: z + 0.5 });
      }
      if (!field.has(x + sideDirection, y, z)) {
        faces.push({
          face: "lateral", body: body || "solo", voxel: voxel,
          x: sideDirection > 0 ? x + 1 : x, y: y + 0.5, z: z + 0.5
        });
      }
      if (!field.has(x, y, z + 1)) {
        faces.push({ face: "techo", body: body || "solo", voxel: voxel, x: x + 0.5, y: y + 0.5, z: z + 1 });
      }
    });
    return faces;
  }

  function SurfaceBuilder() {
    this.points = [];
    this.count = 0;
  }

  SurfaceBuilder.prototype.add = function (body, face, x, y, z, group) {
    this.count += 1;
    this.points.push({
      body: body, face: face, x: x, y: y, z: z,
      voxel: "p:" + body + ":" + (group || this.count),
      parametric: true
    });
  };

  function addBase(builder, spec, rng) {
    // Al menos dos filas: el zócalo aporta siempre una cara "techo", de modo
    // que cualquier cuerpo emite frente + lateral + techo (alfabeto >= 3).
    var rows = rng.int(2, 3);
    for (var y = 0; y < rows; y += 1) {
      for (var x = -spec.width / 2; x <= spec.width / 2; x += 0.9) {
        builder.add(spec.body, y === 0 ? "frente" : "techo", spec.originX + x, spec.baseY + y * 0.8, 0, "base:" + y + ":" + x.toFixed(1));
      }
    }
  }

  function addStrata(builder, spec, rng) {
    var phase = rng.float(0, TAU);
    var amplitude = spec.width * lerp(0.06, 0.28, spec.madness);
    for (var z = 0; z <= spec.height; z += 0.82) {
      var t = z / spec.height;
      var width = spec.width * (0.68 + 0.27 * Math.sin(t * Math.PI)) + Math.sin(t * TAU * 2.3 + phase) * amplitude;
      width = Math.max(spec.width * 0.42, width);
      var shift = Math.sin(t * TAU * 1.4 + phase) * amplitude + rng.float(-0.16, 0.16) * spec.madness;
      for (var x = -width / 2; x <= width / 2; x += 0.86) {
        builder.add(spec.body, "frente", spec.originX + shift + x, spec.baseY, z, "strata:" + z.toFixed(1) + ":" + x.toFixed(1));
      }
      for (var y = 0.8; y <= spec.depth; y += 0.9) {
        builder.add(spec.body, "lateral", spec.originX + shift + width / 2, spec.baseY + y, z, "strata-side:" + z.toFixed(1) + ":" + y.toFixed(1));
      }
    }
    addBase(builder, spec, rng);
  }

  function addRibs(builder, spec, rng) {
    var ribs = rng.int(3, 7 + Math.round(spec.madness * 2));
    var bend = spec.width * rng.float(0.18, 0.52) * (spec.side === "left" ? 1 : -1);
    var phase = rng.float(0, TAU);
    for (var rib = 0; rib < ribs; rib += 1) {
      var offset = lerp(-spec.width / 2, spec.width / 2, ribs === 1 ? 0.5 : rib / (ribs - 1));
      for (var step = 0; step <= Math.round(spec.height * 1.35); step += 1) {
        var t = step / Math.round(spec.height * 1.35);
        var x = spec.originX + offset + Math.sin(t * Math.PI) * bend +
          Math.sin(t * TAU * 2 + phase + rib) * spec.madness * 0.45;
        var z = t * spec.height;
        var depthLayers = 1 + Math.round(spec.depth / 2);
        for (var layer = 0; layer < depthLayers; layer += 1) {
          builder.add(spec.body, layer === 0 ? "frente" : "lateral", x, spec.baseY + layer * 0.8, z,
            "rib:" + rib + ":" + step + ":" + layer);
        }
      }
    }
    var floors = rng.int(1, 3);
    for (var f = 1; f <= floors; f += 1) {
      var floorZ = spec.height * f / (floors + 1);
      for (var fx = -spec.width / 2; fx <= spec.width / 2; fx += 0.9) {
        builder.add(spec.body, "techo", spec.originX + fx, spec.baseY, floorZ, "rib-floor:" + f + ":" + fx.toFixed(1));
      }
    }
    addBase(builder, spec, rng);
  }

  function addScreen(builder, spec, rng) {
    var columns = Math.max(7, Math.round(spec.width * 1.25));
    var rows = Math.max(12, Math.round(spec.height * 1.15));
    var aperture = rng.chance(0.35 + spec.madness * 0.35);
    var phase = rng.float(0, TAU);
    for (var column = 0; column <= columns; column += 1) {
      var nx = column / columns;
      for (var row = 0; row <= rows; row += 1) {
        var nz = row / rows;
        var inAperture = aperture && Math.pow((nx - 0.5) / 0.2, 2) + Math.pow((nz - 0.48) / 0.18, 2) < 1;
        if (inAperture) continue;
        var x = spec.originX + (nx - 0.5) * spec.width + Math.sin(nz * TAU + phase) * spec.madness * 0.55;
        var y = spec.baseY + spec.depth * (0.48 + 0.43 * Math.sin(nx * TAU * rng.float(0.7, 1.8) + phase));
        builder.add(spec.body, column % 3 === 0 ? "lateral" : "frente", x, y, nz * spec.height,
          "screen:" + column + ":" + row);
      }
    }
    addBase(builder, spec, rng);
  }

  function angleDistance(a, b) {
    var d = Math.abs(a - b) % TAU;
    return Math.min(d, TAU - d);
  }

  function addRing(builder, spec, rng) {
    var radiusX = spec.width * rng.float(0.36, 0.5);
    var radiusZ = spec.height * rng.float(0.3, 0.43);
    var centerZ = spec.height * rng.float(0.48, 0.62);
    var layers = rng.int(2, 4);
    var samples = rng.int(58, 88);
    var openingAngle = spec.side === "left" ? 0 : Math.PI;
    var openingSize = rng.float(0.22, 0.55) * (0.6 + spec.madness);
    for (var layer = 0; layer < layers; layer += 1) {
      var inset = layer * 0.65;
      for (var sample = 0; sample < samples; sample += 1) {
        var theta = sample / samples * TAU;
        if (angleDistance(theta, openingAngle) < openingSize) continue;
        for (var depth = 0; depth < 1 + Math.round(spec.depth / 2.2); depth += 1) {
          builder.add(spec.body, depth === 0 ? "frente" : "lateral",
            spec.originX + Math.cos(theta) * Math.max(1, radiusX - inset),
            spec.baseY + depth * 0.85,
            centerZ + Math.sin(theta) * Math.max(1, radiusZ - inset),
            "ring:" + layer + ":" + sample + ":" + depth);
        }
      }
    }
    var stemWidth = Math.max(2, spec.width * 0.22);
    var stemTop = Math.max(1, centerZ - radiusZ + 1);
    for (var z = 0; z <= stemTop; z += 0.82) {
      for (var x = -stemWidth / 2; x <= stemWidth / 2; x += 0.85) {
        builder.add(spec.body, "frente", spec.originX + x, spec.baseY, z, "ring-stem:" + z.toFixed(1) + ":" + x.toFixed(1));
      }
    }
    if (spec.madness > 0.72 && rng.chance(0.5)) {
      var small = Object.assign({}, spec, {
        originX: spec.originX + (spec.side === "left" ? 1 : -1) * spec.width * 0.14,
        width: spec.width * 0.54, height: spec.height * 0.62,
        baseY: spec.baseY + 0.5, madness: spec.madness * 0.7
      });
      addRing(builder, small, new Azar.RNG(rng.seed + 9127));
    }
    addBase(builder, spec, rng);
  }

  function addFold(builder, spec, rng) {
    var columns = rng.int(7, 13);
    var rows = Math.round(spec.height * 1.05);
    var phase = rng.chance(0.5) ? 0 : 1;
    for (var column = 0; column <= columns; column += 1) {
      var nx = column / columns;
      var localX = (nx - 0.5) * spec.width;
      var foldY = ((column + phase) % 2 ? spec.depth : 0) + Math.sin(nx * TAU) * spec.madness;
      var top = spec.height * (0.82 + 0.18 * Math.sin(nx * Math.PI + rng.float(-0.25, 0.25)));
      for (var row = 0; row <= rows; row += 1) {
        var z = row / rows * top;
        builder.add(spec.body, column % 2 ? "lateral" : "frente",
          spec.originX + localX, spec.baseY + foldY, z, "fold:" + column + ":" + row);
      }
      if (column < columns) {
        for (var between = 1; between < 4; between += 1) {
          var t = between / 4;
          var nextY = (((column + 1 + phase) % 2) ? spec.depth : 0);
          builder.add(spec.body, "techo", spec.originX + localX + spec.width / columns * t,
            spec.baseY + lerp(foldY, nextY, t), top, "fold-top:" + column + ":" + between);
        }
      }
    }
    addBase(builder, spec, rng);
  }

  function addTotem(builder, spec, rng) {
    var modules = rng.int(3, 6);
    var cursor = 0;
    for (var module = 0; module < modules; module += 1) {
      var remaining = spec.height - cursor;
      var moduleHeight = module === modules - 1 ? remaining : Math.max(2.2, remaining / (modules - module) * rng.float(0.72, 1.18));
      var moduleWidth = spec.width * rng.float(0.48, 1.05);
      var shift = rng.float(-spec.width * 0.18, spec.width * 0.18) * (0.35 + spec.madness);
      var ellipse = rng.chance(0.42);
      var rows = Math.max(3, Math.round(moduleHeight));
      for (var row = 0; row <= rows; row += 1) {
        var nz = row / rows;
        var width = ellipse ? moduleWidth * Math.sqrt(Math.max(0.08, 1 - Math.pow(nz * 2 - 1, 2))) : moduleWidth;
        for (var x = -width / 2; x <= width / 2; x += 0.86) {
          builder.add(spec.body, "frente", spec.originX + shift + x, spec.baseY, cursor + nz * moduleHeight,
            "totem:" + module + ":" + row + ":" + x.toFixed(1));
        }
        builder.add(spec.body, "lateral", spec.originX + shift + width / 2,
          spec.baseY + spec.depth * rng.float(0.65, 1), cursor + nz * moduleHeight,
          "totem-side:" + module + ":" + row);
      }
      cursor += moduleHeight;
    }
    addBase(builder, spec, rng);
  }

  function addVortex(builder, spec, rng) {
    var turns = rng.float(1.5, 2.7) + spec.madness * 0.8;
    var baseRadius = spec.width * rng.float(0.32, 0.46);
    var taper = rng.float(0.45, 0.72);
    var steps = Math.max(24, Math.round(spec.height * 4.4));
    var phase = rng.float(0, TAU);
    var depthLayers = 1 + Math.round(spec.depth / 2.4);
    var handedness = spec.side === "left" ? 1 : -1;
    for (var step = 0; step <= steps; step += 1) {
      var t = step / steps;
      var z = t * spec.height;
      var radius = Math.max(1.1, baseRadius * (1 - t * taper));
      var theta = phase + handedness * t * TAU * turns;
      var wobble = Math.sin(t * TAU * 3 + phase) * spec.madness * 0.55;
      for (var layer = 0; layer < depthLayers; layer += 1) {
        builder.add(spec.body, layer === 0 ? "frente" : "lateral",
          spec.originX + Math.cos(theta) * (radius + layer * 0.5),
          spec.baseY + Math.sin(theta) * radius * 0.5 + layer * 0.42 + wobble,
          z, "vortex:" + step + ":" + layer);
      }
    }
    var mastTop = spec.height * rng.float(0.9, 1.02);
    for (var mz = 0; mz <= mastTop; mz += 0.9) {
      builder.add(spec.body, "frente", spec.originX, spec.baseY, mz, "vortex-mast:" + mz.toFixed(1));
    }
    addBase(builder, spec, rng);
  }

  function addLattice(builder, spec, rng) {
    var families = rng.int(4, 7);
    var top = spec.height * rng.float(0.9, 1.02);
    var steps = Math.max(14, Math.round(spec.height * 1.15));
    var bend = spec.width * rng.float(0.55, 0.95);
    var phase = rng.float(0, TAU);
    for (var dir = -1; dir <= 1; dir += 2) {
      for (var line = 0; line < families; line += 1) {
        var offset = lerp(-spec.width / 2, spec.width / 2, families === 1 ? 0.5 : line / (families - 1));
        for (var step = 0; step <= steps; step += 1) {
          var t = step / steps;
          var x = offset + dir * (t - 0.5) * bend;
          if (x < -spec.width / 2 - 0.6 || x > spec.width / 2 + 0.6) continue;
          var y = spec.baseY + Math.sin(t * Math.PI) * spec.madness * 0.6;
          builder.add(spec.body, dir > 0 ? "frente" : "lateral",
            spec.originX + x, y, t * top, "lattice:" + dir + ":" + line + ":" + step);
        }
      }
    }
    var floors = rng.int(2, 4);
    for (var floor = 1; floor <= floors; floor += 1) {
      var floorZ = top * floor / (floors + 1);
      for (var fx = -spec.width / 2; fx <= spec.width / 2; fx += 0.92) {
        builder.add(spec.body, "techo", spec.originX + fx,
          spec.baseY + spec.depth * 0.28 + Math.sin(fx + phase) * spec.madness * 0.3,
          floorZ, "lattice-floor:" + floor + ":" + fx.toFixed(1));
      }
    }
    addBase(builder, spec, rng);
  }

  function addHyperboloid(builder, spec, rng) {
    // Torre de cintura: dos anillos unidos por generatrices RECTAS que se
    // cruzan; la superficie se estrecha sola en el talle (hiperboloide reglado).
    var generatrices = rng.int(13, 20);
    var steps = Math.max(16, Math.round(spec.height * 1.25));
    var baseRadius = spec.width * rng.float(0.42, 0.52);
    var topRadius = spec.width * rng.float(0.32, 0.46);
    var ellip = 0.5;
    var twist = rng.float(0.9, 1.7);
    var handed = spec.side === "left" ? 1 : -1;
    for (var family = -1; family <= 1; family += 2) {
      for (var g = 0; g < generatrices; g += 1) {
        var a0 = g / generatrices * TAU;
        var a1 = a0 + handed * family * twist;
        for (var s = 0; s <= steps; s += 1) {
          var t = s / steps;
          var bx = Math.cos(a0) * baseRadius, by = Math.sin(a0) * baseRadius * ellip;
          var tx = Math.cos(a1) * topRadius, ty = Math.sin(a1) * topRadius * ellip;
          builder.add(spec.body, family > 0 ? "frente" : "lateral",
            spec.originX + lerp(bx, tx, t),
            spec.baseY + lerp(by, ty, t),
            t * spec.height, "hyp:" + family + ":" + g + ":" + s);
        }
      }
    }
    var rings = [[0, baseRadius], [1, topRadius], [rng.float(0.42, 0.6), lerp(baseRadius, topRadius, 0.5) * rng.float(0.6, 0.8)]];
    for (var r = 0; r < rings.length; r += 1) {
      var ringZ = rings[r][0] * spec.height, ringR = rings[r][1];
      for (var sample = 0; sample < 42; sample += 1) {
        var theta = sample / 42 * TAU;
        builder.add(spec.body, "techo", spec.originX + Math.cos(theta) * ringR,
          spec.baseY + Math.sin(theta) * ringR * ellip, ringZ, "hyp-ring:" + r + ":" + sample);
      }
    }
    addBase(builder, spec, rng);
  }

  function addZiggurat(builder, spec, rng) {
    // Retranqueos escalonados: cada nivel se estrecha y deja una terraza.
    var tiers = rng.int(3, 6);
    var cursor = 0;
    var setback = spec.width * rng.float(0.09, 0.15);
    for (var tier = 0; tier < tiers; tier += 1) {
      var tierHeight = spec.height / tiers * rng.float(0.82, 1.16);
      var halfWidth = Math.max(1.6, spec.width / 2 - setback * tier);
      var tierDepth = spec.depth * (1 - tier * 0.1);
      var lean = rng.float(-0.18, 0.18) * spec.madness * tier;
      for (var z = 0; z <= tierHeight; z += 0.82) {
        for (var x = -halfWidth; x <= halfWidth; x += 0.9) {
          builder.add(spec.body, "frente", spec.originX + lean + x, spec.baseY, cursor + z,
            "zig:" + tier + ":" + z.toFixed(1) + ":" + x.toFixed(1));
        }
        builder.add(spec.body, "lateral", spec.originX + lean + halfWidth,
          spec.baseY + tierDepth * rng.float(0.6, 1), cursor + z, "zig-side:" + tier + ":" + z.toFixed(1));
      }
      for (var tx = -halfWidth; tx <= halfWidth; tx += 0.9) {
        builder.add(spec.body, "techo", spec.originX + lean + tx, spec.baseY + tierDepth * 0.4,
          cursor + tierHeight, "zig-top:" + tier + ":" + tx.toFixed(1));
      }
      cursor += tierHeight;
    }
    addBase(builder, spec, rng);
  }

  function addAqueduct(builder, spec, rng) {
    // Arcada repetida: pilares + arcos de medio punto, uno o dos niveles.
    var levels = rng.chance(0.4 + spec.madness * 0.25) ? 2 : 1;
    var levelHeight = spec.height / levels;
    for (var level = 0; level < levels; level += 1) {
      var baseZ = level * levelHeight;
      var bays = rng.int(3, 6);
      var bayWidth = spec.width / bays;
      var pierHeight = levelHeight * rng.float(0.48, 0.62);
      for (var pier = 0; pier <= bays; pier += 1) {
        var px = spec.originX - spec.width / 2 + pier * bayWidth;
        for (var z = 0; z <= pierHeight; z += 0.8) {
          builder.add(spec.body, pier % 2 ? "lateral" : "frente", px, spec.baseY, baseZ + z, "aq-pier:" + level + ":" + pier + ":" + z.toFixed(1));
          builder.add(spec.body, "lateral", px, spec.baseY + spec.depth * 0.7, baseZ + z, "aq-pier-d:" + level + ":" + pier + ":" + z.toFixed(1));
        }
      }
      for (var arch = 0; arch < bays; arch += 1) {
        var cx = spec.originX - spec.width / 2 + (arch + 0.5) * bayWidth;
        var radius = bayWidth * 0.5;
        for (var sample = 0; sample <= 20; sample += 1) {
          var theta = sample / 20 * Math.PI;
          var az = baseZ + pierHeight + Math.sin(theta) * (levelHeight - pierHeight);
          builder.add(spec.body, "techo", cx + Math.cos(theta) * radius, spec.baseY, az, "aq-arch:" + level + ":" + arch + ":" + sample);
          builder.add(spec.body, "lateral", cx + Math.cos(theta) * radius, spec.baseY + spec.depth * 0.5, az, "aq-arch-d:" + level + ":" + arch + ":" + sample);
        }
      }
      for (var dx = -spec.width / 2; dx <= spec.width / 2; dx += 0.9) {
        builder.add(spec.body, "frente", spec.originX + dx, spec.baseY, baseZ + levelHeight, "aq-deck:" + level + ":" + dx.toFixed(1));
      }
    }
    addBase(builder, spec, rng);
  }

  function addCantilevers(builder, spec, rng) {
    // Voladizos apilados: losas horizontales que sobresalen alternando lados
    // desde un núcleo central (brutalismo tipo jenga).
    var slabs = rng.int(4, 8);
    var coreWidth = Math.max(2, spec.width * rng.float(0.26, 0.4));
    var slabHeight = spec.height / slabs;
    var handed = spec.side === "left" ? 1 : -1;
    var depthLayers = 1 + Math.round(spec.depth / 2.5);
    for (var i = 0; i < slabs; i += 1) {
      var baseZ = i * slabHeight;
      var side = (i % 2 === 0 ? 1 : -1) * handed;
      var reach = spec.width * rng.float(0.3, 0.52) * side * (0.6 + spec.madness * 0.5);
      var slabLeft = Math.min(-coreWidth / 2, reach);
      var slabRight = Math.max(coreWidth / 2, reach);
      var plateZ = baseZ + slabHeight * rng.float(0.72, 0.9);
      for (var x = slabLeft; x <= slabRight; x += 0.85) {
        for (var d = 0; d < depthLayers; d += 1) {
          builder.add(spec.body, d === 0 ? "frente" : "lateral", spec.originX + x, spec.baseY + d * 0.8, plateZ, "cant-slab:" + i + ":" + x.toFixed(1) + ":" + d);
        }
        builder.add(spec.body, "techo", spec.originX + x, spec.baseY + spec.depth * 0.3, plateZ + 0.45, "cant-top:" + i + ":" + x.toFixed(1));
      }
      for (var z = baseZ; z <= baseZ + slabHeight; z += 0.82) {
        for (var cxx = -coreWidth / 2; cxx <= coreWidth / 2; cxx += 0.9) {
          builder.add(spec.body, "frente", spec.originX + cxx, spec.baseY, z, "cant-core:" + i + ":" + z.toFixed(1) + ":" + cxx.toFixed(1));
        }
        builder.add(spec.body, "lateral", spec.originX + coreWidth / 2, spec.baseY + spec.depth * 0.6, z, "cant-core-d:" + i + ":" + z.toFixed(1));
      }
    }
    addBase(builder, spec, rng);
  }

  function addHelicalSlabTower(builder, spec, rng) {
    // Losas rectangulares que giran alrededor de un núcleo: una espiral
    // arquitectónica hecha de pisos, inspirada en torres de placas torsionadas.
    var slabs = rng.int(16, 27);
    var turns = rng.float(0.62, 1.42) + spec.madness * 0.42;
    var phase = rng.float(0, TAU);
    var handed = spec.side === "left" ? 1 : -1;
    var slabThickness = rng.float(0.38, 0.68);
    var coreWidth = Math.max(1.5, spec.width * rng.float(0.16, 0.24));
    var coreDepth = Math.max(1.2, spec.depth * rng.float(0.26, 0.42));
    for (var slab = 0; slab < slabs; slab += 1) {
      var t = slab / Math.max(1, slabs - 1);
      var z = t * spec.height;
      var theta = phase + handed * t * TAU * turns;
      var waist = 0.66 + 0.34 * Math.abs(Math.cos(t * Math.PI * 2));
      var halfLength = spec.width * rng.float(0.39, 0.5) * waist;
      var halfDepth = Math.max(1, spec.depth * rng.float(0.24, 0.42));
      var cos = Math.cos(theta), sin = Math.sin(theta);
      var point = function (u, v) {
        return {
          x: spec.originX + cos * u - sin * v,
          y: spec.baseY + sin * u + cos * v
        };
      };
      for (var u = -halfLength; u <= halfLength; u += 0.82) {
        for (var v = -halfDepth; v <= halfDepth; v += 0.82) {
          var topPoint = point(u, v);
          builder.add(spec.body, "techo", topPoint.x, topPoint.y, z,
            "helix-top:" + slab + ":" + u.toFixed(1) + ":" + v.toFixed(1));
        }
        var frontPoint = point(u, -halfDepth);
        builder.add(spec.body, "frente", frontPoint.x, frontPoint.y, z - slabThickness,
          "helix-front:" + slab + ":" + u.toFixed(1));
      }
      for (var edgeV = -halfDepth; edgeV <= halfDepth; edgeV += 0.72) {
        var sidePoint = point(halfLength, edgeV);
        builder.add(spec.body, "lateral", sidePoint.x, sidePoint.y, z - slabThickness * 0.5,
          "helix-side:" + slab + ":" + edgeV.toFixed(1));
      }
    }
    for (var coreZ = 0; coreZ <= spec.height; coreZ += 0.78) {
      for (var coreX = -coreWidth / 2; coreX <= coreWidth / 2; coreX += 0.78) {
        builder.add(spec.body, "frente", spec.originX + coreX, spec.baseY, coreZ,
          "helix-core-front:" + coreZ.toFixed(1) + ":" + coreX.toFixed(1));
      }
      builder.add(spec.body, "lateral", spec.originX + coreWidth / 2,
        spec.baseY + coreDepth, coreZ, "helix-core-side:" + coreZ.toFixed(1));
    }
    addBase(builder, spec, rng);
  }

  function addNestedCubes(builder, spec, rng) {
    // Masas cúbicas que se interpenetran. El campo voxelar elimina las caras
    // internas y deja tres planos completos: frente, profundidad y cubierta.
    var field = new VoxelField();
    var cubes = rng.int(3, spec.madness > 0.72 ? 5 : 4);
    var nominalWidth = clamp(Math.round(spec.width), 7, 22);
    var nominalDepth = clamp(Math.round(spec.depth), 3, 9);
    var nominalHeight = clamp(Math.round(spec.height), 10, 30);
    var maxCube = Math.max(4, Math.min(nominalWidth * 0.72, nominalHeight * 0.38));
    for (var cubeIndex = 0; cubeIndex < cubes; cubeIndex += 1) {
      var t = cubeIndex / Math.max(1, cubes - 1);
      var cubeSize = clamp(Math.round(maxCube * rng.float(0.76, 1.08)), 4, Math.round(maxCube * 1.12));
      var cubeWidth = cubeSize;
      var cubeHeight = cubeSize;
      var cubeDepth = clamp(Math.round(cubeSize * rng.float(0.64, 0.92)), 3, nominalDepth + 2);
      var centerX = Math.round((cubeIndex % 2 ? 1 : -1) * nominalWidth * rng.float(0.08, 0.18));
      var startX = Math.round(centerX - cubeWidth / 2);
      var startY = Math.round((cubeIndex % 3) * nominalDepth * 0.24 + rng.float(-0.5, 0.5));
      var startZ = clamp(Math.round(t * (nominalHeight - cubeHeight) + rng.float(-0.6, 0.6)), 0, nominalHeight - cubeHeight);
      field.block(startX, startX + cubeWidth, startY, startY + cubeDepth, startZ, startZ + cubeHeight);
    }
    var direction = spec.side === "left" ? -1 : 1;
    visibleFaces(field, direction, spec.body).forEach(function (face) {
      builder.add(spec.body, face.face,
        spec.originX + face.x,
        spec.baseY + face.y,
        face.z,
        "nested-cube:" + face.voxel + ":" + face.face);
    });
  }

  function addCorbelVault(builder, spec, rng) {
    // Ménsulas / muqarnas: hiladas que voladizan hacia adentro escalón a
    // escalón hasta cerrar el vano (bóveda por aproximación de hiladas).
    var courses = rng.int(7, 12);
    var span = spec.width;
    var courseHeight = spec.height / courses * rng.float(0.9, 1.06);
    var wallWidth = Math.max(1.4, span * rng.float(0.12, 0.2));
    var step = (span * 0.5 - wallWidth) / courses;
    for (var c = 0; c < courses; c += 1) {
      var z0 = c * courseHeight;
      var inset = c * step * rng.float(0.85, 1.15);
      var innerX = Math.max(wallWidth * 0.5, span * 0.5 - inset);
      for (var rx = innerX; rx <= span * 0.5; rx += 0.85) {
        for (var rz = z0; rz <= z0 + courseHeight; rz += 0.82) {
          builder.add(spec.body, "frente", spec.originX + rx, spec.baseY, rz, "corbel-r:" + c + ":" + rx.toFixed(1) + ":" + rz.toFixed(1));
        }
      }
      for (var lx = -span * 0.5; lx <= -innerX; lx += 0.85) {
        for (var lz = z0; lz <= z0 + courseHeight; lz += 0.82) {
          builder.add(spec.body, "frente", spec.originX + lx, spec.baseY, lz, "corbel-l:" + c + ":" + lx.toFixed(1) + ":" + lz.toFixed(1));
        }
      }
      builder.add(spec.body, "techo", spec.originX + innerX, spec.baseY + spec.depth * 0.3, z0, "corbel-ledge-r:" + c);
      builder.add(spec.body, "techo", spec.originX - innerX, spec.baseY + spec.depth * 0.3, z0, "corbel-ledge-l:" + c);
      for (var dz = z0; dz <= z0 + courseHeight; dz += 0.9) {
        builder.add(spec.body, "lateral", spec.originX + span * 0.5, spec.baseY + spec.depth * 0.7, dz, "corbel-side-r:" + c + ":" + dz.toFixed(1));
        builder.add(spec.body, "lateral", spec.originX - span * 0.5, spec.baseY + spec.depth * 0.7, dz, "corbel-side-l:" + c + ":" + dz.toFixed(1));
      }
    }
    var capZ = courses * courseHeight;
    for (var kx = -wallWidth; kx <= wallWidth; kx += 0.85) {
      builder.add(spec.body, "techo", spec.originX + kx, spec.baseY + spec.depth * 0.3, capZ, "corbel-cap:" + kx.toFixed(1));
    }
    addBase(builder, spec, rng);
  }

  function addSphere(builder, spec, rng) {
    // Cáscara volumétrica, no círculo plano: latitudes y longitudes reciben
    // alfabetos de frente, profundidad y cubierta.
    var radiusX = Math.max(2.4, spec.width * 0.48);
    var radiusZ = Math.max(2.4, Math.min(spec.height * 0.48, radiusX * rng.float(0.82, 1.08)));
    var radiusY = Math.max(1.5, spec.depth * rng.float(0.62, 0.95));
    var centerZ = spec.height * 0.52;
    var latitudes = spec.detail ? rng.int(20, 25) : rng.int(13, 19);
    var longitudes = spec.detail ? rng.int(48, 62) : rng.int(34, 48);
    var aperture = !spec.solid && rng.chance(0.28 + spec.madness * 0.18);
    var apertureRadius = rng.float(0.12, 0.22);
    for (var latitude = 0; latitude <= latitudes; latitude += 1) {
      var v = latitude / latitudes;
      var phi = -Math.PI / 2 + v * Math.PI;
      var ring = Math.cos(phi);
      for (var longitude = 0; longitude < longitudes; longitude += 1) {
        var theta = longitude / longitudes * TAU;
        var localX = Math.cos(theta) * ring;
        var localY = Math.sin(theta) * ring;
        if (aperture && localY < -0.58 &&
          Math.pow(localX / apertureRadius, 2) + Math.pow((Math.sin(phi) + 0.02) / (apertureRadius * 1.35), 2) < 1) continue;
        var face = localY < -0.32 ? "frente" : Math.abs(localX) > 0.52 ? "lateral" : "techo";
        builder.add(spec.body, face,
          spec.originX + localX * radiusX,
          spec.baseY + localY * radiusY,
          centerZ + Math.sin(phi) * radiusZ,
          "sphere:" + latitude + ":" + longitude);
      }
    }
    // La esfera ya no aterriza siempre sobre la misma raya. Puede tocar el
    // suelo mediante pedestal, conservar sólo una plataforma, o quedar libre.
    if (!spec.noBase) {
      var anchorage = rng.next();
      var stemTop = Math.max(0.6, centerZ - radiusZ);
      if (anchorage < 0.56) {
        var stemShift = anchorage < 0.22 ? rng.float(-radiusX * 0.38, radiusX * 0.38) : 0;
        addEntangledPier(builder, spec.originX + stemShift, spec.baseY, stemTop,
          Math.max(1.2, spec.width * rng.float(0.08, 0.14)), "sphere-pedestal:" + spec.body);
      }
      if (anchorage < 0.34 || (anchorage >= 0.56 && anchorage < 0.72)) {
        addBase(builder, spec, rng);
      }
    }
  }

  function addPyramid(builder, spec, rng) {
    // Cuatro caras muestreadas como planos, con inversión opcional. Al cambiar
    // de cara cambia el alfabeto y la pirámide conserva volumen en perspectiva.
    var inverted = !!spec.inverted;
    var rows = Math.max(12, Math.round(spec.height * 1.12));
    var halfWidth = spec.width * 0.5;
    var halfDepth = Math.max(1.4, spec.depth * 0.55);
    var rotation = rng.float(-0.12, 0.12) * (0.3 + spec.madness);
    for (var row = 0; row <= rows; row += 1) {
      var t = row / rows;
      var scale = inverted ? Math.max(0.018, t) : Math.max(0.018, 1 - t);
      var z = t * spec.height;
      var hw = halfWidth * scale;
      var hd = halfDepth * scale;
      var rowShift = Math.sin(t * Math.PI) * rotation * spec.width;
      var xStep = Math.max(0.72, hw / 9);
      for (var px = -hw; px <= hw + 0.01; px += xStep) {
        builder.add(spec.body, "frente", spec.originX + rowShift + px,
          spec.baseY - hd, z, "pyramid-front:" + row + ":" + px.toFixed(1));
        builder.add(spec.body, "techo", spec.originX + rowShift + px,
          spec.baseY + hd, z, "pyramid-back:" + row + ":" + px.toFixed(1));
      }
      var yStep = Math.max(0.68, hd / 5);
      for (var py = -hd; py <= hd + 0.01; py += yStep) {
        builder.add(spec.body, "lateral", spec.originX + rowShift + hw,
          spec.baseY + py, z, "pyramid-side:" + row + ":" + py.toFixed(1));
      }
    }
    if (!spec.noBase && !inverted) addBase(builder, spec, rng);
  }

  function addBrokenObelisk(builder, spec, rng) {
    // Dos sólidos se encuentran en una punta: pirámide inferior y obelisco
    // invertido. Una fractura mínima y una deriva lateral hacen visible que
    // el monumento está compuesto, no simplemente apilado.
    var baseHeight = spec.height * rng.float(0.34, 0.43);
    var contactGap = rng.float(0.16, 0.52);
    addPyramid(builder, Object.assign({}, spec, {
      body: spec.body + "-base", height: baseHeight,
      width: spec.width * rng.float(0.88, 1.04),
      depth: spec.depth * rng.float(0.86, 1.08), noBase: true
    }), rng.fork("pirámide-base"));

    var upperHeight = spec.height - baseHeight - contactGap;
    var tipHeight = upperHeight * rng.float(0.14, 0.22);
    var shaftWidth = spec.width * rng.float(0.24, 0.34);
    var shaftDepth = Math.max(1.5, spec.depth * rng.float(0.42, 0.62));
    var rows = Math.max(15, Math.round(upperHeight * 1.18));
    var lean = rng.float(-0.08, 0.08) * spec.width * (0.5 + spec.madness);
    for (var row = 0; row <= rows; row += 1) {
      var t = row / rows;
      var z = baseHeight + contactGap + t * upperHeight;
      var widthScale;
      if (t < tipHeight / upperHeight) widthScale = t / (tipHeight / upperHeight);
      else widthScale = 1 - (t - tipHeight / upperHeight) * rng.float(0.08, 0.22);
      widthScale = Math.max(0.018, widthScale);
      var hw = shaftWidth * 0.5 * widthScale;
      var hd = shaftDepth * 0.5 * widthScale;
      var shift = lean * t;
      var stepX = Math.max(0.68, hw / 4);
      for (var x = -hw; x <= hw + 0.01; x += stepX) {
        builder.add(spec.body + "-fuste", "frente", spec.originX + shift + x,
          spec.baseY - hd, z, "obelisk-front:" + row + ":" + x.toFixed(1));
        builder.add(spec.body + "-fuste", "techo", spec.originX + shift + x,
          spec.baseY + hd, z, "obelisk-back:" + row + ":" + x.toFixed(1));
      }
      for (var y = -hd; y <= hd + 0.01; y += Math.max(0.62, hd / 3)) {
        builder.add(spec.body + "-fuste", "lateral", spec.originX + shift + hw,
          spec.baseY + y, z, "obelisk-side:" + row + ":" + y.toFixed(1));
      }
    }
    // El pedestal se centraba en cero aunque el obelisco viva en spec.originX:
    // en la especie «espera», con un cuerpo a cada lado, quedaba despegado y
    // ensanchaba el encuadre. Ahora va bajo su propio cuerpo.
    if (!spec.noBase) addEntangledGround(builder, spec.width * 1.45, rng.fork("pedestal"), spec.originX);
  }

  function addMorphology(builder, morphology, spec, rng) {
    if (morphology === "ESTRATOS") addStrata(builder, spec, rng);
    else if (morphology === "COSTILLAS") addRibs(builder, spec, rng);
    else if (morphology === "PANTALLA") addScreen(builder, spec, rng);
    else if (morphology === "ANILLO") addRing(builder, spec, rng);
    else if (morphology === "PLIEGUE") addFold(builder, spec, rng);
    else if (morphology === "TÓTEM") addTotem(builder, spec, rng);
    else if (morphology === "VÓRTICE") addVortex(builder, spec, rng);
    else if (morphology === "CELOSÍA") addLattice(builder, spec, rng);
    else if (morphology === "HIPERBOLOIDE") addHyperboloid(builder, spec, rng);
    else if (morphology === "ZIGURAT") addZiggurat(builder, spec, rng);
    else if (morphology === "ACUEDUCTO") addAqueduct(builder, spec, rng);
    else if (morphology === "VOLADIZOS") addCantilevers(builder, spec, rng);
    else if (morphology === "TORRE HELICOIDAL") addHelicalSlabTower(builder, spec, rng);
    else if (morphology === "CUBOS ENCAJADOS") addNestedCubes(builder, spec, rng);
    else if (morphology === "ESFERA") addSphere(builder, spec, rng);
    else if (morphology === "PIRÁMIDE") addPyramid(builder, spec, rng);
    else if (morphology === "OBELISCO ROTO") addBrokenObelisk(builder, spec, rng);
    else addCorbelVault(builder, spec, rng);
  }

  function addFailedBridge(builder, leftEdge, rightEdge, height, depth, traits, rng) {
    var remaining = rng.float(1.8, Math.max(2.2, (rightEdge - leftEdge) * 0.52));
    var center = (leftEdge + rightEdge) / 2;
    var leftEnd = center - remaining / 2;
    var rightStart = center + remaining / 2;
    var layers = rng.int(1, 2 + Math.round(traits.madness));
    for (var layer = 0; layer < layers; layer += 1) {
      for (var x = leftEdge; x <= leftEnd; x += 0.78) {
        builder.add("izquierda", layer ? "techo" : "frente", x, layer * 0.8, height + layer * 0.28, "bridge-l:" + layer + ":" + x.toFixed(1));
      }
      for (var rx = rightStart; rx <= rightEdge; rx += 0.78) {
        builder.add("derecha", layer ? "techo" : "frente", rx, layer * 0.8, height + layer * 0.28, "bridge-r:" + layer + ":" + rx.toFixed(1));
      }
    }
    return Math.round(remaining * 10) / 10;
  }

  function makeWaitingSurface(traits, interpretation, rng) {
    var builder = new SurfaceBuilder();
    var leftWidth = rng.float(7, 13);
    var leftHeight = rng.float(13, 25);
    var rightWidth;
    var rightHeight;
    if (traits.relation === "ESPEJO IMPERFECTO") {
      rightWidth = leftWidth * rng.float(0.9, 1.08);
      rightHeight = leftHeight * rng.float(0.88, 1.1);
    } else if (traits.relation === "PARIENTES") {
      rightWidth = leftWidth * rng.float(0.72, 1.28);
      rightHeight = leftHeight * rng.float(0.7, 1.3);
    } else {
      rightWidth = rng.float(6, 14);
      rightHeight = rng.float(10, 27);
    }
    if (traits.relation === "UNO RECUERDA MAL AL OTRO") {
      if (rng.chance(0.5)) rightHeight *= rng.float(0.42, 0.68);
      else leftHeight *= rng.float(0.42, 0.68);
    }

    var gap = lerp(4.2, 15.5, clamp((traits.opening + interpretation.vano) / 100, 0, 1));
    // El vano lo dicta el poema —«distancia», «ausencia» lo abren—, así que no
    // se recorta. Pero un vano ancho con cuerpos bajos daba una tira horizontal
    // que al reencuadrar quedaba diminuta: la pareja crece en alto a medida que
    // se separa, y conserva el sentido sin achatarse.
    var apart = clamp((gap - 4.2) / 11.3, 0, 1);
    leftHeight *= 1 + apart * 0.38;
    rightHeight *= 1 + apart * 0.38;
    var leftOrigin = -gap / 2 - leftWidth / 2;
    var rightOrigin = gap / 2 + rightWidth / 2;
    var depthBase = rng.float(3, 7);
    var leftSpec = {
      body: "izquierda", side: "left", originX: leftOrigin,
      baseY: rng.float(-1, 1) * traits.madness, width: leftWidth,
      height: leftHeight, depth: depthBase * rng.float(0.75, 1.2), madness: traits.madness
    };
    var rightSpec = {
      body: "derecha", side: "right", originX: rightOrigin,
      baseY: rng.float(-1, 1) * traits.madness, width: rightWidth,
      height: rightHeight, depth: depthBase * rng.float(0.75, 1.28), madness: traits.madness
    };

    addMorphology(builder, traits.leftMorph, leftSpec, rng.fork("cuerpo-izquierdo"));
    addMorphology(builder, traits.rightMorph, rightSpec, rng.fork("cuerpo-derecho"));

    var bridgeGap = null;
    if (rng.chance(0.24 + traits.madness * 0.42 + interpretation.voladizo * 0.1)) {
      bridgeGap = addFailedBridge(builder, -gap / 2, gap / 2,
        Math.min(leftHeight, rightHeight) * rng.float(0.42, 0.78), depthBase, traits, rng.fork("puente-incompleto"));
    }

    return {
      surface: builder.points,
      geometry: {
        kind: "DOS CUERPOS PARAMÉTRICOS",
        relation: traits.relation,
        leftMorph: traits.leftMorph,
        rightMorph: traits.rightMorph,
        left: { width: leftWidth, height: leftHeight },
        right: { width: rightWidth, height: rightHeight },
        gap: gap,
        bridgeGap: bridgeGap
      }
    };
  }

  function wrap01(value) {
    value %= 1;
    return value < 0 ? value + 1 : value;
  }

  function addRibbonPath(builder, spec) {
    var samples = spec.samples || 96;
    var across = spec.across || 6;
    var depthLayers = spec.depthLayers || 2;
    var last = spec.closed ? samples - 1 : samples;
    var delta = 1 / samples;
    for (var sample = 0; sample <= last; sample += 1) {
      var t = sample / samples;
      var p = spec.path(t);
      if (spec.skip && spec.skip(t, sample, p)) continue;
      var beforeT = spec.closed ? wrap01(t - delta) : clamp(t - delta, 0, 1);
      var afterT = spec.closed ? wrap01(t + delta) : clamp(t + delta, 0, 1);
      var before = spec.path(beforeT);
      var after = spec.path(afterT);
      var tangentX = after.x - before.x;
      var tangentZ = after.z - before.z;
      var length = Math.sqrt(tangentX * tangentX + tangentZ * tangentZ) || 1;
      var normalX = -tangentZ / length;
      var normalZ = tangentX / length;
      for (var stripe = 0; stripe < across; stripe += 1) {
        var u = across === 1 ? 0 : (stripe / (across - 1) - 0.5) * spec.width;
        var section = spec.section
          ? spec.section(t, u, p, normalX, normalZ)
          : { x: normalX * u, y: 0, z: normalZ * u };
        for (var depth = 0; depth < depthLayers; depth += 1) {
          var face = depth > 0 ? "lateral" : (stripe === 0 || stripe === across - 1 ? "techo" : "frente");
          builder.add(spec.body, face,
            p.x + section.x,
            p.y + section.y + depth * (spec.depthStep || 0.72),
            p.z + section.z,
            spec.key + ":" + sample + ":" + stripe + ":" + depth);
        }
      }
    }
  }

  function addEntangledPier(builder, x, y, top, width, key) {
    for (var z = 0; z <= top; z += 0.8) {
      for (var dx = -width / 2; dx <= width / 2; dx += 0.78) {
        builder.add("cimientos", "frente", x + dx, y, z, key + ":front:" + z.toFixed(1) + ":" + dx.toFixed(1));
      }
      builder.add("cimientos", "lateral", x + width / 2, y + 0.82, z, key + ":side:" + z.toFixed(1));
    }
  }

  // `centerX` es opcional y por omisión vale 0, como antes: las especies
  // autónomas están centradas en el origen. La gramática sí lo usa, porque sus
  // cuerpos pueden quedar muy descentrados y un suelo centrado en cero tendría
  // que ser larguísimo para alcanzarlos —y ese exceso de ancho era justo lo que
  // encogía el edificio al reencuadrar.
  function addEntangledGround(builder, width, rng, centerX) {
    var origin = centerX || 0;
    var doorway = rng.float(-width * 0.22, width * 0.22);
    var opening = rng.float(1.5, 3.5);
    var rows = rng.int(1, 2);
    for (var row = 0; row < rows; row += 1) {
      for (var x = -width / 2; x <= width / 2; x += 0.82) {
        if (Math.abs(x - doorway) < opening / 2) continue;
        builder.add("cimientos", row ? "techo" : "frente", origin + x, row * 0.78, 0,
          "ground:" + row + ":" + x.toFixed(1));
      }
    }
  }

  function ellipsePath(spec) {
    return function (t) {
      var theta = t * TAU + (spec.phase || 0);
      var localX = Math.cos(theta) * spec.radiusX;
      var localZ = Math.sin(theta) * spec.radiusZ;
      var rotation = spec.rotation || 0;
      return {
        x: spec.centerX + localX * Math.cos(rotation) - localZ * Math.sin(rotation),
        y: (spec.centerY || 0) + Math.sin(theta + (spec.depthPhase || 0)) * spec.depth,
        z: spec.centerZ + localX * Math.sin(rotation) + localZ * Math.cos(rotation)
      };
    };
  }

  function addHelixArchitecture(builder, traits, rng) {
    var height = rng.float(22, 30);
    var amplitude = rng.float(6.8, 10.5);
    var depth = rng.float(2.5, 5.5);
    var turns = traits.entangleTurns * rng.float(0.58, 0.82);
    var phase = rng.float(-0.35, 0.35);
    var width = rng.float(3.2, 5.2);
    var pathFor = function (offset) {
      return function (t) {
        var theta = phase + t * TAU * turns + offset;
        return { x: Math.sin(theta) * amplitude, y: Math.cos(theta) * depth, z: 1.8 + t * height };
      };
    };
    var skipFor = function (offset) {
      return function (t) {
        var theta = phase + t * TAU * turns + offset;
        return Math.abs(Math.sin(theta)) < 0.14 && Math.cos(theta) > 0.25;
      };
    };
    addRibbonPath(builder, {
      body: "cinta-a", key: "helix-a", path: pathFor(0), skip: skipFor(0),
      width: width, samples: 92 + traits.entangleTurns * 18, across: 6, depthLayers: 2
    });
    addRibbonPath(builder, {
      body: "cinta-b", key: "helix-b", path: pathFor(Math.PI), skip: skipFor(Math.PI),
      width: width * rng.float(0.78, 1.12), samples: 92 + traits.entangleTurns * 18, across: 6, depthLayers: 2
    });
    var startA = pathFor(0)(0);
    var startB = pathFor(Math.PI)(0);
    addEntangledPier(builder, startA.x, startA.y, 2.2, width * 0.72, "helix-pier-a");
    addEntangledPier(builder, startB.x, startB.y, 2.2, width * 0.72, "helix-pier-b");
    addEntangledGround(builder, amplitude * 2.8, rng.fork("suelo"));
    return { bodies: 2, crossings: Math.max(4, Math.round(turns * 2)), voids: Math.max(4, Math.round(turns * 2)), width: amplitude * 2.8 };
  }

  function addHabitableLoop(builder, traits, rng) {
    var radiusX = rng.float(10, 14.5);
    var radiusZ = rng.float(8.4, 12.5);
    var placement = rng.pick([
      "CENTRO", "LATERAL IZQUIERDO", "LATERAL DERECHO",
      "SUSPENDIDO", "DIAGONAL", "EXPULSADO"
    ]);
    var centerX = 0;
    var centerZ = radiusZ + rng.float(3.8, 6.2);
    var rotation = rng.float(-0.14, 0.14);
    if (placement === "LATERAL IZQUIERDO") centerX -= radiusX * rng.float(0.28, 0.52);
    else if (placement === "LATERAL DERECHO") centerX += radiusX * rng.float(0.28, 0.52);
    else if (placement === "SUSPENDIDO") centerZ += radiusZ * rng.float(0.24, 0.48);
    else if (placement === "DIAGONAL") rotation += traits.direction * rng.float(0.24, 0.48);
    else if (placement === "EXPULSADO") {
      centerX += traits.direction * radiusX * rng.float(0.56, 0.82);
      centerZ += radiusZ * rng.float(0.08, 0.32);
      rotation -= traits.direction * rng.float(0.16, 0.34);
    }
    var depth = rng.float(3.2, 6.2);
    var width = rng.float(3.4, 5.6);
    var phase = rng.float(-0.22, 0.22);
    var waveCount = rng.pick([1, 2, 2, 2, 3]);
    var gapAngle = rng.float(0, TAU);
    var gapSize = rng.float(0.11, 0.22);
    var loop = function (t) {
      var theta = t * TAU + phase;
      var localX = Math.sin(theta) * radiusX;
      var localZ = Math.sin(theta * waveCount) * radiusZ;
      return {
        x: centerX + localX * Math.cos(rotation) - localZ * Math.sin(rotation),
        y: Math.cos(theta) * depth,
        z: centerZ + localX * Math.sin(rotation) + localZ * Math.cos(rotation)
      };
    };
    addRibbonPath(builder, {
      body: "lazo", key: "lazo", path: loop, closed: true,
      skip: function (t) { return angleDistance(t * TAU + phase, gapAngle) < gapSize; },
      width: width, samples: 144, across: 7, depthLayers: 2
    });

    var innerPath = ellipsePath({
      centerX: centerX + rng.float(-radiusX * 0.34, radiusX * 0.34),
      centerZ: centerZ + rng.float(-radiusZ * 0.24, radiusZ * 0.3),
      radiusX: radiusX * rng.float(0.34, 0.56),
      radiusZ: radiusZ * rng.float(0.38, 0.6),
      depth: depth * 0.68, depthPhase: Math.PI,
      rotation: rotation + rng.float(-0.32, 0.32)
    });
    addRibbonPath(builder, {
      body: "habitación", key: "habitacion", path: innerPath, closed: true,
      skip: function (t) { return angleDistance(t * TAU, traits.direction > 0 ? 0 : Math.PI) < 0.13; },
      width: width * 0.62, samples: 92, across: 5, depthLayers: 2
    });

    var supportRoll = rng.next();
    var support = "FLOTANTE";
    var supportTop = Math.max(2.4, centerZ - radiusZ * 0.74);
    if (supportRoll < 0.24) {
      support = "DOS APOYOS";
      addEntangledPier(builder, centerX - radiusX * 0.62, 0, supportTop,
        width * 0.48, "loop-pier-l");
      addEntangledPier(builder, centerX + radiusX * 0.62, 0, supportTop,
        width * 0.48, "loop-pier-r");
    } else if (supportRoll < 0.5) {
      support = "APOYO IZQUIERDO";
      addEntangledPier(builder, centerX - radiusX * rng.float(0.42, 0.72), 0,
        supportTop, width * 0.52, "loop-pier-left");
    } else if (supportRoll < 0.76) {
      support = "APOYO DERECHO";
      addEntangledPier(builder, centerX + radiusX * rng.float(0.42, 0.72), 0,
        supportTop, width * 0.52, "loop-pier-right");
    }
    var grounded = rng.chance(support === "FLOTANTE" ? 0.12 : 0.42);
    // Igual que el pedestal: el lazo puede estar lateral, diagonal o expulsado,
    // así que su suelo lo acompaña en vez de quedarse en el origen.
    if (grounded) addEntangledGround(builder, radiusX * 2.7, rng.fork("suelo"), centerX);
    return {
      bodies: 2, crossings: waveCount + 1, voids: waveCount + 2,
      width: radiusX * 2.7, placement: placement,
      support: support, loopLaw: waveCount === 1 ? "ÓRBITA" : waveCount === 2 ? "OCHO" : "TRIPLE PLIEGUE",
      grounded: grounded
    };
  }

  function addLinkedCapsules(builder, traits, rng) {
    var radiusX = rng.float(7.2, 10.2);
    var radiusZ = rng.float(9.5, 13.8);
    var centerZ = radiusZ + rng.float(3, 5.5);
    var depth = rng.float(2.5, 5.2);
    var width = rng.float(2.8, 4.7);
    var separation = radiusX * rng.float(0.72, 1.08);
    var pathA = ellipsePath({
      centerX: -separation / 2, centerZ: centerZ, radiusX: radiusX, radiusZ: radiusZ,
      depth: depth, rotation: rng.float(-0.28, -0.08), depthPhase: 0
    });
    var pathB = ellipsePath({
      centerX: separation / 2, centerZ: centerZ * rng.float(0.94, 1.04), radiusX: radiusX * rng.float(0.82, 1.08),
      radiusZ: radiusZ * rng.float(0.78, 1.04), depth: depth, rotation: rng.float(0.08, 0.3), depthPhase: Math.PI
    });
    addRibbonPath(builder, {
      body: "cápsula-a", key: "capsule-a", path: pathA, closed: true,
      skip: function (t) { return angleDistance(t * TAU, Math.PI * 1.73) < 0.15; },
      width: width, samples: 112, across: 6, depthLayers: 2
    });
    addRibbonPath(builder, {
      body: "cápsula-b", key: "capsule-b", path: pathB, closed: true,
      skip: function (t) { return angleDistance(t * TAU, Math.PI * 0.72) < 0.15; },
      width: width * rng.float(0.76, 1.06), samples: 108, across: 6, depthLayers: 2
    });
    var bodies = 2;
    if (traits.entangleBodies > 2) {
      var pathC = ellipsePath({
        centerX: rng.float(-1.2, 1.2), centerZ: centerZ * 1.02,
        radiusX: radiusX * 0.48, radiusZ: radiusZ * 0.6,
        depth: depth * 1.15, rotation: rng.float(-0.12, 0.12), depthPhase: Math.PI / 2
      });
      addRibbonPath(builder, {
        body: "cápsula-c", key: "capsule-c", path: pathC, closed: true,
        skip: function (t) { return angleDistance(t * TAU, Math.PI * 1.5) < 0.18; },
        width: width * 0.55, samples: 84, across: 4, depthLayers: 2
      });
      bodies += 1;
    }
    addEntangledPier(builder, -separation / 2, 0, Math.max(2.2, centerZ - radiusZ), width * 0.75, "capsule-pier-a");
    addEntangledPier(builder, separation / 2, 0, Math.max(2.2, centerZ - radiusZ * 0.9), width * 0.75, "capsule-pier-b");
    addEntangledGround(builder, separation + radiusX * 2.4, rng.fork("suelo"));
    return { bodies: bodies, crossings: bodies === 3 ? 5 : 3, voids: bodies + 2, width: separation + radiusX * 2.4 };
  }

  function addPiercedSpiral(builder, traits, rng) {
    var outer = rng.float(11, 15.5);
    var centerZ = outer + rng.float(3.8, 6.2);
    var turns = traits.entangleTurns * rng.float(0.82, 1.08);
    var depth = rng.float(2.7, 5.8);
    var width = rng.float(2.7, 4.8);
    var phase = rng.float(-0.4, 0.4);
    var spiral = function (t) {
      var theta = phase + t * TAU * turns;
      var radius = lerp(outer, outer * 0.18, t);
      return { x: Math.cos(theta) * radius, y: Math.sin(theta * 0.72) * depth, z: centerZ + Math.sin(theta) * radius };
    };
    var spiralGap = rng.chance(0.5);
    addRibbonPath(builder, {
      body: "espiral", key: "spiral", path: spiral,
      skip: function (t) { return spiralGap && Math.abs(t - 0.78) < 0.025; },
      width: width, samples: 138 + traits.entangleTurns * 16, across: 6, depthLayers: 2
    });
    var corridorHeight = centerZ + rng.float(-1.4, 1.8);
    var corridor = function (t) {
      return {
        x: lerp(-outer * 1.12, outer * 1.12, t),
        y: Math.cos(t * Math.PI) * depth * 0.72,
        z: corridorHeight + Math.sin(t * Math.PI) * traits.madness * 2.1
      };
    };
    addRibbonPath(builder, {
      body: "pasillo", key: "corridor", path: corridor,
      skip: function (t) { return !spiralGap && Math.abs(t - 0.5) < 0.055; },
      width: width * rng.float(0.72, 1.05), samples: 82, across: 5, depthLayers: 2
    });
    addEntangledPier(builder, -outer * 0.92, 0, corridorHeight, width * 0.75, "spiral-pier-l");
    addEntangledPier(builder, outer * 0.92, 0, corridorHeight, width * 0.75, "spiral-pier-r");
    addEntangledGround(builder, outer * 2.65, rng.fork("suelo"));
    return { bodies: 2, crossings: traits.entangleTurns + 1, voids: traits.entangleTurns + 2, width: outer * 2.65 };
  }

  function addSlabKnot(builder, traits, rng) {
    var scale = rng.float(4.2, 5.8);
    var centerZ = scale * 2.55 + rng.float(4, 6.5);
    var depth = rng.float(3.4, 6.4);
    var width = rng.float(3, 5.2);
    var phase = rng.float(-0.18, 0.18);
    var knot = function (t) {
      var theta = t * TAU + phase;
      var radius = scale * (2 + 0.5 * Math.cos(theta * 3));
      return {
        x: radius * Math.cos(theta * 2),
        y: depth * Math.sin(theta * 3),
        z: centerZ + radius * Math.sin(theta * 2)
      };
    };
    var gapCenters = [0.17, 0.49, 0.82];
    addRibbonPath(builder, {
      body: "nudo", key: "knot", path: knot, closed: true,
      skip: function (t) {
        return gapCenters.some(function (center, index) {
          return index % 2 === (traits.direction > 0 ? 0 : 1) && Math.abs(t - center) < 0.018;
        });
      },
      width: width, samples: 184, across: 7, depthLayers: 2
    });

    var ring = ellipsePath({
      centerX: 0, centerZ: centerZ, radiusX: scale * 1.05, radiusZ: scale * 1.65,
      depth: depth * 0.78, rotation: rng.float(-0.35, 0.35), depthPhase: Math.PI
    });
    addRibbonPath(builder, {
      body: "núcleo", key: "knot-core", path: ring, closed: true,
      skip: function (t) { return angleDistance(t * TAU, traits.direction > 0 ? Math.PI * 0.5 : Math.PI * 1.5) < 0.16; },
      width: width * 0.62, samples: 92, across: 5, depthLayers: 2
    });
    addEntangledPier(builder, -scale * 1.9, 0, Math.max(2.5, centerZ - scale * 2), width * 0.62, "knot-pier-l");
    addEntangledPier(builder, scale * 1.9, 0, Math.max(2.5, centerZ - scale * 2), width * 0.62, "knot-pier-r");
    addEntangledGround(builder, scale * 6.2, rng.fork("suelo"));
    return { bodies: 2, crossings: 6, voids: 7, width: scale * 6.2 };
  }

  function makeEntangledSurface(traits, interpretation, rng) {
    var builder = new SurfaceBuilder();
    var geometry;
    var loadedTraits = Object.assign({}, traits, {
      entangleBodies: clamp(traits.entangleBodies + Math.min(1, interpretation.profundidad), 2, 4),
      entangleTurns: clamp(traits.entangleTurns + Math.min(1, interpretation.repeticion), 2, 5)
    });
    if (traits.entangleForm === "DOBLE HÉLICE") geometry = addHelixArchitecture(builder, loadedTraits, rng.fork("doble-helice"));
    else if (traits.entangleForm === "LAZO HABITABLE") geometry = addHabitableLoop(builder, loadedTraits, rng.fork("lazo-habitable"));
    else if (traits.entangleForm === "CÁPSULAS ENLAZADAS") geometry = addLinkedCapsules(builder, loadedTraits, rng.fork("capsulas"));
    else if (traits.entangleForm === "ESPIRAL ATRAVESADA") geometry = addPiercedSpiral(builder, loadedTraits, rng.fork("espiral"));
    else geometry = addSlabKnot(builder, loadedTraits, rng.fork("nudo-losas"));

    geometry.kind = traits.entangleForm;
    geometry.relation = rng.pick(["DENTRO / A TRAVÉS", "ARRIBA / DEBAJO", "INTERIOR RECURRENTE", "CRUCE HABITABLE"]);
    geometry.authenticGaps = geometry.voids;
    geometry.interpretation = interpretation.nombres.slice();
    return { surface: builder.points, geometry: geometry };
  }

  function addDoorwayFrame(builder, spec) {
    var half = spec.width / 2;
    var step = 0.78;
    for (var z = 0; z <= spec.height; z += step) {
      for (var edge = -1; edge <= 1; edge += 2) {
        builder.add(spec.body || "portal", "frente", spec.x + edge * half, spec.y || 0, spec.z + z,
          spec.key + ":jamb:" + edge + ":" + z.toFixed(1));
        builder.add(spec.body || "portal", "lateral", spec.x + edge * half, (spec.y || 0) + 0.72, spec.z + z,
          spec.key + ":depth:" + edge + ":" + z.toFixed(1));
      }
    }
    for (var x = -half; x <= half; x += step) {
      builder.add(spec.body || "portal", "techo", spec.x + x, spec.y || 0, spec.z + spec.height,
        spec.key + ":lintel:" + x.toFixed(1));
    }
  }

  function addHabitableSphere(builder, traits, rng) {
    var radius = rng.float(10.5, 15.5);
    var centerZ = radius + rng.float(3.2, 6);
    var depthScale = rng.float(0.42, 0.72);
    var portalLat = rng.float(-0.18, 0.14);
    var portalLon = rng.float(-0.12, 0.12);
    var portalWidth = rng.float(0.2, 0.32);
    var portalHeight = rng.float(0.26, 0.4);
    var latitudes = 21 + Math.round(Math.abs(traits.curvature) * 5);
    var longitudes = 38 + traits.portals * 2;
    for (var latIndex = 1; latIndex < latitudes; latIndex += 1) {
      var latitude = lerp(-Math.PI / 2, Math.PI / 2, latIndex / latitudes);
      for (var lonIndex = 0; lonIndex <= longitudes; lonIndex += 1) {
        var longitude = lerp(-Math.PI / 2, Math.PI / 2, lonIndex / longitudes);
        var inPortal = Math.pow((longitude - portalLon) / portalWidth, 2) +
          Math.pow((latitude - portalLat) / portalHeight, 2) < 1;
        if (inPortal) continue;
        var cosLat = Math.cos(latitude);
        builder.add("esfera", lonIndex % 6 === 0 ? "lateral" : latIndex % 4 === 0 ? "techo" : "frente",
          radius * cosLat * Math.sin(longitude),
          radius * cosLat * Math.cos(longitude) * depthScale,
          centerZ + radius * Math.sin(latitude),
          "sphere:" + latIndex + ":" + lonIndex);
      }
    }

    var portalCenterX = radius * Math.cos(portalLat) * Math.sin(portalLon);
    var portalCenterY = radius * Math.cos(portalLat) * Math.cos(portalLon) * depthScale;
    var portalCenterZ = centerZ + radius * Math.sin(portalLat);
    var room = ellipsePath({
      centerX: portalCenterX, centerY: portalCenterY + 0.5, centerZ: portalCenterZ,
      radiusX: radius * portalWidth * 0.78, radiusZ: radius * portalHeight * 0.78,
      depth: 0.55, rotation: 0, depthPhase: Math.PI / 2
    });
    addRibbonPath(builder, {
      body: "habitación-interior", key: "sphere-room", path: room, closed: true,
      width: rng.float(0.65, 1.15), samples: 58, across: 3, depthLayers: 2
    });

    var supportTop = Math.max(2.4, centerZ - radius * 0.92);
    addEntangledPier(builder, -radius * 0.34, 0, supportTop, rng.float(1.8, 3.2), "sphere-pier-l");
    addEntangledPier(builder, radius * 0.34, 0, supportTop, rng.float(1.8, 3.2), "sphere-pier-r");
    addEntangledGround(builder, radius * 2.5, rng.fork("suelo"));
    return {
      bodies: 2, portalCount: 1, voids: 1, radius: radius,
      law: "SUPERFICIE / HABITACIÓN", orientation: "CURVATURA POSITIVA"
    };
  }

  function addLargerInterior(builder, traits, rng) {
    var facadeWidth = rng.float(10.5, 15);
    var facadeHeight = rng.float(14, 20);
    var portalWidth = rng.float(3.2, 5);
    var portalHeight = rng.float(6.2, 9);
    var columns = Math.round(facadeWidth * 1.2);
    var rows = Math.round(facadeHeight * 1.15);
    for (var column = 0; column <= columns; column += 1) {
      var x = lerp(-facadeWidth / 2, facadeWidth / 2, column / columns);
      for (var row = 0; row <= rows; row += 1) {
        var z = row / rows * facadeHeight;
        if (Math.abs(x) < portalWidth / 2 && z < portalHeight) continue;
        builder.add("exterior", column % 4 === 0 ? "lateral" : "frente", x, 0, z,
          "small-outside:" + column + ":" + row);
      }
    }

    var roomCount = 3 + traits.gravityCenters;
    var centerZ = portalHeight * 0.88;
    for (var roomIndex = 0; roomIndex < roomCount; roomIndex += 1) {
      var growth = Math.pow(roomIndex + 1, 1.18 + Math.abs(traits.curvature) * 0.26);
      var radiusX = facadeWidth * (0.48 + growth * 0.28);
      var radiusZ = facadeHeight * (0.38 + growth * 0.2);
      var roomPath = ellipsePath({
        centerX: rng.float(-0.35, 0.35) * roomIndex,
        centerY: 1.2 + roomIndex * 1.1,
        centerZ: centerZ + roomIndex * rng.float(0.3, 0.8),
        radiusX: radiusX, radiusZ: radiusZ,
        depth: rng.float(0.6, 1.4), rotation: rng.float(-0.08, 0.08), depthPhase: roomIndex * 0.7
      });
      addRibbonPath(builder, {
        body: "interior-" + roomIndex, key: "larger-room-" + roomIndex,
        path: roomPath, closed: true,
        skip: function (t) { return angleDistance(t * TAU, Math.PI * 1.5) < 0.12; },
        width: rng.float(1.1, 2.4), samples: 74 + roomIndex * 8, across: 3 + (roomIndex % 2), depthLayers: 2
      });
    }

    addDoorwayFrame(builder, {
      body: "umbral", key: "small-door", x: 0, y: -0.4, z: 0,
      width: portalWidth, height: portalHeight
    });
    addEntangledGround(builder, facadeWidth * 2.8, rng.fork("suelo"));
    return {
      bodies: roomCount + 1, portalCount: 1, voids: roomCount + 1,
      exteriorWidth: facadeWidth, interiorWidth: facadeWidth * (0.76 + roomCount * 0.32),
      law: "ESCALA INTERIOR / ESCALA EXTERIOR", orientation: "EXPANSIÓN HIPERBÓLICA"
    };
  }

  function addRecurrentCorridor(builder, traits, rng) {
    var radius = rng.float(10.5, 15);
    var centerZ = radius + rng.float(3.5, 6);
    var depth = rng.float(2.6, 5.5);
    var width = rng.float(4.2, 7.2);
    var phase = rng.float(-0.3, 0.3);
    var centerPath = function (t) {
      var theta = t * TAU + phase;
      return {
        x: radius * Math.cos(theta),
        y: depth * Math.sin(theta),
        z: centerZ + radius * Math.sin(theta)
      };
    };
    var gapCenter = rng.float(0.08, 0.28);
    addRibbonPath(builder, {
      body: "pasillo", key: "recurrent-corridor", path: centerPath, closed: true,
      skip: function (t) { return Math.abs(t - gapCenter) < 0.026; },
      section: function (t, u, p, normalX, normalZ) {
        var twist = t * Math.PI * (traits.orientationFault ? 1 : 2);
        return {
          x: normalX * u * Math.cos(twist),
          y: u * Math.sin(twist),
          z: normalZ * u * Math.cos(twist)
        };
      },
      width: width, samples: 164, across: 8, depthLayers: 2
    });

    if (traits.gravityCenters > 1) {
      var returnPath = function (t) {
        var theta = t * TAU;
        return {
          x: Math.sin(theta) * radius * 0.55,
          y: -Math.cos(theta) * depth * 0.72,
          z: centerZ + Math.sin(theta * 2) * radius * 0.43
        };
      };
      addRibbonPath(builder, {
        body: "retorno", key: "return-loop", path: returnPath, closed: true,
        skip: function (t) { return Math.abs(t - 0.5) < 0.025; },
        width: width * 0.48, samples: 112, across: 4, depthLayers: 2
      });
    }

    var gapPoint = centerPath(gapCenter);
    addDoorwayFrame(builder, {
      body: "portal-a", key: "return-door-a", x: gapPoint.x, y: gapPoint.y,
      z: Math.max(0, gapPoint.z - width * 0.45), width: width * 0.52, height: width * 0.9
    });
    addEntangledPier(builder, 0, 0, Math.max(2.2, centerZ - radius), width * 0.5, "return-pier");
    addEntangledGround(builder, radius * 2.65, rng.fork("suelo"));
    return {
      bodies: traits.gravityCenters > 1 ? 2 : 1, portalCount: 2,
      voids: traits.gravityCenters > 1 ? 2 : 1, twist: traits.orientationFault ? 1 : 2,
      law: "COMIENZO / REGRESO", orientation: traits.orientationFault ? "MEDIA VUELTA" : "VUELTA COMPLETA"
    };
  }

  function addInverseDome(builder, traits, rng) {
    var radius = rng.float(11.5, 16);
    var rimZ = rng.float(20, 27);
    var fall = rng.float(7, 12) * (0.72 + Math.abs(traits.curvature) * 0.38);
    var portalRadius = rng.float(2.2, 4.2);
    var rings = 14 + Math.round(Math.abs(traits.curvature) * 5);
    var samples = 68;
    for (var ringIndex = 1; ringIndex <= rings; ringIndex += 1) {
      var radial = lerp(portalRadius, radius, ringIndex / rings);
      var normalized = radial / radius;
      var z = rimZ - fall * (1 - normalized * normalized);
      for (var sample = 0; sample < samples; sample += 1) {
        var theta = sample / samples * TAU;
        builder.add("cúpula", ringIndex % 4 === 0 ? "techo" : sample % 8 === 0 ? "lateral" : "frente",
          Math.cos(theta) * radial,
          Math.sin(theta) * radial * rng.float(0.34, 0.44),
          z,
          "inverse-dome:" + ringIndex + ":" + sample);
      }
    }

    var shaftHeight = Math.max(4, rimZ - fall - 1.5);
    var shaft = ellipsePath({
      centerX: 0, centerY: 0, centerZ: shaftHeight,
      radiusX: portalRadius, radiusZ: portalRadius * 1.25,
      depth: portalRadius * 0.35, depthPhase: Math.PI / 2
    });
    addRibbonPath(builder, {
      body: "pozo-invertido", key: "inverse-well", path: shaft, closed: true,
      width: rng.float(1.1, 2), samples: 68, across: 4, depthLayers: 2
    });
    for (var support = -1; support <= 1; support += 2) {
      addEntangledPier(builder, support * radius * 0.78, 0, rimZ - fall * 0.18,
        rng.float(1.8, 3.2), "dome-pier:" + support);
    }
    addEntangledGround(builder, radius * 2.55, rng.fork("suelo"));
    return {
      bodies: 2, portalCount: 1, voids: 1, radius: radius,
      law: "TECHO / SUELO", orientation: "GRAVEDAD INVERTIDA"
    };
  }

  function addCurvedHorizonPatio(builder, traits, rng) {
    var patioRadius = rng.float(7.2, 10.5);
    var wallHeight = rng.float(5.5, 9.5);
    var centerZ = rng.float(12, 17);
    var segments = 5 + traits.gravityCenters + Math.round(traits.madness * 2);
    var gap = rng.float(0.08, 0.15);
    var levels = 9 + Math.round(wallHeight);
    for (var segment = 0; segment < segments; segment += 1) {
      var start = segment / segments * TAU + gap;
      var end = (segment + 1) / segments * TAU - gap;
      var samples = 14 + Math.round(Math.abs(traits.curvature) * 8);
      for (var level = 0; level <= levels; level += 1) {
        var localHeight = level / levels * wallHeight * rng.float(0.88, 1.08);
        for (var sample = 0; sample <= samples; sample += 1) {
          var theta = lerp(start, end, sample / samples);
          var gravityFlip = traits.orientationFault && segment % 3 === 0 ? -0.52 : 1;
          var radial = patioRadius + localHeight * gravityFlip;
          builder.add("horizonte-" + segment,
            level % 4 === 0 ? "techo" : sample % 5 === 0 ? "lateral" : "frente",
            Math.cos(theta) * radial,
            Math.sin(theta * traits.gravityCenters) * rng.float(1.8, 3.8),
            centerZ + Math.sin(theta) * radial,
            "curved-yard:" + segment + ":" + level + ":" + sample);
        }
      }
    }

    var horizon = ellipsePath({
      centerX: 0, centerY: 0, centerZ: centerZ,
      radiusX: patioRadius, radiusZ: patioRadius,
      depth: rng.float(1.4, 2.8), depthPhase: 0
    });
    addRibbonPath(builder, {
      body: "patio", key: "curved-horizon", path: horizon, closed: true,
      skip: function (t) { return Math.abs(t - 0.75) < gap * 0.6; },
      width: rng.float(0.8, 1.5), samples: 92, across: 3, depthLayers: 2
    });
    return {
      bodies: segments, portalCount: segments, voids: segments + 1,
      radius: patioRadius, gravityCenters: traits.gravityCenters,
      law: "PATIO / HORIZONTE", orientation: traits.orientationFault ? "GRAVEDADES DISCONTINUAS" : "GRAVEDAD RADIAL"
    };
  }

  function makeNonEuclideanSurface(traits, interpretation, rng) {
    var builder = new SurfaceBuilder();
    var loadedTraits = Object.assign({}, traits, {
      curvature: clamp(traits.curvature * (1 + interpretation.curvatura * 0.12), -1, 1),
      gravityCenters: clamp(traits.gravityCenters + Math.min(1, interpretation.retorno), 1, 3),
      portals: clamp(traits.portals + Math.min(1, interpretation.profundidad), 1, 4),
      orientationFault: traits.orientationFault || interpretation.inversion > 0
    });
    var geometry;
    if (traits.nonEuclideanForm === "ESFERA HABITABLE") geometry = addHabitableSphere(builder, loadedTraits, rng.fork("esfera"));
    else if (traits.nonEuclideanForm === "INTERIOR MAYOR QUE EL EXTERIOR") geometry = addLargerInterior(builder, loadedTraits, rng.fork("interior-mayor"));
    else if (traits.nonEuclideanForm === "PASILLO RECURRENTE") geometry = addRecurrentCorridor(builder, loadedTraits, rng.fork("pasillo-recurrente"));
    else if (traits.nonEuclideanForm === "CÚPULA INVERSA") geometry = addInverseDome(builder, loadedTraits, rng.fork("cupula-inversa"));
    else geometry = addCurvedHorizonPatio(builder, loadedTraits, rng.fork("patio-curvo"));

    geometry.kind = traits.nonEuclideanForm;
    geometry.curvature = Math.round(loadedTraits.curvature * 100) / 100;
    geometry.curvatureClass = traits.curvatureClass;
    geometry.gravityCenters = geometry.gravityCenters || loadedTraits.gravityCenters;
    geometry.orientationFault = loadedTraits.orientationFault;
    geometry.interpretation = interpretation.nombres.slice();
    return { surface: builder.points, geometry: geometry };
  }

  function surfaceBounds(points) {
    var xs = points.map(function (point) { return point.x; });
    var ys = points.map(function (point) { return point.y; });
    var zs = points.map(function (point) { return point.z; });
    return {
      minX: Math.min.apply(Math, xs), maxX: Math.max.apply(Math, xs),
      minY: Math.min.apply(Math, ys), maxY: Math.max.apply(Math, ys),
      minZ: Math.min.apply(Math, zs), maxZ: Math.max.apply(Math, zs)
    };
  }

  function grammarSpec(body, side, originX, baseY, width, height, depth, madness, baseZ, structure) {
    return {
      body: body, side: side, originX: originX, baseY: baseY,
      width: width, height: height, depth: depth, madness: madness,
      baseZ: baseZ || 0, structure: structure || null
    };
  }

  function makeGrammarSpecs(traits, rng) {
    var width = rng.float(12, 18);
    var height = rng.float(15, 27);
    var depth = rng.float(3.2, 7);
    var specs = [];
    var footprintVoids = 0;
    var push = function (x, y, w, h, d, baseZ, structure) {
      specs.push(grammarSpec("gene-" + specs.length, specs.length % 2 ? "right" : "left",
        x, y, w, h, d || depth, traits.madness, baseZ, structure));
    };

    if (traits.archFootprint === "BARRA") {
      push(0, 0, width * 1.25, height, depth);
    } else if (traits.archFootprint === "L") {
      push(-width * 0.2, 0, width * 0.72, height, depth);
      push(width * 0.29, depth * 0.7, width * 0.42, height * rng.float(0.58, 0.9), depth * 1.28);
      footprintVoids = 1;
    } else if (traits.archFootprint === "U") {
      push(-width * 0.43, 0, width * 0.3, height, depth);
      push(width * 0.43, 0, width * 0.3, height * rng.float(0.82, 1.08), depth);
      push(0, depth * 0.9, width * 0.62, height * rng.float(0.42, 0.66), depth * 0.72);
      footprintVoids = 1;
    } else if (traits.archFootprint === "PATIO") {
      push(-width * 0.48, 0, width * 0.25, height * rng.float(0.78, 1.08), depth);
      push(width * 0.48, 0, width * 0.25, height * rng.float(0.72, 1.04), depth);
      push(0, depth * 1.12, width * 0.66, height * rng.float(0.38, 0.58), depth * 0.65);
      push(-width * 0.31, -depth * 0.52, width * 0.24, height * rng.float(0.32, 0.52), depth * 0.54);
      push(width * 0.31, -depth * 0.52, width * 0.24, height * rng.float(0.32, 0.52), depth * 0.54);
      footprintVoids = 2;
    } else if (traits.archFootprint === "ANILLO") {
      var ringBodies = rng.int(4, 6);
      for (var ringBody = 0; ringBody < ringBodies; ringBody += 1) {
        var theta = ringBody / ringBodies * TAU;
        push(Math.cos(theta) * width * 0.46, Math.sin(theta) * depth * 0.72,
          width * rng.float(0.2, 0.31), height * rng.float(0.56, 0.92), depth * 0.68);
      }
      footprintVoids = 1;
    } else if (traits.archFootprint === "TORRES") {
      var towers = rng.int(2, traits.madness > 0.72 ? 5 : 4);
      for (var tower = 0; tower < towers; tower += 1) {
        push(lerp(-width * 0.46, width * 0.46, towers === 1 ? 0.5 : tower / (towers - 1)),
          rng.float(-depth * 0.28, depth * 0.75), width * rng.float(0.22, 0.38),
          height * rng.float(0.56, 1.15), depth * rng.float(0.62, 1.02));
      }
      footprintVoids = Math.max(1, towers - 1);
    } else if (traits.archFootprint === "CRUJÍAS PARALELAS") {
      var aisles = rng.int(2, traits.madness > 0.7 ? 4 : 3);
      for (var aisle = 0; aisle < aisles; aisle += 1) {
        push(rng.float(-width * 0.08, width * 0.08), aisle * depth * 0.72,
          width * rng.float(0.74, 1.08), height * rng.float(0.48, 0.92),
          depth * rng.float(0.24, 0.4));
      }
      footprintVoids = aisles - 1;
    } else if (traits.archFootprint === "PUENTE HABITADO") {
      var bridgeBase = height * rng.float(0.38, 0.53);
      push(-width * 0.43, 0, width * rng.float(0.2, 0.28), height * rng.float(0.72, 1), depth);
      push(width * 0.43, depth * 0.14, width * rng.float(0.2, 0.28), height * rng.float(0.68, 0.96), depth);
      push(0, depth * 0.34, width * rng.float(0.72, 0.92), height * rng.float(0.18, 0.28),
        depth * rng.float(0.5, 0.78), bridgeBase, rng.chance(0.55) ? "BÓVEDAS" : "LOSAS");
      footprintVoids = 2;
    } else {
      var steps = rng.int(3, 5);
      for (var step = 0; step < steps; step += 1) {
        push(rng.float(-0.5, 0.5) * step, step * depth * 0.62,
          width * (1 - step * 0.13), height * (1 - step * 0.11), depth * 0.72);
      }
      footprintVoids = 1;
    }
    return { specs: specs, footprintVoids: footprintVoids, nominalWidth: width, nominalHeight: height, nominalDepth: depth };
  }

  function addPorticoStructure(builder, spec, rng) {
    var bays = rng.int(3, 7);
    var bayWidth = spec.width / bays;
    var spring = spec.height * rng.float(0.48, 0.68);
    for (var bay = 0; bay <= bays; bay += 1) {
      var columnX = spec.originX - spec.width / 2 + bay * bayWidth;
      for (var z = 0; z <= spring; z += 0.78) {
        builder.add(spec.body, bay % 2 ? "lateral" : "frente", columnX, spec.baseY, z,
          "portico-column:" + bay + ":" + z.toFixed(1));
        if (bay === 0 || bay === bays) builder.add(spec.body, "lateral", columnX, spec.baseY + spec.depth * 0.7, z,
          "portico-depth:" + bay + ":" + z.toFixed(1));
      }
    }
    for (var arch = 0; arch < bays; arch += 1) {
      var centerX = spec.originX - spec.width / 2 + (arch + 0.5) * bayWidth;
      for (var sample = 0; sample <= 18; sample += 1) {
        var theta = sample / 18 * Math.PI;
        for (var depth = 0; depth < 1 + Math.round(spec.depth / 2.6); depth += 1) {
          builder.add(spec.body, depth ? "lateral" : "techo",
            centerX + Math.cos(theta) * bayWidth * 0.5,
            spec.baseY + depth * 0.78,
            spring + Math.sin(theta) * (spec.height - spring),
            "portico-arch:" + arch + ":" + sample + ":" + depth);
        }
      }
    }
    addBase(builder, spec, rng);
  }

  function addVaultStructure(builder, spec, rng) {
    var ribs = rng.int(4, 9);
    for (var rib = 0; rib < ribs; rib += 1) {
      var y = spec.baseY + rib / Math.max(1, ribs - 1) * spec.depth;
      for (var sample = 0; sample <= 42; sample += 1) {
        var theta = sample / 42 * Math.PI;
        builder.add(spec.body, rib % 3 === 0 ? "lateral" : "techo",
          spec.originX + Math.cos(theta) * spec.width / 2,
          y,
          Math.sin(theta) * spec.height,
          "vault:" + rib + ":" + sample);
      }
    }
    var floors = rng.int(1, 3);
    for (var floor = 1; floor <= floors; floor += 1) {
      var floorZ = spec.height * floor / (floors + 2);
      for (var x = -spec.width / 2; x <= spec.width / 2; x += 0.84) {
        builder.add(spec.body, "frente", spec.originX + x, spec.baseY, floorZ,
          "vault-floor:" + floor + ":" + x.toFixed(1));
      }
    }
    addBase(builder, spec, rng);
  }

  function addColumnStructure(builder, spec, rng) {
    var columns = rng.int(4, 9);
    var depthRows = rng.int(1, 3);
    for (var column = 0; column < columns; column += 1) {
      var x = lerp(spec.originX - spec.width / 2, spec.originX + spec.width / 2,
        columns === 1 ? 0.5 : column / (columns - 1));
      for (var depth = 0; depth < depthRows; depth += 1) {
        for (var z = 0; z <= spec.height; z += 0.78) {
          builder.add(spec.body, depth ? "lateral" : "frente", x,
            spec.baseY + depth * spec.depth / Math.max(1, depthRows - 1), z,
            "column-grid:" + column + ":" + depth + ":" + z.toFixed(1));
        }
      }
    }
    var slabs = rng.int(2, 5);
    for (var slab = 1; slab <= slabs; slab += 1) {
      var slabZ = spec.height * slab / (slabs + 1);
      for (var sx = -spec.width / 2; sx <= spec.width / 2; sx += 0.82) {
        builder.add(spec.body, "techo", spec.originX + sx, spec.baseY, slabZ,
          "column-slab:" + slab + ":" + sx.toFixed(1));
      }
    }
    addBase(builder, spec, rng);
  }

  function addArchedMass(builder, spec, rng) {
    // Una masa completa, no el contorno de un arco: el vano se excava en un
    // campo voxelar y sus caras visibles se incorporan a la gramática.
    var field = new VoxelField();
    var width = clamp(Math.round(spec.width), 5, 24);
    var depth = clamp(Math.round(spec.depth), 3, 10);
    var height = clamp(Math.round(spec.height), 8, 30);
    var radius = clamp(width * rng.float(0.23, 0.34), 1.45, width / 2 - 1);
    var spring = clamp(height * rng.float(0.16, 0.28), 1.5, height - radius - 2);
    field.block(0, width, 0, depth, 0, height);
    carveArch(field, { center: width / 2, radius: radius, spring: spring, depth: depth });
    if (width > 10 && height > 13 && rng.chance(0.32)) {
      carveWindow(field, { center: width / 2, radius: radius, spring: spring, depth: depth }, rng.fork("ventana-arqueada"));
    }
    var direction = spec.side === "left" ? -1 : 1;
    visibleFaces(field, direction, spec.body).forEach(function (face) {
      builder.add(spec.body, face.face,
        spec.originX - width / 2 + face.x,
        spec.baseY + face.y,
        face.z,
        "arched-mass:" + face.voxel + ":" + face.face);
    });
  }

  function addRotunda(builder, spec, rng) {
    // Recinto circular con profundidad legible, puerta real y anillo de
    // cubierta. La fachada curva cambia de alfabeto al doblar las esquinas.
    var radiusX = Math.max(2.6, spec.width * 0.5);
    var radiusY = Math.max(1.8, spec.depth * 0.58);
    var samples = rng.int(42, 58);
    var levels = Math.max(10, Math.round(spec.height / 0.78));
    var portalHalfAngle = rng.float(0.2, 0.34);
    var portalHeight = spec.height * rng.float(0.32, 0.48);
    for (var level = 0; level <= levels; level += 1) {
      var z = level / levels * spec.height;
      for (var sample = 0; sample < samples; sample += 1) {
        var theta = sample / samples * TAU;
        var frontDistance = Math.abs(Math.atan2(Math.sin(theta - Math.PI * 1.5), Math.cos(theta - Math.PI * 1.5)));
        if (z < portalHeight && frontDistance < portalHalfAngle) continue;
        var sin = Math.sin(theta);
        var face = sin < -0.5 ? "frente" : Math.abs(Math.cos(theta)) > 0.52 ? "lateral" : "techo";
        builder.add(spec.body, face,
          spec.originX + Math.cos(theta) * radiusX,
          spec.baseY + (sin + 1) * radiusY,
          z,
          "rotunda-wall:" + level + ":" + sample);
      }
    }
    var roofRings = rng.int(4, 7);
    for (var ring = 0; ring < roofRings; ring += 1) {
      var ringScale = lerp(0.46, 1, ring / Math.max(1, roofRings - 1));
      for (var roofSample = 0; roofSample < samples; roofSample += 1) {
        var roofTheta = roofSample / samples * TAU;
        builder.add(spec.body, ring % 2 ? "techo" : "lateral",
          spec.originX + Math.cos(roofTheta) * radiusX * ringScale,
          spec.baseY + radiusY + Math.sin(roofTheta) * radiusY * ringScale,
          spec.height + (1 - ringScale) * radiusX * 0.16,
          "rotunda-roof:" + ring + ":" + roofSample);
      }
    }
    addBase(builder, spec, rng);
  }

  function offsetBuilder(builder, baseZ) {
    if (!baseZ) return builder;
    return {
      add: function (body, face, x, y, z, group) {
        builder.add(body, face, x, y, z + baseZ, group);
      }
    };
  }

  function addGrammarStructure(builder, structure, spec, rng) {
    var target = offsetBuilder(builder, spec.baseZ);
    if (structure === "MASA ARQUEADA") addArchedMass(target, spec, rng);
    else if (structure === "ROTONDA") addRotunda(target, spec, rng);
    else if (structure === "TORRE HELICOIDAL") addHelicalSlabTower(target, spec, rng);
    else if (structure === "CUBOS ENCAJADOS") addNestedCubes(target, spec, rng);
    else if (structure === "PIRÁMIDES") addPyramid(target, spec, rng);
    else if (structure === "ESFERAS") addSphere(target, spec, rng);
    else if (structure === "OBELISCO ROTO") addBrokenObelisk(target, spec, rng);
    else if (structure === "LOSAS") addStrata(target, spec, rng);
    else if (structure === "PÓRTICOS") addPorticoStructure(target, spec, rng);
    else if (structure === "COSTILLAS") addRibs(target, spec, rng);
    else if (structure === "BÓVEDAS") addVaultStructure(target, spec, rng);
    else if (structure === "PANTALLAS") addScreen(target, spec, rng);
    else if (structure === "COLUMNAS") addColumnStructure(target, spec, rng);
    else if (structure === "CELOSÍAS") addLattice(target, spec, rng);
    else if (structure === "ZIGURATS") addZiggurat(target, spec, rng);
    else if (structure === "ARCADAS") addAqueduct(target, spec, rng);
    else if (structure === "MÉNSULAS") addCorbelVault(target, spec, rng);
    else if (structure === "ONDA") addStandingWave(target, spec, rng);
    else if (structure === "NUDO") addKnotBody(target, spec, rng);
    else if (structure === "LAZO") addSculpturalLoop(target, spec, rng);
    else if (structure === "ANILLOS") addRing(target, spec, rng);
    else if (structure === "TÓTEM") addTotem(target, spec, rng);
    else if (structure === "VÓRTICE") addVortex(target, spec, rng);
    else if (structure === "HIPERBOLOIDE") addHyperboloid(target, spec, rng);
    else if (structure === "VOLADIZOS") addCantilevers(target, spec, rng);
    else if (structure === "ESPIRAL") addSpiralBody(target, spec, rng);
    else if (structure === "DOBLE HÉLICE") addDoubleHelixBody(target, spec, rng);
    else if (structure === "CÁPSULAS ENLAZADAS") addLinkedCapsulesBody(target, spec, rng);
    else if (structure === "ESPIRAL ATRAVESADA") addPiercedSpiralBody(target, spec, rng);
    else if (structure === "ESFERA HABITABLE") addHabitableSphereBody(target, spec, rng);
    else if (structure === "MÖBIUS") addMobiusBody(target, spec, rng);
    else if (structure === "SERPIENTE") addFoldedSerpent(target, spec, rng);
    else if (structure === "HIPAR") addHipar(target, spec, rng);
    else addFold(target, spec, rng);
  }

  function sculpturalSpec(body, originX, baseY, width, height, depth, madness, side) {
    return {
      body: body, originX: originX, baseY: baseY,
      width: width, height: height, depth: depth,
      madness: madness, side: side || "left", noBase: true
    };
  }

  function addSculpturalSpiral(builder, spec, rng) {
    var turns = rng.float(1.6, 2.7);
    var phase = rng.float(0, TAU);
    var path = function (t) {
      var theta = phase + t * TAU * turns;
      return {
        x: spec.centerX + Math.cos(theta) * spec.radius,
        y: spec.centerY + Math.sin(theta) * spec.depth,
        z: spec.baseZ + t * spec.height
      };
    };
    addRibbonPath(builder, {
      body: spec.body, key: "sculptural-spiral", path: path,
      skip: function (t) { return Math.abs(t - 0.52) < 0.018; },
      width: spec.width, samples: 112, across: 4, depthLayers: 2
    });
  }

  // ————— Segunda tanda: las especies entrelazadas y no euclidianas entran a la
  // gramática. El patrón es el mismo que el del nudo: escalar desde el `spec`,
  // colocar en `originX/baseY` y renunciar al suelo propio —en la gramática lo
  // pone makeGrammarArchitecture— conservando en cambio los pilares, que aquí
  // son parte del cuerpo.

  function addDoubleHelixBody(builder, spec, rng) {
    var amplitude = spec.width * rng.float(0.3, 0.44);
    var depth = spec.depth * rng.float(0.6, 1);
    var turns = rng.float(1.4, 2.6) * (0.7 + spec.madness * 0.5);
    var phase = rng.float(-0.35, 0.35);
    var ribbon = Math.max(1.6, spec.width * rng.float(0.16, 0.26));
    var pathFor = function (offset) {
      return function (t) {
        var theta = phase + t * TAU * turns + offset;
        return {
          x: spec.originX + Math.sin(theta) * amplitude,
          y: spec.baseY + Math.cos(theta) * depth,
          z: 1.4 + t * spec.height
        };
      };
    };
    var skipFor = function (offset) {
      return function (t) {
        var theta = phase + t * TAU * turns + offset;
        return Math.abs(Math.sin(theta)) < 0.14 && Math.cos(theta) > 0.25;
      };
    };
    var samples = clamp(Math.round(72 + turns * 34), 90, 190);
    addRibbonPath(builder, {
      body: spec.body, key: "grammar-helix-a", path: pathFor(0), skip: skipFor(0),
      width: ribbon, samples: samples, across: 5, depthLayers: 2
    });
    addRibbonPath(builder, {
      body: spec.body, key: "grammar-helix-b", path: pathFor(Math.PI), skip: skipFor(Math.PI),
      width: ribbon * rng.float(0.78, 1.12), samples: samples, across: 5, depthLayers: 2
    });
    var startA = pathFor(0)(0), startB = pathFor(Math.PI)(0);
    addEntangledPier(builder, startA.x, startA.y, 1.8, ribbon * 0.72, "grammar-helix-pier-a");
    addEntangledPier(builder, startB.x, startB.y, 1.8, ribbon * 0.72, "grammar-helix-pier-b");
    addBase(builder, spec, rng);
  }

  function addLinkedCapsulesBody(builder, spec, rng) {
    var radiusX = spec.width * rng.float(0.24, 0.34);
    var radiusZ = spec.height * rng.float(0.3, 0.44);
    var centerZ = radiusZ + rng.float(2, 4.5);
    var depth = spec.depth * rng.float(0.55, 0.95);
    var ribbon = Math.max(1.5, spec.width * rng.float(0.13, 0.21));
    var separation = radiusX * rng.float(0.72, 1.08);
    var pathA = ellipsePath({
      centerX: spec.originX - separation / 2, centerY: spec.baseY, centerZ: centerZ,
      radiusX: radiusX, radiusZ: radiusZ,
      depth: depth, rotation: rng.float(-0.28, -0.08), depthPhase: 0
    });
    var pathB = ellipsePath({
      centerX: spec.originX + separation / 2, centerY: spec.baseY,
      centerZ: centerZ * rng.float(0.94, 1.04), radiusX: radiusX * rng.float(0.82, 1.08),
      radiusZ: radiusZ * rng.float(0.78, 1.04), depth: depth,
      rotation: rng.float(0.08, 0.3), depthPhase: Math.PI
    });
    addRibbonPath(builder, {
      body: spec.body, key: "grammar-capsule-a", path: pathA, closed: true,
      skip: function (t) { return angleDistance(t * TAU, Math.PI * 1.73) < 0.15; },
      width: ribbon, samples: 108, across: 5, depthLayers: 2
    });
    addRibbonPath(builder, {
      body: spec.body, key: "grammar-capsule-b", path: pathB, closed: true,
      skip: function (t) { return angleDistance(t * TAU, Math.PI * 0.72) < 0.15; },
      width: ribbon * rng.float(0.76, 1.06), samples: 104, across: 5, depthLayers: 2
    });
    if (rng.chance(0.34)) {
      var pathC = ellipsePath({
        centerX: spec.originX + rng.float(-1.2, 1.2), centerY: spec.baseY,
        centerZ: centerZ * 1.02, radiusX: radiusX * 0.48, radiusZ: radiusZ * 0.6,
        depth: depth * 1.15, rotation: rng.float(-0.12, 0.12), depthPhase: Math.PI / 2
      });
      addRibbonPath(builder, {
        body: spec.body, key: "grammar-capsule-c", path: pathC, closed: true,
        skip: function (t) { return angleDistance(t * TAU, Math.PI * 1.5) < 0.18; },
        width: ribbon * 0.55, samples: 82, across: 4, depthLayers: 2
      });
    }
    addEntangledPier(builder, spec.originX - separation / 2, spec.baseY,
      Math.max(2, centerZ - radiusZ), ribbon * 0.75, "grammar-capsule-pier-a");
    addEntangledPier(builder, spec.originX + separation / 2, spec.baseY,
      Math.max(2, centerZ - radiusZ * 0.9), ribbon * 0.75, "grammar-capsule-pier-b");
    addBase(builder, spec, rng);
  }

  function addPiercedSpiralBody(builder, spec, rng) {
    var outer = spec.width * rng.float(0.34, 0.46);
    var centerZ = outer + rng.float(2.8, 5.2);
    var turns = rng.float(1.5, 2.8) * (0.7 + spec.madness * 0.5);
    var depth = spec.depth * rng.float(0.55, 1);
    var ribbon = Math.max(1.5, spec.width * rng.float(0.13, 0.22));
    var phase = rng.float(-0.4, 0.4);
    var spiral = function (t) {
      var theta = phase + t * TAU * turns;
      var radius = lerp(outer, outer * 0.18, t);
      return {
        x: spec.originX + Math.cos(theta) * radius,
        y: spec.baseY + Math.sin(theta * 0.72) * depth,
        z: centerZ + Math.sin(theta) * radius
      };
    };
    var spiralGap = rng.chance(0.5);
    addRibbonPath(builder, {
      body: spec.body, key: "grammar-spiral", path: spiral,
      skip: function (t) { return spiralGap && Math.abs(t - 0.78) < 0.025; },
      width: ribbon, samples: clamp(Math.round(96 + turns * 26), 110, 190), across: 5, depthLayers: 2
    });
    // El pasillo que la atraviesa: sin él la espiral pierde su razón de ser.
    var corridorHeight = centerZ + rng.float(-1.4, 1.8);
    var corridor = function (t) {
      return {
        x: spec.originX + lerp(-outer * 1.12, outer * 1.12, t),
        y: spec.baseY + Math.cos(t * Math.PI) * depth * 0.72,
        z: corridorHeight + Math.sin(t * Math.PI) * spec.madness * 2.1
      };
    };
    addRibbonPath(builder, {
      body: spec.body, key: "grammar-corridor", path: corridor,
      skip: function (t) { return !spiralGap && Math.abs(t - 0.5) < 0.055; },
      width: ribbon * rng.float(0.72, 1.05), samples: 80, across: 4, depthLayers: 2
    });
    addBase(builder, spec, rng);
  }

  function addHabitableSphereBody(builder, spec, rng) {
    var radius = Math.min(spec.width, spec.height) * rng.float(0.34, 0.46);
    var centerZ = radius + rng.float(2.5, 5);
    var depthScale = rng.float(0.42, 0.72);
    var portalLat = rng.float(-0.18, 0.14);
    var portalLon = rng.float(-0.12, 0.12);
    var portalWidth = rng.float(0.2, 0.32);
    var portalHeight = rng.float(0.26, 0.4);
    // Dentro de la gramática la esfera es bastante menor que la especie no
    // euclidiana, y con la retícula fija (21 × 38) los signos se encimaban
    // hasta volverla una mancha maciza. La resolución sigue al radio para que
    // el paso entre signos se mantenga cerca de uno y el cuerpo respire.
    var latitudes = clamp(Math.round(radius * 2.6), 12, 26);
    var longitudes = clamp(Math.round(radius * 3.2), 18, 44);
    for (var latIndex = 1; latIndex < latitudes; latIndex += 1) {
      var latitude = lerp(-Math.PI / 2, Math.PI / 2, latIndex / latitudes);
      for (var lonIndex = 0; lonIndex <= longitudes; lonIndex += 1) {
        var longitude = lerp(-Math.PI / 2, Math.PI / 2, lonIndex / longitudes);
        // El portal: lo que la vuelve habitable y no una esfera más.
        var inPortal = Math.pow((longitude - portalLon) / portalWidth, 2) +
          Math.pow((latitude - portalLat) / portalHeight, 2) < 1;
        if (inPortal) continue;
        var cosLat = Math.cos(latitude);
        builder.add(spec.body, lonIndex % 6 === 0 ? "lateral" : latIndex % 4 === 0 ? "techo" : "frente",
          spec.originX + radius * cosLat * Math.sin(longitude),
          spec.baseY + radius * cosLat * Math.cos(longitude) * depthScale,
          centerZ + radius * Math.sin(latitude),
          "grammar-sphere:" + latIndex + ":" + lonIndex);
      }
    }
    var room = ellipsePath({
      centerX: spec.originX + radius * Math.cos(portalLat) * Math.sin(portalLon),
      centerY: spec.baseY + radius * Math.cos(portalLat) * Math.cos(portalLon) * depthScale + 0.5,
      centerZ: centerZ + radius * Math.sin(portalLat),
      radiusX: radius * portalWidth * 0.78, radiusZ: radius * portalHeight * 0.78,
      depth: 0.55, rotation: 0, depthPhase: Math.PI / 2
    });
    addRibbonPath(builder, {
      body: spec.body, key: "grammar-sphere-room", path: room, closed: true,
      width: rng.float(0.65, 1.15), samples: 56, across: 3, depthLayers: 2
    });
    var supportTop = Math.max(2.2, centerZ - radius * 0.92);
    addEntangledPier(builder, spec.originX - radius * 0.34, spec.baseY, supportTop,
      rng.float(1.8, 3.2), "grammar-sphere-pier-l");
    addEntangledPier(builder, spec.originX + radius * 0.34, spec.baseY, supportTop,
      rng.float(1.8, 3.2), "grammar-sphere-pier-r");
    addBase(builder, spec, rng);
  }

  // MÖBIUS — una cinta cerrada con medio giro: una superficie de una sola cara.
  // Entra aquí por una razón que es de esta pieza y no de otra: todo el motor
  // reparte cada signo entre tres caras —frente, lateral y cubierta—, y esta es
  // la única forma del catálogo que niega esa premisa. Recorriéndola, la cara
  // que empezó siendo frente termina siendo lateral sin haber cruzado un borde.
  function addMobiusBody(builder, spec, rng) {
    var radiusX = spec.width * rng.float(0.3, 0.42);
    var radiusZ = spec.height * rng.float(0.26, 0.38);
    var centerZ = radiusZ + rng.float(2.4, 5);
    var band = Math.max(2.2, Math.min(spec.width, spec.height) * rng.float(0.16, 0.26));
    var tilt = rng.float(-0.3, 0.3) * (0.5 + spec.madness);
    var twists = rng.chance(0.24) ? 3 : 1;   // media vuelta, o tres medias
    var phase = rng.float(0, TAU);
    var loop = function (t) {
      var theta = t * TAU + phase;
      var localX = Math.cos(theta) * radiusX;
      var localZ = Math.sin(theta) * radiusZ;
      return {
        x: spec.originX + localX * Math.cos(tilt) - localZ * Math.sin(tilt),
        y: spec.baseY,
        z: centerZ + localX * Math.sin(tilt) + localZ * Math.cos(tilt)
      };
    };
    addRibbonPath(builder, {
      body: spec.body, key: "mobius", path: loop, closed: true,
      width: band, samples: 148, across: 6, depthLayers: 1,
      // El giro vive aquí: la sección transversal rota media vuelta a lo largo
      // del recorrido, así que el borde interior sale convertido en exterior.
      section: function (t, u, p, normalX, normalZ) {
        var spin = t * Math.PI * twists;
        return {
          x: normalX * u * Math.cos(spin),
          y: u * Math.sin(spin),
          z: normalZ * u * Math.cos(spin)
        };
      }
    });
    // El fuste va inline y no por addCrownMast, que escribe siempre con cuerpo
    // "cubierta": aquí los puntos deben pertenecer al cuerpo de la estructura.
    if (rng.chance(0.62)) {
      var stemWidth = Math.max(1.4, spec.width * rng.float(0.05, 0.09));
      var stemTop = Math.max(1, centerZ - radiusZ * 0.9);
      for (var sz = 0; sz <= stemTop; sz += 0.8) {
        for (var sx = -stemWidth / 2; sx <= stemWidth / 2 + 0.01; sx += 0.82) {
          builder.add(spec.body, "frente", spec.originX + sx, spec.baseY, sz,
            "mobius-stem:" + sz.toFixed(1) + ":" + sx.toFixed(1));
        }
        builder.add(spec.body, "lateral", spec.originX + stemWidth / 2, spec.baseY + 0.78, sz,
          "mobius-stem-side:" + sz.toFixed(1));
      }
    }
    addBase(builder, spec, rng);
  }

  // SERPIENTE — el plano plegado. Viene de «La serpiente de El Eco» (Mathias
  // Goeritz, 1953) y de la familia de zigzags que siguió: una lámina continua
  // doblada en picos y valles, parada de canto, cuyo borde superior dibuja una
  // silueta de montaña.
  //
  // Encaja en este motor mejor que ninguna otra forma por un accidente feliz:
  // la lámina alterna la orientación de sus paños en cada pliegue, y esa
  // alternancia es exactamente el reparto frente/lateral con que la pieza
  // reparte sus signos. Donde la escultura real muestra una cara iluminada y la
  // siguiente en sombra, aquí cambia el carácter. El pliegue no se simula: se
  // hereda.
  function addFoldedSerpent(builder, spec, rng) {
    var peaks = rng.int(3, 6);
    var segments = peaks * 2;
    var span = spec.width * rng.float(0.92, 1.18);
    var startX = spec.originX - span / 2;
    var sway = spec.depth * rng.float(0.55, 1.05);   // cuánto se abre en planta
    var nodes = [];
    for (var n = 0; n <= segments; n += 1) {
      var isPeak = n % 2 === 1;
      nodes.push({
        x: startX + (n / segments) * span,
        // Los pliegues alternan también en profundidad: eso es lo que hace que
        // un paño quede de frente y el siguiente de canto.
        y: spec.baseY + (isPeak ? -sway : sway) * rng.float(0.75, 1),
        z: isPeak
          ? spec.height * rng.float(0.52, 1)
          : spec.height * rng.float(0, 0.07)
      });
    }
    var step = 0.82;
    for (var s = 0; s < segments; s += 1) {
      var a = nodes[s], b = nodes[s + 1];
      var dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      var edge = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      var alongCount = Math.max(2, Math.round(edge / step));
      var ascending = dz >= 0;
      for (var i = 0; i <= alongCount; i += 1) {
        var u = i / alongCount;
        var topX = a.x + dx * u, topY = a.y + dy * u, topZ = a.z + dz * u;
        var downCount = Math.max(1, Math.round(topZ / step));
        for (var j = 0; j <= downCount; j += 1) {
          var v = downCount ? j / downCount : 0;
          // La franja superior es el canto de la lámina: su cubierta.
          var face = v < 0.09 ? "techo" : ascending ? "frente" : "lateral";
          builder.add(spec.body, face, topX, topY, topZ * (1 - v),
            "serpent:" + s + ":" + i + ":" + j);
        }
      }
    }
    return { peaks: peaks };
  }

  // La espiral escultórica trabaja en otro sistema (centro + radio) que el resto
  // de la gramática (origen + ancho). Este adaptador traduce el `spec` estándar
  // y le añade el zócalo, para que emita frente, lateral y cubierta como
  // cualquier otro cuerpo.
  function addSpiralBody(builder, spec, rng) {
    addSculpturalSpiral(builder, {
      body: spec.body,
      centerX: spec.originX, centerY: spec.baseY,
      radius: spec.width * rng.float(0.3, 0.44),
      baseZ: 0, height: spec.height,
      depth: spec.depth * rng.float(0.5, 0.85),
      width: Math.max(1.6, spec.width * rng.float(0.12, 0.2))
    }, rng);
    addBase(builder, spec, rng);
  }

  // ONDA ESTACIONARIA — una membrana rectangular que vibra en un modo propio
  // (patrón de Chladni): crestas y valles fijos, líneas nodales planas. Los
  // signos se montan sobre la superficie; frente, lateral y cubierta emergen de
  // la pendiente local, no de un volumen macizo.
  function addStandingWave(builder, spec, rng) {
    var Lx = spec.width;
    var Ly = spec.depth * rng.float(1.9, 2.6);         // huella grande de "tela"
    var amplitude = spec.height * rng.float(0.34, 0.52);
    var m = rng.pick([1, 2, 2, 3]);
    var n = rng.pick([1, 1, 2, 2, 3]);
    var nx = clamp(Math.round(Lx / 0.9), 16, 40);
    var ny = clamp(Math.round(Ly / 0.95), 12, 26);
    var body = spec.body || "membrana";
    // La tela ya no vive plana ni clavada al suelo: puede cabecear y girar,
    // orientándose libremente en el espacio.
    var pitch = rng.float(-0.62, 0.62);                // cabeceo sobre X
    var yaw = rng.float(-0.55, 0.55) * (0.6 + spec.madness); // giro sobre Z
    var cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    var cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    var corners = [];
    for (var iu = 0; iu <= nx; iu += 1) {
      var u = iu / nx;
      var su = Math.sin(m * Math.PI * u);
      var cu = Math.cos(m * Math.PI * u);
      for (var iv = 0; iv <= ny; iv += 1) {
        var v = iv / ny;
        var sv = Math.sin(n * Math.PI * v);
        var cv = Math.cos(n * Math.PI * v);
        var w = su * sv;                                // desplazamiento normal
        var gu = m * cu * sv;                           // pendiente en x
        var gv = n * su * cv;                           // pendiente en profundidad
        var face = Math.abs(w) > 0.62
          ? "techo"                                     // cresta o valle: casi plano
          : Math.abs(gu) >= Math.abs(gv) ? "frente" : "lateral";
        var lx = (u - 0.5) * Lx, ly = (v - 0.5) * Ly, lz = amplitude * w;
        var rx = lx * cosY - ly * sinY;                // giro sobre Z
        var ry = lx * sinY + ly * cosY;
        var wy = ry * cosP - lz * sinP;                // cabeceo sobre X
        var wz = ry * sinP + lz * cosP;
        builder.add(body, face, spec.originX + rx, spec.baseY + wy, wz, "wave:" + iu + ":" + iv);
        if ((iu === 0 || iu === nx) && iv === Math.round(ny / 2)) {
          corners.push({ x: spec.originX + rx, y: spec.baseY + wy, z: wz });
        }
      }
    }
    // Los mástiles son ahora una posibilidad, no una obligación, y cortos: la
    // membrana puede simplemente flotar.
    if (rng.chance(0.4)) {
      corners.forEach(function (anchor, index) {
        var drop = amplitude * rng.float(0.8, 1.5);
        for (var mz = 0; mz <= drop; mz += 0.82) {
          builder.add(body, "frente", anchor.x, anchor.y, anchor.z - mz, "wave-mast:" + index + ":" + mz.toFixed(1));
          builder.add(body, "lateral", anchor.x + 0.7, anchor.y + 0.7, anchor.z - mz, "wave-mast-side:" + index + ":" + mz.toFixed(1));
        }
      });
    }
  }

  // HIPAR — paraboloide hiperbólico: el cascarón de Félix Candela. Es la deuda
  // con los cascarones de Ciudad Universitaria —los Rayos Cósmicos de Candela
  // conviven con el Espacio Escultórico de Goeritz—, así que entra por el mismo
  // parentesco que la SERPIENTE. Una superficie anticlástica y doblemente
  // reglada: z = a·u·v. Dos familias de rectas la generan, y cada carácter se
  // asienta según la pendiente local —como en la onda estacionaria—, de modo
  // que frente, lateral y cubierta emergen de la curvatura, no de un macizo.
  // Alterna dos lecturas: la silla de montar (un solo paño) y el paraguas
  // (cuatro cuadrantes que suben del mástil central a las cuatro esquinas).
  function addHipar(builder, spec, rng) {
    var Lx = spec.width;
    var Ly = spec.depth * rng.float(1.7, 2.4);
    var amp = spec.height * rng.float(0.5, 0.72);
    var umbrella = rng.chance(0.45);                    // paraguas vs silla
    var nx = clamp(Math.round(Lx / 0.82), 18, 42);
    var ny = clamp(Math.round(Ly / 0.9), 14, 28);
    var body = spec.body || "hipar";
    var pitch = rng.float(-0.32, 0.32);                 // cabeceo sobre X
    var yaw = rng.float(-0.42, 0.42) * (0.5 + spec.madness);
    var cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    var cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    var edges = [];
    for (var iu = 0; iu <= nx; iu += 1) {
      var u = iu / nx * 2 - 1;                          // [-1, 1]
      for (var iv = 0; iv <= ny; iv += 1) {
        var v = iv / ny * 2 - 1;
        // El paraguas pliega cada cuadrante: |u|,|v| remapeados a [-1,1] hacen
        // que las cuatro esquinas suban y el centro (el mástil) baje.
        var uu = umbrella ? Math.abs(u) * 2 - 1 : u;
        var vv = umbrella ? Math.abs(v) * 2 - 1 : v;
        var w = uu * vv;                                // silla: z ∝ u·v
        var gu = vv, gv = uu;                           // pendientes ∂z/∂u, ∂z/∂v
        var face = Math.abs(w) < 0.16
          ? "techo"                                     // cerca de una recta generatriz
          : Math.abs(gu) >= Math.abs(gv) ? "frente" : "lateral";
        var lx = u * Lx * 0.5, ly = v * Ly * 0.5, lz = amp * w;
        var rx = lx * cosY - ly * sinY;
        var ry = lx * sinY + ly * cosY;
        var wy = ry * cosP - lz * sinP;
        var wz = ry * sinP + lz * cosP;
        builder.add(body, face, spec.originX + rx, spec.baseY + wy, wz + amp, "hipar:" + iu + ":" + iv);
        if ((iu === 0 || iu === nx) && (iv === 0 || iv === ny)) {
          edges.push({ x: spec.originX + rx, y: spec.baseY + wy, z: wz + amp });
        }
      }
    }
    // El mástil de Candela: una columna central de la que cuelga —o sobre la que
    // se apoya— el cascarón. Frecuente pero no obligatorio.
    if (rng.chance(0.72)) {
      var mastTop = amp * (umbrella ? 0.55 : 1);
      for (var mz = 0; mz <= mastTop; mz += 0.8) {
        builder.add(body, "frente", spec.originX, spec.baseY, mz, "hipar-mast:" + mz.toFixed(1));
        builder.add(body, "lateral", spec.originX + 0.7, spec.baseY + 0.7, mz, "hipar-mast-side:" + mz.toFixed(1));
      }
    }
    if (!spec.noBase) addBase(builder, spec, rng);
  }

  // Un lazo escultórico autónomo: el mismo toro tejido del LAZO HABITABLE, pero
  // reducido a un cuerpo que se ensambla con otros (esferas, cubos) para que los
  // loops dejen de vivir sólo en la especie entrelazada.
  function addSculpturalLoop(builder, spec, rng) {
    var radiusX = spec.width * 0.5;
    var radiusZ = spec.height * 0.42;
    var centerZ = radiusZ + rng.float(1.5, 3.5);
    var rotation = rng.float(-0.14, 0.14);
    var waveCount = rng.pick([1, 2, 2, 3]);
    var phase = rng.float(-0.2, 0.2);
    var depth = spec.depth;
    var loop = function (t) {
      var theta = t * TAU + phase;
      var localX = Math.sin(theta) * radiusX;
      var localZ = Math.sin(theta * waveCount) * radiusZ;
      return {
        x: spec.originX + localX * Math.cos(rotation) - localZ * Math.sin(rotation),
        y: Math.cos(theta) * depth,
        z: centerZ + localX * Math.sin(rotation) + localZ * Math.cos(rotation)
      };
    };
    addRibbonPath(builder, {
      body: spec.body || "lazo", key: "sculptural-loop", path: loop, closed: true,
      width: spec.loopWidth || spec.width * 0.14, samples: 132, across: 6, depthLayers: 2
    });
    return { law: waveCount === 1 ? "ÓRBITA" : waveCount === 2 ? "OCHO" : "TRIPLE PLIEGUE", centerZ: centerZ, radiusZ: radiusZ };
  }

  // El NUDO DE LOSAS vivía sólo como especie entrelazada, en coordenadas
  // globales. Esta versión acepta el mismo `spec` que las demás estructuras de
  // la gramática, así que puede ser el cuerpo de una genealogía —o el capitel
  // de un arco— igual que una esfera o una pirámide.
  function addKnotBody(builder, spec, rng) {
    var scale = Math.min(spec.width, spec.height) * rng.float(0.2, 0.28);
    var centerZ = spec.baseY * 0 + scale * 2.55 + rng.float(1.5, 3.5);
    var depth = spec.depth * rng.float(0.7, 1.1);
    var width = Math.max(1.6, scale * rng.float(0.6, 0.95));
    var phase = rng.float(-0.18, 0.18);
    var lobes = rng.pick([2, 2, 3]);
    var knot = function (t) {
      var theta = t * TAU + phase;
      var radius = scale * (2 + 0.5 * Math.cos(theta * 3));
      return {
        x: spec.originX + radius * Math.cos(theta * lobes),
        y: spec.baseY + depth * Math.sin(theta * 3),
        z: centerZ + radius * Math.sin(theta * lobes)
      };
    };
    var gapCenters = [0.17, 0.49, 0.82];
    addRibbonPath(builder, {
      body: spec.body || "nudo", key: "grammar-knot", path: knot, closed: true,
      skip: function (t) {
        return gapCenters.some(function (center, index) {
          return index % 2 === (spec.side === "left" ? 0 : 1) && Math.abs(t - center) < 0.02;
        });
      },
      width: width, samples: 168, across: 5, depthLayers: 2
    });
    return { centerZ: centerZ, scale: scale };
  }

  function makeSculpturalSurface(traits, interpretation, rng) {
    var builder = new SurfaceBuilder();
    var assembly = traits.sculpturalAssembly;
    var modules = [];
    var relation = "APILAMIENTO";
    var side = traits.direction < 0 ? "left" : "right";
    var madness = traits.madness;

    if (assembly === "ESFERA MONUMENTAL") {
      addSphere(builder, Object.assign(
        sculpturalSpec(
          "esfera-monumental", rng.float(-1.5, 1.5), rng.float(-0.7, 0.7),
          rng.float(27, 36), rng.float(27, 36), rng.float(9, 14), madness, side
        ),
        { solid: true, detail: true, noBase: true }
      ), rng.fork("esfera-monumental"));
      modules = ["ESFERA"];
      relation = "CUERPO AUTÓNOMO";
    } else if (assembly === "ESFERA SOBRE HÉLICE") {
      addHelicalSlabTower(builder,
        sculpturalSpec("hélice", 0, 0, rng.float(11, 15), rng.float(15, 19), rng.float(4, 6), madness, side),
        rng.fork("hélice-inferior"));
      addSphere(offsetBuilder(builder, rng.float(16.2, 18.4)),
        sculpturalSpec("esfera", rng.float(-1.2, 1.2), 0, rng.float(10, 14), rng.float(10, 14), rng.float(4, 6), madness, side),
        rng.fork("esfera-superior"));
      modules = ["TORRE HELICOIDAL", "ESFERA"];
      relation = "ESFERA SOBRE HÉLICE";
    } else if (assembly === "HÉLICE SOBRE ESFERA") {
      addSphere(builder,
        sculpturalSpec("esfera", 0, 0, rng.float(12, 16), rng.float(12, 16), rng.float(4.5, 7), madness, side),
        rng.fork("esfera-inferior"));
      addHelicalSlabTower(offsetBuilder(builder, rng.float(12.2, 15.2)),
        sculpturalSpec("hélice", rng.float(-1, 1), 0, rng.float(9, 13), rng.float(15, 21), rng.float(3.5, 5.5), madness, side),
        rng.fork("hélice-superior"));
      modules = ["ESFERA", "TORRE HELICOIDAL"];
      relation = "HÉLICE SOBRE ESFERA";
    } else if (assembly === "OBELISCO ROTO") {
      addBrokenObelisk(builder,
        sculpturalSpec("obelisco", 0, 0, rng.float(14, 19), rng.float(28, 37), rng.float(5, 8), madness, side),
        rng.fork("obelisco-roto"));
      modules = ["PIRÁMIDE", "OBELISCO INVERTIDO"];
      relation = "EQUILIBRIO DE VÉRTICES";
    } else if (assembly === "PIRÁMIDES INTERPENETRADAS") {
      addPyramid(builder, Object.assign(
        sculpturalSpec("pirámide-a", rng.float(-2.5, -0.5), 0, rng.float(16, 21), rng.float(16, 22), rng.float(5, 8), madness, side),
        { noBase: true }
      ), rng.fork("pirámide-a"));
      addPyramid(offsetBuilder(builder, rng.float(6.5, 10.5)), Object.assign(
        sculpturalSpec("pirámide-b", rng.float(0.5, 3.2), rng.float(0.3, 1.4), rng.float(13, 18), rng.float(15, 21), rng.float(4.5, 7), madness, side),
        { inverted: true, noBase: true }
      ), rng.fork("pirámide-b"));
      modules = ["PIRÁMIDE", "PIRÁMIDE INVERTIDA"];
      relation = "INTERPENETRACIÓN";
    } else if (assembly === "CUBOS EN ESPIRAL") {
      addNestedCubes(builder,
        sculpturalSpec("cubos", 0, 0, rng.float(12, 16), rng.float(21, 28), rng.float(5, 8), madness, side),
        rng.fork("cubos"));
      addSculpturalSpiral(builder, {
        body: "espiral", centerX: 0, centerY: 1.2, baseZ: 1,
        radius: rng.float(8, 11), depth: rng.float(3, 5),
        height: rng.float(22, 29), width: rng.float(1.4, 2.6)
      }, rng.fork("espiral"));
      modules = ["CUBOS ENCAJADOS", "ESPIRAL"];
      relation = "ÓRBITA ABIERTA";
    } else if (assembly === "ARCO CON CUERPO SUSPENDIDO") {
      addArchedMass(builder,
        sculpturalSpec("arco", 0, 0, rng.float(19, 25), rng.float(20, 27), rng.float(5, 8), madness, side),
        rng.fork("arco"));
      addSphere(offsetBuilder(builder, rng.float(6, 9)),
        sculpturalSpec("cuerpo-suspendido", rng.float(-1.4, 1.4), -1,
          rng.float(7, 10), rng.float(7, 10), rng.float(3, 4.5), madness, side),
        rng.fork("cuerpo-suspendido"));
      modules = ["ARCO", "ESFERA"];
      relation = "SUSPENSIÓN EN EL VANO";
    } else if (assembly === "ONDA ESTACIONARIA") {
      addStandingWave(builder,
        sculpturalSpec("membrana", rng.float(-1.5, 1.5), 0,
          rng.float(32, 44), rng.float(28, 38), rng.float(9, 14), madness, side),
        rng.fork("onda-estacionaria"));
      modules = ["MEMBRANA"];
      relation = "ONDA ESTACIONARIA";
    } else if (assembly === "LAZO ATRAVESADO") {
      var loopInfo = addSculpturalLoop(builder,
        sculpturalSpec("lazo", 0, 0, rng.float(22, 28), rng.float(20, 26), rng.float(4.5, 6.5), madness, side),
        rng.fork("lazo-atravesado"));
      var bodyHeight = rng.float(7.5, 10.5);
      addSphere(offsetBuilder(builder, loopInfo.centerZ - bodyHeight * 0.52),
        sculpturalSpec("cuerpo", rng.float(-1.4, 1.4), 0,
          rng.float(7.5, 10.5), bodyHeight, rng.float(3.5, 5.5), madness, side),
        rng.fork("cuerpo-en-lazo"));
      modules = ["LAZO", "ESFERA"];
      relation = "LAZO ATRAVESADO · " + loopInfo.law;
    } else if (assembly === "PARABOLOIDE MONUMENTAL") {
      // La parabólica dejaba de existir cuando no había edificio que coronar.
      // Aquí es la pieza entera: un solo paraboloide enorme, sin mástil ni
      // suelo, inclinado en el aire y ocupando todo el cuadro.
      addParabolicAntennaCrown(builder, 0, rng.float(34, 46), 0,
        traits, rng.fork("paraboloide-monumental"), { monumental: true });
      modules = ["PARABOLOIDE"];
      relation = "CUERPO AUTÓNOMO";
    } else if (assembly === "HIPAR MONUMENTAL") {
      // El cascarón de Candela como pieza entera: un solo hipar enorme, sin
      // suelo, inclinado en el aire y ocupando todo el cuadro —el reverso
      // reglado y anticlástico del paraboloide monumental—.
      addHipar(builder,
        Object.assign(
          sculpturalSpec("hipar", rng.float(-1.5, 1.5), 0,
            rng.float(34, 46), rng.float(26, 36), rng.float(11, 16), madness, side),
          { noBase: true }
        ),
        rng.fork("hipar-monumental"));
      modules = ["HIPAR"];
      relation = "CASCARÓN AUTÓNOMO";
    } else {
      addPyramid(builder,
        sculpturalSpec("base", 0, 0, rng.float(15, 20), rng.float(12, 16), rng.float(5, 7), madness, side),
        rng.fork("base"));
      addSphere(offsetBuilder(builder, rng.float(10.5, 13.5)),
        sculpturalSpec("centro", rng.float(-1.5, 1.5), 0,
          rng.float(8, 11), rng.float(8, 11), rng.float(3, 5), madness, side),
        rng.fork("centro"));
      addNestedCubes(offsetBuilder(builder, rng.float(19, 23)),
        sculpturalSpec("cubo", rng.float(-1.8, 1.8), 0,
          rng.float(7, 10), rng.float(9, 13), rng.float(3, 5), madness, side),
        rng.fork("cubo"));
      modules = ["PIRÁMIDE", "ESFERA", "CUBO"];
      relation = "EQUILIBRIO DE TRES CUERPOS";
    }

    var bounds = surfaceBounds(builder.points);
    var centerX = (bounds.minX + bounds.maxX) / 2;
    var lean = rng.float(-0.055, 0.055) * (0.5 + madness);
    builder.points.forEach(function (point) {
      point.x += (point.z - bounds.minZ) * lean;
      if (madness > 0.72) point.y += Math.sin((point.z - bounds.minZ) * 0.22) * madness * 0.32;
    });
    bounds = surfaceBounds(builder.points);
    var groundChance = assembly === "ESFERA MONUMENTAL" || assembly === "ONDA ESTACIONARIA" ||
      assembly === "PARABOLOIDE MONUMENTAL" || assembly === "HIPAR MONUMENTAL" ? 0 : 0.72;
    var grounded = groundChance > 0 && rng.chance(groundChance);
    if (grounded) {
      addEntangledGround(builder,
        Math.max(18, (bounds.maxX - bounds.minX) * rng.float(1.08, 1.3)),
        rng.fork("espacio-base"));
    }
    return {
      surface: builder.points,
      geometry: {
        kind: "ENSAMBLAJE ESCULTÓRICO",
        assembly: assembly,
        modules: modules,
        relation: relation,
        bodies: modules.length,
        grounded: grounded,
        authenticVoid: Math.max(1, modules.length - 1),
        interpretation: interpretation.nombres.slice()
      }
    };
  }

  function carveGrammarVoid(builder, gene, rng) {
    var bounds = surfaceBounds(builder.points);
    var centerX = (bounds.minX + bounds.maxX) / 2;
    var width = Math.max(1, bounds.maxX - bounds.minX);
    var height = Math.max(1, bounds.maxZ - bounds.minZ);
    var before = builder.points.length;
    var radius = width * rng.float(0.1, 0.19);
    var portalHeight = height * rng.float(0.22, 0.42);
    var slope = rng.float(-0.28, 0.28);
    builder.points = builder.points.filter(function (point) {
      var localX = point.x - centerX;
      var localZ = point.z - bounds.minZ;
      if (gene === "ARCO") {
        var crown = portalHeight * 0.46 + Math.sqrt(Math.max(0, radius * radius - localX * localX));
        return !(Math.abs(localX) < radius && localZ < crown);
      }
      if (gene === "TÚNEL") return !(Math.abs(localX) < width * 0.14 && localZ < height * 0.48);
      if (gene === "PATIO") return !(Math.abs(localX) < width * 0.2 && localZ < height * 0.62);
      if (gene === "GRIETA") return !(Math.abs(localX - (localZ - height * 0.35) * slope) < width * 0.035 && localZ < height * 0.9);
      if (gene === "PORTAL") return !(Math.abs(localX) < width * 0.11 && localZ < portalHeight);
      return !(Math.pow(localX / (width * 0.17), 2) + Math.pow((localZ - height * 0.48) / (height * 0.22), 2) < 1);
    });
    return before - builder.points.length;
  }

  function addCrownMast(builder, spec) {
    var distance = Math.max(0.8, spec.topZ - spec.baseZ);
    var levels = Math.max(2, Math.ceil(distance / 0.72));
    var width = spec.width || 1.2;
    var bend = spec.bend || 0;
    for (var level = 0; level <= levels; level += 1) {
      var t = level / levels;
      var x = lerp(spec.baseX, spec.topX, t) + Math.sin(t * Math.PI) * bend;
      var y = lerp(spec.baseY || 0, spec.topY || 0, t);
      var z = lerp(spec.baseZ, spec.topZ, t);
      for (var stripe = -width / 2; stripe <= width / 2 + 0.01; stripe += 0.72) {
        builder.add("cubierta", "frente", x + stripe, y, z,
          spec.key + ":front:" + level + ":" + stripe.toFixed(1));
      }
      builder.add("cubierta", "lateral", x + width / 2, y + 0.76, z,
        spec.key + ":side:" + level);
      if (level % 4 === 0 || level === levels) {
        builder.add("cubierta", "techo", x, y + 0.38, z + width * 0.22,
          spec.key + ":top:" + level);
      }
    }
  }

  function addInverseDomeCrown(builder, centerX, width, top, traits, rng) {
    var radiusX = width * rng.float(0.29, 0.38);
    var radiusY = width * rng.float(0.1, 0.17);
    var fall = width * rng.float(0.16, 0.24);
    var gap = width * rng.float(0.025, 0.07);
    var rimZ = top + gap + fall;
    var rings = rng.int(9, 14);
    var samples = rng.int(52, 68);
    var innerRatio = rng.float(0.08, 0.18);
    for (var ringIndex = 0; ringIndex <= rings; ringIndex += 1) {
      var ratio = lerp(innerRatio, 1, ringIndex / rings);
      var z = rimZ - fall * (1 - ratio * ratio);
      for (var sample = 0; sample < samples; sample += 1) {
        var theta = sample / samples * TAU;
        builder.add("cubierta",
          ringIndex % 3 === 0 ? "techo" : sample % 7 === 0 ? "lateral" : "frente",
          centerX + Math.cos(theta) * radiusX * ratio,
          Math.sin(theta) * radiusY * ratio,
          z,
          "inverse-crown:" + ringIndex + ":" + sample);
      }
    }

    var supportRoll = rng.next();
    if (supportRoll < 0.38) {
      addCrownMast(builder, {
        key: "inverse-crown-central", baseX: centerX, topX: centerX,
        baseZ: top, topZ: rimZ - fall + gap * 0.2,
        width: width * rng.float(0.035, 0.06)
      });
      return "PUNTO CENTRAL";
    }
    if (supportRoll < 0.68) {
      var side = traits.direction;
      var ratio = rng.float(0.48, 0.7);
      addCrownMast(builder, {
        key: "inverse-crown-offset", baseX: centerX - side * width * rng.float(0.06, 0.18),
        topX: centerX + side * radiusX * ratio,
        baseZ: top, topZ: rimZ - fall * (1 - ratio * ratio),
        width: width * rng.float(0.03, 0.052), bend: side * width * 0.025
      });
      return side < 0 ? "MÁSTIL IZQUIERDO" : "MÁSTIL DERECHO";
    }
    if (supportRoll < 0.9) {
      for (var sideIndex = -1; sideIndex <= 1; sideIndex += 2) {
        var supportRatio = 0.72;
        addCrownMast(builder, {
          key: "inverse-crown-tensor-" + sideIndex,
          baseX: centerX + sideIndex * width * 0.12,
          topX: centerX + sideIndex * radiusX * supportRatio,
          baseZ: top,
          topZ: rimZ - fall * (1 - supportRatio * supportRatio),
          width: width * 0.025
        });
      }
      return "DOS TENSORES";
    }
    return "GRAVEDAD INVERTIDA";
  }

  function addInvertedCrescentCrown(builder, centerX, width, top, traits, rng) {
    var radiusX = width * rng.float(0.28, 0.39);
    var radiusZ = width * rng.float(0.2, 0.31);
    var baseZ = top + width * rng.float(0.025, 0.075);
    // Segundo adelgazamiento: el arco seguía pesando demasiado. Tres bandas en
    // vez de cuatro, espesor y profundidad menores y menos muestras — la media
    // luna vuelve a ser una línea curva, no una tajada maciza.
    var thickness = width * rng.float(0.034, 0.058);
    var depth = width * rng.float(0.035, 0.075);
    var samples = rng.int(44, 60);
    var stripes = 3;
    // La media luna se dibujaba siempre como el mismo arco ∩ mirando hacia
    // arriba. Ahora la semilla la voltea y la gira: cuenco (∪), de costado
    // (C / Ɔ) o giro libre. El apoyo se decide según la orientación para no
    // clavar cuernos que apuntarían al vacío.
    var orientRoll = rng.next();
    var orient, orientName;
    if (orientRoll < 0.46) { orient = 0; orientName = ""; }
    else if (orientRoll < 0.66) { orient = Math.PI; orientName = " / CUENCO"; }
    else if (orientRoll < 0.79) { orient = Math.PI / 2 * traits.direction; orientName = " / DE COSTADO"; }
    else if (orientRoll < 0.9) { orient = -Math.PI / 2 * traits.direction; orientName = " / DE COSTADO"; }
    else { orient = rng.float(-Math.PI, Math.PI); orientName = " / GIRO LIBRE"; }
    var rotation = orient + rng.float(-0.12, 0.12) * (0.4 + traits.madness);
    var upright = orient === 0;
    for (var sample = 0; sample <= samples; sample += 1) {
      var t = sample / samples;
      var theta = t * Math.PI;
      var taper = 0.14 + Math.pow(Math.sin(theta), 0.62) * 0.86;
      for (var stripe = 0; stripe < stripes; stripe += 1) {
        var u = (stripe / (stripes - 1) - 0.5) * thickness * taper;
        var localX = Math.cos(theta) * (radiusX + u);
        var localZ = Math.sin(theta) * (radiusZ + u);
        var x = centerX + localX * Math.cos(rotation) - localZ * Math.sin(rotation);
        var z = baseZ + localX * Math.sin(rotation) + localZ * Math.cos(rotation);
        for (var layer = 0; layer < 2; layer += 1) {
          builder.add("cubierta", layer ? "lateral" : stripe % 4 === 0 ? "techo" : "frente",
            x, Math.sin(theta) * depth + layer * 0.72, z,
            "inverted-crescent:" + sample + ":" + stripe + ":" + layer);
        }
      }
    }

    if (upright) {
      var supportRoll = rng.next();
      var side = supportRoll < 0.36 ? -1 : supportRoll < 0.72 ? 1 : traits.direction;
      if (supportRoll < 0.72) {
        addCrownMast(builder, {
          key: "crescent-horn-" + side,
          baseX: centerX + side * width * rng.float(0.04, 0.16),
          topX: centerX + side * radiusX * 0.9,
          baseZ: top, topZ: baseZ + radiusZ * 0.28,
          width: width * rng.float(0.028, 0.05),
          bend: -side * width * rng.float(0.015, 0.045)
        });
        return (side < 0 ? "CUERNO IZQUIERDO" : "CUERNO DERECHO") + orientName;
      }
      if (supportRoll < 0.92) {
        addCrownMast(builder, {
          key: "crescent-eccentric",
          baseX: centerX - side * width * 0.12,
          topX: centerX + side * radiusX * 0.18,
          baseZ: top, topZ: baseZ + radiusZ * 0.58,
          width: width * 0.04, bend: side * width * 0.04
        });
        return "MÁSTIL EXCÉNTRICO" + orientName;
      }
      return "MEDIA LUNA FLOTANTE" + orientName;
    }
    // Volteada o de costado: un mástil central corto la sostiene como copa, o
    // se deja flotar.
    if (rng.chance(0.5)) {
      addCrownMast(builder, {
        key: "crescent-turned-stem",
        baseX: centerX, topX: centerX,
        baseZ: top, topZ: baseZ + radiusZ * 0.2,
        width: width * rng.float(0.03, 0.05)
      });
      return "MÁSTIL CENTRAL" + orientName;
    }
    return "MEDIA LUNA FLOTANTE" + orientName;
  }

  function addParabolicAntennaCrown(builder, centerX, width, top, traits, rng, options) {
    var side = traits.direction;
    // A veces el paraboloide crece hasta volverse monumental: desborda el ancho
    // del edificio y recibe más anillos para no perder densidad. Como pieza
    // autónoma (`options.monumental`) siempre lo es: ocupa el cuadro solo.
    var monumental = options && options.monumental ? true : rng.chance(0.45);
    var dishRadius = width * (monumental ? rng.float(0.52, 0.82) : rng.float(0.2, 0.3));
    var dishDepth = dishRadius * rng.float(0.28, 0.46);
    var tilt = rng.float(0.32, 0.68);
    var axisX = Math.cos(tilt) * side;
    var axisZ = Math.sin(tilt);
    var normalX = -axisZ;
    var normalZ = axisX;
    var vertexX = centerX - side * width * rng.float(0.02, 0.12);
    var vertexZ = top + width * rng.float(0.04, 0.12);
    var rings = monumental ? rng.int(17, 23) : rng.int(9, 13);
    var samples = monumental ? rng.int(74, 96) : rng.int(48, 62);
    var dishYScale = rng.float(0.48, 0.62);
    for (var ringIndex = 0; ringIndex <= rings; ringIndex += 1) {
      var ratio = ringIndex / rings;
      var radial = dishRadius * ratio;
      var sag = dishDepth * ratio * ratio;
      for (var sample = 0; sample < samples; sample += 1) {
        var theta = sample / samples * TAU;
        var cross = Math.cos(theta) * radial;
        builder.add("cubierta",
          ringIndex % 3 === 0 ? "techo" : sample % 6 === 0 ? "lateral" : "frente",
          vertexX + axisX * sag + normalX * cross,
          Math.sin(theta) * radial * dishYScale,
          vertexZ + axisZ * sag + normalZ * cross,
          "parabolic-dish:" + ringIndex + ":" + sample);
      }
    }

    return (monumental ? "PARABOLOIDE MONUMENTAL / " : "PARABOLOIDE LIBRE / ") +
      (side < 0 ? "IZQUIERDA" : "DERECHA");
  }

  function addVoluteCrown(builder, centerX, width, top, traits, rng) {
    // Voluta: un solo trazo en espiral —el rollo jónico, el caracol— que se
    // enrosca sobre el edificio. Al ser una línea continua y delgada se lee
    // clara en solitario y no compite con la masa cuando corona otra genealogía:
    // apenas dibuja su giro en el aire. Es lo contrario del anillo macizo.
    var side = rng.chance(0.5) ? traits.direction : -traits.direction;
    var turns = rng.float(1.7, 2.7);
    var maxR = width * rng.float(0.2, 0.32);
    var minR = maxR * rng.float(0.1, 0.18);
    var tilt = rng.float(-0.22, 0.22) * (0.5 + traits.madness);
    var depthAmp = rng.float(1.2, 3);
    var eyeX = centerX + side * maxR * rng.float(0.05, 0.22);
    var centerZ = top + maxR * rng.float(0.72, 1.08);
    var volute = function (t) {
      var theta = t * TAU * turns * side;
      var r = maxR * Math.pow(minR / maxR, t);
      var lx = Math.cos(theta) * r;
      var lz = Math.sin(theta) * r;
      return {
        x: eyeX + lx * Math.cos(tilt) - lz * Math.sin(tilt),
        y: Math.sin(theta) * depthAmp * (0.35 + t * 0.65),
        z: centerZ + lx * Math.sin(tilt) + lz * Math.cos(tilt)
      };
    };
    var voluteSamples = clamp(Math.round(turns * 58), 110, 180);
    addRibbonPath(builder, {
      body: "cubierta", key: "volute", path: volute,
      width: rng.float(1.2, 2), samples: voluteSamples, across: 3, depthLayers: 1
    });
    var mouth = volute(0);
    var stemRoll = rng.next();
    if (stemRoll < 0.7) {
      addCrownMast(builder, {
        key: "volute-stem",
        baseX: centerX + side * width * rng.float(0.02, 0.12),
        topX: mouth.x, baseZ: top, topZ: mouth.z,
        width: width * rng.float(0.03, 0.05),
        bend: -side * width * rng.float(0.02, 0.06)
      });
      return side < 0 ? "VOLUTA IZQUIERDA" : "VOLUTA DERECHA";
    }
    if (stemRoll < 0.86) {
      var mirror = function (t) {
        var p = volute(t);
        return { x: 2 * centerX - p.x, y: p.y, z: p.z };
      };
      addRibbonPath(builder, {
        body: "cubierta", key: "volute-mirror", path: mirror,
        width: rng.float(1.2, 2), samples: voluteSamples, across: 3, depthLayers: 1
      });
      return "VOLUTA DOBLE";
    }
    return "VOLUTA FLOTANTE";
  }

  function addGrammarCrown(builder, gene, bounds, traits, rng) {
    var centerX = (bounds.minX + bounds.maxX) / 2;
    var width = bounds.maxX - bounds.minX;
    var top = bounds.maxZ;
    if (gene === "NINGUNA") {
      return "SIN CUBIERTA";
    } else if (gene === "ANILLO SUPERIOR") {
      var radiusX = width * rng.float(0.27, 0.36);
      var radiusZ = width * rng.float(0.15, 0.22);
      var gap = rng.float(0.55, 1.25);
      var centerZ = top + radiusZ + gap;
      var upperRing = ellipsePath({
        centerX: centerX, centerY: 0, centerZ: centerZ,
        radiusX: radiusX, radiusZ: radiusZ,
        depth: rng.float(2.2, 4.2), depthPhase: Math.PI / 2
      });
      // El anillo se leía como un disco macizo: 6 bandas × 3 profundidades × 96
      // muestras llenaban por completo la argolla. Se adelgaza el trazo —menos
      // bandas, una sola profundidad y un muestreo proporcional al perímetro—
      // para que vuelva a dibujarse el hueco del anillo, como en la cúpula y el
      // halo. Ramanujan aproxima el perímetro de la elipse para mantener el
      // paso entre signos cercano a uno.
      var ringPerimeter = Math.PI * (3 * (radiusX + radiusZ) -
        Math.sqrt((3 * radiusX + radiusZ) * (radiusX + 3 * radiusZ)));
      addRibbonPath(builder, {
        body: "cubierta", key: "upper-ring", path: upperRing, closed: true,
        width: rng.float(1.6, 2.6), samples: clamp(Math.round(ringPerimeter), 60, 108),
        across: 3, depthLayers: 2
      });
      var ringSupportRoll = rng.next();
      if (ringSupportRoll < 0.28) {
        var twinRatio = rng.float(0.58, 0.72);
        var twinTop = centerZ - radiusZ * Math.sqrt(1 - twinRatio * twinRatio);
        for (var ringSide = -1; ringSide <= 1; ringSide += 2) {
          addCrownMast(builder, {
            key: "upper-ring-twin-" + ringSide,
            baseX: centerX + ringSide * radiusX * twinRatio,
            topX: centerX + ringSide * radiusX * twinRatio,
            baseZ: top, topZ: twinTop,
            width: width * rng.float(0.028, 0.045)
          });
        }
        return "DOS PILARES";
      }
      if (ringSupportRoll < 0.53) {
        addCrownMast(builder, {
          key: "upper-ring-central",
          baseX: centerX, topX: centerX,
          baseZ: top, topZ: centerZ - radiusZ,
          width: width * rng.float(0.035, 0.06)
        });
        return "MÁSTIL CENTRAL";
      }
      if (ringSupportRoll < 0.82) {
        var offsetSide = traits.direction;
        var offsetRatio = rng.float(0.5, 0.78);
        var offsetTop = centerZ - radiusZ * Math.sqrt(1 - offsetRatio * offsetRatio);
        addCrownMast(builder, {
          key: "upper-ring-offset",
          baseX: centerX - offsetSide * width * rng.float(0.02, 0.14),
          topX: centerX + offsetSide * radiusX * offsetRatio,
          baseZ: top, topZ: offsetTop,
          width: width * rng.float(0.03, 0.05),
          bend: offsetSide * width * rng.float(0.015, 0.04)
        });
        return offsetSide < 0 ? "MÁSTIL IZQUIERDO" : "MÁSTIL DERECHO";
      }
      for (var tripod = -1; tripod <= 1; tripod += 1) {
        addCrownMast(builder, {
          key: "upper-ring-tripod-" + tripod,
          baseX: centerX + tripod * width * 0.16,
          topX: centerX + tripod * radiusX * 0.22,
          baseY: Math.abs(tripod) * 0.45,
          topY: tripod * 0.34,
          baseZ: top, topZ: centerZ - radiusZ * 0.88,
          width: width * 0.022, bend: -tripod * width * 0.025
        });
      }
      return "TRÍPODE OBLICUO";
    } else if (gene === "VOLADIZO") {
      var cantilever = width * rng.float(0.16, 0.34) * traits.direction;
      for (var row = 0; row < rng.int(2, 4); row += 1) {
        for (var x = bounds.minX - Math.max(0, -cantilever); x <= bounds.maxX + Math.max(0, cantilever); x += 0.8) {
          builder.add("cubierta", row ? "techo" : "frente", x + cantilever * 0.36, row * 0.75, top + row * 0.55,
            "crown-cantilever:" + row + ":" + x.toFixed(1));
        }
      }
      return traits.direction < 0 ? "VOLADIZO IZQUIERDO" : "VOLADIZO DERECHO";
    } else if (gene === "CÚPULA") {
      var domePath = function (t) {
        var theta = t * Math.PI;
        return { x: centerX + Math.cos(theta) * width * 0.3, y: 0, z: top + Math.sin(theta) * width * 0.23 };
      };
      addRibbonPath(builder, {
        body: "cubierta", key: "grammar-dome", path: domePath,
        width: rng.float(1.4, 2.6), samples: 68, across: 4, depthLayers: 2
      });
      var supportDrop = Math.max(2.8, (bounds.maxZ - bounds.minZ) * 0.18);
      for (var domeSide = -1; domeSide <= 1; domeSide += 2) {
        var supportX = centerX + domeSide * width * 0.3;
        for (var supportZ = top - supportDrop; supportZ <= top; supportZ += 0.76) {
          builder.add("cubierta", domeSide < 0 ? "frente" : "lateral", supportX, 0, supportZ,
            "crown-dome-support:" + domeSide + ":" + supportZ.toFixed(1));
        }
      }
      return "DOS APOYOS";
    } else if (gene === "CÚPULA INVERSA") {
      return addInverseDomeCrown(builder, centerX, width, top, traits, rng);
    } else if (gene === "MEDIA LUNA INVERTIDA") {
      return addInvertedCrescentCrown(builder, centerX, width, top, traits, rng);
    } else if (gene === "ANTENA PARABÓLICA") {
      return addParabolicAntennaCrown(builder, centerX, width, top, traits, rng);
    } else if (gene === "BLOQUE DESPLAZADO") {
      var shift = width * rng.float(0.1, 0.28) * traits.direction;
      for (var z = top; z <= top + rng.float(3.5, 6.5); z += 0.78) {
        for (var bx = -width * 0.25; bx <= width * 0.25; bx += 0.8) {
          builder.add("cubierta", "frente", centerX + shift + bx, 0, z,
            "crown-block:" + z.toFixed(1) + ":" + bx.toFixed(1));
        }
      }
      return traits.direction < 0 ? "DESPLAZADO A LA IZQUIERDA" : "DESPLAZADO A LA DERECHA";
    } else if (gene === "TERRAZAS") {
      var terraces = rng.int(3, 6);
      for (var terrace = 0; terrace < terraces; terrace += 1) {
        var terraceWidth = width * (0.62 - terrace * 0.075);
        for (var tx = -terraceWidth / 2; tx <= terraceWidth / 2; tx += 0.8) {
          builder.add("cubierta", terrace % 2 ? "techo" : "frente", centerX + tx,
            terrace * 0.42, top + terrace * 1.02,
            "crown-terrace:" + terrace + ":" + tx.toFixed(1));
        }
      }
      return terraces + " NIVELES";
    } else if (gene === "ALETAS") {
      var fins = rng.int(5, 10);
      for (var fin = 0; fin < fins; fin += 1) {
        var finX = lerp(centerX - width * 0.32, centerX + width * 0.32, fin / Math.max(1, fins - 1));
        var finHeight = rng.float(3.4, 8.2);
        for (var fz = top; fz <= top + finHeight; fz += 0.76) {
          builder.add("cubierta", fin % 2 ? "lateral" : "frente",
            finX + Math.sin((fz - top) / finHeight * Math.PI) * traits.madness,
            fin % 3 * 0.65, fz, "crown-fin:" + fin + ":" + fz.toFixed(1));
        }
      }
      return fins + " ALETAS";
    } else if (gene === "VOLUTA") {
      return addVoluteCrown(builder, centerX, width, top, traits, rng);
    } else if (gene === "ONDA SUSPENDIDA" || gene === "NUDO SUSPENDIDO") {
      // Capitel escultórico: el cuerpo se posa sobre el vano en lugar de
      // cerrarlo. Se le da holgura sobre el borde para que se lea suspendido.
      var capitelSide = traits.direction < 0 ? "left" : "right";
      var lift = top + width * rng.float(0.05, 0.16);
      if (gene === "ONDA SUSPENDIDA") {
        addStandingWave(offsetBuilder(builder, lift), grammarSpec(
          "cubierta", capitelSide, centerX, 0,
          width * rng.float(0.7, 1.1), width * rng.float(0.26, 0.44),
          width * rng.float(0.08, 0.15), traits.madness, 0
        ), rng);
        return "ONDA SOBRE EL VANO";
      }
      addKnotBody(offsetBuilder(builder, lift), grammarSpec(
        "cubierta", capitelSide, centerX, 0,
        width * rng.float(0.62, 0.95), width * rng.float(0.6, 0.95),
        width * rng.float(0.06, 0.12), traits.madness, 0
      ), rng);
      return "NUDO SOBRE EL VANO";
    } else {
      var crown = ellipsePath({
        centerX: centerX, centerY: 0, centerZ: top + width * 0.1,
        radiusX: width * 0.28, radiusZ: width * 0.13,
        depth: rng.float(1.3, 2.8), depthPhase: Math.PI / 2
      });
      addRibbonPath(builder, {
        body: "cubierta", key: "grammar-crown", path: crown, closed: true,
        skip: function (t) { return Math.abs(t - 0.75) < 0.04; },
        width: rng.float(1, 2.1), samples: 82, across: 4, depthLayers: 2
      });
      return "HALO ABIERTO";
    }
  }

  function addGrammarAnnex(builder, gene, bounds, traits, rng) {
    var width = bounds.maxX - bounds.minX;
    var height = bounds.maxZ - bounds.minZ;
    if (gene === "NINGUNO") return 0;
    if (gene === "PUENTE INCOMPLETO") {
      var side = traits.direction;
      var start = side > 0 ? bounds.maxX : bounds.minX;
      var span = width * rng.float(0.28, 0.52);
      var bridgeHeight = bounds.minZ + height * rng.float(0.45, 0.76);
      for (var x = 0; x <= span * 0.62; x += 0.78) {
        builder.add("anexo", "techo", start + side * x, 0, bridgeHeight,
          "annex-bridge:" + x.toFixed(1));
      }
    } else if (gene === "TORRE PARÁSITA") {
      addTotem(builder, grammarSpec("anexo", "right", bounds.maxX + width * 0.13,
        1.2, width * 0.24, height * rng.float(0.42, 0.72), rng.float(2, 4), traits.madness), rng);
    } else if (gene === "ESCALERA") {
      var steps = rng.int(5, 10);
      for (var step = 0; step < steps; step += 1) {
        var stepWidth = width * 0.18;
        for (var sx = 0; sx <= stepWidth; sx += 0.78) {
          builder.add("anexo", step % 2 ? "techo" : "frente",
            bounds.minX - stepWidth + sx + step * 0.42, step * 0.55,
            bounds.minZ + step * height * 0.055,
            "annex-stair:" + step + ":" + sx.toFixed(1));
        }
      }
    } else if (gene === "BALCÓN") {
      var balconyZ = bounds.minZ + height * rng.float(0.5, 0.78);
      var balconyWidth = width * rng.float(0.24, 0.5);
      for (var bx = -balconyWidth / 2; bx <= balconyWidth / 2; bx += 0.78) {
        builder.add("anexo", "techo", (bounds.minX + bounds.maxX) / 2 + bx,
          bounds.minY - rng.float(1.5, 3), balconyZ,
          "annex-balcony:" + bx.toFixed(1));
      }
    } else if (gene === "MEDIA LUNA") {
      // La media luna deja de ser sólo cubierta: aquí acompaña al edificio de
      // costado, a media altura, sostenida por su propio cuerno o flotando.
      var moonSide = traits.direction;
      // Se acerca al edificio (antes se separaba entre 0.16 y 0.32 del ancho, y
      // como además es grande, empujaba el encuadre a lo ancho y achataba la
      // composición). Conserva su tamaño —eso era deliberado en v0.14—: sólo
      // deja de alejarse.
      var moonCenterX = (moonSide > 0 ? bounds.maxX : bounds.minX) + moonSide * width * rng.float(0.02, 0.15);
      var moonBaseZ = bounds.minZ + height * rng.float(0.12, 0.55);
      addInvertedCrescentCrown(builder, moonCenterX, width * rng.float(0.78, 1.15), moonBaseZ, traits, rng);
    } else {
      var spec = grammarSpec("anexo", "right", bounds.maxX + width * 0.28,
        rng.float(1, 3), width * rng.float(0.22, 0.38), height * rng.float(0.38, 0.68),
        rng.float(2.4, 4.5), traits.madness * 0.8);
      addGrammarStructure(builder, weightedName(ARCH_STRUCTURE_WEIGHTS, rng.fork("estructura-segundo-cuerpo")), spec, rng.fork("segundo-cuerpo"));
    }
    return 1;
  }

  function deformGrammar(builder, gene, contamination, traits, rng) {
    var bounds = surfaceBounds(builder.points);
    var centerX = (bounds.minX + bounds.maxX) / 2;
    var centerY = (bounds.minY + bounds.maxY) / 2;
    var width = Math.max(1, bounds.maxX - bounds.minX);
    var height = Math.max(1, bounds.maxZ - bounds.minZ);
    if (gene === "INCLINAR") {
      var lean = rng.float(0.05, 0.2) * traits.direction * (0.5 + traits.madness);
      builder.points.forEach(function (point) { point.x += (point.z - bounds.minZ) * lean; });
    } else if (gene === "CURVAR") {
      var bend = width * rng.float(0.06, 0.18) * traits.direction;
      builder.points.forEach(function (point) {
        var t = (point.z - bounds.minZ) / height;
        point.x += Math.sin(t * Math.PI) * bend;
      });
    } else if (gene === "TORCER") {
      var twist = rng.float(0.18, 0.62) * traits.direction;
      builder.points.forEach(function (point) {
        var t = (point.z - bounds.minZ) / height;
        var angle = twist * t;
        var x = point.x - centerX;
        var y = point.y - centerY;
        point.x = centerX + x * Math.cos(angle) - y * Math.sin(angle);
        point.y = centerY + x * Math.sin(angle) + y * Math.cos(angle);
      });
    } else if (gene === "REPETIR") {
      var firstBody = builder.points.length ? builder.points[0].body : null;
      var echo = builder.points.filter(function (point, index) { return point.body === firstBody && index % 2 === 0; })
        .map(function (point, index) {
          var copy = Object.assign({}, point);
          copy.body = "eco";
          copy.x += width * rng.float(0.12, 0.22) * traits.direction;
          copy.y += rng.float(1.5, 3.8);
          copy.voxel = point.voxel + ":echo:" + index;
          return copy;
        });
      builder.points = builder.points.concat(echo);
    } else if (gene === "EROSIONAR") {
      var erosion = rng.float(0.05, 0.13) * (0.55 + traits.madness);
      builder.points = builder.points.filter(function (point) {
        var edge = point.z > bounds.minZ + height * 0.08;
        return !edge || !rng.chance(erosion);
      });
    } else {
      var turns = rng.float(1.2, 2.4);
      var ribbonDepth = rng.float(2.2, 4.8);
      var path = function (t) {
        var theta = t * TAU * turns;
        return {
          x: centerX + Math.sin(theta) * width * 0.48,
          y: centerY + Math.cos(theta) * ribbonDepth,
          z: bounds.minZ + t * height
        };
      };
      addRibbonPath(builder, {
        body: "cinta-genealógica", key: "grammar-entangle", path: path,
        skip: function (t) { return Math.abs(t - 0.5) < 0.022; },
        width: rng.float(1.2, 2.4), samples: 108, across: 3, depthLayers: 2
      });
    }

    if (contamination === "HORIZONTE CURVO") {
      builder.points.forEach(function (point) {
        point.z += Math.cos((point.x - centerX) / width * Math.PI) * height * 0.06;
      });
    } else if (contamination === "GRAVEDAD PARCIAL") {
      builder.points.forEach(function (point, index) {
        if (index % 3 === 0) point.x += Math.sin((point.z - bounds.minZ) / height * TAU) * width * 0.07;
      });
    } else if (contamination === "INTERIOR EXPANDIDO") {
      builder.points.forEach(function (point) {
        var t = clamp((point.z - bounds.minZ) / height, 0, 1);
        point.x = centerX + (point.x - centerX) * (1 + t * 0.18);
      });
    }
  }

  function applyArchitecturalLanguage(builder, language, traits, rng) {
    if (language === "SIN MANIFIESTO") return "GEOMETRÍA DIRECTA";
    var bounds = surfaceBounds(builder.points);
    var centerX = (bounds.minX + bounds.maxX) / 2;
    var width = Math.max(1, bounds.maxX - bounds.minX);
    var height = Math.max(1, bounds.maxZ - bounds.minZ);

    if (language === "EXPRESIONISMO MODERNO") {
      var thrust = width * rng.float(0.065, 0.14) * traits.direction;
      var flare = width * rng.float(0.035, 0.085);
      builder.points.forEach(function (point) {
        var t = clamp((point.z - bounds.minZ) / height, 0, 1);
        var nx = clamp((point.x - centerX) / (width * 0.5), -1, 1);
        var emotion = Math.sin(t * Math.PI);
        point.x += thrust * (t * 0.36 + emotion) + nx * Math.abs(nx) * flare * t;
        point.y += Math.sin((t + nx * 0.32) * Math.PI) * width * 0.035;
        point.z += (1 - Math.abs(nx)) * emotion * height * 0.045;
      });
      return "EMPUJE CURVO";
    }

    if (language === "DECONSTRUCTIVISMO") {
      var bands = rng.int(4, 7);
      var shifts = [], depths = [], lifts = [], shears = [];
      for (var band = 0; band < bands; band += 1) {
        shifts.push(rng.float(-width * 0.11, width * 0.11));
        depths.push(rng.float(-width * 0.07, width * 0.07));
        lifts.push(rng.float(-height * 0.025, height * 0.035));
        shears.push(rng.float(-0.055, 0.055));
      }
      builder.points.forEach(function (point) {
        var t = clamp((point.z - bounds.minZ) / height, 0, 0.9999);
        var index = Math.min(bands - 1, Math.floor(t * bands));
        point.x += shifts[index] + (point.z - bounds.minZ) * shears[index];
        point.y += depths[index];
        point.z += lifts[index];
      });
      return bands + " FRAGMENTOS DESPLAZADOS";
    }

    var waves = rng.int(2, 4);
    var amplitude = width * rng.float(0.045, 0.095);
    var depthAmplitude = width * rng.float(0.045, 0.1);
    var phase = rng.float(0, TAU);
    builder.points.forEach(function (point) {
      var t = clamp((point.z - bounds.minZ) / height, 0, 1);
      var nx = clamp((point.x - centerX) / (width * 0.5), -1, 1);
      var field = t * TAU * waves + nx * Math.PI + phase;
      point.x += Math.sin(field) * amplitude * (0.34 + t * 0.66);
      point.y += Math.cos(nx * Math.PI * waves - t * Math.PI + phase) * depthAmplitude;
      point.z += Math.sin(nx * Math.PI) * Math.cos(t * Math.PI) * height * 0.035;
    });
    return waves + " CAMPOS CONTINUOS";
  }

  function makeGrammarArchitecture(traits, interpretation, rng) {
    var builder = new SurfaceBuilder();
    var grammar = makeGrammarSpecs(traits, rng.fork("planta"));
    var secondaryStructure = rng.chance(0.34)
      ? weightedName(ARCH_STRUCTURE_WEIGHTS, rng.fork("estructura-secundaria"))
      : traits.archStructure;
    grammar.specs.forEach(function (spec, index) {
      var structure = spec.structure || (index === 0 || rng.chance(0.62) ? traits.archStructure : secondaryStructure);
      addGrammarStructure(builder, structure, spec, rng.fork("estructura-" + index));
    });
    var removed = carveGrammarVoid(builder, traits.archVoid, rng.fork("vacio"));
    var structuralBounds = surfaceBounds(builder.points);
    var crownVariant = addGrammarCrown(
      builder, traits.archCrown, structuralBounds, traits, rng.fork("cubierta")
    );
    var annexBodies = addGrammarAnnex(builder, traits.archAnnex, structuralBounds, traits, rng.fork("anexo"));
    deformGrammar(builder, traits.archDeformation, traits.topologicalContamination, traits, rng.fork("deformacion"));
    var languageVariant = applyArchitecturalLanguage(
      builder, traits.archLanguage, traits, rng.fork("lenguaje")
    );
    var finalBounds = surfaceBounds(builder.points);
    var groundChance = traits.archStructure === "ESFERAS" ? 0.28 : 0.88;
    var grounded = rng.fork("presencia-suelo").chance(groundChance);
    if (grounded) {
      // El suelo se calculaba sobre el ancho nominal por 2.1 y siempre centrado
      // en cero, así que en el 72% de las piezas sobresalía del edificio —hasta
      // 2.66 veces— y al reencuadrar el cuadro lo llenaba el suelo mientras la
      // arquitectura se quedaba diminuta. Ahora acompaña al cuerpo: se centra
      // en él y lo desborda apenas lo justo para leerse como línea de tierra.
      addEntangledGround(
        builder,
        Math.max(grammar.nominalWidth * 1.15, (finalBounds.maxX - finalBounds.minX) * 1.08),
        rng.fork("suelo"),
        (finalBounds.minX + finalBounds.maxX) / 2
      );
    }

    var relations = {
      "BARRA": "CUERPO ÚNICO", "L": "DOS ALAS", "U": "PATIO ABIERTO",
      "PATIO": "RECINTO CENTRAL", "ANILLO": "PERIFERIA HABITADA",
      "TORRES": "CONJUNTO DISCONTINUO", "BASAMENTO ESCALONADO": "ESTRATOS SUPERPUESTOS",
      "CRUJÍAS PARALELAS": "VACÍOS ENTRE NAVES", "PUENTE HABITADO": "DOS APOYOS Y UN CUERPO ELEVADO"
    };
    return {
      surface: builder.points,
      geometry: {
        kind: "GENEALOGÍA ARQUITECTÓNICA",
        genealogy: {
          footprint: traits.archFootprint,
          structure: traits.archStructure,
          secondaryStructure: secondaryStructure,
          void: traits.archVoid,
          crown: traits.archCrown,
          crownVariant: crownVariant,
          annex: traits.archAnnex,
          deformation: traits.archDeformation,
          language: traits.archLanguage,
          languageVariant: languageVariant,
          contamination: traits.topologicalContamination
        },
        relation: relations[traits.archFootprint],
        bodies: grammar.specs.length + annexBodies,
        authenticVoid: Math.max(1, removed + grammar.footprintVoids),
        grounded: grounded,
        ringOverArch: traits.archCrown === "ANILLO SUPERIOR" &&
          (traits.archStructure === "MASA ARQUEADA" || traits.archVoid === "ARCO"),
        removedPoints: removed,
        combinations: ARCH_FOOTPRINTS.length * ARCH_STRUCTURES.length * ARCH_VOIDS.length *
          ARCH_CROWNS.length * ARCH_ANNEXES.length * ARCH_DEFORMATIONS.length * ARCH_LANGUAGES.length,
        interpretation: interpretation.nombres.slice()
      }
    };
  }

  function project(item, traits) {
    var p = clamp(traits.perspective / 100, 0, 1);
    var unit = 15;
    var depthX = unit * lerp(0.035, 0.8, p) * traits.direction;
    var depthY = unit * lerp(0.015, 0.36, p);
    return {
      rawX: item.x * unit + item.y * depthX,
      rawY: -item.z * unit - item.y * depthY + item.x * unit * traits.tilt
    };
  }

  function glyphFor(item, palette, traits) {
    var normal = item.face === "frente" ? palette.frente : item.face === "lateral" ? palette.lateral : palette.techo;
    if (item.body !== "derecha" || traits.alphabetRelation === "MISMO IDIOMA") return normal;
    if (traits.alphabetRelation === "CARAS INVERTIDAS") {
      if (item.face === "frente") return palette.lateral;
      if (item.face === "lateral") return palette.frente;
      return palette.sombra;
    }
    if (item.face === "frente") return palette.techo;
    if (item.face === "lateral") return palette.sombra;
    return palette.frente;
  }

  // Intrusión: un puñado de signos que no son de la paleta se cuela en la
  // pieza. Unas veces es un jeroglífico o un símbolo electrónico (con su propia
  // fuente); otras, un block element pintado con un color que no está en la
  // página. Es rara y puntual, no una lluvia.
  function applyIntrusions(surface, traits, rng) {
    var visibles = surface.filter(function (item) { return item.glyph && !item.anomaly; });
    if (!visibles.length) return;
    var pool = visibles.slice();
    rng.shuffle(pool);
    // Antes nunca pasaban de cinco signos: la intrusión se notaba poco en
    // piezas de miles de glifos. Ahora escala con el tamaño y llega a dieciséis.
    var count = clamp(2 + Math.floor(visibles.length / 120), 2, 16);
    for (var i = 0; i < count && i < pool.length; i += 1) {
      var item = pool[i];
      var roll = rng.next();
      if (roll < 0.36) {
        var set = rng.pick(Corpus.jeroglificos);
        item.glyph = rng.pick(set.signos);
        item.intrusionFont = set.fontKind;
      } else if (roll < 0.54) {
        item.glyph = rng.pick(Corpus.electronica.signos);
        item.intrusionFont = Corpus.electronica.fontKind;
      } else if (roll < 0.74) {
        item.glyph = rng.pick(Corpus.bloques);
        item.forcedColor = traits.foreignColor;
      } else {
        // Signo forastero geométrico/técnico —rueda dentada, panal, sello—: a
        // veces también con el color que no existe en la página, para que la
        // intrusión culta también «grite».
        item.glyph = rng.pick(Corpus.signosEspeciales);
        if (rng.chance(0.4)) item.forcedColor = traits.foreignColor;
      }
      item.intrusion = true;
      item.error = "intrusion";
      item.opacity = 1;
    }
  }

  function disturb(surface, traits, rng) {
    var palette = traits.palette;
    var probability = clamp(traits.error / 100, 0, 0.34);
    var alternatives = [palette.frente, palette.lateral, palette.techo, palette.sombra];
    surface.forEach(function (item) {
      item.opacity = rng.float(0.84, 1);
      item.perturbX = 0;
      item.perturbY = 0;
      item.rotation = 0;
      item.error = null;
      item.intrusion = false;
      item.intrusionFont = null;
      item.forcedColor = null;
      if (!rng.chance(probability)) return;
      var kinds = traits.madness > 0.75
        ? ["cambio", "cambio", "desfase", "ausencia", "presion", "salto"]
        : ["cambio", "cambio", "desfase", "ausencia", "presion"];
      var kind = rng.pick(kinds);
      item.error = kind;
      if (kind === "cambio") item.glyph = rng.pick(alternatives.filter(function (glyph) { return glyph !== item.glyph; }));
      if (kind === "desfase") {
        item.perturbX = rng.float(-2.2, 2.2) * (0.65 + traits.madness);
        item.perturbY = rng.float(-1.6, 1.6) * (0.65 + traits.madness);
      }
      if (kind === "salto") {
        item.perturbX = rng.float(-7, 7) * traits.madness;
        item.perturbY = rng.float(-5, 5) * traits.madness;
      }
      if (kind === "ausencia") item.glyph = "";
      if (kind === "presion") item.opacity = rng.float(0.38, 0.68);
    });
    if (traits.intrusion) applyIntrusions(surface, traits, rng.fork("intrusiones-superficie"));
  }

  function fitToPage(surface) {
    var printable = { x: 70, y: 112, width: 760, height: 936 };
    var xs = surface.map(function (item) { return item.rawX + item.perturbX; });
    var ys = surface.map(function (item) { return item.rawY + item.perturbY; });
    var minX = Math.min.apply(Math, xs);
    var maxX = Math.max.apply(Math, xs);
    var minY = Math.min.apply(Math, ys);
    var maxY = Math.max.apply(Math, ys);
    var rawWidth = Math.max(1, maxX - minX);
    var rawHeight = Math.max(1, maxY - minY);
    var scale = Math.min(printable.width / rawWidth, printable.height / rawHeight);
    scale = Math.min(scale, 2.6);
    var usedWidth = rawWidth * scale;
    var usedHeight = rawHeight * scale;
    var originX = printable.x + (printable.width - usedWidth) / 2;
    var originY = printable.y + (printable.height - usedHeight) / 2;
    var fontSize = clamp(12.7 * scale, 9, 31);

    surface.forEach(function (item, index) {
      item.id = "u" + String(index + 1).padStart(5, "0");
      item.x = Math.round((originX + (item.rawX + item.perturbX - minX) * scale) * 100) / 100;
      item.y = Math.round((originY + (item.rawY + item.perturbY - minY) * scale) * 100) / 100;
      item.fontSize = Math.round(fontSize * 100) / 100;
    });
    return { scale: scale, fontSize: fontSize, bounds: { x: originX, y: originY, width: usedWidth, height: usedHeight } };
  }

  function assignDelays(surface, species) {
    if (species === "arco") {
      surface.forEach(function (item, index) { item.delay = Math.round(index * 2.1) / 1000; });
      return;
    }
    if (species === "entrelazada" || species === "noeuclidiana" || species === "gramatica") {
      var minX = Math.min.apply(Math, surface.map(function (item) { return item.rawX; }));
      var maxX = Math.max.apply(Math, surface.map(function (item) { return item.rawX; }));
      var minY = Math.min.apply(Math, surface.map(function (item) { return item.rawY; }));
      var maxY = Math.max.apply(Math, surface.map(function (item) { return item.rawY; }));
      surface.forEach(function (item) {
        var horizontal = (item.rawX - minX) / Math.max(1, maxX - minX);
        var vertical = (item.rawY - minY) / Math.max(1, maxY - minY);
        item.delay = Math.round((vertical * 1.05 + horizontal * 0.42) * 1000) / 1000;
      });
      return;
    }
    var left = surface.filter(function (item) { return item.body === "izquierda"; });
    var right = surface.filter(function (item) { return item.body === "derecha"; });
    var minLeft = Math.min.apply(Math, left.map(function (item) { return item.rawX; }));
    var maxLeft = Math.max.apply(Math, left.map(function (item) { return item.rawX; }));
    var minRight = Math.min.apply(Math, right.map(function (item) { return item.rawX; }));
    var maxRight = Math.max.apply(Math, right.map(function (item) { return item.rawX; }));
    surface.forEach(function (item) {
      var progress = item.body === "izquierda"
        ? (item.rawX - minLeft) / Math.max(1, maxLeft - minLeft)
        : (maxRight - item.rawX) / Math.max(1, maxRight - minRight);
      item.delay = Math.round((progress * 1.45 + Math.max(0, -item.rawY) * 0.00035) * 1000) / 1000;
    });
  }

  function chooseAnomaly(surface, palette, rng) {
    var candidates = surface.filter(function (item) { return item.glyph && item.face !== "techo" && !item.intrusion; });
    if (!candidates.length) candidates = surface.filter(function (item) { return item.glyph && !item.intrusion; });
    if (!candidates.length) candidates = surface.filter(function (item) { return item.glyph; });
    var chosen = rng.pick(candidates);
    if (!chosen) return null;
    chosen.glyph = palette.anomalia;
    chosen.anomaly = true;
    chosen.error = "anomalia";
    chosen.opacity = 1;
    return chosen.id;
  }

  function calculateStats(surface, field, layout) {
    var visible = surface.filter(function (item) { return item.glyph; });
    var faceCounts = { frente: 0, lateral: 0, techo: 0 };
    surface.forEach(function (item) {
      if (faceCounts[item.face] !== undefined) faceCounts[item.face] += 1;
    });
    var pageArea = 760 * 936;
    var estimatedInk = visible.length * layout.fontSize * layout.fontSize * 0.73;
    var whitespace = clamp(1 - estimatedInk / pageArea, 0.28, 0.94);
    return {
      voxels: field ? field.cells.size : 0,
      faces: surface.length,
      visibleGlyphs: visible.length,
      errors: surface.filter(function (item) { return item.error && item.error !== "anomalia"; }).length,
      whitespace: whitespace,
      removedVoxels: field ? field.removed : 0,
      facesByType: faceCounts,
      volumetric: faceCounts.frente > 0 && faceCounts.lateral > 0 && faceCounts.techo > 0
    };
  }

  function build(options) {
    options = options || {};
    var seed = options.seed === undefined ? 1 : options.seed;
    var traits = decide(seed, options.forceSpecies);
    var interpretation = Corpus.interpretar(traits.phrase);
    var rng = new Azar.RNG(seed);
    var construction;
    var surface;
    var field = null;

    if (traits.species === "arco") {
      construction = makeArchMass(traits, interpretation, rng.fork("arco"));
      field = construction.field;
      surface = visibleFaces(field, traits.direction, "solo");
    } else if (traits.species === "espera") {
      construction = makeWaitingSurface(traits, interpretation, rng.fork("espera"));
      surface = construction.surface;
    } else if (traits.species === "entrelazada") {
      construction = makeEntangledSurface(traits, interpretation, rng.fork("entrelazada"));
      surface = construction.surface;
    } else if (traits.species === "noeuclidiana") {
      construction = makeNonEuclideanSurface(traits, interpretation, rng.fork("no-euclidiana"));
      surface = construction.surface;
    } else if (traits.species === "escultura") {
      construction = makeSculpturalSurface(traits, interpretation, rng.fork("espacio-escultorico"));
      surface = construction.surface;
    } else {
      construction = makeGrammarArchitecture(traits, interpretation, rng.fork("gramatica"));
      surface = construction.surface;
    }

    surface.forEach(function (item) {
      var projection = project(item, traits);
      item.rawX = projection.rawX;
      item.rawY = projection.rawY;
      item.glyph = glyphFor(item, traits.palette, traits);
      item.baseGlyph = item.glyph;
      item.anomaly = false;
    });

    surface.sort(function (a, b) { return a.rawY - b.rawY || a.rawX - b.rawX; });
    disturb(surface, traits, rng.fork("errores"));
    var layout = fitToPage(surface);
    assignDelays(surface, traits.species);
    var anomalyId = chooseAnomaly(surface, traits.palette, rng.fork("anomalia"));
    // Fuente por signo: la intrusión trae la suya; la grafía exótica pinta con
    // la fuente jeroglífica/electrónica cualquier signo igual al carácter
    // exótico (el principal por su glifo final, la copia carbón por el base).
    var exoticFontOf = function (glyph) {
      return traits.exoticGlyph && glyph === traits.exoticGlyph ? traits.exoticFontKind : null;
    };
    surface.forEach(function (item) {
      item.fontKind = item.intrusionFont || exoticFontOf(item.glyph);
      item.baseFontKind = exoticFontOf(item.baseGlyph);
    });
    var stats = calculateStats(surface, field, layout);
    var alphabet = [];
    surface.forEach(function (item) {
      if (item.baseGlyph && alphabet.indexOf(item.baseGlyph) === -1) alphabet.push(item.baseGlyph);
    });

    return {
      meta: {
        instrument: "espacio escultórico",
        speciesKey: traits.species,
        species: traits.species === "arco"
          ? "arco para una palabra ausente"
          : traits.species === "espera"
            ? "dos edificios esperándose"
            : traits.species === "entrelazada"
              ? "arquitecturas entrelazadas"
              : traits.species === "noeuclidiana"
                ? "geometrías que regresan"
                : traits.species === "escultura" ? "ensamblajes escultóricos" : "arquitecturas con genealogía",
        seed: String(seed),
        phrase: traits.phrase,
        alphabet: alphabet,
        palette: traits.palette.nombre,
        color: traits.colors.nombre,
        instructions: interpretation.nombres,
        anomalyId: anomalyId,
        intrusion: traits.intrusion,
        exoticFont: traits.exoticFontKind,
        cuerpo: traits.palette.cuerpo,
        profundidad: traits.palette.profundidad,
        formGrosor: traits.formGrosor,
        version: "0.21.0"
      },
      parameters: {
        mass: traits.mass, opening: traits.opening,
        perspective: traits.perspective, error: traits.error,
        curvature: traits.curvature, portals: traits.portals,
        gravityCenters: traits.gravityCenters
      },
      traits: traits,
      interpretation: interpretation,
      geometry: construction.geometry,
      palette: traits.palette,
      colors: traits.colors,
      layout: layout,
      stats: stats,
      surface: surface
    };
  }

  var api = {
    build: build,
    decide: decide,
    VoxelField: VoxelField,
    visibleFaces: visibleFaces,
    project: project,
    morphologies: MORPHOLOGIES.slice(),
    entanglements: ENTANGLEMENTS.slice(),
    nonEuclideanForms: NON_EUCLIDEAN.slice(),
    sculpturalAssemblies: SCULPTURAL_ASSEMBLIES.slice(),
    architecturalGenes: {
      footprints: ARCH_FOOTPRINTS.slice(), structures: ARCH_STRUCTURES.slice(),
      voids: ARCH_VOIDS.slice(), crowns: ARCH_CROWNS.slice(),
      annexes: ARCH_ANNEXES.slice(), deformations: ARCH_DEFORMATIONS.slice(),
      languages: ARCH_LANGUAGES.slice()
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ARQ_MOTOR = api;
})(typeof window !== "undefined" ? window : globalThis);
