// =============================================================================
//  Il Relitto Silente — il processo Tauri.
//  La finestra, il motore audio, i salvataggi su disco (fase 3), i comandi che
//  la pagina di prova usa per misurare e per scrivere il rapporto.
// =============================================================================

mod audio;
pub mod mondo;
mod salvataggi;

use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Manager, State};

use audio::{InfoAudio, MisureAudio, MotoreAudio};
use mondo::{Comando, Istantanea};

#[derive(Default)]
struct StatoAudio(Mutex<Option<MotoreAudio>>);

fn con_audio<T>(stato: &State<StatoAudio>, f: impl FnOnce(&mut MotoreAudio) -> Result<T, String>) -> Result<T, String> {
    let mut guardia = stato.0.lock().map_err(|_| "audio bloccato".to_string())?;
    let motore = guardia.as_mut().ok_or("audio non avviato")?;
    f(motore)
}

#[derive(Serialize)]
struct AvvioAudio {
    info: InfoAudio,
    campione_ms: f64,
}

// I comandi che aprono il dispositivo audio o toccano il disco non girano nel thread principale
// (revisione 25, L12): `audio_avvia`, `audio_mondo_avvia`, `scrivi_rapporto`, e i salvataggi
// (salvataggi.rs). Gli altri restano sincroni apposta: sono brevi (un messaggio nel canale del
// mondo), e così arrivano nell'ordine in cui la pagina li manda; il gioco aspetta la fine di
// `audio_mondo_avvia` prima di mandarne (gioco/suono.ts).
#[tauri::command(async)]
fn audio_avvia(app: AppHandle, stato: State<'_, StatoAudio>) -> Result<AvvioAudio, String> {
    let mut guardia = stato.0.lock().map_err(|_| "audio bloccato".to_string())?;
    if guardia.is_none() {
        *guardia = Some(MotoreAudio::nuovo()?);
    }
    let motore = guardia.as_mut().unwrap();
    let percorso = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("risorse")
        .join("audio")
        .join("prova-ventilazione.ogg");
    let campione_ms = motore.carica_campione(&percorso)?;
    Ok(AvvioAudio { info: motore.info(), campione_ms })
}

#[tauri::command]
fn audio_re(acceso: bool, stato: State<StatoAudio>) -> Result<(), String> {
    con_audio(&stato, |m| m.re(acceso))
}

#[tauri::command]
fn audio_campione(acceso: bool, volume_db: f32, stato: State<StatoAudio>) -> Result<(), String> {
    con_audio(&stato, |m| m.campione(acceso, volume_db))
}

#[tauri::command]
fn audio_segnale(stato: State<StatoAudio>) -> Result<(), String> {
    con_audio(&stato, |m| m.segnale())
}

#[tauri::command]
fn audio_misure(stato: State<StatoAudio>) -> Result<MisureAudio, String> {
    con_audio(&stato, |m| Ok(m.misure()))
}

#[tauri::command]
fn audio_azzera(stato: State<StatoAudio>) -> Result<(), String> {
    con_audio(&stato, |m| {
        m.azzera();
        Ok(())
    })
}

#[derive(Serialize)]
struct AvvioMondo {
    /// quanto ci ha messo il mondo sonoro a partire (nessun campione da caricare:
    /// è tutto sintetizzato)
    avvio_ms: f64,
}

