import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { PyPIClient } from '../core/pypi/client.js';

export const infoCommand = new Command('info')
  .description('Show information about a package')
  .argument('<package>', 'Package name')
  .option('-v, --versions', 'Show all available versions', false)
  .action(async (packageName, options) => {
    try {
      const pypiClient = new PyPIClient();
      
      console.log(chalk.blue(`\nFetching info for ${packageName}...\n`));
      
      const packageInfo = await pypiClient.getPackageInfo(packageName);
      const info = packageInfo.info;
      
      // Basic info
      console.log(chalk.bold('Package:'), info.name);
      console.log(chalk.bold('Version:'), chalk.green(info.version));
      console.log(chalk.bold('Summary:'), info.summary || 'N/A');
      console.log(chalk.bold('Author:'), info.author || 'N/A');
      console.log(chalk.bold('License:'), info.license || 'N/A');
      console.log(chalk.bold('Home Page:'), info.home_page || 'N/A');
      
      if (options.versions) {
        const versions = await pypiClient.getPackageReleases(packageName);
        console.log(chalk.bold('\nAvailable Versions:'));
        
        const table = new Table({
          head: ['Version', 'Release Date'],
          colWidths: [20, 30]
        });
        
        // Show top 20 versions
        versions.slice(0, 20).forEach(version => {
          const releaseInfo = packageInfo.releases[version];
          if (releaseInfo && releaseInfo.length > 0) {
            const releaseDate = new Date(releaseInfo[0].upload_time_iso_8601);
            table.push([version, releaseDate.toLocaleDateString()]);
          }
        });
        
        console.log(table.toString());
        
        if (versions.length > 20) {
          console.log(chalk.gray(`\n... and ${versions.length - 20} more versions`));
        }
      }
      
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });