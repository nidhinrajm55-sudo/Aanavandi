'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Incident } from '@/types/carenet';

export default function NeighborView() {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [step, setStep] = useState<'idle' | 'going' | 'done'>('idle');
  const [outcomeMsg, setOutcomeMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [isLoggingVisit, setIsLoggingVisit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNeighborData = async () => {
    try {
      const elderId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('id') || 'elder-ammini-78'
        : 'elder-ammini-78';
      const res = await fetch(`/api/elders/${encodeURIComponent(elderId)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load neighbor requests.');
      {
        const data = await res.json();
        const activeInc = (data.incidents || []).find((i: Incident) => i.stage !== 'resolved');
        setIncident(activeInc || null);
      }
      setErrorMessage(null);
    } catch (err) {
      console.error('Neighbor view fetch error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load neighbor requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchNeighborData, 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchNeighborData();
    }, 3000);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };
  }, []);

  const handleRespond = async (response: 'ok' | 'needs_help', note?: string) => {
    if (!incident || isResponding) return;
    setIsResponding(true);
    try {
      const res = await fetch(`/api/escalations/${incident.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: 'c-suma-neighbor',
          response,
          note: note || (response === 'ok' ? 'Neighbor confirmed elder is OK.' : 'Elder needs assistance.')
        })
      });
      if (!res.ok) throw new Error('Response could not be submitted.');
      {
        setStep('done');
        setOutcomeMsg(
          response === 'ok'
            ? "Thank you Suma! You marked Ammini as fine. Incident closed and logged to timeline."
            : "Emergency reported! Critical alert sent to ASHA worker and Family."
        );
        fetchNeighborData();
      }
      setErrorMessage(null);
    } catch (err) {
      console.error('Error responding:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Response failed.');
    } finally {
      setIsResponding(false);
    }
  };

  const hasActiveAlert = incident && incident.stage !== 'resolved';

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface pb-12">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {errorMessage && <div role="alert" className="bg-error-container text-on-error-container border border-error rounded-xl p-3 text-xs font-bold">{errorMessage}</div>}
        {isLoading ? (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-8 text-center text-sm font-semibold text-on-surface-variant">
            Loading nearby care requests…
          </div>
        ) : (
        <>
        {/* Mobile Header Banner */}
        <div className="bg-primary text-on-primary rounded-2xl p-5 shadow-xs border border-primary-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[28px]">spatial_tracking</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-on-primary">Suma Nextdoor</h1>
              <p className="text-xs text-on-primary-container">Local Volunteer • Ward 4 (#403)</p>
            </div>
          </div>
          <span className="text-xs bg-surface-container text-primary px-2.5 py-1 rounded-full font-bold">
            Neighbor Role
          </span>
        </div>

        {/* Main Action Card */}
        {hasActiveAlert ? (
          <div className="bg-surface-container-lowest border-2 border-error-container rounded-2xl p-6 shadow-md space-y-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 bg-error-container text-on-error-container font-extrabold text-xs px-3 py-1 rounded-full border border-error/30">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                NEIGHBOR CHECK REQUESTED
              </span>
              <span className="text-xs font-bold text-on-surface-variant">2 mins ago</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-on-surface">Ammini Amma (78)</h2>
              <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">location_on</span>
                Kunnumpurathu House (Next Door House #402)
              </p>
              <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 leading-relaxed">
                Smart Pillbox was expected by 08:15 AM but has not been opened yet today. Please take a quick glance over the fence or knock on her door.
              </p>
            </div>

            {step === 'idle' && (
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('going')}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary font-bold text-lg py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[56px]"
                >
                  <span className="material-symbols-outlined text-[24px]">directions_walk</span>
                  I&apos;ll Go Check Now
                </button>
              </div>
            )}

            {step === 'going' && (
              <div className="space-y-4 bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl">
                <p className="text-xs font-bold text-primary text-center uppercase tracking-wider">
                  What did you find when visiting Ammini?
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRespond('ok')}
                    className="w-full bg-secondary hover:bg-secondary-container hover:text-on-secondary-container text-on-secondary font-bold text-lg py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[56px]"
                  >
                    <span className="material-symbols-outlined text-[24px]">check_circle</span>
                    She&apos;s Fine (All Good)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRespond('needs_help', 'Neighbor Suma visited - Elder requires immediate medical assistance')}
                    className="w-full bg-error hover:bg-error/90 text-on-error font-bold text-lg py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 min-h-[56px]"
                  >
                    <span className="material-symbols-outlined text-[24px]">emergency</span>
                    She Needs Help!
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-xs text-center space-y-4">
            <div className="w-16 h-16 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-surface">All Elders Safe</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                No active check requests in your neighborhood right now.
              </p>
            </div>

            {outcomeMsg && (
              <div className="bg-surface-container text-primary border border-outline-variant/30 rounded-xl p-3.5 text-xs font-semibold text-left">
                {outcomeMsg}
              </div>
            )}

            <button
              type="button"
              disabled={isLoggingVisit}
              onClick={async () => {
                setIsLoggingVisit(true);
                setErrorMessage(null);
                try {
                  const response = await fetch('/api/signals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      elderId: 'elder-ammini-78',
                      signalType: 'volunteer_confirmed_ok',
                      source: 'volunteer',
                      metadata: { note: 'Proactive neighbor glance confirmation by Suma' }
                    })
                  });
                  if (!response.ok) throw new Error('Visit could not be logged. Try again.');
                  setOutcomeMsg('Visit logged. The care timeline has been updated.');
                  await fetchNeighborData();
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : 'Visit could not be logged.');
                } finally {
                  setIsLoggingVisit(false);
                }
              }}
              className="w-full bg-primary text-on-primary font-bold text-sm py-3 rounded-xl hover:bg-primary-container transition-colors min-h-[48px] disabled:cursor-wait disabled:opacity-60"
            >
              {isLoggingVisit ? 'Logging visit…' : 'Log Proactive Casual Visit (Checked, She’s Fine)'}
            </button>
          </div>
        )}
        {outcomeMsg && hasActiveAlert && (
          <div role="status" className="bg-surface-container text-primary border border-outline-variant/30 rounded-xl p-3.5 text-xs font-semibold">
            {outcomeMsg}
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
