/*
  Azar reproducible para arquitecturasunicode.
  Adaptado del RNG de poesiasexp/laberinto: xfnv1a + mulberry32.
  La misma semilla y los mismos parámetros reconstruyen la misma lámina.
*/
(function (root) {
  "use strict";

  function hashSeed(value) {
    var str = String(value);
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= h >>> 16;
    h = Math.imul(h, 2246822507);
    h ^= h >>> 13;
    h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function RNG(seed) {
    if (!(this instanceof RNG)) return new RNG(seed);
    this.seed = typeof seed === "number" ? seed >>> 0 : hashSeed(seed);
    this._random = mulberry32(this.seed);
  }

  RNG.prototype.next = function () { return this._random(); };
  RNG.prototype.float = function (min, max) {
    if (min === undefined) return this._random();
    if (max === undefined) { max = min; min = 0; }
    return min + this._random() * (max - min);
  };
  RNG.prototype.int = function (min, max) {
    if (max === undefined) { max = min; min = 0; }
    return min + Math.floor(this._random() * (max - min + 1));
  };
  RNG.prototype.chance = function (probability) { return this._random() < probability; };
  RNG.prototype.pick = function (list) {
    return list && list.length ? list[Math.floor(this._random() * list.length)] : undefined;
  };
  RNG.prototype.shuffle = function (list) {
    for (var i = list.length - 1; i > 0; i -= 1) {
      var j = Math.floor(this._random() * (i + 1));
      var tmp = list[i]; list[i] = list[j]; list[j] = tmp;
    }
    return list;
  };
  RNG.prototype.fork = function (tag) { return new RNG(hashSeed(this.seed + "::" + tag)); };

  var api = { RNG: RNG, hashSeed: hashSeed };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ARQ_AZAR = api;
})(typeof window !== "undefined" ? window : globalThis);
