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
//  Revisione 37: la prova di scrittura riesce se la scrittura riesce, e una
//  cartella che ha già dei salvataggi non si lascia in silenzio (M16); il
//  registro dei finali tiene accanto una copia con tutti i finali visti, e un
//  registro che non si legge non vale come vuoto (M17); una scrittura per volta
//  (L23); una prova (RELITTO_PROVA) non scrive mai nei posti di chi gioca (L20).
// =============================================================================

use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::{Mutex, MutexGuard, OnceLock};
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

/// Una scrittura per volta (revisione 37, L23): il file provvisorio ha un nome per posto, e due scritture
/// insieme dello stesso posto si pestavano. I salvataggi sono pochi kilobyte: aspettare non si nota.
static SCRITTURA: Mutex<()> = Mutex::new(());

fn una_per_volta() -> MutexGuard<'static, ()> {
    // una scrittura caduta a metà non deve fermare le successive
    SCRITTURA.lock().unwrap_or_else(|e| e.into_inner())
}

/// La cartella che l'ambiente impone, se ne impone una: RELITTO_SALVATAGGI vale sempre (le prove, le misure);
/// e una prova (RELITTO_PROVA) lanciata senza la sua cartella ne ha una temporanea, sua: non scrive mai nei
/// posti di chi gioca (revisione 37, L20: la prova dei salvataggi scriveva nel posto 6 e nell'automatico veri,
/// quella dei finali nell'automatico e nel registro dei finali).
fn cartella_imposta(salvataggi: Option<&str>, prova: Option<&str>, temporanea: &Path) -> Option<PathBuf> {
    match (salvataggi, prova) {
        (Some(c), _) if !c.is_empty() => Some(PathBuf::from(c)),
        (_, Some(p)) if !p.is_empty() => Some(temporanea.join(format!("il-relitto-silente-prova-{}", std::process::id())).join("salvataggi")),
        _ => None,
    }
}

/// Dove stanno i salvataggi: Documenti/Il Relitto Silente/salvataggi; se lì non si può scrivere,
/// la cartella dei dati dell'app. RELITTO_SALVATAGGI, se c'è, vale sempre (le prove).
fn cartella(app: &AppHandle) -> Result<PathBuf, String> {
    let (salvataggi, prova) = (std::env::var("RELITTO_SALVATAGGI").ok(), std::env::var("RELITTO_PROVA").ok());
    if let Some(c) = cartella_imposta(salvataggi.as_deref(), prova.as_deref(), &std::env::temp_dir()) {
        std::fs::create_dir_all(&c).map_err(|e| format!("la cartella dei salvataggi non si crea: {e}"))?;
        return Ok(c);
    }
    if let Some(c) = CARTELLA.get() {
        return Ok(c.clone());
    }
    let candidati: Vec<PathBuf> = [
        // la demo dell'atto I (tauri.demo.conf.json) ha la sua cartella: le sue partite non si mescolano con quelle
        // del gioco intero
        app.path().document_dir().ok().map(|d| d.join(cartella_documenti(&app.config().identifier)).join("salvataggi")),
        app.path().app_data_dir().ok().map(|d| d.join("salvataggi")),
    ]
    .into_iter()
    .flatten()
    .collect();
    let (c, sicura) = scegli_cartella(&candidati)?;
    // la scelta vale per la sessione solo se è sicura: una cartella tenuta perché ha già dei salvataggi,
    // senza esserci riusciti a scrivere, si riprova alla prossima chiamata
    Ok(if sicura { CARTELLA.get_or_init(|| c).clone() } else { c })
}

/// La prima cartella in cui si riesce a scrivere davvero; con lei, se la scelta è sicura (ci si è scritto).
/// Una cartella in cui adesso non si riesce a scrivere ma che ha già dei salvataggi resta la cartella dei
/// salvataggi (revisione 37, M16): passando in silenzio al ripiego, per quella sessione il menu non mostrava
/// «Continua» né i posti di Documenti, e quello che si salvava non si vedeva all'avvio dopo. Così i posti si
/// vedono e si caricano, e se scrivere non si può lo dice il salvataggio che non riesce.
fn scegli_cartella(candidati: &[PathBuf]) -> Result<(PathBuf, bool), String> {
    let mut perche = String::from("nessuna cartella possibile");
    for c in candidati {
        match si_scrive(c) {
            Ok(()) => return Ok((c.clone(), true)),
            Err(_) if ha_salvataggi(c) => return Ok((c.clone(), false)),
            Err(e) => perche = format!("{}: {e}", c.display()),
        }
    }
    Err(format!("i salvataggi non hanno una cartella in cui scrivere ({perche})"))
}

