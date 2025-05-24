import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { CacheManager } from '../core/cache/manager.js';

export const cacheCommand = new Command('cache')
  .description('Manage the local wheel cache')
  .addCommand(
    new Command('list')
      .description('List cached wheels')
      .action(async () => {
        try {
          const cacheManager = new CacheManager();
          const items = await cacheManager.list();
          
          if (items.length === 0) {
            console.log(chalk.yellow('\nCache is empty'));
            return;
          }

          const table = new Table({
            head: ['Filename', 'Size', 'Modified'],
            colWidths: [50, 15, 25]
          });

          let totalSize = 0;
          items.forEach(item => {
            totalSize += item.size;
            table.push([
              item.filename.substring(0, 48),
              cacheManager.formatSize(item.size),
              item.modified.toLocaleString()
            ]);
          });

          console.log(chalk.blue('\nCached wheels:\n'));
          console.log(table.toString());
          console.log(chalk.gray(`\nTotal: ${items.length} items, ${cacheManager.formatSize(totalSize)}`));
          
        } catch (error) {
          console.error(chalk.red(`\nError: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('clean')
      .description('Clean the cache')
      .option('--all', 'Remove all cached items')
      .option('--older-than <days>', 'Remove items older than specified days')
      .action(async (options) => {
        try {
          const cacheManager = new CacheManager();
          
          if (!options.all && !options.olderThan) {
            console.log(chalk.yellow('\nPlease specify --all or --older-than <days>'));
            return;
          }

          const cleanOptions = {
            all: options.all,
            olderThan: options.olderThan ? parseInt(options.olderThan) * 24 * 60 * 60 * 1000 : null
          };

          const result = await cacheManager.clean(cleanOptions);
          
          console.log(chalk.green(`\n✓ Cleaned ${result.cleaned} items`));
          console.log(chalk.gray(`  Freed ${cacheManager.formatSize(result.freedSpace)}`));
          
        } catch (error) {
          console.error(chalk.red(`\nError: ${error.message}`));
          process.exit(1);
        }
      })
  )
  .addCommand(
    new Command('info')
      .description('Show cache information')
      .action(async () => {
        try {
          const cacheManager = new CacheManager();
          const size = await cacheManager.getSize();
          const items = await cacheManager.list();
          
          console.log(chalk.blue('\nCache Information:\n'));
          console.log(`  Location: ${chalk.cyan(cacheManager.cacheDir)}`);
          console.log(`  Items: ${chalk.cyan(items.length)}`);
          console.log(`  Size: ${chalk.cyan(cacheManager.formatSize(size))}`);
          console.log(`  Max Size: ${chalk.cyan(cacheManager.formatSize(cacheManager.maxSize))}`);
          
        } catch (error) {
          console.error(chalk.red(`\nError: ${error.message}`));
          process.exit(1);
        }
      })
  );