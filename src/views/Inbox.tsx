import { useEffect, useMemo, useRef, useState } from "react";
import {
  VoiceRecorderSession,
  playGentleCallTone,
  playVoiceNote,
  readFileAsDataUrl,
  stopVoiceNotePlayback,
} from "../lib/audio";
import { cn } from "../lib/cn";
import { dayLabel, messageStamp } from "../lib/time";
import {
  Archive,
  ArrowBendUpLeft,
  ArrowLeft,
  BellSlash,
  ChatCircle,
  Check,
  Checks,
  DotsThree,
  Image,
  Info,
  MagnifyingGlass,
  MapPin,
  Microphone,
  PaperPlaneTilt,
  Pause,
  Phone,
  Play,
  Plus,
  PushPin,
  ShieldCheck,
  Smiley,
  Trash,
  UserPlus,
  VideoCamera,
  X,
} from "../lib/icons";
import {
  Avatar,
  EmptyState,
  FollowButton,
  Modal,
  VerifiedBadge,
} from "../components/social";
import { PHOTOS, formatCount } from "../lib/social";

const MESSAGE_REACTIONS = ["❤️", "😂", "🔥", "👏", "🥹", "🙌"];
const CHAT_PHOTO_PRESETS = [
  {
    label: "Studio",
    url: PHOTOS.potteryWindow,
  },
  {
    label: "Trail",
    url: PHOTOS.trail,
  },
  {
    label: "Coffee",
    url: PHOTOS.coffee,
  },
  {
    label: "Flowers",
    url: PHOTOS.pampas,
  },
  {
    label: "Books",
    url: PHOTOS.bookshop,
  },
  {
    label: "Picnic",
    url: PHOTOS.picnic,
  },
];
function formatMessageDay(c?: any, createdAt?: any) {
  // Prefer the stored ISO time; the legacy clock string can only tell us
  // "today", which is why every older message used to claim it was Today.
  const label = dayLabel(createdAt);
  if (label) return label;
  return /AM|PM/i.test(c || "") ? "Today" : c;
}
/** A fixed, natural-looking waveform profile shared by every voice note. */
const VOICE_BARS = [
  5, 9, 6, 12, 8, 14, 10, 6, 11, 7, 13, 9, 5, 10, 12, 7, 9, 6, 11, 8, 13, 10, 6, 9,
  12, 7, 5, 11, 8, 10,
];

