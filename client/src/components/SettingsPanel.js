import React from 'react';

const QUALITY_PRESETS = {
  high: { width: 3840, height: 2160, fps: 60, label: '4K 60fps' },
  medium: { width: 1920, height: 1080, fps: 30, label: '1080p 30fps' },
  low: { width: 1280, height: 720, fps: 15, label: '720p 15fps' },
};

export default function SettingsPanel({
  theme,
  setTheme,
  quality,
  setQuality,
  onClose,
}) {
  return (
    <div className="absolute top-16 right-4 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 z-50 elegant-card animate-fadeIn">
      <h2 className="text-lg font-bold mb-4">Settings</h2>
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Theme</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="elegant">Dark Elegant</option>
          <option value="default">Purple Night</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Screen Share Quality</label>
        <select
          value={quality}
          onChange={(e) => setQuality(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {Object.entries(QUALITY_PRESETS).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>
      <button
        onClick={onClose}
        className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl transition mt-4"
      >
        Close
      </button>
    </div>
  );
}