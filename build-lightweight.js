#!/usr/bin/env node

// Build script to create a truly standalone pywhl executable

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Building standalone pywhl executable...');

// Read all the lightweight library files
const libs = {
  'http-client': readFileSync(join(__dirname, 'lightweight/libs/http-client.js'), 'utf8'),
  'terminal': readFileSync(join(__dirname, 'lightweight/libs/terminal.js'), 'utf8'),
  'semver': readFileSync(join(__dirname, 'lightweight/libs/semver.js'), 'utf8'),
  'simple-yaml': readFileSync(join(__dirname, 'lightweight/libs/simple-yaml.js'), 'utf8'),
  'config-store': readFileSync(join(__dirname, 'lightweight/libs/config-store.js'), 'utf8'),
  'cli-framework': readFileSync(join(__dirname, 'lightweight/libs/cli-framework.js'), 'utf8')
};

// Read the main file
const mainFile = readFileSync(join(__dirname, 'pywhl-lightweight.js'), 'utf8');

// Create the bundled version
let bundled = `#!/usr/bin/env node

// Pywhl Standalone - Single-file Python wheel downloader
// This version includes all dependencies bundled inline
// No npm install required!

`;

// Add each library module inline
Object.entries(libs).forEach(([name, content]) => {
  // Remove import/export statements and wrap in a module pattern
  const moduleContent = content
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export\s+default\s+/gm, 'const __default__ = ')
    .replace(/^export\s+/gm, 'const ')
    .replace(/export\s*{\s*([^}]+)\s*};?\s*$/gm, '');
  
  bundled += `// === ${name}.js ===\n`;
  bundled += `const ${name.replace(/-/g, '_')}Module = (() => {\n`;
  bundled += moduleContent;
  bundled += `\n  return { ${getExports(content)} };\n})();\n\n`;
});

// Extract exports from module content
function getExports(content) {
  const exports = [];
  
  // Find named exports
  const namedExports = content.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/g) || [];
  namedExports.forEach(exp => {
    const match = exp.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/);
    if (match) exports.push(match[1]);
  });
  
  // Find default export
  if (content.includes('export default')) {
    exports.push('default: __default__');
  }
  
  return exports.join(', ');
}

// Replace imports in main file with references to bundled modules
let mainContent = mainFile
  .replace(/^#!.*\n/, '') // Remove shebang, we'll add it back
  .replace(/import\s+{\s*([^}]+)\s*}\s+from\s+['"]\.\/lightweight\/libs\/http-client\.js['"];?/g, 
    'const { $1 } = http_clientModule;')
  .replace(/import\s+{\s*([^}]+)\s*}\s+from\s+['"]\.\/lightweight\/libs\/terminal\.js['"];?/g, 
    'const { $1 } = terminalModule;')
  .replace(/import\s+(\w+)\s+from\s+['"]\.\/lightweight\/libs\/semver\.js['"];?/g, 
    'const $1 = semverModule.default || semverModule;')
  .replace(/import\s+(\w+)\s+from\s+['"]\.\/lightweight\/libs\/simple-yaml\.js['"];?/g, 
    'const $1 = simple_yamlModule.default || simple_yamlModule;')
  .replace(/import\s+(\w+)\s+from\s+['"]\.\/lightweight\/libs\/config-store\.js['"];?/g, 
    'const $1 = config_storeModule.default || config_storeModule;')
  .replace(/import\s+{\s*([^}]+)\s*}\s+from\s+['"]\.\/lightweight\/libs\/cli-framework\.js['"];?/g, 
    'const { $1 } = cli_frameworkModule;');

// Add the main content
bundled += '// === Main Application ===\n';
bundled += mainContent;

// Write the bundled file
const outputPath = join(__dirname, 'pywhl-standalone.js');
writeFileSync(outputPath, bundled);

// Make it executable
import { chmodSync } from 'fs';
chmodSync(outputPath, '755');

console.log(`✓ Built standalone executable: ${outputPath}`);
console.log('\nYou can now run it directly without any npm dependencies:');
console.log('  ./pywhl-standalone.js --help');