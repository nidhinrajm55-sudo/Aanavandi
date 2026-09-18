'use client';

import { useState } from 'react';
import { TimelineEntry } from '@/types/carenet';
import { MessageSquare, Activity, AlertCircle, CheckCircle2, User, Send } from 'lucide-react';

interface TimelineFeedProps {
  timeline: TimelineEntry[];
  elderId: string;
  userRole?: 'family' | 'neighbor' | 'asha';
  onNoteAdded?: () => void;
}

export function TimelineFeed({ timeline, elderId, userRole = 'family', onNoteAdded }: TimelineFeedProps) {
  const [noteText, setNoteText] = useState('');
  const [actorName, setActorName] = useState(
    userRole === 'family' ? 'Unni (Son - Sharjah)' : userRole === 'neighbor' ? 'Suma (Neighbor)' : 'Reeja V. (ASHA Worker)'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter visibility based on role: neighbor only sees 'all'
  const visibleTimeline = timeline.filter(item => {
    if (userRole === 'neighbor') {
      return item.visibility === 'all';
    }
    return true; // family & asha see everything
  });

  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/timeline/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderId,
          note: noteText,
          actorName,
          visibility: 'all'
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Note could not be added.');
      }
      setNoteText('');
      if (onNoteAdded) onNoteAdded();
    } catch (err) {
      console.error('Error posting note:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Note could not be added.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (type: TimelineEntry['entry_type']) => {
    switch (type) {
      case 'signal':
        return <Activity className="w-4 h-4 text-[var(--carenet-teal)]" />;
      case 'incident_opened':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'incident_resolved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'escalation_step':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="glass-panel rounded-[var(--carenet-radius-panel)] p-5">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--carenet-teal)]" />
            Shared Care Timeline
          </h3>
          <p className="text-xs text-slate-500">Single source of truth across Family, Neighbors & ASHA Workers</p>
        </div>
        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
          {visibleTimeline.length} Entries
        </span>
      </div>

      {/* Add Care Note Form */}
      <form onSubmit={handleSubmitNote} className="mb-6 rounded-[var(--carenet-radius-control)] border border-[var(--carenet-border)] bg-white/55 p-3">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={actorName}
            onChange={e => setActorName(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-300 rounded-md px-2 py-1 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            placeholder="Your Name / Role"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Log doctor visit, BP reading, medicine change, or visit update..."
            className="flex-1 text-sm bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-500 min-h-[44px]"
          />
          <button
            type="submit"
            disabled={isSubmitting || !noteText.trim()}
            className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-md flex items-center gap-1.5 transition-colors min-h-[44px] min-w-[48px] justify-center"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Add Note</span>
          </button>
        </div>
        {errorMessage && (
          <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{errorMessage}</p>
        )}
      </form>

      {/* Timeline Stream */}
      <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
        {visibleTimeline.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No timeline entries yet.</p>
        ) : (
          visibleTimeline.map(item => {
            const timeStr = new Date(item.occurred_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
            const dateStr = new Date(item.occurred_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric'
            });

            return (
              <div key={item.id} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-[31px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-2xs">
                  {getIcon(item.entry_type)}
                </div>

                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-bold text-slate-800">{item.actor_name || 'System'}</span>
                    <span>
                      {dateStr} at {timeStr}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed">{item.note}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
