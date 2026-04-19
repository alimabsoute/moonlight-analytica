"""
generate_carte.py — Main Carte article generation script.

Usage:
  python pipeline/generate_carte.py                  # pick next N queued topics, full run
  python pipeline/generate_carte.py --dry-run        # generate 1 article, no deploy, no social
  python pipeline/generate_carte.py --batch 5        # pick 5 topics
  python pipeline/generate_carte.py --slug some/slug # force a specific queued slug
"""

import os
import sys
import json
import time
import argparse
import pathlib
import re
from datetime import datetime, timezone

import anthropic

REPO_ROOT = pathlib.Path(__file__).parent.parent
PIPELINE_DIR = REPO_ROOT / "pipeline"
QUEUE_FILE = PIPELINE_DIR / "queue.json"
VOICE_FILE = REPO_ROOT / "voice.md"
LANDING_ROOT = REPO_ROOT / "landing-pages"
CARTE_DIR = LANDING_ROOT / "carte"

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = "claude-haiku-4-5-20251001"

BATCH_SIZE = int(os.environ.get("CARTE_BATCH_SIZE", "3"))


# ─── Queue helpers ────────────────────────────────────────────────────────────

def load_queue() -> dict:
    with open(QUEUE_FILE) as f:
        return json.load(f)


def save_queue(q: dict):
    with open(QUEUE_FILE, "w") as f:
        json.dump(q, f, indent=2)


def pick_topics(q: dict, n: int, force_slug: str | None = None) -> list[dict]:
    topics = []
    for item in q["queue"]:
        if force_slug and item["slug"] != force_slug:
            continue
        if item["status"] == "queued":
            topics.append(item)
        if len(topics) >= n:
            break
    return topics


def mark_status(q: dict, slug: str, status: str, published_at: str | None = None):
    for item in q["queue"]:
        if item["slug"] == slug:
            item["status"] = status
            if published_at:
                item["published_at"] = published_at
            break


# ─── Voice loading ────────────────────────────────────────────────────────────

def load_voice() -> str:
    with open(VOICE_FILE) as f:
        return f.read()


# ─── Related slugs ────────────────────────────────────────────────────────────

def find_related(q: dict, topic: dict, n: int = 3) -> list[dict]:
    """Find n published articles related by city or cuisine."""
    city = topic.get("city", "")
    cuisine = topic.get("cuisine", "")
    related = []
    for item in q["queue"]:
        if item["status"] != "published":
            continue
        if item["slug"] == topic["slug"]:
            continue
        if item.get("city") == city or item.get("cuisine") == cuisine:
            related.append(item)
        if len(related) >= n:
            break
    return related


# ─── Article generation (Haiku pass 1) ───────────────────────────────────────

def _build_user_prompt(topic: dict, enrichment: dict, related: list[dict]) -> str:
    city = topic.get("city", "")
    neighborhood = topic.get("neighborhood", "")
    cuisine = topic.get("cuisine", "")
    street = topic.get("street", "")
    era = topic.get("era", "")
    topic_type = topic.get("type", "neighborhood-cuisine")
    keyword = topic.get("primary_keyword", f"{cuisine} {neighborhood} {city}")

    reddit_block = "\n".join(enrichment.get("reddit_quotes", [])[:3]) or "No community quotes found."
    firecrawl_block = "\n\n---\n\n".join(enrichment.get("firecrawl_pages", [])[:2]) or "No web press found."
    newspaper = enrichment.get("newspaper_first_mention", {})
    newspaper_block = (
        f"Earliest newspaper mention: {newspaper.get('date', 'unknown')} in {newspaper.get('title', 'unknown')}\n"
        f"Snippet: {newspaper.get('snippet', '')}"
        if newspaper else "No historical newspaper record found."
    )
    related_block = (
        "\n".join(f"- {r['slug']} → {r.get('cuisine','')} in {r.get('neighborhood','')}" for r in related)
        if related else "No related articles yet."
    )

    return f"""Generate a ForkFox Carte article in the locked voice and format.

TOPIC:
  City: {city}
  Neighborhood: {neighborhood}
  Cuisine: {cuisine}
  Street: {street or "N/A"}
  Era: {era or "contemporary"}
  Type: {topic_type}
  Primary SEO keyword: {keyword}

RESEARCH DATA (use this — real names, real streets, real history):
--- Community voice (Reddit, anonymized) ---
{reddit_block}

--- Food press (Firecrawl) ---
{firecrawl_block[:3000]}

--- Historical record (Chronicling America) ---
{newspaper_block}

--- Related published articles (inject 3 internal links naturally) ---
{related_block}

REQUIREMENTS:
1. Title must contain the primary SEO keyword naturally
2. 3-5 sections, each 2-3 paragraphs
3. Named places always bolded in clusters of 3+
4. Pull quote under 140 characters, standalone meaning
5. Closing principle: one sentence, quotable
6. All social copy follows the rules in SECTION 2 of your system prompt
7. FAQ: 5 questions targeting long-tail searches around "{keyword}"
8. Article length: ~900-1200 words of prose

Return ONLY the JSON object specified in SECTION 7 of your system prompt. No preamble."""


