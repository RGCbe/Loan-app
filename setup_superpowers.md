# Claude Code Superpowers Setup Script

This script will set up advanced aliases for your terminal to make Claude Code faster to use.

## For PowerShell (Add to your $PROFILE)
function c { claude $args }
function cp { claude -p "Create a detailed implementation plan for: $args" }
function cv { claude -p "Verify the project health (lint, build, test) and report any issues." }
function cg { claude -p "Generate a descriptive commit message for my current changes and commit them." }

## For CMD (Save as .bat files in a folder in your PATH)
# c.bat: @claude %*
# cp.bat: @claude -p "Create a detailed implementation plan for: %*"
# cv.bat: @claude -p "Verify the project health (lint, build, test) and report any issues."
# cg.bat: @claude -p "Generate a descriptive commit message for my current changes and commit them."

## In-Session Plugin Installation
Run these two commands INSIDE your next Claude session to activate the "Superpowers" framework:
1. /plugin marketplace add obra/superpowers-marketplace
2. /plugin install superpowers@superpowers-marketplace
