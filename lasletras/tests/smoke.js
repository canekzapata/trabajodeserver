"use strict";

var assert = require("assert");
var motor = require("../js/architecture.js");
var corpus = require("../js/corpus.js");

function increment(map, key) { map[key] = (map[key] || 0) + 1; }

function rgbFromCss(value) {
  var hsl = String(value).match(/hsl\(\s*([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\s*\)/i);
  if (hsl) {
    var h = ((Number(hsl[1]) % 360) + 360) % 360 / 360;
    var s = Number(hsl[2]) / 100;
    var l = Number(hsl[3]) / 100;
    if (!s) return [l, l, l];
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
  var hex = String(value).replace("#", "");
  if (hex.length === 3) hex = hex.split("").map(function (digit) { return digit + digit; }).join("");
  return [0, 2, 4].map(function (offset) { return parseInt(hex.slice(offset, offset + 2), 16) / 255; });
}

function luminance(value) {
  return rgbFromCss(value).map(function (channel) {
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  }).reduce(function (sum, channel, index) {
    return sum + channel * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

function contrast(a, b) {
  var first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

var first = motor.build({ seed: "la-clave-sostiene-el-anillo" });
var again = motor.build({ seed: "la-clave-sostiene-el-anillo" });
assert.strictEqual(first.meta.version, "0.22.0");
assert.strictEqual(first.meta.instrument, "espacio escultórico");
assert.deepStrictEqual(first.traits, again.traits, "la misma semilla debe conservar los genes");
assert.deepStrictEqual(first.surface, again.surface, "la misma semilla debe reconstruir la misma lámina");

var species = {};
var structures = {};
var crowns = {};
var footprints = {};
var almostFrontal = 0;
var grammarCount = 0;
var grammarVolumetric = 0;
var ringOverArch = 0;
var ringSupportVariants = {};
var sphereSpecialCrowns = {};
var sphereStructures = 0;
var floatingSphereStructures = 0;
var architecturalLanguages = {};
var sculpturalAssemblies = {};
var sculptureCount = 0;
var sculptureVolumetric = 0;
var monumentalSpheres = 0;
var generativeColors = 0;
var colorModes = {};
var colorSignatures = {};
var intrusionPieces = 0;
var exoticPieces = 0;
var exoticFonts = {};
var intrusionFonts = {};
var foreignColorGlyphs = 0;
var mensulaGrammar = 0;
var mensulaWithoutCompanion = 0;
var mediaLunaAnnex = 0;

for (var i = 0; i < 2000; i += 1) {
  var piece = motor.build({ seed: "v12-smoke-" + i });
  increment(species, piece.meta.speciesKey);
  colorSignatures[[piece.colors.papel, piece.colors.frente, piece.colors.lateral, piece.colors.techo, piece.colors.anomalia].join("|")] = true;
  if (piece.colors.generativa) {
    generativeColors += 1;
    increment(colorModes, piece.colors.modo);
    assert(contrast(piece.colors.papel, piece.colors.frente) >= 6.75, "el frente generativo debe contrastar fuertemente");
    assert(contrast(piece.colors.papel, piece.colors.lateral) >= 3.35, "el lateral generativo debe conservar profundidad");
    assert(contrast(piece.colors.papel, piece.colors.techo) >= 3.35, "la cubierta generativa debe conservar profundidad");
    assert(contrast(piece.colors.papel, piece.colors.anomalia) >= 4.2, "la anomalía debe ser visible");
  }
  if (piece.traits.perspectiveClass === "CASI FRONTAL") almostFrontal += 1;
  if (piece.traits.intrusion) intrusionPieces += 1;
  if (piece.meta.exoticFont) {
    exoticPieces += 1;
    increment(exoticFonts, piece.meta.exoticFont);
    assert(piece.surface.some(function (point) { return point.fontKind === piece.meta.exoticFont; }),
      "la grafía exótica debe teñir al menos un signo con su fuente");
  }
  piece.surface.forEach(function (point) {
    if (point.intrusion) {
      assert(typeof point.glyph === "string" && point.glyph.length > 0, "toda intrusión debe llevar un signo");
      if (point.intrusionFont) increment(intrusionFonts, point.intrusionFont);
      if (point.forcedColor) {
        foreignColorGlyphs += 1;
        assert(/^#[0-9a-f]{6}$/i.test(point.forcedColor), "el color foráneo del block element debe ser un hex válido");
      }
    }
  });
  if (piece.meta.speciesKey === "escultura") {
    sculptureCount += 1;
    increment(sculpturalAssemblies, piece.geometry.assembly);
    if (piece.geometry.assembly === "ESFERA MONUMENTAL") {
      monumentalSpheres += 1;
      assert.strictEqual(piece.geometry.grounded, false, "la esfera monumental no debe recibir línea de suelo");
      assert.strictEqual(piece.geometry.modules.length, 1, "la esfera monumental debe ser un cuerpo autónomo");
      assert(!piece.surface.some(function (point) { return point.body === "eje"; }),
        "la esfera monumental no debe llevar un eje horizontal");
    }
    assert(!piece.surface.some(function (point) { return point.body === "eje"; }),
      "ninguna escultura debe reintroducir el eje que atravesaba la esfera");
    assert(isFinite(piece.layout.bounds.width) && isFinite(piece.layout.bounds.height),
      "la escultura debe producir coordenadas finitas");
    if (piece.stats.volumetric) sculptureVolumetric += 1;
  }
  if (piece.meta.speciesKey !== "gramatica") continue;
  grammarCount += 1;
  increment(structures, piece.traits.archStructure);
  increment(crowns, piece.traits.archCrown);
  increment(footprints, piece.traits.archFootprint);
  increment(architecturalLanguages, piece.traits.archLanguage);
  if (piece.stats.volumetric) grammarVolumetric += 1;
  if (piece.geometry.ringOverArch) ringOverArch += 1;
  if (piece.traits.archCrown === "ANILLO SUPERIOR") {
    increment(ringSupportVariants, piece.geometry.genealogy.crownVariant);
  }
  if (piece.traits.archStructure === "ESFERAS") {
    sphereStructures += 1;
    if (!piece.geometry.grounded) floatingSphereStructures += 1;
    if (["CÚPULA INVERSA", "MEDIA LUNA INVERTIDA", "ANTENA PARABÓLICA", "ANILLO SUPERIOR"]
      .indexOf(piece.traits.archCrown) >= 0) {
      increment(sphereSpecialCrowns, piece.traits.archCrown);
    }
  }
  if (piece.traits.archCrown === "ANTENA PARABÓLICA") {
    assert(!piece.surface.some(function (point) {
      return /parabolic-(mast|feed)/.test(point.voxel || "");
    }), "la parabólica debe conservar sólo el paraboloide, sin mástil ni receptor");
  }
  if (piece.traits.archStructure === "MÉNSULAS") {
    mensulaGrammar += 1;
    if (piece.traits.archCrown === "NINGUNA" && piece.traits.archAnnex === "NINGUNO") mensulaWithoutCompanion += 1;
  }
  if (piece.traits.archAnnex === "MEDIA LUNA") {
    mediaLunaAnnex += 1;
    assert(piece.surface.some(function (point) { return /inverted-crescent/.test(point.voxel || ""); }),
      "el anexo media luna debe dibujar realmente la media luna");
  }
}

assert(grammarCount > 1100 && grammarCount < 1300, "la genealogía arquitectónica debe ocupar aproximadamente 60% de las semillas");
assert(sculptureCount > 300 && sculptureCount < 430, "los ensamblajes escultóricos deben ocupar aproximadamente 18% de las semillas");
assert(species.arco > 110 && species.arco < 210);
assert(species.espera > 75 && species.espera < 170);
assert(species.entrelazada > 55 && species.entrelazada < 145);
assert(species.noeuclidiana > 30 && species.noeuclidiana < 100);
assert(almostFrontal > 20 && almostFrontal < 85, "la vista casi frontal debe seguir siendo rara pero posible");
assert.strictEqual(Object.keys(structures).length, motor.architecturalGenes.structures.length, "deben aparecer todas las estructuras");
assert.strictEqual(Object.keys(crowns).length, motor.architecturalGenes.crowns.length, "deben aparecer todas las cubiertas");
assert.strictEqual(Object.keys(footprints).length, motor.architecturalGenes.footprints.length, "deben aparecer todas las plantas");
assert.strictEqual(Object.keys(architecturalLanguages).length, motor.architecturalGenes.languages.length,
  "deben aparecer los tres lenguajes nuevos y la geometría sin manifiesto");
assert.strictEqual(Object.keys(sculpturalAssemblies).length, motor.sculpturalAssemblies.length, "deben aparecer todos los ensamblajes escultóricos");
assert(grammarVolumetric / grammarCount > 0.98, "casi toda arquitectura debe emitir frente, profundidad y cubierta");
assert(sculptureVolumetric / sculptureCount > 0.99, "todo ensamblaje escultórico debe conservar volumen");
assert(structures["MASA ARQUEADA"] > structures.PANTALLAS * 4, "la masa arqueada debe ser mucho más frecuente que la pantalla");
assert(structures.ARCADAS > structures.CINTAS * 3, "las arcadas deben ser mucho más frecuentes que las cintas");
assert(structures["TORRE HELICOIDAL"] > structures.PANTALLAS * 3, "la torre helicoidal debe ser una familia arquitectónica principal");
assert(structures["CUBOS ENCAJADOS"] > structures.CINTAS * 2, "los cubos encajados deben ser una familia recurrente");
assert(structures.ZIGURATS > structures.PANTALLAS * 2, "las zigurats deben conservar una presencia clara");
assert(ringOverArch > 55, "el arco con anillo superior debe seguir existiendo sin dominar");
assert.strictEqual(Object.keys(ringSupportVariants).length, 5,
  "el anillo superior debe conocer dos pilares, mástil central, dos laterales y trípode");
assert.strictEqual(Object.keys(sphereSpecialCrowns).length, 4,
  "las esferas deben combinarse con anillo, cúpula inversa, media luna y parabólica");
// Esta proporción se medía sobre las esferas que cayeran dentro de las 2000
// semillas del barrido general —a veces menos de 50 casos—, así que el
// resultado oscilaba por muestreo y no por el motor. Se mide ahora sobre una
// muestra propia y mucho mayor; el umbral es el mismo.
var groundedSpheres = 0, floatingSpheres = 0;
for (var gs = 0; gs < 6500; gs += 1) {
  var spherePiece = motor.build({ seed: "v18-esfera-" + gs, forceSpecies: "gramatica" });
  if (spherePiece.traits.archStructure !== "ESFERAS") continue;
  groundedSpheres += 1;
  if (!spherePiece.geometry.grounded) floatingSpheres += 1;
}
assert(groundedSpheres > 280, "la muestra de esferas debe ser grande para auditar su línea de suelo");
assert(floatingSpheres / groundedSpheres > 0.58,
  "la esfera arquitectónica debe poder existir sin una línea de suelo obligatoria");
assert((crowns["CÚPULA INVERSA"] + crowns["MEDIA LUNA INVERTIDA"] + crowns["ANTENA PARABÓLICA"]) /
  grammarCount > 0.15, "el trío escultórico original debe conservar su presencia");
// La familia de cubiertas escultóricas creció con la voluta y los capiteles de
// onda y nudo: se mide entera, no sólo el trío de v0.11.
assert((crowns["CÚPULA INVERSA"] + crowns["MEDIA LUNA INVERTIDA"] + crowns["ANTENA PARABÓLICA"] +
  crowns.VOLUTA + crowns["ONDA SUSPENDIDA"] + crowns["NUDO SUSPENDIDO"]) /
  grammarCount > 0.3, "las cubiertas escultóricas deben aparecer con frecuencia");
assert(crowns.NINGUNA > crowns.CORONA * 3, "la ausencia de corona debe ser mucho más frecuente que el halo ornamental");
assert((crowns["ANILLO SUPERIOR"] + crowns["CÚPULA"] + crowns.CORONA) / grammarCount < 0.36,
  "anillos, cúpulas y coronas no deben concluir la mayoría de las piezas");
assert(sculpturalAssemblies["ESFERA SOBRE HÉLICE"] + sculpturalAssemblies["HÉLICE SOBRE ESFERA"] > sculptureCount * 0.23,
  "los ensamblajes de esfera y hélice deben ser una familia principal");
assert(monumentalSpheres > 45, "la esfera monumental debe ser una familia escultórica frecuente");
assert(motor.sculpturalAssemblies.indexOf("ESFERA ATRAVESADA") < 0,
  "la esfera atravesada debe salir del catálogo");
assert(intrusionPieces > 1010 && intrusionPieces < 1240, "cerca de 56% de las piezas deben admitir intrusiones");
assert(foreignColorGlyphs > 40, "el block element de color foráneo debe aparecer con regularidad");
assert(Object.keys(intrusionFonts).length === 4, "las intrusiones deben usar egipcio, anatolio, lineal B y electrónica");
assert(exoticPieces > 210 && exoticPieces < 350, "la grafía exótica debe seguir siendo minoritaria pero visible (≈13.5%)");
assert(Object.keys(exoticFonts).length === 4, "la grafía exótica debe poder tomar las cuatro fuentes de paisaje");
assert(mensulaGrammar > 40, "debe haber suficientes ménsulas de genealogía para auditar su compañía");
assert.strictEqual(mensulaWithoutCompanion, 0, "la ménsula nunca debe quedarse sin cubierta ni anexo");
assert(mediaLunaAnnex > 20, "la media luna debe aparecer también como anexo, fuera de la corona");
assert(generativeColors > 1350 && generativeColors < 1530, "cerca de 72% de las paletas deben ser genealógicas");
assert.strictEqual(Object.keys(colorModes).length, 6, "deben aparecer los seis sistemas cromáticos generativos");
assert(Object.keys(colorSignatures).length > 1350, "la serie debe producir más de 1350 combinaciones cromáticas en 2000 semillas");

var waiting = {};
for (var j = 0; j < 1200; j += 1) {
  var pair = motor.build({ seed: "v12-waiting-" + j, forceSpecies: "espera" });
  increment(waiting, pair.traits.leftMorph);
}
assert(waiting.ACUEDUCTO > waiting["TÓTEM"] * 3, "el acueducto debe superar ampliamente al tótem");
assert(waiting["MÉNSULAS"] > waiting.PANTALLA * 2, "las ménsulas deben superar ampliamente a la pantalla");
assert(waiting["TORRE HELICOIDAL"] > waiting["TÓTEM"] * 3, "la torre helicoidal debe superar ampliamente al tótem");
assert(waiting.ZIGURAT > waiting["TÓTEM"] * 3, "la zigurat debe superar ampliamente al tótem");
assert(waiting.ESFERA > waiting["TÓTEM"] * 2, "la esfera debe dejar de ser una aparición excepcional");
assert(waiting["PIRÁMIDE"] > waiting["TÓTEM"] * 2, "la pirámide debe formar parte estable del vocabulario");
assert(waiting["OBELISCO ROTO"] > waiting["TÓTEM"], "el obelisco roto debe aparecer con claridad");

var loopPlacements = {};
var loopSupports = {};
var loopLaws = {};
var loopCount = 0;
var groundedLoops = 0;
for (var k = 0; k < 2400; k += 1) {
  var entangled = motor.build({ seed: "v12-loop-" + k, forceSpecies: "entrelazada" });
  if (entangled.geometry.kind !== "LAZO HABITABLE") continue;
  loopCount += 1;
  increment(loopPlacements, entangled.geometry.placement);
  increment(loopSupports, entangled.geometry.support);
  increment(loopLaws, entangled.geometry.loopLaw);
  if (entangled.geometry.grounded) groundedLoops += 1;
}
assert(loopCount > 400, "debe haber suficientes lazos para auditar su diversidad");
assert.strictEqual(Object.keys(loopPlacements).length, 6, "el lazo debe ocupar seis posiciones");
assert.strictEqual(Object.keys(loopSupports).length, 4, "el lazo debe conocer apoyo doble, dos laterales y flotación");
assert.strictEqual(Object.keys(loopLaws).length, 3, "el lazo debe alternar órbita, ocho y triple pliegue");
assert(groundedLoops > 0 && groundedLoops < loopCount * 0.5,
  "la línea de suelo del lazo debe ser posible pero minoritaria");

// v0.21 — el alfabeto respeta el grosor del cuerpo. Un signo macizo (□ ▲ ▓ ▨)
// nunca debe caer sobre un cuerpo delgado (torre helicoidal, cinta, celosía) y
// una grafía plana (MÉNSULA) sólo se admite sobre un cuerpo que ya trae su
// propia profundidad. El barrido audita ambas prohibiciones y la cobertura del
// catálogo entero de alfabetos.
var alphabetsSeen = {};
var grosorSeen = {};
var flatSeen = 0, flatOffMaciza = 0, macizoOnDelicate = 0;
for (var a = 0; a < 6000; a += 1) {
  var art = motor.build({ seed: "v21-alfabeto-" + a });
  var pal = art.palette;
  increment(alphabetsSeen, pal.nombre);
  increment(grosorSeen, art.traits.formGrosor);
  if (pal.profundidad === false) {
    flatSeen += 1;
    if (art.traits.formGrosor !== "MACIZA") flatOffMaciza += 1;
  }
  if (art.traits.formGrosor === "DELICADA" && pal.cuerpo === "MACIZO") macizoOnDelicate += 1;
}
assert.strictEqual(macizoOnDelicate, 0, "ningún alfabeto macizo debe caer sobre un cuerpo delgado");
assert.strictEqual(flatOffMaciza, 0, "la grafía plana sólo se admite sobre cuerpos macizos");
assert(flatSeen > 40, "la grafía plana (MÉNSULA) debe aparecer sobre los cuerpos macizos");
assert.strictEqual(Object.keys(alphabetsSeen).length, corpus.paletas.length,
  "los " + corpus.paletas.length + " alfabetos —incluidos los seis nuevos— deben aparecer en la serie");
assert.strictEqual(Object.keys(grosorSeen).length, 3, "deben coexistir cuerpos delicados, medios y macizos");

// El hipar de Candela entra de las dos formas prometidas: estructura de la
// gramática y ensamblaje autónomo. Ambas deben producir un cascarón con
// volumen (frente + lateral + cubierta) y coordenadas finitas.
var hiparGrammar = 0, hiparGrammarVolumetric = 0, hiparDelicate = 0;
for (var hg = 0; hg < 4000 && hiparGrammar < 60; hg += 1) {
  var hgPiece = motor.build({ seed: "v21-hipar-g-" + hg, forceSpecies: "gramatica" });
  if (hgPiece.traits.archStructure !== "HIPAR") continue;
  hiparGrammar += 1;
  if (hgPiece.stats.volumetric) hiparGrammarVolumetric += 1;
  if (hgPiece.traits.formGrosor === "DELICADA") hiparDelicate += 1;
  assert(hgPiece.palette.cuerpo !== "MACIZO", "el hipar es delgado: no admite un alfabeto macizo");
}
assert(hiparGrammar > 20, "el hipar debe existir como estructura de la gramática");
assert.strictEqual(hiparGrammar, hiparGrammarVolumetric, "el hipar de la gramática debe emitir volumen");
assert.strictEqual(hiparGrammar, hiparDelicate, "el cuerpo del hipar debe clasificarse siempre como delicado");
var hiparSolo = 0, hiparSoloVolumetric = 0;
for (var hs = 0; hs < 3000 && hiparSolo < 40; hs += 1) {
  var hsPiece = motor.build({ seed: "v21-hipar-s-" + hs, forceSpecies: "escultura" });
  if (hsPiece.geometry.assembly !== "HIPAR MONUMENTAL") continue;
  hiparSolo += 1;
  if (hsPiece.stats.volumetric) hiparSoloVolumetric += 1;
  assert(isFinite(hsPiece.layout.bounds.width) && isFinite(hsPiece.layout.bounds.height),
    "el hipar monumental debe producir coordenadas finitas");
  assert.strictEqual(hsPiece.geometry.grounded, false, "el hipar monumental flota, sin línea de suelo");
}
assert(hiparSolo > 15, "el hipar monumental debe existir como ensamblaje autónomo");
assert.strictEqual(hiparSolo, hiparSoloVolumetric, "el hipar monumental debe conservar volumen");

console.log(JSON.stringify({
  version: first.meta.version,
  species: species,
  structures: structures,
  crowns: crowns,
  architecturalLanguages: architecturalLanguages,
  footprints: footprints,
  almostFrontal: almostFrontal,
  volumetricShare: Math.round(grammarVolumetric / grammarCount * 1000) / 1000,
  ringOverArch: ringOverArch,
  ringSupportVariants: ringSupportVariants,
  sphereSpecialCrowns: sphereSpecialCrowns,
  floatingSphereShare: Math.round(floatingSphereStructures / sphereStructures * 1000) / 1000,
  monumentalSpheres: monumentalSpheres,
  sculpturalAssemblies: sculpturalAssemblies,
  sculpturalVolumetricShare: Math.round(sculptureVolumetric / sculptureCount * 1000) / 1000,
  intrusionPieces: intrusionPieces,
  intrusionFonts: intrusionFonts,
  foreignColorGlyphs: foreignColorGlyphs,
  exoticPieces: exoticPieces,
  exoticFonts: exoticFonts,
  mensulaGrammar: mensulaGrammar,
  mensulaWithoutCompanion: mensulaWithoutCompanion,
  mediaLunaAnnex: mediaLunaAnnex,
  generativeColors: generativeColors,
  uniqueColorSignatures: Object.keys(colorSignatures).length,
  colorModes: colorModes,
  alphabetsSeen: Object.keys(alphabetsSeen).length,
  flatGraphemePieces: flatSeen,
  formGrosor: grosorSeen,
  hiparGrammar: hiparGrammar,
  hiparMonumental: hiparSolo,
  waitingMorphologies: waiting,
  loopPlacements: loopPlacements,
  loopSupports: loopSupports,
  loopLaws: loopLaws
}, null, 2));
