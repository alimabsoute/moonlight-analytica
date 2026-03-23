#!/usr/bin/env python3
"""
Tastyr IQ — Master CRM Builder
Parses all 11 research docs, assigns ranks/psychology/chains, outputs 24-column CSVs.
"""

import re
import csv
import os

DOCS_DIR = os.path.join(os.path.dirname(__file__), "docs")
CRM_DIR = os.path.join(os.path.dirname(__file__), "crm")

# Segment mapping: filename -> segment name
SEGMENT_MAP = {
    "research-angels.md": "Angel",
    "research-vcs.md": "VC",
    "research-pe.md": "PE",
    "research-accelerators.md": "Accelerator",
    "research-restaurateurs.md": "Restaurateur",
    "research-food-bloggers.md": "Food Blogger",
    "research-media-influencers.md": "Media",
    "research-university.md": "University",
    "research-connectors.md": "Founder-Connector",
    "research-food-industry.md": "Food Industry",
    "research-nj-de-suburbs.md": "NJ-DE-Suburb",
}

# Cialdini principles by segment
PSYCHOLOGY_MAP = {
    "Angel": {
        "angle": "Authority + Social Proof — Lead with UPenn, patent, App Store approval. 'Other angel groups in the ecosystem are already in conversations.'",
        "trigger": "Fear of missing a high-growth consumer tech deal in their own backyard. Local pride — wanting to back a Philly success story."
    },
    "VC": {
        "angle": "Authority + Scarcity — Patent-pending tech, first-mover in dish-level intelligence. 'Our round is structured for 5-8 investors and filling.'",
        "trigger": "Portfolio gap anxiety — no dish-level data company exists yet. Competitive pressure from other funds seeing this deal."
    },
    "PE": {
        "angle": "Authority + Commitment — Reference their food/consumer portfolio. 'You've built a thesis around food — here's the data layer that's missing.'",
        "trigger": "Strategic portfolio enhancement — dish intelligence as infrastructure for their restaurant/food investments."
    },
    "Accelerator": {
        "angle": "Reciprocity + Authority — Offer unique dataset for their program. 'We're further along than most applicants — live product, patent pending.'",
        "trigger": "Wanting to accept a standout company that raises their program's profile. Alumni success story potential."
    },
    "Restaurateur": {
        "angle": "Reciprocity + Scarcity — Give dish scores first, then invite to founding cohort. 'Only 50 spots — your competitors are already seeing their scores.'",
        "trigger": "Competitive curiosity — how do MY dishes compare? Pride in seeing high scores. Fear of being left out while competitors participate."
    },
    "Food Blogger": {
        "angle": "Scarcity + Social Proof — 'You'll be one of the first 5 people in Philly to use this. Other creators are already posting.'",
        "trigger": "First-mover content advantage. Fear of missing exclusive content while competitors get it. Desire to be seen as an industry insider."
    },
    "Media": {
        "angle": "Scarcity + Authority — 'Exclusive first-look under embargo. AI + food is the story of 2026.'",
        "trigger": "Fear of missing a breaking story. Desire to be first to cover a trend. Career advancement from a viral piece."
    },
    "University": {
        "angle": "Reciprocity + Unity — 'Fellow Penn alum offering research data access. Students get beta testing opportunity.'",
        "trigger": "Academic curiosity about novel food-tech dataset. Desire to connect students with real startups. Research publication potential."
    },
    "Founder-Connector": {
        "angle": "Unity + Reciprocity — 'Fellow Philly founder, would love your perspective. Happy to return the favor with intros.'",
        "trigger": "Pay-it-forward mentality. Pride in the Philly ecosystem. Desire to be associated with the next breakout company."
    },
    "Food Industry": {
        "angle": "Reciprocity + Authority — 'Dish intelligence data could help your restaurant clients. Let me show you the platform.'",
        "trigger": "Business value — offering clients differentiated insights. Partnership revenue potential. Being seen as innovative in their industry."
    },
    "NJ-DE-Suburb": {
        "angle": "Unity + Scarcity — 'We're expanding beyond Philly into your area. You're the key connector for [region].'",
        "trigger": "Local pride — putting their community on the food-tech map. Desire to be the go-to connector. Fear of missing the expansion wave."
    },
}

