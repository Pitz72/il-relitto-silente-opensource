// Niente finestra della console su Windows, nelle build di rilascio.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    relitto_lib::run();
}
