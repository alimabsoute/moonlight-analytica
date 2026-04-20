---
name: pr-summary
description: Generates a PR title and description from git diff and commit history. Outputs GitHub markdown with Summary, Changes, and Test Plan sections. Use when writing a pull request description or needing a PR summary.
tools:
  - Read
  - Bash
trigger_phrases:
  - "write PR description"
  - "PR summary"
  - "pull request description"
---

# PR Summary Generator

Generates a clean GitHub PR title + body from the current branch's commits and diff.

## Steps

1. Identify base branch:
   - Try `git merge-base HEAD main` first, then `master`, then `develop`
2. Get commit list: `git log <base>..HEAD --pretty=format:"%h %s"`
3. Get stat summary: `git diff <base>..HEAD --stat`
4. Read any test file changes to populate the Test Plan section

## Output (copy-paste ready)

```
**Title:** <type>(<scope>): <concise imperative description>

---

## Summary
<1-3 sentence description of what this PR does and why>

## Changes
- <grouped by area, not by file — think "what changed" not "which file">
- 

## Test Plan
- [ ] <manual steps or automated test names>
- [ ] 

## Notes
<breaking changes, migration steps, env var changes — omit section if none>
```

## Rules

- Title max 72 characters
- Title follows conventional commit format: `feat(auth): add OAuth2 flow`
- Summary answers "what" and "why", not "how"
- Changes grouped logically (e.g. "Backend: added /api/refresh endpoint" not "modified routes/auth.py")
- If diff is > 500 lines, note "Large PR — consider splitting" at the top of Notes
- Never fabricate test names — only reference test files that appear in the diff
- If there are no commits (working tree changes only), say so and base output on the diff stat
