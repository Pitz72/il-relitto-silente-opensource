//! Il filo del Sintonizzatore (bibbia sonora, §5.3). Le echi sono testo (D18): il suono
//! racconta come il Sintonizzatore le trova. Un flusso solo resta in primo piano, con il
//! ritmo di una frase; «per non farne una lingua umana, il flusso passa per uno
//! spostamento di frequenza di +60–90 Hz: il ritmo e l’intonazione restano, le parole no».
//!
//! - **Lo spostatore** (`Spostatore`): uno spostamento di frequenza vero, a banda laterale
//!   unica. Due catene di passa-tutto (la trasformata di Hilbert di Olli Niemitalo, dodici
//!   poli) fanno il segnale analitico; il segnale analitico, girato da un oscillatore,
//!   sposta ogni componente di tanti hertz, tutte della stessa quantità. Una voce ha i suoi
//!   armonici a multipli della sua altezza: spostati di 80 Hz non lo sono più, e il suono
//!   diventa quello di un metallo che parla (i rapporti fra gli armonici si perdono, la
//!   distanza fra loro, e quindi l’altezza che si sente, resta).
//! - **I profili** (`Profilo`): chi parla. Ogni eco ha il suo filo (la tabella del §5.3):
//!   l’altezza, il ritmo, quanto intona, quanto trema, quanto è spostata.
//! - **Le echi** (`ECHI`): per ognuna, i suoi fili in fila, e il suo secondo strato («la
//!   frequenza scende sotto la soglia di prima»: lo stesso filo, più grave e più nudo, senza
//!   il coro intorno). Il Piccolo è un anello di quattro secondi che ricomincia uguale; la
//!   lastra incisa non è una voce.

use std::f32::consts::TAU;

/// Una sezione del Hilbert: un passa-tutto del secondo ordine, y[n] = c·(x[n] + y[n−2]) − x[n−2].
#[derive(Clone, Copy, Default)]
struct Sezione {
    c: f32,
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,
}

impl Sezione {
    fn nuova(a: f32) -> Self {
        Sezione { c: a * a, ..Default::default() }
    }

    #[inline]
    fn passo(&mut self, x: f32) -> f32 {
        let y = self.c * (x + self.y2) - self.x2;
        self.x2 = self.x1;
        self.x1 = x;
        self.y2 = self.y1;
        self.y1 = y;
        y
    }
}

// I coefficienti di Niemitalo (dodici poli, ±0,7° di errore fra 0,002 e 0,998 della metà
// della frequenza di campionamento).
const CATENA_A: [f32; 4] = [0.692_387_8, 0.936_065_43, 0.988_229_5, 0.998_748_85];
const CATENA_B: [f32; 4] = [0.402_192_1, 0.856_171_1, 0.972_290_95, 0.995_288_5];

/// Lo spostamento di frequenza, a banda laterale unica (bibbia, §5.3).
pub struct Spostatore {
    a: [Sezione; 4],
    b: [Sezione; 4],
    /// il campione di prima della prima catena: è lei che va ritardata di uno
    a_prima: f32,
    fase: f32,
    passo_fase: f32,
}

impl Spostatore {
    pub fn nuovo(sr: f32) -> Self {
        Spostatore {
            a: CATENA_A.map(Sezione::nuova),
            b: CATENA_B.map(Sezione::nuova),
            a_prima: 0.0,
            fase: 0.0,
            passo_fase: TAU / sr,
        }
    }

    /// L’oscillatore riparte da zero: un anello che ricomincia deve ricominciare uguale.
    pub fn azzera_fase(&mut self) {
        self.fase = 0.0;
    }

    /// Un campione, spostato di `hz` (positivo: verso l’acuto). Con 0 Hz lascia stare.
    #[inline]
    pub fn elabora(&mut self, x: f32, hz: f32) -> f32 {
        let mut i = x;
        for s in self.a.iter_mut() {
            i = s.passo(i);
        }
        let mut q = x;
        for s in self.b.iter_mut() {
            q = s.passo(q);
        }
        // la prima catena, ritardata di un campione, è in quadratura con la seconda (provato:
        // l’altra banda laterale resta quasi cinquanta decibel sotto)
        let ritardata = self.a_prima;
        self.a_prima = i;
        self.fase += self.passo_fase * hz;
        if self.fase > TAU {
            self.fase -= TAU;
        } else if self.fase < -TAU {
            self.fase += TAU;
        }
        ritardata * self.fase.cos() + q * self.fase.sin()
    }
}

