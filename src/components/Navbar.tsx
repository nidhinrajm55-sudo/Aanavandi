'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CareNetLogo } from './CareNetLogo';

export function Navbar() {
  const pathname = usePathname();
  const [sosState, setSosState] = useState<'idle' | 'requesting_location' | 'sending' | 'sent' | 'error'>('idle');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number; capturedAt: string } | null>(null);
  const [locationState, setLocationState] = useState<'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable'>('idle');
  const navLinks = [
    { href: '/ward', label: 'Ward hub', icon: 'hub' },
    { href: '/elder-profile-escalation', label: 'Elder profile', icon: 'elderly' },
    { href: '/family', label: 'Family view', icon: 'home' },
    { href: '/neighbor', label: 'Neighbor action', icon: 'spatial_tracking' },
    { href: '/demo', label: 'Signal lab', icon: 'tune' },
  ];

  const requestLocation = () => new Promise<{ latitude: number; longitude: number; accuracy: number; capturedAt: string } | null>((resolve) => {
    if (!navigator.geolocation) {
      setLocationState('unavailable');
      resolve(null);
      return;
    }

    setLocationState('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          capturedAt: new Date().toISOString(),
        };
        setLocation(nextLocation);
        setLocationState('ready');
        resolve(nextLocation);
      },
      (error) => {
        setLocationState(error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable');
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  });

  const handleSosBroadcast = async () => {
    setSosState('requesting_location');
    const currentLocation = await requestLocation();
    setSosState('sending');
    try {
      const response = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elderId: 'elder-ammini-78',
          signalType: 'volunteer_confirmed_needs_help',
          source: 'volunteer',
          metadata: {
            note: 'SOS emergency broadcast from CareNet',
            ...(currentLocation ? {
              location: {
                ...currentLocation,
                mapUrl: `https://www.openstreetmap.org/?mlat=${currentLocation.latitude}&mlon=${currentLocation.longitude}#map=18/${currentLocation.latitude}/${currentLocation.longitude}`,
              },
            } : {}),
          }
        })
      });
      if (!response.ok) throw new Error('SOS request failed');
      setSosState('sent');

      // Dispatch global SOS event for the 3D map globe
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('carenet-sos', {
            detail: {
              location: currentLocation,
              elderId: 'elder-ammini-78',
              timestamp: new Date().toISOString(),
            },
          })
        );
      }
    } catch (error) {
      console.error('SOS dispatch error:', error);
      setSosState('error');
    } finally {
      window.setTimeout(() => setSosState('idle'), 3000);
    }
  };

  const [isLargeText, setIsLargeText] = useState(false);

  const toggleLargeText = () => {
    const next = !isLargeText;
    setIsLargeText(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('large-text', next);
    }
  };

  const sosLabel = sosState === 'requesting_location' ? 'Locating…' : sosState === 'sending' ? 'Sending…' : sosState === 'sent' ? 'Sent' : sosState === 'error' ? 'Try again' : 'SOS Emergency';
  const sosClass = sosState === 'sent' ? 'bg-secondary text-on-secondary' : sosState === 'error' ? 'bg-error-container text-on-error-container' : 'bg-error text-on-error hover:bg-error/90';

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-[var(--carenet-border)] bg-[rgba(245,248,245,0.92)] px-5 py-6 shadow-[12px_0_40px_rgba(18,59,58,0.06)] backdrop-blur-xl lg:flex">
        <Link href="/" aria-label="CareNet home" className="mb-8 px-2"><CareNetLogo /></Link>
        <div className="mb-6 rounded-2xl border border-[var(--carenet-border)] bg-white/65 p-4">
          <div className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--carenet-teal)]">
            <span className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_0_4px_rgba(0,106,100,0.10)]" />
            Live care desk
          </div>
          <p className="mt-2 text-sm font-bold text-[var(--carenet-ink)]">Ward 4 · Kozhencherry</p>
          <p className="mt-1 text-xs text-[var(--carenet-ink-soft)]">Reeja · on duty</p>
        </div>
        <nav className="space-y-1.5" aria-label="Primary navigation">
          <p className="px-3 pb-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[var(--carenet-ink-soft)]">Workspace</p>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return <Link key={link.href} href={link.href} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-bold transition-all ${isActive ? 'bg-primary text-on-primary shadow-[0_8px_20px_rgba(0,67,64,0.18)]' : 'text-on-surface-variant hover:bg-white/80 hover:text-on-surface'}`}>
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{link.icon}</span>{link.label}
            </Link>;
          })}
        </nav>
        <div className="mt-auto border-t border-[var(--carenet-border)] pt-4 space-y-2">
          <button
            type="button"
            onClick={toggleLargeText}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            <span className="material-symbols-outlined text-[18px]">format_size</span>
            {isLargeText ? 'Standard Text' : 'Large-Text Mode'}
          </button>
          <button type="button" onClick={handleSosBroadcast} disabled={sosState === 'sending' || sosState === 'requesting_location'} aria-live="polite" className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors ${sosClass} disabled:cursor-wait disabled:opacity-70`}>
            <span className="material-symbols-outlined text-[19px]" aria-hidden="true">emergency_home</span>{sosLabel}
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-xs backdrop-blur-xl lg:ml-72">
        <div className="mx-auto flex min-h-[4.5rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="CareNet home" className="lg:hidden"><CareNetLogo /></Link>
          <div className="hidden items-center gap-2 font-mono text-xs font-bold text-[#006a64] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#34d399] animate-pulse" />
            CARENET KERALA 3D DESK
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLargeText}
              className="flex min-h-11 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 sm:min-h-10"
              title="Toggle Large-Text Mode for Accessibility"
            >
              <span className="material-symbols-outlined text-[18px]">format_size</span>
              <span className="hidden sm:inline">{isLargeText ? 'Standard' : 'Large-Text'}</span>
            </button>
            <button type="button" onClick={handleSosBroadcast} disabled={sosState === 'sending' || sosState === 'requesting_location'} aria-live="polite" className={`flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all shadow-sm sm:min-h-10 ${sosClass} disabled:cursor-wait disabled:opacity-70`}>
              <span className="material-symbols-outlined text-[17px]" aria-hidden="true">emergency_home</span>{sosLabel}
            </button>
          </div>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden" aria-label="Mobile navigation">
          {navLinks.map(link => <Link key={link.href} href={link.href} className={`flex min-h-11 whitespace-nowrap items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${pathname === link.href ? 'bg-[#004340] text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}><span className="material-symbols-outlined text-[18px]" aria-hidden="true">{link.icon}</span>{link.label}</Link>)}
        </nav>
      </header>
    </>
  );
}
