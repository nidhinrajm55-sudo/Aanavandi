import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function GET() {
  const elders = store.getElders();
  return NextResponse.json({ elders });
}
