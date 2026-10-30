# La trascrizione di una ripresa della voce di L.V. (documento 09, §13): faster-whisper, parola per parola,
# con i tempi. Serve a tagliare i pezzi di VOCE in app/src/intro/scaletta.ts e a trovare le indicazioni che
# il modello di sintesi legge ad alta voce («lunga pausa», «molta pausa» nella ripresa «Elio»); poi, sull'intro
# resa da rendi_intro, a controllare che ci siano tutte le frasi e nessuna indicazione.
#   python strumenti/intro/trascrivi.py <file.wav> <uscita.json>
# Il modello large-v3 gira sul processore (int8); la prima volta si scarica nella cache di Hugging Face.
import json
import sys

from faster_whisper import WhisperModel

modello = WhisperModel("large-v3", device="cpu", compute_type="int8")
segmenti, info = modello.transcribe(sys.argv[1], language="it", word_timestamps=True, vad_filter=False, beam_size=5,
                                    condition_on_previous_text=False)
parole = []
for s in segmenti:
    print(f"[{s.start:6.2f} – {s.end:6.2f}] {s.text}")
    for w in s.words:
        parole.append({"t0": round(w.start, 2), "t1": round(w.end, 2), "p": w.word.strip(), "prob": round(w.probability, 2)})
json.dump(parole, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(parole), "parole")
