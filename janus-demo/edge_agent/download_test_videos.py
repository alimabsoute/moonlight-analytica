#!/usr/bin/env python3
"""
Test Video Downloader for Janus People Tracking
================================================
Downloads free stock videos from Pexels organized by use case scenario.

Scenarios supported:
- retail: Store entrances, mall traffic, checkout lines
- restaurant: Table occupancy, cafe seating, dining rooms
- queue: Waiting lines, bank queues, checkout queues
- office: Lobby traffic, meeting rooms, coworking spaces
- venue: Event crowds, stadium entrances, concession lines
- all: Download videos for all scenarios

Usage:
    python download_test_videos.py                    # Download sample retail videos
    python download_test_videos.py --scenario retail  # Download retail scenario
    python download_test_videos.py --scenario all     # Download all scenarios
    python download_test_videos.py --list             # List available scenarios
    python download_test_videos.py --query "cafe"     # Custom search with API key
"""

import argparse
import os
import requests
import json
from pathlib import Path
from typing import Dict, List


# ============================================================
# SCENARIO-BASED VIDEO LIBRARY
# ============================================================
# Organized by Janus B2B use cases:
# - Foot traffic analysis
# - Queue management
# - Table/seat occupancy
# - Flow rate measurement
# ============================================================

SCENARIO_VIDEOS = {
    "retail": {
        "description": "Retail stores, malls, shopping - foot traffic analysis",
        "videos": [
            {
                "name": "retail_mall_walking_1",
                "description": "People walking in mall - good for foot traffic",
                "url": "https://videos.pexels.com/video-files/855564/855564-hd_1920_1080_30fps.mp4",
                "difficulty": "easy",
                "tags": ["mall", "walking", "foot_traffic"]
            },
            {
                "name": "retail_store_entrance_1",
                "description": "Retail store entrance - entry/exit counting",
                "url": "https://videos.pexels.com/video-files/4471945/4471945-hd_1920_1080_25fps.mp4",
                "difficulty": "easy",
                "tags": ["entrance", "entry_exit", "retail"]
            },
            {
                "name": "retail_mall_shoppers_1",
                "description": "Mall shoppers walking - moderate crowd",
                "url": "https://videos.pexels.com/video-files/3209194/3209194-uhd_2560_1440_25fps.mp4",
                "difficulty": "medium",
                "tags": ["mall", "crowd", "shopping"]
            },
            {
                "name": "retail_checkout_queue_1",
                "description": "Checkout queue formation",
                "url": "https://videos.pexels.com/video-files/4553310/4553310-hd_1280_720_25fps.mp4",
                "difficulty": "medium",
                "tags": ["queue", "checkout", "waiting"]
            },
        ]
    },

    "restaurant": {
        "description": "Restaurants, cafes - table occupancy and turnover",
        "videos": [
            {
                "name": "restaurant_cafe_interior_1",
                "description": "Coffee shop with customers seated",
                "url": "https://videos.pexels.com/video-files/4253261/4253261-uhd_2560_1440_25fps.mp4",
                "difficulty": "easy",
                "tags": ["cafe", "seating", "occupancy"]
            },
            {
                "name": "restaurant_dining_room_1",
                "description": "Restaurant dining room - table tracking",
                "url": "https://videos.pexels.com/video-files/3772530/3772530-hd_1920_1080_25fps.mp4",
                "difficulty": "medium",
                "tags": ["restaurant", "tables", "dining"]
            },
            {
                "name": "restaurant_outdoor_patio_1",
                "description": "Outdoor cafe seating",
                "url": "https://videos.pexels.com/video-files/4883245/4883245-hd_1920_1080_25fps.mp4",
                "difficulty": "medium",
                "tags": ["outdoor", "patio", "seating"]
            },
            {
                "name": "restaurant_counter_service_1",
                "description": "Counter service ordering",
                "url": "https://videos.pexels.com/video-files/4253266/4253266-uhd_2560_1440_25fps.mp4",
                "difficulty": "medium",
                "tags": ["counter", "ordering", "service"]
            },
        ]
    },

    "queue": {
        "description": "Queue analysis - waiting lines, service queues",
        "videos": [
            {
                "name": "queue_bank_line_1",
                "description": "Bank-style queue with barriers",
                "url": "https://videos.pexels.com/video-files/7534210/7534210-hd_1920_1080_25fps.mp4",
                "difficulty": "easy",
                "tags": ["queue", "bank", "serpentine"]
            },
            {
                "name": "queue_checkout_line_1",
                "description": "Checkout line at store",
                "url": "https://videos.pexels.com/video-files/5585972/5585972-hd_1920_1080_30fps.mp4",
                "difficulty": "medium",
                "tags": ["queue", "checkout", "waiting"]
            },
            {
                "name": "queue_waiting_room_1",
                "description": "People in waiting room",
                "url": "https://videos.pexels.com/video-files/6985509/6985509-hd_1920_1080_25fps.mp4",
                "difficulty": "easy",
                "tags": ["waiting", "room", "seated"]
            },
        ]
    },

    "office": {
        "description": "Office spaces - lobby traffic, meeting rooms",
        "videos": [
            {
                "name": "office_lobby_entrance_1",
                "description": "Office lobby with people entering/exiting",
                "url": "https://videos.pexels.com/video-files/6985509/6985509-hd_1920_1080_25fps.mp4",
                "difficulty": "easy",
                "tags": ["office", "lobby", "entrance"]
            },
            {
                "name": "office_hallway_traffic_1",
                "description": "Office hallway with walking traffic",
                "url": "https://videos.pexels.com/video-files/3201768/3201768-hd_1920_1080_24fps.mp4",
                "difficulty": "medium",
                "tags": ["office", "hallway", "traffic"]
            },
            {
                "name": "office_coworking_space_1",
                "description": "Coworking space with desks",
                "url": "https://videos.pexels.com/video-files/7534337/7534337-hd_1920_1080_25fps.mp4",
                "difficulty": "medium",
                "tags": ["coworking", "desks", "occupancy"]
            },
        ]
    },

    "venue": {
        "description": "Venues and events - crowds, entry gates",
        "videos": [
            {
                "name": "venue_crowd_walking_1",
                "description": "Crowd walking at venue/event",
                "url": "https://videos.pexels.com/video-files/2053100/2053100-hd_1920_1080_30fps.mp4",
                "difficulty": "hard",
                "tags": ["crowd", "event", "walking"]
            },
            {
                "name": "venue_station_crowd_1",
                "description": "Busy station with many people",
                "url": "https://videos.pexels.com/video-files/3201768/3201768-hd_1920_1080_24fps.mp4",
                "difficulty": "hard",
                "tags": ["station", "crowd", "dense"]
            },
            {
                "name": "venue_sidewalk_flow_1",
                "description": "Sidewalk with pedestrian flow",
                "url": "https://videos.pexels.com/video-files/1560915/1560915-hd_1920_1080_24fps.mp4",
                "difficulty": "medium",
                "tags": ["sidewalk", "flow", "pedestrians"]
            },
        ]
    },

    "edge_cases": {
        "description": "Challenging scenarios - occlusion, crowding, lighting",
        "videos": [
            {
                "name": "edge_dense_crowd_1",
                "description": "Dense crowd - high occlusion",
                "url": "https://videos.pexels.com/video-files/4553310/4553310-hd_1280_720_25fps.mp4",
                "difficulty": "hard",
                "tags": ["crowd", "occlusion", "dense"]
            },
            {
                "name": "edge_crossing_paths_1",
                "description": "People crossing paths - ID switch risk",
                "url": "https://videos.pexels.com/video-files/2053100/2053100-hd_1920_1080_30fps.mp4",
                "difficulty": "hard",
                "tags": ["crossing", "occlusion", "id_switch"]
            },
        ]
    }
}


