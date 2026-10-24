# tt.py — los motores de «Instrumentos de tres tiempos» (Rejilla, Python) para las partes de partitura.json.
#   python3 tt.py <carpeta> [clave…]   → <carpeta>/stems/<clave>.f32 (estéreo intercalado, 48 kHz)
import json, os, sys
import numpy as np
R = os.environ.get('REJILLA', '/home/user/canekzapata/rejilla')
sys.path.insert(0, f'{R}/research/rejilla/instrumentos-de-tres-tiempos')
import motores
P = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'partitura.json')))
C = sys.argv[1]; os.makedirs(f'{C}/stems', exist_ok=True)
MOTOR = {'fotones': 'fotones', 'organo': 'organo', 'androide': 'androide', 'boca': 'boca', 'cuerdatt': 'cuerda', 'pianott': 'piano', 'arpa': 'arpa', 'cristal': 'cristal', 'estacion': 'estacion', 'terminal': 'terminal', 'plasma': 'plasma', 'sala': 'sala'}
dur = P['duracion'] + 4; SR = 48000
for clave in (sys.argv[2:] or MOTOR):
    ev = P['partes'][clave]
    # la acción (Lachenmann): la nota se vuelve un golpe corto y sin cuerpo; en la boca, consonantes en lugar de vocal
    notas = [{'t': e['t'], 'dur': (0.04 if e['accion'] else e['dur']), 'midi': e['m'] if e['m'] else 60, 'vel': e['v'] * (0.5 if e['accion'] else 1), 'pan': 0} for e in ev]
    s = {'notas': notas}
    if clave == 'boca':
        s['vocales'] = [[e['t'], 'u' if e['ano'] < 14 else 'a'] for e in ev] or [[0, 'u']]
        s['consonantes'] = [[e['t'], 'k' if i % 2 else 's', 0.8] for i, e in enumerate(ev) if e['accion']]
    if clave == 'fotones':   # las piezas de la batería: el bombo grave y largo, la caja media, el charles agudo y corto
        for n, e in zip(notas, ev): n['midi'] = {'bombo': 33, 'caja': 52, 'charles': 93}.get(e.get('pieza'), n['midi'])
    y, _, _ = motores.render(MOTOR[clave], s, dur, sr=SR)
    y = np.asarray(y, np.float32)
    if y.ndim == 1: y = np.stack([y, y], 1)
    y.reshape(-1).astype('<f4').tofile(f'{C}/stems/{clave}.f32')
    print(f'{clave:10s} {len(ev):5d} eventos  pico {np.abs(y).max():.3f}', flush=True)
