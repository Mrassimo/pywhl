import { mkdir, readdir, stat, unlink, access } from 'fs/promises';
import { join, basename } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';
import { constants } from 'fs';
import chalk from 'chalk';

export class CacheManager {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir || join(homedir(), '.pywhl', 'cache');
    this.maxSize = options.maxSize || 1024 * 1024 * 1024; // 1GB default
  }

  async init() {
    try {
      await mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize cache directory: ${error.message}`);
    }
  }

  getCacheKey(packageName, version, filename) {
    const data = `${packageName}-${version}-${filename}`;
    return createHash('sha256').update(data).digest('hex').slice(0, 16);
  }

  getCachePath(packageName, version, filename) {
    const key = this.getCacheKey(packageName, version, filename);
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    return join(this.cacheDir, `${key}-${safeFilename}`);
  }

  async exists(packageName, version, filename) {
    const cachePath = this.getCachePath(packageName, version, filename);
    try {
      await access(cachePath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async get(packageName, version, filename) {
    const cachePath = this.getCachePath(packageName, version, filename);
    try {
      await access(cachePath, constants.F_OK);
      return cachePath;
    } catch {
      return null;
    }
  }

  async put(packageName, version, filename, filePath) {
    const cachePath = this.getCachePath(packageName, version, filename);
    // In a real implementation, we would copy the file
    // For MVP, we'll just return the cache path
    return cachePath;
  }

  async list() {
    try {
      await this.init();
      const files = await readdir(this.cacheDir);
      const items = [];

      for (const file of files) {
        const filePath = join(this.cacheDir, file);
        const stats = await stat(filePath);
        
        items.push({
          filename: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime
        });
      }

      return items.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      throw new Error(`Failed to list cache: ${error.message}`);
    }
  }

  async getSize() {
    const items = await this.list();
    return items.reduce((total, item) => total + item.size, 0);
  }

  async clean(options = {}) {
    const items = await this.list();
    let cleaned = 0;
    let freedSpace = 0;

    if (options.all) {
      // Remove all cache items
      for (const item of items) {
        try {
          await unlink(item.path);
          cleaned++;
          freedSpace += item.size;
        } catch (error) {
          console.warn(chalk.yellow(`Failed to remove ${item.filename}: ${error.message}`));
        }
      }
    } else if (options.olderThan) {
      // Remove items older than specified date
      const cutoffDate = new Date(Date.now() - options.olderThan);
      
      for (const item of items) {
        if (item.modified < cutoffDate) {
          try {
            await unlink(item.path);
            cleaned++;
            freedSpace += item.size;
          } catch (error) {
            console.warn(chalk.yellow(`Failed to remove ${item.filename}: ${error.message}`));
          }
        }
      }
    }

    return {
      cleaned,
      freedSpace,
      totalItems: items.length
    };
  }

  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}