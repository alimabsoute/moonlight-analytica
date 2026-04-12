# CLAUDE.md

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
| Janus Demo | `janus-demo` | frontend-v3/, shared/, edge_agent/ |
| Moonlight | `.` (root) | moonlight-deploy/ |
| Robinhood | `robinhood-trading-system` | All files |

**Push Policy**: DO NOT auto-push. Only push when explicitly requested.

## Active Projects

| Project | Directory | Status |
|---------|-----------|--------|
| Moonlight Analytica | `moonlight-deploy/` | Live at moonlightanalytica.com |
| ForkFox | `tastyr-iq/` | AI dish intelligence CRM |
| Janus Demo | `janus-demo/` | Visual line counter & tracking |
| Robinhood Trading | `robinhood-trading-system/` | Automated trading signals |

## Moonlight Analytica — Deployment

- **URL**: https://moonlightanalytica.com
- **Deploy dir**: `C:\Users\alima\moonlight-deploy\`
- **Deploy cmd**: `cd moonlight-deploy && vercel --prod --yes`
- **Domain**: Registered through Vercel, points to moonlight-deploy project

### Key Files
- `moonlight-complete-structure.html` — homepage
- `news.html` — articles with company logos
- `article-header-template.html`, `ARTICLE-WORKFLOW.md`
- Company logos: `4a.png` (Amazon), `5a.png` (NVIDIA), `7a.png` (Intel)
- `vercel.json` — routes, headers, rewrites

### Backup
- Master: `moonlight-MASTER-BACKUP-20250907.html`
- Restore: `cp moonlight-MASTER-BACKUP-20250907.html moonlight-deploy/moonlight-complete-structure.html`

### Commands
```bash
cd moonlight-deploy && vercel --prod --yes        # Deploy
cd moonlight-deploy && vercel ls                   # Check status
vercel promote [URL] --scope=alimabsoute-3065s-projects  # Rollback
```

## Moonlight Design System

- **Theme**: Neon cyber
- **Colors**: #00bfff (primary), #87ceeb (secondary), #4682b4 (accent)
- **Fonts**: Inter (body), Poppins (headings) with text shadows/glow
- **Buttons**: Scan line animations, glowing borders, hover effects
- **Pages**: Homepage (3D cube + particles), Products, Insights, Updates, Contact

## Mobile-First Requirements (Mandatory)

- Test all layouts 320px-768px
- Min 44px touch targets
- Use `clamp()` for responsive typography
- Mobile-first CSS, enhance for larger screens
- WebP images, lazy loading, bundle < 1MB
- Responsive units: rem, em, %, vw, vh

## Supabase Dev (project ID: "alima")

```bash
npx supabase start | stop | status
npx supabase db reset
npx supabase migration up | new <name>
npx supabase gen types typescript --local > types/database.types.ts
```

