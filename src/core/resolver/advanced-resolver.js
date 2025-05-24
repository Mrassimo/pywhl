import semver from 'semver';
import chalk from 'chalk';
import { PyPIClient } from '../pypi/client.js';
import { RepositoryManager } from '../repository/repository-manager.js';

export class AdvancedDependencyResolver {
  constructor(options = {}) {
    this.repoManager = options.repositoryManager || new RepositoryManager();
    this.maxDepth = options.maxDepth || 10;
    this.cache = new Map(); // Cache for package metadata
    this.constraints = new Map(); // Version constraints for each package
    this.resolution = new Map(); // Final resolved versions
    this.conflicts = [];
  }

  async resolve(packageSpec, extras = [], options = {}) {
    // Clear previous resolution
    this.constraints.clear();
    this.resolution.clear();
    this.conflicts = [];

    // Parse initial package
    const { name, version, versionSpec } = this.parsePackageSpec(packageSpec);
    
    // Start resolution
    await this.collectConstraints(name, versionSpec || version, extras, 0, []);
    
    // Resolve all constraints
    const success = await this.resolveConstraints();
    
    if (!success) {
      throw new Error(`Failed to resolve dependencies. Conflicts:\n${this.formatConflicts()}`);
    }

    return this.buildResolutionTree();
  }

  parsePackageSpec(spec) {
    const match = spec.match(/^([a-zA-Z0-9._-]+)(?:\[([^\]]+)\])?(.*)$/);
    if (!match) {
      throw new Error(`Invalid package specification: ${spec}`);
    }

    const name = match[1].toLowerCase();
    const extras = match[2] ? match[2].split(',').map(e => e.trim()) : [];
    const versionPart = match[3].trim();

    let version = null;
    let versionSpec = null;

    if (versionPart) {
      if (versionPart.startsWith('==')) {
        version = versionPart.substring(2).trim();
      } else {
        versionSpec = versionPart;
      }
    }

