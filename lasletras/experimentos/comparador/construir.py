# Arma el comparador publicable: la plantilla con el motor (rng + corpus + architecture + typewriter)
# en línea. Uso: python3 construir.py DESTINO/index.html  (las fuentes se publican
# aparte desde lasletras/fonts/ con la ruta fonts/…).
import pathlib, sys
aqui=pathlib.Path(__file__).parent; js=aqui.parent.parent/'js'
motor='\n'.join((js/f).read_text(encoding='utf-8') for f in ['rng.js','corpus.js','architecture.js','typewriter.js'])
motor=motor.replace('</script','<\\/script')
out=pathlib.Path(sys.argv[1]); out.parent.mkdir(parents=True,exist_ok=True)
out.write_text((aqui/'plantilla.html').read_text(encoding='utf-8').replace('/*@@MOTOR@@*/',motor),encoding='utf-8')
