//! Misura ogni generatore del mondo sonoro da solo: il valore efficace e il picco,
//! e per i colpi anche la durata. Serve a tarare le normalizzazioni interne, prima
//! dei livelli del mix (che si tarano in LUFS sui rendering).
//!
//!   cargo run --release --example misura_strati

use relitto_lib::mondo::brusio::Brusio;
use relitto_lib::mondo::colpi::{self, Bus, Colpo, Corpo, Lastra};
use relitto_lib::mondo::dsp::{Caso, Rosa};
use relitto_lib::mondo::fiato::Fiato;
use relitto_lib::mondo::fondi::{Pompe, Ventilazione, Ventola};
use relitto_lib::mondo::voce::Voce;

const SR: f32 = 48000.0;

fn riassumi(nome: &str, x: &[f32]) {
    let n = x.len().max(1) as f64;
    let rms = (x.iter().map(|v| (*v as f64) * (*v as f64)).sum::<f64>() / n).sqrt();
    let picco = x.iter().fold(0.0f32, |m, v| m.max(v.abs()));
    println!(
        "{nome:<28} rms {:>8.4} ({:>6.1} dB)  picco {:>8.4} ({:>6.1} dB)  {:>6.2} s",
        rms,
        20.0 * (rms + 1e-12).log10(),
        picco,
        20.0 * (picco as f64 + 1e-12).log10(),
        x.len() as f32 / SR
    );
}

fn continuo(nome: &str, secondi: f32, mut f: impl FnMut() -> f32) {
    let n = (secondi * SR) as usize;
    let x: Vec<f32> = (0..n).map(|_| f()).collect();
    // si salta il primo secondo, mentre i filtri si assestano
    riassumi(nome, &x[(SR as usize).min(n)..]);
    // con RELITTO_STRATI=<cartella> scrive anche il file, per guardarne lo spettro
    if let Ok(cartella) = std::env::var("RELITTO_STRATI") {
        let percorso = std::path::Path::new(&cartella).join(format!("{}.wav", nome.replace(' ', "-")));
        let _ = scrivi_wav(&percorso, &x);
    }
}

fn scrivi_wav(percorso: &std::path::Path, x: &[f32]) -> std::io::Result<()> {
    use std::io::Write;
    let mut f = std::io::BufWriter::new(std::fs::File::create(percorso)?);
    let dati = (x.len() * 2) as u32;
    f.write_all(b"RIFF")?;
    f.write_all(&(36 + dati).to_le_bytes())?;
    f.write_all(b"WAVEfmt ")?;
    f.write_all(&16u32.to_le_bytes())?;
    f.write_all(&1u16.to_le_bytes())?;
    f.write_all(&1u16.to_le_bytes())?;
    f.write_all(&(SR as u32).to_le_bytes())?;
    f.write_all(&(SR as u32 * 2).to_le_bytes())?;
    f.write_all(&2u16.to_le_bytes())?;
    f.write_all(&16u16.to_le_bytes())?;
    f.write_all(b"data")?;
    f.write_all(&dati.to_le_bytes())?;
    for v in x {
        f.write_all(&((v.clamp(-1.0, 1.0) * 32767.0).round() as i16).to_le_bytes())?;
    }
    f.flush()
}

fn colpo(nome: &str, corpo: Corpo, caso: &mut Caso) {
    let mut c = Colpo::nuovo(corpo, Bus::Esterno, 0.0, 0.0, 0.0, SR);
    let mut x = Vec::new();
    while let Some((l, _)) = c.campione(caso) {
        x.push(l);
        if x.len() > 30 * SR as usize {
            break;
        }
    }
    riassumi(nome, &x);
}

