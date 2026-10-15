//! Il mondo sonoro: tutti gli strati del suono in un solo `Sound` di kira, mescolati
//! lungo le cinque strade della bibbia sonora (§1.1): l’aria, il guscio del casco, la
//! cuffia, il casco, le ossa. Tutto è sintetizzato qui dentro, in tempo reale:
//! nessun campione registrato (decisione dell’autore, 15 ottobre 2026). Il re, la
//! ventilazione, le pompe, le lamiere, i relè, il fiato, la ventola, gli stivali, il
//! brusio delle voci, le gocce, le crepe, il gemito della nave, il riverbero delle
//! stanze: tutto viene da `dsp.rs` e dai modelli dei moduli qui sotto.
//!
//! Per ora suonano i tre ambienti del prototipo (§8): la plancia con il reattore, il
//! casco sullo scafo, il vestibolo con il brusio.
//!
//! La pagina manda comandi (`Comando`) per un canale; il thread dell’audio li legge a
//! ogni blocco. Lo stesso motore gira anche fuori dall’app, in `examples/`, per
//! rendere gli ambienti su file e misurarli.

pub mod brusio;
pub mod colpi;
pub mod dsp;
pub mod fiato;
pub mod fondi;
pub mod re;
pub mod riverbero;
pub mod voce;

use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::Arc;

use kira::info::Info;
use kira::sound::{Sound, SoundData};
use kira::Frame;
use serde::{Deserialize, Serialize};

use brusio::Brusio;
use colpi::{Bus, Colpo, Corpo, Lastra};
use dsp::{db, morbido, Biquad, Caso, Inseguitore, Pettine, Scorrevole, UnPolo};
use fiato::Fiato;
use fondi::{Pompe, Ventilazione, Ventola};
use re::Re;
use riverbero::Riverbero;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Ambiente {
    Silenzio,
    Plancia,
    Scafo,
    Vestibolo,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Nave {
    Libera,
    Accostata,
    Agganciata,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Evento {
    PrimoContatto,
    ToccaVenature,
    SalaTace,
    Gemito,
    Goccia,
    Sorpresa,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "tipo", content = "valore", rename_all = "snake_case")]
pub enum Comando {
    Ambiente(Ambiente),
    /// la cifra dell’aria, da 0 a 100
    Aria(f32),
    Nave(Nave),
    /// sullo scafo: quanto si è vicini alla rampa della Santa Maria (1 sopra, 0 lontano)
    Rampa(f32),
    Cammina(bool),
    Sforzo(bool),
    Evento(Evento),
    /// il volume generale, in dB
    Volume(f32),
    /// per le misure: suona solo uno strato («re», «ventilazione», «pompe», «ventola»,
    /// «fiato», «brusio», «voci», «segnali», «fruscio»); `None` li riaccende tutti
    Solo(Option<String>),
    /// sfuma tutto e chiude
    Ferma,
    /// per le prove: fa suonare un colpo per nome («lamiera», «rele», «cigolio»,
    /// «goccia», «crepa», «granello», «gemito», «spinta», «arpione», «urto»), o mette
    /// il brusio a una voce sola («una_voce») o al coro («coro»)
    Prova(String),
}

const S_RE: u32 = 1;
const S_VENTILAZIONE: u32 = 2;
const S_POMPE: u32 = 4;
const S_VENTOLA: u32 = 8;
const S_FIATO: u32 = 16;
const S_BRUSIO: u32 = 32;
const S_VOCI: u32 = 64;
const S_SEGNALI: u32 = 128;
const S_FRUSCIO: u32 = 256;

fn maschera(solo: Option<&str>) -> u32 {
    match solo {
        None => u32::MAX,
        Some("re") => S_RE,
        Some("ventilazione") => S_VENTILAZIONE,
        Some("pompe") => S_POMPE,
        Some("ventola") => S_VENTOLA,
        Some("fiato") => S_FIATO,
        Some("brusio") => S_BRUSIO,
        Some("voci") => S_VOCI,
        Some("segnali") => S_SEGNALI,
        Some("fruscio") => S_FRUSCIO,
        Some(_) => 0,
    }
}

/// Quello che la pagina può leggere mentre il mondo suona.
#[derive(Default)]
pub struct StatoMondo {
    fase: AtomicU32,
    al_minuto: AtomicU32,
    livello: AtomicU32,
    protezione: AtomicBool,
    voci: AtomicU32,
}

#[derive(Serialize, Clone, Debug)]
pub struct Istantanea {
    /// dove siamo nel respiro (0–1), −1 fra un respiro e l’altro
    pub fase: f32,
    pub respiri_al_minuto: f32,
    pub livello_db: f32,
    pub protezione: bool,
    pub voci: u32,
}

impl StatoMondo {
    pub fn istantanea(&self) -> Istantanea {
        Istantanea {
            fase: f32::from_bits(self.fase.load(Ordering::Relaxed)),
            respiri_al_minuto: f32::from_bits(self.al_minuto.load(Ordering::Relaxed)),
            livello_db: f32::from_bits(self.livello.load(Ordering::Relaxed)),
            protezione: self.protezione.load(Ordering::Relaxed),
            voci: self.voci.load(Ordering::Relaxed),
        }
    }
}

/// Le piogge di eventi: a intervalli casuali, un colpo della sua specie.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Specie {
    Lamiera,
    Rele,
    Cigolio,
    Goccia,
    Crepa,
    Granello,
}

