# ForkFox for Business — project workspace

**Owner:** Ali Mabsoute
**Started:** 2026-04-19
**Thesis:** Integrated restaurant-tech B2B platform combining ForkFox (discovery), Janus (in-store analytics), and Caposeo (local SEO) into a single SaaS offering for independent restaurants. Philly beachhead.

> Reference: `project_forkfox_restaurant_tech_stack.md` in Claude memory has the strategic context. This workspace is the execution layer.

---

## What lives here

```
forkfox-business-platform/
├── README.md                    ← this file
├── specs/
│   └── PRODUCT_SPEC.md          ← full product spec (ICP, tiers, features, data model, risks, v1 definition)
├── prompts/
│   ├── WIREFRAME_PROMPT.md      ← paste-ready prompt to generate the hi-fi dashboard wireframe in Claude
│   └── PITCH_DECK_PROMPT.md     ← paste-ready prompts for BOTH decks (restaurant sales + investor)
└── assets/
    ├── forkfox/                 ← logos, consumer-app mockups, brand refs
    ├── janus/                   ← Janus overview doc, existing presentation
    └── caposeo/                 ← Caposeo competitive analysis
```

---

## Quick start (two workflows)

### Workflow 1 — Generate the dashboard wireframe
1. Open `prompts/WIREFRAME_PROMPT.md`
2. Copy the entire `PROMPT` block
3. Open Claude (Opus or Sonnet, any with artifacts)
4. Attach the logos + mockups from `assets/forkfox/` to the chat
5. Paste the prompt
6. Claude returns a single self-contained HTML file — save it as `forkfox-business-dashboard.html`
7. Open it in a browser
8. Iterate page-by-page as described at the bottom of the prompt file

### Workflow 2 — Generate a pitch deck
1. Open `prompts/PITCH_DECK_PROMPT.md`
2. Choose Variant A (restaurant sales) or Variant B (investor)
3. Copy the relevant `PROMPT` block
4. Paste into Claude
5. Claude returns a multi-slide HTML presentation — save it as `deck-sales.html` or `deck-investor.html`
6. Navigate with arrow keys
7. Iterate slide-by-slide using the iteration tips at the bottom

---

## Design system reference (use across everything)

| Token | Hex | Use |
|---|---|---|
| `--brand-red` | `#FA2A52` | Primary CTA, ForkFox heritage accent |
| `--brand-orange` | `#F97316` | Secondary accent |
| `--ink` | `#1a1f2e` | Text, sidebar nav bg |
| `--ink-2` | `#2c3345` | Secondary text |
| `--surface` | `#ffffff` | Cards |
| `--surface-cool` | `#f8f9fb` | App background |
| `--surface-warm` | `#f7f5f2` | Alternate sections |
| `--border` | `#e5e7eb` | Dividers |
| `--success` | `#34d399` | Positive metrics |
| `--warning` | `#c68a1d` | Caution |
| `--danger` | `#c94a4a` | Errors |
| `--muted` | `#6b7280` | Labels |

**Typography:** Inter (body), Geologica or Inter Bold (headings), JetBrains Mono (data/code).

**Voice:** Owner-first. Blunt. Metrics with context. No jargon, no AI-generic flavor.

---

## Three products, one platform

### ForkFox (consumer side)
- Repo: `C:\Users\alima\tastyr-iq\` (landing pages in `tastyr-iq/landing-pages/`)
- Live: https://forkfox.ai
- Role in platform: consumer discovery + DoorDash affiliate funnel
- Brand owner — leads the design

### Janus (in-store analytics)
- Repo: `C:\Users\alima\janus-demo\`
- Status: Sprint 7 complete (2026-04-18), 234 tests passing
- Role in platform: restaurant-side foot traffic, dwell time, zone analytics
- Currently terminal-aesthetic — will need a daylight-mode skin for the B2B dashboard

### Caposeo (local SEO)
- Repo: `C:\Users\alima\seo-pulse\`
- Status: Phase 1 complete, 12 pages seeded
- Role in platform: Google Business Profile optimization, local SEO, review management, schema
- Design already close to the B2B dashboard target aesthetic

---

## Working constraints

- Ali is at Hyatt full-time and pursuing BlackRock VP roles. This workspace is for nights/weekends + when BlackRock search concludes.
- Path A from strategy memo stands: **land BlackRock first, keep this workspace active but not primary, take real swing in 2–3 years with cash + credibility.**
- Meanwhile: the wireframe + deck can be pitched to 5–10 Philly restaurants for design-partner commitments, without leaving the day job.

---

## Next concrete actions (in order)

1. **This session:** Read through `PRODUCT_SPEC.md` and sanity-check tiers, pricing, ICP, Philly GTM. Mark anything off.
2. **Generate the wireframe** using `WIREFRAME_PROMPT.md`. Iterate to v1 quality.
3. **Generate Variant A (sales deck)** using `PITCH_DECK_PROMPT.md`. Iterate.
4. **List 10 target Philly restaurants.** Research owners, neighborhoods, decision-maker profile.
5. **Walk into 3** with the sales deck + a 60-second pitch. Log every objection heard.
6. **Iterate pricing + tiers** based on those 3 conversations.
7. **Only after** that validation, generate Variant B (investor deck) and start advisor conversations.

---

## Open questions (decide before pitching)

- [ ] Beachhead neighborhood: Fishtown first, or Passyunk / Queen Village?
- [ ] Janus hardware: bundled free, $99 one-time, or BYO-camera?
- [ ] DoorDash affiliate: wait for signed deal, or pitch as "coming Q3 2026" in decks?
- [ ] Stripe self-serve for Tier 1, or all tiers gated behind a sales call for first 20 customers?
- [ ] Cameras: privacy policy + staff notification template needed before first install.
- [ ] "ForkFox for Business" name — stays, or rebrand to something more restaurant-industry-standard?

---

## Related memory

- `~/.claude/projects/C--Users-alima/memory/project_forkfox_restaurant_tech_stack.md` — strategic context, packaging framework, GTM plan
- `~/.claude/projects/C--Users-alima/memory/MEMORY.md` — active-projects index
- `C:\Users\alima\tastyr-iq\docs\planning\forkfox-system-plan.md` — ForkFox consumer-side plan (pSEO, analytics, social automation)
