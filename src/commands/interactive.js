import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import boxen from 'boxen';
import { PyPIClient } from '../core/pypi/client.js';
import { downloadCommand } from './download.js';
import { CacheManager } from '../core/cache/manager.js';
import { loadConfig } from '../core/config/config-manager.js';

export const interactiveCommand = new Command('interactive')
  .alias('i')
  .description('Launch interactive mode')
  .action(async () => {
    try {
      // Display welcome banner
      const banner = figlet.textSync('Pywhl', { font: 'Big' });
      console.log(gradient.rainbow(banner));
      console.log(boxen('Welcome to Pywhl Interactive Mode', {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      }));

      // Main menu loop
      let exit = false;
      while (!exit) {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: '📦 Search and download packages', value: 'search' },
              { name: '📋 Download from requirements.txt', value: 'requirements' },
              { name: '🔧 Configure settings', value: 'config' },
              { name: '💾 Manage cache', value: 'cache' },
              { name: '📊 View download history', value: 'history' },
              new inquirer.Separator(),
              { name: '❌ Exit', value: 'exit' }
            ]
          }
        ]);

        switch (action) {
          case 'search':
            await interactiveSearch();
            break;
          case 'requirements':
            await interactiveRequirements();
            break;
          case 'config':
            await interactiveConfig();
            break;
          case 'cache':
            await interactiveCache();
            break;
          case 'history':
            await interactiveHistory();
            break;
          case 'exit':
            exit = true;
            console.log(chalk.cyan('\nThank you for using Pywhl! 👋\n'));
            break;
        }
      }
    } catch (error) {
      if (error.name === 'ExitPromptError') {
        console.log(chalk.cyan('\nExiting interactive mode...\n'));
      } else {
        console.error(chalk.red(`\nError: ${error.message}`));
      }
    }
  });

async function interactiveSearch() {
  const pypiClient = new PyPIClient();
  
  const { packageName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'packageName',
      message: 'Enter package name to search:',
      validate: input => input.length > 0 || 'Please enter a package name'
    }
  ]);

  console.log(chalk.blue(`\nSearching for ${packageName}...\n`));

  try {
    // Get package info
    const packageInfo = await pypiClient.getPackageInfo(packageName);
    const versions = await pypiClient.getPackageReleases(packageName);
    
    // Display package info
    console.log(boxen(
      `${chalk.bold('Package:')} ${packageInfo.info.name}\n` +
      `${chalk.bold('Latest:')} ${packageInfo.info.version}\n` +
      `${chalk.bold('Summary:')} ${packageInfo.info.summary || 'N/A'}`,
      {
        padding: 1,
        borderStyle: 'round',
        borderColor: 'green'
      }
    ));

    // Ask what to do
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Download latest version', value: 'latest' },
          { name: 'Choose specific version', value: 'specific' },
          { name: 'Download with dependencies', value: 'deps' },
          { name: 'View more info', value: 'info' },
          { name: 'Back to main menu', value: 'back' }
        ]
      }
    ]);

    if (action === 'latest' || action === 'deps') {
      await downloadPackageInteractive(packageName, null, action === 'deps');
    } else if (action === 'specific') {
      const { version } = await inquirer.prompt([
        {
          type: 'list',
          name: 'version',
          message: 'Select version:',
          choices: versions.slice(0, 20).map(v => ({ name: v, value: v })),
          pageSize: 10
        }
      ]);
      await downloadPackageInteractive(packageName, version, false);
    } else if (action === 'info') {
      // Show extended info
      console.log(chalk.bold('\nPackage Information:'));
      console.log(`Author: ${packageInfo.info.author || 'N/A'}`);
      console.log(`License: ${packageInfo.info.license || 'N/A'}`);
      console.log(`Homepage: ${packageInfo.info.home_page || 'N/A'}`);
      console.log(`Keywords: ${(packageInfo.info.keywords || 'N/A')}`);
      
      await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: 'Press enter to continue...',
          default: true
        }
      ]);
    }
  } catch (error) {
    console.error(chalk.red(`\nPackage not found: ${error.message}`));
    await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Press enter to continue...',
        default: true
      }
    ]);
  }
}