struct Pioggia {
    specie: Specie,
    intervallo: (f32, f32),
    guadagno: (f32, f32),
    pan: (f32, f32),
    attiva: bool,
    prossimo: f32,
}

impl Pioggia {
    fn nuova(specie: Specie, intervallo: (f32, f32), guadagno: (f32, f32)) -> Self {
        Pioggia { specie, intervallo, guadagno, pan: (-0.8, 0.8), attiva: false, prossimo: 0.0 }
    }

    fn accendi(&mut self, si: bool, caso: &mut Caso) {
        if si && !self.attiva {
            self.prossimo = caso.tra(self.intervallo.0 * 0.3, self.intervallo.1);
        }
        self.attiva = si;
    }

    /// Vero quando è il momento di un colpo.
    fn passo(&mut self, dt: f32, caso: &mut Caso) -> bool {
        if !self.attiva {
            return false;
        }
        self.prossimo -= dt;
        if self.prossimo <= 0.0 {
            self.prossimo = caso.tra(self.intervallo.0, self.intervallo.1);
            return true;
        }
        false
    }
}

enum Azione {
    Brusio(f32, f32),
    BrusioQuanti(f32, f32),
    Scena(f32),
    RadioFine,
}

struct Automazione {
    tra: f32,
    azione: Azione,
}

const MAX_COLPI: usize = 96;

pub struct Mondo {
    sr: f32,
    rx: Receiver<Comando>,
    stato: Arc<StatoMondo>,
    caso: Caso,
    maschera: u32,
    // --- gli strati
    re: Re,
    re_pavimento: Biquad,
    re_aria: Scorrevole,
    re_ossa: Scorrevole,
    ventilazione: Ventilazione,
    pompe: Pompe,
    pompe_pavimento: Biquad,
    ventola: Ventola,
    fiato: Fiato,
    fiato_g: Scorrevole,
    brusio: Brusio,
    brusio_base: f32,
    brusio_radio: bool,
    piogge: Vec<Pioggia>,
    lastre: Vec<Lastra>,
    colpi: Vec<Colpo>,
    automazioni: Vec<Automazione>,
    riverbero: Riverbero,
    // --- le strade
    w_aria: Scorrevole,
    w_guscio: Scorrevole,
    w_cuffia: Scorrevole,
    w_em: Scorrevole,
    w_casco: Scorrevole,
    w_ossa: Scorrevole,
    w_fruscio: Scorrevole,
    guscio: UnPolo,
    cuffia_hp: Biquad,
    cuffia_lp: Biquad,
    compressore: Inseguitore,
    radio_hp: Biquad,
    radio_lp: Biquad,
    casco_eq1: Biquad,
    casco_eq2: Biquad,
    casco_vicino: Biquad,
    casco_pettine: Pettine,
    ossa_lp1: Biquad,
    ossa_lp2: Biquad,
    fruscio_lp: UnPolo,
    ipossia: Biquad,
    ipossia_attiva: bool,
    larghezza: Scorrevole,
    volume: Scorrevole,
    fermo: bool,
    // --- lo stato
    ambiente: Ambiente,
    nave: Nave,
    aria: f32,
    protezione: bool,
    rampa: f32,
    cammina: bool,
    piede: bool,
    t_stivali: f32,
    t_gemito: f32,
    t_radio: f32,
    radio_accesa: bool,
    energia: f64,
    campioni_misurati: u32,
}

