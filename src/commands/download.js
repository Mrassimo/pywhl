import { Command } from 'commander';
import chalk from 'chalk';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { PyPIClient } from '../core/pypi/client.js';
import { WheelParser } from '../core/pypi/wheel-parser.js';
import { Downloader } from '../core/downloader.js';
import { DependencyResolver } from '../core/resolver/dependency-resolver.js';
import { AdvancedDependencyResolver } from '../core/resolver/advanced-resolver.js';
import { CacheManager } from '../core/cache/manager.js';
import { RequirementsParser } from '../utils/requirements-parser.js';
import { RepositoryManager } from '../core/repository/repository-manager.js';

export const downloadCommand = new Command('download')
  .description('Download Python wheels from PyPI')
  .argument('[package]', 'Package name (optionally with version, e.g., numpy==1.24.0)')
  .option('-r, --requirements <file>', 'Install from requirements file')
  .option('-p, --python <version>', 'Python version', '3.9')
  .option('-t, --platform <platform>', 'Target platform')
  .option('-d, --deps', 'Download dependencies', false)
  .option('-o, --output <dir>', 'Output directory', './wheels')
  .option('--no-cache', 'Skip cache', false)
  .option('--parallel <n>', 'Number of parallel downloads', parseInt, 3)
  .option('--use-advanced-resolver', 'Use advanced dependency resolver', false)
  .action(async (packageSpec, options) => {
    try {
      // Handle requirements file
      if (options.requirements) {
        await downloadFromRequirements(options.requirements, options);
        return;
      }

      // Validate package argument
      if (!packageSpec) {
        throw new Error('Please specify a package name or use -r for requirements file');
      }

      // Parse package specification
      const match = packageSpec.match(/^([a-zA-Z0-9._-]+)(==(.+))?$/);
      if (!match) {
        throw new Error('Invalid package specification. Use: package or package==version');
      }

      const packageName = match[1];
      const version = match[3] || null;

      // Initialize components
      const pypiClient = new PyPIClient();
      const downloader = new Downloader();
      const cacheManager = new CacheManager();
      
      await cacheManager.init();
      await mkdir(options.output, { recursive: true });

      console.log(chalk.blue(`\nDownloading ${chalk.bold(packageName)}${version ? `==${version}` : ''}\n`));

      // Get package info
      const packageInfo = await pypiClient.getPackageInfo(packageName, version);
      const resolvedVersion = version || packageInfo.info.version;

      // Get wheels for this version
      const releases = packageInfo.releases[resolvedVersion] || [];
      const wheels = releases.filter(r => r.filename.endsWith('.whl'));

      if (wheels.length === 0) {
        throw new Error(`No wheels found for ${packageName}==${resolvedVersion}`);
      }

      // Select best wheel
      const targetPlatform = options.platform || WheelParser.getCurrentPlatform();
      const bestWheel = WheelParser.selectBestWheel(wheels, options.python, targetPlatform);

      if (!bestWheel) {
        throw new Error(`No compatible wheel found for Python ${options.python} on ${targetPlatform}`);
      }

      // Prepare downloads
      const downloads = [];
      
      // Check cache first
      const cached = options.cache !== false && 
        await cacheManager.exists(packageName, resolvedVersion, bestWheel.filename);
      
      if (cached) {
        console.log(chalk.green(`✓ ${bestWheel.filename} (cached)`));
      } else {
        downloads.push({
          url: bestWheel.url,
          filename: bestWheel.filename,
          outputPath: join(options.output, bestWheel.filename)
        });
      }

      // Handle dependencies if requested
      if (options.deps) {
        console.log(chalk.blue('\nResolving dependencies...\n'));
        
        const resolver = new DependencyResolver({ pypiClient });
        const resolved = await resolver.resolve(packageName, resolvedVersion);
        
        // Show dependency tree
        const tree = resolver.getDependencyTree(resolved);
        tree.forEach(line => console.log(line));
        console.log();

        // Get flat list of dependencies
        const deps = resolver.getFlatDependencies(resolved);
        deps.delete(packageName); // Remove root package

        // Process each dependency
        for (const [depName, depInfo] of deps) {
          try {
            // Try to get the specific version, fallback to latest if not found
            let depPackageInfo;
            let depVersion = depInfo.version;
            
            try {
              depPackageInfo = await pypiClient.getPackageInfo(depName, depVersion);
            } catch (error) {
              // If specific version not found, get latest
              console.warn(chalk.yellow(`Version ${depVersion} not found for ${depName}, using latest`));
              depPackageInfo = await pypiClient.getPackageInfo(depName);
              depVersion = depPackageInfo.info.version;
            }
            
            const depWheels = (depPackageInfo.releases[depVersion] || [])
              .filter(r => r.filename.endsWith('.whl'));
          
          if (depWheels.length > 0) {
            const depBestWheel = WheelParser.selectBestWheel(depWheels, options.python, targetPlatform);
            if (depBestWheel) {
              const depCached = options.cache !== false && 
                await cacheManager.exists(depName, depVersion, depBestWheel.filename);
              
              if (depCached) {
                console.log(chalk.green(`✓ ${depBestWheel.filename} (cached)`));
              } else {
                downloads.push({
                  url: depBestWheel.url,
                  filename: depBestWheel.filename,
                  outputPath: join(options.output, depBestWheel.filename)
                });
              }
            }
          }
          } catch (error) {
            console.warn(chalk.yellow(`Warning: Failed to process ${depName}: ${error.message}`));
          }
        }
      }

      // Download all wheels
      if (downloads.length > 0) {
        const { results, errors } = await downloader.downloadMultiple(downloads);
        
        if (errors.length > 0) {
          console.log(chalk.red('\nErrors:'));
          errors.forEach(err => {
            console.log(chalk.red(`  ✗ ${err.filename}: ${err.error}`));
          });
        }

        console.log(chalk.green(`\n✓ Downloaded ${results.length} wheel(s) to ${options.output}`));
      } else {
        console.log(chalk.green(`\n✓ All wheels already cached`));
      }

    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });

async function downloadFromRequirements(filePath, options) {
  console.log(chalk.blue(`\nParsing requirements from ${filePath}...\n`));
  
  const requirements = await RequirementsParser.parse(filePath);
  
  if (requirements.length === 0) {
    console.log(chalk.yellow('No requirements found in file'));
    return;
  }

  console.log(chalk.cyan(`Found ${requirements.length} requirement(s):\n`));
  requirements.forEach(req => {
    console.log(`  - ${RequirementsParser.formatRequirement(req)}`);
  });
  console.log();

  // Download each requirement
  for (const req of requirements) {
    try {
      console.log(chalk.blue(`\nDownloading ${req.name}...\n`));
      
      const packageSpec = RequirementsParser.formatRequirement(req);
      const downloadOptions = { ...options };
      delete downloadOptions.requirements; // Remove requirements option
      
      // Call download for each package
      await downloadPackage(packageSpec, downloadOptions);
      
    } catch (error) {
      console.error(chalk.red(`Failed to download ${req.name}: ${error.message}`));
    }
  }
  
  console.log(chalk.green(`\n✓ Completed processing requirements file`));
}

async function downloadPackage(packageSpec, options) {
  // Parse package specification
  const match = packageSpec.match(/^([a-zA-Z0-9._-]+)(==(.+))?$/);
  if (!match) {
    throw new Error('Invalid package specification');
  }

  const packageName = match[1];
  const version = match[3] || null;

  // Initialize components
  const pypiClient = new PyPIClient();
  const downloader = new Downloader();
  const cacheManager = new CacheManager();
  
  await cacheManager.init();
  await mkdir(options.output, { recursive: true });

  // Get package info
  const packageInfo = await pypiClient.getPackageInfo(packageName, version);
  const resolvedVersion = version || packageInfo.info.version;

  // Get wheels for this version
  const releases = packageInfo.releases[resolvedVersion] || [];
  const wheels = releases.filter(r => r.filename.endsWith('.whl'));

  if (wheels.length === 0) {
    throw new Error(`No wheels found for ${packageName}==${resolvedVersion}`);
  }

  // Select best wheel
  const targetPlatform = options.platform || WheelParser.getCurrentPlatform();
  const bestWheel = WheelParser.selectBestWheel(wheels, options.python, targetPlatform);

  if (!bestWheel) {
    throw new Error(`No compatible wheel found for Python ${options.python} on ${targetPlatform}`);
  }

  // Download the wheel
  const cached = options.cache !== false && 
    await cacheManager.exists(packageName, resolvedVersion, bestWheel.filename);
  
  if (cached) {
    console.log(chalk.green(`✓ ${bestWheel.filename} (cached)`));
  } else {
    await downloader.downloadWheel(
      bestWheel.url,
      join(options.output, bestWheel.filename),
      { filename: bestWheel.filename }
    );
  }
}