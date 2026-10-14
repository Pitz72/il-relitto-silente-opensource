//! I campioni registrati, tenuti in memoria a 16 bit, e la banca che li raccoglie.

use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;

use kira::sound::static_sound::StaticSoundData;

pub struct Campione {
    pub canali: usize,
    pub sr: f32,
    dati: Vec<i16>,
}

impl Campione {
    pub fn da_file(percorso: &Path) -> Result<Self, String> {
        let s = StaticSoundData::from_file(percorso).map_err(|e| format!("{}: {e}", percorso.display()))?;
        // i file mono arrivano da kira con i due canali uguali
        let mono = s.frames.iter().all(|f| f.left == f.right);
        let canali = if mono { 1 } else { 2 };
        let q = |x: f32| (x.clamp(-1.0, 1.0) * 32767.0).round() as i16;
        let mut dati = Vec::with_capacity(s.frames.len() * canali);
        for f in s.frames.iter() {
            dati.push(q(f.left));
            if !mono {
                dati.push(q(f.right));
            }
        }
        Ok(Campione { canali, sr: s.sample_rate as f32, dati })
    }

    pub fn frame(&self) -> usize {
        self.dati.len() / self.canali
    }

    pub fn secondi(&self) -> f32 {
        self.frame() as f32 / self.sr
    }

    #[inline]
    fn a(&self, i: usize, c: usize) -> f32 {
        self.dati[i * self.canali + c.min(self.canali - 1)] as f32 * (1.0 / 32768.0)
    }

    /// Legge alla posizione frazionaria (interpolazione lineare); fuori dai bordi c’è silenzio.
    #[inline]
    pub fn leggi(&self, pos: f64) -> (f32, f32) {
        let n = self.frame();
        if pos < 0.0 || pos >= (n.saturating_sub(1)) as f64 {
            return (0.0, 0.0);
        }
        let i = pos as usize;
        let t = (pos - i as f64) as f32;
        let l = self.a(i, 0) + (self.a(i + 1, 0) - self.a(i, 0)) * t;
        let r = if self.canali == 2 { self.a(i, 1) + (self.a(i + 1, 1) - self.a(i, 1)) * t } else { l };
        (l, r)
    }

    /// Come `leggi`, ma la posizione gira in tondo: per gli anelli.
    #[inline]
    pub fn leggi_anello(&self, pos: f64) -> (f32, f32) {
        let n = self.frame();
        let i = (pos as usize) % n;
        let j = if i + 1 == n { 0 } else { i + 1 };
        let t = (pos - pos.floor()) as f32;
        let l = self.a(i, 0) + (self.a(j, 0) - self.a(i, 0)) * t;
        let r = if self.canali == 2 { self.a(i, 1) + (self.a(j, 1) - self.a(i, 1)) * t } else { l };
        (l, r)
    }
}

/// I campioni per gruppo: «fiato/calmo» raccoglie fiato/calmo-1.ogg, fiato/calmo-2.ogg…
#[derive(Default)]
pub struct Banca {
    gruppi: HashMap<String, Vec<Arc<Campione>>>,
}

impl Banca {
    pub fn carica(radice: &Path) -> Result<Self, String> {
        let mut b = Banca::default();
        let cartelle = std::fs::read_dir(radice).map_err(|e| format!("{}: {e}", radice.display()))?;
        for cartella in cartelle {
            let cartella = cartella.map_err(|e| e.to_string())?.path();
            if !cartella.is_dir() {
                continue;
            }
            let nome = cartella.file_name().unwrap_or_default().to_string_lossy().to_string();
            if nome.starts_with('_') {
                continue;
            }
            let mut file: Vec<_> = std::fs::read_dir(&cartella)
                .map_err(|e| e.to_string())?
                .filter_map(|e| e.ok().map(|e| e.path()))
                .filter(|p| p.extension().is_some_and(|x| x == "ogg"))
                .collect();
            file.sort();
            for p in file {
                let radice_nome = p.file_stem().unwrap_or_default().to_string_lossy().to_string();
                // «calmo-1» va nel gruppo «calmo»; «ventilazione» resta com’è
                let gruppo = match radice_nome.rsplit_once('-') {
                    Some((g, n)) if !n.is_empty() && n.chars().all(|c| c.is_ascii_digit()) => g.to_string(),
                    _ => radice_nome.clone(),
                };
                let c = Campione::da_file(&p)?;
                b.gruppi.entry(format!("{nome}/{gruppo}")).or_default().push(Arc::new(c));
            }
        }
        Ok(b)
    }

    pub fn gruppo(&self, nome: &str) -> Vec<Arc<Campione>> {
        self.gruppi.get(nome).cloned().unwrap_or_default()
    }

    pub fn uno(&self, nome: &str) -> Option<Arc<Campione>> {
        self.gruppi.get(nome).and_then(|v| v.first().cloned())
    }

    /// Byte occupati in memoria dai campioni.
    pub fn memoria(&self) -> usize {
        self.gruppi.values().flatten().map(|c| c.dati.len() * 2).sum()
    }

    pub fn quanti(&self) -> usize {
        self.gruppi.values().map(|v| v.len()).sum()
    }
}
