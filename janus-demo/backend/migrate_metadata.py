"""
One-time migration to normalize paths in existing metadata.json

This script fixes any videos that were added before path normalization
was implemented. It ensures all video paths use consistent absolute
paths with native OS separators.

Run this script once after updating to the path-normalized version:
    cd backend
    python migrate_metadata.py
"""
import os
import json
import sys


def migrate_metadata():
    """Normalize all paths in metadata.json"""
    # Calculate path relative to this script's location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    metadata_path = os.path.join(script_dir, "..", "edge_agent", "video_library", "metadata.json")
    metadata_path = os.path.normpath(metadata_path)

    print(f"Looking for metadata at: {metadata_path}")

    if not os.path.exists(metadata_path):
        print("No metadata.json found - nothing to migrate")
        return

    # Read current metadata
    with open(metadata_path, 'r') as f:
        data = json.load(f)

    # Track changes
    modified = False
    normalized_count = 0
    missing_count = 0

    videos = data.get("videos", [])
    print(f"Found {len(videos)} videos in library")

    for video in videos:
        old_path = video.get("path", "")
        if not old_path:
            print(f"  WARNING: Video '{video.get('name', 'unknown')}' has no path")
            continue

        # Normalize the path
        new_path = os.path.normpath(os.path.abspath(old_path))

        # Check if file exists
        if not os.path.exists(new_path):
            print(f"  WARNING: Video file not found: {new_path}")
            missing_count += 1

        # Update if different
        if old_path != new_path:
            print(f"  Normalizing: {old_path}")
            print(f"           -> {new_path}")
            video["path"] = new_path
            modified = True
            normalized_count += 1
        else:
            print(f"  OK: {video.get('name', 'unknown')}")

    # Save if modified
    if modified:
        # Create backup first
        backup_path = metadata_path + ".bak"
        with open(backup_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"\nBackup created: {backup_path}")

        # Save updated metadata
        with open(metadata_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Metadata updated: {normalized_count} paths normalized")
    else:
        print("\nNo migration needed - all paths already normalized")

    if missing_count > 0:
        print(f"\nWARNING: {missing_count} video files are missing!")

    print("\nMigration complete!")


if __name__ == "__main__":
    migrate_metadata()
