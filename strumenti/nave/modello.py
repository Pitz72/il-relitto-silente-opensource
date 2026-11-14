# ============================================================================
#  Il modello della Santa Maria (documento 40): lo scafo e le sue parti,
#  costruiti in Blender dalla tabella delle misure (misure.py), la stessa da
#  cui nascono le schematiche (documento 39). Qui non c'è nessun numero della
#  nave che non venga dalla tabella: ci sono solo gli spessori dei pezzi.
#
#  Si lancia da Blender, senza finestra (5.2 LTS):
#    blender --background --factory-startup --python strumenti/nave/modello.py -- [--viste] [--solo NOME] [--campioni 128]
#  Scrive strumenti/nave/uscita/santa-maria.blend (fuori da git: si rifà da qui)
#  e, con --viste, le immagini in progettazione/40-modello/viste/.
#
#  Gli assi sono quelli della tabella: x da prua (0) a poppa (80), y dal fianco
#  sinistro (negativa) al destro (positiva), z l'altezza. Un'unità è un metro.
#
#  La forma viene tutta dalla tabella. La superficie dello scafo è una
#  tessitura dipinta da superficie.py (le lamiere, le toppe, i rivetti, lo
#  stencil consumato della matricola, le fasce arancioni): va fatta prima,
#      python strumenti/nave/superficie.py
#  e dove cade ogni suo punto lo dice pelle.py. Se manca, lo scafo esce di un
#  grigio solo. Le luci hanno ognuna il suo materiale («luce …»), così dopo
#  si accendono e si rendono separate.
# ============================================================================
import math
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector

QUI = Path(__file__).resolve().parent
sys.path.insert(0, str(QUI))
import misure as M  # noqa: E402
import pelle as P  # noqa: E402

RADICE = QUI.parents[1]
USCITA = QUI / "uscita"
VISTE = RADICE / "progettazione" / "40-modello" / "viste"

ARCO = 10  # i tratti di ogni spigolo tondo dello scafo
Z = Vector((0, 0, 1))


# ============================================================================
#  Lo scafo, in numeri: la sezione nel punto x e la sua superficie
# ============================================================================
def sezione(x):
    """Mezza larghezza, dorso, chiglia e raggio degli spigoli nel punto x (come nelle schematiche)."""
    w, su, giu = M.mezza(x), M.dorso(x), M.chiglia(x)
    return w, su, giu, min(M.RAGGIO, w * 0.8, (su - giu) * 0.4)


def fianco(x, z):
    """Quanto è largo mezzo scafo all'altezza z: dove sta la pelle del fianco."""
    w, su, giu, r = sezione(x)
    d = max(z - (su - r), (giu + r) - z, 0.0)
    return (w - r) + math.sqrt(max(r * r - d * d, 0.0))


def sopra(x, y):
    """L'altezza del dorso alla distanza y dal mezzo."""
    w, su, _, r = sezione(x)
    d = max(abs(y) - (w - r), 0.0)
    return (su - r) + math.sqrt(max(r * r - d * d, 0.0))


def sotto(x, y):
    """L'altezza della chiglia alla distanza y dal mezzo."""
    w, _, giu, r = sezione(x)
    d = max(abs(y) - (w - r), 0.0)
    return (giu + r) - math.sqrt(max(r * r - d * d, 0.0))


def anello(x):
    """I punti (y, z) della sezione nel punto x: un rettangolo dagli spigoli tondi (l'ordine lo decide pelle.py)."""
    return P.anello(*sezione(x), ARCO)


def stazioni():
    """Dove si taglia lo scafo: fitto a prua, dove cambia forma, e a ogni gomito dei tre profili."""
    xs = {x for profilo in (M.MEZZA_LARGHEZZA, M.DORSO, M.CHIGLIA) for x, _ in profilo}
    xs.update(i * 0.5 for i in range(25))
    xs.update(float(x) for x in range(12, int(M.LUNGHEZZA) + 1, 2))
    return sorted(xs)


def gomiti():
    """I punti dove un profilo piega: lì lo scafo ha uno spigolo vero."""
    return {x for profilo in (M.MEZZA_LARGHEZZA, M.DORSO, M.CHIGLIA) for x, _ in profilo[1:-1]}


# ============================================================================
#  Gli attrezzi: materiali e pezzi
# ============================================================================
def colore(esadecimale):
    """Da «#rrggbb» (come si scrive) alla terna lineare che vuole Blender."""
    def lineare(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    h = esadecimale.lstrip("#")
    return tuple(lineare(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4))


def materiale(nome, tinta, metallo=0.0, ruvido=0.6, luce=None, forza=0.0):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*colore(tinta), 1)
    b.inputs["Metallic"].default_value = metallo
    b.inputs["Roughness"].default_value = ruvido
    if luce:
        b.inputs["Emission Color"].default_value = (*colore(luce), 1)
        b.inputs["Emission Strength"].default_value = forza
    return m


def principale(m):
    return next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def presa(nodo, nome, tipo):
    """L'ingresso di un nodo con quel nome e quel tipo (il nodo «Mix» ne ha tre con lo stesso nome)."""
    return next(s for s in nodo.inputs if s.name == nome and s.type == tipo)


