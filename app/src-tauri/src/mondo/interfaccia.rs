//! I suoni dell’interfaccia (bibbia sonora, §5.8): un tocco sui pulsanti, discreto e
//! diegetico, mai un passaggio del mouse né uno scorrimento. Tre gesti (scegliere,
//! confermare, annullare), ognuno con la sua voce:
//!
//! - **sulla Santa Maria** (acciaio): interruttori e relè veri;
//! - **nel relitto** (membrana): man mano che le venature colonizzano l’interfaccia, il
//!   clic d’acciaio si mescola con un tocco morbido e smorzato (un dito su una
//!   superficie umida) e con un parziale vetroso appena accennato; il rapporto segue la
//!   crescita della membrana, da 0 a 1;
//! - **nella fuga**: un crepitio sottile su ogni tocco, la membrana che si strappa;
//! - **a casa** (la plancia del risveglio): resta un tocco di membrana.
//!
//! Il tocco non passa dalla stanza né dal casco: è l’interfaccia, asciutta, vicina
//! all’orecchio (`Bus::Interfaccia`). Segue il volume generale e il cursore degli
//! effetti, ma non la pausa: nei pannelli si tocca di continuo. Il motore decide tutto
//! da solo, dallo stato del turno: la pagina dice soltanto quale gesto è stato fatto.

use serde::{Deserialize, Serialize};

use super::colpi::{Bolla, Bus, Corpo, Eccitatore, Modale, Tonfo, CLIC_ARMONIOSO};
use super::dsp::{campioni, Caso};
use super::Mondo;

/// Che cosa ha fatto chi gioca (06, §9.1).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Gesto {
    /// aprire, selezionare, voltare pagina: il tocco più leggero
    Scegli,
    /// un comando che parte, un sì: il tocco fermo
    Conferma,
    /// chiudere, tornare indietro, un no: il tocco che si apre
    Annulla,
}

/// Il picco di un tocco al centro, in dB: «sotto i −24 dB» (§5.8).
pub const LIV_TOCCO: f32 = -27.0;

/// Quanto dura la crescita della membrana nell’interfaccia (la tavola: 5,2 s).
const CRESCITA: f32 = 5.2;

/// La membrana che resta a casa, nella plancia del risveglio («Vivi»: una venatura
/// verde, e un tocco di membrana).
const MEMBRANA_A_CASA: f32 = 0.3;

// -------------------------------------------------------------------------------------
//  I corpi: ogni strato di un tocco, con il picco intorno a 1 (0 dB)
// -------------------------------------------------------------------------------------

/// Il tocco d’acciaio: un interruttore a levetta, un relè che chiude, un relè che si apre.
pub fn acciaio(gesto: Gesto, caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.95, 1.05);
    match gesto {
        Gesto::Scegli => {
            // un colpo secco e il suo rimbalzo
            let mut e = Eccitatore::impulso(1.0);
            e.aggiungi(campioni(caso.tra(0.0020, 0.0028), sr), 0.28);
            let modi = [(2700.0 * s, 0.010, 1.0), (4300.0 * s, 0.007, 0.6), (6400.0 * s, 0.005, 0.35), (820.0 * s, 0.018, 0.5), (390.0 * s, 0.03, 0.35)];
            Corpo::Modale(Modale::nuovo(&modi, e, 9500.0, sr)).per(0.59)
        }
        Gesto::Conferma => {
            // l’ancora che batte e rimbalza, poi il fermo: due tempi
            let mut e = Eccitatore::impulso(1.0);
            e.aggiungi(campioni(caso.tra(0.0014, 0.0020), sr), 0.4);
            e.aggiungi(campioni(caso.tra(0.050, 0.060), sr), 0.8);
            let modi = [(2100.0 * s, 0.016, 1.0), (3400.0 * s, 0.012, 0.6), (5200.0 * s, 0.008, 0.4), (610.0 * s, 0.03, 0.6), (1300.0 * s, 0.02, 0.4)];
            Corpo::Modale(Modale::nuovo(&modi, e, 9500.0, sr)).per(0.515)
        }
        Gesto::Annulla => {
            // il relè che si apre: un colpo solo, più basso e più debole
            let e = Eccitatore::impulso(0.8);
            let modi = [(1500.0 * s, 0.012, 1.0), (2600.0 * s, 0.009, 0.5), (430.0 * s, 0.03, 0.6), (900.0 * s, 0.02, 0.4)];
            Corpo::Modale(Modale::nuovo(&modi, e, 8500.0, sr)).per(0.73)
        }
    }
}

