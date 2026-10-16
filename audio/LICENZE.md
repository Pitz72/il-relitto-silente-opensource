# Il registro delle licenze dei suoni

Ogni file sonoro che entra nel progetto ha una riga qui, prima di essere usato. Le regole vengono da `progettazione/10-bibbia-sonora.md`, §7.

**Dal 15 ottobre 2026 il gioco non usa registrazioni.** Ascoltato il prototipo, l’autore ha deciso che per ora ogni suono si fa con il codice: tutto il suono è sintetizzato nel motore audio (`app/src-tauri/src/mondo/`). I dodici file qui sotto erano stati scaricati per il prototipo del 14 ottobre; non entrano più nel gioco né nella schermata dei riconoscimenti, e restano nel registro come storia, con le loro impronte. Se un giorno l’autore porta suoni veri, le regole valgono ancora e si ricomincia da qui.

## Le regole

1. **Prima di scaricare si chiede il permesso** all’autore del gioco, con il nome del file, la fonte e la dimensione.
2. **Licenze ammesse:** CC0; pubblico dominio; la licenza Sonniss GDC; CC BY 4.0, con il nome dell’autore nei titoli di coda; le registrazioni fatte dall’autore del gioco.
3. **Licenze escluse:** tutte le NC (non commerciali), le ND (non modificabili), Sampling+, BBC Sound Effects (RemArc), i file senza una licenza chiara, i suoni generati dall’IA (**eccezione dal 16 ottobre 2026: la musica generata con Lyria 3.5 in Google Flow Music, voluta dall’autore; ha il suo registro in `audio/musica-ia/REGISTRO.md` e il suo documento, `progettazione/22-musica-con-lyria.md`; la licenza dei file è CC BY-NC-SA 4.0 per quanto di spettanza dell’autore, con i Termini dei servizi che prevalgono: vedi `LICENZE.md` nella radice**). CC BY-SA solo con una buona ragione.
4. **La licenza si verifica sulla pagina del singolo file**, il giorno del download, e si scrive qui con la data.
5. **Le sorgenti grezze stanno in `audio/sorgenti/`**, fuori da git. Qui si tiene la loro impronta SHA-256, così si sa sempre da quale file viene un suono del gioco.
6. **I suoni lavorati** stanno in `app/src-tauri/risorse/audio/`. Quelli derivati da Sonniss non si possono ridistribuire come effetti sonori: prima di rendere pubblico il repository bisogna decidere dove tenerli.
7. **Sonniss vieta l’uso dei suoni per addestrare IA.** Vale anche per i suoni lavorati.
8. **Tutto questo registro finisce nella schermata «Riconoscimenti e licenze»** che il gioco mostra prima di cominciare (06, §18): ogni suono con autore, fonte e licenza, anche quando la licenza non chiede niente.

## I file