/// In questa cartella si può scrivere? La prova è riuscita se la scrittura è riuscita: la cancellazione del file
/// di prova può fallire da sola, se OneDrive o l'antivirus lo tengono per un attimo, e non dice niente sulla
/// cartella (revisione 37, M16).
fn si_scrive(c: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(c)?;
    let prova = c.join(".prova-di-scrittura");
    std::fs::write(&prova, b"relitto")?;
    let _ = std::fs::remove_file(&prova);
    Ok(())
}

/// La cartella ha già qualcosa di chi gioca: un posto, la riserva dell'automatico, il registro dei finali.
fn ha_salvataggi(c: &Path) -> bool {
    let registro = c.join(REGISTRO);
    POSTI.iter().filter_map(|p| file(c, p).ok()).chain([registro]).any(|f| f.exists() || riserva_di(&f).exists())
}

/// La versione di prima del posto automatico; e la copia del registro dei finali.
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
    let percorso = file(cartella, posto)?;
    let _una = una_per_volta();
    scrivi_intero(&percorso, testo, posto == "automatico").map_err(|e| format!("il salvataggio non si scrive: {e}"))
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

/// Il registro dei finali su disco, come lo si trova: «non c'è» non è «non si legge» (revisione 37, M17).
#[derive(Debug, PartialEq)]
enum Registro {
    /// il file non esiste: nessun finale ancora
    Assente,
    /// il file c'è ma non si legge, o non è una lista: non si sa che cosa c'era
    Illeggibile,
    /// il testo com'è scritto, e le sue voci
    Buono(String, Vec<Value>),
}

fn leggi_registro(percorso: &Path) -> Registro {
    match std::fs::metadata(percorso) {
        Ok(m) if m.len() <= MASSIMO_REGISTRO => {}
        Ok(_) => return Registro::Illeggibile,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Registro::Assente,
        Err(_) => return Registro::Illeggibile,
    }
    // OneDrive o l'antivirus possono tenere il file per un attimo: si riprova
    for tentativo in 0..3u64 {
        match std::fs::read_to_string(percorso) {
            Ok(t) => {
                return match serde_json::from_str::<Value>(&t) {
                    Ok(Value::Array(voci)) => Registro::Buono(t, voci),
                    _ => Registro::Illeggibile,
                };
            }
            Err(_) if tentativo < 2 => std::thread::sleep(Duration::from_millis(50 * (tentativo + 1))),
            Err(_) => {}
        }
    }
    Registro::Illeggibile
}

/// Il finale di una voce del registro.
fn finale_di(v: &Value) -> Option<&str> {
    v.get("finale").and_then(Value::as_str)
}

/// Quando: una voce senza data viene dopo tutte le altre.
fn data_di(v: &Value) -> (bool, &str) {
    let d = v.get("data").and_then(Value::as_str).unwrap_or("");
    (d.is_empty(), d)
}

/// `grande` ha tutti i finali di `piccolo`.
fn contiene(grande: &[Value], piccolo: &[Value]) -> bool {
    piccolo.iter().filter_map(finale_di).all(|f| grande.iter().filter_map(finale_di).any(|g| g == f))
}

/// I finali dell'uno e dell'altro, una volta sola ciascuno, con la data della prima volta, in ordine di data
/// (come li tiene la pagina: app/src/menu/registro.ts). Le voci senza finale non sono voci del registro.
fn unione(a: &[Value], b: &[Value]) -> Vec<Value> {
    let mut out: Vec<Value> = Vec::new();
    for v in a.iter().chain(b) {
        let Some(f) = finale_di(v) else { continue };
        match out.iter_mut().find(|x| finale_di(x) == Some(f)) {
            Some(x) => {
                if data_di(v) < data_di(x) {
                    *x = v.clone();
                }
            }
            None => out.push(v.clone()),
        }
    }
    out.sort_by(|x, y| data_di(x).cmp(&data_di(y)));
    out
}

