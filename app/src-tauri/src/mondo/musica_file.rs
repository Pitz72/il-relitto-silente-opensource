//! Il lettore dei file di musica (documento 22, §7): suona i diciotto MP3 di
//! `audio/musica-ia/` che il gioco usa, generati con Lyria 3.5 e con Suno e scelti dall’autore.
//! Dal 29 ottobre 2026 ne suona due anche l’intro, con un lettore suo (`intro.rs`): il tema della
//! Santa Maria e la voce di L.V.
//! Il file è la base e non si ritocca (22, §7.1): qui si decide soltanto *quando* entra, *quanto*
//! suona, come si incrocia con il successivo e come se ne va.
//!
//! Il lettore non ha il riverbero della sala: i file hanno già il loro (22, §7, punto 3). Passa
//! però dal cursore «Musica» e dalla pausa, come la musica sintetizzata, che resta nel codice
//! come ripiego (`musica.rs`): se un file manca o non si decodifica, suona il vecchio brano.
//!
//! I file si decodificano **fuori dal thread audio**, a richiesta, e si tengono in memoria solo
//! finché servono (un MP3 di tre minuti, stereo a 16 bit, pesa circa 32 MB). Fuori dal thread
//! audio stanno anche la ricerca dei file sul disco (una volta sola, quando nasce la biblioteca) e
//! la liberazione dei pezzi che non servono più: un solo thread di lavoro decodifica e butta
//! (revisione 25, M5). Il thread audio manda soltanto messaggi.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::mpsc::{channel, Receiver, Sender};
use std::sync::Arc;

use kira::sound::static_sound::StaticSoundData;

use super::dsp::{db, Scorrevole};

/// Il livello a cui ogni pezzo viene portato, in dBFS di valore efficace, prima del livello del
/// brano. I file arrivano da −11 a −18 LUFS, con picchi fino a +0,7 dBFS (22, §5): il motore li
/// abbassa tutti allo stesso punto, e il limitatore del mixer fa il resto.
pub const OBIETTIVO_DB: f32 = -27.0;

/// Un pezzo, cioè un file scelto: la sigla della scheda del documento 22 e il suo MP3.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Pezzo {
    /// il menu: «Bare Resonance» e «Resonant Void»
    M1a,
    M1b,
    /// le soglie degli atti II–V
    S2,
    S3,
    S4,
    S5,
    /// i quattro letti dell’Anziano
    A1,
    A2,
    A3,
    A4,
    /// le chiusure dei finali: Vivi, La prima nota, La stiva piena, Doppio fondo, Due lettere
    C1,
    C2,
    C3,
    C4,
    C5,
    /// il tema: «Hull of the Ancient» e «Held by the Dark»
    T1,
    T2,
    /// i titoli di coda: la canzone «Voice in the Deep» (22, §5.9)
    CT,
    /// l’intro (09, §13): «The Santa Maria Theme» di Alirio Bruni, dal Mistero della Santa Maria
    SM,
    /// l’intro: la voce di L.V., tutta la traccia in un file, che si suona a pezzi
    LV,
    /// l’Anziano (32, §3.6–3.7): il canto del primo contatto, la sua lingua prima delle parole
    CA,
    /// l’Anziano: le battute con la voce (ElevenLabs, «Edoardo Straniero»), una per file: le prime tre del 2
    /// novembre 2026 (il congedo rifatto il 7), le altre ventitré del 7 novembre (documento 33, RN-H1)
    AN1,
    AN2,
    AN3,
    An04,
    An05,
    An06,
    An07,
    An08,
    An09,
    An10,
    An11,
    An12,
    An13,
    An14,
    An15,
    An16,
    An17,
    An18,
    An19,
    An20,
    An21,
    An22,
    An23,
    An24,
    An25,
    An26,
    /// Yusuf (documento 35, §1): le otto battute con la voce clonata dell’autore, già passate dalla radio
    Yu01,
    Yu02,
    Yu03,
    Yu04,
    Yu05,
    Yu06,
    Yu07,
    Yu08,
    /// le voci della nave (documento 35): le echi, le registrazioni dello scanner, l’ultima voce.
    /// Una battuta per file, già lavorata (`strumenti/audio/voci_nave.py`): l’aggancio, il
    /// traduttore, i vuoti stanno nel file; il motore la mette in fila e la passa dalla cuffia
    Nv01,
    Nv02,
    Nv03,
    Nv03b,
    Nv03c,
    Nv04,
    Nv05,
    Nv05b,
    Nv06,
    Nv07,
    Nv07b,
    Nv07c,
    Nv08,
    Nv08b,
    Nv09,
    Nv10,
    Nv11,
    Nv11b,
    Nv12,
    Nv12b,
    Nv12c,
    Nv13,
    Nv13b,
    Nv14,
    Nv14b,
    Nv14c,
    Nv15,
}

/// Le battute delle voci della nave e i loro file: il nome senza «.mp3» è quello che manda il
/// ponte (`VOCI_NAVE` in ponte.py).
pub const BATTUTE_NV: [(Pezzo, &str); 27] = [
    (Pezzo::Nv01, "NV-01-senza-ruolo.mp3"),
    (Pezzo::Nv02, "NV-02-capitano.mp3"),
    (Pezzo::Nv03, "NV-03-carico.mp3"),
    (Pezzo::Nv03b, "NV-03b-carico-gole.mp3"),
    (Pezzo::Nv03c, "NV-03c-carico-deve.mp3"),
    (Pezzo::Nv04, "NV-04-bordo.mp3"),
    (Pezzo::Nv05, "NV-05-botanico.mp3"),
    (Pezzo::Nv05b, "NV-05b-botanico-profondo.mp3"),
    (Pezzo::Nv06, "NV-06-medico.mp3"),
    (Pezzo::Nv07, "NV-07-navarca.mp3"),
    (Pezzo::Nv07b, "NV-07b-navarca-profondo.mp3"),
    (Pezzo::Nv07c, "NV-07c-navarca-dormi.mp3"),
    (Pezzo::Nv08, "NV-08-piccolo.mp3"),
    (Pezzo::Nv08b, "NV-08b-piccolo-mezza.mp3"),
    (Pezzo::Nv09, "NV-09-navigazione.mp3"),
    (Pezzo::Nv10, "NV-10-scriba.mp3"),
    (Pezzo::Nv11, "NV-11-custode.mp3"),
    (Pezzo::Nv11b, "NV-11b-custode-profondo.mp3"),
    (Pezzo::Nv12, "NV-12-ingegnere.mp3"),
    (Pezzo::Nv12b, "NV-12b-ingegnere-profondo.mp3"),
    (Pezzo::Nv12c, "NV-12c-ingegnere-gole.mp3"),
    (Pezzo::Nv13, "NV-13-archivista.mp3"),
    (Pezzo::Nv13b, "NV-13b-archivista-breve.mp3"),
    (Pezzo::Nv14, "NV-14-lastra.mp3"),
    (Pezzo::Nv14b, "NV-14b-cilindro.mp3"),
    (Pezzo::Nv14c, "NV-14c-stele.mp3"),
    (Pezzo::Nv15, "NV-15-ultima-voce.mp3"),
];

/// Le battute dell’Anziano con la voce e i loro file: il nome dopo «AN-nn-», senza «.mp3», è quello che manda il
/// ponte (`VOCI_ANZIANO` in ponte.py).
pub const VOCI_AN: [(Pezzo, &str); 26] = [
    (Pezzo::AN1, "AN-01-benvenuto.mp3"),
    (Pezzo::AN2, "AN-02-piccolo-vera.mp3"),
    (Pezzo::AN3, "AN-03-congedo-ascolto.mp3"),
    (Pezzo::An04, "AN-04-benvenuto-echi.mp3"),
    (Pezzo::An05, "AN-05-benvenuto-risuonatore.mp3"),
    (Pezzo::An06, "AN-06-benvenuto-risuonatore-echi.mp3"),
    (Pezzo::An07, "AN-07-silenzio.mp3"),
    (Pezzo::An08, "AN-08-salto.mp3"),
    (Pezzo::An09, "AN-09-salto-stele.mp3"),
    (Pezzo::An10, "AN-10-memoria.mp3"),
    (Pezzo::An11, "AN-11-memoria-echi.mp3"),
    (Pezzo::An12, "AN-12-memoria-forzato.mp3"),
    (Pezzo::An13, "AN-13-memoria-forzato-echi.mp3"),
    (Pezzo::An14, "AN-14-memoria-salutato.mp3"),
    (Pezzo::An15, "AN-15-altro.mp3"),
    (Pezzo::An16, "AN-16-aiuto.mp3"),
    (Pezzo::An17, "AN-17-prezzo.mp3"),
    (Pezzo::An18, "AN-18-piccolo.mp3"),
    (Pezzo::An19, "AN-19-piccolo-incerta.mp3"),
    (Pezzo::An20, "AN-20-piccolo-taciuta.mp3"),
    (Pezzo::An21, "AN-21-sangue.mp3"),
    (Pezzo::An22, "AN-22-tracce.mp3"),
    (Pezzo::An23, "AN-23-tracce-firma.mp3"),
    (Pezzo::An24, "AN-24-tracce-parola.mp3"),
    (Pezzo::An25, "AN-25-musica.mp3"),
    (Pezzo::An26, "AN-26-congedo.mp3"),
];

/// Le battute di Yusuf e i loro file: il nome senza «.mp3» è quello che manda il ponte (`VOCI_YUSUF`).
pub const VOCI_YU: [(Pezzo, &str); 8] = [
    (Pezzo::Yu01, "YU-01-apertura.mp3"),
    (Pezzo::Yu02, "YU-02-apertura-pezzo.mp3"),
    (Pezzo::Yu03, "YU-03-credito.mp3"),
    (Pezzo::Yu04, "YU-04-cosa.mp3"),
    (Pezzo::Yu05, "YU-05-qualcuno.mp3"),
    (Pezzo::Yu06, "YU-06-voce.mp3"),
    (Pezzo::Yu07, "YU-07-fuga-pezzo.mp3"),
    (Pezzo::Yu08, "YU-08-fuga-nessuno.mp3"),
];

impl Pezzo {
    pub const TUTTI: [Pezzo; 82] = [
        Pezzo::M1a,
        Pezzo::M1b,
        Pezzo::S2,
        Pezzo::S3,
        Pezzo::S4,
        Pezzo::S5,
        Pezzo::A1,
        Pezzo::A2,
        Pezzo::A3,
        Pezzo::A4,
        Pezzo::C1,
        Pezzo::C2,
        Pezzo::C3,
        Pezzo::C4,
        Pezzo::C5,
        Pezzo::T1,
        Pezzo::T2,
        Pezzo::CT,
        Pezzo::SM,
        Pezzo::LV,
        Pezzo::CA,
        Pezzo::AN1,
        Pezzo::AN2,
        Pezzo::AN3,
        Pezzo::Nv01,
        Pezzo::Nv02,
        Pezzo::Nv03,
        Pezzo::Nv03b,
        Pezzo::Nv03c,
        Pezzo::Nv04,
        Pezzo::Nv05,
        Pezzo::Nv05b,
        Pezzo::Nv06,
        Pezzo::Nv07,
        Pezzo::Nv07b,
        Pezzo::Nv07c,
        Pezzo::Nv08,
        Pezzo::Nv08b,
        Pezzo::Nv09,
        Pezzo::Nv10,
        Pezzo::Nv11,
        Pezzo::Nv11b,
        Pezzo::Nv12,
        Pezzo::Nv12b,
        Pezzo::Nv12c,
        Pezzo::Nv13,
        Pezzo::Nv13b,
        Pezzo::Nv14,
        Pezzo::Nv14b,
        Pezzo::Nv14c,
        Pezzo::Nv15,
        Pezzo::An04,
        Pezzo::An05,
        Pezzo::An06,
        Pezzo::An07,
        Pezzo::An08,
        Pezzo::An09,
        Pezzo::An10,
        Pezzo::An11,
        Pezzo::An12,
        Pezzo::An13,
        Pezzo::An14,
        Pezzo::An15,
        Pezzo::An16,
        Pezzo::An17,
        Pezzo::An18,
        Pezzo::An19,
        Pezzo::An20,
        Pezzo::An21,
        Pezzo::An22,
        Pezzo::An23,
        Pezzo::An24,
        Pezzo::An25,
        Pezzo::An26,
        Pezzo::Yu01,
        Pezzo::Yu02,
        Pezzo::Yu03,
        Pezzo::Yu04,
        Pezzo::Yu05,
        Pezzo::Yu06,
        Pezzo::Yu07,
        Pezzo::Yu08,
    ];

    /// Una voce registrata, che si porta al suo livello misurando le parole e non il silenzio fra
    /// l’una e l’altra (documento 35, §8): le voci della nave e Yusuf. L’Anziano no: il suo livello
    /// è tarato dal 2 novembre sul valore efficace di tutto il file.
    pub fn parlato(self) -> bool {
        self.yusuf() || BATTUTE_NV.iter().any(|(p, _)| *p == self)
    }

    /// Una battuta di Yusuf: suona dalla radio, asciutta, non nella cuffia.
    pub fn yusuf(self) -> bool {
        VOCI_YU.iter().any(|(p, _)| *p == self)
    }

    /// La battuta delle voci della nave o di Yusuf dal nome che le dà il ponte (l’evento «voci»).
    pub fn della_battuta(nome: &str) -> Option<Pezzo> {
        BATTUTE_NV.iter().chain(VOCI_YU.iter()).find(|(_, n)| n.strip_suffix(".mp3") == Some(nome)).map(|(p, _)| *p)
    }

    /// (la cartella della scheda, il nome del file) come stanno in `audio/musica-ia/`.
    pub fn file(self) -> (&'static str, &'static str) {
        if let Some((_, n)) = BATTUTE_NV.iter().find(|(p, _)| *p == self) {
            return ("NV", n);
        }
        if let Some((_, n)) = VOCI_AN.iter().find(|(p, _)| *p == self) {
            return ("AN", n);
        }
        if let Some((_, n)) = VOCI_YU.iter().find(|(p, _)| *p == self) {
            return ("YU", n);
        }
        match self {
            Pezzo::M1a => ("M1", "M1-01-bare-resonance.mp3"),
            Pezzo::M1b => ("M1", "M1-02-resonant-void.mp3"),
            Pezzo::S2 => ("S2", "S2-01-below-the-iron-keel.mp3"),
            Pezzo::S3 => ("S3", "S3-01-glass-horizon.mp3"),
            Pezzo::S4 => ("S4", "S4-01-beneath-the-stone-weight.mp3"),
            Pezzo::S5 => ("S5", "S5-01-below-the-keel.mp3"),
            Pezzo::A1 => ("A1", "A1-03-cold-iron-orbit.mp3"),
            Pezzo::A2 => ("A2", "A2-02-tritone-loop.mp3"),
            Pezzo::A3 => ("A3", "A3-02-drones-of-the-deep.mp3"),
            Pezzo::A4 => ("A4", "A4-01-departure-and-forgiveness.mp3"),
            Pezzo::C1 => ("C1", "C1-02-homecoming-drone-b.mp3"),
            Pezzo::C2 => ("C2", "C2-02-sustained-d-bis.mp3"),
            Pezzo::C3 => ("C3", "C3-01-g-sharp-resonance.mp3"),
            Pezzo::C4 => ("C4", "C4-01-cold-resonance-1.mp3"),
            Pezzo::C5 => ("C5", "C5-03-below-the-hull.mp3"),
            Pezzo::T1 => ("T", "T-01-hull-of-the-ancient.mp3"),
            Pezzo::T2 => ("T", "T-02-held-by-the-dark.mp3"),
            Pezzo::CT => ("CT", "CT-01-voice-in-the-deep.mp3"),
            Pezzo::SM => ("SM", "SM-01-santa-maria.mp3"),
            Pezzo::LV => ("LV", "LV-01-la-traccia.mp3"),
            Pezzo::CA => ("AN", "AN-00-canto.mp3"),
            // le voci: le trovano le loro tabelle, qui sopra
            _ => ("", ""),
        }
    }

