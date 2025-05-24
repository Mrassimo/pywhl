import got from 'got';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';

export class Downloader {
  constructor(options = {}) {
    this.timeout = options.timeout || 60000; // 60 seconds
    this.retries = options.retries || 3;
  }

  async downloadWheel(url, outputPath, options = {}) {
    const spinner = options.silent ? null : ora(`Downloading ${chalk.cyan(options.filename || 'wheel')}...`).start();
    
    try {
      const downloadStream = got.stream(url, {
        timeout: {
          request: this.timeout
        },
        retry: {
          limit: this.retries
        }
      });

      let downloadedBytes = 0;
      let totalBytes = 0;

      downloadStream.on('downloadProgress', (progress) => {
        downloadedBytes = progress.transferred;
        totalBytes = progress.total || 0;
        
        if (spinner && totalBytes > 0) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100);
          spinner.text = `Downloading ${chalk.cyan(options.filename || 'wheel')}... ${percent}%`;
        }
      });

      await pipeline(
        downloadStream,
        createWriteStream(outputPath)
      );

      if (spinner) {
        spinner.succeed(`Downloaded ${chalk.green(options.filename || 'wheel')}`);
      }

      return {
        path: outputPath,
        size: downloadedBytes,
        url
      };
    } catch (error) {
      if (spinner) {
        spinner.fail(`Failed to download ${chalk.red(options.filename || 'wheel')}`);
      }
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  async downloadMultiple(downloads, options = {}) {
    const results = [];
    const errors = [];

    console.log(chalk.blue(`\nDownloading ${downloads.length} wheel(s)...\n`));

    for (const download of downloads) {
      try {
        const result = await this.downloadWheel(
          download.url,
          download.outputPath,
          { 
            filename: download.filename,
            silent: options.silent 
          }
        );
        results.push(result);
      } catch (error) {
        errors.push({
          filename: download.filename,
          error: error.message
        });
      }
    }

    return { results, errors };
  }
}