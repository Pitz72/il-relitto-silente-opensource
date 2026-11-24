//! La voce di William (documento 41): le prese di Leonardo Tomassetti, come nel Viaggiatore. L’autore, 15 novembre
//! 2026: «Il modo in cui l’audio del parlato e dei dialoghi deve funzionare è esattamente come abbiamo fatto ne Il
//! Viaggiatore».
//!
//! - Il testo del turno compare, e William lo dice: le sue prese partono da sole, in fila, nell’ordine del testo.
//!   Fra una presa e l’altra una pausa breve (`PAUSA`, la pausa fra due righe del Viaggiatore).
//! - Le altre voci (le voci della nave, Yusuf, la scatola nera, la voce di servizio) aspettano che William abbia
//!   finito, e poi la loro pausa; le prese che nel testo vengono dopo una di loro (`poi`) aspettano a loro volta che
//!   tutte tacciano. Una presa `poi` sa anche dopo quante voci asciutte (Yusuf, L.V.) sta nel testo: entra dopo
//!   quella, e la voce che segue aspetta lei (le battute di Yusuf con il racconto in mezzo, documento 41, §5).
//!   E dopo quante parti della voce di servizio: il computer di bordo e la tuta parlano in mezzo al racconto, dove
//!   sta il loro testo (la scansione lunga; l’autore, 24 novembre 2026: «va sistemato»).
//! - Un comando nuovo lo fa tacere di colpo (`zitto`): il testo resta. F2 ridice le prese dell’ultimo turno.
//! - Passando con il mouse sopra una risposta di un dialogo, William la dice (`anteprima`): mai sopra chi sta
//!   parlando; un’anteprima può prendere il posto di un’altra.
//! - Una presa che non c’è resta muta.
//!
//! Esce asciutto, sul cursore del parlato: è il narratore, non passa dalla cuffia. I file si decodificano fuori dal
//! thread audio, come la musica (musica_file.rs).

use std::path::PathBuf;

use super::musica_file::{Biblioteca, Dopo, Lettore, Pezzo, Richiesta};

/// I secondi fra una presa di William e la successiva dello stesso turno: la pausa fra due righe del Viaggiatore.
pub const PAUSA: f32 = 0.55;
/// Quanto aspetta la prima presa di un turno: il testo comincia a comparire, e William comincia con lui.
pub const SUBITO: f32 = 0.15;
/// La prima presa della partita aspetta che l’intro abbia finito di aprirsi sulla plancia.
pub const ALL_INIZIO: f32 = 2.0;
/// Quanto ci mette a tacere quando chi gioca va avanti: di colpo, come nel Viaggiatore, ma senza uno scatto.
const TACE: f32 = 0.06;
/// Quante prese può tenere la fila di un turno.
const MAX_FILA: usize = 16;
/// Dopo quanti secondi di silenzio le prese decodificate lasciano la memoria.
const LIBERA_DOPO: f32 = 60.0;

pub struct Racconto {
    lettore: Lettore,
    /// le prese che vengono prima delle altre voci, e quelle che vengono dopo
    fila: Vec<Pezzo>,
    /// le prese che vengono dopo una voce, ognuna con quante voci asciutte, e quante parti della voce di servizio,
    /// stanno prima di lei nel testo
    poi: Vec<(Pezzo, u8, u8)>,
    /// le prese dell’ultimo turno, per F2
    ultime: Vec<Pezzo>,
    /// i secondi che mancano alla prossima presa (contano solo quando William tace)
    attesa: f32,
    /// William parlava al passo di prima: quando smette, comincia la pausa
    parlava: bool,
    /// quello che suona è un’anteprima (una risposta sotto il mouse), non il racconto del turno
    anteprima: bool,
    /// la voce di William è accesa (l’opzione «Voce di William»)
    pub accesa: bool,
    muto_da: f32,
}

impl Racconto {
    pub fn nuovo(sr: f32) -> Self {
        Racconto {
            lettore: Lettore::nuovo(sr),
            fila: Vec::with_capacity(MAX_FILA),
            poi: Vec::with_capacity(MAX_FILA),
            ultime: Vec::with_capacity(MAX_FILA),
            attesa: 0.0,
            parlava: false,
            anteprima: false,
            accesa: true,
            muto_da: 0.0,
        }
    }

    /// Dove stanno le prese (la cartella della musica: `audio/musica-ia/WI/`, o `musica/` dell’installazione).
    pub fn con_cartella(&mut self, cartella: PathBuf) {
        self.lettore.biblioteca = Some(Biblioteca::delle_prese(cartella));
    }

    /// Per le prove: una biblioteca fatta a mano.
    pub fn con_biblioteca(&mut self, b: Biblioteca) {
        self.lettore.biblioteca = Some(b);
    }

