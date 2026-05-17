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

      <div className="p-4 panel-footer flex items-center gap-3 relative z-10">
        <MuteButton isMuted={isMuted} onToggle={onToggleMute} />

        <AnimatedBorder
          isActive={focused}
          color="purple"
          className="flex flex-1 gap-3 rounded-xl"
        >
          <div className="flex flex-1 gap-3 p-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message #general"
              className="flex-1 input-field"
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