import React from 'react';

const PRESET_OPTIONS = [
  { key: 'high',   width: 3840, height: 2160, fps: 60, label: '4K · 60fps' },
  { key: 'medium', width: 1920, height: 1080, fps: 30, label: '1080p · 30fps' },
  { key: 'low',    width: 1280, height: 720,  fps: 15, label: '720p · 15fps' },
  { key: 'custom', width: 1920, height: 1080, fps: 30, label: 'Custom' },
];

export default function SettingsPanel({ qualityPreset, setQualityPreset, customQuality, setCustomQuality, onClose }) {
  const handleCustomChange = (field, value) => {
    setCustomQuality((prev) => ({ ...prev, [field]: parseInt(value, 10) || 0 }));
  };

  return (
    <div style={{
      width: 300, maxHeight: '80vh', overflowY: 'auto',
      padding: '1.5rem',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--tx-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Settings
          </h2>
          <p style={{ color: 'var(--tx-ghost)', fontSize: '0.72rem', margin: '0.2rem 0 0' }}>
            Screen share preferences
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '0.5rem',
            color: 'var(--tx-tertiary)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', lineHeight: 1,
            transition: 'all 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'var(--tx-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--tx-tertiary)'; }}
        >
          ×
        </button>
      </div>

      {/* Quality presets */}
      <div style={{ marginBottom: '1.25rem' }}>
        <label style={{
          display: 'block', fontSize: '0.68rem', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--tx-tertiary)', marginBottom: '0.625rem',
        }}>
          Screen share quality
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {PRESET_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setQualityPreset(opt.key)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.625rem 0.875rem',
                background: qualityPreset === opt.key ? 'rgba(124,107,240,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${qualityPreset === opt.key ? 'rgba(124,107,240,0.30)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '0.625rem',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (qualityPreset !== opt.key) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { if (qualityPreset !== opt.key) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <span style={{
                fontSize: '0.84rem', fontWeight: 500,
                color: qualityPreset === opt.key ? 'var(--tx-accent)' : 'var(--tx-secondary)',
              }}>
                {opt.label}
              </span>
              {qualityPreset === opt.key && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--tx-accent)', flexShrink: 0 }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Custom fields */}
      {qualityPreset === 'custom' && (
        <div style={{
          padding: '1rem', marginBottom: '1.25rem',
          background: 'rgba(0,0,10,0.40)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '0.75rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}>
          {[
            { label: 'Width (px)', field: 'width' },
            { label: 'Height (px)', field: 'height' },
            { label: 'Frame rate (fps)', field: 'fps' },
          ].map(({ label, field }) => (
            <div key={field}>
              <label style={{
                display: 'block', fontSize: '0.68rem', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: 'var(--tx-tertiary)', marginBottom: '0.3rem',
              }}>{label}</label>
              <input
                type="number"
                value={customQuality[field]}
                onChange={(e) => handleCustomChange(field, e.target.value)}
                className="input-field"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.84rem' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="btn-primary ty-btn"
        style={{ width: '100%', padding: '0.7rem 1rem' }}
      >
        Done
      </button>
    </div>
  );
}
