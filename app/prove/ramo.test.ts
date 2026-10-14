// Le prove della geometria del ramo e del fiore (src/gioco/ramo/geometria.ts).
//   node --test prove/ramo.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { disponiFilo, disponiFiore, MISURE, quotaDelFilo, type Gruppo } from "../src/gioco/ramo/geometria.ts";

const W = 1280;
const u = W / 100;
const gruppo = (nome: string, n: number, w = 96, riducibile = true): Gruppo => ({ nome, larghezze: Array(n).fill(w), riducibile });

function controllaFilo(d: ReturnType<typeof disponiFilo>, gruppi: Gruppo[]) {
  const pezzi = d.posti.flatMap((p, i) =>
    p.map((x, k) => {
      const w = (k < d.mostrati[i] ? gruppi[i].larghezze[k] : 60) * d.scala;
      return { a: x.x - w / 2, b: x.x + w / 2 };
    }),
  );
  for (const p of pezzi) {
    assert.ok(p.a >= MISURE.margine * u - 0.5, `fuori a sinistra: ${p.a}`);
    assert.ok(p.b <= W - MISURE.margine * u + 0.5, `fuori a destra: ${p.b}`);
  }
  for (let i = 1; i < pezzi.length; i++) assert.ok(pezzi[i].a >= pezzi[i - 1].b + MISURE.spazio * u - 0.5, "due pezzi si toccano");
}

test("un filo che ci sta: scala piena, tutti i pezzi, in ordine", () => {
  const gruppi = [gruppo("uscite", 3, 80, false), gruppo("qui", 4), gruppo("azioni", 2, 90)];
  const d = disponiFilo(gruppi, W, "alto", "membrana", 60);
  assert.equal(d.scala, 1);
  assert.deepEqual(d.mostrati, [3, 4, 2]);
  controllaFilo(d, gruppi);
  assert.ok(d.etichette.every((e) => e !== null));
});

test("il caso peggiore dei percorsi: 6 uscite, 9 cose, 3 azioni", () => {
  const gruppi = [gruppo("uscite", 6, 86, false), gruppo("qui", 9, 150), gruppo("azioni", 3, 96)];
  const d = disponiFilo(gruppi, W, "alto", "acciaio", 60);
  assert.ok(d.scala >= MISURE.scalaMinima);
  assert.equal(d.mostrati[0], 6, "le uscite non si nascondono mai");
  assert.ok(d.mostrati[1] < 9, "le cose in più vanno nel «+N»");
  assert.equal(d.posti[1].length, d.mostrati[1] + 1, "il «+N» è l'ultimo posto del gruppo");
  controllaFilo(d, gruppi);
});

test("le 14 cose che porti, con gli attrezzi in testa", () => {
  const gruppi = [gruppo("attrezzi", 4, 120, false), gruppo("con te", 14, 130)];
  const d = disponiFilo(gruppi, W, "basso", "membrana", 60);
  controllaFilo(d, gruppi);
  assert.equal(d.mostrati[0], 4);
});

test("il filo: dritto nell'acciaio, curvo nella membrana", () => {
  assert.equal(quotaDelFilo("alto", 0.1, "acciaio"), quotaDelFilo("alto", 0.7, "acciaio"));
  assert.notEqual(quotaDelFilo("alto", 0.1, "membrana"), quotaDelFilo("alto", 0.5, "membrana"));
  assert.ok(quotaDelFilo("basso", 0.5, "membrana") > quotaDelFilo("alto", 0.5, "membrana") + 3);
});

test("il fiore: due anelli, dentro lo schermo, mai sopra il testo", () => {
  for (const x of [0.04, 0.3, 0.6, 0.97])
    for (const forma of ["acciaio", "membrana"] as const) {
      const petali = [
        ...Array(5).fill({ larghezza: 110, altezza: 34, anello: 1 as const }),
        ...Array(5).fill({ larghezza: 126, altezza: 34, anello: 2 as const }),
      ];
      const ancora = { x: x * W, y: quotaDelFilo("basso", x, forma) * u };
      const posti = disponiFiore(ancora, petali, W, forma);
      posti.forEach((p, i) => {
        assert.ok(p.x - petali[i].larghezza / 2 >= MISURE.margine * u - 0.5);
        assert.ok(p.x + petali[i].larghezza / 2 <= W - MISURE.margine * u + 0.5);
        assert.ok(p.y - 17 >= MISURE.fondoLamina * u - 0.5, `petalo sopra il testo: ${p.y}`);
        assert.ok(p.y + 17 <= quotaDelFilo("alto", p.x / W, forma) * u, "petalo sopra il filo alto");
      });
      const y1 = Math.max(...posti.filter((p) => p.anello === 1).map((p) => p.y));
      const y2 = Math.max(...posti.filter((p) => p.anello === 2).map((p) => p.y));
      assert.ok(y2 < y1, "gli attrezzi stanno fuori, sopra la base");
      for (const anello of [1, 2]) {
        const r = posti.map((p, i) => ({ ...p, w: petali[i].larghezza })).filter((p) => p.anello === anello).sort((a, b) => a.x - b.x);
        for (let i = 1; i < r.length; i++) assert.ok(r[i].x - r[i].w / 2 >= r[i - 1].x + r[i - 1].w / 2 - 0.5, "due petali si toccano");
      }
    }
});

test("un fiore senza attrezzi sta su un anello solo", () => {
  const posti = disponiFiore({ x: 640, y: 610 }, [{ larghezza: 100, altezza: 34, anello: 2 }, { larghezza: 100, altezza: 34, anello: 2 }], W, "membrana");
  assert.ok(posti.every((p) => p.anello === 1));
});

