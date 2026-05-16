import React from 'react';

export default function NotificationBar({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="mx-4 mt-3 glass border-purple-500/30 text-purple-100 p-3 rounded-xl text-sm flex items-center justify-between animate-fadeInUp shadow-[0_0_20px_rgba(124,58,237,0.15)]">
      <span>{message}</span>
      <button onClick={onClose} className="text-purple-300 hover:text-white ml-3 transition-colors duration-200">
        ×
      </button>
    </div>
  );
}