def download_video(url: str, output_path: str, name: str) -> bool:
    """Download a video from URL with progress indicator."""
    print(f"\n[DOWNLOADING] {name}")
    print(f"  URL: {url[:60]}...")

    try:
        response = requests.get(url, stream=True, timeout=60)
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0

        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        pct = (downloaded / total_size) * 100
                        mb = downloaded / 1024 / 1024
                        print(f"\r  Progress: {pct:.1f}% ({mb:.1f} MB)", end="")

        print(f"\n  [OK] Saved to: {output_path}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"\n  [ERROR] Failed to download: {e}")
        return False


def search_pexels_videos(api_key: str, query: str, count: int = 5) -> list:
    """Search Pexels API for videos matching query."""
    if not api_key:
        print("[WARNING] No Pexels API key provided.")
        print("  Get your free API key at: https://www.pexels.com/api/")
        return []

    headers = {"Authorization": api_key}
    params = {"query": query, "per_page": count}

    try:
        response = requests.get(
            "https://api.pexels.com/videos/search",
            headers=headers,
            params=params,
            timeout=30
        )
        response.raise_for_status()
        data = response.json()

        videos = []
        for video in data.get("videos", []):
            video_files = video.get("video_files", [])
            hd_file = next(
                (f for f in video_files if f.get("quality") == "hd" and f.get("width", 0) >= 1280),
                video_files[0] if video_files else None
            )

            if hd_file:
                videos.append({
                    "name": f"pexels_{video['id']}",
                    "description": video.get("url", ""),
                    "url": hd_file["link"],
                    "difficulty": "unknown",
                    "tags": [query]
                })

        return videos

    except Exception as e:
        print(f"[ERROR] Pexels API search failed: {e}")
        return []


def list_scenarios():
    """Print available scenarios and their videos."""
    print("\n" + "=" * 60)
    print("AVAILABLE SCENARIOS")
    print("=" * 60)

    total_videos = 0
    for scenario_name, scenario_data in SCENARIO_VIDEOS.items():
        videos = scenario_data["videos"]
        total_videos += len(videos)

        print(f"\n[{scenario_name.upper()}] - {len(videos)} videos")
        print(f"  {scenario_data['description']}")

        for video in videos:
            diff_emoji = {"easy": "🟢", "medium": "🟡", "hard": "🔴"}.get(video["difficulty"], "⚪")
            print(f"    {diff_emoji} {video['name']}")
            print(f"       {video['description']}")

    print(f"\n{'=' * 60}")
    print(f"TOTAL: {total_videos} videos across {len(SCENARIO_VIDEOS)} scenarios")
    print("=" * 60)


def download_scenario(scenario_name: str, output_dir: Path, count: int = None) -> dict:
    """Download videos for a specific scenario."""
    if scenario_name not in SCENARIO_VIDEOS:
        print(f"[ERROR] Unknown scenario: {scenario_name}")
        print(f"  Available: {', '.join(SCENARIO_VIDEOS.keys())}")
        return {"successful": 0, "failed": 0, "videos": []}

    scenario = SCENARIO_VIDEOS[scenario_name]
    videos = scenario["videos"]

    if count:
        videos = videos[:count]

    # Create scenario subdirectory
    scenario_dir = output_dir / scenario_name
    scenario_dir.mkdir(exist_ok=True)

    print(f"\n[SCENARIO] {scenario_name.upper()}")
    print(f"  {scenario['description']}")
    print(f"  Videos to download: {len(videos)}")

    successful = 0
    failed = 0
    downloaded_videos = []

    for video in videos:
        output_path = scenario_dir / f"{video['name']}.mp4"

        if output_path.exists():
            print(f"\n[SKIP] {video['name']} already exists")
            successful += 1
            downloaded_videos.append(video)
            continue

        if download_video(video["url"], str(output_path), video["name"]):
            successful += 1
            downloaded_videos.append(video)
        else:
            failed += 1

    return {
        "successful": successful,
        "failed": failed,
        "videos": downloaded_videos
    }


def main():
    parser = argparse.ArgumentParser(
        description="Download test videos for Janus people tracking",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python download_test_videos.py --list                    # List all scenarios
  python download_test_videos.py --scenario retail         # Download retail videos
  python download_test_videos.py --scenario restaurant     # Download restaurant videos
  python download_test_videos.py --scenario all            # Download ALL scenarios
  python download_test_videos.py --scenario retail --count 2  # Download first 2 retail videos
  python download_test_videos.py --query "cafe" --api-key YOUR_KEY  # Search Pexels API
        """
    )
    parser.add_argument("--output", default="video_library", help="Output directory")
    parser.add_argument("--scenario", default="retail",
                        help="Scenario to download: retail, restaurant, queue, office, venue, edge_cases, all")
    parser.add_argument("--count", type=int, help="Limit number of videos per scenario")
    parser.add_argument("--query", help="Custom search query (requires --api-key)")
    parser.add_argument("--api-key", help="Pexels API key for custom searches")
    parser.add_argument("--list", action="store_true", help="List available scenarios and videos")
    args = parser.parse_args()

    # Get script directory
    script_dir = Path(__file__).parent
    output_dir = script_dir / args.output
    output_dir.mkdir(exist_ok=True)

    print("=" * 60)
    print("JANUS TEST VIDEO DOWNLOADER")
    print("B2B Analytics: Retail | Restaurant | Queue | Office | Venue")
    print("=" * 60)
    print(f"Output directory: {output_dir}")

    if args.list:
        list_scenarios()
        return

    # Custom Pexels search
    if args.query and args.api_key:
        print(f"\n[SEARCH] Pexels API: '{args.query}'")
        videos = search_pexels_videos(args.api_key, args.query, args.count or 5)

        if videos:
            custom_dir = output_dir / "custom_search"
            custom_dir.mkdir(exist_ok=True)

            for video in videos:
                output_path = custom_dir / f"{video['name']}.mp4"
                if not output_path.exists():
                    download_video(video["url"], str(output_path), video["name"])
        return

    # Download scenarios
    all_results = []

    if args.scenario == "all":
        scenarios_to_download = list(SCENARIO_VIDEOS.keys())
    else:
        scenarios_to_download = [args.scenario]

    for scenario in scenarios_to_download:
        result = download_scenario(scenario, output_dir, args.count)
        all_results.append({
            "scenario": scenario,
            **result
        })

    # Save metadata
    metadata_path = output_dir / "video_metadata.json"
    metadata = {
        "scenarios": all_results,
        "total_successful": sum(r["successful"] for r in all_results),
        "total_failed": sum(r["failed"] for r in all_results)
    }

    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    # Summary
    print("\n" + "=" * 60)
    print("DOWNLOAD COMPLETE")
    print("=" * 60)

    for result in all_results:
        print(f"  [{result['scenario'].upper()}] {result['successful']} downloaded, {result['failed']} failed")

    print(f"\n  Total: {metadata['total_successful']} successful, {metadata['total_failed']} failed")
    print(f"  Metadata: {metadata_path}")
    print("=" * 60)

    # Usage tips
    if all_results and all_results[0]["videos"]:
        first_video = all_results[0]["videos"][0]
        scenario = all_results[0]["scenario"]
        video_path = output_dir / scenario / f"{first_video['name']}.mp4"
        print(f"\n[TIP] Test with:")
        print(f"  python video_streamer.py --source \"{video_path}\" --port 8001")


if __name__ == "__main__":
    main()
