# Pywhl CLI

A Node.js command-line tool for downloading and managing Python wheels in restricted corporate environments.

## Features (Phase 1 - MVP)

- ✅ Download Python wheels from PyPI
- ✅ Basic dependency resolution
- ✅ Local cache management
- ✅ Platform and Python version compatibility checking
- ✅ Package information lookup

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

### Download a package

```bash
# Download latest version
pywhl download numpy

# Download specific version
pywhl download numpy==1.24.0

# Download with dependencies
pywhl download requests --deps

# Specify Python version and platform
pywhl download pandas -p 3.10 -t linux_x86_64
```

### Get package information

```bash
# Show package info
pywhl info numpy

# Show all available versions
pywhl info numpy --versions
```

### Manage cache

```bash
# List cached wheels
pywhl cache list

# Show cache info
pywhl cache info

# Clean cache
pywhl cache clean --all
pywhl cache clean --older-than 30
```

### Search packages

```bash
# Search PyPI (limited in Phase 1)
pywhl search tensorflow
```

## Configuration

The tool uses `~/.pywhl/cache` as the default cache directory.

## Development

```bash
# Run tests
npm test

# Lint code
npm run lint
```

## Roadmap

- **Phase 1 (MVP)** ✅: Basic functionality
- **Phase 2**: Enhanced UX with interactive mode
- **Phase 3**: Private repository support
- **Phase 4**: Enterprise features

## License

MIT