# Chain strategies by segment
CHAIN_MAP = {
    "Angel": "Connector Express + FOMO Cascade",
    "VC": "FOMO Cascade + NJ-to-NYC Bridge",
    "PE": "Connector Express (long-game)",
    "Accelerator": "Accelerator Fast-Track",
    "Restaurateur": "Restaurateur Gateway",
    "Food Blogger": "FOMO Cascade",
    "Media": "Media Momentum Engine",
    "University": "University Pipeline",
    "Founder-Connector": "Connector Express",
    "Food Industry": "Food Industry Backdoor",
    "NJ-DE-Suburb": "NJ-to-NYC Bridge + Restaurateur Gateway",
}

# Connection degree by segment
DEGREE_MAP = {
    "Angel": "1st",
    "VC": "1st",
    "PE": "2nd",
    "Accelerator": "2nd",
    "Restaurateur": "2nd",
    "Food Blogger": "3rd",
    "Media": "3rd",
    "University": "2nd",
    "Founder-Connector": "2nd",
    "Food Industry": "3rd",
    "NJ-DE-Suburb": "3rd",
}

def parse_markdown_contacts(filepath, segment):
    """Parse contacts from a research markdown file."""
    contacts = []
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    # Split on ## or ### headers that look like contact entries
    # Match patterns like "## 1. Name", "### 1. Name", "## Name"
    sections = re.split(r'\n#{2,3} (?:\d+\.\s*)?', content)

    for section in sections[1:]:  # skip first (header)
        lines = section.strip().split('\n')
        if not lines:
            continue

        # Extract name from first line
        name_line = lines[0].strip()
        # Clean up name - remove markdown links, brackets, anchors
        name = re.sub(r'\[([^\]]+)\]', r'\1', name_line)
        name = re.sub(r'\(.*?\)', '', name)
        name = re.sub(r'<.*?>', '', name)
        name = re.sub(r'@\S+', '', name)  # Remove @handles from name
        name = name.strip(' #*-—')

        if not name or len(name) < 2 or name.upper() == name.upper() and len(name) > 50:
            continue
        if any(skip in name.lower() for skip in ['table of contents', 'priority', 'outreach', 'summary', 'tier', 'research', 'notes', 'key findings', 'strategic', 'coverage', 'breakdown']):
            continue

        contact = {
            "Segment": segment,
            "Name": name,
            "Title/Role": "",
            "Organization": "",
            "City/State": "",
            "Email": "",
            "LinkedIn": "",
            "Other Social": "",
            "Phone": "",
            "Investment Focus / Expertise": "",
            "Check Size": "N/A" if segment not in ["Angel", "VC", "PE"] else "",
            "Notable Work": "",
            "Food/Tastyr Connection": "",
            "Why Contact This Person": "",
            "Psychological Angle": "",
            "Emotional Trigger": "",
            "Connection Degree": DEGREE_MAP.get(segment, "3rd"),
            "Warm Intro Path": "",
            "Rank": 0,
            "Chain Strategy": CHAIN_MAP.get(segment, ""),
            "Approach Strategy": "",
            "Custom Message Draft": "",
            "Status": "Not contacted",
            "Notes": "",
        }

        section_text = '\n'.join(lines)

        # Parse fields using **Key**: Value pattern
        field_patterns = {
            "Title/Role": [r'\*\*Title(?:/Role)?\*\*:\s*(.+?)(?:\n|$)', r'\*\*Title\*\*:\s*(.+?)(?:\n|$)', r'\*\*Current Role\*\*:\s*(.+?)(?:\n|$)', r'\*\*Role\*\*:\s*(.+?)(?:\n|$)'],
            "Organization": [r'\*\*Organization\*\*:\s*(.+?)(?:\n|$)', r'\*\*Firm\*\*:\s*(.+?)(?:\n|$)', r'\*\*Company(?:/Org)?\*\*:\s*(.+?)(?:\n|$)', r'\*\*Restaurant\(s\)\*\*:\s*(.+?)(?:\n|$)', r'\*\*Platform\(s\)\*\*:\s*(.+?)(?:\n|$)', r'\*\*Publication\*\*:\s*(.+?)(?:\n|$)', r'\*\*University\*\*:\s*(.+?)(?:\n|$)', r'\*\*Company\*\*:\s*(.+?)(?:\n|$)'],
            "City/State": [r'\*\*Location\*\*:\s*(.+?)(?:\n|$)'],
            "Email": [r'\*\*Email\*\*:\s*(.+?)(?:\n|$)'],
            "LinkedIn": [r'\*\*LinkedIn\*\*:\s*(.+?)(?:\n|$)'],
            "Other Social": [r'\*\*Instagram\*\*:\s*(.+?)(?:\n|$)', r'\*\*Twitter\*\*:\s*(.+?)(?:\n|$)', r'\*\*Handles?\*\*:\s*(.+?)(?:\n|$)', r'\*\*Other Social\*\*:\s*(.+?)(?:\n|$)'],
            "Investment Focus / Expertise": [r'\*\*Investment Focus(?:\s*/\s*Expertise)?\*\*:\s*(.+?)(?:\n|$)', r'\*\*Investment Focus\*\*:\s*(.+?)(?:\n|$)', r'\*\*Program Focus\*\*:\s*(.+?)(?:\n|$)', r'\*\*Research Focus\*\*:\s*(.+?)(?:\n|$)', r'\*\*Content Focus\*\*:\s*(.+?)(?:\n|$)', r'\*\*Coverage Focus\*\*:\s*(.+?)(?:\n|$)', r'\*\*Deal Size Range\*\*:\s*(.+?)(?:\n|$)'],
            "Check Size": [r'\*\*Check Size(?:\s*Range)?\*\*:\s*(.+?)(?:\n|$)', r'\*\*Check Size Range\*\*:\s*(.+?)(?:\n|$)', r'\*\*Fund Size\*\*:\s*(.+?)(?:\n|$)'],
            "Notable Work": [r'\*\*Notable (?:Investments|Portfolio|Achievements|Work|Alumni)\*\*:\s*(.+?)(?:\n|$)'],
            "Food/Tastyr Connection": [r'\*\*Food/Tastyr Connection\*\*:\s*(.+?)(?:\n|$)', r'\*\*Tastyr Relevance\*\*:\s*(.+?)(?:\n|$)', r'\*\*Food Connection\*\*:\s*(.+?)(?:\n|$)', r'\*\*Relevance to Tastyr\*\*:\s*(.+?)(?:\n|$)', r'\*\*Why They\'d Champion Tastyr\*\*:\s*(.+?)(?:\n|$)', r'\*\*Pitch Angle for Tastyr\*\*:\s*(.+?)(?:\n|$)'],
            "Warm Intro Path": [r'\*\*Warm Intro Path\*\*:\s*(.+?)(?:\n|$)', r'\*\*Intro Potential\*\*:\s*(.+?)(?:\n|$)'],
            "Notes": [r'\*\*Recent Activity\*\*:\s*(.+?)(?:\n|$)', r'\*\*Recent Work\*\*:\s*(.+?)(?:\n|$)'],
        }

        for field, patterns in field_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, section_text, re.IGNORECASE)
                if match:
                    val = match.group(1).strip()
                    if val and val != "(not publicly listed)" and val != "(not public)":
                        if field == "Other Social" and contact.get("Other Social"):
                            contact["Other Social"] += "; " + val
                        else:
                            contact[field] = val
                    break

        # Clean up LinkedIn - extract URL
        if contact["LinkedIn"] and "linkedin.com" not in contact["LinkedIn"].lower():
            if "search:" in contact["LinkedIn"].lower() or "not " in contact["LinkedIn"].lower():
                contact["LinkedIn"] = ""

        # Set check size for non-investors
        if segment not in ["Angel", "VC", "PE"] and not contact["Check Size"]:
            contact["Check Size"] = "N/A"

        # Skip entries that don't have a real name
        if len(contact["Name"]) < 3:
            continue

        contacts.append(contact)

    return contacts