/** Elapsed time for a playing note, derived from progress and total duration. */
function formatVoiceElapsed(progress: number, duration?: string): string {
  const parts = String(duration || "0:00").split(":").map((n) => Number(n) || 0);
  const total = parts.length >= 2 ? parts[0] * 60 + parts[1] : parts[0] || 0;
  const seconds = Math.max(0, Math.round(total * Math.min(1, Math.max(0, progress))));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDuration(c?: any) {
  return c
    ? c.attachment?.type === "image"
      ? "📷 Photo"
      : c.attachment?.type === "voice"
        ? `🎙 Voice note · ${c.attachment.duration}`
        : c.text
    : "Say hello";
}
function SwipeableMessage({ message, onReply, onReact, children }: any) {
  const [x, w] = useState<any>(0),
    A = useRef<any>(null),
    xRef = useRef(0),
    T = message.from === "me",
    y = () => {
      if (A.current === null) return;
      xRef.current > 48 && onReply(message);
      xRef.current = 0;
      w(0);
      A.current = null;
    };
  return (
    // w-full matters: this row sits inside a column with `items-start`, so without
    // an explicit width it shrink-wraps and the child's `max-w-[84%]` resolves
    // against a width derived from its own content. That circularity crushed
    // wide bubbles (voice notes were clipped mid-waveform) instead of capping them.
    <div className={cn("relative flex w-full", T ? "justify-end" : "justify-start")}>
      <span
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-forest transition-opacity",
          T ? "left-1" : "left-8",
        )}
        style={{
          opacity: Math.min(x / 42, 1),
        }}
        aria-hidden="true"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-forest-soft">
          <ArrowBendUpLeft size={13} strokeWidth={2.2} />
        </span>
      </span>
      <div
        className="relative max-w-[84%] touch-pan-y select-none sm:max-w-[74%]"
        style={{
          transform: `translateX(${x}px)`,
          transition:
            A.current === null ? "transform 180ms ease-out" : undefined,
        }}
        onPointerDown={(g?: any) => {
          A.current = g.clientX;
          xRef.current = 0;
          // Keep receiving the drag even once the finger slides off this element
          // (it now starts near the bubble's edge, so leaving is normal).
          g.currentTarget.setPointerCapture?.(g.pointerId);
        }}
        onPointerMove={(g?: any) => {
          if (A.current === null) return;
          const R = g.clientX - A.current;
          if (R > 4) {
            const v = Math.min(R, 84);
            xRef.current = v;
            w(v);
          }
        }}
        onPointerUp={y}
        onPointerCancel={y}
        onDoubleClick={onReact}
      >
        {children}
      </div>
    </div>
  );
}
export function InboxView({
  me: c,
  meId = "me",
  onlineIds = [],
  people,
  conversations,
  followingIds,
  readReceipts,
  initialPersonId,
  onSend,
  onReact,
  onTyping,
  onCallSignal,
  onMarkRead,
  onTogglePin,
  onToggleMute,
  onArchive,
  onAcceptRequest,
  onDeclineRequest,
  onStartConversation,
  onOpenPerson,
  onToggleFollow,
  onToast,
}: any) {
  const J = conversations.find((E?: any) => E.personId === initialPersonId),
    [te, Ne] = useState<any>(J?.id ?? null),
    [he, K] = useState<any>("all"),
    [ae, $] = useState<any>(""),
    [ye, Ve] = useState<any>(""),
    [pe, le] = useState<any>(null),
    [Ee, Ce] = useState<any>(false),
    [He, V] = useState<any>(false),
    [W, G] = useState<any>(""),
    [X_local, se] = useState<any>(false),
    [h, k] = useState<any>(false),
    [D, I] = useState<any>(false),
    [me, ve] = useState<any>(null),
    [de, qe] = useState<any>(false),
    [De, pt] = useState<any>(0),
    [St, Mt] = useState<any>(null),
    [playingVoice, setPlayingVoice] = useState<{ id: string; progress: number } | null>(null),
    [activeCall, setActiveCall] = useState<{
      mode: "voice" | "video";
      person: any;
      convId: string;
      status: "ringing" | "connected";
      seconds: number;
      muted: boolean;
    } | null>(null),
    recorderRef = useRef<VoiceRecorderSession | null>(null),
    u0 = useRef<any>(null),
    fe = conversations.find((E?: any) => E.id === te) ?? null,
    Ae = fe ? (people.find((E?: any) => E.id === fe.personId) ?? null) : null,
    d0 = useMemo(
      () => ({
        unread: conversations.filter(
          (E?: any) => !E.request && !E.archived && E.unread > 0,
        ).length,
        requests: conversations.filter((E?: any) => E.request).length,
        archived: conversations.filter((E?: any) => E.archived).length,
      }),
      [conversations],
    ),
    Ft = useMemo(() => {
      const E = ae.trim().toLowerCase();
      return conversations
        .filter((ge?: any) => {
          const je = people.find((tt?: any) => tt.id === ge.personId);
          if (!je) return false;
          const m0 =
              !E ||
              je.name.toLowerCase().includes(E) ||
              je.handle.toLowerCase().includes(E) ||
              formatDuration(ge.messages[ge.messages.length - 1])
                .toLowerCase()
                .includes(E),
            I0 =
              he === "requests"
                ? ge.request
                : he === "archived"
                  ? ge.archived
                  : he === "unread"
                    ? ge.unread > 0 && !ge.request
                    : !ge.archived && !ge.request;
          return m0 && I0;
        })
        .sort((ge?: any, je?: any) => +!!je.pinned - +!!ge.pinned);
    }, [conversations, people, ae, he]);
  useEffect(() => {
    u0.current && (u0.current.scrollTop = u0.current.scrollHeight);
  }, [fe?.messages.length, te, fe?.typing, pe]);
  useEffect(() => {
    if (!de) return;
    const E = window.setInterval(() => pt((ge?: any) => ge + 1), 1e3);
    return () => window.clearInterval(E);
  }, [de]);
  useEffect(() => () => stopVoiceNotePlayback(), []);
  // --- hold-to-record voice notes -------------------------------------------------
  // A press on the mic starts recording straight away. Sliding up past the lock
  // line pins the recording in hands-free mode; letting go anywhere else sends.
  // The gesture is tracked on window, because the mic button is swapped out for
  // the recording bar the instant recording begins.
  const [locked, setLocked] = useState(false),
    lockedRef = useRef(false),
    holdY = useRef(0),
    recStartRef = useRef(0),
    startingRef = useRef(false),
    releasedEarly = useRef(false),
    holdTimer = useRef(0),
    [slideUp, setSlideUp] = useState(0);
  const LOCK_AT = 56;
  const beginHold = async () => {
    if (recorderRef.current) return;
    const session = new VoiceRecorderSession();
    recorderRef.current = session;
    startingRef.current = true;
    releasedEarly.current = false;
    holdY.current = 0;
    lockedRef.current = false;
    setSlideUp(0);
    setLocked(false);
    const ok = await session.start();
    startingRef.current = false;
    if (recorderRef.current !== session) return; // cancelled while waiting
    if (!ok) {
      recorderRef.current = null;
      return;
    }
    if (releasedEarly.current) {
      // let go before the mic was ready — nothing was captured
      recorderRef.current = null;
      releasedEarly.current = false;
      session.cancel();
      return;
    }
    recStartRef.current = Date.now();
    qe(true);
    pt(0);
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => void finishVoice(false), 180000);
  };
  const finishVoice = async (cancel: boolean) => {
    window.clearTimeout(holdTimer.current);
    const session = recorderRef.current;
    recorderRef.current = null;
    const secs = Math.max(2, Math.round((Date.now() - recStartRef.current) / 1000));
    if (!cancel && session) {
      const audioUrl = await session.stop();
      if (audioUrl) {
        Te({
          type: "voice",
          duration: `0:${String(secs).padStart(2, "0")}`,
          ...(audioUrl ? { audioUrl } : {}),
        });
      }
    } else {
      session?.cancel();
    }
    qe(false);
    pt(0);
    lockedRef.current = false;
    setLocked(false);
    holdY.current = 0;
    setSlideUp(0);
  };
  const startHoldGesture = (startY: number) => {
    const move = (ev: PointerEvent) => {
      const dy = Math.max(0, startY - ev.clientY);
      holdY.current = dy;
      setSlideUp(Math.min(dy, 96));
      if (dy >= LOCK_AT && !lockedRef.current) {
        lockedRef.current = true;
        setLocked(true);
      } else if (dy < LOCK_AT - 14 && lockedRef.current) {
        lockedRef.current = false;
        setLocked(false);
      }
    };
    const end = (cancel: boolean) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancelEv);
      if (!cancel && lockedRef.current) {
        // released past the lock line: keep recording hands-free
        setSlideUp(0);
        return;
      }
      if (startingRef.current) {
        releasedEarly.current = true;
        return;
      }
      void finishVoice(cancel);
    };
    const up = () => end(false);
    const cancelEv = () => end(true);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancelEv);
    void beginHold();
  };
  useEffect(() => () => window.clearTimeout(holdTimer.current), []);
  useEffect(() => () => stopVoiceNotePlayback(), []);
  useEffect(() => {
    if (!activeCall) return;
    let stopTone: (() => void) | null = null;
    let connectTimer = 0;
    let secTimer = 0;
    if (activeCall.status === "ringing") {
      stopTone = playGentleCallTone();
      connectTimer = window.setTimeout(() => {
        stopTone?.();
        setActiveCall((curr) => (curr ? { ...curr, status: "connected" } : null));
      }, 2100);
    } else {
      secTimer = window.setInterval(() => {
        setActiveCall((curr) =>
          curr ? { ...curr, seconds: curr.seconds + 1 } : null,
        );
      }, 1000);
    }
    return () => {
      stopTone?.();
      if (connectTimer) window.clearTimeout(connectTimer);
      if (secTimer) window.clearInterval(secTimer);
    };
  }, [activeCall?.status, !!activeCall]);
  const A0 = (E?: any) => {
      Ne(E.id);
      I(false);
      se(false);
      k(false);
      le(null);
      E.request || onMarkRead(E.id);
    },
    s0 = () => {
      Ne(null);
      le(null);
      se(false);
      k(false);
    },
    Te = (E?: any) => {
      fe &&
        ((!ye.trim() && !E) ||
          (onSend(fe.id, {
            from: "me",
            text: ye.trim() || (E?.type === "voice" ? "Voice note" : "Photo"),
            time: new Date().toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
            ...(pe
              ? {
                  replyTo: {
                    author: pe.from === "me" ? "You" : (Ae?.name ?? "Them"),
                    text: formatDuration(pe),
                  },
                }
              : {}),
            ...(E
              ? {
                  attachment: E,
                }
              : {}),
          }),
          Ve(""),
          le(null),
          se(false),
          k(false)));
    },
    $t = (fe?.messages ?? [])
      .filter((E?: any) => E.attachment?.type === "image")
      .map((E?: any) => E.attachment.url);
  return (
    <div className="mx-auto w-full max-w-[920px] px-4 pt-5 pb-24 sm:px-6 lg:px-8 lg:pb-10">
      <header className="animate-rise mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-forest" />
            <p className="text-[11.5px] font-medium tracking-[0.08em] text-faint uppercase">
              Your conversations
            </p>
          </div>
          <h1 className="text-[24px] leading-[1.15] font-semibold tracking-[-0.03em] text-ink sm:text-[27px]">
            Inbox
          </h1>
          <p className="mt-1 text-[14px] text-muted">
            Private notes with the people who matter. Tap a chat to open it full
            screen.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-muted sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-forest" />
            {conversations.filter((E?: any) => E.online).length}
            {" online"}
          </span>
          <button
            type="button"
            onClick={() => V(true)}
            className="inline-flex h-8.5 items-center gap-1.5 rounded-[8px] bg-forest px-3 text-[12px] font-semibold text-white transition-colors hover:bg-forest-hover"
          >
            <UserPlus size={12} strokeWidth={2.2} />
            New message
          </button>
        </div>
      </header>
      <div className="animate-rise overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,19,24,0.04)]">
        <div className="flex flex-col gap-2.5 border-b border-line p-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlass
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
            />
            <input
              value={ae}
              onChange={(E?: any) => $(E.target.value)}
              placeholder="Search messages or people"
              aria-label="Search conversations"
              className="h-8.5 w-full rounded-[8px] border border-line bg-surface-muted/60 pr-3 pl-8.5 text-[13px] text-ink placeholder:text-faint transition-colors hover:border-line-strong focus:border-forest focus:bg-surface focus:outline-none"
            />
          </div>
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {[
              {
                value: "all",
                label: "All",
              },
              {
                value: "unread",
                label: "Unread",
                count: d0.unread,
              },
              {
                value: "requests",
                label: "Requests",
                count: d0.requests,
              },
              ...(d0.archived
                ? [
                    {
                      value: "archived",
                      label: "Archived",
                      count: d0.archived,
                    },
                  ]
                : []),
            ].map((E?: any) => (
              <button
                key={E.value}
                type="button"
                onClick={() => K(E.value)}
                aria-pressed={he === E.value}
                className={cn(
                  "inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium transition-colors",
                  he === E.value
                    ? "bg-forest-soft text-forest"
                    : "text-muted hover:bg-surface-muted hover:text-ink",
                )}
              >
                {E.label}
                {E.count ? (
                  <span
                    className={cn(
                      "rounded-full px-1 text-[11px] font-semibold tabular-nums",
                      he === E.value
                        ? "bg-forest text-white"
                        : "bg-canvas-deep text-muted",
                    )}
                  >
                    {E.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
        {Ft.length ? (
          <div className="divide-y divide-line/70">
            {Ft.map((E?: any) => {
              const ge = people.find((m0?: any) => m0.id === E.personId);
              if (!ge) return null;
              const je = E.messages[E.messages.length - 1];
              return (
                <button
                  key={E.id}
                  type="button"
                  onClick={() => A0(E)}
                  className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-surface-muted/70 sm:px-4"
                >
                  <Avatar person={ge} size="lg" online={E.online} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1">
                        <span className="truncate text-[14px] font-semibold text-ink">
                          {ge.name}
                        </span>
                        {ge.verified ? (
                          <VerifiedBadge className="h-3 w-3" />
                        ) : null}
                        {E.pinned ? (
                          <PushPin
                            size={9}
                            className="shrink-0 text-faint"
                            aria-label="Pinned"
                          />
                        ) : null}
                        {E.request ? (
                          <span className="rounded-full bg-sand-soft px-1.5 py-0.5 text-[10px] font-semibold text-[#8a6c34]">
                            Request
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-[11.5px] text-faint">
                        {je?.time ?? "New"}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "mt-1 block truncate text-[12px]",
                        E.unread && !E.request
                          ? "font-medium text-ink-soft"
                          : "text-muted",
                        E.typing && "text-forest italic",
                      )}
                    >
                      {E.typing
                        ? "typing…"
                        : `${je?.from === "me" ? "You: " : ""}${formatDuration(je)}`}
                    </span>
                    <span className="mt-1 flex items-center gap-2 text-[11.5px] text-faint">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={8} strokeWidth={2} /> {ge.location}
                      </span>
                      <span>·</span>
                      <span>
                        {formatCount(ge.followers)}
                        {" followers"}
                      </span>
                    </span>
                  </span>
                  <span className="mt-1 flex shrink-0 flex-col items-end gap-1">
                    {E.unread && !E.request ? (
                      <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-forest px-1 text-[11px] font-semibold text-white">
                        {E.unread}
                      </span>
                    ) : E.muted ? (
                      <BellSlash
                        size={10}
                        className="text-faint"
                        aria-label="Muted"
                      />
                    ) : null}
                    <span className="text-[11px] text-faint">Open</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={he === "requests" ? ShieldCheck : ChatCircle}
            title={
              he === "requests"
                ? "No message requests"
                : "No conversations here"
            }
            description={
              he === "requests"
                ? "Messages from people outside your circle will appear here first."
                : "Start a quiet conversation with someone in your circle."
            }
            action={
              he !== "all" ? (
                <button
                  type="button"
                  onClick={() => K("all")}
                  className="h-8 rounded-[8px] border border-line-strong bg-surface px-3 text-[13px] font-semibold text-ink-soft hover:bg-surface-muted"
                >
                  Back to inbox
                </button>
              ) : null
            }
          />
        )}
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <p className="flex items-center gap-1.5 text-[11.5px] text-faint">
            <ShieldCheck size={10} strokeWidth={2} />
            Messages stay on this device
          </p>
          <p className="text-[11.5px] text-faint">
            Slide a message right to reply
          </p>
        </div>
      </div>
      <p className="mt-3 text-center text-[11.5px] text-faint">
        Thursday never reads your conversations. No trackers, no ad targeting.
      </p>
      {fe && Ae ? (
        <div
          className="animate-fade fixed inset-0 z-[55] flex flex-col bg-canvas"
          role="dialog"
          aria-label={`Conversation with ${Ae.name}`}
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-line bg-canvas/95 px-2.5 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2 backdrop-blur-md sm:px-4">
            <button
              type="button"
              onClick={s0}
              aria-label="Back to inbox"
              className="inline-flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <ArrowLeft size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => onOpenPerson(Ae.id)}
              className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
            >
              <Avatar
                person={Ae}
                size="md"
                online={onlineIds.includes(Ae.id)}
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1">
                  <span className="truncate text-[14px] font-semibold text-ink">
                    {Ae.name}
                  </span>
                  {Ae.verified ? <VerifiedBadge className="h-3 w-3" /> : null}
                </span>
                <span className="block truncate text-[11.5px] text-muted">
                  {fe.typing
                    ? "typing…"
                    : onlineIds.includes(Ae.id)
                      ? "Active now · live"
                      : (fe.lastActive ?? `@${Ae.handle}`)}
                </span>
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setActiveCall({
                    mode: "voice",
                    person: Ae,
                    convId: fe.id,
                    status: "ringing",
                    seconds: 0,
                    muted: false,
                  });
                  onCallSignal?.({
                    callId: `call_${Date.now()}`,
                    type: "ring",
                    kind: "audio",
                    fromUserId: meId,
                    targetUserId: Ae.id,
                    conversationId: fe.id,
                  });
                  onToast?.(
                    "Ringing",
                    `${Ae.name.split(" ")[0]} will see a nudge to come chat — live audio isn't wired up yet.`,
                  );
                }}
                aria-label="Ring to chat"
                className="hidden h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink sm:inline-flex"
              >
                <Phone size={15} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveCall({
                    mode: "video",
                    person: Ae,
                    convId: fe.id,
                    status: "ringing",
                    seconds: 0,
                    muted: false,
                  });
                  onCallSignal?.({
                    callId: `call_${Date.now()}`,
                    type: "ring",
                    kind: "video",
                    fromUserId: meId,
                    targetUserId: Ae.id,
                    conversationId: fe.id,
                  });
                  onToast?.(
                    "Ringing",
                    `${Ae.name.split(" ")[0]} will see a nudge to come chat — video isn't wired up yet.`,
                  );
                }}
                aria-label="Ring to chat (video)"
                className="hidden h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink sm:inline-flex"
              >
                <VideoCamera size={16} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => Ce(true)}
                aria-label="Conversation details"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
              >
                <Info size={15} strokeWidth={2} />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => I((E?: any) => !E)}
                  aria-label="Conversation options"
                  aria-expanded={D}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
                >
                  <DotsThree size={16} strokeWidth={2} />
                </button>
                {D ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => I(false)}
                      aria-label="Close menu"
                      tabIndex={-1}
                    />
                    <div className="animate-pop absolute top-[calc(100%+4px)] right-0 z-40 w-[184px] rounded-[12px] border border-line bg-surface p-1 shadow-[0_12px_32px_rgba(29,33,28,0.14)]">
                      {[
                        {
                          label: fe.pinned
                            ? "Unpin conversation"
                            : "Pin conversation",
                          icon: PushPin,
                          action: () => onTogglePin(fe.id),
                        },
                        {
                          label: fe.muted
                            ? "Unmute notifications"
                            : "Mute notifications",
                          icon: BellSlash,
                          action: () => onToggleMute(fe.id),
                        },
                        {
                          label: "Shared media",
                          icon: Image,
                          action: () => Ce(true),
                        },
                        {
                          label: fe.archived
                            ? "Unarchive conversation"
                            : "Archive conversation",
                          icon: Archive,
                          action: () => {
                            onArchive(fe.id);
                            fe.archived || s0();
                          },
                        },
                      ].map((E?: any) => {
                        const Comp_ge = E.icon;
                        return (
                          <button
                            key={E.label}
                            type="button"
                            onClick={() => {
                              E.action();
                              I(false);
                            }}
                            className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[12px] text-ink-soft hover:bg-surface-muted"
                          >
                            <Comp_ge size={12} strokeWidth={2} />
                            {E.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </header>
          {fe.request ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-sand/20 bg-sand-soft/70 px-3 py-2 sm:px-5">
              <ShieldCheck
                size={13}
                strokeWidth={2}
                className="shrink-0 text-[#8a6c34]"
              />
              <p className="min-w-0 flex-1 text-[11.5px] leading-[1.5] text-[#7a602f]">
                <span className="font-semibold">Message request.</span>{" "}
                {Ae.name.split(" ")[0]}
                {" doesn't follow you yet."}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onAcceptRequest(fe.id)}
                  className="inline-flex h-6.5 items-center gap-1 rounded-[8px] bg-forest px-2 text-[11.5px] font-semibold text-white hover:bg-forest-hover"
                >
                  <Check size={10} strokeWidth={2.6} />
                  {" Accept"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeclineRequest(fe.id);
                    s0();
                  }}
                  className="inline-flex h-6.5 items-center rounded-[8px] border border-line-strong bg-surface px-2 text-[11.5px] font-semibold text-muted hover:bg-surface-muted"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : null}
          <div
            ref={u0}
            className="thin-scrollbar flex-1 space-y-2 overflow-y-auto overscroll-contain bg-surface-muted/30 px-3 py-4 sm:px-6"
          >
            <div className="mx-auto flex max-w-[760px] flex-col items-center gap-1 pb-1 text-center">
              <Avatar person={Ae} size="xl" online={fe.online} />
              <p className="mt-1 text-[14px] font-semibold text-ink">
                {Ae.name}
              </p>
              <p className="text-[11.5px] text-muted">
                @{Ae.handle}
                {" · "}
                {Ae.location}
              </p>
              <p className="mt-1 max-w-[300px] text-[11.5px] leading-[1.55] text-faint">
                Slide any message to the right to reply to it directly.
                Double-tap to add a reaction.
              </p>
            </div>
            {(fe.messages ?? []).map((E?: any, ge?: any) => {
              const je = E.from === "me",
                m0 =
                  ge === 0 ||
                  formatMessageDay(fe.messages[ge - 1].time, fe.messages[ge - 1].createdAt) !==
                    formatMessageDay(E.time, E.createdAt),
                I0 =
                  je &&
                  !fe.messages
                    .slice(ge + 1)
                    .some((tt?: any) => tt.from === "me");
              return (
                <div key={E.id}>
                  {m0 ? (
                    <div className="my-2 flex items-center gap-2">
                      <span className="h-px flex-1 bg-line" />
                      <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-faint">
                        {formatMessageDay(E.time, E.createdAt)}
                      </span>
                      <span className="h-px flex-1 bg-line" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "flex items-end gap-1.5",
                      me === E.id && "relative z-20",
                    )}
                  >
                    {je ? null : <Avatar person={Ae} size="xs" />}
                    <div
                      className={cn(
                        "min-w-0 flex-1",
                        je
                          ? "flex flex-col items-end"
                          : "flex flex-col items-start",
                      )}
                    >
                      <SwipeableMessage
                        message={E}
                        onReply={(tt?: any) => le(tt)}
                        onReact={() => ve(E.id)}
                      >
                        <div className="relative">
                          <div
                            className={cn(
                              "overflow-hidden text-[13px] leading-[1.55] shadow-[0_1px_1px_rgba(29,33,28,0.03)]",
                              E.attachment?.type === "image"
                                ? "rounded-xl border border-line bg-surface p-1"
                                : "rounded-xl px-3 py-2",
                              E.attachment?.type !== "image" &&
                                (je
                                  ? "rounded-br-[5px] bg-forest text-white"
                                  : "rounded-bl-[5px] border border-line bg-surface text-ink-soft"),
                            )}
                          >
                            {E.replyTo ? (
                              <div
                                className={cn(
                                  "mb-1.5 rounded-[8px] border-l-2 py-1 pr-2 pl-2",
                                  je
                                    ? "border-white/40 bg-white/10"
                                    : "border-forest/45 bg-forest-wash",
                                )}
                              >
                                <p
                                  className={cn(
                                    "text-[11px] font-semibold",
                                    je ? "text-white/85" : "text-forest",
                                  )}
                                >
                                  {E.replyTo.author}
                                </p>
                                <p
                                  className={cn(
                                    "line-clamp-2 text-[11px] leading-[1.4]",
                                    je ? "text-white/65" : "text-muted",
                                  )}
                                >
                                  {E.replyTo.text}
                                </p>
                              </div>
                            ) : null}
                            {E.attachment?.type === "image" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  Mt(
                                    E.attachment.type === "image"
                                      ? E.attachment.url
                                      : null,
                                  )
                                }
                                className="block w-full"
                              >
                                {/* Uniform frame so every shared photo occupies
                                    the same footprint; cover + centre keeps it
                                    undistorted. */}
                                <div
                                  className="w-[220px] max-w-full overflow-hidden rounded-[8px] bg-canvas-deep"
                                  style={{ aspectRatio: "4 / 5" }}
                                >
                                  <img
                                    src={E.attachment.url}
                                    alt={E.attachment.caption || "Shared photo"}
                                    className="h-full w-full object-cover object-center"
                                    loading="lazy"
                                  />
                                </div>
                                {/* No filename or caption line under sent photos.
                                    The filename was being read out as visible text
                                    under every image, which no chat app does. */}
                              </button>
                            ) : E.attachment?.type === "voice" ? (
                              <button
                                type="button"
                                onClick={() => {
                                  playVoiceNote(
                                    E.id,
                                    E.attachment.audioUrl,
                                    E.attachment.duration,
                                    (progress, playing) => {
                                      setPlayingVoice(
                                        playing ? { id: E.id, progress } : null,
                                      );
                                    },
                                  );
                                }}
                                aria-label="Play voice note"
                                className="flex w-[210px] max-w-full items-center gap-2.5 text-left sm:w-[240px]"
                              >
                                <span
                                  className={cn(
                                    "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105",
                                    je
                                      ? "bg-white/20 text-white"
                                      : "bg-forest-soft text-forest",
                                  )}
                                >
                                  {playingVoice?.id === E.id ? (
                                    <Pause size={10} weight="fill" />
                                  ) : (
                                    <Play size={10} weight="fill" />
                                  )}
                                </span>
                                {/* Waveform with a real progress fill. It used to be a
                                    fixed 12-bar strip that clipped at the bubble edge
                                    and only ever showed the total duration, so a
                                    playing note gave no sense of position. */}
                                <span className="relative flex min-w-0 flex-1 items-center gap-[2px]">
                                  {VOICE_BARS.map((h, i) => {
                                    const played =
                                      playingVoice?.id === E.id &&
                                      i / VOICE_BARS.length <= playingVoice.progress;
                                    return (
                                      <span
                                        key={i}
                                        className={cn(
                                          "w-[2px] shrink-0 rounded-full transition-colors",
                                          je
                                            ? played
                                              ? "bg-white"
                                              : "bg-white/45"
                                            : played
                                              ? "bg-forest"
                                              : "bg-forest/40",
                                        )}
                                        style={{ height: h }}
                                      />
                                    );
                                  })}
                                </span>
                                <span
                                  className={cn(
                                    "shrink-0 pl-0.5 text-[11.5px] leading-none tabular-nums",
                                    je ? "text-white/80" : "text-muted",
                                  )}
                                >
                                  {playingVoice?.id === E.id && E.attachment.duration
                                    ? `${formatVoiceElapsed(
                                        playingVoice.progress,
                                        E.attachment.duration,
                                      )} / ${E.attachment.duration}`
                                    : E.attachment.duration || "0:00"}
                                </span>
                              </button>
                            ) : null}
                            {E.text &&
                            E.attachment?.type !== "image" &&
                            E.attachment?.type !== "voice"
                              ? E.text
                              : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => ve(me === E.id ? null : E.id)}
                            aria-label="Add a reaction"
                            className={cn(
                              "absolute -top-2 rounded-full border border-line bg-surface px-1 py-0.5 text-muted opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100",
                              je ? "left-0" : "right-0",
                            )}
                          >
                            <Smiley size={10} strokeWidth={2} />
                          </button>
                          {me === E.id ? (
                            <div
                              className={cn(
                                "animate-pop absolute -top-9 z-30 flex items-center gap-0.5 rounded-full border border-line bg-surface px-1.5 py-1 shadow-[0_8px_24px_rgba(29,33,28,0.16)]",
                                je ? "right-0" : "left-0",
                              )}
                            >
                              {MESSAGE_REACTIONS.map((tt?: any) => (
                                <button
                                  key={tt}
                                  type="button"
                                  onClick={() => {
                                    onReact(fe.id, E.id, tt);
                                    ve(null);
                                  }}
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[14px] transition-transform hover:scale-125"
                                >
                                  {tt}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </SwipeableMessage>
                      {E.reactions?.length ? (
                        <div
                          className={cn(
                            "mt-0.5 flex items-center gap-0.5",
                            je ? "justify-end" : "justify-start",
                          )}
                        >
                          {E.reactions.map((tt?: any, Vt?: any) => (
                            <span
                              key={`${tt}-${Vt}`}
                              className="rounded-full border border-line bg-surface px-1 py-[1px] text-[11.5px] shadow-sm"
                            >
                              {tt}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <p
                        className={cn(
                          "mt-0.5 flex items-center gap-1 text-[11px] text-faint",
                          je ? "flex-row-reverse" : "",
                        )}
                      >
                        {messageStamp(E.time, E.createdAt, E.time)}
                        {I0 && readReceipts && !fe.request ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Checks
                              size={9}
                              strokeWidth={2.2}
                              className="text-forest/70"
                            />
                            {" Seen"}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {fe.typing ? (
              <div className="flex items-end gap-1.5">
                <Avatar person={Ae} size="xs" />
                <div className="flex items-center gap-1 rounded-xl rounded-bl-[5px] border border-line bg-surface px-2.5 py-2">
                  {[0, 150, 300].map((E?: any) => (
                    <span
                      key={E}
                      className="h-1 w-1 animate-bounce rounded-full bg-faint"
                      style={{
                        animationDelay: `${E}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="shrink-0 border-t border-line bg-canvas p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:p-2.5">
            <div className="mx-auto max-w-[820px]">
              {fe.request ? (
                <div className="flex items-center justify-center gap-1.5 rounded-[8px] bg-surface-muted px-2 py-2 text-[11.5px] text-muted">
                  <ShieldCheck size={11} strokeWidth={2} />
                  {" Accept this request to reply."}
                </div>
              ) : (
                <>
                  {pe ? (
                    <div className="mb-1.5 flex items-center gap-2 rounded-[8px] border-l-2 border-forest bg-forest-wash px-2.5 py-1.5">
                      <ArrowBendUpLeft
                        size={12}
                        strokeWidth={2.2}
                        className="shrink-0 text-forest"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-forest">
                          {"Replying to "}
                          {pe.from === "me"
                            ? "yourself"
                            : Ae.name.split(" ")[0]}
                        </p>
                        <p className="truncate text-[11.5px] text-muted">
                          {formatDuration(pe)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => le(null)}
                        aria-label="Cancel reply"
                        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-ink"
                      >
                        <X size={11} strokeWidth={2.4} />
                      </button>
                    </div>
                  ) : null}
                  {X_local ? (
                    <div className="mb-1.5 flex items-center gap-1 rounded-[8px] border border-line bg-surface px-2 py-1.5">
                      {[
                        "❤️",
                        "😂",
                        "🥹",
                        "👏",
                        "🔥",
                        "🙌",
                        "🌿",
                        "☕",
                        "✨",
                      ].map((E?: any) => (
                        <button
                          key={E}
                          type="button"
                          onClick={() => Ve((ge?: any) => `${ge}${E}`)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[14px] hover:bg-surface-muted"
                        >
                          {E}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {h ? (
                    <div className="mb-1.5 rounded-[8px] border border-line bg-surface p-1.5">
                      <div className="grid grid-cols-7 gap-1">
                        {CHAT_PHOTO_PRESETS.map((E?: any) => (
                          <button
                            key={E.label}
                            type="button"
                            onClick={() =>
                              Te({
                                type: "image",
                                url: E.url,
                                caption: E.label,
                              })
                            }
                            className="overflow-hidden rounded-[8px] border border-line"
                            aria-label={`Send ${E.label} photo`}
                          >
                            <img
                              src={E.url}
                              alt={E.label}
                              className="h-10 w-full object-contain"
                            />
                          </button>
                        ))}
                        <label
                          aria-label="Upload photo from device"
                          className="flex h-10 cursor-pointer items-center justify-center rounded-[8px] border border-dashed border-line-strong text-muted hover:border-forest hover:text-forest"
                        >
                          <Plus size={13} strokeWidth={2.2} />
                          <input
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const dataUrl = await readFileAsDataUrl(file, 1080);
                                if (dataUrl) {
                                  Te({
                                    type: "image",
                                    url: dataUrl,
                                    caption: file.name.replace(/\.[^.]+$/, ""),
                                  });
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}
                  {de ? (
                    <div className="flex items-center gap-2 rounded-[8px] border border-clay/25 bg-clay-wash px-2.5 py-2">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-clay" />
                      <p className="flex-1 text-[12px] font-medium text-clay">
                        {locked
                          ? `Locked · 0:${String(De).padStart(2, "0")}`
                          : `Recording · 0:${String(De).padStart(2, "0")}`}
                        {locked ? (
                          <span className="ml-1.5 text-[11.5px] font-normal text-clay/70">
                            Tap Send when done
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "ml-1.5 inline-flex items-center gap-0.5 text-[11.5px] font-normal transition-colors",
                              slideUp >= 40 ? "text-forest" : "text-clay/70",
                            )}
                          >
                            <ArrowBendUpLeft
                              size={9}
                              strokeWidth={2.4}
                              className="rotate-90"
                            />
                            {slideUp >= 40 ? "Keep going to lock" : "Slide up to lock"}
                          </span>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => void finishVoice(false)}
                        className="inline-flex h-6 items-center gap-1 rounded-[8px] bg-clay px-2 text-[11.5px] font-semibold text-white"
                      >
                        <PaperPlaneTilt size={9} strokeWidth={2.4} />
                        {" Send"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void finishVoice(true)}
                        aria-label="Cancel voice note"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-clay hover:bg-clay-soft"
                      >
                        <X size={11} strokeWidth={2.4} />
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(E?: any) => {
                        E.preventDefault();
                        Te();
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          se((E?: any) => !E);
                          k(false);
                        }}
                        aria-label="Add an emoji"
                        aria-pressed={X_local}
                        className={cn(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink",
                          X_local && "bg-canvas-deep text-ink",
                        )}
                      >
                        <Smiley size={16} strokeWidth={1.9} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          k((E?: any) => !E);
                          se(false);
                        }}
                        aria-label="Attach a photo"
                        aria-pressed={h}
                        className={cn(
                          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink",
                          h && "bg-canvas-deep text-ink",
                        )}
                      >
                        <Image size={16} strokeWidth={1.9} />
                      </button>
                      <input
                        value={ye}
                        onChange={(E?: any) => {
                          Ve(E.target.value);
                          if (fe && onTyping) {
                            onTyping(fe.id, true);
                            window.clearTimeout(
                              (window as any).__thursdayTypingTimer,
                            );
                            (window as any).__thursdayTypingTimer =
                              window.setTimeout(() => {
                                onTyping(fe.id, false);
                              }, 1600);
                          }
                        }}
                        placeholder={
                          pe
                            ? "Write your reply…"
                            : `Message ${Ae.name.split(" ")[0]}…`
                        }
                        aria-label={`Message ${Ae.name}`}
                        className="h-9 min-w-0 flex-1 rounded-full border border-line bg-surface px-3.5 text-[13px] text-ink placeholder:text-faint focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/10"
                      />
                      {ye.trim() ? (
                        <button
                          type="submit"
                          aria-label="Send message"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest text-white hover:bg-forest-hover"
                        >
                          <PaperPlaneTilt size={14} strokeWidth={2} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          aria-label="Hold to record a voice note, slide up to lock"
                          onPointerDown={(g?: any) => {
                            g.preventDefault();
                            startHoldGesture(g.clientY);
                          }}
                          onContextMenu={(g?: any) => g.preventDefault()}
                          className="inline-flex h-9 w-9 shrink-0 touch-none select-none items-center justify-center rounded-full bg-forest text-white hover:bg-forest-hover"
                        >
                          <Microphone size={15} strokeWidth={2} />
                        </button>
                      )}
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
          <Modal
            open={Ee}
            onClose={() => Ce(false)}
            title="Conversation details"
            description={`With ${Ae.name}`}
            width="sm"
          >
            <div className="space-y-3 px-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar person={Ae} size="xl" online={fe.online} />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[14px] font-semibold text-ink">
                    {Ae.name}
                    {Ae.verified ? <VerifiedBadge /> : null}
                  </p>
                  <p className="text-[12px] text-muted">@{Ae.handle}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11.5px] text-faint">
                    <MapPin size={9} strokeWidth={2} /> {Ae.location}
                  </p>
                </div>
              </div>
              <p className="text-[12px] leading-[1.6] text-muted">{Ae.bio}</p>
              <div className="flex items-center gap-2">
                <FollowButton
                  following={followingIds.includes(Ae.id)}
                  onChange={() => onToggleFollow(Ae.id)}
                />
                <button
                  type="button"
                  onClick={() => {
                    Ce(false);
                    onOpenPerson(Ae.id);
                  }}
                  className="h-7 rounded-[8px] border border-line-strong bg-surface px-2.5 text-[12px] font-semibold text-ink-soft"
                >
                  View profile
                </button>
              </div>
              <div className="rounded-[12px] border border-line bg-surface-muted/50 p-3">
                <p className="text-[11.5px] font-medium tracking-[0.08em] text-faint uppercase">
                  Shared media
                </p>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {($t.length
                    ? $t
                    : [PHOTOS.potteryTools, PHOTOS.coffee, PHOTOS.trail]
                  ).map((E?: any, ge?: any) => (
                    <button
                      key={`${E}-${ge}`}
                      type="button"
                      onClick={() => Mt(E)}
                      className="overflow-hidden rounded-[8px] border border-line"
                    >
                      <img
                        src={E}
                        alt=""
                        className="aspect-square w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onTogglePin(fe.id)}
                  className="flex items-center justify-between rounded-[8px] border border-line px-2.5 py-2 text-[12px] font-medium text-ink-soft hover:bg-surface-muted"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <PushPin size={11} strokeWidth={2} />
                    {" Pin"}
                  </span>
                  <span
                    className={cn(
                      "text-[11.5px] font-semibold",
                      fe.pinned ? "text-forest" : "text-faint",
                    )}
                  >
                    {fe.pinned ? "On" : "Off"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onToggleMute(fe.id)}
                  className="flex items-center justify-between rounded-[8px] border border-line px-2.5 py-2 text-[12px] font-medium text-ink-soft hover:bg-surface-muted"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <BellSlash size={11} strokeWidth={2} />
                    {" Mute"}
                  </span>
                  <span
                    className={cn(
                      "text-[11.5px] font-semibold",
                      fe.muted ? "text-forest" : "text-faint",
                    )}
                  >
                    {fe.muted ? "On" : "Off"}
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  onToast(
                    "Report sent",
                    "Our safety team will review this conversation privately.",
                  );
                  Ce(false);
                }}
                className="flex w-full items-center gap-1.5 rounded-[8px] border border-line px-2.5 py-2 text-left text-[12px] font-medium text-muted hover:bg-surface-muted hover:text-ink"
              >
                <ShieldCheck size={11} strokeWidth={2} />
                {" Report conversation"}
              </button>
              <button
                type="button"
                onClick={() => {
                  onToast(
                    "Blocked in this demo",
                    "Blocking would also remove them from your circle.",
                  );
                  Ce(false);
                }}
                className="flex w-full items-center gap-1.5 rounded-[8px] border border-clay/20 bg-clay-wash px-2.5 py-2 text-left text-[12px] font-semibold text-clay"
              >
                <Trash size={11} strokeWidth={2} />
                {" Block "}
                {Ae.name.split(" ")[0]}
              </button>
            </div>
          </Modal>
        </div>
      ) : null}
      <Modal
        open={He}
        onClose={() => V(false)}
        title="New message"
        description="Start a quiet conversation with someone in your circle."
        width="sm"
      >
        <div className="p-3">
          <div className="relative mb-2">
            <MagnifyingGlass
              size={12}
              strokeWidth={2}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
            />
            <input
              autoFocus
              value={W}
              onChange={(E?: any) => G(E.target.value)}
              placeholder="Search people"
              aria-label="Search people for a new message"
              className="h-8 w-full rounded-[8px] border border-line bg-surface-muted/60 pr-2 pl-7.5 text-[13px] text-ink placeholder:text-faint focus:border-forest focus:bg-surface focus:outline-none"
            />
          </div>
          {people
            .filter((E?: any) => E.id !== c.id)
            .filter(
              (E?: any) =>
                !W.trim() ||
                E.name.toLowerCase().includes(W.trim().toLowerCase()) ||
                E.handle.toLowerCase().includes(W.trim().toLowerCase()),
            )
            .map((E?: any) => (
              <button
                key={E.id}
                type="button"
                onClick={() => {
                  onStartConversation(E.id);
                  V(false);
                  G("");
                  const ge = conversations.find(
                    (je?: any) => je.personId === E.id,
                  );
                  ge && A0(ge);
                }}
                className="flex w-full items-center gap-2.5 rounded-[8px] px-2 py-2 text-left transition-colors hover:bg-surface-muted"
              >
                <Avatar
                  person={E}
                  size="md"
                  online={E.online === true}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-[13px] font-semibold text-ink">
                    {E.name}
                    {E.verified ? <VerifiedBadge className="h-3 w-3" /> : null}
                  </span>
                  <span className="block truncate text-[11.5px] text-muted">
                    {E.bio}
                  </span>
                </span>
                <Plus size={12} className="text-faint" />
              </button>
            ))}
        </div>
      </Modal>
      <Modal open={!!St} onClose={() => Mt(null)} width="md" bare>
        {St ? (
          <div className="relative bg-[#11140f]">
            <img
              src={St}
              alt="Shared media"
              className="max-h-[80vh] w-full object-contain"
            />
            <button
              type="button"
              onClick={() => Mt(null)}
              aria-label="Close image"
              className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/65"
            >
              <X size={15} strokeWidth={2.2} />
            </button>
          </div>
        ) : null}
      </Modal>
      <Modal
        open={!!activeCall}
        onClose={() => setActiveCall(null)}
        width="sm"
        bare
      >
        {activeCall ? (
          <div className="flex flex-col items-center bg-[#121713] px-6 py-7 text-center text-white">
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11.5px] font-semibold tracking-[0.08em] text-white/75 uppercase">
              {activeCall.mode === "video" ? "Video call" : "Voice call"}
            </span>
            <div className="mt-4">
              <Avatar person={activeCall.person} size="xl" ring />
            </div>
            <p className="mt-3 text-[16px] font-semibold text-white">
              {activeCall.person.name}
            </p>
            <p className="mt-0.5 text-[13px] text-white/65 tabular-nums">
              {activeCall.status === "ringing"
                ? "Ringing…"
                : `${Math.floor(activeCall.seconds / 60)}:${String(
                    activeCall.seconds % 60,
                  ).padStart(2, "0")}`}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setActiveCall((curr) =>
                    curr ? { ...curr, muted: !curr.muted } : null,
                  )
                }
                aria-pressed={activeCall.muted}
                className={cn(
                  "inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors",
                  activeCall.muted
                    ? "border-white bg-white text-[#121713]"
                    : "border-white/20 bg-white/10 text-white hover:bg-white/20",
                )}
                aria-label="Toggle microphone"
              >
                <Microphone size={17} strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const callSnap = activeCall;
                  setActiveCall(null);
                  if (callSnap.seconds > 0) {
                    const dur = `${Math.floor(callSnap.seconds / 60)}:${String(
                      callSnap.seconds % 60,
                    ).padStart(2, "0")}`;
                    onSend(callSnap.convId, {
                      from: "me",
                      text: `${
                        callSnap.mode === "video" ? "Video" : "Voice"
                      } call · ${dur}`,
                      time: new Date().toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      }),
                    });
                  }
                }}
                aria-label="End call"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-clay px-5 text-[13px] font-semibold text-white hover:opacity-90"
              >
                End call
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
