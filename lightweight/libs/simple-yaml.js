// Simple YAML parser for basic configuration needs

export function parse(yamlString) {
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

export function stringify(obj, indent = 0) {
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

export default { parse, stringify };