//! Quello che il gioco dice al suono a ogni turno: gli stati e gli eventi che il
//! ponte calcola (app/src/motore/ponte.py, `_suono_stati` e `_rileva`; bibbia sonora,
//! §1.6 e §2.4). La pagina li manda così come arrivano dal ponte, senza tradurli: è
//! il motore audio che decide che cosa suonare (06, §9.1).
//!
//! I campi che il suono non usa si ignorano; quelli che mancano prendono il valore di
//! base, così un ponte più nuovo o più vecchio non rompe niente.

use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Gli stati del suono, come li manda il ponte.
#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq)]
#[serde(default)]
pub struct StatiGioco {
    pub stanza: String,
    pub atto: u32,
    pub tuta: bool,
    pub aria: Option<f32>,
    pub protezione: bool,
    pub fuga: Option<String>,
    pub ingresso: Option<String>,
    pub contatto: Option<String>,
    pub connessione: Option<String>,
    pub energia: Option<String>,
    pub dialogo: Option<String>,
    pub nodo: Option<String>,
    pub faro: Option<String>,
    pub bengala: Option<String>,
    pub minaccia: Option<String>,
    pub groviglio: Option<String>,
    pub teca: Option<String>,
    pub seme: Option<String>,
    pub seme_con_te: bool,
    pub risuonatore: Option<String>,
    pub risuonatore_con_te: bool,
    pub archivio: Option<String>,
    pub nota: Option<String>,
    pub aggancio: Option<String>,
    pub porta_interna: Option<String>,
    pub disco: Option<String>,
    pub cristallo: Option<String>,
    /// le cose che il Sintonizzatore ha già fatto risuonare (il secondo strato di un’eco lo sa)
    pub risonate: Vec<String>,
    pub esito: String,
}

impl StatiGioco {
    pub fn e(campo: &Option<String>, valore: &str) -> bool {
        campo.as_deref() == Some(valore)
    }

    pub fn in_fuga(&self) -> bool {
        Self::e(&self.fuga, "iniziata")
    }

    pub fn energia_ripristinata(&self) -> bool {
        Self::e(&self.energia, "ripristinata")
    }
}

/// Un evento del turno: il nome e i suoi dati, che cambiano da un evento all’altro.
#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq)]
#[serde(default)]
pub struct EventoGioco {
    pub evento: String,
    /// la stanza di partenza («stanza») o l’aria di prima («aria»)
    pub da: Option<Value>,
    /// la stanza d’arrivo o l’aria di adesso
    pub a: Option<Value>,
    pub differenza: Option<f64>,
    pub valore: Option<f64>,
    pub con: Option<String>,
    pub nodo: Option<String>,
    pub cosa: Option<String>,
    pub attrezzo: Option<String>,
    pub finale: Option<String>,
    pub esito: Option<String>,
    pub stanza: Option<String>,
}

impl EventoGioco {
    pub fn nuovo(nome: &str) -> Self {
        EventoGioco { evento: nome.to_string(), ..Default::default() }
    }

    pub fn da_stanza(&self) -> Option<&str> {
        self.da.as_ref().and_then(Value::as_str)
    }

    pub fn a_stanza(&self) -> Option<&str> {
        self.a.as_ref().and_then(Value::as_str)
    }
}

/// Un turno, per il suono: `turno.suono` del ponte.
#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq)]
#[serde(default)]
pub struct TurnoSuono {
    pub stati: StatiGioco,
    pub eventi: Vec<EventoGioco>,
}

#[cfg(test)]
mod prove {
    use super::*;

    #[test]
    fn legge_un_turno_del_ponte() {
        let json = r#"{"stati": {"stanza": "plancia", "atto": 1, "tuta": false, "aria": null,
            "protezione": false, "fuga": "lontana", "risonate": ["x"], "chiavi": 0, "esito": "in_corso"},
            "eventi": [{"evento": "stanza", "da": "cuccetta", "a": "plancia"},
                       {"evento": "aria", "da": 80, "a": 72, "differenza": -8},
                       {"evento": "attrezzo", "attrezzo": "taglierina", "cosa": "giuntura"}]}"#;
        let t: TurnoSuono = serde_json::from_str(json).unwrap();
        assert_eq!(t.stati.stanza, "plancia");
        assert!(t.stati.aria.is_none());
        assert_eq!(t.eventi[0].da_stanza(), Some("cuccetta"));
        assert_eq!(t.eventi[1].differenza, Some(-8.0));
        assert_eq!(t.eventi[2].attrezzo.as_deref(), Some("taglierina"));
    }
}
