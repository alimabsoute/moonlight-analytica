#!/usr/bin/env python3
"""Tastyr IQ — Critical Analysis PDF Builder"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import os

NAVY = HexColor('#0A1A2F')
GOLD = HexColor('#D4A534')
BLUE = HexColor('#3A7CD5')
RED = HexColor('#C0392B')
GREEN = HexColor('#27AE60')
ORANGE = HexColor('#E67E22')
LIGHT_BG = HexColor('#F5F5F5')
GRAY = HexColor('#888888')

def build():
    base = os.path.dirname(__file__)
    output = os.path.join(base, "strategy", "tastyr-iq-critical-analysis.pdf")

    # Read the markdown content
    md_path = os.path.join(base, "strategy", "critical-analysis.md")
    with open(md_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Styles
    title_s = ParagraphStyle('Title', fontSize=32, textColor=NAVY, alignment=TA_CENTER, fontName='Helvetica-Bold', spaceAfter=6)
    subtitle_s = ParagraphStyle('Sub', fontSize=16, textColor=BLUE, alignment=TA_CENTER, spaceAfter=6)
    h1_s = ParagraphStyle('H1', fontSize=22, textColor=NAVY, fontName='Helvetica-Bold', spaceBefore=20, spaceAfter=10)
    h2_s = ParagraphStyle('H2', fontSize=16, textColor=BLUE, fontName='Helvetica-Bold', spaceBefore=14, spaceAfter=6)
    h3_s = ParagraphStyle('H3', fontSize=13, textColor=HexColor('#2C3E50'), fontName='Helvetica-Bold', spaceBefore=10, spaceAfter=4)
    body_s = ParagraphStyle('Body', fontSize=10, leading=14, spaceAfter=6, fontName='Helvetica')
    bold_s = ParagraphStyle('Bold', fontSize=10, leading=14, spaceAfter=6, fontName='Helvetica-Bold')
    italic_s = ParagraphStyle('Italic', fontSize=10, leading=14, spaceAfter=6, fontName='Helvetica-Oblique', textColor=GRAY)
    bullet_s = ParagraphStyle('Bullet', fontSize=10, leading=13, spaceAfter=3, leftIndent=20, fontName='Helvetica')
    red_s = ParagraphStyle('Red', fontSize=10, leading=14, spaceAfter=6, fontName='Helvetica-Bold', textColor=RED)
    green_s = ParagraphStyle('Green', fontSize=10, leading=14, spaceAfter=6, fontName='Helvetica-Bold', textColor=GREEN)
    center_s = ParagraphStyle('Center', fontSize=11, alignment=TA_CENTER, spaceAfter=6)
    quote_s = ParagraphStyle('Quote', fontSize=11, leading=15, leftIndent=30, rightIndent=30, fontName='Helvetica-Oblique', textColor=HexColor('#555555'), spaceBefore=8, spaceAfter=8)

    elements = []

    # COVER
    elements.append(Spacer(1, 1.5*inch))
    elements.append(Paragraph("TASTYR IQ", title_s))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(HRFlowable(width="50%", thickness=2, color=RED))
    elements.append(Spacer(1, 0.2*inch))
    elements.append(Paragraph("Critical Analysis", ParagraphStyle('x', fontSize=24, textColor=RED, alignment=TA_CENTER, fontName='Helvetica-Bold')))
    elements.append(Spacer(1, 0.15*inch))
    elements.append(Paragraph("Assumptions, Blind Spots & Hedging Strategies", subtitle_s))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("A Brutally Honest Assessment for Nik &amp; Ali", center_s))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("What we're getting right. What could kill us. What to do about it.", italic_s))
    elements.append(Spacer(1, 1.5*inch))
    elements.append(Paragraph("March 2026 | Confidential", ParagraphStyle('d', fontSize=11, textColor=GRAY, alignment=TA_CENTER)))
    elements.append(PageBreak())

    # TABLE OF CONTENTS
    elements.append(Paragraph("TABLE OF CONTENTS", h1_s))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))
    toc = [
        ("Part 1", "Assumptions You Are Making", "10 critical assumptions examined"),
        ("Part 2", "Information That Would Change Everything", "5 unknown variables"),
        ("Part 3", "Biggest Flaws in Strategy, Product & Execution", "7 flaws with fixes"),
        ("Part 4", "Competitive Threats & Hedging", "Threat matrix with hedging strategies"),
        ("Part 5", "What to Do This Week", "Honest priority list"),
        ("Part 6", "The Bottom Line", "Strengths, weaknesses, final assessment"),
    ]
    for part, title, desc in toc:
        elements.append(Paragraph(f"<b>{part}: {title}</b>", ParagraphStyle('toc', fontSize=12, fontName='Helvetica-Bold', spaceBefore=8)))
        elements.append(Paragraph(desc, ParagraphStyle('tocd', fontSize=10, textColor=GRAY, leftIndent=20)))
    elements.append(PageBreak())

    # PART 1: ASSUMPTIONS
    elements.append(Paragraph("PART 1: ASSUMPTIONS YOU ARE MAKING", h1_s))
    elements.append(HRFlowable(width="100%", thickness=1, color=RED))
    elements.append(Paragraph("Every strategy is built on assumptions. Here are the ones embedded in yours — some valid, some dangerous.", body_s))

    assumptions = [
        ("Assumption 1: Dish Ratings Are Meaningfully Different from Restaurant Ratings",
         "You believe the dish-level lens creates a new product category.",
         "Consumers may not perceive a meaningful difference. When someone opens Yelp, they already read about specific dishes in reviews. The mental model 'I want a good place to eat' may be stronger than 'I want a good dish to order.'",
         "Validate with real beta users. Find the 'aha moment' — the scenario where dish-level data changes behavior. If consumer pull is weak, pivot pitch to B2B first: restaurants paying for dish-level menu analytics."),

        ("Assumption 2: 2,490 Dishes = Meaningful Traction",
         "Having 2,490+ indexed dishes demonstrates a data moat.",
         "Philadelphia has ~4,000 restaurants with 20+ items each = 80,000+ dishes. You've indexed ~3%. An investor doing back-of-envelope math will see this.",
         "Reframe: '9 vertical AI models trained and validated' not '2,490 dishes.' Set clear target: 50,000 dishes in 90 days post-funding. Be transparent about data quality."),

        ("Assumption 3: Patent Pending = Defensible Moat",
         "Patent protects from competition and creates investor confidence.",
         "Software patents are notoriously hard to defend post-Alice Corp v. CLS Bank (2014). Even if granted, enforcement costs $2-5M. 'Patent pending' means filed, not granted.",
         "Lead with REAL moats: first-mover data accumulation, vertical AI models, restaurant relationships, brand association. Patent is supporting evidence, not headline."),

        ("Assumption 4: Philadelphia Is the Right Launch City",
         "Philly's food scene + Ali's network = ideal market.",
         "Philly is 6th largest US city but lacks tech investor density of SF/NYC. 'We're a Philly startup' can read as 'small market startup' to coastal VCs.",
         "Position as STRATEGIC: 'Highest James Beard concentration per capita, lower CAC than NYC, perfect proof-of-concept market.' Run waitlist nationally. Get early NYC traction."),

        ("Assumption 5: Influencers Will Promote for Free",
         "Exclusive beta access is enough to drive influencer content.",
         "In 2026, influencers with 50K+ followers expect $200-$2,000 per post. 'Exclusive beta' isn't payment. If the influencer chain fails, FOMO Cascade collapses.",
         "Budget $2-5K for micro-influencer partnerships. Target nano-influencers (1K-10K). Create 'Tastyr Ambassador' program. Have Ali create his own content as backup."),

        ("Assumption 6: CRM Strategy Will Convert",
         "309 contacts with bespoke messaging will generate enough meetings.",
         "Realistic: 118 investor-class contacts × 40% warm meeting rate × 5-10% term sheet conversion = 2-5 meetings → maybe 1 term sheet. Math works but barely.",
         "Apply to national accelerators simultaneously. Consider AngelList Rolling Funds or Republic. Have Plan B raise amount ($250K)."),

        ("Assumption 7: We Have Time Because of Our Moats",
         "Patent + first-mover + 2,490 dishes = competitors can't catch up.",
         "2,490 dishes can be replicated in WEEKS via web scraping + NLP. Yelp already HAS this data. Google is experimenting with dish features. DoorDash has order-level data.",
         "Move faster on user acquisition. Landing page + waitlist this week is right. Set deadline: 1,000 waitlist signups in 30 days or reassess."),

        ("Assumption 8: FOMO Will Close the Round",
         "Buzz → media → social proof → investors competing for allocation.",
         "Most seed rounds close because a LEAD investor says yes. You need ONE committed angel/VC who writes $100-250K. Everyone else follows.",
         "Find the lead investor first. Generate user data before investor meetings. Consider revenue traction: even $500/month from 5 restaurants is powerful."),

        ("Assumption 9: Desktop/Android Expansion Is Straightforward",
         "Cross-platform is a near-term task.",
         "If native iOS (Swift), Android is 3-6 months of dev work. With 2 founders and no employees, who builds this while also fundraising?",
         "PWA is fastest path to desktop. Delay Android until after seed closes. 'iOS first, Android Q3 2026' is standard. Waitlist captures cross-platform demand."),

        ("Assumption 10: Non-Investors Are Equally Important",
         "Food bloggers, restaurateurs, media are critical to social chains.",
         "This is CORRECT. But Ali cannot simultaneously run outreach to 148 Tier 1 contacts, onboard influencers, pitch media, apply to accelerators, AND build a landing page.",
         "Ruthless prioritization: Week 1 = landing page + 5 influencers + 3 investor emails. Consider part-time VA ($15-20/hr) for outreach admin."),
    ]

    for title, belief, risk, hedge in assumptions:
        elements.append(Paragraph(title, h2_s))
        elements.append(Paragraph(f"<b>What you believe:</b> {belief}", body_s))
        elements.append(Paragraph(f"<b>The risk:</b> {risk}", body_s))
        elements.append(Paragraph(f"<b>Hedge:</b> {hedge}", body_s))

    elements.append(PageBreak())

    # PART 2: UNKNOWN VARIABLES
    elements.append(Paragraph("PART 2: INFORMATION THAT WOULD CHANGE EVERYTHING", h1_s))
    elements.append(HRFlowable(width="100%", thickness=1, color=RED))
    elements.append(Paragraph("These unknowns, if answered, would fundamentally alter the strategy.", body_s))

    unknowns = [
        ("User Engagement Data", "How do actual users interact? Session duration, return rate, DAU/MAU, drop-off points, NPS?",
         "If users open once and never return, the product thesis is wrong. If they love it, investors fight to get in.",
         "Launch beta with Mixpanel/Amplitude. Get 100 users. Measure 2 weeks. THEN pitch investors."),
        ("Revenue Willingness", "Will restaurants pay for dish analytics? Will consumers pay $4.99/month?",
         "If neither segment pays, you need a different monetization strategy entirely.",
         "Get 3-5 restaurateurs to verbally commit to a price. Put a premium toggle in the app to measure intent."),
        ("Data Quality Validation", "How accurate are dish scores? Validated against expert opinion or ordering behavior?",
         "An investor will ask: 'How do you know 94/100 is actually better than 71/100?'",
         "Run validation: 10 food experts rate 50 dishes, compare to Tastyr scores. Correlation >0.7 = powerful proof."),
        ("Competitive Intelligence", "Is anyone else building dish-level intelligence? What are Google/Yelp/DoorDash doing internally?",
         "If Google announces dish ratings in Maps, your pitch changes from 'first' to 'competing with Google.'",
         "Monitor product updates weekly. Set Google Alerts. If competitor launches: ACCELERATE, don't panic."),
        ("Actual Network Depth", "Of 309 CRM contacts, how many does Ali ACTUALLY know? How many are truly warm?",
         "If 80% are cold-with-warm-labels, conversion drops to cold rates (2-5%).",
         "Tag every contact: 'Know personally' / 'Connected online' / 'Know of' / 'Stranger.' Reprioritize."),
    ]

    for title, what, why, do in unknowns:
        elements.append(Paragraph(title, h2_s))
        elements.append(Paragraph(f"<b>Unknown:</b> {what}", body_s))
        elements.append(Paragraph(f"<b>Why it changes everything:</b> {why}", body_s))
        elements.append(Paragraph(f"<b>What to do:</b> {do}", body_s))

    elements.append(PageBreak())

    # PART 3: BIGGEST FLAWS
    elements.append(Paragraph("PART 3: BIGGEST FLAWS", h1_s))
    elements.append(HRFlowable(width="100%", thickness=1, color=RED))

    flaws = [
        ("Flaw 1: No User Data to Back the Pitch",
         "Asking investors to fund a product with no engagement metrics. 'App Store approved' is not traction.",
         "Delay major investor outreach 2-3 weeks. Get 50-100 beta users. Measure DAU, retention, sessions. Pitch with: '100 beta users, 40% weekly retention.'"),
        ("Flaw 2: Two-Person Team, No Employees",
         "No one handles ops, support, content, social, analytics, or investor relations. 309-contact outreach is a full-time job.",
         "Hire part-time ops/marketing assistant ($2-3K/mo). Use AI tools for drafts. One founder must go full-time before raising."),
        ("Flaw 3: No Revenue or Revenue Experiment",
         "Three revenue streams identified but none tested. 2026 investors expect at least revenue experiments at seed.",
         "Offer 5 restaurants free 30-day dashboard trial. Put premium toggle in app. Approach one delivery platform about data licensing."),
        ("Flaw 4: FOMO Strategy Has Single Points of Failure",
         "If influencers don't post, the cascade collapses. Media doesn't pick up. No FOMO. Cold investor meetings.",
         "Run all 8 chains simultaneously. Ali creates own content. Consider $2-5K/mo PR agency for media relationships."),
        ("Flaw 5: Geographic Limitation for a Digital Product",
         "Enormous energy on tri-state networking for a digital product. Waitlist should be national.",
         "CRM strategy is right for FUNDRAISING. For USER ACQUISITION, go digital-first. Product Hunt, Hacker News, Reddit. Waitlist is geography-agnostic."),
        ("Flaw 6: Scoring Algorithm Transparency Gap",
         "If scores are a black box, restaurants will challenge negatives. 'How did my signature dish get 62/100?' = PR crisis.",
         "Develop explainable methodology. Show score components. Have dispute mechanism. Initially only show HIGH scores publicly."),
        ("Flaw 7: Cold Start Problem Underestimated",
         "2,490 dishes means most Philly restaurants have zero dishes indexed. Users who search and find nothing will churn.",
         "Prioritize breadth: 1-2 dishes at EVERY restaurant. Use 'Preliminary score' labels. Add 'Nominate a dish' feature. Restaurant cohort fills gaps."),
    ]

    for title, problem, fix in flaws:
        elements.append(Paragraph(title, h2_s))
        elements.append(Paragraph(f"<b>Problem:</b> {problem}", body_s))
        elements.append(Paragraph(f"<b>Fix:</b> {fix}", body_s))

    elements.append(PageBreak())

    # PART 4: THREAT MATRIX
    elements.append(Paragraph("PART 4: COMPETITIVE THREATS &amp; HEDGING", h1_s))
    elements.append(HRFlowable(width="100%", thickness=1, color=RED))

    threat_data = [
        ['Threat', 'Probability', 'Impact', 'Hedge Strategy'],
        ['Google Maps dish ratings', 'HIGH', 'EXISTENTIAL', 'Move fast on relationships + community. Position as premium/curated.'],
        ['Yelp "Top Dishes" feature', 'MEDIUM', 'HIGH', 'Target younger demo. AI-native positioning vs. legacy platform.'],
        ['DoorDash/UberEats dish analytics', 'MEDIUM', 'HIGH', 'They optimize for delivery. You optimize for consumer. Different use case.'],
        ['Well-funded startup clone', 'LOW-MED', 'MEDIUM', 'Speed + relationships + community. First to 100K users wins.'],
        ['Restaurant pushback on scores', 'MED-HIGH', 'MEDIUM', 'Show only positive scores initially. Give restaurants dashboard first.'],
        ['Investor market downturn', 'LOW-MED', 'HIGH', 'Keep burn at zero. Have bootstrap path to 10K users with no funding.'],
        ['Influencer strategy failure', 'MEDIUM', 'HIGH', 'Budget for paid partnerships. Ali creates own content. PR agency backup.'],
        ['Scoring accuracy challenges', 'MEDIUM', 'HIGH', 'Validation study. Explainable methodology. Dispute resolution process.'],
    ]

    t = Table(threat_data, colWidths=[1.8*inch, 0.9*inch, 0.9*inch, 2.9*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), HexColor('#FFFFFF')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, HexColor('#CCCCCC')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#FFFFFF'), LIGHT_BG]),
    ]))
    elements.append(t)
    elements.append(PageBreak())

    # PART 5: THIS WEEK
    elements.append(Paragraph("PART 5: WHAT TO DO THIS WEEK", h1_s))
    elements.append(HRFlowable(width="100%", thickness=1, color=GREEN))
    elements.append(Paragraph("Given everything above, here is the honest priority list:", body_s))

    priorities = [
        ("1. Landing page + waitlist", "Ali, THIS WEEK. Most important asset. Validates demand. Creates email list. National, not just Philly."),
        ("2. Get 50 beta users", "Both founders. Personal network. Friends, family, food-obsessed colleagues. Measure engagement for 2 weeks."),
        ("3. Tag the CRM honestly", "Mark every contact: 'know personally,' 'connected online,' 'stranger.' Reprioritize based on actual warmth."),
        ("4. Three restaurateur conversations", "Not pitches. Conversations. 'What would dish-level data be worth to you?' Validate B2B hypothesis."),
        ("5. Set up analytics", "Nik. Mixpanel/Amplitude in the app. Cannot pitch investors without user engagement data."),
        ("6. One investor email", "Ali. Pick the single warmest angel contact. Send one email. Start the fundraising clock."),
    ]

    for title, desc in priorities:
        elements.append(Paragraph(f"<b>{title}</b>", h3_s))
        elements.append(Paragraph(desc, body_s))

    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("<b>Everything else — influencer outreach, media pitches, accelerator applications, university partnerships — is Week 2+.</b>", red_s))

    elements.append(PageBreak())

    # PART 6: BOTTOM LINE
    elements.append(Paragraph("PART 6: THE BOTTOM LINE", h1_s))
    elements.append(HRFlowable(width="100%", thickness=1, color=GOLD))

    elements.append(Paragraph("What You Have Going For You", h2_s))
    strengths = [
        "Fully built product (iOS live, App Store approved) — most startups at seed have a deck and a dream",
        "Patent pending — imperfect but more than most competitors",
        "Strong founder profiles — UPenn, Hyatt/Citi/AmEx, real professional credibility",
        "Clear market gap — nobody is doing dish-level intelligence well",
        "Near-zero burn rate — infinite runway to iterate",
        "Passionate founding team — building this because you care about food, not because it's trendy",
        "Comprehensive outreach strategy (309 contacts, 8 social chains, 12 segments)",
    ]
    for s in strengths:
        elements.append(Paragraph(f"+ {s}", ParagraphStyle('str', fontSize=10, textColor=GREEN, leftIndent=15, spaceAfter=4)))

    elements.append(Paragraph("What You Need to Fix", h2_s))
    fixes = [
        "User engagement data (#1 gap — fix before major investor outreach)",
        "Revenue validation (even small experiments prove monetization)",
        "Realistic assessment of network warmth (tag every CRM contact honestly)",
        "Faster execution on landing page + waitlist (this week, not next week)",
        "Honest scoring methodology transparency (explainable, disputable)",
        "Cold start problem (breadth of coverage > depth of scoring)",
    ]
    for f in fixes:
        elements.append(Paragraph(f"- {f}", ParagraphStyle('fix', fontSize=10, textColor=RED, leftIndent=15, spaceAfter=4)))

    elements.append(Paragraph("What You Need to Accept", h2_s))
    accepts = [
        "The FOMO strategy is creative but fragile. Have backup plans for every chain.",
        "2,490 dishes is a start, not a moat. Move fast on data volume.",
        "'Not in a huge rush' is dangerous thinking. You're in a race you might not see yet.",
        "The biggest risk isn't competition — it's indifference. If users don't care about dish ratings, nothing else matters.",
        "One lead investor saying yes matters more than 100 warm intros.",
    ]
    for a in accepts:
        elements.append(Paragraph(f"  {a}", ParagraphStyle('acc', fontSize=10, textColor=ORANGE, leftIndent=15, spaceAfter=4, fontName='Helvetica-Oblique')))

    elements.append(Spacer(1, 0.5*inch))
    elements.append(HRFlowable(width="60%", thickness=2, color=NAVY))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("The best startups are brutally honest about their weaknesses while still having the conviction to build anyway. You have conviction. Now pair it with speed and data.", quote_s))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph('"The best time to find your blind spots is before investors find them for you."', ParagraphStyle('final', fontSize=13, alignment=TA_CENTER, fontName='Helvetica-Bold', textColor=NAVY)))

    # Build
    doc = SimpleDocTemplate(output, pagesize=letter, topMargin=0.6*inch, bottomMargin=0.6*inch, leftMargin=0.7*inch, rightMargin=0.7*inch)
    doc.build(elements)
    print(f"PDF saved: {output}")

if __name__ == "__main__":
    build()
