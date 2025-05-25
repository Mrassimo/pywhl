import { Command } from 'commander';
import chalk from 'chalk';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { PyPIClient } from '../core/pypi/client.js';
import { WheelParser } from '../core/pypi/wheel-parser.js';
import { Downloader } from '../core/downloader.js';
import { DependencyResolver } from '../core/resolver/dependency-resolver.js';
import { CacheManager } from '../core/cache/manager.js';
import { RequirementsParser } from '../utils/requirements-parser.js';
import { AuditLogger } from '../core/audit/audit-logger.js';
import { PolicyManager } from '../core/admin/policy-manager.js';
import { SecurityScanner } from '../core/security/security-scanner.js';
import { LicenseChecker } from '../core/compliance/license-checker.js';
import { PythonDetector } from '../utils/python-detector.js';

export const downloadCommand = new Command('download')
  .description('Download Python wheels from PyPI')
  .argument('[package]', 'Package name (optionally with version, e.g., numpy==1.24.0)')
  .option('-r, --requirements <file>', 'Install from requirements file')
  .option('-p, --python <version>', 'Python version (auto-detected if not specified)')
  .option('-t, --platform <platform>', 'Target platform')
  .option('-d, --deps', 'Download dependencies', false)
  .option('-o, --output <dir>', 'Output directory', './wheels')
  .option('--no-cache', 'Skip cache', false)
  .option('--parallel <n>', 'Number of parallel downloads', parseInt, 3)
  .option('--use-advanced-resolver', 'Use advanced dependency resolver', false)
  .option('--skip-security-scan', 'Skip security vulnerability scanning', false)
  .option('--skip-license-check', 'Skip license compliance checking', false)
  .option('--force', 'Force download even with policy violations', false)
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
      const auditLogger = new AuditLogger();
      const policyManager = new PolicyManager();
      const securityScanner = new SecurityScanner();
      const licenseChecker = new LicenseChecker();
      
      await cacheManager.init();
      await mkdir(options.output, { recursive: true });

      // Auto-detect Python version if not specified
      if (!options.python) {
        options.python = PythonDetector.detectPythonVersion();
        console.log(chalk.cyan(`🔍 Auto-detected Python version: ${options.python}\n`));
      }

      console.log(chalk.blue(`\nDownloading ${chalk.bold(packageName)}${version ? `==${version}` : ''}\n`));

      // Get package info
      const packageInfo = await pypiClient.getPackageInfo(packageName, version);
      const resolvedVersion = version || packageInfo.info.version;

      // Enterprise Policy Validation
      const userInfo = { username: process.env.USER || 'unknown' };
      const policyCheck = await policyManager.validatePackageDownload(packageName, resolvedVersion, userInfo);
      
      if (!policyCheck.allowed && !options.force) {
        console.log(chalk.red('\n❌ Download blocked by enterprise policy:'));
        for (const violation of policyCheck.violations) {
          console.log(chalk.red(`  • ${violation.message}`));
        }
        console.log(chalk.yellow('\nUse --force to override policy (admin only)\n'));
        process.exit(1);
      }
      
      if (policyCheck.violations.length > 0) {
        console.log(chalk.yellow('\n⚠️  Policy warnings:'));
        for (const violation of policyCheck.violations) {
          console.log(chalk.yellow(`  • ${violation.message}`));
          // Log policy violations
          await auditLogger.logPolicyViolation(violation.type, packageName, resolvedVersion, violation);
        }
        console.log();
      }

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
        // Provide more detailed error message with available wheels
        const availablePythonVersions = new Set();
        const availablePlatforms = new Set();
        
        wheels.forEach(wheel => {
          try {
            const parsed = WheelParser.parseWheelFilename(wheel.filename);
            if (parsed.pythonTag.startsWith('cp')) {
              const match = parsed.pythonTag.match(/cp(\d)(\d+)/);
              if (match) {
                availablePythonVersions.add(`${match[1]}.${match[2]}`);
              }
            } else if (parsed.pythonTag === 'py3' || parsed.pythonTag === 'py2.py3') {
              availablePythonVersions.add('3.x (any)');
            }
            availablePlatforms.add(parsed.platformTag);
          } catch (e) {
            // Ignore parse errors
          }
        });
        
        console.error(chalk.red('\n❌ No compatible wheel found'));
        console.error(chalk.yellow(`\nRequested: Python ${options.python} on ${targetPlatform}`));
        console.error(chalk.yellow(`\nAvailable wheels support:`));
        console.error(chalk.yellow(`  • Python versions: ${Array.from(availablePythonVersions).join(', ')}`));
        console.error(chalk.yellow(`  • Platforms: ${Array.from(availablePlatforms).join(', ')}`));
        const suggestedVersion = PythonDetector.suggestCompatibleVersion(options.python, availablePythonVersions);
        if (suggestedVersion !== options.python && suggestedVersion !== '3.x (any)') {
          console.error(chalk.cyan(`\n💡 Tip: Try using Python ${suggestedVersion}:`));
          console.error(chalk.cyan(`   pywhl download ${packageName} -p ${suggestedVersion}`));
        } else {
          console.error(chalk.cyan(`\n💡 Tip: Try specifying a different Python version with -p flag`));
          console.error(chalk.cyan(`   Example: pywhl download ${packageName} -p 3.11`));
        }
        
        throw new Error(`No compatible wheel found`);
      }

      // Security Scanning
      if (!options.skipSecurityScan) {
        console.log(chalk.blue('🔍 Running security scan...'));
        const scanResult = await securityScanner.scanPackage(packageName, resolvedVersion);
        
        if (scanResult.scanned) {
          const securityCheck = await policyManager.validateSecurityScan(scanResult);
          
          if (!securityCheck.allowed && !options.force) {
            console.log(chalk.red('\n❌ Download blocked due to security vulnerabilities:'));
            for (const violation of securityCheck.violations) {
              console.log(chalk.red(`  • ${violation.message}`));
            }
            console.log(chalk.yellow('\nUse --force to override security check\n'));
            process.exit(1);
          }
          
          if (scanResult.vulnerabilities.length > 0) {
            console.log(chalk.yellow(`⚠️  Found ${scanResult.vulnerabilities.length} vulnerabilities`));
          } else {
            console.log(chalk.green('✓ No vulnerabilities found'));
          }
          
          // Log security scan
          await auditLogger.logSecurityScan(
            packageName, 
            resolvedVersion, 
            scanResult.vulnerabilities.length, 
            scanResult.scan_duration
          );
        }
      }

      // License Compliance Check
      if (!options.skipLicenseCheck) {
        console.log(chalk.blue('⚖️  Checking license compliance...'));
        const licenseResult = await licenseChecker.checkLicense(packageInfo);
        
        if (licenseResult.checked) {
          const licenseCheck = await policyManager.validateLicense(packageInfo);
          
          if (!licenseCheck.allowed && !options.force) {
            console.log(chalk.red('\n❌ Download blocked due to license policy:'));
            for (const violation of licenseCheck.violations) {
              console.log(chalk.red(`  • ${violation.message}`));
            }
            console.log(chalk.yellow('\nUse --force to override license check\n'));
            process.exit(1);
          }
          
          console.log(chalk.cyan(`License: ${licenseResult.license} (${licenseResult.category})`));
          
          // Log license check
          await auditLogger.logLicenseCheck(
            packageName, 
            resolvedVersion, 
            licenseResult.license, 
            licenseResult.compliant ? 'compliant' : 'non-compliant'
          );
        }
      }

      // Prepare downloads
      const downloads = [];
      
      // Check cache first
      const cached = options.cache !== false && 
        await cacheManager.exists(packageName, resolvedVersion, bestWheel.filename);
      
      // Log cache access
      await auditLogger.logCacheAccess('check', packageName, resolvedVersion, cached);
      
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
            // Get package info - always get all versions first, then resolve
            const depPackageInfo = await pypiClient.getPackageInfo(depName);
            const depVersion = depInfo.version || depPackageInfo.info.version;
            
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
            } else {
              console.warn(chalk.yellow(`⚠️  No compatible wheel for ${depName}==${depVersion} (Python ${options.python}, ${targetPlatform})`));
            }
          } else {
            console.warn(chalk.yellow(`⚠️  No wheels available for ${depName}==${depVersion}`));
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
          console.log(chalk.red('\n❌ Download errors:'));
          errors.forEach(err => {
            console.log(chalk.red(`  • ${err.filename}: ${err.error}`));
            // Retry suggestion for network errors
            if (err.error.includes('ETIMEDOUT') || err.error.includes('ECONNRESET')) {
              console.log(chalk.yellow(`    🔄 Network timeout - try running the command again`));
            }
          });
        }

        console.log(chalk.green(`\n✓ Downloaded ${results.length} wheel(s) to ${options.output}`));
        
        // Log successful downloads
        for (const result of results) {
          await auditLogger.logPackageDownload(
            packageName, 
            resolvedVersion, 
            'pypi', 
            targetPlatform, 
            options.python, 
            result.size || 0
          );
        }
      } else {
        console.log(chalk.green(`\n✓ All wheels already cached`));
        
        // Log cache hit
        await auditLogger.logPackageDownload(
          packageName, 
          resolvedVersion, 
          'cache', 
          targetPlatform, 
          options.python, 
          0
        );
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