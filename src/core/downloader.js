import got from 'got';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import ora from 'ora';
import chalk from 'chalk';
import cliProgress from 'cli-progress';

export class Downloader {
  constructor(options = {}) {
    this.timeout = options.timeout || 60000; // 60 seconds
    this.retries = options.retries || 3;
  }

  async downloadWheel(url, outputPath, options = {}) {
    const useProgressBar = options.progressBar !== false && !options.silent;
    let progressBar = null;
    let spinner = null;
    
    if (!useProgressBar && !options.silent) {
      spinner = ora(`Downloading ${chalk.cyan(options.filename || 'wheel')}...`).start();
    }
    
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
      let progressStarted = false;

      downloadStream.on('downloadProgress', (progress) => {
        downloadedBytes = progress.transferred;
        totalBytes = progress.total || 0;
        
        if (useProgressBar && totalBytes > 0 && !progressStarted) {
          // Initialize progress bar when we know the total size
          progressStarted = true;
          progressBar = new cliProgress.SingleBar({
            format: `${chalk.cyan(options.filename || 'wheel')} |${chalk.cyan('{bar}')}| {percentage}% | {value}/{total} bytes | ETA: {eta}s`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
          });
          progressBar.start(totalBytes, 0);
        }
        
        if (progressBar) {
          progressBar.update(downloadedBytes);
        } else if (spinner && totalBytes > 0) {
          const percent = Math.round((downloadedBytes / totalBytes) * 100);
          spinner.text = `Downloading ${chalk.cyan(options.filename || 'wheel')}... ${percent}%`;
        }
      });

      await pipeline(
        downloadStream,
        createWriteStream(outputPath)
      );

      if (progressBar) {
        progressBar.stop();
        console.log(chalk.green(`✓ Downloaded ${options.filename || 'wheel'}`));
      } else if (spinner) {
        spinner.succeed(`Downloaded ${chalk.green(options.filename || 'wheel')}`);
      }

      return {
        path: outputPath,
        size: downloadedBytes,
        url
      };
    } catch (error) {
      if (progressBar) {
        progressBar.stop();
      }
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