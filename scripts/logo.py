"""Logotipo PROVISIONAL de Bar Nizabel, sacado del rótulo de la fachada.

El bar no tiene logo. Su toldo dice «CAFÉ · COPAS  NIZABEL» en una grotesca
condensada, y el mural de dentro pone «CAFÉ · COPAS» encima de «NIZABEL» con
un punto rojo en medio. Este script compone ese mismo orden con Antonio
(OFL, Google Fonts), la condensada más cercana al rótulo, y convierte las
letras en trazados para que el SVG no dependa de ninguna fuente instalada.

    python scripts/logo.py

Escribe:
    assets/logo-nizabel.svg         crema sobre transparente (para fondo oscuro)
    assets/logo-nizabel-oscuro.svg  marrón toldo sobre transparente (para fondo claro)
    assets/logo-nizabel-ficha.svg   versión en una línea, como el toldo
    assets/favicon.svg              «N» + punto sobre marrón toldo
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

RAIZ = Path(__file__).resolve().parent.parent
FUENTE = RAIZ / 'scripts' / 'fuentes' / 'Antonio-variable.ttf'

TOLDO = '#3A2E25'
CAL = '#EEE9E0'
PUNTO = '#C8473A'


def instancia(peso):
    f = TTFont(FUENTE)
    return instantiateVariableFont(f, {'wght': peso})


def componer(fuente, texto, alto_mayus, x0, y_base, tracking=0.0):
    """Devuelve (d, ancho) de un texto con la altura de mayúscula pedida."""
    gs = fuente.getGlyphSet()
    cmap = fuente.getBestCmap()
    upm = fuente['head'].unitsPerEm
    cap = fuente['OS/2'].sCapHeight or upm * 0.7
    esc = alto_mayus / cap
    pen = SVGPathPen(gs)
    x = x0
    for i, c in enumerate(texto):
        nombre = cmap[ord(c)]
        g = gs[nombre]
        g.draw(TransformPen(pen, (esc, 0, 0, -esc, x, y_base)))
        x += g.width * esc
        if i < len(texto) - 1:
            x += tracking * alto_mayus
    return pen.getCommands(), x - x0


def ancho_de(fuente, texto, alto_mayus, tracking=0.0):
    return componer(fuente, texto, alto_mayus, 0, 0, tracking)[1]


def tracking_para(fuente, texto, alto_mayus, ancho_objetivo):
    """Tracking (en fracciones de mayúscula) que hace medir al texto lo pedido."""
    base = ancho_de(fuente, texto, alto_mayus)
    return (ancho_objetivo - base) / ((len(texto) - 1) * alto_mayus)


def svg(ancho, alto, cuerpo, titulo):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {ancho:.1f} {alto:.1f}" '
            f'width="{ancho:.0f}" height="{alto:.0f}" role="img" aria-labelledby="t">'
            f'<title id="t">{titulo}</title>{cuerpo}</svg>\n')


def apilado(color):
    fina = instancia(500)
    gruesa = instancia(700)
    alto_nombre = 100.0
    ancho_nombre = ancho_de(gruesa, 'NIZABEL', alto_nombre, 0.035)
    d_nombre, _ = componer(gruesa, 'NIZABEL', alto_nombre, 0, 162, 0.035)

    # Arriba: «CAFÉ» + punto + «COPAS», con el mismo ancho que NIZABEL.
    alto_arriba = 30.0
    hueco = alto_arriba * 1.25          # sitio del punto
    t = 0.14
    for _ in range(30):                 # ajusta el tracking hasta cuadrar anchos
        a1 = ancho_de(fina, 'CAFÉ', alto_arriba, t)
        a2 = ancho_de(fina, 'COPAS', alto_arriba, t)
        total = a1 + a2 + hueco * 2
        t += (ancho_nombre - total) / (7 * alto_arriba) * 0.8
    d1, a1 = componer(fina, 'CAFÉ', alto_arriba, 0, 46, t)
    x2 = a1 + hueco * 2
    d2, a2 = componer(fina, 'COPAS', alto_arriba, x2, 46, t)
    cx = a1 + hueco
    punto = f'<circle cx="{cx:.1f}" cy="{46 - alto_arriba / 2:.1f}" r="{alto_arriba * 0.2:.1f}" fill="{PUNTO}"/>'
    cuerpo = (f'<g fill="{color}"><path d="{d1}"/><path d="{d2}"/><path d="{d_nombre}"/></g>{punto}')
    return svg(ancho_nombre, 168, cuerpo, 'Nizabel · Café · Copas (logotipo provisional)')


def en_linea(color):
    """Como el toldo: CAFÉ · COPAS   NIZABEL en una sola línea."""
    fina = instancia(500)
    gruesa = instancia(700)
    alto = 40.0
    d1, a1 = componer(fina, 'CAFÉ', alto, 0, 54, 0.05)
    hueco = alto * 0.55
    d2, a2 = componer(fina, 'COPAS', alto, a1 + hueco * 2, 54, 0.05)
    x3 = a1 + hueco * 2 + a2 + alto * 0.9
    d3, a3 = componer(gruesa, 'NIZABEL', alto, x3, 54, 0.06)
    punto = f'<circle cx="{a1 + hueco:.1f}" cy="{54 - alto / 2:.1f}" r="{alto * 0.13:.1f}" fill="{PUNTO}"/>'
    cuerpo = f'<g fill="{color}"><path d="{d1}"/><path d="{d2}"/><path d="{d3}"/></g>{punto}'
    return svg(x3 + a3, 60, cuerpo, 'Café · Copas · Nizabel (logotipo provisional)')


def favicon():
    gruesa = instancia(700)
    alto = 44.0
    ancho_n = ancho_de(gruesa, 'N', alto)
    x = (64 - ancho_n - 13) / 2
    d, _ = componer(gruesa, 'N', alto, x, 32 + alto / 2, 0)
    cuerpo = (f'<rect width="64" height="64" rx="14" fill="{TOLDO}"/>'
              f'<path d="{d}" fill="{CAL}"/>'
              f'<circle cx="{x + ancho_n + 7.5:.1f}" cy="{32 + alto / 2 - 5.6:.1f}" r="5.6" fill="{PUNTO}"/>')
    return svg(64, 64, cuerpo, 'Nizabel')


if __name__ == '__main__':
    (RAIZ / 'assets' / 'logo-nizabel.svg').write_text(apilado(CAL), encoding='utf8')
    (RAIZ / 'assets' / 'logo-nizabel-oscuro.svg').write_text(apilado(TOLDO), encoding='utf8')
    (RAIZ / 'assets' / 'logo-nizabel-ficha.svg').write_text(en_linea(CAL), encoding='utf8')
    (RAIZ / 'assets' / 'favicon.svg').write_text(favicon(), encoding='utf8')
    print('logotipos escritos en assets/')
