// =============================================================================
//  Il motore audio della prova tecnica (fase 1).
//  ---------------------------------------------------------------------------
//  Tre suoni, comandati dalla pagina con comandi Tauri:
//    · il re del reattore, sintetizzato qui (un re a 73,42 Hz con i suoi
//      armonici, due banchi appena scordati che battono lentamente);
//    · un campione in loop (risorse/audio/prova-ventilazione.ogg), letto dal
//      disco come lo saranno i suoni veri;
//    · il segnale: un tocco breve, per misurare quanto passa fra il comando e
//      il primo blocco audio che lo contiene.
//  La telemetria dice se il flusso tiene: gli intervalli fra un blocco e
//  l'altro, l'uso della CPU del thread audio, gli errori del flusso.
// =============================================================================

use std::f64::consts::TAU;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::mpsc::Sender;
use std::sync::{Arc, OnceLock};
use std::time::Instant;

use kira::backend::cpal::CpalBackend;
use kira::info::Info;
use kira::sound::static_sound::{StaticSoundData, StaticSoundHandle};
use kira::sound::{Sound, SoundData};
use kira::{AudioManager, AudioManagerSettings, Decibels, Frame, Tween};
use serde::Serialize;

use crate::mondo::campioni::Banca;
use crate::mondo::{Comando, DatiMondo, Istantanea, Mondo, StatoMondo};

/// L'istante in cui il processo è partito: l'origine di tutti i tempi.
pub static EPOCA: OnceLock<Instant> = OnceLock::new();

pub fn adesso_ns() -> u64 {
    EPOCA.get_or_init(Instant::now).elapsed().as_nanos() as u64
}

/// Gli intervalli fra un blocco audio e il successivo, in classi (ms).
const CLASSI_MS: [f64; 8] = [1.0, 5.0, 10.0, 15.0, 20.0, 30.0, 50.0, f64::INFINITY];

#[derive(Default)]
pub struct Telemetria {
    chiamate: AtomicU64,
    ultimo_ns: AtomicU64,
    gap_max_ns: AtomicU64,
    classi: [AtomicU64; 8],
    frame_per_blocco: AtomicU64,
    // il segnale di latenza
    segnale_comando_ns: AtomicU64,
    segnale_render_ns: AtomicU64,
}

impl Telemetria {
    pub(crate) fn blocco(&self, frame: usize) {
        let ora = adesso_ns();
        let prima = self.ultimo_ns.swap(ora, Ordering::Relaxed);
        self.chiamate.fetch_add(1, Ordering::Relaxed);
        self.frame_per_blocco.store(frame as u64, Ordering::Relaxed);
        if prima > 0 {
            let gap = ora.saturating_sub(prima);
            self.gap_max_ns.fetch_max(gap, Ordering::Relaxed);
            let ms = gap as f64 / 1e6;
            let k = CLASSI_MS.iter().position(|&lim| ms < lim).unwrap_or(7);
            self.classi[k].fetch_add(1, Ordering::Relaxed);
        }
    }
}

// -----------------------------------------------------------------------------
//  Il re del reattore
// -----------------------------------------------------------------------------
const RE: f64 = 73.416_191_979_351_6; // re2, la = 440 Hz
// (armonico, ampiezza): pari più deboli dei dispari, come il ronzio di un
// trasformatore sotto carico; il sesto e l'ottavo danno il metallo.
const ARMONICI: [(f64, f64); 8] = [
    (1.0, 1.0), (2.0, 0.42), (3.0, 0.55), (4.0, 0.18),
    (5.0, 0.22), (6.0, 0.09), (7.0, 0.07), (8.0, 0.05),
];

pub struct DatiRe {
    pub telemetria: Arc<Telemetria>,
    pub fermo: Arc<AtomicBool>,
}

pub struct ManigliaRe {
    fermo: Arc<AtomicBool>,
}

impl ManigliaRe {
    pub fn ferma(&self) {
        self.fermo.store(true, Ordering::Relaxed);
    }
}

