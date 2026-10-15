//! Le ventitré stanze, come suonano (bibbia sonora, §3). Ogni stanza dice in che
//! mondo sta (la Santa Maria, il vuoto, il relitto), com’è la sua aria (il riverbero),
//! quanto si sente il re, quali fondi la tengono viva, quanto brusio arriva, che cosa
//! ci succede da sé (le piogge di eventi), quali strati sono solo suoi e su che cosa
//! si cammina. I livelli sono in dB sugli strati già tarati (mod.rs, `LIV_*`).

/// Il mondo di una stanza: decide le strade del suono (§1.1, §2.2).
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Luogo {
    /// l’aria della nave di casa
    SantaMaria,
    /// lo scafo: il casco e le ossa, nient’altro
    Vuoto,
    /// la camera di compensazione: vuota finché la porta interna non si apre
    Camera,
    /// il relitto: un’atmosfera fredda e ferma, sentita dalla cuffia
    Relitto,
}

/// Su che cosa si cammina: il colore dei passi.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Superficie {
    /// lamiera, con la gomma delle suole
    Lamiera,
    /// lamiera coperta da un tappeto di gomma
    Tappeto,
    /// il grigliato della sala macchine (e la scaletta, entrando e uscendo)
    Grigliato,
    /// i magneti degli stivali, sullo scafo: solo nelle ossa
    Magneti,
    /// duro e un poco cavo, come su un osso grande
    Osso,
    /// il pavimento vuoto, poi i filamenti sotto gli stivali
    Filamenti,
    /// morbido
    Morbido,
    /// pietra levigata
    Pietra,
    /// duro, che squilla appena
    Cristallo,
    /// ovattato e sbagliato: la brina non prende impronte
    Brina,
    /// soffice, nella polvere grigia
    Polvere,
    /// una superficie che vibra
    Vibrante,
    /// ogni passo risuona come in una navata
    Navata,
    /// nessun passo: «I tuoi passi non fanno rumore»
    Nessuna,
    /// in discesa, sul materiale che si sbriciola
    Sbriciola,
}

/// Le piogge di eventi casuali.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Specie {
    Lamiera,
    Rele,
    Cigolio,
    Goccia,
    Crepa,
    Granello,
    /// i ganci della stiva, dopo l’urto dell’aggancio
    Gancio,
    /// i pilastri incrinati dell’arca della memoria: tic di cristallo
    Vetro,
}

/// Gli strati che sono solo di qualche stanza.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum Speciale {
    /// sala macchine: le tre toppe che vibrano con il quarto armonico del re
    Toppe,
    /// sala delle teche: il groviglio che segue il faro
    Groviglio,
    /// vivaio: il groviglio di là dalla parete est
    GroviglioLontano,
    /// gola del ritorno: «In fondo, a ovest, senti un fruscio che conosci»
    GroviglioInFondo,
    /// vivaio: il germinatoio che respira piano
    Germinatoio,
    /// gola di mezzo: un filo d’aria che sale dal basso
    VentoTubo,
    /// sala delle teche: l’aria fra le fibre del nodo, a est
    VentoCanne,
    /// scriptorium: i proiettori, un coro elettrico lentissimo
    Proiettori,
    /// scriptorium: il proiettore rotto, finché il disco è incastrato
    Scintille,
    /// arca della memoria: l’ultimo pilastro che pulsa
    Pilastro,
    /// serra morente: la vibrazione nelle ossa, finché la teca è sigillata
    Vibrazione,
    /// laboratorio di risonanza: la statica sotto il casco
    Statica,
    /// anticamera: il cuore, dopo dieci secondi
    Cuore,
    /// anticamera: il fischio dell’orecchio, dopo venti secondi
    Fischio,
    /// gola del ritorno: il tremito e la polvere che cade
    Tremito,
}

#[derive(Clone, Copy, Debug)]
pub struct Re {
    /// per l’aria (dB; `None` = niente)
    pub aria: Option<f32>,
    /// per le ossa (dB)
    pub ossa: Option<f32>,
    /// il passa-basso di quello che arriva (Hz)
    pub taglio: f32,
}

