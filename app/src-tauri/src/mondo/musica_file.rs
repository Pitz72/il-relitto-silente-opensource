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

use super::prese_william::PRESE;
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
    /// «Havela», l’inno degli alieni (32, §3.11): ElevenLabs, in una lingua inventata; si ascolta dal colloquio con l’Anziano
    HV,
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
    /// Yusuf (documento 35, §1): le otto battute con la voce clonata dell’autore, già passate dalla radio; quelle con
    /// il racconto di William in mezzo divise in una parte per frase (documento 41, §5: a, b, c)
    Yu01a,
    Yu01b,
    Yu02a,
    Yu02b,
    Yu03a,
    Yu03b,
    Yu04a,
    Yu04b,
    Yu05a,
    Yu05b,
    Yu05c,
    Yu06,
    Yu07a,
    Yu07b,
    Yu08a,
    Yu08b,
    /// L.V. nella scatola nera della serra (documento 35, V4): «Elio» di Google, sul nastro vecchio dell’intro
    Lv02,
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
    /// la voce di servizio (documento 35, §11): la tuta e il gioco che parlano a chi gioca, «Kira» di Google;
    /// una parte per file (`strumenti/audio/taglia_servizio.py`), in fila con le voci della nave, asciutta
    Sv01,
    Sv02,
    Sv03,
    Sv04,
    Sv05,
    Sv06,
    Sv07,
    Sv08,
    Sv09,
    Sv10,
    Sv11,
    Sv12,
    Sv13,
    Sv14,
    Sv15,
    Sv16,
    Sv17,
    Sv18,
    Sv19,
    Sv20,
    Sv21,
    Sv22,
    Sv23,
    Sv24,
    Sv25,
    Sv26,
    Sv27,
    Sv28,
    Sv29,
    Sv30,
    Sv31,
    Sv32,
    Sv33,
    Sv34,
    Sv35,
    Sv36,
    Sv37,
    Sv38,
    Sv39,
    Sv40,
    Sv41,
    Sv42,
    Sv43,
    Sv44,
    Sv45,
    Sv46,
    Sv47,
    Sv48,
    Sv49,
    Sv50,
    Sv51,
    Sv52,
    Sv53,
    Sv54,
    Sv55,
    Sv56,
    Sv57,
    Sv58,
    Sv59,
    Sv60,
    Sv61,
    Sv62,
    Sv63,
    Sv64,
    Sv65,
    Sv66,
    Sv67,
    Sv68,
    Sv69,
    Sv70,
    Sv71,
    Sv72,
    Sv73,
    Sv74,
    Sv75,
    Sv76,
    Sv77,
    Sv78,
    Sv79,
    Sv80,
    Sv81,
    Sv82,
    Sv83,
    Sv84,
    Sv85,
    Sv86,
    Sv87,
    Sv88,
    Sv89,
    Sv90,
    Sv91,
    Sv92,
    Sv93,
    Sv94,
    Sv95,
    Sv96,
    Sv97,
    Sv98,
    Sv99,
    Sv100,
    Sv101,
    Sv102,
    Sv103,
    Sv104,
    Sv105,
    Sv106,
    Sv107,
    Sv108,
    Sv109,
    Sv110,
    Sv111,
    Sv112,
    Sv113,
    Sv114,
    Sv115,
    Sv116,
    Sv117,
    Sv118,
    Sv119,
    Sv120,
    Sv121,
    Sv122,
    Sv123,
    Sv124,
    Sv125,
    Sv126,
    Sv127,
    Sv128,
    Sv129,
    Sv130,
    Sv131,
    Sv132,
    Sv133,
    Sv134,
    Sv135,
    Sv136,
    Sv137,
    Sv138,
    Sv139,
    Sv140,
    Sv141,
    Sv142,
    Sv143,
    Sv144,
    Sv145,
    Sv146,
    /// l’intro nello spazio (documento 09, §17): il registro di bordo di William, detto da Leonardo Tomassetti
    Wi01,
    /// l’intro nello spazio: il messaggio di Yusuf dalla radio di plancia, quattro pezzi con il beep in mezzo,
    /// già lavorato (`strumenti/intro/voci_spazio.py`)
    Yu09,
    /// la voce di William nel gioco (documento 41): una presa di Leonardo Tomassetti, il numero della sua sigla in
    /// `prese_william::PRESE` (tutte le sigle del copione: una presa non ancora arrivata non ha il file, e resta muta)
    Wi(u16),
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

