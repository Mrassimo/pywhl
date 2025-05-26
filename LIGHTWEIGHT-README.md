# Pywhl Lightweight - Zero Dependencies 🚀

This is a lightweight, self-contained version of pywhl that works without npm install - perfect for restricted corporate environments!

## 🎯 Quick Start (No npm required!)

### Windows
```batch
# Just run the batch file:
pywhl-windows.bat download numpy

# Or use Node directly:
node pywhl-lightweight.js download numpy
```

### Linux/Mac
```bash
# Make it executable:
chmod +x pywhl-lightweight.js

# Run directly:
./pywhl-lightweight.js download numpy

# Or use Node:
node pywhl-lightweight.js download numpy
```

## 🛠️ Features

- ✅ **Zero npm dependencies** - All code bundled
- ✅ **Works behind corporate proxies** - No package downloads needed
- ✅ **Full PyPI support** - Download any Python package
- ✅ **Smart wheel selection** - Automatically picks compatible wheels
- ✅ **Local caching** - Reuse downloaded packages

## 📋 Commands

### Download a package
```bash
node pywhl-lightweight.js download <package-name>
node pywhl-lightweight.js download numpy==1.24.0
```

### Search for packages
```bash
node pywhl-lightweight.js search <query>
```

### Show package info
```bash
node pywhl-lightweight.js info <package-name>
```

### List cached packages
```bash
node pywhl-lightweight.js cache list
```

### Configure Python version
```bash
node pywhl-lightweight.js config set pythonVersion 3.10
```

## 🔧 Configuration

Settings are stored in `~/.pywhl/config.json`:

```json
{
  "pythonVersion": "3.9",
  "platform": "win32",
  "architecture": "x86_64"
}
```

## 🚫 Proxy Issues?

If you're behind a corporate proxy, pywhl-lightweight will use your system proxy settings. You can also set:

```bash
# Windows
set HTTP_PROXY=http://your-proxy:8080
set HTTPS_PROXY=http://your-proxy:8080

# Linux/Mac
export HTTP_PROXY=http://your-proxy:8080
export HTTPS_PROXY=http://your-proxy:8080
```

## 📦 How It Works

1. **No npm install needed** - All dependencies are pre-bundled in `lightweight/libs/`
2. **Direct PyPI access** - Downloads wheels directly from PyPI
3. **Local caching** - Stores wheels in `~/.pywhl/cache/`
4. **Offline friendly** - Works with cached packages when offline

## 🤝 Why Lightweight?

The regular pywhl has 40+ npm dependencies which can be problematic in restricted environments. This lightweight version bundles only the essential code needed to download Python packages, making it perfect for:

- Corporate environments with npm restrictions
- Air-gapped systems (after initial package downloads)
- Quick deployments without dependency management
- Situations where npm registry is blocked

## 📝 License

MIT License - Same as the main pywhl project