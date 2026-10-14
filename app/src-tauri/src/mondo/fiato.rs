//! Il fiato dentro il casco (bibbia sonora, §5.1): la cifra dell’aria decide quanto
//! spesso e quanto a fondo si respira. Ogni campione è un ciclo intero (inspira ed
//! espira); il motore li mette in fila con le pause giuste e senza ripetersi.

use std::sync::Arc;

use super::campioni::Campione;
use super::dsp::{db, Caso};

pub struct Classi {
    pub calmo: Vec<Arc<Campione>>,
    pub sospiro: Vec<Arc<Campione>>,
    pub teso: Vec<Arc<Campione>>,
    pub pesante: Vec<Arc<Campione>>,
    pub veloce: Vec<Arc<Campione>>,
    pub sorpresa: Vec<Arc<Campione>>,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum Classe {
    Calmo,
    Sospiro,
    Teso,
    Pesante,
    Veloce,
    Sorpresa,
}

struct InCorso {
    c: Arc<Campione>,
    pos: f64,
    passo: f64,
    g: f32,
}

pub struct Fiato {
    classi: Classi,
    corso: Option<InCorso>,
    attesa: f32,
    periodo: f32,
    conta: u32,
    ultimo: (Classe, usize),
    pub aria: f32,
    pub sforzo: bool,
    pub ascolto: bool,
    pub acceso: bool,
    caso: Caso,
    sr: f32,
}

impl Fiato {
    pub fn nuovo(classi: Classi, sr: f32, seme: u64) -> Self {
        Fiato {
            classi,
            corso: None,
            attesa: 0.6,
            periodo: 4.6,
            conta: 0,
            ultimo: (Classe::Calmo, 0),
            aria: 100.0,
            sforzo: false,
            ascolto: false,
            acceso: false,
            caso: Caso::nuovo(seme),
            sr,
        }
    }

    fn gruppo(&self, k: Classe) -> &Vec<Arc<Campione>> {
        match k {
            Classe::Calmo => &self.classi.calmo,
            Classe::Sospiro => &self.classi.sospiro,
            Classe::Teso => &self.classi.teso,
            Classe::Pesante => &self.classi.pesante,
            Classe::Veloce => &self.classi.veloce,
            Classe::Sorpresa => &self.classi.sorpresa,
        }
    }

    /// Respiri al minuto, quelli che il motore sta seguendo.
    pub fn al_minuto(&self) -> f32 {
        60.0 / self.periodo.max(0.5)
    }

    /// Dove siamo nel ciclo: 0 all’inizio dell’inspirazione, 1 alla fine dell’espirazione;
    /// −1 fra un respiro e l’altro.
    pub fn fase(&self) -> f32 {
        match &self.corso {
            Some(c) => (c.pos / c.c.frame().max(1) as f64) as f32,
            None => -1.0,
        }
    }

    /// Un’inspirazione di sorpresa, poi il fiato trattenuto per un secondo e mezzo.
    pub fn sorpresa(&mut self) {
        if let Some(c) = self.scegli_da(Classe::Sorpresa) {
            self.corso = Some(InCorso { passo: c.sr as f64 / self.sr as f64, c, pos: 0.0, g: db(-2.0) });
            self.attesa = 1.5;
        }
    }

    fn scegli_da(&mut self, k: Classe) -> Option<Arc<Campione>> {
        let n = self.gruppo(k).len();
        if n == 0 {
            return None;
        }
        let ultimo = if self.ultimo.0 == k { self.ultimo.1 } else { usize::MAX };
        let i = if ultimo == usize::MAX { self.caso.indice(n) } else { self.caso.indice_nuovo(n, ultimo) };
        self.ultimo = (k, i);
        Some(self.gruppo(k)[i].clone())
    }

    /// La politica del respiro: classe, volume (dB) e periodo (s) secondo l’aria.
    fn politica(&mut self) -> (Classe, f32, f32) {
        let a = self.aria;
        // i volumi sono tarati sui rendering: il calmo intorno a −27 LUFS, la fame d’aria a −20
        let (k, g, p) = if self.sforzo {
            if self.caso.una_su(2) { (Classe::Pesante, 0.0, 1.25) } else { (Classe::Veloce, -1.0, 1.25) }
        } else if a <= 15.0 {
            // l’ipossia: respiri piccoli e irregolari, ogni tanto un sospiro lunghissimo
            if self.caso.una_su(6) { (Classe::Sospiro, -4.0, 7.0) } else { (Classe::Teso, -4.0, self.caso.tra(2.4, 6.0)) }
        } else if a < 30.0 {
            // la fame d’aria
            if self.caso.una_su(3) { (Classe::Pesante, -2.0, 2.7) } else { (Classe::Teso, 1.0, 2.7) }
        } else if a <= 60.0 {
            if self.caso.una_su(3) { (Classe::Teso, -2.0, 3.5) } else { (Classe::Calmo, 1.0, 3.5) }
        } else if self.conta % 12 == 11 {
            (Classe::Sospiro, -2.0, 6.5)
        } else {
            (Classe::Calmo, -1.0, 4.6)
        };
        let (g, p) = if self.ascolto { (g - 3.0, p * 1.15) } else { (g, p) };
        (k, g, p * self.caso.tra(0.92, 1.08))
    }

    fn prossimo(&mut self) {
        let (k, g, periodo) = self.politica();
        self.conta = self.conta.wrapping_add(1);
        self.periodo = periodo;
        if let Some(c) = self.scegli_da(k) {
            let velocita = self.caso.tra(0.97, 1.03) as f64;
            let passo = c.sr as f64 / self.sr as f64 * velocita;
            let durata = c.secondi() / velocita as f32;
            self.attesa = (periodo - durata).max(0.12);
            self.corso = Some(InCorso { c, pos: 0.0, passo, g: db(g + self.caso.tra(-1.5, 1.5)) });
        } else {
            self.attesa = periodo;
        }
    }

    #[inline]
    pub fn campione(&mut self, dt: f32) -> f32 {
        if let Some(c) = &mut self.corso {
            let (l, _) = c.c.leggi(c.pos);
            c.pos += c.passo;
            let g = c.g;
            if c.pos >= (c.c.frame().saturating_sub(1)) as f64 {
                self.corso = None;
            }
            return l * g;
        }
        if !self.acceso {
            return 0.0;
        }
        self.attesa -= dt;
        if self.attesa <= 0.0 {
            self.prossimo();
        }
        0.0
    }
}
