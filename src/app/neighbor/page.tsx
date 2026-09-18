'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Incident, Contact } from '@/types/carenet';
import { Toast } from '@/components/Toast';
import { CardSkeleton } from '@/components/Skeletons';

export default function NeighborView() {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [elderName, setElderName] = useState('Rehana Hidayathulla');
  const [elderAge, setElderAge] = useState(92);
  const [elderAddress, setElderAddress] = useState('Kunnumpurathu House (Next Door House #402)');
  const [elderWard, setElderWard] = useState('Ward 4 Kozhencherry');
  const [neighborContact, setNeighborContact] = useState<Contact | null>(null);
  const [step, setStep] = useState<'idle' | 'going' | 'done'>('idle');
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isResponding, setIsResponding] = useState(false);
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
        if (data.elder) {
          setElderName(data.elder.full_name || 'Kerala Elder');
          setElderAge(data.elder.age || 78);
          setElderAddress(data.elder.address || 'Local Panchayat Ward');
          setElderWard(data.elder.ward?.name || 'Ward 4');
        }
        // Fix Bug #3: Dynamically fetch neighbor contact ID for loaded elder
        const foundContact = (data.contacts || []).find((c: Contact) => c.relationship === 'neighbor');
        setNeighborContact(foundContact || null);
      }
    } catch (err) {
      console.error('Neighbor view fetch error:', err);
      setToastMsg({
        message: err instanceof Error ? err.message : 'Unable to load neighbor requests.',
        type: 'error',
      });
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

    // Fix Bug #3: Use dynamic neighbor contact ID instead of hardcoded string
    const contactId = neighborContact?.id || `c-${incident.elder_id}-neighbor`;

    try {
      const res = await fetch(`/api/escalations/${incident.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId,
          response,
          note: note || (response === 'ok' ? 'Neighbor confirmed elder is OK.' : 'Elder needs assistance.')
        })
      });
      if (!res.ok) throw new Error('Response could not be submitted.');
      {
        setStep('done');
        setToastMsg({
          message: response === 'ok'
            ? `Thank you! Marked ${elderName} as safe. Incident resolved.`
            : `Emergency reported! Alert escalated to ASHA worker & overseas family.`,
          type: response === 'ok' ? 'success' : 'error',
        });
        fetchNeighborData();
      }
    } catch (err) {
      console.error('Error responding:', err);
      setToastMsg({
        message: err instanceof Error ? err.message : 'Response failed.',
        type: 'error',
      });
    } finally {
      setIsResponding(false);
    }
  };

  const hasActiveAlert = incident && incident.stage !== 'resolved';

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface pb-12">
      <Navbar />

      <Toast message={toastMsg?.message || null} type={toastMsg?.type} onClose={() => setToastMsg(null)} />

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <CardSkeleton />
        ) : (
        <>
        {/* Mobile Header Banner */}
        <div className="bg-primary text-on-primary rounded-2xl p-5 shadow-xs border border-primary-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[28px]">spatial_tracking</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-on-primary">{neighborContact?.name || 'Local Neighbor'}</h1>
              <p className="text-xs text-on-primary-container">Volunteer Response • {elderWard}</p>
            </div>
          </div>
          <span className="text-xs bg-surface-container text-primary px-2.5 py-1 rounded-full font-bold">
            Neighbor Role
          </span>
        </div>

        {/* 3-Step Mini Progress Stepper */}
        <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3 border border-outline-variant/20 text-xs font-bold text-on-surface-variant">
          <div className={`flex items-center gap-1 ${step === 'idle' ? 'text-primary font-extrabold' : 'text-primary'}`}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[0.65rem]">1</span>
            Notified
          </div>
          <span className="text-outline-variant">→</span>
          <div className={`flex items-center gap-1 ${step === 'going' ? 'text-primary font-extrabold' : step === 'done' ? 'text-primary' : 'text-outline-variant'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] ${step === 'going' || step === 'done' ? 'bg-primary text-white' : 'bg-outline-variant/30 text-on-surface-variant'}`}>2</span>
            On the way
          </div>
          <span className="text-outline-variant">→</span>
          <div className={`flex items-center gap-1 ${step === 'done' ? 'text-secondary font-extrabold' : 'text-outline-variant'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] ${step === 'done' ? 'bg-secondary text-white' : 'bg-outline-variant/30 text-on-surface-variant'}`}>3</span>
            Checked in
          </div>
        </div>

        {/* Main Action Card */}
        {hasActiveAlert ? (
          <div className="bg-surface-container-lowest border-2 border-error-container rounded-2xl p-6 shadow-md space-y-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 bg-error-container text-on-error-container font-extrabold text-xs px-3 py-1 rounded-full border border-error/30">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                NEIGHBOR CHECK REQUESTED
              </span>
              <span className="text-xs font-bold text-on-surface-variant">Active Request</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-on-surface">{elderName} ({elderAge}y)</h2>
              <p className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">location_on</span>
                {elderAddress}
              </p>
              <p className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 leading-relaxed">
                Smart sensor detected missing signal baseline. Please perform a physical check at the residence and confirm status.
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
                  What did you find when visiting Rehana?
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

            <button
              type="button"
              disabled={isResponding}
              onClick={async () => {
                setIsResponding(true);
                try {
                  const response = await fetch('/api/signals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      elderId: incident?.elder_id || 'elder-ammini-78',
                      signalType: 'volunteer_confirmed_ok',
                      source: 'volunteer',
                      metadata: { note: 'Proactive neighbor glance confirmation' }
                    })
                  });
                  if (!response.ok) throw new Error('Visit could not be logged.');
                  setToastMsg({
                    message: 'Casual visit logged. Care timeline updated.',
                    type: 'success',
                  });
                  await fetchNeighborData();
                } catch (error) {
                  setToastMsg({
                    message: error instanceof Error ? error.message : 'Visit could not be logged.',
                    type: 'error',
                  });
                } finally {
                  setIsResponding(false);
                }
              }}
              className="w-full bg-primary text-on-primary font-bold text-sm py-3.5 rounded-xl hover:bg-primary-container transition-colors min-h-[52px] disabled:cursor-wait disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              {isResponding ? 'Logging visit…' : 'Log Proactive Casual Visit (Checked, She’s Fine)'}
            </button>
          </div>
        )}
        </>
        )}
      </main>
    </div>
  );
}
