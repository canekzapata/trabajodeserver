# Arma las páginas publicables de los experimentos con el motor en línea.
# Uso: python3 construir.py DESTINO/index.html [profundidad|cierre|jardin|girar|escribir-girar] [prefijo-de-fuentes]
# Las fuentes se publican aparte desde lasletras/fonts/ con la ruta fonts/….
import json, pathlib, sys
aqui=pathlib.Path(__file__).parent; js=aqui.parent.parent/'js'
modo=sys.argv[2] if len(sys.argv)>2 else 'profundidad'
esc=lambda t:t.replace('</script','<\\/script')
# La comparación del cierre es contra el motor de antes (v0.21): el de hoy ya
# trae las curvas cerradas. Se guarda una copia en experimentos/motor-v021/.
arq=(aqui.parent/'motor-v021'/'architecture.js') if modo=='cierre' else (js/'architecture.js')
motor='\n'.join([(js/'rng.js').read_text(encoding='utf-8'),(js/'corpus.js').read_text(encoding='utf-8'),
  arq.read_text(encoding='utf-8'),(js/'typewriter.js').read_text(encoding='utf-8')])
plantilla=(aqui/{'profundidad':'plantilla.html','cierre':'plantilla-cierre.html','jardin':'plantilla-jardin.html','girar':'plantilla-girar.html','escribir-girar':'plantilla-escribir-girar.html'}[modo]).read_text(encoding='utf-8')
html=plantilla.replace('/*@@MOTOR@@*/',esc(motor))
if modo=='cierre':
    html=html.replace('/*@@FUENTE@@*/null',esc(json.dumps(arq.read_text(encoding='utf-8'))))
    html=html.replace('/*@@PARCHE@@*/',esc((aqui.parent/'cierre-parche.js').read_text(encoding='utf-8')))
if modo in ('jardin','girar','escribir-girar'):
    html=html.replace('/*@@FUENTE@@*/null',esc(json.dumps((js/'architecture.js').read_text(encoding='utf-8'))))
    html=html.replace('/*@@JARDIN@@*/null',esc(json.dumps((aqui.parent/'jardin-motor.js').read_text(encoding='utf-8'))))
    parches=['jardin-parche.js']+(['girar-parche.js'] if modo in ('girar','escribir-girar') else [])
    html=html.replace('/*@@PARCHE@@*/',esc('\n'.join((aqui.parent/f).read_text(encoding='utf-8') for f in parches)))
# Prefijo de las fuentes: "fonts/" junto a la página (publicada) o, en local,
# la ruta relativa a lasletras/fonts/ (por ejemplo "../../fonts/").
if len(sys.argv)>3: html=html.replace('"fonts/','"'+sys.argv[3])
out=pathlib.Path(sys.argv[1]); out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(html,encoding='utf-8')
