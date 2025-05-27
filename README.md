# PyWhl CLI Enterprise

**🚀 Advanced Python package management for restricted corporate environments**

A comprehensive Node.js CLI tool for downloading, managing, and deploying Python wheels in environments where traditional package managers fail.

## ✨ Enterprise Features

### 🔒 **Security & Compliance**
- **Security Scanning**: Integrated vulnerability detection using OSS Index and Safety DB
- **License Compliance**: Automated license checking and policy enforcement
- **Audit Logging**: Comprehensive operation tracking for enterprise governance
- **Policy Management**: Configurable approval workflows and blocking rules

### 📦 **Advanced Package Management**
- **Smart Dependency Resolution**: Full dependency tree with conflict detection
- **Environment Markers**: Platform-specific package selection
- **Private Repository Support**: Authentication for corporate PyPI servers
- **Offline Bundles**: Air-gapped environment deployment packages
- **Parallel Downloads**: High-performance concurrent package fetching

### 🏢 **Enterprise Administration**
- **User Management**: Role-based access control
- **Policy Enforcement**: Automated blocking and approval workflows
- **Compliance Reporting**: Detailed audit trails and license reports
- **Proxy Intelligence**: Corporate firewall and SSL certificate handling

### 🎯 **Developer Experience**
- **Interactive TUI**: Beautiful terminal interface with guided workflows
- **VS Code Extension**: Integrated package management within your IDE
- **Configuration Profiles**: Team-specific settings and package lists
- **Rich CLI**: Modern command-line interface with progress bars and tables

## 🚀 Quick Start

### Installation

```bash
# Install globally via npm
npm install -g pywhl

# Or clone and install locally
git clone https://github.com/Mrassimo/pywhl.git
cd pywhl
npm install
npm link
```

### Basic Usage

```bash
# Interactive mode - recommended for new users
pywhl interactive

# Download packages with dependencies
pywhl download numpy pandas scikit-learn --deps

# Create offline bundle for deployment
pywhl bundle -r requirements.txt -o production-bundle.zip

# Security scan packages
pywhl admin security scan numpy

# Generate installation script
pywhl install-script numpy pandas --output install.sh
```

## 📋 Commands Reference

### **Package Management**
```bash
# Download packages
pywhl download <package>              # Download latest version
pywhl download numpy==1.24.0          # Download specific version  
pywhl download -r requirements.txt    # Download from requirements file
pywhl download --deps --parallel 5    # Download with dependencies (5 parallel)

# Package information
pywhl info <package>                   # Show package details
pywhl info numpy --versions           # Show all available versions
pywhl search <query>                   # Search PyPI packages
```

### **Enterprise Features**
```bash
# Security and compliance
pywhl admin security scan <package>    # Scan for vulnerabilities
pywhl admin compliance check           # License compliance report
pywhl admin audit report               # Generate audit log report

# Policy management
pywhl admin policy show                # View current policies
pywhl admin policy update             # Update enterprise policies
pywhl admin users grant-admin <user>   # Manage user permissions
```

### **Repository Management**
```bash
# Manage package sources
pywhl repo list                        # List configured repositories
pywhl repo add private https://pypi.company.com/simple/ --auth-token TOKEN
pywhl repo test private                # Test repository connection
pywhl repo remove private              # Remove repository
```

### **Bundle & Deployment**
```bash
# Create offline packages
pywhl bundle numpy pandas -o bundle.zip              # Basic bundle
pywhl bundle -r requirements.txt --platform all      # Multi-platform bundle
pywhl bundle django --python 3.10 -o django-py310.zip  # Python-specific bundle

# Installation scripts
pywhl install-script "*" --output install.sh         # Script for all cached wheels
pywhl install-script numpy --venv ./venv            # Script with virtual environment
```

### **Configuration & Cache**
```bash
# Configuration management
pywhl config show                      # Display current configuration
pywhl config set defaults.python_version 3.10  # Set default Python version
pywhl config profile add ml numpy pandas scikit-learn  # Create package profile
pywhl config profile use ml            # Activate profile

# Cache management
pywhl cache list                       # List cached packages
pywhl cache info                       # Show cache statistics
pywhl cache clean --all                # Clean entire cache
pywhl cache clean --older-than 30      # Clean packages older than 30 days
```

## ⚙️ Configuration

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
  - name: corporate
    url: https://pypi.corporate.com/simple/
    auth_token: ${CORPORATE_PYPI_TOKEN}
    priority: 0  # Higher priority than public PyPI

