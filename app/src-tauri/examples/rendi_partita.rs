//! Rende su file una partita intera, come la sentirebbe chi gioca: la traccia di un
//! percorso (strumenti/audio/traccia.py) mandata al motore turno per turno, con il
//! tempo di leggere il testo di ogni turno. Accanto al WAV scrive le note: a che minuto
//! arriva ogni comando, e in che stanza.
//!
//!   python strumenti/audio/traccia.py collaudo/vivi.txt --uscita <cartella>/vivi.json
//!   cargo run --release --example rendi_partita -- <cartella>/vivi.json <cartella>/vivi.wav
//!
//! Con «--da N --a M» rende solo i turni da N a M (contati da 0): per ascoltare un pezzo.

mod comune;

use std::fmt::Write as _;
use std::path::PathBuf;

use comune::{durata_del_turno, leggi_traccia, orario, scrivi_wav, SR};
use kira::Frame;
use relitto_lib::mondo::{Comando, Mondo};

fn main() -> Result<(), String> {
    let argomenti: Vec<String> = std::env::args().skip(1).collect();
    let traccia = PathBuf::from(argomenti.first().ok_or("manca la traccia")?);
    let uscita = PathBuf::from(argomenti.get(1).ok_or("manca il file d’uscita")?);
    let cerca = |nome: &str| argomenti.iter().position(|a| a == nome).and_then(|i| argomenti.get(i + 1)).and_then(|v| v.parse::<usize>().ok());
    let da = cerca("--da").unwrap_or(0);
    let t = leggi_traccia(&traccia)?;
    let a = cerca("--a").unwrap_or(t.turni.len().saturating_sub(1)).min(t.turni.len().saturating_sub(1));

    let (mut mondo, tx, _stato) = Mondo::nuovo(SR, 11);
    let dt = 1.0 / SR as f64;
    let blocco = 128;
    let mut buf = vec![Frame::ZERO; blocco];
    let mut pcm: Vec<i16> = Vec::new();
    let mut note = String::new();
    let t0 = std::time::Instant::now();
    let mut secondi_audio = 0.0f32;
    for (k, turno) in t.turni.iter().enumerate().skip(da).take(a + 1 - da) {
        let mut suono = turno.suono.clone();
        if k == da && k > 0 {
            // un pezzo che non parte dall’inizio: come un caricamento
            suono.eventi = vec![relitto_lib::mondo::EventoGioco::nuovo("caricamento")];
        }
        let stanza = suono.stati.stanza.clone();
        let eventi: Vec<&str> = turno.suono.eventi.iter().map(|e| e.evento.as_str()).filter(|e| *e != "aria").collect();
        let _ = writeln!(
            note,
            "{}  {:<40} {:<26} {}",
            orario(secondi_audio),
            turno.comando.as_deref().unwrap_or("(inizio)"),
            stanza,
            eventi.join(", ")
        );
        tx.send(Comando::Turno(suono)).map_err(|e| e.to_string())?;
        let mut durata = durata_del_turno(turno.caratteri, k == da);
        if k == a {
            // dopo l’ultimo turno, il tempo della fine
            durata += 28.0;
        }
        let n = (durata * SR) as usize;
        let mut i = 0;
        while i < n {
            let q = blocco.min(n - i);
            mondo.rendi(&mut buf[..q], dt);
            for f in &buf[..q] {
                pcm.push((f.left.clamp(-1.0, 1.0) * 32767.0).round() as i16);
                pcm.push((f.right.clamp(-1.0, 1.0) * 32767.0).round() as i16);
            }
            i += q;
        }
        secondi_audio += durata;
    }
    scrivi_wav(&uscita, &pcm).map_err(|e| e.to_string())?;
    let note_file = uscita.with_extension("txt");
    std::fs::write(&note_file, note).map_err(|e| e.to_string())?;
    println!(
        "{}: {} turni, {} di audio ({:.0} volte il tempo reale); le note in {}",
        t.percorso,
        a + 1 - da,
        orario(secondi_audio),
        secondi_audio as f64 / t0.elapsed().as_secs_f64(),
        note_file.display()
    );
    Ok(())
}
