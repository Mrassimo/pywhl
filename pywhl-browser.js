#!/usr/bin/env node

// Pywhl Browser Mode - Generates URLs for manual browser download
// Perfect for corporate environments where only browsers can authenticate through proxies

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';

const PYPI_URL = 'https://pypi.org';
const OUTPUT_DIR = join(process.cwd(), 'pywhl-downloads');

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

// Common Python versions and platforms
const PYTHON_VERSIONS = ['cp39', 'cp310', 'cp311', 'cp312'];
const PLATFORMS = [
  'win_amd64',
  'win32',
  'macosx_10_9_x86_64',
  'macosx_11_0_arm64',
  'manylinux_2_17_x86_64',
  'manylinux2014_x86_64',
  'linux_x86_64'
];

function generateWheelUrls(packageName, version) {
  const urls = [];
  const safeName = packageName.replace('-', '_');
  
  // Pure Python wheel (most common)
  urls.push({
    url: `${PYPI_URL}/packages/py3/${packageName[0]}/${packageName}/${safeName}-${version}-py3-none-any.whl`,
    type: 'universal',
    filename: `${safeName}-${version}-py3-none-any.whl`
  });
  
  // Also try py2.py3
  urls.push({
    url: `${PYPI_URL}/packages/py2.py3/${packageName[0]}/${packageName}/${safeName}-${version}-py2.py3-none-any.whl`,
    type: 'universal',
    filename: `${safeName}-${version}-py2.py3-none-any.whl`
  });
  
  // Platform-specific wheels
  PYTHON_VERSIONS.forEach(pyVer => {
    PLATFORMS.forEach(platform => {
      urls.push({
        url: `${PYPI_URL}/packages/${pyVer}/${packageName[0]}/${packageName}/${safeName}-${version}-${pyVer}-${pyVer}-${platform}.whl`,
        type: `${pyVer}-${platform}`,
        filename: `${safeName}-${version}-${pyVer}-${pyVer}-${platform}.whl`
      });
    });
  });
  
  // Source distribution
  urls.push({
    url: `${PYPI_URL}/packages/source/${packageName[0]}/${packageName}/${packageName}-${version}.tar.gz`,
    type: 'source',
    filename: `${packageName}-${version}.tar.gz`
  });
  
  return urls;
}

function generatePackagePageUrl(packageName, version) {
  return `${PYPI_URL}/project/${packageName}/${version}/#files`;
}

