import React from 'react';

export default function NotificationBar({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="mx-4 mt-3 bg-purple-900/50 backdrop-blur-sm border border-purple-500/30 text-purple-100 p-3 rounded-xl text-sm flex items-center justify-between animate-fadeIn">
      <span>{message}</span>
      <button onClick={onClose} className="text-purple-300 hover:text-white ml-3">×</button>
    </div>
  );
}