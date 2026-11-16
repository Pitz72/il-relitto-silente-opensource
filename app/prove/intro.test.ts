// Le prove della scaletta dell'intro: i tempi sono quelli della regola di lettura (§2.1 di
// 09-intro-storyboard.md, strumenti/intro/tempi.py), allungati dalla voce di L.V. (§13, 29 ottobre 2026) e
// dalle due voci nello spazio, William e Yusuf (§17, 15 novembre 2026).
//   node --test prove/intro.test.ts        (da app/)
import { test } from "node:test";
import assert from "node:assert/strict";
import { ANTICIPO_VOCE, SCALETTA, VOCE, datiPerIlSuono, fermoPer, opacitaBlocco, pezziDellaVoce, scenaA } from "../src/intro/scaletta.ts";
import { MESSAGGIO, REGISTRO } from "../src/intro/spazio.ts";
import { reattori } from "../src/intro/scala.ts";

const blocco = (id: string) => SCALETTA.blocchi.find((b) => b.id === id)!;

test("la durata: 4:48,39 con il libro a ridosso del titolo (era 4:49,24 con William e Yusuf nello spazio; 3:24,16 con i titoli di testa; 3:02,12; 2:40,75 prima della voce di L.V.)", () => {
  assert.equal(SCALETTA.durata, 288.39);
});

test("le inquadrature del 16 novembre: il passaggio sul beep di Yusuf, i due dettagli in F, il quadro largo che torna prima di «La vedo pulsare» e si allarga fino al titolo", () => {
  const M = SCALETTA.momenti;
  assert.deepEqual(M.passaggio, [M.messaggio[0], SCALETTA.scene[2].inizio]);
  // i tagli si susseguono senza buchi, dentro F e prima dei glifi
  assert.ok(M.sensori[0] > M.scala[1] && M.sensori[0] < M.scala[1] + 1);
  assert.equal(M.sensori[1], M.cerca[0]);
  assert.equal(M.cerca[1], M.allarga[0]);
  assert.equal(M.allarga[1], M.glifi[0]);
  // ogni dettaglio dura abbastanza per guardarlo, e il quadro largo torna prima che L.V. dica «La vedo pulsare»
  assert.ok(M.sensori[1] - M.sensori[0] > 10 && M.cerca[1] - M.cerca[0] > 10);
  assert.ok(M.allarga[0] < blocco("B9").pezzo!.t);
  assert.ok(M.cerca[0] < blocco("B7").pezzo!.t);
});

test("il tema di Alirio: tre passaggi, il punto più forte sul titolo, la musica fino al gioco", () => {
  const M = SCALETTA.momenti;
  // il primo quando si apre lo spazio, il secondo poco prima della plancia, il terzo nella seconda parte di L.V.
  assert.ok(M.tema < M.temaDaCapo && M.temaDaCapo < M.temaTerzo);
  assert.ok(M.temaTerzo > SCALETTA.scene[5].inizio && M.temaTerzo < M.glifi[0]);
  // il tema ha il suo punto più forte a 36 s: cade sul titolo intero
  assert.equal(Math.round((blocco("T").pieno - M.temaTerzo) * 100) / 100, 36);
  // la musica piena dura un minuto: dal terzo passaggio copre fino alla fine dell'intro
  assert.ok(SCALETTA.durata - M.temaTerzo < 60, "la musica piena non arriva al gioco");
  // nessun passaggio lascia un buco: ognuno comincia prima che quello di prima sia finito (1:52)
  assert.ok(M.temaDaCapo - M.tema < 112 && M.temaTerzo - M.temaDaCapo < 112);
  assert.equal(datiPerIlSuono().momenti.temaTerzo, M.temaTerzo);
});

test("nei dettagli di F i reattori sono spenti, nel passaggio accesi", () => {
  assert.equal(reattori("sensori", 30).forza, 0);
  assert.equal(reattori("cerca", 40).brace, 0);
  assert.equal(reattori("passaggio", 10).forza, 1);
});

test("la regola di lettura: 0,35 s per parola più 2, mai meno di 4", () => {
  assert.deepEqual(fermoPer("Ho insistito io."), { fermo: 4, parole: 3 });
  assert.deepEqual(fermoPer("i numeri mi arrivano tardi, uno alla volta, e lo so cosa vuol dire."), { fermo: 6.9, parole: 14 });
});

test("i testi entrano, sono pieni ed escono quando dicono la regola e la voce", () => {
  const attesi: Record<string, [number, number, number]> = {
    B0: [7.4, 8.6, 15.1], B1: [16, 17.2, 29.55], B2: [37.05, 38.25, 47.9], B3: [48.8, 50, 68.15],
    B4: [61.03, 62.23, 68.15], B5: [207.77, 208.97, 222.3], B6: [216.1, 217.3, 222.3], B7: [222.9, 224.1, 231.39],
    B8: [231.99, 233.19, 239.76], B9: [240.36, 241.56, 250.19], B10: [250.79, 251.99, 256.99], T: [264.79, 265.99, 273.14],
  };
  for (const [id, [entra, pieno, via]] of Object.entries(attesi)) {
    const b = blocco(id);
    assert.deepEqual([b.entra, b.pieno, b.via], [entra, pieno, via], id);
  }
});

