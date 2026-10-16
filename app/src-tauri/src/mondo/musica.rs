//! La musica (D14; 06, §18 punto 2; documento 21). È fatta con i materiali del gioco,
//! tutta sintetizzata: il re del reattore come radice, il campo del sol♯ a un tritono di
//! distanza (le macchine del relitto, bibbia sonora §1.3), le voci tenute del brusio che
//! cantano l’accordo del «clic armonioso», il sonaglio del Piccolo, il tam-tam strofinato,
//! il vetro del tema, il battito del seme. Non c’è una battuta né una melodia che torna in
//! tempo: ogni brano è una sequenza lenta di entrate e uscite degli strati, scritta in
//! secondi, e quella del menu si ricompone da sola, sempre un poco diversa.
//!
//! La musica ha la sua strada, il suo cursore e il suo riverbero (una sala molto grande):
//! non passa dal casco né dalle ossa, perché non sta nel mondo. Il motore la accende da
//! solo, dallo stato e dagli eventi del turno (regia.rs): la soglia di un atto, le parole
//! dell’Anziano, la chiusura di un finale; il menu principale la chiede la pagina.

use std::f64::consts::TAU;

use serde::{Deserialize, Serialize};

use super::ambienti::Battito;
use super::colpi::{self, Bus, Colpo, Corpo, Eccitatore, Modale, CLIC_ARMONIOSO};
use super::dsp::{campioni, db, pan, Caso, Lento, Scorrevole};
use super::musica_file::{Dopo, Lettore, Pezzo, Richiesta};
use super::re::{Re, RE};
use super::voce::Voce;

/// Il sol♯₃ del relitto, a un tritono dal re (§1.3).
pub const SOL_DIESIS: f32 = 207.652_35;

/// L’accordo del «clic armonioso», un’ottava sotto: la tonica, la terza minore settimale
/// (7/6), la quinta.
pub const CLIC: [f32; 3] = [CLIC_ARMONIOSO[0] / 2.0, CLIC_ARMONIOSO[1] / 2.0, CLIC_ARMONIOSO[2] / 2.0];

/// Il tema: l’arpeggio dell’accordo del clic e il sospiro sul re. Sol♯, la terza, la
/// quinta, e poi, un semitono sotto la quinta, il re: la nave risponde alla chiave.
/// (ritardo dall’inizio in secondi, altezza in Hz)
pub const TEMA: [(f32, f32); 4] = [(0.0, 830.609), (3.4, 969.044), (6.6, 1244.508), (10.4, 1174.659)];

/// Il re₆ del tema: dove atterra il sospiro.
const RE6: f32 = 1174.659;

/// Quanti secondi dura un ciclo del menu, e quanti ne mancano perché si ricomponga.
const CICLO_MENU: f32 = 190.0;
const ANTICIPO: f32 = 8.0;

/// Il livello a cui un «0 dB» di uno strato continuo vale −20 dBFS di valore efficace:
/// tarato con `calibra` (le prove). Gli strati continui sono scritti in dB sotto questo zero.
const NORM_RE: f32 = 1.58;
const NORM_CAMPO: f32 = 0.507;
const NORM_CORO: f32 = 0.451;
const NORM_BATTITO: f32 = 3.0;

/// L’Anziano parla sotto un testo da leggere: la sua musica sta poco sopra la scrittura.
const LIVELLO_ANZIANO: f32 = 3.0;

const MAX_PROGRAMMA: usize = 256;
const MAX_COLPI_MUSICA: usize = 32;

fn lin(x: f32) -> f32 {
    if x <= -100.0 {
        0.0
    } else {
        db(x)
    }
}

// -------------------------------------------------------------------------------------
//  I brani
// -------------------------------------------------------------------------------------

/// Che cosa suona: il menu principale (lo chiede la pagina), la soglia degli atti, i
/// finali, e l’Anziano (che la regia segue nodo per nodo).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Brano {
    Silenzio,
    Menu,
    Atto2,
    Atto3,
    Atto4,
    Atto5,
    Anziano,
    Vivi,
    PrimaNota,
    StivaPiena,
    DoppioFondo,
    DueLettere,
}

impl Brano {
    /// La soglia di un atto, se l’atto ne ha una (il primo comincia e basta).
    pub fn dell_atto(atto: u32) -> Option<Brano> {
        match atto {
            2 => Some(Brano::Atto2),
            3 => Some(Brano::Atto3),
            4 => Some(Brano::Atto4),
            5 => Some(Brano::Atto5),
            _ => None,
        }
    }

    /// Quanto suona il brano, in dB sopra la scrittura: il menu, le chiusure e le soglie stanno
    /// come sono scritti (la sala della musica, sopra una nota tenuta, ne raddoppia
    /// l’energia: una soglia si sente anche così); quella della fuga ha il mondo che crolla
    /// sotto e sale di tre decibel; l’Anziano parla sotto un testo da leggere.
    fn livello(self) -> f32 {
        match self {
            Brano::Atto5 => 3.0,
            Brano::Anziano => LIVELLO_ANZIANO,
            _ => 0.0,
        }
    }

    /// Il brano di un finale («mani-vuote» non ne ha: il reattore, e basta).
    pub fn del_finale(finale: &str) -> Option<Brano> {
        match finale {
            "vivi" => Some(Brano::Vivi),
            "prima-nota" => Some(Brano::PrimaNota),
            "stiva-piena" => Some(Brano::StivaPiena),
            "doppio-fondo" => Some(Brano::DoppioFondo),
            "due-lettere" => Some(Brano::DueLettere),
            _ => None,
        }
    }
}

/// Gli accordi del coro (altezze in Hz).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Accordo {
    Nessuno,
    /// il clic: sol♯, la terza minore settimale, la quinta, e la tonica sopra
    Clic,
    /// la quinta vuota del relitto: sol♯ e la sua quinta
    ClicVuoto,
    /// il re, dalla serie dei suoi armonici: re, la, re, fa♯
    Re,
    /// la quinta vuota di casa: re e la
    ReVuoto,
}

impl Accordo {
    fn note(self) -> &'static [f32] {
        match self {
            Accordo::Nessuno => &[],
            Accordo::Clic => &[CLIC[0], CLIC[1], CLIC[2], CLIC[0] * 2.0],
            Accordo::ClicVuoto => &[CLIC[0], CLIC[2], CLIC[0] * 2.0],
            Accordo::Re => &[146.832, 220.248, 293.665, 367.081, 440.496],
            Accordo::ReVuoto => &[146.832, 220.248, 293.665],
        }
    }
}

/// Una cosa che la musica fa, a un certo secondo. I livelli sono in dB (−120: spento).
#[derive(Clone, Copy, Debug)]
enum Az {
    /// il re della musica: (livello, armonici 0–1, battimenti in Hz, secondi)
    Re(f32, f32, f32, f32),
    /// il campo del sol♯: (livello, Hz, armonici 0–1, secondi)
    Campo(f32, f32, f32, f32),
    /// il secondo campo, per il re che si allinea con l’altro: (livello, Hz, armonici, secondi)
    Campo2(f32, f32, f32, f32),
    /// il coro: (accordo, livello, secondi)
    Coro(Accordo, f32, f32),
    /// il battito: (livello, periodo in secondi, secondi)
    Battito(f32, f32, f32),
    /// una nota di vetro: (Hz, livello, posto)
    Vetro(f32, f32, f32),
    /// il sonaglio del Piccolo, il suo re: (livello, posto)
    Sonaglio(f32, f32),
    /// il tam-tam strofinato: (durata dell’archetto, livello, posto)
    Strofinato(f32, f32, f32),
    /// tutti gli strati verso il silenzio, in secondi
    Tace(f32),
    /// il volume di tutta la musica: (livello, secondi)
    Master(f32, f32),
    /// la scena di un nodo dell’Anziano (l’indice nella tabella)
    Scena(usize),
    /// il letto dell’Anziano da file: il pezzo entra incrociandosi con quello che c’era
    Letto(Pezzo),
    /// il brano è finito: la musica si ferma
    Fine,
}

// -------------------------------------------------------------------------------------
//  Gli strati
// -------------------------------------------------------------------------------------

/// Una nota di vetro suonata con un martelletto di feltro: le risonanze del vetro del gioco
/// (`colpi::vetro`), ma l’attacco è una rampa di quattro millisecondi invece di un colpo,
/// e non fa «tic»: nella musica una nota entra, non scatta.
fn vetro_morbido(f: f32, sr: f32) -> Corpo {
    let modi = [(f, 1.4, 1.0), (f * 2.32, 0.6, 0.45), (f * 4.25, 0.25, 0.22), (f * 6.8, 0.1, 0.1)];
    let mut e = Eccitatore::default();
    for k in 0..9 {
        let x = (k as f32 - 4.0) / 2.0;
        e.aggiungi(campioni(0.0006 * k as f32, sr), (-x * x).exp());
    }
    Corpo::Modale(Modale::nuovo(&modi, e, 9000.0, sr)).per(VETRO_MORBIDO)
}

/// Il guadagno che porta il picco del vetro morbido intorno a 0 dB (le prove `calibra`).
const VETRO_MORBIDO: f32 = 0.79;

/// Un’altezza che scivola verso un’altra, in doppia precisione: un decimo di hertz su una
/// nota bassa, in virgola mobile a 32 bit, si perderebbe prima di arrivare.
pub struct Glissa {
    pub v: f64,
    meta: f64,
    k: f64,
}

impl Glissa {
    pub fn nuovo(v: f64) -> Self {
        Glissa { v, meta: v, k: 1.0 }
    }

    /// Fa il 98% del cammino in `secondi`.
    pub fn verso(&mut self, meta: f32, secondi: f32, sr: f32) {
        self.meta = meta as f64;
        self.k = if secondi <= 0.0 { 1.0 } else { 1.0 - (-4.0 / (secondi as f64 * sr as f64)).exp() };
    }

    #[inline]
    pub fn passo(&mut self) -> f64 {
        self.v += (self.meta - self.v) * self.k;
        self.v
    }
}

// (parziale, ampiezza): quasi armonici, un poco allargati, come un metallo che canta
const PARZIALI: [(f64, f32); 8] = [(1.0, 1.0), (2.0, 0.5), (3.004, 0.38), (4.011, 0.22), (5.02, 0.16), (6.035, 0.1), (7.05, 0.07), (8.07, 0.045)];

/// Il campo: una nota tenuta di otto parziali, un secondo banco appena scordato, e ogni
/// parziale che respira per conto suo. Il sol♯ delle macchine del relitto; con il suo
/// gemello, il secondo re che si allinea al primo.
pub struct Campo {
    fa: [f64; 8],
    fb: [f64; 8],
    deriva: [Lento; 8],
    caso: Caso,
    dt: f32,
    /// l’altezza, in Hz
    pub f: Glissa,
    /// il volume, lineare
    pub g: Scorrevole,
    /// quanto pesano i parziali sopra il secondo (0–1)
    pub ricco: Scorrevole,
    /// lo scarto del secondo banco, in Hz per parziale
    pub scarto: Scorrevole,
}

