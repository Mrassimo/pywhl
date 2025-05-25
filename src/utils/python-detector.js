import { execSync } from 'child_process';
import chalk from 'chalk';

export class PythonDetector {
  static detectPythonVersion() {
    try {
      // Try python3 first
      const output = execSync('python3 --version 2>&1', { encoding: 'utf8' }).trim();
      const match = output.match(/Python (\d+\.\d+)/);
      if (match) {
        return match[1];
      }
    } catch (e) {
      // Try python if python3 fails
      try {
        const output = execSync('python --version 2>&1', { encoding: 'utf8' }).trim();
        const match = output.match(/Python (\d+\.\d+)/);
        if (match) {
          return match[1];
        }
      } catch (e2) {
        // Python not found
      }
    }
    
    // Default to 3.9 if detection fails
    return '3.9';
  }
  
  static suggestCompatibleVersion(requestedVersion, availableVersions) {
    // Sort versions in descending order
    const sorted = Array.from(availableVersions)
      .filter(v => v !== '3.x (any)')
      .sort((a, b) => {
        const [aMajor, aMinor] = a.split('.').map(Number);
        const [bMajor, bMinor] = b.split('.').map(Number);
        if (aMajor !== bMajor) return bMajor - aMajor;
        return bMinor - aMinor;
      });
    
    const [reqMajor, reqMinor] = requestedVersion.split('.').map(Number);
    
    // Try to find closest version
    for (const version of sorted) {
      const [vMajor, vMinor] = version.split('.').map(Number);
      if (vMajor === reqMajor && vMinor <= reqMinor) {
        return version;
      }
    }
    
    // If no match, return the latest available
    return sorted[0] || requestedVersion;
  }
}