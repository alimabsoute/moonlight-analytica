"""
post_social.py — Post social copy to Facebook, Instagram, and Twitter/X.

Usage:
  python pipeline/post_social.py --social-json path/to/social.json   # post one article
  python pipeline/post_social.py --test                               # dry run, no real posts
  python pipeline/post_social.py --recent-carte                       # find + post latest carte social.json files
  python pipeline/post_social.py --recent-dish                        # find + post latest dish social.json files
"""

import os
import sys
import json
import argparse
import pathlib
import time
import urllib.request
import urllib.parse
import urllib.error

# ─── Credentials from environment ────────────────────────────────────────────

FB_PAGE_ID       = os.environ.get("FB_PAGE_ID", "")
FB_PAGE_TOKEN    = os.environ.get("FB_PAGE_TOKEN", "")
IG_ACCOUNT_ID    = os.environ.get("IG_ACCOUNT_ID", "")
TWITTER_API_KEY          = os.environ.get("TWITTER_API_KEY", "")
TWITTER_API_SECRET       = os.environ.get("TWITTER_API_SECRET", "")
TWITTER_ACCESS_TOKEN     = os.environ.get("TWITTER_ACCESS_TOKEN", "")
TWITTER_ACCESS_SECRET    = os.environ.get("TWITTER_ACCESS_SECRET", "")

REPO_ROOT = pathlib.Path(__file__).parent.parent
LANDING_ROOT = REPO_ROOT / "landing-pages"

# Twitter post every N articles to stay within free tier (1,500/month)
TWITTER_EVERY_N = int(os.environ.get("TWITTER_EVERY_N", "2"))
_twitter_counter_file = REPO_ROOT / "pipeline" / ".twitter_counter"


def _read_twitter_counter() -> int:
    try:
        return int(_twitter_counter_file.read_text().strip())
    except Exception:
        return 0


def _write_twitter_counter(n: int):
    _twitter_counter_file.write_text(str(n))


# ─── Facebook Graph API ───────────────────────────────────────────────────────

def post_facebook(social: dict, test: bool = False) -> str:
    """Post link + text to Facebook Page. Returns post ID or '' on failure."""
    if not FB_PAGE_ID or not FB_PAGE_TOKEN:
        print("  [fb] FB_PAGE_ID or FB_PAGE_TOKEN not set — skipping")
        return ""

    message = social.get("fb_post", "") + f"\n\n{social.get('article_url', '')}"
    payload = {
        "message": message,
        "link": social.get("article_url", ""),
        "access_token": FB_PAGE_TOKEN,
    }

    if test:
        print(f"  [fb DRY-RUN] would post: {message[:120]}...")
        return "dry-run-fb-id"

    data = urllib.parse.urlencode(payload).encode()
    url = f"https://graph.facebook.com/v19.0/{FB_PAGE_ID}/feed"
    req = urllib.request.Request(url, data=data, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            result = json.loads(resp.read())
            post_id = result.get("id", "")
            print(f"  [fb] posted: {post_id}")
            return post_id
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"  [fb] error {e.code}: {body[:200]}")
        return ""


# ─── Instagram Graph API ──────────────────────────────────────────────────────

def post_instagram(social: dict, test: bool = False) -> str:
    """Post image + caption to Instagram Business Account. Returns post ID or ''."""
    if not IG_ACCOUNT_ID or not FB_PAGE_TOKEN:
        print("  [ig] IG_ACCOUNT_ID or FB_PAGE_TOKEN not set — skipping")
        return ""

    image_url = social.get("hero_image_url", "")
    caption = social.get("ig_caption", "")

    if not image_url:
        print("  [ig] no hero_image_url — skipping")
        return ""

    if test:
        print(f"  [ig DRY-RUN] would post image: {image_url[:80]}")
        print(f"  [ig DRY-RUN] caption: {caption[:100]}...")
        return "dry-run-ig-id"

    # Step 1: create media container
    container_url = f"https://graph.facebook.com/v19.0/{IG_ACCOUNT_ID}/media"
    container_payload = urllib.parse.urlencode({
        "image_url": image_url,
        "caption": caption,
        "access_token": FB_PAGE_TOKEN,
    }).encode()
    req = urllib.request.Request(container_url, data=container_payload, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            container = json.loads(resp.read())
        container_id = container.get("id", "")
        if not container_id:
            print(f"  [ig] container creation failed: {container}")
            return ""
        print(f"  [ig] container created: {container_id}")
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"  [ig] container error {e.code}: {body[:200]}")
        return ""

    time.sleep(3)

    # Step 2: publish container
    publish_url = f"https://graph.facebook.com/v19.0/{IG_ACCOUNT_ID}/media_publish"
    publish_payload = urllib.parse.urlencode({
        "creation_id": container_id,
        "access_token": FB_PAGE_TOKEN,
    }).encode()
    req2 = urllib.request.Request(publish_url, data=publish_payload, method="POST")
    try:
        with urllib.request.urlopen(req2, timeout=20) as resp2:
            result = json.loads(resp2.read())
            post_id = result.get("id", "")
            print(f"  [ig] published: {post_id}")
            return post_id
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"  [ig] publish error {e.code}: {body[:200]}")
        return ""