struct SuonoRe {
    t: f64,
    guadagno: f64,
    telemetria: Arc<Telemetria>,
    fermo: Arc<AtomicBool>,
}

impl SoundData for DatiRe {
    type Error = ();
    type Handle = ManigliaRe;

    fn into_sound(self) -> Result<(Box<dyn Sound>, Self::Handle), Self::Error> {
        let maniglia = ManigliaRe { fermo: self.fermo.clone() };
        Ok((
            Box::new(SuonoRe { t: 0.0, guadagno: 0.0, telemetria: self.telemetria, fermo: self.fermo }),
            maniglia,
        ))
    }
}

impl Sound for SuonoRe {
    fn process(&mut self, out: &mut [Frame], dt: f64, _info: &Info) {
        self.telemetria.blocco(out.len());
        let fermo = self.fermo.load(Ordering::Relaxed);
        for frame in out.iter_mut() {
            // attacco e rilascio di due secondi: il reattore non si accende di colpo
            let meta = if fermo { 0.0 } else { 1.0 };
            self.guadagno += (meta - self.guadagno) * (dt / 2.0).min(1.0) * 3.0;
            let t = self.t;
            // il respiro lento del carico: 0,07 Hz
            let respiro = 1.0 + 0.08 * (TAU * 0.07 * t).sin();
            let mut s_l = 0.0;
            let mut s_r = 0.0;
            for (n, a) in ARMONICI {
                let f = RE * n;
                // secondo banco scordato di 0,11 Hz × n: battimenti lenti
                let base = (TAU * f * t).sin();
                let scordato = (TAU * (f + 0.11 * n) * t + n * 0.7).sin();
                s_l += a * (0.62 * base + 0.38 * scordato);
                s_r += a * (0.62 * base + 0.38 * (TAU * (f + 0.11 * n) * t + n * 0.7 + 0.35).sin());
            }
            let g = self.guadagno * respiro * 0.11;
            // una saturazione morbida: calore, non distorsione
            frame.left = ((s_l * g).tanh()) as f32;
            frame.right = ((s_r * g).tanh()) as f32;
            self.t += dt;
        }
    }

    fn finished(&self) -> bool {
        self.fermo.load(Ordering::Relaxed) && self.guadagno < 1e-4
    }
}

// -----------------------------------------------------------------------------
//  Il segnale: un tocco di 40 ms a 1 kHz che annota quando è stato reso
// -----------------------------------------------------------------------------
struct DatiSegnale {
    telemetria: Arc<Telemetria>,
}

struct SuonoSegnale {
    t: f64,
    annotato: bool,
    telemetria: Arc<Telemetria>,
}

impl SoundData for DatiSegnale {
    type Error = ();
    type Handle = ();

    fn into_sound(self) -> Result<(Box<dyn Sound>, Self::Handle), Self::Error> {
        Ok((Box::new(SuonoSegnale { t: 0.0, annotato: false, telemetria: self.telemetria }), ()))
    }
}

impl Sound for SuonoSegnale {
    fn process(&mut self, out: &mut [Frame], dt: f64, _info: &Info) {
        if !self.annotato {
            self.annotato = true;
            self.telemetria.segnale_render_ns.store(adesso_ns(), Ordering::Relaxed);
        }
        for frame in out.iter_mut() {
            let inviluppo = if self.t < 0.04 { (1.0 - self.t / 0.04).powi(2) } else { 0.0 };
            let s = (TAU * 1000.0 * self.t).sin() * inviluppo * 0.18;
            *frame = Frame::from_mono(s as f32);
            self.t += dt;
        }
    }

    fn finished(&self) -> bool {
        self.t >= 0.05
    }
}

// -----------------------------------------------------------------------------
//  Il motore
// -----------------------------------------------------------------------------
#[derive(Serialize, Clone)]
pub struct InfoAudio {
    /// il sistema audio usato da cpal: Wasapi, PulseAudio, Alsa…
    pub host: String,
    pub frequenza: u32,
    pub buffer_interno: usize,
    pub avvio_ms: f64,
}

