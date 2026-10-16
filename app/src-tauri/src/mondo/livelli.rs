//! Il mix d’autore: i livelli relativi dei canali del suono, in dB, decisi da chi fa il gioco.
//!
//! Chi gioca ha pochi cursori (generale, effetti, interfaccia, musica, parlato: `Mix`, 06 §9.2) e
//! li muove sopra il mix. Questo è il mix sotto: **come stanno fra loro il respiro, il re, le
//! macchine, i colpi, i tocchi dei pulsanti, la musica**. Non è una scelta di chi gioca ma di
//! regia, e si regola ascoltando, dalla console di regia (Ctrl+Maiusc+M nell’app).
//!
//! I valori di partenza stanno in `app/src/gioco/livelli.json`, un file solo che leggono sia la
//! pagina (la console) sia il motore (qui, a tempo di compilazione): si cambia lì.

use serde::{Deserialize, Serialize};

use super::dsp::db;

/// I livelli in dB, rispetto al mix di base (0 = come è scritto nei generatori).
#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct Livelli {
    /// il re del reattore, dal pavimento della plancia e nelle ossa
    pub re: f32,
    /// la ventilazione e le pompe della Santa Maria
    pub fondi: f32,
    /// la stanza: il fondo del relitto, i ronzii, il groviglio, i soffi, i crepitii, le toppe
    pub stanza: f32,
    /// il fiato, dentro il casco
    pub fiato: f32,
    /// la ventola della tuta
    pub ventola: f32,
    /// il corpo: il battito del seme, il cuore, il fischio dell’orecchio
    pub corpo: f32,
    /// il bengala
    pub fuoco: f32,
    /// il brusio delle voci del relitto
    pub brusio: f32,
    /// il filo del Sintonizzatore, le echi
    pub filo: f32,
    /// la radio di bordo
    pub radio: f32,
    /// i colpi degli ambienti (le lamiere, i crolli)
    pub colpi_ambienti: f32,
    /// i colpi degli effetti (i passi, gli attrezzi, le cose che accadono)
    pub colpi_effetti: f32,
    /// i colpi delle voci
    pub colpi_voci: f32,
    /// il tocco dei pulsanti
    pub interfaccia: f32,
    /// la musica, sopra il livello comune dei file
    pub musica: f32,
}

/// Il file dei livelli di partenza, letto per intero (ogni campo ci deve essere): `Livelli`, che
/// ne accetta anche una parte, ricava da qui i campi che mancano.
#[derive(Deserialize)]
struct Pieno {
    re: f32,
    fondi: f32,
    stanza: f32,
    fiato: f32,
    ventola: f32,
    corpo: f32,
    fuoco: f32,
    brusio: f32,
    filo: f32,
    radio: f32,
    colpi_ambienti: f32,
    colpi_effetti: f32,
    colpi_voci: f32,
    interfaccia: f32,
    musica: f32,
}

impl Default for Livelli {
    fn default() -> Self {
        let p: Pieno = serde_json::from_str(include_str!("../../../src/gioco/livelli.json")).expect("livelli.json è scritto male");
        Livelli {
            re: p.re,
            fondi: p.fondi,
            stanza: p.stanza,
            fiato: p.fiato,
            ventola: p.ventola,
            corpo: p.corpo,
            fuoco: p.fuoco,
            brusio: p.brusio,
            filo: p.filo,
            radio: p.radio,
            colpi_ambienti: p.colpi_ambienti,
            colpi_effetti: p.colpi_effetti,
            colpi_voci: p.colpi_voci,
            interfaccia: p.interfaccia,
            musica: p.musica,
        }
    }
}

/// Gli stessi livelli, lineari: quelli che il mixer moltiplica.
#[derive(Clone, Copy, Debug)]
pub struct Lineari {
    pub re: f32,
    pub fondi: f32,
    pub stanza: f32,
    pub fiato: f32,
    pub ventola: f32,
    pub corpo: f32,
    pub fuoco: f32,
    pub brusio: f32,
    pub filo: f32,
    pub radio: f32,
    pub colpi_ambienti: f32,
    pub colpi_effetti: f32,
    pub colpi_voci: f32,
    pub interfaccia: f32,
    pub musica: f32,
}

impl Livelli {
    pub fn lineari(&self) -> Lineari {
        Lineari {
            re: db(self.re),
            fondi: db(self.fondi),
            stanza: db(self.stanza),
            fiato: db(self.fiato),
            ventola: db(self.ventola),
            corpo: db(self.corpo),
            fuoco: db(self.fuoco),
            brusio: db(self.brusio),
            filo: db(self.filo),
            radio: db(self.radio),
            colpi_ambienti: db(self.colpi_ambienti),
            colpi_effetti: db(self.colpi_effetti),
            colpi_voci: db(self.colpi_voci),
            interfaccia: db(self.interfaccia),
            musica: db(self.musica),
        }
    }
}

impl Lineari {
    /// Si avvicina alla meta di una frazione `k` (a ogni blocco): un cursore mosso a scatti non fa clic.
    pub fn verso(&mut self, meta: &Lineari, k: f32) {
        let v = |a: &mut f32, b: f32| *a += (b - *a) * k;
        v(&mut self.re, meta.re);
        v(&mut self.fondi, meta.fondi);
        v(&mut self.stanza, meta.stanza);
        v(&mut self.fiato, meta.fiato);
        v(&mut self.ventola, meta.ventola);
        v(&mut self.corpo, meta.corpo);
        v(&mut self.fuoco, meta.fuoco);
        v(&mut self.brusio, meta.brusio);
        v(&mut self.filo, meta.filo);
        v(&mut self.radio, meta.radio);
        v(&mut self.colpi_ambienti, meta.colpi_ambienti);
        v(&mut self.colpi_effetti, meta.colpi_effetti);
        v(&mut self.colpi_voci, meta.colpi_voci);
        v(&mut self.interfaccia, meta.interfaccia);
        v(&mut self.musica, meta.musica);
    }
}

#[cfg(test)]
mod prove {
    use super::*;

    #[test]
    fn i_livelli_di_partenza_si_leggono_e_il_respiro_sta_sotto() {
        let l = Livelli::default();
        assert!(l.fiato <= -6.0, "il respiro è troppo alto in partenza ({} dB)", l.fiato);
        assert_eq!(l.interfaccia, 0.0);
        // una console che manda solo qualche livello lascia gli altri com’erano
        let parziale: Livelli = serde_json::from_str(r#"{"fiato": -20}"#).unwrap();
        assert_eq!(parziale.fiato, -20.0);
        assert_eq!(parziale.re, l.re);
    }

    #[test]
    fn i_livelli_lineari_seguono_i_decibel() {
        let l = Livelli { fiato: -20.0, ..Livelli::default() }.lineari();
        assert!((l.fiato - 0.1).abs() < 1e-5);
        let mut x = Livelli::default().lineari();
        x.verso(&l, 1.0);
        assert!((x.fiato - 0.1).abs() < 1e-6);
    }
}
