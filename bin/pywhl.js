#!/usr/bin/env node

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import the main CLI module
import('../src/index.js').catch(err => {
  console.error('Failed to start pywhl:', err);
  process.exit(1);
});