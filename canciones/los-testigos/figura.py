# figura.py — el perfil por los testigos, el espectrograma y la energía guardada.  python3 figura.py los-testigos.wav muestras/los-testigos.png
import json, sys, wave, numpy as np, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
wav, salida = sys.argv[1], sys.argv[2]
d = json.load(open(wav.replace('.wav', '.json'))); T = d['terreno']
w = wave.open(wav); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, 2).mean(1) / 32768
fig = plt.figure(figsize=(11, 10), facecolor='#0f1012'); gs = fig.add_gridspec(3, 1, height_ratios=[1, 2.2, 1.2])
tinta, tenue, oro, voz = '#e6e1d8', '#878279', '#d9b25f', '#9fc3e0'
def estilo(ax):
    ax.set_facecolor('#141517'); ax.tick_params(colors=tenue); [s.set_color('#2a2a2c') for s in ax.spines.values()]
ax = fig.add_subplot(gs[0]); estilo(ax)
km = np.linspace(0, T['perfil']['km'], len(T['perfil']['m'])); ax.fill_between(km, T['llano'] - 60, T['perfil']['m'], color='#3a3530'); ax.plot(km, T['perfil']['m'], color=tinta, lw=1)
ax.axhline(T['techo'], color=oro, lw=0.8, ls='--'); ax.axhline(T['llano'], color=tenue, lw=0.6, ls=':')
ax.text(0.1, T['techo'] + 15, f"la meseta que ya no está · {T['techo']:.0f} m", color=oro, fontsize=8); ax.text(2.2, T['llano'] + 12, f"llano {T['llano']:.0f} m = re3", color=tenue, fontsize=8)
ax.set_title(f"{T['lamina']['nombre']} · {T['lamina']['arquetipo'].lower()} · perfil de {T['perfil']['km']:.1f} km que pasa por los cuatro testigos", color=tinta, fontsize=9, loc='left')
ax.set_ylabel('m', color=tenue)
ax = fig.add_subplot(gs[1]); estilo(ax)
n = 8192; hop = 2048; win = np.hanning(n); frames = np.array([np.abs(np.fft.rfft(win * x[i:i + n])) for i in range(0, len(x) - n, hop)])
f = np.fft.rfftfreq(n, 1 / sr); sel = (f > 120) & (f < 420); db = 20 * np.log10(frames[:, sel].T + 1e-7)
ax.imshow(db, aspect='auto', origin='lower', extent=[0, len(x) / sr, f[sel][0], f[sel][-1]], cmap='magma', vmin=db.max() - 75, vmax=db.max())
for t in d['testigos']:
    ax.axhline(t['f'], color=oro, lw=0.4, alpha=0.5)
    for k, e in enumerate(t['espejo']): ax.axhline(e, color=voz, lw=0.3, alpha=0.35)
ax.set_ylabel('Hz', color=tenue); ax.set_title('espectrograma: oro = la nota de cada testigo (lo guardado); azul = su espejo (lo que oye la sala)', color=tinta, fontsize=9, loc='left')
for t0, nom in [(0, 'llano'), (24, 'golpe'), (56, 'erosión'), (104, 'puertas'), (140, 'cierre')]: ax.axvline(t0, color=tinta, lw=0.5, alpha=0.5); ax.text(t0 + 0.5, 410, nom, color=tinta, fontsize=8, va='top')
ax = fig.add_subplot(gs[2]); estilo(ax)
tr = d['traza']; ts = [r['t'] for r in tr]; G = np.array([r['guardada'] for r in tr])
cols = ['#f3dca0', '#d9b25f', '#a67c32', '#6e5221']
for k, t in enumerate(d['testigos']): ax.semilogy(ts, np.maximum(G[:, k], 1e-6), color=cols[k], lw=1.3, label=f"{t['m']:.1f} m · {t['km']:.2f} km · {t['retardo']:.1f} s")
ax.set_ylim(1e-5, 1); ax.set_xlabel('s', color=tenue); ax.set_ylabel('guardada', color=tenue)
ax.legend(fontsize=7, facecolor='#141517', labelcolor=tinta, edgecolor='#2a2a2c', loc='lower left')
plt.tight_layout(); plt.savefig(salida, dpi=100, facecolor=fig.get_facecolor())
