# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Claude Code Statusline Manager - a bash-based enhancement system for the Claude Code CLI that provides customizable statuslines with real-time metrics including model info, costs, git status, and performance indicators.

## Key Commands

### Testing Statuslines
```bash
# Test any statusline with sample data
echo '{"model":{"display_name":"Test"},"workspace":{"current_dir":"'$PWD'"}}' | ./statusline-minimal.sh

# Test with full data
echo '{"model":{"display_name":"Opus"},"workspace":{"current_dir":"'$PWD'"},"cost":{"total_cost_usd":0.0456,"total_duration_ms":125000}}' | ./statusline-segments.sh
```

### Manager Operations
```bash
# Run interactive manager
./statusline-manager.sh

# Test a specific statusline
./statusline-manager.sh --test statusline-segments.sh

# Create backup
./statusline-manager.sh --backup

# Restore from backup
./statusline-manager.sh --restore
```

### Installation
```bash
# Install locally (creates .claude/ in current directory)
./install.sh

# Install globally
./install.sh --global

# Install with pre-selected statusline (1=basic, 2=minimal, 3=segments)
./install.sh --statusline 2 --no-config

# Uninstall
./install.sh --uninstall
```

### Validation
```bash
# Validate JSON syntax in settings
jq . ~/.claude/settings.json

# Check script executability
ls -la statusline-*.sh

# Verify dependencies
command -v jq && echo "jq installed" || echo "jq missing"
```

## Architecture & Design Patterns

### JSON Input/Output Flow
All statusline scripts follow a consistent pattern:
1. Read JSON from stdin via `input=$(cat)`
2. Parse with `jq` to extract fields
3. Apply formatting and colors based on values
4. Output formatted string to stdout

The Claude Code CLI pipes session data as JSON to the configured statusline command, expects a formatted string back.

### Script Organization

**Core Scripts:**
- `statusline-*.sh`: Implements specific statusline styles, completely self-contained
- `statusline-manager.sh`: Interactive configuration manager with atomic JSON operations
- `install.sh`: Smart installer that can run directly from GitHub

**Key Design Decisions:**
- No shared libraries between statuslines - each is standalone for reliability
- Atomic JSON updates using temp files to prevent corruption
- Defensive bash with `set -euo pipefail` for error handling
- Color support detection via terminal capabilities check
- Environment variable overrides for all configuration paths

### Safety Mechanisms

1. **Backup System**: Manager creates timestamped backups before any settings changes
2. **Atomic Operations**: JSON updates use temp files + mv for atomicity
3. **Interactive Checks**: Requires terminal for dangerous operations
4. **Cleanup Traps**: EXIT/INT/TERM traps ensure temp files are removed
5. **Path Validation**: All paths validated before operations

### Color Coding Logic

Cost thresholds (consistent across all statuslines):
- Green: < $0.05
- Orange: $0.05 - $0.10  
- Red: > $0.10

Git status:
- Teal: Clean repository
- Yellow: Uncommitted changes

### Configuration Structure

The statusline is configured in `~/.claude/settings.json`:
```json
{
  "statusLine": {
    "type": "command",
    "command": "/absolute/path/to/statusline-script.sh"
  }
}
```

## Environment Variables

Control behavior without code changes:
- `STATUSLINE_DIR`: Override default statusline directory (default: `~/.claude`)
- `SETTINGS_FILE`: Custom settings.json location (default: `~/.claude/settings.json`)
- `BACKUP_DIR`: Backup location (default: `~/.claude/backups`)
- `NO_COLOR`: Disable colors in output
- `TERM`: Set to "dumb" to disable colors
- `REPO_URL`: Override repository URL for installation

## Critical Implementation Notes

### JSON Parsing Safety
Always provide defaults when parsing JSON to handle missing fields:
```bash
value=$(echo "$input" | jq -r '.field // "default"')
```

### Terminal Detection
Scripts check for interactive terminal before operations that require user input:
```bash
if [[ ! -t 0 || ! -t 1 ]]; then
  echo "Error: Interactive terminal required"
  exit 1
fi
```

### Path Handling
- Always use absolute paths in settings.json
- Scripts auto-expand `~` to `$HOME` where needed
- Use `--` in commands to prevent path interpretation as flags

### Git Integration
Git commands are optional - scripts gracefully handle non-git directories:
```bash
if cd "$cwd" 2>/dev/null && git rev-parse --git-dir &>/dev/null; then
  # Git operations
fi
```

## Debugging Issues

### Statusline Not Appearing
1. Check settings.json has correct absolute path
2. Verify script is executable (`chmod +x`)
3. Test script manually with sample JSON
4. Ensure Claude Code was restarted after configuration

### Performance Problems
- The segments statusline uses `bc` for calculations - ensure it's installed
- Git operations in large repos can be slow - consider using minimal statusline
- Context tracking requires reading transcript file - disable if causing issues

### Color Issues
- Check `$TERM` environment variable is set correctly
- Test with `NO_COLOR=1` to disable colors
- Verify terminal supports ANSI escape codes