    /// William parla, o una sua presa aspetta il suo turno: le altre voci aspettano lui. Le prese che vengono
    /// dopo le altre voci non contano: sono loro ad aspettare.
    pub fn occupato(&self) -> bool {
        (self.lettore.vivo() && !self.anteprima) || !self.fila.is_empty()
    }

    /// In questo istante si sente William (il racconto o un’anteprima): per la pagina, che con Esc lo zittisce.
    pub fn parla(&self) -> bool {
        self.lettore.vivo() || !self.fila.is_empty() || !self.poi.is_empty()
    }

    /// Dopo quante voci asciutte entra la prossima presa che aspetta una voce: finite quelle, la loro fila cede a
    /// William.
    pub fn soglia(&self) -> Option<u8> {
        self.poi.first().map(|p| p.1)
    }

    /// Dopo quante parti della voce di servizio entra la prossima presa che aspetta una voce (niente, se non ne
    /// aspetta nessuna: allora la fila della nave non le deve cedere il passo).
    pub fn soglia_servizio(&self) -> Option<u8> {
        self.poi.first().map(|p| p.2).filter(|n| *n > 0)
    }

    /// Un turno nuovo: quello che diceva tace di colpo, e le prese del turno vanno in fila. `ritardo`: quando entra
    /// la prima.
    pub fn turno(&mut self, prima: &[Pezzo], poi: &[(Pezzo, u8, u8)], ritardo: f32) {
        self.zitto();
        if !self.accesa || (prima.is_empty() && poi.is_empty()) {
            return;
        }
        // F2 ridice l’ultimo turno in cui William ha parlato
        self.ultime.clear();
        for &p in prima.iter().chain(poi.iter().map(|p| &p.0)) {
            if self.ultime.len() < MAX_FILA {
                self.ultime.push(p);
            }
            self.lettore.precarica(p);
        }
        self.fila.extend(prima.iter().take(MAX_FILA));
        self.poi.extend(poi.iter().take(MAX_FILA));
        self.attesa = ritardo;
    }

    /// Chi gioca va avanti (un comando, un tasto): William tace di colpo, e la fila si svuota. Le prese
    /// dell’ultimo turno restano, per F2, finché non arriva un turno con le sue.
    pub fn zitto(&mut self) {
        self.lettore.tace(TACE);
        self.fila.clear();
        self.poi.clear();
        self.parlava = false;
        self.anteprima = false;
    }

    /// Il mondo è fermo e muto: le prese decodificate lasciano la memoria (revisione 37, M15).
    pub fn sgombra(&mut self) {
        self.fila.clear();
        self.poi.clear();
        self.ultime.clear();
        self.lettore.sgombra();
    }

    /// Una partita che comincia o si carica: F2 non ha più niente da ridire.
    pub fn dimentica(&mut self) {
        self.ultime.clear();
    }

    /// F2: le prese dell’ultimo turno, da capo.
    pub fn ridici(&mut self) {
        if !self.accesa || self.ultime.is_empty() {
            return;
        }
        let ultime = std::mem::take(&mut self.ultime);
        self.zitto();
        self.fila.extend_from_slice(&ultime);
        self.ultime = ultime;
        self.attesa = SUBITO;
    }

    /// Una risposta di un dialogo sotto il mouse: William la dice, se non sta già raccontando il turno.
    pub fn anteprima(&mut self, p: Pezzo) {
        if !self.accesa || self.occupato() || !self.poi.is_empty() {
            return;
        }
        self.lettore.tace(TACE);
        self.lettore.avvia(richiesta(p));
        self.anteprima = true;
        self.parlava = true;
    }

    /// Fa andare il tempo, una volta per blocco. `altri`: un’altra voce parla (la nave, la radio, l’Anziano), e le
    /// prese che vengono dopo di lei aspettano. `asciutte`: quante battute della fila di Yusuf e di L.V. sono finite
    /// nel turno; la presa che ne aspetta di più aspetta. `servizio`: lo stesso per le parti della voce di servizio.
    pub fn passo(&mut self, dt: f32, altri: bool, asciutte: u8, servizio: u8) {
        self.lettore.passo(dt);
        let parla = self.lettore.vivo();
        if self.parlava && !parla {
            self.attesa = PAUSA;
            self.anteprima = false;
        }
        self.parlava = parla;
        if !parla {
            if !self.fila.is_empty() {
                self.attesa -= dt;
                if self.attesa <= 0.0 {
                    let p = self.fila.remove(0);
                    self.lettore.avvia(richiesta(p));
                    self.parlava = true;
                }
            } else if let Some(&(_, n, s)) = self.poi.first() {
                if altri || n > asciutte || s > servizio {
                    self.attesa = self.attesa.max(PAUSA);
                } else {
                    self.attesa -= dt;
                    if self.attesa <= 0.0 {
                        let (p, _, _) = self.poi.remove(0);
                        self.lettore.avvia(richiesta(p));
                        self.parlava = true;
                    }
                }
            }
        }
        if self.parla() {
            self.muto_da = 0.0;
        } else {
            self.muto_da += dt;
            if self.muto_da >= LIBERA_DOPO && self.muto_da - dt < LIBERA_DOPO {
                self.lettore.tieni(&self.ultime);
            }
        }
    }

