import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { getConfigManager } from '../core/config/config-manager.js';

export const configCommand = new Command('config')
  .description('Manage pywhl configuration')
  .addCommand(
    new Command('show')
      .description('Show current configuration')
      .action(() => {
        const manager = getConfigManager();
        manager.printConfig();
      })
  )
  .addCommand(
    new Command('set')
      .description('Set a configuration value')
      .argument('<key>', 'Configuration key (e.g., defaults.python_version)')
      .argument('<value>', 'Configuration value')
      .action((key, value) => {
        try {
          const manager = getConfigManager();
          
          // Parse the key path
          const keys = key.split('.');
          if (keys[0] === 'defaults' && keys.length === 2) {
            manager.setDefault(keys[1], value);
            console.log(chalk.green(`✓ Set ${key} = ${value}`));
          } else {
            manager.set(key, value);
            console.log(chalk.green(`✓ Set ${key} = ${value}`));
          }
        } catch (error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      })
  )
  .addCommand(
    new Command('get')
      .description('Get a configuration value')
      .argument('<key>', 'Configuration key')
      .action((key) => {
        try {
          const manager = getConfigManager();
          const value = manager.get(key);
          
          if (value !== undefined) {
            console.log(chalk.cyan(`${key}: ${JSON.stringify(value, null, 2)}`));
          } else {
            console.log(chalk.yellow(`Configuration key '${key}' not found`));
          }
        } catch (error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      })
  )
  .addCommand(
    new Command('profile')
      .description('Manage configuration profiles')
      .addCommand(
        new Command('list')
          .description('List all profiles')
          .action(() => {
            const manager = getConfigManager();
            const profiles = manager.listProfiles();
            
            if (profiles.length === 0) {
              console.log(chalk.yellow('No profiles configured'));
              return;
            }

            const table = new Table({
              head: ['Profile', 'Packages'],
              colWidths: [20, 60]
            });

            profiles.forEach(name => {
              const profile = manager.getProfile(name);
              table.push([
                name,
                profile.packages.join(', ')
              ]);
            });

            console.log(chalk.blue('\nConfigured Profiles:\n'));
            console.log(table.toString());
          })
      )
      .addCommand(
        new Command('add')
          .description('Add a new profile')
          .argument('<name>', 'Profile name')
          .argument('<packages...>', 'Package names')
          .action((name, packages) => {
            try {
              const manager = getConfigManager();
              manager.setProfile(name, packages);
              console.log(chalk.green(`✓ Created profile '${name}' with ${packages.length} packages`));
            } catch (error) {
              console.error(chalk.red(`Error: ${error.message}`));
            }
          })
      )
      .addCommand(
        new Command('remove')
          .description('Remove a profile')
          .argument('<name>', 'Profile name')
          .action((name) => {
            try {
              const manager = getConfigManager();
              manager.deleteProfile(name);
              console.log(chalk.green(`✓ Removed profile '${name}'`));
            } catch (error) {
              console.error(chalk.red(`Error: ${error.message}`));
            }
          })
      )
      .addCommand(
        new Command('use')
          .description('Download all packages from a profile')
          .argument('<name>', 'Profile name')
          .action(async (name) => {
            try {
              const manager = getConfigManager();
              const profile = manager.getProfile(name);
              
              if (!profile) {
                console.error(chalk.red(`Profile '${name}' not found`));
                return;
              }

              console.log(chalk.blue(`\nUsing profile '${name}' with ${profile.packages.length} packages\n`));
              
              // Import download functionality
              const { downloadCommand } = await import('./download.js');
              
              for (const pkg of profile.packages) {
                console.log(chalk.cyan(`\nDownloading ${pkg}...`));
                await downloadCommand.parseAsync(['node', 'pywhl', pkg], { from: 'user' });
              }
              
              console.log(chalk.green(`\n✓ Completed profile '${name}'`));
            } catch (error) {
              console.error(chalk.red(`Error: ${error.message}`));
            }
          })
      )
  )
  .addCommand(
    new Command('reset')
      .description('Reset configuration to defaults')
      .action(async () => {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Are you sure you want to reset all configuration?',
            default: false
          }
        ]);
        
        if (confirm) {
          const manager = getConfigManager();
          manager.reset();
          console.log(chalk.green('✓ Configuration reset to defaults'));
        }
      })
  )
  .addCommand(
    new Command('path')
      .description('Show configuration file path')
      .action(() => {
        const manager = getConfigManager();
        console.log(chalk.cyan(`Configuration file: ${manager.getConfigPath()}`));
      })
  );