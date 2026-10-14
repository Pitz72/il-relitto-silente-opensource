# Cattura un fotogramma di una pagina WebGL con Edge senza finestra.
# Uso: cattura.ps1 <url> <file.png> [larghezza] [altezza]
param([string]$Url, [string]$Uscita, [int]$L = 1920, [int]$A = 1080)
$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
Remove-Item $Uscita -ErrorAction SilentlyContinue
$p = Start-Process -FilePath $edge -PassThru -Wait -ArgumentList @(
  "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
  "--user-data-dir=$env:TEMP\relitto-edge-profilo", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--window-size=$L,$A", "--virtual-time-budget=15000", "--screenshot=$Uscita", $Url)
if (Test-Path $Uscita) { "ok $Uscita" } else { "MANCA $Uscita (codice $($p.ExitCode))" }
