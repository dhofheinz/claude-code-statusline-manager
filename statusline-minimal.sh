#!/bin/bash

# Read JSON input
input=$(cat)

# ANSI color codes
RESET="\e[0m"
BOLD="\e[1m"

# Background colors - Using same vibrant palette as segments
BG_PURPLE="\e[48;5;93m"     # Model
BG_BLUE="\e[48;5;33m"       # Directory
BG_TEAL="\e[48;5;37m"       # Git clean
BG_YELLOW="\e[48;5;220m"    # Git dirty
BG_GREEN="\e[48;5;40m"      # Low cost
BG_ORANGE="\e[48;5;208m"    # Medium cost
BG_RED="\e[48;5;196m"       # High cost
BG_GRAY="\e[48;5;240m"      # Time

# Foreground colors
FG_WHITE="\e[38;5;255m"
FG_BLACK="\e[38;5;16m"
FG_BRIGHT="\e[38;5;231m"

# Arrow separator
SEP="▶"

# Extract data
model=$(echo "$input" | jq -r '.model.display_name // "Unknown"' | tr '[:lower:]' '[:upper:]')
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // "~"')
cost=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
duration_ms=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')

# Shorten path
short_cwd=$(echo "$cwd" | sed "s|^$HOME|~|")

# Handle empty path (shouldn't happen, but just in case)
if [ -z "$short_cwd" ] || [ "$short_cwd" = "" ]; then
    short_cwd=$(basename "$cwd")
    [ -z "$short_cwd" ] && short_cwd="/"
fi

# Keep only last 2 directories if path is long
if [ ${#short_cwd} -gt 30 ]; then
    short_cwd="…/$(echo "$short_cwd" | rev | cut -d'/' -f1-2 | rev)"
fi

# Git branch (if in repo) - simplified version
git_bg=""
git_text=""
git_trans=""
if cd "$cwd" 2>/dev/null && git rev-parse --git-dir &>/dev/null; then
    branch=$(git branch --show-current 2>/dev/null || echo "HEAD")
    [ ${#branch} -gt 12 ] && branch="${branch:0:10}.."
    
    # Check if dirty
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        git_bg="${BG_YELLOW}"
        git_fg="${FG_BLACK}"
        git_text="⎇ ${branch}*"
        git_trans="\e[38;5;220m"
    else
        git_bg="${BG_TEAL}"
        git_fg="${FG_WHITE}"
        git_text="⎇ ${branch}"
        git_trans="\e[38;5;37m"
    fi
fi

# Format cost with color based on amount
formatted_cost=$(echo "$cost" | awk '{printf "%.4f", $1}')
if (( $(echo "$cost > 0.10" | bc -l 2>/dev/null || echo 0) )); then
    cost_bg="${BG_RED}"
    cost_fg="${FG_WHITE}"
    cost_trans="\e[38;5;196m"
elif (( $(echo "$cost > 0.05" | bc -l 2>/dev/null || echo 0) )); then
    cost_bg="${BG_ORANGE}"
    cost_fg="${FG_BLACK}"
    cost_trans="\e[38;5;208m"
else
    cost_bg="${BG_GREEN}"
    cost_fg="${FG_WHITE}"
    cost_trans="\e[38;5;40m"
fi

# Format duration
time_text=""
if [ "$duration_ms" -gt 0 ]; then
    minutes=$((duration_ms / 60000))
    if [ "$minutes" -gt 0 ]; then
        time_text="${minutes}m"
    else
        seconds=$((duration_ms / 1000))
        time_text="${seconds}s"
    fi
fi

# Build status line with arrow transitions
output=""

# Model segment
output="${output}${BG_PURPLE}${FG_WHITE}${BOLD} ${model} ${RESET}"

# Directory segment with transition
output="${output}\e[38;5;93m${BG_BLUE}${SEP}${BG_BLUE}${FG_BRIGHT} ${short_cwd} ${RESET}"

# Git segment (if available) with transition
if [ -n "$git_text" ]; then
    output="${output}\e[38;5;33m${git_bg}${SEP}${git_bg}${git_fg} ${git_text} ${RESET}"
    next_trans="${git_trans}"
else
    next_trans="\e[38;5;33m"
fi

# Cost segment with transition
output="${output}${next_trans}${cost_bg}${SEP}${cost_bg}${cost_fg} \$${formatted_cost} ${RESET}"

# Duration segment (if available) with transition
if [ -n "$time_text" ]; then
    output="${output}${cost_trans}${BG_GRAY}${SEP}${BG_GRAY}${FG_WHITE} ${time_text} ${RESET}"
    output="${output}\e[38;5;240m${SEP}${RESET}"
else
    output="${output}${cost_trans}${SEP}${RESET}"
fi

echo -en "$output"