/// Le battute di Yusuf e i loro file: il nome senza «.mp3» è quello che manda il ponte (`VOCI_YUSUF`, e per le battute
/// divise `PARTI_YUSUF`).
pub const VOCI_YU: [(Pezzo, &str); 16] = [
    (Pezzo::Yu01a, "YU-01a-apertura.mp3"),
    (Pezzo::Yu01b, "YU-01b-apertura.mp3"),
    (Pezzo::Yu02a, "YU-02a-apertura-pezzo.mp3"),
    (Pezzo::Yu02b, "YU-02b-apertura-pezzo.mp3"),
    (Pezzo::Yu03a, "YU-03a-credito.mp3"),
    (Pezzo::Yu03b, "YU-03b-credito.mp3"),
    (Pezzo::Yu04a, "YU-04a-cosa.mp3"),
    (Pezzo::Yu04b, "YU-04b-cosa.mp3"),
    (Pezzo::Yu05a, "YU-05a-qualcuno.mp3"),
    (Pezzo::Yu05b, "YU-05b-qualcuno.mp3"),
    (Pezzo::Yu05c, "YU-05c-qualcuno.mp3"),
    (Pezzo::Yu06, "YU-06-voce.mp3"),
    (Pezzo::Yu07a, "YU-07a-fuga-pezzo.mp3"),
    (Pezzo::Yu07b, "YU-07b-fuga-pezzo.mp3"),
    (Pezzo::Yu08a, "YU-08a-fuga-nessuno.mp3"),
    (Pezzo::Yu08b, "YU-08b-fuga-nessuno.mp3"),
];

/// La scatola nera di L.V. nella serra: il nome senza «.mp3» è quello che manda il ponte (`VOCI_LV`).
pub const VOCI_LV: [(Pezzo, &str); 1] = [(Pezzo::Lv02, "LV-02-scatola-serra.mp3")];

