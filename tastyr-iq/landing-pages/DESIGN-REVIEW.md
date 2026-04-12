# ForkFox.ai — Critical Design Review

**Scope:** `fork-landing-cinematic.html`, `privacy/`, `support/`, `the-dish/`, `restaurants/`, `socials/`
**Date:** 2026-04-09
**Framing:** Extreme critical view. Every weakness flagged. Every assumption questioned.

---

## TL;DR — The Ten Things That Matter Most

1. **You have no product.** There are zero app screenshots, mockups, or iPhone frames on the homepage of a product company. You ship `mockup-browse.png`, `mockup-detail.png`, and `mockup-score.png` with the build and *don't use any of them*. This is the single biggest miss.
2. **You tell the same story three times.** Split 1 (Discover), Split 2 (AI Scoring), Split 3 (Personalize) are three restatements of "our AI scores dishes." A visitor who gets the idea in Split 1 has nothing new in Split 2 or 3 — just more text.
3. **"Dish intelligence platform" is empty.** It sounds like SaaS jargon, not food discovery. You are an app that tells people what's actually worth ordering. That's concrete. "Intelligence platform" is not.
4. **The hero promises "every dish in your city" but the footer says 3,671 dishes.** That's ~300/city. Some cities have 10,000+ restaurants. You're setting an expectation the product can't meet, which will burn users the first time they search.
5. **Your CTA doesn't know if you're live.** The hero badge says "Now live in Bay Area & Philadelphia" and then the button says "Join Waitlist." Waitlist for *what*? You're already live. This is the one copy bug that has to die first.
6. **Two of your own pages look like a different company.** `privacy/` and `support/` are light-mode gray-on-white with a completely different font stack. If someone clicks your footer they'll think they landed on Squarespace.
7. **"Restaurants" is orphaned.** A B2B page that's only reachable if you type the URL, with no nav link back to the main site and a `mailto:` form that ships your email address as HTML.
8. **No narrative arc.** The page goes: hero → cuisines → feature → feature → feature → stats → cities → signup. There's no user moment, no "here's what it feels like on a Tuesday night when you're hungry," no reason for a reader to imagine themselves using this.
9. **Responsive is retrofitted.** The mobile styles are negations — "flex-direction: column" and "display: none" — not a real mobile-first layout. The hero form rebuilds its container from scratch at 768px. Split sections collapse cleanly but lose their imagery meaning.
10. **Every image is stock.** The hero is `unsplash.com/photo-1504674900247-0877df9cc836` — the same Jenga pile of food every SaaS app uses. You have a patent-pending dish-scoring engine. Show it. Don't borrow another photographer's dinner.

---

## 1. Hero Analysis — `fork-landing-cinematic.html:175-196`

### What's working

- The typography is confident: `clamp(3rem, 8vw, 5.5rem)` on the headline, Geologica 900 weight, tight `-.04em` letter spacing. That's genuinely good.
- The "Now live" badge with the green pulse dot (line 180, line 43) is a smart micro-credibility signal.
- The dark-cinematic overlay treatment (`filter: brightness(.35)` + the linear gradient on line 40) feels premium.

### What's broken

**Copy: "The world's first dish intelligence platform" (line 182)**
Three problems in nine words. (1) "World's first" is unverifiable and feels like a placeholder. (2) "Dish intelligence platform" is jargon — the word "intelligence" is doing zero work; swap it for "app" and the sentence is stronger. (3) "Platform" is dev-speak; users don't download platforms. Try: *"The AI that scores individual dishes, not restaurants."* That's specific and you can prove it.

**Copy: "every dish you eat" (line 182)**
Factually untrue. You score 3,671 dishes across 12 cities. You do not score every dish the user eats. This will be obvious the first time a beta user searches for a dish that isn't in the index. Change to: *"AI scores the dishes on your menu — not the restaurant."*

**Copy: "across 10 cuisines, in 12 cities" (line 182)**
Fine as a fact, but buried in the subhead where it competes with the bolder value prop. It should be its own line or a badge row.

