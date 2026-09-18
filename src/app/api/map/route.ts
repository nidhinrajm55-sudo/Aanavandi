import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

const WARD_CENTERS: Record<string, [number, number]> = {
  'ward-4-pathanamthitta': [76.7074, 9.3375],
  'ward-12-trivandrum': [76.9557, 8.5241],
  'ward-15-ernakulam': [76.2673, 9.9312],
  'ward-7-thrissur': [76.2144, 10.5276],
  'ward-9-kozhikode': [75.7804, 11.2588],
  'ward-6-wayanad': [76.0835, 11.6103],
  'ward-8-kottayam': [76.5222, 9.5915],
  'ward-10-alappuzha': [76.3388, 9.4981],
  'ward-11-kollam': [76.5847, 8.8932],
  'ward-14-kannur': [75.3704, 11.8745],
  'ward-2-palakkad': [76.6548, 10.7867],
  'ward-4-malappuram': [76.0711, 11.0732],
  'ward-3-idukki': [76.9737, 9.8496],
  'ward-1-kasaragod': [74.9852, 12.5102],
};

const KERALA_CENTER: [number, number] = [76.2711, 10.1500];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export async function GET() {
  const elders = store.getElders();
  const nodes = elders.map((elder, index) => {
    const baseCenter = WARD_CENTERS[elder.ward_id || ''] || WARD_CENTERS['ward-4-pathanamthitta'];
    // Offset slightly for multiple elders in the same ward to prevent marker overlap
    const sameWardIndex = elders.filter((e, i) => i < index && e.ward_id === elder.ward_id).length;
    const lngOffset = (sameWardIndex % 3 - 1) * 0.0035;
    const latOffset = Math.floor(sameWardIndex / 3) * 0.0035;

    return {
      id: elder.id,
      fullName: elder.full_name,
      initials: initials(elder.full_name),
      age: elder.age,
      address: elder.address,
      wardId: elder.ward_id,
      ward: elder.ward?.name || 'Kerala Ward',
      panchayat: elder.ward?.panchayat || 'Local Panchayat',
      stage: elder.current_stage || 'normal',
      concernScore: elder.concern_score || 0,
      lastSignalAt: elder.last_signal_at || null,
      conditionsNotes: elder.conditions_notes || 'Routine health care',
      coordinates: [baseCenter[0] + lngOffset, baseCenter[1] + latOffset] as [number, number],
    };
  });

  return NextResponse.json({
    center: KERALA_CENTER,
    nodes,
    privacy: 'Locations are approximate ward-level points. Precise addresses require an authorized care view.',
  });
}

