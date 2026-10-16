//! Il mondo sonoro: tutti gli strati del suono in un solo `Sound` di kira, mescolati
//! lungo le cinque strade della bibbia sonora (§1.1): l’aria, il guscio del casco, la
//! cuffia, il casco, le ossa. Tutto è sintetizzato qui dentro, in tempo reale:
//! nessun campione registrato (decisione dell’autore, 15 ottobre 2026; bibbia, §10).
//!
//! Il gioco manda un turno alla volta (`Comando::Turno`): gli stati e gli eventi che il
//! ponte calcola, così come sono. La regia (regia.rs) ne ricava la stanza, la scena del
//! mix e il suono di ogni evento; le stanze sono in stanze.rs, gli strati continui in
//! fondi.rs e ambienti.rs, i colpi in colpi.rs. Le scene del prototipo
//! (`Comando::Ambiente` e gli altri) restano per la pagina di prova e per i rendering.
//!
//! La pagina manda comandi per un canale; il thread dell’audio li legge a ogni blocco.
//! Lo stesso motore gira anche fuori dall’app, in `examples/`, per rendere gli ambienti
//! e le partite su file e misurarli.

pub mod ambienti;
pub mod brusio;
pub mod colpi;
pub mod dsp;
pub mod fiato;
pub mod fondi;
pub mod interfaccia;
pub mod musica;
pub mod re;
mod regia;
pub mod sintonia;
pub mod riverbero;
pub mod stanze;
pub mod stato;
pub mod voce;

use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::Arc;

use kira::info::Info;
use kira::sound::{Sound, SoundData};
use kira::Frame;
use serde::{Deserialize, Serialize};

use ambienti::{Acufene, Battito, Canale as CanaleRadio, Crepitio, Fondo, FormaRonzio, Groviglio, Ronzio, Soffio, Toppe, Tremito};
use brusio::Brusio;
use colpi::{Bus, Canale, Colpo, Corpo, Lastra};
use dsp::{db, morbido, Biquad, Caso, Inseguitore, Pettine, Scorrevole, UnPolo};
use fiato::Fiato;
use fondi::{Pompe, Ventilazione, Ventola};
use musica::Musica;
use re::Re;
use riverbero::Riverbero;
use sintonia::{Profilo, Spostatore};
use stanze::{Specie, Stanza};
use voce::Voce;

pub use interfaccia::Gesto;
pub use musica::Brano;
pub use regia::EVENTI_NOTI;
pub use stato::{EventoGioco, StatiGioco, TurnoSuono};

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

/// I cursori e le opzioni del suono (06, §9.2; bibbia sonora, §2.5). I volumi vanno
/// da 0 a 1, come i cursori; il motore li sente al quadrato, come l’orecchio.
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct Mix {
    pub generale: f32,
    pub ambienti: f32,
    pub effetti: f32,
    pub voci: f32,
    /// la musica (06, §9.2: il quinto cursore)
    pub musica: f32,
    /// i due canali sommati, con le differenze di volume
    pub mono: bool,
    /// la dinamica ridotta: per chi gioca piano o di notte (3:1 sopra −30 dBFS)
    pub dinamica_ridotta: bool,
    /// riduci i suoni intensi: le ossa e i bassi profondi a −12 dB, niente picchi,
    /// niente battito né fischio nell’anticamera
    pub intensi_ridotti: bool,
}

impl Default for Mix {
    fn default() -> Self {
        Mix { generale: 1.0, ambienti: 1.0, effetti: 1.0, voci: 1.0, musica: 1.0, mono: false, dinamica_ridotta: false, intensi_ridotti: false }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "tipo", content = "valore", rename_all = "snake_case")]
