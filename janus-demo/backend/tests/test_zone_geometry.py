# Tests for zone_geometry world-space projection helpers.
import json
import os
import sys

import numpy as np
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from zone_geometry import (
    identity_rotation,
    rotation_from_euler,
    is_floor_zone,
    polygon_world_3d_to_image,
    polygon_world_3d_to_2d,
    point_in_zone_world,
)


def test_identity_rotation_is_floor_zone():
    R = identity_rotation()
    assert is_floor_zone(R)


def test_rotation_from_euler_is_orthonormal():
    R = rotation_from_euler(0.3, 0.5, 0.7)
    R_np = np.array(R)
    # det should be 1 for proper rotation
    assert abs(np.linalg.det(R_np) - 1.0) < 1e-6
    # R @ R.T should be identity
    assert np.allclose(R_np @ R_np.T, np.eye(3), atol=1e-6)


def test_non_identity_rotation_is_not_floor_zone():
    R = rotation_from_euler(0.5, 0, 0)
    assert not is_floor_zone(R)


def test_polygon_world_3d_to_image_floor_zone():
    # 1m x 1m square on floor at origin
    poly = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]]
    R = identity_rotation()
    # H is pixel -> world (the direction stored in camera_calibration).
    # 50 px = 1 m and pixel (100,100) -> world (0,0). The inverse is what
    # actually projects world points to pixel coords.
    H = [[1.0 / 50, 0, -2.0], [0, 1.0 / 50, -2.0], [0, 0, 1.0]]
    img = polygon_world_3d_to_image(poly, R, H)
    assert img == [[100, 100], [150, 100], [150, 150], [100, 150]]


def test_polygon_world_3d_to_image_elevated_zone():
    # Bar top: 1m x 1m at z=1.0 (counter height)
    poly = [[0, 0, 1.0], [1, 0, 1.0], [1, 1, 1.0], [0, 1, 1.0]]
    R = identity_rotation()
    H = [[1.0 / 50, 0, -2.0], [0, 1.0 / 50, -2.0], [0, 0, 1.0]]
    # Floor-only homography ignores z, projects xy
    img = polygon_world_3d_to_image(poly, R, H)
    assert img == [[100, 100], [150, 100], [150, 150], [100, 150]]


def test_polygon_world_3d_to_2d_drops_z():
    poly = [[1, 2, 3], [4, 5, 6]]
    poly_2d = polygon_world_3d_to_2d(poly)
    assert poly_2d == [[1.0, 2.0], [4.0, 5.0]]


def test_point_in_zone_world_floor_inside():
    poly = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]]
    R = identity_rotation()
    assert point_in_zone_world([0.5, 0.5, 0], poly, R)


def test_point_in_zone_world_floor_outside():
    poly = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]]
    R = identity_rotation()
    assert not point_in_zone_world([2.0, 2.0, 0], poly, R)


def test_point_in_zone_world_floor_z_irrelevant():
    # Floor zone (identity rotation) accepts any z height
    poly = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]]
    R = identity_rotation()
    assert point_in_zone_world([0.5, 0.5, 1.5], poly, R)


def test_point_in_zone_world_elevated_z_tolerance():
    # Bar top zone at z=1.0 — only people within tolerance count
    poly = [[0, 0, 1.0], [1, 0, 1.0], [1, 1, 1.0], [0, 1, 1.0]]
    # Slight rotation to make it not a floor zone
    R = rotation_from_euler(0.01, 0, 0)
    # Person within tolerance
    assert point_in_zone_world([0.5, 0.5, 1.0], poly, R, surface_tolerance=0.5)
    # Person way too far below
    assert not point_in_zone_world([0.5, 0.5, -2.0], poly, R, surface_tolerance=0.5)


def test_zones_post_with_world_3d_coordinates(client):
    """Posting a 3D world-space zone via API stores all new fields correctly."""
    response = client.post('/api/zones/config', json={
        'zone_name': 'bar_top_test',
        'polygon_world_3d': [[0, 0, 1.05], [10, 0, 1.05], [10, 1.4, 1.05], [0, 1.4, 1.05]],
        'rotation_matrix': identity_rotation(),
        'surface_type': 'counter_top',
        'capacity': 14,
        'color': '#b56cff',
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['schema_version'] == 2
    assert data['surface_type'] == 'counter_top'
    assert data['polygon_world_3d'] == [[0, 0, 1.05], [10, 0, 1.05], [10, 1.4, 1.05], [0, 1.4, 1.05]]
    assert data['rotation_matrix'] == identity_rotation()


def test_zones_get_returns_world_3d_fields(client):
    """GET /api/zones/config returns the new world-space fields."""
    client.post('/api/zones/config', json={
        'zone_name': 'dining_test',
        'polygon_world_3d': [[0, 0, 0], [5, 0, 0], [5, 3, 0], [0, 3, 0]],
        'rotation_matrix': identity_rotation(),
        'surface_type': 'floor',
    })
    response = client.get('/api/zones/config')
    assert response.status_code == 200
    zones = response.get_json()['zones']
    target = next((z for z in zones if z['zone_name'] == 'dining_test'), None)
    assert target is not None
    assert target['schema_version'] == 2
    assert target['surface_type'] == 'floor'
    assert target['polygon_world_3d'] is not None
    assert target['rotation_matrix'] is not None


def test_zones_legacy_2d_still_works(client):
    """Backward compat: posting only legacy polygon_world (2D) still creates a v1 zone."""
    response = client.post('/api/zones/config', json={
        'zone_name': 'legacy_zone',
        'polygon_world': [[0, 0], [5, 0], [5, 3], [0, 3]],
        'polygon_image': [[100, 100], [600, 100], [600, 400], [100, 400]],
    })
    assert response.status_code == 201
    data = response.get_json()
    assert data['schema_version'] == 1
    assert data['polygon_world_3d'] is None
