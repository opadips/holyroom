import React, { useState, useRef } from 'react';
import { SendButton, AnimatedBorder } from './MicroComponents';
import { useMessageParticle, ParticleCanvas } from './MessageParticle';

export default function InputBar({ input, setInput, onSend, onFile }) {
  const [focused, setFocused] = useState(false);
  const sendBtnRef = useRef(null);
  const fileInputRef = useRef(null);
  const { canvasRef, spawnParticles } = useMessageParticle();

  const handleSend = async () => {
    if (!input.trim()) return;
    spawnParticles(sendBtnRef.current);
    await onSend({ preventDefault: () => {} });
  };

  return (
    <>
      <ParticleCanvas canvasRef={canvasRef} />
      <div className="panel-footer flex items-center gap-2.5 relative z-10" style={{ padding: '0.75rem 1rem', flexShrink: 0 }}>
        <AnimatedBorder isActive={focused} color="purple" className="flex flex-1 gap-2 rounded-xl">
          <div className="flex flex-1 gap-2 p-1">
            {onFile && (
              <>
                <button
                  type="button"
                  className="glass-icon-btn"
                  aria-label="Attach file"
                  title="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: 34, height: 34, flexShrink: 0, alignSelf: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--tx-secondary)' }} aria-hidden="true">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  tabIndex={-1}
                  aria-hidden="true"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onFile(file);
                    e.target.value = '';
                  }}
                />
              </>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Send a message…"
              aria-label="Message"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--tx-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                padding: '0.5rem 0.5rem',
              }}
            />
            <div ref={sendBtnRef}>
              <SendButton onSend={handleSend} disabled={!input.trim()} />
            </div>
          </div>
        </AnimatedBorder>
      </div>
    </>
  );
}