/// Il dispositivo d'uscita. Su Linux è il «default» di ALSA, scelto una volta
/// all'avvio e passato a kira: così kira non interroga il sistema ogni mezzo
/// secondo per seguire il dispositivo predefinito. In WSLg quell'interrogazione,
/// a flusso aperto, faceva fallire il plugin ALSA (errori a raffica, buchi di
/// secondi); con il dispositivo fisso il flusso tiene. Il «default» di ALSA porta
/// a PipeWire o a PulseAudio, che spostano da soli il flusso quando cambia
/// l'uscita (le cuffie). RELITTO_AUDIO_HOST=pulseaudio prova il protocollo
/// PulseAudio di cpal, che in WSLg ha dato latenze di 150 ms: per il confronto
/// sulla macchina vera. Su Windows resta la scelta di kira (WASAPI).
fn dispositivo() -> Result<(Option<kira::backend::cpal::cpal::Device>, String), String> {
    use kira::backend::cpal::cpal;
    #[cfg(target_os = "linux")]
    {
        use kira::backend::cpal::cpal::traits::HostTrait;
        let host = match std::env::var("RELITTO_AUDIO_HOST").unwrap_or_default().as_str() {
            "pulseaudio" => cpal::host_from_id(cpal::HostId::PulseAudio).map_err(|e| e.to_string())?,
            _ => cpal::host_from_id(cpal::HostId::Alsa).map_err(|e| e.to_string())?,
        };
        let nome = format!("{:?}", host.id());
        let d = host.default_output_device().ok_or("nessun dispositivo audio")?;
        Ok((Some(d), nome))
    }
    #[cfg(not(target_os = "linux"))]
    {
        Ok((None, format!("{:?}", cpal::default_host().id())))
    }
}

#[derive(Serialize, Clone, Default)]
pub struct MisureAudio {
    pub blocchi: u64,
    pub frame_per_blocco: u64,
    pub gap_max_ms: f64,
    /// quanti intervalli cadono in [0,1) [1,5) [5,10) [10,15) [15,20) [20,30) [30,50) [50,∞) ms
    pub classi_gap: [u64; 8],
    pub cpu_media: f64,
    pub cpu_max: f64,
    pub cpu_campioni: u64,
    pub errori_flusso: u64,
    /// i primi errori del flusso, diversi fra loro, come li descrive cpal
    pub errori_tipi: Vec<String>,
    pub errori_scartati: u64,
    /// il buffer chiesto a cpal (0 = quello predefinito del sistema)
    pub buffer_richiesto: u32,
    pub ultimo_segnale_ms: Option<f64>,
    pub re_acceso: bool,
    pub campione_acceso: bool,
}

pub struct MotoreAudio {
    manager: AudioManager<CpalBackend>,
    telemetria: Arc<Telemetria>,
    re: Option<ManigliaRe>,
    campione: Option<StaticSoundHandle>,
    dati_campione: Option<StaticSoundData>,
    info: InfoAudio,
    cpu_somma: f64,
    cpu_max: f64,
    cpu_n: u64,
    errori: u64,
    errori_tipi: Vec<String>,
    buffer_richiesto: u32,
    /// il mondo sonoro del prototipo: il canale dei comandi e quello che si può leggere
    mondo: Option<(Sender<Comando>, Arc<StatoMondo>)>,
}