impl Mondo {
    pub fn nuovo(sr: f32, seme: u64) -> (Self, Sender<Comando>, Arc<StatoMondo>) {
        let (tx, rx) = channel();
        let stato = Arc::new(StatoMondo::default());
        let mut caso = Caso::nuovo(seme);
        // le lamiere della plancia: sei pannelli, ognuno con il suo suono
        let lastre = (0..6).map(|_| Lastra::a_caso((380.0, 1100.0), (0.25, 0.7), &mut caso)).collect();
        let mut lamiere = Pioggia::nuova(Specie::Lamiera, (15.0, 60.0), (-40.0, -31.0));
        lamiere.pan = (-0.9, 0.9);
        let piogge = vec![
            lamiere,
            Pioggia::nuova(Specie::Rele, (20.0, 40.0), (-38.0, -32.0)),
            Pioggia::nuova(Specie::Cigolio, (60.0, 150.0), (-42.0, -35.0)),
            Pioggia::nuova(Specie::Goccia, (6.0, 22.0), (-34.0, -26.0)),
            Pioggia::nuova(Specie::Crepa, (25.0, 70.0), (-44.0, -36.0)),
            Pioggia::nuova(Specie::Granello, (20.0, 55.0), (-38.0, -30.0)),
        ];
        let m = Mondo {
            sr,
            rx,
            stato: stato.clone(),
            maschera: u32::MAX,
            re: Re::nuovo(sr, seme ^ 0x7E),
            re_pavimento: Biquad::passabasso(180.0, 0.7, sr),
            re_aria: Scorrevole::nuovo(0.0),
            re_ossa: Scorrevole::nuovo(0.0),
            ventilazione: Ventilazione::nuova(sr, seme ^ 0x7E47),
            pompe: Pompe::nuove(sr, seme ^ 0x90),
            pompe_pavimento: Biquad::passabasso(240.0, 0.7, sr),
            ventola: Ventola::nuova(sr, seme ^ 0x7E0),
            fiato: Fiato::nuovo(sr, seme ^ 0xF1A7),
            fiato_g: Scorrevole::nuovo(1.0),
            brusio: Brusio::nuovo(sr, seme ^ 0xB2),
            brusio_base: 0.0,
            brusio_radio: false,
            piogge,
            lastre,
            colpi: Vec::with_capacity(MAX_COLPI),
            automazioni: Vec::with_capacity(32),
            riverbero: Riverbero::nuovo(sr),
            w_aria: Scorrevole::nuovo(0.0),
            w_guscio: Scorrevole::nuovo(0.0),
            w_cuffia: Scorrevole::nuovo(0.0),
            w_em: Scorrevole::nuovo(0.0),
            w_casco: Scorrevole::nuovo(0.0),
            w_ossa: Scorrevole::nuovo(0.0),
            w_fruscio: Scorrevole::nuovo(0.0),
            // la legge di massa di un casco di policarbonato: un polo solo a 140 Hz
            guscio: UnPolo::nuovo(140.0, sr),
            cuffia_hp: Biquad::passaalto(150.0, 0.7, sr),
            cuffia_lp: Biquad::passabasso(7000.0, 0.7, sr),
            compressore: Inseguitore::nuovo(0.005, 0.12, sr),
            radio_hp: Biquad::passaalto(300.0, 0.7, sr),
            radio_lp: Biquad::passabasso(3400.0, 0.9, sr),
            // la bolla: due risonanze, la vicinanza della bocca e le riflessioni a mezzo millisecondo
            casco_eq1: Biquad::picco(700.0, 1.2, 4.0, sr),
            casco_eq2: Biquad::picco(1500.0, 2.0, 3.0, sr),
            casco_vicino: Biquad::mensola_bassa(220.0, 3.0, sr),
            casco_pettine: Pettine::nuovo((0.00046 * sr) as usize, 0.22),
            ossa_lp1: Biquad::passabasso(250.0, 0.7, sr),
            ossa_lp2: Biquad::passabasso(250.0, 0.7, sr),
            fruscio_lp: UnPolo::nuovo(3000.0, sr),
            ipossia: Biquad::passabasso(20000.0, 0.7, sr),
            ipossia_attiva: false,
            larghezza: Scorrevole::nuovo(1.0),
            volume: Scorrevole::nuovo(1.0),
            fermo: false,
            ambiente: Ambiente::Silenzio,
            nave: Nave::Libera,
            aria: 100.0,
            protezione: false,
            rampa: 1.0,
            cammina: false,
            piede: false,
            t_stivali: 0.0,
            t_gemito: 30.0,
            t_radio: 1e9,
            radio_accesa: false,
            energia: 0.0,
            campioni_misurati: 0,
            caso,
        };
        (m, tx, stato)
    }

    pub fn finito(&self) -> bool {
        self.fermo && self.volume.v < 1e-4
    }

    fn tuta(&self) -> bool {
        matches!(self.ambiente, Ambiente::Scafo | Ambiente::Vestibolo)
    }

    fn suona(&mut self, corpo: Corpo, bus: Bus, guadagno_db: f32, p: f32, ritardo: f32) {
        if self.colpi.len() < MAX_COLPI {
            self.colpi.push(Colpo::nuovo(corpo, bus, guadagno_db, p, ritardo, self.sr));
        }
    }

