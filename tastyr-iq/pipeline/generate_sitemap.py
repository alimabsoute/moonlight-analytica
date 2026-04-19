"""
generate_sitemap.py — Auto-generate sitemap.xml + robots.txt after each deploy.

Usage:
  python pipeline/generate_sitemap.py
"""

import pathlib
from datetime import datetime, timezone

REPO_ROOT = pathlib.Path(__file__).parent.parent
LANDING_ROOT = REPO_ROOT / "landing-pages"
SITEMAP_PATH = LANDING_ROOT / "sitemap.xml"
ROBOTS_PATH = LANDING_ROOT / "robots.txt"

BASE_URL = "https://forkfox.ai"

STATIC_PAGES = [
    ("", "1.0", "weekly"),
    ("the-dish/", "0.9", "daily"),
    ("carte/", "0.9", "hourly"),
    ("gallery.html", "0.5", "monthly"),
    ("socials.html", "0.5", "monthly"),
    ("privacy.html", "0.3", "monthly"),
    ("support.html", "0.3", "monthly"),
]


def scan_articles(subdir: str, priority: str, changefreq: str) -> list[tuple]:
    """Scan for article index.html files and return sitemap tuples."""
    base = LANDING_ROOT / subdir
    entries = []
    if not base.exists():
        return entries
    for p in sorted(base.rglob("index.html")):
        rel = p.parent.relative_to(LANDING_ROOT)
        url_path = str(rel).replace("\\", "/") + "/"
        mtime = datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.utc).strftime("%Y-%m-%d")
        entries.append((url_path, priority, changefreq, mtime))
    return entries


def build_sitemap() -> str:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']

    # Static pages
    for path, priority, changefreq in STATIC_PAGES:
        url = f"{BASE_URL}/{path}"
        lines.append(f"""  <url>
    <loc>{url}</loc>
    <lastmod>{now}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>""")

    # The Dish articles
    for url_path, priority, changefreq, mtime in scan_articles("the-dish", "0.8", "monthly"):
        if url_path == "the-dish/":
            continue
        lines.append(f"""  <url>
    <loc>{BASE_URL}/{url_path}</loc>
    <lastmod>{mtime}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>""")

    # Carte articles
    for url_path, priority, changefreq, mtime in scan_articles("carte", "0.7", "monthly"):
        if url_path == "carte/":
            continue
        lines.append(f"""  <url>
    <loc>{BASE_URL}/{url_path}</loc>
    <lastmod>{mtime}</lastmod>
    <changefreq>{changefreq}</changefreq>
    <priority>{priority}</priority>
  </url>""")

    lines.append("</urlset>")
    return "\n".join(lines)


def build_robots() -> str:
    return f"""User-agent: *
Allow: /
Allow: /the-dish/
Allow: /carte/

Disallow: /gallery.html
Disallow: /drafts/
Disallow: /pipeline/

Sitemap: {BASE_URL}/sitemap.xml
"""


def run():
    sitemap = build_sitemap()
    SITEMAP_PATH.write_text(sitemap, encoding="utf-8")
    print(f"[sitemap] wrote {SITEMAP_PATH}")

    robots = build_robots()
    ROBOTS_PATH.write_text(robots, encoding="utf-8")
    print(f"[sitemap] wrote {ROBOTS_PATH}")

    # Count entries
    count = sitemap.count("<url>")
    print(f"[sitemap] {count} URLs indexed")


if __name__ == "__main__":
    run()
