#!/usr/bin/env python3
"""
generate_site.py — Parse the Book of Secret Knowledge README and generate
a full HTML site with personalized Ali cards for every resource.
"""

import re
import os
import random
import hashlib
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
README_PATH = os.path.join(SCRIPT_DIR, "..", "bosk-readme.md")
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "book-of-secret-knowledge.html")

# ─── PROJECT MATCHING RULES ──────────────────────────────────────────────────

PROJECTS = {
    'moonlight': {
        'label': 'Moonlight',
        'color': '#0071e3',
        'keywords': [
            'web', 'html', 'css', 'ssl', 'dns', 'seo', 'deploy', 'vercel',
            'cdn', 'performance', 'http', 'https', 'tls', 'certificate',
            'nginx', 'apache', 'header', 'cache', 'compression', 'minif',
            'browser', 'responsive', 'font', 'image', 'lighthouse', 'speed',
            'analytics', 'domain', 'hosting', 'static', 'site', 'webpage',
            'security header', 'content security', 'cors', 'redirect',
        ],
    },
    'janus': {
        'label': 'Janus',
        'color': '#34c759',
        'keywords': [
            'python', 'flask', 'opencv', 'video', 'camera', 'detection',
            'docker', 'debug', 'sqlite', 'api', 'process', 'tracking',
            'image', 'stream', 'socket', 'port', 'pid', 'kill', 'container',
            'log', 'monitor', 'service', 'daemon', 'gunicorn', 'wsgi',
            'cpu', 'memory', 'thread', 'profile', 'strace', 'trace',
            'network', 'packet', 'tcp', 'linux', 'shell', 'bash',
            'git', 'diff', 'server', 'benchmark', 'load test',
        ],
    },
    'phynxtimer': {
        'label': 'PhynxTimer',
        'color': '#af52de',
        'keywords': [
            'react', 'supabase', 'postgres', 'auth', 'saas', 'stripe',
            'api', 'database', 'migration', 'node', 'npm', 'typescript',
            'jwt', 'oauth', 'session', 'password', 'hash', 'encrypt',
            'sql', 'query', 'schema', 'table', 'row level', 'rls',
        ],
    },
    'forkfox': {
        'label': 'ForkFox',
        'color': '#ff9500',
        'keywords': [
            'react', 'three', '3d', 'animation', 'landing', 'vercel',
            'deploy', 'webgl', 'canvas', 'shader', 'gpu', 'performance',
            'lighthouse', 'bundle', 'webpack', 'vite', 'font', 'responsive',
        ],
    },
    'caposeo': {
        'label': 'Caposeo',
        'color': '#ff3b30',
        'keywords': [
            'seo', 'react', 'supabase', 'stripe', 'chart', 'analytics',
            'crawl', 'scrape', 'api', 'keyword', 'rank', 'serp', 'google',
            'search engine', 'sitemap', 'robot', 'meta', 'schema', 'markup',
            'backlink', 'domain', 'dns', 'audit', 'lighthouse', 'page speed',
        ],
    },
    'robinhood': {
        'label': 'Robinhood',
        'color': '#5856d6',
        'keywords': [
            'python', 'pandas', 'data', 'api', 'streamlit', 'automation',
            'cron', 'schedule', 'json', 'csv', 'trading', 'stock',
            'script', 'parse', 'download', 'curl', 'request', 'http client',
        ],
    },
}

# ─── PERSONALIZATION TEMPLATES ────────────────────────────────────────────────

