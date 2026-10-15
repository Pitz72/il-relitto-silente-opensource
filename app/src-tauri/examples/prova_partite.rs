//! La prova del suono sulle partite di collaudo: ogni traccia (strumenti/audio/traccia.py
//! --tutti) giocata dal motore audio, in fretta (un secondo e mezzo per turno), con i
//! controlli:
//!   1. ogni evento che arriva dal ponte è uno di quelli che la regia conosce;
//!   2. ogni stanza che arriva è una delle ventitré;
//!   3. il suono resta un numero vero, sotto −1 dB (bibbia, §1.7), e non tace mai quando
//!      la partita è in corso (il vuoto dello scafo e l’anticamera hanno sempre il fiato);
//!   4. il motore sta largamente dentro il tempo reale.
//!
//!   python strumenti/audio/traccia.py --tutti --cartella <cartella>
//!   cargo run --release --example prova_partite -- <cartella>
//!
//! Esce con 1 se una partita non passa.

mod comune;

use std::path::PathBuf;

use comune::{leggi_traccia, SR};
use kira::Frame;
use relitto_lib::mondo::stanze::stanza;
use relitto_lib::mondo::{Comando, Mondo, EVENTI_NOTI};

fn main() {
    let cartella = PathBuf::from(std::env::args().nth(1).unwrap_or_else(|| "collaudo/tracce".to_string()));
    let mut file: Vec<PathBuf> = match std::fs::read_dir(&cartella) {
        Ok(d) => d.filter_map(|e| e.ok().map(|e| e.path())).filter(|p| p.extension().is_some_and(|x| x == "json")).collect(),
        Err(e) => {
            eprintln!("{}: {e}", cartella.display());
            std::process::exit(2);
        }
    };
    file.sort();
    let mut fallite = 0;
    for f in &file {
        let t = match leggi_traccia(f) {
            Ok(t) => t,
            Err(e) => {
                println!("[NO] {e}");
                fallite += 1;
                continue;
            }
        };
        let mut problemi: Vec<String> = Vec::new();
        let (mut mondo, tx, _stato) = Mondo::nuovo(SR, 5);
        let mut buf = vec![Frame::ZERO; 256];
        let mut picco = 0.0f32;
        let mut dove = String::new();
        let mut muti = 0;
        let mut secondi = 0.0f64;
        let t0 = std::time::Instant::now();
        for (k, turno) in t.turni.iter().enumerate() {
            for e in &turno.suono.eventi {
                if !EVENTI_NOTI.contains(&e.evento.as_str()) {
                    problemi.push(format!("turno {k}: l’evento «{}» non è noto al suono", e.evento));
                }
            }
            if stanza(&turno.suono.stati.stanza).is_none() {
                problemi.push(format!("turno {k}: la stanza «{}» non è nella tabella", turno.suono.stati.stanza));
            }
            let finita = turno.suono.stati.esito != "in_corso";
            tx.send(Comando::Turno(turno.suono.clone())).expect("il canale");
            let mut energia = 0.0f64;
            let mut picco_turno = 0.0f32;
            let blocchi = (1.5 * SR / 256.0) as usize;
            for _ in 0..blocchi {
                mondo.rendi(&mut buf, 1.0 / SR as f64);
                for fr in &buf {
                    if !fr.left.is_finite() || !fr.right.is_finite() {
                        problemi.push(format!("turno {k}: un campione non è un numero"));
                        break;
                    }
                    picco_turno = picco_turno.max(fr.left.abs()).max(fr.right.abs());
                    energia += (fr.left * fr.left + fr.right * fr.right) as f64;
                }
            }
            secondi += 1.5;
            if picco_turno > picco {
                picco = picco_turno;
                let eventi: Vec<&str> = turno.suono.eventi.iter().map(|e| e.evento.as_str()).collect();
                dove = format!("turno {k}, «{}» in {}: {}", turno.comando.as_deref().unwrap_or("(inizio)"), turno.suono.stati.stanza, eventi.join(", "));
            }
            let rms = (energia / (blocchi * 256 * 2) as f64).sqrt();
            // il primo secondo e mezzo della partita sale piano dal nero: non conta
            if k > 0 && !finita && rms < 1e-4 {
                muti += 1;
            }
        }
        if muti > 0 {
            problemi.push(format!("{muti} turni in silenzio a partita in corso"));
        }
        if picco > 0.891 {
            problemi.push(format!("il picco passa −1 dB ({:.1} dB) al {dove}", 20.0 * picco.log10()));
        }
        let volte = secondi / t0.elapsed().as_secs_f64();
        if volte < 5.0 {
            problemi.push(format!("troppo lento: {volte:.1} volte il tempo reale"));
        }
        let riga = format!("{} ({} turni, {}; picco {:.2}, {:.0} volte il tempo reale)", t.percorso, t.turni.len(), t.esito, picco, volte);
        if problemi.is_empty() {
            println!("[OK] {riga}");
        } else {
            fallite += 1;
            println!("[NO] {riga}");
            problemi.dedup();
            for p in problemi.iter().take(8) {
                println!("     {p}");
            }
        }
    }
    println!("\n{} partite, {} non passano.", file.len(), fallite);
    std::process::exit(if fallite > 0 { 1 } else { 0 });
}
