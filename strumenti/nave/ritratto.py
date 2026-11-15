# ============================================================================
#  Il ritratto della Santa Maria: la nave di tre quarti dal davanti, su fondo
#  trasparente, per le copertine e per il sito (al posto di prua.webp, lo still
#  generato di una volta). Una nave sola per tutti i progetti (documento 40).
#
#  Due passi, DOPO modello.py (apre il suo file):
#    blender --background --factory-startup --python strumenti/nave/ritratto.py -- [--campioni 160] [--prova]
#        rende grafica/nave/santa-maria-tre-quarti-grezza.png (4000×1750, RGBA; fuori da git)
#    python strumenti/nave/ritratto.py
#        la taglia sulla nave e scrive grafica/nave/santa-maria-tre-quarti.webp (quella che usano le copertine)
#
#  La luce: il sole quasi da dietro la macchina, un poco da destra e dall'alto,
#  così il muso e il fianco si leggono anche quando la nave è piccola; una
#  schiarita fredda da dietro stacca il dorso dal cielo; il mondo dà appena un
#  filo di luce alle ombre. Il chiaroscuro da sinistra lo aggiunge componi.py.
#  L'oblò, i fanali e il faro restano accesi come nel modello.
# ============================================================================
import math
import sys
from pathlib import Path

try:
    import bpy
    from mathutils import Matrix, Vector
except ImportError:  # il secondo passo, fuori da Blender
    bpy = None

QUI = Path(__file__).resolve().parent
RADICE = QUI.parents[1]
BLEND = QUI / "uscita" / "santa-maria.blend"
USCITA = RADICE / "grafica" / "nave"
Z = Vector((0, 0, 1)) if bpy else None

DA = (-0.86, -0.48, 0.19)  # da dove si guarda: il muso e il fianco sinistro, un poco dall'alto
LENTE = 110


def main():
    argomenti = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    campioni = int(argomenti[argomenti.index("--campioni") + 1]) if "--campioni" in argomenti else 128
    prova = "--prova" in argomenti
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    sc = bpy.context.scene
    nave = bpy.data.collections["Santa Maria"]
    macchina, sole, schiarita = sc.camera, bpy.data.objects["sole"], bpy.data.objects["schiarita"]

    sc.cycles.samples = 32 if prova else campioni
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = (1600, 700) if prova else (4000, 1750)
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.image_settings.color_depth = "16"
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"

    # la macchina: tutta la nave nel quadro, con poco margine (il taglio lo fa dopo l'immagine)
    punti = [o.matrix_world @ Vector(c) for o in nave.objects for c in o.bound_box]
    centro = Vector([(min(p[i] for p in punti) + max(p[i] for p in punti)) / 2 for i in range(3)])
    d = -Vector(DA).normalized()
    destra = d.cross(Z).normalized()
    alto = destra.cross(d)
    formato = sc.render.resolution_x / sc.render.resolution_y
    macchina.data.type, macchina.data.lens, macchina.data.clip_end = "PERSP", LENTE, 3000
    macchina.rotation_euler = Matrix((destra, alto, -d)).transposed().to_euler()
    mezzo = (macchina.data.sensor_width / 2) / macchina.data.lens
    for _ in range(5):
        lati = [((p - centro).dot(destra), (p - centro).dot(alto), (p - centro).dot(d)) for p in punti]
        t = max(max(abs(a) / mezzo, abs(b) * formato / mezzo) * 1.05 - e for a, b, e in lati)
        xs = [a / (e + t) for a, b, e in lati]
        ys = [b / (e + t) for a, b, e in lati]
        centro = centro + destra * ((min(xs) + max(xs)) / 2 * t) + alto * ((min(ys) + max(ys)) / 2 * t)
    macchina.location = centro - d * t

    # le luci: il sole da sinistra in alto e un poco da davanti; la schiarita fredda da dietro a destra
    def verso(v):
        return v.normalized().to_track_quat("-Z", "Y").to_euler()
    sole.rotation_euler = verso(d * 0.85 - destra * 0.25 - alto * 0.50)
    sole.data.energy, sole.data.angle = 4.0, math.radians(2)
    schiarita.rotation_euler = verso(-d * 0.75 - destra * 0.55 - alto * 0.25)
    schiarita.data.energy = 2.6
    # il mondo: niente cielo azzurro sullo scafo, solo un filo di luce fredda per le ombre
    mondo = sc.world
    for n in mondo.node_tree.nodes:
        if n.type == "BACKGROUND" and n.inputs["Strength"].default_value < 0.9:
            n.inputs["Strength"].default_value = 0.12

    USCITA.mkdir(parents=True, exist_ok=True)
    grezza = USCITA / ("prova-grezza.png" if prova else "santa-maria-tre-quarti-grezza.png")
    sc.render.filepath = str(grezza)
    bpy.ops.render.render(write_still=True)
    print("RITRATTO", grezza)


def taglia():
    """Il secondo passo: la nave tagliata con un margine di 12 punti, in webp con la trasparenza."""
    import numpy as np
    from PIL import Image
    img = Image.open(USCITA / "santa-maria-tre-quarti-grezza.png").convert("RGBA")
    ys, xs = np.where(np.asarray(img)[..., 3] > 2)
    m = 12
    box = (max(0, xs.min() - m), max(0, ys.min() - m), min(img.width, xs.max() + m + 1), min(img.height, ys.max() + m + 1))
    img.crop(box).save(USCITA / "santa-maria-tre-quarti.webp", quality=92, method=6)
    print("TAGLIATA", box)


if bpy:
    main()
else:
    taglia()