EXAMPLE_TEMPLATES = {
    'moonlight': [
        "Use to check SSL/TLS config on moonlightanalytica.com before deploy",
        "Audit your Moonlight site headers for security best practices",
        "Debug DNS propagation issues after Vercel domain changes",
        "Profile Moonlight page load times and find bottlenecks",
        "Test your Moonlight CDN and caching configuration",
        "Scan moonlightanalytica.com for common web vulnerabilities",
        "Verify HTTPS redirect chains on your Moonlight deployment",
        "Check Moonlight's Content-Security-Policy headers",
        "Benchmark your Moonlight site against competitor load times",
        "Monitor Moonlight uptime and response codes",
        "Optimize Moonlight CSS delivery and render-blocking resources",
        "Test Moonlight's mobile responsiveness from the command line",
    ],
    'janus': [
        "Debug why your Janus Flask server won't restart on port 5000",
        "Profile Janus Python processes eating too much CPU during detection",
        "Trace system calls when Janus video pipeline hangs",
        "Monitor Janus Docker container resource usage in real-time",
        "Find which process is holding Janus's SQLite database lock",
        "Capture and analyze network packets between Janus edge agents",
        "Debug Janus API response times under load",
        "Track memory leaks in the Janus OpenCV pipeline",
        "Check what ports Janus services are listening on",
        "Analyze Janus server logs for error patterns",
        "Kill zombie processes left by crashed Janus workers",
        "Test Janus API endpoints with automated HTTP requests",
    ],
    'phynxtimer': [
        "Test PhynxTimer's Supabase auth flow for JWT vulnerabilities",
        "Debug PhynxTimer PostgreSQL query performance with explain plans",
        "Audit PhynxTimer's password hashing and session management",
        "Monitor PhynxTimer API response times during load testing",
        "Test PhynxTimer's Stripe webhook handling for edge cases",
        "Verify PhynxTimer's database migration scripts work correctly",
        "Check PhynxTimer's RLS policies are properly configured",
        "Scan PhynxTimer's Node.js dependencies for known CVEs",
        "Test PhynxTimer's OAuth flow with intercepted requests",
        "Profile PhynxTimer's React bundle size and loading performance",
    ],
    'forkfox': [
        "Benchmark ForkFox landing page load time on slow connections",
        "Profile ForkFox Three.js rendering performance in the browser",
        "Test ForkFox Vercel deployment with different CDN edge locations",
        "Optimize ForkFox WebGL shaders for mobile GPU performance",
        "Audit ForkFox bundle size and tree-shake unused dependencies",
        "Monitor ForkFox's Vercel deployment for uptime",
        "Debug ForkFox CSS animation jank with performance profiling",
        "Test ForkFox responsive breakpoints from 320px to 4K",
    ],
    'caposeo': [
        "Crawl competitor sites to feed Caposeo's SERP analysis",
        "Test Caposeo's schema markup output with Google's validator",
        "Scrape keyword ranking data for Caposeo's analytics pipeline",
        "Audit Caposeo's own SEO health with automated scanning",
        "Monitor backlink profiles for Caposeo client sites",
        "Test Caposeo API rate limiting under concurrent requests",
        "Verify Caposeo's sitemap generation against XML standards",
        "Debug Caposeo's Google Search Console integration",
    ],
    'robinhood': [
        "Schedule Robinhood trading signal scripts with cron automation",
        "Parse financial API JSON responses for the Robinhood dashboard",
        "Debug Robinhood Python data pipeline when pandas throws errors",
        "Download historical stock data in bulk for Robinhood backtesting",
        "Monitor Robinhood Streamlit dashboard uptime and performance",
        "Automate Robinhood data exports to CSV for analysis",
        "Test Robinhood API endpoints for rate limiting behavior",
        "Profile Robinhood's pandas DataFrame operations for speed",
    ],
}

# Generic fallback for tools that match a project but templates run out
GENERIC_TEMPLATES = [
    "Useful for {project} development and debugging workflows",
    "Add to your {project} development toolkit",
    "Reference when troubleshooting {project} issues",
    "Could help diagnose problems in your {project} stack",
    "Relevant to the technologies used in {project}",
]

# For tools that don't match any project
NO_PROJECT_TEMPLATES = [
    "Good general knowledge for any developer's toolkit",
    "Useful reference even if not directly tied to a current project",
    "Worth bookmarking for future projects and learning",
    "Broadens your systems knowledge beyond current project stacks",
    "Handy for general sysadmin and security awareness",
]


# ─── PLAIN ENGLISH CATEGORY DESCRIPTIONS ─────────────────────────────────────