/// Dove stanno i file della musica (documento 22): nella variabile `RELITTO_MUSICA` se c'è, nella
/// cartella `musica/` delle risorse dell'installazione (anche `target/release/musica`, dove la
/// build le copia), o, solo nello sviluppo, nell'albero di lavoro (`audio/musica-ia/`). Se non c'è
/// niente, suona la musica sintetizzata.
fn cartella_musica(app: &AppHandle) -> Option<std::path::PathBuf> {
    let da_ambiente = std::env::var_os("RELITTO_MUSICA").map(std::path::PathBuf::from);
    let installata = app.path().resource_dir().ok().map(|d| d.join("musica"));
    // nell'eseguibile da distribuire il percorso della cartella di lavoro non entra nemmeno
    // (revisione 25, L7): chi lo installa non ha quella cartella, e il gioco non deve cercarla
    #[cfg(debug_assertions)]
    let di_lavoro = Some(std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../../audio/musica-ia"));
    #[cfg(not(debug_assertions))]
    let di_lavoro: Option<std::path::PathBuf> = None;
    [da_ambiente, installata, di_lavoro].into_iter().flatten().find(|d| d.is_dir())
}

/// Il prototipo dei tre ambienti (bibbia sonora, §8): avvia il mondo sonoro (e il
/// motore audio, se serve). Niente da caricare: ogni suono nasce dal codice.
#[tauri::command(async)]
fn audio_mondo_avvia(app: AppHandle, stato: State<'_, StatoAudio>) -> Result<AvvioMondo, String> {
    let t0 = std::time::Instant::now();
    let musica = cartella_musica(&app);
    let mut guardia = stato.0.lock().map_err(|_| "audio bloccato".to_string())?;
    if guardia.is_none() {
        *guardia = Some(MotoreAudio::nuovo()?);
    }
    guardia.as_mut().unwrap().mondo_avvia(musica)?;
    Ok(AvvioMondo { avvio_ms: t0.elapsed().as_secs_f64() * 1000.0 })
}

#[tauri::command]
fn audio_mondo(comando: Comando, stato: State<StatoAudio>) -> Result<(), String> {
    con_audio(&stato, |m| m.mondo_comando(comando))
}

#[tauri::command]
fn audio_mondo_stato(stato: State<StatoAudio>) -> Result<Option<Istantanea>, String> {
    con_audio(&stato, |m| Ok(m.mondo_stato()))
}

/// Millisecondi dall'avvio del processo: la pagina li legge appena è pronta.
#[tauri::command]
fn tempo_avvio() -> f64 {
    audio::adesso_ns() as f64 / 1e6
}

#[derive(Serialize)]
struct InfoSistema {
    sistema: String,
    architettura: String,
    versione_app: String,
    webview: String,
    grafica_compatibile: bool,
    prova: Option<String>,
}

#[tauri::command]
fn info_sistema(app: AppHandle) -> InfoSistema {
    InfoSistema {
        sistema: std::env::consts::OS.to_string(),
        architettura: std::env::consts::ARCH.to_string(),
        versione_app: app.package_info().version.to_string(),
        webview: tauri::webview_version().unwrap_or_else(|e| format!("sconosciuta ({e})")),
        grafica_compatibile: std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_ok(),
        prova: std::env::var("RELITTO_PROVA").ok(),
    }
}

/// Il nome di un rapporto (revisione 25, L11): `prova-` e poi solo lettere, cifre, punti e
/// trattini. Niente separatori né `..`, e niente `:` (su Windows `C:nome` e i flussi alternativi
/// `nome:flusso`); il prefisso esclude anche i nomi riservati di Windows (CON, NUL, COM1…).
fn nome_di_rapporto_valido(nome: &str) -> bool {
    nome.len() <= 120
        && nome.strip_prefix("prova-").is_some_and(|resto| !resto.is_empty())
        && nome.chars().all(|c| c.is_ascii_alphanumeric() || matches!(c, '.' | '-' | '_'))
        && !nome.contains("..")
}

/// Scrive il rapporto della prova: nella cartella di RELITTO_RAPPORTI se c'è,
/// altrimenti nella cartella dei dati dell'app.
#[tauri::command(async)]
fn scrivi_rapporto(app: AppHandle, nome: String, contenuto: String) -> Result<String, String> {
    if !nome_di_rapporto_valido(&nome) {
        return Err("nome non valido".into());
    }
    let cartella = match std::env::var("RELITTO_RAPPORTI") {
        Ok(c) => std::path::PathBuf::from(c),
        Err(_) => app.path().app_data_dir().map_err(|e| e.to_string())?.join("rapporti"),
    };
    std::fs::create_dir_all(&cartella).map_err(|e| e.to_string())?;
    let percorso = cartella.join(nome);
    std::fs::write(&percorso, contenuto).map_err(|e| e.to_string())?;
    Ok(percorso.to_string_lossy().into_owned())
}

/// Lo schermo intero all'avvio (revisione 25, L8). La finestra nasce come la vuole l'opzione
/// «Schermo intero»: la pagina la ricorda anche qui, in `finestra.json` nella cartella della
/// configurazione, perché con «no, in una finestra» l'app non parta a schermo intero per uscirne
/// subito dopo (un lampo a ogni avvio). Senza il file, a schermo intero: «è un videogioco e deve
/// partire a tutto schermo» (l'autore, 15 ottobre 2026).
#[derive(Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct Finestra {
    schermo_intero: bool,
}

