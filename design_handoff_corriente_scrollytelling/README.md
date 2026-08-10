# Handoff: Scrollytelling "La Ruta de la Corriente"

## Overview
Pieza narrativa de scroll ("scrollytelling") para un proyecto doctoral sobre conectividad marina: cómo las larvas de peces de arrecife cubanos viajan por la Corriente de Florida hasta EE. UU. y por la Corriente de Lazo hasta México. Un mapa náutico animado a pantalla completa hace de escenario; la cámara vuela sobre el Golfo de México mientras 13 tarjetas-capítulo aparecen sincronizadas con el scroll.

## About the Design Files
Los archivos de este paquete son **referencias de diseño creadas en HTML** — un prototipo funcional que muestra el aspecto y comportamiento previstos, no código de producción para copiar tal cual. La tarea es **recrear este diseño en el entorno del proyecto destino** (React, Vue, Svelte, vanilla…) usando sus patrones y librerías. Si aún no existe entorno, una implementación vanilla JS + D3 como la del prototipo es perfectamente válida y la más directa; en React, el canvas/mapa debería vivir fuera del ciclo de render (ref + rAF loop).

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciados, textos y coreografía de cámara son finales. El prototipo `corriente.html` es funcional al 100 % y sirve como especificación ejecutable: ante cualquier duda, el comportamiento del prototipo es la verdad.

## Arquitectura general
- `#space`: div vacío de **2400vh** que crea la pista de scroll. Todo lo visible es `position: fixed`.
- `#stage`: escenario fijo a viewport completo con capas (de atrás adelante):
  1. `canvas#flow` — mapa, isóbatas, corrientes de partículas, peces y remolinos (todo se dibuja en un solo canvas por frame).
  2. `#labels` — etiquetas geográficas como divs absolutos reproyectados cada frame.
  3. `#vignette` — viñeta radial oscura en bordes.
  4. `#grain` — SVG feTurbulence a opacidad .04 (textura de grano).
- HUD fijo: barra de progreso superior (2px, gradiente oro→coral), cabecera mono ("Proyecto doctoral · Conectividad marina" / "Carta № 04 · Golfo de México"), lectura de coordenadas abajo-izquierda, brújula abajo-derecha.
- Progreso `prog = scrollY / (scrollHeight − innerHeight)` ∈ [0,1] gobierna TODO: cámara, tarjetas, flujos.

## Design Tokens
Colores (CSS custom properties):
- `--sea: #0B2334`, `--sea-deep: #071826` — fondo del mar (body: gradiente radial `#10344C → --sea 45% → --sea-deep`)
- `--land: #EDE3CC` (relleno de tierra), `--land-line: #B99C6B` (costa)
- `--ink: #F2E9D8` (texto claro), `--ink-dim: #B9C6CE` (texto secundario)
- `--gold: #E4A84D` (acento principal, corriente Florida), `--coral: #E2725B`, `--teal: #5FC2C0` (corriente mexicana/retorno)
- `--paper: #F4ECDB`, `--paper-ink: #22303A` (tarjetas)
- Etiquetas de agua `#7FA0B0`, tierra `#A8BCC7`, ciudades `#D8CBAE`, profundidad `#6F93A6`, glow de costa `#6FA3BC`

Tipografía (Google Fonts):
- **Cormorant Garamond** (500/600, itálica) — titulares y etiquetas de tierra/agua
- **Source Serif 4** (400/600) — cuerpo
- **IBM Plex Mono** (400/500) — HUD, kickers, ciudades, chips (siempre uppercase + letter-spacing amplio: .12–.45em)

Escalas: título h1 `clamp(44px, 7.5vw, 104px)`; h2 tarjeta 30px; cuerpo tarjeta 15px/1.65; kicker 10px; chips: cifra 26px Cormorant + etiqueta 9.5px mono.

## Pantallas / Estados

### Portada (`#title`, prog 0–0.05)
- Centrada, fija, con **scrim radial** para legibilidad sobre el mapa: `radial-gradient(closest-side at 50% 50%, rgba(7,24,38,.92) 0%, .78 52%, .35 76%, transparent 100%)` + `text-shadow: 0 2px 24px rgba(4,14,22,.9)` en h1 y subtítulo.
- Eyebrow mono oro ("Expedición · Cuba → Florida → México"), h1 con "corriente" en itálica oro, subtítulo, hint con animación `bob` (translateY 0→9px, 2.4s).
- Mientras la portada es visible las etiquetas del mapa están casi apagadas: opacidad de etiquetas ×(0.06 + 0.94·ramp(prog, 0.05, 0.14)).