/// Il tocco di membrana: un dito su una superficie umida, morbido e smorzato.
pub fn membrana(gesto: Gesto, caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.93, 1.07);
    match gesto {
        Gesto::Scegli => Corpo::Tonfo(Tonfo::nuovo(230.0 * s, 130.0 * s, 0.010, 0.085, 1.0, 0.012, 0.45, 650.0, sr)).per(1.32),
        Gesto::Conferma => Corpo::Tonfo(Tonfo::nuovo(170.0 * s, 88.0 * s, 0.014, 0.14, 1.0, 0.016, 0.5, 520.0, sr)).per(1.23),
        Gesto::Annulla => Corpo::Tonfo(Tonfo::nuovo(140.0 * s, 80.0 * s, 0.010, 0.07, 0.8, 0.020, 0.55, 380.0, sr)).per(1.55),
    }
}

/// L’umido: una bollicina che si chiude sotto il dito. Non c’è nell’annullare, che
/// si stacca asciutto.
pub fn umido(gesto: Gesto, caso: &mut Caso, sr: f32) -> Option<Corpo> {
    let (raggio, k) = match gesto {
        Gesto::Scegli => (caso.tra(0.0018, 0.0024), 1.1),
        Gesto::Conferma => (caso.tra(0.0026, 0.0034), 1.07),
        Gesto::Annulla => return None,
    };
    Some(Corpo::Bolla(Bolla::nuova(raggio, 1.0, 0.25, sr)).per(k))
}

/// Il parziale vetroso, appena accennato: una nota del clic armonioso (§5.5) due
/// ottave più su, così il tocco è sempre dentro l’accordo del gioco.
pub fn vetro(gesto: Gesto, sr: f32) -> Corpo {
    let f = match gesto {
        Gesto::Scegli => CLIC_ARMONIOSO[1] * 4.0,
        Gesto::Conferma => CLIC_ARMONIOSO[2] * 4.0,
        Gesto::Annulla => CLIC_ARMONIOSO[0] * 2.0,
    };
    let modi = [(f, 0.22, 1.0), (f * 2.32, 0.10, 0.3)];
    let e = Eccitatore::impulso(1.0).con_soffio(0.0006, 0.2, 9000.0, sr);
    Corpo::Modale(Modale::nuovo(&modi, e, 12000.0, sr)).per(0.77)
}

/// Nella fuga la membrana si strappa a ogni tocco: un crepitio sottile e breve.
pub fn strappo(caso: &mut Caso, sr: f32) -> Corpo {
    let s = caso.tra(0.92, 1.08);
    let e = Eccitatore::impulso(0.25).con_crepitio(caso.tra(600.0, 1000.0), caso.tra(0.05, 0.09), sr);
    let modi = [(3300.0 * s, 0.05, 0.8), (4700.0 * s, 0.04, 0.6), (6100.0 * s, 0.03, 0.5), (2400.0 * s, 0.06, 0.4)];
    Corpo::Modale(Modale::nuovo(&modi, e, 11000.0, sr)).per(0.53)
}

// -------------------------------------------------------------------------------------
//  Il mix di un tocco, e il suo posto nel mondo
// -------------------------------------------------------------------------------------

/// Quanto pesa ogni strato di un tocco, in dB sotto il picco del tocco. `None`: lo
/// strato non c’è ancora.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Dosi {
    pub acciaio: f32,
    pub morbido: Option<f32>,
    pub umido: Option<f32>,
    pub vetro: Option<f32>,
}

impl Dosi {
    /// Quanto togliere a tutti gli strati perché il tocco intero non sia più forte di
    /// quello d’acciaio solo: la somma delle potenze degli strati torna a 0 dB.
    pub fn norma(&self) -> f32 {
        let potenza = |g: f32| 10f32.powf(g / 10.0);
        let somma = potenza(self.acciaio) + self.morbido.map_or(0.0, potenza) + self.umido.map_or(0.0, potenza) + self.vetro.map_or(0.0, potenza);
        -10.0 * somma.log10()
    }
}

