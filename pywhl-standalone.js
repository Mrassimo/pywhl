#!/usr/bin/env node

// Pywhl Standalone - Single-file Python wheel downloader
// This version includes all dependencies bundled inline
// No npm install required!

// === http-client.js ===
const http_clientModule = (() => {
// Lightweight HTTP client to replace 'got'



const async function get(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const requestFn = isHttps ? httpsRequest : httpRequest;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'pywhl-lightweight/0.1.0',
        ...options.headers
      }
    };

    const req = requestFn(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            resolve({
              body: data,
              json: () => json,
              statusCode: res.statusCode,
              headers: res.headers
            });
          } catch {
            resolve({
              body: data,
              text: () => data,
              statusCode: res.statusCode,
              headers: res.headers
            });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

const async function downloadFile(url, writeStream) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const requestFn = isHttps ? httpsRequest : httpRequest;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'pywhl-lightweight/0.1.0'
      }
    };

    const req = requestFn(requestOptions, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        res.pipe(writeStream);
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      } else {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
    });
    
    req.on('error', reject);
    req.end();
  });
}
  return {  };
})();

// === terminal.js ===
const terminalModule = (() => {
// Lightweight terminal utilities to replace chalk, ora, etc.

// Simple color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  
  // Background colors
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m'
};

// Chalk replacement
const const chalk = {
  red: (text) => `${colors.red}${text}${colors.reset}`,
  green: (text) => `${colors.green}${text}${colors.reset}`,
  yellow: (text) => `${colors.yellow}${text}${colors.reset}`,
  blue: (text) => `${colors.blue}${text}${colors.reset}`,
  cyan: (text) => `${colors.cyan}${text}${colors.reset}`,
  magenta: (text) => `${colors.magenta}${text}${colors.reset}`,
  gray: (text) => `${colors.gray}${text}${colors.reset}`,
  white: (text) => `${colors.white}${text}${colors.reset}`,
  bold: (text) => `${colors.bright}${text}${colors.reset}`,
  dim: (text) => `${colors.dim}${text}${colors.reset}`,
  
  // Chaining support
  bgRed: {
    white: (text) => `${colors.bgRed}${colors.white}${text}${colors.reset}`
  },
  bgGreen: {
    white: (text) => `${colors.bgGreen}${colors.white}${text}${colors.reset}`
  }
};

// Simple spinner replacement for ora
const class Spinner {
  constructor(text) {
    this.text = text;
    this.interval = null;
    this.frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.currentFrame = 0;
  }
  
  start(text) {
    if (text) this.text = text;
    this.stop();
    
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.frames[this.currentFrame]} ${this.text}`);
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
    
    return this;
  }
  
  succeed(text) {
    this.stop();
    console.log(`${chalk.green('✓')} ${text || this.text}`);
    return this;
  }
  
  fail(text) {
    this.stop();
    console.log(`${chalk.red('✗')} ${text || this.text}`);
    return this;
  }
  
  info(text) {
    this.stop();
    console.log(`${chalk.blue('ℹ')} ${text || this.text}`);
    return this;
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\r\x1b[K'); // Clear line
    }
    return this;
  }
}

const function ora(text) {
  return new Spinner(text);
}

// Simple table implementation
const class Table {
  constructor(options = {}) {
    this.head = options.head || [];
    this.rows = [];
    this.colWidths = options.colWidths || [];
  }
  
  push(row) {
    this.rows.push(row);
  }
  
  toString() {
    // Calculate column widths if not specified
    if (!this.colWidths.length && this.head.length) {
      this.colWidths = this.head.map((h, i) => {
        let maxWidth = h.length;
        this.rows.forEach(row => {
          if (row[i] && row[i].toString().length > maxWidth) {
            maxWidth = row[i].toString().length;
          }
        });
        return maxWidth + 2;
      });
    }
    
    let result = '';
    
    // Add header
    if (this.head.length) {
      result += '┌' + this.colWidths.map(w => '─'.repeat(w)).join('┬') + '┐\n';
      result += '│' + this.head.map((h, i) => ` ${h.padEnd(this.colWidths[i] - 2)} `).join('│') + '│\n';
      result += '├' + this.colWidths.map(w => '─'.repeat(w)).join('┼') + '┤\n';
    }
    
    // Add rows
    this.rows.forEach(row => {
      result += '│' + row.map((cell, i) => ` ${(cell || '').toString().padEnd(this.colWidths[i] - 2)} `).join('│') + '│\n';
    });
    
    result += '└' + this.colWidths.map(w => '─'.repeat(w)).join('┴') + '┘';
    
    return result;
  }
}

// Simple progress bar
const class ProgressBar {
  constructor(format, options = {}) {
    this.format = format;
    this.total = options.total || 100;
    this.width = options.width || 40;
    this.current = 0;
  }
  
  start(total, startValue = 0) {
    this.total = total;
    this.current = startValue;
    this.render();
  }
  
  update(value) {
    this.current = value;
    this.render();
  }
  
  increment() {
    this.current++;
    this.render();
  }
  
  stop() {
    process.stdout.write('\n');
  }
  
  render() {
    const percent = Math.min(100, Math.round((this.current / this.total) * 100));
    const filled = Math.round((percent / 100) * this.width);
    const bar = '█'.repeat(filled) + '░'.repeat(this.width - filled);
    
    let output = this.format
      .replace('{bar}', bar)
      .replace('{percentage}', `${percent}%`)
      .replace('{value}', this.current)
      .replace('{total}', this.total);
    
    process.stdout.write(`\r${output}`);
  }
}

// Simple boxen replacement
const function boxen(text, options = {}) {
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map(l => l.length));
  const padding = options.padding || 1;
  const width = maxLength + (padding * 2);
  
  let result = '┌' + '─'.repeat(width) + '┐\n';
  
  lines.forEach(line => {
    const paddedLine = ' '.repeat(padding) + line.padEnd(maxLength) + ' '.repeat(padding);
    result += '│' + paddedLine + '│\n';
  });
  
  result += '└' + '─'.repeat(width) + '┘';
  
  return result;
}
  return { chalk, Spinner, ora, Table, ProgressBar, boxen };
})();

// === semver.js ===
const semverModule = (() => {
// Lightweight semver implementation

const function parse(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([^+]+))?(?:\+(.+))?$/);
  if (!match) return null;
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] ? match[4].split('.') : [],
    build: match[5] ? match[5].split('.') : [],
    version: version
  };
}

const function valid(version) {
  return parse(version) !== null;
}

const function compare(v1, v2) {
  const p1 = parse(v1);
  const p2 = parse(v2);
  
  if (!p1 || !p2) throw new Error('Invalid version');
  
  // Compare major, minor, patch
  for (const key of ['major', 'minor', 'patch']) {
    if (p1[key] > p2[key]) return 1;
    if (p1[key] < p2[key]) return -1;
  }
  
  // If one has prerelease and other doesn't, non-prerelease is greater
  if (p1.prerelease.length && !p2.prerelease.length) return -1;
  if (!p1.prerelease.length && p2.prerelease.length) return 1;
  
  // Compare prereleases
  for (let i = 0; i < Math.max(p1.prerelease.length, p2.prerelease.length); i++) {
    if (i >= p1.prerelease.length) return -1;
    if (i >= p2.prerelease.length) return 1;
    
    const pre1 = p1.prerelease[i];
    const pre2 = p2.prerelease[i];
    
    if (pre1 === pre2) continue;
    
    const num1 = parseInt(pre1, 10);
    const num2 = parseInt(pre2, 10);
    
    if (!isNaN(num1) && !isNaN(num2)) {
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    } else {
      if (pre1 > pre2) return 1;
      if (pre1 < pre2) return -1;
    }
  }
  
  return 0;
}

const function gt(v1, v2) {
  return compare(v1, v2) > 0;
}

const function gte(v1, v2) {
  return compare(v1, v2) >= 0;
}

const function lt(v1, v2) {
  return compare(v1, v2) < 0;
}

const function lte(v1, v2) {
  return compare(v1, v2) <= 0;
}

const function eq(v1, v2) {
  return compare(v1, v2) === 0;
}

const function satisfies(version, range) {
  // Simple implementation for common cases
  const v = parse(version);
  if (!v) return false;
  
  // Handle simple ranges
  if (range.startsWith('^')) {
    const base = parse(range.substring(1));
    if (!base) return false;
    
    return v.major === base.major && 
           (v.minor > base.minor || 
            (v.minor === base.minor && v.patch >= base.patch));
  }
  
  if (range.startsWith('~')) {
    const base = parse(range.substring(1));
    if (!base) return false;
    
    return v.major === base.major && 
           v.minor === base.minor && 
           v.patch >= base.patch;
  }
  
  if (range.includes(' - ')) {
    const [min, max] = range.split(' - ');
    return gte(version, min) && lte(version, max);
  }
  
  if (range.includes('||')) {
    return range.split('||').some(r => satisfies(version, r.trim()));
  }
  
  // Handle comparison operators
  const operators = ['>=', '<=', '>', '<', '='];
  for (const op of operators) {
    if (range.startsWith(op)) {
      const targetVersion = range.substring(op.length).trim();
      switch (op) {
        case '>=': return gte(version, targetVersion);
        case '<=': return lte(version, targetVersion);
        case '>': return gt(version, targetVersion);
        case '<': return lt(version, targetVersion);
        case '=': return eq(version, targetVersion);
      }
    }
  }
  
  // Default: exact match
  return eq(version, range);
}

const __default__ = {
  parse,
  valid,
  compare,
  gt,
  gte,
  lt,
  lte,
  eq,
  satisfies
};
  return { parse, valid, compare, gt, gte, lt, lte, eq, satisfies, default: __default__ };
})();

// === simple-yaml.js ===
const simple_yamlModule = (() => {
// Simple YAML parser for basic configuration needs

const function parse(yamlString) {
  const lines = yamlString.split('\n');
  const result = {};
  let currentObject = result;
  const stack = [result];
  const indentStack = [-1];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Calculate indentation
    const indent = line.length - line.trimStart().length;
    
    // Handle dedent
    while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
      indentStack.pop();
      stack.pop();
      currentObject = stack[stack.length - 1];
    }
    
    // Parse key-value pairs
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();
    
    if (!value) {
      // This is a nested object
      currentObject[key] = {};
      stack.push(currentObject[key]);
      indentStack.push(indent);
      currentObject = currentObject[key];
    } else if (value.startsWith('-')) {
      // This is an array
      currentObject[key] = [];
      let arrayIndent = -1;
      
      // Process array items
      let j = i;
      while (j < lines.length) {
        const arrayLine = lines[j];
        const arrayTrimmed = arrayLine.trim();
        
        if (!arrayTrimmed || arrayTrimmed.startsWith('#')) {
          j++;
          continue;
        }
        
        const currentIndent = arrayLine.length - arrayLine.trimStart().length;
        
        if (j === i) {
          arrayIndent = currentIndent;
          const item = arrayTrimmed.substring(1).trim();
          if (item) currentObject[key].push(parseValue(item));
        } else if (currentIndent === arrayIndent && arrayTrimmed.startsWith('-')) {
          const item = arrayTrimmed.substring(1).trim();
          if (item) currentObject[key].push(parseValue(item));
        } else if (currentIndent <= indent) {
          break;
        }
        
        j++;
      }
      
      i = j - 1;
    } else {
      // Simple key-value pair
      currentObject[key] = parseValue(value);
    }
  }
  
  return result;
}

const function stringify(obj, indent = 0) {
  let result = '';
  const spaces = ' '.repeat(indent);
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result += `${spaces}${key}:\n`;
    } else if (Array.isArray(value)) {
      result += `${spaces}${key}:\n`;
      value.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          result += `${spaces}- \n${stringify(item, indent + 4)}`;
        } else {
          result += `${spaces}- ${stringifyValue(item)}\n`;
        }
      });
    } else if (typeof value === 'object') {
      result += `${spaces}${key}:\n`;
      result += stringify(value, indent + 2);
    } else {
      result += `${spaces}${key}: ${stringifyValue(value)}\n`;
    }
  }
  
  return result;
}

function parseValue(value) {
  // Remove quotes if present
  if ((value.startsWith('"') && value.endsWith('"')) || 
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  
  // Boolean values
  if (value === 'true' || value === 'yes' || value === 'on') return true;
  if (value === 'false' || value === 'no' || value === 'off') return false;
  
  // Null values
  if (value === 'null' || value === '~') return null;
  
  // Numbers
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
  
  // Default to string
  return value;
}

function stringifyValue(value) {
  if (typeof value === 'string') {
    // Quote if contains special characters
    if (value.includes(':') || value.includes('#') || value.includes('\n')) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return value;
  }
  
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'number') return value.toString();
  
  return String(value);
}

const __default__ = { parse, stringify };
  return { parse, stringify, default: __default__ };
})();

// === config-store.js ===
const config_storeModule = (() => {
// Simple file-based configuration store



const __default__ = class ConfigStore {
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
  return { default: __default__ };
})();

// === cli-framework.js ===
const cli_frameworkModule = (() => {
// Lightweight CLI framework to replace commander

const class Command {
  constructor(name) {
    this.name = name;
    this.description = '';
    this.version = '';
    this.options = [];
    this.commands = new Map();
    this.args = [];
    this.actionHandler = null;
    this.parent = null;
  }
  
  command(nameAndArgs) {
    const parts = nameAndArgs.split(' ');
    const name = parts[0];
    const cmd = new Command(name);
    cmd.parent = this;
    
    // Parse arguments
    parts.slice(1).forEach(arg => {
      const required = arg.startsWith('<') && arg.endsWith('>');
      const optional = arg.startsWith('[') && arg.endsWith(']');
      
      if (required || optional) {
        cmd.args.push({
          name: arg.slice(1, -1),
          required,
          variadic: arg.includes('...')
        });
      }
    });
    
    this.commands.set(name, cmd);
    return cmd;
  }
  
  description(desc) {
    this.description = desc;
    return this;
  }
  
  version(ver, flags = '-V, --version') {
    this.version = ver;
    this.option(flags, 'output the version number');
    return this;
  }
  
  option(flags, description, defaultValue) {
    const option = {
      flags,
      description,
      defaultValue,
      required: false,
      bool: true
    };
    
    // Parse flags
    const parts = flags.split(/,\s*/);
    option.short = parts.find(p => p.startsWith('-') && !p.startsWith('--'));
    option.long = parts.find(p => p.startsWith('--'));
    
    // Check if option expects a value
    if (option.long && option.long.includes(' ')) {
      const [flag, arg] = option.long.split(' ');
      option.long = flag;
      option.argName = arg.replace(/[<>\[\]]/g, '');
      option.bool = false;
      option.required = arg.startsWith('<');
    }
    
    this.options.push(option);
    return this;
  }
  
  requiredOption(flags, description) {
    this.option(flags, description);
    this.options[this.options.length - 1].required = true;
    return this;
  }
  
  action(fn) {
    this.actionHandler = fn;
    return this;
  }
  
  parse(argv = process.argv) {
    const args = argv.slice(2);
    return this.parseArgs(args);
  }
  
  parseArgs(args) {
    const parsed = {
      options: {},
      args: [],
      command: null
    };
    
    // Set default values
    this.options.forEach(opt => {
      if (opt.defaultValue !== undefined) {
        const key = this.optionKey(opt);
        parsed.options[key] = opt.defaultValue;
      }
    });
    
    let i = 0;
    while (i < args.length) {
      const arg = args[i];
      
      // Check for subcommand
      if (!arg.startsWith('-') && this.commands.has(arg)) {
        const subCommand = this.commands.get(arg);
        const remainingArgs = args.slice(i + 1);
        return subCommand.parseArgs(remainingArgs);
      }
      
      // Check for option
      const option = this.findOption(arg);
      if (option) {
        const key = this.optionKey(option);
        
        if (option.bool) {
          parsed.options[key] = true;
        } else {
          i++;
          if (i < args.length && !args[i].startsWith('-')) {
            parsed.options[key] = args[i];
          } else {
            throw new Error(`Option ${arg} requires a value`);
          }
        }
      } else if (arg.startsWith('-')) {
        // Unknown option
        if (arg === '-h' || arg === '--help') {
          this.outputHelp();
          process.exit(0);
        } else if (arg === '-V' || arg === '--version') {
          console.log(this.version);
          process.exit(0);
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
      } else {
        // Regular argument
        parsed.args.push(arg);
      }
      
      i++;
    }
    
    // Check required options
    this.options.forEach(opt => {
      if (opt.required) {
        const key = this.optionKey(opt);
        if (!(key in parsed.options)) {
          throw new Error(`Required option ${opt.long || opt.short} not provided`);
        }
      }
    });
    
    // Execute action if available
    if (this.actionHandler) {
      // For subcommands, pass arguments directly
      if (this.parent) {
        this.actionHandler(...parsed.args, parsed.options, this);
      } else {
        // For main command, pass options object
        this.actionHandler(parsed.options, this);
      }
    }
    
    return parsed;
  }
  
  findOption(arg) {
    return this.options.find(opt => 
      opt.short === arg || 
      opt.long === arg ||
      (opt.long && arg.startsWith(opt.long + '='))
    );
  }
  
  optionKey(option) {
    const longName = option.long ? option.long.replace('--', '') : '';
    return longName.replace(/-/g, '');
  }
  
  outputHelp() {
    console.log(`\nUsage: ${this.name} [options]${this.commands.size ? ' [command]' : ''}`);
    
    if (this.description) {
      console.log(`\n${this.description}`);
    }
    
    if (this.options.length) {
      console.log('\nOptions:');
      this.options.forEach(opt => {
        const flags = opt.argName ? `${opt.flags} <${opt.argName}>` : opt.flags;
        console.log(`  ${flags.padEnd(25)} ${opt.description}`);
      });
    }
    
    if (this.commands.size) {
      console.log('\nCommands:');
      this.commands.forEach((cmd, name) => {
        console.log(`  ${name.padEnd(25)} ${cmd.description}`);
      });
    }
  }
}

const function program() {
  return new Command('pywhl');
}
  return { Command, program };
})();

// === Main Application ===

// Pywhl Lightweight - Self-contained Python wheel downloader
// This version works without npm dependencies

import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream } from 'fs';
import { homedir } from 'os';
import { join, basename, dirname } from 'path';
const { get, downloadFile  } = http_clientModule;
const { chalk, ora, Table, ProgressBar  } = terminalModule;
const semver = semverModule.default || semverModule;
const yaml = simple_yamlModule.default || simple_yamlModule;
const ConfigStore = config_storeModule.default || config_storeModule;
const { Command  } = cli_frameworkModule;

// Constants
const PYPI_API_URL = 'https://pypi.org/pypi';
const CACHE_DIR = join(homedir(), '.pywhl', 'cache');
const CONFIG_DIR = join(homedir(), '.pywhl');

// Ensure directories exist
mkdirSync(CACHE_DIR, { recursive: true });
mkdirSync(CONFIG_DIR, { recursive: true });

// Configuration
const config = new ConfigStore({
  projectName: 'pywhl',
  configName: 'config',
  defaults: {
    pythonVersion: '3.9',
    platform: process.platform === 'darwin' ? 'macosx' : process.platform,
    architecture: process.arch === 'x64' ? 'x86_64' : process.arch
  }
});

// PyPI Client
class PyPIClient {
  async getPackageInfo(packageName) {
    const url = `${PYPI_API_URL}/${packageName}/json`;
    try {
      const response = await get(url);
      return response.json();
    } catch (error) {
      throw new Error(`Failed to fetch package info: ${error.message}`);
    }
  }
  
  async searchPackages(query) {
    // PyPI XML-RPC search is deprecated, so we'll just check if package exists
    try {
      await this.getPackageInfo(query);
      return [{ name: query, summary: 'Package found' }];
    } catch {
      return [];
    }
  }
}

// Wheel selector
function selectBestWheel(releases, pythonVersion, platform, arch) {
  const wheels = [];
  
  // Collect all wheel files
  Object.entries(releases).forEach(([version, files]) => {
    files.forEach(file => {
      if (file.filename.endsWith('.whl')) {
        wheels.push({ ...file, version });
      }
    });
  });
  
  if (wheels.length === 0) {
    throw new Error('No wheel files found');
  }
  
  // Sort by version (newest first)
  wheels.sort((a, b) => semver.compare(b.version, a.version));
  
  // Find compatible wheel
  const pyVersionTag = `cp${pythonVersion.replace('.', '')}`;
  const compatibleWheels = wheels.filter(wheel => {
    const filename = wheel.filename.toLowerCase();
    
    // Check for universal wheel
    if (filename.includes('py2.py3-none-any')) return true;
    if (filename.includes('py3-none-any')) return true;
    
    // Check for specific Python version
    if (!filename.includes(pyVersionTag)) return false;
    
    // Check platform
    if (platform === 'linux' && !filename.includes('linux')) return false;
    if (platform === 'darwin' && !filename.includes('macosx')) return false;
    if (platform === 'win32' && !filename.includes('win')) return false;
    
    return true;
  });
  
  return compatibleWheels[0] || wheels[0];
}

// Dependency resolver
async function resolveDependencies(packageName, pythonVersion, platform, arch, resolved = new Set()) {
  if (resolved.has(packageName)) return [];
  resolved.add(packageName);
  
  const client = new PyPIClient();
  const dependencies = [];
  
  try {
    const packageInfo = await client.getPackageInfo(packageName);
    const wheel = selectBestWheel(packageInfo.releases, pythonVersion, platform, arch);
    
    dependencies.push({
      name: packageName,
      version: wheel.version,
      url: wheel.url,
      filename: wheel.filename
    });
    
    // Parse requires_dist for dependencies
    if (packageInfo.info.requires_dist) {
      for (const dep of packageInfo.info.requires_dist) {
        // Simple parsing - just get the package name
        const match = dep.match(/^([a-zA-Z0-9_-]+)/);
        if (match) {
          const depName = match[1];
          const subDeps = await resolveDependencies(depName, pythonVersion, platform, arch, resolved);
          dependencies.push(...subDeps);
        }
      }
    }
  } catch (error) {
    console.error(chalk.yellow(`Warning: Could not resolve ${packageName}: ${error.message}`));
  }
  
  return dependencies;
}

// Download function
async function downloadWheel(url, filename, outputDir) {
  const filepath = join(outputDir, filename);
  
  if (existsSync(filepath)) {
    console.log(chalk.dim(`Skipping ${filename} (already exists)`));
    return filepath;
  }
  
  const spinner = ora(`Downloading ${filename}`).start();
  
  try {
    const writeStream = createWriteStream(filepath);
    await downloadFile(url, writeStream);
    spinner.succeed(`Downloaded ${filename}`);
    return filepath;
  } catch (error) {
    spinner.fail(`Failed to download ${filename}: ${error.message}`);
    throw error;
  }
}

// Commands
const program = new Command('pywhl');

program
  .version('0.1.0-lightweight')
  .description('Lightweight Python wheel downloader for restricted environments');

// Search command
program
  .command('search <query>')
  .description('Search for Python packages')
  .action(async (query) => {
    const spinner = ora('Searching PyPI...').start();
    const client = new PyPIClient();
    
    try {
      const results = await client.searchPackages(query);
      spinner.stop();
      
      if (results.length === 0) {
        console.log(chalk.yellow('No packages found'));
        return;
      }
      
      const table = new Table({ head: ['Package', 'Description'] });
      results.forEach(pkg => {
        table.push([pkg.name, pkg.summary || '']);
      });
      
      console.log(table.toString());
    } catch (error) {
      spinner.fail(`Search failed: ${error.message}`);
    }
  });

// Info command
program
  .command('info <package>')
  .description('Show package information')
  .action(async (packageName) => {
    const spinner = ora('Fetching package info...').start();
    const client = new PyPIClient();
    
    try {
      const info = await client.getPackageInfo(packageName);
      spinner.stop();
      
      console.log(chalk.bold(`\n${info.info.name} ${info.info.version}`));
      console.log(chalk.dim(info.info.summary || 'No description'));
      console.log(`\nAuthor: ${info.info.author || 'Unknown'}`);
      console.log(`License: ${info.info.license || 'Unknown'}`);
      console.log(`Home: ${info.info.home_page || 'N/A'}`);
      
      // Show available versions
      const versions = Object.keys(info.releases).reverse().slice(0, 10);
      console.log(`\nRecent versions: ${versions.join(', ')}`);
      
    } catch (error) {
      spinner.fail(`Failed to fetch info: ${error.message}`);
    }
  });

// Download command
program
  .command('download <package>')
  .description('Download a package and its dependencies')
  .option('-d, --dest <dir>', 'destination directory', './wheels')
  .option('-p, --python <version>', 'Python version', config.get('pythonVersion'))
  .option('--no-deps', 'skip dependencies')
  .action(async (packageName, options) => {
    const outputDir = options.dest;
    mkdirSync(outputDir, { recursive: true });
    
    console.log(chalk.bold(`Downloading ${packageName}...`));
    
    try {
      const pythonVersion = options.python;
      const platform = config.get('platform');
      const arch = config.get('architecture');
      
      // Resolve dependencies
      const packages = options.noDeps 
        ? [{ name: packageName }]
        : await resolveDependencies(packageName, pythonVersion, platform, arch);
      
      console.log(chalk.dim(`Found ${packages.length} package(s) to download`));
      
      // Download all packages
      const downloads = [];
      for (const pkg of packages) {
        if (pkg.url && pkg.filename) {
          downloads.push(downloadWheel(pkg.url, pkg.filename, outputDir));
        }
      }
      
      await Promise.all(downloads);
      
      console.log(chalk.green(`\n✓ Downloaded ${downloads.length} package(s) to ${outputDir}`));
      
    } catch (error) {
      console.error(chalk.red(`Download failed: ${error.message}`));
      process.exit(1);
    }
  });

// Config command
program
  .command('config <action> [key] [value]')
  .description('Manage configuration')
  .action((action, key, value) => {
    switch (action) {
      case 'get':
        if (key) {
          console.log(config.get(key));
        } else {
          console.log(JSON.stringify(config.all, null, 2));
        }
        break;
        
      case 'set':
        if (!key || !value) {
          console.error('Please provide key and value');
          process.exit(1);
        }
        config.set(key, value);
        console.log(chalk.green(`✓ Set ${key} = ${value}`));
        break;
        
      case 'list':
        console.log(JSON.stringify(config.all, null, 2));
        break;
        
      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
  });

// Cache command
program
  .command('cache <action>')
  .description('Manage local cache')
  .action((action) => {
    switch (action) {
      case 'dir':
        console.log(CACHE_DIR);
        break;
        
      case 'clear':
        // Simple implementation - just inform user
        console.log(`To clear cache, delete: ${CACHE_DIR}`);
        break;
        
      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
  });

// Parse arguments
try {
  program.parse(process.argv);
  
  // Show help if no arguments
  if (process.argv.length === 2) {
    program.outputHelp();
  }
} catch (error) {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
}