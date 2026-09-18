'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { StatusBadge } from '@/components/StatusBadge';
import { TimelineFeed } from '@/components/TimelineFeed';
import { ContactLadderEditor } from '@/components/ContactLadderEditor';
import { Elder, Contact, TimelineEntry } from '@/types/carenet';

export default function FamilyDashboard() {
  const [elder, setElder] = useState<Elder | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const fetchElderData = async () => {
    try {
      const elderId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('id') || 'elder-ammini-78'
        : 'elder-ammini-78';
      const res = await fetch(`/api/elders/${encodeURIComponent(elderId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load elder data.');
      const data = await res.json();
      setElder(data.elder);
      setTimeline(data.timeline || []);
      setContacts(data.contacts || []);
      setErrorMessage(null);
    } catch (err) {
      console.error('Failed to fetch family dashboard data:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load family care data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchElderData, 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchElderData();
    }, 4000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  const handleManualCheckin = async () => {
    if (!elder || isCheckingIn) return;
    setIsCheckingIn(true);
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderId: elder.id,
          signalType: 'manual_checkin',
          source: 'family',
          metadata: { note: 'Manual family check-in via web app (Manoj Varghese, Sharjah)' }
        })
      });
      if (!res.ok) throw new Error('Check-in could not be registered.');
      setActionMessage('Manual check-in registered successfully.');
      fetchElderData();
    } catch (err) {
      console.error('Error logging manual check-in:', err);
      setActionMessage(err instanceof Error ? err.message : 'Check-in failed.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-primary font-bold">
          Loading Family Care Portal...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface pb-12">
      <Navbar />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* Banner header for Migrant Child in Sharjah */}
        <div className="care-surface relative overflow-hidden flex flex-col gap-4 border-primary/15 bg-[linear-gradient(135deg,rgba(0,67,64,0.98),rgba(23,107,102,0.92))] p-5 text-white shadow-[0_18px_50px_rgba(0,67,64,0.18)] sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[26px] border-white/10" aria-hidden="true" />
          <div className="relative">
            <div className="mb-2 flex items-center gap-2 text-primary-fixed font-bold text-xs tracking-wider uppercase">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">flight_takeoff</span>
              Family view · Sharjah (UTC+4)
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Monitoring: {elder?.full_name || 'Ammini Amma'}
            </h1>
            <p className="mt-1 text-xs text-white/75">
              {elder?.address} · Ward 4, Kozhencherry
            </p>
          </div>

          <button
            type="button"
            onClick={handleManualCheckin}
            className="bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary font-bold text-xs px-4 py-3 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            {isCheckingIn ? 'Registering…' : 'Log Manual Check-in on Behalf'}
          </button>
        </div>

        {(errorMessage || actionMessage) && (
          <div className={`${errorMessage ? 'bg-error-container text-on-error-container border-error' : 'bg-secondary-container text-on-secondary-container border-secondary'} border rounded-xl p-4 text-xs font-bold flex items-center gap-2 shadow-xs`}>
            <span className="material-symbols-outlined text-[20px]">{errorMessage ? 'error' : 'check_circle'}</span>
            {errorMessage || actionMessage}
          </div>
        )}

        {/* Elder Overview Card & Escalation Editor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-on-surface">Current Wellbeing Status</h2>
              <StatusBadge stage={elder?.current_stage} concernScore={elder?.concern_score} />
            </div>

            <div className="space-y-2.5 text-xs text-on-surface-variant border-t border-b border-outline-variant/10 py-3">
              <div className="flex justify-between">
                <span>Age:</span>
                <span className="font-bold text-on-surface">{elder?.age} years old</span>
              </div>
              <div className="flex justify-between">
                <span>Routine Baseline:</span>
                <span className="font-bold text-secondary bg-surface-container px-2 py-0.5 rounded">
                  Established (21 days data)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Last Confirmed Signal:</span>
                <span className="font-bold text-on-surface">
                  {elder?.last_signal_at
                    ? new Date(elder.last_signal_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Today morning'}
                </span>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-xs text-on-surface uppercase tracking-wider mb-1">Health & Medical Notes</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
                {elder?.conditions_notes || 'No medical notes recorded.'}
              </p>
            </div>
          </div>

          <div className="md:col-span-2">
            <ContactLadderEditor
              elderId={elder?.id || 'elder-ammini-78'}
              initialContacts={contacts}
              onContactsUpdated={() => fetchElderData()}
            />
          </div>

        </div>

        {/* Timeline Feed */}
        <TimelineFeed
          timeline={timeline}
          elderId={elder?.id || 'elder-ammini-78'}
          userRole="family"
          onNoteAdded={() => fetchElderData()}
        />
      </main>
    </div>
  );
}
