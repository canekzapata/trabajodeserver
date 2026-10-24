# Cuerpo de acción · sonda de Schelleng e histéresis

Canek Zapata · 24 de octubre de 2026. Es la sonda previa al instrumento. No hay
sonido para escuchar ni página: solo el modelo de la cuerda frotada y lo que
mide.

## Modelo

- **La cuerda:** una guía de ondas con periodo de 200 muestras (240 Hz a
  48 kHz). Los extremos reflejan con −1, una pérdida de 0,995 y un paso bajo de
  un polo.
- **El arco:** está a una distancia β del puente. La fricción depende de la
  velocidad relativa (tipo Stribeck): μ = μd + (μs − μd)·v₀/(v₀ + |Δv|), con
  μs = 0,8, μd = 0,3 y v₀ = 0,02.
- **El contacto,** como en McIntyre–Schumacher–Woodhouse: queda pegado mientras
  |2Z(v_b − v_h)| ≤ μs·F. Al despegar, salta a la raíz más lejana; mientras
  desliza, sigue la raíz más cercana a la anterior.
- **El régimen se mide en la señal,** no se declara:
  - deslizamientos por periodo;
  - correlación normalizada en el retardo del periodo;
  - con eso se clasifica en pegado, Helmholtz (un deslizamiento por periodo,
    periódico), varios deslizamientos o aperiódico.

```sh
node mapa.mjs          # mapa medido en 6 posiciones × 33 fuerzas, con v_b = 0,05 y 0,1
node histeresis.mjs    # rampa de fuerza que sube y baja en β = 0,13
```

## Lo que mostró (24 oct)

Leyenda del mapa: `·` pegado, `2` dos deslizamientos, `s` otro número,
`H` Helmholtz, `x` aperiódico.

- **La isla de Helmholtz existe, y se encoge al acercarse al puente.**
  - Con v_b = 0,1: F ∈ [0,16; 1,58] en β = 0,28, y F ∈ [5,0; 6,3] en β = 0,04.
  - Debajo de la isla hay una región ancha de **dos deslizamientos por
    periodo**; encima, una región **aperiódica**.
- **Escalado con la velocidad del arco, como predice Schelleng:** al duplicar
  v_b, las dos fronteras se duplican en casi todas las posiciones (2,00). La
  rejilla de fuerzas avanza en pasos de 26 %, así que 2,51 y 3,16 son el
  escalón siguiente, no otra ley.
- **Escalado con la posición, a medias:**
  - F_min se acerca a β⁻²: pendiente medida −2,17 y −1,75.
  - F_max es **menos empinada** que β⁻¹: pendiente −0,73 y −0,77.

  El modelo de fricción y las pérdidas de esta cuerda no son las de las
  hipótesis de Schelleng. Es un resultado, no un error que corregir a mano.
- **Hay histéresis en las dos fronteras.** En β = 0,13, con v_b = 0,1:

  | Al subir la fuerza | Al bajarla |
  |---|---|
  | La nota aparece en F ≈ 0,95 | Se recupera desde el régimen aperiódico solo en F ≈ 2,08 |
  | Se rompe en F ≈ 2,89 | Persiste hasta F = 0,3, mucho por debajo del umbral en que apareció |

  Una vez establecida, la nota se sostiene con menos fuerza de la que hizo
  falta para encontrarla. Esa memoria del cuerpo es material de composición.

## Límites

- **Dos anomalías del barrido:**
  - Un punto H aislado en β = 0,13 y F = 0,016, con v_b = 0,05. Es un falso
    positivo del clasificador con muy poca energía.
  - La razón de 50 en esa misma posición sale de ese punto.

  Para el instrumento, la frontera debe tomarse de la isla contigua más grande.
- **Lo que esta versión no tiene todavía:** cerdas elásticas (LuGre o
  elastoplástico), cuerpo de cinco comarcas, raspado ni sonido. Aún no se mide
  el afilamiento de la esquina ni la bajada de altura cerca de F_max.
- **Fuentes de memoria:** Schelleng (1973) y McIntyre, Schumacher y Woodhouse
  (1983).
