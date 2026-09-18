import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: incidentId } = await params;
    const body = await request.json();
    const { contactId, response, note } = body as {
      contactId: string;
      response: 'ok' | 'needs_help' | 'checking';
      note?: string;
    };

    if (typeof incidentId !== 'string' || !incidentId.trim() || typeof contactId !== 'string' || !contactId.trim() || !['ok', 'needs_help', 'checking'].includes(response)) {
      return NextResponse.json({ error: 'Valid contactId and response are required' }, { status: 400 });
    }
    if (note !== undefined && (typeof note !== 'string' || note.trim().length > 2000)) {
      return NextResponse.json({ error: 'Invalid note' }, { status: 400 });
    }

    const updatedIncident = store.respondToIncident(incidentId.trim(), contactId.trim(), response, note?.trim());
    if (!updatedIncident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, incident: updatedIncident });
  } catch (error) {
    console.error('API incident respond error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
