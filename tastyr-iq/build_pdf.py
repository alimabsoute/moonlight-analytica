#!/usr/bin/env python3
"""Tastyr IQ — Strategy PDF Builder using ReportLab"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import csv, os


NAVY = HexColor('#0A1A2F')
GOLD = HexColor('#D4A534')
BLUE = HexColor('#3A7CD5')
WHITE = HexColor('#FFFFFF')
LIGHT_BG = HexColor('#F5F5F5')


def _make_styles():
    styles = getSampleStyleSheet()
    return {
        'title': ParagraphStyle('Title', parent=styles['Title'], fontSize=28, textColor=NAVY, spaceAfter=6, alignment=TA_CENTER, fontName='Helvetica-Bold'),
        'h1': ParagraphStyle('H1', parent=styles['Heading1'], fontSize=20, textColor=NAVY, spaceBefore=18, spaceAfter=8, fontName='Helvetica-Bold'),
        'h2': ParagraphStyle('H2', parent=styles['Heading2'], fontSize=15, textColor=BLUE, spaceBefore=12, spaceAfter=6, fontName='Helvetica-Bold'),
        'body': ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=6),
        'small': ParagraphStyle('Small', parent=styles['Normal'], fontSize=9, leading=12, spaceAfter=4),
        'center': ParagraphStyle('Center', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=6, alignment=TA_CENTER),
        'gold': ParagraphStyle('Gold', parent=styles['Normal'], textColor=GOLD, fontSize=12, fontName='Helvetica-Bold'),
    }


CHAINS = [
    ("Chain A: Restaurateur Gateway", "Blogger > Restaurant > Investor",
     ["Food blogger gets exclusive beta access and posts dish scores",
      "Restaurant owner sees coverage, gets curious about their scores",
      "Ali reaches out with dish data — restaurateur becomes champion",
      "Restaurateur tells investor friends at industry dinner",
      "Investor hears from trusted source, takes Ali's meeting"]),
    ("Chain B: FOMO Cascade", "Coordinated buzz > Media > Market pull",
     ["Seed 5-10 influencers with exclusive beta simultaneously",
      "Coordinated posts in 48-hour window create 'everyone talking' perception",
      "Media picks up trend (Eater Philly, Technical.ly)",
      "Restaurateurs scramble to get dishes rated",
      "Investors see organic market pull, not push"]),
    ("Chain C: University Pipeline", "Faculty > Students > Alumni Angels",
     ["Connect with Penn Food Innovation Lab / Wharton faculty",
      "Students become beta testers (hundreds of food-obsessed students)",
      "Usage data spike + campus buzz + student press",
      "Faculty intro to Wharton entrepreneurship professors",
      "Penn alumni angel network invitation"]),
    ("Chain D: NJ-to-NYC Bridge", "Princeton > NJ Angels > NYC VCs",
     ["Demo at Princeton Entrepreneurship Council meetup",
      "Princeton-area angels show interest in food-tech",
      "NJ angels co-invest with NYC-adjacent funds",
      "NYC VC sees tri-state traction, not just 'a Philly app'",
      "Warm intro to Collaborative Fund, Lerer Hippeau, S2G"]),
    ("Chain E: Accelerator Fast-Track", "Apply > Accept > Demo Day > Pipeline",
     ["Apply to Comcast LIFT Labs, Dreamit, Food-X, Big Idea Ventures",
      "Acceptance = instant credibility stamp",
      "Demo Day = investor pipeline from accelerator network",
      "Alumni network = ongoing intros and support"]),
    ("Chain F: Food Industry Backdoor", "POS/Distributor > Restaurants > Investors",
     ["Connect with Toast/Sysco regional reps",
      "They see integration potential for their clients",
      "They mention Tastyr to restaurant clients",
      "Organic demand signal validates market"]),
    ("Chain G: Media Momentum", "Stack coverage 5-7 days apart",
     ["Eater Philly: 'AI rates Philly dishes'",
      "Technical.ly: 'Philly startup raises buzz'",
      "PhillyMag: 'The app every foodie needs'",
      "Inquirer: Deep-dive feature",
      "National pickup follows local momentum"]),
    ("Chain H: Connector Express", "Super-connectors > Multiple intros each",
     ["Identify 5-10 ecosystem builders (PSL, PACT, 1PHL)",
      "Build genuine relationship via coffee/demo",
      "Ask for 3-5 specific intros (not generic asks)",
      "Each intro generates 2-3 more intros",
      "Exponential network growth in 4-6 weeks"]),
]


def _load_crm(base):
    crm_path = os.path.join(base, "crm", "master-crm.csv")
    with open(crm_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        all_contacts = list(reader)
    total = len(all_contacts)
    seg_counts = {}
    for r in all_contacts:
        seg_counts[r["Segment"]] = seg_counts.get(r["Segment"], 0) + 1
    top20 = sorted(all_contacts, key=lambda r: int(r["Rank"]), reverse=True)[:20]
    return all_contacts, total, seg_counts, top20


def build_strategy_elements(all_contacts, total, seg_counts, top20):
    """Build elements for the full outreach strategy PDF."""
    S = _make_styles()
    h1, h2, body, small, center = S['h1'], S['h2'], S['body'], S['small'], S['center']

    elements = []

    # COVER PAGE
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph("TASTYR IQ", ParagraphStyle('Cover', fontSize=42, textColor=NAVY, alignment=TA_CENTER, fontName='Helvetica-Bold')))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(HRFlowable(width="60%", thickness=2, color=GOLD))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("Tri-State Outreach & Investment Strategy", ParagraphStyle('Sub', fontSize=18, textColor=BLUE, alignment=TA_CENTER)))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("AI-Powered Dish Intelligence | Patent Pending | App Store Live", center))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph(f"{total} Contacts | 12 Segments | PA + NJ + DE + NYC", center))
    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("March 2026 | Confidential", ParagraphStyle('Date', fontSize=11, textColor=HexColor('#888888'), alignment=TA_CENTER)))
    elements.append(Paragraph("Prepared for Nik Amin (CEO) & Ali Mabsoute (CMO)", ParagraphStyle('For', fontSize=11, textColor=HexColor('#888888'), alignment=TA_CENTER)))
    elements.append(PageBreak())

    # EXECUTIVE SUMMARY
    elements.append(Paragraph("1. EXECUTIVE SUMMARY", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))
    elements.append(Paragraph(
        "<b>Tastyr IQ</b> rates <b>dishes, not restaurants</b> — AI-powered intelligence across 9 food verticals. "
        "With 2,490+ dishes indexed, a patent-pending algorithm, and App Store approval, we're raising a seed round ($500K-$1.5M) "
        "with Philadelphia as our launch city.", body))
    elements.append(Paragraph(
        f"This document outlines a comprehensive outreach strategy spanning <b>{total} contacts</b> across "
        f"<b>12 segments</b> in the tri-state area (PA, NJ, DE) plus NYC spillover. "
        "Our approach uses <b>social chain strategies</b> and <b>FOMO campaign tactics</b> to create organic market pull "
        "that makes investors come to us.", body))

    summary_data = [
        ['Metric', 'Value'],
        ['Total CRM Contacts', str(total)],
        ['Contact Segments', '12 (Angel, VC, PE, Accelerator, Restaurateur, Food Blogger, Media, University, Founder-Connector, Food Industry, NJ-DE-Suburb)'],
        ['Geographic Coverage', 'PA, NJ, DE + NYC spillover'],
        ['Tier 1 (Contact this week)', str(sum(1 for c in all_contacts if int(c["Rank"]) >= 70))],
        ['Social Chain Strategies', '8 mapped chains'],
        ['Ranking System', '1-100 composite score'],
    ]
    t = Table(summary_data, colWidths=[2*inch, 4.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_BG), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(PageBreak())

    # MARKET OPPORTUNITY
    elements.append(Paragraph("2. MARKET OPPORTUNITY", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))
    elements.append(Paragraph("<b>The Problem:</b> The $371B US restaurant industry relies on restaurant-level ratings (Yelp, Google). "
        "Nobody rates the actual food. A 4-star restaurant can serve 2-star dishes. Consumers waste money, restaurants lack dish-level data.", body))
    elements.append(Paragraph("<b>The Solution:</b> Tastyr IQ scores individual dishes using AI — aggregating reviews, social mentions, "
        "critic ratings, and proprietary signals across 9 food verticals. Patent-pending algorithm.", body))

    comp_data = [
        ['Competitor', 'What They Do', 'Gap Tastyr Fills'],
        ['Yelp', 'Restaurant reviews', 'No dish-level intelligence'],
        ['Google Maps', 'Restaurant ratings', 'No dish scoring'],
        ['The Infatuation', 'Editorial reviews', 'Not data-driven, not dish-level'],
        ['OpenTable / Resy', 'Reservations', 'No food rating system'],
    ]
    t = Table(comp_data, colWidths=[1.5*inch, 2*inch, 3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('BACKGROUND', (0, 1), (-1, -1), LIGHT_BG),
    ]))
    elements.append(t)
    elements.append(PageBreak())

    # OUTREACH ECOSYSTEM MAP
    elements.append(Paragraph("3. OUTREACH ECOSYSTEM MAP", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))

    seg_data = [['Segment', 'Contacts', 'Connection', 'Chain Strategy']]
    for seg, chain in [
        ("Angel", "Connector Express + FOMO"), ("VC", "FOMO Cascade + NJ Bridge"),
        ("PE", "Connector Express"), ("Accelerator", "Fast-Track"),
        ("Restaurateur", "Restaurateur Gateway"), ("Food Blogger", "FOMO Cascade"),
        ("Media", "Media Momentum"), ("University", "University Pipeline"),
        ("Founder-Connector", "Connector Express"), ("Food Industry", "Industry Backdoor"),
        ("NJ-DE-Suburb", "NJ Bridge + Gateway"),
    ]:
        degree = {"Angel":"1st","VC":"1st","PE":"2nd","Accelerator":"2nd","Restaurateur":"2nd",
                  "Food Blogger":"3rd","Media":"3rd","University":"2nd","Founder-Connector":"2nd",
                  "Food Industry":"3rd","NJ-DE-Suburb":"3rd"}.get(seg,"3rd")
        seg_data.append([seg, str(seg_counts.get(seg, 0)), degree, chain])

    seg_data.append(['TOTAL', str(total), '', ''])
    t = Table(seg_data, colWidths=[1.8*inch, 0.8*inch, 1*inch, 2.8*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('BACKGROUND', (0, -1), (-1, -1), HexColor('#E8E8E8')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    elements.append(t)
    elements.append(PageBreak())

    # SOCIAL CHAIN STRATEGIES
    elements.append(Paragraph("4. SOCIAL CHAIN STRATEGIES", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))

    for title, subtitle, steps in CHAINS:
        elements.append(Paragraph(title, h2))
        elements.append(Paragraph(f"<i>{subtitle}</i>", small))
        for i, step in enumerate(steps, 1):
            elements.append(Paragraph(f"<b>Step {i}:</b> {step}", small))
        elements.append(Spacer(1, 0.1*inch))

    elements.append(PageBreak())

    # FOMO CAMPAIGN PLAYBOOK
    elements.append(Paragraph("5. FOMO CAMPAIGN PLAYBOOK", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))

    elements.append(Paragraph("Scarcity Tactics", h2))
    for tactic in ['"Only 50 spots in founding restaurant cohort" — numbered waitlist',
                   '"Founding Investor" title for first 5 investors — advisory board seats',
                   '"Launch City: Philadelphia" — Philly gets it first, other cities later',
                   '"We\'re only meeting with 10 investors this round" — selection framing']:
        elements.append(Paragraph(f"• {tactic}", small))

    elements.append(Paragraph("Social Proof Manufacturing", h2))
    for tactic in ['Coordinated influencer drop — 5-10 posts in same 48-hour window',
                   '"As Seen In" press momentum before approaching investors',
                   'Restaurateur case studies documented as proof points',
                   'App Store approval as credibility stamp in all materials']:
        elements.append(Paragraph(f"• {tactic}", small))

    elements.append(Paragraph("Segment-Specific FOMO Messaging", h2))
    fomo_msgs = [
        ['Segment', 'FOMO Message'],
        ['Investors', '"Our round is filling — we\'re prioritizing local investors who understand Philly food"'],
        ['Restaurateurs', '"We\'ve already indexed your competitors\' dishes — want to see how yours stack up?"'],
        ['Bloggers', '"You\'ll be one of the first 5 people in Philly to use this — before it\'s public"'],
        ['Media', '"Exclusive first-look before our public launch — embargo available"'],
        ['University', '"We\'re partnering with only 3 universities for our founding research program"'],
    ]
    t = Table(fomo_msgs, colWidths=[1.2*inch, 5.3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(PageBreak())

    # TIER 1 PRIORITY CONTACTS
    elements.append(Paragraph("6. TIER 1 PRIORITY CONTACTS (Top 20)", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))

    for i, c in enumerate(top20):
        elements.append(Paragraph(f"<b>{i+1}. {c['Name']}</b> — {c.get('Title/Role','')[:50]} at {c.get('Organization','')[:50]}",
            ParagraphStyle('Contact', fontSize=10, fontName='Helvetica-Bold', textColor=NAVY, spaceBefore=8)))
        elements.append(Paragraph(f"<b>Segment:</b> {c['Segment']} | <b>Rank:</b> {c['Rank']} | <b>Degree:</b> {c['Connection Degree']} | <b>Chain:</b> {c['Chain Strategy'][:40]}", small))
        if c.get('Why Contact This Person'):
            elements.append(Paragraph(f"<b>Why:</b> {c['Why Contact This Person'][:200]}", small))
        if c.get('Psychological Angle'):
            elements.append(Paragraph(f"<b>Psychology:</b> {c['Psychological Angle'][:150]}", small))

    elements.append(PageBreak())

    # WEEKLY ACTION PLAN
    elements.append(Paragraph("7. WEEKLY ACTION PLAN", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))

    weeks = [
        ("Week 1-2: Foundation", [
            "Seed 5-10 influencers with beta access",
            "Onboard 3-5 champion restaurateurs into founding cohort",
            "Submit accelerator applications (LIFT Labs, Dreamit, Food-X, Big Idea Ventures)",
            "Begin Tier 1 outreach (Rank 90-100 contacts)",
            "Secure first media contact (pitch Eater Philly, Technical.ly)",
            "LinkedIn content strategy begins",
        ]),
        ("Week 3-4: Momentum", [
            "Coordinated influencer drop (48-hour window)",
            "Media coverage from at least 1 outlet",
            "University partnerships initiated (Penn, Temple, Drexel)",
            "Tier 2 outreach begins (Rank 70-89)",
            "NJ-to-NYC bridge chain activated",
            "First investor meetings scheduled",
        ]),
        ("Week 5-8: Acceleration", [
            "Multiple media mentions creating 'everyone talking' perception",
            "Restaurateur case studies documented for pitch deck",
            "Student beta tester cohort active at 2+ universities",
            "10+ investor meetings completed",
            "FOMO messaging shifts to 'round is filling'",
        ]),
        ("Week 9-12: Close", [
            "Term sheet(s) received and negotiated",
            "Strategic investors (food industry) brought in",
            "Round closed at $500K-$1.5M",
            "Press announcement: 'Tastyr IQ raises seed round'",
            "Prepare Series A roadmap",
        ]),
    ]

    for title, items in weeks:
        elements.append(Paragraph(title, h2))
        for item in items:
            elements.append(Paragraph(f"• {item}", small))

    elements.append(PageBreak())

    # APPENDIX: FULL CONTACT LIST
    elements.append(Paragraph("8. APPENDIX: FULL CONTACT LIST", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))
    elements.append(Paragraph(f"Total: {total} contacts across 12 segments, ranked 1-100", body))

    # Compact table
    header = ['#', 'Name', 'Organization', 'Segment', 'Rank']
    table_data = [header]
    for i, c in enumerate(sorted(all_contacts, key=lambda r: int(r["Rank"]), reverse=True), 1):
        table_data.append([
            str(i),
            c["Name"][:25],
            c.get("Organization", "")[:30],
            c["Segment"],
            c["Rank"],
        ])

    # Split into chunks of 45 for pagination
    chunk_size = 45
    for chunk_start in range(0, len(table_data), chunk_size):
        chunk = table_data[chunk_start:chunk_start+chunk_size]
        if chunk_start > 0:
            chunk = [header] + chunk
        t = Table(chunk, colWidths=[0.4*inch, 1.8*inch, 2.2*inch, 1.2*inch, 0.5*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('GRID', (0, 0), (-1, -1), 0.3, HexColor('#DDDDDD')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ]))
        elements.append(t)
        if chunk_start + chunk_size < len(table_data):
            elements.append(PageBreak())

    return elements


def build_chain_elements():
    """Build elements for the focused Social Chain Strategy PDF."""
    S = _make_styles()
    h1, h2, body, small, center = S['h1'], S['h2'], S['body'], S['small'], S['center']

    elements = []

    # COVER PAGE
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph("TASTYR IQ", ParagraphStyle('Cover2', fontSize=42, textColor=NAVY, alignment=TA_CENTER, fontName='Helvetica-Bold')))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(HRFlowable(width="60%", thickness=2, color=GOLD))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("Social Chain Strategies", ParagraphStyle('Sub2', fontSize=22, textColor=BLUE, alignment=TA_CENTER, fontName='Helvetica-Bold')))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("People-Link Approach Maps for Tri-State Outreach", center))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(
        "Cold outreach converts at ~2%. Warm intros convert at ~40%.<br/>"
        "The difference is the chain.", center))
    elements.append(Spacer(1, 1*inch))
    elements.append(Paragraph("March 2026 | Confidential", ParagraphStyle('Date2', fontSize=11, textColor=HexColor('#888888'), alignment=TA_CENTER)))
    elements.append(PageBreak())

    # PHILOSOPHY
    elements.append(Paragraph("PHILOSOPHY", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))
    elements.append(Paragraph(
        "Every investor meeting should feel like a <b>natural conversation</b>, not a pitch — because by the time Ali "
        "sits down, the investor has already heard about Tastyr IQ from 2-3 trusted sources.", body))
    elements.append(Paragraph(
        "Instead of contacting investors cold, we map out <b>chains of influence</b> where each link creates "
        "credibility, buzz, and social proof that compounds into warm introductions.", body))
    elements.append(Spacer(1, 0.2*inch))

    # ALL 8 CHAINS with detailed execution
    chain_details = [
        ("Chain A: Restaurateur Gateway", "Blogger > Restaurant > Investor",
         "Use Philadelphia's food scene to create organic investor interest through restaurateur champions.",
         [("Activate Food Blogger", "Give 2-3 Philly food Instagram accounts (10K+ followers) exclusive beta access. They rate dishes at popular restaurants."),
          ("Restaurateur Sees Buzz", "Message: 'Your [dish] scored 94/100 on Tastyr IQ. Thought you'd want to know.' Include screenshot."),
          ("Onboard Restaurateur", "Offer 'Founding Cohort' status, dashboard access, permission to use name in materials."),
          ("Leverage Network", "Ask: 'Do you know any investors who care about the food industry?' Industry events do the rest."),
          ("Warm Investor Intro", "Investor already knows about Tastyr. Ali's pitch: '[Restaurateur Name] suggested we connect.'")],
         "Marc Vetri, Michael Solomonov, Greg Vernick, Ellen Yin"),

        ("Chain B: FOMO Cascade", "Coordinated buzz > Media > Market pull",
         "Create perception of unstoppable momentum through coordinated buzz across multiple channels simultaneously.",
         [("Seed Influencers (Day -7 to 0)", "Select 5-10 influencers across Instagram, TikTok, YouTube. Each gets personalized onboarding with 'exclusive' framing."),
          ("Coordinated Drop (Day 0-2)", "All influencers post within 48-hour window. Ali reposts everything. Anyone in Philly food sees Tastyr 3-5 times."),
          ("Media Pitch (Day 2-4)", "Pitch angle: 'New AI app has Philly food influencers buzzing.' Provide 5+ posts as evidence."),
          ("Restaurateur FOMO (Day 4-10)", "Proactively reach out: 'Your competitors' dishes are being scored — want to see yours?'"),
          ("Investor Strength (Day 10-20)", "Ali pitches from position of strength: 'We're experiencing organic market pull — here's the data.'")],
         "Top 5-10 Philly food influencers, Eater Philly, Technical.ly"),

        ("Chain C: University Pipeline", "Faculty > Students > Alumni Angels",
         "Build academic credibility then leverage into student beta tester army and faculty investor network intros.",
         [("Faculty Connection", "Target Penn Food Innovation Lab, Wharton Entrepreneurship, Drexel Food Science. Offer guest lecture on 'AI in Food.'"),
          ("Student Beta Testers", "Partner with food-focused student groups. Launch 'Rate your dining hall' campaign. Target 200+ sign-ups."),
          ("Usage Data Spike", "Document: '200 Penn students rated 500 dishes in 2 weeks.' Student newspaper coverage."),
          ("Faculty Investor Intros", "Wharton faculty sit on advisory boards. Ask: 'We'd love to connect with investors in your network.'"),
          ("Alumni Investor Events", "Penn Venture Lab, Wharton Angels, Temple Innovation Fund. Present at alumni investor showcases.")],
         "Penn, Temple, Drexel faculty + Penn Venture Lab alumni"),

        ("Chain D: NJ-to-NYC Bridge", "Princeton > NJ Angels > NYC VCs",
         "Use NJ ecosystem as a bridge to access NYC venture capital. Show 'tri-state traction' rather than just 'Philly.'",
         [("Princeton Connection", "Demo at Princeton Entrepreneurship Council meetup. Also Stevens Venture Center, NJIT EDC."),
          ("NJ Angel Interest", "Princeton Angel Group, NJ Angels, Golden Seeds NJ. Pitch: 'Already live in Philly, expanding to NJ.'"),
          ("NJ-NYC Co-Investment", "NJ angels often co-invest with NYC funds. Ask for NYC syndicate partner intros."),
          ("NYC VC Pitch", "Collaborative Fund, Lerer Hippeau, S2G Ventures. Framing: 'Tri-state launch with national expansion model.'")],
         "Princeton Entrepreneurship Council, NJ Angels, Collaborative Fund"),

        ("Chain E: Accelerator Fast-Track", "Apply > Accept > Demo Day > Pipeline",
         "Accelerator acceptance = instant credibility + investor access + mentorship.",
         [("Apply Broadly", "Comcast LIFT Labs (Philly), Dreamit (Philly), Food-X (NYC), Y Combinator. Most have rolling deadlines."),
          ("Acceptance = Credibility", "Press release + credibility stamp. Leverage App Store live + patent + 2,490 dishes."),
          ("Demo Day Pipeline", "Investor pipeline from accelerator network. Warm intros to dozens of investors."),
          ("Alumni Network", "Ongoing intros and support from accelerator alumni.")],
         "Comcast LIFT Labs, Dreamit, Food-X, Big Idea Ventures"),

        ("Chain F: Food Industry Backdoor", "POS/Distributor > Restaurants > Investors",
         "Food industry reps talk to every restaurant. Use them as force multipliers.",
         [("Connect with POS/Distributor Reps", "Toast, Square, Clover regional managers. Sysco, US Foods Philly reps."),
          ("Show Integration Potential", "They see how Tastyr IQ data enhances their platform for restaurant clients."),
          ("Organic Restaurant Mentions", "Reps mention Tastyr to restaurant clients. Restaurants reach out to Ali."),
          ("Industry Partnership Story", "Partnership interest validates market for investors.")],
         "Toast, Square, Sysco regional reps, DoorDash/UberEats market managers"),

        ("Chain G: Media Momentum Engine", "Stack coverage 5-7 days apart",
         "Stack press coverage so each story references previous coverage, building perceived momentum.",
         [("Eater Philly (Food-Native)", "'AI rates Philly dishes' — first food-specific coverage."),
          ("Technical.ly (Tech-Native)", "'Philly startup raises buzz' — tech credibility."),
          ("PhillyMag (Mainstream)", "'The app every foodie needs' — mainstream awareness."),
          ("Philadelphia Inquirer (Authority)", "Deep-dive feature — institutional credibility."),
          ("National Pickup", "Forbes/TechCrunch see local momentum, request story.")],
         "Eater Philly, Technical.ly, PhillyMag, Inquirer food desk"),

        ("Chain H: Connector Express", "Super-connectors > Multiple intros each",
         "Identify 5-10 'super connectors' who can generate multiple warm intros each.",
         [("Identify Ecosystem Builders", "PSL board, 1Philadelphia organizers, PACT events, Philly Tech Week."),
          ("Build Genuine Relationship", "Coffee/demo — not a pitch, a conversation. Show the product, ask for advice."),
          ("Ask for Specific Intros", "3-5 specific names (not generic 'who should I talk to?'). Makes it easy."),
          ("Exponential Growth", "Each intro generates 2-3 more intros. Network grows exponentially in 4-6 weeks.")],
         "Philly Startup Leaders, 1Philadelphia, PACT, serial founders"),
    ]

    for title, subtitle, goal, steps, key_people in chain_details:
        elements.append(Paragraph(title, h2))
        elements.append(Paragraph(f"<i>{subtitle}</i>", small))
        elements.append(Paragraph(f"<b>Goal:</b> {goal}", body))
        for i, (step_name, step_desc) in enumerate(steps, 1):
            elements.append(Paragraph(f"<b>Step {i}: {step_name}</b>", small))
            elements.append(Paragraph(step_desc, small))
        elements.append(Paragraph(f"<b>Key People:</b> {key_people}", small))
        elements.append(Spacer(1, 0.15*inch))

    elements.append(PageBreak())

    # CHAIN TIMING OVERVIEW
    elements.append(Paragraph("CHAIN TIMING OVERVIEW", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))

    timing_data = [
        ['Timeline', 'Active Chains', 'Key Milestones'],
        ['Week 1-2', 'A, B, C, E, F', 'Influencer seeding, faculty outreach, accelerator apps, industry connections'],
        ['Week 2-3', 'C, G', 'FOMO Cascade executes, first media pitch'],
        ['Week 3-4', 'A, B, D', 'First restaurant champions, student testers active, NJ bridge initiated'],
        ['Week 4-6', 'ALL', 'All chains producing warm intros, Tier 1 investor meetings, media stacking'],
        ['Week 6-8', 'H amplifies all', 'Connector Express multiplies all chains, multiple investor conversations'],
        ['Week 8-12', 'Closing', 'Term sheet conversations, chains mature into ongoing relationships'],
    ]
    t = Table(timing_data, colWidths=[1.2*inch, 1.3*inch, 4*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.3*inch))

    # CHAIN HEALTH MONITORING
    elements.append(Paragraph("CHAIN HEALTH MONITORING", h1))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))

    health_data = [
        ['Chain', 'Green Signal', 'Red Signal'],
        ['A: Restaurateur', '3+ restaurants engaged', '0 restaurants after 3 weeks'],
        ['B: FOMO Cascade', '5+ influencer posts', '< 2 posts after 2 weeks'],
        ['C: University', 'Faculty partnership formed', 'No faculty response'],
        ['D: NJ-NYC Bridge', 'NJ angel meeting scheduled', 'No NJ traction after 4 weeks'],
        ['E: Accelerator', 'Accepted to 1+ program', 'Rejected from all'],
        ['F: Food Industry', 'POS/distributor interested', 'No industry interest'],
        ['G: Media', '1+ article published', 'No media response'],
        ['H: Connector', '5+ warm intros received', '< 2 intros after 3 weeks'],
    ]
    t = Table(health_data, colWidths=[1.5*inch, 2.5*inch, 2.5*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph(
        "<b>Rule:</b> If a chain shows Red, don't abandon it — pivot the approach. "
        "If 3+ chains show Red simultaneously, reassess the overall strategy.", body))

    return elements


def _build_doc(output_path, elements):
    doc = SimpleDocTemplate(output_path, pagesize=letter,
        topMargin=0.6*inch, bottomMargin=0.6*inch, leftMargin=0.7*inch, rightMargin=0.7*inch)
    doc.build(elements)
    print(f"PDF saved: {output_path} ({os.path.getsize(output_path):,} bytes)")


def build_pdf():
    base = os.path.dirname(__file__) or "."
    all_contacts, total, seg_counts, top20 = _load_crm(base)

    # Build full outreach strategy PDF
    strategy_elements = build_strategy_elements(all_contacts, total, seg_counts, top20)
    _build_doc(os.path.join(base, "strategy", "tastyr-iq-outreach-strategy.pdf"), strategy_elements)

    # Build focused chain strategy PDF (independent elements list)
    chain_elements = build_chain_elements()
    _build_doc(os.path.join(base, "strategy", "social-chain-strategy.pdf"), chain_elements)


if __name__ == "__main__":
    build_pdf()
