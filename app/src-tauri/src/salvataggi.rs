// =============================================================================
//  I salvataggi su disco (06-app-desktop.md, §4.6 e §12; 12-fase-2, §6.1).
//  Sei posti più uno automatico, nella cartella Documenti/Il Relitto Silente.
//  Il ponte (dentro la pagina) dà e riceve il testo del salvataggio; qui lo si
//  scrive e lo si legge, e per l'elenco dei posti si legge solo il riassunto
//  che il file porta già, senza rigiocare.
//  Accanto, il registro dei finali (06, §4.6): i finali raggiunti, in un file
//  solo, che sopravvive ai salvataggi cancellati.
//  RELITTO_SALVATAGGI sposta la cartella (per le prove).
//  Revisione 25, M9: se in Documenti non si può scrivere (l'«Accesso controllato
//  alle cartelle» di Windows), i salvataggi vanno nella cartella dei dati
//  dell'app; ogni file si scrive su disco davvero (sync) prima di prendere il
//  posto del vecchio, il cambio di nome si riprova se un altro programma (OneDrive,
//  l'antivirus) tiene il file per un attimo, e il posto automatico tiene la sua
//  versione di prima in automatico.json.bak, da cui si riparte se si rovina.
// =============================================================================

use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use std::time::Duration;

use serde::Serialize;
use serde_json::Value;
use tauri::{AppHandle, Manager};

/// I posti: «1»…«6» e «automatico». Nient'altro diventa un nome di file.
const POSTI: [&str; 7] = ["1", "2", "3", "4", "5", "6", "automatico"];

/// Un salvataggio è un JSON di pochi kilobyte: oltre questo limite non lo si legge.
const MASSIMO: u64 = 4 * 1024 * 1024;

/// Il registro dei finali: sei righe al più, in una lista JSON.
const REGISTRO: &str = "registro-dei-finali.json";
const MASSIMO_REGISTRO: u64 = 64 * 1024;

#[derive(Serialize, Debug)]
pub struct Posto {
    posto: String,
    presente: bool,
    /// il riassunto scritto dal ponte: stanza, atto, turno, aria, esito
    riassunto: Option<Value>,
    creato: Option<String>,
    gioco: Option<String>,
    /// il file c'è ma non si legge (danneggiato): il posto lo dice
    leggibile: bool,
}

/// La cartella scelta per questa sessione (si prova a scrivere una volta sola).
static CARTELLA: OnceLock<PathBuf> = OnceLock::new();

/// Dove stanno i salvataggi: Documenti/Il Relitto Silente/salvataggi; se lì non si può scrivere,
/// la cartella dei dati dell'app. RELITTO_SALVATAGGI, se c'è, vale sempre (le prove).
fn cartella(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(c) = std::env::var("RELITTO_SALVATAGGI") {
        if !c.is_empty() {
            let c = PathBuf::from(c);
            std::fs::create_dir_all(&c).map_err(|e| format!("la cartella dei salvataggi non si crea: {e}"))?;
            return Ok(c);
        }
    }
    if let Some(c) = CARTELLA.get() {
        return Ok(c.clone());
    }
    let candidati: Vec<PathBuf> = [
        app.path().document_dir().ok().map(|d| d.join("Il Relitto Silente").join("salvataggi")),
        app.path().app_data_dir().ok().map(|d| d.join("salvataggi")),
    ]
    .into_iter()
    .flatten()
    .collect();
    let c = scegli_cartella(&candidati)?;
    Ok(CARTELLA.get_or_init(|| c).clone())
}

/// La prima cartella in cui si riesce a scrivere davvero.
fn scegli_cartella(candidati: &[PathBuf]) -> Result<PathBuf, String> {
    let mut perche = String::from("nessuna cartella possibile");
    for c in candidati {
        match si_scrive(c) {
            Ok(()) => return Ok(c.clone()),
            Err(e) => perche = format!("{}: {e}", c.display()),
        }
    }
    Err(format!("i salvataggi non hanno una cartella in cui scrivere ({perche})"))
}

fn si_scrive(c: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(c)?;
    let prova = c.join(".prova-di-scrittura");
    std::fs::write(&prova, b"relitto")?;
    std::fs::remove_file(&prova)
}

/// La versione di prima del posto automatico.
fn riserva_di(percorso: &Path) -> PathBuf {
    percorso.with_extension("json.bak")
}

