# figura.py — el mapa de la partitura: melodía, acordes caídos en el terreno, líneas de cada época, ríos, lagos,
# ataques, arcos y puertas.   python3 figura.py partitura.json muestras/partitura.png
import json, sys, math, matplotlib
matplotlib.use('Agg'); import matplotlib.pyplot as plt
P = json.load(open(sys.argv[1])); DO1 = P['do1']
tinta, tenue, oro, voz, cobre, rojo = '#e6e1d8', '#878279', '#d9b25f', '#9fc3e0', '#c97a5a', '#d0574b'
fig, ax = plt.subplots(figsize=(16, 8.5), facecolor='#0f1012'); ax.set_facecolor('#141517')
ax.tick_params(colors=tenue); [s.set_color('#2a2a2c') for s in ax.spines.values()]
ax.set_yscale('log'); ax.set_ylim(40, 900); ax.set_xlim(0, P['duracion'])
cols_ep = ['#2a2a2c', '#2f2a22', '#2a2f2a', '#2a2a33', '#33282a']
for s in P['secciones']:
    t0 = (s['desde'] - 1) * 4 * 60 / P['bpm']; t1 = (s['hasta'] - 1) * 4 * 60 / P['bpm']
    ax.axvspan(t0, t1, color=cols_ep[s['epoca']], alpha=0.55, lw=0); ax.text(t0 + 0.6, 850, s['nombre'], color=tinta, fontsize=7.5, va='top', rotation=90)
    ax.text(t0 + 3.2, 850, P['historia'][s['epoca']].lower(), color=tenue, fontsize=6.5, va='top', rotation=90)
# las líneas del espectro de cada época, en el registro de la resonancia
for r in P['resonancia']:
    for l in r['lineas']:
        hz = l['hz']
        while hz > 700: hz /= 2
        while hz < 90: hz *= 2
        ax.plot([r['t'], r['hasta']], [hz, hz], color=oro, lw=0.6, alpha=0.35)
# los acordes (viola, una octava abajo de sus parciales) con su desvío
for a in P['armonia']:
    for x in a['tonos']:
        c = rojo if abs(x['desvio']) > 30 else cobre if abs(x['desvio']) > 0 else tinta
        ax.plot([a['t'], a['t'] + 4 * 60 / P['bpm'] * 0.95], [x['hz'] / 2] * 2, color=c, lw=2.2, alpha=0.8, solid_capstyle='butt')
    ax.plot([a['t'], a['t'] + 4 * 60 / P['bpm'] * 0.95], [a['bajo']] * 2, color=tenue, lw=2.2, alpha=0.8, solid_capstyle='butt')
# la melodía
for n in P['melodia']: ax.plot([n['t'], n['t'] + n['durS']], [n['hz']] * 2, color=voz, lw=3, solid_capstyle='butt')
for n in P['voces']['alta']: ax.plot([n['t'], n['t'] + n['durS']], [n['hz']] * 2, color='#f0c08a', lw=3, solid_capstyle='butt')
for n in P['voces']['baja']: ax.plot([n['t'], n['t'] + n['durS']], [n['hz']] * 2, color='#8fd19e', lw=3, solid_capstyle='butt')
# los ríos y los lagos
for r in P['rios']: ax.plot([r['t'], r['t'] + r['dur']], [r['hzDe'], r['hzA']], color='#6fa8d6', lw=0.8, alpha=0.8)
for l in P['lagos']: ax.scatter([l['t']], [l['hz']], s=10 + 40 * l['v'], color='#6fa8d6' if l['tipo'] == 'tamtam' else oro, alpha=0.7, lw=0)
# trombón, arco, coro
for a in P['trombon']: ax.scatter([a['t']], [a['hz']], marker='v', s=90 if a['epoca'] < 4 else 200, color=cobre, zorder=5)
for a in P['arco']: ax.plot([a['t'], a['t'] + a['dur']], [a['hz']] * 2, color={'isla': oro, 'rompe': rojo, 'rampa': cobre}[a['modo']], lw=4, solid_capstyle='butt'); ax.text(a['t'], a['hz'] * 0.88, f"arco: {a['modo']}", color=tinta, fontsize=7)
ax.plot([P['coro']['golpe'], P['coro']['puertas']], [DO1 * 8 * 1.0] * 2, color=oro, lw=1, ls=':'); ax.text(P['coro']['golpe'] + 1, DO1 * 8 * 1.04, 'el Coro guarda el I (do4 · mi4 · sol4) desde el compás 1', color=oro, fontsize=7.5)
ax.axvline(P['coro']['puertas'], color=oro, lw=1.2); ax.text(P['coro']['puertas'] + 0.5, 60, 'puertas: sale el I', color=oro, fontsize=8)
ax.set_xlabel('s', color=tenue); ax.set_ylabel('Hz', color=tenue)
ax.set_title(f"{P['titulo']} · {P['subtitulo']} · lámina 40, {P['lamina']['nombre']} · {P['bpm']} bpm · azul: Sabina (melodía) · durazno: la que traduce · verde: el archivo · blanco/cobre/rojo: acordes (desvío por el terreno: 0 / <30 / >30 cents) · oro: líneas del espectro de cada época", color=tinta, fontsize=8.5, loc='left')
plt.tight_layout(); plt.savefig(sys.argv[2], dpi=100, facecolor=fig.get_facecolor())
