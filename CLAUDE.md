# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pywhl CLI is a Node.js command-line tool for managing Python packages in restricted corporate environments where direct pip installation is limited. It provides features for downloading, caching, and managing Python wheels from PyPI.

## Architecture Structure

```
pywhl/
├── src/
│   ├── commands/          # CLI command implementations
│   │   ├── download.js    # Package download with parallel support
│   │   ├── bundle.js      # Offline bundle creation
│   │   ├── repo.js        # Repository management
│   │   └── ...           # Other commands
│   ├── core/              # Core business logic
│   │   ├── pypi/          # PyPI API integration
│   │   ├── resolver/      # Dependency resolution (basic + advanced)
│   │   ├── cache/         # Local cache management
│   │   ├── repository/    # Multi-repo support
│   │   └── config/        # Configuration management
│   ├── ui/                # Terminal UI components
│   └── utils/             # Utility functions
├── vscode-extension/      # VS Code extension
│   ├── src/              # Extension source
│   └── package.json      # Extension manifest
└── tests/                # Test suites
```

## Key Dependencies

### Core Dependencies
- Commander.js - CLI framework
- Got - HTTP client for PyPI API
- Chalk - Terminal styling
- Ora - Terminal spinners
- Semver - Version parsing

### Phase 2 Dependencies
- Inquirer.js - Interactive prompts
- CLI-Table3 - Terminal tables
- CLI-Progress - Progress bars
- Conf - Configuration management
- Figlet - ASCII art banners
- Gradient-string - Gradient text
- Boxen - Terminal boxes
- YAML - Configuration parsing

### Phase 3 Dependencies
- Archiver - ZIP file creation for bundles
- p-limit - Parallel execution control
- execa - Process execution for VS Code extension

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Run specific command
node bin/pywhl.js <command>

# Test interactive mode
node bin/pywhl.js interactive
```

## Core Features Implemented

### Phase 1 (MVP)
1. **Package Discovery & Download** - PyPI search and smart wheel selection
2. **Dependency Resolution** - Basic recursive dependency resolution
3. **Local Cache Management** - Simple caching system
4. **Core CLI Commands** - download, info, search, cache

### Phase 2 (Enhanced UX)
5. **Interactive Mode** - TUI with package search and selection
6. **Configuration Management** - Profiles and persistent settings
7. **Requirements.txt Support** - Batch downloads from requirements files
8. **Installation Scripts** - Platform-specific install script generation

### Phase 3 (Advanced)
9. **Multi-Repository Support** - Private PyPI repos with authentication
10. **Offline Bundles** - Self-contained installation packages
11. **Advanced Resolver** - Conflict detection and environment markers
12. **Parallel Downloads** - Concurrent downloads with progress tracking
13. **VS Code Extension** - IDE integration for package management

## PyPI Integration Notes

- Use PyPI JSON API (https://pypi.org/pypi/{package_name}/json)
- Implement rate limiting to respect PyPI guidelines
- Support for private PyPI repositories with authentication
- Handle wheel compatibility based on Python version and platform

## Configuration

Configuration is stored in `~/.pywheel/config.yml` with support for:
- Default Python version and platform settings
- Multiple repository configurations
- Named profiles for common package sets

## Development Reminders

- Test after each feature
- Commit if working
- Ultra think before and after implementations

## Repository Information

- github here: https://github.com/Mrassimo/pywhl