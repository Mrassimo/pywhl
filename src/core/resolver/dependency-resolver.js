import semver from 'semver';
import chalk from 'chalk';
import { PyPIClient } from '../pypi/client.js';

export class DependencyResolver {
  constructor(options = {}) {
    this.pypiClient = options.pypiClient || new PyPIClient();
    this.maxDepth = options.maxDepth || 10;
    this.resolved = new Map();
    this.resolving = new Set();
  }

  async resolve(packageName, version = null, depth = 0) {
    if (depth > this.maxDepth) {
      throw new Error(`Maximum dependency depth (${this.maxDepth}) exceeded`);
    }

    const key = `${packageName}@${version || 'latest'}`;
    
    // Check if already resolved
    if (this.resolved.has(key)) {
      return this.resolved.get(key);
    }

    // Check for circular dependencies
    if (this.resolving.has(key)) {
      console.warn(chalk.yellow(`Circular dependency detected: ${key}`));
      return null;
    }

    this.resolving.add(key);

    try {
      // Get package info from PyPI
      const packageInfo = await this.pypiClient.getPackageInfo(packageName, version);
      const resolvedVersion = version || packageInfo.info.version;
      
      // Get dependencies from package metadata
      const dependencies = this.extractDependencies(packageInfo);
      
      // Recursively resolve dependencies
      const resolvedDeps = new Map();
      
      for (const [depName, depSpec] of dependencies) {
        try {
          const depVersion = await this.resolveVersion(depName, depSpec);
          const depInfo = await this.resolve(depName, depVersion, depth + 1);
          if (depInfo) {
            resolvedDeps.set(depName, depInfo);
          }
        } catch (error) {
          console.warn(chalk.yellow(`Failed to resolve ${depName}: ${error.message}`));
        }
      }

      const result = {
        name: packageName,
        version: resolvedVersion,
        dependencies: resolvedDeps,
        info: packageInfo.info
      };

      this.resolved.set(key, result);
      this.resolving.delete(key);
      
      return result;
    } catch (error) {
      this.resolving.delete(key);
      throw error;
    }
  }

  extractDependencies(packageInfo) {
    const dependencies = new Map();
    
    // Extract from requires_dist
    const requiresDist = packageInfo.info.requires_dist || [];
    
    for (const req of requiresDist) {
      // Parse requirement string (e.g., "numpy (>=1.19.0)")
      const match = req.match(/^([a-zA-Z0-9._-]+)\s*(.*)$/);
      if (match) {
        const [, name, spec] = match;
        // Skip extras and environment markers for MVP
        if (!spec.includes(';') && !spec.includes('[')) {
          dependencies.set(name.toLowerCase(), spec);
        }
      }
    }

    return dependencies;
  }

  async resolveVersion(packageName, versionSpec) {
    // For MVP, simple version resolution
    if (!versionSpec || versionSpec === '*') {
      return null; // Use latest
    }

    // Remove parentheses and operators for basic parsing
    const cleanSpec = versionSpec.replace(/[()]/g, '').trim();
    
    if (cleanSpec.startsWith('==')) {
      return cleanSpec.substring(2).trim();
    } else if (cleanSpec.startsWith('>=')) {
      // For MVP, just use latest version that satisfies
      return null;
    } else if (cleanSpec.match(/^\d/)) {
      // Direct version number
      return cleanSpec;
    }

    return null; // Use latest
  }

  getDependencyTree(resolved, depth = 0, visited = new Set()) {
    const indent = '  '.repeat(depth);
    const lines = [];
    
    const key = `${resolved.name}@${resolved.version}`;
    if (visited.has(key)) {
      lines.push(`${indent}${chalk.gray(resolved.name)}@${chalk.gray(resolved.version)} ${chalk.yellow('(circular)')}`);
      return lines;
    }
    
    visited.add(key);
    lines.push(`${indent}${chalk.cyan(resolved.name)}@${chalk.green(resolved.version)}`);
    
    for (const [depName, depInfo] of resolved.dependencies) {
      lines.push(...this.getDependencyTree(depInfo, depth + 1, visited));
    }
    
    return lines;
  }

  getFlatDependencies(resolved, result = new Map()) {
    const key = `${resolved.name}@${resolved.version}`;
    
    if (!result.has(resolved.name)) {
      result.set(resolved.name, {
        name: resolved.name,
        version: resolved.version,
        info: resolved.info
      });
    }
    
    for (const [depName, depInfo] of resolved.dependencies) {
      this.getFlatDependencies(depInfo, result);
    }
    
    return result;
  }
}