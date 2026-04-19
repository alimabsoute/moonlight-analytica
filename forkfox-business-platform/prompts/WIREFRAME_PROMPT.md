# WIREFRAME PROMPT — ForkFox for Business dashboard

**How to use this file:** Paste the entire "PROMPT" block below into Claude (any model with artifacts — Opus or Sonnet). Claude will generate a multi-page hi-fi HTML/Tailwind wireframe of the restaurant-owner-facing dashboard. You can iterate inside that artifact.

---

## PROMPT

```
Generate a high-fidelity, multi-page HTML/CSS wireframe (single self-contained HTML
file using Tailwind via CDN) for a SaaS dashboard called "ForkFox for Business". The
user is an independent restaurant owner in Philadelphia.

Produce a polished, production-grade visual design — not skeleton boxes. Use real
copy, real data, real numbers, not "Lorem ipsum". Think Linear, Vercel, and Stripe
Dashboard quality. Do NOT use generic stock icons or blurry gradients.

=========================================================
1. THE PRODUCT — what this dashboard is
=========================================================
ForkFox for Business gives independent restaurants a single login for three
integrated tools:

  • ForkFox (consumer-side discovery): featured placement in the ForkFox app,
    menu management, dish-level demand signals from users in their neighborhood.
  • Janus (in-store analytics): live video analytics with custom zone tracking,
    foot traffic counts, dwell time, heatmaps, queue alerts.
  • Caposeo (local SEO): Google Business Profile optimization, local keyword
    tracking, competitive SERP monitoring, schema markup, review management.

One account. One invoice. One dashboard.

Pricing tiers (show in a settings/billing page):
  - Tier 1 Presence: $49–99/mo
  - Tier 2 Intelligence: $148–248/mo total (adds Janus single-camera)
  - Tier 3 Performance: $297–497/mo total (adds multi-camera, ad placement, CSM)

=========================================================
2. TARGET USER
=========================================================
Owner of an independent Philadelphia restaurant (1–5 locations). Time-starved,
checks dashboard from phone in the morning and laptop in the afternoon.

Sample restaurant to reference throughout the wireframe:
  Name: "Suraya" (or "Café La Maude" — pick one and keep it consistent)
  Neighborhood: Fishtown, Philadelphia
  Cuisine: Lebanese (or French-bistro if Café La Maude)
  Tier subscribed: Tier 2 Intelligence
  2 cameras: front entrance + main dining zone

Use REAL-feeling numbers. Examples:
  - Foot traffic yesterday: 342 entries (↑12% vs 4-wk avg)
  - SEO rank "best lebanese philadelphia": #4 (up from #7 last week)
  - ForkFox app impressions: 1,842 this week, 67 clicks, est. 9 walk-ins
  - Dwell time in dining zone: 48 min avg
  - Peak hours: 7:15pm–8:30pm (match to real dinner rush)

=========================================================
3. DESIGN SYSTEM (use exactly these tokens)
=========================================================
Palette:
  --brand-red:    #FA2A52   (primary CTA, key highlights)
  --brand-orange: #F97316   (secondary accent, metrics-up)
  --ink:          #1a1f2e   (primary text, sidebar nav bg)
  --ink-2:        #2c3345   (secondary text)
  --surface:      #ffffff   (cards)
  --surface-cool: #f8f9fb   (app background)
  --surface-warm: #f7f5f2   (alternate sections)
  --border:       #e5e7eb
  --success:      #34d399
  --warning:      #c68a1d
  --danger:       #c94a4a
  --muted:        #6b7280

Typography:
  - Headings: Inter Bold or Geologica (use Google Fonts link)
  - Body: Inter
  - Data / monospace: JetBrains Mono (for zone IDs, timestamps, coordinates)

Layout:
  - Dark sidebar (ink #1a1f2e) with white text + red active state
  - Main area: surface-cool #f8f9fb background, white cards with soft borders
  - Cards: 12px radius, border 1px #e5e7eb, subtle shadow shadow-sm
  - Generous whitespace — Linear/Vercel dashboard feel
  - Data-dense but never cramped
  - Mobile-first responsive (dashboard should read well at 375px too)

Visual style:
  - Clean, professional, data-forward
  - Use real chart libraries (inline SVG OR Chart.js CDN OR Recharts if possible)
  - NO purple gradients, NO generic stock imagery, NO emoji-heavy headlines
  - Accents in brand red sparingly — CTAs, active nav, critical alerts only
  - Use SVG icons inline (Lucide or Heroicons style — stroke weight 1.5)

=========================================================
4. PAGES TO GENERATE (each as a separate "screen" in the HTML)
=========================================================
Use a simple top-bar tab or sidebar nav to switch between them in the single HTML
file. Render all pages; user can click through.

PAGE 1 — Overview (default landing after login)
  Header: "Good morning, Greg" + today's date + weather chip
  4 KPI cards in a row:
    [Foot Traffic Yesterday]  342  ↑12% vs 4-wk avg
    [SEO Rank (tracked kw)]    #4  ↑3 positions this week
    [ForkFox Impressions]   1,842  67 clicks · est. 9 walk-ins
    [Reviews This Week]         8  avg 4.7★ (1 flagged for response)
  Main column:
    - Traffic chart (foot traffic last 14 days, line chart, gridlines)
    - "This week's insights" card — 3 bullet insights written in plain English
  Right rail:
    - Alerts panel (2–3 items: queue long at 7:18pm yesterday; review needs response; competitor rank-jumped)
    - Upcoming CSM review (if Tier 3)

PAGE 2 — ForkFox Presence
  - Featured placement status (On/Off, neighborhoods targeted)
  - Weekly impressions / clicks / estimated walk-ins with trend chart
  - Top dishes people searched for in Fishtown this week (data from ForkFox user behavior)
  - Menu manager preview (dish cards)
  - Budget / placement upgrade CTA

PAGE 3 — Janus In-Store Analytics
  - Floor plan canvas (SVG or CSS) with two zones drawn: "Entrance", "Dining"
  - Heatmap overlay toggle
  - Real-time counts: currently 23 in dining, 2 in entrance queue
  - Today's entries chart by hour (bar chart)
  - Dwell time histogram
  - Zone comparison table
  - Privacy note: "No facial recognition. No PII stored."

PAGE 4 — Caposeo Local SEO
  - GBP health score gauge (89/100)
  - Tracked keywords table: keyword | rank | delta | SERP features
  - Competitor SERP comparison (3 nearby competitors)
  - Review inbox (4 recent reviews, one with AI-drafted response ready)
  - Schema markup checklist

PAGE 5 — Settings / Billing
  - Account info
  - Current tier: "Intelligence" ($198/mo · next invoice May 19)
  - Tier compare table (Presence / Intelligence / Performance) with upgrade CTA
  - Invoice history
  - Team / users (1 owner, 2 staff)
  - Cameras (manage Janus devices)

=========================================================
5. INFORMATION DENSITY
=========================================================
Each page should have at least 6–10 distinct UI elements. Do NOT over-simplify.
The restaurant owner lives in this dashboard; it must feel alive, like Linear or
Notion, not like a brochureware landing page.

Include micro-interactions hinted in the markup (hover states commented out, active
states shown, loading skeletons on one data card per page).

=========================================================
6. DO NOT
=========================================================
- Do NOT use gradient-heavy "dashboard-template" looks.
- Do NOT use emoji as primary icons.
- Do NOT pad with Lorem ipsum.
- Do NOT break the palette — reuse the tokens above.
- Do NOT output React / JSX / Vue. Plain HTML + Tailwind only.

=========================================================
7. OUTPUT FORMAT
=========================================================
A single self-contained .html file that I can save and open in a browser.
Use Tailwind via CDN (https://cdn.tailwindcss.com).
Use Chart.js via CDN if you need charts.
Use inline <svg> for icons and the floor plan.

Start rendering now. Produce polished, specific, real-feeling screens.
```