impl Campo {
    pub fn nuovo(sr: f32, seme: u64, hz: f32) -> Self {
        let mut caso = Caso::nuovo(seme);
        let deriva = std::array::from_fn(|_| Lento::nuovo((3.0, 9.0), &mut caso));
        Campo {
            fa: std::array::from_fn(|i| i as f64 * 0.9),
            fb: std::array::from_fn(|i| i as f64 * 1.7 + 0.4),
            deriva,
            caso,
            dt: 1.0 / sr,
            f: Glissa::nuovo(hz as f64),
            g: Scorrevole::nuovo(0.0),
            ricco: Scorrevole::nuovo(0.4),
            scarto: Scorrevole::nuovo(0.12),
        }
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let g = self.g.passo();
        let f = self.f.passo();
        let ricco = self.ricco.passo();
        let scarto = self.scarto.passo() as f64;
        if g < 1e-6 {
            return (0.0, 0.0);
        }
        let dt = self.dt as f64;
        let (mut sl, mut sr) = (0.0f64, 0.0f64);
        for (i, (n, a)) in PARZIALI.iter().enumerate() {
            let a = a * if i >= 2 { ricco } else { 1.0 };
            let vita = 1.0 + 0.3 * self.deriva[i].campione(self.dt, &mut self.caso);
            let fr = f * n;
            self.fa[i] = (self.fa[i] + TAU * fr * dt) % TAU;
            self.fb[i] = (self.fb[i] + TAU * (fr + scarto * n) * dt) % TAU;
            let base = self.fa[i].sin();
            sl += (a * vita) as f64 * (0.6 * base + 0.4 * self.fb[i].sin());
            sr += (a * vita) as f64 * (0.6 * base + 0.4 * (self.fb[i] + 0.5).sin());
        }
        let k = 0.4;
        ((((sl * k).tanh()) as f32) * g * NORM_CAMPO, (((sr * k).tanh()) as f32) * g * NORM_CAMPO)
    }
}

const CANTORI: usize = 5;

/// Un cantore: una voce del brusio che tiene una nota su una vocale.
struct Cantore {
    voce: Voce,
    g: Scorrevole,
    gl: f32,
    gr: f32,
    nota: f32,
    vocale: usize,
    /// la nota nuova, che parte quando la voce è sfumata: (Hz, livello, secondi d’attacco)
    attesa: Option<(f32, f32, f32)>,
}

/// Il coro: cinque voci che cantano un accordo, ognuna sulla sua vocale. Cambiare accordo
/// è una dissolvenza: la voce sfuma, cambia nota, torna.
pub struct Coro {
    cantori: Vec<Cantore>,
    sr: f32,
}

impl Coro {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let vocali = [3usize, 4, 5, 3, 6];
        let posti = [-0.55f32, 0.5, -0.15, 0.2, 0.0];
        let cantori = (0..CANTORI)
            .map(|k| {
                let (gl, gr) = pan(posti[k]);
                Cantore {
                    voce: Voce::nuova(sr, seme ^ (0xC0 + k as u64 * 0x9E37), 140.0, 0.8 + 0.025 * k as f32, 0.9, 0.05 + 0.01 * k as f32),
                    g: Scorrevole::nuovo(0.0),
                    gl,
                    gr,
                    nota: 0.0,
                    vocale: vocali[k],
                    attesa: None,
                }
            })
            .collect();
        Coro { cantori, sr }
    }

    /// Un accordo, a un livello (lineare, di tutto il coro) e con un attacco in secondi.
    /// Una voce che ha già la sua nota resta dov’è; le altre sfumano e tornano sulla nuova.
    pub fn accordo(&mut self, note: &[f32], g: f32, attacco: f32) {
        let sr = self.sr;
        let per_voce = g / (note.len().max(1) as f32).sqrt();
        for (i, c) in self.cantori.iter_mut().enumerate() {
            match note.get(i) {
                Some(&hz) if g > 0.0 => {
                    if (c.nota - hz).abs() < 0.5 {
                        c.g.verso(per_voce, attacco, sr);
                        c.attesa = None;
                    } else {
                        c.g.verso(0.0, attacco.min(1.5), sr);
                        c.attesa = Some((hz, per_voce, attacco));
                    }
                }
                _ => {
                    c.g.verso(0.0, attacco.max(1.0), sr);
                    c.attesa = None;
                }
            }
        }
    }

    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let sr = self.sr;
        let (mut l, mut r) = (0.0, 0.0);
        for c in self.cantori.iter_mut() {
            let g = c.g.passo();
            if let Some((hz, meta, attacco)) = c.attesa
                && g < 0.002
            {
                c.voce.tieni_vocale(hz, 3600.0, c.vocale);
                c.nota = hz;
                c.g.verso(meta, attacco, sr);
                c.attesa = None;
            }
            if g < 1e-5 {
                continue;
            }
            let y = c.voce.campione() * g * NORM_CORO;
            l += y * c.gl;
            r += y * c.gr;
        }
        (l, r)
    }
}

// -------------------------------------------------------------------------------------
//  Le scene dell’Anziano
// -------------------------------------------------------------------------------------

/// Che cosa suona mentre l’Anziano parla di un nodo.
struct Scena {
    nodo: &'static str,
    /// il re: (livello, armonici)
    re: (f32, f32),
    /// il campo del sol♯: il livello
    sol: f32,
    coro: (Accordo, f32),
    /// il battito, se c’è: (livello, periodo)
    battito: Option<(f32, f32)>,
    /// le cose che accadono all’entrata: (dopo quanti secondi, che cosa)
    eventi: &'static [(f32, Az)],
}

const SPENTO: f32 = -120.0;

// «Dal sol♯ al re» (06, §18): le prime scene sono del sol♯, le ultime del re; e più la
// conversazione va avanti, più il re sale e il sol♯ scende (`progresso`).
const SCENE: [Scena; 14] = [
    Scena { nodo: "benvenuto", re: (-22.0, 0.2), sol: -14.0, coro: (Accordo::Nessuno, SPENTO), battito: None, eventi: &[] },
    // «silenzio» ha il suo trattamento: otto secondi senza niente, poi tornano le note di prima
    Scena { nodo: "silenzio", re: (SPENTO, 0.0), sol: SPENTO, coro: (Accordo::Nessuno, SPENTO), battito: None, eventi: &[] },
    Scena { nodo: "salto", re: (-22.0, 0.25), sol: -16.0, coro: (Accordo::Clic, -22.0), battito: None, eventi: &[(2.0, Az::Vetro(830.609, -22.0, -0.2))] },
    Scena { nodo: "memoria", re: (-20.0, 0.3), sol: -20.0, coro: (Accordo::ClicVuoto, -22.0), battito: None, eventi: &[] },
    Scena { nodo: "altro", re: (-28.0, 0.15), sol: -28.0, coro: (Accordo::Nessuno, SPENTO), battito: Some((-30.0, 1.5)), eventi: &[(3.0, Az::Vetro(830.609, -28.0, 0.3))] },
    Scena { nodo: "aiuto", re: (-28.0, 0.15), sol: -30.0, coro: (Accordo::ClicVuoto, -30.0), battito: None, eventi: &[] },
    Scena { nodo: "prezzo", re: (-18.0, 0.35), sol: -14.0, coro: (Accordo::Nessuno, SPENTO), battito: None, eventi: &[] },
    Scena { nodo: "piccolo", re: (-18.0, 0.3), sol: -24.0, coro: (Accordo::ReVuoto, -26.0), battito: None, eventi: &[(1.0, Az::Sonaglio(-22.0, 0.2))] },
    Scena { nodo: "sangue", re: (-16.0, 0.45), sol: -22.0, coro: (Accordo::Re, -22.0), battito: None, eventi: &[] },
    Scena { nodo: "tracce", re: (-22.0, 0.3), sol: -24.0, coro: (Accordo::ClicVuoto, -26.0), battito: None, eventi: &[(2.0, Az::Vetro(1244.508, -26.0, 0.25))] },
    Scena {
        nodo: "musica",
        re: (-18.0, 0.5),
        sol: -24.0,
        coro: (Accordo::Re, -20.0),
        battito: None,
        eventi: &[(2.0, Az::Vetro(830.609, -22.0, -0.3)), (5.4, Az::Vetro(969.044, -22.0, 0.0)), (8.6, Az::Vetro(1244.508, -22.0, 0.3)), (12.4, Az::Vetro(RE6, -20.0, 0.0))],
    },
    Scena { nodo: "congedo", re: (-14.0, 0.7), sol: -22.0, coro: (Accordo::Re, -18.0), battito: None, eventi: &[(0.0, Az::Strofinato(14.0, -26.0, -0.2)), (0.5, Az::Campo(-22.0, 146.832, 0.4, 12.0))] },
    Scena { nodo: "dissolvenza", re: (-18.0, 0.5), sol: SPENTO, coro: (Accordo::ReVuoto, -26.0), battito: Some((-26.0, 1.1)), eventi: &[(3.0, Az::Vetro(RE6, -20.0, 0.0))] },
    Scena { nodo: "ultima voce", re: (-28.0, 0.1), sol: SPENTO, coro: (Accordo::Nessuno, SPENTO), battito: None, eventi: &[(10.0, Az::Master(SPENTO, 10.0))] },
];

// -------------------------------------------------------------------------------------
//  La musica
// -------------------------------------------------------------------------------------

/// I quattro letti dell’Anziano (22, §5.3).
const LETTI: [Pezzo; 4] = [Pezzo::A1, Pezzo::A2, Pezzo::A3, Pezzo::A4];

/// Il letto di un nodo del colloquio (22, §5.3): la presenza, la tensione, il calore, lo scioglimento.
fn letto_del_nodo(nodo: &str) -> Option<Pezzo> {
    match nodo {
        "benvenuto" | "memoria" | "tracce" => Some(Pezzo::A1),
        "prezzo" | "altro" | "aiuto" => Some(Pezzo::A2),
        "salto" | "piccolo" | "sangue" | "musica" => Some(Pezzo::A3),
        "congedo" | "dissolvenza" | "ultima voce" => Some(Pezzo::A4),
        _ => None,
    }
}

/// Quali file suonano un brano (compresi quelli che si alternano).
fn pezzi_del_brano(brano: Brano) -> Vec<Pezzo> {
    match brano {
        Brano::Menu => vec![Pezzo::M1a, Pezzo::M1b],
        Brano::Atto2 => vec![Pezzo::S2],
        Brano::Atto3 => vec![Pezzo::S3],
        Brano::Atto4 => vec![Pezzo::S4],
        Brano::Atto5 => vec![Pezzo::S5],
        Brano::Anziano => LETTI.to_vec(),
        Brano::Vivi => vec![Pezzo::C1],
        Brano::PrimaNota => vec![Pezzo::C2],
        Brano::StivaPiena => vec![Pezzo::C3],
        Brano::DoppioFondo => vec![Pezzo::C4],
        Brano::DueLettere => vec![Pezzo::C5],
        Brano::Silenzio => vec![],
    }
}

