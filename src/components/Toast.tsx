'use client';

import React from 'react';

type ToastProps = {
  message: string | null;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
};

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  if (!message) return null;

  const bgColors = {
    success: 'bg-[#006a64] text-white border-[#34d399]/40',
    error: 'bg-[#b91c1c] text-white border-red-400/40',
    info: 'bg-[#0e2c2b] text-[#abefe9] border-[#abefe9]/40',
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-bold shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 max-w-sm ${bgColors[type]}`}
    >
      <span className="material-symbols-outlined text-[20px] shrink-0" aria-hidden="true">
        {icons[type]}
      </span>
      <span className="flex-1 leading-snug">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white"
          aria-label="Close notification"
        >
          ✕
        </button>
      )}
    </div>
  );
}
