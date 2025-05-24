import { Command } from 'commander';
import chalk from 'chalk';
import { PyPIClient } from '../core/pypi/client.js';

export const searchCommand = new Command('search')
  .description('Search for Python packages on PyPI')
  .argument('<query>', 'Search query')
  .option('-l, --limit <number>', 'Maximum results to show', '10')
  .action(async (query, options) => {
    try {
      const pypiClient = new PyPIClient();
      
      console.log(chalk.blue(`\nSearching PyPI for "${query}"...\n`));
      
      // For MVP, we'll use a simple approach
      // Full search will be implemented in Phase 2
      const result = await pypiClient.searchPackages(query, parseInt(options.limit));
      
      console.log(chalk.yellow(result.message));
      console.log(chalk.gray(`\nTip: If you know the exact package name, use:`));
      console.log(chalk.cyan(`  pywhl download ${query}`));
      console.log(chalk.gray(`\nTo see available versions:`));
      console.log(chalk.cyan(`  pywhl info ${query}`));
      
    } catch (error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      process.exit(1);
    }
  });