    /// La battuta dell’Anziano con la voce, dal nome che le dà il ponte (`VOCI_ANZIANO` in
    /// ponte.py): il ponte lo manda solo se a schermo ci sono proprio quelle parole.
    pub fn della_voce(nome: &str) -> Option<Pezzo> {
        VOCI_AN.iter().find(|(_, f)| f.get(6..).and_then(|r| r.strip_suffix(".mp3")) == Some(nome)).map(|(p, _)| *p)
    }
}

// -------------------------------------------------------------------------------------
//  Il pezzo in memoria
// -------------------------------------------------------------------------------------

/// Un file decodificato: stereo, 16 bit, alla frequenza del file.
pub struct Pcm {
    sr: f32,
    campioni: Vec<i16>,
    /// il guadagno (lineare) che porta il pezzo a `OBIETTIVO_DB`
    norma: f32,
}

impl Pcm {
    /// Da frame in virgola mobile (L, R), alla frequenza `sr`.
    pub fn da_frame(sr: f32, frame: impl Iterator<Item = (f32, f32)>) -> Pcm {
        Self::da_frame_con(sr, frame, false)
    }

    /// Come `da_frame`; con `parlato` il livello si misura sulle parole: la mediana dei pezzi di
    /// 50 ms che stanno entro 30 dB dal più forte (i silenzi e i vuoti di una battuta non contano,
    /// come nell’ascolto approvato, documento 35, §7).
    pub fn da_frame_con(sr: f32, frame: impl Iterator<Item = (f32, f32)>, parlato: bool) -> Pcm {
        let mut campioni = Vec::new();
        let mut energia = 0.0f64;
        let mut n = 0usize;
        for (l, r) in frame {
            energia += ((l * l + r * r) * 0.5) as f64;
            n += 1;
            campioni.push((l.clamp(-1.0, 1.0) * 32767.0) as i16);
            campioni.push((r.clamp(-1.0, 1.0) * 32767.0) as i16);
        }
        let rms_db = 10.0 * ((energia / n.max(1) as f64) + 1e-12).log10() as f32;
        let livello = if parlato { livello_del_parlato(sr, &campioni).unwrap_or(rms_db) } else { rms_db };
        Pcm { sr, campioni, norma: db(OBIETTIVO_DB - livello) }
    }

    pub fn frame(&self) -> usize {
        self.campioni.len() / 2
    }

    /// Il guadagno che porta il pezzo al suo livello (lineare).
    pub fn norma(&self) -> f32 {
        self.norma
    }

    pub fn durata(&self) -> f32 {
        self.frame() as f32 / self.sr
    }

    /// Il frame alla posizione `pos` (in frame del file), con l’interpolazione fra due campioni.
    #[inline]
    fn leggi(&self, pos: f64) -> (f32, f32) {
        let i = pos as usize;
        let n = self.frame();
        if i >= n {
            return (0.0, 0.0);
        }
        let k = (pos - i as f64) as f32;
        let j = (i + 1).min(n - 1);
        let c = |idx: usize, ch: usize| self.campioni[idx * 2 + ch] as f32 * (1.0 / 32768.0);
        (c(i, 0) + (c(j, 0) - c(i, 0)) * k, c(i, 1) + (c(j, 1) - c(i, 1)) * k)
    }
}

/// Il livello delle parole di una battuta, in dB: la mediana del valore efficace dei pezzi di
/// 50 ms che stanno entro 30 dB dal pezzo più forte.
fn livello_del_parlato(sr: f32, campioni: &[i16]) -> Option<f32> {
    let passo = ((sr * 0.05) as usize).max(1) * 2;
    let mut pezzi: Vec<f32> = campioni
        .chunks_exact(passo)
        .map(|c| {
            let e: f64 = c.iter().map(|&v| (v as f64 / 32768.0).powi(2)).sum::<f64>() / c.len() as f64;
            10.0 * (e + 1e-20).log10() as f32
        })
        .collect();
    let forte = pezzi.iter().cloned().fold(f32::MIN, f32::max);
    pezzi.retain(|&d| d > forte - 30.0);
    if pezzi.is_empty() {
        return None;
    }
    pezzi.sort_by(|a, b| a.total_cmp(b));
    Some(pezzi[pezzi.len() / 2])
}

/// Dove comincia l'audio: dopo il tag ID3v2 in testa, se c'è. I file di Flow Music portano la
/// copertina dentro il tag (fino a 1,3 MB) e il decoder non la attraversa: si salta noi.
fn inizio_audio(dati: &[u8]) -> usize {
    if dati.len() < 10 || &dati[..3] != b"ID3" {
        return 0;
    }
    let dimensione = ((dati[6] as usize & 0x7f) << 21) | ((dati[7] as usize & 0x7f) << 14) | ((dati[8] as usize & 0x7f) << 7) | (dati[9] as usize & 0x7f);
    let piede = if dati[5] & 0x10 != 0 { 10 } else { 0 };
    (10 + dimensione + piede).min(dati.len())
}

