# 🐍📦 Pywhl - The Ultimate Python Package Manager for Restricted Environments

<div align="center">
  
  [![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/Mrassimo/pywhl)
  [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
  [![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org)
  [![Python](https://img.shields.io/badge/python-3.7%2B-blue.svg)](https://python.org)
  
  <p align="center">
    <strong>🚀 Download Python packages when pip can't! Perfect for corporate firewalls & air-gapped systems</strong>
  </p>

</div>

---

## 📖 Table of Contents

- [🌟 What is Pywhl?](#-what-is-pywhl)
- [✨ Key Features](#-key-features)
- [🎯 Who is this for?](#-who-is-this-for)
- [🚀 Quick Start](#-quick-start)
- [📚 Detailed Usage Guide](#-detailed-usage-guide)
- [🎨 Interactive Mode](#-interactive-mode)
- [🔐 Enterprise Features](#-enterprise-features)
- [🛠️ Advanced Features](#️-advanced-features)
- [📝 Examples & Recipes](#-examples--recipes)
- [🤝 Contributing](#-contributing)
- [❓ FAQ](#-faq)
- [📄 License](#-license)

---

## 🌟 What is Pywhl?

**Pywhl** (pronounced "py-wheel") is a powerful Node.js command-line tool that helps you download and manage Python packages when direct `pip install` isn't an option. Whether you're behind a corporate firewall 🏢, working on an air-gapped system 🔒, or need to create offline installation bundles 📦, Pywhl has got you covered!

### 🎥 See it in Action!

```bash
# Download pandas with all its dependencies
$ pywhl download pandas --deps

🔍 Auto-detected Python version: 3.11

📦 Downloading pandas

🔍 Resolving dependencies...

📊 Dependency tree:
└── pandas==2.2.3
    ├── numpy>=1.23.5
    ├── python-dateutil>=2.8.2
    └── pytz>=2022.7

⬇️ Downloading 4 wheel(s)...
(Using 3 parallel downloads)

✓ pandas-2.2.3-cp311-cp311-win_amd64.whl
✓ numpy-1.26.4-cp311-cp311-win_amd64.whl
✓ python_dateutil-2.9.0-py2.py3-none-any.whl
✓ pytz-2024.2-py2.py3-none-any.whl

✅ Downloaded 4 wheel(s) to ./wheels
```

---

## ✨ Key Features

### 🎯 Core Capabilities

- **📥 Smart Package Downloads** - Automatically selects the right wheel for your Python version and platform
- **🔗 Dependency Resolution** - Downloads all required dependencies automatically
- **💾 Local Caching** - Speeds up repeated downloads with intelligent caching
- **📦 Offline Bundles** - Create self-contained packages for air-gapped installations
- **🎨 Beautiful TUI** - Interactive terminal interface for easy package management
- **⚡ Parallel Downloads** - Download multiple packages simultaneously for speed

### 🏢 Enterprise Features

- **🔐 Security Scanning** - Vulnerability detection before download
- **📋 License Compliance** - Automatic license checking and policy enforcement
- **📊 Audit Logging** - Complete tracking of all package operations
- **👥 User Management** - Role-based access control
- **📈 Analytics & Reporting** - Usage statistics and compliance reports
- **🔧 Policy Management** - Customizable download and security policies

---

## 🎯 Who is this for?

Pywhl is perfect for:

- **🏢 Corporate Developers** - Working behind strict firewalls
- **🔒 Security-Conscious Teams** - Need to scan packages before installation
- **✈️ Offline Environments** - Air-gapped systems, ships, remote locations
- **🚀 DevOps Engineers** - Creating reproducible deployment packages
- **📚 Data Scientists** - Managing large scientific Python stacks
- **🎓 Students & Educators** - Learning environments with restricted internet

---

## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 16.0.0 or higher
- **npm** (comes with Node.js)
- **Python** 3.7+ (for installation verification)

### 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/Mrassimo/pywhl.git
cd pywhl

# Install dependencies
npm install

# Install globally
npm install -g .

# Verify installation
pywhl --version
```

### 🎉 Your First Download

```bash
# Download a single package (auto-detects Python version)
pywhl download requests

# Download with dependencies
pywhl download flask --deps

# Download specific version
pywhl download "django==4.2.0" --deps

# Download for specific Python version
pywhl download numpy -p 3.11

# Enable strict checking (optional)
pywhl download tensorflow --strict-security --enable-license-check
```

**💡 Note**: By default, Pywhl:
- Auto-detects your Python version
- Shows security warnings but doesn't block downloads
- Skips license checking (use `--enable-license-check` to enable)
- Prefers standard Python wheels over free-threaded variants

---

## 📚 Detailed Usage Guide

### 🔍 Basic Commands

#### 1️⃣ **Search for Packages**

```bash
# Search PyPI for packages
pywhl search tensorflow

# Show detailed package information
pywhl info pandas
```

#### 2️⃣ **Download Packages**

```bash
# Basic download
pywhl download numpy

# Download with all dependencies
pywhl download scipy --deps

# Specify Python version and platform
pywhl download torch -p 3.10 -t linux_x86_64

# Download to custom directory
pywhl download matplotlib -o ./my_wheels
```

#### 3️⃣ **Work with Requirements Files**

```bash
# Download all packages from requirements.txt
pywhl download -r requirements.txt --deps

# Example requirements.txt:
# numpy>=1.20.0
# pandas==2.0.0
# scikit-learn
# matplotlib!=3.7.0
```

#### 4️⃣ **Create Offline Bundles**

```bash
# Bundle packages for offline installation
pywhl bundle numpy pandas scikit-learn -o ml_bundle.zip

# Bundle with specific Python version
pywhl bundle tensorflow torch -p 3.11 -o dl_bundle.zip

# Bundle from requirements file
pywhl bundle -r requirements.txt -o project_bundle.zip
```

---

## 🎨 Interactive Mode

Launch the beautiful Terminal User Interface (TUI) for an intuitive experience:

```bash
pywhl interactive
```

<div align="center">
  <pre>
╔═══════════════════════════════════════════════════════╗
║      ____                 _     _                     ║
║     |  _ \ _   ___      _| |__ | |                    ║
║     | |_) | | | \ \ /\ / / '_ \| |                    ║
║     |  __/| |_| |\ V  V /| | | | |                    ║
║     |_|    \__, | \_/\_/ |_| |_|_|                    ║
║            |___/                                       ║
║                                                       ║
║     🐍 Python Package Manager for Restricted Envs     ║
╚═══════════════════════════════════════════════════════╝

  What would you like to do?

  ❯ 🔍 Search and download packages
    📋 Download from requirements.txt  
    ⚙️  Configure settings
    💾 Manage cache
    📊 View download history
    ❌ Exit

  Use arrow keys to navigate, Enter to select
  </pre>
</div>

### 🎯 Interactive Mode Features

- **🔍 Package Search** - Search PyPI with live results
- **📦 Smart Selection** - Choose packages and versions interactively
- **🔗 Dependency Preview** - See dependencies before downloading
- **⚙️ Easy Configuration** - Set Python version, output directory, etc.
- **📊 Download History** - Track what you've downloaded

---

## 🔐 Enterprise Features

### 🛡️ Security Scanning

```bash
# Scan for vulnerabilities (warns by default)
pywhl download django --deps

# Output:
🔍 Running security scan...
⚠️ Security vulnerabilities detected:
  • Package has 2 critical vulnerabilities
  • CVE-2023-12345 (High) - SQL Injection in ORM
  • CVE-2023-67890 (Medium) - XSS in admin panel

💡 Proceeding with download. Use --strict-security to block on vulnerabilities

# Block downloads with vulnerabilities
pywhl download django --strict-security

# Skip security scanning entirely
pywhl download django --skip-security-scan
```

### 📋 License Compliance

```bash
# License checking is opt-in (disabled by default)
pywhl download tensorflow

# Enable license compliance checking
pywhl download tensorflow --enable-license-check

# Output:
⚖️ Checking license compliance...
License: Apache-2.0 (approved)
✅ Package complies with corporate license policy

# Force download even with license violations
pywhl download some-gpl-package --enable-license-check --force
```

### 📊 Audit Reports

```bash
# Generate audit report
pywhl admin audit report

# View real-time audit log
pywhl admin audit tail

# Export audit data
pywhl admin audit export --format json
```

### 👥 User Management

```bash
# Initialize enterprise policies
pywhl admin policy init

# Add admin user
pywhl admin user add john.doe --role admin

# Set download limits
pywhl admin policy set download.daily_limit 100
```

---

## 🛠️ Advanced Features

### ⚡ Parallel Downloads

```bash
# Download with 5 parallel connections
pywhl download -r requirements.txt --parallel 5
```

### 🏢 Private Repositories

```bash
# Configure private PyPI
pywhl repo add private https://pypi.company.com --auth token:xyz123

# Download from private repo
pywhl download internal-package --repo private
```

### 🔧 Configuration Profiles

```bash
# Create a profile
pywhl config profile create data-science \
  --python 3.11 \
  --platform linux_x86_64 \
  --output ~/ds-wheels

# Use profile
pywhl download pandas --profile data-science
```

### 📦 VS Code Extension

Install our VS Code extension for integrated package management:

```bash
# In VS Code
ext install pywhl.pywhl-vscode
```

Features:
- 📋 Download packages from requirements.txt with one click
- 🔍 Search PyPI directly from VS Code
- 📊 View package dependencies in sidebar
- ⚡ Quick actions in context menus

---

## 📝 Examples & Recipes

### 🧬 Data Science Stack

```bash
# Download complete data science toolkit
cat > ds_requirements.txt << EOF
numpy
pandas
scikit-learn
matplotlib
seaborn
jupyter
scipy
statsmodels
EOF

pywhl download -r ds_requirements.txt --deps -o ./datascience_wheels
```

### 🏢 Enterprise Package Bundle

```bash
# Create approved package bundle for distribution
pywhl bundle \
  requests \
  flask \
  sqlalchemy \
  redis \
  celery \
  -o approved_packages_2024.zip \
  --sign \
  --include-install-script
```

### 🔄 Offline Mirror Setup

```bash
# Download top 100 packages for offline mirror
pywhl download -r popular_packages.txt --deps --parallel 10

# Create installation script
pywhl install-script ./wheels --output install_all.sh
```

---

## 🤔 Common Issues & Solutions

### ❌ "No compatible wheel found"

**Problem**: Package doesn't have a wheel for your Python/platform combination.

**Solution**:
```bash
# Check available versions
pywhl info numpy --versions

# Try different Python version
pywhl download numpy -p 3.10

# For Python 3.13 users:
# Pywhl automatically prefers standard wheels over free-threaded (cp313t)
pywhl download numpy -p 3.13

# Download source distribution instead
pywhl download numpy --allow-sdist
```

**Note for Python 3.13**: Pywhl automatically selects standard Python wheels (cp313) over free-threaded variants (cp313t) for better compatibility.

### 🔒 "Download blocked by policy"

**Problem**: Enterprise policy blocking the download.

**Solution**:
```bash
# By default, license checking is disabled
pywhl download numpy

# If you enabled license checking:
pywhl download numpy --enable-license-check

# Force download despite policy violations
pywhl download numpy --force

# For strict security environments:
pywhl download numpy --strict-security --enable-license-check
```

### 🌐 Network Timeout Errors

**Problem**: Slow or unreliable network connection.

**Solution**:
```bash
# Increase timeout
pywhl config set download.timeout 300

# Reduce parallel downloads
pywhl download -r requirements.txt --parallel 1

# Enable aggressive retry
pywhl download numpy --retry 5
```

---

## 🤝 Contributing

We love contributions! Here's how you can help:

1. 🍴 **Fork** the repository
2. 🌿 **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. 💻 **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. 📤 **Push** to the branch (`git push origin feature/amazing-feature`)
5. 🎉 **Open** a Pull Request

### 🛠️ Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/pywhl.git
cd pywhl

# Install development dependencies
npm install

# Run tests
npm test

# Run in development mode
npm run dev
```

---

## ❓ FAQ

### **Q: How is this different from pip download?**

**A:** Pywhl offers:
- 🎨 Beautiful interactive UI
- 🔐 Enterprise security features
- 📊 Comprehensive audit logging
- 🚀 Parallel downloads
- 📦 Bundle creation
- 🔍 Better dependency resolution

### **Q: Can I use this with conda packages?**

**A:** Currently, Pywhl only supports PyPI packages. Conda support is on our roadmap!

### **Q: Does it work on all platforms?**

**A:** Yes! Pywhl works on:
- 🪟 Windows (7, 10, 11)
- 🐧 Linux (all major distros)
- 🍎 macOS (10.14+)

### **Q: Is it safe for production use?**

**A:** Absolutely! Pywhl includes:
- 🔒 Security vulnerability scanning
- 📋 License compliance checking
- 🔐 Package integrity verification
- 📊 Complete audit trails

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  
  ### 🌟 Star us on GitHub!
  
  If Pywhl helps you, please consider giving us a star ⭐
  
  [**🐙 GitHub**](https://github.com/Mrassimo/pywhl) • 
  [**🐛 Issues**](https://github.com/Mrassimo/pywhl/issues) • 
  [**💬 Discussions**](https://github.com/Mrassimo/pywhl/discussions)
  
  ---
  
  Made with ❤️ by the Pywhl Team
  
</div>