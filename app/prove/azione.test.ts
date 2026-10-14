// Le prove del modello d'azione (src/azione): pure, su turni costruiti a mano.
// Il collaudo vero, sulla partita intera, è collaudo/menu.mjs.
//   node --test prove/azione.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { comandiDelModello, costruisciModello } from "../src/azione/modello.ts";
import { frasiMaiuscole, verboDi } from "../src/azione/suggerimenti.ts";
import type { Cosa, Evento, Turno, VerboPulsante } from "../src/motore/tipi.ts";

// ---------------------------------------------------------------------------
//  Un turno finto: le cose, i verbi che il motore offrirebbe su tutte, lo stato
// ---------------------------------------------------------------------------
type CosaFinta = Partial<Cosa> & { id: string };

function cosa(c: CosaFinta): Cosa {
  return {
    etichetta: c.id[0].toUpperCase() + c.id.slice(1),
    con_te: false,
    nome: `Il ${c.id}`,
    nomi: [],
    prendibile: false,
    personaggio: false,
    radici: [],
    regole: [],
    regole_in_coppia: [],
    effetti: {},
    ...c,
  };
}

const TUTTI = ["esamina", "prendi", "lascia", "apri", "chiudi", "usa", "parla", "analizza", "traduci", "sintonizza",
  "incidi", "taglia", "tocca", "stacca", "firma", "alza", "abbassa", "accendi", "ricarica"];

function turno(cose: Cosa[], opz: { stanza?: string; tuta?: boolean; contatto?: string; eventi?: Evento[];
  cosaDelComando?: string; daSolo?: string[]; fase?: Turno["pulsanti"]["fase"]; scelte?: { etichetta: string; comando: string }[] } = {}): Turno {
  const testo = (c: Cosa) => `${c.personaggio ? "con " : ""}${c.nome.toLowerCase()}`;
  const verbi: VerboPulsante[] = TUTTI.map((verbo) => {
    const primi = cose
      .filter((c) => (verbo === "lascia" ? c.con_te : verbo === "prendi" ? !c.con_te && !c.personaggio : verbo === "parla" ? c.personaggio : true))
      .map((c) => ({ id: c.id, testo: testo(c) }));
    const v: VerboPulsante = { verbo, etichetta: verbo[0].toUpperCase() + verbo.slice(1), oggetto: true, da_solo: false,
      primi, secondo: "no" };
    if (verbo === "usa") {
      v.secondo = "facoltativo";
      v.secondi = cose.map((c) => ({ id: c.id, etichetta: c.etichetta, testo: `con il ${c.id}` }));
    }
    return v;
  });
  for (const v of opz.daSolo ?? []) verbi.push({ verbo: v, etichetta: v, oggetto: false, da_solo: true, primi: [], secondo: "no" });
  const inventario = cose.filter((c) => c.con_te).map((c) => c.id);
  return {
    ok: true,
    eventi: opz.eventi ?? [],
    pulsanti: {
      modo: "pulsanti",
      fase: opz.fase ?? "gioco",
      scelte: opz.scelte ?? [],
      oggetti: cose.map((c) => ({ id: c.id, etichetta: c.etichetta, con_te: c.con_te })),
      verbi: opz.fase && opz.fase !== "gioco" ? [] : verbi,
      uscite: [{ comando: "ovest", etichetta: "Ovest", stanza: null }, { comando: "giù", etichetta: "Giù", stanza: "Stiva" }],
      servizio: ["guarda", "inventario", "aspetta", "annulla", "salva", "carica"].map((c) => ({ comando: c, etichetta: c })),
    },
    cose,
    stato: {
      stanza: opz.stanza ?? "plancia", nome_stanza: null, atto: 1, titolo_atto: "Il margine", aria: 100, traduzione: 0,
      echi: 0, risonanze: 0, chiavi: 0, tracce: 0, fuga: "lontana", ingresso: "aperto", contatto: opz.contatto ?? "nuovo",
      energia: "assente", tuta: opz.tuta ?? false, protezione: false,
      mostra: { aria: false, matrice: false, voci: false, chiavi: false, tracce: false },
      turno: 1, inventario, visitate: [], mappa: {}, dialogo: null, nodo: null,
    },
    suono: { stati: {} as Turno["suono"]["stati"], eventi: [] },
    comando: opz.cosaDelComando ? { testo: "", verbo: "esamina", cosa: opz.cosaDelComando, secondo: null, gruppo: "verbo" } : null,
    esito: "in_corso",
    ms: { motore: 0, pulsanti: 0, stato: 0, json: 0 },
  };
}