---

## How to iterate after the first render

1. **Tone check:** Does the copy sound like a Philly restaurant owner would read it and nod? If not, tell Claude: "Rewrite every label and insight in the voice of a blunt neighborhood restaurant owner."
2. **Data density check:** Does it feel alive? If sparse: "Each card needs 3x the data density — think Linear or a Stripe Dashboard."
3. **Visual polish check:** Does it look like a $200/mo product or a template? If templatey: "Tighten the spacing, reduce the border radius to 8px, remove any gradients, swap any stock icons for hand-drawn Lucide-style SVG."
4. **Screen-specific:** Re-prompt per page if one needs work. "Redo Page 3 (Janus In-Store Analytics) — the floor plan should be a real SVG with clickable zones, foot-traffic flow lines, and a toggle for heatmap."

---

## Assets you can hand Claude alongside the prompt

From this project folder:
- `assets/forkfox/forkfox-logo.png` — main logo
- `assets/forkfox/forkfox-alt-logo.png` — alt mark
- `assets/forkfox/mockup-browse.png` — consumer-app feel, for brand reference
- `assets/forkfox/mockup-detail.png` — consumer-app detail, for brand reference
- `assets/forkfox/mockup-score.png` — consumer-app score, for brand reference
- `assets/janus/JANUS-OVERVIEW.md` — Janus technical overview for context
- `assets/caposeo/Caposeo-Competitive-Analysis.pdf` — competitive context

Drop the logos + mockups into Claude's chat as attachments so it can see the actual ForkFox brand, then paste the prompt.
