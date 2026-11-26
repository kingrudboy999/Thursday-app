import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import {
  ArrowLeft,
  BookmarkSimple,
  CaretDown,
  ChatCircle,
  DotsThree,
  Heart,
  MapPin,
  MusicNotes,
  PaperPlaneTilt,
  Play,
  Plus,
  ShareNetwork,
  SpeakerHigh,
  SpeakerSlash,
  UploadSimple,
  X,
} from "../lib/icons";
import { Avatar, FollowButton, VerifiedBadge } from "../components/social";
import { PHOTOS, formatCount } from "../lib/social";

export function ReelsView({
  reels,
  people,
  me,
  followingIds,
  onToggleFollow,
  onLike,
  onSave,
  onShare,
  onAddComment,
  onOpenPerson,
  onCreateReel,
  onRecordView,
  onlineIds = [],
  onOpenMessages,
  onClose,
}: any) {
  const [q, _] = useState<any>("for-you"),
    [j, C] = useState<any>(true),
    [U, J] = useState<any>(null),
    [te, Ne] = useState<any>([]),
    [he, K] = useState<any>(null),
    [ae, $] = useState<any>(""),
    [ye, Ve] = useState<any>(false),
    [pe, le] = useState<any>([]),
    Ee = useRef<any>(null),
    Ce = useRef<any>({}),
    He =
      q === "following"
        ? reels.filter((X_local?: any) =>
            followingIds.includes(X_local.authorId),
          )
        : reels;
  useEffect(() => {
    const X_local = Ee.current;
    if (!X_local) return;
    const se = new IntersectionObserver(
      (h?: any) => {
        h.forEach((k?: any) => {
          const D = k.target.getAttribute("data-reel-id"),
            I = k.target.querySelector("video");
          !D ||
            !I ||
            (k.isIntersecting && k.intersectionRatio > 0.65
              ? (J(D), te.includes(D) || I.play().catch(() => {}))
              : I.pause());
        });
      },
      {
        root: X_local,
        threshold: [0, 0.65, 0.9],
      },
    );
    Object.values(Ce.current).forEach((h?: any) => h && se.observe(h));
    return () => se.disconnect();
  }, [He.length, te]);
  useEffect(() => {
    const X_local = (se?: any) => {
      if (
        !he &&
        (se.key === "Escape" && onClose(),
        se.key === "ArrowDown" || se.key === "ArrowUp")
      ) {
        se.preventDefault();
        const h = He.findIndex((I?: any) => I.id === U),
          k =
            se.key === "ArrowDown"
              ? Math.min(He.length - 1, Math.max(0, h) + 1)
              : Math.max(0, (h < 0 ? 0 : h) - 1),
          D = He[k];
        D &&
          Ce.current[D.id]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }
    };
    document.addEventListener("keydown", X_local);
    return () => document.removeEventListener("keydown", X_local);
  }, [U, he, He, onClose]);
  // Fire a real, server-tracked view increment when a reel becomes active
  useEffect(() => {
    if (!U) return;
    const timer = window.setTimeout(() => {
      onRecordView?.(U);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [U]);
  const V = (X_local?: any) => {
      const h = Ce.current[X_local]?.querySelector("video");
      h &&
        (h.paused
          ? (Ne((k?: any) => k.filter((D?: any) => D !== X_local)),
            h.play().catch(() => {}))
          : (h.pause(),
            Ne((k?: any) => (k.includes(X_local) ? k : [...k, X_local]))));
    },
    W = () => {
      const X_local = !j;
      C(X_local);
      Object.values(Ce.current).forEach((se?: any) => {
        const h = se?.querySelector("video");
        h && se?.getAttribute("data-reel-id") === U && (h.muted = X_local);
      });
    },
    G = reels.find((X_local?: any) => X_local.id === he) ?? null;
  return (
    <div className="fixed inset-0 z-[45] flex flex-col overflow-hidden bg-[#0a0d09] text-white">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 bg-gradient-to-b from-black/70 via-black/25 to-transparent px-3 pt-3 pb-10 sm:px-5">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to feed"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55"
          >
            <ArrowLeft size={18} strokeWidth={2} />
          </button>
          <div className="hidden min-w-0 sm:block">
            <p className="text-[20px] font-semibold leading-none tracking-[-0.02em] text-white">
              Reels
            </p>
            <p className="mt-0.5 truncate text-[8.5px] font-medium tracking-[0.14em] text-white/50 uppercase">
              Thursday · short moments
            </p>
          </div>
          <p className="text-[18px] font-semibold leading-none tracking-[-0.02em] text-white sm:hidden">
            Reels
          </p>
        </div>
        <div className="pointer-events-auto flex items-center gap-1.5">
          <div className="flex items-center rounded-full border border-white/15 bg-black/35 p-0.5 backdrop-blur-md">
            {[
              {
                value: "for-you",
                label: "For you",
              },
              {
                value: "following",
                label: "Following",
              },
            ].map((X_local?: any) => (
              <button
                key={X_local.value}
                type="button"
                onClick={() => {
                  _(X_local.value);
                  Ee.current?.scrollTo({
                    top: 0,
                  });
                }}
                aria-pressed={q === X_local.value}
                className={cn(
                  "h-6.5 rounded-full px-2.5 text-[11px] font-semibold transition-colors",
                  q === X_local.value
                    ? "bg-white text-[#141810]"
                    : "text-white/70 hover:text-white",
                )}
              >
                {X_local.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => Ve(true)}
            aria-label="Create a reel"
            className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-3 text-[11.5px] font-semibold text-[#141810] transition-colors hover:bg-white/90"
          >
            <Plus size={12} strokeWidth={2.6} />
            <span className="hidden xs:inline">Create</span>
          </button>
        </div>
      </header>
      <div
        ref={Ee}
        className="no-scrollbar h-full w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain"
        aria-label="Reels feed"
      >
        {He.length ? (
          He.map((X_local?: any) => {
            const se = people.find((I?: any) => I.id === X_local.authorId);
            if (!se) return null;
            const h = U === X_local.id,
              k = te.includes(X_local.id),
              D = followingIds.includes(se.id);
            return (
              <section
                key={X_local.id}
                data-reel-id={X_local.id}
                ref={(I?: any) => {
                  Ce.current[X_local.id] = I;
                }}
                className="relative h-[100dvh] w-full snap-start overflow-hidden"
              >
                <video
                  src={X_local.video}
                  poster={X_local.poster}
                  loop
                  playsInline
                  muted={j}
                  preload="metadata"
                  className="absolute inset-0 h-full w-full object-cover"
                  onClick={() => V(X_local.id)}
                  onCanPlay={() =>
                    le((I?: any) =>
                      I.includes(X_local.id) ? I : [...I, X_local.id],
                    )
                  }
                  aria-label={X_local.caption}
                />
                {pe.includes(X_local.id) ? null : (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="shimmer inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    </span>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-transparent via-50% to-black/90" />
                <div className="absolute inset-0">
                  {h && k ? (
                    <button
                      type="button"
                      onClick={() => V(X_local.id)}
                      aria-label="Play reel"
                      className="absolute top-1/2 left-1/2 inline-flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
                    >
                      <Play
                        size={22}
                        strokeWidth={1.8}
                        className="ml-0.5 fill-current"
                      />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={W}
                    aria-label={j ? "Turn sound on" : "Mute reel"}
                    className="absolute top-16 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                  >
                    {j ? (
                      <SpeakerSlash size={16} strokeWidth={2} />
                    ) : (
                      <SpeakerHigh size={16} strokeWidth={2} />
                    )}
                  </button>
                  <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4 sm:right-3">
                    <ReelActionButton
                      icon={Heart}
                      label={X_local.liked ? "Unlike" : "Like"}
                      count={X_local.likes}
                      active={X_local.liked}
                      activeClass="text-[#f0a48c]"
                      onClick={() => onLike(X_local.id)}
                    />
                    <ReelActionButton
                      icon={ChatCircle}
                      label="Comments"
                      count={X_local.comments.length}
                      onClick={() => K(X_local.id)}
                    />
                    <ReelActionButton
                      icon={BookmarkSimple}
                      label={X_local.saved ? "Saved" : "Save"}
                      active={X_local.saved}
                      onClick={() => onSave(X_local.id)}
                    />
                    <ReelActionButton
                      icon={ShareNetwork}
                      label="Share"
                      count={X_local.shares}
                      onClick={() => onShare(X_local)}
                    />
                    <ReelActionButton
                      icon={PaperPlaneTilt}
                      label="Send"
                      onClick={() => {
                        onShare(X_local);
                        onOpenMessages();
                      }}
                    />
                    <ReelActionButton
                      icon={DotsThree}
                      label="More"
                      onClick={() => {}}
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 z-20 px-3.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pr-[68px] sm:px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenPerson(se.id)}
                        aria-label={`View ${se.name}`}
                        className="rounded-full ring-2 ring-white/35"
                      >
                        <Avatar person={se} size="md" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenPerson(se.id)}
                        className="flex min-w-0 items-center gap-1 text-left"
                      >
                        <span className="truncate text-[13px] font-semibold text-white">
                          {se.name}
                        </span>
                        {se.verified ? (
                          <VerifiedBadge className="text-white/80" />
                        ) : null}
                      </button>
                      <FollowButton
                        following={D}
                        onChange={() => onToggleFollow(se.id)}
                        size="sm"
                      />
                      <span className="ml-0.5 rounded-full bg-white/15 px-1.5 py-0.5 text-[8.5px] font-medium text-white/85 backdrop-blur">
                        @{se.handle}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 max-w-[92%] text-[12.5px] leading-[1.55] text-white/92">
                      {X_local.caption}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pr-2 text-[10.5px] text-white/70">
                      <span className="inline-flex min-w-0 items-center gap-1">
                        <MusicNotes
                          size={10}
                          strokeWidth={2}
                          className="shrink-0"
                        />
                        <span className="truncate">{X_local.audio}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={9} strokeWidth={2} />
                        {X_local.location}
                      </span>
                      <span className="inline-flex items-center gap-1 text-white/45 tabular-nums">
                        {onlineIds.includes(se.id) ? (
                          <span className="h-1 w-1 animate-pulse rounded-full bg-[#7ed6a2]" />
                        ) : null}
                        {formatCount(X_local.views)}
                        {" views"}
                      </span>
                    </div>
                  </div>
                </div>
                {He.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      const I = He.findIndex(
                          (ve?: any) => ve.id === X_local.id,
                        ),
                        me = He[I + 1];
                      me &&
                        Ce.current[me.id]?.scrollIntoView({
                          behavior: "smooth",
                        });
                    }}
                    aria-label="Next reel"
                    className="absolute bottom-4 left-1/2 z-30 hidden -translate-x-1/2 flex-col items-center gap-0.5 text-white/55 transition-colors hover:text-white sm:flex"
                  >
                    <CaretDown
                      size={16}
                      strokeWidth={2}
                      className="animate-bounce"
                    />
                    <span className="text-[8px] font-medium tracking-[0.08em] uppercase">
                      Next
                    </span>
                  </button>
                ) : null}
              </section>
            );
          })
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <Play size={24} strokeWidth={1.6} className="text-white/50" />
            <p className="mt-3 text-[14px] font-semibold text-white">
              Your following feed is quiet
            </p>
            <p className="mt-1 max-w-[280px] text-[12px] leading-relaxed text-white/60">
              Follow a few creators, or switch back to For you to keep watching.
            </p>
            <button
              type="button"
              onClick={() => _("for-you")}
              className="mt-4 h-8 rounded-full bg-white px-4 text-[12px] font-semibold text-[#141810]"
            >
              Back to For you
            </button>
          </div>
        )}
      </div>
      {G ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-end bg-black/45 backdrop-blur-[2px] sm:items-stretch">
          <button
            type="button"
            aria-label="Close comments"
            onClick={() => K(null)}
            className="absolute inset-0 cursor-default"
          />
          <div className="animate-drawer relative flex h-[72vh] w-full flex-col border-t border-white/10 bg-[#141814] sm:h-full sm:max-w-[380px] sm:border-t-0 sm:border-l">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-white">Comments</p>
                <p className="text-[10px] text-white/50">
                  {G.comments.length}
                  {" replies · Be kind"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => K(null)}
                aria-label="Close comments"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              >
                <X size={15} strokeWidth={2} />
              </button>
            </div>
            <div className="thin-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {G.comments.length ? (
                G.comments.map((X_local?: any) => {
                  const se = people.find(
                    (h?: any) => h.id === X_local.authorId,
                  );
                  return se ? (
                    <div key={X_local.id} className="flex gap-2.5">
                      <button type="button" onClick={() => onOpenPerson(se.id)}>
                        <Avatar person={se} size="sm" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="truncate text-[11.5px] font-semibold text-white">
                            {se.name}
                          </span>
                          {se.verified ? (
                            <VerifiedBadge className="text-white/60" />
                          ) : null}
                          <span className="text-[8.5px] text-white/40">
                            {"· "}
                            {X_local.time}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] leading-[1.55] text-white/80">
                          {X_local.text}
                        </p>
                        <button
                          type="button"
                          className="mt-1 inline-flex items-center gap-1 text-[8.5px] font-semibold text-white/45 hover:text-white/80"
                        >
                          <Heart size={9} strokeWidth={2.2} /> {X_local.likes}
                          {" · Reply"}
                        </button>
                      </div>
                    </div>
                  ) : null;
                })
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ChatCircle
                    size={20}
                    strokeWidth={1.7}
                    className="text-white/40"
                  />
                  <p className="mt-2 text-[12px] font-semibold text-white/80">
                    No comments yet
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-white/45">
                    Say the first kind thing.
                  </p>
                </div>
              )}
            </div>
            <form
              onSubmit={(X_local?: any) => {
                X_local.preventDefault();
                ae.trim() && (onAddComment(G.id, ae.trim()), $(""));
              }}
              className="flex items-center gap-2 border-t border-white/10 p-2.5"
            >
              <Avatar person={me} size="xs" />
              <input
                value={ae}
                onChange={(X_local?: any) => $(X_local.target.value)}
                placeholder="Add a comment…"
                aria-label="Add a reel comment"
                className="h-9 min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-3.5 text-[12px] text-white placeholder:text-white/40 focus:border-white/35 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!ae.trim()}
                aria-label="Send comment"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#141810] disabled:opacity-35"
              >
                <PaperPlaneTilt size={14} strokeWidth={2} />
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <CreateReelModal
        open={ye}
        onClose={() => Ve(false)}
        me={me}
        onCreate={(X_local?: any) => {
          onCreateReel(X_local);
          Ve(false);
        }}
      />
    </div>
  );
}
function ReelActionButton({
  icon: IconComp,
  label,
  count,
  active,
  activeClass,
  onClick,
}: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className="flex w-11 flex-col items-center gap-1 text-white"
    >
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-md transition-colors hover:bg-black/55">
        <IconComp
          size={19}
          strokeWidth={1.9}
          className={cn(
            "transition-colors",
            active && "fill-current",
            active && activeClass,
          )}
          aria-hidden="true"
        />
      </span>
      <span className="max-w-full truncate text-[8.5px] font-semibold tracking-[0.01em] text-white/85">
        {count !== undefined ? formatCount(count) : label}
      </span>
    </button>
  );
}
export function CreateReelModal({ open, onClose, me, onCreate }: any) {
  const [x, w] = useState<any>(null),
    [A, T] = useState<any>(""),
    [y, g] = useState<any>(""),
    [R, z] = useState<any>(me.location),
    [v, q] = useState<any>("");
  useEffect(() => {
    open && (w(null), T(""), g(""), q(""), z(me.location));
  }, [open, me.location]);
  return open ? (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[92dvh] w-full max-w-[520px] flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#141814] text-white sm:rounded-xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3.5">
          <div>
            <p className="text-[13px] font-semibold text-white">
              Create a reel
            </p>
            <p className="mt-0.5 text-[10.5px] text-white/50">
              Vertical, under a minute, entirely yours.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        <div className="thin-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div className="flex items-center gap-2.5">
            <Avatar person={me} size="sm" />
            <div>
              <p className="text-[11.5px] font-semibold text-white">
                {me.name}
              </p>
              <p className="text-[10px] text-white/45">
                Anyone can watch · no tracking tags
              </p>
            </div>
          </div>
          {x ? (
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
              <video
                src={x}
                controls
                playsInline
                className="aspect-[9/13] w-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(x);
                  w(null);
                  T("");
                }}
                aria-label="Remove video"
                className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
              >
                <X size={13} strokeWidth={2.4} />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-9 text-center transition-colors hover:border-white/40 hover:bg-white/[0.06]">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80">
                <UploadSimple size={17} strokeWidth={1.9} />
              </span>
              <span className="mt-2.5 text-[12px] font-semibold text-white">
                Choose a vertical video
              </span>
              <span className="mt-0.5 text-[10px] text-white/45">
                MP4 or MOV · recommended 9:16
              </span>
              <input
                type="file"
                accept="video/*"
                className="sr-only"
                onChange={(_?: any) => {
                  const j = _.target.files?.[0];
                  if (j) {
                    if (!j.type.startsWith("video/")) {
                      q("That file is not a video. Try an MP4 or MOV.");
                      return;
                    }
                    if (j.size > 24 * 1024 * 1024) {
                      q("Keep uploads under 24 MB so it syncs for everyone.");
                      return;
                    }
                    // Persist as a durable data URL so the reel survives reload
                    // and streams to every other account in real time.
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        w(reader.result);
                        T(j.name);
                        q("");
                      }
                    };
                    reader.readAsDataURL(j);
                  }
                }}
              />
            </label>
          )}
          {A ? (
            <p className="truncate text-[10px] text-white/40">
              {"Selected: "}
              {A}
            </p>
          ) : null}
          <label className="block space-y-1">
            <span className="text-[10.5px] font-medium text-white/70">
              Caption
            </span>
            <textarea
              value={y}
              onChange={(_?: any) => g(_.target.value)}
              rows={3}
              maxLength={180}
              placeholder="What are we looking at?"
              className="w-full resize-none rounded-lg border border-white/15 bg-white/5 px-2.5 py-2 text-[12px] leading-relaxed text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10.5px] font-medium text-white/70">
              Place
            </span>
            <input
              value={R}
              onChange={(_?: any) => z(_.target.value)}
              className="h-8 w-full rounded-lg border border-white/15 bg-white/5 px-2.5 text-[11.5px] text-white focus:border-white/40 focus:outline-none"
            />
          </label>
          {v ? (
            <p className="rounded-md border border-[#d59679]/30 bg-[#d59679]/10 px-2 py-1.5 text-[10.5px] text-[#f0b49a]">
              {v}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
          <span className="text-[10px] text-white/35">
            Stored on this device in this build.
          </span>
          <button
            type="button"
            onClick={() => {
              const _ = x;
              if (!_) {
                q("Choose a vertical video to share.");
                return;
              }
              onCreate({
                id: `reel_${Date.now()}`,
                authorId: me.id,
                video: _,
                poster: PHOTOS.coffee,
                caption: y.trim() || "A small moment from today.",
                audio: "Original audio",
                location: R.trim() || me.location,
                likes: 0,
                shares: 0,
                views: 0,
                liked: false,
                saved: false,
                comments: [],
              });
            }}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[11.5px] font-semibold text-[#141810] hover:bg-white/90"
          >
            <UploadSimple size={12} strokeWidth={2.4} />
            Publish reel
          </button>
        </div>
      </div>
    </div>
  ) : null;
}