def materiale_pelle():
    """Lo scafo: la tessitura dipinta da superficie.py (colore, ruvido, metallo, rilievo)."""
    if not (USCITA / "pelle-colore.png").exists():
        print("MANCA la pelle: prima «python strumenti/nave/superficie.py». Lo scafo esce di un grigio solo.")
        return materiale("scafo", "#8b9199", 0.35, 0.58)
    m = bpy.data.materials.new("scafo")
    m.use_nodes = True
    nodi, fili, b = m.node_tree.nodes, m.node_tree.links, principale(m)

    def immagine(nome, dato=True):
        n = nodi.new("ShaderNodeTexImage")
        n.image = bpy.data.images.load(str(USCITA / f"pelle-{nome}.png"))
        n.interpolation = "Cubic"
        if dato:
            n.image.colorspace_settings.name = "Non-Color"
        return n.outputs["Color"]
    fili.new(immagine("colore", False), b.inputs["Base Color"])
    fili.new(immagine("ruvido"), b.inputs["Roughness"])
    fili.new(immagine("metallo"), b.inputs["Metallic"])
    urto = nodi.new("ShaderNodeBump")
    urto.inputs["Strength"].default_value, urto.inputs["Distance"].default_value = 1.0, 0.04
    fili.new(immagine("rilievo"), urto.inputs["Height"])
    fili.new(urto.outputs["Normal"], b.inputs["Normal"])
    return m


def consumato(nome, tinta, metallo=0.45, ruvido=0.55, grana=0.9):
    """Il metallo dei pezzi: la tinta, con le macchie di chi sta fuori da novant'anni."""
    m = materiale(nome, tinta, metallo, ruvido)
    nodi, fili, b = m.node_tree.nodes, m.node_tree.links, principale(m)
    dove = nodi.new("ShaderNodeTexCoord")
    macchie, fine = nodi.new("ShaderNodeTexNoise"), nodi.new("ShaderNodeTexNoise")
    macchie.inputs["Scale"].default_value, macchie.inputs["Detail"].default_value = grana, 8.0
    fine.inputs["Scale"].default_value, fine.inputs["Detail"].default_value = grana * 14, 4.0
    for n in (macchie, fine):
        fili.new(dove.outputs["Object"], n.inputs["Vector"])
    peso = nodi.new("ShaderNodeMath")
    peso.operation = "MULTIPLY"
    peso.inputs[1].default_value = 0.25
    fili.new(fine.outputs[0], peso.inputs[0])
    somma = nodi.new("ShaderNodeMath")
    somma.operation = "MULTIPLY_ADD"  # le macchie larghe per tre quarti, la grana fine per un quarto
    somma.inputs[1].default_value = 0.75
    fili.new(macchie.outputs[0], somma.inputs[0])
    fili.new(peso.outputs["Value"], somma.inputs[2])
    scala = nodi.new("ShaderNodeMapRange")
    scala.inputs["From Min"].default_value, scala.inputs["From Max"].default_value = 0.3, 0.7
    fili.new(somma.outputs["Value"], scala.inputs["Value"])
    mescola = nodi.new("ShaderNodeMix")
    mescola.data_type = "RGBA"
    c = colore(tinta)
    presa(mescola, "A", "RGBA").default_value = (c[0] * 0.5, c[1] * 0.5, c[2] * 0.52, 1)
    presa(mescola, "B", "RGBA").default_value = (min(c[0] * 1.3, 1), min(c[1] * 1.3, 1), min(c[2] * 1.28, 1), 1)
    fili.new(scala.outputs["Result"], presa(mescola, "Factor", "VALUE"))
    fili.new(next(s for s in mescola.outputs if s.type == "RGBA"), b.inputs["Base Color"])
    aspro = nodi.new("ShaderNodeMapRange")
    aspro.inputs["To Min"].default_value, aspro.inputs["To Max"].default_value = ruvido + 0.18, ruvido - 0.12
    fili.new(scala.outputs["Result"], aspro.inputs["Value"])
    fili.new(aspro.outputs["Result"], b.inputs["Roughness"])
    return m


def celle(nome, tinta):
    """Le celle di un pannello solare: il vetro scuro, e il reticolo chiaro fra una cella e l'altra (ogni 40 cm)."""
    m = materiale(nome, tinta, 0.3, 0.22)
    nodi, fili, b = m.node_tree.nodes, m.node_tree.links, principale(m)
    dove, assi = nodi.new("ShaderNodeTexCoord"), nodi.new("ShaderNodeSeparateXYZ")
    fili.new(dove.outputs["Object"], assi.inputs["Vector"])
    righe = []
    for asse in ("X", "Z"):
        passo, resto, sottile = nodi.new("ShaderNodeMath"), nodi.new("ShaderNodeMath"), nodi.new("ShaderNodeMath")
        passo.operation, resto.operation, sottile.operation = "MULTIPLY", "FRACT", "LESS_THAN"
        passo.inputs[1].default_value, sottile.inputs[1].default_value = 2.5, 0.05
        fili.new(assi.outputs[asse], passo.inputs[0])
        fili.new(passo.outputs["Value"], resto.inputs[0])
        fili.new(resto.outputs["Value"], sottile.inputs[0])
        righe.append(sottile.outputs["Value"])
    reticolo = nodi.new("ShaderNodeMath")
    reticolo.operation = "MAXIMUM"
    fili.new(righe[0], reticolo.inputs[0])
    fili.new(righe[1], reticolo.inputs[1])
    mescola = nodi.new("ShaderNodeMix")
    mescola.data_type = "RGBA"
    presa(mescola, "A", "RGBA").default_value = (*colore(tinta), 1)
    presa(mescola, "B", "RGBA").default_value = (*colore("#8d96a3"), 1)
    fili.new(reticolo.outputs["Value"], presa(mescola, "Factor", "VALUE"))
    fili.new(next(s for s in mescola.outputs if s.type == "RGBA"), b.inputs["Base Color"])
    return m