### Tarjetas-capítulo (12)
Estilo común: papel `linear-gradient(160deg, #F4ECDB, #E9DEC6)`, borde `1px rgba(120,95,50,.35)`, doble filete interior via inset box-shadows, sombra `0 30px 60px -20px rgba(0,0,0,.6)`, 380px de ancho (560px la central), padding 28/30px. Kicker mono ocre `#9A6B2F`, h2 Cormorant 30px, cuerpo, y grid 2×1 de "chips" (cifra grande + etiqueta mono, `border-top: 2px solid --gold`).
Posición: alternan `left` (left:4vw) / `right` (right:4vw), centradas verticalmente; la final es `center`. En ≤720px todas pasan a bottom-sheet centrado.
Aparición: fade + slide-up 26px, ligado a prog (no a IntersectionObserver): `fade(prog, a, b, .035)` = rampa lineal de 0.035 de margen en cada extremo.

Rangos (id, inicio, fin) y contenido exacto — ver el HTML para los textos completos:
1. `ch1` 0.075–0.135 · Cap I · El desove — "Todo comienza en Cuba" · chips: 12 especies / 3 sitios
2. `ch2` 0.16–0.22 · Cap II · La corriente — "Un río dentro del mar" · 2 m/s / 26–29 °C
3. `ch3` 0.245–0.30 · Cap III · La travesía — "A la deriva, 500 km" · ~500 km / 14–28 días
4. `chm` 0.325–0.38 · Cap IV · La criba — "Uno entre diez mil" · <0,01 % / 21 días
5. `ch4` 0.405–0.46 · Cap V · La llegada — "Costas de la Florida" · 68 % / 5 zonas
6. `chr` 0.485–0.545 · Cap VI · El retorno — "Un viaje de ida y vuelta" · 2 direcciones / ~15 %
7. `chl` 0.575–0.635 · Cap VII · La Corriente de Lazo — "Tormentas bajo el mar" · 300 km / 6–11 meses
8. `ch5` 0.66–0.715 · Cap VIII · La ruta mexicana · ~1 400 km / 3 países
9. `chp` 0.765–0.82 · Cap IX · El refugio — "Jardines de la Reina" · 600+ cayos / 1996
10. `chc` 0.85–0.90 · Cap X · Un equilibrio frágil — "Si la corriente se frena" · −20–25 % AMOC / 3 países
11. `chmet` 0.925–0.96 · Cap XI · El método — "Cómo se sigue a una larva" · 1/25° / 3 líneas
12. `ch6` 0.98–1.01 · Final (central) — "Detrás del estudio", con hueco circular de 104px para foto de la investigadora (drag & drop, componente `image-slot.js`).

Nota: los datos del estudio son ilustrativos (placeholder); los de remolinos, Jardines de la Reina y AMOC provienen de fuentes públicas.

## El mapa
- **Proyección**: Mercator (d3.geoMercator) ajustada con `fitExtent` al bounding box lon −97…−64, lat 15…37, con 4–6 % de margen.
- **Datos**: TopoJSON `world-atlas@2.0.2/countries-50m.json` (CDN jsDelivr), filtrado a países dentro del bbox + EE. UU. Convertido a Path2D una sola vez; re-render por frame con transform de cámara (translate + scale del contexto).
- **Estilo de tierra**: relleno `#EDE3CC`, trazo `#B99C6B` 1px, "glow" de costa: 3 trazos `#6FA3BC` de 11/5.5/2.4 px a alpha .07/.12/.2 detrás del relleno.
- **Graticule**: paso 5°, `#C9DCE5` a alpha .12, 0.5px.
- **Isóbatas (batimetría estilizada)**: 3 lazos cerrados suavizados (quadraticCurveTo por puntos medios), trazo discontinuo `[6,5]` `#7FA0B0` alpha .26 — cuenca del Golfo exterior e interior, y fosa de Caimán. Coordenadas en `ISOBATHS` del HTML.
- **Etiquetas** (`LABELS` en el HTML, ~27): cada una con lon/lat, clase (`water` itálica espaciada / `land` versal espaciada / `city` mono con "◦ " oro / `site` mono oro con "◆ " / `depth` mono itálica azulada), tamaño base y rango de zoom [kmin, kmax] en el que es visible. Tamaño de fuente escala suavemente con el zoom.

