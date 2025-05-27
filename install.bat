@echo off
REM PyWhl CLI Enterprise - Automated Installation Script for Windows
REM One-command installation with complete automation

setlocal EnableDelayedExpansion

echo.
echo 🚀 PyWhl CLI Enterprise - Automated Installation
echo ================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first:
    echo    - Visit: https://nodejs.org/
    echo    - Or use a package manager like Chocolatey
    exit /b 1
)

REM Get Node.js version
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION% detected

REM Check if npm is available
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed. Please install npm first
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION% detected

REM Install dependencies
echo ℹ️  Installing dependencies...
npm install --silent
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)
echo ✅ Dependencies installed successfully

REM Try to link globally (optional)
echo ℹ️  Attempting to link PyWhl globally...
npm link >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ PyWhl linked globally - you can now use 'pywhl' command anywhere
    set GLOBAL_INSTALL=true
) else (
    echo ⚠️  Global linking failed ^(likely permission issue^)
    echo ℹ️  You can still use PyWhl with: node bin/pywhl.js
    set GLOBAL_INSTALL=false
)

REM Test installation
echo ℹ️  Testing installation...
if "!GLOBAL_INSTALL!"=="true" (
    pywhl --version >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        for /f "tokens=*" %%i in ('pywhl --version 2^>nul ^| findstr /R "^[0-9]"') do set VERSION=%%i
        echo ✅ PyWhl CLI Enterprise !VERSION! ready!
    ) else (
        echo ❌ Global installation test failed
        exit /b 1
    )
) else (
    node bin/pywhl.js --version >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        for /f "tokens=*" %%i in ('node bin/pywhl.js --version 2^>nul ^| findstr /R "^[0-9]"') do set VERSION=%%i
        echo ✅ PyWhl CLI Enterprise !VERSION! ready!
    ) else (
        echo ❌ Local installation test failed
        exit /b 1
    )
)

REM Show usage information
echo.
echo 🎉 Installation Complete!
echo.
echo Quick Start:

if "!GLOBAL_INSTALL!"=="true" (
    echo   pywhl --help                           # Show all commands
    echo   pywhl interactive                      # Launch interactive mode
    echo   pywhl download numpy                   # Download a package
    echo   pywhl admin security scan numpy        # Security scan
) else (
    echo   node bin/pywhl.js --help               # Show all commands
    echo   node bin/pywhl.js interactive          # Launch interactive mode
    echo   node bin/pywhl.js download numpy       # Download a package
    echo   node bin/pywhl.js admin security scan numpy  # Security scan
    
    echo.
    echo 💡 For global access, run as Administrator:
    echo   npm link                               # ^(requires Administrator^)
)

echo.
echo Enterprise Features:
echo   🔒 Security scanning and vulnerability detection
echo   📋 License compliance and policy enforcement
echo   👨‍💼 Enterprise admin controls and user management
echo   📦 Offline bundle creation for air-gapped environments
echo   🏢 Private repository support with authentication
echo   🎯 Interactive TUI and VS Code extension

echo.
echo Documentation:
echo   📚 README.md - Comprehensive guide
echo   🌐 https://github.com/Mrassimo/pywhl

echo.
echo ✅ Ready to revolutionize Python package management! 🚀
echo.

pause