//! Rende su file WAV la musica del gioco (documento 21), brano per brano, con lo stesso
//! motore che suona nell’app: il menu, le soglie degli atti, l’Anziano nodo per nodo, le
//! chiusure dei finali. Accanto a ogni file scrive le note (che cosa succede a che secondo).
//! Il mondo è muto (nessuna stanza): si sente solo la musica, con la sua sala.
//!
//!   cargo run --release --example rendi_musica -- <cartella d’uscita> [nome]
//!
//! Con la variabile SOLO_MUSICA impostata, il mondo (la plancia del risveglio, per le
//! chiusure) resta muto: si sente soltanto la musica.
//!
//! I nomi: menu, atti, anziano, vivi, prima-nota, stiva-piena, doppio-fondo, due-lettere,
//! mani-vuote (che non ha musica: serve a controllare che resti il silenzio).

mod comune;

use std::path::PathBuf;

use comune::{orario, scrivi_wav, SR};
use kira::Frame;
use relitto_lib::mondo::{Comando, Mondo};

/// Un turno del gioco, scritto a mano: nessuna stanza (il mondo tace), l’atto, il dialogo.
fn turno(atto: u32, dialogo: Option<(&str, &str)>, eventi: &str) -> Comando {
    let dialogo = match dialogo {
        Some((chi, nodo)) => format!(r#""dialogo": "{chi}", "nodo": "{nodo}","#),
        None => String::new(),
    };
    let json = format!(r#"{{"stati": {{"stanza": "", "atto": {atto}, {dialogo} "esito": "in_corso"}}, "eventi": [{eventi}]}}"#);
    Comando::Turno(serde_json::from_str(&json).expect("il turno è scritto male"))
}

struct Pezzo {
    nome: &'static str,
    durata: f32,
    comandi: Vec<(f32, Comando, String)>,
}

fn pezzi() -> Vec<Pezzo> {
    let ev = |nome: &str| format!(r#"{{"evento": "{nome}"}}"#);
    let finale = |quale: &str| format!(r#"{{"evento": "finale", "finale": "{quale}"}}"#);

    // l’Anziano: i nodi della conversazione, nell’ordine di uno dei percorsi, con qualche deviazione
    let anziano_nodi = [
        (0.0, "benvenuto"),
        (22.0, "salto"),
        (44.0, "memoria"),
        (66.0, "altro"),
        (86.0, "tracce"),
        (106.0, "benvenuto"),
        (112.0, "silenzio"),
        (134.0, "sangue"),
        (154.0, "musica"),
        (184.0, "congedo"),
        (206.0, "dissolvenza"),
        (224.0, "ultima voce"),
    ];
    let mut anziano: Vec<(f32, Comando, String)> = vec![(0.0, turno(4, Some(("anziano", "benvenuto")), r#"{"evento": "dialogo", "con": "anziano", "nodo": "benvenuto"}"#), "l’Anziano comincia · benvenuto".into())];
    for (t, nodo) in anziano_nodi.iter().skip(1) {
        anziano.push((*t, turno(4, Some(("anziano", nodo)), &format!(r#"{{"evento": "nodo", "con": "anziano", "nodo": "{nodo}"}}"#)), format!("nodo «{nodo}»")));
    }
    anziano.push((244.0, turno(5, None, r#"{"evento": "dialogo_fine", "con": "anziano"}"#), "«[Apri gli occhi.]»: finisce il dialogo".into()));

    let chiusura = |nome: &'static str, quale: &'static str, durata: f32| Pezzo {
        nome,
        durata,
        comandi: vec![
            (0.0, turno(5, None, &ev("inizio")), "la partita comincia (il primo turno non suona i suoi eventi)".into()),
            (1.0, turno(5, None, &finale(quale)), format!("finale «{quale}»: la musica entra dopo il silenzio del mondo")),
        ],
    };

    vec![
        Pezzo { nome: "menu", durata: 330.0, comandi: vec![(0.0, Comando::Menu(true), "il menu principale: due cicli".into())] },
        Pezzo {
            nome: "atti",
            durata: 100.0,
            comandi: vec![
                (0.0, turno(1, None, &ev("inizio")), "Atto I: comincia, niente soglia".into()),
                (6.0, turno(2, None, ""), "Atto II".into()),
                (26.0, turno(3, None, ""), "Atto III".into()),
                (46.0, turno(4, None, ""), "Atto IV".into()),
                (70.0, turno(5, None, ""), "Atto V: la fuga".into()),
            ],
        },
        Pezzo { nome: "anziano", durata: 270.0, comandi: anziano },
        chiusura("vivi", "vivi", 90.0),
        chiusura("prima-nota", "prima-nota", 95.0),
        chiusura("stiva-piena", "stiva-piena", 100.0),
        chiusura("doppio-fondo", "doppio-fondo", 85.0),
        chiusura("due-lettere", "due-lettere", 90.0),
        chiusura("mani-vuote", "mani-vuote", 60.0),
    ]
}

fn rendi(p: &Pezzo, uscita: &std::path::Path) -> Result<(), String> {
    let (mut mondo, tx, _) = Mondo::nuovo(SR, 23);
    // con il mondo vero sotto, la musica non si sente da sola: quando serve (il secondo argomento
    // `solo`), si isola
    if std::env::var("SOLO_MUSICA").is_ok() {
        tx.send(Comando::Solo(Some("musica".to_string()))).map_err(|e| e.to_string())?;
    }
    let mut buf = vec![Frame::ZERO; 128];
    let dt = 1.0 / SR as f64;
    let n = (p.durata * SR) as usize;
    let mut pcm: Vec<i16> = Vec::with_capacity(n * 2);
    let (mut i, mut c) = (0, 0);
    let mut note = format!("{}\n\n", p.nome);
    while i < n {
        let t = i as f32 / SR;
        while c < p.comandi.len() && p.comandi[c].0 <= t {
            tx.send(p.comandi[c].1.clone()).map_err(|e| e.to_string())?;
            note.push_str(&format!("{}  {}\n", orario(t), p.comandi[c].2));
            c += 1;
        }
        let k = 128.min(n - i);
        mondo.rendi(&mut buf[..k], dt);
        for f in &buf[..k] {
            pcm.push((f.left.clamp(-1.0, 1.0) * 32767.0).round() as i16);
            pcm.push((f.right.clamp(-1.0, 1.0) * 32767.0).round() as i16);
        }
        i += k;
    }
    scrivi_wav(&uscita.join(format!("{}.wav", p.nome)), &pcm).map_err(|e| e.to_string())?;
    std::fs::write(uscita.join(format!("{}.txt", p.nome)), note).map_err(|e| e.to_string())?;
    println!("{}.wav: {:.0} s", p.nome, p.durata);
    Ok(())
}

fn main() -> Result<(), String> {
    let argomenti: Vec<String> = std::env::args().skip(1).collect();
    let uscita = PathBuf::from(argomenti.first().map(String::as_str).unwrap_or("rendering"));
    let quale = argomenti.get(1).map(String::as_str);
    std::fs::create_dir_all(&uscita).map_err(|e| e.to_string())?;
    for p in pezzi() {
        if quale.is_some_and(|q| q != p.nome) {
            continue;
        }
        rendi(&p, &uscita)?;
    }
    Ok(())
}
