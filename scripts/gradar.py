"""Gradación común de las fotos de la web.

Toda foto pasa por la misma receta para que parezcan de la misma casa aunque
vengan de sitios distintos: sombras hacia el marrón del toldo, luces hacia la
cal de la fachada y un poco menos de saturación. Si el bar pasa fotos propias,
se meten en FOTOS y salen con la misma luz.

    python scripts/gradar.py
"""
from pathlib import Path
from PIL import Image, ImageEnhance

RAIZ = Path(__file__).resolve().parent.parent
TOLDO = (0x3A, 0x2E, 0x25)
CAL = (0xEE, 0xE9, 0xE0)

# (origen, destino sin extensión, recorte relativo x0,y0,x1,y1)
FOTOS = [
    ('scripts/fuentes/pexels-1731826-original.jpg', 'assets/img/terraza', (0.10, 0.0, 0.88, 1.0)),
]
ANCHOS = (1600, 900)


def gradar(im):
    im = im.convert('RGB')
    im = ImageEnhance.Color(im).enhance(0.82)
    im = ImageEnhance.Contrast(im).enhance(1.06)
    gris = im.convert('L')
    # duotono toldo → cal, mezclado al 34 % sobre la foto
    lut = [[int(TOLDO[c] + (CAL[c] - TOLDO[c]) * (v / 255)) for v in range(256)] for c in range(3)]
    duo = Image.merge('RGB', [gris.point(lut[c]) for c in range(3)])
    return Image.blend(im, duo, 0.34)


for origen, destino, caja in FOTOS:
    im = Image.open(RAIZ / origen)
    w, h = im.size
    im = im.crop((int(caja[0] * w), int(caja[1] * h), int(caja[2] * w), int(caja[3] * h)))
    im = gradar(im)
    for ancho in ANCHOS:
        alto = round(im.height * ancho / im.width)
        salida = RAIZ / f'{destino}-{ancho}.jpg'
        im.resize((ancho, alto), Image.LANCZOS).save(salida, quality=80, optimize=True, progressive=True)
        print(salida.relative_to(RAIZ), ancho, 'x', alto)
