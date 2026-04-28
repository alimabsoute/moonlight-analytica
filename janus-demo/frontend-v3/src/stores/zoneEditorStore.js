// Zustand store for the 3D Zone Editor state.
// Captures the 4-step wizard (Define -> Orient -> Anchor -> Commit) plus
// the editable zone draft.

import { create } from 'zustand';

// Surface presets: each maps to a (z height, surface_type) pair.
// JANUS-ZONE-MODEL.md: zones lie on physical surfaces, anchored in world space.
export const SURFACE_PRESETS = [
  { id: 'floor',        label: 'Floor',           z: 0.00, surfaceType: 'floor',        hint: 'Most floor zones' },
  { id: 'table',        label: 'Dining table',    z: 0.74, surfaceType: 'table',        hint: 'Per-table zones' },
  { id: 'service',      label: 'Service counter', z: 0.91, surfaceType: 'counter_top',  hint: 'Host stand, pickup' },
  { id: 'bar',          label: 'Bar top',         z: 1.05, surfaceType: 'counter_top',  hint: 'Bar rail occupancy' },
  { id: 'custom',       label: 'Custom...',       z: null, surfaceType: 'other',        hint: 'Free Z height' },
];

const STEPS = ['define', 'orient', 'anchor', 'commit'];

const defaultDraft = () => ({
  zone_name: '',
  capacity: 50,
  color: '#4d9bff',
  surface_type: 'floor',
  surface_preset: 'floor',
  custom_z: 0,
  // 4 corners in local frame (centered on origin), 1m x 1m by default
  corners_local: [
    [-0.5, -0.5, 0],
    [ 0.5, -0.5, 0],
    [ 0.5,  0.5, 0],
    [-0.5,  0.5, 0],
  ],
  // World-space pose
  position: [0, 0, 0],     // [x, y, z] meters
  rotation: [0, 0, 0],     // Euler [pitch, yaw, roll] radians
  scale: [4, 3, 1],        // x = width meters, y = depth meters
  camera_id: 'primary',    // single-camera default; multi-cam comes later
});

export const useZoneEditorStore = create((set, get) => ({
  step: 'define',
  draft: defaultDraft(),
  saving: false,
  error: null,
  saveResult: null,
  homography: null,        // loaded from /api/calibration/<camera_id> on mount

  setStep: (step) => set({ step }),

  nextStep: () => {
    const i = STEPS.indexOf(get().step);
    if (i < STEPS.length - 1) set({ step: STEPS[i + 1] });
  },

  prevStep: () => {
    const i = STEPS.indexOf(get().step);
    if (i > 0) set({ step: STEPS[i - 1] });
  },

  updateDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

  setSurfacePreset: (presetId) => set((s) => {
    const preset = SURFACE_PRESETS.find(p => p.id === presetId);
    if (!preset) return {};
    const z = preset.z ?? s.draft.custom_z;
    return {
      draft: {
        ...s.draft,
        surface_preset: preset.id,
        surface_type: preset.surfaceType,
        position: [s.draft.position[0], z, s.draft.position[2]],
      },
    };
  }),

  setHomography: (h) => set({ homography: h }),
  setSaving: (saving) => set({ saving }),
  setError: (error) => set({ error }),
  setSaveResult: (saveResult) => set({ saveResult }),

  reset: () => set({
    step: 'define',
    draft: defaultDraft(),
    saving: false,
    error: null,
    saveResult: null,
  }),
}));

export const STEP_ORDER = STEPS;
export const STEP_META = {
  define:  { num: '01', name: 'Define',  hint: 'Pick zone name + default size' },
  orient:  { num: '02', name: 'Orient',  hint: 'Rotate the zone in 3D space' },
  anchor:  { num: '03', name: 'Anchor',  hint: 'Place on a surface (floor, bar, table)' },
  commit:  { num: '04', name: 'Commit',  hint: 'Capacity + color, save to backend' },
};
