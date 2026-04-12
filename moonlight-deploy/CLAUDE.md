# Moonlight Analytica

Static HTML website live at **https://moonlightanalytica.com**

## Deployment

```bash
cd moonlight-deploy && vercel --prod --yes
```

- **Platform**: Vercel (domain registered through Vercel)
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
