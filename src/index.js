import { program } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { searchCommand } from './commands/search.js';
import { downloadCommand } from './commands/download.js';
import { cacheCommand } from './commands/cache.js';
import { infoCommand } from './commands/info.js';
import { configCommand } from './commands/config.js';
import { interactiveCommand } from './commands/interactive.js';
import { installScriptCommand } from './commands/install-script.js';
import { bundleCommand } from './commands/bundle.js';
import { repoCommand } from './commands/repo.js';
import { adminCommand } from './commands/admin.js';
import { getVersion } from './utils/version.js';

// Display banner for main help
if (process.argv.length === 2 || process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(chalk.cyan(figlet.textSync('Pywhl', { font: 'Small' })));
  console.log(chalk.gray('Python Wheel Manager for Restricted Environments\n'));
}

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
program.addCommand(configCommand);
program.addCommand(interactiveCommand);
program.addCommand(installScriptCommand);
program.addCommand(bundleCommand);
program.addCommand(repoCommand);
program.addCommand(adminCommand);

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