#!/usr/bin/env python3
"""Tastyr IQ — Professional Contact Directory PDF for Co-Founder Handoff"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
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
CARD_BORDER = HexColor('#D4A534')
TIER1_BG = HexColor('#E8F5E9')
TIER2_BG = HexColor('#FFF8E1')
TIER3_BG = HexColor('#FFEBEE')

BASE = os.path.dirname(os.path.abspath(__file__))

def load_crm():
    with open(os.path.join(BASE, "crm", "master-crm.csv"), "r", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def make_styles():
    return {
        'cover_title': ParagraphStyle('CT', fontSize=44, textColor=NAVY, alignment=TA_CENTER, fontName='Helvetica-Bold', leading=52),
        'cover_sub': ParagraphStyle('CS', fontSize=20, textColor=GOLD, alignment=TA_CENTER, fontName='Helvetica-Bold', leading=26),
        'cover_detail': ParagraphStyle('CD', fontSize=12, textColor=MED_TEXT, alignment=TA_CENTER, leading=16),
        'cover_conf': ParagraphStyle('CC', fontSize=10, textColor=LIGHT_TEXT, alignment=TA_CENTER, leading=14),
        'h1': ParagraphStyle('H1', fontSize=22, textColor=NAVY, fontName='Helvetica-Bold', spaceBefore=16, spaceAfter=10),
        'h2': ParagraphStyle('H2', fontSize=16, textColor=BLUE, fontName='Helvetica-Bold', spaceBefore=12, spaceAfter=6),
        'h3': ParagraphStyle('H3', fontSize=12, textColor=NAVY, fontName='Helvetica-Bold', spaceBefore=8, spaceAfter=4),
        'body': ParagraphStyle('Body', fontSize=10, textColor=DARK_TEXT, leading=14, spaceAfter=6),
        'small': ParagraphStyle('Small', fontSize=9, textColor=MED_TEXT, leading=12, spaceAfter=3),
        'card_name': ParagraphStyle('CardName', fontSize=11, textColor=NAVY, fontName='Helvetica-Bold', leading=14),
        'card_title': ParagraphStyle('CardTitle', fontSize=9, textColor=BLUE, leading=12),
        'card_body': ParagraphStyle('CardBody', fontSize=8, textColor=DARK_TEXT, leading=11, spaceAfter=2),
        'card_label': ParagraphStyle('CardLabel', fontSize=7, textColor=LIGHT_TEXT, fontName='Helvetica-Bold', leading=10),
        'card_rank': ParagraphStyle('CardRank', fontSize=14, textColor=GOLD, fontName='Helvetica-Bold', alignment=TA_CENTER),
        'tier_header': ParagraphStyle('TierH', fontSize=18, textColor=WHITE, fontName='Helvetica-Bold', alignment=TA_CENTER),
    }

def gold_rule():
    return HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=8)

def truncate(text, max_len):
    if not text:
        return ''
    text = text.strip()
    return text[:max_len] + '...' if len(text) > max_len else text

def build_contact_card(contact, s, index):
    """Build a professional contact card as a table."""
    c = contact
    rank = int(c.get('Rank', 0))
    name = c.get('Name', 'Unknown')
    title = truncate(c.get('Title/Role', ''), 70)
    org = truncate(c.get('Organization', ''), 60)
    city = truncate(c.get('City/State', ''), 40)
    segment = c.get('Segment', '')
    degree = c.get('Connection Degree', '')
    chain = truncate(c.get('Chain Strategy', ''), 50)
    linkedin = truncate(c.get('LinkedIn', ''), 60)
    email = c.get('Email', '')
    phone = c.get('Phone', '')
    other_social = truncate(c.get('Other Social', ''), 50)
    focus = truncate(c.get('Investment Focus / Expertise', ''), 120)
    check = c.get('Check Size', '')
    notable = truncate(c.get('Notable Work', ''), 150)
    food_conn = truncate(c.get('Food/Tastyr Connection', ''), 150)
    why = truncate(c.get('Why Contact This Person', ''), 200)
    psych = truncate(c.get('Psychological Angle', ''), 150)
    trigger = truncate(c.get('Emotional Trigger', ''), 120)
    warm_path = truncate(c.get('Warm Intro Path', ''), 150)
    approach = truncate(c.get('Approach Strategy', ''), 150)
    message = truncate(c.get('Custom Message Draft', ''), 250)

    # Build card content as paragraphs within a table
    card_elements = []

    # Header row: rank badge + name/title
    header_left = f"<b>{name}</b>"
    header_right = f"RANK {rank}"

    # Build info rows
    rows = []

    # Row 1: Name + Rank
    rows.append([
        Paragraph(f"<b>#{index}  {name}</b>", s['card_name']),
        Paragraph(f"<font size='12' color='#D4A534'><b>{rank}</b></font>", ParagraphStyle('R', fontSize=12, textColor=GOLD, fontName='Helvetica-Bold', alignment=2)),
    ])

    # Row 2: Title at Org
    rows.append([
        Paragraph(f"{title}", s['card_title']),
        Paragraph(f"<font size='8' color='#888888'>{segment} | {degree}</font>", ParagraphStyle('S', fontSize=8, textColor=LIGHT_TEXT, alignment=2)),
    ])

    # Row 3: Org + Location
    rows.append([
        Paragraph(f"<b>{org}</b> — {city}", s['card_body']),
        Paragraph(f"<font size='8'>Chain: {chain}</font>", ParagraphStyle('Ch', fontSize=8, textColor=MED_TEXT, alignment=2)),
    ])

    t_header = Table(rows, colWidths=[4.5*inch, 2*inch])
    t_header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
    ]))
    card_elements.append(t_header)

    # Contact info line
    contact_parts = []
    if linkedin:
        contact_parts.append(f"LinkedIn: {linkedin}")
    if email:
        contact_parts.append(f"Email: {email}")
    if phone:
        contact_parts.append(f"Phone: {phone}")
    if other_social:
        contact_parts.append(f"Social: {other_social}")
    if contact_parts:
        card_elements.append(Paragraph(" | ".join(contact_parts), s['card_body']))

    # Focus / Check Size
    if focus:
        card_elements.append(Paragraph(f"<font color='#888888'><b>FOCUS:</b></font> {focus}", s['card_body']))
    if check and check != 'N/A':
        card_elements.append(Paragraph(f"<font color='#888888'><b>CHECK SIZE:</b></font> {check}", s['card_body']))

    # Notable Work
    if notable:
        card_elements.append(Paragraph(f"<font color='#888888'><b>NOTABLE:</b></font> {notable}", s['card_body']))

    # Food Connection
    if food_conn:
        card_elements.append(Paragraph(f"<font color='#888888'><b>TASTYR CONNECTION:</b></font> {food_conn}", s['card_body']))

    # Why contact
    if why:
        card_elements.append(Paragraph(f"<font color='#3A7CD5'><b>WHY CONTACT:</b></font> {why}", s['card_body']))

    # Psychology
    if psych:
        card_elements.append(Paragraph(f"<font color='#3A7CD5'><b>PSYCHOLOGY:</b></font> {psych}", s['card_body']))

    # Trigger
    if trigger:
        card_elements.append(Paragraph(f"<font color='#3A7CD5'><b>TRIGGER:</b></font> {trigger}", s['card_body']))

    # Warm intro path
    if warm_path:
        card_elements.append(Paragraph(f"<font color='#27AE60'><b>WARM INTRO:</b></font> {warm_path}", s['card_body']))

    # Approach
    if approach:
        card_elements.append(Paragraph(f"<font color='#27AE60'><b>APPROACH:</b></font> {approach}", s['card_body']))

    # Custom message
    if message:
        card_elements.append(Spacer(1, 2))
        card_elements.append(Paragraph(f"<font color='#888888'><b>DRAFT MESSAGE:</b></font>", s['card_label']))
        card_elements.append(Paragraph(f"<i>{message}</i>",
            ParagraphStyle('Msg', fontSize=7.5, textColor=MED_TEXT, leading=10, leftIndent=6, fontName='Helvetica-Oblique')))

    # Wrap in a bordered table for card effect
    # Determine border color by tier
    if rank >= 70:
        border_color = HexColor('#27AE60')  # Green for Tier 1
        bg = HexColor('#F8FFF8')
    elif rank >= 40:
        border_color = GOLD  # Gold for Tier 2
        bg = HexColor('#FFFEF8')
    else:
        border_color = HexColor('#999999')  # Gray for Tier 3
        bg = LIGHT_BG

    # Create card wrapper
    inner = []
    for el in card_elements:
        inner.append(el)

    card_table_data = [[inner]]
    card_table = Table(card_table_data, colWidths=[6.5*inch])
    card_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1.5, border_color),
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))

    return card_table


def build_directory():
    contacts = load_crm()
    s = make_styles()
    total = len(contacts)
    sorted_contacts = sorted(contacts, key=lambda r: int(r["Rank"]), reverse=True)
    tier1 = [c for c in sorted_contacts if int(c["Rank"]) >= 70]
    tier2 = [c for c in sorted_contacts if 40 <= int(c["Rank"]) < 70]
    tier3 = [c for c in sorted_contacts if int(c["Rank"]) < 40]

    seg_counts = {}
    for c in contacts:
        seg_counts[c["Segment"]] = seg_counts.get(c["Segment"], 0) + 1

    elements = []

    # ── COVER PAGE ──
    elements.append(Spacer(1, 1.8*inch))
    elements.append(Paragraph("TASTYR IQ", s['cover_title']))
    elements.append(Spacer(1, 0.15*inch))
    elements.append(HRFlowable(width="40%", thickness=3, color=GOLD, spaceAfter=12))
    elements.append(Paragraph("Contact Directory", s['cover_sub']))
    elements.append(Spacer(1, 0.4*inch))
    elements.append(Paragraph(f"{total} Contacts  |  12 Segments  |  Ranked 1–100", s['cover_detail']))
    elements.append(Paragraph("Complete CRM Reference Book", s['cover_detail']))
    elements.append(Spacer(1, 1.5*inch))
    elements.append(Paragraph("Prepared for Nik Amin (CEO) &amp; Ali Mabsoute (CMO)", s['cover_conf']))
    elements.append(Paragraph("March 2026  |  Confidential", s['cover_conf']))
    elements.append(PageBreak())

    # ── HOW TO USE ──
    elements.append(Paragraph("HOW TO USE THIS DIRECTORY", s['h1']))
    elements.append(gold_rule())

    elements.append(Paragraph("This directory contains every contact in the Tastyr IQ CRM, organized by priority tier. Each contact card includes:", s['body']))
    guide_items = [
        "<b>Rank (1-100):</b> Composite priority score. Higher = contact sooner.",
        "<b>Segment:</b> Category (Angel, VC, Restaurateur, etc.)",
        "<b>Connection Degree:</b> 1st (direct investor), 2nd (intros to investors), 3rd (ecosystem buzz), 4th (long-game)",
        "<b>Chain Strategy:</b> Which social influence chain this person belongs to",
        "<b>Why Contact:</b> Deep reasoning for why this person matters to Tastyr",
        "<b>Psychology:</b> Cialdini principle(s) to leverage in outreach",
        "<b>Emotional Trigger:</b> What makes them respond as a person",
        "<b>Warm Intro Path:</b> How Ali connects to this person",
        "<b>Draft Message:</b> Ready-to-send first-touch message",
    ]
    for item in guide_items:
        elements.append(Paragraph(f"• {item}", ParagraphStyle('GI', fontSize=9, textColor=DARK_TEXT, leading=13, spaceAfter=2, leftIndent=18, bulletIndent=6)))

    elements.append(Spacer(1, 0.15*inch))
    elements.append(Paragraph("Card Border Colors", s['h3']))
    color_guide = [
        ['Color', 'Tier', 'Rank', 'Action'],
        ['Green', 'Tier 1', '70-100', 'Contact this week / next 2 weeks'],
        ['Gold', 'Tier 2', '40-69', 'Contact within month 1'],
        ['Gray', 'Tier 3', '1-39', 'Long-game relationship building'],
    ]
    t = Table(color_guide, colWidths=[0.8*inch, 0.8*inch, 0.8*inch, 3*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('BACKGROUND', (0, 1), (0, 1), HexColor('#27AE60')),
        ('TEXTCOLOR', (0, 1), (0, 1), WHITE),
        ('BACKGROUND', (0, 2), (0, 2), GOLD),
        ('TEXTCOLOR', (0, 2), (0, 2), WHITE),
        ('BACKGROUND', (0, 3), (0, 3), HexColor('#999999')),
        ('TEXTCOLOR', (0, 3), (0, 3), WHITE),
    ]))
    elements.append(t)
    elements.append(PageBreak())

    # ── SUMMARY STATS ──
    elements.append(Paragraph("DIRECTORY OVERVIEW", s['h1']))
    elements.append(gold_rule())

    overview = [
        ['Metric', 'Value'],
        ['Total Contacts', str(total)],
        ['Tier 1 (Rank 70-100)', str(len(tier1))],
        ['Tier 2 (Rank 40-69)', str(len(tier2))],
        ['Tier 3 (Rank 1-39)', str(len(tier3))],
    ]
    t = Table(overview, colWidths=[2.5*inch, 2*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.15*inch))

    # Segment breakdown
    elements.append(Paragraph("Contacts by Segment", s['h2']))
    seg_data = [['Segment', 'Count']]
    for seg in sorted(seg_counts.keys(), key=lambda x: seg_counts[x], reverse=True):
        seg_data.append([seg, str(seg_counts[seg])])
    t = Table(seg_data, colWidths=[2.5*inch, 1*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
    ]))
    elements.append(t)
    elements.append(PageBreak())

    # ── TIER 1 CONTACTS ──
    # Tier header
    tier1_header = Table([['TIER 1  —  CONTACT THIS WEEK  —  RANK 70-100']], colWidths=[6.8*inch])
    tier1_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#27AE60')),
        ('TEXTCOLOR', (0, 0), (-1, -1), WHITE),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 16),
        ('ALIGNMENT', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(tier1_header)
    elements.append(Paragraph(f"{len(tier1)} contacts — highest priority, highest impact", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    for i, c in enumerate(tier1, 1):
        card = build_contact_card(c, s, i)
        elements.append(card)
        elements.append(Spacer(1, 6))
        # Page break every 3 contacts
        if i % 3 == 0 and i < len(tier1):
            elements.append(PageBreak())

    elements.append(PageBreak())

    # ── TIER 2 CONTACTS ──
    tier2_header = Table([['TIER 2  —  CONTACT WITHIN MONTH 1  —  RANK 40-69']], colWidths=[6.8*inch])
    tier2_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GOLD),
        ('TEXTCOLOR', (0, 0), (-1, -1), WHITE),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 16),
        ('ALIGNMENT', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(tier2_header)
    elements.append(Paragraph(f"{len(tier2)} contacts — strong fits, build the groundwork", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    for i, c in enumerate(tier2, 1):
        card = build_contact_card(c, s, i)
        elements.append(card)
        elements.append(Spacer(1, 6))
        if i % 3 == 0 and i < len(tier2):
            elements.append(PageBreak())

    elements.append(PageBreak())

    # ── TIER 3 CONTACTS ──
    tier3_header = Table([['TIER 3  —  LONG GAME  —  RANK 1-39']], colWidths=[6.8*inch])
    tier3_header.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#999999')),
        ('TEXTCOLOR', (0, 0), (-1, -1), WHITE),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 16),
        ('ALIGNMENT', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(tier3_header)
    elements.append(Paragraph(f"{len(tier3)} contacts — track, engage on social, wait for the right moment", s['body']))
    elements.append(Spacer(1, 0.1*inch))

    for i, c in enumerate(tier3, 1):
        card = build_contact_card(c, s, i)
        elements.append(card)
        elements.append(Spacer(1, 6))
        if i % 3 == 0 and i < len(tier3):
            elements.append(PageBreak())

    elements.append(PageBreak())

    # ── QUICK REFERENCE INDEX ──
    elements.append(Paragraph("QUICK REFERENCE — ALL CONTACTS BY RANK", s['h1']))
    elements.append(gold_rule())

    header = ['#', 'Name', 'Organization', 'Segment', 'Rank', 'Chain']
    table_data = [header]
    for i, c in enumerate(sorted_contacts, 1):
        table_data.append([
            str(i),
            truncate(c["Name"], 22),
            truncate(c.get("Organization", ""), 25),
            c["Segment"][:12],
            c["Rank"],
            truncate(c.get("Chain Strategy", ""), 20),
        ])

    # Split into pages of 42 rows
    chunk_size = 42
    for chunk_start in range(0, len(table_data), chunk_size):
        chunk = table_data[chunk_start:chunk_start+chunk_size]
        if chunk_start > 0:
            chunk = [header] + chunk
        t = Table(chunk, colWidths=[0.35*inch, 1.6*inch, 1.8*inch, 1*inch, 0.45*inch, 1.3*inch])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), NAVY),
            ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('LEADING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.3, HexColor('#DDDDDD')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(t)
        if chunk_start + chunk_size < len(table_data):
            elements.append(PageBreak())

    # ── Final page ──
    elements.append(Spacer(1, 0.3*inch))
    elements.append(HRFlowable(width="100%", thickness=2, color=GOLD, spaceAfter=16))
    elements.append(Paragraph(
        "Tastyr IQ  |  Contact Directory  |  March 2026  |  Confidential",
        s['cover_conf']))

    # ── Build ──
    output = os.path.join(BASE, "strategy", "tastyr-iq-contact-directory.pdf")
    doc = SimpleDocTemplate(output, pagesize=letter,
        topMargin=0.5*inch, bottomMargin=0.5*inch,
        leftMargin=0.6*inch, rightMargin=0.6*inch)
    doc.build(elements)
    print(f"Contact Directory PDF saved: {output}")

if __name__ == "__main__":
    build_directory()