fn decodifica(percorso: &Path, parlato: bool) -> Option<Pcm> {
    let dati = std::fs::read(percorso).ok()?;
    let da = inizio_audio(&dati);
    let d = StaticSoundData::from_cursor(std::io::Cursor::new(dati[da..].to_vec())).ok()?;
    let sr = d.sample_rate as f32;
    Some(Pcm::da_frame_con(sr, d.frames.iter().map(|f| (f.left, f.right)), parlato))
}

// -------------------------------------------------------------------------------------
//  La biblioteca: dove stanno i file, e quali sono pronti
// -------------------------------------------------------------------------------------

enum Casella {
    InCorso,
    Pronto(Arc<Pcm>),
    Mancante,
}

/// Quello che il thread audio chiede al thread di lavoro.
enum Lavoro {
    /// decodifica il file del pezzo
    Decodifica(Pezzo),
    /// un pezzo che non serve più: si libera là (decine di megabyte), non nel thread audio
    Butta(Arc<Pcm>),
}

pub struct Biblioteca {
    /// il file di ogni pezzo che c’è, cercato sul disco una volta sola, quando la biblioteca nasce
    percorsi: HashMap<Pezzo, PathBuf>,
    /// riservata per tutti i pezzi: inserire non alloca nel thread audio
    caselle: HashMap<Pezzo, Casella>,
    lavori: Sender<Lavoro>,
    rx: Receiver<(Pezzo, Option<Arc<Pcm>>)>,
}

impl Biblioteca {
    /// Va creata fuori dal thread audio: cerca i file e fa partire il thread di lavoro, che vive
    /// quanto la biblioteca.
    pub fn nuova(cartella: PathBuf) -> Self {
        let percorsi: HashMap<Pezzo, PathBuf> = Pezzo::TUTTI
            .iter()
            .filter_map(|&p| {
                // nella cartella piatta (l’installazione) o nella sua sottocartella (l’albero di lavoro)
                let (sotto, nome) = p.file();
                [cartella.join(nome), cartella.join(sotto).join(nome)].into_iter().find(|f| f.is_file()).map(|f| (p, f))
            })
            .collect();
        let (lavori, coda) = channel::<Lavoro>();
        let (tx, rx) = channel();
        let dove = percorsi.clone();
        std::thread::Builder::new()
            .name("relitto-musica".into())
            .spawn(move || {
                // finisce quando la biblioteca se ne va e la coda si chiude
                for lavoro in coda {
                    match lavoro {
                        Lavoro::Decodifica(p) => {
                            let pcm = dove.get(&p).and_then(|f| decodifica(f, p.parlato())).map(Arc::new);
                            if tx.send((p, pcm)).is_err() {
                                break;
                            }
                        }
                        Lavoro::Butta(pcm) => drop(pcm),
                    }
                }
            })
            .expect("il thread della musica non parte");
        Biblioteca { percorsi, caselle: HashMap::with_capacity(Pezzo::TUTTI.len()), lavori, rx }
    }

    /// C’è il file, o è già in memoria?
    pub fn esiste(&self, p: Pezzo) -> bool {
        match self.caselle.get(&p) {
            Some(Casella::Mancante) => false,
            Some(_) => true,
            None => self.percorsi.contains_key(&p),
        }
    }

    /// Chiede un pezzo: se non c’è già, il thread di lavoro lo decodifica.
    pub fn chiedi(&mut self, p: Pezzo) {
        if self.caselle.contains_key(&p) {
            return;
        }
        if !self.percorsi.contains_key(&p) || self.lavori.send(Lavoro::Decodifica(p)).is_err() {
            self.caselle.insert(p, Casella::Mancante);
            return;
        }
        self.caselle.insert(p, Casella::InCorso);
    }

    /// Un pezzo che non serve più: lo libera il thread di lavoro.
    pub fn butta(&self, pcm: Arc<Pcm>) {
        // se il thread non c’è più, il pezzo torna indietro nell’errore e si libera qui
        let _ = self.lavori.send(Lavoro::Butta(pcm));
    }

    /// Mette un pezzo già decodificato (per le prove, che non hanno i file).
    pub fn inserisci(&mut self, p: Pezzo, pcm: Pcm) {
        self.caselle.insert(p, Casella::Pronto(Arc::new(pcm)));
    }

    /// Raccoglie i pezzi che il thread di lavoro ha finito.
    pub fn aggiorna(&mut self) {
        while let Ok((p, pcm)) = self.rx.try_recv() {
            // un pezzo già lasciato andare nel frattempo non torna in memoria
            if !matches!(self.caselle.get(&p), Some(Casella::InCorso)) {
                if let Some(pcm) = pcm {
                    self.butta(pcm);
                }
                continue;
            }
            self.caselle.insert(p, pcm.map(Casella::Pronto).unwrap_or(Casella::Mancante));
        }
    }

    pub fn pronto(&self, p: Pezzo) -> Option<Arc<Pcm>> {
        match self.caselle.get(&p) {
            Some(Casella::Pronto(x)) => Some(x.clone()),
            _ => None,
        }
    }

    pub fn mancante(&self, p: Pezzo) -> bool {
        matches!(self.caselle.get(&p), Some(Casella::Mancante))
    }

