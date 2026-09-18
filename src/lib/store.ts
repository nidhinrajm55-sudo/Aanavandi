import { Elder, Contact, Signal, Baseline, Incident, TimelineEntry, SignalType, SignalSource } from '@/types/carenet';
import { SEED_ELDERS, SEED_AMMINI_CONTACTS, SEED_BASELINES, SEED_TIMELINE, SEED_WARD } from './seedData';
import { evaluateElderAnomaly } from './anomaly';

const STORAGE_KEY = 'carenet_state_v1';

export interface CareNetStore {
  elders: Elder[];
  contacts: Record<string, Contact[]>; // elder_id -> Contact[]
  signals: Signal[];
  baselines: Baseline[];
  incidents: Incident[];
  timeline: TimelineEntry[];
  simulatedTimeMinutes: number; // e.g. 9:30 AM = 570 mins
  demoStep: number;
}

function getDefaultState(): CareNetStore {
  return {
    elders: structuredClone(SEED_ELDERS),
    contacts: {
      'elder-ammini-78': structuredClone(SEED_AMMINI_CONTACTS)
    },
    signals: [
      {
        id: 's-init-1',
        elder_id: 'elder-ammini-78',
        signal_type: 'sensor_pillbox',
        source: 'simulated_sensor',
        occurred_at: new Date(Date.now() - 25 * 3600000).toISOString(),
        metadata: { info: 'Smart Pillbox opened morning dose' }
      }
    ],
    baselines: structuredClone(SEED_BASELINES),
    incidents: [],
    timeline: structuredClone(SEED_TIMELINE),
    simulatedTimeMinutes: 510, // 8:30 AM default
    demoStep: 0
  };
}

