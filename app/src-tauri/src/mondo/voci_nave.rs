//! Le voci della nave (documento 35): le echi che il Sintonizzatore aggancia, le registrazioni
//! che lo scanner legge, l’ultima voce. Sono quindici voci disegnate con ElevenLabs e lavorate una
//! battuta per file (`strumenti/audio/voci_nave.py`): l’aggancio della sintonia, il traduttore,
//! i vuoti stanno già nel file. Qui si decide soltanto quando entrano.
//!
//! Le battute di un turno vanno **in fila**: la prima dopo un attimo (il tempo in cui il filo
//! sintetico entrava), ognuna delle altre dopo la fine della precedente e una pausa vera
//! (`PAUSA_FRA_VOCI`). L’autore, ascoltate le echi il 7 novembre 2026: le voci che si rispondono
//! stavano «troppo a ridosso della fine frase della voce precedente».
//!
//! Il suono va nella cuffia (il canale `em` del mondo) e sul cursore del parlato: lo mescola
//! `Mondo::rendi`. I file si decodificano fuori dal thread audio, come la musica (musica_file.rs).

use std::path::PathBuf;

use super::musica_file::{Biblioteca, Dopo, Lettore, Pezzo, Richiesta};

/// I secondi di silenzio fra la fine di una voce e l’inizio della successiva: una pausa che si
/// sente, come fra due persone che non parlano nella stessa stanza. Le battute hanno in testa e in
/// coda pochi centesimi di silenzio (fra 0 e 0,4 s): fra le parole ne restano da 1,4 a 1,9.
pub const PAUSA_FRA_VOCI: f32 = 1.4;

/// Quante battute può tenere la fila (il corridoio ne ha quattro).
const MAX_FILA: usize = 12;

/// Dopo quanti secondi di silenzio i file decodificati lasciano la memoria.
const LIBERA_DOPO: f32 = 30.0;

pub struct VociNave {
    lettore: Lettore,
    fila: Vec<Pezzo>,
    /// i secondi che mancano alla prossima battuta della fila (contano solo quando nessuno parla)
    attesa: f32,
    /// qualcuno parlava al passo di prima: quando smette, comincia la pausa
    parlava: bool,
    /// da quanto tutto tace
    muto_da: f32,
}

impl VociNave {
    pub fn nuove(sr: f32) -> Self {
        VociNave { lettore: Lettore::nuovo(sr), fila: Vec::with_capacity(MAX_FILA), attesa: 0.0, parlava: false, muto_da: 0.0 }
    }

    /// Dove stanno i file (la stessa cartella della musica).
    pub fn con_cartella(&mut self, cartella: PathBuf) {
        self.lettore.biblioteca = Some(Biblioteca::nuova(cartella));
    }

    /// Per le prove e i rendering senza file: una biblioteca fatta a mano.
    pub fn con_biblioteca(&mut self, b: Biblioteca) {
        self.lettore.biblioteca = Some(b);
    }

    /// Ci sono i file di tutte queste battute?
    pub fn disponibili(&self, battute: &[Pezzo]) -> bool {
        !battute.is_empty() && self.lettore.disponibile(battute)
    }

    /// Qualcuno parla, o una battuta aspetta il suo turno.
    pub fn occupate(&self) -> bool {
        self.lettore.attivo() || !self.fila.is_empty()
    }

    /// In questo istante una voce suona (non conta la fila).
    pub fn parla(&self) -> bool {
        self.lettore.attivo()
    }

    /// Mette in fila le battute. Se nessuno parla e la fila è vuota, la prima entra fra `ritardo`
    /// secondi; se no, dopo quelle che ci sono già, con la pausa.
    pub fn in_fila(&mut self, battute: &[Pezzo], ritardo: f32) {
        if !self.occupate() {
            self.attesa = ritardo;
        }
        for &p in battute {
            if self.fila.len() < MAX_FILA {
                self.lettore.precarica(p);
                self.fila.push(p);
            }
        }
    }

    /// Le battute prendono il posto di quello che suonava (una battuta di dialogo che lascia il posto alla
    /// successiva): quello che c’era sfuma in `sfuma` secondi, e la prima nuova entra fra `ritardo`, senza pausa.
    pub fn sostituisci(&mut self, battute: &[Pezzo], ritardo: f32, sfuma: f32) {
        self.tace(sfuma);
        self.parlava = false;
        self.attesa = ritardo;
        for &p in battute {
            if self.fila.len() < MAX_FILA {
                self.lettore.precarica(p);
                self.fila.push(p);
            }
        }
    }

    /// Fa partire una battuta adesso, fuori dalla fila (il giro dell’anello del Piccolo).
    pub fn subito(&mut self, p: Pezzo) {
        self.lettore.avvia(richiesta(p));
        self.parlava = true;
    }

    /// Comincia a decodificare una battuta che servirà presto.
    pub fn precarica(&mut self, p: Pezzo) {
        self.lettore.precarica(p);
    }