/// Le dosi con la membrana a `m` (0–1): l’acciaio scende da 0 a −9 dB e non sparisce
/// mai, il tocco morbido sale da niente a 0, l’umido gli sta nove decibel sotto, il
/// vetro sale fino a −16.
pub fn dosi(m: f32) -> Dosi {
    let m = m.clamp(0.0, 1.0);
    let acciaio = -9.0 * m.powf(0.8);
    if m < 0.03 {
        return Dosi { acciaio, morbido: None, umido: None, vetro: None };
    }
    let morbido = 26.0 * m.log10();
    Dosi { acciaio, morbido: Some(morbido), umido: Some(morbido - 9.0), vetro: Some(-16.0 + 20.0 * m.log10()) }
}

impl Mondo {
    /// Un tocco sul pulsante (`Comando::Tocco`).
    pub(super) fn tocco(&mut self, gesto: Gesto) {
        let sr = self.sr;
        let fuga = self.gioco.in_fuga();
        let d = dosi(self.membrana);
        let Dosi { acciaio: g_acciaio, morbido: g_morbido, umido: g_bolla, vetro: g_vetro } = d;
        // ogni gesto ha il suo peso: il sì è un poco più forte, il no un poco più basso
        let peso = match gesto {
            Gesto::Scegli => 0.0,
            Gesto::Conferma => 1.0,
            Gesto::Annulla => -1.5,
        } + self.caso.tra(-0.8, 0.8)
            + LIV_TOCCO
            + d.norma();
        let p = self.caso.tra(-0.12, 0.12);

        let c = acciaio(gesto, &mut self.caso, sr);
        self.suona(c, Bus::Interfaccia, peso + g_acciaio, p, 0.0);
        if let Some(g) = g_morbido {
            let c = membrana(gesto, &mut self.caso, sr);
            self.suona(c, Bus::Interfaccia, peso + g, p, 0.0);
        }
        if let (Some(g), Some(c)) = (g_bolla, umido(gesto, &mut self.caso, sr)) {
            self.suona(c, Bus::Interfaccia, peso + g, p, 0.001);
        }
        if let Some(g) = g_vetro {
            self.suona(vetro(gesto, sr), Bus::Interfaccia, peso + g, p, 0.0);
        }
        if fuga {
            let c = strappo(&mut self.caso, sr);
            self.suona(c, Bus::Interfaccia, peso - 8.0, p, 0.0);
        }
    }

    /// Dove arriva la membrana dell’interfaccia, dallo stato del gioco: niente prima del
    /// primo contatto, tutta dopo; a casa ne resta un poco. `subito`: una partita che
    /// comincia o si riprende, senza crescere.
    pub(super) fn aggiorna_membrana(&mut self, subito: bool) {
        let dopo_il_contatto = self.gioco.contatto.as_deref() == Some("avvenuto");
        self.membrana_meta = match (dopo_il_contatto, self.casa) {
            (false, _) => 0.0,
            (true, true) => MEMBRANA_A_CASA,
            (true, false) => 1.0,
        };
        if subito {
            self.membrana = self.membrana_meta;
        }
    }

    /// La crescita (o il ritiro) della membrana, a ogni blocco.
    pub(super) fn passo_membrana(&mut self, dt: f32) {
        let d = self.membrana_meta - self.membrana;
        if d.abs() < 1e-4 {
            self.membrana = self.membrana_meta;
        } else {
            // cresce in 5,2 s, come le venature; torna indietro in due secondi
            let passo = dt / if d > 0.0 { CRESCITA } else { 2.0 };
            self.membrana += d.signum() * passo.min(d.abs());
        }
    }
}

#[cfg(test)]
mod prove {
    use super::super::colpi::Colpo;
    use super::super::{Comando, Mix, Mondo};
    use super::*;

    const SR: f32 = 48000.0;
    const GESTI: [Gesto; 3] = [Gesto::Scegli, Gesto::Conferma, Gesto::Annulla];

    /// Il picco e la durata di un corpo, suonato da solo al centro e a 0 dB.
    fn misura(corpo: Corpo, caso: &mut Caso) -> (f32, f32) {
        let mut colpo = Colpo::nuovo(corpo, Bus::Interfaccia, 0.0, 0.0, 0.0, SR);
        let (mut picco, mut n) = (0.0f32, 0u32);
        while let Some((l, r)) = colpo.campione(caso) {
            assert!(l.is_finite() && r.is_finite(), "non finito");
            picco = picco.max(l.abs()).max(r.abs());
            n += 1;
            assert!(n < SR as u32, "non finisce");
        }
        (picco, n as f32 / SR)
    }

