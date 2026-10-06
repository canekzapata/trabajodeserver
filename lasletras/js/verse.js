/*
  verse.js — "espacio escultórico", edición para Verse (generative-verse).

  Diferencias con la versión vertical de poesiasexp:
    · lámina CUADRADA (1000 × 1000), a sangre en cualquier viewport;
    · la escritura ocupa el cuadrado completo, sin ficha dentro del SVG;
    · la información vive en una capa HTML que sólo aparece bajo demanda;
    · la única entrada es el hash que Verse inyecta por ?payload=base64(JSON);
    · los rasgos se publican en window.$artifact.features para el metadato del token.

  La semilla es lo único que decide. La misma semilla reconstruye exactamente
  la misma arquitectura, incluida frase, perspectiva, color y anomalía.
*/
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var SIZE = 1000;
  // Ninguna banda se reserva para metadatos: toda la lámina pertenece a la obra.
  var FRAME = { x: 38, y: 38, width: SIZE - 76, height: SIZE - 76 };
  var svg = document.getElementById("lamina");

  function el(name, attributes, text) {
    var node = document.createElementNS(NS, name);
    Object.keys(attributes || {}).forEach(function (key) {
      if (attributes[key] !== null && attributes[key] !== undefined) node.setAttribute(key, attributes[key]);
    });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // --- Semilla: Verse entrega hash y edición en un payload base64 -----------
  function randomHash() {
    var hex = "0123456789abcdef";
    var out = "0x";
    var bytes = new Uint8Array(32);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (var b = 0; b < bytes.length; b += 1) bytes[b] = Math.floor(Math.random() * 256);
    for (var i = 0; i < bytes.length; i += 1) out += hex[bytes[i] >> 4] + hex[bytes[i] & 15];
    return out;
  }

  function readSeed() {
    var params = new URLSearchParams(window.location.search);
    var payload = params.get("payload");
    if (payload) {
      try {
        var decoded = JSON.parse(atob(payload));
        return {
          hash: decoded.hash != null ? String(decoded.hash) : randomHash(),
          edition: Number(decoded.editionNumber || decoded.edition || 1)
        };
      } catch (error) { /* payload inválido: caemos a los alternos */ }
    }
    var direct = params.get("hash") || params.get("seed") || params.get("fxhash");
    if (direct) return { hash: String(direct), edition: Number(params.get("edition") || 1) };
    return { hash: randomHash(), edition: 1 };
  }

  function folio(seed) {
    return String(ARQ_AZAR.hashSeed(seed) % 1000000).padStart(6, "0");
  }

  // --- Reencuadre cuadrado -------------------------------------------------
  // build() ya ajustó la superficie a la lámina vertical, pero cada signo
  // conserva sus coordenadas proyectadas (rawX/rawY + perturbaciones). Las
  // reutilizamos para reencuadrar sin volver a construir la arquitectura.
  function fitSquare(surface) {
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    surface.forEach(function (item) {
      var x = item.rawX + item.perturbX;
      var y = item.rawY + item.perturbY;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    });
    var rawWidth = Math.max(1, maxX - minX);
    var rawHeight = Math.max(1, maxY - minY);
    var scale = Math.min(FRAME.width / rawWidth, FRAME.height / rawHeight);
    scale = Math.min(scale, 3.75);
    var usedWidth = rawWidth * scale;
    var usedHeight = rawHeight * scale;
    var originX = FRAME.x + (FRAME.width - usedWidth) / 2;
    var originY = FRAME.y + (FRAME.height - usedHeight) / 2;
    var fontSize = Math.max(9, Math.min(34, 13 * scale));
    surface.forEach(function (item) {
      item.sx = Math.round((originX + (item.rawX + item.perturbX - minX) * scale) * 100) / 100;
      item.sy = Math.round((originY + (item.rawY + item.perturbY - minY) * scale) * 100) / 100;
      item.sfont = Math.round(fontSize * 100) / 100;
    });
    return fontSize;
  }

  // --- Color por cara (respeta las relaciones de alfabeto entre cuerpos) ---
  function faceColor(piece, item) {
    var colors = piece.colors;
    if (item.anomaly) return colors.anomalia;
    var face = item.face;
    var relation = piece.traits.alphabetRelation;
    if (item.body === "derecha" && relation === "CARAS INVERTIDAS") {
      face = face === "frente" ? "lateral" : face === "lateral" ? "frente" : "techo";
    } else if (item.body === "derecha" && relation === "TRADUCCIÓN MATERIAL") {
      face = face === "frente" ? "techo" : face === "techo" ? "frente" : "lateral";
    }
    return colors[face] || colors.frente;
  }

  // Fuentes extra de la carpeta «paisaje»: cada intrusión o grafía exótica pide
  // su familia mediante una clase; el resto usa la tipográfica de siempre.
  var FONT_CLASS = {
    egipcio: "fx-egipcio", anatolio: "fx-anatolio",
    linealb: "fx-linealb", electronica: "fx-electronica"
  };

  function glyphNode(piece, item, carbon, index) {
    var x = item.sx + (carbon ? piece.traits.direction * 3.2 : 0);
    var y = item.sy + (carbon ? 2.4 : 0);
    var kind = carbon ? item.baseFontKind : item.fontKind;
    var cls = (carbon ? "carbon-glyph" : "glyph") + (kind && FONT_CLASS[kind] ? " " + FONT_CLASS[kind] : "");
    return el("text", {
      x: x, y: y,
      "font-size": item.sfont,
      "text-anchor": "middle",
      "dominant-baseline": "central",
      class: cls,
      fill: carbon ? piece.colors.carbon : (item.forcedColor || faceColor(piece, item)),
      opacity: carbon ? 0.16 : item.opacity,
      "data-index": index,
      "data-family": item.face
    }, "");
  }

  // --- Forma y ficha HTML bajo demanda -------------------------------------
  function formaLabel(piece) {
    var g = piece.geometry;
    var key = piece.meta.speciesKey;
    if (key === "escultura") return g.assembly + " · " + g.modules.join(" + ");
    if (key === "espera") return g.leftMorph + " / " + g.rightMorph;
    if (key === "entrelazada") {
      return g.kind + " · " + g.bodies + " CUERPOS / " + g.crossings + " CRUCES" +
        (g.placement ? " · " + g.placement + " / " + g.support : "");
    }
    if (key === "noeuclidiana") return g.kind + " · " + g.portalCount + " PORTALES";
    if (key === "gramatica") {
      var genes = g.genealogy;
      return genes.footprint + " / " + genes.structure + " / " + genes.crown +
        (genes.crownVariant ? " · " + genes.crownVariant : "");
    }
    return "MASA VOXELAR / VANO EXCAVADO";
  }

  function upper(text) { return String(text).toLocaleUpperCase("es"); }

  function appendInfoRow(container, label, value) {
    var term = document.createElement("dt");
    var description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    container.appendChild(term);
    container.appendChild(description);
  }

  function setupInfoLayer(piece, seed, schedule) {
    var panel = document.getElementById("info-panel");
    var content = document.getElementById("info-content");
    var toggle = document.getElementById("info-toggle");
    var close = document.getElementById("info-close");
    var gifButton = document.getElementById("gif-export");
    document.body.style.setProperty("--paper", piece.colors.papel);
    document.body.style.setProperty("--ink", piece.colors.frente);
    while (content.firstChild) content.removeChild(content.firstChild);

    appendInfoRow(content, "ESPECIE", upper(piece.meta.species));
    appendInfoRow(content, "FORMA", formaLabel(piece));
    var phrase = document.createElement("dd");
    phrase.className = "info-phrase";
    phrase.textContent = upper(piece.meta.phrase);
    content.appendChild(phrase);
    appendInfoRow(content, "ALFABETO", piece.meta.palette + " · " + piece.meta.cuerpo +
      (piece.meta.profundidad === false ? " PLANO" : "") + " · " + piece.meta.alphabet.join(" "));
    appendInfoRow(content, "COLOR", piece.meta.color + " · " + piece.traits.temperature);
    appendInfoRow(content, "PERSPECTIVA", piece.traits.perspectiveClass + " · ERROR " + piece.traits.error + "%");
    if (piece.meta.speciesKey === "gramatica") {
      appendInfoRow(content, "LENGUAJE",
        piece.geometry.genealogy.language + " · " + piece.geometry.genealogy.languageVariant);
    }
    if (piece.meta.speciesKey === "entrelazada" && piece.geometry.placement) {
      appendInfoRow(content, "LAZO", piece.geometry.placement + " · " + piece.geometry.support);
    }
    appendInfoRow(content, "ESCRITURA",
      (Math.round(schedule.durationMs / 100) / 10) + " S · " + schedule.correctedMistakes + " CORRECCIONES");
    appendInfoRow(content, "SEMILLA", "UA/" + folio(seed));

    var setOpen = function (open) {
      panel.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("info-open", open);
      if (open) close.focus({ preventScroll: true });
    };
    toggle.addEventListener("click", function () {
      if (document.body.classList.contains("is-writing")) return;
      setOpen(!panel.classList.contains("is-open"));
    });
    close.addEventListener("click", function () {
      setOpen(false);
      toggle.focus({ preventScroll: true });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus({ preventScroll: true });
      } else if (String(event.key).toLocaleLowerCase("es") === "i" &&
        !document.body.classList.contains("is-writing") &&
        !/input|textarea|select/i.test(event.target.tagName || "")) {
        setOpen(!panel.classList.contains("is-open"));
      }
    });
    return { gifButton: gifButton };
  }

  // --- Render --------------------------------------------------------------
  function render(piece, seed, edition) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    document.body.style.background = piece.colors.papel;
    svg.appendChild(el("title", { id: "tituloSvg" }, "Espacio escultórico generado por la semilla"));
    svg.appendChild(el("desc", { id: "descripcionSvg" },
      upper(piece.meta.species) + ", semilla UA/" + folio(seed) + ". " + formaLabel(piece) +
      ". Alfabeto " + piece.meta.alphabet.join(" ") + "."));
    svg.appendChild(el("rect", { width: SIZE, height: SIZE, fill: piece.colors.papel }));

    var nodes = { main: {}, carbon: {} };
    if (piece.traits.carbon) {
      var carbon = el("g", { id: "carbon-copy" });
      piece.surface.forEach(function (item, index) {
        if (!item.glyph) return;
        var node = glyphNode(piece, item, true, index);
        nodes.carbon[index] = node;
        carbon.appendChild(node);
      });
      svg.appendChild(carbon);
    }

    var building = el("g", { id: "edificio" });
    piece.surface.forEach(function (item, index) {
      if (!item.glyph) return;
      var node = glyphNode(piece, item, false, index);
      nodes.main[index] = node;
      building.appendChild(node);
    });
    svg.appendChild(building);

    document.title = "UA/" + folio(seed) + " — " + upper(piece.meta.species);
    return nodes;
  }

  // --- Rasgos publicados para el metadato del token ------------------------
  function publishFeatures(piece, schedule) {
    var genes = piece.meta.speciesKey === "gramatica" ? piece.geometry.genealogy : null;
    window.$artifact = window.$artifact || {};
    window.$artifact.features = {
      "Especie": upper(piece.meta.species),
      "Forma": formaLabel(piece),
      "Alfabeto": piece.meta.palette,
      "Cuerpo del alfabeto": piece.meta.cuerpo + (piece.meta.profundidad === false ? " / PLANO" : ""),
      "Grosor de la forma": piece.meta.formGrosor,
      "Color": piece.meta.color,
      "Sistema cromático": piece.colors.generativa ? piece.colors.modo : "PALETA EDITADA",
      "Temperatura": piece.traits.temperature,
      "Perspectiva": piece.traits.perspectiveClass,
      "Volumen": piece.stats.volumetric ? "FRENTE / PROFUNDIDAD / CUBIERTA" : "SUPERFICIE",
      "Estructura": genes ? genes.structure : "—",
      "Vacío": genes ? genes.void : "—",
      "Cubierta": genes
        ? genes.crown + (genes.crownVariant ? " / " + genes.crownVariant : "")
        : "—",
      "Lenguaje arquitectónico": genes
        ? genes.language + (genes.languageVariant ? " / " + genes.languageVariant : "")
        : "—",
      "Posición del lazo": piece.geometry.placement
        ? piece.geometry.placement + " / " + piece.geometry.support
        : "—",
      "Escritura": (Math.round(schedule.durationMs / 100) / 10) + " S / " + schedule.correctedMistakes + " CORRECCIONES",
      "Copia carbón": piece.traits.carbon ? "Sí" : "No",
      "Intrusión": piece.traits.intrusion ? "Sí" : "No",
      "Grafía exótica": piece.meta.exoticFont ? upper(piece.meta.exoticFont) : "—",
      "Anomalía": piece.palette.anomalia
    };
  }

  function revealFinal(piece, nodes) {
    piece.surface.forEach(function (item, index) {
      if (!item.glyph || !nodes.main[index]) return;
      nodes.main[index].textContent = item.glyph;
      if (nodes.carbon[index]) nodes.carbon[index].textContent = item.baseGlyph;
    });
  }

  function prefersStillImage() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("still") === "1" || params.get("motion") === "off") return true;
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function signalReady() {
    if (typeof window.fxpreview === "function") { try { window.fxpreview(); } catch (e) {} }
    window.dispatchEvent(new Event("verse:ready"));
  }

  function connectGifExport(piece, seed, schedule, button) {
    if (!button || !window.ARQ_GIF_EXPORTER) return;
    var busy = false;
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (busy) return;
      busy = true;
      button.classList.add("is-exporting");
      button.textContent = "0%";
      ARQ_GIF_EXPORTER.exportAnimation({
        piece: piece,
        schedule: schedule,
        faceColor: faceColor,
        filename: "espacio-escultorico-UA-" + folio(seed) + ".gif",
        onProgress: function (progress) {
          button.textContent = Math.round(progress * 100) + "%";
        }
      }).then(function () {
        button.textContent = "✓";
      }).catch(function (error) {
        console.error(error);
        button.textContent = "×";
      }).finally(function () {
        window.setTimeout(function () {
          button.textContent = "GIF";
          button.classList.remove("is-exporting");
          busy = false;
        }, 1400);
      });
    });
  }

  function boot() {
    var input = readSeed();
    var piece = ARQ_MOTOR.build({ seed: input.hash });
    fitSquare(piece.surface);
    var schedule = ARQ_TYPEWRITER.createSchedule(piece, input.hash);
    var nodes = render(piece, input.hash, input.edition);
    publishFeatures(piece, schedule);
    var interfaceNodes = setupInfoLayer(piece, input.hash, schedule);
    connectGifExport(piece, input.hash, schedule, interfaceNodes.gifButton);
    window.__ARQ_TYPEWRITER_SCHEDULE = schedule;

    var finish = function () {
      revealFinal(piece, nodes);
      document.body.classList.remove("is-writing");
      // Un cuadro adicional garantiza que la captura vea el estado final.
      window.requestAnimationFrame(signalReady);
    };
    if (prefersStillImage()) {
      window.requestAnimationFrame(finish);
      return;
    }
    ARQ_TYPEWRITER.play(schedule, function (event) {
      var node = nodes.main[event.index];
      if (node) node.textContent = event.value;
      if (event.kind === "correct" && nodes.carbon[event.index]) {
        nodes.carbon[event.index].textContent = piece.surface[event.index].baseGlyph;
      }
    }, finish);
  }

  // Esperamos a las fuentes para que la captura no salga con signos de reserva.
  if (document.fonts && document.fonts.ready) {
    var launched = false;
    var launch = function () { if (launched) return; launched = true; boot(); };
    document.fonts.ready.then(launch);
    window.setTimeout(launch, 1500);
  } else {
    boot();
  }
})();
