'use client';

import { useEffect, useState } from 'react';
import { Contact } from '@/types/carenet';
import { Users, MoveUp, MoveDown, ShieldCheck, AlertCircle } from 'lucide-react';

interface ContactLadderEditorProps {
  elderId: string;
  initialContacts: Contact[];
  onContactsUpdated?: (contacts: Contact[]) => void;
}

export function ContactLadderEditor({ elderId, initialContacts, onContactsUpdated }: ContactLadderEditorProps) {
  const [contacts, setContacts] = useState<Contact[]>(
    [...initialContacts].sort((a, b) => a.ladder_position - b.ladder_position)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setContacts([...initialContacts].sort((a, b) => a.ladder_position - b.ladder_position));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialContacts]);

  const hasLocalContact = contacts.some(
    contact => contact.timezone === 'Asia/Kolkata' || contact.relationship === 'neighbor' || contact.relationship === 'asha'
  );

  const moveContact = (index: number, direction: 'up' | 'down') => {
    const newContacts = [...contacts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newContacts.length) return;

    const temp = newContacts[index];
    newContacts[index] = newContacts[targetIndex];
    newContacts[targetIndex] = temp;

    // Re-index ladder position
    newContacts.forEach((c, idx) => {
      c.ladder_position = idx + 1;
    });

    setContacts(newContacts);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    // Enforce PRD check: Must have at least 1 local contact in Asia/Kolkata or neighbor/asha role
    const hasLocal = contacts.some(
      c => c.timezone === 'Asia/Kolkata' || c.relationship === 'neighbor' || c.relationship === 'asha'
    );

    if (!hasLocal && contacts.length > 0) {
      setErrorMsg('Contact ladder must have at least one local contact (Neighbor or ASHA worker) in the elder’s timezone!');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/elders/${elderId}/contacts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts })
      });

      if (res.ok) {
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 3000);
        if (onContactsUpdated) onContactsUpdated(contacts);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to save contact ladder');
      }
    } catch (err) {
      console.error('Error saving contacts:', err);
      setErrorMsg('Network error while saving ladder');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel rounded-[var(--carenet-radius-panel)] p-5">
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            Escalation Contact Ladder
          </h3>
          <p className="text-xs text-slate-500">Ordered fallback list. Pings nearest local responder first.</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${hasLocalContact ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
          {hasLocalContact ? <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
          {hasLocalContact ? 'Local contact ready' : contacts.length === 0 ? 'No contacts configured' : 'Add a local contact'}
        </span>
      </div>

      {errorMsg && (
        <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg p-3 text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          Contact ladder successfully updated!
        </div>
      )}

      <div className="space-y-3 mb-5">
        {contacts.map((contact, index) => (
          <div
            key={contact.id}
            className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-slate-200 font-extrabold text-slate-700 text-xs flex items-center justify-center">
                #{index + 1}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{contact.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-slate-200 text-slate-800 capitalize">
                    {contact.relationship}
                  </span>
                  {contact.timezone !== 'Asia/Kolkata' && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-medium">
                      {contact.timezone}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phone: {contact.phone} • Response Window: {contact.response_window_minutes} mins • Quiet: {contact.quiet_hours_start}-{contact.quiet_hours_end}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveContact(index, 'up')}
                disabled={index === 0}
                className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Move up in escalation priority"
              >
                <MoveUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => moveContact(index, 'down')}
                disabled={index === contacts.length - 1}
                className="p-1.5 rounded-md hover:bg-slate-200 disabled:opacity-30 text-slate-700 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Move down in priority"
              >
                <MoveDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-primary hover:bg-primary-container disabled:opacity-50 text-white font-bold text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 min-h-[48px]"
      >
        <ShieldCheck className="w-4 h-4" />
        {isSaving ? 'Saving Ladder...' : 'Save Contact Ladder'}
      </button>
    </div>
  );
}
