import { program } from 'commander';
import chalk from 'chalk';
import { searchCommand } from './commands/search.js';
import { downloadCommand } from './commands/download.js';
import { cacheCommand } from './commands/cache.js';
import { infoCommand } from './commands/info.js';
import { getVersion } from './utils/version.js';

// Main CLI setup
program
  .name('pywhl')
  .description('CLI tool for downloading and managing Python wheels in restricted environments')
  .version(getVersion());

// Register commands
program.addCommand(searchCommand);
program.addCommand(downloadCommand);
program.addCommand(cacheCommand);
program.addCommand(infoCommand);

// Error handling
program.exitOverride((err) => {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});

// Parse arguments
try {
  program.parse(process.argv);
} catch (error) {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
}

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}