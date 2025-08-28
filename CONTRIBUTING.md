# Contributing to Claude Code Statusline Manager

Thank you for your interest in contributing to Claude Code Statusline Manager! We welcome contributions from the community to help improve and expand this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Submitting Changes](#submitting-changes)
- [Creating New Statuslines](#creating-new-statuslines)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming environment for all contributors.

## How to Contribute

### Reporting Issues

- Check if the issue already exists in the [issue tracker](https://github.com/dhofheinz/claude-code-statusline-manager/issues)
- Include clear steps to reproduce
- Provide your environment details (OS, shell, Claude Code version)
- Include relevant error messages or screenshots

### Suggesting Enhancements

- Open an issue with the `enhancement` label
- Clearly describe the feature and its benefits
- Provide mockups or examples if applicable

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Development Setup

### Prerequisites

```bash
# Required tools
jq --version    # JSON processor
git --version   # Version control
bash --version  # Bash 4.0+

# Optional tools
bc --version    # Calculator for advanced statuslines
shellcheck      # Shell script linter
```

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/dhofheinz/claude-code-statusline-manager.git
cd claude-code-statusline-manager

# Make scripts executable
chmod +x *.sh

# Run tests (if available)
./test.sh
```

## Creating New Statuslines

### Basic Template

```bash
#!/bin/bash
# statusline-custom.sh - Description of your statusline

# Read JSON input
input=$(cat)

# Extract data using jq
model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
dir=$(echo "$input" | jq -r '.workspace.current_dir // "~"')

# Format and output
echo "[$model] [$dir]"
```

### Available JSON Fields

```json
{
  "model": {
    "display_name": "Model name",
    "id": "model-id"
  },
  "workspace": {
    "current_dir": "/current/directory",
    "project_dir": "/project/root"
  },
  "cost": {
    "total_cost_usd": 0.0456,
    "total_duration_ms": 125000,
    "total_api_duration_ms": 45000,
    "total_lines_added": 100,
    "total_lines_removed": 50
  },
  "session_id": "session-uuid",
  "transcript_path": "/path/to/transcript.json"
}
```

### Submission Guidelines

1. Place your statusline in the root directory
2. Name it `statusline-descriptive-name.sh`
3. Include a header comment with description
4. Add an entry to the README
5. Update the manager script if needed
6. Provide screenshots in your PR

## Style Guidelines

### Shell Script Standards

- Use `#!/bin/bash` shebang
- Set safety flags: `set -euo pipefail` where appropriate
- Quote variables: `"$var"` not `$var`
- Use `[[ ]]` for conditionals
- Prefer `$()` over backticks
- Add meaningful comments
- Keep lines under 100 characters

### Color Guidelines

- Use ANSI 256-color codes for consistency
- Test on both light and dark terminals
- Provide fallbacks for NO_COLOR environment
- Document color choices in comments

### Error Handling

```bash
# Good error handling
if ! command -v jq >/dev/null 2>&1; then
    echo "Error: jq is required but not installed" >&2
    exit 1
fi

# Safe JSON parsing
value=$(echo "$input" | jq -r '.field // "default"' 2>/dev/null || echo "fallback")
```

## Testing

### Manual Testing

```bash
# Test a statusline with sample data
echo '{"model":{"display_name":"Test"}}' | ./statusline-custom.sh

# Test with the manager
./statusline-manager.sh --test statusline-custom.sh
```

### Automated Testing

Run shellcheck on all scripts:

```bash
shellcheck *.sh
```

### Test Scenarios

- Empty JSON input
- Missing fields
- Long directory paths
- Git repositories and non-git directories
- Various cost ranges
- Different terminal emulators

## Documentation

### Where to Document

- **README.md**: Overview and feature descriptions
- **GETTING_STARTED.md**: Setup and usage instructions
- **Script headers**: Purpose and requirements
- **Inline comments**: Complex logic explanations

### Documentation Standards

- Use clear, concise language
- Include examples and screenshots
- Keep formatting consistent
- Update all relevant docs when making changes

## Review Process

1. **Automated checks**: Scripts must pass shellcheck
2. **Code review**: Maintainers review for quality and consistency
3. **Testing**: Changes must be tested on multiple platforms
4. **Documentation**: Updates must include relevant documentation

## Questions?

Feel free to:
- Open an issue for questions
- Join discussions in existing issues
- Reach out to maintainers

Thank you for contributing to Claude Code Statusline Manager!