// -------------------------------------------------------------------------------------
//  Chi parla
// -------------------------------------------------------------------------------------

/// Una voce del Sintonizzatore: tutto quello che la distingue dalle altre.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Profilo {
    /// l’altezza di base, in Hz
    pub f0: f32,
    /// la misura del tratto vocale (le creature sono «alte e sottili»: formanti più basse)
    pub scala: f32,
    /// il ritmo, 1 = una frase di sillabe a passo normale
    pub ritmo: f32,
    /// quanto intona (1 come il brusio, 0 una voce piana)
    pub intonazione: f32,
    /// quanto trema (1 come il brusio, 0 una voce che non trema più, 2 una voce vecchia)
    pub tremito: f32,
    /// il soffio (0,05 una voce pulita, 0,14 una voce sottovoce)
    pub soffio: f32,
    /// lo spostamento di frequenza, in Hz (§5.3: +60–90)
    pub shift: f32,
    /// in dB rispetto al filo di base
    pub livello: f32,
}

/// Una voce a passo normale, con lo spostamento di mezzo: il punto da cui si parte.
pub const fn voce(f0: f32, ritmo: f32) -> Profilo {
    Profilo { f0, scala: 0.84, ritmo, intonazione: 1.0, tremito: 1.0, soffio: 0.06, shift: 72.0, livello: 0.0 }
}

/// Un filo di un’eco: dopo quanti secondi dall’inizio dell’eco, quanto dura, e chi parla.
#[derive(Clone, Copy, Debug)]
pub struct Filo {
    pub dopo: f32,
    pub durata: f32,
    pub voce: Profilo,
}

/// Come suona un’eco.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Forma {
    /// uno o più fili in fila
    Fili,
    /// il Piccolo: un anello di quattro secondi che ricomincia uguale
    Anello,
    /// la lastra incisa: «una punta contro la pietra», non una voce
    Graffio,
}

/// Un’eco del gioco (la tabella del §5.3).
#[derive(Debug)]
pub struct Eco {
    /// la cosa che si sintonizza, come la dice il ponte (`risuonata`, senza l’articolo)
    pub cosa: &'static str,
    /// dove si trova
    pub stanza: &'static str,
    pub forma: Forma,
    pub primo: &'static [Filo],
    /// il secondo strato; vuoto se l’eco non ce l’ha
    pub secondo: &'static [Filo],
}

const fn filo(dopo: f32, durata: f32, voce: Profilo) -> Filo {
    Filo { dopo, durata, voce }
}