/// Le parti della voce di servizio e i loro file, nell’ordine del manifest (doppiaggio/servizio/): il nome senza
/// «.mp3» è quello che manda il ponte (`VOCI_SERVIZIO`).
pub const VOCI_SV: [(Pezzo, &str); 146] = [
    (Pezzo::Sv01, "SV-01-protezione-vitale.mp3"),
    (Pezzo::Sv02, "SV-02-canale-aperto-da-remoto.mp3"),
    (Pezzo::Sv03, "SV-03-chiusura-rifiutata.mp3"),
    (Pezzo::Sv04, "SV-04-materiale-non-in-archivio.mp3"),
    (Pezzo::Sv05, "SV-05-sotto-protezione-vitale.mp3"),
    (Pezzo::Sv06, "SV-06-analisi-biometrica-specie-homo.mp3"),
    (Pezzo::Sv07, "SV-07-analisi-dell-archivio-centrale.mp3"),
    (Pezzo::Sv08, "SV-08-analisi-manifattura-origine-terrestre.mp3"),
    (Pezzo::Sv09, "SV-09-flora-di-xylos-deceduto.mp3"),
    (Pezzo::Sv10, "SV-10-lettura-fauna-dei-tre.mp3"),
    (Pezzo::Sv11, "SV-11-lunghezza-trecentoquaranta-metri-massa.mp3"),
    (Pezzo::Sv12, "SV-12-matrice-cento-completata.mp3"),
    (Pezzo::Sv13, "SV-13-matrice-cento.mp3"),
    (Pezzo::Sv14, "SV-14-matrice-diciotto.mp3"),
    (Pezzo::Sv15, "SV-15-matrice-quattro.mp3"),
    (Pezzo::Sv16, "SV-16-matrice-settantacinque.mp3"),
    (Pezzo::Sv17, "SV-17-adesso-puoi-accostare.mp3"),
    (Pezzo::Sv18, "SV-18-analizza-lo-scafo-nero.mp3"),
    (Pezzo::Sv19, "SV-19-analizzala.mp3"),
    (Pezzo::Sv20, "SV-20-analizzale.mp3"),
    (Pezzo::Sv21, "SV-21-analizzali.mp3"),
    (Pezzo::Sv22, "SV-22-analizzalo.mp3"),
    (Pezzo::Sv23, "SV-23-firma-la-placca-oppure.mp3"),
    (Pezzo::Sv24, "SV-24-firma-la-placca.mp3"),
    (Pezzo::Sv25, "SV-25-parla-con-l-anziano.mp3"),
    (Pezzo::Sv26, "SV-26-per-ascoltarla-ascolta-la.mp3"),
    (Pezzo::Sv27, "SV-27-per-ascoltarla-ascolta-la-tuta.mp3"),
    (Pezzo::Sv28, "SV-28-per-chiamare-yusuf-parla.mp3"),
    (Pezzo::Sv29, "SV-29-per-liberarlo-dalla-nicchia.mp3"),
    (Pezzo::Sv30, "SV-30-per-portarti-vicino-alla.mp3"),
    (Pezzo::Sv31, "SV-31-per-studiarla-meglio-analizzala.mp3"),
    (Pezzo::Sv32, "SV-32-per-svegliarla-usa-la.mp3"),
    (Pezzo::Sv33, "SV-33-prima-accosta.mp3"),
    (Pezzo::Sv34, "SV-34-ricarica-la-tuta-se.mp3"),
    (Pezzo::Sv35, "SV-35-sintonizza-le-cose-delle.mp3"),
    (Pezzo::Sv36, "SV-36-staccalo.mp3"),
    (Pezzo::Sv37, "SV-37-suona-il-sonaglio-se.mp3"),
    (Pezzo::Sv38, "SV-38-traducila.mp3"),
    (Pezzo::Sv39, "SV-39-traducile.mp3"),
    (Pezzo::Sv40, "SV-40-traducili.mp3"),
    (Pezzo::Sv41, "SV-41-usala.mp3"),
    (Pezzo::Sv42, "SV-42-registro-magazzino-quattro.mp3"),
    (Pezzo::Sv43, "SV-43-registro-da-dichiarare.mp3"),
    (Pezzo::Sv44, "SV-44-registro-da-registrare.mp3"),
    (Pezzo::Sv45, "SV-45-registro-carico-nessuno.mp3"),
    (Pezzo::Sv46, "SV-46-aria-zero-per-cento.mp3"),
    (Pezzo::Sv47, "SV-47-aria-uno-per-cento.mp3"),
    (Pezzo::Sv48, "SV-48-aria-due-per-cento.mp3"),
    (Pezzo::Sv49, "SV-49-aria-tre-per-cento.mp3"),
    (Pezzo::Sv50, "SV-50-aria-quattro-per-cento.mp3"),
    (Pezzo::Sv51, "SV-51-aria-cinque-per-cento.mp3"),
    (Pezzo::Sv52, "SV-52-aria-sei-per-cento.mp3"),
    (Pezzo::Sv53, "SV-53-aria-sette-per-cento.mp3"),
    (Pezzo::Sv54, "SV-54-aria-otto-per-cento.mp3"),
    (Pezzo::Sv55, "SV-55-aria-nove-per-cento.mp3"),
    (Pezzo::Sv56, "SV-56-aria-dieci-per-cento.mp3"),
    (Pezzo::Sv57, "SV-57-aria-undici-per-cento.mp3"),
    (Pezzo::Sv58, "SV-58-aria-dodici-per-cento.mp3"),
    (Pezzo::Sv59, "SV-59-aria-tredici-per-cento.mp3"),
    (Pezzo::Sv60, "SV-60-aria-quattordici-per-cento.mp3"),
    (Pezzo::Sv61, "SV-61-aria-quindici-per-cento.mp3"),
    (Pezzo::Sv62, "SV-62-aria-sedici-per-cento.mp3"),
    (Pezzo::Sv63, "SV-63-aria-diciassette-per-cento.mp3"),
    (Pezzo::Sv64, "SV-64-aria-diciotto-per-cento.mp3"),
    (Pezzo::Sv65, "SV-65-aria-diciannove-per-cento.mp3"),
    (Pezzo::Sv66, "SV-66-aria-venti-per-cento.mp3"),
    (Pezzo::Sv67, "SV-67-aria-ventuno-per-cento.mp3"),
    (Pezzo::Sv68, "SV-68-aria-ventidue-per-cento.mp3"),
    (Pezzo::Sv69, "SV-69-aria-ventitre-per-cento.mp3"),
    (Pezzo::Sv70, "SV-70-aria-ventiquattro-per-cento.mp3"),
    (Pezzo::Sv71, "SV-71-aria-venticinque-per-cento.mp3"),
    (Pezzo::Sv72, "SV-72-aria-ventisei-per-cento.mp3"),
    (Pezzo::Sv73, "SV-73-aria-ventisette-per-cento.mp3"),
    (Pezzo::Sv74, "SV-74-aria-ventotto-per-cento.mp3"),
    (Pezzo::Sv75, "SV-75-aria-ventinove-per-cento.mp3"),
    (Pezzo::Sv76, "SV-76-aria-trenta-per-cento.mp3"),
    (Pezzo::Sv77, "SV-77-aria-trentuno-per-cento.mp3"),
    (Pezzo::Sv78, "SV-78-aria-trentadue-per-cento.mp3"),
    (Pezzo::Sv79, "SV-79-aria-trentatre-per-cento.mp3"),
    (Pezzo::Sv80, "SV-80-aria-trentaquattro-per-cento.mp3"),
    (Pezzo::Sv81, "SV-81-aria-trentacinque-per-cento.mp3"),
    (Pezzo::Sv82, "SV-82-aria-trentasei-per-cento.mp3"),
    (Pezzo::Sv83, "SV-83-aria-trentasette-per-cento.mp3"),
    (Pezzo::Sv84, "SV-84-aria-trentotto-per-cento.mp3"),
    (Pezzo::Sv85, "SV-85-aria-trentanove-per-cento.mp3"),
    (Pezzo::Sv86, "SV-86-aria-quaranta-per-cento.mp3"),
    (Pezzo::Sv87, "SV-87-aria-quarantuno-per-cento.mp3"),
    (Pezzo::Sv88, "SV-88-aria-quarantadue-per-cento.mp3"),
    (Pezzo::Sv89, "SV-89-aria-quarantatre-per-cento.mp3"),
    (Pezzo::Sv90, "SV-90-aria-quarantaquattro-per-cento.mp3"),
    (Pezzo::Sv91, "SV-91-aria-quarantacinque-per-cento.mp3"),
    (Pezzo::Sv92, "SV-92-aria-quarantasei-per-cento.mp3"),
    (Pezzo::Sv93, "SV-93-aria-quarantasette-per-cento.mp3"),
    (Pezzo::Sv94, "SV-94-aria-quarantotto-per-cento.mp3"),
    (Pezzo::Sv95, "SV-95-aria-quarantanove-per-cento.mp3"),
    (Pezzo::Sv96, "SV-96-aria-cinquanta-per-cento.mp3"),
    (Pezzo::Sv97, "SV-97-aria-cinquantuno-per-cento.mp3"),
    (Pezzo::Sv98, "SV-98-aria-cinquantadue-per-cento.mp3"),
    (Pezzo::Sv99, "SV-99-aria-cinquantatre-per-cento.mp3"),
    (Pezzo::Sv100, "SV-100-aria-cinquantaquattro-per-cento.mp3"),
    (Pezzo::Sv101, "SV-101-aria-cinquantacinque-per-cento.mp3"),
    (Pezzo::Sv102, "SV-102-aria-cinquantasei-per-cento.mp3"),
    (Pezzo::Sv103, "SV-103-aria-cinquantasette-per-cento.mp3"),
    (Pezzo::Sv104, "SV-104-aria-cinquantotto-per-cento.mp3"),
    (Pezzo::Sv105, "SV-105-aria-cinquantanove-per-cento.mp3"),
    (Pezzo::Sv106, "SV-106-aria-sessanta-per-cento.mp3"),
    (Pezzo::Sv107, "SV-107-aria-sessantuno-per-cento.mp3"),
    (Pezzo::Sv108, "SV-108-aria-sessantadue-per-cento.mp3"),
    (Pezzo::Sv109, "SV-109-aria-sessantatre-per-cento.mp3"),
    (Pezzo::Sv110, "SV-110-aria-sessantaquattro-per-cento.mp3"),
    (Pezzo::Sv111, "SV-111-aria-sessantacinque-per-cento.mp3"),
    (Pezzo::Sv112, "SV-112-aria-sessantasei-per-cento.mp3"),
    (Pezzo::Sv113, "SV-113-aria-sessantasette-per-cento.mp3"),
    (Pezzo::Sv114, "SV-114-aria-sessantotto-per-cento.mp3"),
    (Pezzo::Sv115, "SV-115-aria-sessantanove-per-cento.mp3"),
    (Pezzo::Sv116, "SV-116-aria-settanta-per-cento.mp3"),
    (Pezzo::Sv117, "SV-117-aria-settantuno-per-cento.mp3"),
    (Pezzo::Sv118, "SV-118-aria-settantadue-per-cento.mp3"),
    (Pezzo::Sv119, "SV-119-aria-settantatre-per-cento.mp3"),
    (Pezzo::Sv120, "SV-120-aria-settantaquattro-per-cento.mp3"),
    (Pezzo::Sv121, "SV-121-aria-settantacinque-per-cento.mp3"),
    (Pezzo::Sv122, "SV-122-aria-settantasei-per-cento.mp3"),
    (Pezzo::Sv123, "SV-123-aria-settantasette-per-cento.mp3"),
    (Pezzo::Sv124, "SV-124-aria-settantotto-per-cento.mp3"),
    (Pezzo::Sv125, "SV-125-aria-settantanove-per-cento.mp3"),
    (Pezzo::Sv126, "SV-126-aria-ottanta-per-cento.mp3"),
    (Pezzo::Sv127, "SV-127-aria-ottantuno-per-cento.mp3"),
    (Pezzo::Sv128, "SV-128-aria-ottantadue-per-cento.mp3"),
    (Pezzo::Sv129, "SV-129-aria-ottantatre-per-cento.mp3"),
    (Pezzo::Sv130, "SV-130-aria-ottantaquattro-per-cento.mp3"),
    (Pezzo::Sv131, "SV-131-aria-ottantacinque-per-cento.mp3"),
    (Pezzo::Sv132, "SV-132-aria-ottantasei-per-cento.mp3"),
    (Pezzo::Sv133, "SV-133-aria-ottantasette-per-cento.mp3"),
    (Pezzo::Sv134, "SV-134-aria-ottantotto-per-cento.mp3"),
    (Pezzo::Sv135, "SV-135-aria-ottantanove-per-cento.mp3"),
    (Pezzo::Sv136, "SV-136-aria-novanta-per-cento.mp3"),
    (Pezzo::Sv137, "SV-137-aria-novantuno-per-cento.mp3"),
    (Pezzo::Sv138, "SV-138-aria-novantadue-per-cento.mp3"),
    (Pezzo::Sv139, "SV-139-aria-novantatre-per-cento.mp3"),
    (Pezzo::Sv140, "SV-140-aria-novantaquattro-per-cento.mp3"),
    (Pezzo::Sv141, "SV-141-aria-novantacinque-per-cento.mp3"),
    (Pezzo::Sv142, "SV-142-aria-novantasei-per-cento.mp3"),
    (Pezzo::Sv143, "SV-143-aria-novantasette-per-cento.mp3"),
    (Pezzo::Sv144, "SV-144-aria-novantotto-per-cento.mp3"),
    (Pezzo::Sv145, "SV-145-aria-novantanove-per-cento.mp3"),
    (Pezzo::Sv146, "SV-146-aria-cento-per-cento.mp3"),
];

