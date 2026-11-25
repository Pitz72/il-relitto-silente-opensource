// ============================================================================
//  Le misure dello schermo di gioco, una schermata ferma alla volta (revisione
//  37, L8: «Testo: grande» anche sul dialogo e sul riquadro a destra; il modo
//  comodo di lanciarle è schermo.mjs). Nel browser dello sviluppo, mentre la prova dei finali
//  gioca da sola (?prova=finali): la prova chiama window.__aOgniPasso a ogni
//  turno e a ogni fiore aperto (app/src/prova/finali.ts), e qui si guarda che
//  cosa non torna: i testi piccoli, quelli fuori dalla finestra, i pulsanti che
//  si toccano, i petali sopra il testo, il dialogo che scorre, le scritte del
//  riquadro a destra fuori posto.
//
//  Uso (npm --prefix app run dev; la finestra alla misura che si vuole provare):
//    1. nella console, le opzioni della prova, con il movimento ridotto (niente è a
//       metà di un'animazione quando si misura) e senza le apparizioni:
//         localStorage.setItem("relitto.opzioni", JSON.stringify({ testoGrande: true, movimento: "ridotto", apparizioni: false }))
//    2. si apre  /?prova=finali  e, appena la pagina c'è:
//         await import("/@fs/<la cartella del progetto>/strumenti/misure/schermo.js")
//    3. quando la prova ha finito (window.__rapportoFinali):
//         window.__schermo.rapporto()
//  Si rifà con testoGrande: false per sapere che cosa c'era già prima.
// ============================================================================
const m = (window.__schermo = {
  finestra: null,
  passi: 0,
  conRamo: 0,
  baccelliMax: 0,
  scalaMin: 1,
  conPiu: 0,
  nascostiMax: 0,
  nascostiSomma: 0,
  fiori: 0,
  petaliMax: 0,
  minimi: {},
  fuori: {},
  toccano: {},
  petali: {},
  dialogo: { passi: 0, scorre: 0, paroleMin: null, semiMax: 0, peggiore: null, fuori: {} },
  visore: { didascalia: {}, strumenti: {}, cifra: {}, mappa: {} },
});

const nome = (el) => (typeof el.className === "string" && el.className ? el.className.split(" ").slice(0, 2).join(".") : el.tagName.toLowerCase());
const tocca = (a, c, t = 1) => a.left < c.right - t && c.left < a.right - t && a.top < c.bottom - t && c.top < a.bottom - t;
const quadro = (r) => [r.left, r.top, r.right, r.bottom].map(Math.round).join(",");
const fotogramma = () => new Promise((r) => { const t = setTimeout(r, 80); requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(t); r(); })); });

/** Il rettangolo che si vede davvero: la finestra, tagliata dai contenitori che scorrono o nascondono. */
function visibile(el) {
  const r = el.getBoundingClientRect();
  let x0 = r.left, y0 = r.top, x1 = r.right, y1 = r.bottom;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const st = getComputedStyle(p);
    if (+st.opacity === 0 || st.visibility === "hidden" || st.display === "none") return null;
    if (/(auto|scroll|hidden|clip)/.test(st.overflow + st.overflowX + st.overflowY)) {
      const q = p.getBoundingClientRect();
      x0 = Math.max(x0, q.left); y0 = Math.max(y0, q.top); x1 = Math.min(x1, q.right); y1 = Math.min(y1, q.bottom);
    }
  }
  return x1 - x0 > 1 && y1 - y0 > 1 ? { r, x0, y0, x1, y1 } : null;
}

