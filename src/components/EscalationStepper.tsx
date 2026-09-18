'use client';

import React from 'react';

export type EscalationStep = {
  tier: number;
  label: string;
  sublabel: string;
  contactName?: string;
  status: 'completed' | 'active' | 'pending';
  timestamp?: string;
  icon: string;
};

type EscalationStepperProps = {
  currentStage?: string;
  contacts?: Array<{ name: string; relationship: string }>;
  timelineEvents?: Array<{ stage?: string; created_at: string }>;
};

export function EscalationStepper({ currentStage = 'normal', contacts = [] }: EscalationStepperProps) {
  const neighborContact = contacts.find((c) => c.relationship === 'neighbor')?.name || 'Suma Nextdoor';
  const ashaContact = contacts.find((c) => c.relationship === 'asha')?.name || 'Reeja V. (ASHA)';
  const familyContact = contacts.find((c) => c.relationship === 'family')?.name || 'Unni (Sharjah)';

  const getStageTier = (stage: string) => {
    switch (stage) {
      case 'normal':
        return 0;
      case 'soft_concern':
      case 'verify':
      case 'local_escalation':
        return 1;
      case 'extended_escalation':
        return 2;
      case 'family_escalation':
        return 3;
      case 'critical':
        return 4;
      default:
        return 0;
    }
  };

  const activeTier = getStageTier(currentStage);

  const steps: EscalationStep[] = [
    {
      tier: 1,
      label: 'Tier 1: Neighbor',
      sublabel: 'Distance ~180m (SLA 20m)',
      contactName: neighborContact,
      status: activeTier >= 1 ? (activeTier === 1 ? 'active' : 'completed') : 'pending',
      icon: 'directions_walk',
    },
    {
      tier: 2,
      label: 'Tier 2: ASHA Worker',
      sublabel: 'Panchayat Health (SLA 30m)',
      contactName: ashaContact,
      status: activeTier >= 2 ? (activeTier === 2 ? 'active' : 'completed') : 'pending',
      icon: 'medical_services',
    },
    {
      tier: 3,
      label: 'Tier 3: Family Overseas',
      sublabel: 'Sharjah / GCC (SLA 45m)',
      contactName: familyContact,
      status: activeTier >= 3 ? (activeTier === 3 ? 'active' : 'completed') : 'pending',
      icon: 'flight_takeoff',
    },
    {
      tier: 4,
      label: 'Tier 4: Subcenter Dispatch',
      sublabel: 'Hospital Ambulance (108)',
      contactName: 'Kozhencherry PHC',
      status: activeTier >= 4 ? 'active' : 'pending',
      icon: 'e911_emergency',
    },
  ];

  return (
    <div className="rounded-2xl border border-[var(--carenet-border)] bg-surface-container-lowest p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-outline-variant/15 pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">alt_route</span>
          <h3 className="font-bold text-sm text-on-surface">3-Tier Escalation Ladder Status</h3>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[0.68rem] font-bold uppercase tracking-wider text-primary">
          Stage: {currentStage.replace('_', ' ')}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';

          return (
            <div
              key={step.tier}
              className={`relative flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                isActive
                  ? 'border-error bg-error-container/20 shadow-md ring-2 ring-error/30'
                  : isCompleted
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-outline-variant/20 bg-surface-container-low opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold transition-all ${
                    isActive
                      ? 'bg-error text-on-error animate-pulse'
                      : isCompleted
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {isCompleted ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">{step.icon}</span>
                  )}
                </div>

                <span
                  className={`text-[0.62rem] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-error text-on-error'
                      : isCompleted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {isActive ? 'Escalated' : isCompleted ? 'Verified' : 'Standby'}
                </span>
              </div>

              <div className="mt-3">
                <p className="font-bold text-xs text-on-surface">{step.label}</p>
                <p className="mt-0.5 text-[0.68rem] text-on-surface-variant">{step.contactName}</p>
                <p className="mt-1 text-[0.65rem] text-on-surface-variant/80 font-mono">{step.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
