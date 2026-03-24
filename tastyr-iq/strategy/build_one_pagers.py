#!/usr/bin/env python3
"""
build_one_pagers.py — Generate 3 variations of Fork investor one-pager PDFs.
Each is a single letter-size page designed for email attachments.
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)
from reportlab.pdfgen import canvas

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
W, H = letter  # 612 x 792


# ──────────────────────────────────────────────
# Variation 1 — The Metrics One-Pager
# ──────────────────────────────────────────────
def build_v1():
    path = os.path.join(OUT_DIR, "fork-one-pager-v1-metrics.pdf")
    c = canvas.Canvas(path, pagesize=letter)

    CHARCOAL = HexColor("#1F2937")
    GREEN = HexColor("#16A34A")
    LIGHT_GRAY = HexColor("#F3F4F6")
    MID_GRAY = HexColor("#6B7280")

    margin = 48
    col_w = W - 2 * margin
    y = H - margin

    # ── Logo + tagline ──
    c.setFont("Helvetica-Bold", 28)
    c.setFillColor(CHARCOAL)
    c.drawString(margin, y, "FORK")
    c.setFont("Helvetica", 9)
    c.setFillColor(MID_GRAY)
    c.drawString(margin + 88, y + 4, "Rate the dish. Not the restaurant.")
    y -= 6

    # thin green line
    c.setStrokeColor(GREEN)
    c.setLineWidth(2)
    c.line(margin, y, W - margin, y)
    y -= 28

    # ── 3 Metric blocks ──
    block_w = col_w / 3
    for i, (val, label) in enumerate([
        ("$371B", "U.S. Restaurant Market"),
        ("2,490+", "Dishes Scored by AI"),
        ("9", "Live Food Verticals"),
    ]):
        bx = margin + i * block_w
        # background rect
        c.setFillColor(LIGHT_GRAY)
        c.roundRect(bx + 4, y - 42, block_w - 8, 46, 4, fill=1, stroke=0)
        c.setFillColor(GREEN)
        c.setFont("Helvetica-Bold", 22)
        c.drawCentredString(bx + block_w / 2, y - 12, val)
        c.setFillColor(CHARCOAL)
        c.setFont("Helvetica", 8)
        c.drawCentredString(bx + block_w / 2, y - 30, label)
    y -= 58

    # ── Helper: section header ──
    def section(title, body_lines, bullet=False):
        nonlocal y
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(GREEN)
        c.drawString(margin, y, title.upper())
        y -= 14
        c.setFont("Helvetica", 8.5)
        c.setFillColor(CHARCOAL)
        for line in body_lines:
            prefix = "\u2022  " if bullet else ""
            c.drawString(margin + (8 if bullet else 0), y, prefix + line)
            y -= 12
        y -= 4

    # ── Problem ──
    section("The Problem", [
        "The $371B U.S. restaurant industry has zero dish-level data. Yelp and Google rate restaurants, not food.",
        "Consumers scroll through reviews hoping to find one mention of what they actually want to order.",
    ])

    # ── Solution ──
    section("The Solution", [
        "Fork scores individual dishes 0\u2013100 using patent-pending AI across 9 food verticals.",
        "One search. Best dish. No guessing.",
    ])

    # ── Business Model table ──
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(GREEN)
    c.drawString(margin, y, "BUSINESS MODEL")
    y -= 6
    rows = [
        ["B2C Subscriptions (40%)", "$4.99/mo \u2014 premium dish insights"],
        ["B2B Restaurant SaaS (35%)", "$500/mo \u2014 menu intelligence dashboard"],
        ["Data Licensing (15%)", "Aggregated dish trend data for CPG & delivery"],
        ["Promoted Dishes (10%)", "Pay-per-impression dish placement"],
    ]
    row_h = 14
    for row in rows:
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(CHARCOAL)
        c.drawString(margin + 4, y, row[0])
        c.setFont("Helvetica", 8)
        c.setFillColor(MID_GRAY)
        c.drawString(margin + 200, y, row[1])
        y -= row_h
    y -= 8

    # ── Traction ──
    section("Traction & Milestones", [
        "Patent pending on dish-scoring algorithm",
        "App Store approved \u2014 TestFlight beta live",
        "93,000+ lines of production code shipped",
        "2,490+ dishes indexed across 9 verticals",
        "Projections: $120K 2026 ARR \u2192 $1.2M 2027 \u2192 $18M 2029 (70%+ gross margin)",
    ], bullet=True)

    # ── Team ──
    section("Team", [
        "Nik Amin \u2014 CEO & CTO, Bay Area. Full-stack engineer; built entire platform solo.",
        "Ali Mabsoute \u2014 CMO, Philadelphia. UPenn grad, 15 yrs experience. Hyatt, Citi, American Express.",
    ], bullet=True)

    # ── The Ask ──
    c.setFillColor(LIGHT_GRAY)
    c.roundRect(margin, y - 38, col_w, 42, 4, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(GREEN)
    c.drawString(margin + 10, y - 8, "THE ASK")
    c.setFont("Helvetica", 9)
    c.setFillColor(CHARCOAL)
    c.drawString(margin + 80, y - 8, "Raising $500K\u2013$1.5M seed at $3M\u2013$6M pre-money valuation.")
    c.setFont("Helvetica", 8)
    c.setFillColor(MID_GRAY)
    c.drawString(margin + 80, y - 22, "3-month CAC payback  |  Category-defining opportunity  |  5 founding investor seats")
    y -= 52

    # ── Footer ──
    c.setStrokeColor(LIGHT_GRAY)
    c.setLineWidth(0.5)
    c.line(margin, y + 6, W - margin, y + 6)
    c.setFont("Helvetica", 8)
    c.setFillColor(MID_GRAY)
    c.drawString(margin, y - 6, "nik@tastyiq.com  |  forkai.com")
    c.drawRightString(W - margin, y - 6, "Confidential \u2014 Fork, Inc. 2026")

    c.save()
    return path


# ──────────────────────────────────────────────
# Variation 2 — The Story One-Pager
# ──────────────────────────────────────────────
def build_v2():
    path = os.path.join(OUT_DIR, "fork-one-pager-v2-story.pdf")
    c = canvas.Canvas(path, pagesize=letter)

    NAVY = HexColor("#0A1A2F")
    GOLD = HexColor("#D4A534")
    SOFT_WHITE = HexColor("#E8E4DC")
    DIM = HexColor("#8899AA")

    # full-page navy background
    c.setFillColor(NAVY)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    margin = 48
    col_w = W - 2 * margin
    y = H - margin

    # ── Logo ──
    c.setFont("Helvetica-Bold", 30)
    c.setFillColor(white)
    c.drawString(margin, y, "FORK")
    # gold accent line under logo
    c.setStrokeColor(GOLD)
    c.setLineWidth(2.5)
    c.line(margin, y - 6, margin + 80, y - 6)
    y -= 32

    # ── Opening hook ──
    c.setFont("Helvetica-Bold", 15)
    c.setFillColor(GOLD)
    # wrap long line manually
    c.drawString(margin, y, "A $371B industry built on the wrong data model.")
    y -= 26

    # ── Helper for paragraphs ──
    def story_para(title, lines):
        nonlocal y
        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(GOLD)
        c.drawString(margin, y, title)
        y -= 15
        c.setFont("Helvetica", 9)
        c.setFillColor(SOFT_WHITE)
        for line in lines:
            c.drawString(margin, y, line)
            y -= 13
        y -= 6

    story_para("The Problem", [
        "Every year, Americans spend $371 billion eating out. They rely on Yelp stars and Google",
        "ratings to choose where \u2014 but nobody tells them what to order. Restaurant reviews rate the",
        "experience, not the food. Diners scroll through hundreds of comments hoping someone",
        "mentioned the one dish they\u2019re craving. It\u2019s broken.",
    ])

    story_para("The Solution", [
        "Fork scores individual dishes 0\u2013100 using patent-pending AI. Not the restaurant. The dish.",
        "Nine food verticals. 2,490+ dishes already indexed. One search gives you the best plate",
        "at any restaurant \u2014 backed by data, not opinions. This is dish-level intelligence.",
    ])

    story_para("Why Now", [
        "Restaurant tech is growing at 12.5% CAGR. Consumer expectations have shifted: people",
        "want personalization and precision, not star ratings. No one owns dish-level data at scale.",
        "Fork is building the category before anyone else can.",
    ])

    # ── Metrics highlight row ──
    c.setFillColor(HexColor("#0F2440"))
    c.roundRect(margin, y - 40, col_w, 44, 5, fill=1, stroke=0)
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.roundRect(margin, y - 40, col_w, 44, 5, fill=0, stroke=1)

    metrics = [
        ("2,490+", "Dishes Scored"),
        ("9", "Verticals Live"),
        ("93K", "Lines of Code"),
        ("$18M", "2029 ARR Target"),
    ]
    seg = col_w / len(metrics)
    for i, (val, label) in enumerate(metrics):
        cx = margin + seg * i + seg / 2
        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(GOLD)
        c.drawCentredString(cx, y - 14, val)
        c.setFont("Helvetica", 7.5)
        c.setFillColor(DIM)
        c.drawCentredString(cx, y - 28, label)
    y -= 56

    # ── Team ──
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(GOLD)
    c.drawString(margin, y, "THE TEAM")
    y -= 15
    c.setFont("Helvetica", 8.5)
    c.setFillColor(SOFT_WHITE)
    c.drawString(margin, y, "Nik Amin \u2014 CEO & CTO. Bay Area. Full-stack engineer who built the entire platform solo.")
    y -= 13
    c.drawString(margin, y, "Ali Mabsoute \u2014 CMO. UPenn graduate. 15 years in Philadelphia. Hyatt, Citi, American Express alumni.")
    y -= 20

    # ── The Opportunity ──
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(GOLD)
    c.drawString(margin, y, "THE OPPORTUNITY")
    y -= 15
    c.setFont("Helvetica", 9)
    c.setFillColor(SOFT_WHITE)
    for line in [
        "Fork isn\u2019t improving restaurant reviews. It\u2019s creating a new data layer that doesn\u2019t",
        "exist yet: dish intelligence. TAM $371B \u2192 SAM $23B \u2192 SOM $2.3B. Patent pending.",
        "70%+ gross margins. 3-month CAC payback. This is a category-creation moment.",
    ]:
        c.drawString(margin, y, line)
        y -= 13
    y -= 8

    # ── CTA block ──
    c.setFillColor(GOLD)
    c.roundRect(margin, y - 44, col_w, 48, 5, fill=1, stroke=0)
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(NAVY)
    c.drawCentredString(W / 2, y - 14, "Raising $500K\u2013$1.5M Seed  |  $3M\u2013$6M Pre-Money")
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(W / 2, y - 30, "5 Founding Investor seats remain.  Let\u2019s talk.")
    y -= 58

    # ── Footer ──
    c.setFont("Helvetica", 8)
    c.setFillColor(DIM)
    c.drawString(margin, y, "nik@tastyiq.com  |  forkai.com")
    c.drawRightString(W - margin, y, "Confidential \u2014 Fork, Inc. 2026")

    c.save()
    return path


# ──────────────────────────────────────────────
# Variation 3 — The Visual One-Pager
# ──────────────────────────────────────────────
def build_v3():
    path = os.path.join(OUT_DIR, "fork-one-pager-v3-visual.pdf")
    c = canvas.Canvas(path, pagesize=letter)

    BG = HexColor("#F7F9FC")
    CHARCOAL = HexColor("#1F2937")
    ORANGE = HexColor("#F97316")
    GREEN = HexColor("#16A34A")
    MID_GRAY = HexColor("#6B7280")
    LIGHT_BORDER = HexColor("#E2E8F0")
    CARD_BG = HexColor("#FFFFFF")

    # full-page background
    c.setFillColor(BG)
    c.rect(0, 0, W, H, fill=1, stroke=0)

    margin = 44
    col_w = W - 2 * margin
    y = H - margin

    # ── Logo ──
    c.setFont("Helvetica-Bold", 26)
    c.setFillColor(CHARCOAL)
    c.drawString(margin, y, "FORK")
    c.setFont("Helvetica", 9)
    c.setFillColor(ORANGE)
    c.drawString(margin + 78, y + 3, "AI Dish Intelligence Platform")
    c.setFont("Helvetica", 8)
    c.setFillColor(MID_GRAY)
    c.drawRightString(W - margin, y + 3, "Rate the dish. Not the restaurant.")

    y -= 6
    c.setStrokeColor(ORANGE)
    c.setLineWidth(1.5)
    c.line(margin, y, W - margin, y)
    y -= 16

    # ── Two-column layout ──
    left_x = margin
    left_w = col_w * 0.58
    right_x = margin + col_w * 0.62
    right_w = col_w * 0.38
    col_y = y  # save starting y for right col

    # ======= LEFT COLUMN =======
    def left_section(title, lines, bullet=False):
        nonlocal y
        c.setFont("Helvetica-Bold", 9.5)
        c.setFillColor(ORANGE)
        c.drawString(left_x, y, title.upper())
        y -= 13
        c.setFont("Helvetica", 8.2)
        c.setFillColor(CHARCOAL)
        for line in lines:
            prefix = "\u2022  " if bullet else ""
            c.drawString(left_x + (8 if bullet else 0), y, prefix + line)
            y -= 11
        y -= 5

    left_section("Problem", [
        "$371B U.S. restaurant industry with zero dish-level data.",
        "Yelp & Google rate restaurants, not food. Consumers guess.",
    ])

    left_section("Solution", [
        "Fork scores individual dishes 0\u2013100 using patent-pending AI.",
        "9 food verticals. 2,490+ dishes indexed. One search = best plate.",
    ])

    # ── How It Works: 3-step flow ──
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(ORANGE)
    c.drawString(left_x, y, "HOW IT WORKS")
    y -= 8

    steps = [
        ("1", "SEARCH", "Find any dish or cuisine type"),
        ("2", "SCORE", "AI rates dishes 0\u2013100 across quality signals"),
        ("3", "EAT", "Go to the best plate near you"),
    ]
    step_w = left_w / 3
    for i, (num, title, desc) in enumerate(steps):
        sx = left_x + i * step_w
        # circle
        cx = sx + step_w / 2
        cy = y - 12
        c.setFillColor(ORANGE)
        c.circle(cx, cy, 10, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 11)
        c.setFillColor(white)
        c.drawCentredString(cx, cy - 4, num)
        # label
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(CHARCOAL)
        c.drawCentredString(cx, cy - 18, title)
        c.setFont("Helvetica", 6.5)
        c.setFillColor(MID_GRAY)
        c.drawCentredString(cx, cy - 28, desc)

        # arrow between steps
        if i < 2:
            ax = sx + step_w - 4
            c.setStrokeColor(ORANGE)
            c.setLineWidth(1.2)
            c.line(ax, cy, ax + 8, cy)
            # arrowhead
            c.line(ax + 8, cy, ax + 5, cy + 3)
            c.line(ax + 8, cy, ax + 5, cy - 3)

    y -= 52

    # ── Revenue Model ──
    left_section("Revenue Model", [
        "B2C Subscriptions (40%) \u2014 $4.99/mo premium dish insights",
        "B2B Restaurant SaaS (35%) \u2014 $500/mo menu intelligence",
        "Data Licensing (15%) \u2014 dish trend data for CPG & delivery",
        "Promoted Dishes (10%) \u2014 pay-per-impression placement",
    ], bullet=True)

    # ── Projections ──
    left_section("Revenue Projections", [
        "$120K 2026 ARR  \u2192  $1.2M 2027  \u2192  $18M 2029",
        "70%+ gross margins  |  3-month CAC payback",
    ])

    # ======= RIGHT COLUMN =======
    ry = col_y

    # ── Market Size (text-based chart) ──
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(ORANGE)
    c.drawString(right_x, ry, "MARKET SIZE")
    ry -= 10

    # TAM/SAM/SOM bars
    bar_max_w = right_w - 10
    markets = [
        ("TAM", "$371B", 1.0, HexColor("#FED7AA")),
        ("SAM", "$23B", 0.45, HexColor("#FDBA74")),
        ("SOM", "$2.3B", 0.22, ORANGE),
    ]
    for label, val, pct, color in markets:
        bw = bar_max_w * pct
        c.setFillColor(color)
        c.roundRect(right_x, ry - 16, bw, 18, 3, fill=1, stroke=0)
        c.setFont("Helvetica-Bold", 7.5)
        c.setFillColor(CHARCOAL)
        c.drawString(right_x + 4, ry - 11, f"{label}  {val}")
        ry -= 22
    c.setFont("Helvetica", 7)
    c.setFillColor(MID_GRAY)
    c.drawString(right_x, ry, "Restaurant tech CAGR: 12.5%")
    ry -= 18

    # ── Traction metrics ──
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(ORANGE)
    c.drawString(right_x, ry, "TRACTION")
    ry -= 6

    traction = [
        ("\u2713", "Patent pending", GREEN),
        ("\u2713", "App Store approved", GREEN),
        ("\u2713", "TestFlight beta live", GREEN),
        ("\u2713", "93K lines of code", GREEN),
        ("\u2713", "2,490+ dishes indexed", GREEN),
        ("\u2713", "9 verticals operational", GREEN),
    ]
    for check, text, color in traction:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(color)
        c.drawString(right_x + 2, ry, check)
        c.setFont("Helvetica", 8)
        c.setFillColor(CHARCOAL)
        c.drawString(right_x + 16, ry, text)
        ry -= 13
    ry -= 6

    # ── Revenue Split (text pie chart) ──
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(ORANGE)
    c.drawString(right_x, ry, "REVENUE SPLIT")
    ry -= 6
    splits = [
        ("\u25A0", "40% B2C Subs", ORANGE),
        ("\u25A0", "35% B2B SaaS", HexColor("#3B82F6")),
        ("\u25A0", "15% Data Licensing", HexColor("#8B5CF6")),
        ("\u25A0", "10% Promoted", HexColor("#EC4899")),
    ]
    for icon, text, color in splits:
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(color)
        c.drawString(right_x + 2, ry, icon)
        c.setFont("Helvetica", 8)
        c.setFillColor(CHARCOAL)
        c.drawString(right_x + 16, ry, text)
        ry -= 13

    # ======= BOTTOM ROW (full width) =======
    bot_y = min(y, ry) - 8

    # divider
    c.setStrokeColor(LIGHT_BORDER)
    c.setLineWidth(0.8)
    c.line(margin, bot_y + 4, W - margin, bot_y + 4)

    # Team | The Ask | Contact in 3 columns
    third = col_w / 3

    # Team
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(ORANGE)
    c.drawString(margin, bot_y - 8, "TEAM")
    c.setFont("Helvetica", 7.5)
    c.setFillColor(CHARCOAL)
    c.drawString(margin, bot_y - 20, "Nik Amin \u2014 CEO/CTO, Bay Area")
    c.drawString(margin, bot_y - 31, "Full-stack eng, built entire platform")
    c.drawString(margin, bot_y - 42, "Ali Mabsoute \u2014 CMO, Philadelphia")
    c.drawString(margin, bot_y - 53, "UPenn, Hyatt/Citi/AmEx alumni")

    # The Ask
    ask_x = margin + third + 10
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(ORANGE)
    c.drawString(ask_x, bot_y - 8, "THE ASK")
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(CHARCOAL)
    c.drawString(ask_x, bot_y - 20, "$500K\u2013$1.5M Seed")
    c.setFont("Helvetica", 7.5)
    c.drawString(ask_x, bot_y - 31, "$3M\u2013$6M pre-money valuation")
    c.drawString(ask_x, bot_y - 42, "5 founding investor seats")
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 7.5)
    c.drawString(ask_x, bot_y - 53, "Category-creation opportunity")

    # Contact
    con_x = margin + 2 * third + 20
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(ORANGE)
    c.drawString(con_x, bot_y - 8, "CONTACT")
    c.setFont("Helvetica", 7.5)
    c.setFillColor(CHARCOAL)
    c.drawString(con_x, bot_y - 20, "nik@tastyiq.com")
    c.drawString(con_x, bot_y - 31, "forkai.com")
    c.setFont("Helvetica", 7)
    c.setFillColor(MID_GRAY)
    c.drawString(con_x, bot_y - 53, "Confidential \u2014 Fork, Inc. 2026")

    c.save()
    return path


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────
if __name__ == "__main__":
    paths = [build_v1(), build_v2(), build_v3()]
    print("\nGenerated Fork one-pager PDFs:")
    for p in paths:
        size_kb = os.path.getsize(p) / 1024
        print(f"  {os.path.basename(p):45s}  {size_kb:6.1f} KB")
    print("\nDone.")
