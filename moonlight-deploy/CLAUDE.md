# Moonlight Analytica

Static HTML website live at **https://moonlightanalytica.com**

## ⚠️ Deployment — READ THIS FIRST

**Source of truth**: this folder (`C:\Users\alima\moonlight-deploy\`). Nowhere else.

**Deploy command** (the only correct one):
```bash
cd /c/Users/alima/moonlight-deploy && vercel --prod --yes
```

**Critical rules**:
1. **Never deploy moonlight from any other folder.** A second clone of `alimabsoute/moonlight-analytica` once existed at `C:\Users\alima\moonlight-analytica\` (now archived in `ARCHIVED_MOONLIGHT_PROJECTS/`). Both folders were Vercel-linked to the same project. On 2026-04-21, that rogue clone pushed an old snapshot to GitHub `main` and Vercel auto-deployed it — silently regressing prod for ~6 days.
2. **Never `git push` to `alimabsoute/moonlight-analytica`** unless you're certain GitHub auto-deploy is still disconnected on the Vercel project.
3. **GitHub auto-deploy is currently DISCONNECTED** (done 2026-04-26 via `vercel git disconnect`). If anyone reconnects it in the Vercel dashboard, the regression vector is back.
4. **Files in this folder are tracked from `/c/Users/alima/.git`** (the root workspace), not by a `.git` here. Commits to moonlight content live in the root workspace's history.
5. **Verify every deploy**: `curl -I https://www.moonlightanalytica.com` — expect `Content-Length` ~212000 and a recent `Last-Modified`. A drop to ~114KB means an old build is live.

See also: `~/.claude/projects/C--Users-alima/memory/feedback_moonlight_vercel_autodeploy.md`

- **Platform**: Vercel (domain registered through Vercel)
- **Vercel project**: `prj_iG4IHhU5S6isbMKAFMLoIM1jb5Xq` (org `team_Bad3oPaEHzUceO3LVH5KXIN1`)
- **No build step** — static HTML files served directly
- **No database, no env vars, no backend** (except `/api/subscribe.js` which logs only)

## Routing (vercel.json)

- `/` rewrites to `moonlight-complete-structure.html` (homepage)
- All other HTML files served at their filename path

## Key Files

| File | Purpose |
|------|---------|
| `moonlight-complete-structure.html` | Homepage (45KB) |
| `news.html` | News section with 10 articles (60KB) |
| `contact.html` | Contact form |
| `insights.html` | Blog/insights |
| `solutions.html` | Solutions page |
| `vercel.json` | Routes, headers, caching (5-min cache) |
| `ARTICLE-WORKFLOW.md` | Article creation guidelines |
| `MOONLIGHT-ARTICLE-STYLE-GUIDE.md` | Writing style guide |

## Image Assets

Company logos: `1a.png`-`10a.png` (1-2MB each, PNG)
- `4a.png` = Amazon, `5a.png` = NVIDIA, `7a.png` = Intel

## Design System

- **Theme**: Neon cyber — dark backgrounds, glowing borders, scan line animations
- **Colors**: #00bfff (primary), #87ceeb (secondary), #4682b4 (accent)
- **Fonts**: Inter (body), Poppins (headings)
- **Hero**: 3D cube with particles

## Article Creation

New articles: create HTML file in this directory, add link to `news.html`.
Follow `ARTICLE-WORKFLOW.md` and `MOONLIGHT-ARTICLE-STYLE-GUIDE.md` for formatting.

## Commands

```bash
vercel --prod --yes          # Deploy
vercel ls                    # Check deployments
vercel promote [URL] --scope=alimabsoute-3065s-projects  # Rollback
```

## Backup

Master homepage backup: `C:\Users\alima\moonlight-MASTER-BACKUP-20250907.html`
