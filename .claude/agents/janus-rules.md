# The Janus Rules — Research Integrity Standards

**Origin**: Post-mortem analysis of the Janus Demo planning failure (March 2026).
A 25-gate, 5-sprint plan was built on assumptions that were all wrong. RF-DETR beat YOLO by +4-6 mAP. Azure Spatial Analysis had been RETIRED for 12 months. The entire stack was AGPL-licensed. Nobody checked.

**These rules apply to ANY agent doing research or validating a plan.**

---

## The 10 Rules

### 1. VERIFY BEFORE ASSERTING
Never state a technology, model, or service is available/suitable without a **current** source (web search, official docs, changelogs). Training data is 6-18 months stale. Treat it as an unverified hypothesis, not fact.

### 2. CHECK DEPRECATION FIRST
Before recommending ANY service, API, or library: search `"[name] deprecated"`, `"[name] retired"`, `"[name] end of life"`. A recommendation of a dead service is a critical failure.

### 3. LICENSE AUDIT IS MANDATORY
State the **exact license** for every dependency (AGPL-3.0, Apache-2.0, MIT, etc.). Flag AGPL/GPL for commercial projects. Check if model weights have a different license than code. A wrong license recommendation can kill an architecture.

### 4. ALWAYS RESEARCH ALTERNATIVES
Never recommend the first option. For every major choice, compare **at least 3 alternatives** with benchmarks. The obvious choice is often wrong.

### 5. CITE YOUR SOURCES
Every factual claim needs a URL, paper, or doc reference. "I believe", "typically", "should work" are NOT evidence. Unsourced claims get LOW confidence.

### 6. CROSS-VALIDATE
Don't trust a single source. Check multiple independent sources. Disagreements are valuable — they surface uncertainty.

### 7. FLAG CONFIDENCE
Every recommendation must carry HIGH / MEDIUM / LOW confidence:
- **HIGH**: Multiple current sources agree, benchmarks verified
- **MEDIUM**: Some sources confirm, gaps exist, or sources 3-6 months old
- **LOW**: Single source, conflicting info, or based on training data

### 8. DATE YOUR FINDINGS
Include source dates. < 3 months = CURRENT. 3-6 months = RECENT. 6-12 months = AGING. > 12 months = STALE.

### 9. RESEARCH PRECEDES PLANNING
No plan should be created until research is done. Plans built on assumptions WILL fail.

### 10. CHALLENGE, DON'T CONFIRM
Find what's WRONG, not what's right. Assume the plan is wrong until proven right.

---

## Quick Reference: What Killed Janus

| What We Assumed | What Was True | Rule That Catches It |
|---|---|---|
| YOLO8n is best model | RF-DETR-Nano: +4-6 mAP, 43% faster, Apache 2.0 | Rule 4 (alternatives) |
| Azure Spatial Analysis works | RETIRED March 2025 | Rule 2 (deprecation) |
| AWS People Pathing works | DISCONTINUED Oct 2025 | Rule 2 (deprecation) |
| Ultralytics stack is fine | AGPL — incompatible with commercial use | Rule 3 (license) |
| Complex depth estimation needed | 4-point homography gets 15-30cm accuracy at zero cost | Rule 4 (simpler alternative) |
| Plan is solid, just execute | Every major assumption was wrong | Rule 10 (challenge) |