test("le scene cominciano dove dice la scaletta", () => {
  const inizi = Object.fromEntries(SCALETTA.scene.map((s) => [s.id, s.inizio]));
  assert.deepEqual(inizi, { A: 0, B: 78.65, C: 162.47, D: 175.27, E: 184.27, F: 207.77, G: 257.99, H: 279.39 });
  // da C in poi le scene durano quanto prima: è B che è cresciuta (le due voci), F (le due frasi di L.V. che
  // stavano in B) e G (il libro dopo il titolo; dal 16 novembre a ridosso, e G si è accorciata di 0,95 s)
  const dura = Object.fromEntries(SCALETTA.scene.map((s) => [s.id, Math.round((s.fine - s.inizio) * 100) / 100]));
  assert.deepEqual([dura.C, dura.D, dura.E, dura.H], [12.8, 9, 23.5, 9]);
  assert.equal(scenaA(170).id, "C");
  assert.equal(scenaA(300).id, "H");
});

test("un blocco che continua la frase attenua quello sopra, ed escono insieme", () => {
  const b3 = blocco("B3");
  assert.equal(opacitaBlocco(b3, 53), 1);
  assert.ok(opacitaBlocco(b3, 63) < 0.7 && opacitaBlocco(b3, 63) > 0.5);
  assert.equal(opacitaBlocco(b3, 68.2), 0);
});

test("i sottotitoli dei suoni stanno dentro l'intro e in ordine", () => {
  let prima = 0;
  for (const s of SCALETTA.sottotitoli) {
    assert.ok(s.inizio >= prima - 0.01 && s.fine > s.inizio && s.fine <= SCALETTA.durata, s.testo);
    prima = s.inizio;
  }
});

test("la scala dura 23,5 s e si ferma a 23", () => {
  assert.deepEqual(SCALETTA.momenti.scala, [184.27, 207.77]);
  assert.equal(SCALETTA.momenti.scalaFerma, 207.27);
  // i reattori si spengono mentre la camera è ancora vicina (arretra dal terzo secondo): il suono lo segue
  assert.deepEqual(SCALETTA.momenti.reattori, [185.57, 187.47]);
});

test("la voce di L.V.: ogni frase comincia con il suo testo, e il testo resta finché l'ha detta", () => {
  const pezzi = pezziDellaVoce();
  assert.equal(pezzi.length, 7, "sette pezzi: B1, B2, B3 con B4, B5 con B6, B7, B8, B9");
  for (const b of SCALETTA.blocchi) {
    const v = VOCE[b.id as keyof typeof VOCE];
    if (!v) continue;
    // il pezzo che contiene questo blocco: il suo, o quello del blocco sopra
    const p = b.pezzo ?? blocco(b.sottoA!).pezzo!;
    if (b.pezzo) assert.equal(p.t, Math.round((b.entra + ANTICIPO_VOCE) * 100) / 100, `${b.id}: la voce non comincia con il testo`);
    const prima = p.t + (v.parola - p.da), ultima = p.t + (v.fine - p.da);
    assert.ok(prima >= b.entra, `${b.id}: la prima parola arriva prima del testo`);
    assert.ok(ultima + 0.79 <= b.esce, `${b.id}: il testo comincia a uscire prima dell'ultima parola`);
    // e il pezzo, respiri compresi, finisce prima che il testo se ne sia andato: il blocco dopo non gli comincia sopra
    assert.ok(p.t + (p.a - p.da) <= b.via + 0.01, `${b.id}: la voce va oltre il suo testo`);
  }
});