    // --------------------------------------------------------------------------------
    //  Le scene: i pesi delle strade, i volumi degli strati, la stanza
    // --------------------------------------------------------------------------------
    fn applica_scena(&mut self, t: f32) {
        let sr = self.sr;
        let tuta = self.tuta();
        let p = tuta && self.aria < 30.0;
        self.protezione = p;
        let (aria, guscio, cuffia, em, casco, ossa, fruscio) = match self.ambiente {
            Ambiente::Silenzio => (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0),
            Ambiente::Plancia => (1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0),
            Ambiente::Scafo => (0.0, 0.0, 0.0, 0.0, 1.0, 1.0, if p { 0.0 } else { 1.0 }),
            Ambiente::Vestibolo if p => (0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0),
            Ambiente::Vestibolo => (0.0, db(-8.0), 1.0, 1.0, 1.0, 1.0, 1.0),
        };
        self.w_aria.verso(aria, t, sr);
        self.w_guscio.verso(guscio, t, sr);
        self.w_cuffia.verso(cuffia, t, sr);
        self.w_em.verso(em, t, sr);
        self.w_casco.verso(casco, t, sr);
        self.w_ossa.verso(ossa, t, sr);
        self.w_fruscio.verso(fruscio, t, sr);
        // con la protezione vitale il fiato si fa più vicino
        self.fiato_g.verso(if p { db(2.0) } else { 1.0 }, t, sr);

        let plancia = self.ambiente == Ambiente::Plancia;
        let vestibolo = self.ambiente == Ambiente::Vestibolo;
        // la stanza: plancia piccola e piena di superfici, vestibolo basso e tondo; nel
        // vuoto, niente
        match self.ambiente {
            Ambiente::Plancia => self.riverbero.stanza(0.45, 0.25, 0.55, 0.45, t),
            Ambiente::Vestibolo => self.riverbero.stanza(1.3, 0.6, 0.7, 1.0, t),
            _ => self.riverbero.stanza(0.5, 0.3, 0.0, 1.0, t),
        }
        self.ventilazione.g.verso(if plancia { db(LIV_VENTILAZIONE) } else { 0.0 }, t, sr);
        self.pompe.g.verso(if plancia { db(LIV_POMPE) } else { 0.0 }, t, sr);
        self.ventola.g.verso(if tuta { db(LIV_VENTOLA) } else { 0.0 }, t, sr);
        self.fiato.acceso = tuta;

        // il re: sotto il pavimento della plancia; sullo scafo, solo dalla rampa, nelle ossa
        let libera = self.nave == Nave::Libera;
        let (re_aria, re_ossa) = match self.ambiente {
            Ambiente::Plancia if libera => (db(LIV_RE), db(LIV_RE_OSSA)),
            Ambiente::Plancia => (db(LIV_RE - 6.0), db(LIV_RE_OSSA - 6.0)),
            Ambiente::Scafo => (0.0, self.rampa * self.rampa * db(LIV_RE_RAMPA)),
            _ => (0.0, 0.0),
        };
        self.re.g.verso(if re_aria + re_ossa > 0.0 { 1.0 } else { 0.0 }, t, sr);
        self.re_aria.verso(re_aria, t, sr);
        self.re_ossa.verso(re_ossa, t.min(1.5), sr);
        // «Il reattore abbassa il suo lamento»: meno armonici alti, l’altezza ferma
        self.re.alti.verso(if libera { 1.0 } else { db(-12.0) }, 4.0, sr);
        // agganciata, «ogni minuto così costa reattore»: i battimenti si stringono
        self.re.scarto.verso(if self.nave == Nave::Agganciata { 0.2 } else { 0.11 }, 6.0, sr);

        // il brusio: nel vestibolo dalla cuffia; nella plancia agganciata, dalla radio
        self.brusio_radio = plancia;
        if vestibolo && !p {
            self.brusio_base = db(LIV_BRUSIO);
            self.brusio.quanti.verso(16.0, t, sr);
            self.brusio.guadagno.verso(self.brusio_base, t, sr);
        } else if !(plancia && self.radio_accesa) {
            self.brusio_base = 0.0;
            self.brusio.guadagno.verso(0.0, t.min(1.0), sr);
            self.brusio.quanti.verso(0.0, t, sr);
        }

        let caso = &mut self.caso;
        for pioggia in self.piogge.iter_mut() {
            let si = match pioggia.specie {
                Specie::Lamiera | Specie::Rele | Specie::Cigolio => plancia,
                Specie::Goccia | Specie::Crepa | Specie::Granello => vestibolo,
            };
            pioggia.accendi(si, caso);
        }
        if self.nave == Nave::Agganciata && plancia {
            if self.t_radio > 1e8 {
                self.t_radio = 6.0;
            }
        } else {
            self.t_radio = 1e9;
        }
        self.stato.protezione.store(p, Ordering::Relaxed);
    }