fn main() {
    let mut caso = Caso::nuovo(1);
    let mut rosa = Rosa::default();
    continuo("rosa", 20.0, || rosa.campione(caso.bianco()));

    let mut v = Ventilazione::nuova(SR, 3);
    v.g = relitto_lib::mondo::dsp::Scorrevole::nuovo(1.0);
    continuo("ventilazione", 30.0, || v.campione().0);

    let mut p = Pompe::nuove(SR, 4);
    p.g = relitto_lib::mondo::dsp::Scorrevole::nuovo(1.0);
    continuo("pompe", 30.0, || p.campione().0);

    let mut k = Ventola::nuova(SR, 5);
    k.g = relitto_lib::mondo::dsp::Scorrevole::nuovo(1.0);
    continuo("ventola", 20.0, || k.campione());

    for (nome, aria) in [("fiato verde", 90.0), ("fiato ambra", 50.0), ("fiato rosso", 25.0), ("fiato ipossia", 10.0)] {
        let mut f = Fiato::nuovo(SR, 6);
        f.acceso = true;
        f.aria = aria;
        continuo(nome, 60.0, || f.campione());
    }

    let mut voce = Voce::nuova(SR, 7, 120.0, 0.85, 1.0, 0.08);
    continuo("una voce", 30.0, || voce.campione());

    let mut b = Brusio::nuovo(SR, 8);
    b.quanti = relitto_lib::mondo::dsp::Scorrevole::nuovo(16.0);
    b.guadagno = relitto_lib::mondo::dsp::Scorrevole::nuovo(1.0);
    continuo("brusio 16", 30.0, || b.campione().0);

    let lastra = Lastra::a_caso((380.0, 1100.0), (0.25, 0.7), &mut caso);
    for _ in 0..3 {
        let c = colpi::lamiera(&lastra, &mut caso, SR);
        colpo("lamiera", c, &mut caso);
    }
    let c = colpi::rele(true, &mut caso, SR);
    colpo("relè chiude", c, &mut caso);
    let c = colpi::rele(false, &mut caso, SR);
    colpo("relè apre", c, &mut caso);
    let c = colpi::stivale(true, &mut caso, SR);
    colpo("stivale appoggio", c, &mut caso);
    let c = colpi::stivale(false, &mut caso, SR);
    colpo("stivale stacco", c, &mut caso);
    let c = colpi::spinta(&mut caso, SR);
    colpo("spinta", c, &mut caso);
    let c = colpi::arpione(&mut caso, SR);
    colpo("arpione", c, &mut caso);
    for _ in 0..2 {
        let c = colpi::urto_lungo(&mut caso, SR);
        colpo("urto lungo", c, &mut caso);
    }
    for _ in 0..3 {
        let c = colpi::gemito(&mut caso, SR);
        colpo("gemito", c, &mut caso);
    }
    for _ in 0..2 {
        let c = colpi::cigolio(&mut caso, SR);
        colpo("cigolio", c, &mut caso);
    }
    for _ in 0..3 {
        let c = colpi::goccia(&mut caso, SR);
        colpo("goccia", c, &mut caso);
    }
    let c = colpi::granello(&mut caso, SR);
    colpo("granello", c, &mut caso);
    let c = colpi::crepa(&mut caso, SR);
    colpo("crepa", c, &mut caso);
    let c = colpi::tic(0.0, SR);
    colpo("tic", c, &mut caso);
    let c = colpi::nota(880.0, 0.14, SR);
    colpo("nota", c, &mut caso);

    // i colpi degli eventi del gioco
    use relitto_lib::mondo::stanze::Superficie as S;
    for (nome, s) in [
        ("passo lamiera", S::Lamiera),
        ("passo tappeto", S::Tappeto),
        ("passo grigliato", S::Grigliato),
        ("passo osso", S::Osso),
        ("passo filamenti", S::Filamenti),
        ("passo morbido", S::Morbido),
        ("passo pietra", S::Pietra),
        ("passo cristallo", S::Cristallo),
        ("passo brina", S::Brina),
        ("passo polvere", S::Polvere),
        ("passo vibrante", S::Vibrante),
        ("passo navata", S::Navata),
        ("passo sbriciola", S::Sbriciola),
    ] {
        let c = colpi::passo(s, &mut caso, SR).unwrap();
        colpo(nome, c, &mut caso);
    }
    let c = colpi::gong(&mut caso, SR);
    colpo("gong", c, &mut caso);
    let c = colpi::sonaglio(&mut caso, SR);
    colpo("sonaglio", c, &mut caso);
    colpo("salita", colpi::salita(35.0, 90.0, 2.6, 1.0, SR), &mut caso);
    let c = colpi::crollo(&mut caso, SR);
    colpo("crollo", c, &mut caso);
    colpo("vetro", colpi::vetro(415.0, SR), &mut caso);
    let c = colpi::pietra(&mut caso, SR);
    colpo("pietra", c, &mut caso);
    let c = colpi::granelli_acuti(&mut caso, SR);
    colpo("granelli acuti", c, &mut caso);
    let c = colpi::scarica(&mut caso, SR);
    colpo("scarica", c, &mut caso);
    colpo("svuota", colpi::svuota(SR), &mut caso);
    colpo("riempie", colpi::riempie(SR), &mut caso);
    let c = colpi::sibilo(2.8, &mut caso, SR);
    colpo("sibilo", c, &mut caso);
    let c = colpi::getto(1.4, &mut caso, SR);
    colpo("getto", c, &mut caso);
    let c = colpi::sintonia(&mut caso, SR);
    colpo("sintonia", c, &mut caso);
    let c = colpi::frustata(&mut caso, SR);
    colpo("frustata", c, &mut caso);
    let c = colpi::pagina(&mut caso, SR);
    colpo("pagina", c, &mut caso);
    let c = colpi::tessuto(&mut caso, SR);
    colpo("tessuto", c, &mut caso);
    let c = colpi::cerniera(&mut caso, SR);
    colpo("cerniera", c, &mut caso);
    let c = colpi::chiusura(&mut caso, SR);
    colpo("chiusura", c, &mut caso);
    colpo("anello", colpi::anello(SR), &mut caso);
    colpo("pressione", colpi::pressione(SR), &mut caso);
    colpo("colpo d'aria", colpi::colpo_d_aria(SR), &mut caso);
    let c = colpi::ghiera(&mut caso, SR);
    colpo("ghiera", c, &mut caso);
    let c = colpi::chiave(&mut caso, SR);
    colpo("chiave", c, &mut caso);
    let c = colpi::connettore(&mut caso, SR);
    colpo("connettore", c, &mut caso);
    let c = colpi::motorino(&mut caso, SR);
    colpo("motorino", c, &mut caso);
    let c = colpi::taglierina_nel_guanto(1.8, &mut caso, SR);
    colpo("taglierina guanto", c, &mut caso);
    let c = colpi::sfrigolio(&mut caso, SR);
    colpo("sfrigolio", c, &mut caso);
    let c = colpi::gancio(&mut caso, SR);
    colpo("gancio", c, &mut caso);
    colpo("squelch", colpi::squelch(SR), &mut caso);
    colpo("soffio vetroso", colpi::soffio_vetroso(SR), &mut caso);
    colpo("accensione", colpi::accensione(SR), &mut caso);
    let c = colpi::polvere(&mut caso, SR);
    colpo("polvere", c, &mut caso);
    let c = colpi::scatto(&mut caso, SR);
    colpo("scatto", c, &mut caso);
    colpo("ottone", colpi::ottone(SR), &mut caso);
}