    /// Un campione, stereo, senza cursori né livelli (stanno nel mixer).
    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        self.lettore.campione()
    }
}

/// La presa intera, com’è: i suoi capi li ha già.
fn richiesta(p: Pezzo) -> Richiesta {
    Richiesta { pezzo: p, da: 0.0, a: None, entra: 0.005, dopo: Dopo::Niente, incrocio: 0.0, esce: 0.0, livello: 0.0 }
}

#[cfg(test)]
mod prove {
    use super::*;
    use crate::mondo::musica_file::Pcm;

    const SR: f32 = 48000.0;

    fn presa(secondi: f32) -> Pcm {
        Pcm::da_frame(SR, (0..(secondi * SR) as usize).map(|n| {
            let v = 0.3 * (n as f32 * 0.05).sin();
            (v, v)
        }))
    }

    fn w(i: u16) -> Pezzo {
        Pezzo::Wi(i)
    }

    fn racconto_con(prese: &[(Pezzo, f32)]) -> Racconto {
        let mut b = Biblioteca::nuova_con(PathBuf::from("non-esiste"), std::iter::empty());
        for &(p, s) in prese {
            b.inserisci(p, presa(s));
        }
        let mut r = Racconto::nuovo(SR);
        r.con_biblioteca(b);
        r
    }

    /// Fa suonare per `secondi`; `altri(t)` dice se in quell’istante parla un’altra voce. Per ogni blocco di 10 ms:
    /// si sentiva William?
    fn ascolta(r: &mut Racconto, secondi: f32, altri: impl Fn(f32) -> bool) -> Vec<bool> {
        let blocco = (SR * 0.01) as usize;
        (0..(secondi / 0.01) as usize)
            .map(|k| {
                r.passo(0.01, altri(k as f32 * 0.01), u8::MAX, u8::MAX);
                let mut e = 0.0f32;
                for _ in 0..blocco {
                    let (l, _) = r.campione();
                    e += l * l;
                }
                e > 1e-6
            })
            .collect()
    }

    fn tratti(s: &[bool]) -> Vec<(f32, f32)> {
        let mut out = Vec::new();
        let mut da = None;
        for (i, &x) in s.iter().enumerate() {
            match (x, da) {
                (true, None) => da = Some(i),
                (false, Some(a)) => {
                    out.push((a as f32 * 0.01, i as f32 * 0.01));
                    da = None;
                }
                _ => {}
            }
        }
        if let Some(a) = da {
            out.push((a as f32 * 0.01, s.len() as f32 * 0.01));
        }
        out
    }

    #[test]
    fn le_prese_del_turno_partono_subito_in_fila_con_la_pausa() {
        let mut r = racconto_con(&[(w(0), 2.0), (w(1), 1.0)]);
        r.turno(&[w(0), w(1)], &[], SUBITO);
        let t = tratti(&ascolta(&mut r, 6.0, |_| false));
        assert_eq!(t.len(), 2, "{t:?}");
        assert!((t[0].0 - SUBITO).abs() < 0.03, "la prima entra con il testo: {t:?}");
        assert!((t[1].0 - t[0].1 - PAUSA).abs() < 0.03, "la pausa fra le due prese: {t:?}");
        assert!(!r.parla());
    }

    #[test]
    fn un_comando_nuovo_lo_fa_tacere_di_colpo_e_f2_lo_ridice() {
        let mut r = racconto_con(&[(w(0), 3.0), (w(1), 1.0)]);
        r.turno(&[w(0)], &[], SUBITO);
        assert!(ascolta(&mut r, 1.0, |_| false).iter().any(|x| *x));
        // un comando che non ha prese sue: William tace entro un decimo di secondo
        r.turno(&[], &[], SUBITO);
        let dopo = ascolta(&mut r, 1.0, |_| false);
        assert!(dopo.iter().skip(10).all(|x| !*x), "William parla ancora dopo il comando");
        // F2 ridice l’ultimo turno con le sue prese
        r.turno(&[w(1)], &[], SUBITO);
        ascolta(&mut r, 2.0, |_| false);
        r.ridici();
        let t = tratti(&ascolta(&mut r, 2.0, |_| false));
        assert_eq!(t.len(), 1, "F2: {t:?}");
        assert!((t[0].1 - t[0].0 - 1.0).abs() < 0.05);
    }

