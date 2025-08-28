#!/bin/bash

# Read JSON from stdin
input=$(cat)

# ANSI codes
RESET="\e[0m"
BOLD="\e[1m"
# DIM="\e[2m"  # Reserved for future use

# Color Theory Applied: Using complementary and analogous colors
# Primary: Blue/Cyan spectrum for main info
# Secondary: Purple/Magenta for model
# Accent: Green for success, Yellow/Orange for warning, Red for danger
# Using higher color values (bright) for better visibility on dark terminals

# Background colors - Bright and vibrant for dark terminals
BG_PURPLE="\e[48;5;93m"     # Model - Royal purple
BG_BLUE="\e[48;5;33m"       # Directory - Bright blue
BG_TEAL="\e[48;5;37m"       # Git clean - Teal
BG_GREEN="\e[48;5;40m"      # Success/Low cost - Bright green
BG_YELLOW="\e[48;5;220m"    # Warning/Git dirty - Golden yellow
BG_ORANGE="\e[48;5;208m"    # Medium warning - Bright orange
BG_RED="\e[48;5;196m"       # Danger/High cost - Bright red
# BG_MAGENTA="\e[48;5;201m"   # Session/Special - Hot magenta (reserved)
# BG_CYAN="\e[48;5;45m"       # Info - Sky cyan (reserved)
BG_GRAY="\e[48;5;240m"      # Time/Stats - Medium gray
BG_DARK="\e[48;5;236m"      # Context/Secondary - Dark gray

# Foreground colors - High contrast
FG_WHITE="\e[38;5;255m"     # Pure white
FG_BLACK="\e[38;5;16m"      # Pure black for yellow/light backgrounds
FG_BRIGHT="\e[38;5;231m"    # Bright white
# FG_DARK="\e[38;5;232m"      # Very dark for light backgrounds (reserved)

# Arrow separators for segment transitions
SEP="▶"
# SEP_THIN="│"  # Reserved for future use
# SEP_ALT="▷"   # Reserved for future use

# Transition colors (foreground color of arrow matches previous segment)
# Transition colors (unused but kept for documentation)
# trans_purple_blue="\e[38;5;93m\e[48;5;33m"
# trans_blue_git="\e[38;5;33m"
# trans_git_cost="\e[38;5;37m"
# trans_cost_time="\e[38;5;40m"
# trans_time_context="\e[38;5;240m"
# trans_context_changes="\e[38;5;236m"
# trans_final="\e[38;5;236m"

# Extract all fields
model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // "~"')
project_dir=$(echo "$input" | jq -r '.workspace.project_dir // ""')
# session_id=$(echo "$input" | jq -r '.session_id // ""')  # Reserved for future use
transcript_path=$(echo "$input" | jq -r '.transcript_path // ""')
total_cost=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
total_duration=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')
api_duration=$(echo "$input" | jq -r '.cost.total_api_duration_ms // 0')
lines_added=$(echo "$input" | jq -r '.cost.total_lines_added // 0')
lines_removed=$(echo "$input" | jq -r '.cost.total_lines_removed // 0')

# Format model with emoji
case "$model" in
    *"Opus"*) 
        model_display="🎭 OPUS"
        ;;
    *"Sonnet"*) 
        model_display="🎵 SONNET"
        ;;
    *"Haiku"*) 
        model_display="🍃 HAIKU"
        ;;
    *) 
        model_display="🤖 ${model:0:7}"
        ;;
esac

# Smart directory display with project context
display_dir=$(echo "$cwd" | sed "s|^$HOME|~|")
if [ -n "$project_dir" ] && [ "$project_dir" != "$cwd" ]; then
    project_name=$(basename "$project_dir")
    rel_path=$(realpath --relative-to="$project_dir" "$cwd" 2>/dev/null || echo "$display_dir")
    if [ "$rel_path" != "." ] && [ "$rel_path" != "$display_dir" ]; then
        display_dir="${project_name}/${rel_path}"
    fi
fi

# Handle empty display (shouldn't happen, but safety check)
if [ -z "$display_dir" ] || [ "$display_dir" = "" ]; then
    display_dir=$(basename "$cwd")
    [ -z "$display_dir" ] && display_dir="/"
