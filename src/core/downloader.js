import got from 'got';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import ora from 'ora';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import pLimit from 'p-limit';

export class Downloader {
  constructor(options = {}) {
    this.timeout = options.timeout || 60000; // 60 seconds
    this.retries = options.retries || 3;
    this.concurrency = options.concurrency || 3; // Default 3 parallel downloads
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
    const concurrency = options.concurrency || this.concurrency;

    console.log(chalk.blue(`\nDownloading ${downloads.length} wheel(s)...`));
    
    if (concurrency > 1) {
      console.log(chalk.gray(`(Using ${concurrency} parallel downloads)\n`));
    }

    // Create a limiter for parallel downloads
    const limit = pLimit(concurrency);

    // Create progress tracking for parallel downloads
    let completed = 0;
    const total = downloads.length;
    
    // Use multi-bar for parallel downloads if not silent
    const multiBar = !options.silent && concurrency > 1 ? 
      new cliProgress.MultiBar({
        clearOnComplete: false,
        hideCursor: true,
        format: '{filename} |{bar}| {percentage}% | {value}/{total} bytes'
      }, cliProgress.Presets.shades_grey) : null;

    // Create download tasks
    const downloadTasks = downloads.map(download => 
      limit(async () => {
        try {
          const progressBar = multiBar ? 
            multiBar.create(100, 0, { filename: download.filename.padEnd(40) }) : null;

          const result = await this.downloadWheel(
            download.url,
            download.outputPath,
            { 
              filename: download.filename,
              silent: options.silent || !!multiBar,
              progressBar: false, // We handle progress separately for parallel
              onProgress: multiBar ? (progress) => {
                if (progressBar && progress.total) {
                  progressBar.setTotal(progress.total);
                  progressBar.update(progress.transferred);
                }
              } : null
            }
          );

          completed++;
          if (!multiBar && !options.silent) {
            console.log(chalk.green(`✓ [${completed}/${total}] Downloaded ${download.filename}`));
          }

          results.push(result);
        } catch (error) {
          completed++;
          errors.push({
            filename: download.filename,
            error: error.message
          });
          
          if (!options.silent) {
            console.log(chalk.red(`✗ [${completed}/${total}] Failed: ${download.filename}`));
          }
        }
      })
    );

    // Execute all downloads
    await Promise.all(downloadTasks);

    if (multiBar) {
      multiBar.stop();
    }

    return { results, errors };
  }

  // Update downloadWheel to support progress callback
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
        
        // Call custom progress handler if provided
        if (options.onProgress) {
          options.onProgress({
            transferred: downloadedBytes,
            total: totalBytes,
            percent: totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0
          });
        }
        
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
        if (!options.onProgress) { // Don't log if using custom progress
          console.log(chalk.green(`✓ Downloaded ${options.filename || 'wheel'}`));
        }
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
}