def compute_rank(contact):
    """Compute 1-100 rank based on the formula."""
    segment = contact["Segment"]

    # Base scores by segment
    investor_potential = {
        "Angel": 80, "VC": 90, "PE": 40,
        "Accelerator": 60, "Restaurateur": 20,
        "Food Blogger": 5, "Media": 10,
        "University": 30, "Founder-Connector": 50,
        "Food Industry": 15, "NJ-DE-Suburb": 25,
    }.get(segment, 30)

    network_reach = {
        "Angel": 50, "VC": 70, "PE": 40,
        "Accelerator": 80, "Restaurateur": 60,
        "Food Blogger": 70, "Media": 80,
        "University": 60, "Founder-Connector": 90,
        "Food Industry": 50, "NJ-DE-Suburb": 40,
    }.get(segment, 40)

    fomo_multiplier = {
        "Angel": 30, "VC": 40, "PE": 20,
        "Accelerator": 50, "Restaurateur": 80,
        "Food Blogger": 95, "Media": 90,
        "University": 40, "Founder-Connector": 60,
        "Food Industry": 30, "NJ-DE-Suburb": 35,
    }.get(segment, 30)

    accessibility = {
        "Angel": 70, "VC": 40, "PE": 30,
        "Accelerator": 80, "Restaurateur": 60,
        "Food Blogger": 85, "Media": 70,
        "University": 75, "Founder-Connector": 80,
        "Food Industry": 65, "NJ-DE-Suburb": 70,
    }.get(segment, 50)

    timing = {
        "Angel": 70, "VC": 60, "PE": 30,
        "Accelerator": 80, "Restaurateur": 70,
        "Food Blogger": 90, "Media": 85,
        "University": 60, "Founder-Connector": 75,
        "Food Industry": 55, "NJ-DE-Suburb": 50,
    }.get(segment, 50)

    # Boost for food-specific mentions
    food_text = (contact.get("Food/Tastyr Connection", "") + " " +
                 contact.get("Notable Work", "") + " " +
                 contact.get("Investment Focus / Expertise", "")).lower()

    food_keywords = ["food", "restaurant", "dish", "culinary", "chef", "dining", "cuisine",
                     "meal", "eat", "kitchen", "menu", "taste", "flavor", "recipe",
                     "james beard", "michelin", "consumer", "marketplace", "delivery"]

    food_score = sum(3 for kw in food_keywords if kw in food_text)
    food_score = min(food_score, 15)  # cap boost

    # Boost for Philadelphia/local
    location = contact.get("City/State", "").lower()
    local_boost = 0
    if "philadelphia" in location or "philly" in location:
        local_boost = 8
    elif "pa" in location or "pennsylvania" in location:
        local_boost = 5
    elif "nj" in location or "new jersey" in location or "princeton" in location:
        local_boost = 3
    elif "de" in location or "delaware" in location or "wilmington" in location:
        local_boost = 2

    # Boost for having LinkedIn (accessibility)
    linkedin_boost = 3 if contact.get("LinkedIn") and "linkedin.com" in contact.get("LinkedIn", "") else 0

    # Compute weighted rank
    rank = (
        investor_potential * 0.30 +
        network_reach * 0.25 +
        fomo_multiplier * 0.20 +
        accessibility * 0.15 +
        timing * 0.10 +
        food_score +
        local_boost +
        linkedin_boost
    )

    # Normalize to 1-100
    rank = max(1, min(100, int(rank)))

    return rank


