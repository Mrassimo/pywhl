import got from 'got';
import semver from 'semver';
import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

export class SecurityScanner {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.ossIndexApiUrl = 'https://ossindex.sonatype.org/api/v3/component-report';
    this.pyUpApiUrl = 'https://pyup.io/api/v1/safety';
    this.timeout = config.timeout || 30000;
    this.vulnerabilityThreshold = config.vulnerabilityThreshold || 'medium';
    this.databases = config.databases || ['ossindex', 'safety'];
  }

  async scanPackage(packageName, version, wheelPath = null) {
    if (!this.enabled) {
      return {
        scanned: false,
        vulnerabilities: [],
        safe: true
      };
    }

    const startTime = Date.now();
    const results = {
      package_name: packageName,
      version,
      scanned: true,
      scan_duration: 0,
      vulnerabilities: [],
      safe: true,
      databases_checked: []
    };

    try {
      // Scan using multiple databases
      const scanPromises = [];

      if (this.databases.includes('ossindex')) {
        scanPromises.push(this.scanWithOSSIndex(packageName, version));
      }

      if (this.databases.includes('safety')) {
        scanPromises.push(this.scanWithSafety(packageName, version));
      }

      if (wheelPath) {
        scanPromises.push(this.scanWheelFile(wheelPath));
      }

      const scanResults = await Promise.allSettled(scanPromises);
      
      // Combine results
      for (const result of scanResults) {
        if (result.status === 'fulfilled' && result.value) {
          results.vulnerabilities.push(...result.value.vulnerabilities);
          results.databases_checked.push(result.value.database);
        }
      }

      // Deduplicate vulnerabilities
      results.vulnerabilities = this.deduplicateVulnerabilities(results.vulnerabilities);
      
      // Determine if package is safe based on threshold
      results.safe = this.isPackageSafe(results.vulnerabilities);
      
      results.scan_duration = Date.now() - startTime;
      
      return results;
    } catch (error) {
      results.scan_duration = Date.now() - startTime;
      results.error = error.message;
      return results;
    }
  }

  async scanWithOSSIndex(packageName, version) {
    try {
      const purl = `pkg:pypi/${packageName}@${version}`;
      
      const response = await got.post(this.ossIndexApiUrl, {
        json: {
          coordinates: [purl]
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'pywhl-cli/1.0',
          'Content-Type': 'application/json'
        }
      }).json();

      const vulnerabilities = [];
      
      if (response && response.length > 0) {
        const component = response[0];
        if (component.vulnerabilities && component.vulnerabilities.length > 0) {
          for (const vuln of component.vulnerabilities) {
            vulnerabilities.push({
              id: vuln.id,
              title: vuln.title,
              description: vuln.description,
              severity: this.mapOSSIndexSeverity(vuln.cvssScore),
              cvss_score: vuln.cvssScore,
              cve: vuln.cve,
              source: 'ossindex',
              references: vuln.reference ? [vuln.reference] : []
            });
          }
        }
      }

      return {
        database: 'ossindex',
        vulnerabilities
      };
    } catch (error) {
      console.warn(`OSS Index scan failed: ${error.message}`);
      return {
        database: 'ossindex',
        vulnerabilities: [],
        error: error.message
      };
    }
  }

  async scanWithSafety(packageName, version) {
    try {
      // Safety DB API endpoint (simplified - in production you'd use their proper API)
      const response = await got.get(`${this.pyUpApiUrl}/packages/${packageName}/`, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'pywhl-cli/1.0'
        }
      }).json();

      const vulnerabilities = [];
      
      if (response.vulnerabilities) {
        for (const vuln of response.vulnerabilities) {
          // Check if vulnerability affects this version
          if (this.versionAffected(version, vuln.specs)) {
            vulnerabilities.push({
              id: vuln.id,
              title: vuln.advisory,
              description: vuln.advisory,
              severity: 'medium', // Safety doesn't provide CVSS scores
              affected_versions: vuln.specs,
              source: 'safety',
              references: []
            });
          }
        }
      }

      return {
        database: 'safety',
        vulnerabilities
      };
    } catch (error) {
      // Safety API might not be publicly available, so fail gracefully
      return {
        database: 'safety',
        vulnerabilities: [],
        error: 'Safety API not available'
      };
    }
  }

  async scanWheelFile(wheelPath) {
    try {
      // Basic file-based security checks
      const vulnerabilities = [];
      
      // Check file hash against known malicious files (simplified)
      const fileContent = await readFile(wheelPath);
      const fileHash = createHash('sha256').update(fileContent).digest('hex');
      
      // In a real implementation, you'd check against known malicious hashes
      // For now, just check file size (unusually large wheels might be suspicious)
      const fileSizeMB = fileContent.length / (1024 * 1024);
      
      if (fileSizeMB > 500) { // Arbitrary threshold
        vulnerabilities.push({
          id: 'LARGE_WHEEL',
          title: 'Unusually large wheel file',
          description: `Wheel file is ${fileSizeMB.toFixed(1)}MB, which is unusually large`,
          severity: 'low',
          source: 'file_analysis',
          file_hash: fileHash
        });
      }

      return {
        database: 'file_analysis',
        vulnerabilities
      };
    } catch (error) {
      return {
        database: 'file_analysis',
        vulnerabilities: [],
        error: error.message
      };
    }
  }

  mapOSSIndexSeverity(cvssScore) {
    if (!cvssScore) return 'unknown';
    if (cvssScore >= 9.0) return 'critical';
    if (cvssScore >= 7.0) return 'high';
    if (cvssScore >= 4.0) return 'medium';
    return 'low';
  }

  versionAffected(currentVersion, specs) {
    if (!specs || specs.length === 0) return true;
    
    try {
      for (const spec of specs) {
        if (semver.satisfies(currentVersion, spec)) {
          return true;
        }
      }
      return false;
    } catch (error) {
      // If version parsing fails, assume it's affected
      return true;
    }
  }

  deduplicateVulnerabilities(vulnerabilities) {
    const seen = new Set();
    return vulnerabilities.filter(vuln => {
      const key = `${vuln.id}-${vuln.title}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  isPackageSafe(vulnerabilities) {
    const severityLevels = ['low', 'medium', 'high', 'critical'];
    const thresholdIndex = severityLevels.indexOf(this.vulnerabilityThreshold);
    
    for (const vuln of vulnerabilities) {
      const vulnIndex = severityLevels.indexOf(vuln.severity);
      if (vulnIndex >= thresholdIndex) {
        return false;
      }
    }
    
    return true;
  }

  async generateSecurityReport(scanResults) {
    const report = {
      timestamp: new Date().toISOString(),
      total_packages: scanResults.length,
      safe_packages: 0,
      vulnerable_packages: 0,
      total_vulnerabilities: 0,
      severity_breakdown: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      packages: []
    };

    for (const result of scanResults) {
      if (result.safe) {
        report.safe_packages++;
      } else {
        report.vulnerable_packages++;
      }

      report.total_vulnerabilities += result.vulnerabilities.length;

      for (const vuln of result.vulnerabilities) {
        if (report.severity_breakdown[vuln.severity] !== undefined) {
          report.severity_breakdown[vuln.severity]++;
        }
      }

      report.packages.push({
        name: result.package_name,
        version: result.version,
        safe: result.safe,
        vulnerability_count: result.vulnerabilities.length,
        highest_severity: this.getHighestSeverity(result.vulnerabilities)
      });
    }

    return report;
  }

  getHighestSeverity(vulnerabilities) {
    const severityOrder = ['critical', 'high', 'medium', 'low', 'unknown'];
    
    for (const severity of severityOrder) {
      if (vulnerabilities.some(v => v.severity === severity)) {
        return severity;
      }
    }
    
    return 'none';
  }
}