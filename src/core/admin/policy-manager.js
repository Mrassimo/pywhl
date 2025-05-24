import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import yaml from 'yaml';

export class PolicyManager {
  constructor(config = {}) {
    this.configDir = config.configDir || join(process.env.HOME || process.env.USERPROFILE, '.pywhl');
    this.policyFile = join(this.configDir, 'enterprise-policy.yml');
    this.policies = null;
  }

  async loadPolicies() {
    try {
      if (!existsSync(this.policyFile)) {
        await this.createDefaultPolicy();
      }

      const content = await readFile(this.policyFile, 'utf8');
      this.policies = yaml.parse(content);
      return this.policies;
    } catch (error) {
      throw new Error(`Failed to load policies: ${error.message}`);
    }
  }

  async savePolicies() {
    try {
      if (!existsSync(this.configDir)) {
        await mkdir(this.configDir, { recursive: true });
      }

      const content = yaml.stringify(this.policies);
      await writeFile(this.policyFile, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save policies: ${error.message}`);
    }
  }

  async createDefaultPolicy() {
    this.policies = {
      version: '1.0',
      metadata: {
        created_at: new Date().toISOString(),
        description: 'Default enterprise policy for Pywhl CLI'
      },
      security: {
        vulnerability_scanning: {
          enabled: true,
          block_on_critical: true,
          block_on_high: false,
          databases: ['ossindex', 'safety']
        },
        allowed_sources: ['pypi.org'],
        blocked_packages: [],
        require_approval: false
      },
      licensing: {
        enabled: true,
        allowed_licenses: [
          'MIT',
          'BSD-2-Clause',
          'BSD-3-Clause',
          'Apache-2.0',
          'ISC',
          'LGPL-2.1',
          'LGPL-3.0'
        ],
        blocked_licenses: [
          'GPL-3.0',
          'AGPL-3.0'
        ],
        require_license_approval: false
      },
      package_approval: {
        enabled: false,
        auto_approve_trusted_publishers: true,
        approval_workflow: 'simple',
        approvers: []
      },
      download_limits: {
        max_package_size: '1GB',
        max_daily_downloads: 1000,
        max_concurrent_downloads: 10
      },
      audit: {
        enabled: true,
        retention_days: 90,
        detailed_logging: true
      },
      users: {
        admin_users: [],
        restricted_users: [],
        default_permissions: {
          download: true,
          bundle: true,
          search: true,
          cache_manage: false,
          admin: false
        }
      }
    };

    await this.savePolicies();
  }

  async validatePackageDownload(packageName, version, userInfo = {}) {
    if (!this.policies) {
      await this.loadPolicies();
    }

    const violations = [];

    // Check blocked packages
    if (this.policies.security.blocked_packages.includes(packageName)) {
      violations.push({
        type: 'blocked_package',
        message: `Package ${packageName} is blocked by security policy`,
        severity: 'critical'
      });
    }

    // Check user permissions
    const userPermissions = this.getUserPermissions(userInfo.username);
    if (!userPermissions.download) {
      violations.push({
        type: 'permission_denied',
        message: 'User does not have download permissions',
        severity: 'critical'
      });
    }

    // Check if approval is required
    if (this.policies.package_approval.enabled && !this.isPackageApproved(packageName, version)) {
      violations.push({
        type: 'approval_required',
        message: `Package ${packageName}@${version} requires approval before download`,
        severity: 'high'
      });
    }

    return {
      allowed: violations.length === 0,
      violations
    };
  }

  async validateSecurityScan(scanResult) {
    if (!this.policies) {
      await this.loadPolicies();
    }

    const violations = [];
    const securityPolicy = this.policies.security.vulnerability_scanning;

    if (!securityPolicy.enabled) {
      return { allowed: true, violations: [] };
    }

    // Check for critical vulnerabilities
    const criticalVulns = scanResult.vulnerabilities.filter(v => v.severity === 'critical');
    if (criticalVulns.length > 0 && securityPolicy.block_on_critical) {
      violations.push({
        type: 'critical_vulnerability',
        message: `Package has ${criticalVulns.length} critical vulnerabilities`,
        severity: 'critical',
        vulnerabilities: criticalVulns
      });
    }

    // Check for high vulnerabilities
    const highVulns = scanResult.vulnerabilities.filter(v => v.severity === 'high');
    if (highVulns.length > 0 && securityPolicy.block_on_high) {
      violations.push({
        type: 'high_vulnerability',
        message: `Package has ${highVulns.length} high-severity vulnerabilities`,
        severity: 'high',
        vulnerabilities: highVulns
      });
    }

    return {
      allowed: violations.length === 0,
      violations
    };
  }

  async validateLicense(packageInfo) {
    if (!this.policies) {
      await this.loadPolicies();
    }

    const violations = [];
    const licensePolicy = this.policies.licensing;

    if (!licensePolicy.enabled) {
      return { allowed: true, violations: [] };
    }

    const packageLicense = packageInfo.info.license || 'Unknown';

    // Check blocked licenses
    if (licensePolicy.blocked_licenses.includes(packageLicense)) {
      violations.push({
        type: 'blocked_license',
        message: `License ${packageLicense} is not allowed by policy`,
        severity: 'critical',
        license: packageLicense
      });
    }

    // Check if license is in allowed list (if specified)
    if (licensePolicy.allowed_licenses.length > 0) {
      if (!licensePolicy.allowed_licenses.includes(packageLicense)) {
        violations.push({
          type: 'unapproved_license',
          message: `License ${packageLicense} is not in the approved list`,
          severity: 'medium',
          license: packageLicense
        });
      }
    }

    return {
      allowed: violations.length === 0,
      violations
    };
  }

  getUserPermissions(username) {
    if (!username) {
      return this.policies.users.default_permissions;
    }

    // Check if user is admin
    if (this.policies.users.admin_users.includes(username)) {
      return {
        download: true,
        bundle: true,
        search: true,
        cache_manage: true,
        admin: true
      };
    }

    // Check if user is restricted
    if (this.policies.users.restricted_users.includes(username)) {
      return {
        download: false,
        bundle: false,
        search: true,
        cache_manage: false,
        admin: false
      };
    }

    return this.policies.users.default_permissions;
  }

  isPackageApproved(packageName, version) {
    // In a real implementation, this would check against an approval database
    // For now, return true for demo purposes
    return true;
  }

  async addBlockedPackage(packageName, reason, adminUser) {
    if (!this.policies) {
      await this.loadPolicies();
    }

    if (!this.policies.security.blocked_packages.includes(packageName)) {
      this.policies.security.blocked_packages.push(packageName);
      await this.savePolicies();
    }

    return {
      success: true,
      message: `Package ${packageName} added to blocked list`,
      blocked_by: adminUser,
      timestamp: new Date().toISOString()
    };
  }

  async removeBlockedPackage(packageName, adminUser) {
    if (!this.policies) {
      await this.loadPolicies();
    }

    const index = this.policies.security.blocked_packages.indexOf(packageName);
    if (index > -1) {
      this.policies.security.blocked_packages.splice(index, 1);
      await this.savePolicies();
    }

    return {
      success: true,
      message: `Package ${packageName} removed from blocked list`,
      unblocked_by: adminUser,
      timestamp: new Date().toISOString()
    };
  }

  async addAdminUser(username, adminUser) {
    if (!this.policies) {
      await this.loadPolicies();
    }

    if (!this.policies.users.admin_users.includes(username)) {
      this.policies.users.admin_users.push(username);
      await this.savePolicies();
    }

    return {
      success: true,
      message: `User ${username} granted admin privileges`,
      granted_by: adminUser,
      timestamp: new Date().toISOString()
    };
  }

  async removeAdminUser(username, adminUser) {
    if (!this.policies) {
      await this.loadPolicies();
    }

    const index = this.policies.users.admin_users.indexOf(username);
    if (index > -1) {
      this.policies.users.admin_users.splice(index, 1);
      await this.savePolicies();
    }

    return {
      success: true,
      message: `Admin privileges revoked for user ${username}`,
      revoked_by: adminUser,
      timestamp: new Date().toISOString()
    };
  }

  async updatePolicy(section, updates, adminUser) {
    if (!this.policies) {
      await this.loadPolicies();
    }

    if (this.policies[section]) {
      Object.assign(this.policies[section], updates);
      await this.savePolicies();

      return {
        success: true,
        message: `Policy section ${section} updated`,
        updated_by: adminUser,
        timestamp: new Date().toISOString()
      };
    }

    throw new Error(`Unknown policy section: ${section}`);
  }

  async getPolicyStatus() {
    if (!this.policies) {
      await this.loadPolicies();
    }

    return {
      version: this.policies.version,
      last_modified: this.policies.metadata.created_at,
      security_enabled: this.policies.security.vulnerability_scanning.enabled,
      licensing_enabled: this.policies.licensing.enabled,
      approval_required: this.policies.package_approval.enabled,
      admin_count: this.policies.users.admin_users.length,
      blocked_packages: this.policies.security.blocked_packages.length
    };
  }
}