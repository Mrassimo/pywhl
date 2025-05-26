# 🌐 Pywhl Browser Mode - Ultimate Solution for Corporate Proxies

## 🎯 The Problem It Solves

In corporate environments:
- ❌ CLI tools can't authenticate through proxies
- ❌ Direct downloads fail with 403/407 errors
- ✅ But browsers work fine (they handle proxy auth)

**Solution:** Let the browser do the downloading!

## 🚀 Quick Start (3 Steps)

### Step 1: Generate URLs
```batch
pywhl-browser.bat numpy pandas requests
```

This creates:
- `pywhl-downloads/download-helper.html` - Open this in your browser!
- `pywhl-downloads/download-urls.json` - URL list for reference

### Step 2: Download via Browser
1. Open `download-helper.html` in your browser
2. Click "View on PyPI" for each package
3. Download the appropriate wheel for your system
4. Save to the `pywhl-downloads` folder

### Step 3: Process Downloads
```batch
node process-downloads.js
```

This:
- Organizes your downloads
- Creates install scripts
- Generates SHA-256 hashes
- Prepares everything for pip

## 📋 Complete Workflow Example

```batch
C:\work> pywhl-browser.bat numpy==1.24.0
📦 Generating download URLs for 1 package(s)...
📍 numpy 1.24.0
✅ URLs generated successfully!

C:\work> start pywhl-downloads\download-helper.html
[Browser opens with clickable links]

[After downloading numpy wheel manually...]

C:\work> node process-downloads.js
🔍 Scanning download directory: C:\work\pywhl-downloads
📦 Found 1 package file(s)

Processing: numpy-1.24.0-cp39-cp39-win_amd64.whl
  ✅ Processed successfully
  📁 Saved to: C:\work\pywhl-organized\numpy\1.24.0
  🔐 SHA256: a1b2c3d4e5f6...

📊 Processing Summary:
  ✅ Successfully processed: 1
  ❌ Errors: 0

🚀 To install these packages:
  Windows: install-wheels.bat

C:\work> install-wheels.bat
Installing numpy 1.24.0...
Successfully installed numpy
Installation complete!
```

## 🛠️ Advanced Usage

### Multiple Packages
```batch
pywhl-browser.bat requests flask django scipy
```

### Specific Versions
```batch
pywhl-browser.bat pandas==2.0.0 numpy==1.24.0
```

### From Requirements File
```batch
pywhl-browser.bat -r requirements.txt
```

## 📁 Directory Structure

After running the workflow:
```
your-project/
├── pywhl-downloads/          # Downloaded files go here
│   ├── download-helper.html  # Open this in browser
│   ├── download-urls.json    # URL reference
│   └── *.whl                 # Your downloaded wheels
├── pywhl-cache/              # Pip-compatible cache
├── pywhl-organized/          # Organized by package/version
│   └── numpy/
│       └── 1.24.0/
│           ├── numpy-1.24.0-cp39-cp39-win_amd64.whl
│           └── numpy-1.24.0-cp39-cp39-win_amd64.whl.json
└── install-wheels.bat        # Generated install script
```

## 🎨 Understanding the HTML Helper

The generated HTML uses color coding:
- 🟢 **Green**: Universal wheels (work everywhere)
- 🟡 **Yellow**: Platform-specific wheels
- 🔴 **Red**: Source distributions (need compilation)

## 💡 Pro Tips

### 1. Can't Access PyPI Page?
If the PyPI page is blocked, try the direct URLs in the HTML (less reliable but worth a shot).

### 2. Which Wheel to Download?
- **Windows**: Look for `win_amd64` (64-bit) or `win32` (32-bit)
- **Universal**: `py3-none-any` works on all platforms
- **Check your Python**: `python -c "import platform; print(platform.machine())"`

### 3. Batch Downloads
Open multiple PyPI pages in tabs and download all at once.

### 4. Offline Installation
After processing, the `pywhl-cache` folder can be used offline:
```batch
pip install --no-index --find-links pywhl-cache package-name
```

## 🔧 Troubleshooting

**"No files found in download directory"**
- Make sure you saved files to `pywhl-downloads` folder
- Check file extensions (.whl or .tar.gz)

**"Could not parse filename"**
- Don't rename downloaded files
- Keep original names from PyPI

**"pip install fails"**
- Check Python version matches wheel version
- Try the universal wheel if platform-specific fails

## 🚨 Why This Works

1. **Browsers handle proxy authentication** - They have your credentials
2. **PyPI serves static files** - No API calls needed
3. **pip works offline** - Once you have the files

This approach bypasses ALL proxy issues by using your browser as the downloader!

## 📝 Complete Example Session

```batch
REM 1. Start with a requirements.txt
type requirements.txt
numpy==1.24.0
pandas==2.0.0
requests>=2.28.0

REM 2. Generate URLs
pywhl-browser.bat -r requirements.txt

REM 3. Open browser helper
start pywhl-downloads\download-helper.html

REM 4. [Download files manually via browser]

REM 5. Process downloads
node process-downloads.js

REM 6. Install everything
install-wheels.bat

REM 7. Verify installation
python -c "import numpy, pandas, requests; print('All packages installed!')"
```

## 🎉 Success!

You've just bypassed corporate proxy restrictions using the one tool that always works - your browser! No more 403 errors, no more proxy authentication issues. Just pure Python package management. 🐍✨