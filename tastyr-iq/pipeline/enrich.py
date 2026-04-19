"""
enrich.py — Data enrichment for Carte article generation.

Pulls real data from: Firecrawl, Reddit JSON API, Chronicling America, Wikimedia Commons.
Returns a structured context dict consumed by generate_carte.py.
"""

import os
import json
import time
import urllib.parse
import urllib.request
import random
import re

from firecrawl import FirecrawlApp


FIRECRAWL_API_KEY = os.environ.get("FIRECRAWL_API_KEY", "")
_firecrawl = FirecrawlApp(api_key=FIRECRAWL_API_KEY) if FIRECRAWL_API_KEY else None


# ─── Firecrawl helpers ───────────────────────────────────────────────────────

def _scrape(url: str, timeout: int = 20) -> str:
    """Return markdown text from a URL via Firecrawl. Returns '' on failure."""
    if not _firecrawl:
        return ""
    try:
        result = _firecrawl.scrape_url(url, params={"formats": ["markdown"]})
        return result.get("markdown", "")[:8000]
    except Exception as e:
        print(f"  [firecrawl] {url} → {e}")
        return ""


def _search_and_scrape(query: str, n: int = 2) -> list[str]:
    """Search Firecrawl for query, scrape top n results. Returns list of markdown strings."""
    if not _firecrawl:
        return []
    try:
        results = _firecrawl.search(query, params={"limit": n})
        pages = []
        for r in results[:n]:
            url = r.get("url", "")
            if url:
                text = _scrape(url)
                if text:
                    pages.append(text[:4000])
            time.sleep(0.5)
        return pages
    except Exception as e:
        print(f"  [firecrawl search] {query} → {e}")
        return []


# ─── Reddit JSON API ─────────────────────────────────────────────────────────

_CITY_SUBREDDITS = {
    "Philadelphia": ["philadelphia", "PhillyFood"],
    "San Francisco": ["sanfrancisco", "bayarea", "SFFood"],
    "Oakland": ["oakland", "bayarea"],
    "both": ["philadelphia", "sanfrancisco"],
    "multiple": ["philadelphia", "sanfrancisco", "washingtondc"],
}

