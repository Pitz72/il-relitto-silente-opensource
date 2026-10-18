//! Il fiato dentro il casco (bibbia sonora, §5.1), sintetizzato.
//!
//! L’aria che passa fa rumore, e il rumore prende il colore di dove passa: il naso
//! (una banda alta e stretta), la bocca (le formanti del tratto vocale, come in una
//! «h»), le labbra e i denti (un sibilo in alto che cresce più in fretta del flusso).
//! Più forte si respira, più il soffio si schiarisce. Nei sospiri e nella fatica la
//! voce si accende appena, all’inizio dell’espirazione. La turbolenza non è un
//! rumore liscio: trema, e il tremito cresce con la forza.
//!
//! La cifra dell’aria decide quanto spesso e quanto a fondo (la tabella del §5.1);
//! ogni respiro è diverso dal precedente nella durata, nella forza e nel colore.

use super::dsp::{campana, db, Caso, Modo, Risonatore, Svf, UnPolo};

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
enum Fase {
    Fermo,
    Inspira,
    Cima,
    Espira,
    Fondo,
}

/// Metà di un respiro: l’inspirazione o l’espirazione.
#[derive(Clone, Copy, Debug)]
struct Mezzo {
    durata: f32,
    /// la forza del flusso al suo massimo (lineare)
    picco: f32,
    /// dove sta il massimo, fra 0 e 1
    cima: f32,
    /// 0 dal naso, 1 dalla bocca
    bocca: f32,
    formanti: [f32; 4],
    bande: [f32; 4],
    /// il centro della banda del naso
    naso: f32,
    /// quanto il soffio si schiarisce con il flusso
    luce: f32,
    /// la voce accesa (i sospiri, la fatica)
    voce: f32,
    /// il fischio di una gola stretta
    fischio: f32,
    fischio_f: f32,
    /// le labbra che si aprono, prima di prendere aria
    schiocco: bool,
}

#[derive(Clone, Copy, Debug)]
struct Respiro {
    ins: Mezzo,
    cima: f32,
    esp: Mezzo,
    fondo: f32,
}

const INS_F: [f32; 4] = [620.0, 1250.0, 2450.0, 3500.0];
const INS_B: [f32; 4] = [300.0, 260.0, 320.0, 420.0];
const ESP_F: [f32; 4] = [520.0, 1450.0, 2500.0, 3500.0];
const ESP_B: [f32; 4] = [220.0, 200.0, 260.0, 360.0];

fn inspira(durata: f32, picco: f32, bocca: f32, luce: f32) -> Mezzo {
    Mezzo {
        durata,
        picco,
        cima: 0.46,
        bocca,
        formanti: INS_F,
        bande: INS_B,
        naso: 3300.0,
        luce,
        voce: 0.0,
        fischio: 0.0,
        fischio_f: 2100.0,
        schiocco: false,
    }
}

fn espira(durata: f32, picco: f32, bocca: f32, luce: f32) -> Mezzo {
    Mezzo {
        durata,
        picco,
        cima: 0.2,
        bocca,
        formanti: ESP_F,
        bande: ESP_B,
        naso: 2300.0,
        luce,
        voce: 0.0,
        fischio: 0.0,
        fischio_f: 1800.0,
        schiocco: false,
    }
}

// i pesi delle tre sorgenti, tarati sugli spettri
const BOCCA_G: f32 = 0.55;
const NASO_G: f32 = 0.85;
const LABBRA_G: f32 = 0.5;
const FISCHIO_G: f32 = 2.0;
const VOCE_G: f32 = 0.9;
/// il volume di tutto il fiato, dentro il casco: il calmo intorno a −26 LUFS, l’ambra a
/// −23, la fame d’aria a −19
const FIATO_G: f32 = 0.34;

