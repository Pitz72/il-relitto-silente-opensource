// Le prove del menu principale (src/menu/) e dell'elenco dei titoli di coda (src/riconoscimenti/).
//   node --test prove/menu.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { conFinale, FINALI, giorno, pulisci, rigaDelRegistro } from "../src/menu/registro.ts";
import { daContinuare, dettaglioDi } from "../src/menu/continua.ts";
import { nomiDelleLibrerie, type Elenco } from "../src/riconoscimenti/elenco.ts";
import { frazione, testoAvanzamento } from "../src/menu/avanzamento.ts";
import { confronta, daMostrare, pezzi, righeDalleNote, type Novita } from "../src/menu/novita.ts";
import * as changelog from "../../strumenti/changelog.mjs";
import type { Posto } from "../src/gioco/salvataggi.ts";

test("i sei finali, con i nomi dell'autore", () => {
  assert.deepEqual(FINALI.map((f) => f.id), ["vivi", "prima-nota", "stiva-piena", "doppio-fondo", "mani-vuote", "due-lettere"]);
  // i nomi dei commenti di finali.fav
  const fav = readFileSync(new URL("../../relitto-silente/finali.fav", import.meta.url), "utf8");
  for (const f of FINALI) assert.ok(fav.includes(`«${f.titolo}»`), `${f.titolo} non è in finali.fav`);
});

test("la riga del registro di bordo, dal testo del finale; e nessuna, se il finale non la scrive", () => {
  const eventi = [{ tipo: "fine" as const, testo: "Ti guardi le mani.\n\nRegistro di bordo, TSC-1972. Operatore W. T. Eriksonn. Nessun evento da registrare." }];
  assert.equal(rigaDelRegistro(eventi), "Registro di bordo, TSC-1972. Operatore W. T. Eriksonn. Nessun evento da registrare.");
  assert.equal(rigaDelRegistro([{ tipo: "fine", testo: "La cifra sul visore è a zero." }]), null);
  assert.equal(rigaDelRegistro([{ tipo: "fine", testo: "Registro di bordo, TSC-1972. Carico: un manufatto. Nient'altro da dichiarare." }]),
    "Registro di bordo, TSC-1972. Carico: un manufatto. Nient’altro da dichiarare.");
});

test("un finale si scrive una volta sola, con la data della prima; le righe in ordine di data", () => {
  let r = conFinale([], "mani-vuote", "Nessun evento da registrare.", "2026-10-15T10:00:00Z");
  r = conFinale(r, "vivi", "Rotta ripresa.", "2026-10-14T10:00:00Z");
  r = conFinale(r, "mani-vuote", "altro", "2026-10-16T10:00:00Z");
  r = conFinale(r, "finale-che-non-esiste", null, "2026-10-17T10:00:00Z");
  assert.deepEqual(r.map((v) => [v.finale, v.titolo, v.data]), [
    ["vivi", "Vivi", "2026-10-14T10:00:00Z"],
    ["mani-vuote", "Mani vuote", "2026-10-15T10:00:00Z"],
  ]);
  assert.equal(giorno("2026-10-15T12:00:00Z"), "15 ottobre 2026");
});

test("un registro rovinato non impedisce di giocare: restano le voci buone", () => {
  assert.deepEqual(pulisci({ non: "una lista" }), []);
  const r = pulisci([null, 3, { finale: "vivi", riga: 7, data: "2026-10-15T10:00:00Z" }, { finale: "vivi", data: "2026-10-16" }, { finale: "x", data: "2026" }, { finale: "due-lettere" }]);
  assert.deepEqual(r, [{ finale: "vivi", titolo: "Vivi", riga: null, data: "2026-10-15T10:00:00Z" }]);
});

const posto = (p: Partial<Posto> & { posto: Posto["posto"] }): Posto => ({ presente: true, leggibile: true, riassunto: null, creato: null, gioco: "0.2.0", ...p });
const riassunto = (esito: string, turno = 5) => ({ stanza: "stiva", nome_stanza: "la stiva", atto: 1, titolo_atto: "Il margine", turno, aria: 100, esito });