pub const ECHI: [Eco; 11] = [
    // l’Ingegnere: urgente, «La risonanza è instabile!»; poi «più piano». Il secondo strato è
    // «quasi un canto sottovoce»
    Eco {
        cosa: "generatore",
        stanza: "laboratorio di risonanza",
        forma: Forma::Fili,
        primo: &[
            filo(0.0, 4.2, Profilo { intonazione: 1.3, shift: 82.0, ..voce(165.0, 1.5) }),
            filo(4.8, 2.4, Profilo { livello: -5.0, shift: 76.0, ..voce(150.0, 1.1) }),
        ],
        secondo: &[filo(0.0, 6.0, Profilo { intonazione: 1.7, tremito: 0.5, soffio: 0.12, livello: -4.0, shift: 55.0, ..voce(128.0, 0.5) })],
    },
    // le pareti del corridoio: molti fili uno dopo l’altro; il Capitano più lento
    Eco {
        cosa: "pareti del corridoio",
        stanza: "corridoio principale",
        forma: Forma::Fili,
        primo: &[
            filo(0.0, 3.4, Profilo { shift: 70.0, ..voce(120.0, 0.9) }),
            filo(3.9, 4.6, Profilo { shift: 62.0, ..voce(98.0, 0.62) }),
            filo(9.0, 3.2, Profilo { shift: 80.0, ..voce(150.0, 1.1) }),
            filo(12.7, 3.6, Profilo { shift: 68.0, ..voce(108.0, 0.85) }),
        ],
        secondo: &[],
    },
    // le gole: due fili, uno urgente e uno basso che «risponde a chi non la ascolta»
    Eco {
        cosa: "gole",
        stanza: "vestibolo delle gole",
        forma: Forma::Fili,
        primo: &[
            filo(0.0, 2.6, Profilo { intonazione: 1.3, shift: 86.0, ..voce(178.0, 1.7) }),
            filo(4.0, 3.6, Profilo { tremito: 0.6, livello: -2.0, shift: 60.0, ..voce(98.0, 0.7) }),
        ],
        secondo: &[],
    },
    // lo Xeno-botanico: una voce media, stanca; il secondo strato «con un filo di voce più fermo»
    Eco {
        cosa: "piante",
        stanza: "serra morente",
        forma: Forma::Fili,
        primo: &[filo(0.0, 5.0, Profilo { intonazione: 0.7, tremito: 1.4, soffio: 0.09, ..voce(125.0, 0.72) })],
        secondo: &[filo(0.0, 5.0, Profilo { intonazione: 0.5, tremito: 0.2, livello: -2.0, shift: 55.0, ..voce(112.0, 0.82) })],
    },
    // l’Ufficiale medico: una voce piana, quasi senza intonazione
    Eco {
        cosa: "capsule",
        stanza: "arca biologica",
        forma: Forma::Fili,
        primo: &[filo(0.0, 5.0, Profilo { intonazione: 0.15, tremito: 0.4, ..voce(132.0, 0.9) })],
        secondo: &[],
    },
    // il Navarca: vecchia, lenta; il secondo strato parla «a se stesso», più vicino
    Eco {
        cosa: "alcove",
        stanza: "alloggio dell'equipaggio",
        forma: Forma::Fili,
        primo: &[filo(0.0, 5.5, Profilo { scala: 0.9, intonazione: 0.8, tremito: 2.0, shift: 65.0, ..voce(88.0, 0.55) })],
        secondo: &[filo(0.0, 5.5, Profilo { scala: 0.9, intonazione: 0.4, soffio: 0.14, livello: 3.0, shift: 40.0, ..voce(82.0, 0.5) })],
    },
    // il Piccolo: «giovane, acuta», «gira su se stessa»: un anello di quattro secondi
    Eco {
        cosa: "culla",
        stanza: "nido",
        forma: Forma::Anello,
        primo: &[filo(0.0, 4.0, Profilo { scala: 0.97, intonazione: 1.4, shift: 90.0, soffio: 0.08, ..voce(255.0, 1.25) })],
        secondo: &[],
    },
    // lo Scriba: una voce piana, una pausa lunga alla fine
    Eco {
        cosa: "globo olografico",
        stanza: "scriptorium",
        forma: Forma::Fili,
        primo: &[filo(0.0, 4.2, Profilo { intonazione: 0.2, ..voce(135.0, 0.85) })],
        secondo: &[],
    },
    // l’Ufficiale di navigazione: precisa, regolare
    Eco {
        cosa: "struttura centrale",
        stanza: "ponte di comando",
        forma: Forma::Fili,
        primo: &[filo(0.0, 4.0, Profilo { intonazione: 0.3, tremito: 0.3, ..voce(146.0, 1.0) })],
        secondo: &[],
    },
    // il Custode: grave; il secondo strato «non trema più»
    Eco {
        cosa: "bassorilievo",
        stanza: "santuario del silenzio",
        forma: Forma::Fili,
        primo: &[filo(0.0, 5.0, Profilo { tremito: 1.6, shift: 62.0, ..voce(80.0, 0.6) })],
        secondo: &[filo(0.0, 5.5, Profilo { intonazione: 0.6, tremito: 0.0, livello: -1.0, shift: 50.0, ..voce(76.0, 0.62) })],
    },
    // la lastra incisa: non una voce, «una punta contro la pietra, ostinata»
    Eco { cosa: "lastra incisa", stanza: "scriptorium", forma: Forma::Graffio, primo: &[], secondo: &[] },
];

/// L’eco di una cosa sintonizzata.
pub fn eco_della_cosa(cosa: &str) -> Option<&'static Eco> {
    ECHI.iter().find(|e| e.cosa == cosa && e.forma != Forma::Graffio)
}

/// Le echi di una stanza.
pub fn echi_della_stanza(stanza: &str) -> impl Iterator<Item = &'static Eco> {
    let stanza = stanza.to_string();
    ECHI.iter().filter(move |e| e.stanza == stanza)
}

