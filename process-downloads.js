#!/usr/bin/env node

// Process manually downloaded wheels and organize them

import { readdirSync, statSync, renameSync, copyFileSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, extname, basename } from 'path';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';

const DOWNLOAD_DIR = join(process.cwd(), 'pywhl-downloads');
const CACHE_DIR = join(process.cwd(), 'pywhl-cache');
const ORGANIZED_DIR = join(process.cwd(), 'pywhl-organized');

// Ensure directories exist
[CACHE_DIR, ORGANIZED_DIR].forEach(dir => mkdirSync(dir, { recursive: true }));

// Get SHA256 hash of a file
async function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', data => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Parse wheel filename to extract metadata
function parseWheelName(filename) {
  // Example: numpy-1.24.0-cp39-cp39-win_amd64.whl
  const match = filename.match(/^([a-zA-Z0-9_-]+)-([0-9.]+(?:\.[a-z0-9]+)?)-(.+)\.whl$/);
  if (match) {
    return {
      name: match[1],
      version: match[2],
      tags: match[3],
      type: 'wheel'
    };
  }
  
  // Try source distribution
  const tarMatch = filename.match(/^([a-zA-Z0-9_-]+)-([0-9.]+(?:\.[a-z0-9]+)?)\.tar\.gz$/);
  if (tarMatch) {
    return {
      name: tarMatch[1],
      version: tarMatch[2],
      type: 'source'
    };
  }
  
  return null;
}

// Main processing function
async function processDownloads() {
  console.log('🔍 Scanning download directory:', DOWNLOAD_DIR);
  
  if (!existsSync(DOWNLOAD_DIR)) {
    console.error(`❌ Download directory not found: ${DOWNLOAD_DIR}`);
    console.log('Please run "node pywhl-browser.js <package>" first');
    process.exit(1);
  }
  
  // Get all files in download directory
  const files = readdirSync(DOWNLOAD_DIR).filter(f => {
    const ext = extname(f).toLowerCase();
    return ext === '.whl' || (ext === '.gz' && f.endsWith('.tar.gz'));
  });
  
  if (files.length === 0) {
    console.error('❌ No wheel or tar.gz files found in download directory');
    console.log('Please download packages to:', DOWNLOAD_DIR);
    process.exit(1);
  }
  
  console.log(`\n📦 Found ${files.length} package file(s)\n`);
  
  const processed = [];
  const errors = [];
  
  // Process each file
  for (const file of files) {
    const filePath = join(DOWNLOAD_DIR, file);
    const stats = statSync(filePath);
    
    console.log(`Processing: ${file}`);
    
    try {
      // Parse filename
      const info = parseWheelName(file);
      if (!info) {
        throw new Error('Could not parse filename');
      }
      
      // Calculate hash
      const hash = await getFileHash(filePath);
      
      // Create organized directory structure
      const pkgDir = join(ORGANIZED_DIR, info.name, info.version);
      mkdirSync(pkgDir, { recursive: true });
      
      // Copy to organized directory
      const destPath = join(pkgDir, file);
      copyFileSync(filePath, destPath);
      
      // Also copy to cache
      const cachePath = join(CACHE_DIR, file);
      copyFileSync(filePath, cachePath);
      
      // Create metadata
      const metadata = {
        filename: file,
        name: info.name,
        version: info.version,
        type: info.type,
        size: stats.size,
        sha256: hash,
        downloadedAt: new Date().toISOString(),
        path: destPath
      };
      
      // Save metadata
      writeFileSync(
        join(pkgDir, `${file}.json`),
        JSON.stringify(metadata, null, 2)
      );
      
      processed.push(metadata);
      console.log(`  ✅ Processed successfully`);
      console.log(`  📁 Saved to: ${pkgDir}`);
      console.log(`  🔐 SHA256: ${hash.substring(0, 16)}...`);
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      errors.push({ file, error: error.message });
    }
    
    console.log();
  }
  
  // Generate processing report
  const report = {
    timestamp: new Date().toISOString(),
    totalFiles: files.length,
    processed: processed.length,
    errors: errors.length,
    packages: processed,
    errors: errors
  };
  
  const reportPath = join(ORGANIZED_DIR, 'processing-report.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Generate install script
  generateInstallScript(processed);
  
  // Summary
  console.log('📊 Processing Summary:');
  console.log(`  ✅ Successfully processed: ${processed.length}`);
  console.log(`  ❌ Errors: ${errors.length}`);
  console.log(`\n📁 Files organized in: ${ORGANIZED_DIR}`);
  console.log(`💾 Files cached in: ${CACHE_DIR}`);
  console.log(`📄 Report saved to: ${reportPath}`);
  
  if (processed.length > 0) {
    console.log('\n🚀 To install these packages:');
    console.log('  Windows: install-wheels.bat');
    console.log('  Linux/Mac: ./install-wheels.sh');
  }
}

// Generate install scripts
function generateInstallScript(packages) {
  // Group by package name (keep only latest version)
  const latestPackages = {};
  packages.forEach(pkg => {
    if (!latestPackages[pkg.name] || 
        pkg.version > latestPackages[pkg.name].version) {
      latestPackages[pkg.name] = pkg;
    }
  });
  
  // Windows batch script
  let batScript = `@echo off
REM Install downloaded Python packages
REM Generated by pywhl

echo Installing Python packages...
echo.

`;
  
  Object.values(latestPackages).forEach(pkg => {
    batScript += `echo Installing ${pkg.name} ${pkg.version}...\n`;
    batScript += `pip install --force-reinstall --no-index --find-links "${CACHE_DIR}" ${pkg.name}==${pkg.version}\n`;
    batScript += `if %errorlevel% neq 0 (\n`;
    batScript += `    echo Failed to install ${pkg.name}\n`;
    batScript += `) else (\n`;
    batScript += `    echo Successfully installed ${pkg.name}\n`;
    batScript += `)\n`;
    batScript += `echo.\n\n`;
  });
  
  batScript += `echo.
echo Installation complete!
pause`;
  
  writeFileSync('install-wheels.bat', batScript);
  
  // Linux/Mac shell script
  let shScript = `#!/bin/bash
# Install downloaded Python packages
# Generated by pywhl

echo "Installing Python packages..."
echo

`;
  
  Object.values(latestPackages).forEach(pkg => {
    shScript += `echo "Installing ${pkg.name} ${pkg.version}..."\n`;
    shScript += `pip install --force-reinstall --no-index --find-links "${CACHE_DIR}" ${pkg.name}==${pkg.version}\n`;
    shScript += `if [ $? -ne 0 ]; then\n`;
    shScript += `    echo "Failed to install ${pkg.name}"\n`;
    shScript += `else\n`;
    shScript += `    echo "Successfully installed ${pkg.name}"\n`;
    shScript += `fi\n`;
    shScript += `echo\n\n`;
  });
  
  shScript += `echo "Installation complete!"`;
  
  writeFileSync('install-wheels.sh', shScript);
  
  // Make shell script executable on Unix
  if (process.platform !== 'win32') {
    try {
      require('fs').chmodSync('install-wheels.sh', '755');
    } catch (e) {}
  }
}

// Run the processor
processDownloads().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});