def generate_article(topic: dict, enrichment: dict, related: list[dict], voice: str) -> dict:
    """Call Haiku to generate article + all social copy. Returns parsed JSON dict."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    user_prompt = _build_user_prompt(topic, enrichment, related)

    print(f"  [haiku pass 1] generating article for {topic['slug']}")
    resp = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=voice,
        messages=[{"role": "user", "content": user_prompt}],
    )
    raw = resp.content[0].text.strip()

    # Strip markdown code fence if Haiku wrapped output
    raw = re.sub(r'^```json\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  [haiku] JSON parse error: {e}\n  Raw: {raw[:500]}")
        raise


def humanize_article(article: dict, voice: str) -> dict:
    """Haiku pass 2: check every sentence against ban list, rewrite flagged ones."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    # Collect all prose for humanizer check
    all_prose = []
    for section in article.get("sections", []):
        all_prose.extend(section.get("paragraphs", []))
        for callout in section.get("callouts", []):
            all_prose.append(callout.get("body", ""))
    all_prose.append(article.get("closing_principle", ""))

    prose_block = "\n\n".join(all_prose)

    humanize_prompt = f"""You are a copy editor enforcing the ForkFox voice.

Review the following prose paragraphs. Identify any sentences that:
- Use words from the BANNED WORDS list in your system prompt
- Break the sentence rhythm rule (short→long→short)
- Sound like AI-generated marketing copy

Return a JSON object:
{{
  "issues_found": true/false,
  "rewritten_paragraphs": {{
    "original paragraph (first 60 chars)": "full rewritten paragraph"
  }}
}}

If no issues, return {{"issues_found": false, "rewritten_paragraphs": {{}}}}

PROSE TO REVIEW:
{prose_block[:3000]}"""

    print("  [haiku pass 2] humanizer check")
    resp = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=voice,
        messages=[{"role": "user", "content": humanize_prompt}],
    )
    raw = resp.content[0].text.strip()
    raw = re.sub(r'^```json\s*', '', raw, flags=re.MULTILINE)
    raw = re.sub(r'\s*```$', '', raw, flags=re.MULTILINE)

    try:
        result = json.loads(raw)
    except Exception:
        print("  [humanizer] could not parse response — skipping rewrite")
        return article

    if not result.get("issues_found"):
        print("  [humanizer] no issues found")
        return article

    rewrites = result.get("rewritten_paragraphs", {})
    print(f"  [humanizer] rewriting {len(rewrites)} paragraphs")

    # Apply rewrites back to article sections
    for section in article.get("sections", []):
        new_paragraphs = []
        for p in section.get("paragraphs", []):
            key = p[:60]
            new_paragraphs.append(rewrites.get(key, p))
        section["paragraphs"] = new_paragraphs

    return article


# ─── Image URL selection ──────────────────────────────────────────────────────

def select_image(enrichment: dict) -> str:
    """Use historical Wikimedia image if found, else Pollinations.ai."""
    wiki = enrichment.get("historical_image_url", "")
    if wiki:
        return wiki
    return enrichment.get("pollinations_image_url", "")


# ─── Main ─────────────────────────────────────────────────────────────────────

def run(args):
    from enrich import enrich
    from render import render_carte

    q = load_queue()
    voice = load_voice()

    n = 1 if args.dry_run else args.batch
    topics = pick_topics(q, n, force_slug=args.slug)

    if not topics:
        print("[generate_carte] No queued topics found.")
        return []

    published = []

    for topic in topics:
        slug = topic["slug"]
        print(f"\n[generate_carte] processing: {slug}")

        mark_status(q, slug, "enriching")
        save_queue(q)

        enrichment = enrich(topic)
        related = find_related(q, topic)

        mark_status(q, slug, "generating")
        save_queue(q)

        article = generate_article(topic, enrichment, related, voice)
        article = humanize_article(article, voice)

        article["hero_image_url"] = select_image(enrichment)
        article["slug"] = slug
        article["city"] = topic.get("city", "")
        article["neighborhood"] = topic.get("neighborhood", "")
        article["cuisine"] = topic.get("cuisine", "")
        article["published_at"] = datetime.now(timezone.utc).isoformat()
        article["article_url"] = f"https://forkfox.ai/carte/{slug}/"

        output_dir = CARTE_DIR / slug
        output_dir.mkdir(parents=True, exist_ok=True)
        html_path = output_dir / "index.html"

        render_carte(article, html_path)
        print(f"  [render] wrote {html_path}")

        # Save social copy alongside article for post_social.py to pick up
        social_path = output_dir / "social.json"
        social_payload = {
            "slug": slug,
            "article_url": article["article_url"],
            "hero_image_url": article["hero_image_url"],
            "tweet": article.get("tweet", ""),
            "ig_caption": article.get("ig_caption", ""),
            "fb_post": article.get("fb_post", ""),
            "linkedin_post": article.get("linkedin_post", ""),
            "threads_post": article.get("threads_post", ""),
            "reddit_title": article.get("reddit_title", ""),
            "reddit_body": article.get("reddit_body", ""),
            "published_at": article["published_at"],
        }
        with open(social_path, "w") as f:
            json.dump(social_payload, f, indent=2)

        if not args.dry_run:
            mark_status(q, slug, "published", published_at=article["published_at"])
            save_queue(q)

        published.append(article)
        print(f"  [generate_carte] done: {slug}")

        if args.dry_run:
            print("\n[dry-run] Article HTML written. Social copy:")
            print(f"  tweet: {article.get('tweet', '')}")
            print(f"  ig:    {article.get('ig_caption', '')[:100]}...")
            break

        time.sleep(2)

    return published


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Generate 1 article, no deploy/social")
    parser.add_argument("--batch", type=int, default=BATCH_SIZE, help="Number of articles to generate")
    parser.add_argument("--slug", type=str, default=None, help="Force a specific queued slug")
    args = parser.parse_args()

    if not ANTHROPIC_API_KEY:
        print("ERROR: ANTHROPIC_API_KEY not set")
        sys.exit(1)

    results = run(args)
    print(f"\n[generate_carte] {len(results)} article(s) complete")