impl Pezzo {
    pub const TUTTI: [Pezzo; 240] = [
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
        Pezzo::HV,
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
        Pezzo::Yu01a,
        Pezzo::Yu01b,
        Pezzo::Yu02a,
        Pezzo::Yu02b,
        Pezzo::Yu03a,
        Pezzo::Yu03b,
        Pezzo::Yu04a,
        Pezzo::Yu04b,
        Pezzo::Yu05a,
        Pezzo::Yu05b,
        Pezzo::Yu05c,
        Pezzo::Yu06,
        Pezzo::Yu07a,
        Pezzo::Yu07b,
        Pezzo::Yu08a,
        Pezzo::Yu08b,
        Pezzo::Lv02,
        Pezzo::Sv01,
        Pezzo::Sv02,
        Pezzo::Sv03,
        Pezzo::Sv04,
        Pezzo::Sv05,
        Pezzo::Sv06,
        Pezzo::Sv07,
        Pezzo::Sv08,
        Pezzo::Sv09,
        Pezzo::Sv10,
        Pezzo::Sv11,
        Pezzo::Sv12,
        Pezzo::Sv13,
        Pezzo::Sv14,
        Pezzo::Sv15,
        Pezzo::Sv16,
        Pezzo::Sv17,
        Pezzo::Sv18,
        Pezzo::Sv19,
        Pezzo::Sv20,
        Pezzo::Sv21,
        Pezzo::Sv22,
        Pezzo::Sv23,
        Pezzo::Sv24,
        Pezzo::Sv25,
        Pezzo::Sv26,
        Pezzo::Sv27,
        Pezzo::Sv28,
        Pezzo::Sv29,
        Pezzo::Sv30,
        Pezzo::Sv31,
        Pezzo::Sv32,
        Pezzo::Sv33,
        Pezzo::Sv34,
        Pezzo::Sv35,
        Pezzo::Sv36,
        Pezzo::Sv37,
        Pezzo::Sv38,
        Pezzo::Sv39,
        Pezzo::Sv40,
        Pezzo::Sv41,
        Pezzo::Sv42,
        Pezzo::Sv43,
        Pezzo::Sv44,
        Pezzo::Sv45,
        Pezzo::Sv46,
        Pezzo::Sv47,
        Pezzo::Sv48,
        Pezzo::Sv49,
        Pezzo::Sv50,
        Pezzo::Sv51,
        Pezzo::Sv52,
        Pezzo::Sv53,
        Pezzo::Sv54,
        Pezzo::Sv55,
        Pezzo::Sv56,
        Pezzo::Sv57,
        Pezzo::Sv58,
        Pezzo::Sv59,
        Pezzo::Sv60,
        Pezzo::Sv61,
        Pezzo::Sv62,
        Pezzo::Sv63,
        Pezzo::Sv64,
        Pezzo::Sv65,
        Pezzo::Sv66,
        Pezzo::Sv67,
        Pezzo::Sv68,
        Pezzo::Sv69,
        Pezzo::Sv70,
        Pezzo::Sv71,
        Pezzo::Sv72,
        Pezzo::Sv73,
        Pezzo::Sv74,
        Pezzo::Sv75,
        Pezzo::Sv76,
        Pezzo::Sv77,
        Pezzo::Sv78,
        Pezzo::Sv79,
        Pezzo::Sv80,
        Pezzo::Sv81,
        Pezzo::Sv82,
        Pezzo::Sv83,
        Pezzo::Sv84,
        Pezzo::Sv85,
        Pezzo::Sv86,
        Pezzo::Sv87,
        Pezzo::Sv88,
        Pezzo::Sv89,
        Pezzo::Sv90,
        Pezzo::Sv91,
        Pezzo::Sv92,
        Pezzo::Sv93,
        Pezzo::Sv94,
        Pezzo::Sv95,
        Pezzo::Sv96,
        Pezzo::Sv97,
        Pezzo::Sv98,
        Pezzo::Sv99,
        Pezzo::Sv100,
        Pezzo::Sv101,
        Pezzo::Sv102,
        Pezzo::Sv103,
        Pezzo::Sv104,
        Pezzo::Sv105,
        Pezzo::Sv106,
        Pezzo::Sv107,
        Pezzo::Sv108,
        Pezzo::Sv109,
        Pezzo::Sv110,
        Pezzo::Sv111,
        Pezzo::Sv112,
        Pezzo::Sv113,
        Pezzo::Sv114,
        Pezzo::Sv115,
        Pezzo::Sv116,
        Pezzo::Sv117,
        Pezzo::Sv118,
        Pezzo::Sv119,
        Pezzo::Sv120,
        Pezzo::Sv121,
        Pezzo::Sv122,
        Pezzo::Sv123,
        Pezzo::Sv124,
        Pezzo::Sv125,
        Pezzo::Sv126,
        Pezzo::Sv127,
        Pezzo::Sv128,
        Pezzo::Sv129,
        Pezzo::Sv130,
        Pezzo::Sv131,
        Pezzo::Sv132,
        Pezzo::Sv133,
        Pezzo::Sv134,
        Pezzo::Sv135,
        Pezzo::Sv136,
        Pezzo::Sv137,
        Pezzo::Sv138,
        Pezzo::Sv139,
        Pezzo::Sv140,
        Pezzo::Sv141,
        Pezzo::Sv142,
        Pezzo::Sv143,
        Pezzo::Sv144,
        Pezzo::Sv145,
        Pezzo::Sv146,
        Pezzo::Wi01,
        Pezzo::Yu09,
    ];