pub enum Comando {
    /// un turno del gioco: gli stati e gli eventi del suono, come li manda il ponte
    Turno(TurnoSuono),
    /// i cursori e le opzioni
    Mix(Mix),
    /// la pausa, il diario, i pannelli: il mondo si abbassa, non si ferma
    Pausa(bool),
    /// un tocco su un pulsante: il suono dell’interfaccia (bibbia sonora, §5.8)
    Tocco(Gesto),
    /// il menu principale: il mondo tace, l’interfaccia è tutta membrana, e suona la musica
    /// del menu (`true`); o se ne va (`false`)
    Menu(bool),
    /// un brano della musica, a comando (le prove e i rendering; di solito lo accende la regia)
    Musica(Brano),
    // ---- il prototipo dei tre ambienti (la pagina di prova, i rendering)
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
    /// «fiato», «brusio», «voci», «segnali», «fruscio», «stanza», «musica», «filo»); `None` li riaccende
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
const S_STANZA: u32 = 512;
const S_MUSICA: u32 = 1024;
const S_FILO: u32 = 2048;

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
        Some("stanza") => S_STANZA,
        Some("musica") => S_MUSICA,
        Some("filo") => S_FILO,
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

/// Una pioggia di eventi: a intervalli casuali, un colpo della sua specie.
#[derive(Clone, Copy)]
struct Pioggia {
    specie: Specie,
    intervallo: (f32, f32),
    guadagno: (f32, f32),
    attiva: bool,
    prossimo: f32,
}

impl Pioggia {
    const SPENTA: Pioggia = Pioggia { specie: Specie::Lamiera, intervallo: (60.0, 60.0), guadagno: (-60.0, -60.0), attiva: false, prossimo: 0.0 };