/// Il testo di un salvataggio, se c'è, non è troppo grande ed è un JSON.
fn leggi_valido(percorso: &Path) -> Option<(String, Value)> {
    let meta = std::fs::metadata(percorso).ok()?;
    if meta.len() > MASSIMO {
        return None;
    }
    let testo = std::fs::read_to_string(percorso).ok()?;
    let v = serde_json::from_str::<Value>(&testo).ok()?;
    Some((testo, v))
}

fn file(cartella: &Path, posto: &str) -> Result<PathBuf, String> {
    if !POSTI.contains(&posto) {
        return Err(format!("posto sconosciuto: {posto}"));
    }
    let nome = if posto == "automatico" { "automatico.json".to_string() } else { format!("posto-{posto}.json") };
    Ok(cartella.join(nome))
}

fn elenco_in(cartella: &Path) -> Result<Vec<Posto>, String> {
    let mut out = Vec::new();
    for posto in POSTI {
        let percorso = file(cartella, posto)?;
        let mut p = Posto { posto: posto.into(), presente: false, riassunto: None, creato: None, gioco: None, leggibile: true };
        // il posto automatico rovinato si legge dalla sua versione di prima
        let riserva = (posto == "automatico").then(|| riserva_di(&percorso));
        if percorso.exists() || riserva.as_ref().is_some_and(|r| r.exists()) {
            p.presente = true;
            match leggi_valido(&percorso).or_else(|| riserva.as_deref().and_then(leggi_valido)).map(|(_, v)| v) {
                Some(v) => {
                    p.riassunto = v.get("riassunto").cloned();
                    p.creato = v.get("creato").and_then(|x| x.as_str()).map(String::from);
                    p.gioco = v.get("gioco").and_then(|x| x.as_str()).map(String::from);
                }
                None => p.leggibile = false,
            }
        }
        out.push(p);
    }
    Ok(out)
}

/// Scrive un posto senza lasciarlo mai a metà: prima un file accanto, poi lo
/// si rinomina sopra quello vecchio.
fn scrivi_in(cartella: &Path, posto: &str, testo: &str) -> Result<(), String> {
    if testo.len() as u64 > MASSIMO {
        return Err("salvataggio troppo grande".into());
    }
    scrivi_intero(&file(cartella, posto)?, testo, posto == "automatico").map_err(|e| format!("il salvataggio non si scrive: {e}"))
}

/// Scrive `testo` in `percorso` senza lasciarlo mai a metà: un file accanto, scritto su disco
/// davvero, che poi prende il posto del vecchio. Con `riserva`, la versione di prima (se era
/// buona) resta in `.json.bak`.
fn scrivi_intero(percorso: &Path, testo: &str, riserva: bool) -> Result<(), std::io::Error> {
    let provvisorio = percorso.with_extension("json.tmp");
    {
        let mut f = std::fs::File::create(&provvisorio)?;
        f.write_all(testo.as_bytes())?;
        f.sync_all()?;
    }
    if riserva && leggi_valido(percorso).is_some() {
        let _ = std::fs::copy(percorso, riserva_di(percorso));
    }
    // OneDrive o l'antivirus possono tenere il file aperto per un attimo: si riprova
    let mut tentativi = 0u64;
    loop {
        match std::fs::rename(&provvisorio, percorso) {
            Ok(()) => return Ok(()),
            Err(_) if tentativi < 4 => {
                tentativi += 1;
                std::thread::sleep(Duration::from_millis(100 * tentativi));
            }
            Err(e) => {
                let _ = std::fs::remove_file(&provvisorio);
                return Err(e);
            }
        }
    }
}

/// Il registro dei finali, o una lista vuota se non c'è ancora (o non si legge:
/// un registro danneggiato non deve impedire di giocare).
fn registro_da(cartella: &Path) -> String {
    let percorso = cartella.join(REGISTRO);
    let buono = std::fs::metadata(&percorso).map(|m| m.len() <= MASSIMO_REGISTRO).unwrap_or(false);
    let testo = if buono { std::fs::read_to_string(&percorso).ok() } else { None };
    match testo {
        Some(t) if serde_json::from_str::<Value>(&t).map(|v| v.is_array()).unwrap_or(false) => t,
        _ => "[]".into(),
    }
}

