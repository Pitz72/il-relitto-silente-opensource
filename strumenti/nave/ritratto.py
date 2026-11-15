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
import json
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
sys.path.insert(0, str(QUI))
BLEND = QUI / "uscita" / "santa-maria.blend"
USCITA = RADICE / "grafica" / "nave"
Z = Vector((0, 0, 1)) if bpy else None

# Le riprese. «da»: da dove si guarda, rispetto al centro della nave; «sole» e «schiarita»: verso dove va la luce,
# nella terna della macchina (avanti, destra, alto); «quadro»: la misura del render grezzo.
RIPRESE = {
    # il muso e il fianco sinistro, un poco dall'alto: le copertine orizzontali e il sito
    "tre-quarti": dict(da=(-0.86, -0.48, 0.19), lente=110, sole=(0.85, -0.25, -0.50), forza=4.0,
                       schiarita=(-0.75, -0.55, -0.25), forza_schiarita=2.6, quadro=(4000, 1750)),
    # da dietro e dall'alto, la nave che va incontro al relitto: il poster. Il sole radente da sinistra sul dorso,
    # la schiarita fredda da davanti che disegna il contorno
    "verso-il-relitto": dict(da=(0.86, 0.40, 0.24), lente=100, sole=(-0.45, 0.55, -0.70), forza=4.2,
                             schiarita=(0.60, -0.70, 0.10), forza_schiarita=0.9, quadro=(3600, 2000)),
}


def main():
    argomenti = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    campioni = int(argomenti[argomenti.index("--campioni") + 1]) if "--campioni" in argomenti else 128
    prova = "--prova" in argomenti
    nome = argomenti[argomenti.index("--ripresa") + 1] if "--ripresa" in argomenti else "tre-quarti"
    r = RIPRESE[nome]
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    sc = bpy.context.scene
    nave = bpy.data.collections["Santa Maria"]
    macchina, sole, schiarita = sc.camera, bpy.data.objects["sole"], bpy.data.objects["schiarita"]

    sc.cycles.samples = 32 if prova else campioni
    sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = tuple(v // 2 for v in r["quadro"]) if prova else r["quadro"]
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.image_settings.color_depth = "16"
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"

    # la macchina: tutta la nave nel quadro, con poco margine (il taglio lo fa dopo l'immagine)
    punti = [o.matrix_world @ Vector(c) for o in nave.objects for c in o.bound_box]
    centro = Vector([(min(p[i] for p in punti) + max(p[i] for p in punti)) / 2 for i in range(3)])
    d = -Vector(r["da"]).normalized()
    destra = d.cross(Z).normalized()
    alto = destra.cross(d)
    formato = sc.render.resolution_x / sc.render.resolution_y
    macchina.data.type, macchina.data.lens, macchina.data.clip_end = "PERSP", r["lente"], 3000
    macchina.rotation_euler = Matrix((destra, alto, -d)).transposed().to_euler()
    mezzo = (macchina.data.sensor_width / 2) / macchina.data.lens
    for _ in range(5):
        lati = [((p - centro).dot(destra), (p - centro).dot(alto), (p - centro).dot(d)) for p in punti]
        t = max(max(abs(a) / mezzo, abs(b) * formato / mezzo) * 1.05 - e for a, b, e in lati)
        xs = [a / (e + t) for a, b, e in lati]
        ys = [b / (e + t) for a, b, e in lati]
        centro = centro + destra * ((min(xs) + max(xs)) / 2 * t) + alto * ((min(ys) + max(ys)) / 2 * t)
    macchina.location = centro - d * t

    # le luci, nella terna della macchina
    def verso(v):
        a, b, c = v
        return (d * a + destra * b + alto * c).normalized().to_track_quat("-Z", "Y").to_euler()
    sole.rotation_euler = verso(r["sole"])
    sole.data.energy, sole.data.angle = r["forza"], math.radians(2)
    schiarita.rotation_euler = verso(r["schiarita"])
    schiarita.data.energy = r["forza_schiarita"]
    # il mondo: niente cielo azzurro sullo scafo, solo un filo di luce fredda per le ombre
    mondo = sc.world
    for n in mondo.node_tree.nodes:
        if n.type == "BACKGROUND" and n.inputs["Strength"].default_value < 0.9:
            n.inputs["Strength"].default_value = 0.12

    USCITA.mkdir(parents=True, exist_ok=True)
    grezza = USCITA / (f"prova-{nome}-grezza.png" if prova else f"santa-maria-{nome}-grezza.png")
    sc.render.filepath = str(grezza)
    bpy.ops.render.render(write_still=True)
    # dove cadono nel quadro la lente del faro, un punto 60 metri avanti lungo il fascio, e gli scarichi:
    # chi compone il poster ci disegna il fascio e la brace
    from bpy_extras.object_utils import world_to_camera_view
    import misure as M
    fx0, fx1 = M.FARO["x"]
    asse = Vector((-1, 0, -0.07)).normalized()
    lente = Vector((fx1 - 0.05, 0, sum(M.FARO["z"]) / 2 + 0.06)) + asse * (fx1 - fx0 - 0.1)
    Lx, Ly = sc.render.resolution_x, sc.render.resolution_y

    def nel_quadro(p):
        v = world_to_camera_view(sc, macchina, p)
        return [round(v.x * Lx, 1), round((1 - v.y) * Ly, 1)]
    punti = {"faro": nel_quadro(lente), "fascio": nel_quadro(lente + asse * 60),
             "scarichi": [nel_quadro(Vector((M.LUNGHEZZA + 0.3, y, M.SCARICHI["z"]))) for y in M.SCARICHI["y"]]}
    grezza.with_suffix(".json").write_text(json.dumps(punti, indent=1), encoding="utf-8")
    print("RITRATTO", grezza, punti)


def taglia(nome):
    """Il secondo passo: la nave tagliata con un margine di 12 punti, in webp con la trasparenza; i punti del faro e
    degli scarichi, spostati del taglio, nel .json accanto."""
    import numpy as np
    from PIL import Image
    grezza = USCITA / f"santa-maria-{nome}-grezza.png"
    img = Image.open(grezza).convert("RGBA")
    ys, xs = np.where(np.asarray(img)[..., 3] > 2)
    m = 12
    box = tuple(int(v) for v in (max(0, xs.min() - m), max(0, ys.min() - m), min(img.width, xs.max() + m + 1), min(img.height, ys.max() + m + 1)))
    img.crop(box).save(USCITA / f"santa-maria-{nome}.webp", quality=92, method=6)
    if grezza.with_suffix(".json").exists():
        p = json.loads(grezza.with_suffix(".json").read_text(encoding="utf-8"))
        sposta = lambda q: [round(q[0] - box[0], 1), round(q[1] - box[1], 1)]  # noqa: E731
        p = {"faro": sposta(p["faro"]), "fascio": sposta(p["fascio"]), "scarichi": [sposta(q) for q in p["scarichi"]],
             "misura": [box[2] - box[0], box[3] - box[1]]}
        (USCITA / f"santa-maria-{nome}.json").write_text(json.dumps(p, indent=1) + chr(10), encoding="utf-8", newline=chr(10))
    print("TAGLIATA", nome, box)


if bpy:
    main()
else:
    taglia(sys.argv[1] if len(sys.argv) > 1 else "tre-quarti")