    /// Lascia andare dalla memoria i pezzi che non servono più (il loro file resta dov’è): li
    /// libera il thread di lavoro.
    pub fn tieni(&mut self, servono: &[Pezzo]) {
        let lavori = &self.lavori;
        self.caselle.retain(|p, c| {
            if !matches!(c, Casella::Pronto(_)) || servono.contains(p) {
                return true;
            }
            if let Casella::Pronto(pcm) = std::mem::replace(c, Casella::Mancante) {
                let _ = lavori.send(Lavoro::Butta(pcm));
            }
            false
        });
    }
}

// -------------------------------------------------------------------------------------
//  Le voci che suonano
// -------------------------------------------------------------------------------------

/// Che cosa succede quando un pezzo arriva in fondo.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Dopo {
    /// finisce (con la sua dissolvenza finale, se ne ha una) e basta
    Niente,
    /// ricomincia da capo, con una dissolvenza incrociata fra la fine e l’inizio
    Ripeti,
    /// lascia il posto all’altro pezzo, che a sua volta lascerà il posto a questo
    Alterna(Pezzo),
}

/// Quello che serve per far partire un pezzo.
#[derive(Clone, Copy, Debug)]
pub struct Richiesta {
    pub pezzo: Pezzo,
    /// da che secondo del file comincia
    pub da: f32,
    /// a che secondo finisce (`None`: alla fine del file)
    pub a: Option<f32>,
    /// secondi di entrata
    pub entra: f32,
    pub dopo: Dopo,
    /// secondi di dissolvenza incrociata, per `Ripeti` e `Alterna`
    pub incrocio: f32,
    /// secondi di dissolvenza prima della fine, per `Niente` (0: finisce com’è)
    pub esce: f32,
    /// il livello del brano sopra il livello base, in dB
    pub livello: f32,
}

impl Richiesta {
    pub fn intero(pezzo: Pezzo) -> Self {
        Richiesta { pezzo, da: 0.0, a: None, entra: 0.5, dopo: Dopo::Niente, incrocio: 0.0, esce: 1.5, livello: 0.0 }
    }
}

struct Voce {
    r: Richiesta,
    pcm: Arc<Pcm>,
    pos: f64,
    passo: f64,
    fine: f64,
    g: Scorrevole,
    liv: f32,
    /// ha già ceduto il posto al successivo (o ha cominciato a uscire)
    ceduta: bool,
    /// sta sfumando verso il silenzio e se ne andrà
    morente: bool,
}

impl Voce {
    fn nuova(r: Richiesta, pcm: Arc<Pcm>, sr: f32) -> Voce {
        let passo = pcm.sr as f64 / sr as f64;
        let fine = (r.a.map(|a| a as f64 * pcm.sr as f64).unwrap_or(pcm.frame() as f64)).min(pcm.frame() as f64);
        let mut g = Scorrevole::nuovo(0.0);
        g.verso(1.0, r.entra, sr);
        let liv = pcm.norma * db(r.livello);
        let pos = r.da as f64 * pcm.sr as f64;
        Voce { r, pcm, pos, passo, fine, g, liv, ceduta: false, morente: false }
    }

    fn resta(&self, sr: f32) -> f32 {
        ((self.fine - self.pos) / (self.passo * sr as f64)) as f32
    }

    fn finita(&self) -> bool {
        self.pos >= self.fine || (self.morente && self.g.v < 1e-5)
    }
}

/// Il lettore: le voci che suonano adesso, e quello che aspetta un file.
pub struct Lettore {
    sr: f32,
    pub biblioteca: Option<Biblioteca>,
    voci: Vec<Voce>,
    attese: Vec<(Richiesta, f32)>,
    /// le voci che nascono in un passo (ripetizioni, alternanze): riservate, per non allocare
    nuove: Vec<(Richiesta, Arc<Pcm>)>,
    fallita: bool,
}

const MAX_VOCI: usize = 6;
/// Quanto si aspetta un file che si decodifica, in secondi, prima di rinunciare.
const ATTESA_MASSIMA: f32 = 20.0;

impl Lettore {
    pub fn nuovo(sr: f32) -> Self {
        Lettore {
            sr,
            biblioteca: None,
            voci: Vec::with_capacity(MAX_VOCI),
            attese: Vec::with_capacity(MAX_VOCI),
            nuove: Vec::with_capacity(MAX_VOCI),
            fallita: false,
        }
    }

    /// Ci sono i file, o almeno la cartella?
    pub fn disponibile(&self, pezzi: &[Pezzo]) -> bool {
        self.biblioteca.as_ref().is_some_and(|b| pezzi.iter().all(|p| b.esiste(*p)))
    }

    /// Qualcosa suona o sta per suonare.
    pub fn attivo(&self) -> bool {
        !self.voci.is_empty() || !self.attese.is_empty()
    }

    /// Un file che serviva non c’è o non si decodifica: si dice una volta sola.
    pub fn prendi_fallita(&mut self) -> bool {
        std::mem::take(&mut self.fallita)
    }

    /// Una voce suona senza sfumare via, o sta per partire.
    pub fn vivo(&self) -> bool {
        self.voci.iter().any(|v| !v.morente) || !self.attese.is_empty()
    }

    pub fn suona(&self, p: Pezzo) -> bool {
        self.voci.iter().any(|v| v.r.pezzo == p && !v.morente && !v.ceduta)
    }

    /// Quanti secondi di un pezzo sono passati (per le prove).
    pub fn posizione(&self, p: Pezzo) -> Option<f32> {
        self.voci.iter().rev().find(|v| v.r.pezzo == p).map(|v| (v.pos / v.pcm.sr as f64) as f32)
    }

