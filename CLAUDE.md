# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pywhl CLI is a Node.js command-line tool for managing Python packages in restricted corporate environments where direct pip installation is limited. It provides features for downloading, caching, and managing Python wheels from PyPI.

## Architecture Structure

```
pywheel-cli/
├── src/
│   ├── commands/          # CLI command implementations
│   ├── core/              # Core business logic
│   │   ├── pypi/          # PyPI API integration
│   │   ├── resolver/      # Dependency resolution
│   │   ├── cache/         # Local cache management
│   │   └── installer/     # Installation helpers
│   ├── ui/                # Terminal UI components
│   └── utils/             # Utility functions
├── config/                # Configuration schemas
├── templates/             # Script templates
└── tests/                 # Test suites
```

## Key Dependencies

- Commander.js - CLI framework
- Inquirer.js - Interactive prompts
- Chalk - Terminal styling
- Ora - Terminal spinners
- CLI-Table3 - Terminal tables
- Got - HTTP client for PyPI API
- Semver - Version parsing
- Conf - Configuration management

## Development Commands

Since this is a new project without existing package.json, the following commands should be set up:

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Type check (if using TypeScript)
npm run typecheck
```

## Core Features to Implement

1. **Package Discovery & Download** - PyPI search and smart wheel selection
2. **Dependency Resolution** - Recursive dependency resolution with conflict detection
3. **Local Repository Management** - Caching with PEP 503 compliant structure
4. **Installation Helpers** - Script generation and virtual environment integration
5. **Advanced CLI Experience** - Interactive TUI and rich terminal output

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