    /// La media dei picchi su molti semi, e la durata più lunga: la taratura dei
    /// `.per()` si fa qui.
    fn media(f: impl Fn(&mut Caso) -> Option<Corpo>) -> (f32, f32) {
        let (mut somma, mut piu_lungo, mut n) = (0.0, 0.0f32, 0);
        for seme in 0..40 {
            let mut caso = Caso::nuovo(seme + 1);
            if let Some(c) = f(&mut caso) {
                let (p, d) = misura(c, &mut caso);
                somma += p;
                piu_lungo = piu_lungo.max(d);
                n += 1;
            }
        }
        (somma / n as f32, piu_lungo)
    }

    #[test]
    #[ignore = "per tarare i .per(): cargo test --lib calibra -- --ignored --nocapture"]
    fn calibra() {
        for g in GESTI {
            println!("{g:?}: acciaio {:?}", media(|c| Some(acciaio(g, c, SR))));
            println!("{g:?}: membrana {:?}", media(|c| Some(membrana(g, c, SR))));
            println!("{g:?}: umido {:?}", media(|c| umido(g, c, SR)));
            println!("{g:?}: vetro {:?}", media(|_| Some(vetro(g, SR))));
        }
        println!("strappo {:?}", media(|c| Some(strappo(c, SR))));
    }

