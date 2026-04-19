"""
render.py — Jinja2 HTML renderer for Carte editorial articles.

Called by generate_carte.py and generate_social_copy.py.
"""

import pathlib
import re
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATE_DIR = pathlib.Path(__file__).parent / "templates"
env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html"]),
)


def _format_date(iso_str: str) -> str:
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        return dt.strftime("%B %d, %Y")
    except Exception:
        return iso_str


def render_carte(article: dict, output_path: pathlib.Path):
    """Render article dict to carte-editorial.html template, write to output_path."""
    template = env.get_template("carte-editorial.html")

    slug = article.get("slug", "")
    city = article.get("city", "Philadelphia")
    neighborhood = article.get("neighborhood", "")
    cuisine = article.get("cuisine", "")
    published_at = article.get("published_at", "")

    ctx = {
        "title": article.get("title", ""),
        "meta_description": article.get("meta_description", ""),
        "deck": article.get("deck", ""),
        "pull_quote": article.get("pull_quote", ""),
        "sections": article.get("sections", []),
        "closing_principle": article.get("closing_principle", ""),
        "faq": article.get("faq", []),
        "hero_image_url": article.get("hero_image_url", ""),
        "article_url": article.get("article_url", f"https://forkfox.ai/carte/{slug}/"),
        "slug": slug,
        "city": city,
        "neighborhood": neighborhood,
        "cuisine": cuisine,
        "published_at": published_at,
        "published_date_display": _format_date(published_at) if published_at else "",
        "breadcrumb_city": city if city not in ("both", "multiple") else "Multiple Cities",
        "og_image": article.get("hero_image_url", "https://forkfox.ai/forkfox-og.jpg"),
    }

    html = template.render(**ctx)
    output_path.write_text(html, encoding="utf-8")
