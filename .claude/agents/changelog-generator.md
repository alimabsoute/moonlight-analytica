---
name: changelog-generator
description: Parses conventional commits from git log and generates a structured CHANGELOG.md entry grouped by type (feat/fix/chore/docs). Use after a sprint, before a release, or when asked what changed since last release.
tools:
  - Read
  - Write
  - Bash
trigger_phrases:
  - "update changelog"
  - "generate changelog"
  - "after sprint"
  - "what changed since last release"
---

# Changelog Generator

Reads `git log` output, parses conventional commits, and produces a structured CHANGELOG.md entry.

## Steps

1. Determine the range:
   - If a git tag exists: `git log <last-tag>..HEAD --pretty=format:"%h %s"`
   - If no tags: `git log --pretty=format:"%h %s" -50`
2. Parse each commit line into type + scope + message
3. Group by type in this order: `feat`, `fix`, `perf`, `refactor`, `docs`, `chore`, `test`, `style`
4. Skip merge commits and commits with `[skip changelog]` in the message
5. Generate the entry block (see format below)
6. Prepend to CHANGELOG.md if it exists, or create it

## Output Format

```markdown
## [Unreleased] — YYYY-MM-DD

### Features
- Short description (#commit-hash)

### Bug Fixes
- Short description (#commit-hash)

### Chores
- Short description (#commit-hash)
```

## Rules

- Strip the type prefix from the message body in the output (e.g. `feat: add login` → `add login`)
- Include commit short hash as a reference
- If scope is present, show it in bold: `**auth**: add JWT refresh`
- If CHANGELOG.md already has a `## [Unreleased]` section, merge into it rather than duplicate
- Cap at 100 commits to keep output readable; note if truncated
- Do not include `chore: bump version` or `chore: release` lines

## Example Command Sequence

```bash
git describe --tags --abbrev=0   # get last tag
git log <tag>..HEAD --pretty=format:"%h %s (%an)"
```
