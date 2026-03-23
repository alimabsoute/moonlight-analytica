#!/usr/bin/env python3
"""Tastyr IQ — Professional Strategy Binder PDF for Co-Founder Handoff"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether, ListFlowable, ListItem
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
import csv, os

# ── Brand Colors ──
NAVY = HexColor('#0A1A2F')
GOLD = HexColor('#D4A534')
BLUE = HexColor('#3A7CD5')
WHITE = HexColor('#FFFFFF')
LIGHT_BG = HexColor('#F5F5F5')
WARM_BG = HexColor('#FDF8F0')
DARK_TEXT = HexColor('#1A1A1A')
MED_TEXT = HexColor('#444444')
LIGHT_TEXT = HexColor('#888888')
RED_ACCENT = HexColor('#C0392B')
GREEN_ACCENT = HexColor('#27AE60')
ORANGE_ACCENT = HexColor('#E67E22')

BASE = os.path.dirname(os.path.abspath(__file__))

def load_crm():
    with open(os.path.join(BASE, "crm", "master-crm.csv"), "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def make_styles():
    ss = getSampleStyleSheet()
    return {
        'cover_title': ParagraphStyle('CoverTitle', fontSize=44, textColor=NAVY, alignment=TA_CENTER, fontName='Helvetica-Bold', leading=52),
        'cover_sub': ParagraphStyle('CoverSub', fontSize=20, textColor=GOLD, alignment=TA_CENTER, fontName='Helvetica-Bold', leading=26),
        'cover_detail': ParagraphStyle('CoverDetail', fontSize=12, textColor=MED_TEXT, alignment=TA_CENTER, leading=16),
        'cover_conf': ParagraphStyle('CoverConf', fontSize=10, textColor=LIGHT_TEXT, alignment=TA_CENTER, leading=14),
        'toc_title': ParagraphStyle('TOCTitle', fontSize=24, textColor=NAVY, fontName='Helvetica-Bold', spaceBefore=6, spaceAfter=16),
        'toc_item': ParagraphStyle('TOCItem', fontSize=11, textColor=DARK_TEXT, leading=20, leftIndent=12),
        'toc_sub': ParagraphStyle('TOCSub', fontSize=10, textColor=MED_TEXT, leading=18, leftIndent=36),
        'h1': ParagraphStyle('H1', fontSize=22, textColor=NAVY, fontName='Helvetica-Bold', spaceBefore=16, spaceAfter=10, leading=26),
        'h2': ParagraphStyle('H2', fontSize=16, textColor=BLUE, fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=6, leading=20),
        'h3': ParagraphStyle('H3', fontSize=12, textColor=NAVY, fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=4, leading=16),
        'body': ParagraphStyle('Body', fontSize=10, textColor=DARK_TEXT, leading=15, spaceAfter=6, alignment=TA_JUSTIFY),
        'body_bold': ParagraphStyle('BodyBold', fontSize=10, textColor=DARK_TEXT, leading=15, spaceAfter=6, fontName='Helvetica-Bold'),
        'bullet': ParagraphStyle('Bullet', fontSize=10, textColor=DARK_TEXT, leading=14, spaceAfter=3, leftIndent=18, bulletIndent=6),
        'small': ParagraphStyle('Small', fontSize=9, textColor=MED_TEXT, leading=12, spaceAfter=3),
        'quote': ParagraphStyle('Quote', fontSize=10, textColor=MED_TEXT, leading=14, leftIndent=24, rightIndent=24, fontName='Helvetica-Oblique', spaceAfter=8, spaceBefore=4),
        'section_num': ParagraphStyle('SectionNum', fontSize=10, textColor=GOLD, fontName='Helvetica-Bold'),
        'footer': ParagraphStyle('Footer', fontSize=8, textColor=LIGHT_TEXT, alignment=TA_CENTER),
        'callout': ParagraphStyle('Callout', fontSize=10, textColor=NAVY, leading=14, spaceAfter=6, leftIndent=12, borderPadding=6, fontName='Helvetica-Bold'),
    }

def gold_rule():
    return HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=8)

def thin_rule():
    return HRFlowable(width="100%", thickness=0.5, color=HexColor('#DDDDDD'), spaceAfter=6)

def navy_table(data, col_widths, font_size=9):
    t = Table(data, colWidths=col_widths)
    style = [
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), font_size),
        ('LEADING', (0, 0), (-1, -1), font_size + 4),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]
    t.setStyle(TableStyle(style))
    return t

def build_binder():
    contacts = load_crm()
    s = make_styles()
    total = len(contacts)
    seg_counts = {}
    for c in contacts:
        seg_counts[c["Segment"]] = seg_counts.get(c["Segment"], 0) + 1
    tier1 = [c for c in contacts if int(c["Rank"]) >= 70]
    tier2 = [c for c in contacts if 40 <= int(c["Rank"]) < 70]
    tier3 = [c for c in contacts if int(c["Rank"]) < 40]
    top20 = sorted(contacts, key=lambda r: int(r["Rank"]), reverse=True)[:20]

    elements = []

    # ════════════════════════════════════════════════════════════════
    # COVER PAGE
    # ════════════════════════════════════════════════════════════════
    elements.append(Spacer(1, 1.8*inch))
    elements.append(Paragraph("TASTYR IQ", s['cover_title']))
    elements.append(Spacer(1, 0.15*inch))
    elements.append(HRFlowable(width="40%", thickness=3, color=GOLD, spaceAfter=12))
    elements.append(Paragraph("Outreach Strategy Binder", s['cover_sub']))
    elements.append(Spacer(1, 0.4*inch))
    elements.append(Paragraph("AI-Powered Dish Intelligence", s['cover_detail']))
    elements.append(Paragraph("Tri-State Outreach &amp; Investment Strategy", s['cover_detail']))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(HRFlowable(width="25%", thickness=1, color=HexColor('#CCCCCC'), spaceAfter=12))
    elements.append(Paragraph(f"{total} Contacts  |  12 Segments  |  8 Chain Strategies", s['cover_detail']))
    elements.append(Paragraph("PA  +  NJ  +  DE  +  NYC Spillover", s['cover_detail']))
    elements.append(Spacer(1, 1.2*inch))
    elements.append(Paragraph("Prepared for Nik Amin (CEO) &amp; Ali Mabsoute (CMO)", s['cover_conf']))
    elements.append(Paragraph("March 2026  |  Confidential", s['cover_conf']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # TABLE OF CONTENTS
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("TABLE OF CONTENTS", s['toc_title']))
    elements.append(gold_rule())
    toc_items = [
        ("1", "Executive Summary"),
        ("2", "The Product — What We Built"),
        ("3", "Market Opportunity &amp; Competitive Landscape"),
        ("4", "The Seed Round"),
        ("5", "The Strategy — Three Pillars"),
        ("6", "The 12 Contact Segments"),
        ("7", "Social Chain Strategies (8 Chains)"),
        ("8", "FOMO Campaign Playbook"),
        ("9", "Psychology-Driven Outreach"),
        ("10", "Outreach Message Templates"),
        ("11", "Geographic Strategy — Tri-State"),
        ("12", "12-Week Action Plan"),
        ("13", "Pitch Notes &amp; Objection Handling"),
        ("14", "Critical Analysis — Blind Spots &amp; Hedging"),
        ("15", "Competitive Threats"),
        ("16", "Top 20 Priority Contacts"),
        ("17", "Success Metrics &amp; KPIs"),
        ("18", "CRM Overview &amp; Segment Summary"),
    ]
    for num, title in toc_items:
        elements.append(Paragraph(f"<b>Section {num}</b> &nbsp;&nbsp;&nbsp; {title}", s['toc_item']))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("<i>Appendix: Full contact list available in Contact Directory PDF and CRM workbook (XLSX)</i>", s['small']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 1: EXECUTIVE SUMMARY
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("1. EXECUTIVE SUMMARY", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph(
        "<b>Tastyr IQ</b> rates <b>dishes, not restaurants</b> — AI-powered intelligence across 9 food verticals. "
        "With 2,490+ dishes indexed, a patent-pending algorithm, and App Store approval, we are raising a "
        "seed round ($500K–$1.5M) with Philadelphia as our launch city.", s['body']))
    elements.append(Paragraph(
        "This binder is the complete strategic playbook for our outreach campaign. It covers the full "
        f"ecosystem of <b>{total} contacts</b> across <b>12 segments</b> in the tri-state area (PA, NJ, DE) "
        "plus NYC spillover, organized into <b>8 social chain strategies</b> and a comprehensive "
        "<b>FOMO campaign</b> designed to create organic market pull.", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    summary_data = [
        ['Metric', 'Value'],
        ['Total CRM Contacts', str(total)],
        ['Tier 1 (Rank 70-100)', f'{len(tier1)} contacts — contact this week/next'],
        ['Tier 2 (Rank 40-69)', f'{len(tier2)} contacts — contact within month 1'],
        ['Tier 3 (Rank 1-39)', f'{len(tier3)} contacts — long-game relationship building'],
        ['Contact Segments', '12 distinct categories'],
        ['Social Chain Strategies', '8 mapped influence chains'],
        ['Geographic Coverage', 'PA, NJ, DE + NYC spillover'],
        ['Ranking System', 'Composite 1-100 score (5 weighted factors)'],
    ]
    elements.append(navy_table(summary_data, [2*inch, 4.5*inch]))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 2: THE PRODUCT
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("2. THE PRODUCT — WHAT WE BUILT", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph("<b>The One-Liner:</b> \"Tastyr IQ rates dishes, not restaurants — AI-powered dish intelligence across 9 food verticals.\"", s['body']))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Traction", s['h2']))
    traction = [
        ['Metric', 'Current Status'],
        ['Dish Verticals', '9 live'],
        ['Indexed Dishes', '2,490+'],
        ['Codebase', '~93,000 lines'],
        ['Patent Status', 'Pending'],
        ['TestFlight Beta', 'Live'],
        ['App Store', 'Approved'],
        ['Team', '2 co-founders (Nik Amin, CEO + Ali Mabsoute, CMO)'],
    ]
    elements.append(navy_table(traction, [2*inch, 4.5*inch]))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("The Moats", s['h2']))
    moats = [
        "<b>Data Moat:</b> 2,490+ dishes indexed — first-mover at the dish level. No competitor has organized dish-level intelligence.",
        "<b>Patent Pending:</b> Proprietary scoring algorithm filed with the USPTO.",
        "<b>Network Effects:</b> More users generate better ratings, which attract more users.",
        "<b>Vertical Depth:</b> 9 verticals live — a new competitor would start at zero.",
        "<b>Launch City Strategy:</b> Deep Philadelphia penetration before national expansion.",
    ]
    for m in moats:
        elements.append(Paragraph(f"• {m}", s['bullet']))

    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Founder Profiles", s['h2']))
    elements.append(Paragraph("<b>Nik Amin — CEO (Bay Area)</b>: Product &amp; engineering leadership. Built the entire technical platform from scratch.", s['body']))
    elements.append(Paragraph("<b>Ali Mabsoute — CMO (Philadelphia)</b>: UPenn graduate. 15 years in Philadelphia. Hyatt, Citibank, American Express experience. Old City Labs. Deep Philly food scene connections. Marketing &amp; growth strategy.", s['body']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 3: MARKET OPPORTUNITY
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("3. MARKET OPPORTUNITY &amp; COMPETITIVE LANDSCAPE", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph("<b>The Problem:</b> The $371B US restaurant industry relies on restaurant-level ratings (Yelp, Google). "
        "Nobody rates the actual food. A 4-star restaurant can serve 2-star dishes. "
        "Consumers waste money, restaurants lack dish-level data.", s['body']))
    elements.append(Paragraph("<b>The Solution:</b> AI platform that scores individual dishes on a 0–100 scale, "
        "aggregating reviews, social mentions, critic ratings, and proprietary signals across 9 food verticals.", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    market = [
        ['Market', 'Size'],
        ['TAM (US Restaurant Industry)', '$371B'],
        ['SAM (Restaurant Technology)', '$23B'],
        ['SOM (Dish-Level Intelligence)', '$2.3B'],
    ]
    elements.append(navy_table(market, [3.2*inch, 3.2*inch]))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Competitive Landscape", s['h2']))
    comp = [
        ['Competitor', 'What They Do', 'Gap Tastyr Fills'],
        ['Yelp', 'Restaurant reviews', 'No dish-level intelligence'],
        ['Google Maps', 'Restaurant ratings', 'No dish scoring system'],
        ['The Infatuation', 'Editorial reviews', 'Not data-driven, not dish-level'],
        ['OpenTable / Resy', 'Reservations', 'No food rating system'],
        ['DoorDash / UberEats', 'Food delivery', 'Order data only, no public scoring'],
    ]
    elements.append(navy_table(comp, [1.5*inch, 2*inch, 3*inch]))
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("<b>Nobody rates the dish. That is the moat.</b>", s['callout']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 4: THE SEED ROUND
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("4. THE SEED ROUND", s['h1']))
    elements.append(gold_rule())
    round_data = [
        ['Detail', 'Value'],
        ['Target Raise', '$500K – $1.5M'],
        ['Round Type', 'Seed'],
        ['Target Valuation', '$3M – $6M pre-money'],
        ['Investor Mix', '5-8 investors (strategic + financial)'],
        ['Timeline', '12 weeks from first outreach'],
    ]
    elements.append(navy_table(round_data, [2.5*inch, 4*inch]))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Use of Funds", s['h2']))
    funds = [
        ['Category', 'Allocation', 'Purpose'],
        ['Engineering', '40%', 'Expand verticals, improve AI, cross-platform'],
        ['Growth Marketing', '25%', 'User acquisition, content, influencer partnerships'],
        ['Business Development', '20%', 'Restaurant partnerships, sales team'],
        ['Operations', '15%', 'Legal, patent prosecution, infrastructure'],
    ]
    elements.append(navy_table(funds, [1.8*inch, 1*inch, 3.7*inch]))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Revenue Model (Planned)", s['h2']))
    rev = [
        "<b>B2C:</b> Freemium app with Premium subscription ($4.99/mo) for advanced dish analytics",
        "<b>B2B:</b> Restaurant dashboard — dish performance analytics, menu optimization SaaS",
        "<b>Data Licensing:</b> Dish intelligence API for delivery platforms and CPG brands",
        "<b>Advertising:</b> Promoted dishes — restaurants pay to boost visibility",
    ]
    for r in rev:
        elements.append(Paragraph(f"• {r}", s['bullet']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 5: THREE PILLARS
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("5. THE STRATEGY — THREE PILLARS", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph(
        "We are not raising money through cold outreach. We are creating a <b>wave of social proof, "
        "market pull, and FOMO</b> that makes investors come to us.", s['body']))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Pillar 1: Social Proof Manufacturing", s['h2']))
    elements.append(Paragraph(
        "Before approaching any investor, the ecosystem must be buzzing. When an investor Googles "
        "\"Tastyr IQ\" before our meeting, they should find influencer posts, news articles, and "
        "restaurateurs talking about their dish rankings.", s['body']))
    for item in [
        "Seed beta access to 5-10 food influencers simultaneously",
        "Get 3-5 restaurateurs actively using/championing the platform",
        "Secure 1-2 media mentions (Eater Philly, Technical.ly)",
        "App Store presence as credibility stamp in all materials",
    ]:
        elements.append(Paragraph(f"• {item}", s['bullet']))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Pillar 2: Chain-of-Influence Outreach", s['h2']))
    elements.append(Paragraph(
        "Every person in our CRM is part of an influence chain. We don't contact investors in isolation — "
        "we build chains of warm introductions that make every meeting feel natural.", s['body']))
    chains_overview = [
        "Blogger → Restaurateur → Investor",
        "Student → Professor → Alumni Angel",
        "Founder → Accelerator → VC",
        "Media → Buzz → Investor sees market pull",
    ]
    for c in chains_overview:
        elements.append(Paragraph(f"• {c}", s['bullet']))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Pillar 3: Psychology-Driven Personalization", s['h2']))
    elements.append(Paragraph(
        "Every outreach message is engineered using Cialdini's influence principles, "
        "tailored to each contact's specific motivations.", s['body']))
    psych_table = [
        ['Principle', 'How We Apply It'],
        ['Authority', 'Lead with UPenn, patent pending, Hyatt/Citi/AmEx credentials'],
        ['Social Proof', '"Other Philly investors are already in conversations"'],
        ['Unity', '"Fellow Philadelphian building for our city\'s food scene"'],
        ['Scarcity', '"Limited beta / limited investor seats in this round"'],
        ['Reciprocity', 'Offer dish data/insights before asking for anything'],
        ['Commitment', 'Reference their stated goals — "You\'ve said you want to back X"'],
    ]
    elements.append(navy_table(psych_table, [1.3*inch, 5.2*inch]))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 6: THE 12 SEGMENTS
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("6. THE 12 CONTACT SEGMENTS", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph(
        f"Our CRM spans {total} contacts across 12 segments, organized into three tracks: "
        "Investor Track, Influence Track, and Connector Track.", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    seg_info = [
        ("INVESTOR TRACK", [
            ("Angel Investors", "Tri-state angel groups and individual angels", "1st", "Connector Express + FOMO"),
            ("Venture Capital", "PA/NJ/DE VCs + NYC spillover with food-tech interest", "1st", "FOMO Cascade + NJ Bridge"),
            ("Private Equity", "Tri-state PE with food/consumer verticals", "2nd", "Connector Express"),
            ("Accelerators", "Programs with food-tech or consumer-tech focus", "2nd", "Accelerator Fast-Track"),
        ]),
        ("INFLUENCE TRACK", [
            ("Restaurateurs", "Philly + NJ + DE chefs and restaurant operators", "2nd", "Restaurateur Gateway"),
            ("Food Bloggers", "Instagram, TikTok, YouTube food influencers", "3rd", "FOMO Cascade"),
            ("Media", "Food editors, tech journalists, podcast hosts", "3rd", "Media Momentum"),
            ("University", "Faculty, programs, student orgs at tri-state schools", "2nd", "University Pipeline"),
        ]),
        ("CONNECTOR TRACK", [
            ("Tech Founders", "Ecosystem builders, serial founders, community leaders", "2nd", "Connector Express"),
            ("Food Industry", "Distributors, POS companies, delivery platforms", "3rd", "Food Industry Backdoor"),
            ("NJ-DE-Suburb", "Geographic-specific contacts across the tri-state", "3rd", "NJ Bridge + Gateway"),
        ]),
    ]

    for track_name, segs in seg_info:
        elements.append(Paragraph(track_name, s['h3']))
        data = [['Segment', 'Count', 'Degree', 'Primary Chain']]
        for seg_name, desc, degree, chain in segs:
            count = str(seg_counts.get(seg_name.split()[0] if seg_name != "Tech Founders" else "Founder-Connector",
                        seg_counts.get(seg_name.replace(" ", "-"), seg_counts.get(seg_name, 0))))
            # Fix segment name matching
            for key in seg_counts:
                if seg_name.lower().startswith(key.lower()[:5]):
                    count = str(seg_counts[key])
                    break
            data.append([seg_name, count, degree, chain])
        elements.append(navy_table(data, [1.6*inch, 0.7*inch, 0.7*inch, 3.5*inch], 8))
        elements.append(Spacer(1, 0.1*inch))

    # Overall totals
    elements.append(Paragraph(f"<b>Total: {total} contacts</b> — Tier 1: {len(tier1)} | Tier 2: {len(tier2)} | Tier 3: {len(tier3)}", s['body_bold']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 7: SOCIAL CHAIN STRATEGIES
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("7. SOCIAL CHAIN STRATEGIES", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph(
        "Cold outreach converts at ~2%. Warm intros convert at ~40%. The difference is the chain. "
        "By the time Ali sits down with an investor, they have already heard about Tastyr IQ from "
        "2-3 trusted sources.", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    chains = [
        ("Chain A: The Restaurateur Gateway",
         "Use Philadelphia's food scene to create organic investor interest through restaurateur champions.",
         [("Food Blogger", "Gets exclusive beta, posts dish score content"),
          ("Restaurateur", "Sees coverage, gets curious about their scores"),
          ("Restaurateur", "Becomes champion/early adopter, joins founding cohort"),
          ("Restaurateur", "Tells investor friends at industry dinner"),
          ("Investor", "Hears from TRUSTED source, takes Ali's call")],
         "Week 1-6", "Marc Vetri, Michael Solomonov, Greg Vernick, Ellen Yin"),

        ("Chain B: The University Pipeline",
         "Build academic credibility, create a student beta tester army, access faculty investor networks.",
         [("Faculty Connection", "Guest lecture at Penn Food Innovation Lab / Wharton"),
          ("Student Beta Testers", "Hundreds of food-obsessed students sign up"),
          ("Usage Data Spike", "Campus buzz + quantifiable traction"),
          ("Faculty Intro", "Wharton entrepreneurship professors"),
          ("Alumni Angel Network", "Present at Penn alumni investor event")],
         "Week 1-10", "UPenn, Temple, Drexel, Princeton, Rutgers"),

        ("Chain C: The FOMO Cascade",
         "Create perception of unstoppable momentum through coordinated buzz across multiple channels.",
         [("Seed 5-10 Influencers", "Give exclusive beta access simultaneously"),
          ("Coordinated Posts", "'Everyone talking about this' perception in 48 hours"),
          ("Media Picks Up Trend", "Headlines create legitimacy"),
          ("Restaurateurs Scramble", "'How is my restaurant not on here?'"),
          ("Investors See Market Pull", "Ali pitches from position of strength")],
         "Week 2-4", "Top tri-state food influencers + Eater Philly + Technical.ly"),

        ("Chain D: The NJ-to-NYC Bridge",
         "Use NJ ecosystem as a bridge to access NYC venture capital.",
         [("Princeton Connection", "Demo at Princeton Entrepreneurship Council meetup"),
          ("NJ Angel Interest", "Princeton-area angels show food-tech interest"),
          ("NJ-NYC Co-Investment", "NJ angels co-invest with NYC-adjacent funds"),
          ("NYC VC Pitch", "Tri-state traction, not just 'a Philly app'")],
         "Week 3-10", "Collaborative Fund, Lerer Hippeau, S2G Ventures"),

        ("Chain E: The Accelerator Fast-Track",
         "Accelerator acceptance = instant credibility + investor access + mentorship.",
         [("Apply to 3-5", "Comcast LIFT Labs, Dreamit, Food-X, Big Idea Ventures"),
          ("Acceptance", "Press release + credibility stamp"),
          ("Demo Day", "Investor pipeline from accelerator network"),
          ("Alumni Network", "Ongoing intros and support")],
         "Week 1-12", "Comcast LIFT Labs, Dreamit, Food-X, Y Combinator"),

        ("Chain F: The Food Industry Backdoor",
         "Food industry reps talk to every restaurant. Use them as force multipliers.",
         [("Connect with POS/Distributors", "Toast, Square, Sysco regional reps"),
          ("Show Integration Potential", "They see value for their clients"),
          ("They Mention Tastyr", "Organic mentions to restaurant clients"),
          ("Organic Demand Signal", "Restaurants reach out to Ali"),
          ("Industry Partnership Story", "Validates market for investors")],
         "Week 1-6", "Toast, Sysco, US Foods, DoorDash regional"),

        ("Chain G: The Media Momentum Engine",
         "Stack press coverage so each story references previous coverage, building perceived momentum.",
         [("Eater Philly", "'AI rates Philly dishes' — food-native audience"),
          ("Technical.ly", "'Philly startup raises buzz' — tech angle"),
          ("PhillyMag", "'The app every foodie needs' — consumer angle"),
          ("Philadelphia Inquirer", "Deep-dive feature — authority piece"),
          ("National Pickup", "Forbes/TechCrunch see local momentum")],
         "Week 2-8", "Each story drops 5-7 days apart"),

        ("Chain H: The Connector Express",
         "Identify 5-10 super connectors who can generate multiple warm intros each.",
         [("Identify Ecosystem Builders", "PSL, 1Philadelphia, PACT leaders"),
          ("Build Relationship", "Coffee/demo — genuine connection"),
          ("Ask for 3-5 Specific Intros", "Not generic asks"),
          ("Intros Generate More Intros", "Each generates 2-3 more"),
          ("Exponential Growth", "Network grows in 4-6 weeks")],
         "Week 1-6", "Isabelle Kent, Danae Mobley, Gabriel Weinberg"),
    ]

    for title, goal, steps, timing, people in chains:
        elements.append(Paragraph(title, s['h2']))
        elements.append(Paragraph(f"<b>Goal:</b> {goal}", s['body']))
        elements.append(Paragraph(f"<b>Timing:</b> {timing} &nbsp;|&nbsp; <b>Key People:</b> {people}", s['small']))

        step_data = [['Step', 'Action', 'What Happens']]
        for i, (actor, action) in enumerate(steps, 1):
            step_data.append([str(i), actor, action])
        elements.append(navy_table(step_data, [0.5*inch, 1.8*inch, 4.2*inch], 8))
        elements.append(Spacer(1, 0.1*inch))

    # Chain timing overview
    elements.append(Paragraph("Chain Timing Overview", s['h2']))
    timing_data = [
        ['Weeks', 'Active Chains', 'Key Milestones'],
        ['1-2', 'A, B, C, E, F, H', 'Influencer seeding, faculty outreach, accelerator apps'],
        ['2-3', 'C executes, G begins', 'FOMO Cascade drops, first media pitch'],
        ['3-4', 'A + B producing, D starts', 'First restaurant champions, student testers, NJ outreach'],
        ['4-6', 'All chains active', 'Warm intros flowing, Tier 1 investor meetings'],
        ['6-8', 'H amplifies all chains', 'Multiple investor conversations, media stacking'],
        ['8-12', 'Close phase', 'Term sheet conversations, round closes'],
    ]
    elements.append(navy_table(timing_data, [0.8*inch, 2*inch, 3.7*inch], 8))

    # Chain health monitoring
    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Chain Health Monitoring", s['h2']))
    health_data = [
        ['Chain', 'Green Signal', 'Red Signal'],
        ['A: Restaurateur', '3+ restaurants engaged', '0 restaurants after 3 weeks'],
        ['B: University', 'Faculty partnership formed', 'No faculty response'],
        ['C: FOMO Cascade', '5+ influencer posts', '< 2 posts after 2 weeks'],
        ['D: NJ-NYC Bridge', 'NJ angel meeting scheduled', 'No NJ traction after 4 weeks'],
        ['E: Accelerator', 'Accepted to 1+ program', 'Rejected from all'],
        ['F: Food Industry', 'POS/distributor interested', 'No industry interest'],
        ['G: Media', '1+ article published', 'No media response'],
        ['H: Connector', '5+ warm intros received', '< 2 intros after 3 weeks'],
    ]
    elements.append(navy_table(health_data, [1.5*inch, 2.5*inch, 2.5*inch], 8))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 8: FOMO PLAYBOOK
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("8. FOMO CAMPAIGN PLAYBOOK", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph(
        "<b>FOMO is not a tactic — it is the operating system.</b> Every touchpoint, every message, "
        "every public action creates the perception that Tastyr IQ is inevitable.", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Scarcity Tactics", s['h2']))
    scarcity = [
        ("<b>Limited Beta Cohort:</b> \"Only 50 spots for Philly restaurateurs in our founding cohort\" — "
         "numbered waitlist, closing announcements, certificates for members."),
        ("<b>Founding Investor Title:</b> First 5 investors get advisory board seats, quarterly dinners, "
         "public recognition. Limited to first $250K committed."),
        ("<b>Launch City Exclusivity:</b> \"We analyzed 50 cities and chose Philadelphia.\" "
         "Other cities framed as 'coming next' — creates FOMO in those markets too."),
        ("<b>Round Structure:</b> \"We're only meeting with 10 investors this round.\" "
         "Create selection criteria: strategic value, not just capital."),
    ]
    for sc in scarcity:
        elements.append(Paragraph(f"• {sc}", s['bullet']))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Social Proof Manufacturing", s['h2']))
    proof = [
        "<b>Coordinated Influencer Drop:</b> 5-10 food influencers all post within 48-hour window.",
        "<b>\"As Seen In\" Press:</b> Build press mentions BEFORE approaching investors.",
        "<b>Restaurateur Case Studies:</b> Document every interaction as a proof point.",
        "<b>App Store Presence:</b> \"Already approved and live — download it right now.\"",
    ]
    for p in proof:
        elements.append(Paragraph(f"• {p}", s['bullet']))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("FOMO Messaging by Segment", s['h2']))
    fomo_table = [
        ['Segment', 'Primary FOMO Message'],
        ['Investors', '"Our round is filling — we\'re prioritizing local investors who understand Philly food"'],
        ['Restaurateurs', '"We\'ve indexed your competitors\' dishes — want to see how yours stack up?"'],
        ['Bloggers', '"You\'ll be one of the first 5 in Philly to use this — before it\'s public"'],
        ['Media', '"Exclusive first-look before public launch — embargo available"'],
        ['University', '"We\'re partnering with only 3 universities for our founding research program"'],
    ]
    elements.append(navy_table(fomo_table, [1.2*inch, 5.3*inch], 8))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Exclusivity Language Guide", s['h2']))
    lang_table = [
        ['Instead of...', 'Say...'],
        ['"Try our app"', '"You\'ve been selected for our invite-only beta"'],
        ['"Sign up"', '"Claim your spot in our founding cohort"'],
        ['"Download the app"', '"Your exclusive beta access is ready"'],
        ['"We\'d love your feedback"', '"We\'re only sharing this with 10 industry leaders"'],
        ['"Can we meet?"', '"We\'re meeting with a small group of selected investors"'],
    ]
    elements.append(navy_table(lang_table, [2.8*inch, 3.7*inch], 8))

    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Anti-Patterns — What NOT to Do", s['h2']))
    anti = [
        "Don't lie about traction — stretch the truth, but never fabricate",
        "Don't pressure too hard — FOMO should feel organic, not desperate",
        "Don't oversaturate — 3 quality influencer posts beat 30 low-quality ones",
        "Don't use the same message twice — every touch is unique and personalized",
        "Don't reveal the playbook — never say \"we're creating FOMO\"",
        "Don't rush the chains — each link must form before moving to the next",
    ]
    for a in anti:
        elements.append(Paragraph(f"• {a}", s['bullet']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 9: PSYCHOLOGY FRAMEWORK
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("9. PSYCHOLOGY-DRIVEN OUTREACH", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph(
        "Every contact in the CRM has three psychology columns filled with genuine analysis — "
        "not generic filler. Here is the framework.", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("\"Why Contact This Person\" — Deep Analysis", s['h2']))
    elements.append(Paragraph("Not just 'they invest in food.' Real reasoning based on:", s['body']))
    why_items = [
        "Career trajectory signals (just joined new fund = actively deploying)",
        "Public statements aligned with Tastyr's mission",
        "Portfolio gaps that Tastyr fills",
        "Personal food passion evidenced by social media or press",
        "Geographic pride / ecosystem builder identity",
    ]
    for w in why_items:
        elements.append(Paragraph(f"• {w}", s['bullet']))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("\"Emotional Trigger\" — The Human Motivation", s['h2']))
    elements.append(Paragraph("The thing that makes them respond as a PERSON, not a title:", s['body']))
    triggers = [
        "Philly pride — wanting to put Philly on the food-tech map",
        "Fear of missing the next Yelp/OpenTable disruption",
        "Desire to be seen as early/innovative",
        "Personal passion for dining (foodie identity)",
        "Competitive pressure (their peers are already looking at this)",
        "Legacy motivation (being part of 'the one that started in Philly')",
    ]
    for t in triggers:
        elements.append(Paragraph(f"• {t}", s['bullet']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 10: MESSAGE TEMPLATES
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("10. OUTREACH MESSAGE TEMPLATES", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph("Message Architecture", s['h2']))
    elements.append(Paragraph(
        "Every message follows this structure: personalized hook referencing their specific work → "
        "why Tastyr matters to THEM → traction proof → Ali's credibility → clear ask → "
        "FOMO element tailored to their trigger.", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    templates = [
        ("Angel Investors", "Direct pitch with metrics + demo request",
         "\"I noticed [your investment in X]. I'm Ali Mabsoute, CMO of Tastyr IQ — we rate dishes, not restaurants. 2,490+ dishes, patent pending, App Store live. We're raising a seed round and prioritizing local investors. 20 minutes for a demo?\""),
        ("Venture Capital", "Structured pitch with TAM/traction",
         "\"[Reference to portfolio company]. Tastyr IQ rates dishes — AI-powered intelligence across 9 food verticals. No one does this at dish level. Patent pending. 2,490+ dishes. Revenue model: consumer sub + restaurant SaaS + data licensing. 30 minutes to walk through?\""),
        ("Restaurateurs", "Value-first — share their dish scores",
         "\"Your [specific dish] — you won't believe the score. We've indexed 2,490+ dishes and I wanted to share your restaurant's data. No strings. Also inviting a small group into our Founding Cohort — only 50 spots.\""),
        ("Food Bloggers", "Exclusive access — first-to-know content",
         "\"Exclusive beta access before anyone else. Imagine showing your followers that [Restaurant]'s top-rated dish isn't what everyone assumes. You'd be one of the first 5 in Philadelphia. Interested?\""),
        ("Media", "Story pitch — trend angle",
         "\"AI is now rating Philly's individual dishes. 2,490+ dishes scored, patent pending, restaurateurs paying attention. Exclusive first-look before public launch. Happy to chat on or off record.\""),
        ("University", "Research partnership — data access",
         "\"Our dataset of 2,490+ dishes could be a goldmine for [research area]. Offering data access, student beta tester slots, and co-authorship on publications.\""),
        ("Connectors", "Peer advice — buy coffee, learn",
         "\"Could I buy you coffee and get 20 minutes? How you approached your first fundraise, who in your network I should talk to, any landmines to avoid. No pitch — just learning.\""),
        ("Food Industry", "Business value — partnership",
         "\"You talk to more restaurant owners than anyone. Tastyr gives restaurants dish-level analytics — menu optimization, competitive intelligence. Let's explore how this complements your business.\""),
    ]
    for seg, approach, example in templates:
        elements.append(Paragraph(f"<b>{seg}</b> — {approach}", s['h3']))
        elements.append(Paragraph(example, s['quote']))

    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("Follow-Up Sequence", s['h2']))
    followups = [
        ['Timing', 'Approach'],
        ['Day 3-5 (no response)', 'Float it back up + share new development'],
        ['Day 10-12 (no response)', '"Last note — don\'t want to be a pest. Will keep you posted on milestones."'],
        ['After positive response', 'Offer 2 specific times. 15-20 min. Bring demo.'],
        ['Investor interested but stalling', 'FOMO sequence: "Round is now X% committed. Wanted to give you priority."'],
    ]
    elements.append(navy_table(followups, [2*inch, 4.5*inch], 8))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 11: GEOGRAPHIC STRATEGY
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("11. GEOGRAPHIC STRATEGY — TRI-STATE", s['h1']))
    elements.append(gold_rule())

    geo_data = [
        ['Region', 'Role', 'Key Players'],
        ['Philadelphia (Primary)', 'Launch city. Ali\'s home base. Every chain starts here.',
         'Robin Hood Ventures, First Round, Dreamit, Vetri, Solomonov, PSL, 1PHL'],
        ['New Jersey (Secondary)', 'Princeton corridor = money + tech. South Jersey = food scene.',
         'Princeton Angel Group, NJ Angels, Rutgers Food Innovation Center, David Burke'],
        ['Delaware (Tertiary)', 'Smaller market but less competition for attention.',
         'Horn Entrepreneurship, Delaware Prosperity Partnership, Sam Calagione'],
        ['NYC Spillover', 'Don\'t "be" NYC — use tri-state traction to PULL NYC investors.',
         'Collaborative Fund, Lerer Hippeau, S2G Ventures, Food-X accelerator'],
    ]
    elements.append(navy_table(geo_data, [1.5*inch, 2.2*inch, 2.8*inch], 8))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph(
        "<b>Key Principle:</b> Position Philly as a STRATEGIC choice, not a default. "
        "\"We chose Philadelphia because it has the highest James Beard Award concentration "
        "per capita, food-obsessed culture, and lower CAC than NYC. "
        "It is the perfect proof-of-concept market before national expansion.\"", s['callout']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 12: 12-WEEK ACTION PLAN
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("12. 12-WEEK ACTION PLAN", s['h1']))
    elements.append(gold_rule())

    weeks = [
        ("Weeks 1-2: Foundation", [
            "Launch landing page + waitlist (this week)",
            "Get 50 beta users through personal network — measure engagement",
            "Seed 5-10 influencers with beta access",
            "Onboard 3-5 champion restaurateurs into founding cohort",
            "Submit accelerator apps (LIFT Labs, Dreamit, Food-X, Big Idea Ventures)",
            "Begin Tier 1 outreach (Rank 90-100 contacts)",
            "Secure first media contact (Eater Philly, Technical.ly)",
            "LinkedIn content strategy begins",
            "Set up analytics in app (Mixpanel/Amplitude)",
        ]),
        ("Weeks 3-4: Momentum", [
            "Coordinated influencer posts drop (48-hour window)",
            "Media coverage from at least 1 outlet",
            "University partnerships initiated (Penn, Temple, Drexel)",
            "Tier 2 outreach begins (Rank 70-89)",
            "NJ-to-NYC bridge chain activated",
            "First investor meetings scheduled",
            "Share media coverage in all investor emails",
            "Restaurateur case studies documented",
        ]),
        ("Weeks 5-8: Acceleration", [
            "Multiple media mentions creating 'everyone talking' perception",
            "Student beta tester cohort active at 2+ universities",
            "10+ investor meetings completed",
            "FOMO messaging shifts to 'round is filling'",
            "Connector Express chain amplifies all other chains",
            "Second wave of influencer content",
            "Follow-up with all Tier 1 contacts",
        ]),
        ("Weeks 9-12: Close", [
            "Term sheet(s) received and negotiated",
            "Strategic investors (food industry) brought in",
            "Round closed at $500K-$1.5M",
            "Press announcement: 'Tastyr IQ raises seed round'",
            "Prepare Series A roadmap",
        ]),
    ]

    for title, items in weeks:
        elements.append(Paragraph(title, s['h2']))
        for item in items:
            elements.append(Paragraph(f"• {item}", s['bullet']))
        elements.append(Spacer(1, 0.05*inch))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 13: PITCH NOTES
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("13. PITCH NOTES &amp; OBJECTION HANDLING", s['h1']))
    elements.append(gold_rule())

    objections = [
        ('"Isn\'t this just another Yelp?"',
         'Yelp rates restaurants. We rate dishes. Think Rotten Tomatoes for food — Rotten Tomatoes rates movies, not theaters.'),
        ('"How do you get dish-level data?"',
         'AI aggregation: menu data, review NLP extraction, social media mentions, critic reviews, and our proprietary scoring model. Patent pending.'),
        ('"What about data accuracy?"',
         'Our 9-vertical framework provides structured scoring. Each dish gets a composite score from multiple signals, reducing noise.'),
        ('"Why not just add this to Yelp/Google?"',
         'Retrofitting dish intelligence into a restaurant platform is like adding movie ratings to a theater finder. The UX, data model, and use case are fundamentally different.'),
        ('"Can\'t a big player just copy this?"',
         'First-mover data moat + patent pending. By the time someone copies, we\'ll have 50K+ dishes with historical scoring data they can\'t replicate.'),
        ('"How do you make money?"',
         'Three streams: consumer subscription ($4.99/mo), restaurant analytics SaaS, and data licensing to delivery/CPG. Restaurant analytics alone is a $2B+ market.'),
    ]
    for q, a in objections:
        elements.append(Paragraph(f"<b>Q: {q}</b>", s['body_bold']))
        elements.append(Paragraph(f"A: {a}", s['body']))
        elements.append(Spacer(1, 0.05*inch))

    elements.append(Spacer(1, 0.1*inch))
    elements.append(Paragraph("The Ask", s['h2']))
    elements.append(Paragraph(
        "\"We are raising $500K–$1.5M to take Tastyr IQ from 2,490 dishes in Philly to 50,000 dishes "
        "across 4 cities. We are prioritizing investors who understand the food industry and want to be "
        "part of the dish intelligence revolution.\"", s['quote']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 14: CRITICAL ANALYSIS
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("14. CRITICAL ANALYSIS — BLIND SPOTS &amp; HEDGING", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph(
        "A brutally honest assessment of our assumptions, flaws, and hedging strategies. "
        "The full analysis is in a separate PDF — this section highlights the most critical items.", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Top 5 Assumptions to Watch", s['h2']))
    assumptions = [
        ("<b>Dish-level differentiation matters to consumers.</b> Risk: Users may see this as 'Yelp but for dishes' "
         "rather than a fundamentally new category. Hedge: Validate with beta users. Find the 'aha moment.'"),
        ("<b>2,490 dishes is meaningful traction.</b> Risk: It's ~3% of one city. Investors may push back. "
         "Hedge: Reframe as '9 vertical AI models trained and validated.' Show growth trajectory."),
        ("<b>Patent pending = defensible moat.</b> Risk: Software patents are hard to defend and enforce. "
         "Hedge: Lead with data moat, restaurant relationships, and brand. Patent is supporting."),
        ("<b>Influencers will adopt for free.</b> Risk: Influencers expect $200-$2,000 per post in 2026. "
         "Hedge: Budget $2K-$5K for micro-influencer partnerships. Target nano-influencers (1K-10K)."),
        ("<b>'Not in a huge rush' is safe.</b> Risk: Google Maps has experimented with dish data. "
         "Yelp has 'Popular Dishes.' Every month is a month a competitor could launch. Hedge: Move faster on users."),
    ]
    for a in assumptions:
        elements.append(Paragraph(f"• {a}", s['bullet']))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Top 5 Fixes Needed", s['h2']))
    fixes = [
        "<b>Get user data:</b> 50-100 beta users with engagement metrics before major investor outreach.",
        "<b>Test revenue:</b> Offer 5 restaurants a free dashboard trial. Put a $4.99 toggle in the app.",
        "<b>Tag the CRM honestly:</b> Mark contacts as 'know personally' vs 'stranger.' Reprioritize.",
        "<b>Find a lead investor:</b> One $100-250K commitment sets the tone. Everyone else follows.",
        "<b>Run all 8 chains simultaneously:</b> Don't bet everything on FOMO Cascade. Diversify.",
    ]
    for f in fixes:
        elements.append(Paragraph(f"• {f}", s['bullet']))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 15: COMPETITIVE THREATS
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("15. COMPETITIVE THREATS", s['h1']))
    elements.append(gold_rule())

    threats = [
        ['Threat', 'Probability', 'Impact', 'Hedge'],
        ['Google Maps dish ratings', 'HIGH', 'Existential', 'Move fast on restaurant relationships and community'],
        ['Yelp "Top Dishes" feature', 'Medium', 'High', 'Position as modern, AI-native alternative'],
        ['DoorDash/UberEats dish analytics', 'Medium', 'High', 'They optimize for delivery; we optimize for consumer'],
        ['Well-funded startup clone', 'Low-Med', 'Medium', 'Speed + relationships + community = defensible'],
        ['Restaurant pushback on scores', 'Med-High', 'Medium', 'Only show positive scores initially'],
        ['Investor market downturn', 'Low-Med', 'High', 'Keep near-zero burn rate. Bootstrap path ready.'],
    ]
    elements.append(navy_table(threats, [2*inch, 1*inch, 0.9*inch, 2.6*inch], 8))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 16: TOP 20 PRIORITY CONTACTS
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("16. TOP 20 PRIORITY CONTACTS", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph("These are the highest-ranked contacts in the CRM. Contact this week.", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    for i, c in enumerate(top20):
        name = c.get('Name', '')
        title_role = c.get('Title/Role', '')[:60]
        org = c.get('Organization', '')[:50]
        seg = c.get('Segment', '')
        rank = c.get('Rank', '')
        chain = c.get('Chain Strategy', '')[:40]
        why = c.get('Why Contact This Person', '')[:200]
        psych = c.get('Psychological Angle', '')[:150]
        linkedin = c.get('LinkedIn', '')

        elements.append(Paragraph(
            f"<b>{i+1}. {name}</b>",
            ParagraphStyle('CN', fontSize=11, fontName='Helvetica-Bold', textColor=NAVY, spaceBefore=10)))
        elements.append(Paragraph(f"{title_role} at {org}", s['small']))
        elements.append(Paragraph(
            f"<b>Segment:</b> {seg} &nbsp;|&nbsp; <b>Rank:</b> {rank} &nbsp;|&nbsp; <b>Chain:</b> {chain}",
            s['small']))
        if linkedin:
            elements.append(Paragraph(f"<b>LinkedIn:</b> {linkedin}", s['small']))
        if why:
            elements.append(Paragraph(f"<b>Why:</b> {why}", s['small']))
        if psych:
            elements.append(Paragraph(f"<b>Psychology:</b> {psych}", s['small']))
        elements.append(thin_rule())

    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 17: KPIs
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("17. SUCCESS METRICS &amp; KPIs", s['h1']))
    elements.append(gold_rule())

    kpi_data = [
        ['Metric', 'Current', 'Post-Seed Target'],
        ['Indexed Dishes', '2,490+', '50,000+'],
        ['Dish Verticals', '9', '15+'],
        ['Active Users', 'Beta', '10,000+'],
        ['Restaurant Partners', '0', '100+'],
        ['Launch Cities', '1 (Philadelphia)', '4'],
        ['Codebase', '~93K lines', '—'],
        ['Patent', 'Pending', 'Filed'],
        ['Revenue', 'Pre-revenue', 'MRR $10K+'],
    ]
    elements.append(navy_table(kpi_data, [2*inch, 2.2*inch, 2.3*inch]))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Fundraising Success Definition", s['h2']))
    success = [
        "$500K+ raised at fair valuation ($3M-$6M pre-money)",
        "At least 2 strategic investors (food industry connections)",
        "At least 1 accelerator acceptance",
        "10+ media mentions across tri-state publications",
        "20+ restaurant champions actively using Tastyr IQ",
        "Clear path to Series A within 18 months",
    ]
    for su in success:
        elements.append(Paragraph(f"• {su}", s['bullet']))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("FOMO Health Dashboard", s['h2']))
    fomo_health = [
        ['Signal', 'Green', 'Yellow', 'Red'],
        ['Influencer posts', '5+ in first week', '2-4 posts', '0-1 posts'],
        ['Media response', '2+ interested outlets', '1 outlet', 'No responses'],
        ['Investor meetings', '3+ in first 2 weeks', '1-2 meetings', '0 meetings'],
        ['Restaurateur interest', '10+ want cohort', '5-9 interested', '< 5'],
        ['Inbound inquiries', '"How do I invest?"', 'Some interest', 'All outbound'],
        ['App downloads', '100+ in first month', '50-99', '< 50'],
    ]
    elements.append(navy_table(fomo_health, [1.5*inch, 1.7*inch, 1.5*inch, 1.8*inch], 8))
    elements.append(PageBreak())

    # ════════════════════════════════════════════════════════════════
    # SECTION 18: CRM OVERVIEW
    # ════════════════════════════════════════════════════════════════
    elements.append(Paragraph("18. CRM OVERVIEW &amp; SEGMENT SUMMARY", s['h1']))
    elements.append(gold_rule())
    elements.append(Paragraph(
        f"The full CRM contains <b>{total} contacts</b> across 12 segments. "
        "Each contact has 24 data columns including psychology analysis, custom messages, "
        "ranking scores, and chain strategy assignments.", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    elements.append(Paragraph("Contacts by Segment", s['h2']))
    seg_table = [['Segment', 'Count', '% of Total']]
    for seg in sorted(seg_counts.keys(), key=lambda x: seg_counts[x], reverse=True):
        pct = f"{seg_counts[seg]/total*100:.1f}%"
        seg_table.append([seg, str(seg_counts[seg]), pct])
    seg_table.append(['TOTAL', str(total), '100%'])
    elements.append(navy_table(seg_table, [2.5*inch, 1.2*inch, 1.2*inch]))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("CRM Column Structure (24 Columns)", s['h2']))
    col_groups = [
        ['Block', 'Columns'],
        ['Identity', 'Segment, Name, Title/Role, Organization, City/State'],
        ['Contact', 'Email, LinkedIn, Other Social, Phone'],
        ['Relevance', 'Investment Focus, Check Size, Notable Work, Food/Tastyr Connection'],
        ['Psychology', 'Why Contact, Psychological Angle, Emotional Trigger'],
        ['Strategy', 'Connection Degree, Warm Intro Path, Rank, Chain Strategy, Approach, Custom Message, Status, Notes'],
    ]
    elements.append(navy_table(col_groups, [1.2*inch, 5.3*inch], 8))
    elements.append(Spacer(1, 0.15*inch))

    elements.append(Paragraph("Ranking Formula", s['h2']))
    elements.append(Paragraph(
        "<b>RANK</b> = (Investor Potential × 0.30) + (Network Reach × 0.25) + "
        "(FOMO Multiplier × 0.20) + (Accessibility × 0.15) + (Timing × 0.10)", s['body']))
    rank_bands = [
        ['Band', 'Rank', 'Action'],
        ['Tier 1', '70-100', 'Contact THIS WEEK. High-probability, high-impact.'],
        ['Tier 2', '40-69', 'Contact within month 1. Good fits, some groundwork needed.'],
        ['Tier 3', '1-39', 'Long game. Track, engage on social, wait for right moment.'],
    ]
    elements.append(navy_table(rank_bands, [1*inch, 1*inch, 4.5*inch]))
    elements.append(Spacer(1, 0.3*inch))

    # FINAL PAGE
    elements.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=16))
    elements.append(Paragraph(
        "\"Every investor meeting should feel like a natural conversation, not a pitch — "
        "because by the time Ali sits down, the investor has already heard about Tastyr IQ "
        "from 2-3 trusted sources.\"", s['quote']))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("Tastyr IQ  |  Strategy Binder  |  March 2026  |  Confidential", s['cover_conf']))

    # ── Build PDF ──
    output = os.path.join(BASE, "strategy", "tastyr-iq-strategy-binder.pdf")
    doc = SimpleDocTemplate(output, pagesize=letter,
        topMargin=0.6*inch, bottomMargin=0.6*inch,
        leftMargin=0.7*inch, rightMargin=0.7*inch)
    doc.build(elements)
    print(f"Strategy Binder PDF saved: {output}")

if __name__ == "__main__":
    build_binder()
