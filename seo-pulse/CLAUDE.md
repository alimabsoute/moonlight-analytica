# Caposeo (seo-pulse)

## Purpose
AI-powered SEO intelligence platform with keyword tracking, competitor analysis, content optimization, and audit reports.

## Stack
- Next.js (App Router), TypeScript
- Supabase (PostgreSQL backend)
- DataForSEO API (keyword tracking, SERP data, site audits)
- Brave Search API (competitor research)
- TanStack Query (data fetching)
- Zustand (state management)

## Dev Commands
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npm test             # Run tests (if configured)
```

## Deploy
```bash
vercel --prod --yes  # Deploy to Vercel
# URL: https://caposeo.vercel.app (or custom domain when configured)
```

## Key Folders
| Path | Purpose |
|------|---------|
| `src/app/` | Next.js App Router pages (12 seeded pages) |
| `src/lib/` | Core APIs: `data-for-seo.ts`, `supabase.ts`, utility functions |
| `src/stores/` | Zustand stores (`project.ts` + others) |
| `src/components/` | Reusable React components |
| `public/` | Static assets |

## Key Pages
- `dashboard` — Overview + KPIs
- `keywords` — Keyword tracking + ranking
- `competitors` — Competitor analysis
- `explorer` — SERP explorer
- `rank-tracker` — Position tracking over time
- `site-audit` — Technical SEO audit
- `content-editor` — Optimization recommendations
- `reports` — Custom report generation
- `pulse-lab` — Experimental features
- `onboarding` — Setup flow
- `settings` — User/project config

## Current Status
**Phase 1** ✅ (12 pages seeded, UI scaffolding complete)
**Phase 2** ✅ (Supabase schema, basic auth, project routing)
**Phase 3** IN PROGRESS: Data backfill + real API integration

## Known Risks
- DataForSEO API key not yet wired (using seed data)
- Brave Search integration placeholder only
- No real keyword tracking persistence yet
- Rate limiting not implemented for external APIs
- Supabase auth flow needs hardening

## Next 3 Tasks
1. **Start Phase 3 data backfill** — Seed production Supabase with sample keywords, competitors, ranking history
2. **Wire real DataForSEO API calls** — Replace seed data in `data-for-seo.ts` with live API requests (keywords, SERP, audits)
3. **Implement keyword tracking persistence** — Save ranking snapshots to Supabase, compute trend deltas, persist across sessions

## GitHub
- Repo: [alimabsoute/caposeo](https://github.com/alimabsoute/caposeo)
- Branch: `feature/toolset-enhancement` (shared with other projects)

## Obsidian
Update `Claude Code Projects/Caposeo.md` with Phase 3 progress and any blockers.