pub struct Fiato {
    sr: f32,
    dt: f32,
    caso: Caso,
    fase: Fase,
    t: f32,
    resp: Respiro,
    conta: u32,
    // i filtri
    tratto: [Risonatore; 4],
    formanti: [f32; 4],
    bande: [f32; 4],
    naso: Svf,
    naso_lp: UnPolo,
    labbra: Svf,
    fischio: Svf,
    chiaro: UnPolo,
    turbo: UnPolo,
    forza: f32,
    k_forza: f32,
    // la voce
    glottide: f32,
    inclina: UnPolo,
    // lo schiocco delle labbra
    schiocco: [Modo; 2],
    conto: u32,
    // da fuori
    pub aria: f32,
    pub sforzo: bool,
    pub ascolto: bool,
    pub acceso: bool,
    /// gli ultimi respiri: quanti ne restano (0 = si respira come sempre)
    morente: u32,
}

impl Fiato {
    pub fn nuovo(sr: f32, seme: u64) -> Self {
        let resp = Respiro { ins: inspira(1.6, 0.5, 0.1, 0.45), cima: 0.15, esp: espira(2.4, 0.38, 0.12, 0.35), fondo: 0.45 };
        Fiato {
            sr,
            dt: 1.0 / sr,
            caso: Caso::nuovo(seme),
            fase: Fase::Fermo,
            t: 0.0,
            resp,
            conta: 0,
            tratto: std::array::from_fn(|i| Risonatore::nuovo(INS_F[i], INS_B[i], sr)),
            formanti: INS_F,
            bande: INS_B,
            naso: Svf::nuovo(3300.0, 0.6, sr),
            naso_lp: UnPolo::nuovo(6000.0, sr),
            labbra: Svf::nuovo(4200.0, 0.8, sr),
            fischio: Svf::nuovo(2100.0, 14.0, sr),
            chiaro: UnPolo::nuovo(3000.0, sr),
            turbo: UnPolo::nuovo(28.0, sr),
            forza: 0.0,
            k_forza: 1.0 - (-1.0 / (0.008 * sr)).exp(),
            glottide: 0.0,
            inclina: UnPolo::nuovo(1400.0, sr),
            schiocco: [Modo::default(); 2],
            conto: 0,
            aria: 100.0,
            sforzo: false,
            ascolto: false,
            acceso: false,
            morente: 0,
        }
    }

    /// Il fiato trattenuto per `secondi`: in cima, se si stava prendendo aria;
    /// altrimenti a polmoni vuoti, dopo l’espirazione.
    pub fn trattieni(&mut self, secondi: f32) {
        match self.fase {
            Fase::Inspira => self.resp.cima = self.resp.cima.max(secondi),
            Fase::Cima => self.resp.cima = self.resp.cima.max(self.t + secondi),
            Fase::Espira => self.resp.fondo = self.resp.fondo.max(secondi),
            Fase::Fondo => self.resp.fondo = self.resp.fondo.max(self.t + secondi),
            Fase::Fermo => self.t = self.t.min(0.6 - secondi),
        }
    }

    /// «Il fiato si fa lento, poi l’ultimo»: quattro respiri sempre più deboli e più
    /// lunghi, poi niente.
    pub fn ultimi(&mut self) {
        self.morente = 5;
    }

    /// La partita riprende dopo gli ultimi respiri (un caricamento, un «annulla» dopo la fine):
    /// il fiato torna come sempre. Senza, il fiato fermato da `ultimi` non ripartiva più.
    pub fn riprendi(&mut self) {
        self.morente = 0;
        if self.fase == Fase::Fermo && self.t < 0.0 {
            self.t = 0.0;
        }
    }

    /// Respiri al minuto, quelli che il motore sta seguendo.
    pub fn al_minuto(&self) -> f32 {
        let r = &self.resp;
        60.0 / (r.ins.durata + r.cima + r.esp.durata + r.fondo).max(0.5)
    }

    /// Dove siamo nel respiro: da 0 a 0,4 l’inspirazione, da 0,4 a 1 l’espirazione;
    /// −1 fra un respiro e l’altro. Il bordo del visore respira con questo.
    pub fn fase(&self) -> f32 {
        match self.fase {
            Fase::Inspira => 0.4 * (self.t / self.resp.ins.durata).min(1.0),
            Fase::Cima => 0.4,
            Fase::Espira => 0.4 + 0.6 * (self.t / self.resp.esp.durata).min(1.0),
            Fase::Fondo | Fase::Fermo => -1.0,
        }
    }

