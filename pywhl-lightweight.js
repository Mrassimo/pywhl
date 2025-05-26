#!/usr/bin/env node

// Pywhl Lightweight - Self-contained Python wheel downloader
// This version works without npm dependencies

import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream } from 'fs';
import { homedir } from 'os';
import { join, basename, dirname } from 'path';
import { get, downloadFile } from './lightweight/libs/http-client.js';
import { chalk, ora, Table, ProgressBar } from './lightweight/libs/terminal.js';
import semver from './lightweight/libs/semver.js';
import yaml from './lightweight/libs/simple-yaml.js';
import ConfigStore from './lightweight/libs/config-store.js';
import { Command } from './lightweight/libs/cli-framework.js';

// Constants
const PYPI_API_URL = 'https://pypi.org/pypi';
const CACHE_DIR = join(homedir(), '.pywhl', 'cache');
const CONFIG_DIR = join(homedir(), '.pywhl');

// Ensure directories exist
mkdirSync(CACHE_DIR, { recursive: true });
mkdirSync(CONFIG_DIR, { recursive: true });

// Configuration
const config = new ConfigStore({
  projectName: 'pywhl',
  configName: 'config',
  defaults: {
    pythonVersion: '3.9',
    platform: process.platform === 'darwin' ? 'macosx' : process.platform,
    architecture: process.arch === 'x64' ? 'x86_64' : process.arch
  }
});

// PyPI Client
class PyPIClient {
  async getPackageInfo(packageName) {
    const url = `${PYPI_API_URL}/${packageName}/json`;
    try {
      const response = await get(url);
      return response.json();
    } catch (error) {
      throw new Error(`Failed to fetch package info: ${error.message}`);
    }
  }
  
  async searchPackages(query) {
    // PyPI XML-RPC search is deprecated, so we'll just check if package exists
    try {
      await this.getPackageInfo(query);
      return [{ name: query, summary: 'Package found' }];
    } catch {
      return [];
    }
  }
}

// Wheel selector
function selectBestWheel(releases, pythonVersion, platform, arch) {
  const wheels = [];
  
  // Collect all wheel files
  Object.entries(releases).forEach(([version, files]) => {
    files.forEach(file => {
      if (file.filename.endsWith('.whl')) {
        wheels.push({ ...file, version });
      }
    });
  });
  
  if (wheels.length === 0) {
    throw new Error('No wheel files found');
  }
  
  // Sort by version (newest first)
  wheels.sort((a, b) => semver.compare(b.version, a.version));
  
  // Find compatible wheel
  const pyVersionTag = `cp${pythonVersion.replace('.', '')}`;
  const compatibleWheels = wheels.filter(wheel => {
    const filename = wheel.filename.toLowerCase();
    
    // Check for universal wheel
    if (filename.includes('py2.py3-none-any')) return true;
    if (filename.includes('py3-none-any')) return true;
    
    // Check for specific Python version
    if (!filename.includes(pyVersionTag)) return false;
    
    // Check platform
    if (platform === 'linux' && !filename.includes('linux')) return false;
    if (platform === 'darwin' && !filename.includes('macosx')) return false;
    if (platform === 'win32' && !filename.includes('win')) return false;
    
    return true;
  });
  
  return compatibleWheels[0] || wheels[0];
}

// Dependency resolver
async function resolveDependencies(packageName, pythonVersion, platform, arch, resolved = new Set()) {
  if (resolved.has(packageName)) return [];
  resolved.add(packageName);
  
  const client = new PyPIClient();
  const dependencies = [];
  
  try {
    const packageInfo = await client.getPackageInfo(packageName);
    const wheel = selectBestWheel(packageInfo.releases, pythonVersion, platform, arch);
    
    dependencies.push({
      name: packageName,
      version: wheel.version,
      url: wheel.url,
      filename: wheel.filename
    });
    
    // Parse requires_dist for dependencies
    if (packageInfo.info.requires_dist) {
      for (const dep of packageInfo.info.requires_dist) {
        // Simple parsing - just get the package name
        const match = dep.match(/^([a-zA-Z0-9_-]+)/);
        if (match) {
          const depName = match[1];
          const subDeps = await resolveDependencies(depName, pythonVersion, platform, arch, resolved);
          dependencies.push(...subDeps);
        }
      }
    }
  } catch (error) {
    console.error(chalk.yellow(`Warning: Could not resolve ${packageName}: ${error.message}`));
  }
  
  return dependencies;
}

