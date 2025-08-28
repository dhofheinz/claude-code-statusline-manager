# Getting Started with Claude Code Statusline Manager

This guide will walk you through setting up and customizing your Claude Code statusline step by step.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [First Run](#first-run)
4. [Choosing a Statusline](#choosing-a-statusline)
5. [Understanding the Output](#understanding-the-output)
6. [Customization Basics](#customization-basics)
7. [Advanced Setup](#advanced-setup)
8. [Frequently Asked Questions](#frequently-asked-questions)

## Prerequisites

### Required Software

1. **Claude Code** - Ensure you have Claude Code installed and working:
   ```bash
   claude --version
   ```

2. **jq** - JSON processor (required for all statuslines):
   ```bash
   # Ubuntu/Debian
   sudo apt-get install jq

   # macOS
   brew install jq

   # Verify installation
   jq --version
   ```

3. **git** (optional but recommended) - For git status features:
   ```bash
   git --version
   ```

4. **bc** (optional) - For advanced calculations in the segments statusline:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install bc

   # macOS (usually pre-installed)
   bc --version
   ```

### System Requirements

- Unix-like operating system (Linux, macOS, WSL)
- Terminal with ANSI color support
- Bash shell (version 4.0+)

## Installation

### Method 1: Using Git (Recommended)

```bash
# Navigate to your preferred tools directory
cd ~/projects/tools/

# Clone the repository
git clone https://github.com/dhofheinz/claude-code-statusline-manager.git

# Enter the directory
cd claude-code-statusline-manager

# Make scripts executable
chmod +x *.sh
```

### Method 2: Manual Download

1. Download all files from this repository
2. Extract to a directory like `~/tools/claude-code-statusline-manager/`
3. Make scripts executable:
   ```bash
   cd ~/tools/claude-code-statusline-manager/
   chmod +x *.sh
   ```

## First Run

### Using the Interactive Manager

1. **Launch the manager:**
   ```bash
   ./statusline-manager.sh
   ```

2. **You'll see the main menu:**
   ```
   🎨 Claude Code Statusline Manager
   ======================================

   ℹ️  Current: Statusline disabled

   Available statusline scripts:

     1) Basic - Terminal-style user@host:dir
        Path: /home/user/.claude/statusline-basic.sh
     2) Minimal - Simple info with segments style
        Path: /home/user/.claude/statusline-minimal.sh
     3) Full - All features with segments style
        Path: /home/user/.claude/statusline-segments.sh
     4) Disable statusline
     5) Restore from backup
     6) Custom script path

     0) Exit
   ```

3. **Test a statusline** by entering its number (e.g., `2` for Minimal)

4. **Review the preview** - The manager will show sample output

5. **Confirm application** when prompted

6. **Restart Claude Code** to see your new statusline

### Manual Setup (Alternative)

If you prefer manual configuration:

1. **Copy your chosen statusline to Claude's directory:**
   ```bash
   cp statusline-segments.sh ~/.claude/
   ```

2. **Edit Claude Code settings:**
   ```bash
   nano ~/.claude/settings.json
   ```

3. **Add the statusline configuration:**
   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "~/.claude/statusline-segments.sh"
     }
   }
   ```

4. **Save and restart Claude Code**

## Choosing a Statusline

### Comparison Chart

| Feature | Basic | Minimal | Segments |
|---------|-------|---------|----------|
| Model Display | ❌ | ✅ | ✅ with emoji |
| Directory | ✅ | ✅ | ✅ enhanced |
| Git Branch | ❌ | ✅ | ✅ |
| Git Status | ❌ | ✅ dirty/clean | ✅ detailed |
| Cost Display | ❌ | ✅ | ✅ with burn rate |
| Duration | ❌ | ✅ | ✅ with efficiency |
| Context Usage | ❌ | ❌ | ✅ with bar |
| Line Changes | ❌ | ❌ | ✅ |
| Visual Style | Terminal | Powerline | Powerline+ |
| Performance | Fastest | Fast | Moderate |

### Recommendations

- **New Users**: Start with **Minimal** for a good balance
- **Minimalists**: Use **Basic** for familiar terminal style
- **Power Users**: Choose **Segments** for all features
- **Low-spec Systems**: Stick with **Basic** or **Minimal**

## Understanding the Output

### Minimal Statusline Example

```
[OPUS] [~/projects] [⎇ main*] [$0.0456] [2m5s]
```

- **[OPUS]**: Current Claude model
- **[~/projects]**: Current directory
- **[⎇ main*]**: Git branch (* = uncommitted changes)
- **[$0.0456]**: Session cost (color-coded)
- **[2m5s]**: Session duration

### Segments Statusline Example

```
[🎭 OPUS] [📁 myproject/src] [⎇ main +3 ~2 ↑1] [💰 $0.0456 $0.10/h] [⏱ 2m5s ⚡] [📊 45% [████░░░░]] [📝 +45/-12 ↑33]
```

Additional information:
- **🎭 OPUS**: Model with emoji indicator
- **+3 ~2 ↑1**: Git stats (staged/modified/ahead)
- **$0.10/h**: Burn rate (cost per hour)
- **⚡**: API efficiency indicator
- **45% [████░░░░]**: Context usage bar
- **+45/-12 ↑33**: Lines added/removed with net change

### Color Meanings

