'use client';

import React, { useState, useEffect } from 'react';

type QuietHoursWidgetProps = {
  keralaTimezone?: string;
  familyTimezone?: string;
  quietStart?: string;
  quietEnd?: string;
};

export function QuietHoursWidget({
  familyTimezone = 'Asia/Dubai',
  quietStart = '23:00',
  quietEnd = '07:00',
}: QuietHoursWidgetProps) {
  const [keralaTime, setKeralaTime] = useState('');
  const [familyTime, setFamilyTime] = useState('');
  const [isQuietActive, setIsQuietActive] = useState(false);

  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      
      const kTime = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const fTime = now.toLocaleTimeString('en-US', {
        timeZone: familyTimezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      setKeralaTime(kTime);
      setFamilyTime(fTime);

      // Calculate family hour for quiet hours check
      const fHourStr = new Intl.DateTimeFormat('en-US', {
        timeZone: familyTimezone,
        hour: 'numeric',
        hour12: false,
      }).format(now);
      const fHour = parseInt(fHourStr, 10);
      const startH = parseInt(quietStart.split(':')[0], 10);
      const endH = parseInt(quietEnd.split(':')[0], 10);

      const quiet = fHour >= startH || fHour < endH;
      setIsQuietActive(quiet);
    };

    updateClocks();
    const interval = setInterval(updateClocks, 10000);
    return () => clearInterval(interval);
  }, [familyTimezone, quietStart, quietEnd]);

  return (
    <div className="rounded-2xl border border-[var(--carenet-border)] bg-[#0e2c2b] p-4 text-white shadow-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#34d399]">schedule</span>
          <span className="font-mono text-[0.7rem] font-bold uppercase tracking-wider text-[#abefe9]">
            Cross-Border Time & Quiet Hours
          </span>
        </div>

        <span
          className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[0.65rem] font-bold ${
            isQuietActive ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">
            {isQuietActive ? 'bedtime' : 'wb_sunny'}
          </span>
          {isQuietActive ? `Quiet Hours (${quietStart}-${quietEnd})` : 'Active Window'}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
          <p className="text-[0.65rem] font-bold uppercase text-white/60">Kerala Local (Elder)</p>
          <p className="mt-1 font-mono text-lg font-bold text-[#abefe9]">{keralaTime || '1:30 PM'}</p>
          <p className="text-[0.62rem] text-white/50">UTC+5:30 • IST</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
          <p className="text-[0.65rem] font-bold uppercase text-white/60">Sharjah / Dubai (Family)</p>
          <p className="mt-1 font-mono text-lg font-bold text-white">{familyTime || '12:00 PM'}</p>
          <p className="text-[0.62rem] text-white/50">UTC+4:00 • GST</p>
        </div>
      </div>
    </div>
  );
}
