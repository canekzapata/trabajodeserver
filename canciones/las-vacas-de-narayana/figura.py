# figura.py — la manada y la canción: vacas por año, instrumentos sonando, concreción, y el espectrograma del master.
#   python3 figura.py <carpeta> muestras/vacas.png
import json, sys, subprocess, numpy as np, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
C, out = sys.argv[1:3]; P = json.load(open('partitura.json')); M = json.load(open(f'{C}/mezcla.json'))
tinta, tenue, oro, voz = '#e6e1d8', '#878279', '#d9b25f', '#9fc3e0'
fig = plt.figure(figsize=(16, 9), facecolor='#0f1012'); gs = fig.add_gridspec(2, 1, height_ratios=[1, 1.6])
def estilo(ax): ax.set_facecolor('#141517'); ax.tick_params(colors=tenue); [s.set_color('#2a2a2c') for s in ax.spines.values()]
bar = 240 / P['bpm']; t_sec = lambda s: (s['desde'] - 1) * bar
ax = fig.add_subplot(gs[0]); estilo(ax)
xs = [t_sec(s) for s in P['secciones']] + [P['duracion']]
for k, s in enumerate(P['secciones']):
    inf = M['informe'][k]
    ax.bar(t_sec(s), np.log2(P['N'][s['ano']]) + 0.001, width=xs[k + 1] - xs[k], align='edge', color=oro, alpha=0.35, lw=0)
    ax.plot([xs[k], xs[k + 1]], [inf['instrumentos_sonando'] / 3] * 2, color=voz, lw=2)
    ax.text(t_sec(s) + 0.3, np.log2(P['N'][s['ano']]) + 0.2, str(P['N'][s['ano']]), color=oro, fontsize=7)
    if not s['nombre'].startswith('año') or s['ano'] in (9, 13, 17): ax.text(t_sec(s) + 0.3, 11.6, s['nombre'], color=tinta, fontsize=7.5, rotation=90, va='top')
ax.plot([t_sec(s) for s in P['secciones']], [10 * P['concrecion'][s['ano']] for s in P['secciones']], color='#d0574b', lw=1.2, drawstyle='steps-post')
ax.axhline(30 / 3, color=voz, lw=0.6, ls=':'); ax.text(1, 30 / 3 + 0.15, 'la ley: 30 instrumentos', color=voz, fontsize=7)
ax.set_ylim(0, 12); ax.set_xlim(0, P['duracion'])
ax.set_title('oro: log₂ de las vacas (con su número) · azul: instrumentos sonando ÷ 3 · rojo: concreción × 10 (Lachenmann)', color=tinta, fontsize=9, loc='left')
ax = fig.add_subplot(gs[1]); estilo(ax)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{C}/master.wav', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.float32); n = 2048; hop = 512; win = np.hanning(n)
S = np.array([np.abs(np.fft.rfft(win * x[i:i + n])) for i in range(0, len(x) - n, hop)]).T; f = np.fft.rfftfreq(n, 1 / 16000); sel = f < 6000; D = 20 * np.log10(S[sel] + 1e-7)
ax.imshow(D, aspect='auto', origin='lower', extent=[0, len(x) / 16000, 0, 6000], cmap='magma', vmin=D.max() - 75, vmax=D.max())
for s in P['secciones']:
    if not s['nombre'].startswith('año') or s['ano'] in (9, 13, 17): ax.axvline(t_sec(s), color=tinta, lw=0.5, alpha=0.6)
ax.set_xlabel('s', color=tenue); ax.set_ylabel('Hz', color=tenue); ax.set_title(f"{P['titulo']} · master · espectrograma 0–6 kHz", color=tinta, fontsize=9, loc='left')
plt.tight_layout(); plt.savefig(out, dpi=95, facecolor=fig.get_facecolor())