const verbiDi = (t: Turno, id: string) => {
  const m = costruisciModello(t);
  return [...m.qui, ...m.conTe].find((c) => c.id === id)!.voci.map((v) => v.etichetta);
};

// ---------------------------------------------------------------------------
//  I menu
// ---------------------------------------------------------------------------
test("una parete senza regole: solo Esamina", () => {
  assert.deepEqual(verbiDi(turno([cosa({ id: "parete" })]), "parete"), ["Esamina"]);
});

test("i verbi dell'autore compaiono solo dove c'è una regola", () => {
  const t = turno([cosa({ id: "risuonatore", regole: ["stacca", "tocca"] }), cosa({ id: "parete" })]);
  assert.deepEqual(verbiDi(t, "risuonatore"), ["Esamina", "Tocca", "Stacca"]);
  assert.deepEqual(verbiDi(t, "parete"), ["Esamina"]);
});

test("Prendi solo per le cose che si prendono, Lascia per quelle che porti", () => {
  const t = turno([cosa({ id: "cella", prendibile: true }), cosa({ id: "oblò" }), cosa({ id: "chiavetta", con_te: true })]);
  assert.ok(verbiDi(t, "cella").includes("Prendi"));
  assert.ok(!verbiDi(t, "oblò").includes("Prendi"));
  assert.deepEqual(verbiDi(t, "chiavetta"), ["Esamina", "Lascia", "Usa con…"]);
});

test("Apri o Chiudi secondo lo stato della cosa", () => {
  assert.ok(verbiDi(turno([cosa({ id: "kit", radici: ["chius"] })]), "kit").includes("Apri"));
  const aperto = verbiDi(turno([cosa({ id: "kit", radici: ["apert"] })]), "kit");
  assert.ok(aperto.includes("Chiudi") && !aperto.includes("Apri"));
});

test("un verbo che non cambierebbe niente non compare", () => {
  const faro = { id: "faro", con_te: true, regole: ["alza", "abbassa"], effetti: { alza: ["pien"], abbassa: ["bass"] } };
  assert.deepEqual(verbiDi(turno([cosa({ ...faro, radici: ["pien"] })]), "faro").filter((v) => /Alza|Abbassa/.test(v)), ["Abbassa"]);
  assert.deepEqual(verbiDi(turno([cosa({ ...faro, radici: ["bass"] })]), "faro").filter((v) => /Alza|Abbassa/.test(v)), ["Alza"]);
  // Esamina, Prendi e Lascia restano sempre: un disco posato si riprende
  const disco = cosa({ id: "disco", prendibile: true, regole: ["prendi"], effetti: { prendi: ["staccat"] }, radici: ["staccat"] });
  assert.ok(verbiDi(turno([disco]), "disco").includes("Prendi"));
});

test("gli attrezzi: i verbi nascono da quello che hai", () => {
  assert.deepEqual(verbiDi(turno([cosa({ id: "parete" })], { tuta: true }), "parete"), ["Esamina", "Analizza"]);
  const cose = [cosa({ id: "parete" }), cosa({ id: "taglierina", con_te: true })];
  assert.deepEqual(verbiDi(turno(cose), "parete"), ["Esamina", "Incidi", "Taglia"]);
  assert.deepEqual(verbiDi(turno(cose, { tuta: true }), "parete"), ["Esamina", "Analizza", "Incidi", "Taglia"]);
  // la matrice c'è dal primo contatto («la tuta prova a tradurre»)
  assert.ok(verbiDi(turno(cose, { tuta: true, contatto: "avvenuto" }), "parete").includes("Traduci"));
  // non sulle cose che porti, salvo una regola dell'autore
  assert.ok(!verbiDi(turno(cose, { tuta: true }), "taglierina").includes("Analizza"));
  const stele = cosa({ id: "stele", con_te: true, regole: ["analizza"] });
  assert.ok(verbiDi(turno([stele], { tuta: true }), "stele").includes("Analizza"));
});

