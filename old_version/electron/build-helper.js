import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '../dist-electron');

if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
}

fs.writeFileSync(
    path.join(distPath, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2)
);

console.log('Created dist-electron/package.json with type: commonjs');
