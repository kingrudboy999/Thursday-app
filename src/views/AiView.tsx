import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/cn";
import {
  aiAsk,
  aiStatus,
  splitList,
  AI_ACTIONS,
  AI_STARTERS,
  type AiAction,
  type AiStatus,
  type AiTurn,
} from "../lib/ai";
import {
  ArrowUp,
  Check,
  CircleNotch,
  CopyIcon,
  Sparkle,
  X,
  ArrowCounterClockwise,
} from "../lib/icons";
import { ThursdayMark } from "../components/brand";

const ACCENTS: Record<
  AiAction["accent"],
  { chip: string; ring: string; dot: string; text: string }
> = {
  forest: {
    chip: "bg-forest-wash text-forest border-forest/20",
    ring: "hover:border-forest/35 hover:bg-forest-wash",
    dot: "bg-forest",
    text: "text-forest",
  },
  clay: {
    chip: "bg-clay-wash text-clay border-clay/20",
    ring: "hover:border-clay/35 hover:bg-clay-wash",
    dot: "bg-clay",
    text: "text-clay",
  },
  sand: {
    chip: "bg-sand-soft text-sand border-sand/25",
    ring: "hover:border-sand/40 hover:bg-sand-soft",
    dot: "bg-sand",
    text: "text-sand",
  },
  sage: {
    chip: "bg-sage-soft text-sage border-sage/25",
    ring: "hover:border-sage/40 hover:bg-sage-soft",
    dot: "bg-sage",
    text: "text-sage",
  },
};

/**
 * A quiet presence indicator.
 *
 * This used to be a diagnostics panel listing rotating API keys and their
 * individual health. Nobody using Thursday needs to see the plumbing — and
 * exposing it invites the question of whose keys are being spent. Now it just
 * says whether the assistant is ready.
 */
function EnginePanel({ status }: any) {
  const ready = Boolean(status?.reachable) && Boolean(status?.availableModels);
  return (
    <div className="rounded-xl border border-line bg-surface px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-60",
              ready ? "animate-ping-slow bg-forest" : "bg-faint",
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              ready ? "bg-forest" : "bg-faint",
            )}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold text-ink">
            {ready ? "Thursday AI is ready" : "Waking up"}
          </span>
          <span className="block text-[12px] text-faint">
            {ready ? "Ask anything — it answers in a moment." : "Send a message and it will come online."}
          </span>
        </span>
      </div>
    </div>
  );
}

/** Greeting helper — restored after the engine-panel rewrite. */
function timeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Still up";
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        window.setTimeout(() => setDone(false), 1400);
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11.5px] font-medium text-faint transition-colors hover:bg-canvas-deep hover:text-ink"
      aria-label="Copy this"
    >
      {done ? <Check size={11} weight="bold" /> : <CopyIcon size={11} />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function AssistantBubble({ turn }: { turn: AiTurn }) {
  const lines = useMemo(() => splitList(turn.content), [turn.content]);
  const asList = lines.length > 1 && lines.every((l) => l.length < 220);
  return (
    <div className="group relative flex gap-2.5">
      <ThursdayMark size={26} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md border border-line bg-surface px-3.5 py-2.5 shadow-[0_1px_2px_rgba(16,19,24,0.04)]">
          {asList ? (
            <ol className="space-y-1.5">
              {lines.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-clay" />
                  <span className="text-[14px] leading-relaxed text-ink-soft">
                    {line}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-ink-soft">
              {turn.content}
            </p>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 px-1">
          {turn.modelLabel ? (
            <span className="text-[11.5px] text-faint">
              {turn.modelLabel}
              {turn.latencyMs ? ` · ${(turn.latencyMs / 1000).toFixed(1)}s` : ""}
            </span>
          ) : null}
          <span className="opacity-0 transition-opacity group-hover:opacity-100">
            <CopyButton text={turn.content} />
          </span>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ turn }: { turn: AiTurn }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-forest px-3.5 py-2.5">
        <p className="text-[14px] leading-relaxed whitespace-pre-wrap text-white">
          {turn.content}
        </p>
      </div>
    </div>
  );
}

function TypingRow({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <ThursdayMark size={26} className="mt-0.5 shrink-0 opacity-90" />
      <div className="rounded-2xl rounded-tl-md border border-line bg-surface px-3.5 py-3">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="ai-typing-dot h-1.5 w-1.5 rounded-full bg-clay"
                style={{ animationDelay: `${i * 160}ms` }}
              />
            ))}
          </span>
          <span className="text-[12px] text-faint">{label}</span>
        </div>
      </div>
    </div>
  );
}