**CTA contradiction: line 180 vs line 188**
Line 180: "Now live in Bay Area & Philadelphia." Line 188: "Join Waitlist." These cannot both be true. Either you're live (in which case: "Download on iOS" or "Open the App") or you're not (in which case: kill the "Now live" badge). Pick one. Right now this costs you conversions because the reader's brain catches the contradiction and quietly loses trust.

**CTA coherence breakdown across the page:**
- Nav: "Join Beta" (line 170)
- Hero button: "Join Waitlist" (line 188)
- Hero proof row: "App Store Live" (line 192)
- Final CTA headline: "Ready to outsmart the menu?" (line 315)
- Final CTA subhead: "Join the waitlist. Be first to discover top-ranked dishes" (line 316)
- Final CTA button: "Get Early Access" (line 322)

Six different verbs for the same action across one page: **Join Beta / Join Waitlist / App Store Live / Get Early Access / Be First / Discover**. Pick one verb. One.

**Missing visual: the product.**
A hero for a mobile app should have the mobile app in it. Instead, you have a stock restaurant photo at 35% brightness. Put a floating iPhone mockup showing `mockup-score.png` right-aligned with a subtle tilt and a scroll-triggered score count-up. That single change lifts the hero more than any copy tweak.

**Form UX:**
The email input is the same width as the button at 768px (line 141-146), which pushes the form into two full-width bars stacked vertically. That's acceptable, but it loses its identity as a single "form" component. On desktop the input placeholder color is `rgba(255,255,255,.3)` (line 50) — likely fails WCAG AA contrast on the dark hero image. Raise to `.5`.

---

## 2. Narrative / Flow Analysis

The current arc:
```
Hero (value prop)
  → Cuisines carousel (proof of breadth)
  → Split 1: Discover — "AI ranks everything"
  → Split 2: AI Scoring — "AI scores every dish"
  → Split 3: Personalize — "AI reshuffles for you"
  → Metrics bar (social proof)
  → Cities list
  → Final CTA
```

**The problem:** Split 1, 2, and 3 are the same section three times with different headlines. Line 234 says the AI "knows every plate in your city." Line 253 says the algorithm "extracts dish-specific attributes and scores each plate." Line 272 says preferences reshuffle the leaderboard. These are all facets of one claim: *"We score dishes individually and rank them for you."*

You have three sections competing to say the same thing. A reader who understood it in Split 1 is now either skimming or bored.

**The fix:** Collapse Splits 1-3 into a single cinematic "How it works" showcase — 3 phones side-by-side or one phone with scroll-pinned callouts. Reclaim the other two slots for:

- **A user moment.** "You're standing at a restaurant you've never been to. You open ForkFox. Three taps later you know exactly what to order." With a floating iPhone showing the actual flow.
- **A differentiation section.** "Yelp tells you this restaurant is 4.5 stars. ForkFox tells you the salmon is a 9.1 and the ribeye is a 6.8." A side-by-side Yelp-style list vs ForkFox-style ranked dishes. This is the single clearest way to explain what you do that no one else does.

**The new arc:**
```
Hero (value prop + floating product shot)
  → Cuisines strip (breadth proof, keep it, it's good)
  → User moment (scroll-pinned iPhone + flow)
  → Old way vs ForkFox way (differentiation)
  → Metrics + cities
  → Final CTA
```

Five sections instead of seven. Each one earns its scroll.

---

## 3. Copy Red Flags (Line-by-Line)

