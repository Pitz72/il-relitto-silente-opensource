//! La regia del suono: dal turno del gioco al mondo sonoro (bibbia sonora, §2–§5).
//!
//! A ogni turno il gioco manda gli stati e gli eventi del ponte. La regia ne ricava:
//! - **la stanza** (stanze.rs) e la sua aria: il riverbero, il re, i fondi, il brusio,
//!   le piogge di eventi, gli strati che sono solo suoi, la superficie dei passi;
//! - **la scena del mix** (§2.2): la Santa Maria, il visore, il vuoto, il relitto, la
//!   protezione vitale, la fuga, l’ipossia, l’anticamera, la casa;
//! - **il suono di ogni evento** (§4): i passi da una stanza all’altra, il boccaporto, la
//!   porta interna, il primo contatto, i tagli, il groviglio, la Grande Porta, l’energia,
//!   il sonaglio, il clic armonioso, i finali…
//!
//! Tutto quello che dura (un fondo, un ronzio, il battito del seme) dipende dallo stato,
//! e si ricalcola a ogni turno (`applica`); quello che accade una volta sola dipende
//! dall’evento (`evento_gioco`). Un caricamento rimette lo stato senza suonare gli
//! eventi.

use serde_json::Value;

use super::ambienti::FormaRonzio;
use super::colpi::{self, Bus, Corpo, Tonfo, CLIC_ARMONIOSO};
use super::dsp::{db, Biquad, Scorrevole};
use super::stanze::{self, Luogo, Speciale, Specie, Superficie};
use super::stato::{EventoGioco, StatiGioco, TurnoSuono};
use super::{
    Ambiente, Azione, Evento, Mondo, Nave, LIV_BRUSIO, LIV_FILO, LIV_GEMITO, LIV_PASSI, LIV_POMPE, LIV_RE,
    LIV_RE_OSSA, LIV_RE_RAMPA, LIV_VENTILAZIONE, LIV_VENTOLA,
};

/// Le note dell’accordo della traduzione completa: il sol diesis delle creature, con la
/// sua quinta, su due ottave.
const ACCORDO: [f32; 4] = [103.826, 155.563, 207.652, 311.127];

/// Tutti gli eventi che il ponte può mandare (collaudo/eventi.py, la tabella), più il
/// caricamento: la regia li conosce tutti, quelli che suonano e quelli che per il suono
/// sono solo stato. La prova delle partite controlla che non ne arrivi uno sconosciuto.
pub const EVENTI_NOTI: [&str; 85] = [
    "accostamento", "altare", "ambra", "archivio_forzato", "archivio_saluta", "aria", "arpioni", "assestamento",
    "attrezzo", "bengala_acceso", "bengala_spento", "boccaporto", "brusio_cala", "caricamento", "casco_tolto",
    "cassetta", "cella", "chiave", "connessione", "crollo", "dialogo", "dialogo_fine", "discesa", "disco_liberato",
    "dispositivo_medico", "eco", "energia", "faro_basso", "faro_pieno", "finale", "fuga", "giuntura_tagliata",
    "giuntura_trovata", "grande_porta", "groviglio_desto", "groviglio_prende", "groviglio_sente", "incrinature",
    "inizio", "ipossia", "kit", "matrice", "nodo", "nota_reattore", "nota_riconosciuta", "pannello", "pareti_lampo",
    "porta_interna", "porta_tonda", "postazione", "primo_contatto", "protezione", "protezione_fine",
    "protezione_fuga", "radio", "reattore_ascoltato", "reattore_toccato", "registro", "ricarica", "rientro",
    "risonanza", "risuonata", "risuonatore_lasciato", "risuonatore_preso", "risuonatore_staccato",
    "risuonatore_toccato", "scansione_lunga", "scatola_nera", "seme_lasciato", "seme_preso", "seme_spento",
    "sistema", "sonaglio", "stanza", "tacche", "taglio", "teca_serra", "terminale", "traccia",
    "traduzione_completa", "varco_richiuso", "venature_spente", "venature_verdi", "vestizione", "voce_dei_nomi",
];

impl Mondo {
    // --------------------------------------------------------------------------------
    //  Il turno
    // --------------------------------------------------------------------------------

    /// Un turno del gioco: lo stato nuovo, la stanza, la scena, gli eventi.
    pub(super) fn turno(&mut self, t: TurnoSuono) {
        let sr = self.sr;
        let prima = std::mem::replace(&mut self.gioco, t.stati);
        let primo = !self.modo_gioco;
        self.modo_gioco = true;
        let ha = |nome: &str| t.eventi.iter().any(|e| e.evento == nome);
        let inizio = ha("inizio");
        let carica = primo || inizio || ha("caricamento");
        if carica {
            // una partita che comincia o si riprende: niente di quello che restava della fine
            self.casa = false;
            self.spento = false;
            self.stiva_viva = false;
            self.ventola_spenta = false;
            self.ventola.giri = Scorrevole::nuovo(1.0);
            self.automazioni.clear();
            self.ingresso = Scorrevole::nuovo(0.0);
            self.ingresso.verso(1.0, if inizio { 3.0 } else { 1.5 }, sr);
        }

        // la stanza
        let nuova = stanze::stanza(&self.gioco.stanza);
        let cambia = nuova.map(|s| s.id) != self.stanza.map(|s| s.id);
        if cambia {
            let da = self.stanza.map(|s| s.id);
            self.stanza = nuova;
            self.t_stanza = 0.0;
            self.cuore.g.verso(0.0, 1.0, sr);
            self.acufene.g.verso(0.0, 1.0, sr);
            // il re della rampa: sullo scafo si sente solo vicino al boccaporto
            match (da, nuova.map(|s| s.id)) {
                (_, Some("scafo")) if self.gioco.in_fuga() => {
                    // nella fuga, dal varco verso casa: il re torna nelle ossa piano
                    self.re_rampa = Scorrevole::nuovo(0.0);
                    self.re_rampa.verso(1.0, 8.0, sr);
                }
                (Some("stiva"), Some("scafo")) => {
                    self.re_rampa = Scorrevole::nuovo(1.0);
                    self.dopo(5.0, Azione::Rampa(0.0, 6.0));
                }
                (_, Some("scafo")) => self.re_rampa = Scorrevole::nuovo(0.3),
                _ => self.re_rampa.verso(1.0, 1.0, sr),
            }
        }

        // la tuta: vera subito, tranne quando la si indossa (il casco si blocca dopo tre secondi)
        if self.gioco.tuta != self.tuta {
            if ha("vestizione") && !carica {
                self.dopo(3.0, Azione::Tuta);
            } else {
                self.tuta = self.gioco.tuta;
            }
        }
        self.nave = match self.gioco.aggancio.as_deref() {
            Some("accostato") => Nave::Accostata,
            Some("fatto") => Nave::Agganciata,
            _ => Nave::Libera,
        };
        if carica {
            if let Some(a) = self.gioco.aria {
                self.aria = a;
                self.fiato.aria = a;
            }
            self.protezione = self.gioco.protezione;
            self.protezione_eff = self.protezione;
            self.aggiorna_ipossia();
        } else if self.gioco.protezione != self.protezione {
            self.cambia_protezione(self.gioco.protezione, true);
        }

        let passaggio = if carica {
            1.5
        } else if ha("boccaporto") {
            7.0
        } else if ha("rientro") {
            4.0
        } else if ha("discesa") {
            1.5
        } else if ha("porta_interna") {
            3.0
        } else {
            2.5
        };
        self.applica(passaggio);
        // la membrana dell’interfaccia (§5.8): cresce al primo contatto, e in una partita
        // che si riprende c’è già tutta
        self.aggiorna_membrana(carica);

        if carica {
            return;
        }
        let taglio = ha("taglio");
        for e in &t.eventi {
            self.evento_gioco(e, &prima, taglio);
        }
    }

    /// Il mondo di adesso: la camera di compensazione è vuota finché la porta interna
    /// non si apre.
    pub(super) fn luogo(&self) -> Luogo {
        match self.stanza.map(|s| s.luogo) {
            Some(Luogo::Camera) => {
                if StatiGioco::e(&self.gioco.porta_interna, "aperta") {
                    Luogo::Relitto
                } else {
                    Luogo::Vuoto
                }
            }
            Some(l) => l,
            None => Luogo::SantaMaria,
        }
    }

    // --------------------------------------------------------------------------------
    //  Lo stato: la scena, la stanza, gli strati che durano
    // --------------------------------------------------------------------------------