export function AiView({ me, onToast }: any) {
  const [mode, setMode] = useState<"chat" | AiAction>("chat");
  const [thread, setThread] = useState<AiTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AiStatus | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeAction = mode === "chat" ? null : mode;
  const firstName = String(me?.name || "there").split(" ")[0];

  useEffect(() => {
    let alive = true;
    aiStatus().then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [thread, busy]);

  useEffect(() => {
    if (activeAction) setThread([]);
    setDraft("");
    setError(null);
    window.setTimeout(() => taRef.current?.focus(), 80);
  }, [mode]);

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? draft).trim();
      if (!text || busy) return;
      const task = activeAction?.task ?? "chat";
      const userTurn: AiTurn = {
        role: "user",
        content: text,
        at: new Date().toISOString(),
      };
      const nextThread = [...thread, userTurn];
      setThread(nextThread);
      setDraft("");
      setError(null);
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const history =
        task === "chat"
          ? nextThread.slice(-8).map((t) => ({
              role: t.role as "user" | "assistant",
              content: t.content,
            }))
          : undefined;

      const reply = await aiAsk({
        task,
        ...(history ? { messages: history } : { prompt: text }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        setBusy(false);
        abortRef.current = null;
        return;
      }
      setBusy(false);
      abortRef.current = null;
      if (reply.ok && reply.text) {
        const replyTurn: AiTurn = {
          role: "assistant",
          content: reply.text,
          modelLabel: reply.modelLabel,
          latencyMs: reply.latencyMs,
          at: new Date().toISOString(),
        };
        setThread((t) => [...t, replyTurn]);
        aiStatus().then(setStatus).catch(() => {});
      } else {
        setError(reply.error || "That didn't come through. Try once more.");
        // Roll the failed turn back out of the transcript.
        setThread((t) => t.filter((x) => x !== userTurn));
        setDraft(text);
      }
    },
    [draft, busy, thread, activeAction],
  );

  const reset = () => {
    abortRef.current?.abort();
    setThread([]);
    setError(null);
    setDraft("");
    setBusy(false);
    window.setTimeout(() => taRef.current?.focus(), 60);
  };

  const onKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-[1120px] gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_296px] lg:gap-7 lg:px-8">
      {/* ---------- Conversation column ---------- */}
      <section className="flex min-h-[calc(100dvh-176px)] flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-clay/25 bg-clay-wash px-2 py-0.5 text-[11.5px] font-semibold tracking-[0.04em] text-clay uppercase">
                <Sparkle size={10} weight="fill" />
                Thursday AI
              </span>
              {activeAction ? (
                <button
                  type="button"
                  onClick={() => setMode("chat")}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-0.5 text-[11.5px] font-medium text-muted transition-colors hover:text-ink"
                >
                  <X size={9} weight="bold" />
                  {activeAction.label}
                </button>
              ) : null}
            </div>
            <h1 className="text-[23px] leading-tight font-semibold tracking-[-0.025em] text-ink">
              {activeAction ? activeAction.label : `${timeOfDay()}, ${firstName}`}
            </h1>
            <p className="mt-1 max-w-[52ch] text-[14px] leading-relaxed text-muted">
              {activeAction
                ? activeAction.hint
                : "A quiet writing room. Ask for captions, bios, titles, replies — or just think out loud."}
            </p>
          </div>
          {thread.length ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <ArrowCounterClockwise size={13} />
              New
            </button>
          ) : null}
        </div>

        {/* Transcript */}
        <div
          ref={scroller}
          className="thin-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pb-2"
        >
          {thread.length === 0 && !busy ? (
            <div className="rounded-2xl border border-dashed border-line-strong bg-surface-muted/60 px-4 py-5">
              <p className="mb-3 text-[12px] font-medium tracking-[0.08em] text-faint uppercase">
                {activeAction ? "Give me the raw material" : "Start with"}
              </p>
              <div className="space-y-1.5">
                {(activeAction
                  ? [
                      activeAction.placeholder,
                      "Paste your own text — I'll keep your voice.",
                    ]
                  : AI_STARTERS
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-[13px] leading-snug text-ink-soft transition-colors hover:border-forest/30 hover:bg-forest-wash"
                  >
                    <ArrowUp
                      size={13}
                      className="shrink-0 rotate-45 text-faint"
                    />
                    <span className="min-w-0 flex-1">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {thread.map((turn, i) =>
            turn.role === "user" ? (
              <UserBubble key={i} turn={turn} />
            ) : (
              <AssistantBubble key={i} turn={turn} />
            ),
          )}

          {busy ? (
            <TypingRow
              label="thinking"
            />
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-xl border border-clay/25 bg-clay-wash px-3.5 py-3">
              <X size={13} className="mt-0.5 shrink-0 text-clay" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-clay">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    send();
                  }}
                  className="mt-1.5 text-[12px] font-semibold text-clay underline decoration-clay/40 underline-offset-2 hover:decoration-clay"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Composer */}
        <div className="sticky bottom-0 -mx-1 mt-3 bg-gradient-to-t from-canvas via-canvas px-1 pt-3 pb-1">
          <div
            className={cn(
              "flex items-end gap-2 rounded-2xl border bg-surface p-2 shadow-[0_2px_14px_rgba(16,19,24,0.06)] transition-colors",
              busy
                ? "border-line"
                : "border-line-strong focus-within:border-forest/50",
            )}
          >
            <textarea
              ref={taRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={
                activeAction
                  ? activeAction.placeholder
                  : "Ask for a caption, a bio, a gentler reply…"
              }
              className="max-h-[160px] min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-[14px] leading-relaxed text-ink outline-none placeholder:text-faint"
              style={{ height: Math.min(160, 38 + draft.split("\n").length * 20) }}
            />
            {busy ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:text-ink"
                aria-label="Stop generating"
              >
                <X size={15} weight="bold" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => send()}
                disabled={!draft.trim()}
                className={cn(
                  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all",
                  draft.trim()
                    ? "bg-forest text-white shadow-sm hover:bg-forest-hover"
                    : "bg-canvas-deep text-faint",
                )}
                aria-label="Send"
              >
                <ArrowUp size={16} weight="bold" />
              </button>
            )}
          </div>
          <p className="mt-1.5 px-1 text-[11.5px] text-faint">
            Free models, rotated on every message. Thursday AI can be wrong —
            check anything that matters.
          </p>
        </div>
      </section>

      {/* ---------- Tools rail ---------- */}
      <aside className="space-y-3 lg:sticky lg:top-[84px] lg:self-start">
        <div className="rounded-xl border border-line bg-surface p-1.5">
          <p className="px-2.5 pt-1.5 pb-2 text-[11.5px] font-medium tracking-[0.08em] text-faint uppercase">
            Tools
          </p>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setMode("chat")}
              className={cn(
                "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                mode === "chat"
                  ? "bg-forest-soft"
                  : "hover:bg-canvas-deep/70",
              )}
            >
              <ChatGlyph active={mode === "chat"} />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block text-[13px] font-semibold",
                    mode === "chat" ? "text-forest" : "text-ink",
                  )}
                >
                  Freeform chat
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-faint">
                  Think out loud, ask anything.
                </span>
              </span>
            </button>
            {AI_ACTIONS.map((a) => {
              const on = mode !== "chat" && mode.task === a.task;
              const acc = ACCENTS[a.accent];
              return (
                <button
                  key={a.task}
                  type="button"
                  onClick={() => setMode(a)}
                  className={cn(
                    "group flex w-full items-start gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left transition-colors",
                    on ? acc.ring + " border" : "hover:bg-canvas-deep/70",
                  )}
                >
                  <span
                    className={cn(
                      "mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full",
                      acc.dot,
                      on ? "" : "opacity-60 group-hover:opacity-100",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-ink">
                      {a.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-faint">
                      {a.list
                        ? a.task === "reply"
                          ? "Three warm options"
                          : a.task === "thread"
                            ? "Three calm posts"
                            : "Three or five options"
                        : a.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <EnginePanel status={status} />

      </aside>
    </div>
  );
}

function ChatGlyph({ active }: { active?: boolean }) {
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
        active
          ? "border-forest/25 bg-forest text-white"
          : "border-line bg-canvas text-muted",
      )}
    >
      <Sparkle size={11} weight="fill" />
    </span>
  );
}
