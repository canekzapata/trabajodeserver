#!/bin/sh
# master.sh — la mezcla a −14 LUFS integrados con ganancia lineal y un limitador suave (5 ms de ataque, 120 ms de
# suelta) que deja el pico verdadero en −1 dBTP. No hay compresión ni control automático de ganancia.
#   sh master.sh <carpeta>   → <carpeta>/master.wav, <carpeta>/master.json
set -e
python3 - "$1" <<'PY'
import json, re, subprocess, sys
C = sys.argv[1]
def medir(f):
    v = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', v)[-1]), float(re.findall(r'LRA:\s+([\d.]+) LU', v)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', v)[-1])
I0, LRA0, TP0 = medir(f'{C}/mezcla.wav'); g = -14 - I0; lim = -1.6
for _ in range(6):   # el limitador quita un poco de nivel: se corrige la ganancia hasta caer en −14 ± 0,1
    af = f'volume={g:.2f}dB,alimiter=limit={10 ** (lim / 20):.4f}:attack=5:release=120:level=false'
    subprocess.run(['ffmpeg', '-hide_banner', '-y', '-i', f'{C}/mezcla.wav', '-af', af, '-c:a', 'pcm_s24le', f'{C}/master.wav'], capture_output=True, check=True)
    I, LRA, TP = medir(f'{C}/master.wav')
    if TP > -1.0: lim -= TP + 1.0 + 0.1
    if abs(I + 14) <= 0.1 and TP <= -1.0: break
    g += -14 - I
res = {'mezcla': {'I_LUFS': I0, 'LRA_LU': LRA0, 'pico_dBTP': TP0}, 'ganancia_dB': round(g, 2), 'limite_dBFS': round(lim, 2), 'master': {'I_LUFS': I, 'LRA_LU': LRA, 'pico_verdadero_dBTP': TP}}
json.dump(res, open(f'{C}/master.json', 'w'), indent=1); print(json.dumps(res))
PY
