//! Rende i tre ambienti del prototipo su file WAV, per ascoltarli e per misurarli,
//! con lo stesso motore che suona nell’app (src/mondo).
//!
//!   cargo run --release --example rendi_ambienti -- <cartella d’uscita> [strato]
//!
//! Con uno strato («re», «ventilazione», «fiato», «brusio»…) rende solo quello: serve
//! a tarare i livelli. Le scene seguono la bibbia sonora, §8.1.

use std::io::Write;
use std::path::{Path, PathBuf};

use kira::Frame;
use relitto_lib::mondo::campioni::Banca;
use relitto_lib::mondo::{Ambiente, Comando, Evento, Mondo, Nave};

const SR: f32 = 48000.0;

struct Scena {
    nome: &'static str,
    durata: f32,
    comandi: Vec<(f32, Comando)>,
}

fn scene() -> Vec<Scena> {
    use Comando as C;
    let mut scafo = vec![
        (0.0, C::Ambiente(Ambiente::Scafo)),
        (0.0, C::Aria(100.0)),
        (0.0, C::Rampa(1.0)),
        (4.0, C::Cammina(true)),
        (16.0, C::Cammina(false)),
        (40.0, C::Evento(Evento::Sorpresa)),
        (50.0, C::Aria(55.0)),
        (68.0, C::Aria(25.0)),
        (86.0, C::Aria(12.0)),
        (100.0, C::Aria(4.0)),
    ];
    // ci si allontana dalla rampa camminando: il re nelle ossa si spegne
    for k in 0..=10 {
        scafo.push((5.0 + k as f32, C::Rampa(1.0 - k as f32 / 10.0)));
    }
    vec![
        Scena {
            nome: "plancia",
            durata: 80.0,
            comandi: vec![
                (0.0, C::Ambiente(Ambiente::Plancia)),
                (28.0, C::Nave(Nave::Accostata)),
                (44.0, C::Nave(Nave::Agganciata)),
            ],
        },
        Scena { nome: "scafo", durata: 115.0, comandi: scafo },
        Scena {
            nome: "vestibolo",
            durata: 95.0,
            comandi: vec![
                (0.0, C::Ambiente(Ambiente::Vestibolo)),
                (0.0, C::Aria(80.0)),
                (3.0, C::Evento(Evento::PrimoContatto)),
                (18.0, C::Evento(Evento::ToccaVenature)),
                (28.0, C::Evento(Evento::Gemito)),
                (38.0, C::Evento(Evento::SalaTace)),
                (50.0, C::Evento(Evento::Goccia)),
                (58.0, C::Aria(28.0)),
                (76.0, C::Aria(45.0)),
            ],
        },
    ]
}

fn scrivi_wav(percorso: &Path, pcm: &[i16]) -> std::io::Result<()> {
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

fn rendi(banca: &Banca, scena: &Scena, solo: Option<&str>, uscita: &Path) -> Result<f64, String> {
    let (mut mondo, tx, _stato) = Mondo::nuovo(banca, SR, 7)?;
    if let Some(s) = solo {
        tx.send(Comando::Solo(Some(s.to_string()))).map_err(|e| e.to_string())?;
    }
    let mut comandi = scena.comandi.clone();
    comandi.sort_by(|a, b| a.0.total_cmp(&b.0));
    let blocco = 128;
    let dt = 1.0 / SR as f64;
    let n = (scena.durata * SR) as usize;
    let mut buf = vec![Frame::ZERO; blocco];
    let mut pcm: Vec<i16> = Vec::with_capacity(n * 2);
    let (mut i, mut c) = (0, 0);
    let t0 = std::time::Instant::now();
    while i < n {
        let t = i as f32 / SR;
        while c < comandi.len() && comandi[c].0 <= t {
            tx.send(comandi[c].1.clone()).map_err(|e| e.to_string())?;
            c += 1;
        }
        let k = blocco.min(n - i);
        mondo.rendi(&mut buf[..k], dt);
        for f in &buf[..k] {
            pcm.push((f.left.clamp(-1.0, 1.0) * 32767.0).round() as i16);
            pcm.push((f.right.clamp(-1.0, 1.0) * 32767.0).round() as i16);
        }
        i += k;
    }
    let secondi = t0.elapsed().as_secs_f64();
    scrivi_wav(uscita, &pcm).map_err(|e| e.to_string())?;
    // quanto più veloce del tempo reale: la misura della CPU del motore
    Ok(scena.durata as f64 / secondi)
}

fn main() -> Result<(), String> {
    let argomenti: Vec<String> = std::env::args().skip(1).collect();
    let uscita = PathBuf::from(argomenti.first().map(String::as_str).unwrap_or("rendering"));
    let solo = argomenti.get(1).map(String::as_str);
    std::fs::create_dir_all(&uscita).map_err(|e| e.to_string())?;
    let radice = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("risorse/audio/prototipo");
    let t0 = std::time::Instant::now();
    let banca = Banca::carica(&radice)?;
    println!(
        "banca: {} campioni, {:.1} MB in memoria, caricata in {:.2} s",
        banca.quanti(),
        banca.memoria() as f64 / 1e6,
        t0.elapsed().as_secs_f64()
    );
    for s in scene() {
        let nome = match solo {
            Some(x) => format!("{}-solo-{}.wav", s.nome, x),
            None => format!("{}.wav", s.nome),
        };
        let volte = rendi(&banca, &s, solo, &uscita.join(&nome))?;
        println!("{nome}: {:.0} s di audio, {:.0} volte il tempo reale", s.durata, volte);
    }
    Ok(())
}
