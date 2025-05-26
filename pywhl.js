#!/usr/bin/env node

// Unified Pywhl - Browser mode by default for maximum compatibility
// Single command for corporate environments

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Check if running in lightweight branch
const browserScript = join(__dirname, 'pywhl-browser.js');
const lightweightScript = join(__dirname, 'pywhl-lightweight.js');

// Parse arguments
const args = process.argv.slice(2);

// Help text
const helpText = `
🐍 Pywhl - Python Package Downloader for Corporate Environments

Usage:
  pywhl <package>                    # Browser mode (recommended)
  pywhl <package> <package2> ...     # Multiple packages
  pywhl <package>==<version>         # Specific version
  pywhl -r requirements.txt          # From requirements file
  
Options:
  --direct                           # Try direct download (may fail with proxies)
  --help, -h                         # Show this help

Examples:
  pywhl numpy                        # Opens browser download page for numpy
  pywhl pandas==2.0.0 requests       # Multiple packages with versions
  pywhl --direct numpy               # Try direct download (if proxy allows)

Default Mode: Browser
  1. Generates an HTML page with download links
  2. You download files through your browser
  3. Run the processor to organize and install

Why Browser Mode?
  - Works with ALL corporate proxies
  - Uses your browser's authentication
  - 100% success rate if browser can access PyPI
`;

// Show help
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(helpText);
  process.exit(0);
}

// Check for --direct flag
const directMode = args.includes('--direct');
const filteredArgs = args.filter(arg => arg !== '--direct');

// Determine which script to run
let scriptToRun;
let modeDescription;

if (directMode && existsSync(lightweightScript)) {
  scriptToRun = lightweightScript;
  modeDescription = 'direct download mode';
  // For direct mode, we need to add the 'download' command
  filteredArgs.unshift('download');
} else {
  scriptToRun = browserScript;
  modeDescription = 'browser mode (recommended)';
}

if (!existsSync(scriptToRun)) {
  console.error(`❌ Error: Required script not found: ${scriptToRun}`);
  console.error(`Please ensure you're in the pywhl directory.`);
  process.exit(1);
}

// Show mode
console.log(`🚀 Running in ${modeDescription}\n`);

// Run the appropriate script
const child = spawn('node', [scriptToRun, ...filteredArgs], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error(`❌ Error: ${error.message}`);
  if (directMode) {
    console.log('\n💡 Tip: Try without --direct flag to use browser mode (more reliable)');
  }
  process.exit(1);
});

child.on('exit', (code) => {
  if (code !== 0 && directMode) {
    console.log('\n💡 Direct download failed. Try browser mode instead:');
    console.log(`   pywhl ${filteredArgs.slice(1).join(' ')}`);
  }
  process.exit(code);
});