import React, { useState } from 'react';
import { MuteButton, SendButton, AnimatedBorder } from './MicroComponents';

export default function InputBar({ input, setInput, isMuted, onToggleMute, onSend }) {
  const [focused, setFocused] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    await onSend({ preventDefault: () => {} });
  };

  return (
    <div className="p-4 panel-footer flex items-center gap-3 relative z-10">

      {/* Mute button با ripple + magnetic + pulse */}
      <MuteButton isMuted={isMuted} onToggle={onToggleMute} />

      {/* Input + Send با animated border روی focus */}
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

          {/* Send button با delivery states + ripple */}
          <SendButton onSend={handleSend} disabled={!input.trim()} />
        </div>
      </AnimatedBorder>

    </div>
  );
}