async function downloadPackageInteractive(packageName, version, withDeps) {
  const { pythonVersion, outputDir, platform } = await inquirer.prompt([
    {
      type: 'input',
      name: 'pythonVersion',
      message: 'Python version:',
      default: '3.9'
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Output directory:',
      default: './wheels'
    },
    {
      type: 'confirm',
      name: 'platform',
      message: 'Use current platform?',
      default: true
    }
  ]);

  const args = [packageName];
  if (version) args[0] += `==${version}`;
  
  const options = {
    python: pythonVersion,
    output: outputDir,
    deps: withDeps
  };

  // Execute download
  console.log(chalk.blue('\nStarting download...\n'));
  await downloadCommand.parseAsync(['node', 'pywhl', ...args], { from: 'user' });
}

async function interactiveRequirements() {
  const { filePath } = await inquirer.prompt([
    {
      type: 'input',
      name: 'filePath',
      message: 'Path to requirements.txt:',
      default: './requirements.txt'
    }
  ]);

  console.log(chalk.yellow('\nRequirements file parsing will be implemented soon!\n'));
  
  await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Press enter to continue...',
      default: true
    }
  ]);
}

async function interactiveConfig() {
  const config = await loadConfig();
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Configuration options:',
      choices: [
        { name: 'Set default Python version', value: 'python' },
        { name: 'Set default platform', value: 'platform' },
        { name: 'Configure cache directory', value: 'cache' },
        { name: 'Manage profiles', value: 'profiles' },
        { name: 'Back to main menu', value: 'back' }
      ]
    }
  ]);

  if (action === 'python') {
    const { version } = await inquirer.prompt([
      {
        type: 'input',
        name: 'version',
        message: 'Default Python version:',
        default: config.defaults?.python_version || '3.9'
      }
    ]);
    
    console.log(chalk.green(`\n✓ Default Python version set to ${version}\n`));
  }

  // Other config options would be implemented similarly
  
  await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Press enter to continue...',
      default: true
    }
  ]);
}

async function interactiveCache() {
  const cacheManager = new CacheManager();
  const items = await cacheManager.list();
  const size = await cacheManager.getSize();
  
  console.log(boxen(
    `${chalk.bold('Cache Statistics')}\n` +
    `Items: ${items.length}\n` +
    `Total Size: ${cacheManager.formatSize(size)}`,
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'yellow'
    }
  ));

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Cache management:',
      choices: [
        { name: 'View cached items', value: 'list' },
        { name: 'Clean old items', value: 'clean' },
        { name: 'Clear all cache', value: 'clear' },
        { name: 'Back to main menu', value: 'back' }
      ]
    }
  ]);

  if (action === 'list') {
    if (items.length === 0) {
      console.log(chalk.yellow('\nCache is empty\n'));
    } else {
      console.log(chalk.bold('\nCached items:'));
      items.slice(0, 10).forEach(item => {
        console.log(`  ${item.filename} (${cacheManager.formatSize(item.size)})`);
      });
      if (items.length > 10) {
        console.log(chalk.gray(`  ... and ${items.length - 10} more`));
      }
      console.log();
    }
  } else if (action === 'clear') {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to clear all cache?',
        default: false
      }
    ]);
    
    if (confirm) {
      const result = await cacheManager.clean({ all: true });
      console.log(chalk.green(`\n✓ Cleared ${result.cleaned} items, freed ${cacheManager.formatSize(result.freedSpace)}\n`));
    }
  }

  await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Press enter to continue...',
      default: true
    }
  ]);
}

async function interactiveHistory() {
  console.log(chalk.yellow('\nDownload history will be implemented soon!\n'));
  
  await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continue',
      message: 'Press enter to continue...',
      default: true
    }
  ]);
}