import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { readFileAsDataUrl, useAmbientAudio } from "../lib/audio";
import { cn } from "../lib/cn";
import {
  BellSlash,
  BookmarkSimple,
  CalendarBlank,
  CaretRight,
  Check,
  Clock,
  Eye,
  Image,
  Lock,
  MapPin,
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

const GUIDE_STEP_CONTENT: Record<string, string[]> = {
  g1: [
    "Move every infinite-scroll app off your home screen so opening one becomes a deliberate choice.",
    "Turn off red notification badges — keep banners only for direct messages from real people.",
    "Set Quiet Hours from 22:00 to 07:30 so mornings start with your own thoughts first.",
    "Unfollow accounts that make you feel rushed; keep small circles where people actually talk.",
    "Leave your phone in another room during meals and walks under thirty minutes.",
  ],
  g2: [
    "Wipe bisqueware with a damp sponge first so kiln dust doesn't cause crawling.",
    "Wax the foot ring cleanly — leave a 3mm bare margin where the pot meets the shelf.",
    "Stir the glaze bucket from the very bottom for a full minute before dipping.",
    "Hold with tongs and dip for three steady seconds, then shake once gently.",
    "Let the first coat dry completely to the touch before adding a rim accent.",
    "Check pinholes with a clean fingertip — rub them smooth before loading.",
    "Write down your glaze combo in a notebook; memory never survives a firing.",
  ],
  g3: [
    "Pick a loop under four kilometres so you never spend energy watching the clock.",
    "Leave headphones in your pocket for the first fifteen minutes and listen to wind and gravel.",
    "Stop once halfway at a bench, wall, or tree — look up at the canopy instead of your screen.",
    "Bring a small thermos or stop at the same neighbourhood bakery on the way back.",
  ],
};

export function StoryHighlightsStrip({ highlights, onOpen, onAdd }: any) {
  return (
    <div className="border-t border-line px-4 py-3 sm:px-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-[0.1em] text-faint uppercase">
          Highlights
        </p>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-forest"
          >
            <Plus size={11} weight="bold" />
            {" New"}
          </button>
        ) : null}
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
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </span>
            <span className="w-full truncate text-[9.5px] font-medium text-muted">
              {d.title}
            </span>
          </button>
        ))}
        {onAdd ? (
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
        ) : null}
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