def oggetto(nome, bm, mat):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    ob = bpy.data.objects.new(nome, me)
    NAVE.objects.link(ob)
    return ob


def scatola(nome, x0, x1, y0, y1, z0, z1, mat, smusso=0.03):
    """Un pezzo squadrato, con gli spigoli appena smussati perché prendano la luce."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((x0 + (v.co.x + 0.5) * (x1 - x0), y0 + (v.co.y + 0.5) * (y1 - y0), z0 + (v.co.z + 0.5) * (z1 - z0)))
    smusso = min(smusso, 0.3 * min(abs(x1 - x0), abs(y1 - y0), abs(z1 - z0)))
    if smusso > 0.004:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=smusso, segments=2, affect="EDGES", profile=0.5)
    return oggetto(nome, bm, mat)


def prisma(nome, contorno, z0, z1, mat, smusso=0.04):
    """Un contorno in pianta (x, y), alzato da z0 a z1."""
    bm = bmesh.new()
    base = bm.faces.new([bm.verts.new((x, y, z0)) for x, y in contorno])
    alto = bmesh.ops.extrude_face_region(bm, geom=[base])
    bmesh.ops.translate(bm, vec=(0, 0, z1 - z0), verts=[g for g in alto["geom"] if isinstance(g, bmesh.types.BMVert)])
    if smusso:
        bmesh.ops.bevel(bm, geom=bm.edges[:], offset=smusso, segments=2, affect="EDGES", profile=0.5)
    return oggetto(nome, bm, mat)


def asta(nome, da, a, raggio, mat, lati=12):
    """Un tubo pieno fra due punti: staffe, alberi, puntoni."""
    return aste(nome, [(da, a)], raggio, mat, lati)


def aste(nome, tratti, raggio, mat, lati=8):
    """Molti tubi in un pezzo solo: corrimano, pioli, condotti."""
    bm = bmesh.new()
    for da, a in tratti:
        da, a = Vector(da), Vector(a)
        d = a - da
        giro = Matrix.Translation((da + a) / 2) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=lati, radius1=raggio, radius2=raggio, depth=d.length, matrix=giro)
    for f in bm.faces:
        f.smooth = len(f.verts) == 4
    for e in bm.edges:
        e.smooth = all(len(f.verts) == 4 for f in e.link_faces)
    return oggetto(nome, bm, mat)


def tornio(nome, origine, direzione, profilo, mat, spicchi=40):
    """Un pezzo tornito: il profilo (quanto avanti lungo l'asse, quale raggio) girato intorno all'asse."""
    o, d = Vector(origine), Vector(direzione).normalized()
    u = d.orthogonal().normalized()
    v = d.cross(u)
    bm = bmesh.new()
    anelli = []
    for t, r in profilo:
        if r < 1e-6:
            anelli.append([bm.verts.new(o + d * t)])
        else:
            anelli.append([bm.verts.new(o + d * t + (u * math.cos(a) + v * math.sin(a)) * r) for a in (2 * math.pi * i / spicchi for i in range(spicchi))])
    for a, b in zip(anelli, anelli[1:]):
        for i in range(spicchi):
            j = (i + 1) % spicchi
            if len(a) == 1 and len(b) == 1:
                continue
            f = bm.faces.new((a[0], b[i], b[j]) if len(a) == 1 else (a[i], a[j], b[0]) if len(b) == 1 else (a[i], a[j], b[j], b[i]))
            f.smooth = True
    for giro in anelli:  # il profilo resta a spigolo vivo; il giro è liscio
        if len(giro) > 1:
            for i in range(spicchi):
                bm.edges.get((giro[i], giro[(i + 1) % spicchi])).smooth = False
    return oggetto(nome, bm, mat)


def disco(nome, centro, direzione, raggio, mat):
    return tornio(nome, centro, direzione, [(0, 0), (0, raggio)], mat)


# ============================================================================
#  La nave
# ============================================================================
def scafo(mat):
    bm = bmesh.new()
    pelle = bm.loops.layers.uv.new("pelle")
    xs = stazioni()
    anelli = [[bm.verts.new((x, y, z)) for y, z in anello(x)] for x in xs]
    n = len(anelli[0])
    giro = P.giro_anello(ARCO)

    def posa(angolo, punto):
        angolo[pelle].uv = (punto[0] / P.LARGA, punto[1] / P.ALTA)
    for xa, xb, a, b in zip(xs, xs[1:], anelli, anelli[1:]):
        for i in range(n):
            j = (i + 1) % n
            f = bm.faces.new((a[i], a[j], b[j], b[i]))
            f.smooth = True
            for angolo, (x, s) in zip(f.loops, ((xa, giro[i]), (xa, giro[i + 1]), (xb, giro[i + 1]), (xb, giro[i]))):
                posa(angolo, P.punto_scafo(x, s))
    for angolo in bm.faces.new(anelli[0]).loops:  # la faccia del muso
        posa(angolo, P.punto_muso(angolo.vert.co.y, angolo.vert.co.z))
    for angolo in bm.faces.new(anelli[-1]).loops:  # la piastra di poppa
        posa(angolo, P.punto_poppa(angolo.vert.co.y, angolo.vert.co.z))
    vivi = gomiti() | {xs[0], xs[-1]}
    for x, anello_x in zip(xs, anelli):
        if x in vivi:
            for i in range(n):
                bm.edges.get((anello_x[i], anello_x[(i + 1) % n])).smooth = False
    chiuso = all(len(e.link_faces) == 2 for e in bm.edges)
    ob = oggetto("scafo", bm, mat)
    lati = [max(v.co[i] for v in ob.data.vertices) - min(v.co[i] for v in ob.data.vertices) for i in range(3)]
    print(f"SCAFO {lati[0]:.1f} × {lati[1]:.1f} × {lati[2]:.1f} m, {len(ob.data.polygons)} facce, {'chiuso' if chiuso else 'APERTO'}")
    return ob


def prua(m):
    o = M.OBLO
    r = o["diametro"] / 2
    centro = (o["x"], o["y"], o["z"])
    tornio("oblò: ghiera", centro, (-1, 0, 0), [(-0.05, r + 0.17), (0.14, r + 0.17), (0.14, r), (-0.02, r)], m["pezzi"])
    disco("oblò: vetro", (o["x"] - 0.04, o["y"], o["z"]), (-1, 0, 0), r, m["luce oblò"])
    # l'oblò piccolo della cuccetta, sul fianco sinistro
    c = M.OBLO_CUCCETTA
    r = c["diametro"] / 2
    y = -fianco(c["x"], c["z"])
    tornio("oblò della cuccetta: ghiera", (c["x"], y, c["z"]), (0, -1, 0), [(-0.05, r + 0.07), (0.05, r + 0.07), (0.05, r), (-0.02, r)], m["pezzi"], 24)
    disco("oblò della cuccetta: vetro", (c["x"], y - 0.015, c["z"]), (0, -1, 0), r, m["luce oblò"])
    # il modulo delle comunicazioni: un'aggiunta sul fianco destro, che segue lo scafo e ne sporge appena
    s = M.STANZE["comunicazioni"]
    xs = [s[0] + (s[1] - s[0]) * i / 6 for i in range(7)]
    contorno = [(x, M.mezza(x) - 0.3) for x in xs] + [(x, M.mezza(x) + 0.45) for x in reversed(xs)]
    prisma("modulo delle comunicazioni", contorno, s[4] - 0.1, s[5] + 0.1, m["aggiunte"], 0.05)
    # i due arpioni, sotto il muso
    a = M.ARPIONI
    x0, x1 = a["x"]
    r = a["diametro"] / 2
    for i, y in enumerate(a["y"]):
        nome = f"arpione {'sinistro' if y < 0 else 'destro'}"
        tornio(nome + ": tubo", (x1, y, a["z"]), (-1, 0, 0), [(0, r), (x1 - x0, r), (x1 - x0, r - 0.08), (x1 - x0 - 0.35, r - 0.08)], m["pezzi"], 24)
        tornio(nome + ": punta", (x1, y, a["z"]), (-1, 0, 0), [(x1 - x0 - 0.4, 0.09), (x1 - x0 + 0.1, 0.09), (x1 - x0 + 0.28, 0)], m["scuro"], 16)
        scatola(nome + ": staffa", x0 + 0.35, x0 + 0.7, y - 0.12, y + 0.12, a["z"] + r - 0.05, sotto(x0 + 0.5, y) + 0.15, m["pezzi"], 0.02)


def dorso(m):
    # il faro di prua: una base, una forcella, la lampada che guarda avanti e appena in giù
    fx0, fx1 = M.FARO["x"]
    fz0, fz1 = M.FARO["z"]
    r = M.FARO["largo"] / 2
    mezzo = (fz0 + fz1) / 2
    scatola("faro: base", fx0 + 0.4, fx1 - 0.1, -0.55, 0.55, sopra(fx0 + 0.4, 0) - 0.1, mezzo - r * 0.6, m["pezzi"], 0.04)
    for lato in (-1, 1):
        scatola(f"faro: forcella {'sinistra' if lato < 0 else 'destra'}", fx0 + 0.75, fx0 + 1.25, lato * (r - 0.06), lato * (r + 0.06), mezzo - r * 0.75, mezzo + 0.12, m["pezzi"], 0.02)
    lungo = fx1 - fx0 - 0.1
    asse = (-1, 0, -0.07)
    tornio("faro: lampada", (fx1 - 0.05, 0, mezzo + 0.06), asse,
           [(0, 0), (0, r * 0.5), (0.3, r * 0.8), (lungo - 0.45, r * 0.86), (lungo, r), (lungo, r - 0.07), (lungo - 0.3, r * 0.8)], m["pezzi"])
    disco("faro: lente", Vector((fx1 - 0.05, 0, mezzo + 0.06)) + Vector(asse).normalized() * (lungo - 0.3), asse, r * 0.8, m["luce faro"])
    # il radar: una barra che gira, in cima al suo albero
    x, z = M.RADAR["x"], M.RADAR["z"]
    su = sopra(x, 0)
    scatola("radar: piede", x - 0.35, x + 0.35, -0.35, 0.35, su - 0.05, su + 0.25, m["pezzi"], 0.03)
    asta("radar: albero", (x, 0, su + 0.2), (x, 0, z - 0.1), 0.09, m["pezzi"])
    barra = scatola("radar: barra", -M.RADAR["diametro"] / 2, M.RADAR["diametro"] / 2, -0.14, 0.14, -0.13, 0.13, m["aggiunte"], 0.04)
    barra.location, barra.rotation_euler = (x, 0, z), (0, 0, math.radians(24))
    # il collare di presa: la piastra, l'anello e i quattro denti dove il bacino la prende
    cx0, cx1 = M.COLLARE["x"]
    cz0, cz1 = M.COLLARE["z"]
    largo = M.COLLARE["largo"] / 2
    mx = (cx0 + cx1) / 2
    scatola("collare: piastra", cx0, cx1, -largo, largo, cz0 - 0.08, cz0 + 0.14, m["aggiunte"], 0.04)
    tornio("collare: anello", (mx, 0, cz0 + 0.14), (0, 0, 1), [(0, largo * 0.82), (cz1 - cz0 - 0.14, largo * 0.82), (cz1 - cz0 - 0.14, largo * 0.55), (0, largo * 0.55)], m["pezzi"], 48)
    for sx in (-1, 1):
        for sy in (-1, 1):
            scatola("collare: dente", mx + sx * 1.3 - 0.2, mx + sx * 1.3 + 0.2, sy * (largo - 0.25) - 0.2, sy * (largo - 0.25) + 0.2, cz0 + 0.1, cz1 - 0.1, m["pezzi"], 0.03)
    # l'antenna della radio a lungo raggio
    x, z = M.ANTENNA["x"], M.ANTENNA["z"]
    su = sopra(x, 0)
    scatola("antenna: piede", x - 0.25, x + 0.25, -0.25, 0.25, su - 0.05, su + 0.3, m["pezzi"], 0.03)
    asta("antenna: albero", (x, 0, su + 0.25), (x, 0, z), 0.05, m["pezzi"], 10)
    for quota, mezza in ((z - 0.45, 0.35), (z - 0.95, 0.55), (z - 1.45, 0.75)):
        asta("antenna: braccio", (x, -mezza, quota), (x, mezza, quota), 0.025, m["pezzi"], 8)


def fianchi(m):
    # i pannelli solari: quattro per fianco, fissi, su staffe corte; due sono di ricambio, di un'altra tinta
    p = M.PANNELLI
    z0, z1 = p["z"]
    ricambi = {(-1, 1), (1, 3)}
    for lato in (-1, 1):
        nome_lato = "sinistro" if lato < 0 else "destro"
        y = lato * (M.mezza(40) + p["staffa"])
        for i, x0 in enumerate(p["x"]):
            x1 = x0 + p["lungo"]
            nome = f"pannello {nome_lato} {i + 1}"
            scatola(nome + ": telaio", x0, x1, y - 0.08, y + 0.08, z0, z1, m["telaio"], 0.03)
            celle = m["celle di ricambio"] if (lato, i) in ricambi else m["celle"]
            scatola(nome + ": celle", x0 + 0.14, x1 - 0.14, y + lato * 0.07, y + lato * 0.1, z0 + 0.14, z1 - 0.14, celle, 0)
            scatola(nome + ": traversa", x0 + 0.1, x1 - 0.1, y + lato * 0.07, y + lato * 0.13, (z0 + z1) / 2 - 0.04, (z0 + z1) / 2 + 0.04, m["telaio"], 0)
            scatola(nome + ": montante", (x0 + x1) / 2 - 0.04, (x0 + x1) / 2 + 0.04, y + lato * 0.07, y + lato * 0.13, z0 + 0.1, z1 - 0.1, m["telaio"], 0)
            for x in (x0 + 0.5, x1 - 0.5):  # le staffe: due braccia e un puntone
                for z in (z0 + 0.6, z1 - 0.6):
                    asta(nome + ": staffa", (x, lato * (fianco(x, z) - 0.05), z), (x, y - lato * 0.06, z), 0.07, m["pezzi"], 8)
                asta(nome + ": puntone", (x, lato * (fianco(x, z0 - 0.5) - 0.05), z0 - 0.5), (x, y - lato * 0.06, z0 + 0.6), 0.05, m["pezzi"], 8)
    # il portello di carico, sul fianco sinistro: chiuso, a due ante, con la fascia arancione intorno
    x0, x1 = M.PORTELLO_DI_CARICO["x"]
    z0, z1 = M.PORTELLO_DI_CARICO["z"]
    y = -M.mezza((x0 + x1) / 2)
    scatola("portello di carico: ante", x0, x1, y - 0.1, y + 0.05, z0, z1, m["portelli"], 0.05)
    scatola("portello di carico: battuta", (x0 + x1) / 2 - 0.06, (x0 + x1) / 2 + 0.06, y - 0.14, y, z0 + 0.05, z1 - 0.05, m["scuro"], 0.02)
    for x in (x0 + 1.0, x1 - 1.0):  # le due cerniere in alto e i due chiavistelli in basso
        scatola("portello di carico: cerniera", x - 0.35, x + 0.35, y - 0.2, y, z1 - 0.35, z1 - 0.05, m["pezzi"], 0.03)
        scatola("portello di carico: chiavistello", x - 0.2, x + 0.2, y - 0.2, y, z0 + 0.1, z0 + 0.6, m["pezzi"], 0.03)
    # il portello d'uscita, sul fianco destro a poppa: l'anta con il suo oblò, la luce gialla, la pedana
    x0, x1 = M.PORTELLO_USCITA["x"]
    z0, z1 = M.PORTELLO_USCITA["z"]
    mx = (x0 + x1) / 2
    y = M.mezza(mx)
    scatola("portello d'uscita: anta", x0, x1, y - 0.05, y + 0.09, z0, z1, m["portelli"], 0.04)
    tornio("portello d'uscita: ghiera", (mx, y + 0.09, z0 + 1.5), (0, 1, 0), [(0, 0.2), (0.04, 0.2), (0.04, 0.13), (0, 0.13)], m["pezzi"], 24)
    disco("portello d'uscita: vetro", (mx, y + 0.1, z0 + 1.5), (0, 1, 0), 0.13, m["scuro"])
    lx, lz = M.LUCE_USCITA["x"], M.LUCE_USCITA["z"]
    scatola("luce dell'uscita: scatola", lx - 0.2, lx + 0.2, y - 0.02, y + 0.12, lz - 0.14, lz + 0.14, m["pezzi"], 0.02)
    tornio("luce dell'uscita: lampada", (lx, y + 0.12, lz), (0, 1, 0), [(0, 0.11), (0.05, 0.1), (0.09, 0.06), (0.1, 0)], m["luce uscita"], 20)
    rx0, rx1 = M.RAMPA["x"]
    fuori = y + M.RAMPA["sporge"]
    scatola("pedana dell'uscita", rx0, rx1, y - 0.05, fuori, -0.25, 0.0, m["pezzi"], 0.03)
    for x in (rx0 + 0.15, rx1 - 0.15):
        asta("pedana dell'uscita: puntone", (x, y - 0.05, -1.3), (x, fuori - 0.15, -0.2), 0.06, m["pezzi"], 8)
        asta("pedana dell'uscita: paletto", (x, fuori - 0.08, 0.0), (x, fuori - 0.08, 1.05), 0.035, m["pezzi"], 8)
    asta("pedana dell'uscita: corrimano", (rx0 + 0.15, fuori - 0.08, 1.05), (rx1 - 0.15, fuori - 0.08, 1.05), 0.035, m["pezzi"], 8)


def poppa(m):
    x = M.LUNGHEZZA
    s = M.SCARICHI
    r = s["diametro"] / 2
    ys = s["y"]
    for i, y in enumerate(ys):  # quattro scarichi, in due coppie, a filo della piastra
        tornio(f"scarico {i + 1}", (x - 0.3, y, s["z"]), (1, 0, 0), [(0, r), (0.9, r), (0.9, r - 0.09), (0.3, r - 0.13)], m["scarichi"])
        disco(f"scarico {i + 1}: fondo", (x, y, s["z"]), (1, 0, 0), r - 0.13, m["luce scarichi"])
    for a, b in ((ys[0], ys[1]), (ys[2], ys[3])):
        scatola("scarichi: piastra", x - 0.05, x + 0.08, a - r - 0.15, b + r + 0.15, s["z"] - r - 0.12, s["z"] + r + 0.12, m["aggiunte"], 0.03)
    f = M.FANALI_POPPA
    for y in f["y"]:  # i due fanali d'ambra
        nome = f"fanale {'sinistro' if y < 0 else 'destro'}"
        tornio(nome, (x, y, f["z"]), (1, 0, 0), [(0, 0.24), (0.16, 0.24), (0.16, 0.17), (0.05, 0.17)], m["pezzi"], 24)
        tornio(nome + ": lampada", (x, y, f["z"]), (1, 0, 0), [(0.06, 0.17), (0.2, 0.13), (0.26, 0)], m["luce fanali"], 24)
    # il camminamento sotto la piastra, con i suoi puntoni
    p = M.PEDANA_POPPA
    mezza_pedana = M.mezza(x) - 0.9
    scatola("pedana di poppa", x - 0.05, x + p["sporge"], -mezza_pedana, mezza_pedana, p["z"] - 0.2, p["z"], m["pezzi"], 0.03)
    for y in (-mezza_pedana + 0.2, 0.0, mezza_pedana - 0.2):
        asta("pedana di poppa: puntone", (x - 0.05, y, p["z"] + 1.0), (x + p["sporge"] - 0.1, y, p["z"] - 0.05), 0.06, m["pezzi"], 8)


def particolari(m):
    """Quello che la tabella non dice e che fa di uno scafo una nave da lavoro: sul dorso le botole d'accesso e
    i due corrimano di chi ci cammina; lungo i fianchi un condotto con le sue fascette; le griglie della sala
    macchine; i pioli dall'uscita al dorso. Sono proposte (documento 40): l'autore le conferma o le toglie."""
    # le botole d'accesso, sul dorso
    for i, x in enumerate((25.0, 35.5, 49.0, 55.5, 63.0, 70.5)):
        y = 2.5 if i % 2 else -2.5
        su = sopra(x, y)
        scatola("botola del dorso", x - 0.7, x + 0.7, y - 0.7, y + 0.7, su - 0.05, su + 0.13, m["aggiunte"], 0.03)
        aste("botola del dorso: maniglia", [((x - 0.25, y + 0.45, su + 0.13), (x - 0.25, y + 0.45, su + 0.24)), ((x + 0.25, y + 0.45, su + 0.13), (x + 0.25, y + 0.45, su + 0.24)),
                                            ((x - 0.25, y + 0.45, su + 0.24), (x + 0.25, y + 0.45, su + 0.24))], 0.025, m["pezzi"])
    # i due corrimano del dorso, dal principio della stiva alla poppa
    x0, x1, passo = M.STANZE["stiva"][0], 76.0, 2.77
    for y in (-1.1, 1.1):
        tratti = [((x0, y, sopra(x0, y) + 0.55), (x1, y, sopra(x1, y) + 0.55))]
        x = x0
        while x <= x1 + 0.01:
            tratti.append(((x, y, sopra(x, y) - 0.02), (x, y, sopra(x, y) + 0.55)))
            x += passo
        aste(f"corrimano del dorso {'sinistro' if y < 0 else 'destro'}", tratti, 0.03, m["pezzi"])
    # il condotto lungo ogni fianco, sotto le aperture, con una fascetta ogni quattro metri
    z = -0.62
    for lato in (-1, 1):
        nome = f"condotto {'sinistro' if lato < 0 else 'destro'}"
        y = lato * (fianco(40, z) + 0.14)
        asta(nome, (M.STANZE["stiva"][0], y, z), (76.0, y, z), 0.11, m["pezzi"], 12)
        for x in range(22, 76, 4):
            scatola(nome + ": fascetta", x - 0.09, x + 0.09, y - lato * 0.16, y + lato * 0.14, z - 0.15, z + 0.15, m["aggiunte"], 0.02)
        # le griglie della sala macchine: un telaio e le sue lamelle
        gx0, gx1, gz0, gz1 = M.STANZE["sala macchine"][0] + 3.4, M.STANZE["sala macchine"][1] - 3.6, 3.3, 4.9
        pelle_y = lato * fianco(50, 4)
        scatola(f"griglia {'sinistra' if lato < 0 else 'destra'}: telaio", gx0, gx1, pelle_y - lato * 0.04, pelle_y + lato * 0.1, gz0, gz1, m["aggiunte"], 0.03)
        for k in range(8):
            zl = gz0 + 0.18 + k * (gz1 - gz0 - 0.36) / 7
            scatola(f"griglia {'sinistra' if lato < 0 else 'destra'}: lamella", gx0 + 0.12, gx1 - 0.12, pelle_y + lato * 0.08, pelle_y + lato * 0.16, zl - 0.05, zl + 0.05, m["scuro"], 0.0)
    # i pioli, dal portello d'uscita al dorso: sul fianco destro, poi sulla spalla
    x = M.PORTELLO_USCITA["x"][1] + 0.75
    w, su, _, r = sezione(x)
    tratti = []
    posti = [(w, z, 0.0) for z in [0.3 + 0.4 * i for i in range(int((su - r - 0.3) / 0.4) + 1)]]
    posti += [(w - r + r * math.cos(a), su - r + r * math.sin(a), a) for a in [math.radians(g) for g in range(10, 81, 10)]]
    for y, z, a in posti:
        fuori = Vector((0, math.cos(a), math.sin(a))) * 0.13
        qui = Vector((x, y, z))
        tratti += [(qui + Vector((-0.2, 0, 0)), qui + Vector((-0.2, 0, 0)) + fuori), (qui + Vector((0.2, 0, 0)), qui + Vector((0.2, 0, 0)) + fuori),
                   (qui + Vector((-0.2, 0, 0)) + fuori, qui + Vector((0.2, 0, 0)) + fuori)]
    aste("pioli dall'uscita al dorso", tratti, 0.022, m["pezzi"], 6)


def costruisci():
    global NAVE
    for blocco in (bpy.data.objects, bpy.data.meshes, bpy.data.lights, bpy.data.cameras, bpy.data.materials):
        for cosa in list(blocco):
            blocco.remove(cosa)
    NAVE = bpy.data.collections.new("Santa Maria")
    bpy.context.scene.collection.children.link(NAVE)
    m = {
        "scafo": materiale_pelle(),
        "aggiunte": consumato("aggiunte", "#737a84"),  # i pezzi messi dopo: un grigio diverso
        "pezzi": consumato("pezzi", "#565d68", 0.5),
        "portelli": consumato("portelli", "#6a7079", 0.5, 0.58, 0.5),
        "scuro": materiale("scuro", "#1a1e25", 0.3, 0.5),
        "scarichi": consumato("scarichi", "#3a3f47", 0.7, 0.42, 2.0),
        "telaio": consumato("telaio dei pannelli", "#4d545e", 0.5),
        "celle": celle("celle", "#16233b"),
        "celle di ricambio": celle("celle di ricambio", "#33415c"),
        # le luci, una per materiale: si accendono e si rendono separate
        "luce oblò": materiale("luce oblò", "#3a2c14", 0.0, 0.2, "#f2c46d", 6.0),
        "luce fanali": materiale("luce fanali", "#3a2c14", 0.0, 0.3, "#f2a94a", 12.0),
        "luce uscita": materiale("luce uscita", "#3a3414", 0.0, 0.3, "#ffe27a", 10.0),
        "luce faro": materiale("luce faro", "#2b2a26", 0.0, 0.1, "#fff1cf", 0.6),
        "luce scarichi": materiale("luce scarichi", "#0c0d10", 0.2, 0.6, "#bfe0ff", 0.0),  # spenta: la spinta viene dopo
    }
    scafo(m["scafo"])
    prua(m)
    dorso(m)
    fianchi(m)
    poppa(m)
    particolari(m)
    print(f"PEZZI {len(NAVE.objects)}, facce {sum(len(o.data.polygons) for o in NAVE.objects)}")


# ============================================================================
#  Le viste: la nave girata come nella tavola approvata, su fondo scuro
# ============================================================================
#  nome: (da dove si guarda, rispetto al centro della nave; prospettiva o no)
RIPRESE = {
    "1-da-prua-di-tre-quarti": ((-0.80, -0.56, 0.17), True),  # come la scena B dell'intro: il fianco sinistro
    "2-da-poppa-di-tre-quarti": ((0.80, 0.56, 0.15), True),  # come la scena E: la poppa e il fianco destro
    "3-fianco-sinistro": ((0, -1, 0), False),
    "4-fianco-destro": ((0, 1, 0), False),
    "5-muso": ((-1, 0, 0), False),
    "6-poppa": ((1, 0, 0), False),
    "7-dall-alto": ((-0.45, -0.5, 0.74), True),
    "8-da-sotto-a-prua": ((-0.72, 0.5, -0.36), True),
}


def scena(campioni):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    pref = bpy.context.preferences.addons["cycles"].preferences
    for tipo in ("OPTIX", "CUDA"):
        try:
            pref.compute_device_type = tipo
            pref.get_devices()
            for d in pref.devices:
                d.use = d.type == tipo
            if any(d.use for d in pref.devices):
                sc.cycles.device = "GPU"
                break
        except Exception:
            pass
    sc.cycles.samples = campioni
    sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y, sc.render.resolution_percentage = 1920, 1080, 100
    sc.render.image_settings.file_format = "PNG"
    # il cielo: scuro per chi guarda (come le tavole), un poco di luce fredda da ogni parte per le ombre
    mondo = bpy.data.worlds.new("fondo")
    mondo.use_nodes = True
    nodi, fili = mondo.node_tree.nodes, mondo.node_tree.links
    nodi.clear()
    esce, mescola, raggio = nodi.new("ShaderNodeOutputWorld"), nodi.new("ShaderNodeMixShader"), nodi.new("ShaderNodeLightPath")
    luce, fondo = nodi.new("ShaderNodeBackground"), nodi.new("ShaderNodeBackground")
    luce.inputs["Color"].default_value, luce.inputs["Strength"].default_value = (*colore("#aebbd6"), 1), 0.32
    fondo.inputs["Color"].default_value, fondo.inputs["Strength"].default_value = (*colore("#0a0f1a"), 1), 1.0
    fili.new(raggio.outputs["Is Camera Ray"], mescola.inputs["Fac"])
    fili.new(luce.outputs["Background"], mescola.inputs[1])
    fili.new(fondo.outputs["Background"], mescola.inputs[2])
    fili.new(mescola.outputs["Shader"], esce.inputs["Surface"])
    sc.world = mondo

    def lampada(nome, forza, tinta):
        dati = bpy.data.lights.new(nome, "SUN")
        dati.energy, dati.color, dati.angle = forza, colore(tinta), math.radians(3)
        ob = bpy.data.objects.new(nome, dati)
        sc.collection.objects.link(ob)
        return ob

    macchina = bpy.data.objects.new("macchina", bpy.data.cameras.new("macchina"))
    sc.collection.objects.link(macchina)
    sc.camera = macchina
    return macchina, lampada("sole", 4.2, "#fff6ea"), lampada("schiarita", 0.7, "#9fb6d9")


def inquadra(macchina, sole, schiarita, da, prospettiva, margine=1.06):
    """Mette la macchina a guardare la nave da una direzione, con tutta la nave nel quadro."""
    punti = [o.matrix_world @ Vector(c) for o in NAVE.objects for c in o.bound_box]
    centro = Vector([(min(p[i] for p in punti) + max(p[i] for p in punti)) / 2 for i in range(3)])
    d = -Vector(da).normalized()  # verso dove guarda la macchina
    destra = d.cross(Z).normalized()
    alto = destra.cross(d)
    sc = bpy.context.scene
    formato = sc.render.resolution_x / sc.render.resolution_y
    macchina.data.type = "PERSP" if prospettiva else "ORTHO"
    macchina.data.lens, macchina.data.clip_end = 70, 2000
    macchina.rotation_euler = Matrix((destra, alto, -d)).transposed().to_euler()
    if prospettiva:
        mezzo_campo = (macchina.data.sensor_width / 2) / macchina.data.lens
        for _ in range(4):  # quanto indietro perché entri tutta, e poi la si centra nel quadro
            lati = [((p - centro).dot(destra), (p - centro).dot(alto), (p - centro).dot(d)) for p in punti]
            t = max(max(abs(a) / mezzo_campo, abs(b) * formato / mezzo_campo) * margine - e for a, b, e in lati)
            xs = [a / (e + t) for a, b, e in lati]
            ys = [b / (e + t) for a, b, e in lati]
            centro = centro + destra * ((min(xs) + max(xs)) / 2 * t) + alto * ((min(ys) + max(ys)) / 2 * t)
        macchina.location = centro - d * t
    else:
        a = [p.dot(destra) for p in punti]
        b = [p.dot(alto) for p in punti]
        macchina.data.ortho_scale = max(max(a) - min(a), (max(b) - min(b)) * formato) * margine
        macchina.location = destra * ((min(a) + max(a)) / 2) + alto * ((min(b) + max(b)) / 2) + d * (min(p.dot(d) for p in punti) - 100)
    # il sole viene da dietro la macchina, da destra e dall'alto (nelle viste di tre quarti prende in pieno
    # il fianco, e lascia il muso o la poppa in mezza luce); la schiarita dall'altra parte
    sole.rotation_euler = (d * 0.62 - destra * 0.5 - alto * 0.6).normalized().to_track_quat("-Z", "Y").to_euler()
    schiarita.rotation_euler = (d * 0.45 + destra * 0.85 - alto * 0.1).normalized().to_track_quat("-Z", "Y").to_euler()


def main():
    argomenti = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    campioni = int(argomenti[argomenti.index("--campioni") + 1]) if "--campioni" in argomenti else 128
    solo = argomenti[argomenti.index("--solo") + 1] if "--solo" in argomenti else None
    costruisci()
    macchina, sole, schiarita = scena(campioni)
    USCITA.mkdir(exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(USCITA / "santa-maria.blend"))
    if "--viste" in argomenti:
        VISTE.mkdir(parents=True, exist_ok=True)
        for nome, (da, prospettiva) in RIPRESE.items():
            if solo and solo not in nome:
                continue
            inquadra(macchina, sole, schiarita, da, prospettiva)
            bpy.context.scene.render.filepath = str(VISTE / f"{nome}.png")
            bpy.ops.render.render(write_still=True)
            print("VISTA", nome)


main()
