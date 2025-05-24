# Pywhl VS Code Extension

VS Code extension for the Pywhl CLI tool, providing Python wheel management directly from your editor.

## Features

- **Download packages** - Search and download Python wheels with a simple command
- **Requirements.txt integration** - Right-click on requirements.txt to download all packages
- **Repository management** - Configure and manage multiple PyPI repositories
- **Bundle creation** - Create offline installation bundles
- **Cache visualization** - View and manage downloaded wheels
- **Status bar integration** - Quick access to Pywhl features

## Requirements

- Pywhl CLI must be installed and available in PATH
- VS Code 1.74.0 or higher

## Extension Settings

This extension contributes the following settings:

* `pywhl.pythonVersion`: Default Python version for downloads (default: "3.9")
* `pywhl.outputDirectory`: Directory for downloaded wheels (default: "./wheels")
* `pywhl.parallelDownloads`: Number of parallel downloads (default: 3)
* `pywhl.cliPath`: Path to pywhl CLI executable (default: "pywhl")

## Commands

- `Pywhl: Download Python Package` - Download a package with optional dependencies
- `Pywhl: Search Python Package` - Search for packages on PyPI
- `Pywhl: Create Offline Bundle` - Create a bundle for offline installation
- `Pywhl: Show Wheel Cache` - Display cached wheels
- `Pywhl: Configure Repositories` - Manage package repositories
- `Pywhl: Download from requirements.txt` - Download all packages from requirements file

## Usage

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Pywhl" to see available commands
3. Or right-click on a requirements.txt file to download packages

## Known Issues

- Extension requires Pywhl CLI to be installed separately
- Some features may require additional configuration

## Release Notes

### 0.1.0

Initial release with basic Pywhl integration:
- Package download and search
- Requirements.txt support
- Repository management
- Bundle creation
- Tree views for packages and repositories