    fn imposta_aria(&mut self, nuova: f32) {
        let vecchia = self.aria;
        self.aria = nuova.clamp(0.0, 100.0);
        self.fiato.aria = self.aria;
        let sr = self.sr;
        if self.tuta() {
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
            if vecchia >= 30.0 && self.aria < 30.0 {
                // tre note d’allarme, poi i relè: la tuta stacca i canali secondari
                for (k, f) in [988.0, 988.0, 740.0].into_iter().enumerate() {
                    self.suona(colpi::nota(f, 0.15, sr), Bus::Casco, -28.0, 0.0, k as f32 * 0.18);
                }
                let r1 = colpi::rele(true, &mut self.caso, sr);
                let r2 = colpi::rele(true, &mut self.caso, sr);
                self.suona(r1, Bus::Casco, -24.0, -0.3, 0.75);
                self.suona(r2, Bus::Casco, -26.0, 0.3, 0.9);
                self.automazioni.push(Automazione { tra: 0.75, azione: Azione::Scena(1.2) });
            } else if vecchia < 30.0 && self.aria >= 30.0 {
                let r1 = colpi::rele(false, &mut self.caso, sr);
                let r2 = colpi::rele(true, &mut self.caso, sr);
                self.suona(r1, Bus::Casco, -26.0, 0.3, 0.0);
                self.suona(r2, Bus::Casco, -24.0, -0.3, 0.15);
                self.automazioni.push(Automazione { tra: 0.15, azione: Azione::Scena(1.2) });
            }
        }
        // l’ipossia: un passa-basso che scende da 9 kHz (a 15) a 2,5 kHz (a 1), e lo stereo che si stringe
        if self.aria <= 15.0 {
            let x = ((15.0 - self.aria) / 14.0).clamp(0.0, 1.0);
            let taglio = 9000.0 * (2500.0f32 / 9000.0).powf(x);
            self.ipossia.aggiorna(Biquad::passabasso(taglio, 0.7, sr));
            self.ipossia_attiva = true;
            self.larghezza.verso(1.0 - 0.7 * x, 3.0, sr);
        } else {
            self.ipossia_attiva = false;
            self.larghezza.verso(1.0, 3.0, sr);
        }
        if !(vecchia >= 30.0 && self.aria < 30.0) && !(vecchia < 30.0 && self.aria >= 30.0) {
            self.applica_scena(1.2);
        }
    }

    // --------------------------------------------------------------------------------
    //  Gli eventi
    // --------------------------------------------------------------------------------
    fn gemito(&mut self) {
        let corpo = colpi::gemito(&mut self.caso, self.sr);
        let p = self.caso.tra(-0.6, 0.6);
        // «ti arriva nei denti prima che nelle cuffie»: prima le ossa, poi la cuffia
        self.suona(corpo, Bus::Ossa, LIV_GEMITO, 0.0, 0.0);
        self.suona(corpo, Bus::Esterno, LIV_GEMITO - 12.0, p, 0.3);
    }

