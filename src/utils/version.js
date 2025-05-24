import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function getVersion() {
  try {
    const packagePath = join(__dirname, '../../package.json');
    const packageData = JSON.parse(readFileSync(packagePath, 'utf8'));
    return packageData.version;
  } catch (error) {
    return '0.1.0';
  }
}