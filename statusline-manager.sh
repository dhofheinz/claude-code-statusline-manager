#!/usr/bin/env bash
# Claude Code Statusline Manager (refactored, fixed interactive exit)
# - Keeps all original functionality
# - Safer error handling, atomic JSON writes, robust input parsing
# - No `ls` parsing; nullglob with sorted arrays
# - Defensive directory creation; consistent, testable helpers

set -euo pipefail
IFS=$'\n\t'

# ----- Configuration ---------------------------------------------------------
STATUSLINE_DIR="${STATUSLINE_DIR:-$HOME/.claude}"
SETTINGS_FILE="${SETTINGS_FILE:-$HOME/.claude/settings.json}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/.claude/backups}"

# ----- Color / UI ------------------------------------------------------------
if [[ -t 1 && -z "${NO_COLOR:-}" && "${TERM:-}" != "dumb" ]]; then
  RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[1;33m'
  BLUE=$'\033[0;34m'; CYAN=$'\033[0;36m'; NC=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BLUE=""; CYAN=""; NC=""
fi

print_error()   { printf '%b\n' "${RED}❌ ERROR: $*${NC}" >&2; }
print_success() { printf '%b\n' "${GREEN}✅ $*${NC}"; }
print_warning() { printf '%b\n' "${YELLOW}⚠️  $*${NC}"; }
print_info()    { printf '%b\n' "${CYAN}ℹ️  $*${NC}"; }
print_header()  { printf '%b\n' "${BLUE}$*${NC}"; }

# ----- Utilities -------------------------------------------------------------
cleanup_files=()
cleanup() {
  for f in "${cleanup_files[@]:-}"; do
    [[ -n "$f" && -e "$f" ]] && rm -f -- "$f" || true
  done
}
trap cleanup EXIT INT TERM

require_interactive() {
  if [[ ! -t 0 || ! -t 1 ]]; then
    print_error "This script must be run interactively"
    print_info  "Try running it directly in your terminal: $0"
    exit 1
  fi
}

ensure_dirs() {
  mkdir -p -- "$STATUSLINE_DIR" "$BACKUP_DIR" "$(dirname -- "$SETTINGS_FILE")"
}

tmpfile() {
  local t
  t="$(mktemp "${SETTINGS_FILE}.XXXXXX.tmp")"
  cleanup_files+=("$t")
  printf '%s' "$t"
}

confirm() {
  local ans
  printf '%s ' "$1 (y/n): "
  if ! IFS= read -r ans; then ans=""; fi
  [[ "$ans" == [yY] || "$ans" == "yes" || "$ans" == "YES" ]]
}

safe_read() {
  local __var="$1"; shift
  local input
  printf '%s' "$*"
  if ! IFS= read -r input; then input=""; fi
  printf -v "$__var" '%s' "$input"
}

# ----- Dependencies ----------------------------------------------------------
check_dependencies() {
  local missing=()
  command -v jq >/dev/null 2>&1 || missing+=("jq")
  if ((${#missing[@]})); then
    print_error "Missing required dependencies: ${missing[*]}"
    if command -v apt-get >/dev/null 2.>&1; then
      print_info  "Install with: sudo apt-get install ${missing[*]}"
    elif command -v brew >/dev/null 2.>&1; then
      print_info  "Install with: brew install ${missing[*]}"
    else
      print_info  "Install the missing tools using your package manager."
    fi
    exit 1
  fi
}

# ----- JSON helpers ----------------------------------------------------------
validate_json() {
  local file="$1"
  if ! jq empty -- "$file" 2>/dev/null; then
    print_error "Invalid JSON in $file"
    return 1
  fi
}

atomic_write_json() {
  local t
  t="$(tmpfile)"
  if ! jq "$@" -- "$SETTINGS_FILE" >"$t"; then
    print_error "Failed to generate updated JSON"
    return 1
  fi
  validate_json "$t" || return 1
  mv -- "$t" "$SETTINGS_FILE"
  print_success "Settings updated"
}

# ----- Settings init / backup / restore --------------------------------------
initialize_settings() {
  if [[ ! -f "$SETTINGS_FILE" ]]; then
    print_warning "No settings.json found. Creating default configuration..."
    cat >"$SETTINGS_FILE" <<'EOF'
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "env": {},
  "permissions": {
    "allow": [],
    "deny": []
  }
}
EOF
    print_success "Created default settings.json"
  fi
}

create_backup() {
  ensure_dirs
  local ts backup
  ts="$(date +%Y%m%d_%H%M%S)"
  backup="$BACKUP_DIR/settings_${ts}.json"
  if [[ -f "$SETTINGS_FILE" ]]; then
    cp -p -- "$SETTINGS_FILE" "$backup"
    print_success "Backup created: $backup"
    printf '%s\n' "$backup"
  else
    print_warning "No existing settings.json to backup"
    printf '\n'
  fi
}

list_backups_array() {
  shopt -s nullglob
  local files=( "$BACKUP_DIR"/settings_*.json )
  shopt -u nullglob
  if ((${#files[@]})); then
    printf '%s\n' "${files[@]}" | sort -r
  fi
}

restore_backup() {
  ensure_dirs
  local backups=()
  while IFS= read -r line; do backups+=("$line"); done < <(list_backups_array || true)

  if ((${#backups[@]} == 0)); then
    print_error "No backups found in $BACKUP_DIR"
    return 1
  fi

  print_header "Available backups:"
  for i in "${!backups[@]}"; do
    local filename ts
    filename="$(basename -- "${backups[$i]}")"
    ts="${filename#settings_}"; ts="${ts%.json}"
    printf '  %d) %s\n' "$((i+1))" "$ts"
  done
  echo ""

  local choice_raw choice
  safe_read choice_raw "Select backup to restore (1-${#backups[@]}) or 0 to cancel: "
  if [[ ! "$choice_raw" =~ ^[0-9]+$ ]]; then
    print_error "Invalid selection"
    return 1
  fi
  choice=$((choice_raw))

  if ((choice == 0)); then
    print_info "Restore cancelled"
    return 0
  fi
  if ((choice < 1 || choice > ${#backups[@]})); then
    print_error "Invalid selection"
    return 1
  fi

  local selected="${backups[$((choice-1))]}"
  validate_json "$selected" || { print_error "Selected backup has invalid JSON"; return 1; }

  create_backup >/dev/null || true
  cp -p -- "$selected" "$SETTINGS_FILE"
  print_success "Settings restored from: $(basename -- "$selected")"
}

# ----- Statusline operations --------------------------------------------------
update_statusline() {
  local script_path="${1-}"

  if [[ -n "$script_path" ]]; then
    if [[ ! -f "$script_path" ]]; then
      print_error "Script not found: $script_path"
      return 1
    fi
    if [[ ! -x "$script_path" ]]; then
      print_warning "Script is not executable. Making it executable..."
      chmod +x -- "$script_path"
    fi
    atomic_write_json --arg cmd "$script_path" '.statusLine = {"type": "command", "command": $cmd}' \
      && print_success "Statusline updated" \
      || return 1
  else
    atomic_write_json 'del(.statusLine)' \
      && print_success "Statusline disabled" \
      || return 1
  fi
}

test_statusline() {
  local script="$1"
  if [[ ! -f "$script" ]]; then
    print_error "Script not found: $script"
    return 1
  fi
  print_info "Testing statusline with sample data..."

  local test_json
  test_json="$(cat <<JSON
{
  "model": {"display_name": "Opus", "id": "claude-opus-4-1"},
  "workspace": {"current_dir": "$HOME/test"},
  "cwd": "$HOME/test",
  "cost": {
    "total_cost_usd": 0.0456,
    "total_duration_ms": 125000,
    "total_lines_added": 78,
    "total_lines_removed": 23
  }
}
JSON
)"
  echo ""
  print_header "Output preview:"
  printf '  '
  printf '%s' "$test_json" | "$script" || true
  echo -e "\n"
}

current_statusline_path() {
  local value="none"
  if [[ -f "$SETTINGS_FILE" ]]; then
    value="$(jq -r '.statusLine.command // "none"' -- "$SETTINGS_FILE" 2>/dev/null || echo "none")"
  fi
  printf '%s' "$value"
}

collect_known_scripts() {
  local arr=()
  [[ -f "$STATUSLINE_DIR/statusline-basic.sh"    ]] && arr+=("$STATUSLINE_DIR/statusline-basic.sh")
  [[ -f "$STATUSLINE_DIR/statusline-minimal.sh"  ]] && arr+=("$STATUSLINE_DIR/statusline-minimal.sh")
  [[ -f "$STATUSLINE_DIR/statusline-segments.sh" ]] && arr+=("$STATUSLINE_DIR/statusline-segments.sh")
  printf '%s\n' "${arr[@]}"
}

# Global to carry script count without using return codes
LIST_COUNT=0

list_statuslines() {
  print_header "Available statusline scripts:"
  echo ""

  local scripts=()
  while IFS= read -r s; do scripts+=("$s"); done < <(collect_known_scripts || true)

  local descs=(
    "Basic - Terminal-style user@host:dir"
    "Minimal - Simple info with segments style"
    "Full - All features with segments style"
  )

  local current
  current="$(current_statusline_path)"

  local idx=0
  for i in "${!scripts[@]}"; do
    local marker=""
    if [[ "${scripts[$i]}" == "$current" ]]; then
      marker=" ${GREEN}[ACTIVE]${NC}"
    fi
    printf '  %d) %s%s\n' "$((i+1))" "${descs[$i]}" "$marker"
    printf '      Path: %s\n' "${scripts[$i]}"
    idx=$((i+1))
  done

  printf '  %d) Disable statusline\n'      $((idx+1))
  printf '  %d) Restore from backup\n'     $((idx+2))
  printf '  %d) Custom script path\n'      $((idx+3))

  LIST_COUNT=${#scripts[@]}
  return 0
}

# ----- Main menu -------------------------------------------------------------
main_menu() {
  while true; do
    clear || true
    print_header "🎨 Claude Code Statusline Manager"
    printf '%s\n' "======================================"
    echo ""

    local current
    current="$(current_statusline_path)"
    if [[ "$current" != "none" ]]; then
      print_info "Current: $(basename -- "$current")"
    else
      print_info "Current: Statusline disabled"
    fi
    echo ""

    list_statuslines
    local num_scripts="${LIST_COUNT:-0}"

    echo ""
    echo "  0) Exit"
    echo ""

    local choice_raw
    safe_read choice_raw "Select option: "

    if [[ ! "$choice_raw" =~ ^[0-9]+$ ]]; then
      print_error "Invalid choice"
      echo ""
      read -r -p "Press Enter to continue..." _ || true
      continue
    fi
    local choice=$((choice_raw))

    case "$choice" in
      0)
        print_info "Exiting..."
        return 0
        ;;
      *)
        if ((choice >= 1 && choice <= num_scripts)); then
          local scripts=()
          while IFS= read -r s; do scripts+=("$s"); done < <(collect_known_scripts || true)
          local selected="${scripts[$((choice-1))]}"

          test_statusline "$selected"
          if confirm "Apply this statusline?"; then
            local backup_file
            backup_file="$(create_backup || true)"
            if update_statusline "$selected"; then
              print_success "Statusline updated successfully"
              print_warning "Restart Claude Code to apply changes"
            else
              print_error "Failed to update statusline"
              [[ -n "${backup_file:-}" ]] && print_info "You can restore from: $backup_file"
            fi
          else
            print_info "Cancelled"
          fi
        elif ((choice == num_scripts + 1)); then
          local backup_file
          backup_file="$(create_backup || true)"
          if update_statusline ""; then
            print_success "Statusline disabled"
            print_warning "Restart Claude Code to apply changes"
          else
            print_error "Failed to disable statusline"
            [[ -n "${backup_file:-}" ]] && print_info "You can restore from: $backup_file"
          fi
        elif ((choice == num_scripts + 2)); then
          restore_backup || true
        elif ((choice == num_scripts + 3)); then
          local custom_path
          safe_read custom_path "Enter custom script path: "
          if [[ -f "$custom_path" ]]; then
            test_statusline "$custom_path"
            if confirm "Apply this statusline?"; then
              local backup_file
              backup_file="$(create_backup || true)"
              if update_statusline "$custom_path"; then
                print_success "Custom statusline applied"
                print_warning "Restart Claude Code to apply changes"
              fi
            fi
          else
            print_error "File not found: $custom_path"
          fi
        else
          print_error "Invalid choice for numeric option"
        fi
        ;;
    esac

    echo ""
    read -r -p "Press Enter to continue..." _ || true
  done
}

# ----- CLI entrypoint --------------------------------------------------------
usage() {
  print_header "Claude Code Statusline Manager"
  echo ""
  echo "Usage:"
  echo "  $0              - Interactive menu"
  echo "  $0 --restore    - Restore from backup"
  echo "  $0 --test PATH  - Test a statusline script"
  echo "  $0 --backup     - Create backup of current settings"
  echo "  $0 --help       - Show this help"
}

main() {
  ensure_dirs
  case "${1:-}" in
    --restore)
      check_dependencies
      initialize_settings
      restore_backup
      ;;
    --test)
      if [[ -z "${2:-}" ]]; then
        print_error "Usage: $0 --test <script_path>"
        exit 1
      fi
      test_statusline "$2"
      ;;
    --backup)
      create_backup
      ;;
    --help|-h)
      usage
      ;;
    *)
      check_dependencies
      initialize_settings
      require_interactive
      main_menu
      ;;
  esac
}

main "$@"
