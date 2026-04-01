# Plan Validation (RV) System — Research-First Pipeline

**Created**: 2026-04-01
**Origin**: Post-mortem analysis of Janus Demo planning failure
**Version**: 2.0 — Consolidated from 10 agents down to 3

---

## Why This Exists: The Janus Post-Mortem

The Janus project had a 25-gate, 5-sprint plan created by sophisticated agents. It looked thorough — architecture diagrams, database migrations, API contracts, implementation order. **It was completely wrong.**

Deep research (March 28, 2026) revealed every major assumption was invalid:

| Assumption in Plan | Reality | Impact |
|---|---|---|
| YOLO8n is the right model | RF-DETR-Nano: +4-6 mAP, 43% faster, Apache 2.0 | Plan-breaking |
| Azure Spatial Analysis works | **RETIRED** March 2025 | Plan-breaking |
| AWS People Pathing works | **DISCONTINUED** Oct 2025 | Plan-breaking |
| Ultralytics stack is fine | **AGPL** — incompatible with commercial | Plan-breaking |
| Complex depth estimation needed | 4-point homography: 15-30cm accuracy, zero compute | Scope-breaking |

### 8 Root Cause Failure Modes

1. **Training data trusted as fact** — No verification against live sources
2. **No deprecation checks** — Dead services assumed alive
3. **License analysis skipped** — AGPL dependency not flagged
4. **No alternatives surveyed** — First option assumed best
5. **Single-source validation** — No cross-checking
6. **Plan-first, research-later** — Architecture before verification
7. **No existence checks** — Cloud APIs assumed available
8. **Scope lock-in** — No mechanism to challenge the plan

### The Janus Rules

10 research integrity rules derived from these failures. Stored in `janus-rules.md`. Required reading for all RV agents.

---

## System Architecture (v2 — Lean)

```
TRIGGER: Plan needs validation before execution
    │
    ├── STEP 1: rv-researcher
    │   Researches 5 domains (models, infra, deps, arch, ecosystem)
    │   Produces: .rv/RESEARCH-REPORT.md
    │
    ├── STEP 2: rv-validator
    │   Extracts assumptions, spot-checks deps, maps cascades
    │   Produces: .rv/VALIDATION-REPORT.md
    │
    └── STEP 3: rv-verdict
        Reads everything, delivers PROCEED / REVISE / REBUILD
        Produces: .rv/PLAN-VERDICT.md
```

### 3 Agents (down from 10)

| Agent | Role | Tools | Time |
|---|---|---|---|
| `rv-researcher` | Researches all 5 technical domains against the plan | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch | 10-60 min |
| `rv-validator` | Audits assumptions + spot-checks deps + assesses risk | Read, Write, Bash, Grep, Glob, WebSearch, WebFetch | 15-30 min |
| `rv-verdict` | Final PROCEED/REVISE/REBUILD decision | Read, Write, Bash, Grep, Glob | 5-10 min |

### 3 Modes

| Mode | Agents | Time | Cost | When |
|---|---|---|---|---|
| **QUICK** | rv-researcher (quick mode only) | 5-10 min | ~$0.50 | Sanity check on minor plan changes |
| **STANDARD** | rv-researcher → rv-validator → rv-verdict | 30-60 min | ~$1-2 | Normal plan validation |
| **DEEP** | rv-researcher (deep mode) → rv-validator → rv-verdict | 1-2 hrs | ~$2-4 | High-stakes plans, expensive projects |

---

## How to Run

### Quick Mode (researcher only)
```
Spawn rv-researcher with prompt:
"QUICK mode. Plan: [path to plan]. Focus on deprecation checks and license audit only."
```
Read `.rv/RESEARCH-REPORT.md` for findings. No validator or verdict needed.

### Standard Mode (full pipeline)
```
Step 1: Spawn rv-researcher
  "STANDARD mode. Plan: [path to plan]."
  Wait for .rv/RESEARCH-REPORT.md

Step 2: Spawn rv-validator
  "Validate plan [path] against .rv/RESEARCH-REPORT.md"
  Wait for .rv/VALIDATION-REPORT.md

Step 3: Spawn rv-verdict
  "Deliver verdict on plan [path]. Reports in .rv/"
  Read .rv/PLAN-VERDICT.md
```

### Deep Mode
Same as Standard but researcher prompt says `"DEEP mode"`.

---

## Output Structure

```
.rv/
├── RESEARCH-REPORT.md     (Step 1 — researcher)
├── VALIDATION-REPORT.md   (Step 2 — validator)
└── PLAN-VERDICT.md        (Step 3 — verdict)
```

Each run overwrites previous reports. To keep history, rename the `.rv/` directory before re-running (e.g., `.rv-2026-04-01-janus/`).

---

## Integration with GSD

| GSD Phase | RV Integration |
|---|---|
| Before `/gsd:plan-phase` | Run STANDARD mode on phase goal + any draft plans |
| Before `/gsd:execute-phase` | Run QUICK mode to check plan hasn't gone stale |
| After plan revision | Run STANDARD mode on revised plan |
| Major technology decisions | Run DEEP mode |

The Janus Rules (`janus-rules.md`) can also be injected into GSD agent prompts to improve their research quality without running the full RV pipeline.

---

## Design Decisions (v2)

### Why 3 agents, not 10
- **Context**: Each agent carries its own instructions + all prior outputs. 10 agents = context explosion by Layer 3.
- **Orchestration**: 3 sequential steps need no orchestrator script. Just spawn them in order.
- **Cost**: ~$1-2 vs ~$3-5 per run. 3x cheaper for the same coverage.
- **Usability**: 30-60 min vs 3-4 hours. Actually gets used.

### Why not enhance GSD instead
- GSD agents have their own purpose (plan phases, execute, verify). RV validates the research foundation those plans are built on.
- The Janus Rules ARE shareable — inject them into GSD prompts when appropriate.
- RV is pre-planning validation. GSD is planning and execution. Different lifecycle stages.

### What v1 got wrong
- 10 agents was overengineered (ironic given the architecture agent was supposed to catch that)
- No orchestrator meant the pipeline was theoretical, not executable
- Context window math wasn't done — would have hit limits at Layer 3
- The system violated its own Janus Rule #10 by not being challenged before shipping
