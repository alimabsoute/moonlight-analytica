// 3D Zone Editor — main wizard component.
// JANUS-ZONE-MODEL.md: zones are 3D world-space planes anchored to physical
// surfaces, created via Define -> Orient -> Anchor -> Commit.

import { useEffect } from 'react';
import { useZoneEditorStore, STEP_META, STEP_ORDER, SURFACE_PRESETS } from '../stores/zoneEditorStore';
import { fetchCalibration, commitZone } from '../lib/zoneApi';
import ZoneEditor3DScene from './ZoneEditor3DScene';
import './ZoneEditor3D.css';

export default function ZoneEditor3D({ cameraId = 'primary', onSaved }) {
  const {
    step, draft, saving, error, saveResult,
    setStep, nextStep, prevStep, updateDraft, setSurfacePreset,
    setHomography, setSaving, setError, setSaveResult, reset,
  } = useZoneEditorStore();

  // Load camera homography on mount (warns if uncalibrated)
  useEffect(() => {
    fetchCalibration(cameraId)
      .then(h => setHomography(h))
      .catch(err => console.warn('No homography yet:', err.message));
    updateDraft({ camera_id: cameraId });
  }, [cameraId]);

  const stepIdx = STEP_ORDER.indexOf(step);
  const meta = STEP_META[step];

  const canAdvance = (() => {
    if (step === 'define')  return draft.zone_name.trim().length > 0;
    if (step === 'commit')  return draft.zone_name.trim().length > 0 && !saving;
    return true;
  })();

  const handleCommit = async () => {
    setSaving(true); setError(null);
    try {
      const result = await commitZone(draft);
      setSaveResult(result);
      onSaved?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="zoneEditor3D">
      <div className="zoneEditor3D__canvas">
        <ZoneEditor3DScene />
      </div>

      <div className="zoneEditor3D__panel">
        <div className="ze__brandRow">
          <div className="ze__brandMark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7 L12 3 L21 7 L12 11 Z" />
              <path d="M3 7 L3 17 L12 21 L21 17 L21 7" opacity="0.55" />
              <path d="M12 11 L12 21" opacity="0.55" />
            </svg>
          </div>
          <div>
            <div className="ze__brandWord">Janus</div>
            <div className="ze__brandByline">3D Zone Editor</div>
          </div>
        </div>

        <div className="ze__stepPill">
          <div className="ze__stepNum">{meta.num}</div>
          <div className="ze__stepNameWrap">
            <div className="ze__stepName">{meta.name}</div>
            <div className="ze__stepProgress">
              <div className="ze__stepProgressFill" style={{ width: `${(stepIdx + 1) / 4 * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="ze__hint">{meta.hint}</div>

        <div className="ze__body">
          {step === 'define' && <DefineStep draft={draft} updateDraft={updateDraft} />}
          {step === 'orient' && <OrientStep draft={draft} updateDraft={updateDraft} />}
          {step === 'anchor' && <AnchorStep draft={draft} updateDraft={updateDraft} setSurfacePreset={setSurfacePreset} />}
          {step === 'commit' && <CommitStep draft={draft} updateDraft={updateDraft} saving={saving} error={error} saveResult={saveResult} onCommit={handleCommit} onReset={reset} />}
        </div>

        <div className="ze__nav">
          <button className="ze__btn ze__btn--ghost" onClick={prevStep} disabled={stepIdx === 0 || saving}>
            ← Back
          </button>
          {step !== 'commit' && (
            <button className="ze__btn ze__btn--primary" onClick={nextStep} disabled={!canAdvance}>
              Next →
            </button>
          )}
          {step === 'commit' && !saveResult && (
            <button className="ze__btn ze__btn--primary" onClick={handleCommit} disabled={!canAdvance || saving}>
              {saving ? 'Saving…' : 'Commit zone'}
            </button>
          )}
          {step === 'commit' && saveResult && (
            <button className="ze__btn ze__btn--primary" onClick={reset}>
              Create another →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DefineStep({ draft, updateDraft }) {
  return (
    <>
      <label className="ze__label">Zone name</label>
      <input
        className="ze__input"
        type="text"
        value={draft.zone_name}
        onChange={(e) => updateDraft({ zone_name: e.target.value })}
        placeholder="e.g. bar_top, dining_main, host_stand"
        autoFocus
      />
      <label className="ze__label">Default size</label>
      <div className="ze__row">
        <div className="ze__sub">
          Width
          <input
            className="ze__input ze__input--small"
            type="number" step="0.5" min="0.5" max="30"
            value={draft.scale[0]}
            onChange={(e) => updateDraft({ scale: [+e.target.value, draft.scale[1], draft.scale[2]] })}
          /> m
        </div>
        <div className="ze__sub">
          Depth
          <input
            className="ze__input ze__input--small"
            type="number" step="0.5" min="0.5" max="30"
            value={draft.scale[1]}
            onChange={(e) => updateDraft({ scale: [draft.scale[0], +e.target.value, draft.scale[2]] })}
          /> m
        </div>
      </div>
      <p className="ze__note">A wireframe quad will appear on the canvas. Drag it to your scene next.</p>
    </>
  );
}

function OrientStep({ draft, updateDraft }) {
  return (
    <>
      <p className="ze__note">Drag the gizmo on the canvas to rotate the zone in 3D.</p>
      <label className="ze__label">Pitch / Yaw / Roll (radians)</label>
      <div className="ze__row">
        {['Pitch', 'Yaw', 'Roll'].map((label, i) => (
          <div className="ze__sub" key={label}>
            {label}
            <input
              className="ze__input ze__input--small"
              type="number" step="0.05"
              value={draft.rotation[i].toFixed(2)}
              onChange={(e) => {
                const r = [...draft.rotation];
                r[i] = +e.target.value;
                updateDraft({ rotation: r });
              }}
            />
          </div>
        ))}
      </div>
      <button
        className="ze__btn ze__btn--ghost ze__btn--full"
        onClick={() => updateDraft({ rotation: [0, 0, 0] })}
      >
        Reset to flat (floor)
      </button>
    </>
  );
}

function AnchorStep({ draft, updateDraft, setSurfacePreset }) {
  return (
    <>
      <label className="ze__label">Surface</label>
      <div className="ze__presets">
        {SURFACE_PRESETS.map(p => (
          <button
            key={p.id}
            className={`ze__preset ${draft.surface_preset === p.id ? 'ze__preset--active' : ''}`}
            onClick={() => setSurfacePreset(p.id)}
          >
            <div className="ze__presetTop">
              <span className="ze__presetLabel">{p.label}</span>
              {p.z !== null && <span className="ze__presetZ">{p.z.toFixed(2)} m</span>}
            </div>
            <span className="ze__presetHint">{p.hint}</span>
          </button>
        ))}
      </div>
      {draft.surface_preset === 'custom' && (
        <>
          <label className="ze__label">Custom Z height (meters)</label>
          <input
            className="ze__input"
            type="number" step="0.05"
            value={draft.custom_z}
            onChange={(e) => {
              const z = +e.target.value;
              updateDraft({
                custom_z: z,
                position: [draft.position[0], z, draft.position[2]],
              });
            }}
          />
        </>
      )}
      <p className="ze__note">Drag the gizmo on the canvas to translate the zone over its target physical surface.</p>
      <label className="ze__label">Position (x, z) meters</label>
      <div className="ze__row">
        <div className="ze__sub">
          X
          <input
            className="ze__input ze__input--small"
            type="number" step="0.5"
            value={draft.position[0].toFixed(2)}
            onChange={(e) => updateDraft({ position: [+e.target.value, draft.position[1], draft.position[2]] })}
          />
        </div>
        <div className="ze__sub">
          Z
          <input
            className="ze__input ze__input--small"
            type="number" step="0.5"
            value={draft.position[2].toFixed(2)}
            onChange={(e) => updateDraft({ position: [draft.position[0], draft.position[1], +e.target.value] })}
          />
        </div>
      </div>
    </>
  );
}

function CommitStep({ draft, updateDraft, saving, error, saveResult, onCommit, onReset }) {
  if (saveResult) {
    return (
      <div className="ze__success">
        <div className="ze__successIcon">✓</div>
        <div className="ze__successTitle">Zone committed</div>
        <div className="ze__successDetail">
          <strong>{saveResult.zone_name}</strong> — {saveResult.surface_type}, capacity {saveResult.capacity}
        </div>
        <div className="ze__successDetail ze__successId">
          Schema v{saveResult.schema_version} · zone id #{saveResult.id}
        </div>
      </div>
    );
  }
  return (
    <>
      <label className="ze__label">Capacity (people)</label>
      <input
        className="ze__input"
        type="number" min="1" max="500"
        value={draft.capacity}
        onChange={(e) => updateDraft({ capacity: +e.target.value })}
      />
      <label className="ze__label">Color</label>
      <div className="ze__row">
        <input
          className="ze__colorPicker"
          type="color"
          value={draft.color}
          onChange={(e) => updateDraft({ color: e.target.value })}
        />
        <input
          className="ze__input ze__input--small"
          type="text"
          value={draft.color}
          onChange={(e) => updateDraft({ color: e.target.value })}
        />
      </div>
      <div className="ze__summary">
        <div className="ze__summaryRow"><span>Name</span><strong>{draft.zone_name || '—'}</strong></div>
        <div className="ze__summaryRow"><span>Surface</span><strong>{draft.surface_type}</strong></div>
        <div className="ze__summaryRow"><span>Position</span><strong>{draft.position.map(v => v.toFixed(1)).join(', ')} m</strong></div>
        <div className="ze__summaryRow"><span>Size</span><strong>{draft.scale[0]} × {draft.scale[1]} m</strong></div>
        <div className="ze__summaryRow"><span>Camera</span><strong>{draft.camera_id}</strong></div>
      </div>
      {error && <div className="ze__error">{error}</div>}
    </>
  );
}
