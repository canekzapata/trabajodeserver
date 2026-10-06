# Arma las páginas publicables de los experimentos con el motor en línea.
# Uso: python3 construir.py DESTINO/index.html [profundidad|cierre|jardin]
# Las fuentes se publican aparte desde lasletras/fonts/ con la ruta fonts/….
import json, pathlib, sys
aqui=pathlib.Path(__file__).parent; js=aqui.parent.parent/'js'
modo=sys.argv[2] if len(sys.argv)>2 else 'profundidad'
esc=lambda t:t.replace('</script','<\\/script')
motor='\n'.join((js/f).read_text(encoding='utf-8') for f in ['rng.js','corpus.js','architecture.js','typewriter.js'])
plantilla=(aqui/{'profundidad':'plantilla.html','cierre':'plantilla-cierre.html','jardin':'plantilla-jardin.html'}[modo]).read_text(encoding='utf-8')
html=plantilla.replace('/*@@MOTOR@@*/',esc(motor))
if modo=='cierre':
    html=html.replace('/*@@FUENTE@@*/null',esc(json.dumps((js/'architecture.js').read_text(encoding='utf-8'))))
    html=html.replace('/*@@PARCHE@@*/',esc((aqui.parent/'cierre-parche.js').read_text(encoding='utf-8')))
if modo=='jardin':
    html=html.replace('/*@@FUENTE@@*/null',esc(json.dumps((js/'architecture.js').read_text(encoding='utf-8'))))
    html=html.replace('/*@@JARDIN@@*/null',esc(json.dumps((aqui.parent/'jardin-motor.js').read_text(encoding='utf-8'))))
    html=html.replace('/*@@PARCHE@@*/',esc((aqui.parent/'jardin-parche.js').read_text(encoding='utf-8')))
out=pathlib.Path(sys.argv[1]); out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(html,encoding='utf-8')
