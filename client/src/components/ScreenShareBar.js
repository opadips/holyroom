import React from 'react';

export default function ScreenShareBar({
  activeSharers,
  isSharing,
  localStream,
  remoteStreams,
  ownVideoRef,
  videoRefs,
  socketId,
  onFullscreen,
}) {
  if (activeSharers.length === 0) return null;

  return (
    <div className="bg-black/30 border-b border-white/5 p-4 flex gap-4 overflow-x-auto relative z-10">
      {isSharing && (
        <div
          className="flex-shrink-0 w-64 glass cursor-pointer hover:scale-[1.02] transition-all duration-500 overflow-hidden"
          onClick={() => ownVideoRef.current?.srcObject && onFullscreen(ownVideoRef.current.srcObject)}
        >
          <div className="relative">
            <video
              ref={ownVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-36 object-cover rounded-xl"
            />
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-xs px-2 py-0.5 rounded-md">
              Your screen
            </div>
          </div>
        </div>
      )}
      {activeSharers
        .filter((s) => s.id !== socketId)
        .map((sharer) => (
          <div
            key={sharer.id}
            className="flex-shrink-0 w-64 glass cursor-pointer hover:scale-[1.02] transition-all duration-500 overflow-hidden"
            onClick={() => {
              const stream = remoteStreams.get(sharer.id);
              if (stream) onFullscreen(stream);
            }}
          >
            <div className="relative">
              <video
                ref={(el) => {
                  if (el) videoRefs.current.set(sharer.id, el);
                  else videoRefs.current.delete(sharer.id);
                }}
                autoPlay
                playsInline
                className="w-full h-36 object-cover rounded-xl"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-xs px-2 py-0.5 rounded-md">
                {sharer.name}'s screen
              </div>
              {!remoteStreams.has(sharer.id) && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                  <span className="text-purple-300 text-sm animate-pulse">Connecting...</span>
                </div>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}