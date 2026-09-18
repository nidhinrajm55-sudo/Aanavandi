'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Elder, TimelineEntry } from '@/types/carenet';
import { EscalationStepper } from '@/components/EscalationStepper';
import { Toast } from '@/components/Toast';
import { HeaderSkeleton } from '@/components/Skeletons';

export default function ElderProfileEscalationPage() {
  const [elder, setElder] = useState<Elder | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'signal' | 'escalation_step' | 'note'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [authorRole, setAuthorRole] = useState<'Reeja (ASHA)' | 'Suma (Neighbor)' | 'Manoj (Family)'>('Reeja (ASHA)');
  const [noteText, setNoteText] = useState('');
  const [markSafe, setMarkSafe] = useState(true);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3600);
  };

  const fetchElderData = async () => {
    try {
      const elderId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('id') || 'elder-ammini-78'
        : 'elder-ammini-78';
      const res = await fetch(`/api/elders/${encodeURIComponent(elderId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load elder profile.');
      {
        const data = await res.json();
        setElder(data.elder);
        setTimeline(data.timeline || []);
      }
      setErrorMessage(null);
    } catch (err) {
      console.error('Failed to fetch elder data:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load elder profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchElderData, 0);
    const interval = window.setInterval(fetchElderData, 8000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  const targetElderId = elder?.id || 'elder-ammini-78';

  const handleManualOverride = async () => {
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderId: targetElderId,
          signalType: 'volunteer_confirmed_ok',
          source: 'volunteer',
          metadata: { note: 'Manual check-in override - verified elder safe' }
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Manual override could not be completed.');
      }
      showToast(`Incident Overridden: ${elder?.full_name || 'Elder'} verified safe. Ladder de-escalated.`);
      await fetchElderData();
    } catch (e) {
      console.error(e);
      setErrorMessage(e instanceof Error ? e.message : 'Manual override could not be completed.');
    }
  };

  const handleTriggerIvr = async () => {
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderId: targetElderId,
          signalType: 'call_missed',
          source: 'simulated_call',
          metadata: { note: 'Triggered automated callback verification' }
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Automated callback could not be triggered.');
      }
      showToast(`Triggered Automated Callback to ${elder?.full_name || 'Elder'}`);
      await fetchElderData();
    } catch (e) {
      console.error(e);
      setErrorMessage(e instanceof Error ? e.message : 'Automated callback could not be triggered.');
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSavingNote(true);
    try {
      const noteResponse = await fetch('/api/timeline/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderId: targetElderId,
          note: `[${authorRole}] ${noteText}`,
          actorName: authorRole
        })
      });

      if (!noteResponse.ok) throw new Error('Care note could not be saved.');

      if (markSafe) {
        const safeResponse = await fetch('/api/signals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            elderId: targetElderId,
            signalType: 'volunteer_confirmed_ok',
            source: 'volunteer',
            metadata: { note: `Note added by ${authorRole}: ${noteText}` }
          })
        });
        if (!safeResponse.ok) throw new Error('Note was saved, but the safety confirmation failed.');
      }

      showToast('Care Note logged & synced to Family and Ward Subcenter');
      setIsModalOpen(false);
      setNoteText('');
      fetchElderData();
    } catch (e) {
      console.error(e);
      setErrorMessage(e instanceof Error ? e.message : 'Care note could not be saved.');
    } finally {
      setIsSavingNote(false);
    }
  };

  const filteredTimeline = timeline.filter(entry => {
    if (timelineFilter === 'all') return true;
    if (timelineFilter === 'signal') return entry.entry_type === 'signal';
    if (timelineFilter === 'escalation_step') return entry.entry_type === 'escalation_step' || entry.entry_type === 'incident_opened';
    if (timelineFilter === 'note') return entry.entry_type === 'note';
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <HeaderSkeleton />
        </div>
      </div>
    );
  }

  const concernScore = elder?.concern_score ?? 64;

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans pb-16">
      <Navbar />

      <Toast message={toastMessage || errorMessage} type={errorMessage ? 'error' : 'success'} onClose={() => { setToastMessage(null); setErrorMessage(null); }} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* ESCALATION STEPPER & EXPLANATION ROW */}
        <div className="space-y-4">
          <EscalationStepper currentStage={elder?.current_stage} contacts={elder?.contacts} />

          {/* "Why This Elder Is Flagged" Explanation & Countdown Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
              <div className="flex items-center gap-2 text-amber-800 font-extrabold uppercase tracking-wider text-[0.7rem]">
                <span className="material-symbols-outlined text-[18px]">rule</span>
                Why Flagged (Anomaly Engine Summary)
              </div>
              <p className="mt-1.5 font-bold text-amber-950 leading-relaxed">
                Smart Pillbox sensor signal missing since 08:15 AM baseline (1.2 hours overdue). Baseline routine expects morning BP medication check before 09:00 AM.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-primary font-bold uppercase tracking-wider text-[0.68rem]">
                <span>Next Escalation Countdown</span>
                <span className="material-symbols-outlined text-[16px] animate-spin">hourglass_top</span>
              </div>
              <div className="mt-2 font-mono text-2xl font-black text-primary">07m 42s</div>
              <p className="text-[0.65rem] text-on-surface-variant font-medium">Auto-advancing to Tier 2 (ASHA Health Worker)</p>
            </div>
          </div>
        </div>
        
        {/* Breadcrumb Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-on-surface-variant text-xs font-semibold">
            <a href="/ward" className="hover:text-primary transition-colors flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Ward 4 Registry
            </a>
            <span>/</span>
            <span className="text-on-surface font-bold text-sm">Profile #402-KLT</span>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
              Ranni Perunad
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-surface-container-high flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span className="text-[11px] text-on-surface-variant font-bold uppercase tracking-wider">
                Telemetry Sync Active
              </span>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary transition-colors shadow-xs"
              title="Print Dossier"
            >
              <span className="material-symbols-outlined text-[20px]">print</span>
            </button>
          </div>
        </div>

        {/* HERO PROFILE & ACTIVE INCIDENT COMPONENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Elder Bio Card */}
          <div className="lg:col-span-7 bg-surface-container-lowest rounded-2xl shadow-xs p-6 flex flex-col md:flex-row gap-6 relative overflow-hidden border border-outline-variant/30">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>

            <div className="relative shrink-0 flex flex-col items-center">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-xs bg-surface-container-low relative border border-outline-variant/40">
                <div className="w-full h-full flex items-center justify-center bg-primary-fixed text-on-primary-fixed text-4xl font-extrabold">{(elder?.full_name || 'Rehana Hidayathulla').split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div className="absolute bottom-1 right-1 bg-surface-container-lowest/90 px-2 py-0.5 rounded text-primary text-[11px] font-extrabold shadow-xs">
                  ID 402
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-secondary text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span>Biometric Enrolled</span>
              </div>
            </div>

            <div className="flex flex-col justify-between flex-1 min-w-0">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-primary tracking-tight">
                    {elder?.full_name || 'Rehana Hidayathulla'}
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold">
                    {elder?.age || 92} Years • Female
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-secondary text-[16px]">location_on</span>
                  <span>{elder?.address || 'Kunnumpurathu House, Ward 4, Ranni Perunad Grama Panchayat'}</span>
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-primary text-[14px]">monitor_heart</span>
                    Hypertension (Stage 1)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container-high text-on-surface text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-secondary text-[14px]">favorite</span>
                    Mild Osteoarthritis
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-surface-container-low text-primary text-xs font-bold flex items-center gap-1 border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[14px]">pill</span>
                    Amlodipine 5mg Daily
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[18px]">insights</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-on-surface-variant">Baseline Routine Model</span>
                    <span className="text-xs text-on-surface font-extrabold">21 Days Continuous Data</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-secondary font-bold">0.94 Confidence</span>
                  <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
                    <div className="bg-secondary h-full rounded-full w-[94%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Incident Alert Box */}
          <div className="lg:col-span-5 bg-surface-container-lowest rounded-2xl shadow-xs p-6 relative overflow-hidden flex flex-col justify-between border border-error-container">
            <div className="absolute top-0 left-0 bottom-0 w-2 bg-error"></div>

            <div>
              <div className="flex items-start justify-between gap-2 pl-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
                    <span className="text-xs text-error uppercase font-extrabold tracking-wider">
                      Active Incident Alert
                    </span>
                  </div>
                  <h2 className="text-xl text-on-surface font-extrabold mt-1">
                    Local Escalation — Stage 3
                  </h2>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-3xl font-extrabold text-error leading-none">{concernScore}</span>
                  <span className="text-[10px] text-error font-bold mt-1">Elevated Concern</span>
                </div>
              </div>

              <div className="mt-3 ml-2 p-3 bg-error-container/20 rounded-xl border border-error-container/40 space-y-1">
                <div className="flex items-center gap-1 text-error font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  <span>Root Anomaly Trigger</span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed">
                  Morning Pillbox delayed by 82 mins. Automated IVR callback at 08:00 AM unanswered.
                </p>
              </div>
            </div>

            <div className="mt-4 ml-2 pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert('Calling Neighbor Suma (+91 94472 10842)...')}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>Call Neighbor Suma</span>
              </button>
            </div>
          </div>

        </div>

        {/* Quick Actions Control Bar */}
        <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xs p-4 flex flex-wrap items-center justify-between gap-3 border border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">
              Fast Responder Tools
            </span>
            <span className="text-on-surface-variant">•</span>
            <span className="text-xs text-on-surface font-bold">
              Reeja K. (ASHA Duty #402)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-initial py-2.5 px-4 bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              <span>Add Care Note</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerIvr}
              className="flex-1 sm:flex-initial py-2.5 px-4 bg-surface-container hover:bg-surface-container-high text-secondary font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">phone_callback</span>
              <span>Trigger Callback</span>
            </button>

            <button
              type="button"
              onClick={handleManualOverride}
              className="w-full sm:w-auto py-2.5 px-5 bg-secondary text-on-secondary font-bold text-xs rounded-xl hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Manual Check-in Override (All Safe)</span>
            </button>
          </div>
        </div>

        {/* MAIN TWO-COLUMN SPLIT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Contact Escalation Ladder (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-2xl shadow-xs p-6 flex flex-col gap-4 border border-outline-variant/30">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">shield_with_heart</span>
                  <h2 className="text-lg font-bold text-primary">Contact Escalation Ladder</h2>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Kerala Rural Protocol: Strict Local-First Containment Model
                </p>
              </div>

              {/* Tier 1: Neighbor */}
              <div className="bg-surface-container-lowest rounded-xl p-4 border border-error-container shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-error text-on-error font-extrabold text-lg flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-on-surface">Suma K.</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-primary text-[11px] font-bold">
                        Immediate Neighbor
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant mt-0.5">House #403 • 80 meters away</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-error-container text-on-error-container text-xs font-bold animate-pulse">
                    Dispatched 14m ago
                  </span>
                  <button
                    type="button"
                    onClick={() => alert('Calling Neighbor Suma (+91 94472 10842)...')}
                    className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container"
                  >
                    Call
                  </button>
                </div>
              </div>

              {/* Tier 2: ASHA Worker */}
              <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary font-extrabold text-lg flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-on-surface">Reeja K.</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container text-primary text-[11px] font-bold">
                        ASHA Lead #402
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant mt-0.5">Subcenter • 650m distance</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold">
                  Standby (Escalates in 16m)
                </span>
              </div>

              {/* Tier 3: Family Abroad */}
              <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/30 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-extrabold text-lg flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-on-surface">Manoj Varghese</span>
                      <span className="px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
                        Son • Sharjah, UAE
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant mt-0.5">Al Nahda, Sharjah (Quiet Hours Protected)</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold">
                  Shielded from Panic
                </span>
              </div>

            </div>
          </div>

          {/* RIGHT: Shared Care Timeline (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-2xl shadow-xs p-6 flex flex-col gap-4 border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[24px]">history</span>
                  <h2 className="text-lg font-bold text-primary">Care Timeline Stream</h2>
                </div>
                <span className="text-xs text-on-surface-variant font-medium">Live Feed</span>
              </div>

              <div className="flex flex-wrap gap-1.5 p-1 bg-surface-container rounded-xl">
                {(['all', 'signal', 'escalation_step', 'note'] as const).map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTimelineFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                      timelineFilter === filter
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {filter === 'all' ? 'All Events' : filter.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div className="space-y-3 relative pl-4 border-l-2 border-outline-variant/20">
                {filteredTimeline.map(entry => (
                  <div key={entry.id} className="space-y-1 relative">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-primary">{entry.actor_name || 'System'}</span>
                      <span className="text-on-surface-variant text-[10px]">
                        {new Date(entry.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface font-medium leading-relaxed">{entry.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Care Note Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl p-6 space-y-4 border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-primary">Record Care Observation</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-on-surface-variant">✕</button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Author Role</label>
                  <select
                    value={authorRole}
                    onChange={e => setAuthorRole(e.target.value as typeof authorRole)}
                    className="w-full p-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/30 font-medium"
                  >
                    <option value="Reeja (ASHA)">Reeja K. (ASHA Lead)</option>
                    <option value="Suma (Neighbor)">Suma K. (Neighbor)</option>
                    <option value="Manoj (Family)">Manoj Varghese (Son)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-on-surface block mb-1">Observation Note</label>
                  <textarea
                    rows={3}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Enter observation details..."
                    className="w-full p-3 rounded-lg bg-surface-container-low text-xs text-on-surface border border-outline-variant/30"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="markSafe"
                    checked={markSafe}
                    onChange={e => setMarkSafe(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <label htmlFor="markSafe" className="text-xs text-on-surface font-medium">Mark elder safe and de-escalate incident</label>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-surface-container text-xs font-bold">Cancel</button>
                  <button type="submit" disabled={isSavingNote} className="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold disabled:opacity-60">{isSavingNote ? 'Saving…' : 'Save Note'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
