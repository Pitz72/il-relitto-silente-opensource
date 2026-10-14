#!/usr/bin/env bash
# ============================================================================
#  Costruisce l'app per Linux (.deb e AppImage) e, a richiesta, la prova.
#
#  Su una macchina Linux con il repository clonato e Node 22:
#      strumenti/linux/costruisci.sh
#  In WSL, con il frontend già costruito su Windows (app/dist):
#      strumenti/linux/costruisci.sh --senza-node
#  In più, dopo la build:
#      --prova       avvia l'app con la prova completa (RELITTO_PROVA=esci)
#  Il rapporto della prova va in $RELITTO_RAPPORTI (predefinita: ./rapporti).
#
#  Si costruisce in una copia nel filesystem Linux (~/relitto-build): cargo su
#  /mnt/c è lentissimo e i permessi non sono quelli di Linux.
# ============================================================================
set -euo pipefail

QUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RADICE="$(cd "$QUI/../.." && pwd)"
COPIA="${RELITTO_COPIA:-$HOME/relitto-build}"
SENZA_NODE=0
PROVA=0
for a in "$@"; do
  case "$a" in
    --senza-node) SENZA_NODE=1 ;;
    --prova) PROVA=1 ;;
    *) echo "Opzione sconosciuta: $a" >&2; exit 2 ;;
  esac
done

# --- le dipendenze ------------------------------------------------------------
manca=()
for p in webkit2gtk-4.1 alsa libsoup-3.0 javascriptcoregtk-4.1; do
  pkg-config --exists "$p" || manca+=("$p")
done
if ((${#manca[@]})); then
  echo "Mancano: ${manca[*]}. Su Ubuntu/Debian:" >&2
  echo "  sudo apt install build-essential curl wget file pkg-config libwebkit2gtk-4.1-dev \\" >&2
  echo "       libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev libasound2-dev libdbus-1-dev" >&2
  exit 1
fi
command -v cargo >/dev/null || { echo "Manca Rust: https://rustup.rs" >&2; exit 1; }
cargo tauri --version >/dev/null 2>&1 || { echo "Manca tauri-cli: cargo install tauri-cli --version '^2' --locked" >&2; exit 1; }

# --- la copia di lavoro -------------------------------------------------------
mkdir -p "$COPIA"
rsync -a --delete \
  --exclude 'node_modules/' --exclude 'src-tauri/target/' --exclude 'src-tauri/gen/' \
  "$RADICE/app/" "$COPIA/app/"
rsync -a --delete "$RADICE/motore/" "$COPIA/motore/"
rsync -a --delete "$RADICE/relitto-silente/" "$COPIA/relitto-silente/"
rsync -a --delete --exclude 'trascrizione-*' "$RADICE/collaudo/" "$COPIA/collaudo/"
cp "$RADICE/versione.json" "$COPIA/"

cd "$COPIA/app"
export CARGO_TARGET_DIR="$COPIA/target"
export APPIMAGE_EXTRACT_AND_RUN=1   # l'AppImage di linuxdeploy gira anche senza FUSE (WSL)
T0=$(date +%s)
if ((SENZA_NODE)); then
  [[ -f dist/index.html ]] || { echo "Manca app/dist: costruisci il frontend su Windows (npm run build)." >&2; exit 1; }
  cargo tauri build --bundles deb,appimage --config '{"build":{"beforeBuildCommand":""}}'
else
  npm ci
  cargo tauri build --bundles deb,appimage
fi
echo "Build in $(( $(date +%s) - T0 )) s"
ls -la "$CARGO_TARGET_DIR/release/il-relitto-silente" "$CARGO_TARGET_DIR/release/bundle/deb/"*.deb "$CARGO_TARGET_DIR/release/bundle/appimage/"*.AppImage

if ((PROVA)); then
  mkdir -p "${RELITTO_RAPPORTI:=$PWD/rapporti}"
  echo "Prova completa: il rapporto andrà in $RELITTO_RAPPORTI"
  RELITTO_PROVA=esci RELITTO_RAPPORTI="$RELITTO_RAPPORTI" "$CARGO_TARGET_DIR/release/il-relitto-silente"
  ls -la "$RELITTO_RAPPORTI"
fi