    /// Tutto tace in `s` secondi, e la fila si svuota (una partita che si carica).
    pub fn tace(&mut self, s: f32) {
        self.fila.clear();
        self.lettore.tace(s);
    }

    /// Fa andare il tempo, una volta per blocco.
    pub fn passo(&mut self, dt: f32) {
        self.lettore.passo(dt);
        // quello che sta sfumando via non conta: la fila non lo aspetta
        let parla = self.lettore.vivo();
        if self.parlava && !parla {
            // una voce è finita: la prossima aspetta la pausa
            self.attesa = PAUSA_FRA_VOCI;
        }
        self.parlava = parla;
        if !parla && !self.fila.is_empty() {
            self.attesa -= dt;
            if self.attesa <= 0.0 {
                let p = self.fila.remove(0);
                self.lettore.avvia(richiesta(p));
                self.parlava = true;
            }
        }
        if self.occupate() {
            self.muto_da = 0.0;
        } else {
            self.muto_da += dt;
            if self.muto_da >= LIBERA_DOPO && self.muto_da - dt < LIBERA_DOPO {
                self.lettore.tieni(&[]);
            }
        }
    }

    /// Un campione, stereo, senza cursori né livelli (stanno nel mixer).
    #[inline]
    pub fn campione(&mut self) -> (f32, f32) {
        self.lettore.campione()
    }
}

/// La battuta intera, com’è: le sue dissolvenze ce le ha già.
fn richiesta(p: Pezzo) -> Richiesta {
    Richiesta { pezzo: p, da: 0.0, a: None, entra: 0.005, dopo: Dopo::Niente, incrocio: 0.0, esce: 0.0, livello: 0.0 }
}

#[cfg(test)]
mod prove {
    use super::*;
    use crate::mondo::musica_file::Pcm;

    const SR: f32 = 48000.0;

    /// Una battuta finta: `secondi` di un tono, per vedere quando suona.
    fn battuta(secondi: f32) -> Pcm {
        Pcm::da_frame(SR, (0..(secondi * SR) as usize).map(|n| {
            let v = 0.3 * (n as f32 * 0.05).sin();
            (v, v)
        }))
    }

    fn voci_con(battute: &[(Pezzo, f32)]) -> VociNave {
        let mut b = Biblioteca::nuova(PathBuf::from("non-esiste"));
        for &(p, s) in battute {
            b.inserisci(p, battuta(s));
        }
        let mut v = VociNave::nuove(SR);
        v.con_biblioteca(b);
        v
    }

    /// Fa suonare per `secondi` e dice, per ogni blocco di 10 ms, se si sentiva qualcosa.
    fn ascolta(v: &mut VociNave, secondi: f32) -> Vec<bool> {
        let blocco = (SR * 0.01) as usize;
        (0..(secondi / 0.01) as usize)
            .map(|_| {
                v.passo(0.01);
                let mut e = 0.0f32;
                for _ in 0..blocco {
                    let (l, _) = v.campione();
                    e += l * l;
                }
                e > 1e-6
            })
            .collect()
    }

    /// I tratti di suono: (inizio, fine) in secondi.
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
    fn le_voci_in_fila_hanno_la_pausa_fra_l_una_e_l_altra() {
        let mut v = voci_con(&[(Pezzo::Nv01, 2.0), (Pezzo::Nv02, 1.5), (Pezzo::Nv03, 1.0)]);
        v.in_fila(&[Pezzo::Nv01, Pezzo::Nv02, Pezzo::Nv03], 1.6);
        let t = tratti(&ascolta(&mut v, 12.0));
        assert_eq!(t.len(), 3, "tre voci, una dopo l’altra: {t:?}");
        assert!((t[0].0 - 1.6).abs() < 0.05, "la prima entra dopo 1,6 s: {t:?}");
        for k in 1..3 {
            let pausa = t[k].0 - t[k - 1].1;
            assert!((pausa - PAUSA_FRA_VOCI).abs() < 0.05, "la pausa fra la voce {k} e la precedente è {pausa:.2} s");
        }
        assert!(!v.occupate());
    }

    #[test]
    fn una_battuta_che_arriva_mentre_un_altra_parla_aspetta_la_sua_pausa() {
        let mut v = voci_con(&[(Pezzo::Nv08, 3.0), (Pezzo::Nv07c, 1.0)]);
        v.subito(Pezzo::Nv08);
        ascolta(&mut v, 1.0);
        v.in_fila(&[Pezzo::Nv07c], 0.5);
        let t = tratti(&ascolta(&mut v, 6.0));
        assert_eq!(t.len(), 2, "{t:?}");
        let pausa = t[1].0 - t[0].1;
        assert!((pausa - PAUSA_FRA_VOCI).abs() < 0.05, "«Dormi» entra {pausa:.2} s dopo la fine del giro");
    }