    #[test]
    fn le_prese_che_vengono_dopo_una_voce_la_aspettano() {
        let mut r = racconto_con(&[(w(0), 1.0), (w(1), 1.0)]);
        r.turno(&[w(0)], &[(w(1), 0, 0)], SUBITO);
        // un’altra voce parla da 1,5 a 3 s (entra dopo William): la seconda presa aspetta lei, e la pausa
        let t = tratti(&ascolta(&mut r, 6.0, |t| (1.5..3.0).contains(&t)));
        assert_eq!(t.len(), 2, "{t:?}");
        assert!(t[1].0 >= 3.0 + PAUSA - 0.03, "la presa dopo la voce entra a {:.2} s", t[1].0);
        // mentre una presa «poi» aspetta, William non tiene ferme le altre voci
        let mut r = racconto_con(&[(w(1), 1.0)]);
        r.turno(&[], &[(w(1), 0, 0)], SUBITO);
        assert!(!r.occupato());
    }

    #[test]
    fn una_presa_fra_due_parti_della_voce_di_servizio_aspetta_la_sua() {
        // William, il computer, William, il computer, William (la scansione lunga): la seconda parte aspetta che
        // sia finita una parte di servizio, la terza che ne siano finite due
        let mut r = racconto_con(&[(w(0), 1.0), (w(1), 1.0), (w(2), 1.0)]);
        r.turno(&[w(0)], &[(w(1), 0, 1), (w(2), 0, 2)], SUBITO);
        assert_eq!(r.soglia_servizio(), Some(1));
        let blocco = (SR * 0.01) as usize;
        let mut sentito = Vec::new();
        // nessun’altra voce suona, ma di parti di servizio non ne è finita nessuna: parla solo la prima presa
        for k in 0..600 {
            let finite = if k < 300 { 0 } else if k < 450 { 1 } else { 2 };
            r.passo(0.01, false, 0, finite);
            let mut e = 0.0f32;
            for _ in 0..blocco {
                let (l, _) = r.campione();
                e += l * l;
            }
            sentito.push(e > 1e-6);
        }
        let t = tratti(&sentito);
        assert_eq!(t.len(), 3, "{t:?}");
        assert!(t[0].1 < 1.3, "{t:?}");
        assert!(t[1].0 >= 3.0 && t[1].0 < 3.0 + PAUSA + 0.05, "la seconda entra quando la prima parte di servizio è finita: {t:?}");
        assert!(t[2].0 >= 4.5, "la terza aspetta la seconda parte di servizio: {t:?}");
        // una presa che non aspetta la voce di servizio non le chiede il passo
        let mut r = racconto_con(&[(w(1), 1.0)]);
        r.turno(&[], &[(w(1), 1, 0)], SUBITO);
        assert_eq!(r.soglia_servizio(), None);
        assert_eq!(r.soglia(), Some(1));
    }

    #[test]
    fn l_anteprima_di_una_risposta_non_parla_sopra_il_racconto() {
        let mut r = racconto_con(&[(w(0), 2.0), (w(5), 1.0), (w(6), 1.0)]);
        r.turno(&[w(0)], &[], SUBITO);
        ascolta(&mut r, 0.5, |_| false);
        r.anteprima(w(5));
        let t = tratti(&ascolta(&mut r, 4.0, |_| false));
        assert_eq!(t.len(), 1, "l’anteprima ha interrotto il racconto: {t:?}");
        // a racconto finito l’anteprima parte, e un’altra le prende il posto
        r.anteprima(w(5));
        ascolta(&mut r, 0.3, |_| false);
        r.anteprima(w(6));
        let t = tratti(&ascolta(&mut r, 2.0, |_| false));
        assert_eq!(t.len(), 1, "{t:?}");
        assert!((t[0].1 - t[0].0 - 1.0).abs() < 0.08, "la seconda anteprima suona intera: {t:?}");
        // l’anteprima non diventa l’ultimo turno di F2, e non tiene ferme le altre voci
        r.anteprima(w(5));
        ascolta(&mut r, 0.1, |_| false);
        assert!(!r.occupato());
    }

    #[test]
    fn spenta_la_voce_di_william_non_parte_niente() {
        let mut r = racconto_con(&[(w(0), 1.0)]);
        r.accesa = false;
        r.turno(&[w(0)], &[], SUBITO);
        r.ridici();
        r.anteprima(w(0));
        assert!(ascolta(&mut r, 2.0, |_| false).iter().all(|x| !*x));
    }

    #[test]
    fn una_presa_che_non_ce_resta_muta_e_non_ferma_le_altre() {
        let mut r = racconto_con(&[(w(1), 1.0)]);
        r.turno(&[w(0), w(1)], &[], SUBITO);
        let t = tratti(&ascolta(&mut r, 25.0, |_| false));
        assert_eq!(t.len(), 1, "{t:?}");
    }
}
