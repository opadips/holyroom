import React from 'react';

const PRESET_OPTIONS = [
  { key: 'high',   width: 3840, height: 2160, fps: 60, label: '4K 60fps'    },
  { key: 'medium', width: 1920, height: 1080, fps: 30, label: '1080p 30fps' },
  { key: 'low',    width: 1280, height: 720,  fps: 15, label: '720p 15fps'  },
  { key: 'custom', width: 1920, height: 1080, fps: 30, label: 'Custom'      },
];

export default function SettingsPanel({
  qualityPreset,
  setQualityPreset,
  customQuality,
  setCustomQuality,
  onClose,
}) {
  const handlePresetChange = (e) => setQualityPreset(e.target.value);

  const handleCustomChange = (field, value) => {
    setCustomQuality((prev) => ({ ...prev, [field]: parseInt(value, 10) || 0 }));
  };

  return (
    <div className="w-80 glass p-6 max-h-[80vh] overflow-y-auto">
      <h2 className="ty-h4 mb-6">Settings</h2>

      <div className="mb-5">
        <label className="ty-label block mb-2">Screen Share Quality</label>
        <select
          value={qualityPreset}
          onChange={handlePresetChange}
          className="w-full bg-gray-900/80 border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ty-body--sm"
          style={{ color: 'var(--tx-primary)' }}
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>

      {qualityPreset === 'custom' && (
        <div className="space-y-3 mb-5 p-4 bg-black/40 rounded-xl border border-white/10">
          {[
            { label: 'Width (px)',       field: 'width'  },
            { label: 'Height (px)',      field: 'height' },
            { label: 'Frame Rate (fps)', field: 'fps'    },
          ].map(({ label, field }) => (
            <div key={field}>
              <label className="ty-label block mb-1">{label}</label>
              <input
                type="number"
                value={customQuality[field]}
                onChange={(e) => handleCustomChange(field, e.target.value)}
                className="w-full input-field"
              />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-2.5 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 hover:border-purple-500/40 rounded-xl transition-all duration-300 ty-btn ty-accent"
      >
        Close
      </button>
    </div>
  );
}