| File:Line | Current | Problem | Fix |
|---|---|---|---|
| `fork-landing-cinematic.html:7` | "The world's first dish intelligence platform" | Buzzword | "AI scores the dishes on your menu, not the restaurant" |
| `fork-landing-cinematic.html:9` | "AI scores every dish, not restaurants" | Fine — but keep only the first half | — |
| `fork-landing-cinematic.html:180` | "Now live in Bay Area & Philadelphia" | Contradicts "Join Waitlist" button 8 lines later | Pick one: either live-and-downloadable, or coming-soon |
| `fork-landing-cinematic.html:182` | "every dish you eat" | Hyperbole, unprovable | "the dishes on any menu you pick up" |
| `fork-landing-cinematic.html:188` | "Join Waitlist" | Verb drift | Align with final-CTA verb; pick ONE |
| `fork-landing-cinematic.html:192` | "Patent Pending" | Good | — |
| `fork-landing-cinematic.html:193` | "App Store Live" | Good fact, bad as proof point next to "Join Waitlist" | Becomes "Download on iOS" CTA |
| `fork-landing-cinematic.html:200` | "10 Cuisines — Every Dish Scored" | "Every dish" is still wrong | "10 Cuisines. Thousands of dishes scored." |
| `fork-landing-cinematic.html:233` | "Michelin star or hole in the wall. We rank both." | **This line is great.** Keep it, build the section around it. | — |
| `fork-landing-cinematic.html:234` | "it knows every plate in your city" | Hyperbole | "it knows the plates we've scored in your city" or drop "every" |
| `fork-landing-cinematic.html:235` | "I'm craving something saucy, medium spice, under $15..." | "Saucy" is subjective and funny in a bad way | "I want the best $15 ramen within 2 miles" |
| `fork-landing-cinematic.html:251` | "AI Scoring to Give You a Definitive Win" | Awkward, "Definitive Win" sounds like sports-betting copy | "The algorithm behind the score" |
| `fork-landing-cinematic.html:252` | "Every dish gets a score. Not the restaurant." | **This is your actual tagline.** Promote it. | Move to hero |
| `fork-landing-cinematic.html:253` | "A 4.5-star restaurant can serve a 6/10 biryani. A no-name spot can serve a 94." | **Gold.** This sentence is your entire value prop. | Feature it in the "Old way vs ForkFox" section |
| `fork-landing-cinematic.html:270` | "Personalized Ranks That Layer in Your Preferences" | "Layer in" is wordy | "Ranked for your taste, not the average taste" |
| `fork-landing-cinematic.html:271` | "Prioritize value over food presentation? Done." | Specific, good | — |
| `fork-landing-cinematic.html:276` | "romantic date night, lively group dinner, quiet solo meal" | Scope creep — these are restaurant ambience features, not dish features. Contradicts the "we rate dishes, not restaurants" positioning. | **Cut this bullet.** |
| `fork-landing-cinematic.html:279` | "Leave photo reviews with per-attribute star ratings" | UGC feature buried in feature list | Either feature it as its own thing or cut it |
| `fork-landing-cinematic.html:295` | "12 cities and counting." | Fine, but... | ...the list below shows only 2 live cities. Either reframe as "Now in 2, expanding to 10+" or don't brag about 12. |
| `fork-landing-cinematic.html:315` | "Ready to outsmart the menu?" | Good callback to hero | — |
| `fork-landing-cinematic.html:316` | "Join the waitlist. Be first to discover..." | "Waitlist" AGAIN | "Download on iOS" or "Open the app" |
| `fork-landing-cinematic.html:322` | "Get Early Access" | Third verb | Kill, replace with single verb |

### The hidden copy wins

These are sentences already in the file that deserve to be moved up:

- **Line 233:** "Michelin star or hole in the wall. We rank both." — promote to hero subhead.
- **Line 252:** "Every dish gets a score. Not the restaurant." — this IS your tagline. Put it on a billboard.
- **Line 253:** "A 4.5-star restaurant can serve a 6/10 biryani. A no-name spot can serve a 94." — this is your 30-second pitch.

The best lines on this page are buried in the middle. Dig them out.

---

## 4. Visual Weaknesses

### Zero product visualization
You have `mockup-browse.png` (238KB), `mockup-detail.png` (178KB), `mockup-score.png` (89KB), and `forkfox-logo.png` (302KB) sitting in `landing-pages/` and **not a single one is referenced in `fork-landing-cinematic.html`** outside the 32px nav logo. You built a product that scores dishes and you are not showing a single score on the homepage.

**Fix priority:** Put `mockup-score.png` in the hero. Put a 3-up row of all three mockups in the How It Works section. Use callout pins. This is non-negotiable.

### All imagery is generic Unsplash
Four external Unsplash references (lines 177, 211, 229, 248, 267). Same food-hero stock palette every B2B SaaS company uses. For a dish-rating app, the imagery should feel personal and specific — the exact taco you're recommending, not a moody jenga of tapas.