test("Continua riprende dal salvataggio più recente che si legge e non è finito", () => {
  assert.equal(daContinuare(null), null);
  assert.equal(daContinuare([posto({ posto: "1", presente: false })]), null);
  const scelto = daContinuare([
    posto({ posto: "1", creato: "2026-10-15T10:00:00Z", riassunto: riassunto("in_corso") }),
    posto({ posto: "automatico", creato: "2026-10-15T11:00:00Z", riassunto: riassunto("in_corso", 9) }),
    posto({ posto: "2", creato: "2026-10-15T12:00:00Z", riassunto: riassunto("vinta") }),
    posto({ posto: "3", creato: "2026-10-15T13:00:00Z", leggibile: false }),
  ]);
  assert.equal(scelto?.posto, "automatico");
  assert.equal(dettaglioDi(scelto!), "La stiva · atto I · turno 9");
});

test("nei titoli di coda le librerie sono nomi, una volta sola e in ordine", () => {
  const elenco = JSON.parse(readFileSync(new URL("../src/riconoscimenti/elenco.json", import.meta.url), "utf8")) as Elenco;
  const n = nomiDelleLibrerie(elenco);
  assert.ok(n.length > 200, "le librerie della pagina e del programma");
  assert.equal(new Set(n).size, n.length, "un nome una volta sola, anche con più versioni");
  assert.deepEqual(n, [...n].sort((a, b) => a.localeCompare(b, "it")));
  for (const x of ["react", "kira", "tauri"]) assert.ok(n.includes(x), x);
});

test("l'elenco dei riconoscimenti ha un testo per ogni licenza che usa", () => {
  const e = JSON.parse(readFileSync(new URL("../src/riconoscimenti/elenco.json", import.meta.url), "utf8")) as Elenco;
  const tutti = [...e.caratteri, ...e.principali, ...e.javascript, ...Object.values(e.rust).flat()];
  for (const p of tutti) for (const l of p.usata) assert.ok(e.testi[l], `${p.nome}: manca il testo di ${l}`);
  for (const p of tutti) assert.ok(p.copyright.length || p.autori?.length, `${p.nome}: né copyright né autori`);
  // dal 15 ottobre 2026 ogni suono è sintetizzato; dal 29 la voce di L.V. nell'intro è l'unica registrazione
  assert.deepEqual(e.suoni.map((s) => s.titolo), ["La voce di L.V."]);
  assert.ok(e.immagini.length);
  // i quattro del gioco, e Sora e Inter dei loghi d'apertura
  assert.deepEqual(e.caratteri.map((c) => c.famiglia).sort(), ["Atkinson Hyperlegible Next", "Big Shoulders Stencil", "IBM Plex Mono", "Inter", "Newsreader", "Sora"]);
  // l'autore si firma Simone Pizzi
  assert.ok(e.principali.find((p) => p.nome === "Favella1")?.copyright.some((c) => c.includes("Simone Pizzi")));
});

test("l'aggiornamento in corso dice quanto ha scaricato, e poi che installa", () => {
  const MB = 1024 * 1024;
  assert.equal(testoAvanzamento({ fase: "prepara" }), "Comincio a scaricare…");
  assert.equal(testoAvanzamento({ fase: "scarica", scaricati: 21.3 * MB, totale: 43.9 * MB }), "Scarico l’aggiornamento: 21,3 di 43,9 MB (48 %).");
  assert.equal(testoAvanzamento({ fase: "scarica", scaricati: 5 * MB, totale: null }), "Scarico l’aggiornamento: 5,0 MB.");
  assert.equal(frazione({ fase: "scarica", scaricati: 5, totale: null }), null);
  assert.equal(frazione({ fase: "scarica", scaricati: 50, totale: 40 }), 1);
  assert.equal(frazione({ fase: "installa" }), 1);
  assert.match(testoAvanzamento({ fase: "installa" }), /si chiude e si riapre da solo/);
});

// ---- le novità dopo un aggiornamento (src/menu/novita.ts, strumenti/changelog.mjs) ----
const N = (versione: string, ...righe: string[]): Novita => ({ versione, data: "2026-10-19", righe });
const ELENCO = [N("0.3.0", "c"), N("0.2.6", "b"), N("0.2.5", "a"), N("0.2.5-beta.5", "beta"), N("0.2.5-beta.4")];

