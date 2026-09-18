export type Role = 'family' | 'neighbor' | 'asha' | 'admin';

export type Stage = 
  | 'normal'
  | 'soft_concern'
  | 'verify'
  | 'local_escalation'
  | 'extended_escalation'
  | 'family_escalation'
  | 'critical'
  | 'resolved';

export type SignalType = 
  | 'call_answered' 
  | 'call_missed' 
  | 'manual_checkin' 
  | 'volunteer_confirmed_ok' 
  | 'volunteer_confirmed_needs_help' 
  | 'sensor_pillbox' 
  | 'sensor_door' 
  | 'sensor_kettle';

export type SignalSource = 
  | 'self' 
  | 'volunteer' 
  | 'family' 
  | 'simulated_call' 
  | 'simulated_sensor';

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  phone?: string;
  timezone: string;
  created_at: string;
}

export interface Ward {
  id: string;
  name: string;
  panchayat: string;
}

export interface Elder {
  id: string;
  full_name: string;
  age: number;
  address: string;
  ward_id?: string;
  primary_language: string;
  conditions_notes?: string;
  baseline_established_at?: string;
  created_at: string;
  contacts?: Contact[];
  current_stage?: Stage;
  concern_score?: number;
  last_signal_at?: string;
  ward?: Ward;
}

export interface Contact {
  id: string;
  elder_id: string;
  profile_id?: string;
  name: string;
  phone: string;
  relationship: 'family' | 'neighbor' | 'asha' | 'ward_member';
  ladder_position: number;
  response_window_minutes: number;
  quiet_hours_start?: string; // e.g. "23:00"
  quiet_hours_end?: string;   // e.g. "07:00"
  timezone: string;
  created_at?: string;
}

export interface Signal {
  id: string;
  elder_id: string;
  signal_type: SignalType;
  source: SignalSource;
  occurred_at: string;
  metadata?: Record<string, unknown>;
}

export interface Baseline {
  id: string;
  elder_id: string;
  signal_type: SignalType;
  expected_time_start: string;
  expected_time_end: string;
  expected_frequency_per_day: number;
  confidence: number; // 0.0 to 1.0
  updated_at: string;
}

export interface Incident {
  id: string;
  elder_id: string;
  stage: Stage;
  concern_score: number;
  opened_at: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_note?: string;
  escalation_events?: EscalationEvent[];
  elder?: Elder;
}

export interface EscalationEvent {
  id: string;
  incident_id: string;
  contact_id: string;
  stage: Stage;
  sent_at: string;
  responded_at?: string;
  response?: 'checking' | 'ok' | 'needs_help' | null;
  contact?: Contact;
}

export interface TimelineEntry {
  id: string;
  elder_id: string;
  entry_type: 'signal' | 'incident_opened' | 'incident_resolved' | 'note' | 'escalation_step';
  actor_id?: string;
  actor_name?: string;
  note: string;
  visibility: 'all' | 'family_asha_only';
  occurred_at: string;
}