CATEGORY_DESCRIPTIONS = {
    'Shells': 'Command-line interpreters — the programs that run when you open a terminal',
    'Shell plugins': 'Extensions that make your shell smarter with autocomplete and shortcuts',
    'Managers': 'File managers and terminal multiplexers for managing multiple sessions',
    'Text editors': 'Terminal-based text editors for writing code and config files',
    'Files and directories': 'Tools for finding files and analyzing disk usage',
    'Network': 'Network scanning, packet capture, and connectivity tools',
    'Network (DNS)': 'DNS lookup, reconnaissance, and resolver tools',
    'Network (HTTP)': 'HTTP clients, load testers, and web debugging tools',
    'SSL': 'SSL/TLS certificate tools for testing and generating secure connections',
    'Security': 'System hardening frameworks and access control tools',
    'Auditing Tools': 'Security auditing and intrusion detection scanners',
    'System Diagnostics/Debuggers': 'Tools for debugging system issues, tracing processes, and profiling',
    'Log Analyzers': 'Tools for parsing, searching, and visualizing log files',
    'Databases': 'Database CLIs, GUIs, and management tools',
    'TOR': 'Anonymous browsing and onion routing tools',
    'Messengers/IRC Clients': 'Terminal-based chat and messaging clients',
    'Productivity': 'Command-line productivity boosters and note-taking tools',
    'Terminal emulators': 'GUI apps that provide terminal windows',
    'Browsers': 'Web browsers with privacy, security, or developer features',
    'Password Managers': 'Tools for securely storing and generating passwords',
    'SSL/Security': 'Web-based SSL and security testing services',
    'HTTP Headers & Web Linters': 'Online tools that check your HTTP headers and web config',
    'DNS': 'Web-based DNS lookup and testing services',
    'Mail': 'Email testing, validation, and deliverability tools',
    'Encoders/Decoders and Regex testing': 'Online tools for encoding, decoding, and testing regex',
    'Net-tools': 'Web-based network diagnostic and lookup tools',
    'Privacy': 'Privacy testing and digital footprint analysis tools',
    'Code parsers/playgrounds': 'Online code editors and language playgrounds',
    'Performance': 'Website performance testing and optimization tools',
    'Mass scanners (search engines)': 'Internet-wide search engines for exposed devices and services',
    'Generators': 'Online generators for test data, configs, and more',
    'Passwords': 'Password strength testers and generators',
    'CVE/Exploits databases': 'Databases of known vulnerabilities and exploits',
    'Mobile apps scanners': 'Tools for analyzing mobile app security',
    'Private Search Engines': 'Search engines that respect your privacy',
    'Secure Webmail Providers': 'Email services with end-to-end encryption',
    'Crypto': 'Cryptocurrency and cryptography-related tools',
    'Operating Systems': 'Security-focused and server operating system distributions',
    'HTTP(s) Services': 'Self-hosted web servers and reverse proxies',
    'DNS Services': 'DNS server software and managed DNS services',
    'Security/hardening': 'System hardening guides and compliance tools',
    'Tools': 'Network simulation and analysis frameworks',
    'Labs': 'Practice environments for security and networking skills',
    'CLI Tools': 'Container and orchestration command-line tools',
    'Web Tools': 'Container management dashboards and web UIs',
    'Manuals/Tutorials/Best Practices': 'Learning resources for containers and orchestration',
    'Shell/Command line': 'Guides and references for shell scripting and CLI mastery',
    'Python': 'Python learning resources, guides, and best practices',
    'Sed & Awk & Other': 'Text processing tool guides and cheat sheets',
    '*nix & Network': 'Linux, Unix, and networking knowledge resources',
    'Microsoft': 'Windows and Active Directory resources',
    'Large-scale systems': 'Architecture and scaling knowledge for distributed systems',
    'System hardening': 'Hardening guides and security baselines',
    'Security & Privacy': 'Security learning paths and privacy guides',
    'Web Apps': 'Web application security testing resources',
    'All-in-one': 'Comprehensive resource collections and mega-lists',
    'Ebooks': 'Free ebooks on security, programming, and systems',
    'SysOps/DevOps': 'DevOps blogs, talks, and community resources',
    'Developers': 'Developer-focused blogs and video content',
    'Geeky Persons': 'Notable security researchers and their blogs',
    'Geeky Blogs': 'Technical blogs covering Linux, security, and systems',
    'Hacking/Penetration Testing': 'Penetration testing tools, labs, and methodologies',
    'Your daily knowledge and news': 'News sources and daily reading for tech professionals',
    'Other Cheat Sheets': 'Quick-reference cheat sheets for various tools',
    'Messengers (end-to-end encryption)': 'Encrypted messaging apps for private communication',
    'PGP Keyservers': 'Public key infrastructure and PGP key servers',
    'Other Services': 'Miscellaneous self-hosted services and utilities',
    'Other': 'Miscellaneous tools and resources',
}