def generate_why_contact(contact):
    """Generate the 'Why Contact This Person' deep analysis."""
    segment = contact["Segment"]
    name = contact["Name"]
    org = contact.get("Organization", "their organization")
    food_conn = contact.get("Food/Tastyr Connection", "")
    focus = contact.get("Investment Focus / Expertise", "")
    location = contact.get("City/State", "")

    templates = {
        "Angel": f"{name} at {org} represents a direct investment opportunity. {food_conn[:200] if food_conn else f'Their focus on {focus[:100]} aligns with Tastyr IQ consumer-tech model.'} Located in {location}, they are embedded in the tri-state ecosystem and can provide both capital and local credibility.",
        "VC": f"{name} at {org} is a strategic VC target. {food_conn[:200] if food_conn else f'Their investment thesis in {focus[:100]} maps to Tastyr IQ market.'} Their portfolio and network could accelerate Tastyr's growth significantly beyond capital.",
        "PE": f"{name} at {org} represents a longer-term relationship target. {food_conn[:200] if food_conn else 'Their food/consumer portfolio creates strategic alignment.'} While PE timing may not match seed stage, building this relationship now pays dividends in future rounds.",
        "Accelerator": f"{name} at {org} can provide structured mentorship and investor access. {food_conn[:200] if food_conn else 'Their program track record demonstrates ability to accelerate food/consumer startups.'} Program acceptance creates instant credibility stamp for investor conversations.",
        "Restaurateur": f"{name} is a key social chain catalyst. {food_conn[:200] if food_conn else 'Their restaurant influence in the tri-state creates organic social proof.'} Their endorsement of Tastyr IQ would validate the platform for other restaurateurs AND signal market pull to investors.",
        "Food Blogger": f"{name} creates content that drives FOMO and awareness. {food_conn[:200] if food_conn else 'Their audience of food-obsessed followers is Tastyr IQ target demographic.'} Early beta access turns them into evangelists whose content creates the perception of unstoppable momentum.",
        "Media": f"{name} can generate press coverage that creates social proof for investor conversations. {food_conn[:200] if food_conn else 'Their beat covers exactly the intersection of food and technology.'} A single article from them reaches thousands of potential users, restaurateurs, and investors.",
        "University": f"{name} at {org} provides academic credibility and student beta tester pipeline. {food_conn[:200] if food_conn else 'Their research/program focus creates natural collaboration opportunity.'} University partnerships generate data, credibility, and warm intros to alumni investor networks.",
        "Founder-Connector": f"{name} is an ecosystem super-connector. {food_conn[:200] if food_conn else 'Their position in the startup community gives them access to investors, founders, and media.'} A single coffee meeting with them can generate 5-10 warm investor introductions.",
        "Food Industry": f"{name} at {org} touches hundreds of restaurants daily. {food_conn[:200] if food_conn else 'Their industry position gives them relationships with restaurant decision-makers at scale.'} Partnership creates distribution channel and validates Tastyr as industry-ready platform.",
        "NJ-DE-Suburb": f"{name} is the key connector for geographic expansion into {location}. {food_conn[:200] if food_conn else 'Their local influence opens doors in markets outside Philadelphia core.'} Geographic coverage ensures Tastyr demonstrates tri-state traction, not just Philly.",
    }

    return templates.get(segment, f"{name} is relevant to Tastyr IQ's outreach strategy based on their role at {org}.")