/// Che cosa suona un brano da file, e come (22, §5 e §7). `primo` sceglie quale dei due pezzi
/// del menu comincia: il menu alterna i suoi due, sempre in un ordine che cambia.
fn piano_file(brano: Brano, primo: bool) -> Option<Vec<Richiesta>> {
    let livello = brano.livello();
    let r = |p: Pezzo| Richiesta { livello, ..Richiesta::intero(p) };
    Some(vec![match brano {
        Brano::Menu => {
            let (a, b) = if primo { (Pezzo::M1a, Pezzo::M1b) } else { (Pezzo::M1b, Pezzo::M1a) };
            Richiesta { entra: 4.0, dopo: Dopo::Alterna(b), incrocio: 8.0, esce: 0.0, ..r(a) }
        }
        // le soglie sono brevi: si tengono i primi secondi, con la dissolvenza in uscita
        Brano::Atto2 => Richiesta { a: Some(18.0), entra: 0.3, esce: 4.0, ..r(Pezzo::S2) },
        Brano::Atto3 => Richiesta { a: Some(20.0), entra: 0.3, esce: 4.0, ..r(Pezzo::S3) },
        Brano::Atto4 => Richiesta { entra: 0.3, esce: 5.0, ..r(Pezzo::S4) },
        // la fuga finisce di colpo: il suono del file cade a 65,06 s, il lettore si ferma a 65,1
        Brano::Atto5 => Richiesta { a: Some(65.1), entra: 0.3, esce: 0.0, ..r(Pezzo::S5) },
        Brano::Vivi => r(Pezzo::C1),
        Brano::PrimaNota => r(Pezzo::C2),
        Brano::StivaPiena => r(Pezzo::C3),
        Brano::DoppioFondo => r(Pezzo::C4),
        // la parte che somiglia alla scheda è l’ultima metà: da 31 s (22, §5.7)
        Brano::DueLettere => Richiesta { da: 31.0, entra: 1.5, ..r(Pezzo::C5) },
        Brano::Anziano | Brano::Silenzio => return None,
    }])
}

pub struct Musica {
    sr: f32,
    dt: f32,
    caso: Caso,
    pub re: Re,
    campo: Campo,
    campo2: Campo,
    coro: Coro,
    battito: Battito,
    colpi: Vec<Colpo>,
    /// il volume di tutta la musica, lineare
    master: Scorrevole,
    /// il programma: (secondo, che cosa), in ordine di secondo
    programma: Vec<(f64, Az)>,
    prossimo: usize,
    /// i secondi dall’inizio dei tempi della musica
    t: f64,
    brano: Brano,
    ciclo_fine: f64,
    /// i nodi dell’Anziano già sentiti (un bit per scena)
    visitati: u32,
    energia: f32,
    muta_da: f32,
    /// i file di Lyria e di Suno (documento 22): se ci sono, sono la musica; il resto è il ripiego
    file: Lettore,
    /// il brano in corso suona dai file
    in_file: bool,
}

impl Musica {
    pub fn nuova(sr: f32, seme: u64) -> Self {
        Musica {
            sr,
            dt: 1.0 / sr,
            caso: Caso::nuovo(seme ^ 0x3A51),
            re: Re::nuovo(sr, seme ^ 0x6E1),
            campo: Campo::nuovo(sr, seme ^ 0xC4B0, SOL_DIESIS),
            campo2: Campo::nuovo(sr, seme ^ 0xC4B1, RE as f32),
            coro: Coro::nuovo(sr, seme ^ 0xC020),
            battito: Battito::nuovo(sr, seme ^ 0xBA77, 1.1, 44.0, false, 0.35),
            colpi: Vec::with_capacity(MAX_COLPI_MUSICA),
            master: Scorrevole::nuovo(0.0),
            programma: Vec::with_capacity(MAX_PROGRAMMA),
            prossimo: 0,
            t: 0.0,
            brano: Brano::Silenzio,
            ciclo_fine: 0.0,
            visitati: 0,
            energia: 0.0,
            muta_da: 1e9,
            file: Lettore::nuovo(sr),
            in_file: false,
        }
    }

    /// Dove stanno i file della musica. Senza, suona soltanto la musica sintetizzata.
    pub fn con_cartella(&mut self, cartella: std::path::PathBuf) {
        self.file.biblioteca = Some(super::musica_file::Biblioteca::nuova(cartella));
    }

    /// Per le prove: la biblioteca con pezzi già in memoria.
    #[cfg(test)]
    pub fn lettore(&mut self) -> &mut Lettore {
        &mut self.file
    }

    pub fn brano(&self) -> Brano {
        self.brano
    }

    /// Serve ancora il suo calcolo? Finché un brano suona sì, e dopo che è finito finché
    /// ne resta la coda del riverbero.
    pub fn attiva(&self) -> bool {
        self.brano != Brano::Silenzio || self.muta_da < 16.0 || self.file.attivo()
    }

    // ---- il programma

    /// Mette una cosa nel programma, `tra` secondi da adesso.
    fn p(&mut self, tra: f32, a: Az) {
        self.p_a(self.t + tra as f64, a);
    }

    /// Mette una cosa nel programma a un secondo preciso.
    fn p_a(&mut self, t: f64, a: Az) {
        if self.programma.len() < MAX_PROGRAMMA {
            self.programma.push((t, a));
            // un inserimento in coda, quasi sempre; altrimenti si rimette in ordine
            let n = self.programma.len();
            if n >= 2 && self.programma[n - 2].0 > t {
                self.programma[self.prossimo..].sort_by(|a, b| a.0.total_cmp(&b.0));
            }
        }
    }

    fn azzera_programma(&mut self) {
        self.programma.clear();
        self.prossimo = 0;
    }

    // ---- i brani

    /// Un brano nuovo: il vecchio sfuma sotto di lui. Se ci sono i file del brano suonano quelli;
    /// se no (o se uno non si decodifica) suona il brano sintetizzato.
    pub fn avvia(&mut self, brano: Brano) {
        self.azzera_programma();
        self.brano = brano;
        self.visitati = 0;
        if !matches!(brano, Brano::Silenzio | Brano::Anziano) && self.avvia_da_file(brano) {
            return;
        }
        self.avvia_sintetico(brano);
    }

    fn avvia_da_file(&mut self, brano: Brano) -> bool {
        let quale = self.caso.f() < 0.5;
        let Some(piano) = piano_file(brano, quale) else { return false };
        let pezzi = pezzi_del_brano(brano);
        if !self.file.disponibile(&pezzi) {
            return false;
        }
        // il brano vecchio, sintetizzato o da file, sfuma sotto il nuovo
        self.esegui(Az::Tace(2.0));
        self.file.tieni(&pezzi);
        for r in piano {
            self.file.avvia(r);
        }
        self.in_file = true;
        self.t = 0.0;
        true
    }

    fn avvia_sintetico(&mut self, brano: Brano) {
        self.azzera_programma();
        self.brano = brano;
        self.visitati = 0;
        self.in_file = false;
        self.file.tace(1.5);
        match brano {
            Brano::Silenzio => {
                self.esegui(Az::Tace(3.0));
                self.esegui(Az::Master(SPENTO, 4.0));
                return;
            }
            Brano::Anziano => {}
            _ => {
                self.esegui(Az::Master(brano.livello(), 0.5));
            }
        }
        self.t = 0.0;
        match brano {
            Brano::Menu => {
                self.ciclo_fine = 0.0;
                self.ciclo_menu(0.0);
            }
            Brano::Atto2 => self.atto2(),
            Brano::Atto3 => self.atto3(),
            Brano::Atto4 => self.atto4(),
            Brano::Atto5 => self.atto5(),
            Brano::Vivi => self.vivi(),
            Brano::PrimaNota => self.prima_nota(),
            Brano::StivaPiena => self.stiva_piena(),
            Brano::DoppioFondo => self.doppio_fondo(),
            Brano::DueLettere => self.due_lettere(),
            Brano::Anziano | Brano::Silenzio => {}
        }
    }

    // -- il menu: un ciclo di centocinquanta secondi, sempre ricomposto

    fn ciclo_menu(&mut self, inizio: f64) {
        // i passi già fatti non servono più
        self.programma.drain(..self.prossimo);
        self.prossimo = 0;
        // il re respira: ogni otto secondi i suoi armonici salgono e scendono
        let mut k = 0;
        while (k as f32) * 8.0 < CICLO_MENU {
            let alti = if k % 2 == 0 { 0.22 } else { 0.6 };
            let scarto = 0.08 + 0.05 * (k % 3) as f32;
            self.p_a(inizio + k as f64 * 8.0, Az::Re(-8.0, alti, scarto, 8.0));
            k += 1;
        }
        // tre episodi, in un ordine che cambia a ogni ciclo
        let mut ordine = [0usize, 1, 2, 3];
        for i in (1..4).rev() {
            let j = self.caso.indice(i + 1);
            ordine.swap(i, j);
        }
        for (n, e) in ordine.iter().enumerate() {
            let s = inizio + 14.0 + n as f64 * 44.0 + self.caso.tra(-4.0, 4.0) as f64;
            match e {
                0 => self.ombra(s),
                1 => self.accordo_menu(s),
                2 => self.il_piccolo(s),
                _ => self.casa_menu(s),
            }
        }
        // il tema, una volta per ciclo, lontano
        self.tema(inizio + CICLO_MENU as f64 - 12.0, -20.0);
        self.ciclo_fine = inizio + CICLO_MENU as f64;
    }

    /// Il campo del sol♯ sale dal fondo, a un tritono dal re, e se ne va.
    fn ombra(&mut self, s: f64) {
        self.p_a(s, Az::Campo(-16.0, SOL_DIESIS, 0.3, 10.0));
        self.p_a(s + 12.0, Az::Campo(-13.0, SOL_DIESIS * 1.0145, 0.4, 12.0));
        self.p_a(s + 28.0, Az::Campo(SPENTO, SOL_DIESIS, 0.3, 12.0));
    }

    /// Il coro canta l’accordo del clic, e una nota di vetro lo tocca.
    fn accordo_menu(&mut self, s: f64) {
        self.p_a(s, Az::Coro(Accordo::Clic, -9.0, 8.0));
        self.p_a(s + 9.0, Az::Vetro(CLIC_ARMONIOSO[0] * 2.0, -16.0, -0.3));
        self.p_a(s + 18.0, Az::Coro(Accordo::Nessuno, SPENTO, 10.0));
    }

    /// La quinta vuota di casa: il coro canta il re e la sua quinta, pochi secondi, come
    /// un ricordo che si fa vicino e se ne va.
    fn casa_menu(&mut self, s: f64) {
        self.p_a(s, Az::Coro(Accordo::ReVuoto, -12.0, 9.0));
        self.p_a(s + 17.0, Az::Coro(Accordo::Re, -14.0, 8.0));
        self.p_a(s + 30.0, Az::Coro(Accordo::Nessuno, SPENTO, 12.0));
    }

    /// Il sonaglio del Piccolo, il suo re, e un tam-tam che si sveglia sotto.
    fn il_piccolo(&mut self, s: f64) {
        self.p_a(s, Az::Sonaglio(-15.0, 0.25));
        self.p_a(s + 9.0, Az::Strofinato(14.0, -15.0, -0.2));
    }

    fn tema(&mut self, s: f64, livello: f32) {
        for (i, (dt, hz)) in TEMA.iter().enumerate() {
            let posto = [-0.3, 0.1, 0.3, 0.0][i];
            self.p_a(s + *dt as f64, Az::Vetro(*hz, livello + if i == 3 { 3.0 } else { 0.0 }, posto));
        }
    }

    // -- le soglie degli atti: pochi secondi, dentro il cartello

