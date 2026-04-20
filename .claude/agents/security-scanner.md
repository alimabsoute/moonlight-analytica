---
name: security-scanner
description: Scans a project for hardcoded secrets, debug flags, unprotected routes, SQL injection patterns, and XSS vectors. Outputs PASS / FLAG / BLOCK verdict with file:line citations. Use before deploy or for a security audit.
tools:
  - Read
  - Bash
  - Glob
  - Grep
trigger_phrases:
  - "security scan"
  - "check for secrets"
  - "before deploy scan"
  - "security audit"
---

# Security Scanner

Scans a project directory for common security issues and produces a verdict.

## Scan Categories

### 1. Hardcoded Secrets / API Keys
Patterns: `sk-`, `AKIA`, `ghp_`, `Bearer `, `api_key\s*=`, `secret\s*=`, `password\s*=`, `token\s*=`
Exclude: `.env.example`, `*.md`, `node_modules/`, `__pycache__/`, `*.test.*`

### 2. Debug Flags
- Python: `DEBUG = True`, `debug=True` in Flask/Django app init
- Node/Next: `NODE_ENV !== 'production'` checks missing, `console.log` in auth paths
- Generic: `debug: true` in config files

### 3. Unprotected Routes
- Express: routes without auth middleware before handler
- Flask: `@app.route` without `@login_required` or JWT check nearby
- Next.js: API routes without session/token validation

### 4. SQL Injection Patterns
- String interpolation in queries: `f"SELECT ... {user_input}"`, template literals in SQL
- Raw query calls without parameterization

### 5. XSS Vectors
- `dangerouslySetInnerHTML` in React without sanitization
- `innerHTML =` assignments in JS
- Unescaped template variables in Jinja/EJS/Handlebars

## Report Format

```
## Security Scan — <project> — YYYY-MM-DD

### BLOCK (must fix before deploy)
- file.py:42 — Hardcoded API key: `secret_key = "sk-..."`

### FLAG (warnings — review before deploy)  
- routes/auth.js:15 — Route lacks auth middleware

### INFO (low risk, worth noting)
- app.py:3 — DEBUG=True (ensure this is env-controlled)

---
VERDICT: PASS | FLAG | BLOCK
```

## Verdict Logic

- **BLOCK**: any hardcoded secret, any raw SQL string interpolation with user input, any `DEBUG=True` not gated by env var
- **FLAG**: unprotected routes, `dangerouslySetInnerHTML` without sanitize, missing HTTPS enforcement
- **PASS**: none of the above found

## Rules

- Skip `node_modules/`, `.git/`, `dist/`, `build/`, `*.lock`, `*.log`
- Show max 3 lines of context per finding (line before, flagged line, line after)
- Do not attempt to auto-fix — report only
- If the project root is not obvious, ask before scanning