| Sigla | Titolo | Autore | Fonte | Licenza | Ridistribuibile | Scaricato il | Formato | Dimensione | SHA-256 | Usato in |
|---|---|---|---|---|---|---|---|---|---|---|
| P1 | Industrial plant atmos 1 of 4 | apintofmild | [freesound.org](https://freesound.org/people/apintofmild/sounds/839813/) | CC0 1.0 | sì | 2026-10-14 | WAV 48 kHz 16 bit stereo, 3:03 | 35,2 MB | `34e5fbbe6cc8ffd69a874968f068f7e47cbedbe90852496dd0752d201377ffba` | nessuno (era prototipo: plancia (pompe sotto il re)) |
| P2 | Ambient Industrial Ventilation Soundscape | amenhotepIV | [freesound.org](https://freesound.org/people/amenhotepIV/sounds/166014/) | CC0 1.0 | sì | 2026-10-14 | WAV 48 kHz 24 bit stereo, 3:07 | 54,0 MB | `f55107b76e31f8c4a0237e104861ec4b3f774664dc475f6eb9918ad5efeaece2` | nessuno (era prototipo: plancia (ventilazione)) |
| P3 | Metal door hit – contact mic | Salomé_Lubczanski | [freesound.org](https://freesound.org/people/Salom%C3%A9_Lubczanski/sounds/733837/) | CC0 1.0 | sì | 2026-10-14 | WAV 48 kHz 24 bit stereo, 0:54 | 15,6 MB | `4bbb13f946ae62039505602e10931b87ecd30b6ad2c1de295a96632693ce8995` | nessuno (era prototipo: lamiere, colpi a contatto) |
| C1 | Male_Breath_Fast_Loop_Stereo | Nox_Sound | [freesound.org](https://freesound.org/people/Nox_Sound/sounds/554907/) | CC0 1.0 | sì | 2026-10-14 | WAV 96 kHz 24 bit stereo, 0:05 | 3,0 MB | `57d9f0c4800a8719b59e76eccf8485d2ae03e16bf982c941fa3a296d61d4eb61` | nessuno (era prototipo: il fiato veloce) |
| C2 | Male_Breath_Scared_Frozen_Loop_Stereo | Nox_Sound | [freesound.org](https://freesound.org/people/Nox_Sound/sounds/554906/) | CC0 1.0 | sì | 2026-10-14 | WAV 96 kHz 24 bit stereo, 0:07 | 4,1 MB | `e01c7ac350bc361c9e6d4217366e4d62384acb8de1111431fb04f734f3da06af` | nessuno (era prototipo: il fiato trattenuto) |
| C3 | Heavy Breathing | Under7dude | [freesound.org](https://freesound.org/people/Under7dude/sounds/163383/) | CC0 1.0 | sì | 2026-10-14 | WAV 48 kHz 16 bit stereo, 0:04 | 0,8 MB | `35e869f1753ec51e85c627c39fcdb16107d7d8540e0f4ff4dfe57fc8253a7888` | nessuno (era prototipo: il fiato pesante) |
| C4 | Sigh – man – voice – breath in nose – breath out mouth | ValentinPetiteau | [freesound.org](https://freesound.org/people/ValentinPetiteau/sounds/569568/) | CC0 1.0 | sì | 2026-10-14 | WAV 44,1 kHz 24 bit mono, 0:08 | 1,0 MB | `d523a6b760d53004a0c9e3bfe765595bea8983491c5a8c1ff5f4d7be0c4f6358` | nessuno (era prototipo: il fiato calmo) |
| C5 | Fan_01 | moai15 | [freesound.org](https://freesound.org/people/moai15/sounds/336387/) | CC0 1.0 | sì | 2026-10-14 | WAV 48 kHz 24 bit stereo, 0:39 | 11,4 MB | `9de639006751e2d81a1bd53cc59547356bffddd8d3e8847716c16262486c8519` | nessuno (era prototipo: la ventola della tuta) |
| C6 | metallic door contact mic | bruno.auzet | [freesound.org](https://freesound.org/people/bruno.auzet/sounds/718386/) | CC0 1.0 | sì | 2026-10-14 | WAV 48 kHz 24 bit stereo, 1:32 | 26,6 MB | `ac2c56fc5e7c75a4815ea51dee4e4ba889df66983da3cdeab5288d14c240d4ae` | nessuno (era prototipo: stivali, colpi a contatto) |
| V1 | Multilingual Poetry Collection 001 (20 letture, 17 lettori, 12 lingue) | LibriVox | [librivox.org](https://librivox.org/multilingual-poetry-collection-001) | pubblico dominio | sì | 2026-10-14 | ZIP di MP3 64 kbit/s, 39:17 | 18,9 MB | `096a16677014123ae90f9e013deb9dec45395d28b4402ea1bad8ff6aedb6fb7b` | nessuno (era prototipo: la materia del brusio) |
| V2 | Ambience INT water drip dropping cave grotto spooky (Quinta da Regaleira, Portugal) | corkob | [freesound.org](https://freesound.org/people/corkob/sounds/392668/) | CC0 1.0 | sì | 2026-10-14 | FLAC 44,1 kHz 16 bit stereo, 0:20 | 1,8 MB | `f75ec01c6c7a74470f50110ecf3175416c88ce9e507ec96a077fb41e25c80635` | nessuno (era prototipo: gocce) |
| V3 | Ice – Lake fractures | Vrymaa | [freesound.org](https://freesound.org/people/Vrymaa/sounds/737896/) | CC0 1.0 | sì | 2026-10-14 | WAV 44,1 kHz 16 bit mono, 0:58 | 5,1 MB | `bc37d23812a0eb1c160da721649e87f02884547eba1ecc55e4befc2e881e9bc2` | nessuno (era prototipo: gemiti, assestamenti, incrinature) |

I file di Freesound sono gli originali, scaricati con l’account dell’autore; la raccolta LibriVox viene da archive.org. Tutte le licenze sono state lette sulla pagina di ciascun file il 14 ottobre 2026.

## In attesa di permesso

Nessuno.

## Le registrazioni dell’autore

Nessuna, per ora. Quando ci saranno, ognuna avrà la sua riga qui sopra, con «Simone Pizzi» come autore e «dell’autore» come licenza.