    /// Una voce registrata, che si porta al suo livello misurando le parole e non il silenzio fra
    /// l’una e l’altra (documento 35, §8): le voci della nave, Yusuf, la voce di servizio. L’Anziano no: il suo livello
    /// è tarato dal 2 novembre sul valore efficace di tutto il file. Nemmeno la scatola nera di L.V.:
    /// il fruscio continuo del nastro inganna la misura sulle parole.
    pub fn parlato(self) -> bool {
        self.yusuf() || self.servizio() || matches!(self, Pezzo::Wi01 | Pezzo::Yu09 | Pezzo::Wi(_)) || BATTUTE_NV.iter().any(|(p, _)| *p == self)
    }

    /// La presa di William dalla sua sigla, come la manda il ponte («SM-001»).
    pub fn della_presa(sigla: &str) -> Option<Pezzo> {
        PRESE.iter().position(|(s, _)| *s == sigla).map(|i| Pezzo::Wi(i as u16))
    }

    /// Una parte della voce di servizio.
    pub fn servizio(self) -> bool {
        VOCI_SV.iter().any(|(p, _)| *p == self)
    }

    /// Quanto suona sopra o sotto le altre voci del suo lettore, in dB. La scatola nera di L.V. (valore
    /// efficace a −27, +9 del lettore di Yusuf, −10) sta a circa −28 dBFS, come la sua voce nell’intro: alzato Yusuf
    /// di 3 dB il 17 novembre 2026, lei resta dov’era.
    pub fn livello_proprio(self) -> f32 {
        match self {
            Pezzo::Lv02 => -10.0,
            _ => 0.0,
        }
    }

