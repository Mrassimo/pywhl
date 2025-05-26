@echo off
REM Pywhl Lightweight Runner for Windows
REM This script runs pywhl without requiring npm install

REM Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0

REM Run pywhl-lightweight.js with all arguments passed to this batch file
node "%SCRIPT_DIR%pywhl-lightweight.js" %*