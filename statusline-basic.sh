#!/bin/bash

# Basic statusline - Terminal-style prompt
# Shows: user@host:directory format similar to standard bash prompt

# Read JSON input from stdin
input=$(cat)

# Get debian_chroot if it exists (for container/chroot environments)
debian_chroot=$([ -r /etc/debian_chroot ] && cat /etc/debian_chroot)

# Extract current directory from JSON
current_dir=$(echo "$input" | jq -r '.workspace.current_dir')

# Create the basic prompt format with colors
# Green for user@host, Blue for directory
printf "\033[01;32m%s@%s\033[00m:\033[01;34m%s\033[00m" \
    "$(whoami)" \
    "$(hostname -s)" \
    "$(echo "$current_dir" | sed "s|$HOME|~|g")"