import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const elder = store.getElder(id);
  if (!elder) {
    return NextResponse.json({ error: 'Elder not found' }, { status: 404 });
  }

  const timeline = store.getTimeline(id);
  const incidents = store.getIncidents(id);

  return NextResponse.json({
    elder,
    contacts: elder.contacts || [],
    timeline,
    incidents
  });
}