fn file_della_finestra(app: &AppHandle) -> Option<std::path::PathBuf> {
    app.path().app_config_dir().ok().map(|d| d.join("finestra.json"))
}

fn finestra_ricordata(app: &AppHandle) -> Option<Finestra> {
    let testo = std::fs::read_to_string(file_della_finestra(app)?).ok()?;
    serde_json::from_str(&testo).ok()
}

#[tauri::command(async)]
fn finestra_ricorda(app: AppHandle, schermo_intero: bool) -> Result<(), String> {
    if finestra_ricordata(&app).is_some_and(|f| f.schermo_intero == schermo_intero) {
        return Ok(());
    }
    let file = file_della_finestra(&app).ok_or("nessuna cartella per la configurazione")?;
    if let Some(cartella) = file.parent() {
        std::fs::create_dir_all(cartella).map_err(|e| e.to_string())?;
    }
    let testo = serde_json::to_string(&Finestra { schermo_intero }).map_err(|e| e.to_string())?;
    std::fs::write(&file, testo).map_err(|e| e.to_string())
}

#[tauri::command]
fn esci(app: AppHandle, codice: i32) {
    app.exit(codice);
}

/// Su Linux, con i driver NVIDIA proprietari, il renderer DMABUF di WebKitGTK
/// può lasciare la finestra bianca: lo si spegne prima che la WebView parta.
/// RELITTO_GRAFICA=compatibile lo spegne sempre, =normale mai.
fn prepara_grafica() {
    #[cfg(target_os = "linux")]
    {
        let scelta = std::env::var("RELITTO_GRAFICA").unwrap_or_default();
        let nvidia = std::path::Path::new("/proc/driver/nvidia/version").exists();
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err()
            && (scelta == "compatibile" || (nvidia && scelta != "normale"))
        {
            // SAFETY: nessun altro thread è ancora partito.
            unsafe { std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1") };
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    audio::adesso_ns(); // fissa l'epoca
    prepara_grafica();
    tauri::Builder::default()
        // l'aggiornamento automatico: controlla le release su GitHub, firmate (documento 06, fase 9)
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .manage(StatoAudio::default())
        .setup(|app| {
            // la finestra principale ha "create": false in tauri.conf.json: nasce qui, già nella
            // forma che l'opzione vuole (L8), e nascosta finché non l'ha presa: prima, a schermo
            // intero, si vedeva per 60 ms la finestra normale
            let schermo_intero = finestra_ricordata(app.handle()).map_or(true, |f| f.schermo_intero);
            let conf = app
                .config()
                .app
                .windows
                .iter()
                .find(|w| w.label == "main")
                .cloned()
                .ok_or("manca la finestra «main» in tauri.conf.json")?;
            let finestra = tauri::WebviewWindowBuilder::from_config(app.handle(), &conf)?
                .visible(false)
                .fullscreen(schermo_intero)
                .build()?;
            finestra.show()?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            audio_avvia,
            audio_re,
            audio_campione,
            audio_segnale,
            audio_misure,
            audio_azzera,
            audio_mondo_avvia,
            audio_mondo,
            audio_mondo_stato,
            tempo_avvio,
            info_sistema,
            scrivi_rapporto,
            finestra_ricorda,
            esci,
            salvataggi::salvataggi_elenco,
            salvataggi::salvataggio_scrivi,
            salvataggi::salvataggio_leggi,
            salvataggi::salvataggi_cartella,
            salvataggi::registro_finali_leggi,
            salvataggi::registro_finali_scrivi
        ])
        .run(tauri::generate_context!())
        .expect("errore all'avvio dell'applicazione");
}

#[cfg(test)]
mod prove {
    use super::nome_di_rapporto_valido;

    #[test]
    fn i_nomi_dei_rapporti() {
        for buono in ["prova-finali-1792396659888.json", "prova-fase1-audio-windows-1.json", "prova-salvataggi-1.json"] {
            assert!(nome_di_rapporto_valido(buono), "{buono}");
        }
        for cattivo in [
            "",
            "prova-",
            "rapporto.json",
            "prova-../../x.json",
            "prova-a/b.json",
            "prova-a\\b.json",
            "prova-x.json:flusso",
            "C:prova-x.json",
            "prova-è.json",
            "prova- spazio.json",
            "CON.json",
            "NUL",
        ] {
            assert!(!nome_di_rapporto_valido(cattivo), "{cattivo}");
        }
    }
}
