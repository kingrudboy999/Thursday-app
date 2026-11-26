import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";

/**
 * The Thursday "T" mark.
 *
 * One editorial letterform: the crossbar is a horizon, a warm clay sun rises
 * out of it, and the stem drops into a deep forest field. One quiet contour
 * below gives the land. Reads as an unmistakable T from 16px to 512px.
 */
export function ThursdayMark({
  size = 32,
  variant = "solid",
  className,
  title,
}: {
  size?: number;
  variant?: "solid" | "outline" | "mono";
  className?: string;
  title?: string;
}) {
  // Unique per instance: a shared gradient id breaks whenever one copy of the
  // mark lives inside a display:none subtree (e.g. the desktop sidebar on mobile).
  const uid = `tm-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const isMono = variant === "mono";
  const isOutline = variant === "outline";
  const ink = isMono ? "#ffffff" : "#fdfbf4";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        className,
      )}
      style={{ width: size, height: size, borderRadius: size * 0.29 }}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <svg viewBox="0 0 64 64" className="h-full w-full">
        <defs>
          <linearGradient id={`${uid}-field`} x1="0.15" y1="0" x2="0.85" y2="1">
            <stop offset="0" stopColor="#2e7f61" />
            <stop offset="0.55" stopColor="#1a5a44" />
            <stop offset="1" stopColor="#0d3325" />
          </linearGradient>
          <radialGradient id={`${uid}-sun`} cx="0.42" cy="0.36" r="0.7">
            <stop offset="0" stopColor="#ffe0b4" />
            <stop offset="0.5" stopColor="#e28d51" />
            <stop offset="1" stopColor="#b04f2b" />
          </radialGradient>
          <linearGradient id={`${uid}-ink`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#eef3ea" />
          </linearGradient>
          <mask id={`${uid}-hidesun`}>
            <rect width="64" height="64" fill="#fff" />
            {/* horizon cuts the sun at its base so it rises out of the T */}
            <rect x="0" y="27.4" width="64" height="36.6" fill="#000" />
          </mask>
        </defs>

        {/* Field */}
        {isOutline ? (
          <rect
            x="1.7"
            y="1.7"
            width="60.6"
            height="60.6"
            rx="16.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.4"
          />
        ) : (
          <rect
            width="64"
            height="64"
            rx="18"
            fill={isMono ? "currentColor" : `url(#${uid}-field)`}
          />
        )}

        {/* Sun rising behind the horizon */}
        {!isMono ? (
          <g mask={`url(#${uid}-hidesun)`}>
            <circle cx="32" cy="21.2" r="7.5" fill={`url(#${uid}-sun)`} />
          </g>
        ) : null}

        {/* The T: horizon crossbar, straight stem, single serif foot */}
        <g fill={isOutline ? "currentColor" : isMono ? ink : `url(#${uid}-ink)`}>
          <path d="M13.9 22.1h36.2a2.7 2.7 0 0 1 0 5.4H13.9a2.7 2.7 0 0 1 0-5.4Z" />
          <path d="M29.6 27.3h4.8v22.6a2.4 2.4 0 0 1-4.8 0V27.3Z" />
        </g>

        {/* Single quiet contour: land below the horizon */}
        {!isMono ? (
          <path
            d="M12.5 56.8c5.7-2.2 10.4-2.1 14 .3 3.6 2.4 7.5 2.5 11.5.2 3.9-2.3 8.6-2.3 14.5.1"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        ) : null}
      </svg>
    </span>
  );
}

/** Back-compat alias used across older screens. */
export function BrandIcon({ size = 32, className }: any) {
  return <ThursdayMark size={size} className={className} />;
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
          <ThursdayMark
            size={88}
            className="shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
          />
        </div>
        <p className="splash-word mt-6 text-[30px] leading-none font-semibold tracking-[-0.04em] text-[#f4f6f0]">
          Thursday
        </p>
        <p className="splash-tag mt-2 text-[11.5px] font-medium tracking-[0.24em] text-[#9ab5a5] uppercase">
          A quieter place to share
        </p>
      </div>
      <div className="splash-track absolute bottom-14 h-[2px] w-[124px] overflow-hidden rounded-full bg-white/10">
        <span className="splash-fill block h-full rounded-full bg-[#8ec3a5]" />
      </div>
      <p className="splash-tag absolute bottom-8 text-[11.5px] tracking-[0.06em] text-white/30">
        Made for your circle
      </p>
    </div>,
    document.body,
  );
}

export function BrandLockup({ compact = false }: any) {
  return (
    <div className="flex items-center gap-2.5">
      <ThursdayMark
        size={32}
        className="shadow-[0_1px_2px_rgba(16,19,24,0.18)]"
      />
      {compact ? null : (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[20px] leading-none font-semibold tracking-[-0.035em] text-ink">
            Thursday
          </span>
          <span className="rounded-[8px] bg-canvas-deep px-1.5 py-0.5 text-[11px] font-medium tracking-[0.08em] text-muted uppercase">
            beta
          </span>
        </span>
      )}
    </div>
  );
}
