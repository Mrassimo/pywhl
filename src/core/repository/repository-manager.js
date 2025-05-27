import chalk from 'chalk';
import { getConfigManager } from '../config/config-manager.js';
import { PyPIClient } from '../pypi/client.js';

export class RepositoryManager {
  constructor() {
    this.configManager = getConfigManager();
    this.repositories = new Map();
    this.initializeRepositories();
  }

  initializeRepositories() {
    const repos = this.configManager.get('repositories') || [];
    
    // Always include default PyPI
    this.repositories.set('pypi', {
      name: 'pypi',
      url: 'https://pypi.org/pypi',
      type: 'pypi',
      priority: 0
    });

    // Add configured repositories
    repos.forEach((repo, index) => {
      this.repositories.set(repo.name, {
        ...repo,
        priority: repo.priority || index + 1
      });
    });
  }

  getRepository(name) {
    return this.repositories.get(name);
  }

  getAllRepositories() {
    return Array.from(this.repositories.values())
      .sort((a, b) => a.priority - b.priority);
  }

  async createClient(repositoryName = 'pypi') {
    const repo = this.repositories.get(repositoryName);
    if (!repo) {
      throw new Error(`Repository '${repositoryName}' not found`);
    }

    const options = {
      baseUrl: repo.url.replace('/simple/', '/pypi'),
      timeout: repo.timeout || 30000
    };

    // Handle authentication
    if (repo.auth_token) {
      const token = repo.auth_token.startsWith('${') 
        ? process.env[repo.auth_token.slice(2, -1)] 
        : repo.auth_token;
      
      if (!token) {
        console.warn(chalk.yellow(`Warning: Auth token not found for ${repo.name}`));
      } else {
        options.headers = {
          'Authorization': `Bearer ${token}`
        };
      }
    } else if (repo.username && repo.password) {
      const username = repo.username.startsWith('${') 
        ? process.env[repo.username.slice(2, -1)] 
        : repo.username;
      const password = repo.password.startsWith('${') 
        ? process.env[repo.password.slice(2, -1)] 
        : repo.password;
      
      if (username && password) {
        options.username = username;
        options.password = password;
      }
    }

    // Handle proxy
    if (repo.proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY) {
      options.proxy = repo.proxy || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
    }

    return new PyPIClient(options);
  }

  async searchPackageAcrossRepos(packageName, version = null) {
    const results = [];
    const repos = this.getAllRepositories();

    for (const repo of repos) {
      try {
        const client = await this.createClient(repo.name);
        const packageInfo = await client.getPackageInfo(packageName, version);
        
        results.push({
          repository: repo.name,
          packageInfo,
          priority: repo.priority
        });
      } catch (error) {
        // Continue to next repository if not found
        if (!error.message.includes('not found')) {
          console.warn(chalk.yellow(`Warning: ${repo.name} - ${error.message}`));
        }
      }
    }

    if (results.length === 0) {
      throw new Error(`Package '${packageName}' not found in any repository`);
    }

    // Return the highest priority result
    return results.sort((a, b) => a.priority - b.priority)[0];
  }

  addRepository(name, url, options = {}) {
    const repo = {
      name,
      url,
      type: options.type || 'pypi',
      priority: options.priority || this.repositories.size,
      ...options
    };

    this.repositories.set(name, repo);
    
    // Save to config
    const repos = this.configManager.get('repositories') || [];
    repos.push(repo);
    this.configManager.set('repositories', repos);
  }

  removeRepository(name) {
    if (name === 'pypi') {
      throw new Error('Cannot remove default PyPI repository');
    }

    this.repositories.delete(name);
    
    // Update config
    const repos = this.configManager.get('repositories') || [];
    const filtered = repos.filter(r => r.name !== name);
    this.configManager.set('repositories', filtered);
  }

  listRepositories() {
    return this.getAllRepositories().map(repo => ({
      name: repo.name,
      url: repo.url,
      type: repo.type,
      priority: repo.priority,
      hasAuth: !!(repo.auth_token || (repo.username && repo.password))
    }));
  }
}