fn registro_in(cartella: &Path, testo: &str) -> Result<(), String> {
    if testo.len() as u64 > MASSIMO_REGISTRO {
        return Err("registro dei finali troppo grande".into());
    }
    if !serde_json::from_str::<Value>(testo).map(|v| v.is_array()).unwrap_or(false) {
        return Err("il registro dei finali è una lista".into());
    }
    scrivi_intero(&cartella.join(REGISTRO), testo, false).map_err(|e| format!("il registro dei finali non si scrive: {e}"))
}

fn leggi_da(cartella: &Path, posto: &str) -> Result<String, String> {
    let percorso = file(cartella, posto)?;
    // il posto automatico rovinato (o sparito a metà di una scrittura): la sua versione di prima
    if posto == "automatico" && leggi_valido(&percorso).is_none() {
        if let Some((testo, _)) = leggi_valido(&riserva_di(&percorso)) {
            return Ok(testo);
        }
    }
    let meta = std::fs::metadata(&percorso).map_err(|_| "il posto è vuoto".to_string())?;
    if meta.len() > MASSIMO {
        return Err("salvataggio troppo grande".into());
    }
    std::fs::read_to_string(&percorso).map_err(|e| format!("il salvataggio non si legge: {e}"))
}

#[tauri::command(async)]
pub fn salvataggi_elenco(app: AppHandle) -> Result<Vec<Posto>, String> {
    elenco_in(&cartella(&app)?)
}

#[tauri::command(async)]
pub fn salvataggio_scrivi(app: AppHandle, posto: String, testo: String) -> Result<(), String> {
    scrivi_in(&cartella(&app)?, &posto, &testo)
}

#[tauri::command(async)]
pub fn salvataggio_leggi(app: AppHandle, posto: String) -> Result<String, String> {
    leggi_da(&cartella(&app)?, &posto)
}

#[tauri::command(async)]
pub fn salvataggi_cartella(app: AppHandle) -> Result<String, String> {
    Ok(cartella(&app)?.to_string_lossy().into_owned())
}

#[tauri::command(async)]
pub fn registro_finali_leggi(app: AppHandle) -> Result<String, String> {
    Ok(registro_da(&cartella(&app)?))
}

#[tauri::command(async)]
pub fn registro_finali_scrivi(app: AppHandle, testo: String) -> Result<(), String> {
    registro_in(&cartella(&app)?, &testo)
}

#[cfg(test)]
mod prove {
    use super::*;

