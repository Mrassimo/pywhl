import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export class RequirementsParser {
  static async parse(filePath) {
    if (!existsSync(filePath)) {
      throw new Error(`Requirements file not found: ${filePath}`);
    }

    const content = await readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const requirements = [];
    
    for (let line of lines) {
      // Remove comments
      const commentIndex = line.indexOf('#');
      if (commentIndex !== -1) {
        line = line.substring(0, commentIndex);
      }
      
      // Trim whitespace
      line = line.trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Skip special directives
      if (line.startsWith('-') || line.startsWith('--')) {
        // Handle -e, --editable, -r, --requirement, etc.
        if (line.startsWith('-r ') || line.startsWith('--requirement ')) {
          // TODO: Handle recursive requirements files
          console.warn(`Skipping recursive requirement: ${line}`);
        }
        continue;
      }
      
      // Parse the requirement
      const requirement = this.parseRequirement(line);
      if (requirement) {
        requirements.push(requirement);
      }
    }
    
    return requirements;
  }

  static parseRequirement(line) {
    // Remove environment markers (e.g., ; python_version < "3.8")
    const envMarkerIndex = line.indexOf(';');
    if (envMarkerIndex !== -1) {
      line = line.substring(0, envMarkerIndex).trim();
    }
    
    // Handle extras (e.g., requests[security])
    const extrasMatch = line.match(/^([a-zA-Z0-9._-]+)\[([^\]]+)\](.*)$/);
    let packageName, extras = null, versionSpec = '';
    
    if (extrasMatch) {
      packageName = extrasMatch[1];
      extras = extrasMatch[2].split(',').map(e => e.trim());
      versionSpec = extrasMatch[3].trim();
    } else {
      // Regular package specification
      const match = line.match(/^([a-zA-Z0-9._-]+)(.*)$/);
      if (match) {
        packageName = match[1];
        versionSpec = match[2].trim();
      } else {
        return null;
      }
    }
    
    // Parse version specifiers
    const version = this.parseVersionSpec(versionSpec);
    
    return {
      name: packageName.toLowerCase(),
      version,
      extras,
      raw: line
    };
  }

  static parseVersionSpec(spec) {
    if (!spec) return null;
    
    // Common version specifiers
    const patterns = [
      { regex: /^==\s*(.+)$/, type: 'exact' },
      { regex: /^>=\s*(.+)$/, type: 'gte' },
      { regex: /^<=\s*(.+)$/, type: 'lte' },
      { regex: /^>\s*(.+)$/, type: 'gt' },
      { regex: /^<\s*(.+)$/, type: 'lt' },
      { regex: /^~=\s*(.+)$/, type: 'compatible' },
      { regex: /^!=\s*(.+)$/, type: 'ne' }
    ];
    
    for (const pattern of patterns) {
      const match = spec.match(pattern.regex);
      if (match) {
        return {
          type: pattern.type,
          value: match[1].trim()
        };
      }
    }
    
    // Handle comma-separated constraints
    if (spec.includes(',')) {
      const constraints = spec.split(',').map(s => this.parseVersionSpec(s.trim()));
      return {
        type: 'multiple',
        constraints
      };
    }
    
    return null;
  }

  static formatRequirement(req) {
    if (!req.version) {
      return req.name;
    }
    
    if (req.version.type === 'exact') {
      return `${req.name}==${req.version.value}`;
    }
    
    return req.name;
  }
}