    /// Ricava dallo stato tutto quello che dura, e ci va in `t` secondi.
    pub(super) fn applica(&mut self, t: f32) {
        let sr = self.sr;
        let s = self.stanza;
        let id = s.map(|s| s.id).unwrap_or("");
        let luogo = self.luogo();
        let tuta = self.tuta && !self.casa;
        let fuga = self.gioco.in_fuga();
        let p = self.protezione_eff && tuta;
        let muto = s.is_none() || self.spento;
        let ha = |sp: Speciale| s.is_some_and(|s| s.speciali.contains(&sp));
        let g = &self.gioco;
        let energia = g.energia_ripristinata();
        let bengala = StatiGioco::e(&g.bengala, "acceso");
        let relitto = luogo == Luogo::Relitto;

        // ---- le strade (§2.2)
        let (aria, guscio, cuffia, em, casco, ossa, fruscio) = if muto {
            (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0)
        } else if self.casa {
            (1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0)
        } else {
            match luogo {
                Luogo::SantaMaria if tuta => (0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0),
                Luogo::SantaMaria => (1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0),
                Luogo::Vuoto => (0.0, 0.0, 0.0, 0.0, 1.0, 1.0, if p { 0.0 } else { 1.0 }),
                _ if p => (0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0),
                _ => (0.0, db(-8.0), 1.0, 1.0, 1.0, 1.0, 1.0),
            }
        };
        let ossa = ossa * if fuga && luogo != Luogo::SantaMaria { db(6.0) } else { 1.0 };
        self.w_aria.verso(aria, t, sr);
        self.w_guscio.verso(guscio, t, sr);
        self.w_cuffia.verso(cuffia, t, sr);
        self.w_em.verso(em, t, sr);
        self.w_casco.verso(casco, t, sr);
        self.w_ossa.verso(ossa, t, sr);
        self.w_fruscio.verso(fruscio, t, sr);
        self.asciutto.verso(if id == "anticamera" { 1.0 } else { 0.0 }, t, sr);
        // con la protezione vitale il fiato si fa più vicino
        self.fiato_g.verso(if p { db(2.0) } else { 1.0 }, t.min(1.2), sr);
        if !self.fiato_morente() {
            self.fiato.acceso = tuta && !muto;
        }
        self.fiato.sforzo = fuga && !muto;
        let ventola = tuta && !muto && !self.ventola_spenta;
        if !self.ventola_spenta {
            self.ventola.g.verso(if ventola { db(LIV_VENTOLA) } else { 0.0 }, t, sr);
        }

        // ---- la stanza: la sua aria
        match s {
            Some(st) if !muto => {
                let (rb, ra, umido, dim) = st.riverbero;
                let umido = if luogo == Luogo::Vuoto { 0.0 } else { umido };
                self.riverbero.stanza(rb, ra, umido, dim, t);
            }
            _ => self.riverbero.stanza(0.5, 0.3, 0.0, 1.0, t),
        }

        // ---- il re
        let (mut re_a, mut re_o, mut taglio) = match s.and_then(|s| s.re) {
            Some(r) => (r.aria.map(|x| db(LIV_RE + x)).unwrap_or(0.0), r.ossa.map(|x| db(LIV_RE_OSSA + x)).unwrap_or(0.0), r.taglio),
            None => (0.0, 0.0, 180.0),
        };
        if id == "scafo" {
            re_o = db(LIV_RE_RAMPA);
        }
        if self.casa {
            // il casco tolto: «l’aria piena, il re pieno»
            re_a = db(LIV_RE + 2.0);
            re_o = db(LIV_RE_OSSA);
            taglio = 600.0;
        }
        if self.nave != Nave::Libera {
            re_a *= db(-6.0);
            re_o *= db(-6.0);
        }
        if muto {
            re_a = 0.0;
            re_o = 0.0;
        }
        self.re.g.verso(if re_a + re_o > 0.0 { 1.0 } else { 0.0 }, t, sr);
        self.re_aria.verso(re_a, t, sr);
        self.re_ossa.verso(re_o, t, sr);
        self.re_taglio.verso(taglio, t, sr);
        // «Il reattore abbassa il suo lamento»: meno armonici alti, l’altezza ferma
        self.re.alti.verso(if self.nave == Nave::Libera { 1.0 } else { db(-12.0) }, 4.0, sr);
        // agganciata, «ogni minuto così costa reattore»: i battimenti si stringono
        self.re.scarto.verso(if self.nave == Nave::Agganciata { 0.2 } else { 0.11 }, 6.0, sr);
        // la nota riconosciuta: il re risuona in due, l’ottavo armonico un poco più forte
        self.re.ottavo.verso(if StatiGioco::e(&g.nota, "riconosciuta") { 1.0 } else { 0.0 }, 3.0, sr);

        // ---- i fondi della Santa Maria
        match s.and_then(|s| s.ventilazione) {
            Some((d, griglia)) if !muto => {
                self.ventilazione.g.verso(db(LIV_VENTILAZIONE + d), t, sr);
                self.ventilazione.griglia_g = griglia;
            }
            _ => self.ventilazione.g.verso(0.0, t, sr),
        }
        match s.and_then(|s| s.pompe) {
            Some((d, taglio)) if !muto => {
                self.pompe.g.verso(db(LIV_POMPE + d), t, sr);
                self.pompe_taglio.verso(taglio, t, sr);
            }
            _ => self.pompe.g.verso(0.0, t, sr),
        }

        // ---- il fondo del relitto: l’aria ferma
        match s.and_then(|s| s.fondo) {
            Some(f) if !muto && luogo != Luogo::Vuoto => {
                // la teca aperta: «anche il fondo della cuffia scende di 6 dB»
                let liv = f.livello - if id == "serra morente" && StatiGioco::e(&g.teca, "svuotata") { 6.0 } else { 0.0 };
                self.fondo.imposta(f.taglio, f.respiro, t);
                self.fondo.g.verso(db(liv), t, sr);
            }
            _ => self.fondo.g.verso(0.0, t, sr),
        }

        // ---- il brusio (§5.2)
        let incastrato = StatiGioco::e(&g.risuonatore, "incastrato");
        let (quanti, livello, via, lato) = if muto || p {
            (0.0, None, Bus::Em, 0.0)
        } else if self.stiva_viva {
            // la fine, con il risuonatore: «un brusio che viene da giù, dalla stiva»
            (12.0, Some(LIV_BRUSIO - 10.0), Bus::Esterno, 0.0)
        } else if g.risuonatore_con_te {
            // il risuonatore portato: dalla mano, un poco a destra, in ogni stanza
            let via = if self.casa || (luogo == Luogo::SantaMaria && !tuta) { Bus::Esterno } else { Bus::Em };
            (40.0, Some(LIV_BRUSIO + 6.0), via, 0.35)
        } else if relitto {
            match s.and_then(|s| s.brusio) {
                // staccato il risuonatore, nel vestibolo resta solo la gola
                Some(_) if id == "vestibolo delle gole" && !incastrato => (10.0, Some(LIV_BRUSIO - 4.0), Bus::Em, -0.2),
                Some((n, d)) => (n, Some(LIV_BRUSIO + d), Bus::Em, 0.0),
                None => (0.0, None, Bus::Em, 0.0),
            }
        } else {
            (0.0, None, Bus::Em, 0.0)
        };
        self.brusio_base = livello.map(db).unwrap_or(0.0);
        self.brusio_quanti = quanti;
        if quanti > 0.0 {
            self.brusio_via = via;
            self.brusio.quanti.verso(quanti, t, sr);
            self.brusio.guadagno.verso(self.brusio_base, t, sr);
            self.brusio.lato.verso(lato, t, sr);
        } else if !self.radio_accesa {
            self.brusio.guadagno.verso(0.0, t.min(1.0), sr);
            self.brusio.quanti.verso(0.0, t, sr);
        }
        // la radio agganciata, in plancia: «un fruscio che non è statica», a tratti
        if self.nave == Nave::Agganciata && id == "plancia" && !muto && quanti == 0.0 {
            if self.t_radio > 1e8 {
                self.t_radio = 6.0;
            }
        } else {
            self.t_radio = 1e9;
        }

        // ---- gli strati che sono solo di qualche stanza
        self.toppe.g.verso(if ha(Speciale::Toppe) && !muto { db(-8.0) } else { 0.0 }, t, sr);

        // il groviglio: segue il faro, il bengala, l’energia, la fuga (§3.9, §5.6)
        let gr = &mut self.groviglio;
        if muto {
            gr.g.verso(0.0, t, sr);
        } else if ha(Speciale::Groviglio) {
            let (densita, vicino, centro, larghezza, frusta, liv, tv) = if StatiGioco::e(&g.groviglio, "desto") {
                (14.0, 0.9, 0.0, 1.0, 0.75, -2.0, 2.0)
            } else if bengala {
                // tutto il groviglio va verso il finto sole: la strada libera intorno a te
                (16.0, 0.45, 0.0, 0.25, 0.1, -4.0, 3.0)
            } else if energia {
                // il campo regge a tratti: dove passa, il groviglio si piega e tace
                (2.5, 0.3, 0.0, 1.0, 0.0, -8.0, 3.0)
            } else if StatiGioco::e(&g.minaccia, "vicina") {
                (10.0, 0.85, 0.0, 0.9, 0.2, -2.0, 3.0)
            } else if StatiGioco::e(&g.faro, "pieno") {
                // sente la luce e viene verso di te, piano
                (6.0, 0.7, 0.0, 0.9, 0.05, -4.0, 25.0)
            } else {
                // «si è fermato a mezz’aria e cerca»: fruscii radi, lenti, che girano
                (3.0, 0.3, 0.0, 1.0, 0.0, -6.0, 4.0)
            };
            gr.densita.verso(densita, t, sr);
            gr.vicino.verso(vicino, tv, sr);
            gr.centro.verso(centro, 3.0, sr);
            gr.larghezza.verso(larghezza, 3.0, sr);
            gr.frusta.verso(frusta, t, sr);
            gr.g.verso(db(liv), t, sr);
        } else if ha(Speciale::GroviglioLontano) {
            // di là dalla parete est, verso il calore del vivaio
            gr.densita.verso(3.0, t, sr);
            gr.vicino.verso(0.12, t, sr);
            gr.centro.verso(0.75, t, sr);
            gr.larghezza.verso(0.15, t, sr);
            gr.frusta.verso(0.0, t, sr);
            gr.g.verso(db(-10.0), t, sr);
        } else if ha(Speciale::GroviglioInFondo) {
            // «In fondo, a ovest, senti un fruscio che conosci»
            gr.densita.verso(4.0, t, sr);
            gr.vicino.verso(0.25, t, sr);
            gr.centro.verso(-0.7, t, sr);
            gr.larghezza.verso(0.2, t, sr);
            gr.frusta.verso(0.3, t, sr);
            gr.g.verso(db(-8.0), t, sr);
        } else {
            gr.g.verso(0.0, t, sr);
        }

        // i soffi d’aria: il germinatoio che respira, il filo d’aria nel tubo, le canne
        let (cfg, banda, q, liv) = if ha(Speciale::Germinatoio) {
            (1, (180.0, 420.0), 2.5, -8.0)
        } else if ha(Speciale::VentoTubo) {
            (2, (350.0, 1100.0), 7.0, -16.0)
        } else if ha(Speciale::VentoCanne) {
            (3, (900.0, 2600.0), 9.0, -20.0)
        } else {
            (0, (400.0, 900.0), 4.0, -60.0)
        };
        if cfg != 0 && cfg != self.vento_cfg {
            self.vento.imposta(banda, q);
            self.vento_cfg = cfg;
        }
        self.vento.g.verso(if cfg != 0 && !muto { db(liv) } else { 0.0 }, t, sr);

        // i crepitii: le scintille del proiettore rotto, la statica, la polvere che cade
        let disco_libero = StatiGioco::e(&g.disco, "staccato");
        let (cfg, liv, casco_bus) = if ha(Speciale::Scintille) && !disco_libero {
            (1, -14.0, false)
        } else if ha(Speciale::Statica) {
            (2, -24.0, true)
        } else if ha(Speciale::Tremito) {
            (3, -28.0, false)
        } else {
            (0, -60.0, false)
        };
        if cfg != 0 && cfg != self.crepitio_cfg {
            match cfg {
                1 => self.crepitio.imposta(16.0, 0.9, [1900.0, 3300.0, 5200.0], 0.02, 2500.0, sr),
                2 => self.crepitio.imposta(7.0, 0.6, [3200.0, 5600.0, 8100.0], 0.004, 3000.0, sr),
                _ => self.crepitio.imposta(70.0, 0.5, [3100.0, 4700.0, 6500.0], 0.003, 2500.0, sr),
            }
            self.crepitio_cfg = cfg;
        }
        if cfg != 0 {
            self.crepitio_casco = casco_bus;
        }
        self.crepitio.g.verso(if cfg != 0 && !muto { db(liv) } else { 0.0 }, t, sr);

        // il fuoco del bengala, finché brucia
        let fuoco = bengala && relitto && !muto;
        self.fuoco.g.verso(if fuoco { db(-16.0) } else { 0.0 }, if fuoco { 0.6 } else { 2.5 }, sr);
        self.fuoco_crepitio.g.verso(if fuoco { db(-18.0) } else { 0.0 }, if fuoco { 0.6 } else { 2.5 }, sr);

        // il tremito: nella fuga, ovunque fuori dalla Santa Maria
        let tremito = if muto {
            0.0
        } else if ha(Speciale::Tremito) {
            db(-4.0)
        } else if fuga && luogo != Luogo::SantaMaria {
            db(-8.0)
        } else {
            0.0
        };
        self.tremito.g.verso(tremito, t, sr);

        // il battito: la serra finché la teca è sigillata, poi il seme nella mano
        let serra = ha(Speciale::Vibrazione) && !StatiGioco::e(&g.teca, "svuotata");
        let seme = g.seme_con_te && StatiGioco::e(&g.seme, "vivente");
        if !muto && serra {
            self.seme.periodo = 1.15;
            self.seme.f = 38.0;
            self.seme.g.verso(db(-4.0), t, sr);
        } else if !muto && seme {
            self.seme.periodo = 1.15;
            self.seme.f = 44.0;
            self.seme.g.verso(db(-12.0), t, sr);
        } else {
            self.seme.g.verso(0.0, t.min(1.0), sr);
        }

        // l’anticamera: il cuore e il fischio arrivano dopo, da soli (mod.rs)
        if id != "anticamera" || muto || self.mix.intensi_ridotti {
            self.cuore.g.verso(0.0, 1.0, sr);
            self.acufene.g.verso(0.0, 1.0, sr);
        }

        // i ronzii, intorno al sol diesis
        let archivio = g.archivio.as_deref();
        let ronzio = if ha(Speciale::Proiettori) {
            Some((FormaRonzio::Coro, -20.0))
        } else if ha(Speciale::Pilastro) {
            match archivio {
                Some("salutato") => Some((FormaRonzio::Continuo, -14.0)),
                Some("forzato") => None,
                _ => Some((FormaRonzio::Pulsante, -16.0)),
            }
        } else if ha(Speciale::Statica) && energia {
            Some((FormaRonzio::Denso, -14.0))
        } else if ha(Speciale::Groviglio) && energia {
            Some((FormaRonzio::Passante, -18.0))
        } else {
            None
        };
        match ronzio {
            Some((forma, liv)) if !muto => {
                if self.ronzio_forma != Some(forma) {
                    self.ronzio.imposta(forma);
                    self.ronzio_forma = Some(forma);
                }
                self.ronzio.g.verso(db(liv), t, sr);
            }
            // l’archivio forzato: il ronzio muore, e la caverna resta muta
            _ => self.ronzio.g.verso(0.0, if archivio == Some("forzato") { 0.8 } else { t }, sr),
        }

        // il canale della radio, finché si parla con Yusuf; la voce, finché parla l’eco
        let yusuf = StatiGioco::e(&g.dialogo, "yusuf") && !muto;
        self.canale.g.verso(if yusuf { db(-14.0) } else { 0.0 }, 0.3, sr);
        if StatiGioco::e(&g.dialogo, "eco") && !muto {
            self.filo.regola(150.0, 0.85, 0.9);
            self.filo_g.verso(db(LIV_FILO), 1.0, sr);
        } else if StatiGioco::e(&self.prima_dialogo, "eco") {
            self.filo_g.verso(0.0, 1.5, sr);
        }
        self.prima_dialogo = self.gioco.dialogo.clone();

        // ---- le piogge della stanza
        let piogge = s.map(|s| s.piogge).unwrap_or(&[]);
        for (i, slot) in self.piogge.iter_mut().enumerate() {
            match piogge.get(i) {
                // i ganci tintinnano solo dopo l’urto dell’aggancio, per un minuto e mezzo
                Some(&(Specie::Gancio, _, _)) if self.t_aggancio > 90.0 => slot.attiva = false,
                Some(&(specie, intervallo, guadagno)) if !muto => slot.accendi(specie, intervallo, guadagno, &mut self.caso),
                _ => slot.attiva = false,
            }
        }

        self.aggiorna_ipossia();
    }

