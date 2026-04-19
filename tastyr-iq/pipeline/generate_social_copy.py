"""
generate_social_copy.py — Generate social copy for The Dish articles on git push.

Called by the dish-publisher GitHub Actions workflow after a push to the-dish/**.
Reads the pushed HTML file, extracts article data, calls Haiku to generate all social copy,
writes a social.json next to the article for post_social.py to pick up.

Usage:
  python pipeline/generate_social_copy.py --html-path tastyr-iq/landing-pages/the-dish/slug/index.html
"""

import os
import sys
import json
import re
import argparse
import pathlib
from datetime import datetime, timezone

import anthropic

REPO_ROOT = pathlib.Path(__file__).parent.parent
VOICE_FILE = REPO_ROOT / "voice.md"
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = "claude-haiku-4-5-20251001"


def extract_article_data(html_path: pathlib.Path) -> dict:
    """Extract title, deck, pull quote, first 2000 chars of prose from HTML."""
    html = html_path.read_text(encoding="utf-8", errors="replace")

    title = ""
    m = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    if m:
        title = re.sub(r'\s*[—|]\s*(Carte|The Dish|ForkFox).*$', '', m.group(1)).strip()

    meta_desc = ""
    m = re.search(r'<meta name="description" content="(.*?)"', html, re.IGNORECASE)
    if m:
        meta_desc = m.group(1)

    og_image = ""
    m = re.search(r'<meta property="og:image" content="(.*?)"', html, re.IGNORECASE)
    if m:
        og_image = m.group(1)

    pull_quote = ""
    m = re.search(r'<div class="pull-quote">(.*?)</div>', html, re.IGNORECASE | re.DOTALL)
    if m:
        pull_quote = re.sub(r'<[^>]+>', '', m.group(1)).strip()

    canonical = ""
    m = re.search(r'<link rel="canonical" href="(.*?)"', html, re.IGNORECASE)
    if m:
        canonical = m.group(1)

    prose_match = re.search(r'class="prose">(.*?)</article>', html, re.IGNORECASE | re.DOTALL)
    prose_text = ""
    if prose_match:
        raw = prose_match.group(1)
        prose_text = re.sub(r'<[^>]+>', ' ', raw)
        prose_text = re.sub(r'\s+', ' ', prose_text).strip()[:2000]

    slug_part = str(html_path.parent.relative_to(REPO_ROOT / "landing-pages"))

    return {
        "title": title,
        "meta_description": meta_desc,
        "og_image": og_image,
        "pull_quote": pull_quote,
        "article_url": canonical or f"https://forkfox.ai/{slug_part}/",
        "prose_excerpt": prose_text,
        "slug": slug_part,
    }


def generate_social(article_data: dict, voice: str) -> dict:
    """Call Haiku to generate all social copy from article data."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    prompt = f"""Generate social media copy for this ForkFox The Dish article.

ARTICLE DATA:
Title: {article_data['title']}
Description: {article_data['meta_description']}
Pull quote: {article_data['pull_quote']}
URL: {article_data['article_url']}
Prose excerpt:
{article_data['prose_excerpt']}

Return ONLY a JSON object with these keys:
{{
  "tweet": "under 240 chars, no hashtags, link not included",
  "ig_caption": "3-5 sentences ending with 5-8 hashtags after two blank lines",
  "fb_post": "4-6 sentences conversational, no hashtags",
  "linkedin_post": "professional angle — what this tells the food/tech industry, 3-4 sentences",
  "threads_post": "up to 500 chars, more personality than tweet",
  "reddit_title": "Scored [X] [cuisine] in [neighborhood] — here's what the data shows",
  "reddit_body": "3-4 honest paragraphs, no marketing, link at end"
}}

Follow all voice rules from your system prompt. No preamble."""

    resp = client.messages.create(
        model=MODEL,
        max_tokens=1500,
        system=voice,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = resp.content[0].text.strip()
    raw = re.sub(r'^```json\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"[social] JSON parse error: {e}")
        return {}


def run(args):
    html_path = pathlib.Path(args.html_path)
    if not html_path.exists():
        print(f"ERROR: {html_path} not found")
        sys.exit(1)

    voice = VOICE_FILE.read_text(encoding="utf-8")
    article_data = extract_article_data(html_path)

    print(f"[generate_social] {article_data['title']}")
    social = generate_social(article_data, voice)

    payload = {
        "slug": article_data["slug"],
        "article_url": article_data["article_url"],
        "hero_image_url": article_data["og_image"],
        "published_at": datetime.now(timezone.utc).isoformat(),
        **social,
    }

    output = html_path.parent / "social.json"
    output.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"[generate_social] wrote {output}")
    print(f"  tweet: {social.get('tweet', '')}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--html-path", required=True, help="Path to the article index.html")
    args = parser.parse_args()

    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    run(args)