#[derive(Clone, Copy, Debug)]
pub struct Fondo {
    /// dB sullo strato tarato
    pub livello: f32,
    /// il colore: il passa-basso del fondo (Hz)
    pub taglio: f32,
    /// il respiro lento della stanza: periodo in secondi (0 = niente) e profondità (0–1)
    pub respiro: (f32, f32),
}

#[derive(Clone, Copy, Debug)]
pub struct Stanza {
    pub id: &'static str,
    pub luogo: Luogo,
    /// il riverbero: (rt bassi, rt acuti, umido, dimensione)
    pub riverbero: (f32, f32, f32, f32),
    pub re: Option<Re>,
    /// la ventilazione: (dB, colore della griglia)
    pub ventilazione: Option<(f32, f32)>,
    /// le pompe: (dB, passa-basso)
    pub pompe: Option<(f32, f32)>,
    pub fondo: Option<Fondo>,
    /// il brusio della nave: (voci, dB rispetto al vestibolo)
    pub brusio: Option<(f32, f32)>,
    /// (specie, intervallo in secondi, guadagno in dB)
    pub piogge: &'static [(Specie, (f32, f32), (f32, f32))],
    pub speciali: &'static [Speciale],
    pub passi: Superficie,
}

const fn re(aria: Option<f32>, ossa: Option<f32>, taglio: f32) -> Option<Re> {
    Some(Re { aria, ossa, taglio })
}

const fn fondo(livello: f32, taglio: f32) -> Option<Fondo> {
    Some(Fondo { livello, taglio, respiro: (0.0, 0.0) })
}

