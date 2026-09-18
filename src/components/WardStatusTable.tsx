'use client';

import React from 'react';
import { Elder } from '@/types/carenet';
import { StatusBadge } from './StatusBadge';
import { Users, MapPin, Sparkles } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface WardStatusTableProps {
  elders: Elder[];
  onSelectElder?: (elder: Elder) => void;
}

export function WardStatusTable({ elders, onSelectElder }: WardStatusTableProps) {
  // Sort elders by urgency: Critical -> Escalated -> Soft Concern -> Normal
  const sortedElders = [...elders].sort((a, b) => {
    const scoreA = a.concern_score || 0;
    const scoreB = b.concern_score || 0;
    return scoreB - scoreA;
  });

  // Dummy historical trend sparkline data for visuals
  const getSparklineData = (score: number) => {
    return [
      { v: Math.max(0, score - 15) },
      { v: Math.max(0, score - 25) },
      { v: Math.max(0, score - 10) },
      { v: Math.max(0, score - 5) },
      { v: score }
    ];
  };

  return (
    <div className="glass-panel overflow-hidden rounded-[var(--carenet-radius-panel)]">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--carenet-teal)]" />
            Ward 4 Elderly Care Registry (Pathanamthitta)
          </h3>
          <p className="text-xs text-slate-500">Sorted by concern score urgency. Real-time ward monitoring.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
            Total Elders: {elders.length}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
              <th className="py-3 px-4">Elder Name & Age</th>
              <th className="py-3 px-4">Address / Location</th>
              <th className="py-3 px-4">Current Status</th>
              <th className="py-3 px-4">Concern Score</th>
              <th className="py-3 px-4">24h Routine Trend</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedElders.map(elder => {
              const isUrgent = (elder.concern_score || 0) >= 40;
              return (
                <tr
                  key={elder.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isUrgent ? 'bg-amber-50/30' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-base">{elder.full_name}</div>
                    <div className="text-xs text-slate-500">{elder.age} years old • Speaks Malayalam</div>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{elder.address}</span>
                    </div>
                    {elder.conditions_notes && (
                      <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                        {elder.conditions_notes}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <StatusBadge stage={elder.current_stage} concernScore={elder.concern_score} />
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            (elder.concern_score || 0) >= 60
                              ? 'bg-red-600'
                              : (elder.concern_score || 0) >= 40
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, elder.concern_score || 0)}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-xs text-slate-800">{elder.concern_score || 0}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 w-28 h-10">
                    <div className="w-24 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getSparklineData(elder.concern_score || 0)}>
                          <Line
                            type="monotone"
                            dataKey="v"
                            stroke={(elder.concern_score || 0) >= 40 ? '#dc2626' : '#059669'}
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectElder && onSelectElder(elder)}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-[var(--carenet-radius-control)] bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-container"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                      View Profile
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
