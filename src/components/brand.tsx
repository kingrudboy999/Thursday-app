import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

export function BrandIcon({ size = 32, className }: any) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
      }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <defs>
          <linearGradient id="mark-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a6a51" />
            <stop offset="1" stopColor="#153b2b" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill="url(#mark-bg)" />
        <path
          d="M19 23.5h26M32 23.5v23"
          fill="none"
          stroke="#f8f3e7"
          strokeWidth="5.2"
          strokeLinecap="square"
        />
        <circle cx="32" cy="16" r="3.6" fill="#d97a4d" />
      </svg>
    </span>
  );
}
export function ColdStartSplash({ onDone }: any) {
  const [u, m] = useState<any>(false);
  useEffect(() => {
    const d = window.setTimeout(() => m(true), 900),
      x = window.setTimeout(onDone, 1180);
    return () => {
      window.clearTimeout(d);
      window.clearTimeout(x);
    };
  }, [onDone]);
  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#0c1712] transition-[opacity,transform] duration-300 ease-out",
        u ? "pointer-events-none scale-[1.02] opacity-0" : "opacity-100",
      )}
      aria-label="Welcome to Thursday"
      role="status"
      onClick={() => m(true)}
    >
      <div className="splash-halo pointer-events-none absolute h-[460px] w-[460px] rounded-full" />
      <div className="splash-ring pointer-events-none absolute top-1/2 left-1/2 h-[180px] w-[180px] rounded-full border border-[#8ec3a5]/25" />
      <div className="splash-ring splash-ring-late pointer-events-none absolute top-1/2 left-1/2 h-[180px] w-[180px] rounded-full border border-[#8ec3a5]/15" />
      <div className="relative flex flex-col items-center">
        <div className="splash-mark">
          <BrandIcon
            size={78}
            className="shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
          />
        </div>
        <p className="splash-word mt-6 text-[30px] leading-none font-semibold tracking-[-0.04em] text-[#f4f6f0]">
          Thursday
        </p>
        <p className="splash-tag mt-2 text-[10px] font-medium tracking-[0.24em] text-[#9ab5a5] uppercase">
          A quieter place to share
        </p>
      </div>
      <div className="splash-track absolute bottom-14 h-[2px] w-[124px] overflow-hidden rounded-full bg-white/10">
        <span className="splash-fill block h-full rounded-full bg-[#8ec3a5]" />
      </div>
      <p className="splash-tag absolute bottom-8 text-[10px] tracking-[0.06em] text-white/30">
        Made for your circle
      </p>
    </div>,
    document.body,
  );
}
export function BrandLockup({ compact = false }: any) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-forest text-white shadow-sm">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-[17px] w-[17px]"
          aria-hidden="true"
        >
          <path
            d="M6 6.75h12"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
          <path
            d="M12 6.75V18"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {compact ? null : (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[20px] leading-none font-semibold tracking-[-0.035em] text-ink">
            Thursday
          </span>
          <span className="rounded bg-canvas-deep px-1 py-0.5 text-[8px] font-semibold tracking-[0.08em] text-faint uppercase">
            beta
          </span>
        </span>
      )}
    </div>
  );
}
