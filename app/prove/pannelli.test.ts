// Le prove dei pannelli e di quello che sta intorno al gioco, per chi gioca con il mouse e per chi vede poco
// (revisione 37: M1–M6, M11, L4, L9, L15; il contorno del fuoco, 16 novembre 2026).
//   node --test prove/pannelli.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { effettoSulContorno, TASTI_CHE_SPOSTANO } from "../src/stile/fuoco.ts";
import { durataAvviso } from "../src/gioco/pannelli/avviso.ts";
import { ANNULLATO, FERMO, sorveglia, TETTO_CONTROLLO, TETTO_SENZA_PEZZI } from "../src/menu/avanzamento.ts";

const leggi = (f: string) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8");
const senzaCommenti = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

test("il contorno del fuoco: lo accende un tasto che sposta il fuoco, lo spegne il mouse", () => {
  for (const key of ["Tab", "ArrowDown", "ArrowLeft", "Home", "PageDown"]) assert.equal(effettoSulContorno({ type: "keydown", key }), true, key);
  // Esc salta i loghi e l'intro, Invio e Spazio dicono «continua»: non sono un modo di spostarsi
  for (const key of ["Escape", "Enter", " ", "a", "F5", "Shift"]) assert.equal(effettoSulContorno({ type: "keydown", key }), null, key);
  assert.ok(!TASTI_CHE_SPOSTANO.has("Escape"));
  assert.equal(effettoSulContorno({ type: "pointerdown" }), false);
  assert.equal(effettoSulContorno({ type: "wheel" }), false);
  assert.equal(effettoSulContorno({ type: "pointermove", movementX: 3, movementY: 0 }), false);
  // la pagina che scorre sotto un mouse fermo non è un gesto
  assert.equal(effettoSulContorno({ type: "pointermove", movementX: 0, movementY: 0 }), null);
});

test("il contorno si disegna solo con la tastiera, e mai sulle voci del menu principale", () => {
  const base = senzaCommenti(leggi("stile/base.css"));
  // nessuna regola generale disegna il contorno senza `data-tastiera` sulla radice
  const regole = [...base.matchAll(/([^{}]+)\{[^}]*outline:\s*2px[^}]*\}/g)].map((m) => m[1].trim());
  assert.ok(regole.length > 0);
  for (const r of regole) assert.match(r, /^:root\[data-tastiera\] /, `la regola «${r}» disegna il contorno anche a chi usa il mouse`);
  assert.match(base, /\.tema :focus \{ outline: none; \}/);
  assert.match(leggi("main.tsx"), /seguiLaTastiera\(\)/);
  // il menu: il filo accanto alla voce è il suo segno; il contorno non c'è nemmeno dalla tastiera
  const menu = senzaCommenti(leggi("menu/menu.css"));
  assert.match(menu, /:root\[data-tastiera\] \.tema\[data-forma\] \.menu-voci button:focus-visible \{ outline: none; box-shadow: none; \}/);
});

