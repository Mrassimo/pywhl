import { platform, arch } from 'os';

// Wheel filename format: {distribution}-{version}(-{build tag})?-{python}-{abi}-{platform}.whl
const WHEEL_REGEX = /^(.+?)-(.+?)(-(.+?))?-(.+?)-(.+?)-(.+?)\.whl$/;

export class WheelParser {
  static parseWheelFilename(filename) {
    const match = filename.match(WHEEL_REGEX);
    if (!match) {
      throw new Error(`Invalid wheel filename: ${filename}`);
    }

    return {
      distribution: match[1],
      version: match[2],
      buildTag: match[4] || null,
      pythonTag: match[5],
      abiTag: match[6],
      platformTag: match[7],
      filename
    };
  }

  static getCurrentPlatform() {

    const archMap = {
      'x64': 'x86_64',
      'arm64': 'arm64',
      'ia32': 'i686'
    };

    const osPlatform = platform();
    const osArch = arch();

    const archName = archMap[osArch] || osArch;

    if (osPlatform === 'darwin') {
      // macOS uses specific version numbers - use a more modern baseline
      return `macosx_12_0_${archName}`;
    } else if (osPlatform === 'linux') {
      return `linux_${archName}`;
    } else if (osPlatform === 'win32') {
      return osArch === 'x64' ? 'win_amd64' : 'win32';
    }

    return 'any';
  }

  static isPlatformCompatible(wheelPlatform, targetPlatform = null) {
    const target = targetPlatform || this.getCurrentPlatform();
    
    // 'any' platform wheels work on all platforms
    if (wheelPlatform === 'any') return true;
    
    // Exact match
    if (wheelPlatform === target) return true;
    
    // Check for compatible platforms (e.g., manylinux)
    if (target.includes('linux') && wheelPlatform.includes('manylinux')) {
      return true;
    }
    
    // macOS compatibility (newer OS can use older wheels)
    if (target.includes('macosx') && wheelPlatform.includes('macosx')) {
      const targetMatch = target.match(/macosx_(\d+)_(\d+)/);
      const wheelMatch = wheelPlatform.match(/macosx_(\d+)_(\d+)/);
      
      if (targetMatch && wheelMatch) {
        const targetVer = parseInt(targetMatch[1]) * 100 + parseInt(targetMatch[2]);
        const wheelVer = parseInt(wheelMatch[1]) * 100 + parseInt(wheelMatch[2]);
        return targetVer >= wheelVer;
      }
    }
    
    return false;
  }

  static isPythonVersionCompatible(pythonTag, targetVersion = '3.9') {
    // Handle 'py2.py3' or 'py3' style tags
    if (pythonTag === 'py2.py3' || pythonTag === 'py3') {
      return targetVersion.startsWith('3');
    }
    
    // Handle 'cp39' style tags (CPython 3.9)
    const cpMatch = pythonTag.match(/cp(\d)(\d+)/);
    if (cpMatch) {
      const wheelPyVersion = `${cpMatch[1]}.${cpMatch[2]}`;
      // Compare with the target version (e.g., "3.11")
      return wheelPyVersion === targetVersion;
    }
    
    // Handle 'py39' style tags
    const pyMatch = pythonTag.match(/py(\d)(\d+)/);
    if (pyMatch) {
      const wheelPyVersion = `${pyMatch[1]}.${pyMatch[2]}`;
      return wheelPyVersion === targetVersion;
    }
    
    return false;
  }

  static selectBestWheel(wheels, pythonVersion = '3.9', targetPlatform = null) {
    const platform = targetPlatform || this.getCurrentPlatform();
    
    // Filter compatible wheels
    const compatible = wheels.filter(wheel => {
      try {
        const parsed = this.parseWheelFilename(wheel.filename);
        return this.isPythonVersionCompatible(parsed.pythonTag, pythonVersion) &&
               this.isPlatformCompatible(parsed.platformTag, platform);
      } catch (error) {
        return false;
      }
    });

    if (compatible.length === 0) {
      return null;
    }

    // Sort by preference: platform-specific > any, newer python version > older
    compatible.sort((a, b) => {
      const parsedA = this.parseWheelFilename(a.filename);
      const parsedB = this.parseWheelFilename(b.filename);
      
      // Prefer platform-specific over 'any'
      if (parsedA.platformTag !== 'any' && parsedB.platformTag === 'any') return -1;
      if (parsedA.platformTag === 'any' && parsedB.platformTag !== 'any') return 1;
      
      // Prefer exact platform match
      if (parsedA.platformTag === platform && parsedB.platformTag !== platform) return -1;
      if (parsedA.platformTag !== platform && parsedB.platformTag === platform) return 1;
      
      return 0;
    });

    return compatible[0];
  }
}