    /// Una battuta di Yusuf.
    pub fn yusuf(self) -> bool {
        VOCI_YU.iter().any(|(p, _)| *p == self)
    }

    /// Una parte di una battuta di Yusuf che continua la frase di prima (b, c): dopo la parte di prima entra subito,
    /// perché il silenzio fra le due frasi ce l’hanno già i file; dopo il racconto di William, con la sua pausa.
    pub fn segue(self) -> bool {
        matches!(self, Pezzo::Yu01b | Pezzo::Yu02b | Pezzo::Yu03b | Pezzo::Yu04b | Pezzo::Yu05b | Pezzo::Yu05c | Pezzo::Yu07b | Pezzo::Yu08b)
    }

    /// Una voce che ha già nel file la sua radio o il suo nastro (Yusuf, la scatola nera di L.V.): esce
    /// asciutta, non nella cuffia.
    pub fn asciutta(self) -> bool {
        self.yusuf() || self == Pezzo::Lv02
    }

    /// La battuta delle voci della nave, di Yusuf, di L.V. o della voce di servizio dal nome che le dà il ponte
    /// (l’evento «voci»).
    pub fn della_battuta(nome: &str) -> Option<Pezzo> {
        BATTUTE_NV.iter().chain(VOCI_YU.iter()).chain(VOCI_LV.iter()).chain(VOCI_SV.iter()).find(|(_, n)| n.strip_suffix(".mp3") == Some(nome)).map(|(p, _)| *p)
    }