    fn fiato_morente(&self) -> bool {
        self.ventola_spenta
    }

    // --------------------------------------------------------------------------------
    //  L’aria, il visore, la protezione vitale
    // --------------------------------------------------------------------------------

    /// La cifra dell’aria cambia: i tic del visore, le due note dell’ambra (§4.4).
    pub(super) fn imposta_aria(&mut self, nuova: f32) {
        let vecchia = self.aria;
        self.aria = nuova.clamp(0.0, 100.0);
        self.fiato.aria = self.aria;
        let sr = self.sr;
        if self.tuta && !self.casa && !self.spento {
            let d = (self.aria - vecchia).round() as i32;
            // un tic per punto: in discesa sempre uguale, in salita sempre più chiaro
            for i in 0..d.unsigned_abs().min(25) {
                let chiaro = if d < 0 { 0.0 } else { 45.0 * i as f32 };
                self.suona(colpi::tic(chiaro, sr), Bus::Casco, -30.0, 0.0, i as f32 * 0.06);
            }
            if vecchia > 60.0 && self.aria <= 60.0 {
                // l’ambra: due note che scendono, sottovoce
                self.suona(colpi::nota(880.0, 0.14, sr), Bus::Casco, -33.0, 0.0, 0.2);
                self.suona(colpi::nota(660.0, 0.2, sr), Bus::Casco, -33.0, 0.0, 0.38);
            }
        }
        self.aggiorna_ipossia();
    }