    /// Un’inspirazione di sorpresa, poi il fiato trattenuto per un secondo e mezzo.
    pub fn sorpresa(&mut self) {
        let mut ins = inspira(0.32, 1.0, 1.0, 1.0);
        ins.cima = 0.3;
        let esp = espira(1.7, 0.45, 0.6, 0.4);
        self.resp = Respiro { ins, cima: 1.5, esp, fondo: 0.5 };
        self.fase = Fase::Inspira;
        self.t = 0.0;
    }

    /// La politica del respiro: che respiro viene adesso, secondo l’aria.
    fn politica(&mut self) -> Respiro {
        let a = self.aria;
        let c = &mut self.caso;
        let mut r = if a <= 15.0 {
            // l’ipossia: respiri piccoli e irregolari, ogni tanto uno che manca l’aria,
            // ogni tanto un sospiro lunghissimo
            if c.una_su(6) {
                let mut esp = espira(3.5, 0.45, 0.8, 0.4);
                esp.voce = 0.12;
                Respiro { ins: inspira(2.0, 0.6, 0.6, 0.6), cima: 0.4, esp, fondo: c.tra(0.8, 2.0) }
            } else if c.una_su(6) {
                let mut ins = inspira(0.45, 0.9, 1.0, 1.0);
                ins.cima = 0.35;
                Respiro { ins, cima: 0.05, esp: espira(1.2, 0.4, 0.9, 0.5), fondo: c.tra(0.4, 1.5) }
            } else {
                Respiro {
                    ins: inspira(c.tra(0.7, 1.1), c.tra(0.3, 0.45), 0.7, 0.5),
                    cima: 0.05,
                    esp: espira(c.tra(1.0, 1.6), c.tra(0.25, 0.35), 0.8, 0.4),
                    fondo: c.tra(0.3, 2.6),
                }
            }
        } else if a < 30.0 {
            // la fame d’aria: inspirazioni più profonde e più rumorose
            let mut ins = inspira(1.0, 0.9, 0.95, 0.9);
            ins.cima = 0.42;
            if c.una_su(3) {
                ins.fischio = 0.12;
                ins.fischio_f = c.tra(1800.0, 2500.0);
            }
            ins.schiocco = c.una_su(5);
            let mut esp = espira(1.5, 0.64, 0.95, 0.6);
            esp.cima = 0.18;
            esp.voce = 0.06;
            Respiro { ins, cima: 0.05, esp, fondo: 0.18 }
        } else if a <= 60.0 {
            // l’ambra: dalla bocca
            let mut ins = inspira(1.3, 0.84, 0.75, 0.6);
            ins.schiocco = c.una_su(3);
            Respiro { ins, cima: 0.1, esp: espira(1.9, 0.63, 0.8, 0.45), fondo: 0.23 }
        } else if self.conta % 12 == 11 {
            // un sospiro ogni dodici respiri
            let mut esp = espira(3.2, 0.6, 0.8, 0.45);
            esp.cima = 0.12;
            esp.voce = 0.14;
            Respiro { ins: inspira(2.2, 0.75, 0.5, 0.6), cima: 0.45, esp, fondo: 0.8 }
        } else {
            // il verde: dal naso, quasi inudibile
            Respiro { ins: inspira(1.6, 0.37, 0.08, 0.45), cima: 0.15, esp: espira(2.4, 0.28, 0.12, 0.35), fondo: 0.45 }
        };
        if self.sforzo {
            // lo sforzo: sei respiri al minuto in più e un gradino di forza
            let periodo = r.ins.durata + r.cima + r.esp.durata + r.fondo;
            let nuovo = 60.0 / (60.0 / periodo + 6.0);
            let k = nuovo / periodo;
            for m in [&mut r.ins, &mut r.esp] {
                m.durata *= k;
                m.picco *= 1.15;
                m.bocca = m.bocca.max(0.85);
                m.luce = (m.luce + 0.2).min(1.0);
            }
            r.cima *= k;
            r.fondo *= k;
            r.esp.voce = r.esp.voce.max(0.07);
        }
        if self.ascolto {
            // l’ascolto: il fiato si fa più leggero e più lento
            for m in [&mut r.ins, &mut r.esp] {
                m.durata *= 1.15;
                m.picco *= db(-3.0);
            }
            r.fondo *= 1.15;
        }
        // ogni respiro è diverso dal precedente
        for m in [&mut r.ins, &mut r.esp] {
            m.durata *= c.tra(0.92, 1.08);
            m.picco *= db(c.tra(-1.5, 1.5));
            for f in m.formanti.iter_mut() {
                *f *= c.tra(0.94, 1.06);
            }
            m.naso *= c.tra(0.9, 1.1);
            m.bocca = (m.bocca + c.tra(-0.08, 0.08)).clamp(0.0, 1.0);
        }
        r.fondo *= c.tra(0.85, 1.15);
        r
    }

