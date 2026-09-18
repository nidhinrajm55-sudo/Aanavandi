export function CareNetLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`group flex items-center gap-2.5 ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-[13px] border border-white/40 bg-primary text-on-primary shadow-[0_6px_16px_rgba(18,59,58,0.18)] transition-transform group-hover:-rotate-3" aria-hidden="true">
        <span className="absolute inset-1 rounded-[9px] border border-primary-fixed/30" />
        <svg viewBox="0 0 24 24" className="relative h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
          <path d="M12 8v6M9 11h6" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-[1.05rem] font-extrabold leading-tight tracking-[-0.04em] text-primary">CareNet</span>
        <span className="text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-on-surface-variant">Kerala · Eldercare</span>
      </div>
    </div>
  );
}
