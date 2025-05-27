#!/bin/bash
#
# PyWhl CLI Enterprise - Automated Installation Script
# One-command installation with complete automation
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo ""
echo -e "${BLUE}🚀 PyWhl CLI Enterprise - Automated Installation${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 16+ first:"
    echo "  - Visit: https://nodejs.org/"
    echo "  - Or use a package manager like nvm, brew, or apt"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ "$MAJOR_VERSION" -lt 16 ]; then
    log_error "Node.js version $NODE_VERSION detected. PyWhl requires Node.js 16+"
    log_info "Please upgrade Node.js and try again"
    exit 1
fi

log_success "Node.js $NODE_VERSION detected"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed. Please install npm first"
    exit 1
fi

log_success "npm $(npm --version) detected"

# Install dependencies
log_info "Installing dependencies..."
if npm install --silent; then
    log_success "Dependencies installed successfully"
else
    log_error "Failed to install dependencies"
    exit 1
fi

# Make CLI executable
chmod +x bin/pywhl.js
log_success "CLI made executable"

# Try to link globally (optional)
log_info "Attempting to link PyWhl globally..."
if npm link --silent 2>/dev/null; then
    log_success "PyWhl linked globally - you can now use 'pywhl' command anywhere"
    GLOBAL_INSTALL=true
else
    log_warning "Global linking failed (likely permission issue)"
    log_info "You can still use PyWhl with: node bin/pywhl.js"
    GLOBAL_INSTALL=false
fi

# Test installation
log_info "Testing installation..."
if [ "$GLOBAL_INSTALL" = true ]; then
    if pywhl --version >/dev/null 2>&1; then
        VERSION=$(pywhl --version 2>&1 | grep -E '^[0-9]' | head -n1)
        log_success "PyWhl CLI Enterprise $VERSION ready!"
    else
        log_warning "Global installation test had issues, but CLI should work"
        log_info "Try running: pywhl --help"
    fi
else
    if node bin/pywhl.js --version >/dev/null 2>&1; then
        VERSION=$(node bin/pywhl.js --version 2>&1 | grep -E '^[0-9]' | head -n1)
        log_success "PyWhl CLI Enterprise $VERSION ready!"
    else
        log_error "Local installation test failed"
        exit 1
    fi
fi

# Show usage information
echo ""
echo -e "${GREEN}🎉 Installation Complete!${NC}"
echo ""
echo -e "${BLUE}Quick Start:${NC}"

if [ "$GLOBAL_INSTALL" = true ]; then
    echo "  pywhl --help                           # Show all commands"
    echo "  pywhl interactive                      # Launch interactive mode"
    echo "  pywhl download numpy                   # Download a package"
    echo "  pywhl admin security scan numpy        # Security scan"
else
    echo "  node bin/pywhl.js --help               # Show all commands"
    echo "  node bin/pywhl.js interactive          # Launch interactive mode"
    echo "  node bin/pywhl.js download numpy       # Download a package"
    echo "  node bin/pywhl.js admin security scan numpy  # Security scan"
    
    echo ""
    echo -e "${YELLOW}💡 For global access, run:${NC}"
    echo "  sudo npm link                          # (requires sudo/admin)"
fi

echo ""
echo -e "${BLUE}Enterprise Features:${NC}"
echo "  🔒 Security scanning and vulnerability detection"
echo "  📋 License compliance and policy enforcement"
echo "  👨‍💼 Enterprise admin controls and user management"
echo "  📦 Offline bundle creation for air-gapped environments"
echo "  🏢 Private repository support with authentication"
echo "  🎯 Interactive TUI and VS Code extension"

echo ""
echo -e "${BLUE}Documentation:${NC}"
echo "  📚 README.md - Comprehensive guide"
echo "  🌐 https://github.com/Mrassimo/pywhl"

echo ""
log_success "Ready to revolutionize Python package management! 🚀"
echo ""