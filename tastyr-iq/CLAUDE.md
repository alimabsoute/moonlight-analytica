# ForkFox

**This is NOT a web app.** It's a business development automation toolkit for a seed-stage fundraise ($500K-$1.5M). Python scripts that transform hand-researched contact lists into professional pitch decks, CRM databases, and financial models.

ForkFox (formerly Tastyr IQ) rates **dishes, not restaurants**. Patent pending scoring algorithm. TestFlight beta live.

## Build Commands

```bash
# CRM pipeline (research docs → ranked CSVs → Excel)
python build_crm.py              # → crm/master-crm.csv + tier CSVs
python build_crm_xlsx.py         # → crm/tastyr-iq-crm-workbook.xlsx

# Document generation
python build_strategy_binder.py  # → strategy/tastyr-iq-strategy-binder.pdf
python build_contact_directory.py # → strategy/tastyr-iq-contact-directory.pdf
python build_analysis_pdf.py     # → strategy/tastyr-iq-critical-analysis.pdf

# Pitch decks (4 variations)
python build_pptx.py             # → strategy/pitch-deck-v1-v4.pptx

# Financial models (3 scenarios)
python strategy/build_financial_models.py  # → strategy/fork-financial-model-v1-v3.xlsx

# One-pagers (3 variations)
python strategy/build_one_pagers.py        # → strategy/fork-one-pager-v1-v3.pdf
```

## Dependencies

```bash
pip install reportlab openpyxl python-pptx
```

## Project Structure

```
tastyr-iq/
├── docs/           # 11 hand-researched contact lists (research-*.md)
├── crm/            # Generated CSVs + Excel (master-crm.csv = 310 rows, 24 columns)
├── strategy/       # Generated PDFs, pitch decks, financial models, one-pagers
├── outreach/       # Message templates, chain strategies, FOMO playbook
├── landing-pages/  # 4 HTML landing page variations
└── build_*.py      # 7 Python generation scripts
```

## CRM Tiers

| Tier | Rank | Count | Action |
|------|------|-------|--------|
| Tier 1 | 70-100 | 149 | Contact this week |
| Tier 2 | 40-69 | 151 | Contact month 1 |
| Tier 3 | 1-39 | 12 | Long-game relationships |

## Brand Colors

Navy `#0A1A2F`, Gold `#D4A534`, Blue `#3A7CD5`

## Key Facts

- 11 contact segments (Angels, VCs, PE, Accelerators, Restaurateurs, Bloggers, Media, University, Connectors, Food Industry, NJ-DE-Suburbs)
- Ranking algorithm: weighted formula (investor potential 30%, network reach 25%, FOMO 20%, accessibility 15%, timing 10%) + local/food/LinkedIn boosts
- Cialdini psychology principles mapped per segment
- 7 influence chains (Connector Express, FOMO Cascade, Restaurateur Gateway, etc.)
- Geographic focus: Tri-state (PA/NJ/DE)