**Fix:** Replace with real screenshots of dishes that actually appear in your database, ideally with the ForkFox score overlaid as a UI badge. Treat the hero image like a hero *product shot*, not a wallpaper.

### No animations that tie to the product
The cuisine strip auto-scrolls (line 61) and the metrics count up (line 350). Both are fine but neither teaches anything about the product. An animated dish score morphing from 7.2 → 8.8, a leaderboard reshuffling as a preference toggles, a spider chart drawing itself — these would *demonstrate* the product, not just decorate it.

### Color discipline is solid
The palette (`#FA2A52` pink, `#F97316` orange, `#0a0a0a` bg, white text) is consistent and holds together. Don't change this. It's one of the page's real strengths.

---

## 5. CTA Coherence (Already Covered, Expanded)

Going through every button on the page:

1. Nav CTA (line 170): **"Join Beta"** — anchors to `#signup`
2. Hero form button (line 188): **"Join Waitlist"** — posts to formsubmit.co
3. Hero proof (line 193): **"App Store Live"** (text, not a link)
4. Final form button (line 322): **"Get Early Access"** — posts to formsubmit.co

Four different verbs. Worse, two of the four contradict the "Now live" / "App Store Live" proof points. If the app is in the App Store, the primary CTA should be an App Store button with the actual Apple badge. The email form should be a secondary CTA for users not on iOS or out of coverage area.

**Recommended CTA stack:**
- **Primary (hero):** "Download on the App Store" — real Apple badge, links to the App Store URL
- **Secondary (hero):** "Not in my city yet — notify me" — small ghost button that opens the email form
- **Nav:** Same Apple badge, smaller
- **Final CTA:** Same pair

This also solves the "live vs waitlist" contradiction by making live the default and waitlist the fallback.

---

## 6. Subpage Brand Fragmentation

### `privacy/index.html` and `support/index.html`
Both pages use a **light-mode design system** with gray-on-white, different font stack, and CSS custom properties that don't match the main site. A user clicking "Privacy" from the footer will experience a brand break so jarring it looks like a redirect to a third-party legal service.

**Fix:** Full rewrite in the ForkFox dark design system. Geologica + Inter, `#0a0a0a` background, same nav and footer as the main landing. Content stays unchanged — only the shell changes.

### `restaurants/index.html`
- No back-link to main site in nav (only `#how-it-works` and `#pricing`)
- Form uses `action="mailto:ali@forkfox.ai"` which puts the founder's email in plaintext HTML, harvestable by bots
- Testimonials are placeholder initials (J, M, G) — worse than no testimonials

**Fix:** Add full nav back to main site. Replace `mailto:` action with a `formsubmit.co` endpoint matching the hero form, or comment it out with a note that it needs a backend. Either hide the testimonials until they're real, or replace with a "Be our first case study" pitch.

### `the-dish/index.html`
- Newsletter form has `onsubmit="return false"` — actively broken
- Article cards link to `#`, not real articles
- This is a **content hub shell**, not a blog. Either build the articles or relabel it as "Coming soon — subscribe to get notified."

**Decision made:** `/the-dish` stays as-is structurally per user direction, but the newsletter form needs to submit somewhere real (or clearly say "coming soon").

### `socials/index.html`
This one is actually fine. Minimal, on-brand, does its job.

---

## 7. Responsive Weaknesses

### The file is retrofitted, not mobile-first

The base styles (lines 16-128) assume desktop. The mobile styles (lines 131-153) *remove* features rather than *progressively enhance* from mobile up. This is the opposite of the mobile-first contract stated in `CLAUDE.md`.

### Specific issues

**Hero form (line 141-146):**
```css
@media(max-width:768px){
 .hero-form{flex-direction:column;background:transparent;border:none;padding:0;backdrop-filter:none}
 .hero-form input{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;backdrop-filter:blur(8px)}
 .hero-form button{width:100%;padding:1rem}
}
```
The mobile form *rebuilds its container from scratch* — strips the parent's background, border, padding, and backdrop-filter, then adds them back to each child. This causes a visible layout shift on page load if CSS arrives mid-render. A mobile-first version would start as stacked and use a `@media (min-width: 768px)` to add the pill shape.