def generate_approach(contact):
    """Generate approach strategy."""
    segment = contact["Segment"]
    degree = contact["Connection Degree"]

    approaches = {
        "1st": f"Direct pitch with metrics. Lead with traction (2,490+ dishes, patent, App Store). Request 20-30 minute meeting. Include demo offer.",
        "2nd": f"Warm approach via shared network. Lead with value/advice request. Build relationship first, then introduce investment opportunity naturally.",
        "3rd": f"Exclusive access offer. Lead with what THEY get (beta access, exclusive data, first-look). Build engagement before any ask.",
        "4th": f"Social engagement first. Like/comment on their content. Attend their events. Build familiarity over 2-4 weeks before direct outreach.",
    }

    return approaches.get(degree, approaches["3rd"])


def generate_message(contact):
    """Generate a bespoke first-touch message draft."""
    name = contact["Name"].split()[0] if contact["Name"] else "there"
    segment = contact["Segment"]
    org = contact.get("Organization", "")
    food_conn = contact.get("Food/Tastyr Connection", "")
    location = contact.get("City/State", "")
    notable = contact.get("Notable Work", "")

    # Personalized hook based on what we know
    hook = ""
    if notable:
        hook = f"I've been following your work with {notable[:80]}. "
    elif org:
        hook = f"Your role at {org} caught my attention. "

    if segment in ["Angel", "VC"]:
        return f"Hi {name}, {hook}I'm Ali Mabsoute, CMO of Tastyr IQ — we've built an AI platform that rates individual dishes, not restaurants. 2,490+ dishes scored, patent pending, App Store live. We're raising a seed round and prioritizing investors who understand the food ecosystem. Would love to share a 20-min demo. Best, Ali (UPenn, 15yr Philly)"
    elif segment == "PE":
        return f"Hi {name}, {hook}I'm building Tastyr IQ — AI-powered dish intelligence for the $371B restaurant industry. While we're at seed stage now, I'd love to build a relationship given your food/consumer portfolio. Coffee sometime? — Ali Mabsoute, Tastyr IQ"
    elif segment == "Accelerator":
        return f"Hi {name}, {hook}I'm Ali Mabsoute, co-founder of Tastyr IQ — AI dish ratings across 9 verticals. We're live on the App Store with 2,490+ dishes and patent pending. I think {org} would be a perfect fit. Can we grab coffee? — Ali"
    elif segment == "Restaurateur":
        return f"Hi {name}, {hook}I'm building an AI platform that scores individual dishes across Philadelphia. Your dishes are trending in our data — I'd love to share your scores (no strings attached). We're also inviting select restaurants into our Founding Cohort. Interested? — Ali Mabsoute, Tastyr IQ"
    elif segment == "Food Blogger":
        return f"Hey {name}, {hook}I want to offer you exclusive beta access to Tastyr IQ — an AI app that scores individual dishes — before it's available to anyone else. You'd be one of the first 5 people in Philly to use this. Imagine showing your followers which dishes at any restaurant actually score highest. Interested? — Ali, Tastyr IQ"
    elif segment == "Media":
        return f"Hi {name}, {hook}Quick pitch: Tastyr IQ is an AI platform that rates individual dishes (not restaurants) — 2,490+ Philly dishes scored, patent pending, App Store live. I can offer an exclusive first-look before public launch. Happy to chat on/off record. — Ali Mabsoute, Tastyr IQ"
    elif segment == "University":
        return f"Hi {name}, {hook}I'm Ali Mabsoute (UPenn), co-founder of Tastyr IQ — AI dish ratings across 9 food verticals. Our dataset of 2,490+ scored dishes could be valuable for research. I'd love to explore a partnership — data access for your students, collaboration on food-tech research. Can we meet? — Ali"
    elif segment == "Founder-Connector":
        return f"Hey {name}, {hook}I'm Ali, fellow Philly founder building Tastyr IQ (AI dish ratings). I've been in Philly 15 years and admire what you've done in the ecosystem. Could I buy you coffee and get 20 minutes? I'd love your take on fundraising in this market. — Ali Mabsoute"
    elif segment == "Food Industry":
        return f"Hi {name}, {hook}Tastyr IQ is an AI platform that scores individual dishes — data that could help your restaurant clients optimize their menus. We've scored 2,490+ dishes across Philadelphia. I'd love to explore how we could work together. 15 minutes? — Ali Mabsoute, Tastyr IQ"
    else:
        return f"Hi {name}, {hook}I'm Ali Mabsoute, building Tastyr IQ — AI-powered dish intelligence. We're expanding across the tri-state and I'd love to connect about the food scene in your area. Quick call? — Ali"


