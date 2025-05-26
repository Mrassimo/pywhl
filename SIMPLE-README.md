# 🐍 Pywhl - One Command to Get Python Packages

**Problem:** Corporate proxy blocks pip  
**Solution:** Use your browser!

## 🚀 Quick Start (30 seconds)

### 1️⃣ Get packages:
```batch
pywhl numpy pandas requests
```

### 2️⃣ Browser opens → Download the wheels

### 3️⃣ Process downloads:
```batch
node process-downloads.js
```

### 4️⃣ Install:
```batch
install-wheels.bat
```

Done! 🎉

## 📥 Installation

1. Download this folder to your work PC
2. Make sure Node.js is installed
3. That's it! No npm install needed

## 🎯 Examples

```batch
# Single package
pywhl numpy

# Multiple packages  
pywhl requests flask django

# Specific version
pywhl pandas==2.0.0

# From requirements.txt
pywhl -r requirements.txt
```

## ❓ Why Browser Mode?

- ✅ Works with ALL corporate proxies
- ✅ Uses browser's login credentials
- ✅ Never fails if browser works

## 🆘 Troubleshooting

**"Node.js not found"**  
→ Install from nodejs.org (portable version OK)

**"Can't download from PyPI page"**  
→ Your browser is blocked too. Use a different network or get pre-built packages.

**"Wrong wheel for my system"**  
→ Download the one ending in:
- Windows: `win_amd64.whl`
- Universal: `py3-none-any.whl`

---

**That's all!** If your browser can access PyPI, you can get packages. 🌐✨