fi

# Truncate long paths
if [ ${#display_dir} -gt 30 ]; then
    display_dir="…/$(echo "$display_dir" | rev | cut -d'/' -f1-2 | rev)"
fi

# Advanced Git status
git_bg=""
git_text=""
git_trans=""
if cd "$cwd" 2>/dev/null && git rev-parse --git-dir &>/dev/null; then
    branch=$(git branch --show-current 2>/dev/null || git describe --tags --exact-match 2>/dev/null || echo "HEAD")
    [ ${#branch} -gt 12 ] && branch="${branch:0:10}.."
    
    # Get detailed git stats
    ahead_behind=$(git rev-list --left-right --count 'HEAD...@{u}' 2>/dev/null || echo "0 0")
    ahead=$(echo "$ahead_behind" | cut -f1)
    behind=$(echo "$ahead_behind" | cut -f2)
    unstaged=$(git diff --numstat 2>/dev/null | wc -l)
    staged=$(git diff --cached --numstat 2>/dev/null | wc -l)
    
    git_stats=""
    if [ "$staged" -gt 0 ]; then
        git_stats="${git_stats} +${staged}"
    fi
    if [ "$unstaged" -gt 0 ]; then
        git_stats="${git_stats} ~${unstaged}"
    fi
    if [ "$ahead" -gt 0 ]; then
        git_stats="${git_stats} ↑${ahead}"
    fi
    if [ "$behind" -gt 0 ]; then
        git_stats="${git_stats} ↓${behind}"
    fi
    
    if [ -n "$git_stats" ]; then
        git_bg="${BG_YELLOW}"
        git_text="⎇ ${branch}${git_stats}"
        git_fg="${FG_BLACK}"
        git_trans="\e[38;5;220m"
    else
        git_bg="${BG_TEAL}"
        git_text="⎇ ${branch} ✓"
        git_fg="${FG_WHITE}"
        git_trans="\e[38;5;37m"
    fi
fi

# Cost with burn rate - color coded
formatted_cost=$(printf "%.3f" "$total_cost" 2>/dev/null || echo "0.000")
burn_rate=""
if [ "$total_duration" -gt 60000 ]; then
    hours=$(echo "scale=2; $total_duration / 3600000" | bc -l 2>/dev/null || echo "0")
    if [ "$(echo "$hours > 0" | bc -l 2>/dev/null)" = "1" ]; then
        rate=$(echo "scale=2; $total_cost / $hours" | bc -l 2>/dev/null || echo "0")
        burn_rate=" \$${rate}/h"
    fi
fi

if (( $(echo "$total_cost > 0.10" | bc -l 2>/dev/null || echo 0) )); then
    cost_bg="${BG_RED}"
    cost_fg="${FG_WHITE}"
    cost_text="💸 \$${formatted_cost}${burn_rate}"
    cost_trans="\e[38;5;196m"
elif (( $(echo "$total_cost > 0.05" | bc -l 2>/dev/null || echo 0) )); then
    cost_bg="${BG_ORANGE}"
    cost_fg="${FG_BLACK}"
    cost_text="💰 \$${formatted_cost}${burn_rate}"
    cost_trans="\e[38;5;208m"
else
    cost_bg="${BG_GREEN}"
    cost_fg="${FG_WHITE}"
    cost_text="\$${formatted_cost}${burn_rate}"
    cost_trans="\e[38;5;40m"
fi

# Duration with API efficiency indicator
time_text=""
if [ "$total_duration" -gt 0 ]; then
    minutes=$((total_duration / 60000))
    seconds=$(((total_duration % 60000) / 1000))
    
    # Calculate efficiency
    efficiency=""
    if [ "$api_duration" -gt 0 ]; then
        api_pct=$((api_duration * 100 / total_duration))
        if [ "$api_pct" -lt 10 ]; then
            efficiency=" ✨"  # Very fast
        elif [ "$api_pct" -lt 30 ]; then
            efficiency=" ⚡"  # Normal
        else
            efficiency=" 🐌"  # Slow
        fi
    fi
    
    if [ "$minutes" -gt 0 ]; then
        time_text="${minutes}m${seconds}s${efficiency}"
    else
        time_text="${seconds}s${efficiency}"
    fi
fi

# Context usage with visual bar
context_text=""
context_bg="${BG_DARK}"
context_fg="\e[38;5;250m"
if [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
    # Estimate tokens
    input_tokens=$(jq '[.messages[]? | select(.role == "user") | .content | length] | add // 0' "$transcript_path" 2>/dev/null || echo 0)
    output_tokens=$(jq '[.messages[]? | select(.role == "assistant") | .token_count // (.content | length / 4)] | add // 0' "$transcript_path" 2>/dev/null || echo 0)
    total_tokens=$((input_tokens / 4 + output_tokens))
    
    if [ "$total_tokens" -gt 0 ]; then
        # Model-specific limits
        if [[ "$model" == *"Opus"* ]]; then
            max_context=200000
        else
            max_context=100000
        fi
        
        context_pct=$((total_tokens * 100 / max_context))
        
        # Create visual bar
        bar_width=8
        filled=$((context_pct * bar_width / 100))
        [ "$filled" -gt "$bar_width" ] && filled=$bar_width
        
        bar=""
        for ((i=0; i<filled; i++)); do bar="${bar}█"; done
        for ((i=filled; i<bar_width; i++)); do bar="${bar}░"; done
        
        # Color based on usage
        if [ "$context_pct" -gt 80 ]; then
            context_bg="${BG_RED}"
            context_fg="${FG_WHITE}"
            context_text="📊 ${context_pct}% [${bar}]"
        elif [ "$context_pct" -gt 60 ]; then
            context_bg="${BG_ORANGE}"
            context_fg="${FG_BLACK}"
            context_text="📊 ${context_pct}% [${bar}]"
        else
            context_text="📊 ${context_pct}% [${bar}]"
        fi
    fi
fi

# Line changes with net indicator
changes_text=""
if [ "$lines_added" -gt 0 ] || [ "$lines_removed" -gt 0 ]; then
    net=$((lines_added - lines_removed))
    if [ "$net" -gt 0 ]; then
        net_indicator=" ↑${net}"
        net_color="\e[38;5;82m"
    elif [ "$net" -lt 0 ]; then
        net_indicator=" ↓${net#-}"
        net_color="\e[38;5;196m"
    else
        net_indicator=" ="
        net_color="\e[38;5;250m"
    fi
    changes_text="+${lines_added}/-${lines_removed}${net_color}${net_indicator}\e[38;5;250m"
fi

# Build the statusline with smooth transitions
output=""

# Model segment
output="${output}${BG_PURPLE}${FG_WHITE}${BOLD} ${model_display} ${RESET}"

# Directory segment
output="${output}${trans_purple_blue}${SEP}${BG_BLUE}${FG_BRIGHT} 📁 ${display_dir} ${RESET}"

# Git segment (if available)
if [ -n "$git_text" ]; then
    output="${output}\e[38;5;33m${git_bg}${SEP}${git_bg}${git_fg} ${git_text} ${RESET}"
    next_trans="${git_trans}"
else
    next_trans="\e[38;5;33m"
fi

# Cost segment
output="${output}${next_trans}${cost_bg}${SEP}${cost_bg}${cost_fg} ${cost_text} ${RESET}"

# Time segment (if available)
if [ -n "$time_text" ]; then
    output="${output}${cost_trans}${BG_GRAY}${SEP}${BG_GRAY}${FG_WHITE} ⏱ ${time_text} ${RESET}"
    next_trans="\e[38;5;240m"
else
    next_trans="${cost_trans}"
fi

# Context segment (if available)
if [ -n "$context_text" ]; then
    output="${output}${next_trans}${context_bg}${SEP}${context_bg}${context_fg} ${context_text} ${RESET}"
    next_trans="\e[38;5;236m"
fi

# Changes segment (if available)
if [ -n "$changes_text" ]; then
    output="${output}${next_trans}${BG_DARK}${SEP}${BG_DARK}\e[38;5;250m 📝 ${changes_text} ${RESET}"
fi

# End cap
output="${output}\e[38;5;236m${SEP}${RESET}"

echo -en "$output"