//! Rende su file WAV le echi del Sintonizzatore (bibbia sonora, §5.3), una per una, nella
//! loro stanza, con il mondo vero sotto. Dal 7 novembre 2026 parlano le voci della nave
//! registrate (documento 35), che il ponte manda con l’evento «voci»: qui gli eventi sono gli
//! stessi; in fondo, la voce di servizio (documento 35, §11), da sola e in fila con le voci.
//! Accanto scrive le note, con il punto in cui entra ogni voce.
//!
//!   cargo run --release --example rendi_echi -- <cartella d’uscita> [parola]
//!
//! Con una parola rende soltanto le scene il cui titolo la contiene (per esempio «voci», per le
//! scene a più voci). Con SENZA_FILE le echi hanno il filo sintetico di prima. Con SOLO_FILO
//! resta solo il canale delle echi (il filo o le voci, senza il brusio e il mondo): per misurarle.
//! Con SENZA_FILO il contrario: il mondo e il brusio senza le echi.

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
    /// lo stato in più (il dialogo, la fuga)
    resto: &'static str,
    /// gli eventi del turno
    eventi: &'static str,
    /// le battute che il ponte manda con quegli eventi (i nomi fra virgolette, separati da virgole)
    battute: &'static str,
    /// i secondi dopo l’evento
    durata: f32,
}