    /// (la cartella della scheda, il nome del file) come stanno in `audio/musica-ia/`.
    pub fn file(self) -> (&'static str, &'static str) {
        if let Pezzo::Wi(i) = self {
            return ("WI", PRESE.get(i as usize).map(|p| p.1).unwrap_or(""));
        }
        if let Some((_, n)) = BATTUTE_NV.iter().find(|(p, _)| *p == self) {
            return ("NV", n);
        }
        if let Some((_, n)) = VOCI_AN.iter().find(|(p, _)| *p == self) {
            return ("AN", n);
        }
        if let Some((_, n)) = VOCI_YU.iter().find(|(p, _)| *p == self) {
            return ("YU", n);
        }
        if let Some((_, n)) = VOCI_LV.iter().find(|(p, _)| *p == self) {
            return ("LV", n);
        }
        if let Some((_, n)) = VOCI_SV.iter().find(|(p, _)| *p == self) {
            return ("SV", n);
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
            Pezzo::HV => ("CT", "CT-02-havela.mp3"),
            Pezzo::SM => ("SM", "SM-01-santa-maria.mp3"),
            Pezzo::LV => ("LV", "LV-01-la-traccia.mp3"),
            Pezzo::CA => ("AN", "AN-00-canto.mp3"),
            Pezzo::Wi01 => ("WI", "WI-01-registro-di-bordo.mp3"),
            Pezzo::Yu09 => ("YU", "YU-09-messaggio-intro.mp3"),
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
        let mut campioni = Vec::with_capacity(frame.size_hint().0 * 2);
        let mut energia = 0.0f64;
        let mut n = 0usize;
        for (l, r) in frame {
            energia += ((l * l + r * r) * 0.5) as f64;
            n += 1;
            campioni.push((l.clamp(-1.0, 1.0) * 32767.0) as i16);
            campioni.push((r.clamp(-1.0, 1.0) * 32767.0) as i16);
        }
        // un vettore che cresce raddoppiando può riservare quasi il doppio di quello che tiene: per un brano di
        // tre minuti, decine di megabyte in più. Qui si è nel thread di lavoro: si restituiscono (revisione 37, L22)
        campioni.shrink_to_fit();
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
        Self::nuova_con(cartella, Pezzo::TUTTI.iter().copied())
    }

    /// La biblioteca delle prese di William (documento 41): le sigle del copione, ognuna con il suo file se c’è.
    pub fn delle_prese(cartella: PathBuf) -> Self {
        Self::nuova_con(cartella, (0..PRESE.len()).map(|i| Pezzo::Wi(i as u16)))
    }

    /// Una biblioteca di questi pezzi soltanto.
    pub fn nuova_con(cartella: PathBuf, pezzi: impl Iterator<Item = Pezzo>) -> Self {
        let pezzi: Vec<Pezzo> = pezzi.collect();
        let quanti = pezzi.len().max(8);
        let percorsi: HashMap<Pezzo, PathBuf> = pezzi
            .into_iter()
            .filter_map(|p| {
                // nella cartella piatta (l’installazione) o nella sua sottocartella (l’albero di lavoro)
                let (sotto, nome) = p.file();
                [cartella.join(nome), cartella.join(sotto).join(nome)].into_iter().find(|f| f.is_file()).map(|f| (p, f))
            })
            .collect();
        let (lavori, coda) = channel::<Lavoro>();
        let (tx, rx) = channel();
        let dove = percorsi.clone();
        let partito = std::thread::Builder::new()
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
            .is_ok();
        // Se il sistema non concede il thread, la biblioteca non ha file: ogni pezzo risulta mancante, e il
        // motore suona quello che sa sintetizzare. Prima qui c'era un `expect`, e il gioco cadeva all'avvio del
        // mondo sonoro (revisione 37, L22)
        let percorsi = if partito { percorsi } else { HashMap::new() };
        Biblioteca { percorsi, caselle: HashMap::with_capacity(quanti), lavori, rx }
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
    /// un giro di tre: lascia il posto a `poi`, che lo lascerà a `e_poi`, che lo lascerà a questo (il menu con il
    /// tema, l’autore, 25 novembre 2026). Se `poi` non c’è, si alternano gli altri due; se non c’è nessuno, ricomincia
    Giro { poi: Pezzo, e_poi: Pezzo },
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
            match r.dopo {
                Dopo::Alterna(altro) => b.chiedi(altro),
                Dopo::Giro { poi, e_poi } => {
                    b.chiedi(poi);
                    b.chiedi(e_poi);
                }
                Dopo::Niente | Dopo::Ripeti => {}
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

    /// Il mondo è fermo e muto, e aspetta soltanto di essere tolto: le voci se ne vanno adesso, e tutti i pezzi
    /// decodificati lasciano la memoria (li libera il thread di lavoro, non il thread audio). Senza, restavano
    /// con il mondo fermo fino all’avvio del mondo successivo: i brani del menu per tutta la partita, quelli
    /// della partita per tutto il menu (revisione 37, M15).
    pub fn sgombra(&mut self) {
        self.attese.clear();
        match self.biblioteca.as_mut() {
            Some(b) => {
                for v in self.voci.drain(..) {
                    b.butta(v.pcm);
                }
                b.tieni(&[]);
            }
            None => self.voci.clear(),
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
                Dopo::Giro { poi, e_poi } if resta <= v.r.incrocio => {
                    let b = self.biblioteca.as_ref();
                    let manca = |p: Pezzo| b.is_none_or(|b| !b.esiste(p) || b.mancante(p));
                    // il pezzo che viene, e quello che verrà dopo di lui; senza `poi` restano gli altri due
                    let (prossimo, dopo) = if manca(poi) { (e_poi, Dopo::Alterna(v.r.pezzo)) } else { (poi, Dopo::Giro { poi: e_poi, e_poi: v.r.pezzo }) };
                    if let Some(pcm) = b.and_then(|b| b.pronto(prossimo)) {
                        v.ceduta = true;
                        v.g.verso(0.0, v.r.incrocio.max(0.05), sr);
                        nuove.push((Richiesta { pezzo: prossimo, entra: v.r.incrocio, dopo, da: 0.0, a: None, ..v.r }, pcm));
                    } else if manca(prossimo) {
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

    #[test]
    fn un_pezzo_decodificato_non_riserva_piu_memoria_di_quella_che_tiene() {
        // revisione 37, L22: 100.001 frame da una fonte che non dice quanti sono (come la decodifica vera sa dirlo,
        // ma non sempre): il vettore cresceva raddoppiando e teneva riservati 262.144 campioni per 200.002
        let frame = (0..100_001).filter(|_| true).map(|i| {
            let v = 0.2 * (i as f32 * 0.01).sin();
            (v, v)
        });
        let pcm = Pcm::da_frame(48000.0, frame);
        assert_eq!(pcm.campioni.len(), 200_002);
        assert_eq!(pcm.campioni.capacity(), pcm.campioni.len(), "il pezzo riserva più memoria di quella che tiene");
    }

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