test("la dichiarazione d'apertura non se ne va da sola", () => {
  const d = leggi("riconoscimenti/Dichiarazione.tsx");
  assert.doesNotMatch(d, /setTimeout\(prosegui/, "la dichiarazione ha ancora una scadenza");
  assert.match(d, /onClick=\{prosegui\}/);
});

test("un avviso resta il tempo di leggerlo", () => {
  assert.equal(durataAvviso("Salvato nel posto 3."), 3200);
  assert.equal(durataAvviso("Il caricamento non è riuscito.", true), 6000);
  // la frase della partita ricostruita: centocinquanta caratteri, almeno dieci secondi (ne restava 3,2)
  const lunga = "x".repeat(150);
  assert.ok(durataAvviso(lunga) >= 10_000, String(durataAvviso(lunga)));
  // e nel gioco non se ne va da sola: «ricostruita» e «diversa» restano finché non si chiudono
  assert.match(leggi("gioco/Gioco.tsx"), /mostraAvviso\(r\.messaggio, r\.esito === "diversa", true\)/);
  assert.match(leggi("gioco/pannelli/Pannelli.tsx"), /timer\.current = resta \? null : setTimeout/);
});

test("«Carica» dentro la partita chiede conferma, dal pannello e scritto", () => {
  const g = leggi("gioco/Gioco.tsx");
  assert.match(g, /const caricaChiedendo = useCallback/);
  // il pannello e «carica 3» passano dalla conferma; il caricamento diretto resta solo all'avvio e dentro la conferma
  assert.equal([...g.matchAll(/caricaChiedendo\(/g)].length, 2);
  assert.equal([...g.matchAll(/void caricaDa\(|await caricaDa\(/g)].length, 2);
});

test("la conferma: non prende S e N con Ctrl, e una domanda arrivata da sola ha il fuoco sul «no»", () => {
  const p = leggi("gioco/pannelli/Pannelli.tsx");
  assert.match(p, /if \(e\.ctrlKey \|\| e\.altKey \|\| e\.metaKey\) return;\s+const k = e\.key\.toLowerCase\(\);/);
  assert.match(p, /data-primo=\{domanda\.daSolo \? undefined : ""\}\s+data-risposta="si"/);
  assert.match(p, /data-primo=\{domanda\.daSolo \? "" : undefined\}\s+data-risposta="no"/);
});

test("nei pannelli il Tab si ferma anche sui cursori dei volumi", () => {
  const p = leggi("gioco/pannelli/Pannelli.tsx");
  assert.match(p, /TAPPE_DEL_TAB = "button:not\(:disabled\):not\(\[tabindex='-1'\]\), input:not\(:disabled\):not\(\[tabindex='-1'\]\), \[tabindex='0'\]"/);
  assert.match(p, /querySelectorAll<HTMLElement>\(TAPPE_DEL_TAB\)/);
});

test("lo scaricamento dell'aggiornamento: finisce, si ferma, si annulla", async () => {
  assert.ok(TETTO_CONTROLLO >= 10_000 && TETTO_SENZA_PEZZI >= 30_000);
  // arriva in fondo
  await sorveglia(new Promise<void>((r) => setTimeout(r, 30)), () => performance.now(), { annullato: false }, 1000, 5);
  // la rete cade in silenzio: nessun pezzo per più del tetto
  const fermo = performance.now();
  const segnale = { annullato: false };
  await assert.rejects(sorveglia(new Promise<void>(() => undefined), () => fermo, segnale, 40, 5), new RegExp(FERMO));
  assert.equal(segnale.annullato, true, "uno scaricamento fermo che poi finisse non deve installare niente");
  // chi gioca annulla
  const mio = { annullato: false };
  const attesa = sorveglia(new Promise<void>(() => undefined), () => performance.now(), mio, 10_000, 5);
  mio.annullato = true;
  await assert.rejects(attesa, new RegExp(ANNULLATO));
  // annullato un attimo prima che lo scaricamento finisca: non si installa
  await assert.rejects(sorveglia(Promise.resolve(), () => performance.now(), { annullato: true }, 10_000, 5), new RegExp(ANNULLATO));
  // un errore dello scaricamento passa com'è (la firma sbagliata)
  await assert.rejects(sorveglia(Promise.reject(new Error("signature mismatch")), () => performance.now(), { annullato: false }, 10_000, 5), /signature/);
  // il pannello ha «Annulla» finché scarica, e l'app scarica e installa in due tempi
  assert.match(leggi("menu/Aggiornamento.tsx"), /avanzamento\.fase !== "installa" && \([\s\S]{0,200}onClick=\{annulla\}/);
  const a = leggi("aggiornamenti.ts");
  assert.match(a, /check\(\{ timeout: TETTO_CONTROLLO \}\)/);
  assert.match(a, /await sorveglia\(scarico, \(\) => ultimoPezzo, segnale\);[\s\S]{0,400}await u\.install\(\);/);
  assert.doesNotMatch(a, /downloadAndInstall/);
});

test("i loghi e l'intro: un clic li salta, ma non nel primo secondo; i loghi seguono volume e movimento del gioco", () => {
  const l = leggi("loghi/Loghi.tsx");
  assert.match(l, /onClick=\{\(\) => \{ if \(performance\.now\(\) - nato\.current > GUARDIA_DEL_CLIC\) chiudi\(\); \}\}/);
  assert.match(l, /if \(ridotto \?\? window\.matchMedia/);
  assert.match(l, /SuonoLoghi\.avvia\(livello\.current\)/);
  assert.match(leggi("loghi/suono.ts"), /static avvia\(volume = 1\): SuonoLoghi \| null \{\s+if \(volume <= 0\) return null;/);
  assert.match(leggi("Relitto.tsx"), /<Loghi [^>]*ridotto=\{ridotto\} volume=\{opzioni\.volume\}/);
  const i = leggi("intro/Intro.tsx");
  assert.match(i, /if \(revisione \|\| !pronta \|\| inAttesa\.current\) return;\s+if \(tempo\.current < GUARDIA_DEL_CLIC/);
  // il clic vale da tutta la finestra (le fasce nere di uno schermo 16:10), e lo schermo lo dice
  assert.match(i, /onClick=\{saltaColClic\}/);
  assert.match(i, /clic o Esc · salta/);
});

test("i bersagli piccoli: «diario», «menu» e «continua ↓» sono alti almeno 36 px", () => {
  const gioco = senzaCommenti(leggi("gioco/gioco.css"));
  const alto = (css: string, selettore: string) => Number(new RegExp(`${selettore.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\{[^}]*min-height: (\\d+)px`).exec(css)?.[1] ?? 0);
  assert.ok(alto(gioco, ".comandi-app button") >= 36);
  assert.ok(alto(senzaCommenti(leggi("gioco/pannelli/pannelli.css")), ".pannello .continua-opzioni") >= 36);
});