**Split sections (line 131-134):**
```css
@media(max-width:900px){
 .split{grid-template-columns:1fr}
 .split-image{min-height:50vw}
 .split.reverse .split-image{order:0}
}
```
`min-height: 50vw` is a band-aid. At 400px width × 50vw = 200px image. At 375px × 50vw = 187px. These images contain nothing — they're moody restaurant wallpapers — so shrinking them to 200px removes any value they had. Mobile should either replace the image with a product shot or drop it entirely.

**Metrics bar (line 135-136, 147, 151):**
Grid goes `repeat(5,1fr)` → `repeat(3,1fr)` → `repeat(2,1fr)` → `1fr`. No minmax, no auto-fit. A fluid `repeat(auto-fit, minmax(180px, 1fr))` handles this in one line without breakpoints.

**Nav links hide below 768px (line 139):**
```css
.nav-links{display:none}
```
There's **no hamburger menu replacement.** Mobile users get no navigation at all, just the logo and a hidden `Join Beta` button that's technically still in the DOM. This is a real bug.

**Touch targets:**
- City pills (line 93): `.55rem 1.2rem` padding ≈ 36px tall. Apple HIG says 44px minimum.
- Cuisine items (line 62): Circle is 72px but label below is 10px — fine as a scroll element but not tap-friendly if tapping becomes a feature.
- Nav CTA button (line 33): `.55rem 1.3rem` ≈ 30px tall. **Fails 44px rule.**

**Font size on small screens:**
- `.hero-badge` is `.72rem` ≈ 11.5px (line 42). Below the 12px floor most readability guides recommend.
- `.metric-lbl` is `.7rem` ≈ 11.2px (line 86).
- `.hero-proof span` is `.72rem` ≈ 11.5px (line 54).

**Horizontal overflow risk:**
The cuisine strip uses `width:max-content` (line 59) with a 25s scroll animation. On iOS Safari, this can cause horizontal scroll bleed if `overflow-x: hidden` on the body isn't enforced at the right layer. Test on a real iPhone.

### Recommended responsive rewrite approach

1. **Mobile-first base styles** — assume 375px width, single column, touch targets ≥ 44px.
2. **Tablet (`min-width: 768px`)** — two-column splits, nav becomes horizontal, hero form becomes pill.
3. **Desktop (`min-width: 1024px`)** — max-width containers, larger typography clamps.
4. **Wide (`min-width: 1440px`)** — cap max-width, add generous side padding.
5. **Container queries** for the metric cells so they fit their own container, not the viewport.

---

## 8. Things to Add (Ali's Specific Questions)

### "Should we have a video as the background?"
**Yes, but conditionally.** A silent, looped, low-bitrate video of someone scrolling through the app showing a score animate would be powerful. A moody video of a restaurant would be noise. If the video is the product, yes. If the video is atmosphere, no. Also watch the file size — mobile users on 4G don't need a 40MB autoplay.

### "Mockups?"
**Yes. Urgent.** You have three mockup PNGs sitting in the deploy dir unused. At minimum: put one in the hero, put three in the "How it works" section. This is the single highest-leverage change.

### "Animations showing ForkFox app in a floating, high-def iPhone frame?"
**Yes.** Specifically:
- Hero: floating iPhone with `mockup-score.png`, subtle 3D tilt on cursor move, entrance animation on page load
- How it works: pinned iPhone (CSS `position: sticky`) with scroll-triggered content swapping on the right
- Final CTA: small iPhone mockup next to the email form for a visual anchor

iPhone frames can be pure CSS (no PNG device frame needed) — rounded `36px` corners, `1px rgba(255,255,255,.1)` border, subtle drop shadow, interior `screen` div with the mockup as `object-fit: cover`.

### "More explainers?"
**Fewer, not more.** You have three overlapping feature sections now. Consolidate to one "How it works" with clear numbered steps. Add one comparison section ("Old way vs ForkFox way"). That's it. More text = less clarity.

### "Should we have a video as the background vs mockups?"
Test both in the gallery. My recommendation: **mockups first, video as a secondary visual accent in the "How it works" pinned iPhone (video plays inside the phone screen, not behind the whole page).**

