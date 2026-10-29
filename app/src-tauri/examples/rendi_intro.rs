//! Rende su file WAV il suono dell'intro (09-intro-storyboard.md), con lo stesso motore che suona
//! nell'app, e dice il livello di ogni scena. I momenti dell'animatic arrivano da un file JSON
//! (`node strumenti/intro/momenti.mjs > momenti.json`), così il rendering segue i tempi di scaletta.ts.
//! La voce di L.V. e il tema vengono dai file di `audio/musica-ia/` (con SENZA_FILE, senza).
//!
//!   cargo run --release --example rendi_intro -- <momenti.json> <cartella d'uscita>

mod comune;

use std::path::PathBuf;

use comune::{scrivi_wav, SR};
use kira::Frame;
use relitto_lib::mondo::intro::DatiIntro;
use relitto_lib::mondo::{Comando, Mondo};

fn main() -> Result<(), String> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let json = std::fs::read_to_string(args.first().ok_or("serve il file dei momenti")?).map_err(|e| e.to_string())?;
    let uscita = PathBuf::from(args.get(1).map(String::as_str).unwrap_or("rendering"));
    std::fs::create_dir_all(&uscita).map_err(|e| e.to_string())?;
    let dati: DatiIntro = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    let durata = dati.durata + 3.0;

    let (mut mondo, tx, _) = Mondo::nuovo(SR, 31);
    if std::env::var_os("SENZA_FILE").is_none() {
        mondo.cartella_musica(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../audio/musica-ia"));
    }
    tx.send(Comando::Intro(Some(dati.clone()))).map_err(|e| e.to_string())?;
    // il primo blocco fa partire la decodifica dei file; nella realtà ha dieci secondi, qui li si aspetta
    let mut buf = vec![Frame::ZERO; 128];
    mondo.rendi(&mut buf[..1], 1.0 / SR as f64);
    std::thread::sleep(std::time::Duration::from_millis(2500));
    let n = (durata * SR) as usize;
    let mut pcm: Vec<i16> = Vec::with_capacity(n * 2);
    let mut i = 0;
    while i < n {
        let k = 128.min(n - i);
        mondo.rendi(&mut buf[..k], 1.0 / SR as f64);
        for f in &buf[..k] {
            pcm.push((f.left.clamp(-1.0, 1.0) * 32767.0).round() as i16);
            pcm.push((f.right.clamp(-1.0, 1.0) * 32767.0).round() as i16);
        }
        i += k;
    }
    scrivi_wav(&uscita.join("intro.wav"), &pcm).map_err(|e| e.to_string())?;
    // il livello di ogni scena (valore efficace e picco, dBFS)
    let m = &dati.momenti;
    let scene = [
        ("A  la traccia", 0.0, m.battito[1]),
        ("B  il margine", m.battito[1], m.radar[0]),
        ("C  il radar", m.radar[0], m.faro),
        ("D  il faro", m.faro, m.scala[0]),
        ("E  la scala", m.scala[0], m.fruscio_f),
        ("F  la traccia 2", m.fruscio_f, m.spia_spenta),
        ("G  il titolo", m.glifi[0], m.raccordo[0]),
        ("H  la plancia", m.raccordo[0], dati.durata),
    ];
    for (nome, a, b) in scene {
        let (da, fino) = ((a * SR) as usize * 2, ((b * SR) as usize * 2).min(pcm.len()));
        let x = &pcm[da.min(fino)..fino];
        let e: f64 = x.iter().map(|v| (*v as f64 / 32768.0).powi(2)).sum::<f64>() / x.len().max(1) as f64;
        let picco = x.iter().map(|v| v.unsigned_abs()).max().unwrap_or(0) as f32 / 32768.0;
        println!("{nome:<16} {a:>6.1}–{b:>6.1} s   efficace {:>6.1} dBFS   picco {:>6.1} dBFS", 10.0 * (e + 1e-20).log10(), 20.0 * (picco + 1e-9).log10());
    }
    Ok(())
}