    fn cartella_di_prova(nome: &str) -> PathBuf {
        let c = std::env::temp_dir().join(format!("relitto-salvataggi-{nome}-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&c);
        std::fs::create_dir_all(&c).unwrap();
        c
    }

    #[test]
    fn scrive_legge_ed_elenca_con_il_riassunto() {
        let c = cartella_di_prova("giro");
        let testo = r#"{"formato":"il-relitto-silente/salvataggio","gioco":"0.2.0","creato":"2026-10-14T21:40:00Z","riassunto":{"stanza":"stiva","nome_stanza":"la stiva","atto":1,"titolo_atto":"Il margine","turno":4,"aria":100,"esito":"in_corso"},"partita":{}}"#;
        scrivi_in(&c, "2", testo).unwrap();
        assert_eq!(leggi_da(&c, "2").unwrap(), testo);
        let elenco = elenco_in(&c).unwrap();
        assert_eq!(elenco.len(), 7);
        let p = elenco.iter().find(|p| p.posto == "2").unwrap();
        assert!(p.presente && p.leggibile);
        assert_eq!(p.riassunto.as_ref().unwrap()["turno"], 4);
        assert_eq!(p.creato.as_deref(), Some("2026-10-14T21:40:00Z"));
        assert!(elenco.iter().filter(|p| p.posto != "2").all(|p| !p.presente));
        // sovrascrivere lascia un file solo, intero, e nessun provvisorio
        scrivi_in(&c, "2", "{}").unwrap();
        assert_eq!(leggi_da(&c, "2").unwrap(), "{}");
        assert!(!c.join("posto-2.json.tmp").exists());
        let _ = std::fs::remove_dir_all(&c);
    }

    #[test]
    fn rifiuta_i_posti_sconosciuti_e_i_percorsi() {
        let c = cartella_di_prova("nomi");
        for nome in ["7", "0", "../fuori", "automatico/../x", ""] {
            assert!(scrivi_in(&c, nome, "{}").is_err(), "{nome}");
            assert!(leggi_da(&c, nome).is_err(), "{nome}");
        }
        assert!(leggi_da(&c, "3").is_err(), "un posto vuoto non si legge");
        let _ = std::fs::remove_dir_all(&c);
    }

    #[test]
    fn il_registro_dei_finali_si_scrive_intero_e_resta_una_lista() {
        let c = cartella_di_prova("registro");
        assert_eq!(registro_da(&c), "[]", "senza file, un registro vuoto");
        let testo = r#"[{"finale":"vivi","titolo":"Vivi","riga":"Registro di bordo, TSC-1972.","data":"2026-10-15T12:00:00Z"}]"#;
        registro_in(&c, testo).unwrap();
        assert_eq!(registro_da(&c), testo);
        assert!(!c.join("registro-dei-finali.json.tmp").exists());
        assert!(registro_in(&c, "{}").is_err(), "un oggetto non è un registro");
        assert!(registro_in(&c, "non è json").is_err());
        assert_eq!(registro_da(&c), testo, "un rifiuto non tocca il registro");
        // un file danneggiato vale come vuoto, e i posti dei salvataggi non lo vedono
        std::fs::write(c.join(REGISTRO), "{ rotto").unwrap();
        assert_eq!(registro_da(&c), "[]");
        assert!(elenco_in(&c).unwrap().iter().all(|p| !p.presente));
        let _ = std::fs::remove_dir_all(&c);
    }

    #[test]
    fn il_posto_automatico_tiene_la_versione_di_prima() {
        // revisione 25, M9
        let c = cartella_di_prova("riserva");
        let a = r#"{"formato":"il-relitto-silente/salvataggio","creato":"A","riassunto":{"turno":4}}"#;
        let b = r#"{"formato":"il-relitto-silente/salvataggio","creato":"B","riassunto":{"turno":9}}"#;
        scrivi_in(&c, "automatico", a).unwrap();
        assert!(!c.join("automatico.json.bak").exists(), "al primo salvataggio non c'è niente da tenere");
        scrivi_in(&c, "automatico", b).unwrap();
        assert_eq!(std::fs::read_to_string(c.join("automatico.json.bak")).unwrap(), a);
        assert_eq!(leggi_da(&c, "automatico").unwrap(), b);
        // il file nuovo si rovina: si legge e si elenca la versione di prima
        std::fs::write(c.join("automatico.json"), "{ rotto").unwrap();
        assert_eq!(leggi_da(&c, "automatico").unwrap(), a);
        let p = elenco_in(&c).unwrap().into_iter().find(|p| p.posto == "automatico").unwrap();
        assert!(p.presente && p.leggibile);
        assert_eq!(p.creato.as_deref(), Some("A"));
        // un salvataggio buono sopra uno rovinato non mette il rovinato nella riserva
        scrivi_in(&c, "automatico", b).unwrap();
        assert_eq!(std::fs::read_to_string(c.join("automatico.json.bak")).unwrap(), a);
        // i posti normali non hanno riserva, e non restano file provvisori
        scrivi_in(&c, "2", a).unwrap();
        scrivi_in(&c, "2", b).unwrap();
        assert!(!c.join("posto-2.json.bak").exists());
        assert!(std::fs::read_dir(&c).unwrap().all(|f| !f.unwrap().file_name().to_string_lossy().ends_with(".tmp")));
        let _ = std::fs::remove_dir_all(&c);
    }

    #[test]
    fn se_documenti_non_si_scrive_si_usa_la_cartella_di_ripiego() {
        // revisione 25, M9: una cartella che non si può creare (sotto un file), poi una buona
        let c = cartella_di_prova("ripiego");
        let file = c.join("un-file");
        std::fs::write(&file, "x").unwrap();
        let impossibile = file.join("salvataggi");
        let buona = c.join("dati").join("salvataggi");
        assert_eq!(scegli_cartella(&[impossibile.clone(), buona.clone()]).unwrap(), buona);
        assert!(!buona.join(".prova-di-scrittura").exists(), "la prova di scrittura non lascia file");
        assert!(scegli_cartella(&[impossibile]).is_err());
        let _ = std::fs::remove_dir_all(&c);
    }

    #[test]
    fn un_file_danneggiato_si_vede_e_non_si_legge_come_buono() {
        let c = cartella_di_prova("danno");
        std::fs::write(c.join("posto-5.json"), "{ non è json").unwrap();
        let p = elenco_in(&c).unwrap().into_iter().find(|p| p.posto == "5").unwrap();
        assert!(p.presente && !p.leggibile);
        let _ = std::fs::remove_dir_all(&c);
    }
}