/// Le stanze del gioco, nell’ordine degli atti.
pub const STANZE: [Stanza; 23] = [
    // ---- Atto I, la Santa Maria
    Stanza {
        id: "plancia",
        luogo: Luogo::SantaMaria,
        riverbero: (0.45, 0.25, 0.55, 0.45),
        re: re(Some(0.0), Some(0.0), 180.0),
        ventilazione: Some((0.0, 1.0)),
        pompe: Some((0.0, 240.0)),
        fondo: None,
        brusio: None,
        piogge: &[
            (Specie::Lamiera, (15.0, 60.0), (-40.0, -31.0)),
            (Specie::Rele, (20.0, 40.0), (-38.0, -32.0)),
            (Specie::Cigolio, (60.0, 150.0), (-42.0, -35.0)),
        ],
        speciali: &[],
        passi: Superficie::Lamiera,
    },
    Stanza {
        id: "cuccetta",
        luogo: Luogo::SantaMaria,
        riverbero: (0.25, 0.15, 0.35, 0.35),
        re: re(None, Some(-14.0), 150.0),
        ventilazione: Some((-4.0, 1.5)),
        pompe: None,
        fondo: None,
        brusio: None,
        piogge: &[(Specie::Cigolio, (90.0, 160.0), (-44.0, -38.0))],
        speciali: &[],
        passi: Superficie::Tappeto,
    },
    Stanza {
        id: "sala macchine",
        luogo: Luogo::SantaMaria,
        riverbero: (0.8, 0.4, 0.6, 0.6),
        re: re(Some(8.0), Some(8.0), 2000.0),
        ventilazione: None,
        pompe: Some((7.0, 1500.0)),
        fondo: None,
        brusio: None,
        piogge: &[(Specie::Lamiera, (30.0, 80.0), (-40.0, -33.0))],
        speciali: &[Speciale::Toppe],
        passi: Superficie::Grigliato,
    },
    Stanza {
        id: "stiva",
        luogo: Luogo::SantaMaria,
        riverbero: (2.8, 1.2, 0.75, 1.8),
        re: re(Some(-8.0), Some(-4.0), 300.0),
        ventilazione: Some((-8.0, 0.3)),
        pompe: None,
        fondo: None,
        brusio: None,
        piogge: &[(Specie::Gancio, (8.0, 22.0), (-42.0, -34.0)), (Specie::Cigolio, (70.0, 140.0), (-44.0, -36.0))],
        speciali: &[],
        passi: Superficie::Lamiera,
    },
    // ---- Atto II, l’ingresso
    Stanza {
        id: "scafo",
        luogo: Luogo::Vuoto,
        riverbero: (0.3, 0.2, 0.0, 1.0),
        re: re(None, Some(0.0), 250.0),
        ventilazione: None,
        pompe: None,
        fondo: None,
        brusio: None,
        piogge: &[],
        speciali: &[],
        passi: Superficie::Magneti,
    },
    Stanza {
        id: "camera di compensazione",
        luogo: Luogo::Camera,
        riverbero: (0.5, 0.3, 0.5, 0.4),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-22.0, 600.0),
        brusio: None,
        piogge: &[],
        speciali: &[],
        passi: Superficie::Osso,
    },
    Stanza {
        id: "vestibolo delle gole",
        luogo: Luogo::Relitto,
        riverbero: (1.3, 0.6, 0.7, 1.0),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-24.0, 700.0),
        brusio: Some((16.0, 0.0)),
        piogge: &[
            (Specie::Granello, (20.0, 55.0), (-38.0, -30.0)),
            (Specie::Crepa, (40.0, 90.0), (-46.0, -38.0)),
            (Specie::Goccia, (14.0, 40.0), (-40.0, -32.0)),
        ],
        speciali: &[],
        passi: Superficie::Osso,
    },
    Stanza {
        id: "gola di mezzo",
        luogo: Luogo::Relitto,
        riverbero: (0.6, 0.3, 0.6, 0.4),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-24.0, 500.0),
        brusio: Some((24.0, 4.0)),
        piogge: &[(Specie::Goccia, (5.0, 16.0), (-38.0, -30.0))],
        speciali: &[Speciale::VentoTubo],
        passi: Superficie::Osso,
    },
    Stanza {
        id: "sala delle teche",
        luogo: Luogo::Relitto,
        riverbero: (3.0, 1.2, 0.65, 1.9),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-26.0, 800.0),
        brusio: Some((10.0, -6.0)),
        piogge: &[(Specie::Crepa, (25.0, 60.0), (-46.0, -38.0))],
        speciali: &[Speciale::Groviglio, Speciale::VentoCanne],
        passi: Superficie::Filamenti,
    },
    Stanza {
        id: "vivaio",
        luogo: Luogo::Relitto,
        riverbero: (0.5, 0.3, 0.5, 0.5),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-23.0, 350.0),
        brusio: Some((10.0, -8.0)),
        piogge: &[],
        speciali: &[Speciale::Germinatoio, Speciale::GroviglioLontano],
        passi: Superficie::Morbido,
    },
    // ---- Atto III, il corridoio e le ali
    Stanza {
        id: "corridoio principale",
        luogo: Luogo::Relitto,
        riverbero: (7.0, 2.5, 0.75, 2.2),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-26.0, 600.0),
        brusio: Some((8.0, -10.0)),
        piogge: &[],
        speciali: &[],
        passi: Superficie::Pietra,
    },
    Stanza {
        id: "santuario del silenzio",
        luogo: Luogo::Relitto,
        riverbero: (10.0, 3.0, 0.8, 2.2),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-34.0, 300.0),
        brusio: Some((8.0, -14.0)),
        piogge: &[],
        speciali: &[],
        passi: Superficie::Pietra,
    },
    Stanza {
        id: "scriptorium",
        luogo: Luogo::Relitto,
        riverbero: (2.0, 0.9, 0.6, 1.2),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-28.0, 600.0),
        brusio: Some((8.0, -12.0)),
        piogge: &[],
        speciali: &[Speciale::Proiettori, Speciale::Scintille],
        passi: Superficie::Pietra,
    },
    Stanza {
        id: "arca della memoria",
        luogo: Luogo::Relitto,
        riverbero: (4.0, 2.4, 0.7, 1.6),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-28.0, 900.0),
        brusio: Some((8.0, -12.0)),
        piogge: &[(Specie::Vetro, (12.0, 35.0), (-44.0, -36.0))],
        speciali: &[Speciale::Pilastro],
        passi: Superficie::Cristallo,
    },
    Stanza {
        id: "arca biologica",
        luogo: Luogo::Relitto,
        riverbero: (5.0, 1.8, 0.7, 2.0),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-30.0, 1300.0),
        brusio: Some((8.0, -14.0)),
        piogge: &[(Specie::Crepa, (35.0, 90.0), (-50.0, -42.0))],
        speciali: &[],
        passi: Superficie::Brina,
    },
    Stanza {
        id: "serra morente",
        luogo: Luogo::Relitto,
        riverbero: (3.0, 0.9, 0.6, 1.8),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-28.0, 400.0),
        brusio: Some((8.0, -12.0)),
        piogge: &[],
        speciali: &[Speciale::Vibrazione],
        passi: Superficie::Polvere,
    },
    Stanza {
        id: "laboratorio di risonanza",
        luogo: Luogo::Relitto,
        riverbero: (1.5, 0.7, 0.55, 1.1),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-26.0, 700.0),
        brusio: Some((8.0, -12.0)),
        piogge: &[],
        speciali: &[Speciale::Statica],
        passi: Superficie::Vibrante,
    },
    Stanza {
        id: "alloggio dell'equipaggio",
        luogo: Luogo::Relitto,
        riverbero: (3.5, 1.8, 0.75, 1.7),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-34.0, 500.0),
        brusio: Some((8.0, -14.0)),
        piogge: &[],
        speciali: &[],
        passi: Superficie::Navata,
    },
    Stanza {
        id: "nido",
        luogo: Luogo::Relitto,
        riverbero: (0.3, 0.2, 0.4, 0.3),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-30.0, 500.0),
        brusio: Some((8.0, -12.0)),
        piogge: &[],
        speciali: &[],
        passi: Superficie::Morbido,
    },
    // ---- Atto IV, il Ponte
    Stanza {
        id: "ponte di comando",
        luogo: Luogo::Relitto,
        riverbero: (4.5, 2.5, 0.7, 2.0),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-32.0, 500.0),
        brusio: Some((8.0, -14.0)),
        piogge: &[],
        speciali: &[],
        passi: Superficie::Pietra,
    },
    Stanza {
        id: "anticamera",
        luogo: Luogo::Relitto,
        riverbero: (0.1, 0.05, 0.0, 0.3),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: None,
        brusio: None,
        piogge: &[],
        speciali: &[Speciale::Cuore, Speciale::Fischio],
        passi: Superficie::Nessuna,
    },
    Stanza {
        id: "santuario centrale",
        luogo: Luogo::Relitto,
        riverbero: (2.5, 1.2, 0.6, 1.2),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: Some(Fondo { livello: -30.0, taglio: 450.0, respiro: (10.5, 0.85) }),
        brusio: None,
        piogge: &[],
        speciali: &[],
        passi: Superficie::Pietra,
    },
    // ---- Atto V, la fuga
    Stanza {
        id: "gola del ritorno",
        luogo: Luogo::Relitto,
        riverbero: (0.8, 0.4, 0.55, 0.5),
        re: None,
        ventilazione: None,
        pompe: None,
        fondo: fondo(-24.0, 500.0),
        brusio: Some((8.0, -12.0)),
        piogge: &[(Specie::Granello, (6.0, 16.0), (-38.0, -30.0))],
        speciali: &[Speciale::Tremito, Speciale::GroviglioInFondo],
        passi: Superficie::Sbriciola,
    },
];

/// La stanza con questo nome; il silenzio per un nome che il suono non conosce.
pub fn stanza(id: &str) -> Option<&'static Stanza> {
    STANZE.iter().find(|s| s.id == id)
}

#[cfg(test)]
mod prove {
    use super::*;

    #[test]
    fn ventitre_stanze_tutte_diverse() {
        let mut nomi: Vec<&str> = STANZE.iter().map(|s| s.id).collect();
        nomi.sort();
        nomi.dedup();
        assert_eq!(nomi.len(), 23);
        assert!(stanza("plancia").is_some());
        assert!(stanza("alloggio dell'equipaggio").is_some());
        assert!(stanza("cantina").is_none());
    }
}