    fn avanza(&mut self) {
        self.t += self.dt;
        let r = self.resp;
        match self.fase {
            Fase::Fermo if self.acceso && self.t > 0.6 => self.inizia(),
            Fase::Inspira if self.t >= r.ins.durata => {
                self.fase = Fase::Cima;
                self.t = 0.0;
            }
            Fase::Cima if self.t >= r.cima => {
                self.fase = Fase::Espira;
                self.t = 0.0;
            }
            Fase::Espira if self.t >= r.esp.durata => {
                self.fase = Fase::Fondo;
                self.t = 0.0;
            }
            Fase::Fondo if self.t >= r.fondo => {
                if self.acceso {
                    self.inizia();
                } else {
                    self.fase = Fase::Fermo;
                    self.t = 0.0;
                }
            }
            _ => {}
        }
    }

    fn inizia(&mut self) {
        if self.morente == 1 {
            self.morente = 0;
            self.acceso = false;
            self.fase = Fase::Fermo;
            self.t = -1e9;
            return;
        }
        self.resp = self.politica();
        if self.morente > 1 {
            // ogni respiro più lento e più debole del precedente
            let k = (6 - self.morente) as f32;
            for m in [&mut self.resp.ins, &mut self.resp.esp] {
                m.durata *= 1.0 + 0.3 * k;
                m.picco *= 0.75f32.powf(k);
                m.bocca = 0.9;
            }
            self.resp.fondo = 1.5 + 1.2 * k;
            self.morente -= 1;
        }
        self.conta = self.conta.wrapping_add(1);
        self.fase = Fase::Inspira;
        self.t = 0.0;
        if self.resp.ins.schiocco {
            let s = self.caso.tra(0.9, 1.15);
            let g = self.caso.tra(0.05, 0.1);
            self.schiocco = [Modo::nuovo(2100.0 * s, 0.008, g, self.sr), Modo::nuovo(3400.0 * s, 0.005, g * 0.6, self.sr)];
            for m in self.schiocco.iter_mut() {
                m.elabora(1.0);
            }
        }
    }

    /// Il mezzo respiro in corso e dove siamo (0–1), se si sta respirando.
    fn in_corso(&self) -> Option<(Mezzo, f32)> {
        match self.fase {
            Fase::Inspira => Some((self.resp.ins, self.t / self.resp.ins.durata)),
            Fase::Espira => Some((self.resp.esp, self.t / self.resp.esp.durata)),
            _ => None,
        }
    }

