'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type LocationPoint = {
  latitude: number;
  longitude: number;
  accuracy: number;
  capturedAt: string;
};

type TrackingState = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'error';

export function LiveLocationMap() {
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [location, setLocation] = useState<LocationPoint | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const watchId = useRef<number | null>(null);

  const mapUrl = useMemo(() => {
    if (!location) return null;
    return `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=18/${location.latitude}/${location.longitude}`;
  }, [location]);

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setTrackingState((state) => state === 'active' || state === 'requesting' ? 'idle' : state);
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setTrackingState('unavailable');
      setErrorMessage('This browser does not provide location services.');
      return;
    }

    stopTracking();
    setTrackingState('requesting');
    setErrorMessage('');
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
          capturedAt: new Date().toISOString(),
        });
        setTrackingState('active');
      },
      (error) => {
        setTrackingState(error.code === error.PERMISSION_DENIED ? 'denied' : 'error');
        setErrorMessage(error.code === error.PERMISSION_DENIED ? 'Location permission was denied.' : 'Unable to update your location.');
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  };

  useEffect(() => () => stopTracking(), []);

  const statusCopy = {
    idle: 'Live tracking is off',
    requesting: 'Waiting for location permission…',
    active: 'Live location is updating',
    denied: 'Location permission denied',
    unavailable: 'Location unavailable',
    error: 'Location update paused',
  }[trackingState];

  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="care-surface overflow-hidden p-3 sm:p-4">
        <div className="relative min-h-[28rem] overflow-hidden rounded-2xl bg-[#dcefe8] [perspective:1100px]">
          {location ? (
            <div
              className="absolute inset-[-14%] bg-cover bg-center transition-[background-image] duration-700 [transform:rotateX(7deg)_scale(1.08)]"
              style={{ backgroundImage: `url("https://tile.openstreetmap.org/16/${Math.floor((location.longitude + 180) / 360 * 65536)}/${Math.floor((1 - Math.asinh(Math.tan(location.latitude * Math.PI / 180)) / Math.PI) / 2 * 65536)}.png")` }}
              aria-label="OpenStreetMap live location surface"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(23,107,102,0.18),transparent_15rem),linear-gradient(135deg,#e9f6ef,#cce8df)]" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,67,64,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,67,64,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_18%,rgba(0,67,64,0.2)_100%)]" />
          {location && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="absolute -inset-8 animate-ping rounded-full bg-secondary/20" />
              <span className="relative block h-5 w-5 rounded-full border-4 border-white bg-tertiary shadow-[0_0_0_8px_rgba(168,92,61,0.18)]" />
            </div>
          )}
          <div className="absolute left-4 top-4 rounded-xl border border-white/70 bg-white/85 px-3 py-2 text-xs font-bold text-[var(--carenet-ink)] shadow-lg backdrop-blur">
            <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${trackingState === 'active' ? 'animate-pulse bg-secondary' : 'bg-[var(--carenet-laterite)]'}`} />{statusCopy}</div>
            <p className="mt-1 text-[0.68rem] font-normal text-[var(--carenet-ink-soft)]">Location stays local until you choose to share it.</p>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
            <span className="rounded-lg bg-white/85 px-2 py-1 text-[0.65rem] text-[var(--carenet-ink-soft)] shadow backdrop-blur">© OpenStreetMap contributors</span>
            {location && <span className="rounded-lg bg-[var(--carenet-ink)]/90 px-2 py-1 font-mono text-[0.65rem] text-white shadow">±{location.accuracy}m accuracy</span>}
          </div>
        </div>
      </div>

      <div className="care-surface flex flex-col justify-between p-5 sm:p-6">
        <div>
          <span className="eyebrow">Live location workspace</span>
          <h2 className="mt-2 font-serif text-3xl text-[var(--carenet-ink)]">A clearer view of the route.</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--carenet-ink-soft)]">Use this tab when a responder needs to share their current position. CareNet asks for location only after tracking is started.</p>
        </div>
        <div className="mt-8 space-y-3">
          <button type="button" onClick={trackingState === 'active' ? stopTracking : startTracking} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition ${trackingState === 'active' ? 'bg-[var(--carenet-ink)] text-white hover:bg-[var(--carenet-teal)]' : 'bg-primary text-on-primary hover:bg-primary-container'}`}>
            <span className="material-symbols-outlined text-lg" aria-hidden="true">{trackingState === 'active' ? 'stop_circle' : 'my_location'}</span>
            {trackingState === 'active' ? 'Stop live location' : 'Start live location'}
          </button>
          {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--carenet-border)] bg-white/65 px-4 text-sm font-bold text-[var(--carenet-teal)] transition hover:bg-white"><span className="material-symbols-outlined text-lg" aria-hidden="true">open_in_new</span>Open in OpenStreetMap</a>}
          {location && <div className="rounded-xl bg-secondary-container/45 p-3 text-xs text-[var(--carenet-ink-soft)]"><span className="font-bold text-[var(--carenet-teal)]">Current position</span><br />{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}<br />Updated {new Date(location.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
          {errorMessage && <p role="alert" className="rounded-xl bg-error-container p-3 text-xs font-bold text-on-error-container">{errorMessage}</p>}
        </div>
      </div>
    </section>
  );
}
