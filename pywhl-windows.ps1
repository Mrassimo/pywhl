# Pywhl Lightweight Runner for Windows PowerShell
# This script runs pywhl without requiring npm install

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH"
    Write-Host "Please install Node.js from https://nodejs.org/"
    exit 1
}

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Run pywhl-lightweight.js with all arguments
& node "$scriptDir\pywhl-lightweight.js" $args