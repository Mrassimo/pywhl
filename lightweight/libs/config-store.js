// Simple file-based configuration store
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';

export default class ConfigStore {
  constructor(options = {}) {
    this.name = options.configName || 'config';
    this.projectName = options.projectName || 'pywhl';
    this.defaults = options.defaults || {};
    
    // Set config path
    const configDir = join(homedir(), `.${this.projectName}`);
    this.path = join(configDir, `${this.name}.json`);
    
    // Ensure directory exists
    try {
      mkdirSync(dirname(this.path), { recursive: true });
    } catch (err) {
      // Directory might already exist
    }
    
    // Load existing config or use defaults
    this.store = this.load();
  }
  
  load() {
    try {
      const data = readFileSync(this.path, 'utf8');
      return { ...this.defaults, ...JSON.parse(data) };
    } catch (err) {
      return { ...this.defaults };
    }
  }
  
  save() {
    try {
      writeFileSync(this.path, JSON.stringify(this.store, null, 2));
    } catch (err) {
      console.error('Failed to save config:', err.message);
    }
  }
  
  get(key) {
    if (!key) return this.store;
    
    const keys = key.split('.');
    let value = this.store;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  set(key, val) {
    if (typeof key === 'object') {
      // Set multiple values
      Object.assign(this.store, key);
    } else {
      // Set single value with dot notation support
      const keys = key.split('.');
      let obj = this.store;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in obj) || typeof obj[k] !== 'object') {
          obj[k] = {};
        }
        obj = obj[k];
      }
      
      obj[keys[keys.length - 1]] = val;
    }
    
    this.save();
  }
  
  has(key) {
    return this.get(key) !== undefined;
  }
  
  delete(key) {
    const keys = key.split('.');
    
    if (keys.length === 1) {
      delete this.store[key];
    } else {
      let obj = this.store;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in obj) || typeof obj[k] !== 'object') {
          return;
        }
        obj = obj[k];
      }
      
      delete obj[keys[keys.length - 1]];
    }
    
    this.save();
  }
  
  clear() {
    this.store = { ...this.defaults };
    this.save();
  }
  
  get size() {
    return Object.keys(this.store).length;
  }
  
  get all() {
    return { ...this.store };
  }
}