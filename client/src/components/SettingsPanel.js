import React from 'react';

const PRESET_OPTIONS = [
  { key: 'high', width: 3840, height: 2160, fps: 60, label: '4K 60fps' },
  { key: 'medium', width: 1920, height: 1080, fps: 30, label: '1080p 30fps' },
  { key: 'low', width: 1280, height: 720, fps: 15, label: '720p 15fps' },
  { key: 'custom', width: 1920, height: 1080, fps: 30, label: 'Custom' },
];

export default function SettingsPanel({
  qualityPreset,
  setQualityPreset,
  customQuality,
  setCustomQuality,
  onClose,
}) {
  const handlePresetChange = (e) => {
    setQualityPreset(e.target.value);
  };

  const handleCustomChange = (field, value) => {
    setCustomQuality((prev) => ({
      ...prev,
      [field]: parseInt(value, 10) || 0,
    }));
  };

  return (
    <div className="absolute top-16 right-4 w-80 glass p-6 z-50 animate-fadeInUp max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-6 text-purple-300 tracking-tight">Settings</h2>

      <div className="mb-5">
        <label className="block text-sm text-gray-400 mb-2">Screen Share Quality</label>
        <select
          value={qualityPreset}
          onChange={handlePresetChange}
          className="w-full bg-gray-900/80 text-white border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
        >
          {PRESET_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {qualityPreset === 'custom' && (
        <div className="space-y-3 mb-5 p-4 bg-black/40 rounded-xl border border-white/10">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
            <input
              type="number"
              value={customQuality.width}
              onChange={(e) => handleCustomChange('width', e.target.value)}
              className="w-full input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
            <input
              type="number"
              value={customQuality.height}
              onChange={(e) => handleCustomChange('height', e.target.value)}
              className="w-full input-field text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Frame Rate (fps)</label>
            <input
              type="number"
              value={customQuality.fps}
              onChange={(e) => handleCustomChange('fps', e.target.value)}
              className="w-full input-field text-sm"
            />
          </div>
        </div>
      )}

      <button
        onClick={onClose}
        className="w-full py-2.5 bg-purple-600/10 border border-purple-500/20 text-purple-300 hover:bg-purple-600/20 hover:border-purple-500/40 rounded-xl transition-all duration-300 text-sm font-medium"
      >
        Close
      </button>
    </div>
  );
}