    #[inline]
    pub fn campione(&mut self) -> f32 {
        if !self.acceso && self.fase == Fase::Fermo && self.forza < 1e-5 {
            return 0.0;
        }
        self.avanza();
        let corso = self.in_corso();
        let (m, flusso) = match corso {
            Some((m, x)) => (m, campana(x, m.cima).powf(1.4)),
            None => (if self.fase == Fase::Cima { self.resp.esp } else { self.resp.ins }, 0.0),
        };
        // la forza scorre (otto millisecondi): niente scatti, nemmeno quando un respiro
        // ne interrompe un altro
        self.forza += (flusso * m.picco - self.forza) * self.k_forza;
        let a = self.forza;

        // ogni sedici campioni i filtri seguono il respiro
        self.conto = self.conto.wrapping_add(1);
        if self.conto.is_multiple_of(16) {
            let k = 1.0 - (-16.0 / (0.06 * self.sr)).exp();
            for i in 0..4 {
                self.formanti[i] += (m.formanti[i] - self.formanti[i]) * k;
                self.bande[i] += (m.bande[i] - self.bande[i]) * k;
                self.tratto[i].imposta(self.formanti[i], self.bande[i], self.sr);
            }
            self.naso.imposta(m.naso, if self.fase == Fase::Inspira { 0.6 } else { 0.5 }, self.sr);
            self.fischio.imposta(m.fischio_f, 14.0, self.sr);
            // la bocca si schiarisce con il flusso, ma resta scura: i respiri veri dalla
            // bocca cadono in fretta sopra i 2–3 kHz
            let su = (a / m.picco.max(0.05)).min(1.0);
            self.chiaro.imposta(500.0 + 5000.0 * m.luce * (0.2 + 0.8 * su), self.sr);
        }
        if a < 1e-6 && self.schiocco[0].energia() < 1e-6 {
            return 0.0;
        }

        // la turbolenza trema: un rumore lento che modula il rumore veloce
        let tremito = 1.0 + 0.55 * self.turbo.elabora(self.caso.gauss() * 11.0, 0).clamp(-1.6, 1.6);
        let n1 = self.caso.gauss() * tremito;
        let n2 = self.caso.gauss() * tremito;

        // la bocca: il soffio attraverso le formanti, e la voce se c’è
        let mut ingresso = n1 * a * m.bocca * BOCCA_G;
        if m.voce > 0.0
            && self.fase == Fase::Espira
            && let Some((_, x)) = corso
        {
            let f0 = 108.0 * (1.1 - 0.25 * x);
            self.glottide += f0 * self.dt * (1.0 + 0.01 * self.caso.bianco());
            if self.glottide >= 1.0 {
                self.glottide -= 1.0;
            }
            // la glottide che si apre e si chiude (KLGLOTT88): la derivata del flusso
            let oq = 0.65;
            let g = if self.glottide < oq {
                let u = self.glottide / oq;
                2.0 * u - 3.0 * u * u
            } else {
                0.0
            };
            let accesa = campana(x, 0.12).powf(2.0);
            ingresso += self.inclina.elabora(g, 0) * m.voce * accesa * a * VOCE_G * 4.0;
        }
        let mut bocca = ingresso;
        for r in self.tratto.iter_mut() {
            bocca = r.elabora(bocca);
        }
        // il naso: una banda alta e larga, chiara (le narici sono vicine all’uscita)
        let naso = self.naso_lp.elabora(self.naso.banda(n2), 0) * a * (1.0 - m.bocca) * NASO_G;
        // le labbra e i denti: un sibilo che cresce più in fretta del flusso
        let su = (a / m.picco.max(0.05)).min(1.0);
        let labbra = self.labbra.banda(n1) * a * su * m.bocca * m.luce * LABBRA_G;
        let fischio = self.fischio.banda(n2) * a * su * m.fischio * FISCHIO_G;
        let mut y = self.chiaro.elabora(bocca + labbra, 0) + naso + fischio;
        // lo schiocco delle labbra
        y += self.schiocco[0].elabora(0.0) + self.schiocco[1].elabora(0.0);
        y * FIATO_G
    }
}

#[cfg(test)]
mod prove {
    use super::*;

    /// Il fiato segue l’aria: più spesso quando l’aria cala.
    #[test]
    fn il_fiato_segue_l_aria() {
        let sr = 48000.0;
        let conta = |aria: f32| {
            let mut f = Fiato::nuovo(sr, 5);
            f.acceso = true;
            f.aria = aria;
            let mut respiri = 0;
            let mut prima = -1.0f32;
            for _ in 0..(sr as usize * 60) {
                let y = f.campione();
                assert!(y.is_finite());
                let fase = f.fase();
                if prima < 0.0 && (0.0..0.1).contains(&fase) {
                    respiri += 1;
                }
                prima = fase;
            }
            respiri
        };
        let verde = conta(90.0);
        let rosso = conta(25.0);
        assert!((11..=15).contains(&verde), "verde {verde}");
        assert!((19..=25).contains(&rosso), "rosso {rosso}");
    }
}
