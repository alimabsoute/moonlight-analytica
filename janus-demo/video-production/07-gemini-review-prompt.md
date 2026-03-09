# Gemini 3.1 Pro Review Prompt — Day 5 Final QA

## Instructions

1. Open [Google AI Studio](https://aistudio.google.com/) with Gemini 3.1 Pro
2. Upload the JANUS-OVERVIEW.md file as context
3. Paste the prompt below
4. Attach all 5 narration scripts (from `05-narration-scripts.md`)
5. Review Gemini's output and apply corrections

---

## Upload These Files to Gemini

1. `JANUS-OVERVIEW.md` — Product source of truth
2. `05-narration-scripts.md` — All 5 narration scripts
3. `06-edit-decision-lists.md` — Shot timing reference

---

## The Prompt

Copy-paste this entire block into Gemini 3.1 Pro:

````
You are a video production QA specialist reviewing 5 promotional video scripts for Janus, an AI-powered real-time people analytics platform. I've attached the product overview document (JANUS-OVERVIEW.md) as the authoritative source of truth, along with all 5 narration scripts and their corresponding edit decision lists.

Please perform the following 7 quality checks and provide detailed findings for each:

---

### CHECK 1: Statistical Accuracy

Compare every number, percentage, and statistic mentioned in the narration scripts against JANUS-OVERVIEW.md. Flag any discrepancies.

Specifically verify:
- "68% of retail managers" — source and accuracy
- "$4.5B lost annually" — source and context
- "50+ KPIs" — actual count from feature list
- "$3,500/month" ROI calculation — math check (500 visitors × 2% improvement × $35 AOV)
- "30+ FPS" detection speed — matches spec table
- "171 FPS" ByteTrack throughput — matches technical section
- Model sizes (6MB, 22MB, 49MB) — matches spec
- FPS ranges per model — matches benchmark table
- Compliance claims (GDPR, CCPA, BIPA, EU AI Act) — matches compliance table
- Any other numerical claims

For each stat, state: VERIFIED / DISCREPANCY / UNVERIFIABLE, with the source reference.

---

### CHECK 2: Narration Timing vs. Shot Durations

For each video, calculate:
1. Total word count of the narration
2. At 150 words per minute, how many seconds the narration takes
3. Compare narration duration to the total video duration
4. Flag any shots where the narration exceeds the available time window
5. Identify any "dead air" gaps longer than 3 seconds without narration

Format as a table:
| Video | Words | Narration Time | Video Duration | Margin | Issues |

---

### CHECK 3: Brand Consistency

Check all scripts against the key messaging in JANUS-OVERVIEW.md Section 13:

1. Is the primary tagline "Google Analytics for Physical Spaces" used consistently?
2. Are alternative taglines used correctly and not mixed up?
3. Does the tone match the brand voice guidelines (professional, approachable, data-driven)?
4. Are the feature headlines consistent with Section 13's feature headline table?
5. Is the privacy messaging consistent with Section 10's approved language?
6. Are there any claims not supported by the overview document?

---

### CHECK 4: Technical Claim Accuracy

Verify every technical claim against the technical deep dive (Section 5) and specs (Section 14):

1. YOLO version references — is it consistently "YOLOv11" (not "v8" or "v10")?
2. Tracker descriptions — ByteTrack and BoT-SORT capabilities accurate?
3. "No video stored" / "No cloud upload" — consistent with privacy architecture?
4. "Edge processing" claims — accurate per architecture diagram?
5. "Anonymous IDs that expire" — matches session management description?
6. Camera compatibility claims — consistent with supported sources table?
7. "Updated every 2 seconds" — matches auto-refresh spec?
8. Zone configuration description — matches feature breakdown?
9. Dashboard features mentioned — all actually exist in the product?

Flag any exaggerations, understatements, or inaccuracies.

---

### CHECK 5: Narration Flow and Readability

For each script, evaluate:
1. Does it read naturally when spoken aloud? Flag awkward phrasing.
2. Are sentences too long for comfortable delivery? (Flag any over 25 words)
3. Is the vocabulary appropriate for the target audience?
4. Are there any tongue-twisters or difficult pronunciation sequences?
5. Do transitions between shots sound natural?
6. Is the pacing appropriate for the video's purpose (awareness vs. deep dive)?

Provide 2-3 specific rewrite suggestions per script where improvement is needed.

---

### CHECK 6: Consistency Across Videos

Check that the 5 videos work as a coherent set:
1. Do they tell a logical story when watched in order (Problem → How → Privacy → Demo → Deep Dive)?
2. Is information repeated unnecessarily across videos?
3. Are there contradictions between videos?
4. Does each video have a distinct purpose, or do any overlap too much?
5. Are the end cards and CTAs consistent?
6. Would a viewer who watches all 5 get a complete picture of Janus?

---

### CHECK 7: Alternative Narration Variations

For each video, generate ONE alternative version of the most important line (the hook or closing statement). These should be:
- Same length (±5 words)
- Same meaning
- Different phrasing for A/B testing

Format:
| Video | Original Line | Alternative Version |

---

## OUTPUT FORMAT

Please structure your response as:

```
## QUALITY REVIEW RESULTS

### CHECK 1: Statistical Accuracy
[findings]

### CHECK 2: Narration Timing
[table + findings]

### CHECK 3: Brand Consistency
[findings]

### CHECK 4: Technical Claims
[findings]

### CHECK 5: Narration Flow
[findings + rewrites]

### CHECK 6: Cross-Video Consistency
[findings]

### CHECK 7: Alternative Lines
[table]

### SUMMARY
- Total issues found: X
- Critical (must fix): X
- Minor (nice to fix): X
- Suggestions (optional): X
```

Be thorough but practical. Focus on issues that would be noticeable to a viewer, not pedantic nits. If everything checks out, say so — don't manufacture problems.
````

---

## Expected Gemini Output

Gemini should return a structured review covering all 7 checks. Key things to look for in its output:

### Likely Findings to Expect:
1. **Stats should all verify** — they're pulled directly from JANUS-OVERVIEW.md
2. **Timing may be tight** on Video 5 — 375 words in 150 seconds requires steady 150 WPM
3. **Brand consistency should be strong** — taglines are used consistently
4. **YOLO version** — scripts use "YOLOv11" consistently, overview says "YOLOv11"
5. **"30+ FPS"** — the benchmark table shows 25-45 FPS for nano on GPU, so "30+" is within range but conservative
6. **Alternative lines** — useful for A/B testing title cards and end cards

### If Gemini Finds Issues:
1. **Statistical error**: Cross-reference against JANUS-OVERVIEW.md and fix the script
2. **Timing issue**: Either trim narration words or extend the shot duration in the EDL
3. **Technical inaccuracy**: Fix in the script and verify against the codebase
4. **Brand inconsistency**: Align with Section 13 messaging guidelines

---

## Post-Review Actions

After receiving Gemini's review:

1. [ ] Fix all CRITICAL issues in `05-narration-scripts.md`
2. [ ] Adjust any timing issues in `06-edit-decision-lists.md`
3. [ ] Consider alternative lines for A/B testing
4. [ ] Update motion graphics specs if text content changed
5. [ ] Final read-through of all corrected scripts
6. [ ] Mark production as QA-APPROVED

---

## Bonus: Thumbnail Generation Prompts

After QA, use Gemini to generate YouTube thumbnail concepts:

```
Based on these 5 Janus videos, suggest a thumbnail design for each that:
- Uses the Janus brand colors (cyan #22d3ee on dark #0a0a0f)
- Has bold, readable text (3-5 words max)
- Creates curiosity or addresses a pain point
- Works at small sizes (mobile YouTube)

For each thumbnail, provide:
1. Background description (what visual)
2. Text overlay (2-4 words, positioned where)
3. Color treatment
4. Emotional trigger (curiosity, fear of missing out, etc.)
```
