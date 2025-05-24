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

### Phase 3 - Advanced Features ✅
- Private PyPI repository support with authentication
- Offline bundle creation for air-gapped environments
- Advanced dependency resolver with conflict detection
- Support for extras_require and environment markers
- Parallel downloads for better performance
- Proxy support for corporate environments
- VS Code extension (basic implementation)

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

### Repository Management

```bash
# List configured repositories
pywhl repo list

# Add a private repository
pywhl repo add myrepo https://private.pypi.org/simple/ --auth-token ${API_TOKEN}

# Test repository connection
pywhl repo test myrepo

# Remove repository
pywhl repo remove myrepo
```

### Create Offline Bundles

```bash
# Bundle specific packages
pywhl bundle numpy pandas scikit-learn -o ml-bundle.zip

# Bundle from requirements file
pywhl bundle -r requirements.txt -o offline-bundle.zip

# Bundle for all platforms
pywhl bundle numpy --platform all -o numpy-all-platforms.zip

# Bundle with custom Python version
pywhl bundle django -p 3.10 -o django-py310.zip
```

### Advanced Download Options

```bash
# Use parallel downloads
pywhl download -r requirements.txt --parallel 5

# Use advanced dependency resolver
pywhl download tensorflow --use-advanced-resolver --deps

# Download from specific repository
pywhl repo add private https://private.repo/simple/
pywhl download internal-package  # Will search all repos
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
  - name: private
    url: https://private.pypi.company.com/simple/
    auth_token: ${PRIVATE_PYPI_TOKEN}
    priority: 0  # Higher priority than public PyPI

profiles:
  data_science:
    packages:
      - numpy
      - pandas
      - scikit-learn
      - matplotlib
      - jupyter
```

### Environment Variables

- `HTTPS_PROXY` / `HTTP_PROXY` - Proxy settings for downloads
- `PRIVATE_PYPI_TOKEN` - Authentication token for private repositories
- Any custom variables referenced in config (e.g., `${MY_TOKEN}`)

## Development

```bash
# Run tests
npm test

# Lint code
npm run lint
```

## VS Code Extension

A VS Code extension is available in the `vscode-extension` directory. Features include:
- Download packages from Command Palette
- Right-click on requirements.txt to download all packages
- View downloaded packages in sidebar
- Manage repositories from VS Code

To use the extension:
1. Open the `vscode-extension` folder in VS Code
2. Run `npm install`
3. Press F5 to launch a new VS Code window with the extension loaded

## Roadmap

- **Phase 1 (MVP)** ✅: Basic functionality
- **Phase 2 (Enhanced UX)** ✅: Interactive mode, config management, requirements.txt
- **Phase 3 (Advanced)** ✅: Private repos, bundles, parallel downloads, VS Code extension
- **Phase 4**: Enterprise features (audit logs, security scanning, admin controls)

## License

MIT