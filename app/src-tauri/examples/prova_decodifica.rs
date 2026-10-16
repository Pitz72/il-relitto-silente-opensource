//! Prova usa e getta: decodifica un MP3 con kira e dice quanto ci mette o che errore dà.

fn main() {
    let p = std::env::args().nth(1).expect("serve un file");
    match relitto_lib::mondo::musica_file::prova_decodifica(std::path::Path::new(&p)) {
        Ok(d) => println!("ok: {d}"),
        Err(e) => println!("errore: {e}"),
    }
}