impl MotoreAudio {
    /// RELITTO_AUDIO_BUFFER=1024 chiede a cpal un buffer fisso di 1024 frame
    /// (21 ms a 48 kHz) invece di quello predefinito del sistema.
    pub fn nuovo() -> Result<Self, String> {
        use kira::backend::cpal::CpalBackendSettings;
        use kira::backend::cpal::cpal::traits::{DeviceTrait, HostTrait};
        use kira::backend::cpal::cpal::{BufferSize, StreamConfig};
        let t0 = Instant::now();
        let mut settings = AudioManagerSettings::<CpalBackend>::default();
        let buffer_richiesto: u32 = std::env::var("RELITTO_AUDIO_BUFFER").ok().and_then(|v| v.parse().ok()).unwrap_or(0);
        let (scelto, host) = dispositivo()?;
        if buffer_richiesto > 0 {
            let d = match scelto {
                Some(d) => d,
                None => kira::backend::cpal::cpal::default_host()
                    .default_output_device()
                    .ok_or("nessun dispositivo audio")?,
            };
            let base = d.default_output_config().map_err(|e| e.to_string())?.config();
            settings.backend_settings = CpalBackendSettings {
                device: Some(d),
                config: Some(StreamConfig { buffer_size: BufferSize::Fixed(buffer_richiesto), ..base }),
            };
        } else if let Some(d) = scelto {
            settings.backend_settings = CpalBackendSettings { device: Some(d), config: None };
        }
        let buffer_interno = settings.internal_buffer_size;
        let manager = AudioManager::<CpalBackend>::new(settings).map_err(|e| e.to_string())?;
        let telemetria = Arc::new(Telemetria::default());
        let info = InfoAudio {
            host,
            frequenza: 0,
            buffer_interno,
            avvio_ms: t0.elapsed().as_secs_f64() * 1000.0,
        };
        let mut m = Self {
            manager, telemetria, re: None, campione: None, dati_campione: None, info,
            cpu_somma: 0.0, cpu_max: 0.0, cpu_n: 0, errori: 0, errori_tipi: Vec::new(), buffer_richiesto,
            mondo: None,
        };
        m.info.frequenza = m.frequenza();
        Ok(m)
    }

    fn frequenza(&mut self) -> u32 {
        // kira non la espone direttamente: la chiediamo a cpal, sullo stesso dispositivo
        use kira::backend::cpal::cpal::traits::DeviceTrait;
        dispositivo()
            .ok()
            .and_then(|(d, _)| d.or_else(|| {
                use kira::backend::cpal::cpal::traits::HostTrait;
                kira::backend::cpal::cpal::default_host().default_output_device()
            }))
            .and_then(|d| d.default_output_config().ok())
            .map(|c| c.sample_rate())
            .unwrap_or(0)
    }

    pub fn info(&self) -> InfoAudio {
        self.info.clone()
    }

    pub fn re(&mut self, acceso: bool) -> Result<(), String> {
        if acceso && self.re.is_none() {
            let dati = DatiRe { telemetria: self.telemetria.clone(), fermo: Arc::new(AtomicBool::new(false)) };
            self.re = Some(self.manager.play(dati).map_err(|e| format!("{e:?}"))?);
        } else if !acceso {
            if let Some(r) = self.re.take() {
                r.ferma();
            }
        }
        Ok(())
    }

    pub fn carica_campione(&mut self, percorso: &std::path::Path) -> Result<f64, String> {
        let t0 = Instant::now();
        let dati = StaticSoundData::from_file(percorso).map_err(|e| e.to_string())?;
        self.dati_campione = Some(dati.loop_region(..));
        Ok(t0.elapsed().as_secs_f64() * 1000.0)
    }

    pub fn campione(&mut self, acceso: bool, volume_db: f32) -> Result<(), String> {
        if acceso && self.campione.is_none() {
            let dati = self.dati_campione.clone().ok_or("campione non caricato")?;
            let maniglia = self
                .manager
                .play(dati.volume(Decibels(volume_db)).fade_in_tween(Tween {
                    duration: std::time::Duration::from_millis(1500),
                    ..Default::default()
                }))
                .map_err(|e| format!("{e:?}"))?;
            self.campione = Some(maniglia);
        } else if !acceso {
            if let Some(mut h) = self.campione.take() {
                h.stop(Tween { duration: std::time::Duration::from_millis(1200), ..Default::default() });
            }
        }
        Ok(())
    }