    /// Atto II: il campo del sol♯ sale sotto la Santa Maria e il re si stringe.
    fn atto2(&mut self) {
        self.p(0.0, Az::Re(-26.0, 0.1, 0.1, 3.0));
        self.p(0.0, Az::Campo(-3.0, SOL_DIESIS, 0.3, 4.5));
        self.p(3.0, Az::Vetro(830.609, -14.0, -0.2));
        self.p(5.0, Az::Campo(SPENTO, SOL_DIESIS, 0.3, 4.0));
        self.p(5.0, Az::Re(SPENTO, 0.1, 0.1, 5.0));
        self.p(11.0, Az::Fine);
    }

    /// Atto III: le voci tenute del brusio cantano il clic, e il tema comincia.
    fn atto3(&mut self) {
        self.p(0.0, Az::Coro(Accordo::Clic, -5.0, 4.0));
        self.p(1.0, Az::Vetro(830.609, -16.0, -0.3));
        self.p(4.4, Az::Vetro(969.044, -16.0, 0.2));
        self.p(6.0, Az::Coro(Accordo::Nessuno, SPENTO, 4.0));
        self.p(12.0, Az::Fine);
    }

    /// Atto IV: il tam-tam strofinato, il sonaglio del Piccolo, il tema quasi intero.
    fn atto4(&mut self) {
        self.p(0.0, Az::Strofinato(9.0, -21.0, -0.2));
        self.p(2.0, Az::Vetro(830.609, -18.0, -0.3));
        self.p(3.0, Az::Coro(Accordo::ClicVuoto, -10.0, 6.0));
        self.p(5.4, Az::Vetro(969.044, -18.0, 0.0));
        self.p(5.5, Az::Sonaglio(-17.0, 0.3));
        self.p(8.6, Az::Vetro(1244.508, -18.0, 0.3));
        self.p(9.0, Az::Coro(Accordo::Nessuno, SPENTO, 5.0));
        self.p(15.0, Az::Fine);
    }

    /// Atto V: la fuga. Il re e il sol♯ si scontrano, il battito accelera, e tutto si
    /// spezza: il mondo prende il suo posto.
    fn atto5(&mut self) {
        self.p(0.0, Az::Re(-12.0, 0.9, 3.5, 1.5));
        self.p(0.0, Az::Campo(-8.0, SOL_DIESIS, 0.8, 2.0));
        self.p(0.0, Az::Battito(-16.0, 0.75, 0.5));
        self.p(0.3, Az::Strofinato(6.0, -20.0, 0.0));
        self.p(6.5, Az::Tace(1.6));
        self.p(9.0, Az::Fine);
    }

    // -- le chiusure dei finali (06, §11)

    /// Vivi: il re di casa, il battito del seme a tempo con lui, e le due cose che non si
    /// sono mai conosciute tengono la stessa nota: il coro canta il re e il tema ci arriva.
    fn vivi(&mut self) {
        self.p(0.0, Az::Re(-10.0, 0.3, 0.12, 6.0));
        self.p(6.0, Az::Battito(-22.0, 1.1, 3.0));
        self.p(12.0, Az::Coro(Accordo::Re, -14.0, 9.0));
        self.tema_dopo(26.0, -22.0);
        self.p(46.0, Az::Battito(SPENTO, 1.1, 8.0));
        self.p(48.0, Az::Coro(Accordo::Nessuno, SPENTO, 10.0));
        self.p(52.0, Az::Master(SPENTO, 12.0));
        self.p(66.0, Az::Fine);
    }

    fn tema_dopo(&mut self, tra: f32, livello: f32) {
        let s = self.t + tra as f64;
        self.tema(s, livello);
    }

    /// La prima nota: il re suonato in due, a tempo. Due onde, quella del reattore e quella
    /// del seme, battono piano e si allineano fino a diventare una.
    fn prima_nota(&mut self) {
        self.p(0.0, Az::Re(-10.0, 0.4, 0.0, 4.0));
        self.p(1.0, Az::Campo2(-16.0, RE as f32 + 3.6, 0.5, 4.0));
        self.p(7.0, Az::Campo2(-16.0, RE as f32, 0.5, 26.0));
        self.p(36.0, Az::Vetro(RE6, -20.0, 0.0));
        self.p(36.5, Az::Coro(Accordo::ReVuoto, -16.0, 8.0));
        self.p(37.0, Az::Re(-8.0, 0.7, 0.0, 6.0));
        self.p(52.0, Az::Master(SPENTO, 12.0));
        self.p(66.0, Az::Fine);
    }

    /// La stiva piena: cento onde sovrapposte, il brusio che sale e il quadrante che
    /// passa al verde. Il coro canta il clic in crescendo, e poi tutto si assesta.
    fn stiva_piena(&mut self) {
        self.p(0.0, Az::Re(-20.0, 0.3, 0.1, 4.0));
        self.p(2.0, Az::Coro(Accordo::Clic, -22.0, 20.0));
        self.p(4.0, Az::Campo(-26.0, SOL_DIESIS, 0.5, 20.0));
        self.p(24.0, Az::Coro(Accordo::Clic, -10.0, 8.0));
        self.p(24.0, Az::Campo(-14.0, SOL_DIESIS, 0.9, 8.0));
        self.p(28.0, Az::Strofinato(14.0, -16.0, 0.0));
        self.p(40.0, Az::Coro(Accordo::Nessuno, SPENTO, 8.0));
        self.p(40.0, Az::Campo(SPENTO, SOL_DIESIS, 0.3, 9.0));
        self.p(44.0, Az::Vetro(RE6, -22.0, 0.0));
        self.p(46.0, Az::Re(-12.0, 0.4, 0.1, 6.0));
        self.p(58.0, Az::Master(SPENTO, 10.0));
        self.p(70.0, Az::Fine);
    }

    /// Doppio fondo: il brusio dalla stiva, un battito sotto, e una nota che non si
    /// risolve: finisce sul sol♯.
    fn doppio_fondo(&mut self) {
        self.p(0.0, Az::Battito(-22.0, 1.15, 4.0));
        self.p(2.0, Az::Campo(-26.0, SOL_DIESIS, 0.3, 8.0));
        self.p(8.0, Az::Vetro(830.609, -26.0, -0.2));
        self.p(14.0, Az::Coro(Accordo::ClicVuoto, -26.0, 10.0));
        self.p(19.0, Az::Vetro(830.609, -28.0, 0.3));
        self.p(30.0, Az::Coro(Accordo::Nessuno, SPENTO, 8.0));
        self.p(33.0, Az::Vetro(830.609, -30.0, 0.0));
        self.p(40.0, Az::Master(SPENTO, 12.0));
        self.p(54.0, Az::Fine);
    }

    /// Due lettere: il re, da solo. I suoi armonici se ne vanno uno dopo l’altro, finché
    /// non resta una nota bassa e nuda, e poi nemmeno quella.
    fn due_lettere(&mut self) {
        self.p(0.0, Az::Re(-10.0, 0.6, 0.1, 3.0));
        self.p(6.0, Az::Re(-10.0, 0.0, 0.0, 30.0));
        self.p(40.0, Az::Master(SPENTO, 14.0));
        self.p(56.0, Az::Fine);
    }

    // ---- l’Anziano

    /// L’Anziano comincia a parlare: la musica entra piano, sulla scena del nodo.
    pub fn anziano_entra(&mut self, nodo: &str) {
        self.azzera_programma();
        self.brano = Brano::Anziano;
        self.visitati = 0;
        self.t = 0.0;
        if self.file.disponibile(&LETTI) {
            self.esegui(Az::Tace(2.0));
            self.file.tieni(&LETTI);
            for l in LETTI {
                self.file.precarica(l);
            }
            self.in_file = true;
            self.esegui(Az::Letto(letto_del_nodo(nodo).unwrap_or(Pezzo::A1)));
            return;
        }
        self.in_file = false;
        self.esegui(Az::Master(LIVELLO_ANZIANO, 3.0));
        self.anziano_nodo(nodo);
    }

    /// Un altro nodo: le note passano alla scena nuova.
    pub fn anziano_nodo(&mut self, nodo: &str) {
        if self.brano != Brano::Anziano {
            return;
        }
        if self.in_file {
            self.letto_del_nodo(nodo);
            return;
        }
        let Some(i) = SCENE.iter().position(|s| s.nodo == nodo) else { return };
        // la scena di un nodo che torna non ricomincia gli eventi dall’inizio
        self.azzera_programma();
        if SCENE[i].nodo == "silenzio" {
            // «Per otto secondi la musica tace» (bibbia, §4.5)
            self.esegui(Az::Tace(1.2));
            self.esegui(Az::Master(SPENTO, 1.2));
            let benvenuto = SCENE.iter().position(|s| s.nodo == "benvenuto").unwrap_or(0);
            self.p(7.5, Az::Master(LIVELLO_ANZIANO, 1.0));
            self.p(8.0, Az::Scena(benvenuto));
        } else {
            self.esegui(Az::Master(LIVELLO_ANZIANO, 1.0));
            self.esegui(Az::Scena(i));
        }
    }

    /// L’Anziano da file: il nodo sceglie il letto (22, §5.3), e il letto entra incrociandosi con
    /// quello di prima. «Silenzio» è silenzio vero per otto secondi, poi torna il primo letto.
    fn letto_del_nodo(&mut self, nodo: &str) {
        self.azzera_programma();
        if nodo == "silenzio" {
            self.esegui(Az::Tace(1.2));
            self.p(8.0, Az::Letto(Pezzo::A1));
        } else if let Some(p) = letto_del_nodo(nodo) {
            self.esegui(Az::Letto(p));
        }
    }

    /// Quanti nodi diversi si sono sentiti, da 0 a 1: la conversazione va dal sol♯ al re.
    fn progresso(&self) -> f32 {
        (self.visitati.count_ones() as f32 / 9.0).min(1.0)
    }

    fn scena(&mut self, i: usize) {
        let s = &SCENE[i];
        self.visitati |= 1 << i;
        let p = self.progresso();
        let (re, alti) = s.re;
        let sol = s.sol;
        let secondi = 5.0;
        // più la conversazione va avanti, più il re sale e il sol♯ scende
        let re = if re > -100.0 { re + 6.0 * p } else { re };
        let sol = if sol > -100.0 && s.nodo != "congedo" { sol - 8.0 * p } else { sol };
        self.esegui(Az::Re(re, alti, 0.1, secondi));
        self.esegui(Az::Campo(sol, SOL_DIESIS, 0.3, secondi));
        self.esegui(Az::Coro(s.coro.0, s.coro.1, secondi));
        match s.battito {
            Some((livello, periodo)) => self.esegui(Az::Battito(livello, periodo, 3.0)),
            None => self.esegui(Az::Battito(SPENTO, 1.1, 3.0)),
        }
        for (dopo, a) in s.eventi {
            self.p(*dopo, *a);
        }
    }

    /// L’Anziano ha finito: la musica si spegne in otto secondi.
    pub fn anziano_esce(&mut self) {
        if self.brano != Brano::Anziano {
            return;
        }
        self.azzera_programma();
        self.esegui(Az::Tace(6.0));
        self.p(10.0, Az::Fine);
    }

    // ---- il tempo