test("nello spazio: William comincia quando il nero è diventato cielo, Yusuf subito dopo, e poi la plancia", () => {
  // l'autore, 15 novembre 2026: «quando finisce la transizione tra il nero con la luce verde e lo spazio […] parte
  // intro di Leonardo»; «Subito dopo il pezzo di William c'è un beep tipo registrazione e si sente il pezzo di
  // Yusuf […] tutto molto legato, senza lasciare troppi spazi vuoti»
  const m = SCALETTA.momenti;
  assert.ok(m.registro[0] >= m.stella[1] && m.registro[0] <= m.stella[1] + 1, `William a ${m.registro[0]}, lo spazio a ${m.stella[1]}`);
  assert.equal(Math.round((m.registro[1] - m.registro[0]) * 100) / 100, REGISTRO.dura);
  assert.equal(Math.round((m.messaggio[1] - m.messaggio[0]) * 100) / 100, MESSAGGIO.dura);
  const fra = m.messaggio[0] - m.registro[1];
  assert.ok(fra >= 0.2 && fra <= 0.6, `fra William e il beep di Yusuf passano ${fra.toFixed(2)} s`);
  const c = SCALETTA.scene.find((s) => s.id === "C")!.inizio;
  assert.ok(c - m.messaggio[1] >= 1 && c - m.messaggio[1] <= 2, "dopo Yusuf, un respiro, e la plancia");
  // le frasi, per chi non sente le voci: otto di William e cinque di Yusuf, una dopo l'altra, dentro la scena B
  const frasi = SCALETTA.blocchi.filter((b) => b.voce === "william" || b.voce === "yusuf");
  assert.deepEqual(frasi.map((b) => b.id), ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "Y1", "Y2", "Y3", "Y4", "Y5"]);
  for (const [i, b] of frasi.entries()) {
    assert.equal(b.scena, "B");
    assert.ok(b.entra < b.pieno && b.pieno < b.esce && b.esce < b.via, b.id);
    if (i) assert.ok(b.entra >= frasi[i - 1].via - 0.01, `${b.id} entra sopra la frase di prima`);
  }
  assert.ok(frasi[0].entra >= m.registro[0] - 0.1 && frasi[frasi.length - 1].via <= c + 0.01);
  assert.ok(frasi[0].testo.startsWith("«Registro di bordo della Santa Maria.") && frasi[7].testo.endsWith("Nessun contatto. W. T.»"));
  assert.ok(frasi[8].testo.startsWith("«William. Sono Yusuf.") && frasi[12].testo.endsWith("Magazzino Quattro, chiudo.»"));
  // Yusuf dice «William», mai «Will»
  assert.ok(!frasi.some((b) => /\bWill\b/.test(b.testo)));
});

test("il tema ricomincia da capo prima della plancia, e da lì cade sulle immagini come cadeva", () => {
  // il tema dura 1:52: quando B durava venti secondi entrava 20,17 s prima della plancia e arrivava al titolo
  const m = SCALETTA.momenti;
  const c = SCALETTA.scene.find((s) => s.id === "C")!.inizio;
  assert.equal(Math.round((c - m.temaDaCapo) * 100) / 100, 20.17);
  assert.ok(m.temaDaCapo > m.messaggio[0] && m.temaDaCapo < m.messaggio[1], "ricomincia sotto il messaggio di Yusuf");
  // la prima volta è già alla coda (il tema è pieno per 56 secondi)
  assert.ok(m.temaDaCapo - m.tema > 56, `ricomincia dopo ${(m.temaDaCapo - m.tema).toFixed(1)} s`);
  // e la sua coda arriva fino all'ultima frase di L.V. (prima fino al titolo: la seconda parte della traccia ha due
  // frasi in più, ma là il tema è già un filo, cinquanta decibel sotto)
  assert.ok(m.temaDaCapo + 112 > blocco("B9").entra);
});

test("il motore audio riceve le due voci: quando cominciano e quanto durano", () => {
  const d = datiPerIlSuono();
  assert.deepEqual(d.registro, [SCALETTA.momenti.registro[0], REGISTRO.dura]);
  assert.deepEqual(d.messaggio, [SCALETTA.momenti.messaggio[0], MESSAGGIO.dura]);
  assert.equal(d.voce.length, 7);
  assert.equal(d.stampe.length, 2);
  // nessun pezzo di L.V. suona mentre parlano William e Yusuf
  for (const p of d.voce) assert.ok(p.t + (p.a - p.da) <= d.registro[0] || p.t >= d.messaggio[0] + d.messaggio[1], "L.V. parla sopra le voci nello spazio");
});

test("il cuore della cosa viva batte dopo «La vedo pulsare», mentre c'è ancora il suo testo", () => {
  const m = SCALETTA.momenti;
  assert.ok(m.pulsare > m.pulsa[0] && m.pulsare + 1.5 < m.pulsa[1], `«pulsare» finisce a ${m.pulsare} s`);
});

test("la musica entra quando si apre lo spazio, prima che William parli", () => {
  const m = SCALETTA.momenti;
  assert.ok(m.tema > m.stella[0] && m.tema < m.naveB, `il tema a ${m.tema} s`);
  assert.ok(m.tema < m.registro[0]);
});

test("i reattori della Santa Maria: accesi quando la scala comincia, spenti prima che la camera arretri", () => {
  assert.deepEqual(reattori("scala", 0.5), { forza: 1, lunga: 1, brace: 0 });
  // a metà dello spegnimento la fiamma è più corta e più debole
  const meta = reattori("scala", 2.2);
  assert.ok(meta.forza > 0 && meta.forza < 0.6 && meta.lunga < 1, JSON.stringify(meta));
  // la camera comincia ad arretrare al terzo secondo: la fiamma non c'è più, resta la brace
  assert.equal(reattori("scala", 3.3).forza, 0);
  assert.ok(reattori("scala", 3.3).brace > 0.8);
  // e la brace si raffredda: da lontano, e nel menu, gli scarichi sono spenti
  assert.ok(reattori("scala", 20).brace < 0.01);
  // nel margine la nave arriva con i reattori accesi
  assert.deepEqual(reattori("margine", 10), { forza: 1, lunga: 1, brace: 0 });
});
