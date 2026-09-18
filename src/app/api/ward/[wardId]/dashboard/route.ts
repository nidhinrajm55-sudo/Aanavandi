import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ wardId: string }> }
) {
  const { wardId } = await params;
  const elders = store.getElders().filter(e => !wardId || wardId === 'all' || e.ward_id === wardId);
  const incidents = store.getIncidents();

  const activeIncidentsCount = incidents.filter(i => i.stage !== 'resolved').length;
  const normalEldersCount = elders.filter(e => !e.current_stage || e.current_stage === 'normal').length;
  const concernEldersCount = elders.filter(e => e.current_stage === 'soft_concern' || e.current_stage === 'verify').length;
  const escalatedEldersCount = elders.filter(e => e.current_stage?.includes('escalation') || e.current_stage === 'critical').length;

  return NextResponse.json({
    wardId,
    totalElders: elders.length,
    activeIncidentsCount,
    summaryStats: {
      normal: normalEldersCount,
      softConcern: concernEldersCount,
      escalated: escalatedEldersCount
    },
    elders: elders.map(e => ({
      id: e.id,
      full_name: e.full_name,
      age: e.age,
      address: e.address,
      current_stage: e.current_stage || 'normal',
      concern_score: e.concern_score || 0,
      last_signal_at: e.last_signal_at,
      days_baseline_data: 21,
      contacts_count: store.getContacts(e.id).length
    }))
  });
}
