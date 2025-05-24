import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import inquirer from 'inquirer';
import { AuditLogger } from '../core/audit/audit-logger.js';
import { PolicyManager } from '../core/admin/policy-manager.js';
import { SecurityScanner } from '../core/security/security-scanner.js';
import { LicenseChecker } from '../core/compliance/license-checker.js';
import { writeFile } from 'fs/promises';

export const adminCommand = new Command('admin')
  .description('Enterprise administration and policy management')
  .addCommand(createPolicyCommand())
  .addCommand(createUsersCommand())
  .addCommand(createAuditCommand())
  .addCommand(createSecurityCommand())
  .addCommand(createComplianceCommand());

function createPolicyCommand() {
  return new Command('policy')
    .description('Manage enterprise policies')
    .addCommand(new Command('show')
      .description('Show current policy status')
      .action(showPolicyStatus))
    .addCommand(new Command('init')
      .description('Initialize default enterprise policy')
      .action(initializePolicy))
    .addCommand(new Command('block-package')
      .description('Block a package from being downloaded')
      .argument('<package>', 'Package name to block')
      .option('-r, --reason <reason>', 'Reason for blocking')
      .action(blockPackage))
    .addCommand(new Command('unblock-package')
      .description('Unblock a previously blocked package')
      .argument('<package>', 'Package name to unblock')
      .action(unblockPackage))
    .addCommand(new Command('update')
      .description('Update policy configuration interactively')
      .action(updatePolicyInteractive));
}

function createUsersCommand() {
  return new Command('users')
    .description('Manage user permissions')
    .addCommand(new Command('list')
      .description('List all users and their permissions')
      .action(listUsers))
    .addCommand(new Command('grant-admin')
      .description('Grant admin privileges to a user')
      .argument('<username>', 'Username to grant admin privileges')
      .action(grantAdminPrivileges))
    .addCommand(new Command('revoke-admin')
      .description('Revoke admin privileges from a user')
      .argument('<username>', 'Username to revoke admin privileges')
      .action(revokeAdminPrivileges));
}

function createAuditCommand() {
  return new Command('audit')
    .description('Audit logging and reporting')
    .addCommand(new Command('report')
      .description('Generate audit report')
      .option('-s, --start <date>', 'Start date (YYYY-MM-DD)', getDefaultStartDate())
      .option('-e, --end <date>', 'End date (YYYY-MM-DD)', getDefaultEndDate())
      .option('-o, --output <file>', 'Output file (default: audit-report.json)')
      .action(generateAuditReport))
    .addCommand(new Command('rotate')
      .description('Rotate audit logs')
      .action(rotateAuditLogs));
}

function createSecurityCommand() {
  return new Command('security')
    .description('Security scanning and management')
    .addCommand(new Command('scan')
      .description('Scan packages for vulnerabilities')
      .argument('[packages...]', 'Package names to scan')
      .option('-a, --all-cached', 'Scan all cached packages')
      .option('-o, --output <file>', 'Output report file')
      .action(scanPackages));
}

function createComplianceCommand() {
  return new Command('compliance')
    .description('License compliance management')
    .addCommand(new Command('check')
      .description('Check license compliance')
      .argument('[packages...]', 'Package names to check')
      .option('-a, --all-cached', 'Check all cached packages')
      .option('-o, --output <file>', 'Output report file')
      .action(checkCompliance));
}

