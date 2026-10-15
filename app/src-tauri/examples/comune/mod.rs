//! Quello che gli esempi del suono hanno in comune: le tracce delle partite (scritte da
//! strumenti/audio/traccia.py) e il file WAV.

#![allow(dead_code)]

use std::io::Write;
use std::path::Path;

use relitto_lib::mondo::TurnoSuono;
use serde::Deserialize;

pub const SR: f32 = 48000.0;

/// Una partita giocata dal ponte, turno per turno.
#[derive(Deserialize)]
pub struct Traccia {
    pub percorso: String,
    pub esito: String,
    pub turni: Vec<TurnoTraccia>,
}

#[derive(Deserialize)]
pub struct TurnoTraccia {
    pub comando: Option<String>,
    pub caratteri: usize,
    pub suono: TurnoSuono,
}

pub fn leggi_traccia(percorso: &Path) -> Result<Traccia, String> {
    let testo = std::fs::read_to_string(percorso).map_err(|e| format!("{}: {e}", percorso.display()))?;
    serde_json::from_str(&testo).map_err(|e| format!("{}: {e}", percorso.display()))
}

/// Quanto dura un turno: il tempo di leggerne il testo, da tre secondi e mezzo a dieci.
pub fn durata_del_turno(caratteri: usize, primo: bool) -> f32 {
    if primo {
        return 9.0;
    }
    (2.5 + caratteri as f32 / 55.0).clamp(3.5, 10.0)
}

pub fn scrivi_wav(percorso: &Path, pcm: &[i16]) -> std::io::Result<()> {
    let mut f = std::io::BufWriter::new(std::fs::File::create(percorso)?);
    let dati = (pcm.len() * 2) as u32;
    f.write_all(b"RIFF")?;
    f.write_all(&(36 + dati).to_le_bytes())?;
    f.write_all(b"WAVEfmt ")?;
    f.write_all(&16u32.to_le_bytes())?;
    f.write_all(&1u16.to_le_bytes())?; // PCM
    f.write_all(&2u16.to_le_bytes())?; // stereo
    f.write_all(&(SR as u32).to_le_bytes())?;
    f.write_all(&(SR as u32 * 4).to_le_bytes())?;
    f.write_all(&4u16.to_le_bytes())?;
    f.write_all(&16u16.to_le_bytes())?;
    f.write_all(b"data")?;
    f.write_all(&dati.to_le_bytes())?;
    for s in pcm {
        f.write_all(&s.to_le_bytes())?;
    }
    f.flush()
}

/// I minuti e i secondi, per le note degli ascolti.
pub fn orario(secondi: f32) -> String {
    let s = secondi.max(0.0) as u32;
    format!("{}:{:02}", s / 60, s % 60)
}
