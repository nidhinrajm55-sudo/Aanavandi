import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    const isAuthorized = cronSecret && (
      authHeader === `Bearer ${cronSecret}` ||
      (vercelCronHeader === '1' && process.env.VERCEL === '1')
    );

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized cron execution' }, { status: 401 });
    }

    store.evaluateAllElders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      evaluatedEldersCount: store.getElders().length,
      incidents: store.getIncidents()
    });
  } catch (error) {
    console.error('API /api/evaluate error:', error);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
