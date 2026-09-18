'use client';

import React from 'react';

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      <div className="h-4 w-1/3 rounded bg-slate-200" />
      <div className="h-8 w-2/3 rounded bg-slate-200" />
      <div className="h-3 w-1/2 rounded bg-slate-100" />
      <div className="h-20 w-full rounded-xl bg-slate-100" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="h-6 w-1/4 rounded bg-slate-200 mb-4" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between border-b border-slate-100 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200" />
            <div className="space-y-1">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-3 w-48 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-6 w-20 rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-slate-100 p-6 space-y-3">
      <div className="h-4 w-1/4 rounded bg-slate-300" />
      <div className="h-7 w-1/2 rounded bg-slate-300" />
      <div className="h-3 w-1/3 rounded bg-slate-200" />
    </div>
  );
}