    #[test]
    fn una_battuta_nuova_prende_il_posto_di_quella_che_parla() {
        let mut v = voci_con(&[(Pezzo::Yu01, 4.0), (Pezzo::Yu04, 2.0)]);
        v.sostituisci(&[Pezzo::Yu01], 0.5, 0.3);
        let a = tratti(&ascolta(&mut v, 1.5));
        assert_eq!(a.len(), 1, "{a:?}");
        assert!((a[0].0 - 0.5).abs() < 0.05);
        v.sostituisci(&[Pezzo::Yu04], 0.5, 0.3);
        // il livello, ogni 10 ms: la prima sfuma in pochi decimi, la seconda entra dopo mezzo secondo, senza la
        // pausa delle echi, e dura intera
        let blocco = (SR * 0.01) as usize;
        let livelli: Vec<f32> = (0..400)
            .map(|_| {
                v.passo(0.01);
                (0..blocco).map(|_| v.campione().0.powi(2)).sum::<f32>()
            })
            .collect();
        assert!(livelli[40] < livelli[0] * 1e-3, "la battuta di prima non sfuma: {} contro {}", livelli[40], livelli[0]);
        assert!(livelli[55] > livelli[0] * 0.3, "la battuta nuova non è entrata a mezzo secondo");
        let fine = livelli.iter().rposition(|&e| e > 1e-6).unwrap() as f32 * 0.01;
        assert!((fine - 2.5).abs() < 0.05, "la battuta nuova finisce a {fine:.2} s, e doveva durare intera");
    }

    #[test]
    fn senza_file_non_c_e_niente_di_disponibile() {
        let v = voci_con(&[(Pezzo::Nv01, 1.0)]);
        assert!(v.disponibili(&[Pezzo::Nv01]));
        assert!(!v.disponibili(&[Pezzo::Nv01, Pezzo::Nv02]), "una battuta senza file");
        assert!(!v.disponibili(&[]));
        let nessuna = VociNave::nuove(SR);
        assert!(!nessuna.disponibili(&[Pezzo::Nv01]));
    }

    #[test]
    fn i_nomi_del_ponte_trovano_le_battute() {
        assert_eq!(Pezzo::della_battuta("NV-01-senza-ruolo"), Some(Pezzo::Nv01));
        assert_eq!(Pezzo::della_battuta("NV-15-ultima-voce"), Some(Pezzo::Nv15));
        assert_eq!(Pezzo::della_battuta("NV-15-ultima-voce.mp3"), None);
        assert!(Pezzo::Nv12c.parlato() && !Pezzo::AN1.parlato());
        assert_eq!(Pezzo::Nv08b.file(), ("NV", "NV-08b-piccolo-mezza.mp3"));
        // l'Anziano e Yusuf
        assert_eq!(Pezzo::della_voce("benvenuto"), Some(Pezzo::AN1));
        assert_eq!(Pezzo::della_voce("congedo-ascolto"), Some(Pezzo::AN3));
        assert_eq!(Pezzo::della_voce("tracce-parola"), Some(Pezzo::An24));
        assert_eq!(Pezzo::della_voce("tracce"), Some(Pezzo::An22));
        assert_eq!(Pezzo::della_voce("niente"), None);
        assert_eq!(Pezzo::della_battuta("YU-07-fuga-pezzo"), Some(Pezzo::Yu07));
        assert!(Pezzo::Yu03.yusuf() && Pezzo::Yu03.parlato() && !Pezzo::Nv01.yusuf() && !Pezzo::An10.parlato());
        // ogni battuta ha il suo file nella cartella, e la tabella le ha tutte
        let radice = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../audio/musica-ia");
        use super::super::musica_file::{BATTUTE_NV, VOCI_AN, VOCI_YU};
        for (p, nome) in BATTUTE_NV.iter().chain(VOCI_AN.iter()).chain(VOCI_YU.iter()) {
            assert!(Pezzo::TUTTI.contains(p), "{nome} non è fra tutti i pezzi");
            let (sotto, f) = p.file();
            assert_eq!(f, *nome);
            assert!(radice.join(sotto).join(nome).is_file(), "manca il file {nome}");
        }
    }

    #[test]
    fn il_livello_del_parlato_non_conta_i_silenzi() {
        // la stessa voce, una volta con tre secondi di silenzio in mezzo: il livello è lo stesso
        let tono = |n: usize| 0.2 * (n as f32 * 0.03).sin();
        let piena = Pcm::da_frame_con(SR, (0..(2.0 * SR) as usize).map(|n| (tono(n), tono(n))), true);
        let vuota = Pcm::da_frame_con(
            SR,
            (0..(5.0 * SR) as usize).map(|n| if (SR as usize..(4.0 * SR) as usize).contains(&n) { (0.0, 0.0) } else { (tono(n), tono(n)) }),
            true,
        );
        let a = Pcm::da_frame(SR, (0..(5.0 * SR) as usize).map(|n| if (SR as usize..(4.0 * SR) as usize).contains(&n) { (0.0, 0.0) } else { (tono(n), tono(n)) }));
        assert!((piena.norma() / vuota.norma() - 1.0).abs() < 0.05, "il silenzio cambia il livello del parlato");
        assert!(a.norma() > vuota.norma() * 1.3, "il livello della musica conta anche il silenzio");
    }
}