// Download function
async function downloadWheel(url, filename, outputDir) {
  const filepath = join(outputDir, filename);
  
  if (existsSync(filepath)) {
    console.log(chalk.dim(`Skipping ${filename} (already exists)`));
    return filepath;
  }
  
  const spinner = ora(`Downloading ${filename}`).start();
  
  try {
    const writeStream = createWriteStream(filepath);
    await downloadFile(url, writeStream);
    spinner.succeed(`Downloaded ${filename}`);
    return filepath;
  } catch (error) {
    spinner.fail(`Failed to download ${filename}: ${error.message}`);
    throw error;
  }
}

// Commands
const program = new Command('pywhl');
program.version('0.1.0-lightweight');
program.description('Lightweight Python wheel downloader for restricted environments');

// Search command
program
  .command('search <query>')
  .description('Search for Python packages')
  .action(async (query) => {
    const spinner = ora('Searching PyPI...').start();
    const client = new PyPIClient();
    
    try {
      const results = await client.searchPackages(query);
      spinner.stop();
      
      if (results.length === 0) {
        console.log(chalk.yellow('No packages found'));
        return;
      }
      
      const table = new Table({ head: ['Package', 'Description'] });
      results.forEach(pkg => {
        table.push([pkg.name, pkg.summary || '']);
      });
      
      console.log(table.toString());
    } catch (error) {
      spinner.fail(`Search failed: ${error.message}`);
    }
  });

// Info command
program
  .command('info <package>')
  .description('Show package information')
  .action(async (packageName) => {
    const spinner = ora('Fetching package info...').start();
    const client = new PyPIClient();
    
    try {
      const info = await client.getPackageInfo(packageName);
      spinner.stop();
      
      console.log(chalk.bold(`\n${info.info.name} ${info.info.version}`));
      console.log(chalk.dim(info.info.summary || 'No description'));
      console.log(`\nAuthor: ${info.info.author || 'Unknown'}`);
      console.log(`License: ${info.info.license || 'Unknown'}`);
      console.log(`Home: ${info.info.home_page || 'N/A'}`);
      
      // Show available versions
      const versions = Object.keys(info.releases).reverse().slice(0, 10);
      console.log(`\nRecent versions: ${versions.join(', ')}`);
      
    } catch (error) {
      spinner.fail(`Failed to fetch info: ${error.message}`);
    }
  });

// Download command
program
  .command('download <package>')
  .description('Download a package and its dependencies')
  .option('-d, --dest <dir>', 'destination directory', './wheels')
  .option('-p, --python <version>', 'Python version', config.get('pythonVersion'))
  .option('--no-deps', 'skip dependencies')
  .action(async (packageName, options) => {
    const outputDir = options.dest;
    mkdirSync(outputDir, { recursive: true });
    
    console.log(chalk.bold(`Downloading ${packageName}...`));
    
    try {
      const pythonVersion = options.python;
      const platform = config.get('platform');
      const arch = config.get('architecture');
      
      // Resolve dependencies
      const packages = options.noDeps 
        ? [{ name: packageName }]
        : await resolveDependencies(packageName, pythonVersion, platform, arch);
      
      console.log(chalk.dim(`Found ${packages.length} package(s) to download`));
      
      // Download all packages
      const downloads = [];
      for (const pkg of packages) {
        if (pkg.url && pkg.filename) {
          downloads.push(downloadWheel(pkg.url, pkg.filename, outputDir));
        }
      }
      
      await Promise.all(downloads);
      
      console.log(chalk.green(`\n✓ Downloaded ${downloads.length} package(s) to ${outputDir}`));
      
    } catch (error) {
      console.error(chalk.red(`Download failed: ${error.message}`));
      process.exit(1);
    }
  });

// Config command
program
  .command('config <action> [key] [value]')
  .description('Manage configuration')
  .action((action, key, value) => {
    switch (action) {
      case 'get':
        if (key) {
          console.log(config.get(key));
        } else {
          console.log(JSON.stringify(config.all, null, 2));
        }
        break;
        
      case 'set':
        if (!key || !value) {
          console.error('Please provide key and value');
          process.exit(1);
        }
        config.set(key, value);
        console.log(chalk.green(`✓ Set ${key} = ${value}`));
        break;
        
      case 'list':
        console.log(JSON.stringify(config.all, null, 2));
        break;
        
      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
  });

// Cache command
program
  .command('cache <action>')
  .description('Manage local cache')
  .action((action) => {
    switch (action) {
      case 'dir':
        console.log(CACHE_DIR);
        break;
        
      case 'clear':
        // Simple implementation - just inform user
        console.log(`To clear cache, delete: ${CACHE_DIR}`);
        break;
        
      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
  });

// Parse arguments
try {
  program.parse(process.argv);
  
  // Show help if no arguments
  if (process.argv.length === 2) {
    program.outputHelp();
  }
} catch (error) {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
}