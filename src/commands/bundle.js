import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { mkdir, stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { RepositoryManager } from '../core/repository/repository-manager.js';
import { WheelParser } from '../core/pypi/wheel-parser.js';
import { Downloader } from '../core/downloader.js';
import { DependencyResolver } from '../core/resolver/dependency-resolver.js';
import { RequirementsParser } from '../utils/requirements-parser.js';

export const bundleCommand = new Command('bundle')
  .description('Create offline installation bundle')
  .argument('<packages...>', 'Packages to bundle (or -r for requirements file)')
  .option('-r, --requirements <file>', 'Bundle packages from requirements file')
  .option('-o, --output <file>', 'Output bundle file', 'offline-bundle.zip')
  .option('-p, --python <version>', 'Python version', '3.9')
  .option('-t, --platform <platform>', 'Target platform (or "all" for all platforms)')
  .option('--include-deps', 'Include all dependencies', true)
  .option('--no-include-deps', 'Skip dependencies')
  .option('--include-installer', 'Include installation script', true)
  .option('--metadata', 'Include package metadata', true)
  .action(async (packages, options) => {
    try {
      const spinner = ora('Creating offline bundle...').start();
      
      // Parse packages
      let packageList = [];
      if (options.requirements) {
        spinner.text = 'Parsing requirements file...';
        const requirements = await RequirementsParser.parse(options.requirements);
        packageList = requirements.map(req => RequirementsParser.formatRequirement(req));
      } else {
        packageList = packages;
      }

      if (packageList.length === 0) {
        spinner.fail('No packages specified');
        return;
      }

      // Create temporary directory for bundle contents
      const tempDir = join(process.cwd(), `.pywhl-bundle-${Date.now()}`);
      await mkdir(tempDir, { recursive: true });
      const wheelsDir = join(tempDir, 'wheels');
      await mkdir(wheelsDir, { recursive: true });

      try {
        // Download packages
        spinner.text = 'Downloading packages...';
        const downloadedPackages = await downloadPackagesForBundle(
          packageList, 
          wheelsDir, 
          options
        );

        // Create metadata
        if (options.metadata) {
          spinner.text = 'Creating metadata...';
          await createBundleMetadata(tempDir, downloadedPackages, options);
        }

        // Create installation script
        if (options.includeInstaller) {
          spinner.text = 'Creating installation script...';
          await createBundleInstaller(tempDir, downloadedPackages);
        }

        // Create README
        await createBundleReadme(tempDir, packageList, options);

        // Create archive
        spinner.text = 'Creating archive...';
        await createArchive(tempDir, options.output);

        spinner.succeed(`Bundle created: ${chalk.green(options.output)}`);
        
        // Show bundle info
        const bundleStats = await stat(options.output);
        console.log(chalk.cyan('\nBundle Information:'));
        console.log(`  Size: ${formatBytes(bundleStats.size)}`);
        console.log(`  Packages: ${downloadedPackages.length}`);
        console.log(`  Platform: ${options.platform || WheelParser.getCurrentPlatform()}`);
        console.log(`  Python: ${options.python}`);

      } finally {
        // Cleanup temp directory
        await cleanup(tempDir);
      }

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });

async function downloadPackagesForBundle(packages, outputDir, options) {
  const repoManager = new RepositoryManager();
  const downloader = new Downloader();
  const downloaded = [];

  for (const packageSpec of packages) {
    try {
      // Parse package spec
      const match = packageSpec.match(/^([a-zA-Z0-9._-]+)(==(.+))?$/);
      if (!match) continue;
      
      const packageName = match[1];
      const version = match[3] || null;

      // Search across repositories
      const result = await repoManager.searchPackageAcrossRepos(packageName, version);
      const client = await repoManager.createClient(result.repository);
      
      // Get package info
      const packageInfo = result.packageInfo;
      const resolvedVersion = version || packageInfo.info.version;

      // Get wheels
      const releases = packageInfo.releases[resolvedVersion] || [];
      let wheels = releases.filter(r => r.filename.endsWith('.whl'));

      // Handle platform selection
      if (options.platform === 'all') {
        // Download all platform wheels
        for (const wheel of wheels) {
          const outputPath = join(outputDir, wheel.filename);
          await downloader.downloadWheel(wheel.url, outputPath, {
            filename: wheel.filename,
            silent: true
          });
          downloaded.push({
            name: packageName,
            version: resolvedVersion,
            filename: wheel.filename,
            platform: WheelParser.parseWheelFilename(wheel.filename).platformTag
          });
        }
      } else {
        // Download best matching wheel
        const targetPlatform = options.platform || WheelParser.getCurrentPlatform();
        const bestWheel = WheelParser.selectBestWheel(wheels, options.python, targetPlatform);
        
        if (bestWheel) {
          const outputPath = join(outputDir, bestWheel.filename);
          await downloader.downloadWheel(bestWheel.url, outputPath, {
            filename: bestWheel.filename,
            silent: true
          });
          downloaded.push({
            name: packageName,
            version: resolvedVersion,
            filename: bestWheel.filename,
            platform: targetPlatform
          });
        }
      }

      // Handle dependencies
      if (options.includeDeps) {
        const resolver = new DependencyResolver({ pypiClient: client });
        const resolved = await resolver.resolve(packageName, resolvedVersion);
        const deps = resolver.getFlatDependencies(resolved);
        deps.delete(packageName); // Remove root package

        for (const [depName, depInfo] of deps) {
          // Download dependency wheels - get all versions then select
          const depResult = await repoManager.searchPackageAcrossRepos(depName, null);
          const depVersion = depInfo.version || depResult.packageInfo.info.version;
          const depReleases = depResult.packageInfo.releases[depVersion] || [];
          const depWheels = depReleases.filter(r => r.filename.endsWith('.whl'));
          
          if (options.platform === 'all') {
            for (const wheel of depWheels) {
              const outputPath = join(outputDir, wheel.filename);
              await downloader.downloadWheel(wheel.url, outputPath, {
                filename: wheel.filename,
                silent: true
              });
            }
          } else {
            const depBestWheel = WheelParser.selectBestWheel(
              depWheels, 
              options.python, 
              options.platform || WheelParser.getCurrentPlatform()
            );
            if (depBestWheel) {
              const outputPath = join(outputDir, depBestWheel.filename);
              await downloader.downloadWheel(depBestWheel.url, outputPath, {
                filename: depBestWheel.filename,
                silent: true
              });
            }
          }
        }
      }

    } catch (error) {
      console.warn(chalk.yellow(`Failed to bundle ${packageSpec}: ${error.message}`));
    }
  }

  return downloaded;
}

async function createBundleMetadata(bundleDir, packages, options) {
  const metadata = {
    created: new Date().toISOString(),
    python_version: options.python,
    platform: options.platform || WheelParser.getCurrentPlatform(),
    packages: packages.map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      filename: pkg.filename,
      platform: pkg.platform
    })),
    total_packages: packages.length
  };

  await writeFile(
    join(bundleDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2),
    'utf8'
  );
}