- **Green**: Good/Safe (low cost, clean git)
- **Yellow**: Warning (medium cost, uncommitted changes)
- **Red**: Alert (high cost, high context usage)
- **Blue/Cyan**: Informational
- **Purple**: Model indicator
- **Gray**: Time/stats

## Customization Basics

### Modifying Colors

1. **Open your chosen statusline script:**
   ```bash
   nano statusline-minimal.sh
   ```

2. **Find the color definitions (near top):**
   ```bash
   # Background colors
   BG_PURPLE="\e[48;5;93m"     # Model
   BG_BLUE="\e[48;5;33m"       # Directory
   ```

3. **Change color codes** using [ANSI 256-color values](https://en.wikipedia.org/wiki/ANSI_escape_code#8-bit)

4. **Test your changes:**
   ```bash
   ./statusline-manager.sh --test statusline-minimal.sh
   ```

### Adjusting Segments

To remove or reorder segments in `statusline-minimal.sh`:

1. **Locate the output building section** (search for "Build status line")

2. **Comment out unwanted segments:**
   ```bash
   # Git segment (disabled)
   # if [ -n "$git_text" ]; then
   #     output="${output}..."
   # fi
   ```

3. **Reorder by moving segment blocks**

### Creating a Custom Statusline

1. **Create a new script:**
   ```bash
   nano my-statusline.sh
   ```

2. **Start with this template:**
   ```bash
   #!/bin/bash

   # Read JSON input
   input=$(cat)

   # Extract data
   model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
   dir=$(echo "$input" | jq -r '.workspace.current_dir // "~"')
   cost=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')

   # Format and output
   printf "[%s] [%s] [$%.4f]\n" "$model" "$dir" "$cost"
   ```

3. **Make executable and test:**
   ```bash
   chmod +x my-statusline.sh
   ./statusline-manager.sh --test my-statusline.sh
   ```

## Advanced Setup

### Using Environment Variables

Control statusline behavior with environment variables:

```bash
# Set custom directories
export STATUSLINE_DIR="$HOME/my-claude-config"
export SETTINGS_FILE="$HOME/my-claude-config/settings.json"
export BACKUP_DIR="$HOME/my-claude-config/backups"

# Disable colors
export NO_COLOR=1

# Run manager with custom config
./statusline-manager.sh
```

### Automated Deployment

Create a setup script for team deployment:

```bash
#!/bin/bash
# setup-statusline.sh

# Install dependencies
sudo apt-get update && sudo apt-get install -y jq bc git

# Copy statusline to user directory
cp statusline-segments.sh ~/.claude/

# Backup existing settings
[ -f ~/.claude/settings.json ] && cp ~/.claude/settings.json ~/.claude/settings.backup.json

# Apply statusline configuration
jq '.statusLine = {"type": "command", "command": "~/.claude/statusline-segments.sh"}' \
    ~/.claude/settings.json > ~/.claude/settings.tmp.json && \
    mv ~/.claude/settings.tmp.json ~/.claude/settings.json

echo "✅ Statusline installed! Please restart Claude Code."
```

### Integration with dotfiles

Add to your dotfiles management:

1. **Symlink approach:**
   ```bash
   ln -s ~/dotfiles/claude/statusline-segments.sh ~/.claude/statusline.sh
   ```

2. **Stow integration:**
   ```bash
   cd ~/dotfiles
   stow claude
   ```

## Frequently Asked Questions

### Q: Why isn't my statusline showing?

**A:** Check these common issues:
1. Did you restart Claude Code after configuration?
2. Is the script executable? (`chmod +x statusline-*.sh`)
3. Is `jq` installed? (`which jq`)
4. Check the script path in settings.json is correct

### Q: Can I use relative paths in settings.json?

**A:** Yes, but they're relative to where Claude Code is executed from. Absolute paths are more reliable.

### Q: How do I disable the statusline temporarily?

**A:** Either:
- Use the manager: `./statusline-manager.sh` and select "Disable statusline"
- Edit settings.json and remove the `statusLine` section
- Set an empty command: `"command": ""`

### Q: Why are colors not working?

**A:** Your terminal might not support ANSI colors. Try:
1. Different terminal emulator (iTerm2, Windows Terminal, etc.)
2. Check `echo $TERM` - should not be "dumb"
3. Test colors: `echo -e "\e[31mRed Text\e[0m"`

### Q: Can I use this with multiple Claude Code instances?

**A:** Yes! Each instance can have its own settings.json. Use environment variables to point to different configs:
```bash
SETTINGS_FILE=~/.claude-dev/settings.json claude
```

### Q: How do I update to the latest version?

**A:** If installed via git:
```bash
cd ~/projects/tools/claude-code-statusline-manager
git pull
```

### Q: Is there a performance impact?

**A:** Minimal. The scripts execute quickly (typically <50ms). If you experience slowness:
- Try the Basic or Minimal statuslines
- Check if `git` commands are slow in large repositories
- Disable context tracking for very large projects

### Q: Can I contribute my own statusline?

**A:** Absolutely! Create your statusline and submit a pull request or share it with the community.

## Next Steps

1. **Experiment** with different statuslines to find your preference
2. **Customize** colors to match your terminal theme
3. **Create** your own statusline for specific needs
4. **Share** your configurations with teammates
5. **Contribute** improvements back to the project

## Getting Help

- **Issues**: Report bugs in the GitHub repository
- **Community**: Share and discuss in Claude Code forums
- **Documentation**: Check README.md for technical details

---

Happy coding with your new Claude Code statusline! 🎨