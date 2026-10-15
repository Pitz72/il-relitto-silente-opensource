//! Rende su file WAV i tre ambienti del prototipo e un campionario dei suoni uno per
//! uno, per ascoltarli e per misurarli, con lo stesso motore che suona nell’app
//! (src/mondo). Tutto è sintetizzato: non serve nessun file.
//!
//!   cargo run --release --example rendi_ambienti -- <cartella d’uscita> [strato] [scena]
//!
//! Con uno strato («re», «ventilazione», «fiato», «brusio»…; «tutti» per nessun
//! filtro) rende solo quello: serve a tarare i livelli. Con il nome di una scena
//! rende solo quella. Le scene seguono la bibbia sonora, §8.1.

use std::io::Write;
use std::path::{Path, PathBuf};

use kira::Frame;
use relitto_lib::mondo::{Ambiente, Comando, Evento, Mondo, Nave};

const SR: f32 = 48000.0;

struct Scena {
    nome: &'static str,
    durata: f32,
    comandi: Vec<(f32, Comando)>,
}

fn prova(nome: &str) -> Comando {
    Comando::Prova(nome.to_string())
}

fn solo(nome: Option<&str>) -> Comando {
    Comando::Solo(nome.map(str::to_string))
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

    // il campionario: ogni suono da solo, con le pause per sentirlo finire
    let mut c: Vec<(f32, Comando)> = vec![
        (0.0, C::Ambiente(Ambiente::Plancia)),
        (0.0, solo(Some("re"))),
        (8.0, solo(Some("ventilazione"))),
        (16.0, solo(Some("pompe"))),
        (24.0, solo(Some("voci"))),
    ];
    for (t, nome) in [
        (25.0, "lamiera"),
        (27.0, "lamiera"),
        (29.0, "lamiera"),
        (31.0, "lamiera"),
        (33.5, "rele"),
        (37.0, "rele"),
        (40.5, "cigolio"),
        (43.5, "cigolio"),
        (47.0, "spinta"),
        (48.4, "spinta"),
        (50.5, "arpione"),
        (53.0, "arpione"),
        (56.0, "urto"),
    ] {
        c.push((t, prova(nome)));
    }
    c.extend([
        (61.0, C::Ambiente(Ambiente::Scafo)),
        (61.0, C::Aria(100.0)),
        (61.0, solo(Some("ventola"))),
        (67.0, solo(Some("fiato"))),
        (89.0, C::Aria(50.0)),
        (104.0, C::Aria(25.0)),
        (119.0, C::Aria(10.0)),
        (136.0, C::Aria(80.0)),
        (138.0, C::Evento(Evento::Sorpresa)),
        (145.0, solo(Some("voci"))),
        (145.0, C::Rampa(0.0)),
        (145.5, C::Cammina(true)),
        (152.0, C::Cammina(false)),
        (153.0, C::Ambiente(Ambiente::Vestibolo)),
        (153.0, solo(Some("brusio"))),
        (153.5, prova("una_voce")),
        (163.0, prova("coro")),
        (180.0, solo(Some("voci"))),
    ]);
    for (t, nome) in [
        (181.0, "goccia"),
        (182.6, "goccia"),
        (184.1, "goccia"),
        (185.9, "goccia"),
        (188.0, "granello"),
        (191.0, "granello"),
        (194.5, "crepa"),
        (196.5, "crepa"),
        (198.5, "crepa"),
        (201.0, "gemito"),
        (209.0, "gemito"),
    ] {
        c.push((t, prova(nome)));
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
        Scena { nome: "campionario", durata: 218.0, comandi: c },
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

fn rendi(scena: &Scena, solo: Option<&str>, uscita: &Path) -> Result<f64, String> {
    let (mut mondo, tx, _stato) = Mondo::nuovo(SR, 7);
    if let Some(s) = solo {
        tx.send(Comando::Solo(Some(s.to_string()))).map_err(|e| e.to_string())?;
    }
    let mut comandi = scena.comandi.clone();
    comandi.sort_by(|a, b| a.0.total_cmp(&b.0));
    // con uno strato chiesto da fuori, la scena non cambia la maschera
    if solo.is_some() {
        comandi.retain(|(_, c)| !matches!(c, Comando::Solo(_)));
    }
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
    let solo = argomenti.get(1).map(String::as_str).filter(|s| *s != "tutti");
    let quale = argomenti.get(2).map(String::as_str);
    std::fs::create_dir_all(&uscita).map_err(|e| e.to_string())?;
    for s in scene() {
        if quale.is_some_and(|q| q != s.nome) {
            continue;
        }
        let nome = match solo {
            Some(x) => format!("{}-solo-{}.wav", s.nome, x),
            None => format!("{}.wav", s.nome),
        };
        let volte = rendi(&s, solo, &uscita.join(&nome))?;
        println!("{nome}: {:.0} s di audio, {:.0} volte il tempo reale", s.durata, volte);
    }
    Ok(())
}
