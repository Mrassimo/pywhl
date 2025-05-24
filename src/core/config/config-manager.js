import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';
import yaml from 'yaml';
import chalk from 'chalk';

const CONFIG_SCHEMA = {
  defaults: {
    type: 'object',
    properties: {
      python_version: { type: 'string' },
      platform: { type: 'string' },
      cache_dir: { type: 'string' },
      output_dir: { type: 'string' }
    }
  },
  repositories: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        url: { type: 'string' },
        auth_token: { type: 'string' }
      }
    }
  },
  profiles: {
    type: 'object'
  }
};

export class ConfigManager {
  constructor() {
    this.store = new Conf({
      projectName: 'pywhl',
      schema: CONFIG_SCHEMA,
      serialize: yaml.stringify,
      deserialize: yaml.parse
    });
    
    this.configPath = join(homedir(), '.pywhl', 'config.yml');
    this.initDefaults();
  }

  initDefaults() {
    if (!this.store.has('defaults')) {
      this.store.set('defaults', {
        python_version: '3.9',
        platform: 'auto',
        cache_dir: join(homedir(), '.pywhl', 'cache'),
        output_dir: './wheels'
      });
    }

    if (!this.store.has('repositories')) {
      this.store.set('repositories', [
        {
          name: 'pypi',
          url: 'https://pypi.org/simple/'
        }
      ]);
    }

    if (!this.store.has('profiles')) {
      this.store.set('profiles', {
        data_science: {
          packages: ['numpy', 'pandas', 'scikit-learn', 'matplotlib', 'jupyter']
        },
        web_dev: {
          packages: ['django', 'flask', 'requests', 'beautifulsoup4', 'sqlalchemy']
        },
        testing: {
          packages: ['pytest', 'pytest-cov', 'mock', 'tox', 'coverage']
        }
      });
    }
  }

  get(key) {
    return this.store.get(key);
  }

  set(key, value) {
    this.store.set(key, value);
  }

  getDefault(key) {
    const defaults = this.store.get('defaults');
    return defaults?.[key];
  }

  setDefault(key, value) {
    const defaults = this.store.get('defaults') || {};
    defaults[key] = value;
    this.store.set('defaults', defaults);
  }

  getProfile(name) {
    const profiles = this.store.get('profiles');
    return profiles?.[name];
  }

  setProfile(name, packages) {
    const profiles = this.store.get('profiles') || {};
    profiles[name] = { packages };
    this.store.set('profiles', profiles);
  }

  deleteProfile(name) {
    const profiles = this.store.get('profiles') || {};
    delete profiles[name];
    this.store.set('profiles', profiles);
  }

  listProfiles() {
    const profiles = this.store.get('profiles') || {};
    return Object.keys(profiles);
  }

  async exportConfig(outputPath) {
    const config = this.store.store;
    const yamlStr = yaml.stringify(config);
    await writeFile(outputPath, yamlStr, 'utf8');
  }

  async importConfig(inputPath) {
    const yamlStr = await readFile(inputPath, 'utf8');
    const config = yaml.parse(yamlStr);
    
    // Validate and merge config
    Object.entries(config).forEach(([key, value]) => {
      this.store.set(key, value);
    });
  }

  reset() {
    this.store.clear();
    this.initDefaults();
  }

  getConfigPath() {
    return this.store.path;
  }

  printConfig() {
    const config = this.store.store;
    console.log(chalk.blue('\nCurrent Configuration:\n'));
    console.log(yaml.stringify(config));
  }
}

// Singleton instance
let configManager = null;

export function getConfigManager() {
  if (!configManager) {
    configManager = new ConfigManager();
  }
  return configManager;
}

export async function loadConfig() {
  const manager = getConfigManager();
  return manager.store.store;
}