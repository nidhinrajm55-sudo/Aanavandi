'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Toast } from '@/components/Toast';
import { TableSkeleton } from '@/components/Skeletons';
import { Elder } from '@/types/carenet';

export default function WardDashboard() {
  const [elders, setElders] = useState<Elder[]>([]);
  const [selectedElder, setSelectedElder] = useState<Elder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // UI filter & search states
  const [filterTab, setFilterTab] = useState<'all' | 'attention' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Care Note Form states
  const [selectedNoteElder, setSelectedNoteElder] = useState<string>('');
  const [selectedTask, setSelectedTask] = useState<string>('BP Check');
  const [careNoteText, setCareNoteText] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isClearingCheckIn, setIsClearingCheckIn] = useState(false);

  // Activity Log feed
  const [activities, setActivities] = useState<Array<{ id: string; text: string; time: string; badge: string; badgeColor: string }>>([
    {
      id: '1',
      text: 'Neighbor Suma K. dispatched to Kunnumpurathu House',
      time: '14m ago',
      badge: 'Escalated',
      badgeColor: 'bg-error-container text-on-error-container'
    },
    {
      id: '2',
      text: 'Malayalam IVR retry queued for Eliyamma Joseph',
      time: '28m ago',
      badge: 'Inquiry',
      badgeColor: 'bg-tertiary-fixed text-on-tertiary-fixed'
    },
    {
      id: '3',
      text: 'Front door motion confirmed for Raghavan Nair',
      time: '1h ago',
      badge: 'Cleared',
      badgeColor: 'bg-secondary-container text-on-secondary-container'
    }
  ]);

  const fetchElderDetail = React.useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/elders/${id}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load elder details.');
      const data = await res.json();
      setSelectedElder(data.elder);
    } catch (err) {
      console.error('Error fetching elder detail:', err);
      setToastMsg({
        message: err instanceof Error ? err.message : 'Unable to load elder details.',
        type: 'error',
      });
    }
  }, []);

  const fetchWardData = React.useCallback(async () => {
    try {
      const res = await fetch('/api/elders', { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load ward registry.');
      const data = await res.json();
      const wardElders: Elder[] = data.elders || [];
      setElders(wardElders);
      if (wardElders.length > 0) {
        const targetId = typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('id')
          : null;
        const initialElder = (targetId && wardElders.find(e => e.id === targetId)) || wardElders[0];
        setSelectedElder(current => {
          if (current) return current;
          void fetchElderDetail(initialElder.id);
          return current;
        });
      }
    } catch (err) {
      console.error('Failed to fetch ward dashboard data:', err);
      setToastMsg({
        message: err instanceof Error ? err.message : 'Unable to load ward registry.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchElderDetail]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchWardData(), 0);
    const interval = window.setInterval(() => void fetchWardData(), 4000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, [fetchWardData]);

  const handleClearCheckIn = async () => {
    if (!selectedElder || isClearingCheckIn) return;
    setIsClearingCheckIn(true);
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderId: selectedElder.id,
          signalType: 'volunteer_confirmed_ok',
          source: 'volunteer',
          metadata: { note: 'Check-in cleared manually by ASHA Lead Reeja K.' }
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Check-in could not be cleared.');
      }
      setToastMsg({ message: 'Safety check cleared successfully.', type: 'success' });
      await Promise.all([fetchElderDetail(selectedElder.id), fetchWardData()]);
    } catch (e) {
      console.error(e);
      setToastMsg({
        message: e instanceof Error ? e.message : 'Check-in could not be cleared.',
        type: 'error',
      });
    } finally {
      setIsClearingCheckIn(false);
    }
  };

  const handleSaveCareNote = async () => {
    if (!careNoteText.trim()) {
      setToastMsg({ message: 'Enter an observation note before saving.', type: 'error' });
      return;
    }
    const targetElderId = selectedNoteElder || selectedElder?.id;
    if (!targetElderId) {
      setToastMsg({ message: 'Select an elder before saving the note.', type: 'error' });
      return;
    }
    setIsSubmittingNote(true);
    try {
      const res = await fetch('/api/timeline/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderId: targetElderId,
          note: `[Clinical: ${selectedTask}] ${careNoteText}`,
          actorName: 'Reeja K. (ASHA #402)'
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Observation note could not be saved.');
      }

      setToastMsg({ message: 'Observation note recorded successfully.', type: 'success' });

      // Add to local activity feed
      setActivities(prev => [
        {
          id: Date.now().toString(),
          text: `Observation added [${selectedTask}]: ${careNoteText}`,
          time: 'Just now',
          badge: 'Logged',
          badgeColor: 'bg-primary-container text-on-primary font-bold'
        },
        ...prev
      ]);

      setCareNoteText('');
      await Promise.all([fetchElderDetail(targetElderId), fetchWardData()]);
    } catch (e) {
      console.error('Save care note error:', e);
      setToastMsg({
        message: e instanceof Error ? e.message : 'Observation note could not be saved.',
        type: 'error',
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const filteredElders = elders.filter(elder => {
    const isAttention = elder.current_stage && elder.current_stage !== 'normal';
    if (filterTab === 'attention' && !isAttention) return false;
    if (filterTab === 'normal' && isAttention) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = elder.full_name?.toLowerCase().includes(q);
      const matchAddr = elder.address?.toLowerCase().includes(q);
      const matchNotes = elder.conditions_notes?.toLowerCase().includes(q);
      return matchName || matchAddr || matchNotes;
    }
    return true;
  });

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <Navbar />

      <Toast message={toastMsg?.message || null} type={toastMsg?.type} onClose={() => setToastMsg(null)} />

      <main className="w-full bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          <div className="max-w-[1440px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Total Elders */}
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all border border-outline-variant/20">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Ward 4 Elders</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">elderly</span>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-extrabold text-primary">{elders.length}</div>
                  <p className="text-xs text-on-surface-variant mt-0.5">100% census mapped</p>
                </div>
                <div className="mt-3 pt-2 border-t border-outline-variant/10 flex items-center gap-1 text-secondary text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Perunad Grama Panchayat</span>
                </div>
              </div>

              {/* Routines Confirmed */}
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Normal Confirmed</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">87.5%</span>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-extrabold text-secondary">42</div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Routine signals verified</p>
                </div>
                <div className="mt-3 w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full transition-all duration-700 w-[87.5%]"></div>
                </div>
              </div>

              {/* Soft Concerns */}
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Inquiries / Soft</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-tertiary-container animate-pulse"></span>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-extrabold text-tertiary-container">4</div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Within 30m grace window</p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-on-surface-variant text-xs">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">query_builder</span>
                  <span>IVR retry in progress</span>
                </div>
              </div>

              {/* In Escalation Ladder */}
              <div className="bg-error-container/30 rounded-xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden hover:shadow-md transition-all border border-error-container">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-error font-bold uppercase tracking-wider">Escalation Ladder</span>
                  <span className="px-2 py-0.5 rounded bg-error text-on-error text-xs font-bold animate-pulse">2 Active</span>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-extrabold text-error">02</div>
                  <p className="text-xs text-on-surface-variant mt-0.5">1 neighbor dispatch / 1 IVR</p>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-error font-semibold">
                  <span className="truncate">Neighbor Suma en route</span>
                  <span className="material-symbols-outlined text-[16px]">directions_walk</span>
                </div>
              </div>

              {/* Fatigue Cooldown Safeguard */}
              <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all border border-outline-variant/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Cooldown Shield</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">shield_with_heart</span>
                </div>
                <div className="mt-2">
                  <div className="text-3xl font-extrabold text-primary">3 <span className="text-sm font-normal text-on-surface-variant">Homes</span></div>
                  <p className="text-xs text-on-surface-variant mt-0.5">Community fatigue guard</p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-primary text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>+20% Dynamic leeway</span>
                </div>
              </div>

            </div>

            {/* Alert Fatigue / Ladder Calibration Notice Banner */}
            <div className="bg-surface-container rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-outline-variant/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-tertiary-fixed flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <span className="material-symbols-outlined text-tertiary text-[24px]">balance</span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-on-surface">Ammini Amma (78) — Ladder Safeguard Calibration Active</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">Goodwill Shield</span>
                  </div>
                  <p className="text-xs text-on-surface-variant max-w-4xl leading-relaxed">
                    2 automated false-alarm resolutions in past 14 days. Verification threshold widened by +20% (now 75 mins late allowance) before neighbor escalation triggers. Prevents alert fatigue for volunteer Suma K.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert('Opening Ladder Calibration Matrix for Ammini Amma:\nPillbox baseline offset +15m.\nKudumbashree link priority 2.\nEscalation cooldown shield ACTIVE.')}
                className="px-3.5 py-2 rounded-lg bg-surface-container-lowest text-primary text-xs font-bold shadow-xs hover:bg-surface transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>Adjust Ladder Rules</span>
              </button>
            </div>

            {/* Main Content Workspace (Split Grid: Left Table 8 cols, Right Detail Drawer 4 cols) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Registry & Incident Table */}
              <div className="xl:col-span-8 flex flex-col gap-4">
                
                {/* Controls, Filter Tabs & Search */}
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs space-y-4 border border-outline-variant/20">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-on-surface tracking-tight">Ward 4 Eldercare Registry</h2>
                      <p className="text-xs text-on-surface-variant">Live telemetry and escalation ladder state across Kozhencherry ward</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => alert('Add Elder Wizard:\n1. Demographic details & Kudumbashree link\n2. Primary neighbor volunteer assignment\n3. Baseline routine calibration.')}
                        className="px-3 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center gap-1 shadow-xs hover:bg-primary-container transition-all"
                      >
                        <span className="material-symbols-outlined text-[18px]">add_circle</span>
                        <span>Add Elder</span>
                      </button>
                      <button
                        type="button"
                        onClick={fetchWardData}
                        className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-all"
                        title="Refresh Live Registry"
                      >
                        <span className="material-symbols-outlined text-[20px]">sync</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Ribbon & Search Input */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
                    <div className="inline-flex p-1 bg-surface-container rounded-lg self-start">
                      <button
                        type="button"
                        onClick={() => setFilterTab('all')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                          filterTab === 'all'
                            ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                        suppressHydrationWarning
                      >
                        All ({elders.length || 48})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterTab('attention')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                          filterTab === 'attention'
                            ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span>Needs Attention</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-error-container text-on-error-container text-[11px] font-bold" suppressHydrationWarning>
                          {elders.filter(elder => elder.current_stage && elder.current_stage !== 'normal').length || 6}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterTab('normal')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                          filterTab === 'normal'
                            ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                        suppressHydrationWarning
                      >
                        Normal Routine ({elders.filter(elder => !elder.current_stage || elder.current_stage === 'normal').length || 42})
                      </button>
                    </div>

                    <div className="relative w-full md:w-72">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search elder, house, or ASHA..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Incident & Registry Table */}
                <div className="bg-surface-container-lowest rounded-xl shadow-xs overflow-hidden flex flex-col border border-outline-variant/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[700px]">
                      <thead>
                        <tr className="bg-surface-container-low/60 text-on-surface-variant text-[11px] uppercase tracking-wider font-bold">
                          <th className="py-3 px-4">Elder & Residence</th>
                          <th className="py-3 px-3">Baseline</th>
                          <th className="py-3 px-3">Last Verified Signal</th>
                          <th className="py-3 px-3">Triage / Score</th>
                          <th className="py-3 px-3">Escalation Route</th>
                          <th className="py-3 px-4 text-right">Quick Action</th>
                        </tr>
                      </thead>
                                      <tbody className="divide-y divide-surface-container">
                        {filteredElders.map(elder => {
                          const initials = elder.full_name.split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase();
                          const isAttention = elder.current_stage && elder.current_stage !== 'normal';
                          return (
                            <tr key={elder.id} className={`${isAttention ? 'bg-error-container/10' : ''} hover:bg-surface-container-low transition-colors`}>
                              <td className="py-3.5 px-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-on-primary-fixed shadow-xs">{initials}</div><div className="min-w-0"><span className="font-bold text-sm text-on-surface block leading-tight">{elder.full_name}</span><p className="text-xs text-on-surface-variant truncate">{elder.address}</p></div></div></td>
                              <td className="py-3.5 px-3"><span className="text-xs text-secondary font-bold">{elder.baseline_established_at ? 'Established' : 'Collecting'}</span></td>
                              <td className="py-3.5 px-3"><span className="text-xs text-on-surface-variant">{elder.last_signal_at ? new Date(elder.last_signal_at).toLocaleString() : 'No signal recorded'}</span></td>
                              <td className="py-3.5 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isAttention ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>Score {elder.concern_score ?? 0}</span></td>
                              <td className="py-3.5 px-3"><span className="text-xs text-on-surface-variant">{elder.current_stage || 'normal'}</span></td>
                              <td className="py-3.5 px-4 text-right"><button type="button" onClick={() => fetchElderDetail(elder.id)} className="px-2.5 py-1.5 rounded bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high">Timeline</button></td>
                            </tr>
                          );
                        })}
                        {filteredElders.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-on-surface-variant">No elders match this view.</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer */}
                  <div className="p-4 bg-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-3 text-on-surface-variant text-xs">
                    <span>Showing {filteredElders.length} registered elders in Ward 4 • Sync interval 4s</span>
                    <div className="flex items-center gap-2">
                      <button type="button" disabled className="px-3 py-1 rounded bg-surface-container-lowest font-bold text-on-surface shadow-xs disabled:opacity-50">Prev</button>
                      <span className="px-2 font-bold text-primary">Page 1 of 1</span>
                      <button type="button" disabled className="px-3 py-1 rounded bg-surface-container-lowest font-bold text-on-surface shadow-xs disabled:opacity-50">Next</button>
                    </div>
                  </div>
                </div>

                {/* Community Escalation Matrix Visual Legend */}
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs space-y-3 border border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-on-surface font-bold uppercase tracking-wider">Perunad Panchayat Triage Ladder System</span>
                    <span className="text-on-surface-variant text-[11px]">Protocol Rev 3.2</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-secondary-container/40 flex flex-col items-center">
                      <span className="text-[11px] text-on-secondary-container font-bold uppercase">0 - 19 Baseline</span>
                      <span className="text-xs text-on-surface font-bold mt-1">Normal Routine</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">Ambient sensors active</span>
                    </div>
                    <div className="p-3 rounded-lg bg-tertiary-fixed/40 flex flex-col items-center">
                      <span className="text-[11px] text-tertiary font-bold uppercase">20 - 39 Inquiry</span>
                      <span className="text-xs text-on-surface font-bold mt-1">Soft Concern</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">Malayalam IVR retry (30m)</span>
                    </div>
                    <div className="p-3 rounded-lg bg-tertiary-container/20 flex flex-col items-center">
                      <span className="text-[11px] text-tertiary-container font-bold uppercase">40 - 59 Verification</span>
                      <span className="text-xs text-on-surface font-bold mt-1">Auto Verify Call</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">ASHA alert generated</span>
                    </div>
                    <div className="p-3 rounded-lg bg-error-container/40 flex flex-col items-center">
                      <span className="text-[11px] text-error font-bold uppercase">60+ Escalation</span>
                      <span className="text-xs text-on-surface font-bold mt-1">Neighbor Dispatched</span>
                      <span className="text-[10px] text-on-surface-variant mt-0.5">Physical walking visit</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Quick Care Action Drawer / Modal Preview */}
              <div className="xl:col-span-4 flex flex-col gap-4">
                
                {/* Selected Elder Live Detail & Escalation Ladder Inspector */}
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs space-y-4 border border-outline-variant/20">
                  <div className="flex items-center justify-between pb-1 border-b border-outline-variant/10">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-error animate-ping"></span>
                      <h3 className="text-xs text-error font-bold uppercase tracking-wider">Active Incident Focus</h3>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-error-container text-on-error-container font-bold">14 mins ongoing</span>
                  </div>

                  {/* Elder Summary Card */}
                  <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-bold text-lg shrink-0 shadow-xs border border-outline-variant/40">{(selectedElder?.full_name || 'Ammini Amma').split(' ').map(name => name[0]).join('').slice(0, 2).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-on-surface truncate">{selectedElder?.full_name || 'Ammini Amma'}</h4>
                          <span className="text-xs px-2 py-0.5 rounded bg-error text-on-error font-bold">Score {selectedElder?.concern_score || 64}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant truncate">{selectedElder?.address || 'Kunnumpurathu House, Ward 4'}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold">Hypertension</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold">Lives Alone</span>
                        </div>
                      </div>
                    </div>

                    {/* Incident Cause */}
                    <div className="p-3 rounded-lg bg-surface-container-lowest text-on-surface space-y-1">
                      <div className="text-xs text-error font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        <span>Signal Trigger Cause:</span>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        Late pillbox (82 mins delayed) & missed automated Malayalam IVR callback prompt at 08:00 AM.
                      </p>
                    </div>
                  </div>

                  {/* Physical Ladder Step Indicator */}
                  <div className="space-y-3 pt-1">
                    <span className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Live Escalation Ladder Progress</span>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                        <div className="flex-1 flex items-center justify-between text-xs">
                          <span className="line-through text-on-surface-variant">1. Automated Telephony Check (08:00 AM)</span>
                          <span className="text-on-surface-variant">Unanswered</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                        <div className="flex-1 flex items-center justify-between text-xs">
                          <span className="line-through text-on-surface-variant">2. Secondary Cooldown Grace Window</span>
                          <span className="text-on-surface-variant">+20m Expired</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-error bg-error-container/20 p-2 rounded-lg border border-error-container/30">
                        <span className="material-symbols-outlined text-error text-[20px] animate-bounce">directions_walk</span>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">3. Neighbor Check Dispatched</span>
                            <span className="font-bold text-error">Active Now</span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">Suma K. notified via SMS & phone</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-on-surface-variant/60 opacity-60">
                        <span className="material-symbols-outlined text-[20px]">circle</span>
                        <div className="flex-1 flex items-center justify-between text-xs">
                          <span>4. ASHA Reeja On-Site Visit</span>
                          <span>If unresolved in 16m</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Immediate Action Dispatch Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => alert('Manual Resolution: Calling Neighbor Suma (+91 94472 10842) for instant voice update.')}
                      className="flex-1 px-3 py-2.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:bg-primary-container shadow-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                      <span>Call Neighbor Suma</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCheckIn}
                      className="px-3 py-2.5 rounded-lg bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container hover:text-on-secondary-container transition-all flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      <span>Clear Check-in</span>
                    </button>
                  </div>
                </div>

                {/* Field Visit & Care Note Logger */}
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs space-y-4 border border-outline-variant/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                      <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">ASHA Field Observation</h3>
                    </div>
                    <span className="text-[11px] text-secondary font-bold">Reeja K. #402</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-on-surface-variant block mb-1 font-semibold">Target Household / Elder</label>
                      <select
                        value={selectedNoteElder}
                        onChange={e => setSelectedNoteElder(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg bg-surface-container-low text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant/30 font-medium"
                      >
                        <option value="">Select an elder</option>
                        {elders.map(elder => (
                          <option key={elder.id} value={elder.id}>{elder.full_name} — {elder.address}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-on-surface-variant block mb-1 font-semibold">Scheduled Clinical Task</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['BP Check', 'Sugar Strip', 'Med Refill', 'Palliative Kit'].map(task => (
                          <button
                            key={task}
                            type="button"
                            onClick={() => setSelectedTask(task)}
                            className={`px-2.5 py-2 rounded-lg text-xs font-bold text-left flex items-center gap-1.5 transition-all border ${
                              selectedTask === task
                                ? 'bg-primary-container text-on-primary border-primary'
                                : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/20'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {task === 'BP Check' ? 'monitor_heart' : task === 'Sugar Strip' ? 'bloodtype' : task === 'Med Refill' ? 'prescriptions' : 'healing'}
                            </span>
                            <span>{task}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-on-surface-variant block mb-1 font-semibold">Field Clinical Observation Note</label>
                      <textarea
                        rows={3}
                        value={careNoteText}
                        onChange={e => setCareNoteText(e.target.value)}
                        placeholder="e.g., Blood Pressure check scheduled for Friday morning; pillbox battery inspected and full..."
                        className="w-full p-3 rounded-lg bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border border-outline-variant/30"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveCareNote}
                      disabled={isSubmittingNote}
                      className="w-full py-2.5 rounded-lg bg-primary-container text-on-primary text-xs font-bold hover:bg-primary shadow-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">save</span>
                      <span>{isSubmittingNote ? 'Saving...' : 'Commit Note to Ward Registry'}</span>
                    </button>
                  </div>
                </div>

                {/* Recent Ward Activity Log */}
                <div className="bg-surface-container-lowest rounded-xl p-4 shadow-xs space-y-3 border border-outline-variant/20">
                  <div className="flex items-center justify-between pb-1 border-b border-outline-variant/10">
                    <h4 className="text-xs text-on-surface font-bold uppercase tracking-wider">Recent Community Check Log</h4>
                    <span className="text-on-surface-variant text-[11px]">Today</span>
                  </div>
                  <div className="space-y-2.5">
                    {activities.map(act => (
                      <div key={act.id} className="p-2.5 rounded-lg bg-surface-container-low space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${act.badgeColor}`}>
                            {act.badge}
                          </span>
                          <span className="text-on-surface-variant text-[10px]">{act.time}</span>
                        </div>
                        <p className="text-xs text-on-surface font-medium leading-relaxed">{act.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
