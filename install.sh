#!/usr/bin/env bash
# Claude Code Statusline Manager - Installation Script
# Automated installation with dependency checking and configuration

set -euo pipefail
IFS=$'\n\t'

# Configuration
REPO_URL="https://github.com/dhofheinz/claude-code-statusline-manager.git"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.claude/statusline-manager}"
CLAUDE_DIR="${CLAUDE_DIR:-$HOME/.claude}"
SETTINGS_FILE="${SETTINGS_FILE:-$CLAUDE_DIR/settings.json}"

# Colors
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'
  BLUE=$'\033[0;34m'; CYAN=$'\033[0;36m'; NC=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""; NC=""
fi

# Output functions
print_error()   { printf '%b\n' "${RED}❌ ERROR: $*${NC}" >&2; }
print_success() { printf '%b\n' "${GREEN}✅ $*${NC}"; }
print_warning() { printf '%b\n' "${YELLOW}⚠️  $*${NC}"; }
print_info()    { printf '%b\n' "${CYAN}ℹ️  $*${NC}"; }
print_header()  { 
  printf '\n%b\n' "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  printf '%b\n' "${BLUE}  $*${NC}"
  printf '%b\n\n' "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check dependencies
check_dependencies() {
  local missing=()
  
  print_header "Checking Dependencies"
  
  # Check required tools
  if ! command -v jq >/dev/null 2>&1; then
    missing+=("jq")
    print_error "jq is not installed (required)"
  else
    print_success "jq $(jq --version)"
  fi
  
  if ! command -v git >/dev/null 2>&1; then
    print_warning "git is not installed (optional, but recommended)"
  else
    print_success "git $(git --version | head -1)"
  fi
  
  if ! command -v bc >/dev/null 2>&1; then
    print_warning "bc is not installed (optional, needed for advanced statuslines)"
  else
    print_success "bc installed"
  fi
  
  if ! command -v claude >/dev/null 2>&1; then
    print_warning "Claude Code not found in PATH"
    print_info "Make sure Claude Code is installed and available"
  else
    print_success "Claude Code found"
  fi
  
  if ((${#missing[@]})); then
    print_error "Missing required dependencies: ${missing[*]}"
    
    if command -v apt-get >/dev/null 2>&1; then
      print_info "Install with: sudo apt-get install ${missing[*]}"
    elif command -v brew >/dev/null 2>&1; then
      print_info "Install with: brew install ${missing[*]}"
    elif command -v yum >/dev/null 2>&1; then
      print_info "Install with: sudo yum install ${missing[*]}"
    else
      print_info "Please install ${missing[*]} using your package manager"
    fi
    return 1
  fi
  
  return 0
}

# Download or update repository
download_repo() {
  print_header "Installing Claude Code Statusline Manager"
  
  if [[ -d "$INSTALL_DIR/.git" ]]; then
    print_info "Existing installation found. Updating..."
    cd "$INSTALL_DIR"
    if git pull --quiet; then
      print_success "Updated to latest version"
    else
      print_warning "Could not update. Using existing version"
    fi
  else
    print_info "Downloading from GitHub..."
    mkdir -p "$(dirname "$INSTALL_DIR")"
    
    if command -v git >/dev/null 2>&1; then
      git clone --quiet "$REPO_URL" "$INSTALL_DIR"
      print_success "Downloaded successfully"
    else
      print_error "git is required for installation"
      print_info "Please install git or manually download the repository"
      return 1
    fi
  fi
  
  # Make scripts executable
  chmod +x "$INSTALL_DIR"/*.sh 2>/dev/null || true
}

# Initialize Claude directory and settings
initialize_claude() {
  print_header "Configuring Claude Code"
  
  # Create Claude directory if it doesn't exist
  if [[ ! -d "$CLAUDE_DIR" ]]; then
    print_info "Creating Claude directory at $CLAUDE_DIR"
    mkdir -p "$CLAUDE_DIR"
  fi
  
  # Initialize settings.json if it doesn't exist
  if [[ ! -f "$SETTINGS_FILE" ]]; then
    print_info "Creating default settings.json"
    cat > "$SETTINGS_FILE" <<'EOF'
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "env": {},
  "permissions": {
    "allow": [],
    "deny": []
  }
}
EOF
    print_success "Settings file created"
  else
    print_info "Settings file already exists"
  fi
}

# Copy statusline scripts
install_statuslines() {
  print_header "Installing Statusline Scripts"
  
  local scripts=(
    "statusline-basic.sh"
    "statusline-minimal.sh"
    "statusline-segments.sh"
  )
  
  for script in "${scripts[@]}"; do
    if [[ -f "$INSTALL_DIR/$script" ]]; then
      cp "$INSTALL_DIR/$script" "$CLAUDE_DIR/"
      chmod +x "$CLAUDE_DIR/$script"
      print_success "Installed $script"
    fi
  done
  
  # Copy manager script
  if [[ -f "$INSTALL_DIR/statusline-manager.sh" ]]; then
    cp "$INSTALL_DIR/statusline-manager.sh" "$CLAUDE_DIR/"
    chmod +x "$CLAUDE_DIR/statusline-manager.sh"
    print_success "Installed manager script"
  fi
}

# Configure statusline
configure_statusline() {
  print_header "Statusline Configuration"
  
  print_info "Available statuslines:"
  echo "  1) Basic    - Terminal-style user@host:dir"
  echo "  2) Minimal  - Compact powerline with essential info"
  echo "  3) Segments - Full-featured with all metrics"
  echo "  4) None     - Skip configuration for now"
  echo ""
  
  read -p "Select statusline to activate (1-4): " choice
  
  case "$choice" in
    1)
      local script="$CLAUDE_DIR/statusline-basic.sh"
      local name="Basic"
      ;;
    2)
      local script="$CLAUDE_DIR/statusline-minimal.sh"
      local name="Minimal"
      ;;
    3)
      local script="$CLAUDE_DIR/statusline-segments.sh"
      local name="Segments"
      ;;
    4)
      print_info "Skipping configuration. Run manager later with:"
      print_info "  $CLAUDE_DIR/statusline-manager.sh"
      return 0
      ;;
    *)
      print_warning "Invalid choice. Skipping configuration"
      return 0
      ;;
  esac
  
  # Update settings.json
  if jq --arg cmd "$script" '.statusLine = {"type": "command", "command": $cmd}' \
     "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp"; then
    mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
    print_success "$name statusline configured"
    print_warning "Restart Claude Code to see your new statusline"
  else
    print_error "Failed to update settings"
  fi
}

# Create convenience symlink
create_symlink() {
  print_header "Creating Convenience Symlink"
  
  local bin_dir="$HOME/.local/bin"
  
  if [[ -d "$bin_dir" ]]; then
    ln -sf "$CLAUDE_DIR/statusline-manager.sh" "$bin_dir/claude-statusline" 2>/dev/null || true
    
    if [[ -L "$bin_dir/claude-statusline" ]]; then
      print_success "Created symlink: claude-statusline"
      print_info "You can now run 'claude-statusline' from anywhere"
    fi
  else
    print_info "Run the manager with: $CLAUDE_DIR/statusline-manager.sh"
  fi
}

# Main installation flow
main() {
  clear || true
  
  cat << 'EOF'
   ______  __                      __        ______               __       
  /      \|  \                    |  \      /      \             |  \      
 |  ▓▓▓▓▓▓\ ▓▓ ______ __   __  ____| ▓▓____ |  ▓▓▓▓▓▓\ ______ ____| ▓▓ ____  
 | ▓▓   \▓▓ ▓▓|      \  \ |  \|      ▓▓    \| ▓▓   \▓▓/      \      ▓▓/      \ 
 | ▓▓     | ▓▓ \▓▓▓▓▓▓\ ▓▓ | ▓▓ ▓▓▓▓▓▓▓ ▓▓▓▓\ ▓▓     |  ▓▓▓▓▓▓\▓▓▓▓▓▓\  ▓▓▓▓▓▓\
 | ▓▓   __| ▓▓/      ▓▓ ▓▓ | ▓▓ ▓▓  | ▓▓ ▓▓ | ▓▓   __| ▓▓  | ▓▓ ▓▓ | ▓▓ ▓▓    ▓▓
 | ▓▓__/  \ ▓▓  ▓▓▓▓▓▓▓ ▓▓_/ ▓▓ ▓▓__| ▓▓ ▓▓ | ▓▓__/  \ ▓▓__/ ▓▓ ▓▓ | ▓▓ ▓▓▓▓▓▓▓▓
  \▓▓    ▓▓ ▓▓\▓▓    ▓▓\▓▓   ▓▓\▓▓    ▓▓ ▓▓  \▓▓    ▓▓\▓▓    ▓▓ ▓▓ | ▓▓\▓▓     \
   \▓▓▓▓▓▓ \▓▓ \▓▓▓▓▓▓▓ \▓▓▓▓▓  \▓▓▓▓▓▓▓\▓▓   \▓▓▓▓▓▓  \▓▓▓▓▓▓ \▓▓  \▓▓ \▓▓▓▓▓▓▓

                     S T A T U S L I N E   M A N A G E R
EOF
  
  echo ""
  print_info "This script will install Claude Code Statusline Manager"
  print_info "Installation directory: $INSTALL_DIR"
  echo ""
  
  # Run installation steps
  if ! check_dependencies; then
    print_error "Please install missing dependencies and run again"
    exit 1
  fi
  
  download_repo || exit 1
  initialize_claude || exit 1
  install_statuslines || exit 1
  configure_statusline || true
  create_symlink || true
  
  # Final message
  print_header "Installation Complete!"
  
  print_success "Claude Code Statusline Manager has been installed"
  echo ""
  print_info "Next steps:"
  echo "  • Restart Claude Code to see your statusline"
  echo "  • Run the manager to change statuslines:"
  echo "    $CLAUDE_DIR/statusline-manager.sh"
  echo "  • Read the documentation:"
  echo "    $INSTALL_DIR/README.md"
  echo ""
  print_info "Thank you for using Claude Code Statusline Manager!"
}

# Handle script arguments
case "${1:-}" in
  --help|-h)
    echo "Claude Code Statusline Manager Installer"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --uninstall    Remove installation"
    echo "  --update       Update to latest version"
    echo ""
    echo "Environment variables:"
    echo "  INSTALL_DIR    Installation directory (default: ~/.claude/statusline-manager)"
    echo "  CLAUDE_DIR     Claude config directory (default: ~/.claude)"
    echo "  NO_COLOR       Disable colored output"
    ;;
  --uninstall)
    print_header "Uninstalling Claude Code Statusline Manager"
    
    if [[ -d "$INSTALL_DIR" ]]; then
      rm -rf "$INSTALL_DIR"
      print_success "Removed installation directory"
    fi
    
    # Remove installed scripts
    rm -f "$CLAUDE_DIR"/statusline-*.sh
    rm -f "$HOME/.local/bin/claude-statusline"
    
    print_success "Uninstallation complete"
    print_info "Your settings.json was preserved"
    ;;
  --update)
    print_header "Updating Claude Code Statusline Manager"
    download_repo
    install_statuslines
    print_success "Update complete"
    ;;
  *)
    main
    ;;
esac