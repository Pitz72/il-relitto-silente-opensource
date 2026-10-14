// Le prove della grammatica tipografica (src/gioco/lamina/grammatica.ts), su
// eventi scritti a mano con i testi veri del gioco. Il collaudo su tutti i
// percorsi è collaudo/tipografia.mjs.
//   node --test prove/grammatica.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  blocchiDelTurno,
  dritto,
  nascosto,
  ricostruisciEvento,
  segmenta,
  segnaNomi,
  tipografico,
  type Blocco,
} from "../src/gioco/lamina/grammatica.ts";
import type { Evento } from "../src/motore/tipi.ts";
import type { Suggerimento } from "../src/azione/suggerimenti.ts";

const testo = (t: string, stacco = false): Evento => ({ tipo: "testo", testo: t, ...(stacco ? { stacco } : {}) });
const fedele = (eventi: Evento[], blocchi: Blocco[]) =>
  eventi.forEach((e, i) => {
    if (!nascosto(e)) assert.equal(ricostruisciEvento(blocchi, i), e.testo, `evento ${i}`);
  });

test("gli apostrofi tipografici, solo a schermo, e il ritorno", () => {
  assert.equal(tipografico("L'aria l'hai"), "L’aria l’hai");
  assert.equal(dritto(tipografico("dell'anima")), "dell'anima");
});

test("la stanza: il nome senza le lineette", () => {
  const e: Evento[] = [{ tipo: "stanza", testo: "--- L'arca biologica ---", stacco: true, dati: { id: "arca biologica" } }];
  const [b] = blocchiDelTurno(e);
  assert.equal(b.tipo, "stanza");
  assert.equal(b.tipo === "stanza" && b.nome, "L’arca biologica");
  fedele(e, blocchiDelTurno(e));
});

test("la voce del relitto: l'etichetta, l'inciso, il parlato, il seguito", () => {
  const e = [
    testo(
      "Il Sintonizzatore non si spegne: scende di frequenza. IL NAVARCA, e stavolta non parla all'equipaggio, parla a se stesso: «Mi domando se qualcuno verrà.» Poi, più piano: «Non contro il buio.»",
    ),
  ];
  const b = blocchiDelTurno(e);
  assert.deepEqual(b.map((x) => x.tipo), ["paragrafo", "voce"]);
  const v = b[1];
  assert.ok(v.tipo === "voce");
  assert.equal(v.chi, "IL NAVARCA");
  assert.equal(v.inciso, "e stavolta non parla all’equipaggio, parla a se stesso");
  assert.deepEqual(v.segmenti.map((s) => s.tipo), ["parlato", "didascalia", "parlato"]);
  assert.equal(v.aCapo, false);
  fedele(e, b);
});

test("più voci, una per riga (le pareti del corridoio)", () => {
  const e = [
    testo(
      "Il Sintonizzatore impazzisce.\nUNA VOCE SENZA RUOLO: «Il Seme è al sicuro.»\nIL CAPITANO: «Rotta impostata.»\nL'INGEGNERE CAPO: «Evacuate il settore!»\nLO XENO-BOTANICO, con un filo di voce più fermo: «Uno.»",
    ),
  ];
  const b = blocchiDelTurno(e);
  assert.deepEqual(b.map((x) => (x.tipo === "voce" ? x.chi : x.tipo)), ["paragrafo", "UNA VOCE SENZA RUOLO", "IL CAPITANO", "L’INGEGNERE CAPO", "LO XENO-BOTANICO"]);
  fedele(e, b);
});

test("la scatola nera di L.V.: la voce, i buchi, la chiusura", () => {
  const e = [
    testo(
      "La spia si accende verde. Nella cuffia, rovinata, una voce d'uomo:\n«…acqua finita ieri.…»\nUn buco.\n«…volevo andarmene…»\nUn buco più lungo.\n«…Matthew.…»\nPoi la voce dice ancora qualcosa, e la registrazione finisce.",
    ),
  ];
  const b = blocchiDelTurno(e);
  assert.deepEqual(b.map((x) => x.tipo), ["paragrafo", "registrazione", "paragrafo"]);
  const r = b[1];
  assert.ok(r.tipo === "registrazione");
  assert.deepEqual(r.righe.map((x) => x.tipo), ["voce", "buco", "voce", "buco", "voce"]);
  fedele(e, b);
});

