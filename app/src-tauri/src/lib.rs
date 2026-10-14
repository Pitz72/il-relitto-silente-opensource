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
use mondo::campioni::Banca;
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

#[tauri::command]
fn audio_avvia(app: AppHandle, stato: State<StatoAudio>) -> Result<AvvioAudio, String> {
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
    campioni: usize,
    memoria_mb: f64,
    caricamento_ms: f64,
}

/// Il prototipo dei tre ambienti (bibbia sonora, §8): carica i campioni fuori dal
/// thread principale, poi avvia il mondo sonoro (e il motore audio, se serve).
#[tauri::command]
async fn audio_mondo_avvia(app: AppHandle, stato: State<'_, StatoAudio>) -> Result<AvvioMondo, String> {
    let radice = app.path().resource_dir().map_err(|e| e.to_string())?.join("risorse").join("audio").join("prototipo");
    let t0 = std::time::Instant::now();
    let banca = tauri::async_runtime::spawn_blocking(move || Banca::carica(&radice))
        .await
        .map_err(|e| e.to_string())??;
    let caricamento_ms = t0.elapsed().as_secs_f64() * 1000.0;
    let mut guardia = stato.0.lock().map_err(|_| "audio bloccato".to_string())?;
    if guardia.is_none() {
        *guardia = Some(MotoreAudio::nuovo()?);
    }
    guardia.as_mut().unwrap().mondo_avvia(&banca)?;
    Ok(AvvioMondo { campioni: banca.quanti(), memoria_mb: banca.memoria() as f64 / 1e6, caricamento_ms })
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

/// Scrive il rapporto della prova: nella cartella di RELITTO_RAPPORTI se c'è,
/// altrimenti nella cartella dei dati dell'app.
#[tauri::command]
fn scrivi_rapporto(app: AppHandle, nome: String, contenuto: String) -> Result<String, String> {
    if nome.contains(['/', '\\']) || nome.contains("..") {
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
        .manage(StatoAudio::default())
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
            esci,
            salvataggi::salvataggi_elenco,
            salvataggi::salvataggio_scrivi,
            salvataggi::salvataggio_leggi,
            salvataggi::salvataggi_cartella
        ])
        .run(tauri::generate_context!())
        .expect("errore all'avvio dell'applicazione");
}
