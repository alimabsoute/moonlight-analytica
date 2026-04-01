#!/usr/bin/env python3
"""
generate_notebooklm.py — Parse the Book of Secret Knowledge README
and output a clean markdown file for NotebookLM import.
"""

import re
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
README_PATH = os.path.join(SCRIPT_DIR, "..", "bosk-readme.md")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "book-of-secret-knowledge-notebooklm.md")

# Ali's project context for NotebookLM
ALI_CONTEXT = """# The Book of Secret Knowledge — Full Resource Index

> Curated from [trimstray/the-book-of-secret-knowledge](https://github.com/trimstray/the-book-of-secret-knowledge) (212k+ stars).
> This document contains all 1,100+ tools, one-liners, tricks, and resources organized for AI-assisted Q&A.

---

## Ali's Active Projects (for context-aware recommendations)

When answering questions like "which tools help with X?", use this project context:

| Project | Stack | Keywords |
|---------|-------|----------|
| **Moonlight Analytica** | HTML/CSS, Vercel, SEO | web, html, css, ssl, dns, seo, deploy, vercel, cdn, performance, analytics |
| **Janus Demo** | Python, Flask, OpenCV, SQLite | python, flask, opencv, video, camera, detection, docker, debug, sqlite, api, process, tracking |
| **PhynxTimer** | React, Supabase, PostgreSQL, Stripe | react, supabase, postgres, auth, saas, stripe, api, database, migration, timer |
| **ForkFox** | React, Three.js, Vercel | react, three, 3d, animation, landing, vercel, deploy, restaurant, ai |
| **Caposeo** | React, Supabase, Stripe, SEO | seo, react, supabase, stripe, charts, analytics, crawl, scrape, api, keywords |
| **Robinhood Trading** | Python, Pandas, Streamlit | python, pandas, data, api, streamlit, automation, cron, schedule, json, trading |

---

"""


def clean_emoji(text):
    """Remove GitHub emoji shortcodes like :black_small_square:"""
    return re.sub(r':[a-z_]+:', '', text).strip()


def parse_tool_entry(line):
    """Parse a tool entry line: <a href="URL"><b>Name</b></a> - description"""
    m = re.search(
        r'<a\s+href="([^"]+)"[^>]*>\s*<b>([^<]+)</b>\s*</a>\s*[-–—]\s*(.+)',
        line, re.IGNORECASE
    )
    if m:
        url = m.group(1).strip()
        name = m.group(2).strip()
        desc = re.sub(r'<[^>]+>', '', m.group(3)).strip()
        desc = desc.rstrip('.')
        return name, url, desc
    return None


def parse_readme(filepath):
    """Parse the full README into structured sections."""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    sections = []
    current_h2 = None  # #### level (main chapters)
    current_h3 = None  # ##### level (subcategories)
    current_tool_section = None  # ##### Tool: [name] for one-liners
    current_oneliner_title = None
    in_code_block = False
    code_lines = []
    bullet_params = []

    i = 0
    while i < len(lines):
        line = lines[i].rstrip('\n')

        # Track code blocks
        if line.strip().startswith('```'):
            if in_code_block:
                # End of code block
                in_code_block = False
                if current_tool_section and current_oneliner_title:
                    sections.append({
                        'type': 'oneliner',
                        'chapter': current_h2 or 'Shell One-liners',
                        'tool': current_tool_section,
                        'title': current_oneliner_title,
                        'code': '\n'.join(code_lines),
                        'lang': code_lang,
                    })
                code_lines = []
            else:
                in_code_block = True
                code_lang = line.strip().lstrip('`').strip() or 'bash'
                code_lines = []
            i += 1
            continue

        if in_code_block:
            code_lines.append(line)
            i += 1
            continue

        # Main chapter: #### CLI Tools, #### GUI Tools, etc.
        h2_match = re.match(r'^####\s+(.+?)(?:\s+&nbsp;|\s*\[)', line)
        if h2_match:
            current_h2 = clean_emoji(h2_match.group(1)).strip()
            current_h3 = None
            current_tool_section = None
            i += 1
            continue

        # Subcategory: ##### :black_small_square: Network
        h3_match = re.match(r'^#####\s+:black_small_square:\s+(.+)', line)
        if h3_match:
            current_h3 = h3_match.group(1).strip()
            current_tool_section = None
            i += 1
            continue

        # One-liner tool section: ##### Tool: [name](url)
        tool_match = re.match(r'^#####\s+Tool:\s+\[([^\]]+)\]', line)
        if tool_match:
            current_tool_section = tool_match.group(1).strip()
            current_oneliner_title = None
            i += 1
            continue

        # One-liner sub-heading: ###### Title
        oneliner_title = re.match(r'^######\s+(.+)', line)
        if oneliner_title:
            current_oneliner_title = oneliner_title.group(1).strip()
            i += 1
            continue

        # Tool entry in a <p> block
        entry = parse_tool_entry(line)
        if entry:
            name, url, desc = entry
            sections.append({
                'type': 'tool',
                'chapter': current_h2 or 'Uncategorized',
                'subcategory': current_h3 or 'General',
                'name': name,
                'url': url,
                'description': desc,
            })
            i += 1
            continue

        i += 1

    return sections


def generate_markdown(sections):
    """Generate the NotebookLM markdown output."""
    output = [ALI_CONTEXT]

    # Group tools by chapter > subcategory
    chapters = {}
    oneliners = {}
    tool_count = 0
    oneliner_count = 0

    for item in sections:
        if item['type'] == 'tool':
            ch = item['chapter']
            sub = item['subcategory']
            chapters.setdefault(ch, {}).setdefault(sub, []).append(item)
            tool_count += 1
        elif item['type'] == 'oneliner':
            tool = item['tool']
            oneliners.setdefault(tool, []).append(item)
            oneliner_count += 1

    # Emit tool sections
    for chapter, subs in chapters.items():
        output.append(f"\n## {chapter}\n")
        for sub, tools in subs.items():
            output.append(f"\n### {sub}\n")
            for t in tools:
                output.append(f"- **[{t['name']}]({t['url']})** — {t['description']}")

    # Emit shell one-liners
    output.append("\n\n---\n")
    output.append("\n## Shell One-liners & Commands\n")
    output.append("Practical shell commands organized by tool.\n")

    for tool, items in oneliners.items():
        output.append(f"\n### {tool}\n")
        for item in items:
            output.append(f"\n**{item['title']}**\n")
            output.append(f"```{item['lang']}")
            output.append(item['code'])
            output.append("```\n")

    # Stats footer
    output.append("\n---\n")
    output.append(f"\n*Total: {tool_count} tools/resources + {oneliner_count} shell one-liners*\n")

    return '\n'.join(output)


def main():
    if not os.path.exists(README_PATH):
        print(f"ERROR: README not found at {README_PATH}")
        print("Place bosk-readme.md in the parent directory or update README_PATH.")
        return

    print(f"Parsing {README_PATH}...")
    sections = parse_readme(README_PATH)

    tools = [s for s in sections if s['type'] == 'tool']
    oneliners = [s for s in sections if s['type'] == 'oneliner']
    print(f"  Found {len(tools)} tools/resources")
    print(f"  Found {len(oneliners)} shell one-liners")

    print(f"Generating {OUTPUT_PATH}...")
    md = generate_markdown(sections)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(md)

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"  Output: {size_kb:.0f} KB ({len(md)} chars)")
    print("Done!")


if __name__ == '__main__':
    main()
