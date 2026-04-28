// Backend API client for zones + calibration.
// Used by the 3D Zone Editor.

const API_BASE = '';  // same-origin in dev (Vite proxy) and prod

export async function fetchCalibration(cameraId) {
  const res = await fetch(`${API_BASE}/api/calibration/${encodeURIComponent(cameraId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Calibration fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchZones() {
  const res = await fetch(`${API_BASE}/api/zones/config`);
  if (!res.ok) throw new Error(`Zones fetch failed: ${res.status}`);
  const data = await res.json();
  return data.zones || [];
}

// Convert editor draft (position + rotation + scale + corners_local) into
// the polygon_world_3d + rotation_matrix + surface_type + camera_id payload
// expected by POST /api/zones/config (schema_version 2).
export function draftToPayload(draft) {
  const [px, py, pz] = draft.position;
  const [pitch, yaw, roll] = draft.rotation;
  const [sx, sy /* unused z scale */] = draft.scale;

  // Build 4 corners in world space:
  // 1) take local corners, scale by [sx, sy, 1]
  // 2) apply rotation matrix
  // 3) translate by position
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const cy = Math.cos(yaw),   syaw = Math.sin(yaw);
  const cr = Math.cos(roll),  sr = Math.sin(roll);

  // R = Rz(roll) * Ry(yaw) * Rx(pitch)
  const Rxx = cy * cr;
  const Rxy = sp * syaw * cr - cp * sr;
  const Rxz = cp * syaw * cr + sp * sr;
  const Ryx = cy * sr;
  const Ryy = sp * syaw * sr + cp * cr;
  const Ryz = cp * syaw * sr - sp * cr;
  const Rzx = -syaw;
  const Rzy = sp * cy;
  const Rzz = cp * cy;

  const rotation_matrix = [
    [Rxx, Rxy, Rxz],
    [Ryx, Ryy, Ryz],
    [Rzx, Rzy, Rzz],
  ];

  const polygon_world_3d = draft.corners_local.map(([cx, cy_, cz]) => {
    const lx = cx * sx;
    const ly = cy_ * sy;
    const lz = cz;
    const wx = Rxx * lx + Rxy * ly + Rxz * lz + px;
    const wy = Ryx * lx + Ryy * ly + Ryz * lz + py;
    const wz = Rzx * lx + Rzy * ly + Rzz * lz + pz;
    return [Number(wx.toFixed(4)), Number(wy.toFixed(4)), Number(wz.toFixed(4))];
  });

  return {
    zone_name: draft.zone_name,
    capacity: Number(draft.capacity) || 50,
    color: draft.color,
    surface_type: draft.surface_type,
    camera_id: draft.camera_id,
    polygon_world_3d,
    rotation_matrix,
  };
}

export async function commitZone(draft) {
  const payload = draftToPayload(draft);
  const res = await fetch(`${API_BASE}/api/zones/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Zone commit failed: ${res.status}`);
  }
  return res.json();
}