test("il prologo: l'apparecchio, la voce su più righe, la fine della traccia", () => {
  const e = [
    testo(
      "Scatola nera di una tuta extraveicolare. Traccia recuperata, integrità parziale.\n\n«…la spia è verde. Allora registra.\nL'acqua è finita ieri.\nNon la so aprire.»\n\nFine della traccia.",
      true,
    ),
  ];
  const b = blocchiDelTurno(e);
  assert.equal(b.length, 1);
  const r = b[0];
  assert.ok(r.tipo === "registrazione");
  assert.deepEqual(r.righe.map((x) => x.tipo), ["apparecchio", "voce", "voce", "voce", "apparecchio"]);
  fedele(e, b);
});

test("le letture: dello scanner e del computer di bordo", () => {
  const e = [
    testo("Il multiscanner emette un tono lento.\nANALISI BIOMETRICA — specie: Homo sapiens. Età al decesso: trentacinque anni circa.\nUn uomo, su una nave."),
    testo("Punti lo scanner.\nLETTURA: ‹FAUNA DEI TRE SOLI: GRANDE PASCOLATORE› — deceduto. ‹FLORA DI XYLOS› — deceduto."),
    testo("Lanci la scansione lunga.\nLunghezza: trecentoquaranta metri. Al terzo tentativo si arrende e scrive MATERIALE NON IN ARCHIVIO."),
  ];
  const b = blocchiDelTurno(e);
  assert.deepEqual(b.map((x) => x.tipo), ["paragrafo", "lettura", "paragrafo", "paragrafo", "lettura", "paragrafo", "lettura"]);
  const l2 = b[4];
  assert.ok(l2.tipo === "lettura");
  assert.deepEqual(l2.segmenti.filter((s) => s.tipo !== "testo").map((s) => s.tipo), ["schermo", "etichetta", "etichetta"]);
  fedele(e, b);
});

test("i segni dentro la prosa: protezione, schermo, matrice, intraducibile, stampo, graffio", () => {
  const tipi = (s: string) => segmenta(s).filter((x) => x.tipo !== "testo").map((x) => [x.tipo, dritto(x.testo)]);
  assert.deepEqual(tipi("sul visore compare la scritta PROTEZIONE VITALE. Niente ascolto."), [["protezione", "PROTEZIONE VITALE"]]);
  assert.deepEqual(tipi("una riga: CHIUSURA RIFIUTATA. CANALE APERTO DA REMOTO."), [["schermo", "CHIUSURA RIFIUTATA"], ["schermo", "CANALE APERTO DA REMOTO"]]);
  assert.deepEqual(tipi("«…nuove stelle…» (Matrice di traduzione: 4%)"), [["matrice", "(Matrice di traduzione: 4%)"]]);
  assert.deepEqual(tipi("(MATRICE DI TRADUZIONE: 100% — DECODIFICA COMPLETATA) Per un momento"), [["matrice", "(MATRICE DI TRADUZIONE: 100% — DECODIFICA COMPLETATA)"]]);
  assert.deepEqual(tipi("questo (intraducibile: seme-dell'anima) perché"), [["intraducibile", "(intraducibile: seme-dell'anima)"]]);
  assert.deepEqual(tipi("la sigla TSC stampigliata, e «TSC-1972. Prima registrazione»"), [["stampo", "TSC"], ["stampo", "TSC-1972"]]);
  assert.deepEqual(tipi("graffiato: QUI PRIMA. IL SEME. NON SIAMO S— e poi, più storta: OLI. Sotto, L.V."), [["graffio", "QUI PRIMA. IL SEME. NON SIAMO S—"], ["graffio", "OLI"]]);
});