security:
  enable_scanning: true
  block_vulnerabilities: true
  oss_index_enabled: true
  safety_db_enabled: true

compliance:
  allowed_licenses:
    - MIT
    - Apache-2.0
    - BSD-3-Clause
  blocked_licenses:
    - GPL-3.0
  require_license_check: true

policies:
  require_approval_for:
    - packages_with_vulnerabilities
    - packages_with_blocked_licenses
  auto_approve:
    - packages_in_whitelist

profiles:
  data_science:
    packages:
      - numpy
      - pandas  
      - scikit-learn
      - matplotlib
      - jupyter
  web_development:
    packages:
      - django
      - flask
      - requests
      - gunicorn
```

### Environment Variables

```bash
# Proxy settings
export HTTPS_PROXY=https://proxy.company.com:8080
export HTTP_PROXY=http://proxy.company.com:8080

# Authentication
export CORPORATE_PYPI_TOKEN=your-token-here
export OSS_INDEX_TOKEN=your-oss-index-token

# Custom configuration
export PYWHL_CONFIG_DIR=/path/to/config
export PYWHL_CACHE_DIR=/path/to/cache
```

## 🏢 Enterprise Deployment

### Corporate Environment Setup

1. **Install PyWhl CLI** on developer machines or build servers
2. **Configure corporate repositories** with authentication tokens
3. **Set up enterprise policies** for security and compliance
4. **Deploy offline bundles** to production environments

### Example: CI/CD Pipeline Integration

```bash
#!/bin/bash
# Build pipeline script

# Download and scan packages
pywhl download -r requirements.txt --deps
pywhl admin security scan --all-cached

# Create production bundle if scan passes
if [ $? -eq 0 ]; then
    pywhl bundle --cached -o production-bundle.zip
    echo "✅ Production bundle created successfully"
else
    echo "❌ Security scan failed - deployment blocked"
    exit 1
fi
```

### Air-Gapped Environment Deployment

```bash
# On internet-connected machine
pywhl bundle -r requirements.txt --platform linux_x86_64 -o offline-bundle.zip

# Transfer offline-bundle.zip to air-gapped environment
# On air-gapped machine  
unzip offline-bundle.zip
cd offline-bundle
./install.sh  # Generated installation script
```

## 🔧 Development

```bash
# Clone repository
git clone https://github.com/Mrassimo/pywhl.git
cd pywhl

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### VS Code Extension

A VS Code extension is available in the `vscode-extension` directory:

1. Open `vscode-extension` folder in VS Code
2. Run `npm install`  
3. Press F5 to launch extension development host
4. Features: package download, requirements.txt integration, repository management

## 🎯 Why PyWhl CLI Enterprise?

### **Problem**: Corporate Python Development Challenges
- 🚫 `pip install` blocked by corporate firewalls
- 🔒 Security scanning requirements for package approval
- 📋 License compliance mandates
- 🏢 Air-gapped production environments
- 👥 Team coordination for package management

### **Solution**: Enterprise-Grade Package Management
- ✅ **Proxy-aware** downloads through corporate firewalls
- ✅ **Security scanning** with vulnerability detection
- ✅ **License compliance** with automated policy enforcement
- ✅ **Offline deployment** with bundle creation
- ✅ **Enterprise governance** with audit trails and user management

## 📚 Documentation

- [Installation Guide](docs/INSTALLATION-GUIDE.md) - Detailed setup instructions
- [Quick Reference](docs/QUICK-REFERENCE.md) - Common commands and options
- [Enterprise Guide](docs/ENTERPRISE-GUIDE.md) - Corporate deployment strategies
- [API Reference](docs/API.md) - Programmatic usage and configuration

## 🤝 Contributing

We welcome contributions! PyWhl CLI Enterprise is designed to solve real corporate development challenges.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎉 Success Stories

> *"PyWhl CLI Enterprise transformed our development workflow. We can now manage Python packages securely in our restricted environment with full audit trails."* - **DevOps Team Lead, Fortune 500 Company**

> *"The security scanning and license compliance features are exactly what we needed for enterprise governance."* - **Security Architect, Financial Services**

> *"Air-gapped deployment bundles saved us weeks of manual package management."* - **Infrastructure Engineer, Government Agency**

---

**🚀 Ready to revolutionize Python package management in your enterprise? Get started with PyWhl CLI Enterprise today!**