# Pywhl CLI - Product Requirements Document

## Executive Summary

Pywhl CLI is a Node.js command-line tool designed to simplify Python package management in restricted corporate environments where direct pip installation is limited or unavailable. It provides an elegant interface for downloading, caching, and managing Python wheels from PyPI, with advanced features for dependency resolution and offline installation.

## Problem Statement

### Current Challenges
- Corporate environments often restrict direct pip installations due to proxy, firewall, or administrative constraints
- Manual wheel downloading is tedious and error-prone
- Dependency resolution requires manual tracking
- No efficient way to manage offline Python package repositories
- Current HTML-based solutions lack the sophistication needed for professional workflows

### Target Users
- Data analysts and engineers in corporate environments (primary: HCF Sydney team)
- Developers working behind restrictive firewalls
- Teams needing to maintain offline Python package repositories
- IT administrators managing Python environments

## Product Vision

Create a professional-grade CLI tool that makes Python package management in restricted environments as seamless as using pip in unrestricted environments, while providing additional value through caching, dependency visualisation, and integration with modern development workflows.

## Core Features

### 1. Package Discovery & Download
- **Search PyPI**: Interactive search with rich terminal UI
- **Smart Download**: Automatically select compatible wheels based on Python version and platform
- **Batch Operations**: Download multiple packages from requirements.txt or custom lists
- **Version Management**: Specify exact versions, ranges, or latest compatible

### 2. Dependency Resolution
- **Automatic Resolution**: Recursively resolve and download all dependencies
- **Conflict Detection**: Identify version conflicts before download
- **Dependency Tree Visualisation**: Display dependencies in tree format
- **Optional Dependencies**: Handle extras_require specifications

### 3. Local Repository Management
- **Smart Caching**: Local cache with deduplication
- **Repository Structure**: Organise wheels in PEP 503 compliant structure
- **Index Generation**: Generate simple index for pip --find-links
- **Storage Optimisation**: Compress and deduplicate stored wheels

### 4. Installation Helpers
- **Install Scripts**: Generate platform-specific installation scripts
- **Virtual Environment Integration**: Direct installation into venvs
- **Offline Bundle Creation**: Create self-contained installation packages
- **Installation Verification**: Verify successful installations

### 5. Advanced CLI Experience
- **Interactive Mode**: TUI with search, selection, and progress indicators
- **Command Mode**: Scriptable commands for automation
- **Rich Output**: Coloured output, progress bars, and tables
- **Configuration Management**: Persistent configuration with profiles

## Technical Specifications

### Architecture
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

### Key Dependencies
- **Commander.js**: CLI framework
- **Inquirer.js**: Interactive prompts
- **Chalk**: Terminal styling
- **Ora**: Elegant terminal spinners
- **CLI-Table3**: Terminal tables
- **Got**: HTTP client for PyPI API
- **Semver**: Version parsing and comparison
- **Conf**: Configuration management

### PyPI Integration
- Use PyPI JSON API for package metadata
- Implement proper rate limiting and caching
- Support private PyPI repositories
- Handle authentication for private indices

## User Experience

### Command Examples
```bash
# Search for packages
pywheel search numpy

# Download a specific package
pywheel download numpy==1.24.0

# Download with all dependencies
pywheel download pandas --deps

# Download from requirements file
pywheel download -r requirements.txt

# Create offline installation bundle
pywheel bundle scikit-learn --output ml-bundle.zip

# Interactive mode
pywheel interactive

# Generate installation script
pywheel install-script numpy pandas matplotlib
```

### Configuration
```yaml
# ~/.pywheel/config.yml
defaults:
  python_version: "3.9"
  platform: "win_amd64"
  cache_dir: "~/.pywheel/cache"

repositories:
  - name: "pypi"
    url: "https://pypi.org/simple/"
  - name: "internal"
    url: "https://internal.company.com/pypi/"
    auth_token: "${INTERNAL_PYPI_TOKEN}"

profiles:
  data_science:
    packages:
      - numpy
      - pandas
      - scikit-learn
```

## Integration Points

### VS Code Integration
- Extension for direct package management from VS Code
- Integration with Python environment selection
- Quick actions in context menus

### CI/CD Integration
- GitHub Actions for automated wheel collection
- Jenkins pipeline support
- Docker image with pre-cached packages

### Monitoring & Analytics
- Usage analytics (opt-in)
- Download statistics
- Error tracking and reporting

## Success Metrics

### Quantitative
- Time reduction: 80% faster than manual downloads
- Dependency resolution accuracy: 99%+
- User adoption: 50+ users within HCF in 6 months
- Cache hit rate: 70%+ for common packages

### Qualitative
- User satisfaction scores
- Reduction in Python environment setup issues
- Positive feedback from IT administrators
- Community contributions

## Development Roadmap

### Phase 1: MVP 
- Basic download functionality
- Simple dependency resolution
- Local cache management
- Core CLI commands

### Phase 2: Enhanced UX
- Interactive TUI mode
- Rich terminal output
- Configuration management
- Installation script generation

### Phase 3: Advanced Features
- Private repository support
- VS Code extension
- Advanced dependency resolver
- Bundle creation

### Phase 4: Enterprise Features
- Multi-user cache sharing
- Audit logging
- Security scanning integration
- Administrative controls

## Risk Mitigation

### Technical Risks
- **PyPI API Changes**: Abstract API layer for easy updates
- **Platform Compatibility**: Extensive testing across platforms
- **Performance**: Implement efficient caching and parallel downloads

### Adoption Risks
- **Learning Curve**: Comprehensive documentation and tutorials
- **Tool Resistance**: Show clear ROI through time savings

## Success Factors
### For Broader Adoption
1. **Easy Installation**: Single binary distribution
2. **Zero Configuration**: Works out of the box
3. **Clear Documentation**: Step-by-step guides for common scenarios
4. **Community Building**: Open source with clear contribution guidelines

## Conclusion

Pywhl CLI addresses a real pain point in corporate Python development while showcasing modern development practices. It provides immediate value through time savings and reduced errors.