function misura(quando) {
  const W = innerWidth, H = innerHeight;
  const gioco = document.querySelector(".gioco");
  if (!gioco) return;
  m.finestra = `${W}x${H}, testo ${gioco.getAttribute("data-testo")}, movimento ${gioco.getAttribute("data-movimento")}`;
  m.passi++;
  const d = document.querySelector(".dialogo");
  const dove = d ? `dialogo con ${d.querySelector(".chi")?.textContent?.trim() ?? "?"}` : (document.querySelector(".turno.attuale .b-stanza h2") ?? [...document.querySelectorAll(".b-stanza h2")].pop())?.textContent?.trim() ?? "?";
  const segna = (dove_, chiave, valore) => { if (!(chiave in dove_)) dove_[chiave] = `${valore} @ ${dove}`; };

  // ---- ogni testo: il corpo più piccolo per classe, e quelli fuori dalla finestra
  for (const el of document.querySelectorAll(".gioco *")) {
    const testo = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
    if (!testo) continue;
    const st = getComputedStyle(el);
    if (st.visibility === "hidden" || st.display === "none" || el.closest(".misura, .solo-lettori, [aria-hidden='true']:not(.ramo), .pannello")) continue;
    const v = visibile(el);
    if (!v) continue;
    const corpo = parseFloat(st.fontSize), k = nome(el);
    if (!(k in m.minimi) || corpo < m.minimi[k][0]) m.minimi[k] = [+corpo.toFixed(1), testo.slice(0, 18)];
    if ((v.r.right > W + 1 || v.r.bottom > H + 1 || v.r.left < -1 || v.r.top < -1) && (v.x1 > W || v.y1 > H || v.x0 < 0 || v.y0 < 0)) segna(m.fuori, `${k} «${testo.slice(0, 20)}»`, quadro(v.r));
  }

  // ---- il ramo: i baccelli fra loro, le etichette, la scritta della mappa
  const b = [...document.querySelectorAll(".ramo .baccello:not(.misura)")]
    .filter((x) => x.style.visibility !== "hidden" && getComputedStyle(x).opacity !== "0")
    .map((x) => ({ t: x.textContent.trim().slice(0, 18), r: x.getBoundingClientRect() }));
  const etichette = [...document.querySelectorAll(".etichetta-ramo")].filter((e) => getComputedStyle(e).opacity !== "0").map((e) => ({ t: e.textContent.trim(), r: e.getBoundingClientRect() }));
  const scrittaMappa = document.querySelector(".visore .mappa figcaption")?.getBoundingClientRect();
  if (b.length) {
    m.conRamo++;
    m.baccelliMax = Math.max(m.baccelliMax, b.length);
    for (let i = 0; i < b.length; i++) {
      for (let j = i + 1; j < b.length; j++) if (tocca(b[i].r, b[j].r, 2)) segna(m.toccano, `${b[i].t} / ${b[j].t}`, "baccelli");
      if (b[i].r.bottom > H - 2 || b[i].r.right > W - 2 || b[i].r.left < 2) segna(m.fuori, `baccello «${b[i].t}»`, quadro(b[i].r));
      if (scrittaMappa && !d && tocca(b[i].r, scrittaMappa)) segna(m.toccano, `baccello ${b[i].t} / scritta della mappa`, quadro(b[i].r));
    }
    for (let i = 0; i < etichette.length; i++) {
      for (const x of b) if (tocca(etichette[i].r, x.r)) segna(m.toccano, `etichetta ${etichette[i].t} / ${x.t}`, `${quadro(etichette[i].r)} su ${quadro(x.r)}`);
      for (let j = i + 1; j < etichette.length; j++) if (tocca(etichette[i].r, etichette[j].r)) segna(m.toccano, `etichetta ${etichette[i].t} / etichetta ${etichette[j].t}`, quadro(etichette[i].r));
      if (scrittaMappa && !d && tocca(etichette[i].r, scrittaMappa)) segna(m.toccano, `etichetta ${etichette[i].t} / scritta della mappa`, `${quadro(etichette[i].r)} su ${quadro(scrittaMappa)}`);
    }
    const scale = [...document.querySelectorAll(".ramo .baccello:not(.misura)")].map((x) => +x.style.getPropertyValue("--scala")).filter((x) => x > 0);
    if (scale.length) m.scalaMin = Math.min(m.scalaMin, ...scale);
    const piu = b.filter((x) => /^\+\d/.test(x.t));
    const nascosti = piu.reduce((a, x) => a + parseInt(x.t.slice(1)), 0);
    if (piu.length) m.conPiu++;
    m.nascostiSomma += nascosti;
    m.nascostiMax = Math.max(m.nascostiMax, nascosti);
  }

  // ---- il fiore: i petali fra loro, sui baccelli, sul testo, fuori
  const fiore = document.querySelector(".fiore.aperto");
  if (fiore) {
    m.fiori++;
    const p = [...fiore.querySelectorAll(".petalo")].filter((x) => x.style.visibility !== "hidden").map((x) => ({ t: x.textContent.trim().slice(0, 18), r: x.getBoundingClientRect() }));
    m.petaliMax = Math.max(m.petaliMax, p.length);
    const lamina = document.querySelector(".lamina")?.getBoundingClientRect();
    const scelta = document.querySelector(".scelta-in-corso")?.getBoundingClientRect();
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) if (tocca(p[i].r, p[j].r, 1)) segna(m.petali, `petali ${p[i].t} / ${p[j].t}`, `${quadro(p[i].r)} su ${quadro(p[j].r)}`);
      for (const x of b) if (tocca(p[i].r, x.r, 1)) segna(m.petali, `petalo ${p[i].t} su baccello ${x.t}`, `${quadro(p[i].r)} su ${quadro(x.r)}`);
      if (p[i].r.right > W - 2 || p[i].r.left < 2) segna(m.petali, `petalo fuori «${p[i].t}»`, quadro(p[i].r));
      if (lamina && p[i].r.top < lamina.bottom - 1 && p[i].r.left < lamina.right) segna(m.petali, `petalo sul testo «${p[i].t}»`, `${Math.round(p[i].r.top)} sopra ${Math.round(lamina.bottom)}`);
      if (scelta && tocca(p[i].r, scelta)) segna(m.petali, `petalo ${p[i].t} su «tocca una cosa accesa»`, quadro(p[i].r));
    }
  }

  // ---- il dialogo: quanto spazio resta alle parole, i semi dentro la finestra e fuori dalla figura
  if (d) {
    const par = d.querySelector(".parole"), semi = [...d.querySelectorAll(".semi button, .ascolta button")];
    if (par) {
      m.dialogo.passi++;
      const troppo = par.scrollHeight - par.clientHeight;
      if (troppo > 2) m.dialogo.scorre++;
      if (m.dialogo.paroleMin === null || par.clientHeight < m.dialogo.paroleMin) m.dialogo.paroleMin = par.clientHeight;
      m.dialogo.semiMax = Math.max(m.dialogo.semiMax, semi.length);
      if (!m.dialogo.peggiore || troppo > m.dialogo.peggiore.troppo)
        m.dialogo.peggiore = { troppo, spazio: par.clientHeight, testo: par.scrollHeight, semi: semi.length, dove, inizio: par.textContent.slice(0, 50) };
      const vista = d.querySelector(".vista")?.getBoundingClientRect();
      for (const s of semi) {
        const r = s.getBoundingClientRect();
        if (r.bottom > H - 2 || r.right > W - 2 || r.top < par.getBoundingClientRect().top) segna(m.dialogo.fuori, `seme fuori «${s.textContent.trim().slice(0, 24)}»`, quadro(r));
        if (vista && r.right > vista.left + 1) segna(m.dialogo.fuori, `seme sulla figura «${s.textContent.trim().slice(0, 24)}»`, `${Math.round(r.right)} oltre ${Math.round(vista.left)}`);
      }
    }
  }

  // ---- il visore: la didascalia sopra gli strumenti, gli strumenti nel loro spazio, la cifra, la mappa
  const v = document.querySelector(".visore");
  if (v && !d) {
    const vr = v.getBoundingClientRect();
    const cap = v.querySelector(".lente figcaption"), str = v.querySelector(".strumenti");
    if (cap && str) {
      const a = cap.getBoundingClientRect(), s = str.getBoundingClientRect();
      const righe = Math.round(a.height / (parseFloat(getComputedStyle(cap).lineHeight) || a.height));
      if (righe > 1 || cap.scrollWidth > vr.width + 1 || a.bottom > s.top + 1) segna(m.visore.didascalia, cap.textContent.trim(), `${righe} righe, larga ${Math.round(cap.scrollWidth)} su ${Math.round(vr.width)}, fondo ${Math.round(a.bottom)} e strumenti a ${Math.round(s.top)}`);
      for (const e of str.querySelectorAll(".etichetta, dt, dd, .numero, .nessuna, .satelliti, .di-bordo")) {
        const r = e.getBoundingClientRect();
        if (!r.width) continue;
        if (r.right > vr.right + 1 || r.bottom > s.bottom + 1 || r.top < s.top - 1) segna(m.visore.strumenti, `${nome(e)} «${e.textContent.trim().slice(0, 22)}»`, `${quadro(r)} fuori da ${quadro(s)}`);
      }
      const i = v.querySelector(".cellula .cifra i");
      if (i && i.textContent.trim()) {
        const r = i.getBoundingClientRect(), cel = v.querySelector(".cellula").getBoundingClientRect();
        const n = Math.round(r.height / (parseFloat(getComputedStyle(i).lineHeight) || r.height));
        m.visore.cifra[i.textContent.trim()] = `${n} ${n === 1 ? "riga" : "righe"}, larga ${Math.round(r.width)} su ${Math.round(cel.width)}`;
      }
    }
    if (scrittaMappa && scrittaMappa.bottom > vr.bottom + 14) segna(m.visore.mappa, "la scritta sotto il visore", `${Math.round(scrittaMappa.bottom)} oltre ${Math.round(vr.bottom)}`);
  }
  void quando;
}

window.__aOgniPasso = async (quando) => {
  await fotogramma();
  // nel dialogo le parole possono aspettare la fine di un'apparizione
  for (let i = 0; i < 300 && document.querySelector(".dialogo .sinistra.attesa"); i++) await new Promise((r) => setTimeout(r, 50));
  try {
    misura(quando);
  } catch (e) {
    m.errore = String(e);
  }
};

/** Il riassunto: i corpi sotto `soglia` px, e tutto quello che non torna. */
m.rapporto = (soglia = 12) => {
  const { rapporto, minimi, ...resto } = m;
  return JSON.stringify({ ...resto, nascostiMedia: +(m.nascostiSomma / Math.max(1, m.conRamo)).toFixed(2), piccoli: Object.fromEntries(Object.entries(minimi).filter(([, x]) => x[0] < soglia - 0.05)) }, null, 1);
};
console.info("[misure dello schermo] pronte: alla fine, window.__schermo.rapporto()");