/// Quanto dura un’eco, dal primo all’ultimo filo.
pub fn durata_dei_fili(fili: &[Filo]) -> f32 {
    fili.iter().map(|f| f.dopo + f.durata).fold(0.0, f32::max)
}

/// L’anello del Piccolo: quanto dura il giro (§5.3: «un anello di quattro secondi che
/// ricomincia uguale»).
pub const GIRO_DELL_ANELLO: f32 = 4.0;

#[cfg(test)]
mod prove {
    use super::*;

    const SR: f32 = 48000.0;

    /// La potenza di una frequenza in un segnale (Goertzel), normalizzata sul numero di campioni.
    fn goertzel(x: &[f32], hz: f32) -> f32 {
        let w = TAU * hz / SR;
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

    fn seno(hz: f32, secondi: f32) -> Vec<f32> {
        (0..(secondi * SR) as usize).map(|n| (TAU * hz * n as f32 / SR).sin()).collect()
    }

    #[test]
    fn lo_spostatore_sposta_ogni_componente_della_stessa_quantita() {
        for (hz, shift) in [(1000.0, 80.0), (500.0, 60.0), (2500.0, 90.0), (300.0, 75.0)] {
            let mut s = Spostatore::nuovo(SR);
            let y: Vec<f32> = seno(hz, 1.5).into_iter().map(|x| s.elabora(x, shift)).collect();
            let y = &y[(SR * 0.3) as usize..];
            let spostata = goertzel(y, hz + shift);
            for altrove in [hz, hz - shift, hz + 2.0 * shift] {
                assert!(spostata > 300.0 * goertzel(y, altrove), "{hz} Hz + {shift}: la riga sta anche a {altrove} Hz");
            }
        }
    }

    #[test]
    fn lo_spostatore_non_cambia_il_volume_e_con_zero_lascia_stare() {
        let mut s = Spostatore::nuovo(SR);
        let x = seno(800.0, 1.0);
        let y: Vec<f32> = x.iter().map(|v| s.elabora(*v, 80.0)).collect();
        let rms = |v: &[f32]| (v.iter().map(|a| a * a).sum::<f32>() / v.len() as f32).sqrt();
        let (a, b) = (rms(&x[4800..]), rms(&y[4800..]));
        assert!((b / a - 1.0).abs() < 0.05, "il volume cambia: {a} → {b}");
        // con 0 Hz il suono non si sposta
        let mut s = Spostatore::nuovo(SR);
        let z: Vec<f32> = x.iter().map(|v| s.elabora(*v, 0.0)).collect();
        let z = &z[4800..];
        assert!(goertzel(z, 800.0) > 300.0 * goertzel(z, 880.0));
    }

    #[test]
    fn una_voce_spostata_perde_gli_armonici_e_tiene_la_distanza() {
        // una voce che tiene un’altezza ha gli armonici a multipli di f0; spostata di 80 Hz
        // li ha a k·f0 + 80: la distanza fra loro resta f0, ma il terzo non è più il triplo
        let mut v = super::super::voce::Voce::nuova(SR, 5, 120.0, 0.84, 1.0, 0.0);
        v.carattere(0.0, 0.0, 0.0);
        v.tieni(120.0, 10.0);
        let mut s = Spostatore::nuovo(SR);
        let mut y = Vec::new();
        for _ in 0..(SR * 3.0) as usize {
            y.push(s.elabora(v.campione(), 80.0));
        }
        let y = &y[(SR * 1.0) as usize..];
        let banda = |hz: f32| (-8..=8).map(|k| goertzel(y, hz + k as f32 * 0.4)).sum::<f32>();
        // il secondo armonico (240 Hz) è finito a 320, il terzo (360) a 440
        assert!(banda(320.0) > 4.0 * banda(240.0), "il secondo armonico non si è spostato");
        assert!(banda(440.0) > 4.0 * banda(360.0), "il terzo armonico non si è spostato");
    }

    #[test]
    fn le_tabelle_sono_coerenti() {
        for e in ECHI.iter() {
            assert!(!e.cosa.is_empty() && !e.stanza.is_empty());
            if e.forma == Forma::Fili || e.forma == Forma::Anello {
                assert!(!e.primo.is_empty(), "{}: nessun filo", e.cosa);
            }
            for fili in [e.primo, e.secondo] {
                let mut fine = -1.0;
                for f in fili {
                    assert!(f.dopo >= fine, "{}: i fili non sono in ordine", e.cosa);
                    assert!(f.durata > 0.5 && f.durata < 8.0);
                    fine = f.dopo + f.durata;
                    let p = f.voce;
                    // §5.3: lo spostamento sta fra +40 e +90 Hz (40 per il Navarca «più vicino»)
                    assert!((40.0..=90.0).contains(&p.shift), "{}: spostamento {}", e.cosa, p.shift);
                    assert!((70.0..=300.0).contains(&p.f0) && (0.4..=2.0).contains(&p.ritmo));
                }
            }
        }
        // §5.3: «giovane, acuta» è la più acuta; il Custode e il Navarca le più gravi
        let f0 = |c: &str| eco_della_cosa(c).unwrap().primo[0].voce.f0;
        assert!(f0("culla") > 200.0 && f0("culla") > f0("gole") && f0("bassorilievo") < 90.0 && f0("alcove") < 95.0);
        // «il Capitano più lento»
        assert!(ECHI[1].primo[1].voce.ritmo < ECHI[1].primo[0].voce.ritmo);
        // «una voce piana, quasi senza intonazione»; «non trema più»
        assert!(f0("capsule") > 0.0 && eco_della_cosa("capsule").unwrap().primo[0].voce.intonazione < 0.2);
        assert_eq!(eco_della_cosa("bassorilievo").unwrap().secondo[0].voce.tremito, 0.0);
        // la lastra non è una voce, e non si trova per cosa fra le voci
        assert!(eco_della_cosa("lastra incisa").is_none());
        assert_eq!(echi_della_stanza("scriptorium").count(), 2);
    }

    #[test]
    fn le_echi_sono_quelle_del_gioco() {
        // ogni eco della tabella è nel gioco, con la sua stanza; e il gioco non ne ha altre
        let radice = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../relitto-silente");
        let leggi = |f: &str| std::fs::read_to_string(radice.join(f)).unwrap_or_default();
        let fav = format!("{}{}", leggi("echi.fav"), leggi("ingresso.fav"));
        let mut cose = std::collections::BTreeSet::new();
        for riga in fav.lines() {
            if let Some(resto) = riga.strip_prefix("Invece di sintonizza ") {
                let nome = resto.split(" se ").next().unwrap_or("").split(':').next().unwrap_or("");
                // «Invece di sintonizza se il giocatore non ha il sintonizzatore»: nessuna cosa
                if resto.starts_with("se ") {
                    continue;
                }
                let nome = nome.trim_start_matches("il ").trim_start_matches("la ").trim_start_matches("le ").trim_start_matches("lo ");
                if !nome.is_empty() {
                    cose.insert(nome.to_string());
                }
            }
        }
        for e in ECHI.iter() {
            assert!(cose.contains(e.cosa), "«{}» non è fra le cose da sintonizzare del gioco ({cose:?})", e.cosa);
        }
        for c in &cose {
            assert!(ECHI.iter().any(|e| e.cosa == c), "«{c}» è nel gioco e non ha il suo suono");
        }
    }

    // ---- attraverso il mondo vero

    use super::super::{Azione, Comando, Mondo};

    fn turno(json: &str) -> Comando {
        Comando::Turno(serde_json::from_str(json).unwrap())
    }

    /// Gli stati di una partita nella stanza di un’eco, con la tuta addosso.
    fn stati(stanza: &str, risonate: &str, resto: &str) -> String {
        format!(
            r#"{{"stanza": "{stanza}", "atto": 3, "tuta": true, "aria": 80, "contatto": "avvenuto", "porta_interna": "aperta", "risonate": [{risonate}] {resto}, "esito": "in_corso"}}"#
        )
    }

    /// Un mondo già in partita, nella stanza di un’eco.
    fn mondo_in(stanza: &str, risonate: &str) -> (Mondo, std::sync::mpsc::Sender<Comando>) {
        let (mut m, tx, _) = Mondo::nuovo(SR, 41);
        tx.send(turno(&format!(r#"{{"stati": {}, "eventi": [{{"evento": "inizio"}}]}}"#, stati(stanza, risonate, "")))).unwrap();
        suona(&mut m, 6.0);
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

    fn rms_db(x: &[f32]) -> f32 {
        let e: f64 = x.iter().map(|v| (*v as f64) * (*v as f64)).sum::<f64>() / x.len().max(1) as f64;
        10.0 * (e + 1e-20).log10() as f32
    }

    /// Quanto cambia il mondo con un evento: la differenza fra due mondi uguali, uno con l’evento.
    fn differenza(stanza: &str, risonate: &str, evento: &str, secondi: f32) -> Vec<f32> {
        let con_evento = |ev: &str| turno(&format!(r#"{{"stati": {}, "eventi": [{ev}]}}"#, stati(stanza, risonate, "")));
        let (mut con, tx_con) = mondo_in(stanza, risonate);
        let (mut senza, tx_senza) = mondo_in(stanza, risonate);
        tx_con.send(con_evento(evento)).unwrap();
        tx_senza.send(con_evento("")).unwrap();
        let (a, b) = (suona(&mut con, secondi), suona(&mut senza, secondi));
        a.iter().zip(&b).map(|(x, y)| x - y).collect()
    }

    #[test]
    fn un_eco_trovata_ha_il_suo_filo_dopo_la_ricerca() {
        let d = differenza("laboratorio di risonanza", "", r#"{"evento": "eco", "valore": 1}, {"evento": "risuonata", "cosa": "generatore"}"#, 14.0);
        // il filo dell’Ingegnere dell’Ingegnere, e il brusio che scende
        assert!(rms_db(&d[(SR * 2.0) as usize..(SR * 6.0) as usize]) > -55.0, "l’eco non ha il suo filo");
        // il filo c’è mentre parla, e finisce (le differenze oltre non contano: due mondi che
        // hanno consumato il caso in modo diverso non restano uguali)
        let (mut m, tx) = mondo_in("laboratorio di risonanza", "");
        tx.send(turno(&format!(r#"{{"stati": {}, "eventi": [{{"evento": "risuonata", "cosa": "generatore"}}]}}"#, stati("laboratorio di risonanza", "", "")))).unwrap();
        suona(&mut m, 3.0);
        assert!(m.filo_g.v > 0.05, "il filo non parla ({})", m.filo_g.v);
        suona(&mut m, 11.0);
        assert!(m.filo_g.v < 1e-3, "il filo non finisce ({})", m.filo_g.v);
    }

    #[test]
    fn il_filo_e_spostato_di_frequenza_dentro_il_mondo() {
        let (mut m, tx) = mondo_in("laboratorio di risonanza", "");
        tx.send(turno(&format!(r#"{{"stati": {}, "eventi": [{{"evento": "risuonata", "cosa": "generatore"}}]}}"#, stati("laboratorio di risonanza", "", "")))).unwrap();
        suona(&mut m, 3.0);
        let atteso = eco_della_cosa("generatore").unwrap().primo[0].voce.shift;
        assert!((m.filo_shift.v - atteso).abs() < 2.0, "lo spostamento è {} e doveva essere {atteso}", m.filo_shift.v);
    }

    #[test]
    fn il_secondo_strato_c_e_solo_se_la_cosa_ha_gia_risuonato() {
        let ev = r#"{"evento": "risonanza", "valore": 2}"#;
        // il Custode ha già parlato: la risonanza è il suo secondo strato
        let con = differenza("santuario del silenzio", r#""bassorilievo""#, ev, 14.0);
        assert!(rms_db(&con[(SR * 2.0) as usize..(SR * 7.0) as usize]) > -55.0, "il secondo strato non suona");
        // senza la prima volta, una risonanza qualunque (la scatola nera nella serra) non fa parlare l’eco
        let senza = differenza("serra morente", "", ev, 10.0);
        assert!(rms_db(&senza) < -80.0, "una risonanza che non è un’eco fa parlare la serra ({:.1} dB)", rms_db(&senza));
    }

    #[test]
    fn la_lastra_incisa_graffia_e_si_ferma() {
        let d = differenza("scriptorium", "", r#"{"evento": "risonanza", "valore": 3}"#, 9.0);
        // il graffio c’è, la punta si ferma, e riprende
        let graffio = &d[(SR * 1.5) as usize..(SR * 2.1) as usize];
        let pausa = &d[(SR * 2.4) as usize..(SR * 2.8) as usize];
        assert!(rms_db(graffio) > -65.0, "il graffio non c’è ({:.1} dB)", rms_db(graffio));
        assert!(rms_db(pausa) < rms_db(graffio) - 15.0, "la punta non si ferma: {:.1} contro {:.1}", rms_db(pausa), rms_db(graffio));
    }

    #[test]
    fn l_anello_del_piccolo_gira_cinque_volte_e_si_ferma() {
        let (mut m, tx) = mondo_in("nido", "");
        tx.send(turno(&format!(r#"{{"stati": {}, "eventi": [{{"evento": "risuonata", "cosa": "culla"}}]}}"#, stati("nido", "", "")))).unwrap();
        suona(&mut m, 0.05);
        assert!(m.anello.is_some(), "l’anello non parte");
        // si conta quante volte il giro ricomincia
        let mut giri = 0;
        let mut prima = f32::MAX;
        for _ in 0..(32.0 * SR / 128.0) as usize {
            let mut buf = vec![kira::Frame::ZERO; 128];
            m.rendi(&mut buf, 1.0 / SR as f64);
            if let Some(a) = m.anello {
                if a.prossimo > prima + 1.0 {
                    giri += 1;
                }
                prima = a.prossimo;
            }
        }
        assert_eq!(giri, 5, "i giri dell’anello");
        assert!(m.anello.is_none(), "l’anello non si ferma");
    }

    #[test]
    fn il_giro_della_voce_e_identico() {
        // due voci con lo stesso seme dicono la stessa cosa: l’anello «ricomincia uguale»
        let v = eco_della_cosa("culla").unwrap().primo[0].voce;
        let giro = |seme: u64| {
            let mut x = super::super::voce::Voce::nuova(SR, seme, v.f0, v.scala, v.ritmo, v.soffio);
            x.carattere(v.intonazione, v.tremito, v.soffio);
            let mut s = Spostatore::nuovo(SR);
            (0..(GIRO_DELL_ANELLO * SR) as usize).map(|_| s.elabora(x.campione(), v.shift)).collect::<Vec<f32>>()
        };
        let (a, b) = (giro(0x91C0), giro(0x91C0));
        assert!(a.iter().zip(&b).all(|(x, y)| x == y), "lo stesso seme non dà la stessa voce");
        assert!(a.iter().zip(&giro(0x91C1)).any(|(x, y)| x != y));
        assert!(rms_db(&a) > -60.0);
    }

    #[test]
    fn durante_il_dialogo_con_l_eco_l_anello_non_si_ferma() {
        let (mut m, tx) = mondo_in("nido", "");
        let dialogo = r#", "dialogo": "eco", "nodo": "domanda""#;
        tx.send(turno(&format!(r#"{{"stati": {}, "eventi": [{{"evento": "dialogo", "con": "eco", "nodo": "domanda"}}]}}"#, stati("nido", "", dialogo)))).unwrap();
        suona(&mut m, 40.0);
        assert!(m.anello.is_some_and(|a| a.in_dialogo), "l’anello si è fermato durante il dialogo");
        // «Lascia stare»: l’anello smette
        tx.send(turno(&format!(r#"{{"stati": {}, "eventi": [{{"evento": "dialogo_fine", "con": "eco"}}]}}"#, stati("nido", "", "")))).unwrap();
        suona(&mut m, 1.0);
        assert!(m.anello.is_none(), "l’anello non smette quando il dialogo finisce");
    }

    #[test]
    fn il_filo_di_un_eco_e_in_programma_con_il_suo_profilo() {
        let (mut m, tx) = mondo_in("corridoio principale", "");
        tx.send(turno(&format!(r#"{{"stati": {}, "eventi": [{{"evento": "risuonata", "cosa": "pareti del corridoio"}}]}}"#, stati("corridoio principale", "", "")))).unwrap();
        suona(&mut m, 0.1);
        let voci = m.automazioni.iter().filter(|a| matches!(a.azione, Azione::Voce(_))).count();
        assert_eq!(voci, 4, "le pareti del corridoio hanno quattro fili");
        // la ricerca (il fruscio di sintonia) dura più di un secondo: i fili vengono dopo
        let primo = m.automazioni.iter().filter(|a| matches!(a.azione, Azione::Voce(_))).map(|a| a.tra).fold(f32::MAX, f32::min);
        assert!(primo > 1.0, "il primo filo parte dopo {primo} s, in mezzo alla ricerca");
    }
}