async function createBundleInstaller(bundleDir) {
  const script = `#!/bin/bash
# Offline Bundle Installer
# Generated by pywhl

set -e

echo "Installing offline bundle..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

# Install all wheels
cd "$(dirname "$0")/wheels"
for wheel in *.whl; do
    if [ -f "$wheel" ]; then
        echo "Installing $wheel..."
        python3 -m pip install --no-index --find-links . "$wheel"
    fi
done

echo "✓ Installation complete!"
`;

  const batScript = `@echo off
REM Offline Bundle Installer
REM Generated by pywhl

echo Installing offline bundle...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed
    exit /b 1
)

REM Install all wheels
cd /d "%~dp0wheels"
for %%f in (*.whl) do (
    echo Installing %%f...
    python -m pip install --no-index --find-links . "%%f"
)

echo Installation complete!
pause
`;

  await writeFile(join(bundleDir, 'install.sh'), script, { mode: 0o755 });
  await writeFile(join(bundleDir, 'install.bat'), batScript);
}

async function createBundleReadme(bundleDir, packages, options) {
  const readme = `# Offline Installation Bundle

Created by pywhl on ${new Date().toLocaleString()}

## Contents

This bundle contains the following packages:
${packages.map(p => `- ${p}`).join('\n')}

## Installation

### Unix/Linux/macOS:
\`\`\`bash
./install.sh
\`\`\`

### Windows:
\`\`\`
install.bat
\`\`\`

### Manual Installation:
\`\`\`bash
cd wheels
pip install --no-index --find-links . *.whl
\`\`\`

## Requirements

- Python ${options.python}
- Platform: ${options.platform || WheelParser.getCurrentPlatform()}

## Notes

This bundle includes all necessary wheels for offline installation.
No internet connection is required.
`;

  await writeFile(join(bundleDir, 'README.md'), readme, 'utf8');
}

async function createArchive(sourceDir, outputFile) {
  const archive = archiver('zip', {
    zlib: { level: 9 } // Maximum compression
  });

  const output = createWriteStream(outputFile);
  archive.pipe(output);

  archive.directory(sourceDir, false);
  await archive.finalize();

  return new Promise((resolve, reject) => {
    output.on('close', resolve);
    archive.on('error', reject);
  });
}

async function cleanup(dir) {
  try {
    const { rm } = await import('fs/promises');
    await rm(dir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}