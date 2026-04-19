# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Commit Policy

**Commit automatically without being asked:**
1. After completing a feature or fix
2. Before switching projects
3. After 15-20 min of active coding
4. Before risky operations (refactoring, deletions)
5. Before ending a session — always offer to commit

### Format
```
type(scope): Brief description

- Details

🤖 Generated with Claude Code
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```
Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

### Git Directories
| Project | Git Root | Key Paths |
|---------|----------|-----------|
| Janus Demo | `janus-demo/` | backend/, frontend/, edge_agent/, shared/ |
| Moonlight | `.` (root) | moonlight-deploy/ |
| Construction Site | `construction-site/` | All files |

**Push Policy**: DO NOT auto-push. Only push when explicitly requested.

---

## Active Projects

| Project | Directory | Stack | Status |
|---------|-----------|-------|--------|
| Moonlight Analytica | `moonlight-deploy/` | Static HTML/Vercel | Live at moonlightanalytica.com |
| ForkFox | `tastyr-iq/` | Python scripts + HTML landing pages | Live at forkfox.ai |
| Janus Demo | `janus-demo/` | React+Vite / Flask / SQLite | Sprint 7 complete, 234 tests |
| Construction Site | `construction-site/` | Static HTML/Vercel | caputoconstructioncompany.com |

---

## Janus Demo — Dev Commands

**Start full stack** (runs backend + seeds demo data + frontend):
```bash
scripts/dev.bat             # Windows
scripts/dev_demo.bat        # With VITE_DEMO_MODE=1
```

**Individual services:**
```bash
# Backend (Flask, port 8000)
cd janus-demo/backend && python main.py

# Frontend (Vite, port 5173)
cd janus-demo/frontend && npm run dev
```

**Tests:**
```bash
# From janus-demo/ root:
npm run test:all                          # frontend + backend + e2e
npm run test:frontend                     # vitest
npm run test:backend                      # pytest -v
npm run test:e2e                          # playwright (Chromium only)
npm run test:e2e:ui                       # playwright interactive

# Single backend test file:
cd janus-demo/backend && pytest tests/test_foo.py -v

# Coverage:
cd janus-demo/frontend && npm run test:coverage
```

### Janus Architecture

```
janus-demo/
├── backend/          Flask API (port 8000) — app.py factory, blueprints, db.py SQLite
├── frontend/         React+Vite (port 5173) — vitest for unit tests
├── edge_agent/       RF-DETR detection + supervision tracking; yt-dlp for streams
│                     boxmot optional (AGPL, graceful fallback)
├── shared/           Shared types/utils between frontend and backend
└── playwright.config.js  E2E — base URL localhost:5173, Chromium only
```

- Gate-based development: see `janus-demo/DEVELOPMENT-GATES.md` before any sprint work
- Backend entry: `backend/main.py` re-exports from `app.py` (Flask factory) and `db.py`

---

## ForkFox (tastyr-iq) — Dev Commands

**Generate business artifacts** (requires `pip install reportlab openpyxl python-pptx`):
```bash
python build_crm.py
python build_pptx.py                       # Pitch deck (4 variations)
python build_strategy_binder.py
python strategy/build_financial_models.py
```

**Deploy landing pages:**
```bash
cd tastyr-iq/landing-pages && vercel --prod --yes    # → forkfox.ai
```

> **Vercel gotcha**: After any `git push` to alimabsoute/forkfox, always run the deploy command above — GitHub→Vercel auto-deploy builds from root (broken).

---

## Moonlight Analytica — Deployment

- **Entry point**: `moonlight-complete-structure.html` (Vercel rewrite → `/`)

```bash
cd moonlight-deploy && vercel --prod --yes        # Deploy
cd moonlight-deploy && vercel ls                   # Check status
vercel promote [URL] --scope=alimabsoute-3065s-projects  # Rollback
npm run format                                     # Prettier (HTML/CSS/JS/JSON)
```

**Backup/restore:**
```bash
cp moonlight-MASTER-BACKUP-20250907.html moonlight-deploy/moonlight-complete-structure.html
```

### Moonlight Design System
- **Theme**: Neon cyber — #00bfff (primary), #87ceeb (secondary), #4682b4 (accent)
- **Fonts**: Inter (body), Poppins (headings) with glow/text-shadow

---

## Construction Site (Caputo Construction Company)

- **URL**: https://caputoconstructioncompany.com
- **Deploy dir**: `construction-site/`
- **Deploy cmd**: `cd construction-site && vercel --prod --yes`

---

## Mobile-First Requirements (Mandatory — all projects)

- Test layouts 320px–768px
- Min 44px touch targets
- `clamp()` for responsive typography
- Mobile-first CSS, enhance for larger screens
- WebP images, lazy loading, bundle < 1MB

---

## Supabase Dev (project ID: "alima")

```bash
npx supabase start | stop | status
npx supabase db reset
npx supabase migration up | new <name>
npx supabase gen types typescript --local > types/database.types.ts
```

---

## Design Preferences

- Think Apple, Stripe — clean, masculine, crisp
- White/off-white backgrounds: `#f8f7f4` (warm) or `#fafafa` (cool)
- NO dual-face/head Janus imagery — geometric/modern motifs only
- NO magenta/pink CTA buttons
- Offer 20-40 design variations per section when designing UI
