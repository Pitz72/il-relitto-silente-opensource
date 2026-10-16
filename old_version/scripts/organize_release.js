import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');

const platforms = ['windows', 'mac', 'linux'];
const docs = ['LEGGIMI.txt', 'SOLUZIONE.md'];

// Ensure release directory exists
if (!fs.existsSync(releaseDir)) {
    console.error('Release directory not found!');
    process.exit(1);
}

// Create platform directories
platforms.forEach(platform => {
    const platformDir = path.join(releaseDir, platform);
    if (!fs.existsSync(platformDir)) {
        fs.mkdirSync(platformDir, { recursive: true });
        console.log(`Created directory: ${platformDir}`);
    }

    // Copy documentation to each platform folder
    docs.forEach(doc => {
        const src = path.join(rootDir, doc);
        const dest = path.join(platformDir, doc);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`Copied ${doc} to ${platform}`);
        } else {
            console.warn(`Warning: Documentation file ${doc} not found in root.`);
        }
    });
});

// Move Windows artifacts
const files = fs.readdirSync(releaseDir);
files.forEach(file => {
    if (file.endsWith('.exe') || file.endsWith('.exe.blockmap')) {
        const src = path.join(releaseDir, file);
        const dest = path.join(releaseDir, 'windows', file);
        // Rename to generic name if desired, or keep specific version
        fs.renameSync(src, dest);
        console.log(`Moved ${file} to windows/`);
    }
});

// Create placeholder notes for Mac/Linux
fs.writeFileSync(path.join(releaseDir, 'mac', 'PLACE_DMG_HERE.txt'), 'Place the .dmg file here after building on macOS.');
fs.writeFileSync(path.join(releaseDir, 'linux', 'PLACE_APPIMAGE_HERE.txt'), 'Place the .AppImage file here after building on Linux.');

console.log('Organization complete.');