    #[test]
    #[ignore = "per tarare i livelli: cargo test --lib livelli -- --ignored --nocapture"]
    fn livelli() {
        for (membrana, fuga) in [(0.0, "lontana"), (0.25, "lontana"), (0.5, "lontana"), (1.0, "lontana"), (1.0, "iniziata"), (MEMBRANA_A_CASA, "lontana")] {
            for g in GESTI {
                let mut somma = 0.0;
                let mut massimo = f32::MIN;
                for seme in 0..30 {
                    let (mut m, tx, _) = Mondo::nuovo(SR, seme + 1);
                    tx.send(turno(&format!(r#"{{"stati": {{"stanza": "", "contatto": "avvenuto", "fuga": "{fuga}", "esito": "in_corso"}}, "eventi": [{{"evento": "caricamento"}}]}}"#))).unwrap();
                    suona(&mut m, 1.0);
                    m.membrana = membrana;
                    m.membrana_meta = membrana;
                    tx.send(Comando::Tocco(g)).unwrap();
                    let p = dbfs(suona(&mut m, 0.6));
                    somma += p;
                    massimo = massimo.max(p);
                }
                println!("membrana {membrana:.2} {fuga:9} {g:9?}: media {:.1} dBFS, massimo {massimo:.1}", somma / 30.0);
            }
        }
    }

    #[test]
    fn ogni_strato_sta_intorno_a_zero_db_e_finisce() {
        for g in GESTI {
            let strati = [
                ("acciaio", media(|c| Some(acciaio(g, c, SR)))),
                ("membrana", media(|c| Some(membrana(g, c, SR)))),
                ("vetro", media(|_| Some(vetro(g, SR)))),
                ("umido", media(|c| umido(g, c, SR).or_else(|| Some(acciaio(g, c, SR))))),
            ];
            for (nome, (picco, durata)) in strati {
                assert!((0.7..1.4).contains(&picco), "{g:?} {nome}: picco medio {picco}");
                assert!(durata < 0.5, "{g:?} {nome}: dura {durata} s");
            }
        }
        let (picco, durata) = media(|c| Some(strappo(c, SR)));
        assert!((0.7..1.4).contains(&picco), "strappo: picco medio {picco}");
        assert!(durata < 0.5, "strappo: dura {durata} s");
    }

    /// Il picco di una finestra del corpo, in secondi.
    fn picco_fra(corpo: Corpo, caso: &mut Caso, da: f32, a: f32) -> f32 {
        let mut colpo = Colpo::nuovo(corpo, Bus::Interfaccia, 0.0, 0.0, 0.0, SR);
        let (mut picco, mut t) = (0.0f32, 0.0f32);
        while let Some((l, r)) = colpo.campione(caso) {
            if t >= da && t < a {
                picco = picco.max(l.abs()).max(r.abs());
            }
            t += 1.0 / SR;
        }
        picco
    }

    #[test]
    fn la_conferma_ha_due_tempi_e_la_scelta_uno() {
        for seme in 1..20 {
            let mut caso = Caso::nuovo(seme);
            let c = acciaio(Gesto::Conferma, &mut caso, SR);
            assert!(picco_fra(c, &mut caso.clone(), 0.045, 0.075) > 0.25, "la conferma non ha il secondo colpo ({seme})");
            let s = acciaio(Gesto::Scegli, &mut caso, SR);
            assert!(picco_fra(s, &mut caso.clone(), 0.045, 0.075) < 0.1, "la scelta ha un secondo colpo ({seme})");
        }
    }

    #[test]
    fn le_dosi_seguono_la_membrana() {
        let zero = dosi(0.0);
        assert_eq!(zero, Dosi { acciaio: 0.0, morbido: None, umido: None, vetro: None });
        let tutta = dosi(1.0);
        assert!((tutta.acciaio + 9.0).abs() < 1e-4, "l’acciaio non sparisce, ma scende a −9 dB");
        assert!(tutta.morbido.unwrap().abs() < 1e-4, "il tocco morbido arriva a 0 dB");
        assert!(tutta.vetro.unwrap() < -15.0 && tutta.vetro.unwrap() > -17.0);
        // il morbido sale e l’acciaio scende, man mano che la membrana cresce
        let (mezza, un_quarto) = (dosi(0.5), dosi(0.25));
        assert!(mezza.acciaio < un_quarto.acciaio && mezza.morbido > un_quarto.morbido && mezza.vetro > un_quarto.vetro);
    }

    #[test]
    fn la_pagina_parla_con_il_motore_in_json() {
        // i gesti come li manda app/src/gioco/tocco.ts, dentro il comando di lib/tauri.ts
        for (testo, atteso) in [("scegli", Gesto::Scegli), ("conferma", Gesto::Conferma), ("annulla", Gesto::Annulla)] {
            let c: Comando = serde_json::from_str(&format!(r#"{{"tipo": "tocco", "valore": "{testo}"}}"#)).unwrap();
            assert!(matches!(c, Comando::Tocco(g) if g == atteso), "{testo}");
        }
        assert!(serde_json::from_str::<Comando>(r#"{"tipo": "tocco", "valore": "passa_sopra"}"#).is_err());
    }

    // ---- attraverso il mondo vero

    fn turno(json: &str) -> Comando {
        Comando::Turno(serde_json::from_str(json).unwrap())
    }

    fn suona(m: &mut Mondo, secondi: f32) -> f32 {
        let mut buf = vec![kira::Frame::ZERO; 256];
        let mut massimo = 0.0f32;
        for _ in 0..(secondi * SR / 256.0) as usize {
            m.rendi(&mut buf, 1.0 / SR as f64);
            for f in &buf {
                assert!(f.left.is_finite() && f.right.is_finite());
                massimo = massimo.max(f.left.abs()).max(f.right.abs());
            }
        }
        massimo
    }

    fn dbfs(x: f32) -> f32 {
        20.0 * (x + 1e-9).log10()
    }

    /// Un mondo muto (nessuna stanza) con la membrana a `contatto`, pronto a ricevere tocchi.
    fn mondo_muto(contatto: &str, fuga: &str) -> (Mondo, std::sync::mpsc::Sender<Comando>) {
        let (mut m, tx, _) = Mondo::nuovo(SR, 5);
        tx.send(turno(&format!(
            r#"{{"stati": {{"stanza": "", "contatto": "{contatto}", "fuga": "{fuga}", "esito": "in_corso"}}, "eventi": [{{"evento": "caricamento"}}]}}"#
        )))
        .unwrap();
        assert!(dbfs(suona(&mut m, 2.0)) < -80.0, "il mondo muto non è muto");
        (m, tx)
    }

    #[test]
    fn un_tocco_suona_sotto_i_venticinque_decibel() {
        for (contatto, fuga) in [("nuovo", "lontana"), ("avvenuto", "lontana"), ("avvenuto", "iniziata")] {
            for g in GESTI {
                let (mut m, tx) = mondo_muto(contatto, fuga);
                tx.send(Comando::Tocco(g)).unwrap();
                let picco = dbfs(suona(&mut m, 0.6));
                assert!(picco < -22.0, "{contatto}/{fuga}/{g:?}: troppo forte ({picco:.1} dBFS)");
                assert!(picco > -35.0, "{contatto}/{fuga}/{g:?}: non si sente ({picco:.1} dBFS)");
                // dopo il tocco torna il silenzio
                assert!(dbfs(suona(&mut m, 1.0)) < -80.0, "{contatto}/{fuga}/{g:?}: il tocco non finisce");
            }
        }
    }

    #[test]
    fn il_tocco_segue_i_cursori_ma_non_la_pausa() {
        let (mut m, tx) = mondo_muto("avvenuto", "lontana");
        tx.send(Comando::Tocco(Gesto::Conferma)).unwrap();
        let pieno = dbfs(suona(&mut m, 0.6));
        // la pausa abbassa il mondo di 10 dB, ma non il tocco
        tx.send(Comando::Pausa(true)).unwrap();
        suona(&mut m, 1.0);
        tx.send(Comando::Tocco(Gesto::Conferma)).unwrap();
        let in_pausa = dbfs(suona(&mut m, 0.6));
        assert!((in_pausa - pieno).abs() < 4.0, "in pausa il tocco cambia: {pieno:.1} → {in_pausa:.1}");
        // il cursore dell’interfaccia lo spegne
        tx.send(Comando::Mix(Mix { interfaccia: 0.0, ..Mix::default() })).unwrap();
        suona(&mut m, 0.5);
        tx.send(Comando::Tocco(Gesto::Conferma)).unwrap();
        assert!(dbfs(suona(&mut m, 0.6)) < -80.0, "col cursore dell’interfaccia a zero il tocco suona");
        // e il volume generale lo abbassa
        tx.send(Comando::Mix(Mix { generale: 0.5, ..Mix::default() })).unwrap();
        suona(&mut m, 0.5);
        tx.send(Comando::Tocco(Gesto::Conferma)).unwrap();
        let mezzo = dbfs(suona(&mut m, 0.6));
        assert!(mezzo < pieno - 8.0, "il volume a metà non abbassa il tocco: {pieno:.1} → {mezzo:.1}");
    }

    #[test]
    fn la_membrana_cresce_al_primo_contatto_e_a_casa_ne_resta_un_poco() {
        let (mut m, tx) = mondo_muto("nuovo", "lontana");
        assert_eq!(m.membrana, 0.0);
        // il primo contatto: cresce in cinque secondi circa
        tx.send(turno(
            r#"{"stati": {"stanza": "", "contatto": "avvenuto", "fuga": "lontana", "esito": "in_corso"}, "eventi": [{"evento": "primo_contatto"}]}"#,
        ))
        .unwrap();
        suona(&mut m, 2.6);
        assert!((0.3..0.7).contains(&m.membrana), "a metà strada: {}", m.membrana);
        suona(&mut m, 3.5);
        assert!((m.membrana - 1.0).abs() < 1e-3, "tutta: {}", m.membrana);
        // una partita ripresa dopo il contatto ha già tutta la membrana
        let (m2, _) = mondo_muto("avvenuto", "lontana");
        assert_eq!(m2.membrana, 1.0);
        // a casa: resta un tocco
        m.casa = true;
        m.aggiorna_membrana(false);
        suona(&mut m, 3.0);
        assert!((m.membrana - MEMBRANA_A_CASA).abs() < 1e-3, "a casa: {}", m.membrana);
    }

    #[test]
    fn la_fuga_aggiunge_lo_strappo() {
        let (mut m, tx) = mondo_muto("avvenuto", "lontana");
        let energia = |m: &mut Mondo, tx: &std::sync::mpsc::Sender<Comando>| {
            tx.send(Comando::Tocco(Gesto::Scegli)).unwrap();
            let mut buf = vec![kira::Frame::ZERO; 256];
            let mut e = 0.0f64;
            for _ in 0..(0.5 * SR / 256.0) as usize {
                m.rendi(&mut buf, 1.0 / SR as f64);
                e += buf.iter().map(|f| (f.left * f.left) as f64).sum::<f64>();
            }
            e
        };
        let calmo: f64 = (0..8).map(|_| energia(&mut m, &tx)).sum::<f64>() / 8.0;
        tx.send(turno(r#"{"stati": {"stanza": "", "contatto": "avvenuto", "fuga": "iniziata", "esito": "in_corso"}, "eventi": []}"#)).unwrap();
        suona(&mut m, 0.3);
        let in_fuga: f64 = (0..8).map(|_| energia(&mut m, &tx)).sum::<f64>() / 8.0;
        assert!(in_fuga > calmo * 1.05, "lo strappo non si sente: {calmo:.3e} → {in_fuga:.3e}");
    }
}
