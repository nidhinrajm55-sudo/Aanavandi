import { Navbar } from '@/components/Navbar';
import { LiveLocationMap } from '@/components/LiveLocationMap';

export default function MapWorkspacePage() {
  return (
    <div className="min-h-screen bg-surface pb-12 text-on-surface">
      <Navbar />
      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <header className="motion-fade-up max-w-3xl">
          <span className="eyebrow">Workspace / Live map</span>
          <h1 className="mt-3 font-serif text-[clamp(2.4rem,5vw,4.8rem)] leading-[0.98] tracking-[-0.05em] text-[var(--carenet-ink)]">See where help is moving.</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--carenet-ink-soft)]">A live OpenStreetMap view for responders coordinating care around Ward 4. Start tracking when you are ready to share your position.</p>
        </header>
        <LiveLocationMap />
      </main>
    </div>
  );
}
