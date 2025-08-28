# Changelog

All notable changes to Claude Code Statusline Manager will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [v1.0.0] - 2025-08-28

### Added
- Initial release of Claude Code Statusline Manager
- Three statusline styles: Basic, Minimal, and Full Segments
- Interactive manager script with menu system
- Automatic backup and restore functionality
- Support for custom statusline scripts
- Real-time git repository status integration
- Cost tracking with visual indicators
- Context usage monitoring with progress bars
- API efficiency indicators
- Line change tracking
- Comprehensive documentation and getting started guide
- One-line installation script with flexible path options
- GitHub Actions CI/CD pipeline
- Security scanning workflows
- Community contribution templates
- CLAUDE.md for Claude Code instance guidance

### Features
- **Basic Statusline**: Terminal-style `user@host:directory` format
- **Minimal Statusline**: Compact powerline design with essential information
- **Full Segments Statusline**: Feature-rich display with all available metrics
- **Manager Script**: Interactive configuration tool with live preview
- **Backup System**: Automatic settings backup before changes
- **Custom Scripts**: Support for user-created statusline scripts

### Technical Details
- Pure bash implementation with minimal dependencies
- ANSI 256-color support with fallback options
- JSON parsing via `jq` for data extraction
- Atomic file operations for safe configuration updates
- Cross-platform compatibility (Linux, macOS, WSL)

## [0.9.0-beta] - 2023-12-15

### Added
- Beta release for testing
- Core statusline functionality
- Basic manager script

### Changed
- Improved error handling
- Enhanced color schemes

### Fixed
- Path truncation issues
- Git status detection bugs

## [0.1.0-alpha] - 2023-12-01

### Added
- Initial proof of concept
- Basic statusline output
- Simple configuration system

---

## Version History Summary

- **1.0.0**: First stable public release
- **0.9.0-beta**: Beta testing phase
- **0.1.0-alpha**: Initial development version

## Upgrade Notes

### From 0.9.0-beta to 1.0.0
- Backup your existing settings.json before upgrading
- New statusline scripts require updated JSON format
- Manager script location has changed to support multiple installations

### From 0.1.0-alpha to 1.0.0
- Complete reinstallation recommended
- Settings format has significantly changed
- All statusline scripts need to be replaced

## Future Plans

- Additional statusline themes
- Performance monitoring dashboard
- Multi-project support
- Plugin system for extensions
- Web-based configuration interface
- Automated testing suite

## Support

For issues, questions, or contributions, please visit:
https://github.com/dhofheinz/claude-code-statusline-manager

## Contributors

Thanks to all contributors who have helped shape this project!