    return { name, extras, version, versionSpec };
  }

  async collectConstraints(packageName, versionSpec, extras, depth, path) {
    if (depth > this.maxDepth) {
      throw new Error(`Maximum dependency depth exceeded at ${packageName}`);
    }

    // Check for circular dependencies
    if (path.includes(packageName)) {
      console.warn(chalk.yellow(`Circular dependency detected: ${path.join(' -> ')} -> ${packageName}`));
      return;
    }

    // Add constraint
    this.addConstraint(packageName, versionSpec, path);

    // Get package info
    const packageInfo = await this.getPackageInfo(packageName, versionSpec);
    if (!packageInfo) return;

    const version = packageInfo.info.version;
    
    // Get dependencies
    const dependencies = this.extractDependencies(packageInfo, extras);
    
    // Recursively collect constraints from dependencies
    const newPath = [...path, packageName];
    
    for (const dep of dependencies) {
      await this.collectConstraints(
        dep.name,
        dep.versionSpec,
        dep.extras || [],
        depth + 1,
        newPath
      );
    }
  }

  addConstraint(packageName, versionSpec, path) {
    if (!this.constraints.has(packageName)) {
      this.constraints.set(packageName, []);
    }

    this.constraints.get(packageName).push({
      spec: versionSpec || '*',
      source: path.length > 0 ? path[path.length - 1] : 'root',
      path: [...path]
    });
  }

  extractDependencies(packageInfo, extras = []) {
    const dependencies = [];
    const requiresDist = packageInfo.info.requires_dist || [];

    for (const req of requiresDist) {
      const parsed = this.parseRequirement(req);
      if (!parsed) continue;

      // Check if this dependency should be included
      if (parsed.extras && parsed.extras.length > 0) {
        // Only include if we're installing those extras
        const hasExtra = parsed.extras.some(e => extras.includes(e));
        if (!hasExtra) continue;
      }

      // Evaluate environment markers if present
      if (parsed.marker && !this.evaluateMarker(parsed.marker)) {
        continue;
      }

      dependencies.push({
        name: parsed.name,
        versionSpec: parsed.versionSpec,
        extras: parsed.packageExtras
      });
    }

    return dependencies;
  }

  parseRequirement(requirement) {
    // Parse PEP 508 requirement strings
    // Format: name [extras] (version_spec) ; marker
    const regex = /^([a-zA-Z0-9._-]+)(?:\[([^\]]+)\])?([^;]*)?(?:;(.*))?$/;
    const match = requirement.match(regex);
    
    if (!match) return null;

    const name = match[1].toLowerCase();
    const packageExtras = match[2] ? match[2].split(',').map(e => e.trim()) : [];
    const versionSpec = match[3] ? match[3].trim() : '';
    const marker = match[4] ? match[4].trim() : null;

    // Parse extras from marker (e.g., extra == "dev")
    let extras = [];
    if (marker) {
      const extraMatch = marker.match(/extra\s*==\s*["']([^"']+)["']/);
      if (extraMatch) {
        extras = [extraMatch[1]];
      }
    }

    return {
      name,
      packageExtras,
      versionSpec,
      marker,
      extras
    };
  }

  evaluateMarker(marker) {
    // Simple marker evaluation - in production, use a proper parser
    // For now, just handle common cases
    
    // Python version markers
    if (marker.includes('python_version')) {
      // Always assume Python 3.9 for now
      return !marker.includes('< "3"');
    }

    // Platform markers
    if (marker.includes('sys_platform')) {
      const platform = process.platform;
      if (marker.includes('win32') && platform !== 'win32') return false;
      if (marker.includes('linux') && platform !== 'linux') return false;
      if (marker.includes('darwin') && platform !== 'darwin') return false;
    }

    // Default to including the dependency
    return true;
  }

  async resolveConstraints() {
    for (const [packageName, constraints] of this.constraints) {
      try {
        // Get all available versions
        const versions = await this.getAvailableVersions(packageName);
        
        // Find a version that satisfies all constraints
        const resolvedVersion = this.findCompatibleVersion(packageName, versions, constraints);
        
        if (!resolvedVersion) {
          this.conflicts.push({
            package: packageName,
            constraints: constraints.map(c => ({
              spec: c.spec,
              source: c.source
            }))
          });
          return false;
        }

        this.resolution.set(packageName, resolvedVersion);
      } catch (error) {
        this.conflicts.push({
          package: packageName,
          error: error.message
        });
        return false;
      }
    }

    return true;
  }

  findCompatibleVersion(packageName, versions, constraints) {
    // Sort versions in descending order
    const sortedVersions = versions.sort((a, b) => {
      try {
        return semver.rcompare(a, b);
      } catch {
        return b.localeCompare(a);
      }
    });

    // Find the first version that satisfies all constraints
    for (const version of sortedVersions) {
      let satisfiesAll = true;

      for (const constraint of constraints) {
        if (!this.versionSatisfies(version, constraint.spec)) {
          satisfiesAll = false;
          break;
        }
      }

      if (satisfiesAll) {
        return version;
      }
    }

    return null;
  }

  versionSatisfies(version, spec) {
    if (!spec || spec === '*') return true;

    // Handle different version specifiers
    if (spec.startsWith('==')) {
      return version === spec.substring(2).trim();
    } else if (spec.startsWith('>=')) {
      return this.versionCompare(version, spec.substring(2).trim()) >= 0;
    } else if (spec.startsWith('<=')) {
      return this.versionCompare(version, spec.substring(2).trim()) <= 0;
    } else if (spec.startsWith('>')) {
      return this.versionCompare(version, spec.substring(1).trim()) > 0;
    } else if (spec.startsWith('<')) {
      return this.versionCompare(version, spec.substring(1).trim()) < 0;
    } else if (spec.startsWith('~=')) {
      // Compatible release
      const base = spec.substring(2).trim();
      return this.compatibleRelease(version, base);
    } else if (spec.includes(',')) {
      // Multiple constraints
      const parts = spec.split(',').map(s => s.trim());
      return parts.every(part => this.versionSatisfies(version, part));
    }

    return true;
  }

  versionCompare(v1, v2) {
    try {
      return semver.compare(v1, v2);
    } catch {
      // Fallback to string comparison for non-semver versions
      return v1.localeCompare(v2);
    }
  }

  compatibleRelease(version, base) {
    // ~= 1.4.2 is equivalent to >= 1.4.2, < 1.5.0
    const parts = base.split('.');
    if (parts.length < 2) return false;

    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1]);
    
    const vParts = version.split('.');
    const vMajor = parseInt(vParts[0]);
    const vMinor = parseInt(vParts[1]);

    return vMajor === major && vMinor === minor && 
           this.versionCompare(version, base) >= 0;
  }

  async getPackageInfo(packageName, versionSpec) {
    const cacheKey = `${packageName}@${versionSpec || 'latest'}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const result = await this.repoManager.searchPackageAcrossRepos(packageName);
      this.cache.set(cacheKey, result.packageInfo);
      return result.packageInfo;
    } catch (error) {
      console.warn(chalk.yellow(`Failed to get info for ${packageName}: ${error.message}`));
      return null;
    }
  }

  async getAvailableVersions(packageName) {
    const packageInfo = await this.getPackageInfo(packageName);
    if (!packageInfo) return [];
    
    return Object.keys(packageInfo.releases || {});
  }

  buildResolutionTree() {
    const tree = {
      packages: new Map(),
      conflicts: this.conflicts
    };

    for (const [packageName, version] of this.resolution) {
      tree.packages.set(packageName, {
        name: packageName,
        version: version,
        constraints: this.constraints.get(packageName) || []
      });
    }

    return tree;
  }

  formatConflicts() {
    return this.conflicts.map(conflict => {
      if (conflict.error) {
        return `  ${conflict.package}: ${conflict.error}`;
      }
      
      const constraints = conflict.constraints
        .map(c => `${c.spec} (from ${c.source})`)
        .join(', ');
      
      return `  ${conflict.package}: Conflicting requirements - ${constraints}`;
    }).join('\n');
  }

  getResolutionReport() {
    const report = [];
    
    report.push(chalk.bold('Dependency Resolution Report'));
    report.push('=' .repeat(50));
    
    if (this.conflicts.length > 0) {
      report.push(chalk.red('\nConflicts:'));
      report.push(this.formatConflicts());
    }
    
    if (this.resolution.size > 0) {
      report.push(chalk.green('\nResolved packages:'));
      
      for (const [name, version] of this.resolution) {
        const constraints = this.constraints.get(name) || [];
        const sources = [...new Set(constraints.map(c => c.source))].join(', ');
        report.push(`  ${name}==${version} (required by: ${sources})`);
      }
    }
    
    return report.join('\n');
  }
}