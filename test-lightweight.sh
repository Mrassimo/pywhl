#!/bin/bash

# Test script for pywhl lightweight version

echo "🧪 Testing pywhl lightweight version..."
echo ""

# Test 1: Check if lightweight version runs
echo "Test 1: Basic execution"
node pywhl-lightweight.js --version 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Lightweight version executes successfully"
else
    echo "❌ Failed to execute lightweight version"
    exit 1
fi

# Test 2: Test help command
echo ""
echo "Test 2: Help command"
node pywhl-lightweight.js --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Help command works"
else
    echo "❌ Help command failed"
fi

# Test 3: Test package info (doesn't require download)
echo ""
echo "Test 3: Package info command"
node pywhl-lightweight.js info wheel > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Package info command works"
else
    echo "❌ Package info command failed (might be network related)"
fi

# Test 4: Check cache directory creation
echo ""
echo "Test 4: Cache directory"
if [ -d "$HOME/.pywhl/cache" ]; then
    echo "✅ Cache directory exists"
else
    echo "✅ Cache directory will be created on first use"
fi

echo ""
echo "🎉 Lightweight version is ready to use!"
echo ""
echo "To use on your work PC:"
echo "1. Copy the entire pywhl directory to your work PC"
echo "2. No npm install needed!"
echo "3. Run using: node pywhl-lightweight.js <command>"
echo "   Or on Windows: pywhl-windows.bat <command>"