def main():
    all_contacts = []

    for filename, segment in SEGMENT_MAP.items():
        filepath = os.path.join(DOCS_DIR, filename)
        if not os.path.exists(filepath):
            print(f"WARNING: {filepath} not found, skipping")
            continue

        contacts = parse_markdown_contacts(filepath, segment)
        print(f"Parsed {len(contacts)} contacts from {filename} ({segment})")
        all_contacts.extend(contacts)

    # Compute ranks and fill psychology columns
    for contact in all_contacts:
        contact["Rank"] = compute_rank(contact)
        psych = PSYCHOLOGY_MAP.get(contact["Segment"], {})
        contact["Psychological Angle"] = psych.get("angle", "")
        contact["Emotional Trigger"] = psych.get("trigger", "")
        contact["Why Contact This Person"] = generate_why_contact(contact)
        contact["Approach Strategy"] = generate_approach(contact)
        contact["Custom Message Draft"] = generate_message(contact)

    # Sort by rank descending
    all_contacts.sort(key=lambda c: c["Rank"], reverse=True)

    # CSV columns
    columns = [
        "Segment", "Name", "Title/Role", "Organization", "City/State",
        "Email", "LinkedIn", "Other Social", "Phone",
        "Investment Focus / Expertise", "Check Size", "Notable Work", "Food/Tastyr Connection",
        "Why Contact This Person", "Psychological Angle", "Emotional Trigger",
        "Connection Degree", "Warm Intro Path", "Rank", "Chain Strategy",
        "Approach Strategy", "Custom Message Draft", "Status", "Notes",
    ]

    # Write master CRM
    master_path = os.path.join(CRM_DIR, "master-crm.csv")
    with open(master_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=columns)
        writer.writeheader()
        for contact in all_contacts:
            writer.writerow({col: contact.get(col, "") for col in columns})
    print(f"\nMaster CRM: {len(all_contacts)} contacts written to {master_path}")

    # Write tier-filtered CSVs
    tier1 = [c for c in all_contacts if c["Rank"] >= 70]
    tier2 = [c for c in all_contacts if 40 <= c["Rank"] < 70]
    tier3 = [c for c in all_contacts if c["Rank"] < 40]

    for tier_contacts, tier_name, tier_file in [
        (tier1, "Tier 1 (Rank 70-100)", "tier1-immediate.csv"),
        (tier2, "Tier 2 (Rank 40-69)", "tier2-next-wave.csv"),
        (tier3, "Tier 3 (Rank 1-39)", "tier3-long-game.csv"),
    ]:
        tier_path = os.path.join(CRM_DIR, tier_file)
        with open(tier_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=columns)
            writer.writeheader()
            for contact in tier_contacts:
                writer.writerow({col: contact.get(col, "") for col in columns})
        print(f"{tier_name}: {len(tier_contacts)} contacts -> {tier_file}")

    # Summary stats
    print(f"\n{'='*60}")
    print(f"TOTAL CONTACTS: {len(all_contacts)}")
    print(f"{'='*60}")
    print(f"Tier 1 (70-100): {len(tier1)} contacts")
    print(f"Tier 2 (40-69):  {len(tier2)} contacts")
    print(f"Tier 3 (1-39):   {len(tier3)} contacts")
    print(f"\nBy Segment:")
    for seg in SEGMENT_MAP.values():
        count = sum(1 for c in all_contacts if c["Segment"] == seg)
        print(f"  {seg}: {count}")


if __name__ == "__main__":
    main()