    fn evento(&mut self, e: Evento) {
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
                self.automazioni.push(Automazione { tra: 0.3, azione: Azione::Brusio(self.brusio_base, 0.8) });
                self.suona(colpi::tic(0.0, sr), Bus::Casco, -30.0, 0.0, 1.0);
                self.suona(colpi::tic(0.0, sr), Bus::Casco, -30.0, 0.0, 1.06);
            }
            Evento::ToccaVenature => {
                if self.brusio_base > 0.0 {
                    self.brusio.guadagno.verso(self.brusio_base * db(8.0), 0.4, sr);
                    self.brusio.quanti.verso(24.0, 0.4, sr);
                    self.automazioni.push(Automazione { tra: 1.2, azione: Azione::Brusio(self.brusio_base, 1.5) });
                    self.automazioni.push(Automazione { tra: 1.2, azione: Azione::BrusioQuanti(16.0, 1.5) });
                    self.suona(colpi::tic(0.0, sr), Bus::Casco, -30.0, 0.0, 0.3);
                }
            }
            Evento::SalaTace => {
                // «come una sala piena che smette di parlare quando entri. Poi riprende»
                if self.brusio_base > 0.0 {
                    self.brusio.guadagno.verso(0.0, 2.0, sr);
                    self.automazioni.push(Automazione { tra: 5.0, azione: Azione::Brusio(self.brusio_base, 4.0) });
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

    fn evento_nave(&mut self, n: Nave) {
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
                    self.suona(c, Bus::Ossa, -2.0, 0.0, t);
                    self.suona(c, Bus::Esterno, -20.0, 0.0, t);
                }
                // «un urto lungo che fa tremare la plancia»
                let c = colpi::urto_lungo(&mut self.caso, sr);
                self.suona(c, Bus::Ossa, -11.0, 0.0, 1.6);
                self.suona(c, Bus::Esterno, -25.0, 0.0, 1.6);
            }
        }
    }

    fn colpo_di_pioggia(&mut self, specie: Specie, g: f32, p: f32) {
        let sr = self.sr;
        match specie {
            Specie::Lamiera => {
                let k = self.caso.indice(self.lastre.len());
                let lastra = self.lastre[k];
                let c = colpi::lamiera(&lastra, &mut self.caso, sr);
                self.suona(c, Bus::Esterno, g, p, 0.0);
            }
            Specie::Rele => {
                // un relè che scatta, e dopo un poco si riapre
                let chiude = colpi::rele(true, &mut self.caso, sr);
                let apre = colpi::rele(false, &mut self.caso, sr);
                let dopo = self.caso.tra(0.4, 6.0);
                self.suona(chiude, Bus::Esterno, g, p, 0.0);
                self.suona(apre, Bus::Esterno, g - 3.0, p, dopo);
            }
            Specie::Cigolio => {
                let c = colpi::cigolio(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, g, p, 0.0);
            }
            Specie::Goccia => {
                let c = colpi::goccia(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, g, p, 0.0);
            }
            Specie::Crepa => {
                let c = colpi::crepa(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, g, p, 0.0);
            }
            Specie::Granello => {
                let c = colpi::granello(&mut self.caso, sr);
                self.suona(c, Bus::Esterno, g, p, 0.0);
            }
        }
    }

    fn comando(&mut self, c: Comando) {
        let sr = self.sr;
        match c {
            Comando::Ambiente(a) => {
                if a != self.ambiente {
                    self.ambiente = a;
                    self.t_gemito = self.caso.tra(20.0, 50.0);
                    self.applica_scena(2.5);
                }
            }
            Comando::Aria(v) => self.imposta_aria(v),
            Comando::Nave(n) => {
                if n != self.nave {
                    self.nave = n;
                    self.evento_nave(n);
                    self.applica_scena(2.0);
                }
            }
            Comando::Rampa(r) => {
                self.rampa = r.clamp(0.0, 1.0);
                self.applica_scena(1.0);
            }
            Comando::Cammina(si) => self.cammina = si,
            Comando::Sforzo(si) => self.fiato.sforzo = si,
            Comando::Evento(e) => self.evento(e),
            Comando::Volume(d) => self.volume.verso(db(d), 0.3, sr),
            Comando::Solo(s) => self.maschera = maschera(s.as_deref()),
            Comando::Ferma => {
                self.fermo = true;
                self.volume.verso(0.0, 1.5, sr);
            }
            Comando::Prova(nome) => self.prova(&nome),
        }
    }

    fn prova(&mut self, nome: &str) {
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

    fn esegui(&mut self, a: Azione) {
        let sr = self.sr;
        match a {
            Azione::Brusio(g, t) => self.brusio.guadagno.verso(g, t, sr),
            Azione::BrusioQuanti(n, t) => self.brusio.quanti.verso(n, t, sr),
            Azione::Scena(t) => self.applica_scena(t),
            Azione::RadioFine => {
                self.radio_accesa = false;
                self.brusio.guadagno.verso(0.0, 1.5, sr);
                self.brusio.quanti.verso(0.0, 2.0, sr);
            }
        }
    }

    /// Una volta per blocco: le piogge, i passi, la radio, le automazioni.
    fn passo_blocco(&mut self, dt: f32) {
        let sr = self.sr;
        for i in 0..self.piogge.len() {
            if self.piogge[i].passo(dt, &mut self.caso) {
                let p = &self.piogge[i];
                let (specie, gg, pp) = (p.specie, p.guadagno, p.pan);
                let g = self.caso.tra(gg.0, gg.1);
                let pan = self.caso.tra(pp.0, pp.1);
                self.colpo_di_pioggia(specie, g, pan);
            }
        }
        if self.ambiente == Ambiente::Vestibolo {
            self.t_gemito -= dt;
            if self.t_gemito <= 0.0 {
                self.gemito();
                self.t_gemito = self.caso.tra(45.0, 110.0);
            }
        }
        // i magneti degli stivali: un colpo sordo a ogni appoggio, uno strappo a ogni distacco
        if self.ambiente == Ambiente::Scafo && self.cammina {
            self.t_stivali -= dt;
            if self.t_stivali <= 0.0 {
                self.piede = !self.piede;
                let c = colpi::stivale(self.piede, &mut self.caso, sr);
                self.suona(c, Bus::Ossa, if self.piede { -6.0 } else { -12.0 }, 0.0, 0.0);
                self.t_stivali = if self.piede { 0.42 } else { 0.5 } * self.caso.tra(0.92, 1.08);
            }
        }
        // la radio agganciata: «un fruscio che non è statica», a tratti
        if self.t_radio < 1e8 {
            self.t_radio -= dt;
            if self.t_radio <= 0.0 && !self.radio_accesa {
                self.radio_accesa = true;
                self.brusio.quanti.verso(10.0, 0.5, sr);
                self.brusio.guadagno.verso(db(LIV_RADIO), 1.0, sr);
                let resta = self.caso.tra(4.0, 10.0);
                self.automazioni.push(Automazione { tra: resta, azione: Azione::RadioFine });
                self.t_radio = resta + self.caso.tra(30.0, 90.0);
            }
        }
        let mut i = 0;
        while i < self.automazioni.len() {
            self.automazioni[i].tra -= dt;
            if self.automazioni[i].tra <= 0.0 {
                let a = self.automazioni.swap_remove(i);
                self.esegui(a.azione);
            } else {
                i += 1;
            }
        }
    }

    pub fn rendi(&mut self, out: &mut [Frame], dt: f64) {
        while let Ok(c) = self.rx.try_recv() {
            self.comando(c);
        }
        let dtf = dt as f32;
        self.passo_blocco(out.len() as f32 * dtf);
        let m = self.maschera;
        let on = |bit: u32| if m & bit != 0 { 1.0f32 } else { 0.0 };
        let (s_re, s_vent, s_pompe, s_ventola, s_fiato, s_brusio, s_voci, s_segnali, s_fruscio) =
            (on(S_RE), on(S_VENTILAZIONE), on(S_POMPE), on(S_VENTOLA), on(S_FIATO), on(S_BRUSIO), on(S_VOCI), on(S_SEGNALI), on(S_FRUSCIO));
        let soglia = db(-30.0);
        let ricarica = db(4.0);
        let fruscio_g = db(-62.0);
        let guscio_g = db(-3.0);
        for frame in out.iter_mut() {
            let mut est = (0.0f32, 0.0f32);
            let mut em = (0.0f32, 0.0f32);
            let mut casco = (0.0f32, 0.0f32);
            let mut ossa = 0.0f32;
            let mut alt = 0.0f32;

            // il re
            let (rl, rr) = self.re.campione(dt);
            let (wa, wo) = (self.re_aria.passo() * s_re, self.re_ossa.passo() * s_re);
            let (fl, fr) = (self.re_pavimento.elabora(rl, 0), self.re_pavimento.elabora(rr, 1));
            est.0 += fl * wa;
            est.1 += fr * wa;
            ossa += (rl + rr) * 0.5 * wo;

            // i fondi
            let (vl, vr) = self.ventilazione.campione();
            est.0 += vl * s_vent;
            est.1 += vr * s_vent;
            let (pl, pr) = self.pompe.campione();
            est.0 += self.pompe_pavimento.elabora(pl, 0) * s_pompe;
            est.1 += self.pompe_pavimento.elabora(pr, 1) * s_pompe;
            let k = self.ventola.campione() * s_ventola;
            casco.0 += k;
            casco.1 += k;

            // il fiato, al centro, dentro il casco
            let f = self.fiato.campione() * self.fiato_g.passo() * s_fiato;
            casco.0 += f;
            casco.1 += f;

            // il brusio: dalla radio nella plancia, dalla cuffia nel relitto
            let (bl, br) = self.brusio.campione();
            if self.brusio_radio {
                alt += (bl + br) * 0.5 * s_brusio;
            } else {
                em.0 += bl * s_brusio;
                em.1 += br * s_brusio;
            }

            // i colpi
            let mut k = 0;
            while k < self.colpi.len() {
                let bus = self.colpi[k].bus;
                match self.colpi[k].campione(&mut self.caso) {
                    Some((l, r)) => {
                        let s = if bus == Bus::Casco { s_segnali } else { s_voci };
                        let (l, r) = (l * s, r * s);
                        match bus {
                            Bus::Esterno => {
                                est.0 += l;
                                est.1 += r;
                            }
                            Bus::Em => {
                                em.0 += l;
                                em.1 += r;
                            }
                            Bus::Casco => {
                                casco.0 += l;
                                casco.1 += r;
                            }
                            Bus::Ossa => ossa += (l + r) * 0.5,
                            Bus::Altoparlante => alt += (l + r) * 0.5,
                        }
                        k += 1;
                    }
                    None => {
                        self.colpi.swap_remove(k);
                    }
                }
            }

            // la radio di bordo: banda stretta e un filo di saturazione, un po’ a destra
            let a = morbido(self.radio_lp.elabora(self.radio_hp.elabora(alt, 0), 0) * 1.6) / 1.6;
            est.0 += a * 0.55;
            est.1 += a * 0.83;

            // la stanza
            let (rvl, rvr) = self.riverbero.elabora(est.0, est.1);
            est.0 += rvl;
            est.1 += rvr;

            // ---- le strade
            let wa = self.w_aria.passo();
            let mut l = est.0 * wa;
            let mut r = est.1 * wa;
            // il guscio: la legge di massa
            let wg = self.w_guscio.passo() * guscio_g;
            l += self.guscio.elabora(est.0, 0) * wg;
            r += self.guscio.elabora(est.1, 1) * wg;
            // la cuffia: i microfoni di fuori e il brusio, in banda stretta, compressi
            let wc = self.w_cuffia.passo();
            let we = self.w_em.passo();
            let cl = self.cuffia_lp.elabora(self.cuffia_hp.elabora(est.0 * wc + em.0 * we, 0), 0);
            let cr = self.cuffia_lp.elabora(self.cuffia_hp.elabora(est.1 * wc + em.1 * we, 1), 1);
            let e = self.compressore.segui(cl.abs().max(cr.abs()));
            let gc = if e > soglia { (soglia / e).powf(2.0 / 3.0) } else { 1.0 } * ricarica;
            let rumore = self.fruscio_lp.elabora(self.caso.bianco(), 0) * fruscio_g * self.w_fruscio.passo() * s_fruscio;
            l += cl * gc + rumore;
            r += cr * gc + rumore;
            // il casco: la bolla
            let wk = self.w_casco.passo();
            let k1 = self.casco_vicino.elabora(self.casco_eq2.elabora(self.casco_eq1.elabora(casco.0, 0), 0), 0);
            let k2 = self.casco_vicino.elabora(self.casco_eq2.elabora(self.casco_eq1.elabora(casco.1, 1), 1), 1);
            let (k1, k2) = self.casco_pettine.elabora(k1, k2);
            l += k1 * wk;
            r += k2 * wk;
            // le ossa: solo i bassi, al centro
            let o = self.ossa_lp2.elabora(self.ossa_lp1.elabora(ossa, 0), 0) * self.w_ossa.passo();
            l += o;
            r += o;

            // l’ipossia, e lo stereo che si stringe
            if self.ipossia_attiva {
                l = self.ipossia.elabora(l, 0);
                r = self.ipossia.elabora(r, 1);
            }
            let w = self.larghezza.passo();
            let (mid, side) = ((l + r) * 0.5, (l - r) * 0.5 * w);
            let v = self.volume.passo();
            let (l, r) = (morbido((mid + side) * v), morbido((mid - side) * v));
            frame.left = l;
            frame.right = r;
            self.energia += (l * l + r * r) as f64 * 0.5;
            self.campioni_misurati += 1;
        }
        // quello che la pagina può leggere
        let s = &self.stato;
        s.fase.store(self.fiato.fase().to_bits(), Ordering::Relaxed);
        s.al_minuto.store(if self.fiato.acceso { self.fiato.al_minuto() } else { 0.0 }.to_bits(), Ordering::Relaxed);
        s.voci.store(self.colpi.len() as u32, Ordering::Relaxed);
        if self.campioni_misurati as f32 >= self.sr * 0.1 {
            let rms = (self.energia / self.campioni_misurati as f64).sqrt();
            s.livello.store((20.0 * (rms + 1e-9).log10() as f32).to_bits(), Ordering::Relaxed);
            self.energia = 0.0;
            self.campioni_misurati = 0;
        }
    }
}

