"""
Path utilities for consistent video path handling across Janus system.

This module provides centralized path normalization to prevent
path comparison issues caused by:
- Mixed forward/backward slashes (Windows vs Unix style)
- Relative vs absolute paths
- Symlinks not being resolved
- Inconsistent path formats in metadata storage
"""
import os


def normalize_video_path(path: str) -> str:
    """
    Normalize video path for consistent comparison across system.

    - Converts to absolute path
    - Resolves symlinks
    - Uses native OS path separators

    Args:
        path: Video file path (can be relative or absolute)

    Returns:
        Fully normalized absolute path

    Raises:
        ValueError: If path is empty or None
    """
    if not path:
        raise ValueError("Video path cannot be empty or None")
    return os.path.normpath(os.path.realpath(path))


def paths_equal(path1: str, path2: str) -> bool:
    """
    Compare two paths for equality after normalization.

    This handles cases where the same file is referenced with
    different path formats (forward slashes, backslashes, relative paths).

    Args:
        path1: First path
        path2: Second path

    Returns:
        True if paths point to same location, False otherwise
        Returns False if either path is empty/None (they can't be equal to a real path)
    """
    if not path1 or not path2:
        return False  # Empty paths can't point to same location
    try:
        return normalize_video_path(path1) == normalize_video_path(path2)
    except (ValueError, OSError):
        return False  # If normalization fails, paths aren't equal
