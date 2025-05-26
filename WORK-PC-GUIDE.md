# 🚀 Quick Guide: Using pywhl on Your Work PC

## The Problem Solved
Your work PC has npm proxy issues preventing `npm install`. The lightweight branch solves this by bundling all dependencies - **no npm install needed!**

## Quick Setup (2 minutes)

1. **Copy these files to your work PC:**
   ```
   pywhl-lightweight.js
   pywhl-windows.bat (or .ps1)
   lightweight/ (entire folder)
   ```

2. **That's it!** No npm install required.

## Usage

### Windows Command Prompt:
```batch
pywhl-windows.bat download numpy
pywhl-windows.bat search pandas
pywhl-windows.bat info requests
```

### Windows PowerShell:
```powershell
.\pywhl-windows.ps1 download numpy
```

### Direct Node.js:
```bash
node pywhl-lightweight.js download numpy
```

## Proxy Configuration

If you need to set proxy for PyPI access:

```batch
# Windows
set HTTP_PROXY=http://your-proxy:8080
set HTTPS_PROXY=http://your-proxy:8080

# Then run pywhl
pywhl-windows.bat download numpy
```

## Features That Work
- ✅ Download packages from PyPI
- ✅ Search for packages
- ✅ Show package info
- ✅ Cache management
- ✅ Configuration
- ✅ Smart wheel selection

## What's Different?
- No npm dependencies
- Single lightweight executable
- All libraries bundled in `lightweight/libs/`
- Same functionality, zero setup

## Troubleshooting

**"Node.js not found"**
- Install Node.js from nodejs.org (no admin rights needed - use the portable version)

**"Cannot connect to PyPI"**
- Set your proxy environment variables (see above)

**"Access denied"**
- Make sure you have write access to `%USERPROFILE%\.pywhl\`

## Example Session
```batch
C:\> pywhl-windows.bat download requests
🔍 Fetching package info...
📦 Found requests 2.31.0
🎯 Selected wheel: requests-2.31.0-py3-none-any.whl
⬇️  Downloading... 100%
💾 Saved to cache
✅ Downloaded successfully!

C:\> pywhl-windows.bat cache list
📦 Cached packages:
  - requests-2.31.0-py3-none-any.whl (62.6 KB)
```

That's all! No complex setup, no npm headaches. Just download Python packages. 🎉