## La cámara
- Keyframes `[prog, lon, lat, zoom]` (20 puntos, ver `KEYS` en el HTML), interpolados con smoothstep; el zoom se interpola en espacio logarítmico.
- Suavizado adicional de persecución exponencial por frame: `e = 1 − 0.0018^(dt/1000)` (≈ media vida de 100 ms).
- Ruta: vista general → NO de Cuba → estrecho → Cayos → SE Florida → vuelta al estrecho (retorno) → centro del Golfo (remolinos) → oeste de México → Bahía de Campeche → sur de Cuba (Jardines de la Reina) → vista general final.
- Lectura de coordenadas inferior-izquierda se actualiza con el centro de cámara y el zoom (formato `23°08′ N · 82°21′ O · ×3.4`).

## Corrientes, peces y remolinos (canvas)
- **3 corrientes** como splines Catmull-Rom densificadas y re-muestreadas a 420 puntos con normales precalculadas:
  - S1 Corriente de Florida (Caribe → estrecho → SE Florida), 380 partículas oro `rgba(228,168,77,α)`, aparece en prog 0.17–0.24 y permanece.
  - S3 Retorno (Cayos → oeste → costa NO de Cuba), 220 partículas teal, visible solo ~0.46–0.60.
  - S2 Ruta mexicana (estrecho de Yucatán → giro del Golfo → Tamaulipas → Campeche), 300 partículas teal, aparece 0.63–0.70 y permanece.
- **Partículas**: avanzan por la spline con offset normal aleatorio dentro de una banda cuyo semiancho varía con la posición (`6 + 10·sin(π·u)`); se dibujan como segmentos cortos (trail 0.6–2 % de la ruta), alpha mayor en el eje de la banda.
- **Peces**: 5–7 por corriente, dibujados proceduralmente (cuerpo con curvas cuadráticas, cola articulada con "wiggle" sinusoidal, ojo). Su posición a lo largo de la ruta está ligada al scroll (`travel = ramp(prog, a, b)`), con balanceo temporal. Tamaño ∝ zoom (14·K, clamp 18–58px). Colores oro/coral (S1), teal/oro (S2, S3).
- **Remolinos** (Corriente de Lazo): 3 centros `EDDIES` con radio en grados; 46 arcos por remolino orbitando (velocidad angular mayor en el interior), trazos oro con alpha máxima en el anillo r≈0.72R. Visibles prog 0.56–0.92.
- **Optimización clave**: el rAF loop hace early-return cuando la cámara está quieta y no hay flujos activos (compara una clave `lon,lat,k,prog` redondeada).

## Interacciones
- **Scroll** = única navegación; `scroll-behavior: auto`.
- **Brújula** (SVG fijo abajo-derecha, 86px): la aguja (grupo `#needle`, transform-origin 43px 43px) **sigue el cursor**: en `pointermove` se calcula `atan2(dx, −dy)` desde el centro de la brújula, normalizando el delta a ±180° para girar siempre por el camino corto; `transition: transform .15s ease-out`.
- **Hueco de foto** en la tarjeta final: drag & drop de imagen, persiste en localStorage (`image-slot.js`, id `retrato`, forma círculo).
- **Loading**: overlay mono "Trazando la carta náutica…" que se desvanece al cargar el TopoJSON.
- **Resize**: re-fit de proyección y reconstrucción de splines/Path2D.
- Enlaces: `a { color: var(--gold) }`, hover coral.

## Responsive (≤720px)
Tarjetas como bottom-sheet centrado (bottom 18px), padding y tipografía reducidos (h2 24px, p 14px), HUD 9px, brújula a escala .7.

## Assets
- Sin imágenes bitmap; todo procedural (canvas + SVG mínimo). Mapa base: `world-atlas@2.0.2` (CDN). Fuentes: Google Fonts. `image-slot.js` (incluido) para el hueco de foto.

## Files
- `corriente.html` — prototipo completo y autocontenido (especificación ejecutable).
- `image-slot.js` — web component del hueco de imagen drag & drop.