export function DraftsModal({ open, onClose, drafts, onPublish, onDelete }: any) {
  const [fallbackDrafts, setFallbackDrafts] = useState<any>(INITIAL_DRAFTS);
  const items = drafts ?? fallbackDrafts;

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
                  Saved privately and synced to your workspace.
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
              {items.map((A?: any) => (
                <div key={A.id} className="rounded-lg border border-line p-2.5">
                  <p className="line-clamp-3 text-[12px] leading-[1.55] text-ink-soft">
                    {A.text}
                  </p>
                  {A.image ? (
                    <img
                      src={A.image}
                      alt=""
                      className="mt-2 h-20 w-full rounded-md object-contain"
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
                          if (!drafts) {
                            setFallbackDrafts((T?: any) =>
                              T.filter((y?: any) => y.id !== A.id),
                            );
                          } else {
                            onDelete?.(A.id);
                          }
                          onClose();
                        }}
                        className="text-[10.5px] font-semibold text-forest"
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!drafts) {
                            setFallbackDrafts((T?: any) =>
                              T.filter((y?: any) => y.id !== A.id),
                            );
                          }
                          onDelete?.(A.id);
                        }}
                        className="text-[10.5px] font-medium text-muted hover:text-clay"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {items.length ? null : (
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

export function AudioLibraryModal({ open, onClose, onSelect }: any) {
  const ambient = useAmbientAudio();

  const handleClose = () => {
    ambient.stop();
    onClose();
  };

  return open
    ? createPortal(
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={handleClose}
            aria-label="Close audio"
          />
          <div className="animate-pop relative w-full max-w-[460px] rounded-t-2xl border border-line bg-surface p-4 sm:rounded-xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-ink">Add audio</p>
                <p className="text-[11px] text-muted">
                  Licensed ambient tracks — tap play to preview.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-canvas-deep"
              >
                <X size={15} />
              </button>
            </div>
            {AUDIO_TRACKS.map((x?: any) => {
              const isPlaying = ambient.activeKey === `lib_${x.id}`;
              return (
                <div
                  key={x.id}
                  className="flex items-center gap-2.5 border-b border-line/70 py-2 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => ambient.toggle(`lib_${x.id}`, `${x.title} ${x.tone}`)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest text-white hover:bg-forest-hover"
                    aria-label={isPlaying ? "Pause" : "Play track"}
                  >
                    {isPlaying ? (
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
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => {
                        ambient.stop();
                        onSelect({
                          title: x.title,
                          artist: x.artist,
                          duration: "2:18",
                          art: PHOTOS.vinyl,
                        });
                        onClose();
                      }}
                      className="rounded-md border border-forest/30 bg-forest-wash px-2 py-1 text-[10px] font-semibold text-forest hover:bg-forest-soft"
                    >
                      Use
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>,
        document.body,
      )
    : null;
}

export function ThursdayPromptCard({
  prompt,
  prompts,
  votedOptions,
  onVote,
}: any) {
  const list = (prompts?.length ? prompts : prompt ? [prompt] : []).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const activePrompt = list.length ? list[idx % list.length] : null;
  const [localVotes, setLocalVotes] = useState<Record<string, string>>({});
  // With no prompts on the server there is nothing to ask, so the card simply
  // does not render. It used to assume one always existed and took the whole
  // page down with a TypeError when the app was genuinely empty.
  if (!activePrompt) return null;
  const selected = votedOptions?.[activePrompt.id] ?? localVotes[activePrompt.id] ?? null;

  return (
    <div className="rounded-xl border border-line bg-surface p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-faint uppercase">
          <Sparkle size={11} />
          {" Thursday prompt"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-faint">
            {activePrompt.closes}
            {" left"}
          </span>
          {list.length > 1 ? (
            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % list.length)}
              className="text-[10px] font-semibold text-forest hover:opacity-75"
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
      <p className="text-[13.5px] font-semibold text-ink">{activePrompt.question}</p>
      <div className="mt-2.5 space-y-1.5">
        {activePrompt.options.map((x?: any) => {
          const baseVotes = Number(activePrompt.votes || 280);
          const total = baseVotes + (selected ? 1 : 0);
          const pct = selected
            ? Math.round(
                ((baseVotes / activePrompt.options.length + (selected === x ? 1 : 0)) /
                  Math.max(1, total)) *
                  100,
              )
            : null;
          return (
            <button
              key={x}
              type="button"
              disabled={!!selected}
              onClick={() => {
                setLocalVotes((prev) => ({ ...prev, [activePrompt.id]: x }));
                onVote(x, activePrompt.id);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-2.5 py-2 text-left text-[11.5px] transition-colors",
                selected === x
                  ? "border-forest/40 bg-forest-wash font-semibold text-forest"
                  : "border-line text-ink-soft hover:border-line-strong",
              )}
            >
              {x}
              {pct !== null ? (
                <span className="text-[10.5px] text-muted">{pct}%</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-faint">
        {Number(activePrompt.votes || 280) + (selected ? 1 : 0)}
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
        className="h-14 w-14 shrink-0 rounded-lg object-contain"
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

export function GuideReaderModal({
  guide,
  open,
  onClose,
  people,
  saved,
  completedSteps = [],
  onToggleSave,
  onToggleStep,
  onOpenAuthor,
}: any) {
  if (!open || !guide) return null;
  const author = people?.find((p: any) => p.id === guide.authorId);
  const steps: string[] =
    guide.stepList ||
    GUIDE_STEP_CONTENT[guide.id] || [
      "Set aside twenty unhurried minutes without notifications.",
      "Gather only what you need on a clean table.",
      "Share a quiet note with your circle afterwards.",
    ];

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close guide"
      />
      <div className="animate-pop relative max-h-[86vh] w-full max-w-[520px] overflow-y-auto rounded-t-2xl border border-line bg-surface sm:rounded-2xl">
        <div className="relative h-44 overflow-hidden">
          <img src={guide.image} alt="" className="h-full w-full object-contain" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/65"
          >
            <X size={15} />
          </button>
          <div className="absolute right-4 bottom-3 left-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9.5px] font-semibold text-[#101318]">
              <BookmarkSimple size={10} /> Guide · {steps.length} steps
            </span>
            <h2 className="mt-1.5 text-[19px] font-semibold text-white tracking-[-0.02em]">
              {guide.title}
            </h2>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-[12.5px] leading-[1.65] text-ink-soft">{guide.summary}</p>
          {author ? (
            <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-surface-muted/60 px-3 py-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuthor?.(author.id);
                }}
                className="flex items-center gap-2 text-left"
              >
                <Avatar person={author} size="sm" />
                <span>
                  <span className="block text-[11.5px] font-semibold text-ink">
                    Written by {author.name}
                  </span>
                  <span className="block text-[10px] text-muted">@{author.handle}</span>
                </span>
              </button>
              <button
                type="button"
                onClick={onToggleSave}
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-[10.5px] font-semibold transition-colors",
                  saved
                    ? "border-forest/30 bg-forest-wash text-forest"
                    : "border-line-strong bg-surface text-ink-soft hover:bg-surface-muted",
                )}
              >
                <BookmarkSimple size={11} weight={saved ? "fill" : "regular"} />
                {saved ? "Saved" : "Save guide"}
              </button>
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            {steps.map((stepText, index) => {
              const done = completedSteps.includes(index);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onToggleStep?.(index)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left transition-colors",
                    done
                      ? "border-forest/30 bg-forest-wash/60"
                      : "border-line bg-surface hover:border-line-strong",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                      done
                        ? "border-forest bg-forest text-white"
                        : "border-line-strong text-muted",
                    )}
                  >
                    {done ? <Check size={11} strokeWidth={2.6} /> : index + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[12px] leading-[1.6]",
                      done ? "text-ink-soft line-through opacity-80" : "text-ink",
                    )}
                  >
                    {stepText}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[10.5px] text-faint">
            {completedSteps.length} of {steps.length} steps checked off
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function CreateHighlightModal({ open, onClose, onCreate }: any) {
  const presets = [
    PHOTOS.potteryWindow,
    PHOTOS.trail,
    PHOTOS.picnic,
    PHOTOS.studioDesk,
    PHOTOS.coffee,
    PHOTOS.bookshop,
  ];
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState(presets[0]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="animate-pop relative w-full max-w-[440px] rounded-t-2xl border border-line bg-surface p-4 sm:rounded-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-ink">New highlight</p>
            <p className="text-[11px] text-muted">
              Keep a favourite moment on your profile.
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
        <div className="space-y-3">
          <div>
            <label className="block text-[10.5px] font-semibold text-muted">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kiln notes, Lisbon, Late walks"
              maxLength={28}
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-3 text-[12.5px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-semibold text-muted">
              Short note
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption shown inside the highlight"
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-3 text-[12.5px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-semibold text-muted">
              Cover photo
            </label>
            <div className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setImage(p)}
                  className={cn(
                    "h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2",
                    image === p ? "border-forest" : "border-transparent opacity-75",
                  )}
                >
                  <img src={p} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
              <label className="inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-line-strong text-muted hover:border-forest hover:text-forest">
                <Image size={15} />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const dataUrl = await readFileAsDataUrl(f, 1080);
                      if (dataUrl) setImage(dataUrl);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-lg border border-line-strong px-3 text-[11.5px] font-semibold text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onCreate({
                  title: title.trim() || "Moments",
                  caption: caption.trim() || title.trim() || "Saved highlight",
                  image,
                  count: 1,
                });
                setTitle("");
                setCaption("");
                onClose();
              }}
              className="h-8 rounded-lg bg-forest px-3.5 text-[11.5px] font-semibold text-white hover:bg-forest-hover"
            >
              Add highlight
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function CreateCircleModal({ open, onClose, onCreate }: any) {
  const categories = ["Making", "Food", "Outdoors", "Reading", "Music", "Photography"];
  const presets = [
    PHOTOS.potteryClass,
    PHOTOS.picnicSpread,
    PHOTOS.pines,
    PHOTOS.bookshop,
    PHOTOS.vinyl,
    PHOTOS.friendsSunset,
  ];
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState("Making");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(presets[0]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="animate-pop relative max-h-[88vh] w-full max-w-[480px] overflow-y-auto rounded-t-2xl border border-line bg-surface p-4 sm:rounded-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-ink">Start a circle</p>
            <p className="text-[11px] text-muted">
              A quiet room around a shared craft, table, or habit.
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
        <div className="space-y-3">
          <div>
            <label className="block text-[10.5px] font-semibold text-muted">
              Circle name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Sketchbook"
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-3 text-[12.5px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10.5px] font-semibold text-muted">
                Tagline
              </label>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ten minutes on paper"
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-3 text-[12px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold text-muted">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-2.5 text-[12px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10.5px] font-semibold text-muted">
              What brings people here?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the pace, what people share, and who it's for…"
              className="mt-1 w-full resize-none rounded-lg border border-line bg-surface-muted/60 p-2.5 text-[12px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10.5px] font-semibold text-muted">
              Cover photo
            </label>
            <div className="no-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto">
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setImage(p)}
                  className={cn(
                    "h-12 w-16 shrink-0 overflow-hidden rounded-lg border-2",
                    image === p ? "border-forest" : "border-transparent opacity-75",
                  )}
                >
                  <img src={p} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
              <label className="inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-line-strong text-muted hover:border-forest hover:text-forest">
                <Plus size={15} />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const dataUrl = await readFileAsDataUrl(f, 1200);
                      if (dataUrl) setImage(dataUrl);
                    }
                  }}
                />
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-lg border border-line-strong px-3 text-[11.5px] font-semibold text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => {
                onCreate({
                  name: name.trim(),
                  tagline: tagline.trim() || "Small room, good company",
                  category,
                  description:
                    description.trim() ||
                    "An unhurried space for sharing work-in-progress and notes.",
                  image,
                });
                setName("");
                setTagline("");
                setDescription("");
                onClose();
              }}
              className="h-8 rounded-lg bg-forest px-3.5 text-[11.5px] font-semibold text-white hover:bg-forest-hover disabled:opacity-45"
            >
              Open circle
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function CreateGatheringModal({ open, onClose, circles, onCreate }: any) {
  const presets = [
    PHOTOS.potteryHands,
    PHOTOS.picnic,
    PHOTOS.friendsSunset,
    PHOTOS.coffee,
    PHOTOS.bookshop,
  ];
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("2026-11-29");
  const [time, setTime] = useState("11:00 – 14:00");
  const [place, setPlace] = useState("");
  const [cost, setCost] = useState("Free");
  const [spotsLeft, setSpotsLeft] = useState("12");
  const [circleId, setCircleId] = useState(circles?.[0]?.id || "circle_making");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(presets[0]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-ink/45 backdrop-blur-[2px] sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close"
      />
      <div className="animate-pop relative max-h-[88vh] w-full max-w-[490px] overflow-y-auto rounded-t-2xl border border-line bg-surface p-4 sm:rounded-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold text-ink">Put on a gathering</p>
            <p className="text-[11px] text-muted">
              Hosting is free. Keep it small enough to talk to everyone.
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
        <div className="space-y-2.5">
          <div>
            <label className="block text-[10.5px] font-semibold text-muted">
              Gathering title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday afternoon print swap"
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-3 text-[12.5px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="flex items-center gap-1 text-[10.5px] font-semibold text-muted">
                <CalendarBlank size={11} /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-2.5 text-[12px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10.5px] font-semibold text-muted">
                <Clock size={11} /> Time
              </label>
              <input
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="11:00 – 14:00"
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-2.5 text-[12px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="flex items-center gap-1 text-[10.5px] font-semibold text-muted">
              <MapPin size={11} /> Where
            </label>
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Studio, park, or neighbourhood café"
              className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-3 text-[12px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10.5px] font-semibold text-muted">
                Circle
              </label>
              <select
                value={circleId}
                onChange={(e) => setCircleId(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-2 text-[11.5px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
              >
                {(circles || []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold text-muted">
                Entry
              </label>
              <input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-2.5 text-[11.5px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold text-muted">
                Spots
              </label>
              <input
                type="number"
                min={2}
                max={200}
                value={spotsLeft}
                onChange={(e) => setSpotsLeft(e.target.value)}
                className="mt-1 h-9 w-full rounded-lg border border-line bg-surface-muted/60 px-2.5 text-[11.5px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10.5px] font-semibold text-muted">
              Details
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What to bring, who to look for…"
              className="mt-1 w-full resize-none rounded-lg border border-line bg-surface-muted/60 p-2.5 text-[12px] text-ink focus:border-forest focus:bg-surface focus:outline-none"
            />
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pt-0.5">
            {presets.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setImage(p)}
                className={cn(
                  "h-11 w-14 shrink-0 overflow-hidden rounded-lg border-2",
                  image === p ? "border-forest" : "border-transparent opacity-75",
                )}
              >
                <img src={p} alt="" className="h-full w-full object-contain" />
              </button>
            ))}
            <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-dashed border-line-strong text-muted hover:border-forest hover:text-forest">
              <Plus size={14} />
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const dataUrl = await readFileAsDataUrl(f, 1200);
                    if (dataUrl) setImage(dataUrl);
                  }
                }}
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-8 rounded-lg border border-line-strong px-3 text-[11.5px] font-semibold text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!title.trim()}
              onClick={() => {
                onCreate({
                  title: title.trim(),
                  date,
                  time: time.trim() || "11:00 – 14:00",
                  place: place.trim() || "Neighbourhood Studio",
                  cost: cost.trim() || "Free",
                  spotsLeft: Math.max(1, Number.parseInt(spotsLeft, 10) || 12),
                  circleId,
                  description:
                    description.trim() ||
                    "Come as you are — kettle on and plenty of room at the table.",
                  image,
                });
                setTitle("");
                setPlace("");
                setDescription("");
                onClose();
              }}
              className="h-8 rounded-lg bg-forest px-3.5 text-[11.5px] font-semibold text-white hover:bg-forest-hover disabled:opacity-45"
            >
              Publish gathering
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
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

export function QuietHoursCard({ enabled, onChange, fromTime = "22:00", untilTime = "07:30" }: any) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-muted px-3 py-2.5">
      <div className="flex items-start gap-2">
        <BellSlash size={13} className="mt-0.5 shrink-0 text-forest" />
        <div>
          <p className="text-[11.5px] font-medium text-ink">Quiet hours</p>
          <p className="text-[10px] text-muted">
            Mute notifications between {fromTime} and {untilTime}.
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

export function ProfileVisitorsStrip({
  people,
  visitors,
  onOpen,
}: any) {
  const tracked: Array<{ personId: string; time: string }> =
    Array.isArray(visitors) && visitors.length ? visitors : RECENT_VISITORS;
  const isLive = Array.isArray(visitors) && visitors.length > 0;
  const shown = tracked.slice(0, 5);
  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-faint uppercase">
          <Eye size={11} />
          {" Profile visitors"}
        </p>
        <span className="inline-flex items-center gap-1 text-[9.5px] text-faint">
          {isLive ? (
            <>
              <span className="h-1 w-1 rounded-full bg-forest" />
              live
            </>
          ) : (
            "last 7 days"
          )}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex -space-x-2">
          {shown.map((m?: any) => {
            const person = people.find((x?: any) => x.id === m.personId);
            return person ? (
              <button
                key={m.personId}
                type="button"
                onClick={() => onOpen(person.id)}
                className="rounded-full ring-2 ring-surface transition-transform hover:-translate-y-0.5"
                aria-label={`${person.name}, ${m.time || "recently"}`}
              >
                <Avatar person={person} size="sm" />
              </button>
            ) : null;
          })}
        </div>
        <span className="text-[10.5px] text-muted">
          {tracked.length > 5 ? `+${tracked.length - 5} more` : "recent"}
        </span>
      </div>
    </div>
  );
}

export function StoryComposerModal({ open, onClose, onShare, me }: any) {
  const [x, w] = useState<any>(""),
    [A, T] = useState<any>(PHOTOS.potteryWindow),
    [closeFriends, setCloseFriends] = useState<boolean>(false),
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
        // Stories are a full-bleed medium, so the composer is too. On phones it
        // fills the entire screen (respecting safe-area insets); from `sm` up it
        // returns to a centred card.
        <div className="fixed inset-0 z-[75] flex items-stretch justify-center bg-[#050806]/95 sm:items-center sm:p-6">
          <div className="story-composer relative flex h-full w-full flex-col overflow-hidden bg-[#0b0f0c] sm:max-h-[760px] sm:max-w-[420px] sm:rounded-2xl sm:border sm:border-white/10">
            {/* Preview only: the chosen photo is shown whole behind the
                controls, never zoomed to fill the screen. */}
            <img
              src={A}
              alt=""
              className="absolute inset-0 h-full w-full object-contain opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            <div className="relative z-10 flex items-center justify-between p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"
              >
                <X size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCloseFriends((v) => !v)}
                aria-pressed={closeFriends}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium backdrop-blur transition-colors",
                  closeFriends
                    ? "bg-forest text-white"
                    : "bg-black/35 text-white/80 hover:bg-black/50",
                )}
              >
                <Lock size={10} />
                {closeFriends ? " Close friends only" : " Close friends"}
              </button>
            </div>
            <div className="relative z-10 mt-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
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
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
                <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-white/30 text-white/70 hover:border-white/60">
                  <Plus size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (z?: any) => {
                      const v = z.target.files?.[0];
                      if (v) {
                        const dataUrl = await readFileAsDataUrl(v, 1080);
                        if (dataUrl) T(dataUrl);
                      }
                    }}
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  onShare(x.trim() || "A small moment from today.", A, closeFriends);
                  w("");
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

export function WeeklyRecapCard({ people, onOpen, stats }: any) {
  const m = useMemo(
    () => [
      {
        label: "Posts shared",
        value: String(stats?.postsShared ?? 6),
        tone: "text-ink",
      },
      {
        label: "Circle replies",
        value: String(stats?.circleReplies ?? 24),
        tone: "text-ink",
      },
      {
        label: "In circle",
        value: String(stats?.followingCount ?? 2),
        tone: "text-forest",
      },
    ],
    [stats?.postsShared, stats?.circleReplies, stats?.followingCount],
  );
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
          <Sparkle size={12} className="text-forest" />
          {" Your week on Thursday"}
        </p>
        <span className="text-[9.5px] text-faint">This week</span>
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
