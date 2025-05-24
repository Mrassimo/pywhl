import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { hostname, userInfo } from 'os';

export class AuditLogger {
  constructor(config = {}) {
    this.logDir = config.logDir || join(process.env.HOME || process.env.USERPROFILE, '.pywhl', 'audit');
    this.enabled = config.enabled !== false;
    this.maxFileSize = config.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.retentionDays = config.retentionDays || 90;
    this.hostname = hostname();
    this.user = this.getCurrentUser();
  }

  getCurrentUser() {
    try {
      const user = userInfo();
      return {
        username: user.username,
        uid: user.uid,
        gid: user.gid,
        homedir: user.homedir
      };
    } catch (error) {
      return {
        username: process.env.USER || process.env.USERNAME || 'unknown',
        uid: null,
        gid: null,
        homedir: process.env.HOME || process.env.USERPROFILE || 'unknown'
      };
    }
  }

  async ensureLogDirectory() {
    if (!existsSync(this.logDir)) {
      await mkdir(this.logDir, { recursive: true });
    }
  }

  async log(action, details = {}) {
    if (!this.enabled) return;

    try {
      await this.ensureLogDirectory();

      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        user: this.user,
        hostname: this.hostname,
        pid: process.pid,
        session_id: this.getSessionId(),
        details,
        version: this.getToolVersion()
      };

      const logFile = join(this.logDir, `audit-${this.getDateString()}.jsonl`);
      const logLine = JSON.stringify(logEntry) + '\n';

      await appendFile(logFile, logLine, 'utf8');
    } catch (error) {
      // Fail silently to not interrupt normal operations
      console.warn(`Audit logging failed: ${error.message}`);
    }
  }

  getSessionId() {
    if (!this._sessionId) {
      this._sessionId = `pywhl-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    return this._sessionId;
  }

  getDateString() {
    return new Date().toISOString().split('T')[0];
  }

  getToolVersion() {
    try {
      // Try to read version from package.json
      const packageJson = JSON.parse(readFileSync(
        join(process.cwd(), 'package.json'), 'utf8'
      ));
      return packageJson.version;
    } catch {
      return 'unknown';
    }
  }

  // Audit event methods
  async logPackageDownload(packageName, version, source, platform, pythonVersion, size) {
    await this.log('package_download', {
      package_name: packageName,
      version,
      source,
      platform,
      python_version: pythonVersion,
      size_bytes: size,
      type: 'wheel'
    });
  }

  async logPackageSearch(query, results_count, source) {
    await this.log('package_search', {
      query,
      results_count,
      source
    });
  }

  async logBundleCreation(packages, output_file, platform, python_version, bundle_size) {
    await this.log('bundle_creation', {
      packages,
      output_file,
      platform,
      python_version,
      bundle_size,
      package_count: packages.length
    });
  }

  async logCacheAccess(action, package_name, version, cache_hit) {
    await this.log('cache_access', {
      cache_action: action,
      package_name,
      version,
      cache_hit
    });
  }

  async logRepositoryAccess(repository_name, action, package_name) {
    await this.log('repository_access', {
      repository_name,
      repo_action: action,
      package_name
    });
  }

  async logSecurityScan(package_name, version, vulnerabilities_found, scan_duration) {
    await this.log('security_scan', {
      package_name,
      version,
      vulnerabilities_found,
      scan_duration_ms: scan_duration
    });
  }

  async logPolicyViolation(policy_type, package_name, version, violation_details) {
    await this.log('policy_violation', {
      policy_type,
      package_name,
      version,
      violation_details,
      severity: 'warning'
    });
  }

  async logAdminAction(admin_user, action, target, details) {
    await this.log('admin_action', {
      admin_user,
      admin_action: action,
      target,
      details
    });
  }

  async logLicenseCheck(package_name, version, license, compliance_status) {
    await this.log('license_check', {
      package_name,
      version,
      license,
      compliance_status
    });
  }

  // Utility methods for audit log management
  async rotateLogs() {
    try {
      const { readdir, stat, unlink } = await import('fs/promises');
      const files = await readdir(this.logDir);
      const auditFiles = files.filter(f => f.startsWith('audit-') && f.endsWith('.jsonl'));
      
      for (const file of auditFiles) {
        const filePath = join(this.logDir, file);
        const stats = await stat(filePath);
        
        // Delete files older than retention period
        const ageInDays = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > this.retentionDays) {
          await unlink(filePath);
        }
      }
    } catch (error) {
      console.warn(`Log rotation failed: ${error.message}`);
    }
  }

  async generateReport(startDate, endDate) {
    try {
      const { readdir, readFile: readFileAsync } = await import('fs/promises');
      const files = await readdir(this.logDir);
      const auditFiles = files.filter(f => f.startsWith('audit-') && f.endsWith('.jsonl'));
      
      const report = {
        period: { start: startDate, end: endDate },
        summary: {},
        actions: [],
        users: new Set(),
        packages: new Set()
      };

      for (const file of auditFiles) {
        const content = await readFileAsync(join(this.logDir, file), 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            const entryDate = new Date(entry.timestamp);
            
            if (entryDate >= new Date(startDate) && entryDate <= new Date(endDate)) {
              report.actions.push(entry);
              report.users.add(entry.user.username);
              
              if (entry.details.package_name) {
                report.packages.add(entry.details.package_name);
              }
              
              report.summary[entry.action] = (report.summary[entry.action] || 0) + 1;
            }
          } catch (parseError) {
            // Skip malformed lines
          }
        }
      }

      report.users = Array.from(report.users);
      report.packages = Array.from(report.packages);
      
      return report;
    } catch (error) {
      throw new Error(`Failed to generate audit report: ${error.message}`);
    }
  }
}