fn eco(cosa: &str) -> &'static str {
    Box::leak(format!(r#"{{"evento": "eco", "valore": 1}}, {{"evento": "risuonata", "cosa": "{cosa}"}}"#).into_boxed_str())
}

fn scanner(cosa: &str) -> &'static str {
    Box::leak(format!(r#"{{"evento": "attrezzo", "attrezzo": "multiscanner", "cosa": "{cosa}"}}"#).into_boxed_str())
}

const RIS: &str = r#"{"evento": "attrezzo", "attrezzo": "sintonizzatore", "cosa": "x"}, {"evento": "risonanza", "valore": 2}"#;

fn scene() -> Vec<Scena> {
    let s = |titolo, stanza, risonate, eventi, battute, durata| Scena { titolo, stanza, risonate, resto: "", eventi, battute, durata };
    vec![
        s("Le pareti del corridoio: quattro voci, una dopo l’altra", "corridoio principale", "", eco("pareti del corridoio"), r#""NV-01-senza-ruolo", "NV-02-capitano", "NV-03-carico", "NV-04-bordo""#, 50.0),
        s("Le gole: l’ingegnere capo, e il tecnico di carico che risponde", "vestibolo delle gole", "", eco("gole"), r#""NV-12c-ingegnere-gole", "NV-03b-carico-gole""#, 12.0),
        Scena {
            titolo: "Il Piccolo (la culla): la domanda gira; resto in silenzio, e dopo l’ultimo giro parla il Navarca",
            stanza: "nido",
            risonate: "",
            resto: "",
            eventi: eco("culla"),
            battute: r#""NV-08-piccolo""#,
            durata: 0.0,
        },
        s("Lo Xeno-botanico (le piante)", "serra morente", "", eco("piante"), r#""NV-05-botanico""#, 24.0),
        s("Lo Xeno-botanico, il secondo strato", "serra morente", r#""piante""#, RIS, r#""NV-05b-botanico-profondo""#, 22.0),
        s("L’Ufficiale medico (le capsule)", "arca biologica", "", eco("capsule"), r#""NV-06-medico""#, 14.0),
        s("Il Navarca (le alcove)", "alloggio dell'equipaggio", "", eco("alcove"), r#""NV-07-navarca""#, 18.0),
        s("Il Navarca, il secondo strato", "alloggio dell'equipaggio", r#""alcove""#, RIS, r#""NV-07b-navarca-profondo""#, 30.0),
        s("Lo Scriba (il globo olografico)", "scriptorium", "", eco("globo olografico"), r#""NV-10-scriba""#, 22.0),
        s("L’Ufficiale di navigazione (la struttura centrale)", "ponte di comando", "", eco("struttura centrale"), r#""NV-09-navigazione""#, 15.0),
        s("Il Custode (il bassorilievo)", "santuario del silenzio", "", eco("bassorilievo"), r#""NV-11-custode""#, 22.0),
        s("Il Custode, il secondo strato", "santuario del silenzio", r#""bassorilievo""#, RIS, r#""NV-11b-custode-profondo""#, 32.0),
        s("L’Ingegnere capo (il generatore)", "laboratorio di risonanza", "", eco("generatore"), r#""NV-12-ingegnere""#, 25.0),
        s("L’Ingegnere capo, il secondo strato", "laboratorio di risonanza", r#""generatore""#, RIS, r#""NV-12b-ingegnere-profondo""#, 34.0),
        s("Lo scanner: la lastra dati, al 4 %", "ponte di comando", "", scanner("lastra dati"), r#""NV-14-lastra""#, 14.0),
        s("Lo scanner: il cilindro, al 18 %", "ponte di comando", "", scanner("cilindro mnemonico"), r#""NV-14b-cilindro""#, 20.0),
        s("Lo scanner: la stele, al 75 %", "ponte di comando", "", scanner("stele"), r#""NV-14c-stele""#, 26.0),
        s("Lo scanner: il nucleo, l’Archivista", "ponte di comando", "", scanner("nucleo"), r#""NV-13-archivista""#, 27.0),
        s("L’ultima voce", "santuario del silenzio", "", "", r#""NV-15-ultima-voce""#, 16.0),
        Scena {
            titolo: "Yusuf, dalla radio di plancia: l’apertura",
            stanza: "plancia",
            risonate: "",
            resto: r#", "dialogo": "yusuf", "nodo": "apertura""#,
            eventi: r#"{"evento": "dialogo", "con": "yusuf", "nodo": "apertura"}"#,
            battute: r#""YU-01-apertura""#,
            durata: 8.0,
        },
        Scena {
            titolo: "Yusuf, nella fuga: il canale della Santa Maria",
            stanza: "scafo",
            risonate: "",
            resto: r#", "fuga": "iniziata""#,
            eventi: "",
            battute: r#""YU-08-fuga-nessuno""#,
            durata: 9.0,
        },
        Scena {
            titolo: "La scatola nera di L.V., nella serra",
            stanza: "serra morente",
            risonate: r#""piante""#,
            resto: "",
            eventi: r#"{"evento": "scatola_nera"}, {"evento": "risonanza", "valore": 3}"#,
            battute: r#""LV-02-scatola-serra""#,
            durata: 90.0,
        },
        Scena {
            titolo: "La fuga: accanto alla nicchia vuota, «Deve.»",
            stanza: "vestibolo delle gole",
            risonate: "",
            resto: r#", "fuga": "iniziata""#,
            eventi: "",
            battute: r#""NV-03c-carico-deve""#,
            durata: 6.0,
        },
        s("La voce di servizio: un suggerimento (esamina la radio)", "plancia", "", "", r#""SV-28-per-chiamare-yusuf-parla""#, 6.0),
        s(
            "La voce di servizio: la scansione lunga della nave aliena",
            "plancia",
            "",
            "",
            r#""SV-11-lunghezza-trecentoquaranta-metri-massa", "SV-04-materiale-non-in-archivio", "SV-17-adesso-puoi-accostare""#,
            18.0,
        ),
        s("La voce di servizio: il cadavere, la lettura dello scanner", "serra morente", "", scanner("cadavere"), r#""SV-06-analisi-biometrica-specie-homo""#, 19.0),
        s("La voce di servizio: la lastra dati e la matrice di traduzione", "ponte di comando", "", scanner("lastra dati"), r#""NV-14-lastra", "SV-15-matrice-quattro""#, 19.0),
        Scena {
            titolo: "La voce di servizio: la protezione vitale (la tuta chiude i canali, ma non il suo)",
            stanza: "corridoio principale",
            risonate: "",
            resto: r#", "protezione": true"#,
            eventi: r#"{"evento": "protezione"}"#,
            battute: r#""SV-01-protezione-vitale""#,
            durata: 6.0,
        },
        s("Il computer di bordo: la riga del registro alla fine di «Vivi»", "stiva", "", "", r#""SV-42-registro-magazzino-quattro""#, 64.0),
    ]
}

fn stati(s: &Scena, resto: &str) -> String {
    format!(
        r#"{{"stanza": "{}", "atto": 3, "tuta": true, "aria": 80, "contatto": "avvenuto", "porta_interna": "aperta", "risonate": [{}] {} {}, "esito": "in_corso"}}"#,
        s.stanza, s.risonate, s.resto, resto
    )
}

/// Gli eventi del turno, con le battute come le manda il ponte (l’evento «voci»).
fn eventi(eventi: &str, battute: &str, senza_file: bool) -> String {
    let voci = if battute.is_empty() || senza_file { String::new() } else { format!(r#"{{"evento": "voci", "battute": [{battute}]}}"#) };
    match (eventi.is_empty(), voci.is_empty()) {
        (true, _) => voci,
        (false, true) => eventi.to_string(),
        (false, false) => format!("{eventi}, {voci}"),
    }
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
    let filtro = std::env::args().nth(2);
    std::fs::create_dir_all(&uscita).map_err(|e| e.to_string())?;
    let solo = std::env::var("SOLO_FILO").is_ok();
    let senza = std::env::var("SENZA_FILO").is_ok();
    let senza_file = std::env::var("SENZA_FILE").is_ok();
    let mut pcm: Vec<i16> = Vec::new();
    let mut note = String::from("Le echi del Sintonizzatore e le voci della nave (documento 35), ognuna nella sua stanza\n\n");
    let mut t = 0.0f32;
    for s in scene() {
        if filtro.as_deref().is_some_and(|f| !s.titolo.contains(f)) {
            continue;
        }
        let (mut mondo, tx, _) = Mondo::nuovo(SR, 17);
        if !senza_file {
            mondo.cartella_musica(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../audio/musica-ia"));
        }
        if solo {
            tx.send(Comando::Solo(Some("filo".to_string()))).map_err(|e| e.to_string())?;
        } else if senza {
            tx.send(Comando::Solo(Some("senza filo".to_string()))).map_err(|e| e.to_string())?;
        }
        note.push_str(&format!("{}  {}  ({})\n", orario(t), s.titolo, s.stanza));
        // il computer di bordo: il finale vero, con il suo silenzio e la sua musica, e la riga del registro dopo il
        // tempo di leggerlo (il «dopo» del ponte, circa 44 s in «Vivi»)
        let finale = s.titolo.starts_with("Il computer di bordo");
        let (prima, poi) = if finale {
            let st = |esito: &str| format!(r#"{{"stanza": "{}", "atto": 5, "tuta": true, "esito": "{esito}"}}"#, s.stanza);
            (st("in_corso"), turno(&st("vinta"), &format!(r#"{{"evento": "finale", "finale": "vivi"}}{}"#, if senza_file { String::new() } else { format!(r#", {{"evento": "voci", "battute": [{}], "dopo": 44.0}}"#, s.battute) })))
        } else {
            (stati(&s, ""), turno(&stati(&s, ""), &eventi(s.eventi, s.battute, senza_file)))
        };
        tx.send(turno(&prima, r#"{"evento": "inizio"}"#)).map_err(|e| e.to_string())?;
        suona(&mut mondo, 5.0, &mut pcm);
        t += 5.0;
        tx.send(poi).map_err(|e| e.to_string())?;
        note.push_str(&format!("  {}  l’evento{}\n", orario(t), if finale { " (il finale «Vivi»; la riga del registro fra 44 s)" } else { "" }));
        if s.titolo.starts_with("Il Piccolo") {
            // l’anello gira; poi si parla con lui; poi si resta in silenzio; poi «Lascia stare»
            suona(&mut mondo, 10.0, &mut pcm);
            t += 10.0;
            let nodo = |n: &str| format!(r#", "dialogo": "eco", "nodo": "{n}""#);
            tx.send(turno(&stati(&s, &nodo("domanda")), &eventi(r#"{"evento": "dialogo", "con": "eco", "nodo": "domanda"}"#, r#""NV-08-piccolo""#, senza_file)))
                .map_err(|e| e.to_string())?;
            note.push_str(&format!("  {}  «parla con l’eco»: la domanda continua a girare\n", orario(t)));
            suona(&mut mondo, 9.0, &mut pcm);
            t += 9.0;
            tx.send(turno(&stati(&s, &nodo("taciuto")), &eventi(r#"{"evento": "nodo", "con": "eco", "nodo": "taciuto"}"#, r#""NV-07c-navarca-dormi""#, senza_file)))
                .map_err(|e| e.to_string())?;
            note.push_str(&format!("  {}  «resta in silenzio»: l’ultimo giro, poi il Navarca\n", orario(t)));
            suona(&mut mondo, 12.0, &mut pcm);
            t += 12.0;
            tx.send(turno(&stati(&s, ""), r#"{"evento": "dialogo_fine", "con": "eco"}"#)).map_err(|e| e.to_string())?;
            note.push_str(&format!("  {}  «Lascia stare»\n", orario(t)));
            suona(&mut mondo, 3.0, &mut pcm);
            t += 3.0;
        } else {
            suona(&mut mondo, s.durata, &mut pcm);
            t += s.durata;
        }
        // una pausa fra un’eco e l’altra
        suona(&mut mondo, 1.5, &mut pcm);
        t += 1.5;
        note.push('\n');
    }
    let nome = if solo { "echi-filo" } else if senza { "echi-senza-filo" } else { "echi" };
    scrivi_wav(&uscita.join(format!("{nome}.wav")), &pcm).map_err(|e| e.to_string())?;
    std::fs::write(uscita.join(format!("{nome}.txt")), note).map_err(|e| e.to_string())?;
    println!("{nome}.wav: {}", orario(t));
    Ok(())
}