// ---------------------------------------------------------------------------
//  Dal modello ai baccelli e ai petali (src/gioco/ramo/azioni.ts)
// ---------------------------------------------------------------------------
import { accesiDa, baccelliDi, bersagli, nomeDi, petaliDi } from "../src/gioco/ramo/azioni.ts";
import type { ModelloAzione, MenuCosa } from "../src/azione/modello.ts";
import type { Cosa } from "../src/motore/tipi.ts";

const voce = (verbo: string, gruppo: "base" | "attrezzo" | "autore" | "dialogo", comando: string | null, secondi: { id: string; etichetta: string; comando: string }[] = []) => ({
  verbo, etichetta: verbo[0].toUpperCase() + verbo.slice(1) + (comando === null ? " con…" : ""), gruppo, comando, secondi,
});
const menu = (id: string, conTe: boolean, voci: MenuCosa["voci"]): MenuCosa => ({ id, etichetta: id, conTe, personaggio: false, voci });
const cosaFinta = (id: string, nome: string, conTe = false): Cosa => ({ id, etichetta: id, con_te: conTe, nome, nomi: [], prendibile: true, personaggio: false, radici: [], regole: [], regole_in_coppia: [], effetti: {} });

const modelloFinto: ModelloAzione = {
  fase: "gioco",
  qui: [menu("nicchia", false, [voce("esamina", "base", "esamina la nicchia"), voce("analizza", "attrezzo", "analizza la nicchia")])],
  conTe: [
    menu("batteria", true, [voce("esamina", "base", "esamina la batteria"), voce("usa", "base", null, [{ id: "nicchia", etichetta: "Nicchia", comando: "usa la batteria con la nicchia" }])]),
    menu("taglierina", true, [voce("esamina", "base", "esamina la taglierina")]),
  ],
  uscite: [{ comando: "ovest", etichetta: "Ovest", stanza: "corridoio principale", tasto: "ArrowLeft" }],
  situazione: [],
  attrezzi: [
    { id: "multiscanner", etichetta: "Multiscanner", verbi: [{ verbo: "analizza", etichetta: "Analizza", bersagli: [{ id: "nicchia", etichetta: "Nicchia", comando: "analizza la nicchia" }, { id: "batteria", etichetta: "Batteria", comando: "analizza la batteria" }] }] },
    { id: "taglierina", etichetta: "Taglierina", verbi: [{ verbo: "incidi", etichetta: "Incidi", bersagli: [] }, { verbo: "taglia", etichetta: "Taglia", bersagli: [] }] },
  ],
  servizio: [{ id: "aspetta", etichetta: "Aspetta", comando: "aspetta" }],
  scelte: [],
  suggerimenti: [{ frase: "ANALIZZALA", verbo: "analizza", comando: "analizza la nicchia", cosa: "nicchia", dove: "cosa" }],
};
const coseFinte = [cosaFinta("nicchia", "La nicchia"), cosaFinta("batteria", "La batteria", true), cosaFinta("taglierina", "La taglierina", true)];

test("i baccelli: le uscite, le cose, le azioni; sotto gli attrezzi della tuta e ciò che porti", () => {
  const f = baccelliDi(modelloFinto, coseFinte);
  assert.deepEqual(f.alto.map((g) => g.nome), ["uscite", "qui", "azioni"]);
  assert.deepEqual(f.basso.map((g) => [g.nome, g.baccelli.map((b) => b.etichetta)]), [["attrezzi", ["multiscanner"]], ["con te", ["la batteria", "la taglierina"]]]);
  assert.equal(f.basso[1].baccelli[1].attrezzo, "taglierina", "la taglierina è una cosa e un attrezzo");
  assert.equal(f.alto[0].baccelli[0].titolo, "verso corridoio principale");
  assert.equal(nomeDi({ nome: "L'arca biologica", etichetta: "" }), "l’arca biologica");
  assert.equal(nomeDi({ nome: "Yusuf", etichetta: "" }), "Yusuf");
});

test("i petali: la base vicino, gli attrezzi fuori; Usa con…; l'attrezzo in mano; i costi imparati", () => {
  const p = petaliDi(modelloFinto.qui[0], modelloFinto, new Map([["esamina", 0]]));
  assert.deepEqual(p.map((x) => [x.etichetta, x.anello, x.nota]), [["Esamina", 1, null], ["Analizza", 2, "multiscanner"]]);
  const b = petaliDi(modelloFinto.conTe[0], modelloFinto, new Map([["esamina", -1]]));
  assert.equal(b[0].nota, "−1", "la stima del costo dopo la prima volta (D16)");
  assert.equal(b[1].azione.tipo, "usaCon");
  const t = petaliDi(modelloFinto.conTe[1], modelloFinto, new Map());
  assert.deepEqual(t.filter((x) => x.azione.tipo === "inMano").map((x) => x.etichetta), ["Incidi…", "Taglia…"]);
});

test("i bersagli: in «Usa con…» le seconde cose; un attrezzo in mano solo dove il menu lo mostra", () => {
  const usa = modelloFinto.conTe[0].voci[1];
  assert.deepEqual([...bersagli({ tipo: "usaCon", cosa: "batteria", voce: usa }, modelloFinto)], [["nicchia", "usa la batteria con la nicchia"]]);
  const mano = bersagli({ tipo: "inMano", attrezzo: "multiscanner", verbo: "analizza", etichetta: "Multiscanner" }, modelloFinto);
  assert.deepEqual([...mano.keys()], ["nicchia"], "la batteria che porti non si analizza: il suo menu non ha Analizza");
});

test("i suggerimenti accendono la cosa e il suo petalo", () => {
  assert.deepEqual([...accesiDa(modelloFinto)].sort(), ["comando:analizza la nicchia", "cosa:nicchia"]);
});
