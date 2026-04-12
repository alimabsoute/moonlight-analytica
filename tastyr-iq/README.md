# ForkFox

AI-powered dish intelligence — rates **dishes, not restaurants**. Patent pending.

## Co-Founders
- **Nik Amin** — CEO (Bay Area)
- **Ali Mabsoute** — CMO (Philadelphia) | UPenn | Hyatt/Citi/AmEx

## Traction
- 9 live dish verticals, 2,490+ indexed entries
- ~93,000 lines of code
- Patent pending scoring algorithm
- TestFlight beta live, App Store approved
- Landing page live at [forkfox.ai](https://forkfox.ai)

## Repo Structure

```
tastyr-iq/
├── landing-pages/       # Website — forkfox.ai (deployed via Vercel)
│   └── forkfox-deploy/  # Production deploy directory
├── docs/
│   ├── LINKS.md          # Index of ALL external resources (Google Docs, Figma, etc.)
│   └── research-*.md     # 11 hand-researched contact lists by segment
├── crm/                  # CRM data (master + tiered CSVs + Excel)
├── strategy/             # Pitch decks, financial models, one-pagers, analysis
├── outreach/             # Message templates, chain strategies, FOMO playbook
├── build_*.py            # 7 Python scripts to generate strategy docs
├── INVESTOR-STRATEGY.md  # Consolidated investment strategy
├── PITCH-DECK-NOTES.md   # Talking points and moats
└── PHILLY-ECOSYSTEM.md   # Tri-state ecosystem map
```

## Quick Start

### Landing Page
```bash
cd landing-pages && vercel --prod --yes   # Deploy to forkfox.ai
```

### Generate Strategy Docs
```bash
pip install reportlab openpyxl python-pptx

python build_crm.py                          # CRM → ranked CSVs
python build_crm_xlsx.py                     # CRM → Excel workbook
python build_pptx.py                         # 4 pitch deck variations
python strategy/build_financial_models.py    # 3 financial model scenarios
python strategy/build_one_pagers.py          # 3 one-pager variations
```

## External Resources

See **[docs/LINKS.md](docs/LINKS.md)** for links to Google Docs, Figma, project management, and all other resources that live outside this repo.

## Brand

| Element | Value |
|---------|-------|
| Navy | `#0A1A2F` |
| Gold | `#D4A534` |
| Blue | `#3A7CD5` |

---

*Seed round target: $500K–$1.5M | Tri-state focus (PA/NJ/DE)*
