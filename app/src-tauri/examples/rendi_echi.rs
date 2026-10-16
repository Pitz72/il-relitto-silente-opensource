//! Rende su file WAV le echi del Sintonizzatore (bibbia sonora, §5.3), una per una, nella
//! loro stanza, con il mondo vero sotto: il filo spostato di frequenza, il secondo strato,
//! l’anello del Piccolo, il graffio della lastra. Accanto scrive le note.
//!
//!   cargo run --release --example rendi_echi -- <cartella d’uscita>
//!
//! Con la variabile SOLO_FILO impostata, resta solo il filo (senza il brusio e il mondo): per
//! guardarne lo spettro.

mod comune;

use std::path::PathBuf;

use comune::{orario, scrivi_wav, SR};
use kira::Frame;
use relitto_lib::mondo::{Comando, Mondo};

struct Scena {
    titolo: &'static str,
    stanza: &'static str,
    /// le cose già risuonate prima
    risonate: &'static str,
    /// lo stato in più (il dialogo)
    resto: &'static str,
    /// gli eventi del turno
    eventi: &'static str,
    /// i secondi dopo l’evento
    durata: f32,
}

fn scene() -> Vec<Scena> {
    let eco = |cosa: &'static str| -> &'static str { Box::leak(format!(r#"{{"evento": "eco", "valore": 1}}, {{"evento": "risuonata", "cosa": "{cosa}"}}"#).into_boxed_str()) };
    let ris = r#"{"evento": "risonanza", "valore": 2}"#;
    vec![
        Scena { titolo: "L’Ingegnere (il generatore): urgente, poi più piano", stanza: "laboratorio di risonanza", risonate: "", resto: "", eventi: eco("generatore"), durata: 16.0 },
        Scena { titolo: "L’Ingegnere, il secondo strato: quasi un canto sottovoce", stanza: "laboratorio di risonanza", risonate: r#""generatore""#, resto: "", eventi: ris, durata: 14.0 },
        Scena { titolo: "Le pareti del corridoio: quattro fili, il Capitano più lento", stanza: "corridoio principale", risonate: "", resto: "", eventi: eco("pareti del corridoio"), durata: 24.0 },
        Scena { titolo: "Le gole: uno urgente, uno basso che risponde", stanza: "vestibolo delle gole", risonate: "", resto: "", eventi: eco("gole"), durata: 14.0 },
        Scena { titolo: "Lo Xeno-botanico (le piante): una voce media, stanca", stanza: "serra morente", risonate: "", resto: "", eventi: eco("piante"), durata: 14.0 },
        Scena { titolo: "Lo Xeno-botanico, il secondo strato: più fermo", stanza: "serra morente", risonate: r#""piante""#, resto: "", eventi: ris, durata: 14.0 },
        Scena { titolo: "L’Ufficiale medico (le capsule): piana, quasi senza intonazione", stanza: "arca biologica", risonate: "", resto: "", eventi: eco("capsule"), durata: 14.0 },
        Scena { titolo: "Il Navarca (le alcove): vecchia, lenta", stanza: "alloggio dell'equipaggio", risonate: "", resto: "", eventi: eco("alcove"), durata: 14.0 },
        Scena { titolo: "Il Navarca, il secondo strato: a se stesso, più vicino", stanza: "alloggio dell'equipaggio", risonate: r#""alcove""#, resto: "", eventi: ris, durata: 14.0 },
        Scena { titolo: "Il Piccolo (la culla): l’anello di quattro secondi, e poi il fruscio", stanza: "nido", risonate: "", resto: "", eventi: eco("culla"), durata: 32.0 },
        Scena { titolo: "Lo Scriba (il globo olografico): piana", stanza: "scriptorium", risonate: "", resto: "", eventi: eco("globo olografico"), durata: 14.0 },
        Scena { titolo: "La lastra incisa: una punta contro la pietra", stanza: "scriptorium", risonate: "", resto: "", eventi: ris, durata: 12.0 },
        Scena { titolo: "L’Ufficiale di navigazione (la struttura centrale): precisa", stanza: "ponte di comando", risonate: "", resto: "", eventi: eco("struttura centrale"), durata: 14.0 },
        Scena { titolo: "Il Custode (il bassorilievo): grave", stanza: "santuario del silenzio", risonate: "", resto: "", eventi: eco("bassorilievo"), durata: 14.0 },
        Scena { titolo: "Il Custode, il secondo strato: non trema più", stanza: "santuario del silenzio", risonate: r#""bassorilievo""#, resto: "", eventi: ris, durata: 14.0 },
    ]
}

fn stati(s: &Scena, resto: &str) -> String {
    format!(
        r#"{{"stanza": "{}", "atto": 3, "tuta": true, "aria": 80, "contatto": "avvenuto", "porta_interna": "aperta", "risonate": [{}] {}, "esito": "in_corso"}}"#,
        s.stanza, s.risonate, resto
    )
}

fn turno(stati: &str, eventi: &str) -> Comando {
    Comando::Turno(serde_json::from_str(&format!(r#"{{"stati": {stati}, "eventi": [{eventi}]}}"#)).expect("turno scritto male"))
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
    let solo = std::env::var("SOLO_FILO").is_ok();
    let mut pcm: Vec<i16> = Vec::new();
    let mut note = String::from("Le echi del Sintonizzatore (bibbia sonora, §5.3), ognuna nella sua stanza\n\n");
    let mut t = 0.0f32;
    for s in scene() {
        let (mut mondo, tx, _) = Mondo::nuovo(SR, 17);
        if solo {
            tx.send(Comando::Solo(Some("filo".to_string()))).map_err(|e| e.to_string())?;
        }
        note.push_str(&format!("{}  {}  ({})\n", orario(t), s.titolo, s.stanza));
        tx.send(turno(&stati(&s, ""), r#"{"evento": "inizio"}"#)).map_err(|e| e.to_string())?;
        suona(&mut mondo, 5.0, &mut pcm);
        t += 5.0;
        tx.send(turno(&stati(&s, s.resto), s.eventi)).map_err(|e| e.to_string())?;
        note.push_str(&format!("  {}  l’eco\n", orario(t)));
        // il Piccolo: dopo l’anello, si parla con lui
        if s.titolo.starts_with("Il Piccolo") {
            suona(&mut mondo, 24.0, &mut pcm);
            t += 24.0;
            let dialogo = r#", "dialogo": "eco", "nodo": "domanda""#;
            tx.send(turno(&stati(&s, dialogo), r#"{"evento": "dialogo", "con": "eco", "nodo": "domanda"}"#)).map_err(|e| e.to_string())?;
            note.push_str(&format!("  {}  «parla con l’eco»: l’anello continua\n", orario(t)));
            suona(&mut mondo, 10.0, &mut pcm);
            t += 10.0;
            tx.send(turno(&stati(&s, ""), r#"{"evento": "dialogo_fine", "con": "eco"}"#)).map_err(|e| e.to_string())?;
            note.push_str(&format!("  {}  «Lascia stare»: l’anello smette, resta il fruscio\n", orario(t)));
            suona(&mut mondo, 8.0, &mut pcm);
            t += 8.0;
        } else {
            suona(&mut mondo, s.durata, &mut pcm);
            t += s.durata;
        }
        // una pausa fra un’eco e l’altra
        suona(&mut mondo, 1.5, &mut pcm);
        t += 1.5;
        note.push('\n');
    }
    let nome = if solo { "echi-filo" } else { "echi" };
    scrivi_wav(&uscita.join(format!("{nome}.wav")), &pcm).map_err(|e| e.to_string())?;
    std::fs::write(uscita.join(format!("{nome}.txt")), note).map_err(|e| e.to_string())?;
    println!("{nome}.wav: {}", orario(t));
    Ok(())
}