# ─── PARSER ───────────────────────────────────────────────────────────────────

def clean_emoji(text):
    return re.sub(r':[a-z_]+:', '', text).strip()


def parse_tool_entry(line):
    m = re.search(
        r'<a\s+href="([^"]+)"[^>]*>\s*<b>([^<]+)</b>\s*</a>\s*[-–—]\s*(.+)',
        line, re.IGNORECASE
    )
    if m:
        url = m.group(1).strip()
        name = m.group(2).strip()
        desc = re.sub(r'<[^>]+>', '', m.group(3)).strip().rstrip('.')
        return name, url, desc
    return None


def parse_readme(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    items = []
    current_h2 = None
    current_h3 = None
    current_tool_section = None
    current_oneliner_title = None
    in_code_block = False
    code_lines = []
    code_lang = 'bash'

    for line in lines:
        raw = line.rstrip('\n')

        if raw.strip().startswith('```'):
            if in_code_block:
                in_code_block = False
                if current_tool_section and current_oneliner_title:
                    items.append({
                        'type': 'oneliner',
                        'chapter': current_h2 or 'Shell One-liners',
                        'subcategory': current_tool_section,
                        'name': f"{current_tool_section}: {current_oneliner_title}",
                        'description': current_oneliner_title,
                        'url': '',
                        'code': '\n'.join(code_lines),
                        'lang': code_lang,
                    })
                code_lines = []
            else:
                in_code_block = True
                code_lang = raw.strip().lstrip('`').strip() or 'bash'
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(raw)
            continue

        h2_match = re.match(r'^####\s+(.+?)(?:\s+&nbsp;|\s*\[)', raw)
        if h2_match:
            current_h2 = clean_emoji(h2_match.group(1)).strip()
            current_h3 = None
            current_tool_section = None
            continue

        h3_match = re.match(r'^#####\s+:black_small_square:\s+(.+)', raw)
        if h3_match:
            current_h3 = h3_match.group(1).strip()
            current_tool_section = None
            continue

        tool_match = re.match(r'^#####\s+Tool:\s+\[([^\]]+)\]', raw)
        if tool_match:
            current_tool_section = tool_match.group(1).strip()
            current_oneliner_title = None
            continue

        oneliner_title = re.match(r'^######\s+(.+)', raw)
        if oneliner_title:
            current_oneliner_title = oneliner_title.group(1).strip()
            continue

        # Shell functions section
        func_title = re.match(r'^######\s+(.+)', raw)

        entry = parse_tool_entry(raw)
        if entry:
            name, url, desc = entry
            items.append({
                'type': 'tool',
                'chapter': current_h2 or 'Uncategorized',
                'subcategory': current_h3 or 'General',
                'name': name,
                'url': url,
                'description': desc,
            })

    return items


# ─── PERSONALIZATION ENGINE ───────────────────────────────────────────────────

def match_projects(item):
    """Return list of project keys that match this item."""
    text = f"{item.get('name', '')} {item.get('description', '')} {item.get('subcategory', '')} {item.get('chapter', '')}".lower()
    matched = []
    for key, proj in PROJECTS.items():
        score = sum(1 for kw in proj['keywords'] if kw in text)
        if score >= 1:
            matched.append((key, score))
    matched.sort(key=lambda x: -x[1])
    return [m[0] for m in matched[:3]]  # max 3 projects


def get_plain_english(item):
    """Generate a plain English explanation of what this tool does."""
    desc = item.get('description', '')
    name = item.get('name', '')

    if item['type'] == 'oneliner':
        return f"Shell command: {desc}"

    # For tools, make the description more accessible
    desc_lower = desc.lower()
    if any(w in desc_lower for w in ['is a', 'is an']):
        return desc  # Already readable
    if desc_lower.startswith(('a ', 'an ')):
        return desc[0].upper() + desc[1:]
    if len(desc) < 10:
        return f"{name} — {desc}"
    return desc


def get_example(item, projects, template_usage):
    """Get a personalized example, rotating through templates."""
    if not projects:
        key = 'no_project'
        templates = NO_PROJECT_TEMPLATES
    else:
        # Pick the best matching project
        key = projects[0]
        templates = EXAMPLE_TEMPLATES.get(key, []) + [
            t.format(project=PROJECTS[key]['label']) for t in GENERIC_TEMPLATES
        ]

    # Track usage to rotate
    used = template_usage.get(key, 0)
    idx = used % len(templates)
    template_usage[key] = used + 1
    return templates[idx]


# ─── HTML GENERATOR ──────────────────────────────────────────────────────────

def escape_html(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def generate_card_html(item, projects, plain_english, example):
    """Generate a connected tool card + Ali card pair."""
    name = escape_html(item['name'])
    desc = escape_html(item['description'])
    url = item.get('url', '')
    chapter = escape_html(item.get('chapter', ''))
    subcategory = escape_html(item.get('subcategory', ''))
    pe = escape_html(plain_english)
    ex = escape_html(example)
    is_oneliner = item['type'] == 'oneliner'

    # Build project pills data attribute
    proj_data = ' '.join(projects) if projects else ''

    # Build project pills HTML
    pills_html = ''
    for p in projects:
        proj = PROJECTS[p]
        pills_html += f'<span class="project-pill" style="--pill-color:{proj["color"]}">{proj["label"]}</span>'

    # Tags
    tags_html = f'<span class="tag">{chapter}</span>'
    if subcategory and subcategory != 'General':
        tags_html += f'<span class="tag">{subcategory}</span>'
    if is_oneliner:
        tags_html += '<span class="tag tag-code">one-liner</span>'

    # Link
    link_html = ''
    if url:
        link_html = f'<a href="{escape_html(url)}" target="_blank" rel="noopener" class="tool-link">↗</a>'

    # Code block for one-liners
    code_html = ''
    if is_oneliner and item.get('code'):
        code_html = f'<pre class="oneliner-code"><code>{escape_html(item["code"])}</code></pre>'

    return f'''<div class="card-pair" data-projects="{proj_data}" data-search="{escape_html((name + ' ' + desc + ' ' + pe + ' ' + ex).lower())}">
  <div class="tool-card">
    <div class="tool-header">
      <span class="tool-name">{name}</span>
      {link_html}
    </div>
    <p class="tool-desc">{desc}</p>
    {code_html}
    <div class="tool-tags">{tags_html}</div>
  </div>
  <div class="ali-card">
    <p class="ali-plain">{pe}</p>
    <p class="ali-example">💡 {ex}</p>
    <div class="ali-pills">{pills_html}</div>
  </div>
</div>'''


def generate_html(items):
    """Generate the full self-contained HTML page."""
    template_usage = {}
    cards_by_chapter = defaultdict(lambda: defaultdict(list))
    total = 0

    for item in items:
        projects = match_projects(item)
        pe = get_plain_english(item)
        ex = get_example(item, projects, template_usage)
        card = generate_card_html(item, projects, pe, ex)
        cards_by_chapter[item.get('chapter', 'Other')][item.get('subcategory', 'General')].append(card)
        total += 1

    # Build sections HTML
    sections_html = ''
    for chapter, subs in cards_by_chapter.items():
        chapter_count = sum(len(cards) for cards in subs.values())
        sections_html += f'<section class="chapter" id="{escape_html(chapter.lower().replace(" ", "-").replace("/", "-"))}">\n'
        sections_html += f'<h2 class="chapter-title">{escape_html(chapter)} <span class="count">({chapter_count})</span></h2>\n'

        for sub, cards in subs.items():
            sub_id = f"{chapter}-{sub}".lower().replace(' ', '-').replace('/', '-').replace('(', '').replace(')', '')
            collapsible = len(cards) > 20
            sections_html += f'<div class="subcategory" id="{escape_html(sub_id)}">\n'
            if sub != 'General':
                cat_desc = CATEGORY_DESCRIPTIONS.get(sub, '')
                desc_html = f'<span class="subcat-desc">{escape_html(cat_desc)}</span>' if cat_desc else ''
                if collapsible:
                    sections_html += f'<h3 class="subcat-title collapsible" onclick="this.classList.toggle(\'collapsed\')">'
                    sections_html += f'<span class="collapse-icon">▼</span> {escape_html(sub)} <span class="count">({len(cards)})</span> {desc_html}</h3>\n'
                else:
                    sections_html += f'<h3 class="subcat-title">{escape_html(sub)} <span class="count">({len(cards)})</span> {desc_html}</h3>\n'

            sections_html += f'<div class="cards-grid{"" if not collapsible else ""}">\n'
            sections_html += '\n'.join(cards)
            sections_html += '\n</div>\n</div>\n'

        sections_html += '</section>\n'

    # Build TOC
    toc_items = ''
    for chapter in cards_by_chapter:
        ch_id = chapter.lower().replace(' ', '-').replace('/', '-')
        ch_count = sum(len(c) for c in cards_by_chapter[chapter].values())
        toc_items += f'<a href="#{escape_html(ch_id)}" class="toc-item">{escape_html(chapter)} <span class="count">({ch_count})</span></a>\n'

    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Book of Secret Knowledge — Ali's Personalized Edition</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    :root {{
      --bg: #fafafa;
      --surface: #ffffff;
      --surface-warm: #f8f7f4;
      --border: #e5e5e5;
      --border-light: #f0f0f0;
      --text: #1a1a1a;
      --text-secondary: #666;
      --text-tertiary: #999;
      --accent: #0071e3;
      --accent-hover: #0062cc;
      --tag-bg: #f0f0f0;
      --code-bg: #f5f5f5;
      --shadow: 0 1px 3px rgba(0,0,0,0.08);
      --shadow-hover: 0 4px 12px rgba(0,0,0,0.1);
      --radius: 12px;
      --radius-sm: 8px;
      --mono: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
      --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }}

    body {{
      font-family: var(--sans);
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }}

    /* ── Header ── */
    .header {{
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      padding: 24px 0 16px;
      position: sticky;
      top: 0;
      z-index: 100;
    }}

    .header-inner {{
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 24px;
    }}

    .header h1 {{
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 4px;
    }}

    .header p {{
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 12px;
    }}

    .header-controls {{
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }}

    /* ── Search ── */
    .search-bar {{
      position: relative;
      flex: 1;
      max-width: 420px;
      min-width: 200px;
    }}

    .search-bar input {{
      width: 100%;
      padding: 9px 14px 9px 36px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 14px;
      font-family: var(--sans);
      background: var(--surface);
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }}

    .search-bar input:focus {{
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(0,113,227,0.1);
    }}

    .search-bar svg {{
      position: absolute;
      left: 11px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
      pointer-events: none;
    }}

    .search-count {{
      font-size: 12px;
      color: var(--text-tertiary);
      margin-left: 4px;
      white-space: nowrap;
    }}

    /* ── Filter Pills ── */
    .filter-pills {{
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }}

    .filter-pill {{
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.15s;
      user-select: none;
    }}

    .filter-pill:hover {{
      border-color: var(--accent);
      color: var(--accent);
    }}

    .filter-pill.active {{
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }}

    /* ── TOC ── */
    .toc {{
      max-width: 1200px;
      margin: 16px auto 0;
      padding: 0 24px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }}

    .toc-item {{
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      padding: 4px 10px;
      border-radius: 6px;
      background: var(--surface);
      border: 1px solid var(--border-light);
      transition: all 0.15s;
    }}

    .toc-item:hover {{
      border-color: var(--accent);
      color: var(--accent);
    }}

    .toc-item .count {{
      color: var(--text-tertiary);
      font-size: 11px;
    }}

    /* ── Content ── */
    .content {{
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }}

    .chapter {{
      margin-bottom: 40px;
    }}

    .chapter-title {{
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--border);
    }}

    .chapter-title .count {{
      color: var(--text-tertiary);
      font-weight: 400;
      font-size: 16px;
    }}

    .subcategory {{
      margin-bottom: 24px;
    }}

    .subcat-title {{
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text);
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }}

    .subcat-title .count {{
      color: var(--text-tertiary);
      font-weight: 400;
      font-size: 13px;
    }}

    .subcat-desc {{
      color: var(--text-tertiary);
      font-weight: 400;
      font-size: 13px;
      font-style: italic;
    }}

    .collapsible {{
      cursor: pointer;
      user-select: none;
    }}

    .collapsible .collapse-icon {{
      font-size: 12px;
      transition: transform 0.2s;
      display: inline-block;
    }}

    .collapsible.collapsed .collapse-icon {{
      transform: rotate(-90deg);
    }}

    .collapsible.collapsed + .cards-grid {{
      display: none;
    }}

    /* ── Cards Grid ── */
    .cards-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 16px;
    }}

    /* ── Card Pair ── */
    .card-pair {{
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow);
      transition: box-shadow 0.2s;
      content-visibility: auto;
      contain-intrinsic-size: auto 220px;
    }}

    .card-pair:hover {{
      box-shadow: var(--shadow-hover);
    }}

    .card-pair.hidden {{
      display: none;
    }}

    /* ── Tool Card (top) ── */
    .tool-card {{
      background: var(--surface);
      padding: 16px;
      border-left: 3px solid var(--accent);
    }}

    .tool-header {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }}

    .tool-name {{
      font-weight: 600;
      font-size: 15px;
      color: var(--text);
    }}

    .tool-link {{
      color: var(--accent);
      text-decoration: none;
      font-size: 14px;
      opacity: 0.7;
      transition: opacity 0.15s;
    }}

    .tool-link:hover {{
      opacity: 1;
    }}

    .tool-desc {{
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 8px;
    }}

    .oneliner-code {{
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 10px 12px;
      border-radius: 6px;
      font-family: var(--mono);
      font-size: 12px;
      line-height: 1.5;
      overflow-x: auto;
      margin-bottom: 8px;
      max-height: 120px;
    }}

    .oneliner-code code {{
      font-family: inherit;
    }}

    .tool-tags {{
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }}

    .tag {{
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--tag-bg);
      color: var(--text-tertiary);
    }}

    .tag-code {{
      background: #e8f0fe;
      color: var(--accent);
    }}

    /* ── Ali Card (bottom) ── */
    .ali-card {{
      background: var(--surface-warm);
      padding: 14px 16px;
      border-left: 3px solid var(--border-light);
    }}

    .ali-plain {{
      font-size: 13px;
      color: var(--text);
      margin-bottom: 6px;
      line-height: 1.5;
    }}

    .ali-example {{
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 8px;
      line-height: 1.5;
    }}

    .ali-pills {{
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }}

    .project-pill {{
      font-size: 11px;
      font-weight: 500;
      padding: 2px 8px;
      border-radius: 10px;
      background: color-mix(in srgb, var(--pill-color) 12%, white);
      color: var(--pill-color);
      border: 1px solid color-mix(in srgb, var(--pill-color) 25%, transparent);
    }}

    /* ── No Results ── */
    .no-results {{
      text-align: center;
      padding: 60px 24px;
      color: var(--text-tertiary);
      font-size: 16px;
      display: none;
    }}

    /* ── Mobile ── */
    @media (max-width: 768px) {{
      .cards-grid {{
        grid-template-columns: 1fr;
      }}

      .header h1 {{
        font-size: 20px;
      }}

      .header-controls {{
        flex-direction: column;
        align-items: stretch;
      }}

      .search-bar {{
        max-width: 100%;
      }}

      .filter-pills {{
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 4px;
      }}
    }}

    /* ── Scroll to top ── */
    .scroll-top {{
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--accent);
      color: white;
      border: none;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 99;
      transition: opacity 0.2s;
    }}

    .scroll-top.visible {{
      display: flex;
    }}
  </style>
