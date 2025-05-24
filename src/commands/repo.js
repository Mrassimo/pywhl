import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { RepositoryManager } from '../core/repository/repository-manager.js';

export const repoCommand = new Command('repo')
  .description('Manage package repositories')
  .addCommand(
    new Command('list')
      .description('List configured repositories')
      .action(() => {
        const repoManager = new RepositoryManager();
        const repos = repoManager.listRepositories();
        
        if (repos.length === 0) {
          console.log(chalk.yellow('No repositories configured'));
          return;
        }

        const table = new Table({
          head: ['Name', 'URL', 'Type', 'Priority', 'Auth'],
          colWidths: [15, 40, 10, 10, 10]
        });

        repos.forEach(repo => {
          table.push([
            repo.name,
            repo.url,
            repo.type,
            repo.priority,
            repo.hasAuth ? chalk.green('✓') : chalk.gray('-')
          ]);
        });

        console.log(chalk.blue('\nConfigured Repositories:\n'));
        console.log(table.toString());
      })
  )
  .addCommand(
    new Command('add')
      .description('Add a new repository')
      .argument('<name>', 'Repository name')
      .argument('<url>', 'Repository URL')
      .option('--type <type>', 'Repository type', 'pypi')
      .option('--priority <n>', 'Repository priority (lower = higher priority)', parseInt)
      .option('--auth-token <token>', 'Authentication token (or env var like ${TOKEN})')
      .option('--username <user>', 'Username for basic auth')
      .option('--password <pass>', 'Password for basic auth')
      .option('--proxy <url>', 'Proxy URL')
      .action(async (name, url, options) => {
        try {
          const repoManager = new RepositoryManager();
          
          // Check if repository already exists
          if (repoManager.getRepository(name)) {
            console.error(chalk.red(`Repository '${name}' already exists`));
            return;
          }

          // Build repository configuration
          const repoConfig = {
            type: options.type,
            priority: options.priority
          };

          // Handle authentication
          if (options.authToken) {
            repoConfig.auth_token = options.authToken;
          } else if (options.username && options.password) {
            repoConfig.username = options.username;
            repoConfig.password = options.password;
          } else if (!url.includes('pypi.org')) {
            // Ask for auth if it's not the public PyPI
            const { needsAuth } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'needsAuth',
                message: 'Does this repository require authentication?',
                default: true
              }
            ]);

            if (needsAuth) {
              const { authType } = await inquirer.prompt([
                {
                  type: 'list',
                  name: 'authType',
                  message: 'Authentication type:',
                  choices: [
                    { name: 'Bearer Token', value: 'token' },
                    { name: 'Basic Auth', value: 'basic' }
                  ]
                }
              ]);

              if (authType === 'token') {
                const { token } = await inquirer.prompt([
                  {
                    type: 'input',
                    name: 'token',
                    message: 'Auth token (or env var like ${TOKEN_NAME}):',
                    validate: input => input.length > 0
                  }
                ]);
                repoConfig.auth_token = token;
              } else {
                const { username, password } = await inquirer.prompt([
                  {
                    type: 'input',
                    name: 'username',
                    message: 'Username:',
                    validate: input => input.length > 0
                  },
                  {
                    type: 'password',
                    name: 'password',
                    message: 'Password:',
                    validate: input => input.length > 0
                  }
                ]);
                repoConfig.username = username;
                repoConfig.password = password;
              }
            }
          }

          if (options.proxy) {
            repoConfig.proxy = options.proxy;
          }

          // Add repository
          repoManager.addRepository(name, url, repoConfig);
          console.log(chalk.green(`✓ Added repository '${name}'`));
          
          // Test connection
          console.log(chalk.blue('\nTesting repository connection...'));
          try {
            const client = await repoManager.createClient(name);
            await client.getPackageInfo('pip'); // Test with a known package
            console.log(chalk.green('✓ Repository connection successful'));
          } catch (error) {
            console.warn(chalk.yellow(`⚠ Could not verify repository: ${error.message}`));
          }
          
        } catch (error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      })
  )
  .addCommand(
    new Command('remove')
      .description('Remove a repository')
      .argument('<name>', 'Repository name')
      .action(async (name) => {
        try {
          const repoManager = new RepositoryManager();
          
          if (!repoManager.getRepository(name)) {
            console.error(chalk.red(`Repository '${name}' not found`));
            return;
          }

          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to remove repository '${name}'?`,
              default: false
            }
          ]);

          if (confirm) {
            repoManager.removeRepository(name);
            console.log(chalk.green(`✓ Removed repository '${name}'`));
          }
        } catch (error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      })
  )
  .addCommand(
    new Command('test')
      .description('Test repository connection')
      .argument('<name>', 'Repository name')
      .argument('[package]', 'Package to search for', 'pip')
      .action(async (name, packageName) => {
        try {
          const repoManager = new RepositoryManager();
          const repo = repoManager.getRepository(name);
          
          if (!repo) {
            console.error(chalk.red(`Repository '${name}' not found`));
            return;
          }

          console.log(chalk.blue(`Testing repository '${name}'...`));
          console.log(chalk.gray(`URL: ${repo.url}`));
          
          try {
            const client = await repoManager.createClient(name);
            const packageInfo = await client.getPackageInfo(packageName);
            
            console.log(chalk.green('\n✓ Connection successful'));
            console.log(chalk.cyan(`\nFound package: ${packageInfo.info.name}`));
            console.log(`Version: ${packageInfo.info.version}`);
            console.log(`Summary: ${packageInfo.info.summary || 'N/A'}`);
          } catch (error) {
            console.error(chalk.red(`\n✗ Connection failed: ${error.message}`));
            
            if (error.message.includes('401') || error.message.includes('403')) {
              console.log(chalk.yellow('\nThis appears to be an authentication issue.'));
              console.log('Check that your credentials are correct and have necessary permissions.');
            }
          }
        } catch (error) {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      })
  );