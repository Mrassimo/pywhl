# Pywhl CLI

A Node.js command-line tool for downloading and managing Python wheels in restricted corporate environments.

## Features

### Phase 1 - MVP ✅
- Download Python wheels from PyPI
- Basic dependency resolution
- Local cache management
- Platform and Python version compatibility checking
- Package information lookup

### Phase 2 - Enhanced UX ✅
- Interactive mode with TUI
- Configuration management with profiles
- Requirements.txt support
- Installation script generation
- Enhanced progress bars and visual feedback
- Rich terminal output with tables and colors

## Installation

```bash
# Clone the repository
git clone https://github.com/Mrassimo/pywhl.git
cd pywhl

# Install dependencies
npm install

# Make CLI executable
chmod +x bin/pywhl.js

# Optional: Link globally
npm link
```

## Usage

### Interactive Mode 🎯

```bash
# Launch interactive TUI
pywhl interactive
# or
pywhl i
```

### Download Packages

```bash
# Download latest version
pywhl download numpy

# Download specific version
pywhl download numpy==1.24.0

# Download with dependencies
pywhl download requests --deps

# Download from requirements.txt
pywhl download -r requirements.txt

# Specify Python version and platform
pywhl download pandas -p 3.10 -t linux_x86_64
```

### Configuration Management

```bash
# Show current configuration
pywhl config show

# Set default Python version
pywhl config set defaults.python_version 3.10

# Manage profiles
pywhl config profile list
pywhl config profile add ml numpy pandas scikit-learn
pywhl config profile use ml

# Reset configuration
pywhl config reset
```

### Generate Installation Scripts

```bash
# Generate script for specific packages
pywhl install-script numpy pandas matplotlib

# Generate script for all wheels in directory
pywhl install-script "*"

# Specify output file and options
pywhl install-script numpy --output install.sh --venv ./venv
```

### Package Information

```bash
# Show package info
pywhl info numpy

# Show all available versions
pywhl info numpy --versions
```

### Cache Management

```bash
# List cached wheels
pywhl cache list

# Show cache info
pywhl cache info

# Clean cache
pywhl cache clean --all
pywhl cache clean --older-than 30
```

## Configuration

Configuration is stored in `~/.config/pywhl/config.yml` (or platform-specific location).

### Example Configuration

```yaml
defaults:
  python_version: "3.9"
  platform: auto
  cache_dir: ~/.pywhl/cache
  output_dir: ./wheels

repositories:
  - name: pypi
    url: https://pypi.org/simple/

profiles:
  data_science:
    packages:
      - numpy
      - pandas
      - scikit-learn
      - matplotlib
      - jupyter
```

## Development

```bash
# Run tests
npm test

# Lint code
npm run lint
```

## Roadmap

- **Phase 1 (MVP)** ✅: Basic functionality
- **Phase 2 (Enhanced UX)** ✅: Interactive mode, config management, requirements.txt
- **Phase 3**: Private repository support, VS Code extension
- **Phase 4**: Enterprise features

## License

MIT