</head>
<body>

<header class="header">
  <div class="header-inner">
    <h1>The Book of Secret Knowledge</h1>
    <p>{total} tools, one-liners, and resources — personalized for Ali's projects</p>
    <div class="header-controls">
      <div class="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" id="search" placeholder="Search tools, descriptions, examples..." autocomplete="off">
        <span class="search-count" id="search-count"></span>
      </div>
      <div class="filter-pills">
        <button class="filter-pill active" data-filter="all">All</button>
        <button class="filter-pill" data-filter="janus">Janus</button>
        <button class="filter-pill" data-filter="moonlight">Moonlight</button>
        <button class="filter-pill" data-filter="phynxtimer">PhynxTimer</button>
        <button class="filter-pill" data-filter="forkfox">ForkFox</button>
        <button class="filter-pill" data-filter="caposeo">Caposeo</button>
        <button class="filter-pill" data-filter="robinhood">Robinhood</button>
      </div>
    </div>
  </div>
  <nav class="toc">{toc_items}</nav>
</header>

<main class="content" id="content">
{sections_html}
<div class="no-results" id="no-results">No tools match your search. Try different keywords.</div>
</main>

<button class="scroll-top" id="scroll-top" onclick="window.scrollTo({{top:0,behavior:'smooth'}})">↑</button>