function createHtmlDownloadHelper(packages) {
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Pywhl Download Helper</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; }
    .package {
      background: white;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .package h2 { 
      color: #0066cc;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    .pypi-link {
      display: inline-block;
      margin: 10px 0;
      padding: 10px 20px;
      background: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 5px;
    }
    .pypi-link:hover {
      background: #0052a3;
    }
    .wheel-links {
      margin: 20px 0;
    }
    .wheel-link {
      display: block;
      margin: 5px 0;
      padding: 8px 12px;
      background: #f0f0f0;
      border-left: 4px solid #ccc;
      font-family: monospace;
      font-size: 12px;
      word-break: break-all;
    }
    .universal { border-left-color: #28a745; }
    .platform { border-left-color: #ffc107; }
    .source { border-left-color: #dc3545; }
    .instructions {
      background: #e8f4f8;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .copy-btn {
      margin-left: 10px;
      padding: 2px 8px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }
    .copy-btn:hover {
      background: #0052a3;
    }
    .legend {
      display: flex;
      gap: 20px;
      margin: 20px 0;
      flex-wrap: wrap;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .legend-color {
      width: 20px;
      height: 20px;
      border-radius: 3px;
    }
  </style>
  <script>
    function copyUrl(url) {
      navigator.clipboard.writeText(url).then(() => {
        alert('URL copied to clipboard!');
      });
    }
  </script>
</head>
<body>
  <h1>🎯 Pywhl Download Helper</h1>
  
  <div class="instructions">
    <h3>📋 Instructions:</h3>
    <ol>
      <li><strong>Recommended:</strong> Click the "View on PyPI" button for each package</li>
      <li>On the PyPI page, scroll down to "Download files" section</li>
      <li>Download the appropriate wheel for your system (or the .tar.gz source)</li>
      <li>Save all files to the <code>${OUTPUT_DIR}</code> folder</li>
      <li>After downloading all files, run: <code>node process-downloads.js</code></li>
    </ol>
    
    <h3>🎨 Color Legend:</h3>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color" style="background: #28a745;"></div>
        <span><strong>Green:</strong> Universal wheels (work on any platform)</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #ffc107;"></div>
        <span><strong>Yellow:</strong> Platform-specific wheels</span>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #dc3545;"></div>
        <span><strong>Red:</strong> Source distribution (requires compilation)</span>
      </div>
    </div>
  </div>
`;

  packages.forEach(pkg => {
    html += `
  <div class="package">
    <h2>📦 ${pkg.name} ${pkg.version || 'latest'}</h2>
    
    <a href="${pkg.pypiUrl}" target="_blank" class="pypi-link">
      View on PyPI (Recommended) →
    </a>
    
    <div class="wheel-links">
      <h4>Alternative: Direct URLs (if PyPI page doesn't work)</h4>
      <p><em>Note: These are estimated URLs. The PyPI page above is more reliable.</em></p>
`;
    
    pkg.urls.forEach(({url, type, filename}) => {
      const colorClass = type === 'universal' ? 'universal' : 
                        type === 'source' ? 'source' : 'platform';
      html += `
      <div class="wheel-link ${colorClass}">
        <a href="${url}" target="_blank">${filename}</a>
        <button class="copy-btn" onclick="copyUrl('${url}')">Copy URL</button>
        <span style="float: right; color: #666;">[${type}]</span>
      </div>`;
    });
    
    html += `
    </div>
  </div>`;
  });
  
  html += `
  <div class="instructions" style="margin-top: 40px;">
    <h3>💡 Platform Guide:</h3>
    <ul>
      <li><strong>Windows 64-bit:</strong> Look for <code>win_amd64</code> or <code>win64</code></li>
      <li><strong>Windows 32-bit:</strong> Look for <code>win32</code></li>
      <li><strong>macOS Intel:</strong> Look for <code>macosx_*_x86_64</code></li>
      <li><strong>macOS Apple Silicon:</strong> Look for <code>macosx_*_arm64</code></li>
      <li><strong>Linux:</strong> Look for <code>manylinux</code> or <code>linux_x86_64</code></li>
      <li><strong>Any platform:</strong> <code>py3-none-any</code> or <code>py2.py3-none-any</code></li>
    </ul>
  </div>
</body>
</html>`;
  
  return html;
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log(`
🌐 Pywhl Browser Mode - Generate URLs for manual download

Usage:
  node pywhl-browser.js <package>              # Single package
  node pywhl-browser.js <package>==<version>   # Specific version
  node pywhl-browser.js -r requirements.txt    # From requirements file
  
Examples:
  node pywhl-browser.js numpy
  node pywhl-browser.js pandas==2.0.0
  node pywhl-browser.js requests flask django
  
This will generate:
  - download-helper.html with clickable links
  - download-urls.json with all URLs
  
After downloading files manually, run:
  node process-downloads.js
`);
  process.exit(0);
}

// Process packages
let packages = [];

if (args[0] === '-r' && args[1]) {
  // Read from requirements file
  const reqFile = args[1];
  if (!existsSync(reqFile)) {
    console.error(`❌ Requirements file not found: ${reqFile}`);
    process.exit(1);
  }
  
  const content = readFileSync(reqFile, 'utf8');
  const lines = content.split('\n').filter(line => 
    line.trim() && !line.startsWith('#')
  );
  
  lines.forEach(line => {
    const match = line.match(/^([a-zA-Z0-9_-]+)\s*(?:==|>=|<=|>|<)?\s*([0-9.]*)/);
    if (match) {
      packages.push({
        name: match[1],
        version: match[2] || 'latest'
      });
    }
  });
} else {
  // Process command line packages
  args.forEach(arg => {
    const match = arg.match(/^([a-zA-Z0-9_-]+)(?:==([0-9.]+))?$/);
    if (match) {
      packages.push({
        name: match[1],
        version: match[2] || 'latest'
      });
    }
  });
}

if (packages.length === 0) {
  console.error('❌ No valid packages found');
  process.exit(1);
}

console.log(`📦 Generating download URLs for ${packages.length} package(s)...\n`);

// Generate URLs for each package
const packagesWithUrls = packages.map(pkg => {
  console.log(`📍 ${pkg.name} ${pkg.version}`);
  
  const urls = pkg.version !== 'latest' 
    ? generateWheelUrls(pkg.name, pkg.version)
    : [];
  
  const pypiUrl = pkg.version !== 'latest'
    ? generatePackagePageUrl(pkg.name, pkg.version)
    : `${PYPI_URL}/project/${pkg.name}/`;
  
  return {
    ...pkg,
    urls,
    pypiUrl
  };
});

// Save URLs as JSON
const urlsJson = {
  generated: new Date().toISOString(),
  outputDir: OUTPUT_DIR,
  packages: packagesWithUrls
};

writeFileSync(
  join(OUTPUT_DIR, 'download-urls.json'),
  JSON.stringify(urlsJson, null, 2)
);

// Create HTML helper
const html = createHtmlDownloadHelper(packagesWithUrls);
const htmlPath = join(OUTPUT_DIR, 'download-helper.html');
writeFileSync(htmlPath, html);

console.log(`
✅ URLs generated successfully!

📁 Output directory: ${OUTPUT_DIR}

📄 Files created:
   - download-helper.html  (Open this in your browser)
   - download-urls.json    (URL list for reference)

🌐 Next steps:
   1. Open: ${htmlPath}
   2. Click "View on PyPI" for each package
   3. Download the appropriate wheel for your platform
   4. Save all files to: ${OUTPUT_DIR}
   5. Run: node process-downloads.js

💡 Tip: If direct URLs don't work, use the PyPI page to find the correct download link.
`);