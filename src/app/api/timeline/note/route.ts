import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { elderId, note, actorName, visibility } = body as {
      elderId: string;
      note: string;
      actorName?: string;
      visibility?: 'all' | 'family_asha_only';
    };

    if (typeof elderId !== 'string' || !elderId.trim() || typeof note !== 'string' || !note.trim() || note.trim().length > 2000) {
      return NextResponse.json({ error: 'elderId and a valid note are required' }, { status: 400 });
    }
    if (actorName !== undefined && (typeof actorName !== 'string' || actorName.trim().length > 200)) {
      return NextResponse.json({ error: 'Invalid actorName' }, { status: 400 });
    }
    if (visibility !== undefined && visibility !== 'all' && visibility !== 'family_asha_only') {
      return NextResponse.json({ error: 'Invalid visibility' }, { status: 400 });
    }

    const entry = store.addTimelineEntry({
      elder_id: elderId,
      entry_type: 'note',
      actor_name: actorName || 'Care Giver',
      note,
      visibility: visibility || 'all'
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('API /api/timeline/note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
