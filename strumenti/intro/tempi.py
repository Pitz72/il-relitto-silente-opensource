# I tempi dell'intro: ogni testo resta fermo almeno 0,35 s per parola + 2 s, mai
# meno di 4 s; dissolvenze di entrata 1,2 s e di uscita 1,0 s.
import json, sys
sys.stdout.reconfigure(encoding="utf-8")

ENTRA, ESCE = 1.2, 1.0

def fermo(testo):
    parole = len(testo.split())
    return max(4.0, round(0.35 * parole + 2.0, 2)), parole

T = 0.0
righe = []          # (scena, inizio, fine, che cosa)
testi = []          # (blocco, testo, parole, entra, pieno, esce, fine)

def segna(scena, durata, cosa):
    global T
    righe.append((scena, round(T, 2), round(T + durata, 2), cosa))
    T += durata

def testo(nome, frase, pausa_dopo=0.0, accanto=None, fermo_fisso=None):
    """Un blocco: entra, sta fermo, esce. Con «accanto» si aggiunge sotto al blocco
    precedente, che resta (attenuato) finché escono insieme."""
    global T
    h, n = fermo(frase)
    if fermo_fisso is not None:
        h = fermo_fisso
    entra = T
    pieno = T + ENTRA
    fine_fermo = pieno + h
    testi.append({"blocco": nome, "testo": frase, "parole": n, "fermo": h, "entra": round(entra, 2),
                  "pieno": round(pieno, 2), "esce": round(fine_fermo, 2), "via": round(fine_fermo + ESCE, 2)})
    T = fine_fermo
    return fine_fermo

# --- A. LA TRACCIA, prima parte ----------------------------------------------------
inizio_A = T
segna("A", 2.2, "buio; a 0,8 s entra il fruscio della traccia")
segna("A", 0.8, "la spia verde si accende (un clic)")
testo("B0", "Scatola nera di una tuta extraveicolare. Traccia recuperata, integrità parziale.")
T += ESCE + 0.9
testo("B1", "«…la spia è verde. Allora registra. Facciamo finta che registri.")
T += ESCE + 0.9
testo("B2", "L’acqua è finita ieri. Il riscaldamento stanotte.")
T += ESCE + 0.9
testo("B3", "L’aria la conto ancora, ma la conto male:")
testo("B4", "i numeri mi arrivano tardi, uno alla volta, e lo so cosa vuol dire.")
T += ESCE
segna("A", 3.0, "IL BATTITO: la spia pulsa con un cuore che rallenta; il fruscio si assottiglia")
fine_A = T

# --- B. IL MARGINE ---------------------------------------------------------------------
inizio_B = T
segna("B", 2.5, "mentre il battito si ferma, la spia sfuoca e diventa una stella; il cielo si apre; silenzio")
segna("B", 1.0, "la Santa Maria entra da sinistra; entra il re (musica)")
testo("B5", "Ho firmato tutte le carte che servivano per partire da solo.")
testo("B6", "Ci tenevo tanto.")
T += ESCE + 1.0
fine_B = T

# --- C. IL RADAR -------------------------------------------------------------------------
segna("C", 6.2, "il radar della console: due giri del fascio, un settore muto")
segna("C", 1.6, "fuoco che passa dallo schermo all'oblò")
segna("C", 5.0, "nell'oblò quattro stelle si spengono, una dopo l'altra")
# --- D. IL FARO ----------------------------------------------------------------------------
segna("D", 1.8, "esterno: la Santa Maria di tre quarti, il nero davanti")
segna("D", 5.6, "il faro di prua si accende e si perde nel buio; un soffio di brusio alla radio")
segna("D", 1.6, "il fascio resta acceso; stacco")
# --- E. LA SCALA ----------------------------------------------------------------------------
segna("E", 23.5, "la scala: dalla poppa a 95 m fino a 16 km; la nave diventa un punto davanti al fuso (si ferma a 23 s)")
# --- F. LA TRACCIA, seconda parte (camera ferma sul quadro finale) -----------------------------
segna("F", 0.0, "il fruscio della traccia è tornato da 2 s; la spia verde riappare accanto al testo")
testo("B7", "Qui dentro c’è una cosa viva.")
T += ESCE + 0.6
testo("B8", "Sta dietro un vetro, a mezzo metro da me.")
T += ESCE + 0.6
testo("B9", "La vedo pulsare. Non la so aprire.»")
T += ESCE + 0.6
testo("B10", "Fine della traccia.")
T += ESCE
segna("F", 1.0, "la spia si spegne con il fruscio: silenzio")
# --- G. IL TITOLO -------------------------------------------------------------------------------
segna("G", 1.8, "nel nero del fuso compaiono i glifi, uno alla volta")
segna("G", 3.0, "la matrice li traduce: IL RELITTO SILENTE")
# il cartello del titolo resta fermo quanto nello storyboard: il sottotitolo è cambiato (l'autore,
# 19 ottobre 2026), i tempi dell'intro no
testo("T", "IL RELITTO SILENTE Una storia tratta da Il Registro della Santa Maria", fermo_fisso=6.55)
T += ESCE
# --- H. LA PLANCIA ---------------------------------------------------------------------------------
segna("H", 1.2, "il fuso nell'oblò della plancia (raccordo)")
segna("H", 3.2, "la camera arretra nella plancia")
segna("H", 3.0, "l'interfaccia d'acciaio si accende pezzo per pezzo; le bande si aprono a 16:9")
segna("H", 1.6, "il testo della plancia; i pulsanti; la partita comincia")

print(json.dumps({"durata": round(T, 2), "testi": testi, "righe": righe}, ensure_ascii=False, indent=1))