test("lo scanner di bordo: Analizza senza la tuta solo dove l'autore lo ha previsto", () => {
  const t = turno([cosa({ id: "nave", regole: ["analizza"] }), cosa({ id: "oblò" })]);
  assert.ok(verbiDi(t, "nave").includes("Analizza"));
  assert.ok(!verbiDi(t, "oblò").includes("Analizza"));
});

test("Usa da solo dove c'è una regola, Usa con… sulle cose che porti", () => {
  const t = turno([cosa({ id: "postazione", regole: ["usa"] }), cosa({ id: "batteria", con_te: true }), cosa({ id: "pannello" })]);
  assert.ok(verbiDi(t, "postazione").includes("Usa"));
  const m = costruisciModello(t);
  const usaCon = m.conTe[0].voci.find((v) => v.etichetta === "Usa con…")!;
  assert.equal(usaCon.comando, null);
  // tutte le altre cose, non solo quella giusta
  assert.deepEqual(usaCon.secondi.map((s) => s.id), ["postazione", "pannello"]);
});

test("Parla con chi si può chiamare", () => {
  assert.ok(verbiDi(turno([cosa({ id: "yusuf", personaggio: true })]), "yusuf").includes("Parla"));
});

test("le azioni di situazione compaiono nella loro stanza", () => {
  const cose = [cosa({ id: "tuta", nome: "La tuta", con_te: true, regole: ["ricarica"] })];
  const plancia = costruisciModello(turno(cose, { stanza: "plancia", daSolo: ["accosta"] }));
  assert.deepEqual(plancia.situazione.map((a) => a.comando), ["accosta"]);
  const altrove = costruisciModello(turno(cose, { stanza: "stiva", daSolo: ["accosta"] }));
  assert.deepEqual(altrove.situazione, []);
  const lab = costruisciModello(turno(cose, { stanza: "laboratorio di risonanza" }));
  assert.deepEqual(lab.situazione.map((a) => a.comando), ["ricarica la tuta"]);
  // il verbo di situazione non sta anche sulla cosa
  assert.ok(!lab.conTe[0].voci.some((v) => v.verbo === "ricarica"));
});

test("le uscite hanno il loro tasto, il servizio è Guarda e Aspetta", () => {
  const m = costruisciModello(turno([]));
  assert.deepEqual(m.uscite.map((u) => [u.comando, u.tasto]), [["ovest", "ArrowLeft"], ["giù", "PageDown"]]);
  assert.deepEqual(m.servizio.map((s) => s.comando), ["guarda", "aspetta"]);
});

test("nel dialogo ci sono solo le scelte, numerate", () => {
  const m = costruisciModello(turno([cosa({ id: "yusuf", personaggio: true })], {
    fase: "dialogo",
    scelte: [{ etichetta: "Chi sei?", comando: "1" }, { etichetta: "Chiudi la conversazione", comando: "esci" }],
  }));
  assert.deepEqual(m.scelte.map((s) => s.tasto), ["1", null]);
  assert.equal(m.qui[0].voci.length, 0);
});

test("i comandi del modello: tutti, una volta sola", () => {
  const t = turno([cosa({ id: "batteria", con_te: true }), cosa({ id: "pannello" })], { stanza: "plancia", daSolo: ["accosta"] });
  const c = comandiDelModello(costruisciModello(t));
  assert.equal(new Set(c).size, c.length);
  for (const x of ["ovest", "esamina il pannello", "usa il batteria con il pannello", "accosta", "aspetta"]) assert.ok(c.includes(x), x);
  assert.ok(!c.includes("annulla") && !c.includes("salva"));
});

// ---------------------------------------------------------------------------
//  I suggerimenti in maiuscolo
// ---------------------------------------------------------------------------
const verbi = new Set(["accosta", "stacca", "analizza", "traduci", "usa", "parla", "ascolta", "sintonizza", "ricarica", "firma", "suona"]);

