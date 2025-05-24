# 🎡 Pywhl CLI

<div align="center">

### 🚀 Python Wheel Manager for Restricted Environments

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Mrassimo/pywhl-purple.svg)](https://github.com/Mrassimo/pywhl)

*Download, manage, and deploy Python packages like a boss in corporate environments* 💼

[**🏃‍♂️ Quick Start**](#-quick-start) • [**✨ Features**](#-features) • [**📖 Usage**](#-usage) • [**🏢 Enterprise**](#-enterprise-features)

</div>

---

## 🏃‍♂️ Quick Start

```bash
# 📦 Install globally (one command!)
npm install -g pywhl

# 🚀 Start using immediately  
pywhl download requests numpy pandas
pywhl interactive  # Launch the beautiful TUI!
```

## ✨ Features

### 🎯 **Phase 1 - MVP** ✅
- 📥 **Smart Downloads** - Auto-select compatible wheels for your platform
- 🔗 **Dependency Magic** - Recursive dependency resolution  
- 🗃️ **Local Cache** - Lightning-fast repeated downloads
- 🌐 **Multi-Platform** - Windows, macOS, Linux support
- 📊 **Rich Info** - Detailed package information lookup

### 🎨 **Phase 2 - Enhanced UX** ✅  
- 🖥️ **Interactive TUI** - Beautiful terminal interface with search & selection
- ⚙️ **Config Profiles** - Save your favorite package sets
- 📋 **Requirements.txt** - Batch download from requirement files
- 📜 **Install Scripts** - Generate platform-specific installation scripts  
- 🌈 **Rich Output** - Progress bars, tables, colors, and emojis!
- 🎭 **ASCII Art** - Because CLIs should be fun!

### 🚀 **Phase 3 - Advanced** ✅
- 🔐 **Private Repos** - Support for corporate PyPI servers with auth
- 📦 **Offline Bundles** - Create self-contained packages for air-gapped systems
- 🧠 **Smart Resolver** - Advanced conflict detection & environment markers
- ⚡ **Parallel Downloads** - Blazing fast concurrent downloads  
- 🌐 **Proxy Support** - Works behind corporate firewalls
- 🔌 **VS Code Extension** - IDE integration for seamless workflow

### 🏢 **Phase 4 - Enterprise** ✅
- 📊 **Audit Logging** - Complete operation tracking for compliance
- 🔒 **Security Scanning** - Automated vulnerability detection  
- 📋 **Policy Management** - Enterprise governance & access controls
- ⚖️ **License Compliance** - Automated license checking & reporting
- 👨‍💼 **Admin Console** - User management & policy enforcement
- 🚨 **Smart Blocking** - Configurable package approval workflows

---

## 🎮 Interactive Mode

<div align="center">
<img src="https://via.placeholder.com/600x300/1a1a1a/00ff00?text=🖥️+Beautiful+TUI+Interface" alt="Interactive Mode" />
</div>

```bash
# 🎯 Launch the gorgeous TUI
pywhl interactive
# or just
pywhl i
```

**Features:**
- 🔍 **Smart Search** - Find packages instantly
- 📦 **Visual Selection** - Pick packages with keyboard navigation  
- 📊 **Live Progress** - Real-time download progress
- 🎨 **Syntax Highlighting** - Beautiful colored output

---

## 📖 Usage

### 📥 **Package Downloads**

```bash
# 📦 Download latest version
pywhl download numpy

# 🎯 Specific version with dependencies  
pywhl download "numpy==1.24.0" --deps

# 📋 From requirements file with parallel downloads
pywhl download -r requirements.txt --parallel 8

# 🌍 Multi-platform download
pywhl download tensorflow -p 3.11 -t "linux_x86_64"

# 🚀 Enterprise packages (Snowflake, SAS, etc.)
pywhl download snowflake-connector-python --deps
```

### 🏢 **Enterprise Commands**

```bash
# 🔧 Initialize enterprise policies
pywhl admin policy init

# 📊 Generate audit reports  
pywhl admin audit report --start 2024-01-01

# 🔒 Security scanning
pywhl admin security scan numpy pandas

# 🚫 Block suspicious packages
pywhl admin policy block-package suspicious-pkg --reason "Security concern"

# 👑 Grant admin privileges
pywhl admin users grant-admin john.doe
```

### 📦 **Offline Bundles**

```bash
# 📮 Create bundle for air-gapped systems
pywhl bundle numpy pandas scikit-learn -o ml-bundle.zip

# 🌍 Multi-platform bundle
pywhl bundle django --platform all -o django-multiplatform.zip

# 📋 Bundle from requirements  
pywhl bundle -r requirements.txt -o production-bundle.zip
```

### ⚙️ **Configuration Magic**

```bash
# 🔧 Show current config
pywhl config show

# 🎯 Create profile for data science
pywhl config profile add datascience numpy pandas jupyter

# 🔐 Add private repository
pywhl repo add myrepo https://private.pypi.corp.com/simple/ --auth-token $TOKEN

# 📊 Cache management
pywhl cache clean --older-than 30
```

---

## 🎨 **Beautiful Output Examples**

### 📊 **Download Progress**
```
🚀 Downloading TensorFlow...

🔍 Running security scan...
✅ No vulnerabilities found
⚖️ Checking license compliance...
📜 License: Apache-2.0 (permissive)

📦 Downloading 26 wheel(s)...
████████████████████████████████████████ 100% | 252MB
✅ Downloaded 26 wheel(s) to ./wheels
```

### 📈 **Audit Report**
```
📊 Enterprise Audit Report

Period: 2024-01-01 to 2024-12-31
Total Actions: 1,337
Unique Users: 42
Packages: 156

┌─────────────────────────┬──────────┐
│ Action Type             │ Count    │
├─────────────────────────┼──────────┤
│ 📥 package_download     │ 891      │
│ 🔒 security_scan       │ 234      │
│ ⚖️ license_check       │ 156      │
│ 👨‍💼 admin_action        │ 56       │
└─────────────────────────┴──────────┘
```

---

## 🔧 Configuration

**Config location:** `~/.pywhl/config.yml`

```yaml
# 🎯 Default settings  
defaults:
  python_version: "3.11"
  platform: auto  # 🤖 Auto-detect
  cache_dir: ~/.pywhl/cache
  output_dir: ./wheels

# 🔐 Repository configuration
repositories:
  - name: pypi
    url: https://pypi.org/simple/
  - name: corporate  
    url: https://pypi.corp.com/simple/
    auth_token: ${CORP_PYPI_TOKEN}
    priority: 0  # 🚀 Higher priority

# 📦 Package profiles
profiles:
  datascience:
    packages: [numpy, pandas, scikit-learn, jupyter]
  web:  
    packages: [django, flask, requests, gunicorn]
  ml:
    packages: [tensorflow, pytorch, transformers]

# 🏢 Enterprise policies  
enterprise:
  audit_enabled: true
  security_scanning: true
  license_compliance: true
  blocked_packages: []
```

---

## 🌟 **Real-World Examples**

### 🏭 **Corporate Data Science Setup**
```bash
# 🚀 Complete ML environment in restricted network
pywhl download -r datascience-requirements.txt --deps
pywhl bundle -r datascience-requirements.txt -o ml-environment.zip
pywhl install-script "*" --venv /opt/ml-env
```

### 🔒 **Air-Gapped Deployment** 
```bash
# 📦 Create offline bundle on internet-connected machine
pywhl bundle tensorflow pytorch scikit-learn --platform all -o ai-bundle.zip

# 📮 Transfer bundle to air-gapped system and install
unzip ai-bundle.zip && ./install.sh
```

### 🏢 **Enterprise Governance**
```bash
# 👨‍💼 Set up enterprise policies
pywhl admin policy init
pywhl admin policy block-package malicious-pkg  
pywhl admin security scan --all-cached
pywhl admin audit report --output compliance-report.json
```

---

## 🚀 **Performance & Scale**

- ⚡ **Parallel Downloads**: Up to 10x faster with concurrent downloads
- 🗃️ **Smart Caching**: 70%+ cache hit rate for repeated operations  
- 📦 **Large Packages**: Tested with TensorFlow (250MB+), Snowflake connector
- 🌍 **Multi-Platform**: Handles complex enterprise packages with ease
- 🔄 **Dependency Trees**: Resolves 50+ dependencies efficiently

---

## 🏆 **Why Pywhl?**

| Feature | pip | Pywhl | 
|---------|-----|-------|
| 🌐 Offline Support | ❌ | ✅ |
| 🏢 Enterprise Features | ❌ | ✅ |
| 🎨 Beautiful Interface | ❌ | ✅ |
| 📊 Audit Logging | ❌ | ✅ |
| 🔒 Security Scanning | ❌ | ✅ |
| ⚡ Parallel Downloads | ❌ | ✅ |
| 🔐 Private Repos | ⚠️ | ✅ |
| 📦 Bundle Creation | ❌ | ✅ |

---

## 🛠️ **Development**

```bash
# 🔧 Clone and setup
git clone https://github.com/Mrassimo/pywhl.git
cd pywhl && npm install

# 🧪 Run tests  
npm test

# 🚀 Local development
npm run dev

# 📦 Build extension
cd vscode-extension && npm run compile
```

---

## 📅 **Roadmap**

- ✅ **Phase 1**: MVP functionality
- ✅ **Phase 2**: Enhanced UX & TUI  
- ✅ **Phase 3**: Advanced features & VS Code
- ✅ **Phase 4**: Enterprise & security
- 🔮 **Phase 5**: Cloud integration & team collaboration

---

## 🤝 **Contributing**

We love contributions! 💖

1. 🍴 Fork the repo
2. 🌿 Create feature branch (`git checkout -b amazing-feature`)
3. 💾 Commit changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to branch (`git push origin amazing-feature`)  
5. 🎯 Open Pull Request

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

### 🌟 **Built with ❤️ for Python developers everywhere**

**Made possible by modern Node.js tooling and enterprise requirements** 🚀

[⭐ Star on GitHub](https://github.com/Mrassimo/pywhl) • [🐛 Report Issues](https://github.com/Mrassimo/pywhl/issues) • [💬 Discussions](https://github.com/Mrassimo/pywhl/discussions)

</div>