    fn accendi(&mut self, specie: Specie, intervallo: (f32, f32), guadagno: (f32, f32), caso: &mut Caso) {
        let era = self.attiva && self.specie == specie;
        self.specie = specie;
        self.intervallo = intervallo;
        self.guadagno = guadagno;
        if !era {
            self.prossimo = caso.tra(intervallo.0 * 0.3, intervallo.1);
        }
        self.attiva = true;
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

const PIOGGE: usize = 6;

/// L’anello del Piccolo (§5.3): la voce giovane che «gira su se stessa», identica a ogni giro.
#[derive(Clone, Copy)]
struct Anello {
    voce: Profilo,
    seme: u64,
    /// i secondi al prossimo giro, e quelli che restano all’anello
    prossimo: f32,
    restano: f32,
    /// finché si parla con l’eco, l’anello non si ferma
    in_dialogo: bool,
}

#[derive(Clone, Copy, Debug)]
enum Azione {
    /// il brusio verso un volume (lineare), in secondi
    Brusio(f32, f32),
    BrusioQuanti(f32, f32),
    RadioFine,
    /// il casco si blocca: la tuta diventa vera per il suono
    Tuta,
    /// il re nelle ossa sullo scafo: (quanto, 0–1; secondi)
    Rampa(f32, f32),
    /// i fondi della Santa Maria per un attimo: (moltiplicatore, secondi)
    Fondi(f32, f32),
    /// il fondo del relitto per un attimo: (moltiplicatore, secondi)
    Fondo(f32, f32),
    /// la voce in primo piano: (volume lineare, secondi)
    Filo(f32, f32),
    /// il re toccato: il moltiplicatore nelle ossa
    Tocco(f32, f32),
    /// la protezione vitale arriva dopo i relè: la cuffia si spegne (o si riaccende)
    Protezione(bool),
    /// il fiato torna come prima
    Ascolto(bool),
    /// tutto scende a zero, in secondi
    Silenzio(f32),
    /// la plancia del risveglio, alla fine
    Risveglio,
    /// la musica di una chiusura
    Musica(Brano),
    /// chi parla nel filo, da adesso (il Sintonizzatore, §5.3)
    Voce(Profilo),
}

#[derive(Clone, Copy, Debug)]
struct Automazione {
    tra: f32,
    azione: Azione,
}

const MAX_COLPI: usize = 128;

pub struct Mondo {
    sr: f32,
    rx: Receiver<Comando>,
    stato: Arc<StatoMondo>,
    caso: Caso,
    maschera: u32,
    // --- lo stato del gioco, per il suono
    gioco: StatiGioco,
    stanza: Option<&'static Stanza>,
    /// il gioco manda i turni (altrimenti: il prototipo dei tre ambienti)
    modo_gioco: bool,
    /// la tuta per il suono: diventa vera quando il casco si blocca
    tuta: bool,
    /// il casco tolto nella stiva, alla fine
    casa: bool,
    /// la fine: dopo il silenzio, il mondo non riparte da sé
    spento: bool,
    /// la protezione vitale come la dice il gioco, e come la sente il suono (dopo i relè)
    protezione: bool,
    protezione_eff: bool,
    /// la fine con il risuonatore: il brusio sale dalla stiva, per l’aria
    stiva_viva: bool,
    /// il dialogo del turno prima: la voce dell’eco si spegne quando finisce
    prima_dialogo: Option<String>,
    aria: f32,
    nave: Nave,
    rampa: f32,
    t_stanza: f32,
    t_aggancio: f32,
    ventola_spenta: bool,
    /// quanta membrana c’è nell’interfaccia (0–1), e dove sta andando: i tocchi la seguono
    membrana: f32,
    membrana_meta: f32,
    // --- la musica: i suoi strati, la sua sala, il suo cursore
    musica: Musica,
    riverbero_musica: Riverbero,
    c_musica: Scorrevole,
    // --- gli strati
    re: Re,
    re_pavimento: Biquad,
    re_taglio: Scorrevole,
    re_aria: Scorrevole,
    re_ossa: Scorrevole,
    re_tocco: Scorrevole,
    re_rampa: Scorrevole,
    ventilazione: Ventilazione,
    pompe: Pompe,
    pompe_pavimento: Biquad,
    pompe_taglio: Scorrevole,
    fondi_mul: Scorrevole,
    ventola: Ventola,
    fiato: Fiato,
    fiato_g: Scorrevole,
    brusio: Brusio,
    brusio_base: f32,
    brusio_quanti: f32,
    brusio_via: Bus,
    filo: Voce,
    filo_g: Scorrevole,
    /// lo spostamento di frequenza del filo (§5.3: +60–90 Hz), e di quanto sposta adesso
    spostatore: Spostatore,
    filo_shift: Scorrevole,
    /// l’anello del Piccolo: quattro secondi che ricominciano uguali
    anello: Option<Anello>,
    fondo: Fondo,
    fondo_mul: Scorrevole,
    ronzio: Ronzio,
    ronzio_forma: Option<FormaRonzio>,
    groviglio: Groviglio,
    vento: Soffio,
    vento_cfg: u8,
    crepitio: Crepitio,
    crepitio_cfg: u8,
    crepitio_casco: bool,
    fuoco: Soffio,
    fuoco_crepitio: Crepitio,
    tremito: Tremito,
    seme: Battito,
    cuore: Battito,
    acufene: Acufene,
    canale: CanaleRadio,
    toppe: Toppe,
    piogge: [Pioggia; PIOGGE],
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
    asciutto: Scorrevole,
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
    // --- il mix
    mix: Mix,
    c_ambienti: Scorrevole,
    c_effetti: Scorrevole,
    c_voci: Scorrevole,
    c_generale: Scorrevole,
    c_ossa: Scorrevole,
    pausa: Scorrevole,
    ingresso: Scorrevole,
    volume: Scorrevole,
    dinamica: Inseguitore,
    limitatore: Inseguitore,
    fermo: bool,
    // --- il prototipo
    cammina: bool,
    piede: bool,
    t_stivali: f32,
    t_gemito: f32,
    t_radio: f32,
    radio_accesa: bool,
    conto: u32,
    energia: f64,
    campioni_misurati: u32,
}

impl Mondo {
    pub fn nuovo(sr: f32, seme: u64) -> (Self, Sender<Comando>, Arc<StatoMondo>) {
        let (tx, rx) = channel();
        let stato = Arc::new(StatoMondo::default());
        let mut caso = Caso::nuovo(seme);
        // le lamiere della Santa Maria: sei pannelli, ognuno con il suo suono
        let lastre = (0..6).map(|_| Lastra::a_caso((380.0, 1100.0), (0.25, 0.7), &mut caso)).collect();
        let mut m = Mondo {
            sr,
            rx,
            stato: stato.clone(),
            maschera: u32::MAX,
            gioco: StatiGioco::default(),
            stanza: None,
            modo_gioco: false,
            tuta: false,
            casa: false,
            spento: false,
            protezione: false,
            protezione_eff: false,
            stiva_viva: false,
            prima_dialogo: None,
            aria: 100.0,
            nave: Nave::Libera,
            rampa: 1.0,
            t_stanza: 0.0,
            t_aggancio: 1e9,
            ventola_spenta: false,
            membrana: 0.0,
            membrana_meta: 0.0,
            musica: Musica::nuova(sr, seme ^ 0x4D55),
            riverbero_musica: Riverbero::nuovo(sr),
            c_musica: Scorrevole::nuovo(1.0),
            re: Re::nuovo(sr, seme ^ 0x7E),
            re_pavimento: Biquad::passabasso(180.0, 0.7, sr),
            re_taglio: Scorrevole::nuovo(180.0),
            re_aria: Scorrevole::nuovo(0.0),
            re_ossa: Scorrevole::nuovo(0.0),
            re_tocco: Scorrevole::nuovo(1.0),
            re_rampa: Scorrevole::nuovo(1.0),
            ventilazione: Ventilazione::nuova(sr, seme ^ 0x7E47),
            pompe: Pompe::nuove(sr, seme ^ 0x90),
            pompe_pavimento: Biquad::passabasso(240.0, 0.7, sr),
            pompe_taglio: Scorrevole::nuovo(240.0),
            fondi_mul: Scorrevole::nuovo(1.0),
            ventola: Ventola::nuova(sr, seme ^ 0x7E0),
            fiato: Fiato::nuovo(sr, seme ^ 0xF1A7),
            fiato_g: Scorrevole::nuovo(1.0),
            brusio: Brusio::nuovo(sr, seme ^ 0xB2),
            brusio_base: 0.0,
            brusio_quanti: 0.0,
            brusio_via: Bus::Em,
            filo: Voce::nuova(sr, seme ^ 0xF110, 95.0, 0.84, 0.85, 0.06),
            filo_g: Scorrevole::nuovo(0.0),
            spostatore: Spostatore::nuovo(sr),
            filo_shift: Scorrevole::nuovo(0.0),
            anello: None,
            fondo: Fondo::nuovo(sr, seme ^ 0xF0),
            fondo_mul: Scorrevole::nuovo(1.0),
            ronzio: Ronzio::nuovo(sr, seme ^ 0x2A),
            ronzio_forma: None,
            groviglio: Groviglio::nuovo(sr, seme ^ 0x6206),
            vento: Soffio::nuovo(sr, seme ^ 0x7E7),
            vento_cfg: 0,
            crepitio: Crepitio::nuovo(sr, seme ^ 0xC2E),
            crepitio_cfg: 0,
            crepitio_casco: false,
            fuoco: Soffio::nuovo(sr, seme ^ 0xF0C),
            fuoco_crepitio: Crepitio::nuovo(sr, seme ^ 0xF0CC),
            tremito: Tremito::nuovo(sr, seme ^ 0x7E3),
            seme: Battito::nuovo(sr, seme ^ 0x5E, 1.15, 40.0, false, 0.45),
            cuore: Battito::nuovo(sr, seme ^ 0xC0, 0.95, 55.0, true, 0.12),
            acufene: Acufene::nuovo(sr),
            canale: CanaleRadio::nuovo(sr, seme ^ 0xCA),
            toppe: Toppe::nuove(sr, seme ^ 0x70),
            piogge: [Pioggia::SPENTA; PIOGGE],
            lastre,
            colpi: Vec::with_capacity(MAX_COLPI),
            automazioni: Vec::with_capacity(64),
            riverbero: Riverbero::nuovo(sr),
            w_aria: Scorrevole::nuovo(0.0),
            w_guscio: Scorrevole::nuovo(0.0),
            w_cuffia: Scorrevole::nuovo(0.0),
            w_em: Scorrevole::nuovo(0.0),
            w_casco: Scorrevole::nuovo(0.0),
            w_ossa: Scorrevole::nuovo(0.0),
            w_fruscio: Scorrevole::nuovo(0.0),
            asciutto: Scorrevole::nuovo(0.0),
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
            mix: Mix::default(),
            c_ambienti: Scorrevole::nuovo(1.0),
            c_effetti: Scorrevole::nuovo(1.0),
            c_voci: Scorrevole::nuovo(1.0),
            c_generale: Scorrevole::nuovo(1.0),
            c_ossa: Scorrevole::nuovo(1.0),
            pausa: Scorrevole::nuovo(1.0),
            ingresso: Scorrevole::nuovo(1.0),
            volume: Scorrevole::nuovo(1.0),
            dinamica: Inseguitore::nuovo(0.01, 0.25, sr),
            limitatore: Inseguitore::nuovo(0.0008, 0.12, sr),
            fermo: false,
            cammina: false,
            piede: false,
            t_stivali: 0.0,
            t_gemito: 30.0,
            t_radio: 1e9,
            radio_accesa: false,
            conto: 0,
            energia: 0.0,
            campioni_misurati: 0,
            caso,
        };
        // il fuoco del bengala: il soffio della fiamma e i suoi crepitii
        // la sala della musica: molto grande, con un’aria che si mangia gli acuti
        m.riverbero_musica.stanza(8.0, 3.5, 1.0, 2.2, 0.0);
        m.fuoco.imposta((2500.0, 5000.0), 0.8);
        m.fuoco_crepitio.imposta(14.0, 0.7, [1200.0, 2500.0, 4100.0], 0.01, 1500.0, sr);
        (m, tx, stato)
    }

    pub fn finito(&self) -> bool {
        self.fermo && self.volume.v < 1e-4
    }

    /// Un colpo nella sua strada, sul canale degli effetti.
    fn suona(&mut self, corpo: Corpo, bus: Bus, guadagno_db: f32, p: f32, ritardo: f32) {
        self.suona_in(Canale::Effetti, corpo, bus, guadagno_db, p, ritardo);
    }

    fn suona_in(&mut self, canale: Canale, corpo: Corpo, bus: Bus, guadagno_db: f32, p: f32, ritardo: f32) {
        if self.colpi.len() < MAX_COLPI {
            self.colpi.push(Colpo::nuovo(corpo, bus, guadagno_db, p, ritardo, self.sr).nel_canale(canale));
        }
    }

    fn dopo(&mut self, tra: f32, azione: Azione) {
        if self.automazioni.len() < 64 {
            self.automazioni.push(Automazione { tra, azione });
        }
    }

    fn mix(&mut self, m: Mix) {
        let sr = self.sr;
        let q = |v: f32| v.clamp(0.0, 1.0).powi(2);
        self.mix = m;
        self.c_generale.verso(q(m.generale), 0.15, sr);
        self.c_ambienti.verso(q(m.ambienti), 0.15, sr);
        self.c_effetti.verso(q(m.effetti), 0.15, sr);
        self.c_voci.verso(q(m.voci), 0.15, sr);
        self.c_musica.verso(q(m.musica), 0.15, sr);
        self.c_ossa.verso(if m.intensi_ridotti { db(-12.0) } else { 1.0 }, 0.3, sr);
        // il cuore e il fischio dell’anticamera si tolgono con i suoni intensi
        self.applica(0.3);
    }

    fn comando(&mut self, c: Comando) {
        let sr = self.sr;
        match c {
            Comando::Turno(t) => self.turno(t),
            Comando::Mix(m) => self.mix(m),
            Comando::Pausa(si) => self.pausa.verso(if si { db(-10.0) } else { 1.0 }, 0.4, sr),
            Comando::Tocco(g) => self.tocco(g),
            Comando::Menu(si) => {
                if si {
                    self.membrana = 1.0;
                    self.membrana_meta = 1.0;
                    self.musica.avvia(Brano::Menu);
                } else {
                    self.musica.avvia(Brano::Silenzio);
                }
            }
            Comando::Musica(b) => self.musica.avvia(b),
            Comando::Ambiente(a) => self.prototipo(a),
            Comando::Aria(v) => self.aria_prototipo(v),
            Comando::Nave(n) => {
                if n != self.nave {
                    self.nave = n;
                    self.gioco.aggancio = Some(
                        match n {
                            Nave::Libera => "lontano",
                            Nave::Accostata => "accostato",
                            Nave::Agganciata => "fatto",
                        }
                        .to_string(),
                    );
                    self.evento_nave(n);
                    self.applica(2.0);
                }
            }
            Comando::Rampa(r) => {
                self.rampa = r.clamp(0.0, 1.0);
                self.re_rampa.verso(self.rampa * self.rampa, 1.0, sr);
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

    fn esegui(&mut self, a: Azione) {
        let sr = self.sr;
        match a {
            Azione::Brusio(g, t) => self.brusio.guadagno.verso(g, t, sr),
            Azione::BrusioQuanti(n, t) => self.brusio.quanti.verso(n, t, sr),
            Azione::RadioFine => {
                self.radio_accesa = false;
                if self.brusio_base <= 0.0 {
                    self.brusio.guadagno.verso(0.0, 1.5, sr);
                    self.brusio.quanti.verso(0.0, 2.0, sr);
                }
            }
            Azione::Tuta => {
                self.tuta = self.gioco.tuta;
                self.applica(2.5);
            }
            Azione::Rampa(v, t) => self.re_rampa.verso(v, t, sr),
            Azione::Fondi(v, t) => self.fondi_mul.verso(v, t, sr),
            Azione::Fondo(v, t) => self.fondo_mul.verso(v, t, sr),
            Azione::Filo(v, t) => self.filo_g.verso(v, t, sr),
            Azione::Tocco(v, t) => self.re_tocco.verso(v, t, sr),
            Azione::Protezione(on) => {
                self.protezione_eff = on;
                self.applica(1.2);
            }
            Azione::Ascolto(si) => self.fiato.ascolto = si,
            Azione::Silenzio(t) => {
                self.spento = true;
                self.ingresso.verso(0.0, t, sr);
            }
            Azione::Risveglio => self.risveglio(),
            Azione::Musica(b) => self.musica.avvia(b),
            Azione::Voce(p) => self.voce_del_filo(&p),
        }
    }

    /// Una volta per blocco: le piogge, i tempi della stanza, i passi del prototipo, la
    /// radio, le automazioni.
    fn passo_blocco(&mut self, dt: f32) {
        let sr = self.sr;
        self.t_stanza += dt;
        self.t_aggancio += dt;
        self.passo_membrana(dt);
        self.musica.passo(dt);
        self.passo_anello(dt);
        for i in 0..PIOGGE {
            if self.piogge[i].passo(dt, &mut self.caso) {
                let p = self.piogge[i];
                let g = self.caso.tra(p.guadagno.0, p.guadagno.1);
                let pan = self.caso.tra(-0.85, 0.85);
                self.colpo_di_pioggia(p.specie, g, pan);
            }
        }
        // l’anticamera: dopo dieci secondi il cuore, dopo venti il fischio dell’orecchio
        if self.stanza.is_some_and(|s| s.id == "anticamera") && !self.spento && !self.mix.intensi_ridotti {
            if self.t_stanza > 10.0 && self.cuore.g.meta() == 0.0 {
                self.cuore.g.verso(db(LIV_CUORE), 4.0, sr);
            }
            if self.t_stanza > 20.0 && self.acufene.g.meta() == 0.0 {
                self.acufene.g.verso(db(LIV_ACUFENE), 8.0, sr);
            }
        }
        // il prototipo: i gemiti del vestibolo, i passi sullo scafo
        if !self.modo_gioco && self.stanza.is_some_and(|s| s.id == "vestibolo delle gole") {
            self.t_gemito -= dt;
            if self.t_gemito <= 0.0 {
                self.gemito();
                self.t_gemito = self.caso.tra(45.0, 110.0);
            }
        }
        if !self.modo_gioco && self.stanza.is_some_and(|s| s.id == "scafo") && self.cammina {
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
            if self.t_radio <= 0.0 && !self.radio_accesa && self.brusio_base <= 0.0 {
                self.radio_accesa = true;
                self.brusio_via = Bus::Altoparlante;
                self.brusio.quanti.verso(10.0, 0.5, sr);
                self.brusio.guadagno.verso(db(LIV_RADIO), 1.0, sr);
                let resta = self.caso.tra(4.0, 10.0);
                self.dopo(resta, Azione::RadioFine);
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
        let s_musica = on(S_MUSICA);
        let s_filo = on(S_FILO);
        let (s_re, s_vent, s_pompe, s_ventola, s_fiato, s_brusio, s_voci, s_segnali, s_fruscio, s_stanza) = (
            on(S_RE),
            on(S_VENTILAZIONE),
            on(S_POMPE),
            on(S_VENTOLA),
            on(S_FIATO),
            on(S_BRUSIO),
            on(S_VOCI),
            on(S_SEGNALI),
            on(S_FRUSCIO),
            on(S_STANZA),
        );
        let soglia = db(-30.0);
        let ricarica = db(4.0);
        let fruscio_g = db(-62.0);
        let guscio_g = db(-3.0);
        let soglia_dinamica = db(-30.0);
        let soglia_picchi = db(if self.mix.intensi_ridotti { -14.0 } else { -2.0 });
        let sr = self.sr;
        let musica_viva = self.musica.attiva();
        for frame in out.iter_mut() {
            let mut est = (0.0f32, 0.0f32);
            let mut em = (0.0f32, 0.0f32);
            let mut casco = (0.0f32, 0.0f32);
            let mut ossa = 0.0f32;
            let mut alt = 0.0f32;
            let mut ui = (0.0f32, 0.0f32);
            let gmus = self.c_musica.passo();
            let ga = self.c_ambienti.passo();
            let ge = self.c_effetti.passo();
            let gv = self.c_voci.passo();

            // ogni 64 campioni i filtri che seguono la stanza
            self.conto = self.conto.wrapping_add(1);
            let rt = self.re_taglio.passo();
            let pt = self.pompe_taglio.passo();
            if self.conto.is_multiple_of(64) {
                self.re_pavimento.aggiorna(Biquad::passabasso(rt, 0.7, sr));
                self.pompe_pavimento.aggiorna(Biquad::passabasso(pt, 0.7, sr));
            }

            // il re
            let (rl, rr) = self.re.campione(dt);
            let tocco = self.re_tocco.passo();
            let rampa = self.re_rampa.passo();
            let (wa, wo) = (self.re_aria.passo() * s_re * ga, self.re_ossa.passo() * s_re * ga * tocco * rampa);
            let (fl, fr) = (self.re_pavimento.elabora(rl, 0), self.re_pavimento.elabora(rr, 1));
            est.0 += fl * wa;
            est.1 += fr * wa;
            ossa += (rl + rr) * 0.5 * wo;

            // i fondi della Santa Maria
            let fm = self.fondi_mul.passo() * ga;
            let (vl, vr) = self.ventilazione.campione();
            est.0 += vl * s_vent * fm;
            est.1 += vr * s_vent * fm;
            let (pl, pr) = self.pompe.campione();
            est.0 += self.pompe_pavimento.elabora(pl, 0) * s_pompe * fm;
            est.1 += self.pompe_pavimento.elabora(pr, 1) * s_pompe * fm;

            // la stanza: il fondo del relitto, i ronzii, il groviglio, i soffi, i crepitii
            let gs = s_stanza * ga;
            let fmul = self.fondo_mul.passo();
            let (a, b) = self.fondo.campione();
            est.0 += a * gs * fmul;
            est.1 += b * gs * fmul;
            let (a, b) = self.ronzio.campione();
            est.0 += a * gs * fmul;
            est.1 += b * gs * fmul;
            let (a, b) = self.groviglio.campione();
            est.0 += a * gs;
            est.1 += b * gs;
            let (a, b) = self.vento.campione();
            est.0 += a * gs;
            est.1 += b * gs;
            let (a, b) = self.crepitio.campione();
            if self.crepitio_casco {
                casco.0 += a * gs;
                casco.1 += b * gs;
            } else {
                est.0 += a * gs;
                est.1 += b * gs;
            }
            let (a, b) = self.toppe.campione();
            est.0 += a * gs;
            est.1 += b * gs;
            ossa += self.tremito.campione() * gs;
            // il fuoco del bengala
            let (a, b) = self.fuoco.campione();
            let (c, d) = self.fuoco_crepitio.campione();
            est.0 += (a + c) * ge;
            est.1 += (b + d) * ge;
            // i battiti nelle ossa, il fischio dell’orecchio
            ossa += (self.seme.campione() + self.cuore.campione()) * ge;
            let k = self.acufene.campione() * ge;
            casco.0 += k;
            casco.1 += k;

            // la ventola e il fiato, al centro, dentro il casco
            let k = self.ventola.campione() * s_ventola * ge;
            let f = self.fiato.campione() * self.fiato_g.passo() * s_fiato * ge;
            casco.0 += k + f;
            casco.1 += k + f;

            // il brusio: dalla cuffia nel relitto, dalla radio nella plancia, per l’aria alla fine
            let (bl, br) = self.brusio.campione();
            let (bl, br) = (bl * s_brusio * gv, br * s_brusio * gv);
            match self.brusio_via {
                Bus::Altoparlante => alt += (bl + br) * 0.5,
                Bus::Esterno => {
                    est.0 += bl;
                    est.1 += br;
                }
                _ => {
                    em.0 += bl;
                    em.1 += br;
                }
            }
            // la voce in primo piano, e il canale della radio
            let fg = self.filo_g.passo();
            let shift = self.filo_shift.passo();
            if fg > 1e-5 {
                // il filo passa per lo spostamento di frequenza: il ritmo e l’intonazione restano,
                // le parole no (§5.3)
                let y = self.filo.campione();
                let v = self.spostatore.elabora(y, shift) * fg * gv * s_filo;
                em.0 += v * 0.9;
                em.1 += v;
            }
            alt += self.canale.campione() * gv;

            // i colpi
            let mut k = 0;
            while k < self.colpi.len() {
                let bus = self.colpi[k].bus;
                let canale = self.colpi[k].canale;
                match self.colpi[k].campione(&mut self.caso) {
                    Some((l, r)) => {
                        let s = if bus == Bus::Casco { s_segnali } else { s_voci };
                        let c = match canale {
                            Canale::Ambienti => ga,
                            Canale::Effetti => ge,
                            Canale::Voci => gv,
                        };
                        let (l, r) = (l * s * c, r * s * c);
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
                            Bus::Interfaccia => {
                                ui.0 += l;
                                ui.1 += r;
                            }
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
            // il casco: la bolla; nell’anticamera perde anche i suoi riflessi
            let wk = self.w_casco.passo();
            let k1 = self.casco_vicino.elabora(self.casco_eq2.elabora(self.casco_eq1.elabora(casco.0, 0), 0), 0);
            let k2 = self.casco_vicino.elabora(self.casco_eq2.elabora(self.casco_eq1.elabora(casco.1, 1), 1), 1);
            let (p1, p2) = self.casco_pettine.elabora(k1, k2);
            let asc = self.asciutto.passo();
            l += (p1 + (k1 - p1) * asc) * wk;
            r += (p2 + (k2 - p2) * asc) * wk;
            // le ossa: solo i bassi, al centro
            let o = self.ossa_lp2.elabora(self.ossa_lp1.elabora(ossa, 0), 0) * self.w_ossa.passo() * self.c_ossa.passo();
            l += o;
            r += o;

            // l’ipossia, e lo stereo che si stringe
            if self.ipossia_attiva {
                l = self.ipossia.elabora(l, 0);
                r = self.ipossia.elabora(r, 1);
            }
            let w = self.larghezza.passo();
            let (mid, side) = ((l + r) * 0.5, (l - r) * 0.5 * w);
            let vg = self.volume.passo() * self.c_generale.passo();
            let vp = vg * self.pausa.passo();
            let v = vp * self.ingresso.passo();
            let (mut l, mut r) = ((mid + side) * v, (mid - side) * v);
            // la musica: la sua sala, il suo cursore; si abbassa nella pausa, ma non è del mondo:
            // quando il mondo si spegne (un finale) o comincia, lei ha il suo tempo
            if musica_viva {
                let gm = self.musica.guadagno();
                let (dl, dr) = self.musica.campione();
                let (wl, wr) = self.riverbero_musica.elabora(dl, dr);
                let k = LIV_MUSICA * vp * gmus * s_musica * gm;
                l += (dl * MUSICA_ASCIUTTA + wl) * k;
                r += (dr * MUSICA_ASCIUTTA + wr) * k;
            }
            // l’interfaccia: asciutta, fuori dalla pausa e dall’ingresso (si tocca anche lì)
            l += ui.0 * vg;
            r += ui.1 * vg;
            // la dinamica ridotta: 3:1 sopra −30 dBFS, e i suoni piccoli più alti
            if self.mix.dinamica_ridotta {
                let e = self.dinamica.segui(l.abs().max(r.abs()));
                let g = if e > soglia_dinamica { (soglia_dinamica / e).powf(2.0 / 3.0) } else { 1.0 } * db(6.0);
                l *= g;
                r *= g;
            }
            // i picchi: un tetto vero a −2 dB (più basso con i suoni intensi ridotti); segue
            // anche il picco di adesso, così nessun transitorio passa prima dell’inviluppo
            let ora = l.abs().max(r.abs());
            let e = self.limitatore.segui(ora).max(ora);
            if e > soglia_picchi {
                let g = soglia_picchi / e;
                l *= g;
                r *= g;
            }
            if self.mix.mono {
                let m = (l + r) * 0.5;
                l = m;
                r = m;
            }
            let (l, r) = (morbido(l), morbido(r));
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
        s.protezione.store(self.protezione, Ordering::Relaxed);
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
// pavimento intorno a −30, il fiato calmo intorno a −26.
const LIV_VENTILAZIONE: f32 = -15.5;
const LIV_POMPE: f32 = -7.0;
const LIV_RE: f32 = -10.0;
const LIV_RE_OSSA: f32 = -14.0;
const LIV_RE_RAMPA: f32 = -10.0;
const LIV_VENTOLA: f32 = -17.0;
const LIV_BRUSIO: f32 = -10.0;
const LIV_RADIO: f32 = -9.0;
const LIV_GEMITO: f32 = -18.0;
const LIV_FILO: f32 = -12.0;
const LIV_CUORE: f32 = -10.0;
const LIV_ACUFENE: f32 = -42.0;
const LIV_PASSI: f32 = -24.0;
/// La musica: quanto va moltiplicata (lineare) perché gli strati scritti in dB sotto lo
/// zero di ogni strato stiano al livello giusto (le prove `calibra` e le misure di loudness),
/// e quanto del suo asciutto resta sopra il riverbero.
const LIV_MUSICA: f32 = 1.0;
const MUSICA_ASCIUTTA: f32 = 0.6;

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
