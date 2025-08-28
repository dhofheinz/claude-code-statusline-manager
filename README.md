# Claude Code Statusline Manager

🎨 A collection of customizable statusline scripts for [Claude Code](https://github.com/anthropics/claude-code), providing rich visual feedback about your coding sessions including model info, costs, git status, and more.

## Features

### 📊 Available Statusline Styles

1. **Basic** (`statusline-basic.sh`)
   - Terminal-style `user@host:directory` format
   - Minimal and familiar
   - Perfect for users who prefer traditional prompts

2. **Minimal** (`statusline-minimal.sh`)
   - Compact powerline-style segments
   - Shows: Model, Directory, Git status, Cost, Duration
   - Clean arrow transitions between segments
   - Color-coded cost indicators

3. **Full Segments** (`statusline-segments.sh`)
   - Feature-rich powerline display
   - Everything from Minimal plus:
     - Cost burn rate ($/hour)
     - API efficiency indicators
     - Context usage with visual progress bar
     - Line changes with net indicators
     - Project-relative paths
     - Detailed git stats (staged/unstaged/ahead/behind)

### 🎯 Key Features

- **Real-time Updates**: Statusline updates after each Claude interaction
- **Git Integration**: Shows branch, dirty state, and sync status
- **Cost Tracking**: Visual cost indicators with color coding
  - 🟢 Green: < $0.05
  - 🟠 Orange: $0.05 - $0.10
  - 🔴 Red: > $0.10
- **Smart Path Display**: Automatically shortens long paths
- **Performance Metrics**: Track API efficiency and response times
- **Context Awareness**: Monitor token usage against model limits

## 🛠 Installation

### Prerequisites

- [Claude Code](https://github.com/anthropics/claude-code) installed
- `jq` for JSON parsing (required)
- `git` (optional, for git status features)
- `bc` (optional, for advanced calculations in segments script)

### Quick Install (Recommended)

Run directly from your terminal - no cloning required:

```bash
# Install in current project directory
curl -sSL https://raw.githubusercontent.com/dhofheinz/claude-code-statusline-manager/main/install.sh | bash

# Or using wget
wget -qO- https://raw.githubusercontent.com/dhofheinz/claude-code-statusline-manager/main/install.sh | bash
```

The installer will:
1. Check dependencies and guide you through any missing requirements
2. Download and install statusline scripts to `.claude/` in your current directory
3. Let you preview and select a statusline style
4. Configure Claude Code automatically
5. Create convenient shortcuts for future management

### Installation Options

```bash
# Install globally for all projects
curl -sSL https://raw.githubusercontent.com/dhofheinz/claude-code-statusline-manager/main/install.sh | bash -s -- --global

# Install to specific project
curl -sSL https://raw.githubusercontent.com/dhofheinz/claude-code-statusline-manager/main/install.sh | bash -s -- --project ~/myproject

# Install with pre-selected minimal statusline (non-interactive)
curl -sSL https://raw.githubusercontent.com/dhofheinz/claude-code-statusline-manager/main/install.sh | bash -s -- --statusline 2 --no-config

# Install to custom location
curl -sSL https://raw.githubusercontent.com/dhofheinz/claude-code-statusline-manager/main/install.sh | bash -s -- --path /custom/location
```

### Manual Installation (Alternative)

If you prefer to clone and install manually:

```bash
# Clone the repository
git clone https://github.com/dhofheinz/claude-code-statusline-manager.git
cd claude-code-statusline-manager

# Run the installer
./install.sh

# Or use the interactive manager
./statusline-manager.sh
```

### Post-Installation

After installation, the statusline manager will be available at:
- Local install: `./.claude/statusline-manager.sh`
- Global install: `~/.claude/statusline-manager/statusline-manager.sh`
- Or simply run: `claude-statusline` (if symlink was created)

**Important:** Restart Claude Code after installation to see your new statusline!

## 📚 Documentation

- **[Getting Started Guide](GETTING_STARTED.md)** - Detailed setup instructions and first steps
- **[Customization Guide](#-customization)** - Customize colors and segments
- **[Troubleshooting](#-troubleshooting)** - Common issues and solutions

## 🎨 Customization

### Creating Custom Statuslines

Statusline scripts receive JSON input via stdin and output formatted text. Example input:

```json
{
  "model": {"display_name": "Opus"},
  "workspace": {"current_dir": "/home/user/project"},
  "cost": {
    "total_cost_usd": 0.0456,
    "total_duration_ms": 125000
  }
}
```

Create your own script that reads this JSON and outputs formatted text:

```bash
#!/bin/bash
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name')
echo "Claude $model ready!"
```

### Color Schemes

All scripts use ANSI color codes. Modify the color variables at the top of each script:

```bash
BG_PURPLE="\e[48;5;93m"   # Background purple
FG_WHITE="\e[38;5;255m"   # Foreground white
```

## 🔧 Configuration

### Manual Setup

If you prefer manual configuration, add to your `settings.json`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "/path/to/statusline-segments.sh"
  }
}
```

### Environment Variables

- `STATUSLINE_DIR`: Override default statusline directory
- `SETTINGS_FILE`: Custom settings.json location
- `NO_COLOR`: Disable colors in manager output
- `TERM`: Set to "dumb" to disable colors

## 🚨 Troubleshooting

### Common Issues

**Statusline not appearing:**
- Ensure the script is executable: `chmod +x statusline-*.sh`
- Check Claude Code was restarted after configuration
- Verify `jq` is installed: `which jq`

**Colors not working:**
- Check terminal supports ANSI colors
- Try different terminal emulators
- Ensure `TERM` environment variable is set correctly

**Git information missing:**
- Verify you're in a git repository
- Check git is accessible: `which git`
- Ensure proper permissions for `.git` directory

**Performance issues:**
- Use minimal or basic statusline for better performance
- Check if `bc` is installed for segments script
- Consider disabling context tracking in large projects

### Debug Mode

Test any statusline script manually:

```bash
echo '{"model":{"display_name":"Test"},"workspace":{"current_dir":"'$PWD'"}}' | ./statusline-minimal.sh
```

## 📦 Manager Features

The `statusline-manager.sh` script provides:

- **Interactive Menu**: Easy selection and preview
- **Live Testing**: See output before applying
- **Backup System**: Automatic backups before changes
- **Restore Function**: Rollback to previous configurations
- **Custom Scripts**: Support for your own statusline scripts

### Manager Commands

```bash
./statusline-manager.sh           # Interactive menu
./statusline-manager.sh --test PATH  # Test a script
./statusline-manager.sh --backup     # Create backup
./statusline-manager.sh --restore    # Restore from backup
./statusline-manager.sh --help       # Show help
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Submit new statusline designs
- Improve existing scripts
- Add new features
- Report bugs
- Improve documentation

## 📄 License

This project is provided as-is for use with Claude Code. Feel free to modify and distribute.

## 🙏 Acknowledgments

Created for the [Claude Code](https://github.com/anthropics/claude-code) community. Special thanks to Anthropic for making Claude Code available.

## 💡 Tips

- Start with the minimal statusline and upgrade as needed
- Use the manager's test feature before applying changes
- Keep backups of your working configurations
- Customize colors to match your terminal theme
- Monitor costs with the visual indicators to stay within budget

---

For detailed setup instructions, see the [Getting Started Guide](GETTING_STARTED.md).