test("i suggerimenti: il pulsante, e la parentesi attenuata", () => {
  const sugg: Suggerimento[] = [{ frase: "PARLA CON YUSUF", verbo: "parla", comando: "parla con yusuf", cosa: "yusuf", dove: "cosa" }];
  const s = segmenta("La radio a lungo raggio. (Per chiamare Yusuf: PARLA CON YUSUF.)", { suggerimenti: sugg });
  assert.deepEqual(
    s.map((x) => [x.tipo, x.testo, !!x.attenuato]),
    [["testo", "La radio a lungo raggio. ", false], ["testo", "(Per chiamare Yusuf: ", true], ["suggerimento", "PARLA CON YUSUF", true], ["testo", ".)", true]],
  );
  assert.equal(s[2].suggerimento, 0);
  // un maiuscolo che comincia con un verbo noto è un suggerimento anche senza il pulsante
  const t = segmenta("adesso puoi ACCOSTARE.", { verbi: new Set(["accosta"]) });
  assert.equal(t.find((x) => x.tipo === "suggerimento")?.suggerimento, -1);
  // e uno che il gioco non conosce si segnala
  assert.equal(segmenta("una scritta STRANA qui").find((x) => x.tipo !== "testo")?.tipo, "maiuscolo");
});

test("il dialogo: chi parla, il parlato, le didascalie, la narrazione", () => {
  const e: Evento[] = [
    { tipo: "dialogo", testo: "L'anziano: (La figura ti guarda.) «La nostra canzone è finita.» (Una pausa.) «Vivi.»", stacco: true, dati: { personaggio: "anziano" } },
    { tipo: "dialogo", testo: "Yusuf: «Magazzino Quattro.» Una pausa, il tempo di leggere chi chiama. «William.»", dati: { personaggio: "yusuf" } },
  ];
  const b = blocchiDelTurno(e);
  assert.ok(b[0].tipo === "dialogo" && b[1].tipo === "dialogo");
  assert.equal(b[0].chi, "L’anziano");
  assert.deepEqual(b[0].segmenti.map((s) => s.tipo), ["didascalia", "testo", "parlato", "testo", "didascalia", "testo", "parlato"]);
  assert.deepEqual(b[1].segmenti.map((s) => s.tipo), ["parlato", "testo", "parlato"]);
  fedele(e, b);
});

test("il finale: i paragrafi e la riga del registro di bordo", () => {
  const e: Evento[] = [
    { tipo: "fine", testo: "Ti guardi le mani. Sono vuote.\nRestano sei settimane di stiva vuota.\n\nRegistro di bordo, TSC-1972. Operatore W. T. Eriksonn. Nessun evento da registrare.", stacco: true, dati: { esito: "vinta" } },
  ];
  const b = blocchiDelTurno(e);
  assert.deepEqual(b.map((x) => x.tipo), ["paragrafo", "paragrafo", "registro"]);
  assert.ok(b.every((x) => x.fine === "vinta"));
  assert.equal(b[2].vuote, 1);
  fedele(e, b);
});

test("che cosa non si stampa: elenchi, intestazioni, opzioni, gli inviti a scrivere", () => {
  const e: Evento[] = [
    { tipo: "elenco", testo: "Uscite: Ovest, Nord." },
    { tipo: "intestazione", testo: "--- IL RELITTO SILENTE ---" },
    { tipo: "opzione", testo: "  1. Chi eravate?", dati: { numero: 1 } },
    { tipo: "sistema", testo: "(La partita è finita. Scrivi ANNULLA per tornare indietro di un turno.)" },
    { tipo: "sistema", testo: "(Fine della conversazione.)" },
  ];
  assert.deepEqual(blocchiDelTurno(e).map((b) => b.tipo), ["sistema"]);
});

test("i nomi toccabili: la prima volta, mai dentro una parentesi attenuata", () => {
  const e = [testo("Ti fermi con il guanto a un palmo dall'arnese. È saldato alla nicchia, e la nicchia è fredda.")];
  const b = segnaNomi(blocchiDelTurno(e), [
    { id: "risuonatore", nomi: ["risuonatore", "arnese"] },
    { id: "nicchia", nomi: ["nicchia"] },
  ]);
  const p = b[0];
  assert.ok(p.tipo === "paragrafo");
  assert.deepEqual(p.segmenti.filter((s) => s.tipo === "nome").map((s) => [s.testo, s.cosa]), [["arnese", "risuonatore"], ["nicchia", "nicchia"]]);
  assert.equal(p.segmenti.map((s) => s.testo).join(""), tipografico(e[0].testo));
});