    /// Fa partire un pezzo appena è in memoria.
    pub fn avvia(&mut self, r: Richiesta) {
        if let Some(b) = self.biblioteca.as_mut() {
            b.chiedi(r.pezzo);
            if let Dopo::Alterna(altro) = r.dopo {
                b.chiedi(altro);
            }
        }
        self.attese.push((r, ATTESA_MASSIMA));
    }

    /// Fa sfumare tutto in `s` secondi; quel che aspettava un file non parte più.
    pub fn tace(&mut self, s: f32) {
        self.attese.clear();
        let sr = self.sr;
        for v in &mut self.voci {
            v.g.verso(0.0, s.max(0.02), sr);
            v.morente = true;
            v.ceduta = true;
        }
    }

    /// Comincia a decodificare un pezzo, senza farlo suonare (i letti dell’Anziano, che servono presto).
    pub fn precarica(&mut self, p: Pezzo) {
        if let Some(b) = self.biblioteca.as_mut() {
            b.chiedi(p);
        }
    }

    /// Un letto dell’Anziano: entra incrociandosi con quello che c’era, che sfuma.
    pub fn letto(&mut self, r: Richiesta, sfuma: f32) {
        if self.suona(r.pezzo) || self.attese.iter().any(|(a, _)| a.pezzo == r.pezzo) {
            return;
        }
        let sr = self.sr;
        for v in &mut self.voci {
            if !v.morente {
                v.g.verso(0.0, sfuma, sr);
                v.morente = true;
                v.ceduta = true;
            }
        }
        self.attese.clear();
        self.avvia(r);
    }

    /// Fa andare il tempo: raccoglie i file pronti, fa partire chi aspettava, incrocia chi
    /// arriva in fondo. Una volta per blocco.
    pub fn passo(&mut self, dt: f32) {
        let sr = self.sr;
        if let Some(b) = self.biblioteca.as_mut() {
            b.aggiorna();
        }
        // chi aspettava
        let mut i = 0;
        while i < self.attese.len() {
            let (r, resto) = self.attese[i];
            let pcm = self.biblioteca.as_ref().and_then(|b| b.pronto(r.pezzo));
            let manca = self.biblioteca.as_ref().is_none_or(|b| b.mancante(r.pezzo));
            if let Some(pcm) = pcm {
                if self.voci.len() < MAX_VOCI {
                    self.voci.push(Voce::nuova(r, pcm, sr));
                }
                self.attese.swap_remove(i);
            } else if manca || resto - dt <= 0.0 {
                self.fallita = true;
                self.attese.swap_remove(i);
            } else {
                self.attese[i].1 = resto - dt;
                i += 1;
            }
        }
        // chi arriva in fondo
        let mut nuove = std::mem::take(&mut self.nuove);
        for v in &mut self.voci {
            if v.ceduta || v.morente {
                continue;
            }
            let resta = v.resta(sr);
            match v.r.dopo {
                Dopo::Ripeti if resta <= v.r.incrocio => {
                    v.ceduta = true;
                    v.g.verso(0.0, v.r.incrocio.max(0.05), sr);
                    nuove.push((Richiesta { entra: v.r.incrocio, ..v.r }, v.pcm.clone()));
                }
                Dopo::Alterna(altro) if resta <= v.r.incrocio => {
                    let pronto = self.biblioteca.as_ref().and_then(|b| b.pronto(altro));
                    if let Some(pcm) = pronto {
                        v.ceduta = true;
                        v.g.verso(0.0, v.r.incrocio.max(0.05), sr);
                        let r = Richiesta { pezzo: altro, entra: v.r.incrocio, dopo: Dopo::Alterna(v.r.pezzo), da: 0.0, a: None, ..v.r };
                        nuove.push((r, pcm));
                    } else if self.biblioteca.as_ref().is_some_and(|b| b.mancante(altro)) {
                        // l'altro pezzo non c'è: questo ricomincia da solo
                        v.ceduta = true;
                        v.g.verso(0.0, v.r.incrocio.max(0.05), sr);
                        nuove.push((Richiesta { entra: v.r.incrocio, dopo: Dopo::Ripeti, ..v.r }, v.pcm.clone()));
                    }
                }
                Dopo::Niente if v.r.esce > 0.0 && resta <= v.r.esce => {
                    v.ceduta = true;
                    v.g.verso(0.0, resta.max(0.05), sr);
                }
                _ => {}
            }
        }
        for (r, pcm) in nuove.drain(..) {
            if self.voci.len() < MAX_VOCI {
                self.voci.push(Voce::nuova(r, pcm, sr));
            } else if let Some(b) = self.biblioteca.as_ref() {
                b.butta(pcm);
            }
        }
        self.nuove = nuove;
        // le voci finite se ne vanno; il loro pezzo, se sono le ultime a tenerlo, lo libera il thread
        // di lavoro (in ordine: la voce più recente di un pezzo resta l’ultima)
        let mut i = 0;
        while i < self.voci.len() {
            if self.voci[i].finita() {
                let v = self.voci.remove(i);
                match self.biblioteca.as_ref() {
                    Some(b) => b.butta(v.pcm),
                    None => drop(v),
                }
            } else {
                i += 1;
            }
        }
    }