    fn esegui(&mut self, a: Az) {
        let sr = self.sr;
        match a {
            Az::Re(liv, alti, scarto, s) => {
                self.re.g.verso(lin(liv) * NORM_RE, s, sr);
                self.re.alti.verso(alti, s, sr);
                self.re.scarto.verso(scarto, s, sr);
            }
            Az::Campo(liv, hz, ricco, s) => {
                self.campo.g.verso(lin(liv), s, sr);
                // uno spegnimento lascia la nota dov’è: se ne va senza cambiare altezza
                if liv > -100.0 {
                    self.campo.f.verso(hz, s.max(0.5), sr);
                    self.campo.ricco.verso(ricco, s, sr);
                }
            }
            Az::Campo2(liv, hz, ricco, s) => {
                self.campo2.g.verso(lin(liv), s, sr);
                if liv > -100.0 {
                    self.campo2.f.verso(hz, s.max(0.5), sr);
                    self.campo2.ricco.verso(ricco, s, sr);
                }
            }
            Az::Coro(accordo, liv, s) => self.coro.accordo(accordo.note(), lin(liv), s),
            Az::Battito(liv, periodo, s) => {
                self.battito.periodo = periodo;
                self.battito.g.verso(lin(liv) * NORM_BATTITO, s, sr);
            }
            Az::Vetro(hz, liv, posto) => {
                let c = vetro_morbido(hz, sr);
                self.colpo(c, liv, posto);
            }
            Az::Sonaglio(liv, posto) => {
                let c = colpi::sonaglio(&mut self.caso, sr);
                self.colpo(c, liv, posto);
            }
            Az::Strofinato(durata, liv, posto) => {
                let c = colpi::strofinato(durata, &mut self.caso, sr);
                self.colpo(c, liv, posto);
            }
            Az::Tace(s) => {
                self.re.g.verso(0.0, s, sr);
                self.campo.g.verso(0.0, s, sr);
                self.campo2.g.verso(0.0, s, sr);
                self.coro.accordo(&[], 0.0, s);
                self.battito.g.verso(0.0, s, sr);
                self.file.tace(s);
            }
            Az::Letto(p) => {
                let r = Richiesta { pezzo: p, da: 0.0, a: None, entra: 4.0, dopo: Dopo::Ripeti, incrocio: 6.0, esce: 0.0, livello: 0.0 };
                self.file.letto(r, 4.0);
            }
            Az::Master(liv, s) => self.master.verso(lin(liv), s, sr),
            Az::Scena(i) => self.scena(i),
            Az::Fine => {
                self.brano = Brano::Silenzio;
                self.in_file = false;
                self.file.tace(1.0);
                self.azzera_programma();
            }
        }
    }

    fn colpo(&mut self, corpo: Corpo, liv: f32, posto: f32) {
        if self.colpi.len() < MAX_COLPI_MUSICA {
            self.colpi.push(Colpo::nuovo(corpo, Bus::Esterno, liv, posto, 0.0, self.sr));
        }
    }

    /// Fa andare il tempo della musica di `dt` secondi (a ogni blocco).
    pub fn passo(&mut self, dt: f32) {
        self.file.passo(dt);
        if self.file.prendi_fallita() && self.in_file && !matches!(self.brano, Brano::Anziano | Brano::Silenzio) {
            // un file che serviva non c’è: suona il brano sintetizzato
            let b = self.brano;
            self.avvia_sintetico(b);
        }
        if self.in_file && !self.file.attivo() && !matches!(self.brano, Brano::Anziano | Brano::Silenzio) {
            // i file del brano sono finiti
            self.brano = Brano::Silenzio;
            self.in_file = false;
        }
        self.t += dt as f64;
        while self.prossimo < self.programma.len() && self.programma[self.prossimo].0 <= self.t {
            let (_, a) = self.programma[self.prossimo];
            self.prossimo += 1;
            self.esegui(a);
        }
        if self.brano == Brano::Menu && self.t >= self.ciclo_fine - ANTICIPO as f64 {
            let inizio = self.ciclo_fine;
            self.ciclo_menu(inizio);
        }
        if self.energia > 1e-12 {
            self.muta_da = 0.0;
        } else {
            self.muta_da += dt;
        }
        self.energia = 0.0;
    }

    /// Il volume di tutta la musica in questo campione (lineare). Si applica DOPO la sala: un
    /// silenzio vero porta con sé anche la coda del riverbero. Va chiamato una volta per
    /// campione, prima di `campione`.
    #[inline]
    pub fn guadagno(&mut self) -> f32 {
        self.master.passo()
    }

    /// Un campione di musica da file: ha già il suo riverbero, quindi non passa dalla sala.
    #[inline]
    pub fn campione_file(&mut self) -> (f32, f32) {
        self.file.campione()
    }

    /// Un campione di musica asciutta, stereo (senza il volume generale, che sta dopo la sala).
    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        if self.master.v < 1e-6 {
            return (0.0, 0.0);
        }
        let (rl, rr) = self.re.campione(self.dt as f64);
        let (cl, cr) = self.campo.campione();
        let (dl, dr) = self.campo2.campione();
        let (ol, or) = self.coro.campione();
        let b = self.battito.campione();
        let (mut l, mut r) = (rl + cl + dl + ol + b, rr + cr + dr + or + b);
        let mut k = 0;
        while k < self.colpi.len() {
            match self.colpi[k].campione(&mut self.caso) {
                Some((a, b)) => {
                    l += a;
                    r += b;
                    k += 1;
                }
                None => {
                    self.colpi.swap_remove(k);
                }
            }
        }
        // l’energia si misura con il volume dentro: la musica «muta» è quella che non si sente
        let g = self.master.v;
        self.energia += (l * l + r * r) * g * g;
        (l, r)
    }
}

#[cfg(test)]
mod prove {
    use super::*;

    const SR: f32 = 24000.0;

    /// La potenza di una frequenza in un segnale (Goertzel), normalizzata sul numero di campioni.
    fn goertzel(x: &[f32], hz: f32) -> f32 {
        let w = std::f32::consts::TAU * hz / SR;
        let c = 2.0 * w.cos();
        let (mut s1, mut s2) = (0.0f32, 0.0f32);
        for &v in x {
            let s = v + c * s1 - s2;
            s2 = s1;
            s1 = s;
        }
        let p = s1 * s1 + s2 * s2 - c * s1 * s2;
        p / (x.len() as f32 * x.len() as f32)
    }

    fn rms_db(x: &[f32]) -> f32 {
        let e: f64 = x.iter().map(|v| (*v as f64) * (*v as f64)).sum::<f64>() / x.len().max(1) as f64;
        10.0 * (e + 1e-20).log10() as f32
    }

    /// Rende `secondi` di una musica, con il tempo che passa a blocchi come nel mondo.
    fn rendi(m: &mut Musica, secondi: f32) -> Vec<f32> {
        let blocco = 128;
        let mut out = Vec::with_capacity((secondi * SR) as usize);
        for _ in 0..(secondi * SR / blocco as f32) as usize {
            m.passo(blocco as f32 / SR);
            for _ in 0..blocco {
                let g = m.guadagno();
                let (l, r) = m.campione();
                assert!(l.is_finite() && r.is_finite(), "non finito");
                out.push((l + r) * 0.5 * g);
            }
        }
        out
    }

    #[test]
    #[ignore = "per tarare gli NORM: cargo test --lib musica::prove::calibra -- --ignored --nocapture"]
    fn calibra() {
        let mut m = Musica::nuova(SR, 7);
        m.master = Scorrevole::nuovo(1.0);
        m.master.verso(1.0, 0.0, SR);
        // il re a 0 dB, con gli armonici a metà
        m.esegui(Az::Re(0.0, 0.5, 0.1, 0.0));
        let x = rendi(&mut m, 6.0);
        println!("re      rms {:.1} dBFS", rms_db(&x[(SR * 2.0) as usize..]));
        m.esegui(Az::Tace(0.0));
        rendi(&mut m, 1.0);
        m.esegui(Az::Campo(0.0, SOL_DIESIS, 0.5, 0.0));
        let x = rendi(&mut m, 6.0);
        println!("campo   rms {:.1} dBFS", rms_db(&x[(SR * 2.0) as usize..]));
        m.esegui(Az::Tace(0.0));
        rendi(&mut m, 1.0);
        m.esegui(Az::Coro(Accordo::Clic, 0.0, 0.5));
        let x = rendi(&mut m, 10.0);
        println!("coro    rms {:.1} dBFS", rms_db(&x[(SR * 5.0) as usize..]));
        m.esegui(Az::Tace(0.0));
        rendi(&mut m, 2.0);
        m.esegui(Az::Battito(0.0, 1.1, 0.0));
        let x = rendi(&mut m, 8.0);
        println!("battito rms {:.1} dBFS, picco {:.1}", rms_db(&x[(SR * 2.0) as usize..]), 20.0 * x.iter().fold(0.0f32, |a, v| a.max(v.abs())).log10());
        m.esegui(Az::Tace(0.0));
        rendi(&mut m, 1.0);
        for (nome, az) in [("vetro morbido", Az::Vetro(830.609, 0.0, 0.0)), ("sonaglio", Az::Sonaglio(0.0, 0.0)), ("strofinato", Az::Strofinato(10.0, 0.0, 0.0))] {
            m.esegui(az);
            let x = rendi(&mut m, 16.0);
            println!("{nome:10} picco {:.1} dBFS, rms {:.1}", 20.0 * x.iter().fold(0.0f32, |a, v| a.max(v.abs())).log10(), rms_db(&x));
        }
    }

    #[test]
    #[ignore = "per misurare i brani: cargo test --release --lib musica::prove::misura_brani -- --ignored --nocapture"]
    fn misura_brani() {
        for brano in [Brano::Atto2, Brano::Atto3, Brano::Atto4, Brano::Atto5, Brano::Vivi, Brano::PrimaNota, Brano::StivaPiena, Brano::DoppioFondo, Brano::DueLettere] {
            let mut m = Musica::nuova(SR, 11);
            m.avvia(brano);
            let x = rendi(&mut m, 80.0);
            let finestre: Vec<String> = x.chunks((SR * 10.0) as usize).map(|f| format!("{:.1}", rms_db(f))).collect();
            println!("{brano:?}: picco {:.1} dBFS; rms/10s {}", 20.0 * picco(&x).log10(), finestre.join(" "));
        }
    }

    /// La potenza in una banda stretta intorno a una frequenza (±1,5%): le voci hanno un
    /// tremito, e una nota non sta su un solo bin.
    fn banda(x: &[f32], hz: f32) -> f32 {
        (-3..=3).map(|k| goertzel(x, hz * (1.0 + 0.005 * k as f32))).sum()
    }

    fn picco(x: &[f32]) -> f32 {
        x.iter().fold(0.0f32, |a, v| a.max(v.abs()))
    }

    #[test]
    fn il_campo_canta_la_sua_nota() {
        let mut c = Campo::nuovo(SR, 3, SOL_DIESIS);
        c.g = Scorrevole::nuovo(1.0);
        let x: Vec<f32> = (0..(3.0 * SR) as usize).map(|_| c.campione().0).collect();
        let sulla_nota = goertzel(&x, SOL_DIESIS);
        for lontano in [SOL_DIESIS * 0.9, SOL_DIESIS * 1.12, 150.0, 330.0] {
            assert!(sulla_nota > 100.0 * goertzel(&x, lontano), "il campo non ha la nota: {sulla_nota} contro {} a {lontano} Hz", goertzel(&x, lontano));
        }
        // spento, tace
        c.g = Scorrevole::nuovo(0.0);
        assert!((0..1000).all(|_| c.campione() == (0.0, 0.0)));
    }

