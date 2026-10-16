//! Il lettore dei file di musica (documento 22, §7): suona i diciassette MP3 di
//! `audio/musica-ia/` che il gioco usa, generati con Lyria 3.5 e con Suno e scelti dall’autore.
//! Il file è la base e non si ritocca (22, §7.1): qui si decide soltanto *quando* entra, *quanto*
//! suona, come si incrocia con il successivo e come se ne va.
//!
//! Il lettore non ha il riverbero della sala: i file hanno già il loro (22, §7, punto 3). Passa
//! però dal cursore «Musica» e dalla pausa, come la musica sintetizzata, che resta nel codice
//! come ripiego (`musica.rs`): se un file manca o non si decodifica, suona il vecchio brano.
//!
//! I file si decodificano **fuori dal thread audio**, a richiesta, e si tengono in memoria solo
//! finché servono (un MP3 di tre minuti, stereo a 16 bit, pesa circa 32 MB).

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
}

impl Pezzo {
    pub const TUTTI: [Pezzo; 17] = [
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
    ];

    /// (la cartella della scheda, il nome del file) come stanno in `audio/musica-ia/`.
    pub fn file(self) -> (&'static str, &'static str) {
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
        }
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
        Pcm { sr, campioni, norma: db(OBIETTIVO_DB - rms_db) }
    }

    pub fn frame(&self) -> usize {
        self.campioni.len() / 2
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

fn decodifica(percorso: &Path) -> Option<Pcm> {
    let dati = std::fs::read(percorso).ok()?;
    let da = inizio_audio(&dati);
    let d = StaticSoundData::from_cursor(std::io::Cursor::new(dati[da..].to_vec())).ok()?;
    let sr = d.sample_rate as f32;
    Some(Pcm::da_frame(sr, d.frames.iter().map(|f| (f.left, f.right))))
}

// -------------------------------------------------------------------------------------
//  La biblioteca: dove stanno i file, e quali sono pronti
// -------------------------------------------------------------------------------------

enum Casella {
    InCorso,
    Pronto(Arc<Pcm>),
    Mancante,
}

pub struct Biblioteca {
    cartella: PathBuf,
    caselle: HashMap<Pezzo, Casella>,
    tx: Sender<(Pezzo, Option<Pcm>)>,
    rx: Receiver<(Pezzo, Option<Pcm>)>,
}

impl Biblioteca {
    pub fn nuova(cartella: PathBuf) -> Self {
        let (tx, rx) = channel();
        Biblioteca { cartella, caselle: HashMap::new(), tx, rx }
    }

    /// Il file di un pezzo: nella cartella piatta (l’installazione) o nella sua sottocartella
    /// (l’albero di lavoro).
    fn percorso(&self, p: Pezzo) -> Option<PathBuf> {
        let (cartella, nome) = p.file();
        [self.cartella.join(nome), self.cartella.join(cartella).join(nome)].into_iter().find(|f| f.is_file())
    }

    /// C’è il file, o è già in memoria?
    pub fn esiste(&self, p: Pezzo) -> bool {
        match self.caselle.get(&p) {
            Some(Casella::Mancante) => false,
            Some(_) => true,
            None => self.percorso(p).is_some(),
        }
    }

    /// Chiede un pezzo: se non c’è già, parte la decodifica in un altro thread.
    pub fn chiedi(&mut self, p: Pezzo) {
        if self.caselle.contains_key(&p) {
            return;
        }
        let Some(percorso) = self.percorso(p) else {
            self.caselle.insert(p, Casella::Mancante);
            return;
        };
        self.caselle.insert(p, Casella::InCorso);
        let tx = self.tx.clone();
        std::thread::spawn(move || {
            let _ = tx.send((p, decodifica(&percorso)));
        });
    }

    /// Mette un pezzo già decodificato (per le prove, che non hanno i file).
    pub fn inserisci(&mut self, p: Pezzo, pcm: Pcm) {
        self.caselle.insert(p, Casella::Pronto(Arc::new(pcm)));
    }

    /// Raccoglie i pezzi che i thread hanno finito.
    pub fn aggiorna(&mut self) {
        while let Ok((p, pcm)) = self.rx.try_recv() {
            // un pezzo già lasciato andare nel frattempo non torna in memoria
            if !matches!(self.caselle.get(&p), Some(Casella::InCorso)) {
                continue;
            }
            self.caselle.insert(p, pcm.map(|x| Casella::Pronto(Arc::new(x))).unwrap_or(Casella::Mancante));
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

    /// Lascia andare dalla memoria i pezzi che non servono più (il loro file resta dov’è).
    pub fn tieni(&mut self, servono: &[Pezzo]) {
        self.caselle.retain(|p, c| !matches!(c, Casella::Pronto(_)) || servono.contains(p));
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
    fallita: bool,
}

const MAX_VOCI: usize = 6;
/// Quanto si aspetta un file che si decodifica, in secondi, prima di rinunciare.
const ATTESA_MASSIMA: f32 = 20.0;

impl Lettore {
    pub fn nuovo(sr: f32) -> Self {
        Lettore { sr, biblioteca: None, voci: Vec::with_capacity(MAX_VOCI), attese: Vec::new(), fallita: false }
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
        let mut nuove: Vec<(Richiesta, Arc<Pcm>)> = Vec::new();
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
        for (r, pcm) in nuove {
            if self.voci.len() < MAX_VOCI {
                self.voci.push(Voce::nuova(r, pcm, sr));
            }
        }
        self.voci.retain(|v| !v.finita());
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
    let p = decodifica(percorso).ok_or("non si decodifica")?;
    Ok(format!("{} frame a {} Hz, {:.1} s, norma {:+.1} dB, in {:.2} s", p.frame(), p.sr, p.durata(), 20.0 * p.norma.log10(), t0.elapsed().as_secs_f32()))
}