export class StoreManager {
  private state: CareNetStore;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          this.state = JSON.parse(saved);
        } catch {
          this.state = getDefaultState();
        }
      } else {
        this.state = getDefaultState();
      }
    } else {
      this.state = getDefaultState();
    }
  }

  private save() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
  }

  resetToSeed() {
    this.state = getDefaultState();
    this.save();
    return structuredClone(this.state);
  }

  getState(): CareNetStore {
    return structuredClone(this.state);
  }

  getElders(): Elder[] {
    return structuredClone(this.state.elders);
  }

  getElder(id: string): Elder | undefined {
    const elder = this.state.elders.find(e => e.id === id);
    if (!elder) return undefined;

    let contacts = this.state.contacts[id];
    if (!contacts || contacts.length === 0) {
      contacts = elder.contacts && elder.contacts.length > 0
        ? elder.contacts
        : [
            {
              id: `c-${elder.id}-neighbor`,
              elder_id: elder.id,
              name: 'Suma / Local Neighbor',
              phone: '+91 94471 23456',
              relationship: 'neighbor',
              ladder_position: 1,
              response_window_minutes: 20,
              quiet_hours_start: '22:00',
              quiet_hours_end: '06:00',
              timezone: 'Asia/Kolkata',
              created_at: new Date(Date.now() - 30 * 86400000).toISOString()
            },
            {
              id: `c-${elder.id}-asha`,
              elder_id: elder.id,
              name: `Reeja V. (ASHA Worker - ${elder.ward?.name || 'Local Ward'})`,
              phone: '+91 98470 98765',
              relationship: 'asha',
              ladder_position: 2,
              response_window_minutes: 30,
              quiet_hours_start: '22:00',
              quiet_hours_end: '06:00',
              timezone: 'Asia/Kolkata',
              created_at: new Date(Date.now() - 30 * 86400000).toISOString()
            },
            {
              id: `c-${elder.id}-family`,
              elder_id: elder.id,
              name: 'Unni (Son - Sharjah, UAE)',
              phone: '+971 50 123 4567',
              relationship: 'family',
              ladder_position: 3,
              response_window_minutes: 45,
              quiet_hours_start: '23:00',
              quiet_hours_end: '07:00',
              timezone: 'Asia/Dubai',
              created_at: new Date(Date.now() - 30 * 86400000).toISOString()
            }
          ];
    }

    return {
      ...elder,
      contacts: structuredClone(contacts),
      ward: elder.ward || structuredClone(SEED_WARD)
    };
  }

  getContacts(elderId: string): Contact[] {
    const elder = this.getElder(elderId);
    return elder?.contacts || [];
  }

  saveContacts(elderId: string, contacts: Contact[]) {
    this.state.contacts[elderId] = structuredClone(contacts);
    this.save();
  }

  recordSignal(
    elderId: string,
    signalType: SignalType,
    source: SignalSource,
    metadata: Record<string, unknown> = {}
  ): Signal {
    const signal: Signal = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      elder_id: elderId,
      signal_type: signalType,
      source,
      occurred_at: new Date().toISOString(),
      metadata: structuredClone(metadata)
    };

    this.state.signals.unshift(signal);

    const elder = this.state.elders.find(e => e.id === elderId);
    if (elder) {
      elder.last_signal_at = signal.occurred_at;

      // If elder was in an active incident and receives positive checkin signal, auto-resolve
      if (
        signalType === 'volunteer_confirmed_ok' ||
        signalType === 'manual_checkin' ||
        signalType === 'call_answered'
      ) {
        const activeIncident = this.state.incidents.find(
          i => i.elder_id === elderId && i.stage !== 'resolved'
        );
        if (activeIncident) {
          activeIncident.stage = 'resolved';
          activeIncident.resolved_at = new Date().toISOString();
          activeIncident.resolution_note = `Resolved via ${signalType.replace('_', ' ')} by ${source}`;
          elder.current_stage = 'normal';
          elder.concern_score = 0;
        }
      }
    }

    // Add to shared care timeline
    this.addTimelineEntry({
      elder_id: elderId,
      entry_type: 'signal',
      actor_name: source === 'self' ? 'Elder (Direct)' : source === 'volunteer' ? 'Neighbor/Volunteer' : 'System Signal',
      note: `Signal registered: ${signalType.replace('_', ' ')} (${source})`,
      visibility: 'all'
    });

    this.save();
    return structuredClone(signal);
  }

  getTimeline(elderId: string): TimelineEntry[] {
    let list = this.state.timeline.filter(t => t.elder_id === elderId);
    if (list.length === 0) {
      const elder = this.state.elders.find(e => e.id === elderId);
      const name = elder ? elder.full_name : 'Elder';
      list = [
        {
          id: `t-${elderId}-1`,
          elder_id: elderId,
          entry_type: 'signal',
          actor_name: name,
          note: 'Smart Pillbox opened for morning dose (Routine baseline)',
          visibility: 'all',
          occurred_at: new Date(Date.now() - 3 * 3600000).toISOString()
        },
        {
          id: `t-${elderId}-2`,
          elder_id: elderId,
          entry_type: 'note',
          actor_name: 'Local Neighbor',
          note: `Routine afternoon check-in completed. ${name} is feeling well.`,
          visibility: 'all',
          occurred_at: new Date(Date.now() - 12 * 3600000).toISOString()
        },
        {
          id: `t-${elderId}-3`,
          elder_id: elderId,
          entry_type: 'note',
          actor_name: 'ASHA Health Worker',
          note: 'Monthly health and vital checkup recorded in ward log.',
          visibility: 'all',
          occurred_at: new Date(Date.now() - 36 * 3600000).toISOString()
        }
      ];
    }
    return structuredClone(list.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()));
  }

  addTimelineEntry(entry: Omit<TimelineEntry, 'id' | 'occurred_at'>): TimelineEntry {
    const newEntry: TimelineEntry = {
      id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...entry,
      occurred_at: new Date().toISOString()
    };
    this.state.timeline.unshift(newEntry);
    this.save();
    return structuredClone(newEntry);
  }

  getIncidents(elderId?: string): Incident[] {
    const incidents = elderId
      ? this.state.incidents.filter(i => i.elder_id === elderId)
      : this.state.incidents;
    return structuredClone(incidents);
  }

  respondToIncident(
    incidentId: string,
    contactId: string,
    response: 'ok' | 'needs_help' | 'checking',
    note?: string
  ): Incident | undefined {
    const incident = this.state.incidents.find(i => i.id === incidentId);
    if (!incident) return undefined;

    const contacts = this.getContacts(incident.elder_id);
    const contact = contacts.find(c => c.id === contactId);
    const actorName = contact ? `${contact.name} (${contact.relationship})` : 'Responder';

    if (response === 'ok') {
      incident.stage = 'resolved';
      incident.resolved_at = new Date().toISOString();
      incident.resolution_note = note || 'Checked on elder, confirmed fine.';

      const elder = this.state.elders.find(e => e.id === incident.elder_id);
      if (elder) {
        elder.current_stage = 'normal';
        elder.concern_score = 0;
      }

      this.addTimelineEntry({
        elder_id: incident.elder_id,
        entry_type: 'incident_resolved',
        actor_name: actorName,
        note: `Incident resolved: Elder confirmed OK. ${note ? `("${note}")` : ''}`,
        visibility: 'all'
      });
    } else if (response === 'needs_help') {
      incident.stage = 'critical';
      const elder = this.state.elders.find(e => e.id === incident.elder_id);
      if (elder) {
        elder.current_stage = 'critical';
        elder.concern_score = 100;
      }

      this.addTimelineEntry({
        elder_id: incident.elder_id,
        entry_type: 'escalation_step',
        actor_name: actorName,
        note: `CRITICAL ALERT: Responder reported elder needs immediate assistance! (${note || 'Assistance needed'})`,
        visibility: 'all'
      });
    }

    this.save();
    return structuredClone(incident);
  }

  /**
   * Runs anomaly detection and escalation step evaluation across all elders.
   */
  evaluateAllElders(currentMins: number = this.state.simulatedTimeMinutes) {
    const todaySignals = this.state.signals;

    for (const elder of this.state.elders) {
      const baselines = this.state.baselines.filter(b => b.elder_id === elder.id);
      if (baselines.length === 0) continue;

      // Count resolved false alarms in trailing 14 days
      const resolvedFalseAlarms = this.state.incidents.filter(
        i => i.elder_id === elder.id && i.stage === 'resolved'
      ).length;

      const evalResult = evaluateElderAnomaly(
        baselines,
        todaySignals,
        currentMins,
        resolvedFalseAlarms,
        elder.id
      );
      elder.concern_score = evalResult.concern_score;

      // Check active incident state
      let activeIncident = this.state.incidents.find(
        i => i.elder_id === elder.id && i.stage !== 'resolved'
      );

      if (evalResult.stage !== 'normal') {
        if (!activeIncident) {
          activeIncident = {
            id: `inc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            elder_id: elder.id,
            stage: evalResult.stage,
            concern_score: evalResult.concern_score,
            opened_at: new Date().toISOString()
          };
          this.state.incidents.unshift(activeIncident);

          this.addTimelineEntry({
            elder_id: elder.id,
            entry_type: 'incident_opened',
            actor_name: 'CareNet Anomaly Engine',
            note: `Incident opened: Status = ${evalResult.stage.toUpperCase().replace('_', ' ')} (Concern Score: ${evalResult.concern_score}). ${evalResult.lateness_summary.join(', ')}`,
            visibility: 'all'
          });
        } else {
          activeIncident.concern_score = evalResult.concern_score;
          activeIncident.stage = evalResult.stage;
        }

        elder.current_stage = evalResult.stage;
      } else if (!activeIncident) {
        elder.current_stage = 'normal';
      }
    }

    this.save();
  }

  setSimulatedTime(minutes: number) {
    this.state.simulatedTimeMinutes = minutes;
    this.evaluateAllElders(minutes);
    this.save();
  }

  setDemoStep(step: number) {
    this.state.demoStep = step;
    this.save();
  }
}

export const store = new StoreManager();
