-- CareNet Database Schema (Supabase / Postgres)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (extending auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('family', 'neighbor', 'asha', 'admin')),
  phone text,
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz default now()
);

-- 2. Wards
create table if not exists wards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  panchayat text not null default 'Pathanamthitta'
);

-- 3. Elders
create table if not exists elders (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  age int,
  address text,
  ward_id uuid references wards(id) on delete set null,
  primary_language text default 'ml',
  conditions_notes text,
  baseline_established_at timestamptz,
  created_at timestamptz default now()
);

-- 4. Contacts (Ordered Contact Ladder per elder)
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references elders(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  name text not null,
  phone text not null,
  relationship text not null, -- 'family' | 'neighbor' | 'asha' | 'ward_member'
  ladder_position int not null, -- 1 = contacted first
  response_window_minutes int not null default 30,
  quiet_hours_start time default '23:00',
  quiet_hours_end time default '07:00',
  timezone text default 'Asia/Kolkata',
  created_at timestamptz default now()
);

-- 5. Signals
create table if not exists signals (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references elders(id) on delete cascade,
  signal_type text not null, -- 'call_answered' | 'call_missed' | 'manual_checkin' | 'volunteer_confirmed_ok' | 'volunteer_confirmed_needs_help' | 'sensor_pillbox' | 'sensor_door' | 'sensor_kettle'
  source text not null,      -- 'self' | 'volunteer' | 'family' | 'simulated_call' | 'simulated_sensor'
  occurred_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

-- 6. Baselines
create table if not exists baselines (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references elders(id) on delete cascade,
  signal_type text not null,
  expected_time_start time not null default '07:30',
  expected_time_end time not null default '09:00',
  expected_frequency_per_day numeric default 1.0,
  confidence numeric default 0.5, -- 0-1, rises with accumulated days
  updated_at timestamptz default now(),
  unique(elder_id, signal_type)
);

-- 7. Incidents
create table if not exists incidents (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references elders(id) on delete cascade,
  stage text not null default 'soft_concern', -- 'soft_concern' | 'verify' | 'local_escalation' | 'extended_escalation' | 'family_escalation' | 'critical' | 'resolved'
  concern_score int not null default 0,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles(id),
  resolution_note text
);

-- 8. Escalation Events
create table if not exists escalation_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references incidents(id) on delete cascade,
  contact_id uuid references contacts(id),
  stage text not null,
  sent_at timestamptz default now(),
  responded_at timestamptz,
  response text -- 'checking' | 'ok' | 'needs_help' | null
);

-- 9. Timeline Entries
create table if not exists timeline_entries (
  id uuid primary key default gen_random_uuid(),
  elder_id uuid references elders(id) on delete cascade,
  entry_type text not null, -- 'signal' | 'incident_opened' | 'incident_resolved' | 'note' | 'escalation_step'
  actor_id uuid references profiles(id),
  actor_name text,
  note text not null,
  visibility text not null default 'all', -- 'all' | 'family_asha_only'
  occurred_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table wards enable row level security;
alter table elders enable row level security;
alter table contacts enable row level security;
alter table signals enable row level security;
alter table baselines enable row level security;
alter table incidents enable row level security;
alter table escalation_events enable row level security;
alter table timeline_entries enable row level security;