def _reddit_quotes(city: str, neighborhood: str, cuisine: str) -> list[str]:
    """Pull top Reddit comments mentioning the neighborhood + cuisine. Returns anonymized quotes."""
    subreddits = _CITY_SUBREDDITS.get(city, ["food"])
    query = f"{neighborhood} {cuisine}".strip()
    quotes = []

    for sub in subreddits[:2]:
        url = (
            f"https://www.reddit.com/r/{sub}/search.json"
            f"?q={urllib.parse.quote(query)}&sort=top&limit=5&restrict_sr=1&t=year"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "ForkFox/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
            posts = data.get("data", {}).get("children", [])
            for post in posts[:2]:
                pd = post.get("data", {})
                selftext = pd.get("selftext", "").strip()
                if len(selftext) > 80:
                    clean = re.sub(r'\s+', ' ', selftext[:400])
                    quotes.append(f'[Reddit/{sub}] "{clean}"')
            time.sleep(0.5)
        except Exception as e:
            print(f"  [reddit] r/{sub} → {e}")

    return quotes[:4]


# ─── Chronicling America API ─────────────────────────────────────────────────

def _chronicling_america(city: str, cuisine: str) -> dict:
    """Search Chronicling America newspaper archive for earliest mention of cuisine in city."""
    city_term = city if city not in ("both", "multiple") else "Philadelphia"
    query = f"{cuisine} {city_term}"
    url = (
        f"https://chroniclingamerica.loc.gov/search/pages/results/?q={urllib.parse.quote(query)}"
        f"&format=json&rows=3&sort=date"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "ForkFox/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read())
        items = data.get("items", [])
        if not items:
            return {}
        first = items[0]
        return {
            "title": first.get("title_normal", ""),
            "date": first.get("date", ""),
            "url": first.get("url", ""),
            "snippet": first.get("ocr_eng", "")[:300] if first.get("ocr_eng") else "",
        }
    except Exception as e:
        print(f"  [chronicling america] → {e}")
        return {}


# ─── Wikimedia Commons ───────────────────────────────────────────────────────

def _wikimedia_image(neighborhood: str, city: str) -> str:
    """Search Wikimedia Commons for a public-domain historical image. Returns direct URL or ''."""
    search_term = f"{neighborhood} {city} historical"
    url = (
        f"https://commons.wikimedia.org/w/api.php?action=query&list=search"
        f"&srsearch={urllib.parse.quote(search_term)}&srnamespace=6&srlimit=5"
        f"&format=json"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "ForkFox/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
        results = data.get("query", {}).get("search", [])
        for r in results:
            title = r.get("title", "")
            if not title.startswith("File:"):
                continue
            info_url = (
                f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}"
                f"&prop=imageinfo&iiprop=url&format=json"
            )
            req2 = urllib.request.Request(info_url, headers={"User-Agent": "ForkFox/1.0"})
            with urllib.request.urlopen(req2, timeout=8) as resp2:
                info_data = json.loads(resp2.read())
            pages = info_data.get("query", {}).get("pages", {})
            for page in pages.values():
                ii = page.get("imageinfo", [{}])[0]
                img_url = ii.get("url", "")
                if img_url and any(img_url.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png"]):
                    return img_url
    except Exception as e:
        print(f"  [wikimedia] → {e}")
    return ""


# ─── Pollinations.ai image URL ────────────────────────────────────────────────

def _pollinations_url(neighborhood: str, city: str, cuisine: str) -> str:
    """Build a Pollinations.ai image URL. No API key needed."""
    prompt = f"cinematic food photography {cuisine} restaurant {neighborhood} {city} moody warm light"
    encoded = urllib.parse.quote(prompt)
    seed = random.randint(1000, 9999)
    return f"https://image.pollinations.ai/prompt/{encoded}?width=1600&height=900&nologo=true&seed={seed}"


# ─── Main enrichment function ─────────────────────────────────────────────────

def enrich(topic: dict) -> dict:
    """
    Given a queue topic dict, return an enrichment context dict.

    Output keys:
      - firecrawl_pages: list of markdown strings from food press
      - reddit_quotes: list of anonymized community voice strings
      - newspaper_first_mention: dict from Chronicling America
      - historical_image_url: Wikimedia Commons URL or ''
      - pollinations_image_url: Pollinations.ai URL (always present)
    """
    city = topic.get("city", "")
    neighborhood = topic.get("neighborhood", "")
    cuisine = topic.get("cuisine", "")
    topic_type = topic.get("type", "neighborhood-cuisine")
    era = topic.get("era")

    print(f"[enrich] {city} / {neighborhood} / {cuisine}")

    firecrawl_pages = []
    if _firecrawl:
        queries = [
            f"best {cuisine} restaurants {neighborhood} {city} food review",
            f"{neighborhood} {city} {cuisine} where to eat",
        ]
        if topic_type == "historical" and era:
            queries.append(f"history {cuisine} food {city} {era}")

        for q in queries[:2]:
            pages = _search_and_scrape(q, n=1)
            firecrawl_pages.extend(pages)
            time.sleep(1)
    else:
        print("  [firecrawl] FIRECRAWL_API_KEY not set — skipping web scraping")

    reddit_quotes = _reddit_quotes(city, neighborhood, cuisine)

    newspaper = _chronicling_america(city, cuisine) if topic_type in ("historical", "neighborhood-cuisine") else {}

    historical_image = _wikimedia_image(neighborhood, city)

    pollinations_image = _pollinations_url(neighborhood, city, cuisine)

    return {
        "firecrawl_pages": firecrawl_pages,
        "reddit_quotes": reddit_quotes,
        "newspaper_first_mention": newspaper,
        "historical_image_url": historical_image,
        "pollinations_image_url": pollinations_image,
    }


if __name__ == "__main__":
    import sys, pprint
    test_topic = {
        "city": "Philadelphia",
        "neighborhood": "West Philadelphia",
        "cuisine": "Ethiopian",
        "type": "neighborhood-cuisine",
    }
    result = enrich(test_topic)
    pprint.pprint(result)
