/* voz.cjs — Sabina (Difonos de Rejilla, modo PSOLA) canta la melodía de partitura.json, fuera de línea en Chromium.
 *   REJILLA=/ruta/a/rejilla node voz.cjs [salida.f32]   → estéreo intercalado, 48 kHz, toda la canción
 * Voz de máquina por acuerdo: una sílaba por evento, sin melismas. */
const fs = require('fs'), path = require('path'), { chromium } = require('playwright');
const R = process.env.REJILLA || '/home/user/canekzapata/rejilla', D = path.join(R, 'difonos');
const P = JSON.parse(fs.readFileSync(path.join(__dirname, 'partitura.json'), 'utf8'));
const salida = process.argv[2] || path.join(__dirname, 'voz.f32');
const banco = path.join(D, 'bancos', fs.readdirSync(path.join(D, 'bancos')).find((d) => d.startsWith('sabina')));
// cada sílaba suena el 90 % de su duración: la voz respira entre sílabas, como una máquina que articula
const eventos = P.melodia.map((n) => ({ t: n.t, dur: +(n.durS * 0.9).toFixed(4), texto: n.silaba, nota: n.midi }));
(async () => {
  const b = await chromium.launch(); const page = await b.newPage();
  await page.setContent('<title>voz</title>');
  for (const f of ['g2p.js', 'difonos.js']) await page.addScriptTag({ content: fs.readFileSync(path.join(D, 'runtime', f), 'utf8') });
  const partes = [];
  await page.exposeFunction('guardar', (b64) => { partes.push(Buffer.from(b64, 'base64')); });
  const M = JSON.parse(fs.readFileSync(path.join(banco, 'manifiesto.json'), 'utf8')), audio = fs.readFileSync(path.join(banco, 'banco.flac')).toString('base64');
  const r = await page.evaluate(async ({ eventos, dur, M, audio }) => {
    const sr = 48000, ctx = new OfflineAudioContext(2, Math.ceil(dur * sr), sr);
    const bin = Uint8Array.from(atob(audio), (c) => c.charCodeAt(0)), bank = new Difonos.Banco(ctx, await ctx.decodeAudioData(bin.buffer), M);
    let semilla = 40; const rng = () => { semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0; return semilla / 4294967296; };
    const q = []; const g = ctx.createGain(); g.gain.value = 1; g.connect(ctx.destination);
    bank.cantar(g, eventos, { modo: 'psola', vibrato: [4.8, 0.0015], rng, agendar: (t, f) => q.push([t, f]) });
    q.sort((a, b) => a[0] - b[0]); const hasta = (t) => { while (q.length && q[0][0] < t) q.shift()[1](); }; hasta(3);
    for (let k = 2; k < dur - 0.1; k += 2) ctx.suspend(k).then(() => { hasta(k + 3); ctx.resume(); });
    const buf = await ctx.startRendering(), L = buf.getChannelData(0), Rr = buf.getChannelData(1), N = L.length, PASO = 1 << 19;
    let pico = 0;
    for (let i = 0; i < N; i += PASO) {
      const m = Math.min(PASO, N - i), x = new Float32Array(2 * m);
      for (let k = 0; k < m; k++) { x[2 * k] = L[i + k]; x[2 * k + 1] = Rr[i + k]; pico = Math.max(pico, Math.abs(L[i + k])); }
      const u = new Uint8Array(x.buffer); let s = ''; for (let j = 0; j < u.length; j += 32768) s += String.fromCharCode(...u.subarray(j, j + 32768));
      await window.guardar(btoa(s));
    }
    return { pico, segundos: N / sr };
  }, { eventos, dur: P.duracion + 2, M, audio });
  fs.writeFileSync(salida, Buffer.concat(partes));
  console.log(path.basename(salida), r, eventos.length, 'sílabas');
  await b.close();
})().catch((e) => { console.error(e); process.exitCode = 1; });
