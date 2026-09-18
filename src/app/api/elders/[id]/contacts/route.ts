import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { Contact } from '@/types/carenet';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { contacts } = body as { contacts: Contact[] };

    if (!Array.isArray(contacts) || contacts.length > 20) {
      return NextResponse.json({ error: 'Contacts array required (maximum 20 contacts)' }, { status: 400 });
    }
    const validRelationships = ['family', 'neighbor', 'asha', 'ward_member'];
    if (contacts.some(c => !c || typeof c !== 'object' || typeof c.id !== 'string' || !c.id.trim() || typeof c.name !== 'string' || !c.name.trim() || typeof c.phone !== 'string' || !c.phone.trim() || !validRelationships.includes(c.relationship) || !Number.isInteger(c.ladder_position) || c.ladder_position < 1 || !Number.isFinite(c.response_window_minutes) || c.response_window_minutes < 0 || typeof c.timezone !== 'string' || !c.timezone.trim() || c.elder_id !== id)) {
      return NextResponse.json({ error: 'Invalid contact data' }, { status: 400 });
    }

    // Enforce PRD rule: Must have at least 1 local contact
    const hasLocal = contacts.some(c => c.timezone === 'Asia/Kolkata' || c.relationship === 'neighbor' || c.relationship === 'asha');
    if (!hasLocal && contacts.length > 0) {
      return NextResponse.json(
        { error: 'Contact ladder must contain at least one local contact in the same timezone as the elder.' },
        { status: 422 }
      );
    }

    store.saveContacts(id, contacts);
    return NextResponse.json({ success: true, contacts });
  } catch (error) {
    console.error('API contacts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
