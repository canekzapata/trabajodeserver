# figura_master.py — espectrograma del master con las secciones y las líneas del I guardado.
#   python3 figura_master.py master.wav partitura.json salida.png
import json, sys, numpy as np, matplotlib, subprocess
matplotlib.use('Agg'); import matplotlib.pyplot as plt
w, pj, out = sys.argv[1:4]; P = json.load(open(pj))
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', w, '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.float32); sr = 16000; n = 4096; hop = 1024; win = np.hanning(n)
S = np.array([np.abs(np.fft.rfft(win * x[i:i + n])) for i in range(0, len(x) - n, hop)]).T
f = np.fft.rfftfreq(n, 1 / sr); sel = (f > 60) & (f < 900); D = 20 * np.log10(S[sel] + 1e-7)
fig, ax = plt.subplots(figsize=(16, 6), facecolor='#0f1012'); ax.set_facecolor('#141517')
ax.imshow(D, aspect='auto', origin='lower', extent=[0, len(x) / sr, f[sel][0], f[sel][-1]], cmap='magma', vmin=D.max() - 70, vmax=D.max())
for s in P['secciones']:
    t = (s['desde'] - 1) * 240 / P['bpm']; ax.axvline(t, color='#e6e1d8', lw=0.5, alpha=0.6); ax.text(t + 0.5, 880, s['nombre'], color='#e6e1d8', fontsize=8, va='top', rotation=90)
for h in [261.62, 327.03, 392.44]: ax.axhline(h, xmin=P['coro']['puertas'] / (len(x) / sr), color='#d9b25f', lw=0.8, ls='--')
ax.axvline(P['coro']['puertas'], color='#d9b25f', lw=1.2); ax.text(P['coro']['puertas'] + 0.5, 120, 'puertas: do4 · mi4 · sol4', color='#d9b25f', fontsize=8)
ax.tick_params(colors='#878279'); ax.set_xlabel('s', color='#878279'); ax.set_ylabel('Hz', color='#878279')
ax.set_title('El rift se abre · master (−14 LUFS) · espectrograma 60–900 Hz', color='#e6e1d8', fontsize=9, loc='left')
plt.tight_layout(); plt.savefig(out, dpi=100, facecolor=fig.get_facecolor())
