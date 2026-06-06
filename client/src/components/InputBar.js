import React, { useState, useRef } from 'react';
import { MuteButton, SendButton, AnimatedBorder } from './MicroComponents';
import { useMessageParticle, ParticleCanvas } from './MessageParticle';

export default function InputBar({ input, setInput, isMuted, onToggleMute, onSend }) {
  const [focused, setFocused] = useState(false);
  const sendBtnRef = useRef(null);
  const { canvasRef, spawnParticles } = useMessageParticle();

  const handleSend = async () => {
    if (!input.trim()) return;
    spawnParticles(sendBtnRef.current);
    await onSend({ preventDefault: () => {} });
  };

  return (
    <>
      <ParticleCanvas canvasRef={canvasRef} />
      <div className="panel-footer flex items-center gap-2.5 relative z-10" style={{ padding: '0.75rem 1rem' }}>
        <MuteButton isMuted={isMuted} onToggle={onToggleMute} />

        <AnimatedBorder isActive={focused} color="purple" className="flex flex-1 gap-2 rounded-xl">
          <div className="flex flex-1 gap-2 p-1">
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
