import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, step, elderId } = body as {
      action: 'reset' | 'step' | 'time_warp';
      step?: number;
      elderId?: string;
    };

    if (!['reset', 'step', 'time_warp'].includes(action)) {
      return NextResponse.json({ error: 'Invalid simulation action' }, { status: 400 });
    }
    if (step !== undefined && (!Number.isInteger(step) || step < 1 || step > 5)) {
      return NextResponse.json({ error: 'Invalid demo step' }, { status: 400 });
    }
    if (elderId !== undefined && (typeof elderId !== 'string' || !elderId.trim())) {
      return NextResponse.json({ error: 'Invalid elderId' }, { status: 400 });
    }

    const targetElderId = elderId?.trim() || 'elder-ammini-78';

    if (action === 'reset') {
      store.resetToSeed();
      return NextResponse.json({
        success: true,
        message: 'Demo state reset to initial seed (Ammini Amma scenario)',
        state: store.getState()
      });
    }

    if (action === 'step') {
      const currentStep = step ?? 1;

      switch (currentStep) {
        case 1:
          // Fast-forward past pillbox time (9:15 AM = 555 mins) with no signal
          store.setSimulatedTime(555);
          break;

        case 2:
          // Simulated callback missed at 9:35 AM = 575 mins -> Local escalation
          store.setSimulatedTime(575);
          break;

        case 3:
          // Neighbor Suma responds "She's fine" -> Incident resolved
          const activeInc = store.getIncidents(targetElderId).find(i => i.stage !== 'resolved');
          if (activeInc) {
            store.respondToIncident(activeInc.id, 'c-suma-neighbor', 'ok', 'Checked on Ammini. She was gardening in back yard.');
          }
          break;

        case 4:
          // Escalation timeout to Family in Sharjah (showing quiet hours logic)
          let inc = store.getIncidents(targetElderId).find(i => i.stage !== 'resolved');
          if (!inc) {
            store.evaluateAllElders();
            inc = store.getIncidents(targetElderId).find(i => i.stage !== 'resolved');
          }
          if (inc) {
            store.respondToIncident(inc.id, 'c-suma-neighbor', 'needs_help', 'Escalation timeout requires immediate assistance.');
          }
          store.addTimelineEntry({
            elder_id: targetElderId,
            entry_type: 'escalation_step',
            actor_name: 'CareNet Escalation Engine',
            note: 'CRITICAL ALERT: Pinging primary contact Unni (Sharjah, UAE). Local time: 03:14 AM. Escalation escalated due to local timeout.',
            visibility: 'all'
          });
          break;

        case 5:
          // Add doctor visit note
          store.addTimelineEntry({
            elder_id: targetElderId,
            entry_type: 'note',
            actor_name: 'Reeja V. (ASHA Worker)',
            note: 'Hospital visit completed at Kozhencherry Taluk Hospital. Dr. prescribed BP medicine change: Amlodipine 5mg -> 10mg daily.',
            visibility: 'all'
          });
          break;
      }

      store.setDemoStep(currentStep);
      return NextResponse.json({
        success: true,
        step: currentStep,
        state: store.getState()
      });
    }

    return NextResponse.json({ error: 'Invalid simulation action' }, { status: 400 });
  } catch (error) {
    console.error('API /api/demo/simulate error:', error);
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 });
  }
}