    /// L’ipossia: un passa-basso che scende da 9 kHz (a 15) a 2,5 kHz (a 1), e lo stereo
    /// che si stringe. Solo con il casco in testa.
    pub(super) fn aggiorna_ipossia(&mut self) {
        let sr = self.sr;
        if self.tuta && !self.casa && self.aria <= 15.0 && self.stanza.is_some() {
            let x = ((15.0 - self.aria) / 14.0).clamp(0.0, 1.0);
            let taglio = 9000.0 * (2500.0f32 / 9000.0).powf(x);
            self.ipossia.aggiorna(Biquad::passabasso(taglio, 0.7, sr));
            self.ipossia_attiva = true;
            self.larghezza.verso(1.0 - 0.7 * x, 3.0, sr);
        } else {
            self.ipossia_attiva = false;
            self.larghezza.verso(1.0, 3.0, sr);
        }
    }

    /// La protezione vitale (§4.4): tre note d’allarme, poi i relè, e la cuffia che si
    /// spegne; il faro scende da solo. Al contrario quando l’aria torna sopra il rosso.
    pub(super) fn cambia_protezione(&mut self, on: bool, suoni: bool) {
        let sr = self.sr;
        self.protezione = on;
        if !(suoni && self.tuta && !self.casa) {
            self.protezione_eff = on;
            self.applica(1.2);
            return;
        }
        if on {
            for (k, f) in [988.0, 988.0, 740.0].into_iter().enumerate() {
                self.suona(colpi::nota(f, 0.15, sr), Bus::Casco, -28.0, 0.0, k as f32 * 0.18);
            }
            let r1 = colpi::rele(true, &mut self.caso, sr);
            let r2 = colpi::rele(true, &mut self.caso, sr);
            self.suona(r1, Bus::Casco, -24.0, -0.3, 0.75);
            self.suona(r2, Bus::Casco, -26.0, 0.3, 0.9);
            let gh = colpi::ghiera(&mut self.caso, sr);
            self.suona(gh, Bus::Casco, -28.0, 0.0, 1.1);
            self.dopo(0.75, Azione::Protezione(true));
        } else {
            let r1 = colpi::rele(false, &mut self.caso, sr);
            let r2 = colpi::rele(true, &mut self.caso, sr);
            self.suona(r1, Bus::Casco, -26.0, 0.3, 0.0);
            self.suona(r2, Bus::Casco, -24.0, -0.3, 0.15);
            self.dopo(0.15, Azione::Protezione(false));
        }
    }

    // --------------------------------------------------------------------------------
    //  I passi
    // --------------------------------------------------------------------------------

    /// Da una stanza all’altra: due passi sulla superficie di partenza, due su quella
    /// d’arrivo, ognuno per la sua strada.
    fn passi(&mut self, da: Option<&str>, a: Option<&str>) {
        let (Some(da), Some(a)) = (da, a) else { return };
        let sr = self.sr;
        let scaletta = da == "sala macchine" || a == "sala macchine";
        let tappe = [(da, 0.0, -0.15), (da, 0.42, 0.15), (a, 0.95, -0.12), (a, 1.4, 0.12)];
        for (k, (nome, t, p)) in tappe.into_iter().enumerate() {
            let Some(st) = stanze::stanza(nome) else { continue };
            let luogo = match st.luogo {
                Luogo::Camera if StatiGioco::e(&self.gioco.porta_interna, "aperta") => Luogo::Relitto,
                Luogo::Camera => Luogo::Vuoto,
                l => l,
            };
            if luogo == Luogo::Vuoto {
                // i magneti degli stivali, solo per le ossa
                let c = colpi::stivale(k % 2 == 0, &mut self.caso, sr);
                self.suona(c, Bus::Ossa, if k % 2 == 0 { -6.0 } else { -12.0 }, 0.0, t);
                continue;
            }
            let sup = if scaletta { Superficie::Grigliato } else { st.passi };
            let Some(c) = colpi::passo(sup, &mut self.caso, sr) else { continue };
            if luogo == Luogo::SantaMaria && !self.tuta {
                self.suona(c, Bus::Esterno, LIV_PASSI, p, t);
            } else {
                // con la tuta il passo arriva per le ossa, e per il guscio o la cuffia
                self.suona(c, Bus::Ossa, LIV_PASSI + 6.0, 0.0, t);
                self.suona(c, Bus::Esterno, LIV_PASSI - 3.0, p, t);
            }
        }
    }

    /// Un suono di fuori: nel vuoto arriva solo per le ossa.
    fn fuori(&mut self, corpo: Corpo, guadagno_db: f32, p: f32, ritardo: f32) {
        if self.luogo() == Luogo::Vuoto && !self.casa {
            self.suona(corpo, Bus::Ossa, guadagno_db + 10.0, 0.0, ritardo);
        } else {
            self.suona(corpo, Bus::Esterno, guadagno_db, p, ritardo);
        }
    }

    /// Una voce che si stacca dal coro (§5.3): il brusio si abbassa e un filo solo
    /// resta in primo piano, per `durata` secondi.
    fn filo_per(&mut self, f0: f32, ritmo: f32, durata: f32, ritardo: f32, livello: f32) {
        self.filo.regola(f0, 0.84, ritmo);
        self.dopo(ritardo, Azione::Filo(db(livello), 0.4));
        self.dopo(ritardo + durata, Azione::Filo(0.0, 0.8));
    }

    /// Il Sintonizzatore trova un’eco (§5.3): la sintonia che scorre, il brusio che scende
    /// di dieci decibel, un filo solo con il ritmo di una frase.
    fn eco(&mut self) {
        let sr = self.sr;
        let c = colpi::sintonia(&mut self.caso, sr);
        self.suona_in(super::Canale::Voci, c, Bus::Em, -24.0, 0.0, 0.0);
        if self.brusio_base > 0.0 {
            self.brusio.guadagno.verso(self.brusio_base * db(-10.0), 0.8, sr);
            self.dopo(7.0, Azione::Brusio(self.brusio_base, 2.5));
        }
        let f0 = self.caso.tra(95.0, 170.0);
        let ritmo = self.caso.tra(0.8, 1.1);
        self.filo_per(f0, ritmo, 5.0, 1.2, LIV_FILO);
        self.fiato.ascolto = true;
        self.dopo(7.0, Azione::Ascolto(false));
    }

    // --------------------------------------------------------------------------------
    //  Gli eventi del gioco
    // --------------------------------------------------------------------------------

