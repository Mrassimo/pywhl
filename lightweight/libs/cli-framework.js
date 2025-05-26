// Lightweight CLI framework to replace commander

export class Command {
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

export function program() {
  return new Command('pywhl');
}