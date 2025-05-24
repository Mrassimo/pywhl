import got from 'got';

export class LicenseChecker {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.timeout = config.timeout || 15000;
    this.licenseApiUrl = 'https://api.github.com/licenses';
    this.spdxUrl = 'https://raw.githubusercontent.com/spdx/license-list-data/master/json/licenses.json';
    this.licenseCache = new Map();
  }

  async checkLicense(packageInfo) {
    if (!this.enabled) {
      return {
        checked: false,
        license: 'Unknown',
        compliant: true,
        details: {}
      };
    }

    const license = this.extractLicense(packageInfo);
    const details = await this.analyzeLicense(license);

    return {
      checked: true,
      license: license,
      normalized_license: details.spdx_id || license,
      compliant: details.osi_approved !== false,
      category: details.category,
      permissions: details.permissions || [],
      conditions: details.conditions || [],
      limitations: details.limitations || [],
      details
    };
  }

  extractLicense(packageInfo) {
    // Try multiple fields for license information
    const licenseFields = [
      packageInfo.info.license,
      packageInfo.info.license_expression,
      packageInfo.info.license_files
    ];

    for (const field of licenseFields) {
      if (field && typeof field === 'string' && field.trim()) {
        return field.trim();
      }
    }

    // Check classifiers for license information
    const classifiers = packageInfo.info.classifiers || [];
    for (const classifier of classifiers) {
      if (classifier.startsWith('License ::')) {
        const licensePart = classifier.split('::').pop().trim();
        if (licensePart && licensePart !== 'OSI Approved') {
          return licensePart;
        }
      }
    }

    return 'Unknown';
  }

  async analyzeLicense(license) {
    if (this.licenseCache.has(license)) {
      return this.licenseCache.get(license);
    }

    const analysis = {
      original: license,
      spdx_id: null,
      osi_approved: null,
      category: 'unknown',
      permissions: [],
      conditions: [],
      limitations: []
    };

    try {
      // Normalize license name
      const normalizedLicense = this.normalizeLicenseName(license);
      analysis.normalized = normalizedLicense;

      // Get SPDX information
      const spdxInfo = await this.getSPDXInfo(normalizedLicense);
      if (spdxInfo) {
        analysis.spdx_id = spdxInfo.licenseId;
        analysis.osi_approved = spdxInfo.isOsiApproved;
        analysis.category = this.categorizeLicense(spdxInfo.licenseId);
      }

      // Analyze license characteristics
      this.analyzeLicenseCharacteristics(normalizedLicense, analysis);

      this.licenseCache.set(license, analysis);
      return analysis;
    } catch (error) {
      console.warn(`License analysis failed for ${license}: ${error.message}`);
      this.licenseCache.set(license, analysis);
      return analysis;
    }
  }

  normalizeLicenseName(license) {
    if (!license || license === 'Unknown') return license;

    // Common license name mappings
    const mappings = {
      'MIT License': 'MIT',
      'Apache License 2.0': 'Apache-2.0',
      'Apache Software License': 'Apache-2.0',
      'BSD License': 'BSD-3-Clause',
      'BSD 3-Clause License': 'BSD-3-Clause',
      'BSD 2-Clause License': 'BSD-2-Clause',
      'GNU General Public License v3': 'GPL-3.0',
      'GNU General Public License v2': 'GPL-2.0',
      'GNU Lesser General Public License v3': 'LGPL-3.0',
      'GNU Lesser General Public License v2.1': 'LGPL-2.1',
      'Mozilla Public License 2.0': 'MPL-2.0',
      'ISC License': 'ISC'
    };

    return mappings[license] || license;
  }

  async getSPDXInfo(license) {
    try {
      // Try to get SPDX license information
      const response = await got.get(this.spdxUrl, {
        timeout: this.timeout
      }).json();

      if (response.licenses) {
        const licenseInfo = response.licenses.find(l => 
          l.licenseId === license || 
          l.name === license ||
          (l.seeAlso && l.seeAlso.some(url => url.includes(license)))
        );

        return licenseInfo;
      }
    } catch (error) {
      // Fallback to built-in license categorization
      return this.getBuiltinLicenseInfo(license);
    }

    return null;
  }

  getBuiltinLicenseInfo(license) {
    const builtinLicenses = {
      'MIT': {
        licenseId: 'MIT',
        isOsiApproved: true,
        name: 'MIT License'
      },
      'Apache-2.0': {
        licenseId: 'Apache-2.0',
        isOsiApproved: true,
        name: 'Apache License 2.0'
      },
      'BSD-3-Clause': {
        licenseId: 'BSD-3-Clause',
        isOsiApproved: true,
        name: 'BSD 3-Clause License'
      },
      'BSD-2-Clause': {
        licenseId: 'BSD-2-Clause',
        isOsiApproved: true,
        name: 'BSD 2-Clause License'
      },
      'GPL-3.0': {
        licenseId: 'GPL-3.0',
        isOsiApproved: true,
        name: 'GNU General Public License v3.0'
      },
      'LGPL-3.0': {
        licenseId: 'LGPL-3.0',
        isOsiApproved: true,
        name: 'GNU Lesser General Public License v3.0'
      },
      'ISC': {
        licenseId: 'ISC',
        isOsiApproved: true,
        name: 'ISC License'
      }
    };

    return builtinLicenses[license] || null;
  }

  categorizeLicense(spdxId) {
    if (!spdxId) return 'unknown';

    const categories = {
      permissive: ['MIT', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', 'ISC'],
      copyleft_weak: ['LGPL-2.1', 'LGPL-3.0', 'MPL-2.0'],
      copyleft_strong: ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0'],
      proprietary: ['Commercial', 'Proprietary']
    };

    for (const [category, licenses] of Object.entries(categories)) {
      if (licenses.includes(spdxId)) {
        return category;
      }
    }

    return 'other';
  }

  analyzeLicenseCharacteristics(license, analysis) {
    const characteristics = {
      'MIT': {
        permissions: ['commercial-use', 'distribution', 'modification', 'private-use'],
        conditions: ['include-copyright'],
        limitations: ['liability', 'warranty']
      },
      'Apache-2.0': {
        permissions: ['commercial-use', 'distribution', 'modification', 'patent-use', 'private-use'],
        conditions: ['include-copyright', 'document-changes'],
        limitations: ['liability', 'trademark-use', 'warranty']
      },
      'GPL-3.0': {
        permissions: ['commercial-use', 'distribution', 'modification', 'patent-use', 'private-use'],
        conditions: ['disclose-source', 'include-copyright', 'same-license'],
        limitations: ['liability', 'warranty']
      },
      'BSD-3-Clause': {
        permissions: ['commercial-use', 'distribution', 'modification', 'private-use'],
        conditions: ['include-copyright', 'no-endorsement'],
        limitations: ['liability', 'warranty']
      }
    };

    const chars = characteristics[license];
    if (chars) {
      analysis.permissions = chars.permissions;
      analysis.conditions = chars.conditions;
      analysis.limitations = chars.limitations;
    }
  }

  async generateComplianceReport(packages) {
    const report = {
      timestamp: new Date().toISOString(),
      total_packages: packages.length,
      compliance_summary: {
        compliant: 0,
        non_compliant: 0,
        unknown: 0
      },
      license_breakdown: {},
      category_breakdown: {
        permissive: 0,
        copyleft_weak: 0,
        copyleft_strong: 0,
        proprietary: 0,
        unknown: 0,
        other: 0
      },
      packages: []
    };

    for (const pkg of packages) {
      const licenseCheck = await this.checkLicense(pkg.packageInfo);
      
      // Update compliance summary
      if (licenseCheck.license === 'Unknown') {
        report.compliance_summary.unknown++;
      } else if (licenseCheck.compliant) {
        report.compliance_summary.compliant++;
      } else {
        report.compliance_summary.non_compliant++;
      }

      // Update license breakdown
      const license = licenseCheck.normalized_license || licenseCheck.license;
      report.license_breakdown[license] = (report.license_breakdown[license] || 0) + 1;

      // Update category breakdown
      const category = licenseCheck.category || 'unknown';
      report.category_breakdown[category]++;

      report.packages.push({
        name: pkg.name,
        version: pkg.version,
        license: licenseCheck.license,
        normalized_license: licenseCheck.normalized_license,
        category: licenseCheck.category,
        compliant: licenseCheck.compliant,
        osi_approved: licenseCheck.details.osi_approved
      });
    }

    return report;
  }

  async checkLicenseCompatibility(licenses) {
    const compatibility = {
      compatible: true,
      conflicts: [],
      recommendations: []
    };

    // Check for common license conflicts
    const hasGPL = licenses.some(l => l.includes('GPL') && !l.includes('LGPL'));
    const hasProprietary = licenses.some(l => ['Commercial', 'Proprietary'].includes(l));
    const hasMIT = licenses.includes('MIT');
    const hasApache = licenses.includes('Apache-2.0');

    if (hasGPL && hasProprietary) {
      compatibility.compatible = false;
      compatibility.conflicts.push({
        type: 'gpl_proprietary_conflict',
        message: 'GPL licensed packages cannot be combined with proprietary licenses',
        severity: 'critical'
      });
    }

    if (hasGPL && hasApache) {
      compatibility.conflicts.push({
        type: 'gpl_apache_warning',
        message: 'GPL and Apache 2.0 licenses may have compatibility issues',
        severity: 'warning'
      });
    }

    if (hasMIT || hasApache) {
      compatibility.recommendations.push({
        message: 'Permissive licenses detected - consider standardizing on one for consistency'
      });
    }

    return compatibility;
  }
}