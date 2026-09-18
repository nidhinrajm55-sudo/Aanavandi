'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { DemoControlPanel } from '@/components/DemoControlPanel';
import { StatusBadge } from '@/components/StatusBadge';
import { TimelineFeed } from '@/components/TimelineFeed';
import { Elder, TimelineEntry, Contact } from '@/types/carenet';

export default function DemoSimulatorPage() {
  const [elder, setElder] = useState<Elder | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDemoState = async () => {
    try {
      const res = await fetch('/api/elders/elder-ammini-78', { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load demo state.');
      {
        const data = await res.json();
        setElder(data.elder);
        setTimeline(data.timeline || []);
        setContacts(data.contacts || []);
      }
      setErrorMessage(null);
    } catch (err) {
      console.error('Demo page fetch error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load demo state.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchDemoState, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface pb-12">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {isLoading && <div className="bg-surface-container rounded-xl p-3 text-xs font-bold text-primary">Loading live demo state…</div>}
        {errorMessage && <div className="bg-error-container text-on-error-container border border-error rounded-xl p-3 text-xs font-bold">{errorMessage}</div>}
        
        {/* Header */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Live Pitch Controller & Signal Simulator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            Scripted Incident Replay Panel (§14 Script)
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Replay the live scenario: Ammini Amma (78) in Kozhencherry, neighbor Suma next door, ASHA worker Reeja, and son Manoj in Sharjah.
          </p>
        </div>

        {/* Demo Controller Widget */}
        <DemoControlPanel onStateChanged={fetchDemoState} />

        {/* Live Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Ammini Elder State Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-3">
              <span className="text-xs font-bold text-on-surface-variant uppercase">Target Elder</span>
              <StatusBadge stage={elder?.current_stage} concernScore={elder?.concern_score} />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-on-surface">{elder?.full_name || 'Ammini Amma'}</h3>
              <p className="text-xs text-on-surface-variant">{elder?.address}</p>
            </div>

            <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/20 text-xs text-on-surface space-y-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Concern Score:</span>
                <span className="font-bold text-error">{elder?.concern_score || 0} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Current Stage:</span>
                <span className="font-bold text-primary uppercase">{elder?.current_stage || 'NORMAL'}</span>
              </div>
            </div>
          </div>

          {/* Contact Ladder State Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="border-b border-outline-variant/10 pb-3">
              <span className="text-xs font-bold text-on-surface-variant uppercase">Contact Ladder Priority</span>
            </div>

            <div className="space-y-2">
              {contacts.map((c, idx) => (
                <div
                  key={c.id}
                  className="bg-surface-container-low border border-outline-variant/20 rounded-lg p-2.5 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-on-surface">
                      #{idx + 1} {c.name}
                    </span>
                    <p className="text-[11px] text-on-surface-variant">
                      {c.relationship} • {c.timezone}
                    </p>
                  </div>
                  {c.timezone !== 'Asia/Kolkata' && (
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed text-[10px] px-2 py-0.5 rounded font-bold">
                      Quiet Hours Protected
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sharjah Son View Simulation */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 space-y-4 shadow-xs">
            <div className="border-b border-outline-variant/10 pb-3">
              <span className="text-xs font-bold text-on-surface-variant uppercase">Sharjah Son Status (Manoj)</span>
            </div>

            <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20 text-center space-y-3">
              {elder?.current_stage === 'critical' ? (
                <div className="space-y-2">
                  <span className="inline-block bg-error text-on-error font-extrabold text-xs px-3 py-1 rounded-full animate-bounce">
                    CRITICAL ALARM DISPATCHED
                  </span>
                  <p className="text-xs text-error font-medium">
                    Local escalation timed out. Pinging Manoj in Sharjah (Quiet hours overridden).
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="inline-block bg-secondary-container text-on-secondary-container font-bold text-xs px-3 py-1 rounded-full">
                    GOODWILL SHIELD ACTIVE
                  </span>
                  <p className="text-xs text-on-surface-variant">
                    Local neighbor handling check. Manoj&apos;s sleep in Sharjah is undisturbed.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Live Timeline Stream */}
        <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xs">
          <TimelineFeed timeline={timeline} elderId="elder-ammini-78" userRole="family" onNoteAdded={fetchDemoState} />
        </div>
      </main>
    </div>
  );
}