fn in_testo(voci: &[Value]) -> String {
    serde_json::to_string(voci).unwrap_or_else(|_| "[]".into())
}

/// Il registro dei finali, o una lista vuota se non c'è ancora. Accanto sta la sua copia
/// (`registro-dei-finali.json.bak`), che tiene tutti i finali visti: se il registro non si legge si legge
/// lei, e se ha finali che il registro non ha (una volta il registro non si è letto, e la pagina lo ha
/// riscritto con una riga sola) tornano insieme agli altri. Un registro danneggiato non impedisce di giocare.
fn registro_da(cartella: &Path) -> String {
    let percorso = cartella.join(REGISTRO);
    let copia = match leggi_registro(&riserva_di(&percorso)) {
        Registro::Buono(_, voci) => voci,
        _ => Vec::new(),
    };
    match leggi_registro(&percorso) {
        Registro::Buono(testo, voci) if contiene(&voci, &copia) => testo,
        Registro::Buono(_, voci) => in_testo(&unione(&voci, &copia)),
        _ if copia.is_empty() => "[]".into(),
        _ => in_testo(&unione(&copia, &[])),
    }
}

fn registro_in(cartella: &Path, testo: &str) -> Result<(), String> {
    if testo.len() as u64 > MASSIMO_REGISTRO {
        return Err("registro dei finali troppo grande".into());
    }
    let nuove = match serde_json::from_str::<Value>(testo) {
        Ok(Value::Array(voci)) => voci,
        _ => return Err("il registro dei finali è una lista".into()),
    };
    let percorso = cartella.join(REGISTRO);
    let riserva = riserva_di(&percorso);
    let _una = una_per_volta();
    // Prima di sostituirlo, il registro che c'è va nella copia (revisione 37, M17: un registro che per un momento
    // non si leggeva valeva come vuoto, e il finale dopo lo riscriveva con una riga sola, senza copia). La copia
    // tiene tutti i finali visti: se ne ha che il registro di adesso non ha, non li perde.
    match leggi_registro(&percorso) {
        Registro::Buono(_, attuali) if !attuali.is_empty() => {
            let copia = match leggi_registro(&riserva) {
                Registro::Buono(_, voci) => voci,
                _ => Vec::new(),
            };
            let tenuta = if contiene(&attuali, &copia) {
                std::fs::copy(&percorso, &riserva).map(|_| ())
            } else {
                scrivi_intero(&riserva, &in_testo(&unione(&copia, &attuali)), false)
            };
            // un registro non si sostituisce con qualcosa che non lo contiene senza averne tenuta la copia
            if tenuta.is_err() && !contiene(&nuove, &attuali) {
                return Err("il registro dei finali non si scrive: non riesco a tenerne la copia".into());
            }
        }
        // non si sa che cosa c'era: se una copia buona non c'è, quello che c'è resta da parte, com'è
        Registro::Illeggibile if !matches!(leggi_registro(&riserva), Registro::Buono(..)) => {
            let _ = std::fs::copy(&percorso, percorso.with_extension("json.rovinato"));
        }
        _ => {}
    }
    scrivi_intero(&percorso, testo, false).map_err(|e| format!("il registro dei finali non si scrive: {e}"))
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

/// Il nome della cartella dei salvataggi in Documenti: quella della demo ha il suo (identificatore «….demo»).
fn cartella_documenti(identificatore: &str) -> &'static str {
    if identificatore.ends_with(".demo") {
        "Il Relitto Silente - Demo"
    } else {
        "Il Relitto Silente"
    }
}

#[cfg(test)]
mod prove {
    use super::*;