    /// Un campione di musica da file, stereo, senza il cursore e senza la pausa (stanno nel mixer).
    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        let (mut l, mut r) = (0.0f32, 0.0f32);
        for v in &mut self.voci {
            if v.pos >= v.fine {
                continue;
            }
            let g = v.g.passo() * v.liv;
            let (a, b) = v.pcm.leggi(v.pos);
            v.pos += v.passo;
            l += a * g;
            r += b * g;
        }
        (l, r)
    }

    /// Lascia andare dalla memoria quello che non serve a questi pezzi.
    pub fn tieni(&mut self, servono: &[Pezzo]) {
        if let Some(b) = self.biblioteca.as_mut() {
            b.tieni(servono);
        }
    }
}

/// Per la prova a mano (`examples/prova_decodifica.rs`): quanti frame, a che frequenza, e il livello.
pub fn prova_decodifica(percorso: &Path) -> Result<String, String> {
    let t0 = std::time::Instant::now();
    let p = decodifica(percorso, false).ok_or("non si decodifica")?;
    Ok(format!("{} frame a {} Hz, {:.1} s, norma {:+.1} dB, in {:.2} s", p.frame(), p.sr, p.durata(), 20.0 * p.norma.log10(), t0.elapsed().as_secs_f32()))
}

#[cfg(test)]
mod prove {
    use super::*;

    fn silenzio(secondi: f32) -> Pcm {
        Pcm::da_frame(48000.0, (0..(secondi * 48000.0) as usize).map(|_| (0.0, 0.0)))
    }

    #[test]
    fn i_file_si_cercano_una_volta_sola() {
        // revisione 25, M5: niente accessi al disco dal thread audio. La biblioteca cerca i file
        // quando nasce; dopo, che il file sparisca o no, non lo guarda più.
        let cartella = std::env::temp_dir().join(format!("relitto-biblioteca-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&cartella);
        std::fs::create_dir_all(&cartella).unwrap();
        let (_, nome) = Pezzo::S2.file();
        std::fs::write(cartella.join(nome), b"non un mp3").unwrap();
        let b = Biblioteca::nuova(cartella.clone());
        assert!(b.esiste(Pezzo::S2), "il file nella cartella piatta dovrebbe esserci");
        assert!(!b.esiste(Pezzo::S3), "un file che non c'è non dovrebbe esserci");
        std::fs::remove_dir_all(&cartella).unwrap();
        assert!(b.esiste(Pezzo::S2), "dopo la nascita la biblioteca non guarda più il disco");
    }

    #[test]
    fn un_file_che_non_si_decodifica_diventa_mancante() {
        let cartella = std::env::temp_dir().join(format!("relitto-biblioteca-rotto-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&cartella);
        std::fs::create_dir_all(&cartella).unwrap();
        let (_, nome) = Pezzo::S4.file();
        std::fs::write(cartella.join(nome), b"non un mp3").unwrap();
        let mut b = Biblioteca::nuova(cartella.clone());
        b.chiedi(Pezzo::S4);
        let t0 = std::time::Instant::now();
        while !b.mancante(Pezzo::S4) && t0.elapsed().as_secs_f32() < 5.0 {
            std::thread::sleep(std::time::Duration::from_millis(5));
            b.aggiorna();
        }
        assert!(b.mancante(Pezzo::S4), "il thread di lavoro dovrebbe dire che il file non si decodifica");
        let _ = std::fs::remove_dir_all(&cartella);
    }

    #[test]
    fn i_pezzi_lasciati_andare_li_libera_il_thread_di_lavoro() {
        let mut b = Biblioteca::nuova(PathBuf::from("non-esiste"));
        b.inserisci(Pezzo::A1, silenzio(1.0));
        b.inserisci(Pezzo::A2, silenzio(1.0));
        let a1 = Arc::downgrade(&b.pronto(Pezzo::A1).unwrap());
        let a2 = Arc::downgrade(&b.pronto(Pezzo::A2).unwrap());
        b.tieni(&[Pezzo::A2]);
        assert!(b.pronto(Pezzo::A1).is_none() && b.pronto(Pezzo::A2).is_some());
        let t0 = std::time::Instant::now();
        while a1.upgrade().is_some() && t0.elapsed().as_secs_f32() < 5.0 {
            std::thread::sleep(std::time::Duration::from_millis(5));
        }
        assert!(a1.upgrade().is_none(), "il pezzo lasciato andare dovrebbe essere liberato");
        assert!(a2.upgrade().is_some(), "il pezzo che serve resta");

        // e una voce del lettore che finisce: il suo pezzo, lasciato dalla biblioteca, se ne va
        let mut l = Lettore::nuovo(48000.0);
        l.biblioteca = Some(b);
        l.avvia(Richiesta { a: Some(0.2), esce: 0.0, ..Richiesta::intero(Pezzo::A2) });
        l.passo(0.01);
        assert!(l.suona(Pezzo::A2));
        l.biblioteca.as_mut().unwrap().tieni(&[]);
        for _ in 0..(0.3 * 48000.0) as usize {
            l.campione();
        }
        l.passo(0.01);
        assert!(!l.attivo(), "la voce dovrebbe essere finita");
        let t0 = std::time::Instant::now();
        while a2.upgrade().is_some() && t0.elapsed().as_secs_f32() < 5.0 {
            std::thread::sleep(std::time::Duration::from_millis(5));
        }
        assert!(a2.upgrade().is_none(), "il pezzo della voce finita dovrebbe essere liberato");
    }
}