    pub fn segnale(&mut self) -> Result<(), String> {
        self.telemetria.segnale_render_ns.store(0, Ordering::Relaxed);
        self.telemetria.segnale_comando_ns.store(adesso_ns(), Ordering::Relaxed);
        self.manager
            .play(DatiSegnale { telemetria: self.telemetria.clone() })
            .map_err(|e| format!("{e:?}"))?;
        Ok(())
    }

    pub fn misure(&mut self) -> MisureAudio {
        while let Some(u) = self.manager.backend_mut().pop_cpu_usage() {
            let u = u as f64;
            self.cpu_somma += u;
            self.cpu_n += 1;
            if u > self.cpu_max {
                self.cpu_max = u;
            }
        }
        while let Some(e) = self.manager.backend_mut().pop_error() {
            self.errori += 1;
            let descrizione = format!("{e:?}");
            if self.errori_tipi.len() < 8 && !self.errori_tipi.contains(&descrizione) {
                self.errori_tipi.push(descrizione);
            }
        }
        let errori_scartati = self.manager.backend_mut().num_stream_errors_discarded().unwrap_or(0);
        let t = &self.telemetria;
        let comando = t.segnale_comando_ns.load(Ordering::Relaxed);
        let render = t.segnale_render_ns.load(Ordering::Relaxed);
        MisureAudio {
            blocchi: t.chiamate.load(Ordering::Relaxed),
            frame_per_blocco: t.frame_per_blocco.load(Ordering::Relaxed),
            gap_max_ms: t.gap_max_ns.load(Ordering::Relaxed) as f64 / 1e6,
            classi_gap: std::array::from_fn(|k| t.classi[k].load(Ordering::Relaxed)),
            cpu_media: if self.cpu_n > 0 { self.cpu_somma / self.cpu_n as f64 } else { 0.0 },
            cpu_max: self.cpu_max,
            cpu_campioni: self.cpu_n,
            errori_flusso: self.errori,
            errori_tipi: self.errori_tipi.clone(),
            errori_scartati,
            buffer_richiesto: self.buffer_richiesto,
            ultimo_segnale_ms: (render > comando && comando > 0)
                .then(|| (render - comando) as f64 / 1e6),
            re_acceso: self.re.is_some(),
            campione_acceso: self.campione.is_some(),
        }
    }

    /// Avvia il mondo sonoro con i campioni già caricati. Se c’era, il vecchio sfuma.
    pub fn mondo_avvia(&mut self, banca: &Banca) -> Result<(), String> {
        self.mondo_ferma();
        let seme = adesso_ns() ^ 0x5EED;
        let (mondo, tx, stato) = Mondo::nuovo(banca, self.info.frequenza.max(1) as f32, seme)?;
        let telemetria = self.telemetria.clone();
        let dati = DatiMondo { mondo, prima_del_blocco: Some(Box::new(move |n| telemetria.blocco(n))) };
        self.manager.play(dati).map_err(|e| format!("{e:?}"))?;
        self.mondo = Some((tx, stato));
        Ok(())
    }

    pub fn mondo_comando(&mut self, c: Comando) -> Result<(), String> {
        let (tx, _) = self.mondo.as_ref().ok_or("il mondo sonoro non è avviato")?;
        tx.send(c).map_err(|e| e.to_string())
    }

    pub fn mondo_stato(&self) -> Option<Istantanea> {
        self.mondo.as_ref().map(|(_, s)| s.istantanea())
    }

    pub fn mondo_ferma(&mut self) {
        if let Some((tx, _)) = self.mondo.take() {
            let _ = tx.send(Comando::Ferma);
        }
    }

    pub fn azzera(&mut self) {
        let t = &self.telemetria;
        t.chiamate.store(0, Ordering::Relaxed);
        t.gap_max_ns.store(0, Ordering::Relaxed);
        t.ultimo_ns.store(0, Ordering::Relaxed);
        for c in &t.classi {
            c.store(0, Ordering::Relaxed);
        }
        while self.manager.backend_mut().pop_cpu_usage().is_some() {}
        self.cpu_somma = 0.0;
        self.cpu_max = 0.0;
        self.cpu_n = 0;
    }
}
