import { Contact, Incident, Stage } from '@/types/carenet';

export interface EscalationNextAction {
  nextStage: Stage;
  targetContact?: Contact;
  shouldNotify: boolean;
  quietHoursActive: boolean;
  reason: string;
}

/**
 * Checks if current time falls within contact's quiet hours (e.g. 23:00 to 07:00).
 */
export function isContactInQuietHours(
  contact: Contact,
  nowDate: Date = new Date()
): boolean {
  if (!contact.quiet_hours_start || !contact.quiet_hours_end) return false;

  // Convert time to target contact's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: contact.timezone || 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(nowDate);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const nowMins = hour * 60 + minute;

  const [sh, sm] = contact.quiet_hours_start.split(':').map(Number);
  const startMins = sh * 60 + sm;

  const [eh, em] = contact.quiet_hours_end.split(':').map(Number);
  const endMins = eh * 60 + em;

  if (startMins > endMins) {
    // Overnight quiet hours, e.g., 23:00 to 07:00
    return nowMins >= startMins || nowMins < endMins;
  } else {
    // Same-day quiet hours, e.g., 13:00 to 15:00
    return nowMins >= startMins && nowMins < endMins;
  }
}

/**
 * Determines the next escalation step according to §12 state machine logic.
 */
export function getNextEscalationStep(
  incident: Incident,
  contacts: Contact[],
  responseAction?: 'ok' | 'needs_help' | 'checking'
): EscalationNextAction {
  // 1. Any 'ok' response resolves incident immediately
  if (responseAction === 'ok') {
    return {
      nextStage: 'resolved',
      shouldNotify: false,
      quietHoursActive: false,
      reason: 'Incident resolved by contact confirming elder is fine.'
    };
  }

  // 2. Any 'needs_help' response immediately escalates to CRITICAL
  if (responseAction === 'needs_help' || incident.concern_score >= 90) {
    return {
      nextStage: 'critical',
      shouldNotify: true,
      quietHoursActive: false, // Override quiet hours at critical stage!
      reason: 'Critical alarm triggered! Escalating to ALL contacts immediately (Quiet hours overridden).'
    };
  }

  const sortedContacts = [...contacts].sort((a, b) => a.ladder_position - b.ladder_position);
  const neighborContact = sortedContacts.find(c => c.relationship === 'neighbor') || sortedContacts[0];
  const ashaContact = sortedContacts.find(c => c.relationship === 'asha' || c.relationship === 'ward_member') || sortedContacts[1];
  const familyContact = sortedContacts.find(c => c.relationship === 'family') || sortedContacts[2];

  switch (incident.stage) {
    case 'soft_concern':
      return {
        nextStage: 'verify',
        shouldNotify: false,
        quietHoursActive: false,
        reason: 'Concern score crossed threshold. Triggering automated callback verification.'
      };

    case 'verify':
      return {
        nextStage: 'local_escalation',
        targetContact: neighborContact,
        shouldNotify: neighborContact ? !isContactInQuietHours(neighborContact) : true,
        quietHoursActive: neighborContact ? isContactInQuietHours(neighborContact) : false,
        reason: `Callback unverified. Pinging nearest neighbor (${neighborContact?.name || 'Local Neighbor'}).`
      };

    case 'local_escalation':
      return {
        nextStage: 'extended_escalation',
        targetContact: ashaContact,
        shouldNotify: ashaContact ? !isContactInQuietHours(ashaContact) : true,
        quietHoursActive: ashaContact ? isContactInQuietHours(ashaContact) : false,
        reason: `Neighbor response window elapsed. Escalating to ASHA/Ward member (${ashaContact?.name || 'ASHA Worker'}).`
      };

    case 'extended_escalation': {
      const quiet = familyContact ? isContactInQuietHours(familyContact) : false;
      return {
        nextStage: 'family_escalation',
        targetContact: familyContact,
        shouldNotify: !quiet,
        quietHoursActive: quiet,
        reason: quiet
          ? `Family contact (${familyContact?.name}) is currently in quiet hours (${familyContact?.timezone}). Delaying ping until awake or critical.`
          : `Escalating to primary family contact (${familyContact?.name || 'Family member'}).`
      };
    }

    case 'family_escalation':
      return {
        nextStage: 'critical',
        shouldNotify: true,
        quietHoursActive: false,
        reason: 'Unresolved escalation ladder exhausted. Marking CRITICAL.'
      };

    default:
      return {
        nextStage: incident.stage,
        shouldNotify: false,
        quietHoursActive: false,
        reason: 'No stage transition required.'
      };
  }
}
