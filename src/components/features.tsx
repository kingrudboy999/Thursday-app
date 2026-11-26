import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import {
  BellSlash,
  BookmarkSimple,
  CaretRight,
  Clock,
  Eye,
  Lock,
  PaperPlaneTilt,
  Pause,
  Play,
  Plus,
  PushPin,
  Sparkle,
  UsersThree,
  X,
} from "../lib/icons";
import { Avatar } from "./social";
import {
  AUDIO_TRACKS,
  CLOSE_FRIEND_IDS,
  INITIAL_DRAFTS,
  RECENT_VISITORS,
} from "../lib/features";
import { PHOTOS, formatCount } from "../lib/social";

export function StoryHighlightsStrip({ highlights, onOpen, onAdd }: any) {
  return (
    <div className="border-t border-line px-4 py-3 sm:px-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-[0.1em] text-faint uppercase">
          Highlights
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-forest"
        >
          <Plus size={11} weight="bold" />
          {" New"}
        </button>
      </div>
      <div className="no-scrollbar mt-2 flex gap-3 overflow-x-auto pb-0.5">
        {highlights.map((d?: any) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onOpen(d)}
            className="group flex w-[62px] shrink-0 flex-col items-center gap-1 text-center"
          >
            <span className="relative inline-flex h-[48px] w-[48px] overflow-hidden rounded-full border-2 border-surface ring-2 ring-forest/60 transition-transform group-hover:scale-105">
              <img
                src={d.image}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </span>
            <span className="w-full truncate text-[9.5px] font-medium text-muted">
              {d.title}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="flex w-[62px] shrink-0 flex-col items-center gap-1"
        >
          <span className="inline-flex h-[48px] w-[48px] items-center justify-center rounded-full border border-dashed border-line-strong text-muted hover:border-forest/40 hover:text-forest">
            <Plus size={15} />
          </span>
          <span className="text-[9.5px] text-muted">Add</span>
        </button>
      </div>
    </div>
  );
}
export function CloseFriendsPill({ people }: any) {
  const u = people.filter((m?: any) => CLOSE_FRIEND_IDS.includes(m.id));
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full border border-forest/25 bg-forest-wash px-2 py-0.5 text-[9.5px] font-semibold text-forest">
        <UsersThree size={10} weight="fill" />
        {" Close friends"}
      </span>
      <span className="flex -space-x-1.5">
        {u.map((m?: any) => (
          <span key={m.id} className="rounded-full ring-2 ring-[#0b0f0c]">
            <Avatar person={m} size="xs" />
          </span>
        ))}
      </span>
    </div>
  );
}
export function DraftsModal({ open, onClose, onPublish, onDelete }: any) {
  const [x, w] = useState<any>(INITIAL_DRAFTS);
  return open
    ? createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={onClose}
            aria-label="Close drafts"
          />
          <div className="animate-pop relative max-h-[80vh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl border border-line bg-surface p-4 sm:rounded-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-ink">Drafts</p>
                <p className="text-[11px] text-muted">
                  Saved on this device. Only you can see them.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-canvas-deep"
              >
                <X size={15} />
              </button>
            </div>
            <div className="space-y-2">
              {x.map((A?: any) => (
                <div key={A.id} className="rounded-lg border border-line p-2.5">
                  <p className="line-clamp-3 text-[12px] leading-[1.55] text-ink-soft">
                    {A.text}
                  </p>
                  {A.image ? (
                    <img
                      src={A.image}
                      alt=""
                      className="mt-2 h-20 w-full rounded-md object-cover"
                    />
                  ) : null}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] text-faint">
                      <Clock size={10} /> {A.savedAt}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onPublish(A);
                          w((T?: any) => T.filter((y?: any) => y.id !== A.id));
                          onClose();
                        }}
                        className="text-[10.5px] font-semibold text-forest"
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          w((T?: any) => T.filter((y?: any) => y.id !== A.id));
                          onDelete(A.id);
                        }}
                        className="text-[10.5px] font-medium text-muted hover:text-clay"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {x.length ? null : (
                <p className="py-6 text-center text-[12px] text-muted">
                  No drafts yet.
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;
}
export function AudioLibraryModal({ open, onClose }: any) {
  const [m, d] = useState<any>("a1");
  return open
    ? createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={onClose}
            aria-label="Close audio"
          />
          <div className="animate-pop relative w-full max-w-[460px] rounded-t-2xl border border-line bg-surface p-4 sm:rounded-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-ink">Add audio</p>
                <p className="text-[11px] text-muted">
                  Licensed tracks for your reels.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-canvas-deep"
              >
                <X size={15} />
              </button>
            </div>
            {AUDIO_TRACKS.map((x?: any) => (
              <div
                key={x.id}
                className="flex items-center gap-2.5 border-b border-line/70 py-2 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => d(m === x.id ? null : x.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-forest text-white"
                  aria-label={m === x.id ? "Pause" : "Play track"}
                >
                  {m === x.id ? (
                    <Pause size={14} weight="fill" />
                  ) : (
                    <Play size={14} weight="fill" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-ink">
                    {x.title}
                  </p>
                  <p className="truncate text-[10.5px] text-muted">
                    {x.artist}
                    {" · "}
                    {x.tone}
                  </p>
                </div>
                <span className="text-[10px] text-faint">
                  {formatCount(x.uses)}
                </span>
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )
    : null;
}
export function ThursdayPromptCard({ prompt, onVote }: any) {
  const [m, d] = useState<any>(null);
  return (
    <div className="rounded-xl border border-line bg-surface p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-faint uppercase">
          <Sparkle size={11} />
          {" Thursday prompt"}
        </p>
        <span className="text-[10px] text-faint">
          {prompt.closes}
          {" left"}
        </span>
      </div>
      <p className="text-[13.5px] font-semibold text-ink">{prompt.question}</p>
      <div className="mt-2.5 space-y-1.5">
        {prompt.options.map((x?: any) => {
          const w = prompt.votes + (m ? 1 : 0),
            A = m
              ? Math.round(
                  ((prompt.votes / prompt.options.length + (m === x ? 1 : 0)) /
                    w) *
                    100,
                )
              : null;
          return (
            <button
              key={x}
              type="button"
              disabled={!!m}
              onClick={() => {
                d(x);
                onVote(x);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left text-[11.5px] transition-colors",
                m === x
                  ? "border-forest/40 bg-forest-wash font-semibold text-forest"
                  : "border-line text-ink-soft hover:border-line-strong",
              )}
            >
              {x}
              {A !== null ? (
                <span className="text-[10.5px] text-muted">{A}%</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-faint">
        {prompt.votes + (m ? 1 : 0)}
        {" answers"}
      </p>
    </div>
  );
}
export function GuideCard({ guide, onOpen }: any) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-2.5 text-left transition-colors hover:border-line-strong"
    >
      <img
        src={guide.image}
        alt=""
        className="h-14 w-14 shrink-0 rounded-lg object-cover"
        loading="lazy"
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[9.5px] font-semibold tracking-[0.06em] text-faint uppercase">
          <BookmarkSimple size={10} />
          {" Guide · "}
          {guide.steps}
          {" steps"}
        </p>
        <p className="mt-0.5 truncate text-[12.5px] font-semibold text-ink">
          {guide.title}
        </p>
        <p className="line-clamp-1 text-[10.5px] text-muted">{guide.summary}</p>
      </div>
      <CaretRight
        size={14}
        className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}
export function PinPostButton({ pinned, onToggle }: any) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={pinned}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9.5px] font-medium transition-colors",
        pinned
          ? "border-forest/25 bg-forest-wash text-forest"
          : "border-line bg-surface text-muted hover:text-ink",
      )}
    >
      <PushPin size={9} /> {pinned ? "Pinned to profile" : "Pin to profile"}
    </button>
  );
}
export function QuietHoursCard({ enabled, onChange }: any) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-muted px-3 py-2.5">
      <div className="flex items-start gap-2">
        <BellSlash size={13} className="mt-0.5 shrink-0 text-forest" />
        <div>
          <p className="text-[11.5px] font-medium text-ink">Quiet hours</p>
          <p className="text-[10px] text-muted">
            Mute notifications between 22:00 and 07:30.
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Toggle quiet hours"
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          enabled
            ? "border-forest bg-forest"
            : "border-line-strong bg-canvas-deep",
        )}
      >
        <span
          className={cn(
            "block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
            enabled ? "translate-x-[17px]" : "translate-x-[3px]",
          )}
        />
      </button>
    </div>
  );
}
export function ProfileVisitorsStrip({ people, onOpen }: any) {
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-faint uppercase">
          <Eye size={11} />
          {" Profile visitors"}
        </p>
        <span className="text-[9.5px] text-faint">last 7 days</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex -space-x-2">
          {RECENT_VISITORS.slice(0, 5).map((m?: any) => {
            const d = people.find((x?: any) => x.id === m.personId);
            return d ? (
              <button
                key={m.personId}
                type="button"
                onClick={() => onOpen(d.id)}
                className="rounded-full ring-2 ring-surface"
                aria-label={`${d.name}, ${m.time}`}
              >
                <Avatar person={d} size="sm" />
              </button>
            ) : null;
          })}
        </div>
        <span className="text-[10.5px] text-muted">
          +{RECENT_VISITORS.length - 5}
          {" more"}
        </span>
      </div>
    </div>
  );
}
export function StoryComposerModal({ open, onClose, onShare, me }: any) {
  const [x, w] = useState<any>(""),
    [A, T] = useState<any>(PHOTOS.potteryWindow),
    [y, g] = useState<any>(null),
    R = [
      PHOTOS.potteryWindow,
      PHOTOS.trail,
      PHOTOS.coffee,
      PHOTOS.pampas,
      PHOTOS.bookshop,
      PHOTOS.paintBrushes,
    ];
  return open
    ? createPortal(
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[#050806]/95 p-3 sm:p-6">
          <div className="relative flex h-full max-h-[760px] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f0c]">
            <img
              src={A}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            <div className="relative z-10 flex items-center justify-between p-3">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-medium text-white/80 backdrop-blur">
                <Lock size={10} />
                {" Close friends"}
              </div>
            </div>
            <div className="relative z-10 mt-auto p-4">
              <div className="mb-3 flex items-center gap-2">
                <Avatar person={me} size="sm" ring />
                <span className="text-[12px] font-semibold text-white">
                  {me.name}
                </span>
              </div>
              <textarea
                value={x}
                onChange={(z?: any) => w(z.target.value)}
                rows={2}
                placeholder="Add a caption…"
                className="w-full resize-none rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-[12.5px] text-white placeholder:text-white/45 backdrop-blur focus:outline-none"
              />
              <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
                {R.map((z?: any) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => T(z)}
                    aria-label="Choose photo"
                    className={cn(
                      "h-11 w-11 shrink-0 overflow-hidden rounded-md border-2",
                      A === z ? "border-white" : "border-white/20",
                    )}
                  >
                    <img
                      src={z}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
                <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-white/30 text-white/70">
                  <Plus size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(z?: any) => {
                      const v = z.target.files?.[0];
                      v && g(URL.createObjectURL(v));
                    }}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  onShare(x.trim() || "A small moment from today.", y ?? A);
                  w("");
                  g(null);
                  onClose();
                }}
                className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-[12px] font-semibold text-[#101318]"
              >
                <PaperPlaneTilt size={13} weight="fill" />
                {" Share to your story"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;
}
export function WeeklyRecapCard({ people, onOpen }: any) {
  const m = useMemo(
    () => [
      {
        label: "Posts shared",
        value: "6",
        tone: "text-ink",
      },
      {
        label: "Circle replies",
        value: "24",
        tone: "text-ink",
      },
      {
        label: "New friends",
        value: "2",
        tone: "text-forest",
      },
    ],
    [],
  );
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
          <Sparkle size={12} className="text-forest" />
          {" Your week on Thursday"}
        </p>
        <span className="text-[9.5px] text-faint">Jun 12 – 18</span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-line">
        {m.map((d?: any) => (
          <div key={d.label} className="px-3 py-2.5">
            <p className={cn("text-[16px] font-semibold tabular-nums", d.tone)}>
              {d.value}
            </p>
            <p className="mt-0.5 text-[9.5px] leading-tight text-muted">
              {d.label}
            </p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-line px-3.5 py-2.5">
        <div className="flex -space-x-1.5">
          {people.slice(1, 4).map((d?: any) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onOpen(d.id)}
              className="rounded-full ring-2 ring-surface"
            >
              <Avatar person={d} size="xs" />
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted">
          Three people in your circle shared something new.
        </p>
      </div>
    </div>
  );
}
export function QuickReactionsBar({ personName, onSend }: any) {
  const [m, d] = useState<any>(""),
    x = useRef<any>(null);
  return (
    <div className="flex items-center gap-2">
      <input
        ref={x}
        value={m}
        onChange={(w?: any) => d(w.target.value)}
        onKeyDown={(w?: any) => {
          w.key === "Enter" && m.trim() && (onSend(m.trim()), d(""));
        }}
        placeholder={`Reply to ${personName.split(" ")[0]}…`}
        aria-label="Reply to story"
        className="h-10 min-w-0 flex-1 rounded-full border border-white/20 bg-black/30 px-4 text-[12.5px] text-white backdrop-blur-md placeholder:text-white/50 focus:border-white/45 focus:outline-none"
      />
      <button
        type="button"
        onClick={() => {
          m.trim() && (onSend(m.trim()), d(""));
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#101318]"
        aria-label="Send reply"
      >
        <PaperPlaneTilt size={15} weight="fill" />
      </button>
    </div>
  );
}