<script>
(function() {{
  const searchInput = document.getElementById('search');
  const searchCount = document.getElementById('search-count');
  const cards = document.querySelectorAll('.card-pair');
  const pills = document.querySelectorAll('.filter-pill');
  const noResults = document.getElementById('no-results');
  const scrollBtn = document.getElementById('scroll-top');
  let activeFilter = 'all';

  // Debounce
  let searchTimeout;
  searchInput.addEventListener('input', function() {{
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 150);
  }});

  // Filter pills
  pills.forEach(pill => {{
    pill.addEventListener('click', function() {{
      pills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      activeFilter = this.dataset.filter;
      applyFilters();
    }});
  }});

  function applyFilters() {{
    const query = searchInput.value.toLowerCase().trim();
    let visible = 0;

    cards.forEach(card => {{
      const searchText = card.dataset.search;
      const projects = card.dataset.projects;

      let matchSearch = !query || searchText.includes(query);
      let matchFilter = activeFilter === 'all' || projects.includes(activeFilter);

      if (matchSearch && matchFilter) {{
        card.classList.remove('hidden');
        visible++;
      }} else {{
        card.classList.add('hidden');
      }}
    }});

    // Update count
    if (query || activeFilter !== 'all') {{
      searchCount.textContent = visible + ' of ' + cards.length;
    }} else {{
      searchCount.textContent = '';
    }}

    noResults.style.display = visible === 0 ? 'block' : 'none';

    // Show/hide sections with no visible cards
    document.querySelectorAll('.chapter').forEach(ch => {{
      const visibleCards = ch.querySelectorAll('.card-pair:not(.hidden)');
      ch.style.display = visibleCards.length === 0 ? 'none' : '';
    }});
    document.querySelectorAll('.subcategory').forEach(sub => {{
      const visibleCards = sub.querySelectorAll('.card-pair:not(.hidden)');
      sub.style.display = visibleCards.length === 0 ? 'none' : '';
    }});
  }}

  // Scroll to top button
  window.addEventListener('scroll', function() {{
    scrollBtn.classList.toggle('visible', window.scrollY > 600);
  }});

  // Keyboard shortcut: / to focus search
  document.addEventListener('keydown', function(e) {{
    if (e.key === '/' && document.activeElement !== searchInput) {{
      e.preventDefault();
      searchInput.focus();
    }}
    if (e.key === 'Escape') {{
      searchInput.value = '';
      searchInput.blur();
      applyFilters();
    }}
  }});
}})();
</script>

</body>
</html>'''

    return html


def main():
    if not os.path.exists(README_PATH):
        print(f"ERROR: README not found at {README_PATH}")
        return

    print(f"Parsing {README_PATH}...")
    items = parse_readme(README_PATH)

    tools = [i for i in items if i['type'] == 'tool']
    oneliners = [i for i in items if i['type'] == 'oneliner']
    print(f"  Found {len(tools)} tools/resources")
    print(f"  Found {len(oneliners)} shell one-liners")
    print(f"  Total: {len(items)} items")

    print(f"Generating {OUTPUT_PATH}...")
    html = generate_html(items)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html)

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"  Output: {size_kb:.0f} KB")

    # Stats on project matching
    template_usage = {}
    proj_counts = defaultdict(int)
    unmatched = 0
    for item in items:
        projects = match_projects(item)
        if not projects:
            unmatched += 1
        for p in projects:
            proj_counts[p] += 1

    print(f"\n  Project matches:")
    for p, count in sorted(proj_counts.items(), key=lambda x: -x[1]):
        print(f"    {PROJECTS[p]['label']}: {count}")
    print(f"    Unmatched: {unmatched}")
    print("Done!")


if __name__ == '__main__':
    main()