test("le versioni in ordine SemVer, come nello strumento delle versioni", () => {
  const v = ["0.2.4", "0.2.5-beta.1", "0.2.5-beta.2", "0.2.5-beta.10", "0.2.5-rc.1", "0.2.5", "0.2.6", "0.10.0", "1.0.0-alpha", "1.0.0"];
  for (let i = 0; i < v.length; i++)
    for (let j = 0; j < v.length; j++) {
      const a = Math.sign(confronta(v[i], v[j])!), b = Math.sign(changelog.confronta(v[i], v[j]));
      assert.equal(a, b, `${v[i]} ~ ${v[j]}`);
      assert.equal(a, Math.sign(i - j), `${v[i]} ~ ${v[j]}`);
    }
  assert.equal(confronta("non è una versione", "0.2.5"), null);
});

test("le novità: dopo un aggiornamento quelle arrivate da allora, la più recente prima; le stesse, niente", () => {
  assert.deepEqual(daMostrare(ELENCO, "0.2.5", "0.3.0", true), { mostra: [ELENCO[0], ELENCO[1]], ricorda: true });
  // le pre-release le mostrano anche loro (decisione dell'autore); senza righe non c'è niente da dire
  assert.deepEqual(daMostrare(ELENCO, "0.2.5-beta.4", "0.2.5-beta.5", true).mostra.map((n) => n.versione), ["0.2.5-beta.5"]);
  assert.deepEqual(daMostrare(ELENCO, "0.2.5-beta.3", "0.2.5-beta.4", true), { mostra: [], ricorda: true });
  assert.deepEqual(daMostrare(ELENCO, "0.2.6", "0.2.6", true), { mostra: [], ricorda: false });
});

test("le novità: chi installa da zero non vede niente; chi aveva già giocato, quelle di questa versione", () => {
  assert.deepEqual(daMostrare(ELENCO, null, "0.2.6", false), { mostra: [], ricorda: true });
  assert.deepEqual(daMostrare(ELENCO, null, "0.2.6", true).mostra.map((n) => n.versione), ["0.2.6"]);
  // una versione ricordata che non si legge vale come nessuna
  assert.deepEqual(daMostrare(ELENCO, "???", "0.2.6", true).mostra.map((n) => n.versione), ["0.2.6"]);
});

test("le novità: tornando a una versione più vecchia niente, e si ricorda la più nuova", () => {
  assert.deepEqual(daMostrare(ELENCO, "0.3.0", "0.2.6", true), { mostra: [], ricorda: false });
});

test("le righe «Per chi gioca» del CHANGELOG: le voci, senza collegamenti né codice, con il grassetto", () => {
  const corpo = [
    "### Per chi gioca",
    "",
    "- **Una cosa nuova**, detta [semplice](http://x) e senza `codice`;",
    "  su due righe.",
    "- Un’altra.",
    "",
    "### Aggiunto",
    "",
    "- Una nota tecnica.",
  ].join("\n");
  const righe = changelog.perChiGioca(corpo);
  assert.deepEqual(righe, ["**Una cosa nuova**, detta semplice e senza codice; su due righe.", "Un’altra."]);
  assert.deepEqual(changelog.perChiGioca("### Aggiunto\n\n- Solo tecnica."), []);
  // il corpo della release le porta, e il gioco le rilegge per la domanda «È uscita la versione…»
  assert.deepEqual(righeDalleNote(changelog.corpoRelease("0.2.6", righe)), righe);
  assert.deepEqual(righeDalleNote("Il remake de «Il Relitto Silente». Le note sono nel CHANGELOG."), []);
  assert.deepEqual(pezzi(righe[0]), [
    { testo: "Una cosa nuova", forte: true },
    { testo: ", detta semplice e senza codice; su due righe.", forte: false },
  ]);
});

// (che una versione da rilasciare abbia le sue righe lo controlla `versione.mjs verifica --rilascio`)
test("il CHANGELOG vero: le versioni si leggono, in ordine, la più recente prima", () => {
  const testo = readFileSync(new URL("../../CHANGELOG.md", import.meta.url), "utf8");
  assert.ok(changelog.sezione(testo, changelog.titoloNonRilasciato()), "manca «Non rilasciato»");
  const v = changelog.novita(testo).map((n) => n.versione);
  assert.ok(v.length > 5);
  for (let i = 1; i < v.length; i++) assert.ok(changelog.confronta(v[i - 1], v[i]) > 0, `${v[i - 1]} prima di ${v[i]}`);
});
