//! Rende su file WAV i tocchi dell’interfaccia (bibbia sonora, §5.8), nei posti dove li
//! sente chi gioca: sulla Santa Maria, mentre la membrana cresce, nel relitto, nella
//! fuga, a casa. Accanto scrive le note (a che secondo arriva ogni tocco), per
//! ascoltarli con il mondo vero sotto.
//!
//!   cargo run --release --example rendi_interfaccia -- <cartella d’uscita>

mod comune;

use std::path::PathBuf;

use comune::{orario, scrivi_wav, SR};
use kira::Frame;
use relitto_lib::mondo::{Comando, Gesto, Mondo};

/// Un momento dell’ascolto: un turno del gioco, poi tocchi a intervalli.
struct Tratto {
    titolo: &'static str,
    turno: &'static str,
    /// i secondi di mondo da solo, prima dei tocchi (il tempo di entrare nella scena)
    attesa: f32,
    /// i tocchi: (secondi dall’inizio dei tocchi, gesto)
    tocchi: Vec<(f32, Gesto)>,
    /// i secondi di coda
    coda: f32,
}

fn giro(da: f32, passo: f32, volte: usize) -> Vec<(f32, Gesto)> {
    let gesti = [Gesto::Scegli, Gesto::Conferma, Gesto::Annulla];
    (0..volte * 3).map(|k| (da + k as f32 * passo, gesti[k % 3])).collect()
}

fn tratti() -> Vec<Tratto> {
    vec![
        Tratto {
            titolo: "La Santa Maria: l’acciaio. Scegli, conferma, annulla, tre volte",
            turno: r#"{"stati": {"stanza": "plancia", "tuta": false, "contatto": "nuovo", "fuga": "lontana", "aggancio": "lontano", "esito": "in_corso"},
                       "eventi": [{"evento": "inizio", "stanza": "plancia"}]}"#,
            attesa: 6.0,
            tocchi: giro(0.0, 1.3, 3),
            coda: 2.0,
        },
        Tratto {
            titolo: "Il primo contatto: la membrana cresce in cinque secondi, e i tocchi la seguono",
            turno: r#"{"stati": {"stanza": "vestibolo delle gole", "tuta": true, "aria": 80, "contatto": "avvenuto", "fuga": "lontana",
                       "porta_interna": "aperta", "risuonatore": "incastrato", "esito": "in_corso"},
                       "eventi": [{"evento": "stanza", "da": "camera di compensazione", "a": "vestibolo delle gole"}, {"evento": "primo_contatto"}]}"#,
            attesa: 0.2,
            tocchi: giro(0.0, 0.62, 4),
            coda: 2.0,
        },
        Tratto {
            titolo: "Nel relitto, la membrana tutta: il tocco morbido, l’umido, il vetro",
            turno: r#"{"stati": {"stanza": "vestibolo delle gole", "tuta": true, "aria": 78, "contatto": "avvenuto", "fuga": "lontana",
                       "porta_interna": "aperta", "risuonatore": "incastrato", "esito": "in_corso"}, "eventi": []}"#,
            attesa: 3.0,
            tocchi: giro(0.0, 1.3, 3),
            coda: 2.0,
        },
        Tratto {
            titolo: "La fuga: a ogni tocco la membrana si strappa",
            turno: r#"{"stati": {"stanza": "scafo", "tuta": true, "aria": 60, "contatto": "avvenuto", "fuga": "iniziata",
                       "porta_interna": "aperta", "risuonatore": "incastrato", "esito": "in_corso"}, "eventi": [{"evento": "fuga"}]}"#,
            attesa: 4.0,
            tocchi: giro(0.0, 1.1, 3),
            coda: 2.0,
        },
    ]
}

fn suona(m: &mut Mondo, secondi: f32, pcm: &mut Vec<i16>) {
    let mut buf = vec![Frame::ZERO; 128];
    let mut resto = (secondi * SR) as usize;
    while resto > 0 {
        let k = resto.min(buf.len());
        m.rendi(&mut buf[..k], 1.0 / SR as f64);
        for f in &buf[..k] {
            pcm.push((f.left.clamp(-1.0, 1.0) * 32767.0).round() as i16);
            pcm.push((f.right.clamp(-1.0, 1.0) * 32767.0).round() as i16);
        }
        resto -= k;
    }
}

fn main() -> Result<(), String> {
    let uscita = PathBuf::from(std::env::args().nth(1).unwrap_or_else(|| "rendering".into()));
    std::fs::create_dir_all(&uscita).map_err(|e| e.to_string())?;
    // un mondo solo per tutto l’ascolto: i tratti si seguono come in una partita
    let (mut mondo, tx, _) = Mondo::nuovo(SR, 11);
    let mut pcm: Vec<i16> = Vec::new();
    let mut note = String::from("Ascolto dei tocchi dell’interfaccia (bibbia sonora, §5.8)\n\n");
    let mut t = 0.0f32;
    for tratto in tratti() {
        note.push_str(&format!("{}  {}\n", orario(t), tratto.titolo));
        tx.send(Comando::Turno(serde_json::from_str(tratto.turno).map_err(|e| e.to_string())?)).map_err(|e| e.to_string())?;
        suona(&mut mondo, tratto.attesa, &mut pcm);
        t += tratto.attesa;
        let mut ora = 0.0f32;
        for (quando, gesto) in &tratto.tocchi {
            suona(&mut mondo, quando - ora, &mut pcm);
            t += quando - ora;
            ora = *quando;
            tx.send(Comando::Tocco(*gesto)).map_err(|e| e.to_string())?;
            note.push_str(&format!("  {} ({t:.2} s)  {gesto:?}\n", orario(t)));
        }
        suona(&mut mondo, tratto.coda, &mut pcm);
        t += tratto.coda;
        note.push('\n');
    }
    scrivi_wav(&uscita.join("interfaccia.wav"), &pcm).map_err(|e| e.to_string())?;
    std::fs::write(uscita.join("interfaccia.txt"), note).map_err(|e| e.to_string())?;
    println!("interfaccia.wav: {:.0} s", t);
    Ok(())
}
