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
Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```
Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

### Git Roots
| Project | Git Root | Notes |
|---------|----------|-------|
| Root workspace | `/c/Users/alima/` | Janus, seo-pulse, moonlight-deploy, construction-site live here |
| ForkFox | `forkfox/` | Separate repo — alimabsoute/forkfox |
| Moonlight | `moonlight-deploy/` (tracked from root workspace) | **DO NOT use `moonlight-analytica/` clone.** It was archived 2026-04-26 after a rogue auto-deploy regression. Source of truth = `moonlight-deploy/` only. Deploy with `cd moonlight-deploy && vercel --prod --yes`. GitHub auto-deploy is disconnected on the Vercel project — keep it disconnected. |
| BoardLord | `canvas-workbook/` | Separate repo — alimabsoute/BoardLord |
| Prism | `v0-product-sentinel/` | Separate repo — alimabsoute/v0-product-sentinel |
| PhynxTimer | `phynxtimer/` | Separate repo |
| Ink & Ivory | `ink-and-ivory/` | Separate repo — alimabsoute/ink-and-ivory |

**Push Policy**: DO NOT auto-push. Only push when explicitly requested.

### ⚠️ Vercel Auto-Deploy Gotchas (CRITICAL)

Two projects have had production regress because Vercel's GitHub integration auto-deployed from a stale or wrong source. **Always deploy via the CLI from the source-of-truth folder** for these projects:

| Project | Source of truth | Deploy command | Vector closed? |
|---------|-----------------|----------------|----------------|
| Moonlight | `moonlight-deploy/` (root workspace) | `cd moonlight-deploy && vercel --prod --yes` | GitHub auto-deploy disconnected 2026-04-26. Rogue clone archived. |
| ForkFox | `forkfox/landing-pages/` | `cd forkfox/landing-pages && vercel --prod --yes` | Still wired — must redeploy after every push. |

If you find a duplicate clone of either project anywhere on the filesystem, **archive it, do not work in it**. Memory notes: `feedback_moonlight_vercel_autodeploy.md`, `feedback_forkfox_vercel_autodeploy.md`.

---

## Session Commands

| Say | Agent | Does |
|-----|-------|------|
| `wrap-flow` | wrap-flow | **Lean close**: commit dirty work → read CLAUDE.md → update Obsidian → print handoff card |
| `wrap` | session-closer | **Quick close**: commit + Obsidian + handoff card only |
| `wrap up` / `end session` | session-closer | Same as `wrap` |

---

## Active Projects

| Project | Directory | Stack | Status | CLAUDE.md |
|---------|-----------|-------|--------|-----------|
| Janus Demo | `janus-demo/` | React+Vite / Flask / SQLite | Sprint 7 done, 234 tests | `janus-demo/CLAUDE.md` |
| ForkFox | `forkfox/` | Python + HTML / Vercel | Live at forkfox.ai | `forkfox/CLAUDE.md` |
| Prism | `v0-product-sentinel/` | Next.js / Supabase | Sprint 1 next (pagination) | `v0-product-sentinel/CLAUDE.md` |
| BoardLord | `canvas-workbook/` | React / Next.js | Phase 2+3 planning | `canvas-workbook/CLAUDE.md` |
| Caposeo | `seo-pulse/` | Next.js / Supabase | Phase 3 next (data backfill) | `seo-pulse/CLAUDE.md` |
| PhynxTimer | `phynxtimer/` | React / TypeScript | Phase 3 in progress | `phynxtimer/CLAUDE.md` |
| Ink & Ivory | `ink-and-ivory/` | React + R3F + Firebase | Phase 4 next (vault) | `ink-and-ivory/CLAUDE.md` |
| Moonlight Analytica | `moonlight-deploy/` | Static HTML / Vercel | Live at moonlightanalytica.com | `moonlight-deploy/CLAUDE.md` |
| Construction Site | `construction-site/` | Static HTML / Vercel | Domain wire pending | `construction-site/CLAUDE.md` |
| ForkFox for Business | `forkfox-business-platform/` | Specs / Wireframes | Pre-build planning | — |

---

## Mobile-First Requirements (Mandatory — all projects)

- Test layouts 320px–768px
- Min 44px touch targets
- `clamp()` for responsive typography
- Mobile-first CSS, enhance for larger screens
- WebP images, lazy loading, bundle < 1MB

---

## Supabase Dev

```bash
npx supabase start | stop | status
npx supabase db reset
npx supabase migration up | new <name>
npx supabase gen types typescript --local > types/database.types.ts
```

Project IDs: Prism = `fnlmqkfmjfzzkkqcmahe`

---

## Design Preferences

- Think Apple, Stripe — clean, masculine, crisp
- White/off-white backgrounds: `#f8f7f4` (warm) or `#fafafa` (cool)
- NO dual-face/head Janus imagery — geometric/modern motifs only
- NO magenta/pink CTA buttons
- Offer 20-40 design variations per section when designing UI