    fn evento_gioco(&mut self, e: &EventoGioco, prima: &StatiGioco, taglio_nel_turno: bool) {
        let sr = self.sr;
        let vuoto = self.luogo() == Luogo::Vuoto;
        match e.evento.as_str() {
            "stanza" => self.passi(e.da_stanza(), e.a_stanza()),

            // ---- Atto I
            "scansione_lunga" => {
                // il computer «se la prende comoda»: relè e dischi che lavorano tre volte,
                // poi un segnale sordo di due note
                for k in 0..3 {
                    let t = k as f32 * 1.3;
                    let r = colpi::rele(true, &mut self.caso, sr);
                    self.suona(r, Bus::Esterno, -30.0, 0.3, t);
                    self.suona(colpi::salita(280.0, 330.0, 0.9, 0.8, sr), Bus::Esterno, -34.0, 0.3, t + 0.25);
                }
                self.suona(colpi::nota(440.0, 0.18, sr), Bus::Esterno, -28.0, 0.3, 4.0);
                self.suona(colpi::nota(330.0, 0.26, sr), Bus::Esterno, -28.0, 0.3, 4.25);
            }
            "accostamento" => self.evento_nave(Nave::Accostata),
            "arpioni" => {
                self.evento_nave(Nave::Agganciata);
                self.t_aggancio = 0.0;
            }
            "registro" => {
                for t in [0.0, 0.45, 0.95] {
                    let c = colpi::pagina(&mut self.caso, sr);
                    self.suona(c, Bus::Esterno, -26.0, -0.2, t);
                }
                self.suona(colpi::ottone(sr), Bus::Esterno, -30.0, -0.1, 1.3);
            }
            "cassetta" => {
                let c = colpi::chiave(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -24.0, 0.2, 0.0);
                // «il coperchio si alza con il suo cigolio di sempre»
                let c = colpi::cigolio(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -26.0, 0.2, 0.7);
            }
            "kit" => {
                for t in [0.0, 0.35] {
                    let c = colpi::chiusura(&mut self.caso, sr);
                    self.suona(c, Bus::Esterno, -22.0, 0.1, t);
                }
                let c = colpi::tessuto(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -30.0, 0.1, 0.7);
            }
            "vestizione" => {
                // «Strato su strato»: il tessuto, le chiusure, l’anello del casco che si
                // blocca, la tuta che si pressurizza, il visore, il faro
                for t in [0.0, 0.7] {
                    let c = colpi::tessuto(&mut self.caso, sr);
                    self.suona(c, Bus::Esterno, -24.0, 0.0, t);
                }
                let c = colpi::cerniera(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -26.0, 0.0, 1.3);
                for t in [2.1, 2.35] {
                    let c = colpi::chiusura(&mut self.caso, sr);
                    self.suona(c, Bus::Esterno, -24.0, 0.0, t);
                }
                self.suona(colpi::anello(sr), Bus::Esterno, -20.0, 0.0, 3.0);
                self.suona(colpi::anello(sr), Bus::Ossa, -10.0, 0.0, 3.0);
                self.suona(colpi::pressione(sr), Bus::Casco, -26.0, 0.0, 3.25);
                self.suona(colpi::nota(988.0, 0.09, sr), Bus::Casco, -31.0, 0.0, 3.9);
                self.suona(colpi::nota(1318.5, 0.12, sr), Bus::Casco, -31.0, 0.0, 4.05);
                let c = colpi::scatto(&mut self.caso, sr);
                self.suona(c, Bus::Casco, -26.0, 0.0, 4.5);
            }
            "faro_basso" | "faro_pieno" => {
                let c = colpi::ghiera(&mut self.caso, sr);
                self.suona(c, Bus::Casco, -28.0, 0.0, 0.0);
            }
            "cella" => {
                // lo sgancio della cella esausta, l’innesto della nuova, «La valvola sibila»
                let c = colpi::connettore(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -10.0, 0.0, 0.0);
                let c = colpi::scatto(&mut self.caso, sr);
                self.suona(c, Bus::Casco, -24.0, 0.0, 0.5);
                let c = colpi::sibilo(0.9, &mut self.caso, sr);
                self.suona(c, Bus::Casco, -28.0, 0.0, 0.8);
            }
            "boccaporto" => {
                // il portello interno che si chiude; le pompe che svuotano, e il loro suono
                // che muore con la pressione; il portello esterno, sentito solo nelle mani
                let c = colpi::arpione(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -26.0, 0.0, 0.0);
                self.suona(c, Bus::Ossa, -16.0, 0.0, 0.0);
                self.suona(colpi::svuota(sr), Bus::Esterno, -18.0, 0.0, 0.4);
                let c = colpi::spinta(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -12.0, 0.0, 6.6);
            }
            "rientro" => {
                self.suona(colpi::riempie(sr), Bus::Esterno, -20.0, 0.0, 0.2);
                let c = colpi::arpione(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -26.0, 0.0, 3.6);
                self.suona(c, Bus::Ossa, -16.0, 0.0, 3.6);
            }

            // ---- Atto II
            "discesa" => {
                for (k, t) in [0.1, 0.55].into_iter().enumerate() {
                    let c = colpi::stivale(k == 0, &mut self.caso, sr);
                    self.suona(c, Bus::Ossa, -8.0, 0.0, t);
                }
            }
            "varco_richiuso" => {
                // il lembo si chiude senza suono; lo strappo del cavo arriva alla cintura
                let c = Corpo::Tonfo(Tonfo::nuovo(150.0, 90.0, 0.02, 0.12, 1.0, 0.006, 0.8, 900.0, sr));
                self.suona(c, Bus::Ossa, -10.0, 0.0, 0.0);
                self.fiato.sorpresa();
            }
            "pannello" => {
                let c = colpi::connettore(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -10.0, 0.0, 0.0);
                // «Dalla porta arriva un clac sordo»: nel vuoto, per il pavimento
                let c = colpi::spinta(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -10.0, 0.0, 0.6);
            }
            "porta_interna" => {
                // «Con un sibilo appena percepibile»: l’aria della nave che entra; un
                // soffio di brusio nella cuffia, che si ritira
                let c = colpi::sibilo(2.8, &mut self.caso, sr);
                self.suona(c, Bus::Esterno, -24.0, 0.0, 0.0);
                self.brusio_via = Bus::Em;
                self.brusio.quanti.verso(6.0, 0.3, sr);
                self.brusio.guadagno.verso(db(LIV_BRUSIO - 12.0), 0.8, sr);
                self.dopo(2.6, Azione::Brusio(0.0, 1.5));
            }
            "primo_contatto" => self.evento(Evento::PrimoContatto),
            "risuonatore_staccato" => {
                // «ti cade nel palmo»
                let c = Corpo::Tonfo(Tonfo::nuovo(190.0, 120.0, 0.02, 0.18, 1.0, 0.004, 0.4, 1200.0, sr));
                self.suona(c, Bus::Ossa, -12.0, 0.0, 0.6);
            }
            "taglio" => {
                // la taglierina in atmosfera sibila davvero; il brusio si alza di colpo
                let c = colpi::getto(1.4, &mut self.caso, sr);
                self.suona(c, Bus::Esterno, -24.0, 0.15, 0.0);
                if self.brusio_base > 0.0 {
                    self.brusio.guadagno.verso(self.brusio_base * db(8.0), 0.3, sr);
                    self.dopo(1.8, Azione::Brusio(self.brusio_base, 2.0));
                }
                match e.valore.map(|v| v as i32) {
                    // una voce si stacca: «chiede qualcosa, in fretta, a qualcuno»
                    Some(1) => self.filo_per(175.0, 1.6, 2.2, 0.4, LIV_FILO),
                    // «tante e vicine», e una «sembra contare»
                    Some(2) => self.filo_per(118.0, 1.0, 3.0, 0.4, LIV_FILO),
                    _ => {}
                }
            }
            "connessione" => {
                // il Sintonizzatore si accende da solo: una voce bassa, paziente, con il ritmo
                // di un elenco, e un tic del traduttore a ogni parola; l’interruttore premuto
                // due volte, a vuoto
                let c = colpi::sintonia(&mut self.caso, sr);
                self.suona_in(super::Canale::Voci, c, Bus::Em, -24.0, 0.0, 0.0);
                self.filo_per(82.0, 0.75, 8.5, 1.0, LIV_FILO + 2.0);
                for k in 0..12 {
                    self.suona(colpi::tic(-400.0, sr), Bus::Casco, -32.0, 0.0, 1.2 + k as f32 * 0.65);
                }
                for t in [10.4, 10.8] {
                    let c = colpi::scatto(&mut self.caso, sr);
                    self.suona(c, Bus::Casco, -28.0, 0.0, t);
                }
                self.fiato.ascolto = true;
                self.dopo(10.0, Azione::Ascolto(false));
            }

            // ---- Atto III
            "groviglio_sente" => {
                // «uno ti sfiora lo stivale»
                let c = colpi::frustata(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -14.0, 0.0, 1.4);
            }
            "groviglio_prende" => {
                // «Un filamento ti trova il fianco»; ti strappi via, scalci
                for t in [0.0, 0.25] {
                    let c = colpi::frustata(&mut self.caso, sr);
                    self.suona(c, Bus::Esterno, -14.0, 0.4, t);
                }
                for (k, t) in [0.45, 0.8, 1.15].into_iter().enumerate() {
                    let c = colpi::stivale(k != 1, &mut self.caso, sr);
                    self.suona(c, Bus::Ossa, -8.0, 0.0, t);
                }
                self.fiato.sorpresa();
            }
            "bengala_acceso" => {
                let c = colpi::scatto(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -22.0, 0.2, 0.0);
                self.suona(colpi::accensione(sr), Bus::Esterno, -16.0, 0.2, 0.15);
            }
            "bengala_spento" => {
                // «Il bengala sfrigola, si fa arancione, poi si spegne»
                let c = colpi::sfrigolio(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -26.0, 0.0, 0.0);
            }
            "tacche" => {
                // la taglierina al minimo: un sibilo sottile; il materiale resiste, poi cede
                let c = colpi::getto(1.0, &mut self.caso, sr);
                self.suona(c, Bus::Esterno, -32.0, 0.1, 0.0);
                let c = colpi::crepa(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -36.0, 0.1, 1.0);
            }
            "grande_porta" => {
                // le tre luci all’unisono, il ronzio che accelera e diventa un gong che
                // vibra in tutta la nave; poi la porta si dissolve in particelle di luce
                self.suona(colpi::salita(207.65, 415.3, 1.6, 0.7, sr), Bus::Esterno, -22.0, 0.0, 0.0);
                let c = colpi::gong(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -12.0, 0.0, 1.6);
                self.suona(c, Bus::Ossa, -14.0, 0.0, 1.6);
                let c = colpi::granelli_acuti(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -22.0, 0.0, 4.0);
            }
            "energia" => {
                // «Con un rombo che sale, i macchinari si svegliano»; gli archi fra le bobine;
                // poi il brivido dello scafo, e i sistemi che tornano a respirare
                self.suona(colpi::salita(35.0, 90.0, 2.6, 1.0, sr), Bus::Ossa, -10.0, 0.0, 0.0);
                self.suona(colpi::salita(70.0, 180.0, 2.6, 1.0, sr), Bus::Esterno, -22.0, 0.0, 0.0);
                for t in [1.2, 1.7, 2.3, 2.6] {
                    let p = self.caso.tra(-0.7, 0.7);
                    let c = colpi::scarica(&mut self.caso, sr);
                    self.suona(c, Bus::Esterno, -22.0, p, t);
                }
                let c = colpi::crollo(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -12.0, 0.0, 3.4);
                for t in [4.5, 5.6, 7.0] {
                    let c = colpi::sibilo(1.6, &mut self.caso, sr);
                    let p = self.caso.tra(-0.8, 0.8);
                    self.suona(c, Bus::Esterno, -34.0, p, t);
                }
            }
            "ricarica" => self.suona(colpi::salita(300.0, 620.0, 1.6, 0.4, sr), Bus::Casco, -30.0, 0.0, 0.0),
            "dispositivo_medico" => {
                self.suona(colpi::nota(830.6, 1.5, sr), Bus::Esterno, -36.0, 0.0, 0.0);
                self.suona(colpi::vetro(1661.2, sr), Bus::Esterno, -34.0, 0.0, 0.5);
            }
            "altare" => {
                // il disco nell’incavo; «dall’interno della pietra arriva un colpo profondo»
                let c = colpi::pietra(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -20.0, 0.0, 0.0);
                let c = Corpo::Tonfo(Tonfo::nuovo(62.0, 42.0, 0.08, 0.9, 1.0, 0.05, 0.6, 200.0, sr));
                self.suona(c, Bus::Ossa, -10.0, 0.0, 0.9);
                self.suona(c, Bus::Esterno, -24.0, 0.0, 0.9);
            }
            "disco_liberato" => {
                let c = colpi::pietra(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -24.0, 0.0, 0.0);
                let c = colpi::scatto(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -26.0, 0.0, 0.4);
            }
            "teca_serra" => {
                // i simboli «con un clic armonioso»; la teca in un pulviscolo; la vibrazione
                // che «cessa di colpo»: uno dei pochissimi tagli secchi del gioco
                for (k, f) in CLIC_ARMONIOSO.into_iter().enumerate() {
                    self.suona(colpi::vetro(f, sr), Bus::Esterno, -22.0, -0.2 + 0.2 * k as f32, k as f32 * 0.12);
                }
                let c = colpi::granelli_acuti(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -28.0, 0.0, 0.6);
                self.seme.g = Scorrevole::nuovo(0.0);
            }
            "risuonatore_toccato" | "venature_spente" => {
                if self.protezione_eff {
                    // con la protezione vitale il brusio «si ferma lì», e nessun tic
                } else {
                    self.evento(Evento::ToccaVenature);
                }
            }
            "venature_verdi" => self.suona(colpi::soffio_vetroso(sr), Bus::Esterno, -24.0, 0.0, 0.0),
            "terminale" => {
                let c = colpi::sfrigolio(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -22.0, 0.2, 0.0);
            }
            "archivio_saluta" => {
                // lo scomparto si apre «piano, come una mano»
                let c = colpi::pietra(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -30.0, 0.0, 1.0);
            }
            "archivio_forzato" => {
                // il terminale sfrigola; la scintilla dell’ultimo pilastro, «più forte delle
                // altre», e il suo ronzio che muore
                let c = colpi::sfrigolio(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -20.0, 0.2, 0.0);
                let c = colpi::scarica(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -14.0, -0.3, 0.9);
            }
            "postazione" => {
                // «Un’ondata di energia silenziosa»: è silenziosa, quindi il mix si svuota
                self.fondo_mul.verso(db(-6.0), 0.4, sr);
                self.dopo(2.2, Azione::Fondo(1.0, 2.0));
            }
            "sistema" => {
                for k in 0..3 {
                    self.suona(colpi::tic(600.0, sr), Bus::Casco, -32.0, 0.0, 0.1 + k as f32 * 0.09);
                }
            }
            "porta_tonda" => {
                // tre scatti e «Un clic armonioso»; poi la porta si apre senza attrito
                for t in [0.0, 0.28, 0.56] {
                    let c = colpi::scatto(&mut self.caso, sr);
                    self.suona(c, Bus::Esterno, -22.0, 0.0, t);
                }
                for (k, f) in CLIC_ARMONIOSO.into_iter().enumerate() {
                    self.suona(colpi::vetro(f, sr), Bus::Esterno, -22.0, -0.2 + 0.2 * k as f32, 0.95 + k as f32 * 0.12);
                }
            }
            "sonaglio" => {
                // §5.4: «Resti fermo finché non si spegne»: il fiato si ferma
                let c = colpi::sonaglio(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -12.0, 0.1, 0.0);
                self.fiato.trattieni(8.0);
            }

            // ---- Atto IV e V
            "fuga" => {
                // «La nave trema»: un rombo che cresce nelle ossa; il pavimento si apre su
                // una gola, la pietra che si spacca, la polvere
                // nella fuga le ossa hanno già sei decibel in più
                let c = colpi::crollo(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -12.0, 0.0, 0.0);
                for (k, t) in [1.0, 1.4, 2.0].into_iter().enumerate() {
                    let c = colpi::crepa(&mut self.caso, sr);
                    self.suona(c, Bus::Esterno, -27.0, -0.5 + 0.5 * k as f32, t);
                }
                let c = colpi::polvere(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, -24.0, 0.0, 1.5);
            }
            "voce_dei_nomi" => {
                // la voce bassa che torna; «Poi l’elenco finisce, e la voce, dopo una pausa,
                // ne dice uno in più, più piano degli altri»
                self.filo_per(78.0, 0.7, 8.0, 0.5, LIV_FILO + 2.0);
                for k in 0..11 {
                    self.suona(colpi::tic(-400.0, sr), Bus::Casco, -32.0, 0.0, 0.8 + k as f32 * 0.68);
                }
                self.filo_per(76.0, 0.6, 1.2, 9.8, LIV_FILO - 6.0);
                self.fiato.ascolto = true;
                self.dopo(11.0, Azione::Ascolto(false));
            }
            "casco_tolto" => {
                // «Ti strappi il casco prima che la pressione sia pareggiata»: un colpo d’aria,
                // e tutto il mondo che torna insieme
                self.casa = true;
                self.suona(colpi::colpo_d_aria(sr), Bus::Esterno, -14.0, 0.0, 0.0);
                self.applica(0.4);
            }
            "finale" => self.finale(e.finale.as_deref(), prima.in_fuga()),

            // ---- i dialoghi
            "dialogo" => match e.con.as_deref() {
                Some("yusuf") => self.suona(colpi::squelch(sr), Bus::Altoparlante, -12.0, 0.0, 0.0),
                Some("eco") => {
                    let c = colpi::sintonia(&mut self.caso, sr);
                    self.suona_in(super::Canale::Voci, c, Bus::Em, -24.0, 0.0, 0.0);
                }
                _ => {}
            },
            "dialogo_fine" => {
                if e.con.as_deref() == Some("yusuf") {
                    // «La linea fa il suo schiocco»
                    self.suona(colpi::squelch(sr), Bus::Altoparlante, -12.0, 0.0, 0.0);
                    let c = colpi::scatto(&mut self.caso, sr);
                    self.suona(c, Bus::Altoparlante, -14.0, 0.0, 0.1);
                }
            }

            // ---- i contatori, la matrice, le echi
            "chiave" => self.suona(colpi::vetro(CLIC_ARMONIOSO[1] * 2.0, sr), Bus::Esterno, -34.0, 0.0, 0.0),
            "eco" | "risonanza" => self.eco(),
            "matrice" => {}
            "traduzione_completa" => {
                // nessun suono di vittoria: per tre secondi il brusio diventa un accordo di
                // voci tenute
                self.brusio.accordo(&ACCORDO, 3.0);
                if self.brusio_base > 0.0 {
                    self.brusio.guadagno.verso(self.brusio_base * db(4.0), 0.5, sr);
                    self.dopo(3.0, Azione::Brusio(self.brusio_base, 1.5));
                }
            }

            // ---- il visore
            "aria" => {
                if let Some(a) = e.a.as_ref().and_then(Value::as_f64) {
                    self.imposta_aria(a as f32);
                }
            }
            "protezione_fuga" => {
                // tre note d’allarme e nessun relè: «Adesso la tuta non ti protegge più da niente»
                for (k, f) in [988.0, 988.0, 740.0].into_iter().enumerate() {
                    self.suona(colpi::nota(f, 0.15, sr), Bus::Casco, -28.0, 0.0, k as f32 * 0.18);
                }
            }

            // ---- gli attrezzi (§5.7)
            "attrezzo" => match e.attrezzo.as_deref() {
                Some("multiscanner") => {
                    // il motorino arriva per la spalla; i segnali dei dati, nel casco
                    let c = colpi::motorino(&mut self.caso, sr);
                    if vuoto {
                        self.suona(c, Bus::Ossa, -12.0, 0.0, 0.0);
                    } else {
                        self.suona(c, Bus::Casco, -34.0, 0.3, 0.0);
                    }
                    for k in 0..6 {
                        let chiaro = self.caso.tra(-300.0, 1500.0);
                        self.suona(colpi::tic(chiaro, sr), Bus::Casco, -33.0, 0.0, 0.35 + k as f32 * 0.11);
                    }
                }
                Some("matrice") => {
                    // un aggancio: tre impulsi rapidi e un tono che si ferma
                    for k in 0..3 {
                        self.suona(colpi::nota(1400.0, 0.04, sr), Bus::Casco, -32.0, 0.0, k as f32 * 0.07);
                    }
                    self.suona(colpi::nota(1050.0, 0.35, sr), Bus::Casco, -33.0, 0.0, 0.25);
                }
                Some("sintonizzatore") => {
                    let c = colpi::sintonia(&mut self.caso, sr);
                    let bus = if vuoto { Bus::Casco } else { Bus::Em };
                    self.suona_in(super::Canale::Voci, c, bus, -26.0, 0.0, 0.0);
                }
                Some("taglierina") if !taglio_nel_turno => {
                    let c = colpi::taglierina_nel_guanto(1.8, &mut self.caso, sr);
                    self.suona(c, Bus::Ossa, -12.0, 0.0, 0.0);
                    if !vuoto {
                        let c = colpi::getto(1.4, &mut self.caso, sr);
                        self.suona(c, Bus::Esterno, -24.0, 0.15, 0.0);
                    }
                }
                _ => {}
            },

            // ---- per comando
            "reattore_ascoltato" => {
                // il mix toglie per otto secondi tutto il resto e lascia la nota sola
                self.fondi_mul.verso(db(-12.0), 0.8, sr);
                self.dopo(8.0, Azione::Fondi(1.0, 2.0));
            }
            "reattore_toccato" => {
                // la vibrazione «sale per il braccio fino ai denti»
                self.re_tocco.verso(db(9.0), 0.3, sr);
                self.dopo(3.0, Azione::Tocco(1.0, 1.0));
            }
            "radio" | "scatola_nera" => {
                self.suona(colpi::squelch(sr), Bus::Altoparlante, -12.0, 0.0, 0.0);
                let c = super::colpi::Corpo::Fruscio(
                    super::colpi::Fruscio::nuovo(if e.evento == "radio" { 2.2 } else { 3.5 }, 0.1, (1300.0, 1900.0), 0.6, super::colpi::Filtro::Banda, sr).ruvido(0.6),
                );
                self.suona(c, Bus::Altoparlante, -20.0, 0.0, 0.1);
                self.suona(colpi::squelch(sr), Bus::Altoparlante, -14.0, 0.0, if e.evento == "radio" { 2.4 } else { 3.7 });
            }

            // ---- i segni a sorte
            "assestamento" => self.gemito(),
            "brusio_cala" => self.evento(Evento::SalaTace),
            "pareti_lampo" => {
                let c = colpi::scarica(&mut self.caso, sr);
                self.fuori(c, -24.0, 0.0, 0.0);
            }
            "crollo" => {
                // solo nella fuga: le ossa hanno già sei decibel in più
                let c = colpi::crollo(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -17.0, 0.0, 0.0);
            }
            "incrinature" => {
                for (k, p) in [-0.8, 0.0, 0.8].into_iter().enumerate() {
                    let c = colpi::crepa(&mut self.caso, sr);
                    self.fuori(c, -32.0, p, k as f32 * 0.35);
                }
            }

            // gli eventi che sono solo stato (il seme, il risuonatore, la nota, il
            // groviglio desto, i contatori senza suono) e quelli del visore che l’aria fa
            // già suonare (ambra, ipossia, protezione)
            _ => {}
        }
    }