# ─── Twitter/X API v2 ─────────────────────────────────────────────────────────

def _twitter_oauth1_header(method: str, url: str, params: dict) -> str:
    """Build OAuth 1.0a Authorization header for Twitter API v2."""
    import hmac
    import hashlib
    import base64
    import time
    import random
    import string

    oauth_params = {
        "oauth_consumer_key": TWITTER_API_KEY,
        "oauth_nonce": ''.join(random.choices(string.ascii_letters + string.digits, k=32)),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": TWITTER_ACCESS_TOKEN,
        "oauth_version": "1.0",
    }

    all_params = {**params, **oauth_params}
    sorted_params = sorted(all_params.items())
    param_string = "&".join(f"{urllib.parse.quote(str(k), safe='')}"
                            f"={urllib.parse.quote(str(v), safe='')}"
                            for k, v in sorted_params)

    base_string = "&".join([
        method.upper(),
        urllib.parse.quote(url, safe=""),
        urllib.parse.quote(param_string, safe=""),
    ])

    signing_key = (
        urllib.parse.quote(TWITTER_API_SECRET, safe="") + "&" +
        urllib.parse.quote(TWITTER_ACCESS_SECRET, safe="")
    )
    sig = base64.b64encode(
        hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha1).digest()
    ).decode()

    oauth_params["oauth_signature"] = sig
    header_parts = ', '.join(
        f'{urllib.parse.quote(k, safe="")}="{urllib.parse.quote(v, safe="")}"'
        for k, v in sorted(oauth_params.items())
    )
    return f"OAuth {header_parts}"


def post_twitter(social: dict, test: bool = False) -> str:
    """Post tweet. Returns tweet ID or '' on failure."""
    if not all([TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET]):
        print("  [twitter] credentials not set — skipping")
        return ""

    # Throttle to every N articles
    counter = _read_twitter_counter() + 1
    _write_twitter_counter(counter)
    if counter % TWITTER_EVERY_N != 0:
        print(f"  [twitter] skipping (counter {counter}, posting every {TWITTER_EVERY_N})")
        return ""

    tweet_text = social.get("tweet", "")
    article_url = social.get("article_url", "")
    if article_url and article_url not in tweet_text:
        tweet_text = f"{tweet_text} {article_url}".strip()

    if len(tweet_text) > 280:
        tweet_text = tweet_text[:277] + "..."

    if test:
        print(f"  [twitter DRY-RUN] would tweet: {tweet_text}")
        return "dry-run-tweet-id"

    url = "https://api.twitter.com/2/tweets"
    body = json.dumps({"text": tweet_text}).encode()
    auth_header = _twitter_oauth1_header("POST", url, {})
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Authorization": auth_header,
            "Content-Type": "application/json",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            result = json.loads(resp.read())
            tweet_id = result.get("data", {}).get("id", "")
            print(f"  [twitter] tweeted: {tweet_id}")
            return tweet_id
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        print(f"  [twitter] error {e.code}: {body[:200]}")
        return ""


# ─── Find recent social.json files ───────────────────────────────────────────

def find_recent_social_files(subdir: str, max_age_hours: int = 2) -> list[pathlib.Path]:
    """Find social.json files modified in the last N hours under landing-pages/{subdir}/."""
    from datetime import datetime, timezone
    base = LANDING_ROOT / subdir
    if not base.exists():
        return []
    cutoff = datetime.now(timezone.utc).timestamp() - (max_age_hours * 3600)
    files = []
    for p in base.rglob("social.json"):
        if p.stat().st_mtime >= cutoff:
            files.append(p)
    return sorted(files, key=lambda p: p.stat().st_mtime, reverse=True)


# ─── Main ─────────────────────────────────────────────────────────────────────

def post_one(social_path: pathlib.Path, test: bool):
    """Post one article to all platforms."""
    with open(social_path) as f:
        social = json.load(f)
    slug = social.get("slug", str(social_path))
    print(f"\n[post_social] {slug}")

    fb_id = post_facebook(social, test=test)
    time.sleep(1)
    ig_id = post_instagram(social, test=test)
    time.sleep(1)
    tw_id = post_twitter(social, test=test)

    print(f"  done — fb:{fb_id or '-'} ig:{ig_id or '-'} tw:{tw_id or '-'}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--social-json", type=str, default=None)
    parser.add_argument("--test", action="store_true", help="Dry run — no real posts")
    parser.add_argument("--recent-carte", action="store_true", help="Post recent Carte articles")
    parser.add_argument("--recent-dish", action="store_true", help="Post recent Dish articles")
    args = parser.parse_args()

    if args.social_json:
        post_one(pathlib.Path(args.social_json), test=args.test)

    elif args.recent_carte:
        files = find_recent_social_files("carte")
        if not files:
            print("[post_social] No recent Carte social.json files found")
        for f in files:
            post_one(f, test=args.test)
            time.sleep(2)

    elif args.recent_dish:
        files = find_recent_social_files("the-dish")
        if not files:
            print("[post_social] No recent Dish social.json files found")
        for f in files:
            post_one(f, test=args.test)
            time.sleep(2)

    else:
        print("Usage: --social-json PATH | --test | --recent-carte | --recent-dish")
        sys.exit(1)


if __name__ == "__main__":
    main()
