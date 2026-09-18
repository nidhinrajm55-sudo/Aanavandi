'use client';

import React from 'react';
import { Stage } from '@/types/carenet';

interface StatusBadgeProps {
  stage?: Stage;
  concernScore?: number;
}

export function StatusBadge({ stage = 'normal', concernScore = 0 }: StatusBadgeProps) {
  switch (stage) {
    case 'normal':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary-container/75 px-3 py-1 text-xs font-bold text-on-secondary-container shadow-[0_2px_8px_rgba(18,59,58,0.08)]">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          Normal Routine (Score: {concernScore})
        </span>
      );

    case 'soft_concern':
      return (
        <span className="inline-flex items-center gap-1.5 bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold shadow-[0_2px_8px_rgba(18,59,58,0.08)]">
          <span className="material-symbols-outlined text-[16px]">help</span>
          Soft Concern (Score: {concernScore})
        </span>
      );

    case 'verify':
      return (
        <span className="inline-flex items-center gap-1.5 bg-tertiary-container/30 text-tertiary px-3 py-1 rounded-full text-xs font-bold shadow-[0_2px_8px_rgba(18,59,58,0.08)]">
          <span className="material-symbols-outlined text-[16px]">phone_callback</span>
          Verify (Auto IVR)
        </span>
      );

    case 'local_escalation':
      return (
        <span className="inline-flex items-center gap-1.5 bg-error-container text-on-error-container px-3 py-1 rounded-full text-xs font-bold shadow-[0_2px_8px_rgba(18,59,58,0.08)] animate-pulse">
          <span className="material-symbols-outlined text-[16px]">directions_walk</span>
          Neighbor Dispatched (Score: {concernScore})
        </span>
      );

    case 'extended_escalation':
    case 'family_escalation':
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1.5 bg-error text-on-error px-3.5 py-1 rounded-full text-xs font-extrabold shadow-sm">
          <span className="material-symbols-outlined text-[16px]">emergency</span>
          CRITICAL ALERT (Score: {concernScore})
        </span>
      );

    case 'resolved':
      return (
        <span className="inline-flex items-center gap-1.5 bg-surface-container text-primary px-3 py-1 rounded-full text-xs font-bold shadow-[0_2px_8px_rgba(18,59,58,0.08)]">
          <span className="material-symbols-outlined text-[16px]">verified</span>
          Resolved OK
        </span>
      );

    default:
      return null;
  }
}
