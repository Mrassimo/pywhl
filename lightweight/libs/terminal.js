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
export const chalk = {
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
export class Spinner {
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

export function ora(text) {
  return new Spinner(text);
}

// Simple table implementation
export class Table {
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
export class ProgressBar {
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
export function boxen(text, options = {}) {
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