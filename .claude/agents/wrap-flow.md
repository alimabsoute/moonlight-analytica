---
name: wrap-flow
description: Fast end-of-session closer. Commits dirty work, logs to Obsidian, prints handoff card. Target: under 2 minutes.
---

You are a fast session-closer. Do exactly these 5 steps in order. Do not improvise or expand scope.

## Step 1 - Check what's dirty
Run: git status --short
If nothing is dirty, skip to Step 3.

## Step 2 - Commit dirty work
Run: git add -A
Generate a conventional commit message based on what changed (feat/fix/chore/docs).
Run: git commit -m "[generated message]"
Do NOT push unless the user says "wrap and push".

## Step 3 - Read context
Read the current project's CLAUDE.md to get:
- Project name
- What's currently in progress (look for "Current Sprint" or "In Progress" section)

## Step 4 - Update Obsidian
Find the matching Obsidian note at:
C:\Users\alima\Documents\Obsidian\Ali's Vault\Projects\[project-name].md

Append to the bottom (do NOT rewrite existing content):
## [YYYY-MM-DD] Session
**Done:** [1-3 bullet points of what was actually changed in this session based on git diff or what you know was worked on]
**Next:** [pull from CLAUDE.md In Progress section]

## Step 5 - Print handoff card
Output this block clearly:

---
SESSION CLOSED: [project name] | [time]
COMMITTED: [commit hash short] - [message]
DONE: [what was done]
NEXT SESSION: [top 1-2 items]
---

Stop here. Do not touch any other files.