test("le forme del verbo: infinito, pronome, infinito con pronome", () => {
  assert.deepEqual(verboDi("ACCOSTARE", verbi), { verbo: "accosta", pronome: false });
  assert.deepEqual(verboDi("STACCARLO", verbi), { verbo: "stacca", pronome: true });
  assert.deepEqual(verboDi("ANALIZZALA", verbi), { verbo: "analizza", pronome: true });
  assert.deepEqual(verboDi("TRADUCILI", verbi), { verbo: "traduci", pronome: true });
  assert.deepEqual(verboDi("USALA", verbi), { verbo: "usa", pronome: true });
  assert.deepEqual(verboDi("PARLA", verbi), { verbo: "parla", pronome: false });
  for (const no of ["MATERIALE", "CANALE", "PROTEZIONE", "IL", "TSC"]) assert.equal(verboDi(no, verbi), null, no);
});

test("le frasi in maiuscolo, con la punteggiatura intorno", () => {
  const f = (t: string) => frasiMaiuscole(t).map((x) => [x.testo, x.seguito]);
  assert.deepEqual(f("(Per chiamare Yusuf: PARLA CON YUSUF.)"), [["PARLA CON YUSUF", ""]]);
  assert.deepEqual(f("Potresti provare a risponderle. (PARLA CON L'ECO.)"), [["PARLA CON L'ECO", ""]]);
  assert.deepEqual(f("il multiscanner lo troverebbe: ANALIZZA lo scafo nero."), [["ANALIZZA", "lo scafo nero"]]);
  assert.deepEqual(f("adesso puoi ACCOSTARE."), [["ACCOSTARE", ""]]);
  assert.deepEqual(f("IL NAVARCA: «Questo sarà…»"), [["IL NAVARCA", ""]]);
  assert.deepEqual(f("verde, bianca e ambrata"), []);
});

test("un suggerimento accende il pulsante giusto", () => {
  const testo = (t: string): Evento[] => [{ tipo: "testo", testo: t }];
  const cose = [cosa({ id: "yusuf", personaggio: true, nomi: ["yusuf"] }), cosa({ id: "nave", nomi: ["nave aliena"], regole: ["analizza"] }),
    cosa({ id: "risuonatore", regole: ["stacca"] })];
  const s = (eventi: Evento[], o: Parameters<typeof turno>[1] = {}) => costruisciModello(turno(cose, { daSolo: ["accosta"], ...o, eventi })).suggerimenti;
  assert.equal(s(testo("(Per chiamare Yusuf: PARLA CON YUSUF.)"))[0].comando, "parla con il yusuf");
  assert.equal(s(testo("Lo scanner te lo direbbe: ANALIZZALA."), { cosaDelComando: "nave" })[0].comando, "analizza il nave");
  assert.deepEqual(s(testo("adesso puoi ACCOSTARE."))[0], { frase: "ACCOSTARE", verbo: "accosta", comando: "accosta", cosa: null, dove: "situazione" });
  assert.equal(s(testo("per portarlo via dovresti STACCARLO."), { cosaDelComando: "risuonatore" })[0].comando, "stacca il risuonatore");
  // le maiuscole che non sono un verbo restano testo
  assert.deepEqual(s(testo("e scrive MATERIALE NON IN ARCHIVIO. IL NAVARCA: «…»")), []);
  // solo nei testi: le righe di sistema del motore («Scrivi ANNULLA…») non contano
  assert.deepEqual(s([{ tipo: "sistema", testo: "(PARLA CON YUSUF.)" }]), []);
});

test("un suggerimento senza una cosa precisa indica l'attrezzo", () => {
  const cose = [cosa({ id: "sintonizzatore", con_te: true }), cosa({ id: "parete" })];
  const m = costruisciModello(turno(cose, { eventi: [{ tipo: "testo", testo: "SINTONIZZA le cose delle stanze silenziose." }] }));
  assert.deepEqual(m.suggerimenti.map((x) => [x.verbo, x.comando, x.dove]), [["sintonizza", null, "attrezzo"]]);
});