---

## 9. Strategic Recommendations

### 9.1 Rebuild around a user moment
The most important rewrite: center the homepage on a single moment the user will recognize. Suggested moment:

> You just sat down at a ramen spot you've never been to. The menu has 14 bowls. You have no idea which one is good. You open ForkFox. The top-ranked bowl is a 9.1 — tonkotsu with extra chashu. You order it. It's the best ramen you've had in months.

Build the hero around this moment. Build the "How it works" around this flow. Every screenshot should feel like a step in *this* story.

### 9.2 Kill the "platform" language
Every time the page says "platform" or "intelligence" or "leverage," a user leaves. ForkFox is an app. An app that scores dishes. Say that.

### 9.3 Pick one verb for the CTA
I recommend **"Download on iOS"** as the primary, with **"Notify me"** as the fallback for out-of-coverage users. Four different CTA verbs across the page is a trust leak.

### 9.4 Earn the "12 cities" claim or drop it
You currently brag about 12 cities but only 2 are live. Visitors notice. Either:
- Rewrite as "Live in Bay Area and Philadelphia. Rolling out to 10 more."
- Or remove the 12-city teaser until at least 4 are live.

### 9.5 Show the score
The score is your product. Put a score on the hero. Put a spider chart in "How it works." Put a before/after leaderboard in the comparison section. The word "score" should appear on screen more often than any other word on this page.

### 9.6 Fix the subpages before the main page
Privacy and support currently look like a different company. Fixing them is free (content stays the same, only the shell changes) and the payoff is significant: full-site brand coherence. This is a no-brainer first move.

### 9.7 Build a real "old way vs ForkFox way" section
Line 253 has your most persuasive sentence — "A 4.5-star restaurant can serve a 6/10 biryani. A no-name spot can serve a 94." Build a visual around this. Left side: Yelp-style restaurant list with stars. Right side: ForkFox dish-level rankings with scores. The contrast is your entire pitch.

---

## 10. Skills + Actions to Apply

These are the Claude Code skills and agent capabilities that should be used when executing the rewrite:

| Skill | Use for |
|---|---|
| `frontend-design` | Distinctive, production-grade frontend interfaces for the gallery tiles and the main landing rewrite |
| `ui-ux-pro-max` | 50 styles × 21 palettes, used for the 20 full-page combination mockups in the gallery |
| `visual-design-foundations` | Typography scale, color theory, spacing systems for the rewrite |
| `responsive-design` | Container queries, modern CSS, mobile-first rebuild |
| `interaction-design` | Microinteractions, scroll-triggered animations, iPhone tilt effect |
| `accessibility-compliance` | WCAG 2.2 pass on contrast (the `.3` placeholder color, the small badge text), touch targets, motion-reduce preferences |
| `brand-guidelines` | Enforcing the ForkFox dark system across privacy/support |
| `web-component-design` | Reusable iPhone frame, score ring, spider chart as CSS-only components |
| `copy-editing` | Unified verb, reduced buzzwords, tighter sentences |
| `wcag-audit-patterns` | Automated check on color contrast and keyboard flow |
| `webapp-testing` | Playwright screenshots at 320/375/414/768/1024/1440 post-rewrite |
| `launch-strategy` | Frame the rewrite around the "live in 2 cities, expanding" narrative honestly |
| `marketing-psychology` | The "old way vs ForkFox way" section leans on contrast bias and anchoring |

---

## 11. What's Next

1. **This document** — delivered.
2. **Brand-coherence fixes** — privacy/support dark-mode conversion, `/restaurants` nav fix, `/the-dish` newsletter fix, main landing responsive audit. Executed before the gallery.
3. **Mockup gallery** — `gallery/index.html` with 60 live CSS mockups across 3 categories (20 hero variations, 20 feature-showcase variations, 20 full-page combinations).
4. **User checkpoint** — Ali picks winning hero + feature-showcase + combination.
5. **Main landing rewrite** — apply picks, apply copy fixes, wire up the mockups, mobile-first from scratch.
6. **Ship.**

The gallery is where the real design exploration happens. This doc is the why; the gallery is the what.
