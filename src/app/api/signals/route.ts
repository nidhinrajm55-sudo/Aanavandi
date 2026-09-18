import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { SignalType, SignalSource } from '@/types/carenet';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const elderId = (body.elderId || body.elder_id || '').toString().trim();
    const signalType = (body.signalType || body.signal_type || '') as SignalType;
    const source = (body.source || 'volunteer') as SignalSource;
    const metadata = (body.metadata || {}) as Record<string, unknown>;

    const validSignalTypes: SignalType[] = ['call_answered', 'call_missed', 'manual_checkin', 'volunteer_confirmed_ok', 'volunteer_confirmed_needs_help', 'sensor_pillbox', 'sensor_door', 'sensor_kettle'];
    const validSources: SignalSource[] = ['self', 'volunteer', 'family', 'simulated_call', 'simulated_sensor'];
    if (!elderId || !validSignalTypes.includes(signalType) || !validSources.includes(source)) {
      return NextResponse.json({ error: 'Invalid signal fields' }, { status: 400 });
    }
    if (!store.getElder(elderId.trim())) {
      return NextResponse.json({ error: 'Elder not found' }, { status: 404 });
    }
    if (metadata !== undefined && (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata))) {
      return NextResponse.json({ error: 'metadata must be an object' }, { status: 400 });
    }
    const location = metadata && typeof metadata.location === 'object' && metadata.location !== null && !Array.isArray(metadata.location)
      ? metadata.location as Record<string, unknown>
      : undefined;
    if (location) {
      const { latitude, longitude, accuracy, capturedAt, mapUrl } = location;
      if (
        typeof latitude !== 'number' || latitude < -90 || latitude > 90 ||
        typeof longitude !== 'number' || longitude < -180 || longitude > 180 ||
        typeof accuracy !== 'number' || accuracy < 0 ||
        typeof capturedAt !== 'string' || typeof mapUrl !== 'string'
      ) {
        return NextResponse.json({ error: 'Invalid location metadata' }, { status: 400 });
      }
    }

    const signal = store.recordSignal(elderId.trim(), signalType, source, metadata || {});
    return NextResponse.json({ success: true, signal });
  } catch (error) {
    console.error('API /api/signals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