async function showPolicyStatus() {
  try {
    console.log(chalk.blue('📋 Enterprise Policy Status\n'));
    
    const policyManager = new PolicyManager();
    const status = await policyManager.getPolicyStatus();
    
    const table = new Table({
      head: ['Setting', 'Value'],
      colWidths: [25, 30]
    });
    
    table.push(
      ['Policy Version', status.version],
      ['Security Scanning', status.security_enabled ? chalk.green('Enabled') : chalk.red('Disabled')],
      ['License Checking', status.licensing_enabled ? chalk.green('Enabled') : chalk.red('Disabled')],
      ['Approval Required', status.approval_required ? chalk.yellow('Yes') : chalk.green('No')],
      ['Admin Users', status.admin_count.toString()],
      ['Blocked Packages', status.blocked_packages.toString()]
    );
    
    console.log(table.toString());
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function initializePolicy() {
  try {
    console.log(chalk.blue('🔧 Initializing Enterprise Policy...\n'));
    
    const policyManager = new PolicyManager();
    await policyManager.createDefaultPolicy();
    
    console.log(chalk.green('✓ Enterprise policy initialized successfully'));
    console.log(chalk.cyan('\nUse "pywhl admin policy show" to view current settings'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function blockPackage(packageName, options) {
  try {
    const reason = options.reason || 'Security policy violation';
    const adminUser = process.env.USER || 'unknown';
    
    console.log(chalk.blue(`🚫 Blocking package: ${packageName}\n`));
    
    const policyManager = new PolicyManager();
    const result = await policyManager.addBlockedPackage(packageName, reason, adminUser);
    
    // Log the admin action
    const auditLogger = new AuditLogger();
    await auditLogger.logAdminAction(adminUser, 'block_package', packageName, { reason });
    
    console.log(chalk.green(`✓ ${result.message}`));
    console.log(chalk.gray(`Reason: ${reason}`));
    console.log(chalk.gray(`Blocked by: ${adminUser}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function unblockPackage(packageName) {
  try {
    const adminUser = process.env.USER || 'unknown';
    
    console.log(chalk.blue(`✅ Unblocking package: ${packageName}\n`));
    
    const policyManager = new PolicyManager();
    const result = await policyManager.removeBlockedPackage(packageName, adminUser);
    
    // Log the admin action
    const auditLogger = new AuditLogger();
    await auditLogger.logAdminAction(adminUser, 'unblock_package', packageName, {});
    
    console.log(chalk.green(`✓ ${result.message}`));
    console.log(chalk.gray(`Unblocked by: ${adminUser}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function updatePolicyInteractive() {
  try {
    console.log(chalk.blue('⚙️  Interactive Policy Configuration\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableSecurity',
        message: 'Enable vulnerability scanning?',
        default: true
      },
      {
        type: 'confirm',
        name: 'blockCritical',
        message: 'Block packages with critical vulnerabilities?',
        default: true,
        when: (answers) => answers.enableSecurity
      },
      {
        type: 'confirm',
        name: 'enableLicensing',
        message: 'Enable license compliance checking?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableApproval',
        message: 'Require approval for package downloads?',
        default: false
      },
      {
        type: 'number',
        name: 'retentionDays',
        message: 'Audit log retention (days):',
        default: 90
      }
    ]);

    const policyManager = new PolicyManager();
    
    if (answers.enableSecurity !== undefined) {
      await policyManager.updatePolicy('security', {
        vulnerability_scanning: {
          enabled: answers.enableSecurity,
          block_on_critical: answers.blockCritical || false
        }
      }, process.env.USER || 'unknown');
    }
    
    if (answers.enableLicensing !== undefined) {
      await policyManager.updatePolicy('licensing', {
        enabled: answers.enableLicensing
      }, process.env.USER || 'unknown');
    }
    
    if (answers.enableApproval !== undefined) {
      await policyManager.updatePolicy('package_approval', {
        enabled: answers.enableApproval
      }, process.env.USER || 'unknown');
    }
    
    if (answers.retentionDays) {
      await policyManager.updatePolicy('audit', {
        retention_days: answers.retentionDays
      }, process.env.USER || 'unknown');
    }
    
    console.log(chalk.green('\n✓ Policy configuration updated successfully'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function listUsers() {
  try {
    console.log(chalk.blue('👥 User Permissions\n'));
    
    const policyManager = new PolicyManager();
    await policyManager.loadPolicies();
    
    const table = new Table({
      head: ['Username', 'Role', 'Permissions'],
      colWidths: [20, 15, 40]
    });
    
    // Show admin users
    const adminUsers = policyManager.policies.users.admin_users;
    for (const user of adminUsers) {
      table.push([user, chalk.red('Admin'), 'All permissions']);
    }
    
    // Show restricted users
    const restrictedUsers = policyManager.policies.users.restricted_users;
    for (const user of restrictedUsers) {
      table.push([user, chalk.yellow('Restricted'), 'Search only']);
    }
    
    // Show default permissions
    const defaultPerms = policyManager.policies.users.default_permissions;
    const permsList = Object.entries(defaultPerms)
      .filter(([_, allowed]) => allowed)
      .map(([perm, _]) => perm)
      .join(', ');
    
    table.push(['[Default]', chalk.green('Standard'), permsList]);
    
    console.log(table.toString());
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function grantAdminPrivileges(username) {
  try {
    const adminUser = process.env.USER || 'unknown';
    
    console.log(chalk.blue(`👑 Granting admin privileges to: ${username}\n`));
    
    const policyManager = new PolicyManager();
    const result = await policyManager.addAdminUser(username, adminUser);
    
    // Log the admin action
    const auditLogger = new AuditLogger();
    await auditLogger.logAdminAction(adminUser, 'grant_admin', username, {});
    
    console.log(chalk.green(`✓ ${result.message}`));
    console.log(chalk.gray(`Granted by: ${adminUser}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function revokeAdminPrivileges(username) {
  try {
    const adminUser = process.env.USER || 'unknown';
    
    console.log(chalk.blue(`❌ Revoking admin privileges from: ${username}\n`));
    
    const policyManager = new PolicyManager();
    const result = await policyManager.removeAdminUser(username, adminUser);
    
    // Log the admin action
    const auditLogger = new AuditLogger();
    await auditLogger.logAdminAction(adminUser, 'revoke_admin', username, {});
    
    console.log(chalk.green(`✓ ${result.message}`));
    console.log(chalk.gray(`Revoked by: ${adminUser}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function generateAuditReport(options) {
  try {
    console.log(chalk.blue('📊 Generating Audit Report...\n'));
    
    const auditLogger = new AuditLogger();
    const report = await auditLogger.generateReport(options.start, options.end);
    
    // Display summary
    console.log(chalk.cyan('Report Summary:'));
    console.log(`Period: ${options.start} to ${options.end}`);
    console.log(`Total Actions: ${report.actions.length}`);
    console.log(`Unique Users: ${report.users.length}`);
    console.log(`Packages Accessed: ${report.packages.length}`);
    console.log();
    
    // Action breakdown
    if (Object.keys(report.summary).length > 0) {
      const table = new Table({
        head: ['Action Type', 'Count'],
        colWidths: [25, 10]
      });
      
      Object.entries(report.summary).forEach(([action, count]) => {
        table.push([action, count.toString()]);
      });
      
      console.log(chalk.cyan('Action Breakdown:'));
      console.log(table.toString());
    }
    
    // Save detailed report
    const outputFile = options.output || `audit-report-${Date.now()}.json`;
    await writeFile(outputFile, JSON.stringify(report, null, 2));
    
    console.log(chalk.green(`\n✓ Detailed report saved to: ${outputFile}`));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function rotateAuditLogs() {
  try {
    console.log(chalk.blue('🔄 Rotating Audit Logs...\n'));
    
    const auditLogger = new AuditLogger();
    await auditLogger.rotateLogs();
    
    console.log(chalk.green('✓ Audit logs rotated successfully'));
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function scanPackages(packages, options) {
  try {
    console.log(chalk.blue('🔍 Security Scanning...\n'));
    
    const scanner = new SecurityScanner();
    const scanResults = [];
    
    if (options.allCached) {
      // In a real implementation, scan all cached packages
      console.log(chalk.yellow('Note: --all-cached option would scan all cached packages'));
      return;
    }
    
    if (packages.length === 0) {
      console.log(chalk.yellow('No packages specified. Use package names or --all-cached option.'));
      return;
    }
    
    for (const packageName of packages) {
      console.log(`Scanning ${packageName}...`);
      const result = await scanner.scanPackage(packageName, 'latest');
      scanResults.push(result);
      
      if (result.vulnerabilities.length > 0) {
        console.log(chalk.red(`  ⚠️  ${result.vulnerabilities.length} vulnerabilities found`));
      } else {
        console.log(chalk.green(`  ✓ No vulnerabilities found`));
      }
    }
    
    // Generate report
    const report = await scanner.generateSecurityReport(scanResults);
    
    console.log(chalk.cyan('\nSecurity Report Summary:'));
    console.log(`Total Packages: ${report.total_packages}`);
    console.log(`Safe Packages: ${chalk.green(report.safe_packages)}`);
    console.log(`Vulnerable Packages: ${chalk.red(report.vulnerable_packages)}`);
    console.log(`Total Vulnerabilities: ${report.total_vulnerabilities}`);
    
    if (options.output) {
      await writeFile(options.output, JSON.stringify(report, null, 2));
      console.log(chalk.green(`\n✓ Detailed report saved to: ${options.output}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

async function checkCompliance(packages, options) {
  try {
    console.log(chalk.blue('⚖️  License Compliance Check...\n'));
    
    const licenseChecker = new LicenseChecker();
    
    if (options.allCached) {
      console.log(chalk.yellow('Note: --all-cached option would check all cached packages'));
      return;
    }
    
    if (packages.length === 0) {
      console.log(chalk.yellow('No packages specified. Use package names or --all-cached option.'));
      return;
    }
    
    console.log(chalk.yellow('Note: This would check license compliance for specified packages'));
    console.log(`Packages to check: ${packages.join(', ')}`);
    
    if (options.output) {
      console.log(chalk.green(`Results would be saved to: ${options.output}`));
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

function getDefaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30); // 30 days ago
  return date.toISOString().split('T')[0];
}

function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0];
}