    /// I finali (§4.6): il suono del mondo si ferma dove si ferma il testo.
    fn finale(&mut self, quale: Option<&str>, in_fuga: bool) {
        let sr = self.sr;
        if quale == Some("due-lettere") {
            // «il visore non ha più niente da dirti»: la ventola rallenta e si ferma; il
            // fiato si fa lento, poi l’ultimo
            self.ventola_spenta = true;
            self.ventola.giri.verso(0.15, 5.0, sr);
            self.ventola.g.verso(0.0, 6.0, sr);
            self.fiato.ultimi();
            if in_fuga {
                // «la nave trema, e poi, dopo tanto tempo, si muove. Ti porta con sé»
                let c = colpi::crollo(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -6.0, 0.0, 2.0);
                self.suona(colpi::salita(28.0, 18.0, 6.0, 0.3, sr), Bus::Ossa, -8.0, 0.0, 3.0);
            }
            self.dopo(24.0, Azione::Silenzio(6.0));
        } else {
            // il casco tolto nella stiva: «Il pavimento si avvicina. Dormi.»; poi la plancia
            self.dopo(4.0, Azione::Silenzio(6.0));
            self.dopo(12.0, Azione::Risveglio);
        }
    }

    /// La plancia del risveglio: il re, la ventilazione, il radar che non suona. Con il
    /// risuonatore, il brusio sale dalla stiva per l’aria.
    pub(super) fn risveglio(&mut self) {
        let sr = self.sr;
        let risuonatore = self.gioco.risuonatore_con_te;
        self.stanza = stanze::stanza("plancia");
        self.casa = true;
        self.spento = false;
        self.gioco.fuga = None;
        self.gioco.dialogo = None;
        self.gioco.seme_con_te = false;
        self.gioco.risuonatore_con_te = false;
        self.protezione = false;
        self.protezione_eff = false;
        self.stiva_viva = risuonatore;
        self.applica(0.1);
        self.aggiorna_membrana(false);
        self.ingresso.verso(db(-4.0), 6.0, sr);
    }