    #[test]
    fn il_coro_canta_l_accordo() {
        let mut m = Musica::nuova(SR, 5);
        m.master = Scorrevole::nuovo(1.0);
        m.esegui(Az::Coro(Accordo::Clic, 0.0, 1.0));
        let x = rendi(&mut m, 12.0);
        let x = &x[(SR * 6.0) as usize..];
        for hz in Accordo::Clic.note().iter().take(3) {
            let sulla_nota = banda(x, *hz);
            let accanto = 0.5 * (banda(x, hz * 0.94) + banda(x, hz * 1.07));
            assert!(sulla_nota > 4.0 * accanto, "il coro non canta {hz} Hz: {sulla_nota:.3e} contro {accanto:.3e} accanto");
        }
        // un accordo diverso: le voci sfumano, cambiano nota e tornano
        m.esegui(Az::Coro(Accordo::Re, 0.0, 1.0));
        let y = rendi(&mut m, 12.0);
        let y = &y[(SR * 6.0) as usize..];
        let (re, sol) = (banda(y, 146.832), banda(y, CLIC[0]));
        assert!(re > 8.0 * sol, "dopo il cambio canta ancora il sol♯: re {re:.3e}, sol♯ {sol:.3e}");
    }

    #[test]
    fn il_menu_si_ricompone_e_non_si_rompe() {
        let mut m = Musica::nuova(SR, 9);
        m.avvia(Brano::Menu);
        let primo_ciclo_fine = m.ciclo_fine;
        let x = rendi(&mut m, 200.0);
        // gli strati che durano, da soli, per lo scatto: i colpi (il vetro, il sonaglio) hanno
        // l’attacco di un metallo colpito, e va bene così
        let mut s = Musica::nuova(SR, 9);
        s.avvia(Brano::Menu);
        let mut lisci = Vec::new();
        for _ in 0..(200.0 * SR / 128.0) as usize {
            s.passo(128.0 / SR);
            s.colpi.clear();
            for _ in 0..128 {
                let g = s.guadagno();
                lisci.push(s.campione().0 * g);
            }
        }
        // dopo il ciclo se ne è composto un altro
        assert!(m.ciclo_fine > primo_ciclo_fine + 100.0, "il menu non si è ricomposto: {} → {}", primo_ciclo_fine, m.ciclo_fine);
        // sempre qualcosa, mai un picco, mai uno scatto
        assert!(picco(&x) < 0.9, "picco {}", picco(&x));
        let salto = lisci.windows(2).map(|w| (w[1] - w[0]).abs()).fold(0.0f32, f32::max);
        assert!(salto < 0.04, "uno scatto di {salto}");
        for (k, finestra) in x.chunks((SR * 10.0) as usize).enumerate().skip(1) {
            let livello = rms_db(finestra);
            assert!(livello > -60.0 && livello < -18.0, "la finestra {k} sta a {livello:.1} dB");
        }
        // il re è la radice: nei primi secondi la sua nota domina
        let inizio = &x[(SR * 4.0) as usize..(SR * 14.0) as usize];
        assert!(banda(inizio, RE as f32) > 30.0 * banda(inizio, 200.0), "il re non è la radice");
        // e le finestre non sono tutte uguali: la musica si muove
        let livelli: Vec<f32> = x.chunks((SR * 8.0) as usize).map(rms_db).collect();
        let (min, max) = livelli.iter().fold((f32::MAX, f32::MIN), |(a, b), l| (a.min(*l), b.max(*l)));
        assert!(max - min > 1.5, "il menu è fermo: da {min:.1} a {max:.1} dB");
    }

    #[test]
    fn ogni_brano_finisce_e_non_si_rompe() {
        for brano in [Brano::Atto2, Brano::Atto3, Brano::Atto4, Brano::Atto5, Brano::Vivi, Brano::PrimaNota, Brano::StivaPiena, Brano::DoppioFondo, Brano::DueLettere] {
            let mut m = Musica::nuova(SR, 11);
            m.avvia(brano);
            let x = rendi(&mut m, 90.0);
            assert!(picco(&x) < 0.9, "{brano:?}: picco {}", picco(&x));
            assert!(rms_db(&x) > -60.0, "{brano:?}: quasi muto ({:.1} dB)", rms_db(&x));
            assert_eq!(m.brano(), Brano::Silenzio, "{brano:?}: non finisce");
            // gli ultimi secondi sono silenzio vero
            let coda = &x[x.len() - (SR * 4.0) as usize..];
            assert!(rms_db(coda) < -90.0, "{brano:?}: la coda sta a {:.1} dB", rms_db(coda));
            let salto = x.windows(2).map(|w| (w[1] - w[0]).abs()).fold(0.0f32, f32::max);
            assert!(salto < 0.3, "{brano:?}: uno scatto di {salto}");
        }
    }

    #[test]
    fn prima_nota_i_due_re_si_allineano_senza_cancellarsi() {
        let mut m = Musica::nuova(SR, 13);
        m.avvia(Brano::PrimaNota);
        let _ = rendi(&mut m, 9.0);
        // all’inizio la seconda onda batte con la prima di qualche Hz
        let scarto_all_inizio = (m.campo2.f.v - RE).abs() as f32;
        assert!(scarto_all_inizio > 1.2, "i due re non partono scordati: {scarto_all_inizio} Hz");
        let x = rendi(&mut m, 26.0);
        let scarto_alla_fine = (m.campo2.f.v - RE).abs() as f32;
        assert!(scarto_alla_fine < 0.2, "i due re non si allineano: {scarto_alla_fine} Hz");
        // e mentre si allineano non si cancellano mai: il livello non cala di colpo
        let livelli: Vec<f32> = x.chunks((SR * 1.0) as usize).map(rms_db).collect();
        let (min, max) = livelli.iter().fold((f32::MAX, f32::MIN), |(a, b), l| (a.min(*l), b.max(*l)));
        assert!(max - min < 9.0, "i due re si cancellano: da {min:.1} a {max:.1} dB");
    }

    #[test]
    fn l_anziano_segue_i_nodi_e_tace_otto_secondi() {
        let mut m = Musica::nuova(SR, 17);
        m.anziano_entra("benvenuto");
        let x = rendi(&mut m, 14.0);
        assert!(rms_db(&x[(SR * 8.0) as usize..]) > -55.0, "l’Anziano comincia senza musica");
        assert_eq!(m.brano(), Brano::Anziano);
        // «Resto ad ascoltare»: per otto secondi la musica tace, poi torna
        m.anziano_nodo("silenzio");
        let y = rendi(&mut m, 14.0);
        let dopo_la_sfumata = &y[(SR * 6.0) as usize..(SR * 8.0) as usize];
        assert!(rms_db(dopo_la_sfumata) < -80.0, "il silenzio non è silenzio: {:.1} dB", rms_db(dopo_la_sfumata));
        assert!(rms_db(&y[(SR * 11.0) as usize..]) > -55.0, "dopo il silenzio la musica non torna");
        // «dal sol♯ al re»: più si ascolta, più il re sale e il sol♯ scende
        let mut a = Musica::nuova(SR, 19);
        a.anziano_entra("benvenuto");
        let prima = a.progresso();
        for nodo in ["salto", "memoria", "altro", "aiuto", "prezzo", "piccolo", "sangue", "tracce", "musica"] {
            a.anziano_nodo(nodo);
            rendi(&mut a, 1.0);
        }
        assert!(a.progresso() > prima && a.progresso() >= 0.99, "il progresso non cresce: {} → {}", prima, a.progresso());
        // nodi sconosciuti non rompono niente
        a.anziano_nodo("un nodo che non c’è");
        // l’Anziano finisce: la musica se ne va in dieci secondi, e il brano finisce
        a.anziano_esce();
        let z = rendi(&mut a, 20.0);
        assert_eq!(a.brano(), Brano::Silenzio);
        assert!(rms_db(&z[(SR * 14.0) as usize..]) < -80.0, "la musica dell’Anziano non si spegne");
    }

    // ---- attraverso il mondo vero (la regia accende i brani da sola)

    use super::super::{Comando, Mix, Mondo};

    fn turno(json: &str) -> Comando {
        Comando::Turno(serde_json::from_str(json).unwrap())
    }

    /// Un mondo con la sola musica (nessuna stanza, il resto del mondo escluso).
    fn mondo_con_la_sola_musica() -> (Mondo, std::sync::mpsc::Sender<Comando>) {
        let (m, tx, _) = Mondo::nuovo(SR, 31);
        tx.send(Comando::Solo(Some("musica".to_string()))).unwrap();
        (m, tx)
    }

    fn suona(m: &mut Mondo, secondi: f32) -> Vec<f32> {
        let mut buf = vec![kira::Frame::ZERO; 256];
        let mut out = Vec::new();
        for _ in 0..(secondi * SR / 256.0) as usize {
            m.rendi(&mut buf, 1.0 / SR as f64);
            for f in &buf {
                assert!(f.left.is_finite() && f.right.is_finite());
                out.push((f.left + f.right) * 0.5);
            }
        }
        out
    }

