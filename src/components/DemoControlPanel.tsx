'use client';

import { useState } from 'react';
import { Sliders, FastForward, RefreshCw, CheckCircle2, ShieldAlert, Clock, UserCheck } from 'lucide-react';

interface DemoControlPanelProps {
  onStateChanged?: () => void;
}

export function DemoControlPanel({ onStateChanged }: DemoControlPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string>(
    'Demo Panel Ready: Replay the §14 scripted incident live.'
  );

  const runSimulateAction = async (action: 'reset' | 'step', step?: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/demo/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, step })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || 'Simulation action failed.');
      }
      if (res.ok) {
        if (action === 'reset') {
          setCurrentStep(0);
          setStatusLog('System reset: Ammini Amma baseline active (Normal Routine).');
        } else {
          setCurrentStep(step || 1);
          switch (step) {
            case 1:
              setStatusLog('Step 1 Executed: Fast-forwarded clock to 9:15 AM without pillbox signal. Status -> SOFT CONCERN.');
              break;
            case 2:
              setStatusLog('Step 2 Executed: Automated callback unverified. Escalating to nearest neighbor Suma -> LOCAL ESCALATION.');
              break;
            case 3:
              setStatusLog('Step 3 Executed: Neighbor Suma tapped "She is fine". Incident closed & logged to timeline. Son in Sharjah was NOT disturbed!');
              break;
            case 4:
              setStatusLog('Step 4 Executed: Timeout simulated! Escalated to Unni (Sharjah). Quiet Hours banner active (Local time 03:14 AM) -> CRITICAL.');
              break;
            case 5:
              setStatusLog('Step 5 Executed: Doctor visit care note logged to shared timeline.');
              break;
          }
        }
        if (onStateChanged) onStateChanged();
      }
    } catch (err) {
      console.error('Demo simulation error:', err);
      setStatusLog('Simulation action failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-[var(--carenet-radius-panel)] border border-primary/40 bg-[linear-gradient(135deg,#123b3a,#0b2928)] p-5 text-white shadow-[0_16px_34px_rgba(18,59,58,0.18)]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-teal-400" />
          <h3 className="font-bold text-lg text-white">Interactive Demo Controller (§14 Pitch Replay)</h3>
        </div>
        <button
          type="button"
          onClick={() => runSimulateAction('reset')}
          disabled={isLoading}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold transition-colors min-h-[36px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Reset Demo State
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 mb-4 text-xs font-mono text-teal-300">
        <p className="font-bold text-slate-400 mb-1">LIVE LOG:</p>
        <p>{statusLog}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
        <button
          type="button"
          onClick={() => runSimulateAction('step', 1)}
          disabled={isLoading}
          className={`p-3 rounded-lg text-left border transition-all text-xs font-bold min-h-[64px] flex flex-col justify-between ${
            currentStep === 1
              ? 'bg-amber-950 border-amber-600 text-amber-200'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200'
          }`}
        >
          <span className="flex items-center justify-between text-amber-400">
            Step 1: Soft Concern <Clock className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] font-normal text-slate-400 mt-1">Clock warp past 9:00 AM (No Pillbox)</span>
        </button>

        <button
          type="button"
          onClick={() => runSimulateAction('step', 2)}
          disabled={isLoading}
          className={`p-3 rounded-lg text-left border transition-all text-xs font-bold min-h-[64px] flex flex-col justify-between ${
            currentStep === 2
              ? 'bg-purple-950 border-purple-600 text-purple-200'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200'
          }`}
        >
          <span className="flex items-center justify-between text-purple-400">
            Step 2: Neighbor Ping <FastForward className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] font-normal text-slate-400 mt-1">Callback missed -&gt; Ping Suma</span>
        </button>

        <button
          type="button"
          onClick={() => runSimulateAction('step', 3)}
          disabled={isLoading}
          className={`p-3 rounded-lg text-left border transition-all text-xs font-bold min-h-[64px] flex flex-col justify-between ${
            currentStep === 3
              ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200'
          }`}
        >
          <span className="flex items-center justify-between text-emerald-400">
            Step 3: Resolve OK <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] font-normal text-slate-400 mt-1">Suma taps &quot;She&apos;s Fine&quot;</span>
        </button>

        <button
          type="button"
          onClick={() => runSimulateAction('step', 4)}
          disabled={isLoading}
          className={`p-3 rounded-lg text-left border transition-all text-xs font-bold min-h-[64px] flex flex-col justify-between ${
            currentStep === 4
              ? 'bg-red-950 border-red-600 text-red-200'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200'
          }`}
        >
          <span className="flex items-center justify-between text-red-400">
            Step 4: Sharjah Critical <ShieldAlert className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] font-normal text-slate-400 mt-1">Timeout -&gt; 3:14 AM Quiet Hours override</span>
        </button>

        <button
          type="button"
          onClick={() => runSimulateAction('step', 5)}
          disabled={isLoading}
          className={`p-3 rounded-lg text-left border transition-all text-xs font-bold min-h-[64px] flex flex-col justify-between ${
            currentStep === 5
              ? 'bg-indigo-950 border-indigo-600 text-indigo-200'
              : 'bg-slate-800 border-slate-700 hover:bg-slate-750 text-slate-200'
          }`}
        >
          <span className="flex items-center justify-between text-indigo-400">
            Step 5: Care Note <UserCheck className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] font-normal text-slate-400 mt-1">Log Dr. Visit & BP Change</span>
        </button>
      </div>
    </div>
  );
}