    #[test]
    fn la_demo_ha_la_sua_cartella() {
        assert_eq!(cartella_documenti("it.runtimeradio.relittosilente"), "Il Relitto Silente");
        assert_eq!(cartella_documenti("it.runtimeradio.relittosilente.demo"), "Il Relitto Silente - Demo");
    }

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
        assert_eq!(scegli_cartella(&[impossibile.clone(), buona.clone()]).unwrap(), (buona.clone(), true));
        assert!(!buona.join(".prova-di-scrittura").exists(), "la prova di scrittura non lascia file");
        assert!(scegli_cartella(&[impossibile]).is_err());
        let _ = std::fs::remove_dir_all(&c);
    }

    #[test]
    fn due_scritture_insieme_dello_stesso_posto_non_si_pestano() {
        // revisione 37, L23: il file provvisorio ha un nome per posto. Due scritture insieme (un tasto che si ripete
        // e fa due cambi di stanza, il salvataggio automatico e quello dell’uscita) creavano lo stesso file, la
        // prima lo rinominava e la seconda non lo trovava più: un errore senza danno, dopo un secondo di tentativi
        let c = cartella_di_prova("insieme");
        let testi: Vec<String> = (0..8).map(|k| format!(r#"{{"formato":"il-relitto-silente/salvataggio","creato":"{k}","riassunto":{{"turno":{k}}}}}"#)).collect();
        let esiti: Vec<Result<(), String>> = std::thread::scope(|s| {
            let fili: Vec<_> = testi
                .iter()
                .map(|t| {
                    let c = &c;
                    s.spawn(move || (0..6).map(|_| scrivi_in(c, "automatico", t)).collect::<Vec<_>>())
                })
                .collect();
            fili.into_iter().flat_map(|f| f.join().unwrap()).collect()
        });
        assert!(esiti.iter().all(|e| e.is_ok()), "{:?}", esiti.iter().filter(|e| e.is_err()).collect::<Vec<_>>());
        // quello che resta è uno dei testi, intero; e nessun provvisorio
        let rimasto = leggi_da(&c, "automatico").unwrap();
        assert!(testi.contains(&rimasto), "{rimasto}");
        assert!(std::fs::read_dir(&c).unwrap().all(|f| !f.unwrap().file_name().to_string_lossy().ends_with(".tmp")));
        let _ = std::fs::remove_dir_all(&c);
    }

    #[test]
    fn la_prova_di_scrittura_riesce_se_la_scrittura_riesce() {
        // revisione 37, M16: la prova scriveva un file e lo cancellava, e contava come fallita anche se falliva
        // soltanto la cancellazione: per tutta la sessione i salvataggi passavano alla cartella di ripiego
        let c = cartella_di_prova("scrittura");
        assert!(si_scrive(&c).is_ok());
        assert!(!c.join(".prova-di-scrittura").exists(), "la prova di scrittura non lascia file");
        // OneDrive o l’antivirus tengono il file di prova per un attimo: ci si può scrivere, non lo si può
        // cancellare (su Windows: un altro che lo ha aperto senza concedere la cancellazione)
        #[cfg(windows)]
        {
            use std::os::windows::fs::OpenOptionsExt;
            let prova = c.join(".prova-di-scrittura");
            std::fs::write(&prova, b"di prima").unwrap();
            // FILE_SHARE_READ | FILE_SHARE_WRITE, senza FILE_SHARE_DELETE
            let tenuto = std::fs::OpenOptions::new().read(true).share_mode(1 | 2).open(&prova).unwrap();
            assert!(std::fs::remove_file(&prova).is_err(), "la prova che lo scenario è quello vero: il file non si cancella");
            assert!(si_scrive(&c).is_ok(), "la scrittura è riuscita: la cartella è buona anche se il file di prova resta");
            assert_eq!(scegli_cartella(&[c.clone(), c.join("ripiego")]).unwrap(), (c.clone(), true));
            drop(tenuto);
        }
        let _ = std::fs::remove_dir_all(&c);
    }

    #[test]
    fn se_in_documenti_ci_sono_gia_salvataggi_non_si_passa_al_ripiego_in_silenzio() {
        // revisione 37, M16: una cartella in cui adesso non si riesce a scrivere, ma che ha già dei salvataggi,
        // resta la cartella dei salvataggi: si vedono, «Continua» c’è, e se scrivere non si può lo dice il
        // salvataggio che non riesce. La scelta non si ricorda: alla prossima chiamata si riprova
        let c = cartella_di_prova("resta");
        let documenti = c.join("documenti").join("salvataggi");
        let ripiego = c.join("dati").join("salvataggi");
        std::fs::create_dir_all(&documenti).unwrap();
        std::fs::write(documenti.join("posto-2.json"), "{}").unwrap();
        // «non si scrive»: al posto del file di prova c’è una cartella, e scriverci sopra fallisce
        std::fs::create_dir_all(documenti.join(".prova-di-scrittura")).unwrap();
        assert!(si_scrive(&documenti).is_err(), "la prova che lo scenario è quello vero");
        assert_eq!(scegli_cartella(&[documenti.clone(), ripiego.clone()]).unwrap(), (documenti.clone(), false));
        assert!(!ripiego.exists(), "il ripiego non si crea nemmeno");
        // lo stesso con il solo registro dei finali, o con la riserva del posto automatico
        for nome in [REGISTRO, "automatico.json.bak"] {
            std::fs::remove_file(documenti.join("posto-2.json")).ok();
            std::fs::write(documenti.join(nome), "[]").unwrap();
            assert_eq!(scegli_cartella(&[documenti.clone(), ripiego.clone()]).unwrap().0, documenti, "{nome}");
            std::fs::remove_file(documenti.join(nome)).unwrap();
        }
        // senza salvataggi, e senza poterci scrivere: il ripiego, come prima, e la scelta vale per la sessione
        assert_eq!(scegli_cartella(&[documenti.clone(), ripiego.clone()]).unwrap(), (ripiego.clone(), true));
        // tornata scrivibile: Documenti, e la scelta si ricorda
        std::fs::remove_dir_all(documenti.join(".prova-di-scrittura")).unwrap();
        assert_eq!(scegli_cartella(&[documenti.clone(), ripiego]).unwrap(), (documenti, true));
        let _ = std::fs::remove_dir_all(&c);
    }

    #[test]
    fn una_prova_non_scrive_nei_salvataggi_di_chi_gioca() {
        // revisione 37, L20: RELITTO_PROVA senza RELITTO_SALVATAGGI scriveva nei posti veri (la prova dei
        // salvataggi nel posto 6 e nell’automatico, quella dei finali nell’automatico e nel registro dei finali)
        let tmp = Path::new("/tmp-di-prova");
        assert_eq!(cartella_imposta(Some("C:/x/salvataggi"), Some("salvataggi"), tmp), Some(PathBuf::from("C:/x/salvataggi")));
        assert_eq!(cartella_imposta(Some("C:/x/salvataggi"), None, tmp), Some(PathBuf::from("C:/x/salvataggi")));
        for prova in ["salvataggi", "finali", "esci", "mondo"] {
            let c = cartella_imposta(None, Some(prova), tmp).expect("una prova ha sempre una cartella sua");
            assert!(c.starts_with(tmp), "{prova}: {}", c.display());
            assert_eq!(cartella_imposta(Some(""), Some(prova), tmp), Some(c));
        }
        // chi gioca: nessuna cartella imposta, si sceglie fra Documenti e il ripiego
        assert_eq!(cartella_imposta(None, None, tmp), None);
        assert_eq!(cartella_imposta(Some(""), Some(""), tmp), None);
    }

    /// Un registro con questi finali, uno al giorno.
    fn registro_con(finali: &[(&str, u32)]) -> String {
        let voci: Vec<String> = finali
            .iter()
            .map(|(f, giorno)| format!(r#"{{"finale":"{f}","titolo":"{f}","riga":null,"data":"2026-11-{giorno:02}T12:00:00Z"}}"#))
            .collect();
        format!("[{}]", voci.join(","))
    }

    fn finali_di(testo: &str) -> Vec<String> {
        serde_json::from_str::<Vec<Value>>(testo).unwrap().iter().map(|v| v["finale"].as_str().unwrap().to_string()).collect()
    }

    #[test]
    fn un_registro_che_per_un_momento_non_si_legge_non_perde_i_finali() {
        // revisione 37, M17. Tre finali già raggiunti
        let c = cartella_di_prova("registro-copia");
        let tre = registro_con(&[("mani-vuote", 1), ("vivi", 2), ("stiva-piena", 3)]);
        registro_in(&c, &tre).unwrap();
        assert!(!riserva_di(&c.join(REGISTRO)).exists(), "al primo registro non c’è niente da tenere");
        // il registro cresce: la versione di prima resta accanto
        let quattro = registro_con(&[("mani-vuote", 1), ("vivi", 2), ("stiva-piena", 3), ("doppio-fondo", 4)]);
        registro_in(&c, &quattro).unwrap();
        assert_eq!(std::fs::read_to_string(riserva_di(&c.join(REGISTRO))).unwrap(), tre);
        assert_eq!(registro_da(&c), quattro, "un registro buono si legge com’è");

        // All’avvio il registro per un momento non si legge (lo tiene OneDrive): la pagina crede di non averne, e
        // al finale dopo scrive un registro con una riga sola. Prima quella riga prendeva il posto di tutte
        let una = registro_con(&[("due-lettere", 5)]);
        registro_in(&c, &una).unwrap();
        // la copia tiene il registro intero, e non quello di tre finali fa
        assert_eq!(std::fs::read_to_string(riserva_di(&c.join(REGISTRO))).unwrap(), quattro);
        // e alla lettura dopo i finali ci sono tutti e cinque, in ordine di data
        assert_eq!(finali_di(&registro_da(&c)), ["mani-vuote", "vivi", "stiva-piena", "doppio-fondo", "due-lettere"]);
        // un’altra scrittura corta (la pagina ha ancora il suo registro di una riga, più un finale): la copia non
        // diventa quella corta, tiene i quattro di prima e quello nuovo
        let due = registro_con(&[("due-lettere", 5), ("prima-nota", 6)]);
        registro_in(&c, &due).unwrap();
        assert_eq!(finali_di(&std::fs::read_to_string(riserva_di(&c.join(REGISTRO))).unwrap()), ["mani-vuote", "vivi", "stiva-piena", "doppio-fondo", "due-lettere"]);
        assert_eq!(finali_di(&registro_da(&c)), ["mani-vuote", "vivi", "stiva-piena", "doppio-fondo", "due-lettere", "prima-nota"]);
        // la pagina, all’avvio dopo, legge tutto e riscrive tutto: da lì la copia torna a seguire il registro
        let tutti = registro_da(&c);
        registro_in(&c, &tutti).unwrap();
        registro_in(&c, &tutti).unwrap();
        assert_eq!(finali_di(&std::fs::read_to_string(riserva_di(&c.join(REGISTRO))).unwrap()).len(), 6);
        let _ = std::fs::remove_dir_all(&c);
    }

    #[test]
    fn un_registro_rovinato_si_legge_dalla_copia_e_non_c_e_non_e_illeggibile() {
        // revisione 37, M17
        let c = cartella_di_prova("registro-rovinato");
        let percorso = c.join(REGISTRO);
        assert_eq!(leggi_registro(&percorso), Registro::Assente);
        assert_eq!(registro_da(&c), "[]");
        let tre = registro_con(&[("mani-vuote", 1), ("vivi", 2), ("stiva-piena", 3)]);
        let quattro = registro_con(&[("mani-vuote", 1), ("vivi", 2), ("stiva-piena", 3), ("doppio-fondo", 4)]);
        registro_in(&c, &tre).unwrap();
        registro_in(&c, &quattro).unwrap();
        // il file si rovina: non è «non c’è»
        std::fs::write(&percorso, "{ rotto").unwrap();
        assert_eq!(leggi_registro(&percorso), Registro::Illeggibile);
        // si legge la copia
        assert_eq!(finali_di(&registro_da(&c)), ["mani-vuote", "vivi", "stiva-piena"]);
        // e scrivere sopra un registro rovinato non tocca la copia buona
        let una = registro_con(&[("due-lettere", 5)]);
        registro_in(&c, &una).unwrap();
        assert_eq!(std::fs::read_to_string(riserva_di(&percorso)).unwrap(), tre);
        assert_eq!(finali_di(&registro_da(&c)), ["mani-vuote", "vivi", "stiva-piena", "due-lettere"]);
        // lo stesso finale nel registro e nella copia: vale la data più vecchia, una volta sola
        let di_nuovo = registro_con(&[("vivi", 9), ("due-lettere", 5)]);
        registro_in(&c, &di_nuovo).unwrap();
        let letto: Vec<Value> = serde_json::from_str(&registro_da(&c)).unwrap();
        assert_eq!(letto.iter().filter(|v| v["finale"] == "vivi").count(), 1);
        assert_eq!(letto.iter().find(|v| v["finale"] == "vivi").unwrap()["data"], "2026-11-02T12:00:00Z");
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
