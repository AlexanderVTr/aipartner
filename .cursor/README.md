# Cursor AI Rules Setup

This directory contains rules and instructions for Cursor AI to ensure high-quality code suggestions.

## 📁 Files

- **`.cursorrules`** - Main rules file (root level)
- **`.cursor/instructions.md`** - Detailed coding instructions
- **`.cursor/README.md`** - This file

## 🎯 Purpose

These rules ensure Cursor AI:
- Suggests minimal, working solutions
- Follows existing project patterns
- Doesn't create unnecessary code
- Provides quality suggestions from the first attempt

## 🔧 How Cursor Uses These Files

Cursor AI automatically reads:
1. `.cursorrules` file in project root
2. Files in `.cursor/` directory
3. Uses these as context for all code suggestions

## ✅ Rules Summary

- **Analyze existing code first**
- **Minimal solutions only**
- **No "just in case" functions**
- **Follow project patterns**
- **Test logic mentally before suggesting**

## 🚨 Emergency Stops

Cursor should stop and ask if:
- Creating more than 3 new functions
- Changing working code without clear need
- Adding new dependencies
- Creating unused functionality

## 💡 Golden Rule

**User pays for correct solutions from the first attempt, not for debugging experiments.** 