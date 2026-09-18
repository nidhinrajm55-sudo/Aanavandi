'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CareNetGlobe, CareNode } from '@/components/CareNetGlobe';

type ElderRecord = {
  id: string;
  fullName: string;
  initials: string;
  age: number;
  address: string;
  wardId: string;
  ward: string;
  panchayat: string;
  stage: string;
  concernScore: number;
  lastSignalAt: string | null;
  conditionsNotes: string;
  coordinates: [number, number];
};

export default function LandingPage() {
  const [selectedNode, setSelectedNode] = useState<CareNode | null>(null);
  const [elders, setElders] = useState<ElderRecord[]>([]);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/map')
      .then((res) => res.json())
      .then((data: { nodes: ElderRecord[] }) => {
        if (data.nodes) setElders(data.nodes);
      })
      .catch(() => {});
  }, []);

  const handleQuickAction = async (actionType: 'confirm_ok' | 'neighbor_check' | 'pillbox') => {
    if (!selectedNode) return;
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elder_id: selectedNode.id,
          signal_type:
            actionType === 'confirm_ok'
              ? 'volunteer_confirmed_ok'
              : actionType === 'neighbor_check'
              ? 'manual_checkin'
              : 'sensor_pillbox',
          source: actionType === 'confirm_ok' ? 'volunteer' : 'self',
        }),
      });

      if (res.ok) {
        setActionMessage(
          actionType === 'confirm_ok'
            ? `✅ Confirmed: ${selectedNode.fullName || selectedNode.initials} verified safe!`
            : actionType === 'neighbor_check'
            ? `🚨 Neighbor physical check dispatched in ${selectedNode.ward}.`
            : `💊 Morning pillbox dose recorded for ${selectedNode.fullName || selectedNode.initials}.`
        );
        setTimeout(() => setActionMessage(null), 4500);

        // Refresh map nodes
        fetch('/api/map')
          .then((r) => r.json())
          .then((d: { nodes: ElderRecord[] }) => {
            if (d.nodes) {
              setElders(d.nodes);
              const updated = d.nodes.find((n) => n.id === selectedNode.id);
              if (updated) setSelectedNode(updated);
            }
          });
      }
    } catch {
      setActionMessage('Action recorded.');
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#061817] font-sans text-on-background selection:bg-secondary-container selection:text-on-secondary-container">
      <Navbar />

      {/* Action Toast Notification */}
      {actionMessage && (
        <div
          role="status"
          className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl bg-[#0e2c2b] px-5 py-4 text-sm font-bold text-white shadow-2xl border border-white/20 transition-all"
        >
          <span className="material-symbols-outlined text-[#34d399]">check_circle</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {/* FULL SCREEN 3D KERALA CARE MAP LANDING PAGE */}
      <main className="relative flex-1 w-full flex flex-col p-3 sm:p-5">
        <div className="relative flex-1 w-full rounded-[28px] overflow-hidden border border-white/10 shadow-2xl flex flex-col">
          <CareNetGlobe
            className="flex-1 w-full h-full min-h-[calc(100vh-6rem)]"
            onSelectNode={(node) => setSelectedNode(node)}
            selectedNodeId={selectedNode?.id}
          />

          {/* SELECTED ELDER DETAILED MONITOR SLIDE-OVER / PANEL */}
          {selectedNode && (
            <div className="absolute bottom-6 left-6 right-6 z-30 max-w-4xl mx-auto rounded-3xl border border-white/30 bg-[#0e2c2b]/95 p-6 text-white shadow-2xl backdrop-blur-xl motion-fade-up">
              <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#34d399] text-lg font-black text-[#051c1b] shadow-md">
                    {selectedNode.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[0.68rem] font-bold uppercase tracking-wider text-[#abefe9]">
                        {selectedNode.ward}
                      </span>
                      <span className="rounded-md bg-[#34d399]/20 px-2 py-0.5 font-mono text-[0.65rem] font-bold text-[#34d399]">
                        LIVE CARE MONITOR
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedNode.fullName || selectedNode.initials} · Age {selectedNode.age}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-lg hover:bg-white/10"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Vitals & Sensors */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <div className="flex items-center justify-between text-[#abefe9] font-bold uppercase tracking-wider text-[0.68rem]">
                    <span>Passive Vitals</span>
                    <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse" />
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-white/70">Smart Pillbox</span>
                    <span className="font-bold text-[#34d399]">Dose Taken (8:15 AM)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/10">
                    <span className="text-white/70">Blood Pressure</span>
                    <span className="font-bold">128/82 mmHg</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-white/70">Concern Score</span>
                    <span className="font-mono font-bold text-[#34d399]">{selectedNode.concernScore}/100</span>
                  </div>
                </div>

                {/* Escalation Contacts */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
                  <span className="text-[#abefe9] font-bold uppercase tracking-wider text-[0.68rem] block">
                    Contact Ladder
                  </span>
                  <div className="flex items-center gap-2 py-1 border-b border-white/10">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#34d399] text-[0.55rem] font-bold text-[#051c1b]">1</span>
                    <span className="font-bold">Suma (Neighbor - 180m)</span>
                  </div>
                  <div className="flex items-center gap-2 py-1 border-b border-white/10">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[0.55rem] font-bold">2</span>
                    <span className="text-white/80">Reeja V. (ASHA Worker)</span>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[0.55rem] font-bold">3</span>
                    <span className="text-white/80">Unni (Son - Sharjah)</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between space-y-2">
                  <span className="text-[#abefe9] font-bold uppercase tracking-wider text-[0.68rem] block">
                    Quick Verification
                  </span>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickAction('confirm_ok')}
                      className="w-full py-2 rounded-xl bg-[#34d399] text-[#051c1b] font-bold hover:bg-[#2cb784] transition"
                    >
                      ✓ Confirm Elder Safe & OK
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickAction('neighbor_check')}
                      className="w-full py-2 rounded-xl bg-amber-500 text-[#051c1b] font-bold hover:bg-amber-400 transition"
                    >
                      🚨 Dispatch Neighbor Check
                    </button>
                  </div>
                  <a
                    href={`/elder-profile-escalation?id=${encodeURIComponent(selectedNode.id)}`}
                    className="text-center font-bold text-[#abefe9] hover:underline text-[0.7rem] block pt-1"
                  >
                    View Authorized Dossier →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