    // --------------------------------------------------------------------------------
    //  Il prototipo dei tre ambienti (la pagina di prova, i rendering)
    // --------------------------------------------------------------------------------

    pub(super) fn prototipo(&mut self, a: Ambiente) {
        let (id, tuta) = match a {
            Ambiente::Silenzio => ("", false),
            Ambiente::Plancia => ("plancia", false),
            Ambiente::Scafo => ("scafo", true),
            Ambiente::Vestibolo => ("vestibolo delle gole", true),
        };
        self.gioco.stanza = id.to_string();
        self.gioco.tuta = tuta;
        self.gioco.porta_interna = Some("aperta".to_string());
        self.gioco.risuonatore = Some("incastrato".to_string());
        self.gioco.aria = if tuta { Some(self.aria) } else { None };
        let nuova = stanze::stanza(id);
        if nuova.map(|s| s.id) != self.stanza.map(|s| s.id) {
            self.stanza = nuova;
            self.t_stanza = 0.0;
            self.t_gemito = self.caso.tra(20.0, 50.0);
        }
        self.tuta = tuta;
        self.casa = false;
        self.spento = false;
        self.protezione = tuta && self.aria < 30.0;
        self.protezione_eff = self.protezione;
        let rampa = if id == "scafo" { self.rampa * self.rampa } else { 1.0 };
        self.re_rampa.verso(rampa, 1.0, self.sr);
        self.applica(2.5);
    }

    pub(super) fn aria_prototipo(&mut self, v: f32) {
        self.gioco.aria = Some(v);
        self.imposta_aria(v);
        let p = self.tuta && self.aria < 30.0 && !self.gioco.in_fuga();
        if p != self.protezione {
            self.cambia_protezione(p, true);
        } else {
            self.applica(1.2);
        }
    }

    /// Gli eventi del prototipo.
    pub(super) fn evento(&mut self, e: Evento) {
        let sr = self.sr;
        match e {
            Evento::PrimoContatto => {
                // il multiscanner si impenna, e il brusio entra nella cuffia
                for _ in 0..14 {
                    let chiaro = self.caso.tra(-600.0, 1800.0);
                    let t = self.caso.tra(0.0, 1.2);
                    self.suona(colpi::tic(chiaro, sr), Bus::Casco, -30.0, 0.0, t);
                }
                self.brusio.guadagno.verso(0.0, 0.03, sr);
                self.dopo(0.3, Azione::Brusio(self.brusio_base, 0.8));
                self.suona(colpi::tic(0.0, sr), Bus::Casco, -30.0, 0.0, 1.0);
                self.suona(colpi::tic(0.0, sr), Bus::Casco, -30.0, 0.0, 1.06);
            }
            Evento::ToccaVenature => {
                if self.brusio_base > 0.0 {
                    self.brusio.guadagno.verso(self.brusio_base * db(8.0), 0.4, sr);
                    self.brusio.quanti.verso(self.brusio_quanti.max(16.0) + 8.0, 0.4, sr);
                    self.dopo(1.2, Azione::Brusio(self.brusio_base, 1.5));
                    self.dopo(1.2, Azione::BrusioQuanti(self.brusio_quanti, 1.5));
                    self.suona(colpi::tic(0.0, sr), Bus::Casco, -30.0, 0.0, 0.3);
                }
            }
            Evento::SalaTace => {
                // «come una sala piena che smette di parlare quando entri. Poi riprende»
                if self.brusio_base > 0.0 {
                    self.brusio.guadagno.verso(0.0, 2.0, sr);
                    self.dopo(5.0, Azione::Brusio(self.brusio_base, 4.0));
                }
            }
            Evento::Gemito => self.gemito(),
            Evento::Goccia => {
                let c = colpi::goccia(&mut self.caso, sr);
                let p = self.caso.tra(-0.7, 0.7);
                self.suona(c, Bus::Esterno, -30.0, p, 0.0);
            }
            Evento::Sorpresa => self.fiato.sorpresa(),
        }
    }

