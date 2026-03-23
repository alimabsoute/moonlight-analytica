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

def build_pdf():
    base = os.path.dirname(__file__)
    crm_path = os.path.join(base, "crm", "master-crm.csv")

    # Read CRM data
    with open(crm_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        all_contacts = list(reader)

    total = len(all_contacts)
    seg_counts = {}
    for r in all_contacts:
        seg_counts[r["Segment"]] = seg_counts.get(r["Segment"], 0) + 1

    top20 = sorted(all_contacts, key=lambda r: int(r["Rank"]), reverse=True)[:20]

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title', parent=styles['Title'], fontSize=28, textColor=NAVY, spaceAfter=6, alignment=TA_CENTER, fontName='Helvetica-Bold')
    h1 = ParagraphStyle('H1', parent=styles['Heading1'], fontSize=20, textColor=NAVY, spaceBefore=18, spaceAfter=8, fontName='Helvetica-Bold')
    h2 = ParagraphStyle('H2', parent=styles['Heading2'], fontSize=15, textColor=BLUE, spaceBefore=12, spaceAfter=6, fontName='Helvetica-Bold')
    body = ParagraphStyle('Body', parent=styles['Normal'], fontSize=10, leading=14, spaceAfter=6)
    small = ParagraphStyle('Small', parent=styles['Normal'], fontSize=9, leading=12, spaceAfter=4)
    center = ParagraphStyle('Center', parent=body, alignment=TA_CENTER)
    gold_text = ParagraphStyle('Gold', parent=body, textColor=GOLD, fontSize=12, fontName='Helvetica-Bold')

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

    chains = [
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

    for title, subtitle, steps in chains:
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

    # Build both PDFs
    for filename in ["tastyr-iq-outreach-strategy.pdf", "social-chain-strategy.pdf"]:
        output_path = os.path.join(base, "strategy", filename)
        doc = SimpleDocTemplate(output_path, pagesize=letter,
            topMargin=0.6*inch, bottomMargin=0.6*inch, leftMargin=0.7*inch, rightMargin=0.7*inch)
        doc.build(elements)
        print(f"PDF saved: {output_path}")

if __name__ == "__main__":
    build_pdf()