    #[test]
    fn la_soglia_di_un_atto_suona_da_sola() {
        let (mut m, tx) = mondo_con_la_sola_musica();
        tx.send(turno(r#"{"stati": {"stanza": "", "atto": 1, "esito": "in_corso"}, "eventi": [{"evento": "inizio"}]}"#)).unwrap();
        assert!(rms_db(&suona(&mut m, 4.0)) < -90.0, "l’Atto I comincia con una musica che non c’è");
        // un atto che cresce: il suo brano
        tx.send(turno(r#"{"stati": {"stanza": "", "atto": 2, "esito": "in_corso"}, "eventi": []}"#)).unwrap();
        let x = suona(&mut m, 12.0);
        assert!(rms_db(&x) > -60.0, "la soglia dell’Atto II tace ({:.1} dB)", rms_db(&x));
        // un caricamento a metà partita non la rifà
        tx.send(turno(r#"{"stati": {"stanza": "", "atto": 3, "esito": "in_corso"}, "eventi": [{"evento": "caricamento"}]}"#)).unwrap();
        let y = suona(&mut m, 15.0);
        assert!(rms_db(&y[(SR * 6.0) as usize..]) < -90.0, "un caricamento fa suonare la soglia");
        // un atto che torna indietro (un salvataggio più vecchio) non suona
        tx.send(turno(r#"{"stati": {"stanza": "", "atto": 2, "esito": "in_corso"}, "eventi": []}"#)).unwrap();
        assert!(rms_db(&suona(&mut m, 6.0)) < -90.0);
    }

    #[test]
    fn i_finali_hanno_la_loro_musica_tranne_mani_vuote() {
        for (finale, deve) in [("vivi", true), ("prima-nota", true), ("stiva-piena", true), ("doppio-fondo", true), ("due-lettere", true), ("mani-vuote", false)] {
            let (mut m, tx) = mondo_con_la_sola_musica();
            tx.send(turno(r#"{"stati": {"stanza": "", "atto": 5, "esito": "in_corso"}, "eventi": [{"evento": "inizio"}]}"#)).unwrap();
            suona(&mut m, 1.0);
            tx.send(turno(&format!(r#"{{"stati": {{"stanza": "", "atto": 5, "esito": "vinta"}}, "eventi": [{{"evento": "finale", "finale": "{finale}"}}]}}"#))).unwrap();
            // il mondo tace per primo; la musica entra dopo
            let prima = suona(&mut m, 8.0);
            assert!(rms_db(&prima) < -90.0, "{finale}: la musica entra prima del silenzio del mondo");
            let dopo = suona(&mut m, 30.0);
            if deve {
                assert!(rms_db(&dopo) > -60.0, "{finale}: nessuna musica ({:.1} dB)", rms_db(&dopo));
            } else {
                assert!(rms_db(&dopo) < -90.0, "{finale}: ha una musica, e non deve");
            }
        }
    }

    #[test]
    fn la_musica_di_due_lettere_sopravvive_al_silenzio_del_mondo() {
        // «Due lettere»: il mondo si spegne a 25 s, e il re resta da solo (06, §11)
        let (mut m, tx) = mondo_con_la_sola_musica();
        tx.send(turno(r#"{"stati": {"stanza": "", "atto": 5, "esito": "in_corso"}, "eventi": [{"evento": "inizio"}]}"#)).unwrap();
        suona(&mut m, 1.0);
        tx.send(turno(r#"{"stati": {"stanza": "", "atto": 5, "esito": "persa"}, "eventi": [{"evento": "finale", "finale": "due-lettere"}]}"#)).unwrap();
        let x = suona(&mut m, 48.0);
        let finestra = &x[(SR * 34.0) as usize..(SR * 40.0) as usize];
        assert!(rms_db(finestra) > -60.0, "la musica è morta con il mondo ({:.1} dB)", rms_db(finestra));
    }

    #[test]
    fn il_menu_suona_segue_il_cursore_e_se_ne_va() {
        let (mut m, tx) = mondo_con_la_sola_musica();
        tx.send(Comando::Menu(true)).unwrap();
        let x = suona(&mut m, 10.0);
        assert!(rms_db(&x[(SR * 6.0) as usize..]) > -45.0, "il menu non suona");
        assert_eq!(m.membrana, 1.0, "nel menu l’interfaccia è tutta membrana");
        // il cursore della musica
        tx.send(Comando::Mix(Mix { musica: 0.5, ..Mix::default() })).unwrap();
        suona(&mut m, 1.0);
        let meta = suona(&mut m, 6.0);
        tx.send(Comando::Mix(Mix { musica: 0.0, ..Mix::default() })).unwrap();
        suona(&mut m, 1.0);
        let niente = suona(&mut m, 3.0);
        assert!(rms_db(&niente) < -90.0, "col cursore a zero la musica suona");
        assert!(rms_db(&meta) < rms_db(&x[(SR * 6.0) as usize..]) - 3.0, "il cursore a metà non abbassa la musica");
        // se ne va
        tx.send(Comando::Mix(Mix::default())).unwrap();
        tx.send(Comando::Menu(false)).unwrap();
        suona(&mut m, 8.0);
        assert!(rms_db(&suona(&mut m, 4.0)) < -80.0, "il menu non tace");
    }

    #[test]
    fn la_pausa_abbassa_la_musica() {
        let (mut m, tx) = mondo_con_la_sola_musica();
        tx.send(Comando::Menu(true)).unwrap();
        suona(&mut m, 8.0);
        let normale = rms_db(&suona(&mut m, 4.0));
        tx.send(Comando::Pausa(true)).unwrap();
        suona(&mut m, 2.0);
        let in_pausa = rms_db(&suona(&mut m, 4.0));
        assert!(in_pausa < normale - 6.0, "la pausa non abbassa la musica: {normale:.1} → {in_pausa:.1}");
    }

    #[test]
    fn l_anziano_suona_attraverso_la_regia_e_tace_al_silenzio() {
        let (mut m, tx) = mondo_con_la_sola_musica();
        let nodo = |chi: &str, nodo: &str, evento: &str| {
            turno(&format!(r#"{{"stati": {{"stanza": "", "atto": 4, "dialogo": "{chi}", "nodo": "{nodo}", "esito": "in_corso"}}, "eventi": [{{"evento": "{evento}", "con": "{chi}", "nodo": "{nodo}"}}]}}"#))
        };
        tx.send(turno(r#"{"stati": {"stanza": "", "atto": 4, "esito": "in_corso"}, "eventi": [{"evento": "inizio"}]}"#)).unwrap();
        suona(&mut m, 1.0);
        // i dialoghi degli altri non suonano la musica dell’Anziano
        tx.send(nodo("yusuf", "apertura", "dialogo")).unwrap();
        assert!(rms_db(&suona(&mut m, 5.0)) < -90.0, "Yusuf fa suonare la musica dell’Anziano");
        tx.send(turno(r#"{"stati": {"stanza": "", "atto": 4, "esito": "in_corso"}, "eventi": [{"evento": "dialogo_fine", "con": "yusuf"}]}"#)).unwrap();
        suona(&mut m, 1.0);
        // l’Anziano
        tx.send(nodo("anziano", "benvenuto", "dialogo")).unwrap();
        assert!(rms_db(&suona(&mut m, 10.0)) > -60.0, "l’Anziano parla senza musica");
        tx.send(nodo("anziano", "silenzio", "nodo")).unwrap();
        suona(&mut m, 4.0);
        assert!(rms_db(&suona(&mut m, 2.0)) < -80.0, "«Resto ad ascoltare»: la musica non tace");
        suona(&mut m, 3.0);
        assert!(rms_db(&suona(&mut m, 6.0)) > -60.0, "dopo il silenzio la musica non torna");
        // la fine del colloquio, nello stesso turno dell’atto V: vince la soglia della fuga
        tx.send(turno(r#"{"stati": {"stanza": "", "atto": 5, "esito": "in_corso"}, "eventi": [{"evento": "dialogo_fine", "con": "anziano"}]}"#)).unwrap();
        assert!(rms_db(&suona(&mut m, 5.0)) > -60.0, "la soglia dell’Atto V non suona");
        // un caricamento nel mezzo del colloquio riaccende la scena del suo nodo
        let (mut c, tx) = mondo_con_la_sola_musica();
        tx.send(turno(r#"{"stati": {"stanza": "", "atto": 4, "dialogo": "anziano", "nodo": "musica", "esito": "in_corso"}, "eventi": [{"evento": "caricamento"}]}"#)).unwrap();
        assert!(rms_db(&suona(&mut c, 10.0)) > -60.0, "un caricamento nel colloquio non riaccende la musica");
    }

    #[test]
    fn il_tema_e_la_scena_del_congedo_non_hanno_note_fuori_posto() {
        // il tema è l’accordo del clic più il re: sol♯, la terza, la quinta, il re
        assert_eq!(TEMA.len(), 4);
        for ((_, hz), atteso) in TEMA.iter().zip([CLIC_ARMONIOSO[0] * 2.0, CLIC_ARMONIOSO[1] * 2.0, CLIC_ARMONIOSO[2] * 2.0, RE6]) {
            assert!((hz / atteso - 1.0).abs() < 0.003, "{hz} contro {atteso}");
        }
        // il re del tema è un re: sei ottave sopra il reattore, meno un’ottava
        assert!((RE6 / RE as f32 - 16.0).abs() < 0.01);
        // ogni scena nomina un nodo diverso, e ci sono tutti quelli di ponte.fav
        let mut nomi: Vec<&str> = SCENE.iter().map(|s| s.nodo).collect();
        nomi.sort_unstable();
        nomi.dedup();
        assert_eq!(nomi.len(), SCENE.len());
        for nodo in ["benvenuto", "silenzio", "salto", "memoria", "altro", "aiuto", "prezzo", "piccolo", "sangue", "tracce", "musica", "congedo", "dissolvenza", "ultima voce"] {
            assert!(nomi.contains(&nodo), "manca la scena di «{nodo}»");
        }
    }
}

/// Le prove del lettore dei file (documento 22, §7). I file veri non servono: un seno lungo
/// quanto il pezzo, a una frequenza diversa per ogni pezzo, basta a sentire chi suona e quando.
#[cfg(test)]
mod prove_file {
    use super::*;
    use crate::mondo::musica_file::{Biblioteca, Pcm, OBIETTIVO_DB};

    const SR: f32 = 24000.0;

    /// Un seno di `hz`, di ampiezza `a`, lungo `secondi`, campionato a 44,1 kHz come i file veri.
    fn seno_a(hz: f32, a: f32, secondi: f32) -> Pcm {
        let sr = 44100.0f32;
        let n = (secondi * sr) as usize;
        Pcm::da_frame(
            sr,
            (0..n).map(|i| {
                let v = a * (std::f32::consts::TAU * hz * i as f32 / sr).sin();
                (v, v)
            }),
        )
    }

    fn con_pezzi(pezzi: &[(Pezzo, f32, f32)]) -> Musica {
        let mut m = Musica::nuova(SR, 11);
        let mut b = Biblioteca::nuova(std::path::PathBuf::from("non-esiste"));
        for &(p, hz, s) in pezzi {
            b.inserisci(p, seno_a(hz, 0.3, s));
        }
        m.lettore().biblioteca = Some(b);
        m
    }

    /// Fa suonare `secondi`, e restituisce il mono dei file (come li sente il mixer, prima del cursore).
    fn rendi(m: &mut Musica, secondi: f32) -> Vec<f32> {
        let blocco = 128usize;
        let mut out = Vec::new();
        for _ in 0..(secondi * SR / blocco as f32) as usize {
            m.passo(blocco as f32 / SR);
            for _ in 0..blocco {
                let (l, r) = m.campione_file();
                out.push((l + r) * 0.5);
            }
        }
        out
    }

    fn rms_db(x: &[f32]) -> f32 {
        let e: f64 = x.iter().map(|v| (*v as f64) * (*v as f64)).sum::<f64>() / x.len().max(1) as f64;
        10.0 * (e + 1e-20).log10() as f32
    }

    /// Il livello efficace, in dB, del brano sintetizzato (con il suo cursore al massimo).
    fn rms_sintetico(m: &mut Musica, secondi: f32) -> f32 {
        let mut v = Vec::new();
        for _ in 0..(secondi * SR / 64.0) as usize {
            m.passo(64.0 / SR);
            for _ in 0..64 {
                let g = m.guadagno();
                let (l, r) = m.campione();
                v.push((l + r) * 0.5 * g);
            }
        }
        rms_db(&v)
    }

    fn goertzel(x: &[f32], hz: f32) -> f32 {
        let w = std::f32::consts::TAU * hz / SR;
        let c = 2.0 * w.cos();
        let (mut s1, mut s2) = (0.0f32, 0.0f32);
        for &v in x {
            let s = v + c * s1 - s2;
            s2 = s1;
            s1 = s;
        }
        (s1 * s1 + s2 * s2 - c * s1 * s2) / (x.len() as f32 * x.len() as f32)
    }

    fn sec(x: &[f32], da: f32, a: f32) -> &[f32] {
        &x[(da * SR) as usize..(a * SR) as usize]
    }

    #[test]
    fn il_pezzo_arriva_al_livello_base_qualunque_sia_il_suo() {
        // un seno a 0,3 e uno a 0,03 (venti dB più piano) suonano allo stesso livello
        let mut m = Musica::nuova(SR, 1);
        let mut b = Biblioteca::nuova("x".into());
        b.inserisci(Pezzo::C1, seno_a(220.0, 0.3, 8.0));
        b.inserisci(Pezzo::C2, seno_a(220.0, 0.03, 8.0));
        m.lettore().biblioteca = Some(b);
        m.avvia(Brano::Vivi);
        let a = rendi(&mut m, 4.0);
        let db_a = rms_db(sec(&a, 1.5, 3.5));

        // (tra un brano e l'altro la biblioteca lascia andare i pezzi che non servono: l'altro si rimette)
        m.lettore().biblioteca.as_mut().unwrap().inserisci(Pezzo::C2, seno_a(220.0, 0.03, 8.0));
        m.avvia(Brano::PrimaNota);
        rendi(&mut m, 3.0);
        let b = rendi(&mut m, 4.0);
        let db_b = rms_db(sec(&b, 1.0, 3.0));
        assert!((db_a - OBIETTIVO_DB).abs() < 1.5, "C1 a {db_a:.1} dB, voleva {OBIETTIVO_DB}");
        assert!((db_a - db_b).abs() < 1.5, "due pezzi di livello diverso suonano a {db_a:.1} e {db_b:.1}");
    }

    #[test]
    fn i_file_prendono_il_posto_del_brano_sintetizzato() {
        let mut m = con_pezzi(&[(Pezzo::C1, 220.0, 70.0)]);
        m.avvia(Brano::Vivi);
        assert_eq!(m.brano(), Brano::Vivi);
        let x = rendi(&mut m, 12.0);
        assert!(goertzel(sec(&x, 4.0, 10.0), 220.0) > 1e-6, "il file non suona");
        // il sintetizzatore tace
        let mut forte = 0.0f32;
        for _ in 0..4800 {
            forte = forte.max(m.campione().0.abs());
        }
        assert!(forte < 0.05, "il brano sintetizzato suona sotto il file ({forte})");
    }

    #[test]
    fn senza_i_file_suona_il_brano_sintetizzato() {
        let mut m = Musica::nuova(SR, 3);
        m.avvia(Brano::Vivi);
        assert!(!m.lettore().attivo());
        let livello = rms_sintetico(&mut m, 30.0);
        assert!(livello > -60.0, "niente file e niente brano sintetizzato ({livello:.1} dB)");
    }

    #[test]
    fn il_menu_alterna_i_suoi_due_pezzi_e_non_si_ferma() {
        let mut m = con_pezzi(&[(Pezzo::M1a, 220.0, 30.0), (Pezzo::M1b, 330.0, 30.0)]);
        m.avvia(Brano::Menu);
        let x = rendi(&mut m, 100.0);
        let p220 = goertzel(sec(&x, 8.0, 18.0), 220.0);
        let p330 = goertzel(sec(&x, 8.0, 18.0), 330.0);
        let (primo, secondo) = if p220 > p330 { (220.0, 330.0) } else { (330.0, 220.0) };
        assert!(goertzel(sec(&x, 8.0, 18.0), primo) > 1e-6, "il primo pezzo non suona");
        assert!(goertzel(sec(&x, 36.0, 46.0), secondo) > 1e-6, "dopo il primo pezzo non entra l'altro");
        assert!(goertzel(sec(&x, 62.0, 72.0), primo) > 1e-6, "il primo non ritorna");
        assert!(rms_db(sec(&x, 80.0, 99.0)) > -45.0, "il menu si è fermato");
        assert_eq!(m.brano(), Brano::Menu);
    }

    #[test]
    fn la_soglia_dell_atto_due_suona_i_primi_diciotto_secondi_e_sfuma() {
        let mut m = con_pezzi(&[(Pezzo::S2, 220.0, 56.0)]);
        m.avvia(Brano::Atto2);
        let x = rendi(&mut m, 26.0);
        assert!(rms_db(sec(&x, 5.0, 12.0)) > -35.0);
        assert!(rms_db(sec(&x, 16.0, 17.5)) < rms_db(sec(&x, 5.0, 12.0)) - 3.0, "non sfuma");
        assert!(rms_db(sec(&x, 19.5, 25.5)) < -80.0, "va oltre i diciotto secondi");
        assert_eq!(m.brano(), Brano::Silenzio);
    }

    #[test]
    fn la_fuga_finisce_di_colpo_a_sessantacinque_secondi() {
        let mut m = con_pezzi(&[(Pezzo::S5, 220.0, 70.0)]);
        m.avvia(Brano::Atto5);
        let x = rendi(&mut m, 70.0);
        assert!(rms_db(sec(&x, 62.0, 64.9)) > -35.0, "tace prima del taglio");
        assert!(rms_db(sec(&x, 65.3, 70.0)) < -90.0, "non finisce di colpo");
        assert_eq!(m.brano(), Brano::Silenzio);
    }

    #[test]
    fn due_lettere_comincia_a_trentuno_secondi() {
        let mut m = con_pezzi(&[(Pezzo::C5, 220.0, 53.0)]);
        m.avvia(Brano::DueLettere);
        rendi(&mut m, 3.0);
        let p = m.lettore().posizione(Pezzo::C5).unwrap();
        assert!((p - 34.0).abs() < 0.5, "C5 era a {p} s dopo tre secondi, voleva 34");
        let x = rendi(&mut m, 30.0);
        assert!(rms_db(sec(&x, 25.0, 29.0)) < -80.0, "suona oltre la fine del file");
        assert_eq!(m.brano(), Brano::Silenzio);
    }

    #[test]
    fn i_nodi_dell_anziano_scelgono_il_letto_e_il_silenzio_e_vero() {
        let mut m = con_pezzi(&[(Pezzo::A1, 200.0, 60.0), (Pezzo::A2, 300.0, 60.0), (Pezzo::A3, 400.0, 60.0), (Pezzo::A4, 500.0, 60.0)]);
        m.anziano_entra("benvenuto");
        let x = rendi(&mut m, 12.0);
        assert!(goertzel(sec(&x, 6.0, 11.0), 200.0) > 1e-6, "benvenuto non è il primo letto");
        assert!(goertzel(sec(&x, 6.0, 11.0), 300.0) < 1e-8);
        // un altro nodo, un altro letto: si incrociano, poi resta solo il nuovo
        m.anziano_nodo("prezzo");
        let y = rendi(&mut m, 14.0);
        assert!(goertzel(sec(&y, 1.0, 3.0), 200.0) > 1e-8 && goertzel(sec(&y, 1.0, 3.0), 300.0) > 1e-8, "i due letti non si incrociano");
        assert!(goertzel(sec(&y, 8.0, 13.0), 300.0) > 1e-6, "prezzo non è il secondo letto");
        assert!(goertzel(sec(&y, 8.0, 13.0), 200.0) < 1e-8, "il primo letto non se n'è andato");
        // lo stesso letto: niente cambia
        m.anziano_nodo("aiuto");
        let z = rendi(&mut m, 4.0);
        assert!(rms_db(&z) > -35.0);
        // silenzio: otto secondi di niente, poi il primo letto
        m.anziano_nodo("silenzio");
        let s = rendi(&mut m, 14.0);
        assert!(rms_db(sec(&s, 2.5, 7.5)) < -90.0, "il silenzio non è vero ({:.1} dB)", rms_db(sec(&s, 2.5, 7.5)));
        assert!(goertzel(sec(&s, 11.0, 14.0), 200.0) > 1e-7, "dopo il silenzio non torna il primo letto");
        // il congedo: lo scioglimento; poi la musica se ne va
        m.anziano_nodo("congedo");
        let c = rendi(&mut m, 10.0);
        assert!(goertzel(sec(&c, 6.0, 9.5), 500.0) > 1e-6, "congedo non è il quarto letto");
        m.anziano_esce();
        rendi(&mut m, 12.0);
        assert!(!m.lettore().attivo());
        assert_eq!(m.brano(), Brano::Silenzio);
    }

    #[test]
    fn un_letto_si_ripete_senza_stacco() {
        let mut m = con_pezzi(&[(Pezzo::A1, 200.0, 20.0), (Pezzo::A2, 300.0, 20.0), (Pezzo::A3, 400.0, 20.0), (Pezzo::A4, 500.0, 20.0)]);
        m.anziano_entra("benvenuto");
        let x = rendi(&mut m, 70.0);
        // sessanta secondi con un file da venti: ha ripetuto più volte e il livello non cade mai
        for k in 6..62 {
            let finestra = rms_db(sec(&x, k as f32, k as f32 + 1.0));
            assert!(finestra > -34.0, "buco alla ripetizione, al secondo {k} ({finestra:.1} dB)");
        }
    }

    #[test]
    fn un_file_che_non_si_decodifica_ripiega_sul_brano_sintetizzato() {
        let dir = std::env::temp_dir().join(format!("relitto-musica-prova-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("C1-02-homecoming-drone-b.mp3"), b"questo non e un mp3").unwrap();
        let mut m = Musica::nuova(SR, 5);
        m.con_cartella(dir.clone());
        m.avvia(Brano::Vivi);
        assert!(m.in_file, "il file c'è: dovrebbe provare a suonarlo");
        for _ in 0..4000 {
            m.passo(128.0 / SR);
            if !m.in_file {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(2));
        }
        let _ = std::fs::remove_dir_all(&dir);
        assert!(!m.in_file, "il file rotto non ha fatto ripiegare sul brano sintetizzato");
        assert_eq!(m.brano(), Brano::Vivi);
        let livello = rms_sintetico(&mut m, 30.0);
        assert!(livello > -60.0, "il brano sintetizzato non suona ({livello:.1} dB)");
    }

    /// Con i file veri del repository (`cargo test --lib file_veri -- --ignored --nocapture`).
    #[test]
    #[ignore]
    fn file_veri_si_decodificano_e_si_portano_al_livello() {
        let cartella = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../audio/musica-ia");
        let mut m = Musica::nuova(SR, 9);
        m.con_cartella(cartella);
        for p in Pezzo::TUTTI {
            assert!(m.lettore().disponibile(&[p]), "manca il file di {p:?}");
            m.lettore().precarica(p);
        }
        let t0 = std::time::Instant::now();
        loop {
            m.lettore().passo(0.0);
            let b = m.lettore().biblioteca.as_ref().unwrap();
            if Pezzo::TUTTI.iter().all(|p| b.pronto(*p).is_some() || b.mancante(*p)) {
                break;
            }
            assert!(t0.elapsed().as_secs() < 180, "i file non si decodificano");
            std::thread::sleep(std::time::Duration::from_millis(50));
        }
        let b = m.lettore().biblioteca.as_ref().unwrap();
        for p in Pezzo::TUTTI {
            let pcm = b.pronto(p).unwrap_or_else(|| panic!("{p:?} non si decodifica"));
            println!("{p:?}: {:.1} s", pcm.durata());
            assert!(pcm.durata() > 30.0, "{p:?} dura {} s", pcm.durata());
        }
        println!("decodificati in {:.1} s", t0.elapsed().as_secs_f32());
    }
}