    /// «Qualcosa si assesta, con un gemito lungo e basso che ti arriva nei denti prima
    /// che nelle cuffie»: prima le ossa, poi la cuffia.
    pub(super) fn gemito(&mut self) {
        let corpo = colpi::gemito(&mut self.caso, self.sr);
        let p = self.caso.tra(-0.6, 0.6);
        let piu = if self.stanza.is_some_and(|s| s.id == "corridoio principale") { 3.0 } else { 0.0 };
        self.suona_in(super::Canale::Ambienti, corpo, Bus::Ossa, LIV_GEMITO + piu, 0.0, 0.0);
        self.suona_in(super::Canale::Ambienti, corpo, Bus::Esterno, LIV_GEMITO - 12.0 + piu, p, 0.3);
    }

    pub(super) fn evento_nave(&mut self, n: Nave) {
        let sr = self.sr;
        match n {
            Nave::Libera => {}
            Nave::Accostata => {
                // «a spinte corte»: i propulsori, dentro, sono colpi sordi nella struttura
                for k in 0..4 {
                    let t = k as f32 * 0.6 + self.caso.tra(0.0, 0.15);
                    let c = colpi::spinta(&mut self.caso, sr);
                    self.suona(c, Bus::Ossa, -4.0, 0.0, t);
                    self.suona(c, Bus::Esterno, -22.0, 0.0, t);
                }
            }
            Nave::Agganciata => {
                // «Due colpi sordi, che senti nelle ossa più che nelle orecchie»
                for t in [0.0, 0.45] {
                    let c = colpi::arpione(&mut self.caso, sr);
                    self.suona(c, Bus::Ossa, -11.0, 0.0, t);
                    self.suona(c, Bus::Esterno, -25.0, 0.0, t);
                }
                // «un urto lungo che fa tremare la plancia»
                let c = colpi::urto_lungo(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -15.0, 0.0, 1.6);
                self.suona(c, Bus::Esterno, -29.0, 0.0, 1.6);
            }
        }
    }

    pub(super) fn colpo_di_pioggia(&mut self, specie: Specie, g: f32, p: f32) {
        let sr = self.sr;
        let c = match specie {
            Specie::Lamiera => {
                let k = self.caso.indice(self.lastre.len());
                let lastra = self.lastre[k];
                colpi::lamiera(&lastra, &mut self.caso, sr)
            }
            Specie::Rele => {
                // un relè che scatta, e dopo un poco si riapre
                let chiude = colpi::rele(true, &mut self.caso, sr);
                let apre = colpi::rele(false, &mut self.caso, sr);
                let dopo = self.caso.tra(0.4, 6.0);
                self.suona_in(super::Canale::Ambienti, chiude, Bus::Esterno, g, p, 0.0);
                self.suona_in(super::Canale::Ambienti, apre, Bus::Esterno, g - 3.0, p, dopo);
                return;
            }
            Specie::Cigolio => colpi::cigolio(&mut self.caso, sr),
            Specie::Goccia => colpi::goccia(&mut self.caso, sr),
            Specie::Crepa => colpi::crepa(&mut self.caso, sr),
            Specie::Granello => colpi::granello(&mut self.caso, sr),
            Specie::Gancio => colpi::gancio(&mut self.caso, sr),
            Specie::Vetro => {
                let f = self.caso.tra(1800.0, 3200.0);
                colpi::vetro(f, sr)
            }
        };
        self.suona_in(super::Canale::Ambienti, c, Bus::Esterno, g, p, 0.0);
    }

    pub(super) fn prova(&mut self, nome: &str) {
        let sr = self.sr;
        let p = self.caso.tra(-0.5, 0.5);
        match nome {
            "lamiera" => self.colpo_di_pioggia(Specie::Lamiera, -32.0, p),
            "rele" => self.colpo_di_pioggia(Specie::Rele, -33.0, p),
            "cigolio" => self.colpo_di_pioggia(Specie::Cigolio, -35.0, p),
            "goccia" => self.colpo_di_pioggia(Specie::Goccia, -27.0, p),
            "crepa" => self.colpo_di_pioggia(Specie::Crepa, -36.0, p),
            "granello" => self.colpo_di_pioggia(Specie::Granello, -31.0, p),
            "gemito" => self.gemito(),
            "spinta" => {
                let c = colpi::spinta(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -4.0, 0.0, 0.0);
                self.suona(c, Bus::Esterno, -22.0, 0.0, 0.0);
            }
            "arpione" => {
                let c = colpi::arpione(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -2.0, 0.0, 0.0);
                self.suona(c, Bus::Esterno, -20.0, 0.0, 0.0);
            }
            "urto" => {
                let c = colpi::urto_lungo(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -11.0, 0.0, 0.0);
                self.suona(c, Bus::Esterno, -25.0, 0.0, 0.0);
            }
            "una_voce" => self.brusio.quanti.verso(1.0, 0.5, sr),
            "coro" => self.brusio.quanti.verso(16.0, 0.5, sr),
            _ => {}
        }
    }
}

#[cfg(test)]
mod prove {
    use super::super::*;

    /// Un turno scritto a mano, come lo manderebbe il ponte.
    fn turno(json: &str) -> Comando {
        Comando::Turno(serde_json::from_str(json).unwrap())
    }

    fn suona(m: &mut Mondo, secondi: f32) -> f32 {
        let mut buf = vec![kira::Frame::ZERO; 256];
        let mut massimo = 0.0f32;
        let n = (secondi * 48000.0 / 256.0) as usize;
        for _ in 0..n {
            m.rendi(&mut buf, 1.0 / 48000.0);
            for f in &buf {
                assert!(f.left.is_finite() && f.right.is_finite());
                massimo = massimo.max(f.left.abs()).max(f.right.abs());
            }
        }
        massimo
    }

    #[test]
    fn una_partita_corta_suona_e_non_si_rompe() {
        let (mut m, tx, _) = Mondo::nuovo(48000.0, 3);
        tx.send(turno(r#"{"stati": {"stanza": "plancia", "tuta": false, "fuga": "lontana", "aggancio": "lontano", "esito": "in_corso"},
                         "eventi": [{"evento": "inizio", "stanza": "plancia"}]}"#)).unwrap();
        let picco = suona(&mut m, 4.0);
        assert!(picco > 0.01, "la plancia tace");
        tx.send(turno(r#"{"stati": {"stanza": "plancia", "tuta": false, "fuga": "lontana", "aggancio": "accostato", "esito": "in_corso"},
                         "eventi": [{"evento": "accostamento"}]}"#)).unwrap();
        suona(&mut m, 3.0);
        tx.send(turno(r#"{"stati": {"stanza": "stiva", "tuta": true, "aria": 100, "fuga": "lontana", "aggancio": "fatto", "esito": "in_corso"},
                         "eventi": [{"evento": "stanza", "da": "plancia", "a": "stiva"}, {"evento": "vestizione"}]}"#)).unwrap();
        suona(&mut m, 5.0);
        tx.send(turno(r#"{"stati": {"stanza": "vestibolo delle gole", "tuta": true, "aria": 70, "fuga": "lontana",
                         "porta_interna": "aperta", "risuonatore": "incastrato", "esito": "in_corso"},
                         "eventi": [{"evento": "stanza", "da": "camera di compensazione", "a": "vestibolo delle gole"},
                                    {"evento": "primo_contatto"}, {"evento": "aria", "da": 80, "a": 70, "differenza": -10}]}"#)).unwrap();
        let picco = suona(&mut m, 5.0);
        assert!(picco > 0.005 && picco < 1.0, "il vestibolo: picco {picco}");
        // un evento che il suono non conosce non rompe niente
        tx.send(turno(r#"{"stati": {"stanza": "vestibolo delle gole", "tuta": true, "aria": 69, "esito": "in_corso"},
                         "eventi": [{"evento": "qualcosa_di_nuovo", "valore": 3}]}"#)).unwrap();
        suona(&mut m, 1.0);
    }
}