// I livelli degli strati, in dB. Tarati con le misure dei rendering
// (examples/rendi_ambienti.rs): una plancia calma intorno a −24 LUFS, il re sotto il
// pavimento intorno a −30, il fiato calmo intorno a −27.
const LIV_VENTILAZIONE: f32 = -15.5;
const LIV_POMPE: f32 = -7.0;
const LIV_RE: f32 = -10.0;
const LIV_RE_OSSA: f32 = -14.0;
const LIV_RE_RAMPA: f32 = -10.0;
const LIV_VENTOLA: f32 = -17.0;
const LIV_BRUSIO: f32 = -10.0;
const LIV_RADIO: f32 = -9.0;
const LIV_GEMITO: f32 = -18.0;

// -------------------------------------------------------------------------------------
//  Il mondo come suono di kira
// -------------------------------------------------------------------------------------
pub struct DatiMondo {
    pub mondo: Mondo,
    pub prima_del_blocco: Option<Box<dyn FnMut(usize) + Send>>,
}

pub struct SuonoMondo {
    mondo: Mondo,
    prima_del_blocco: Option<Box<dyn FnMut(usize) + Send>>,
}

impl SoundData for DatiMondo {
    type Error = ();
    type Handle = ();

    fn into_sound(self) -> Result<(Box<dyn Sound>, Self::Handle), Self::Error> {
        Ok((Box::new(SuonoMondo { mondo: self.mondo, prima_del_blocco: self.prima_del_blocco }), ()))
    }
}

impl Sound for SuonoMondo {
    fn process(&mut self, out: &mut [Frame], dt: f64, _info: &Info) {
        if let Some(f) = &mut self.prima_del_blocco {
            f(out.len());
        }
        self.mondo.rendi(out, dt);
    }

    fn finished(&self) -> bool {
        self.mondo.finito()
    }
}
