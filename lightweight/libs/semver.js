// Lightweight semver implementation

export function parse(version) {
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

export function valid(version) {
  return parse(version) !== null;
}

export function compare(v1, v2) {
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

export function gt(v1, v2) {
  return compare(v1, v2) > 0;
}

export function gte(v1, v2) {
  return compare(v1, v2) >= 0;
}

export function lt(v1, v2) {
  return compare(v1, v2) < 0;
}

export function lte(v1, v2) {
  return compare(v1, v2) <= 0;
}

export function eq(v1, v2) {
  return compare(v1, v2) === 0;
}

export function satisfies(version, range) {
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

export default {
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