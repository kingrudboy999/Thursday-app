import { useMemo, useState } from "react";
import { cn } from "../lib/cn";
import { downloadIcsEvent } from "../lib/storage";
import {
  ArrowRight,
  CalendarBlank,
  CaretRight,
  Check,
  Clock,
  Compass,
  MapPin,
  Plus,
  PaperPlaneTilt,
  Ticket,
  UserPlus,
  UsersThree,
} from "../lib/icons";
import {
  Avatar,
  EmptyState,
  Modal,
  PostCard,
  VerifiedBadge,
} from "../components/social";
import { CircleNotch } from "../lib/icons";
import { formatCount } from "../lib/social";
import { ACCENT_BADGE_STYLES } from "../lib/spaces";

function SectionEyebrow({ children }: any) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className="h-1 w-1 rounded-full bg-forest" />
      <p className="text-[10.5px] font-semibold tracking-[0.13em] text-faint uppercase">
        {children}
      </p>
    </div>
  );
}
function AvatarStack({ ids, people, onlineIds = [] }: any) {
  return (
    <span className="flex -space-x-1.5">
      {ids.slice(0, 4).map((m?: any) => {
        const d = people.find((x?: any) => x.id === m);
        return d ? (
          <span key={m} className="rounded-full ring-2 ring-surface">
            <Avatar person={d} size="xs" online={onlineIds.includes(d.id)} />
          </span>
        ) : null;
      })}
    </span>
  );
}
const ACTIVE_CIRCLE_MEMBER_IDS = [
  "maya",
  "priya",
  "jonah",
  "theo",
  "lena",
  "sam",
];
const CIRCLE_CATEGORIES = [
  "All",
  "Making",
  "Food",
  "Outside",
  "Music",
  "Books",
  "Creative",
];
export function CirclesView({
  circles,
  events,
  people,
  posts,
  initialSelectedId,
  me,
  meId = "me",
  onlineIds = [],
  onCreatePost,
  onToggleCircle,
  onCreate,
  onOpenPerson,
  onLike,
  onSave,
  onRepost,
  onOpenPost,
  onVote,
}: any) {
  const [composerText, setComposerText] = useState<string>(""),
    [posting, setPosting] = useState<boolean>(false),
    [q, _] = useState<any>("All"),
    [j, C] = useState<any>(initialSelectedId ?? null),
    U = circles.filter((K?: any) => K.joined),
    J = circles.filter((K?: any) => q === "All" || K.category === q),
    te = circles.find((K?: any) => K.id === j),
    Ne = te ? posts.filter((K?: any) => K.circleId === te.id).slice(0, 8) : [],
    he = events.find((K?: any) => K.circleId === j && K.joined) ?? events[0];
  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 pt-5 pb-10 sm:px-6 lg:px-8">
      <header className="animate-rise flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <SectionEyebrow>Shared interests</SectionEyebrow>
          <h1 className="text-[24px] leading-[1.15] font-semibold tracking-[-0.03em] text-ink sm:text-[27px]">
            Circles
          </h1>
          <p className="mt-1 max-w-[430px] text-[13px] text-muted">
            Smaller rooms inside Thursday. Join the ones that feel like you, and
            post where it lands with the right people.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-[10px] border border-forest bg-forest px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-forest-hover sm:self-auto"
        >
          <Plus size={14} strokeWidth={2.3} aria-hidden="true" />
          Start a circle
        </button>
      </header>
      <section className="animate-rise mt-5 rounded-xl border border-line bg-surface p-3.5">
        <div className="flex items-center justify-between gap-3 px-1">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
            <UsersThree
              size={12}
              strokeWidth={2}
              className="text-forest"
              aria-hidden="true"
            />
            Your circles
          </p>
          <span className="text-[10.5px] text-faint">
            {U.length}
            {" joined"}
          </span>
        </div>
        <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto px-1 pb-0.5">
          {U.length ? (
            U.map((K?: any) => {
              const ae =
                ACCENT_BADGE_STYLES[K.accent] ?? ACCENT_BADGE_STYLES.forest;
              return (
                <button
                  key={K.id}
                  type="button"
                  onClick={() => C(K.id)}
                  className="group flex shrink-0 items-center gap-2 rounded-[10px] border border-line bg-surface-muted/50 py-1.5 pr-3 pl-1.5 text-left transition-colors hover:border-line-strong hover:bg-surface-muted"
                >
                  <img
                    src={K.image}
                    alt=""
                    className="h-8 w-8 rounded-[6px] object-cover"
                  />
                  <span>
                    <span className="block text-[11.5px] font-semibold text-ink">
                      {K.name}
                    </span>
                    <span
                      className={cn("block text-[8.5px] font-medium", ae.text)}
                    >
                      {formatCount(K.members)}
                      {" members"}
                    </span>
                  </span>
                  <CaretRight
                    size={12}
                    className="ml-1 text-faint transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              );
            })
          ) : (
            <p className="px-1 py-2 text-[11.5px] text-muted">
              You have not joined a circle yet. Start with one below.
            </p>
          )}
        </div>
      </section>
      <div className="animate-rise mt-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-ink">
          Browse all circles
        </h2>
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {CIRCLE_CATEGORIES.map((K?: any) => (
            <button
              key={K}
              type="button"
              onClick={() => _(K)}
              aria-pressed={q === K}
              className={cn(
                "h-6.5 shrink-0 rounded-full border px-2.5 text-[11px] font-medium transition-colors",
                q === K
                  ? "border-forest bg-forest text-white"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {K}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {J.map((K?: any, ae?: any) => {
          const $ = ACCENT_BADGE_STYLES[K.accent] ?? ACCENT_BADGE_STYLES.forest,
            ye = K.moderatorIds
              .map((Ve?: any) => people.find((pe?: any) => pe.id === Ve))
              .filter((Ve?: any) => !!Ve);
          return (
            <article
              key={K.id}
              className="animate-rise group overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(29,33,28,0.02)] transition-colors hover:border-line-strong"
              style={{
                animationDelay: `${Math.min(ae * 30, 150)}ms`,
              }}
            >
              <button
                type="button"
                onClick={() => C(K.id)}
                className="relative block h-[104px] w-full overflow-hidden text-left"
                aria-label={`Open ${K.name}`}
              >
                <img
                  src={K.image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <span
                  className={cn(
                    "absolute top-2.5 left-2.5 rounded-full px-2 py-0.5 text-[8.5px] font-semibold backdrop-blur",
                    $.bg,
                    $.text,
                  )}
                >
                  {K.category}
                </span>
                {K.joined ? (
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-0.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-[#1f6b52] backdrop-blur">
                    <Check size={9} strokeWidth={2.6} aria-hidden="true" />
                    {" Joined"}
                  </span>
                ) : null}
                <div className="absolute right-2.5 bottom-2 left-2.5">
                  <p className="text-[14px] font-semibold text-white">
                    {K.name}
                  </p>
                  <p className="truncate text-[10.5px] text-white/75">
                    {K.tagline}
                  </p>
                </div>
              </button>
              <div className="p-3">
                <div className="flex items-center gap-1.5">
                  <AvatarStack
                    ids={ye.map((Ve?: any) => Ve.id)}
                    people={people}
                    onlineIds={onlineIds}
                  />
                  <p className="ml-0.5 truncate text-[10px] text-muted">
                    {formatCount(K.members)}
                    {" members · "}
                    {K.posts}
                    {" posts"}
                  </p>
                </div>
                <p className="mt-2 line-clamp-2 text-[11px] leading-[1.55] text-muted">
                  {K.description}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                  <span
                    className={cn("truncate text-[10px] font-medium", $.text)}
                  >
                    {K.activity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleCircle(K.id)}
                    aria-pressed={K.joined}
                    className={cn(
                      "inline-flex h-6.5 shrink-0 items-center gap-1 rounded-[6px] border px-2 text-[10.5px] font-semibold transition-colors",
                      K.joined
                        ? "border-line-strong bg-surface text-muted hover:border-clay/30 hover:bg-clay-wash hover:text-clay"
                        : "border-forest bg-forest text-white hover:bg-forest-hover",
                    )}
                  >
                    {K.joined ? (
                      "Leave"
                    ) : (
                      <>
                        <UserPlus
                          size={10}
                          strokeWidth={2.2}
                          aria-hidden="true"
                        />
                        {" Join"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <Modal open={!!te} onClose={() => C(null)} width="lg" bare>
        {te ? (
          <div>
            <div className="relative h-[170px] sm:h-[190px]">
              <img
                src={te.image}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <button
                type="button"
                onClick={() => C(null)}
                aria-label="Close circle"
                className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
              >
                <span className="text-[17px] leading-none">×</span>
              </button>
              <div className="absolute right-4 bottom-3.5 left-4">
                <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#101318]">
                  {te.category}
                </span>
                <h2 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.025em] text-white">
                  {te.name}
                </h2>
                <p className="text-[11.5px] text-white/75">{te.tagline}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex items-center gap-2.5">
                <AvatarStack
                  onlineIds={onlineIds}
                  ids={te.moderatorIds}
                  people={people}
                />
                <div>
                  <p className="text-[11px] font-semibold text-ink">
                    {formatCount(te.members)}
                    {" members"}
                  </p>
                  <p className="text-[10px] text-muted">
                    Moderated by{" "}
                    {te.moderatorIds
                      .map(
                        (K?: any) =>
                          people
                            .find((ae?: any) => ae.id === K)
                            ?.name.split(" ")[0],
                      )
                      .filter(Boolean)
                      .join(" & ")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onToggleCircle(te.id)}
                aria-pressed={te.joined}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] border px-3 text-[11.5px] font-semibold transition-colors",
                  te.joined
                    ? "border-line-strong bg-surface text-muted hover:border-clay/30 hover:bg-clay-wash hover:text-clay"
                    : "border-forest bg-forest text-white hover:bg-forest-hover",
                )}
              >
                {te.joined ? (
                  <>
                    <Check size={12} strokeWidth={2.4} aria-hidden="true" />
                    {" Joined"}
                  </>
                ) : (
                  <>
                    <UserPlus size={12} strokeWidth={2.2} aria-hidden="true" />
                    {" Join circle"}
                  </>
                )}
              </button>
            </div>
            <div className="thin-scrollbar max-h-[46vh] overflow-y-auto">
              <div className="px-4 pt-3">
                <p className="text-[12.5px] leading-[1.65] text-ink-soft">
                  {te.description}
                </p>
                <div className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-muted">
                  <CalendarBlank
                    size={11}
                    strokeWidth={1.9}
                    className="text-forest"
                    aria-hidden="true"
                  />
                  {"Next up: "}
                  {he.title}
                  {" · "}
                  {he.weekday} {he.day}
                  {", "}
                  {he.time}
                </div>
              </div>
              <div className="mt-3 border-t border-line bg-surface-muted/40">
                <div className="border-b border-line bg-surface px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <Avatar person={me} size="sm" />
                    <div className="min-w-0 flex-1">
                      <textarea
                        value={composerText}
                        onChange={(e?: any) => setComposerText(e.target.value)}
                        rows={2}
                        placeholder={`Share something with ${te.name}…`}
                        className="w-full resize-none rounded-[9px] border border-line bg-canvas px-3 py-2 text-[12.5px] leading-[1.55] text-ink placeholder:text-faint focus:border-forest focus:bg-surface focus:outline-none"
                      />
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[10.5px] text-faint">
                          Posts live-sync to everyone in this circle
                        </span>
                        <button
                          type="button"
                          disabled={posting || !composerText.trim()}
                          onClick={async () => {
                            const text = composerText.trim();
                            if (!text) return;
                            setPosting(true);
                            await onCreatePost?.({
                              text,
                              circleId: te.id,
                            });
                            setComposerText("");
                            setPosting(false);
                          }}
                          className="inline-flex h-7 items-center gap-1.5 rounded-[7px] bg-forest px-2.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {posting ? (
                            <CircleNotch size={12} className="animate-spin" />
                          ) : (
                            <PaperPlaneTilt size={12} strokeWidth={2} />
                          )}
                          {posting ? "Posting…" : "Post to circle"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="px-4 pt-2.5 pb-1 text-[10px] font-semibold tracking-[0.1em] text-faint uppercase">
                  From inside the circle
                </p>
                {Ne.length ? (
                  Ne.map((K?: any) => {
                    const ae = people.find(($?: any) => $.id === K.authorId);
                    return ae ? (
                      <PostCard
                        key={K.id}
                        post={K}
                        author={ae}
                        people={people}
                        circles={circles}
                        onOpen={() => onOpenPost(K.id)}
                        onLike={() => onLike(K.id)}
                        onSave={() => onSave(K.id)}
                        onRepost={() => onRepost(K.id)}
                        onOpenAuthor={() => onOpenPerson(ae.id)}
                        onComment={() => onOpenPost(K.id)}
                        onVote={($?: any) => onVote(K.id, $)}
                        onOpenCircle={() => C(K.circleId ?? null)}
                      />
                    ) : null;
                  })
                ) : (
                  <p className="px-4 pb-4 pt-1 text-[11.5px] text-muted">
                    No posts here yet. Be the first to share something.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
const EVENT_FILTERS = ["All", "Going", "This week", "Free"];
export function GatheringsView({
  events,
  circles,
  people,
  onlineIds = [],
  onToggleEvent,
  onOpenPerson,
  onSuggest,
  onOpenCircle,
  onMessage,
}: any) {
  const [y, g] = useState<any>("All"),
    [R, z] = useState<any>(null),
    v = useMemo(
      () =>
        events.filter((J?: any) =>
          y === "Going"
            ? J.joined
            : y === "Free"
              ? J.cost === "Free" || J.cost.includes("Free")
              : y === "This week"
                ? ["2026-06-21", "2026-06-28", "2026-07-02"].includes(J.date)
                : true,
        ),
      [events, y],
    ),
    q = events[0],
    _ = events.find((J?: any) => J.id === R) ?? null,
    j = _ ? circles.find((J?: any) => J.id === _.circleId) : null,
    C = _ ? people.find((J?: any) => J.id === _.hostId) : null,
    U = events.filter((J?: any) => J.joined).length;
  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 pt-5 pb-10 sm:px-6 lg:px-8">
      <header className="animate-rise flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <SectionEyebrow>Good reasons to leave the house</SectionEyebrow>
          <h1 className="text-[24px] leading-[1.15] font-semibold tracking-[-0.03em] text-ink sm:text-[27px]">
            Gatherings
          </h1>
          <p className="mt-1 max-w-[430px] text-[13px] text-muted">
            Small, real-world things happening in your circles. RSVP, bring a
            friend, no pressure to post about it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[10.5px] font-medium text-muted sm:flex">
            <Ticket size={11} strokeWidth={1.9} aria-hidden="true" />
            {"You're going to "}
            {U}
          </span>
          <button
            type="button"
            onClick={onSuggest}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-3 text-[12px] font-semibold text-ink-soft transition-colors hover:bg-surface-muted"
          >
            <Plus size={13} strokeWidth={2.2} aria-hidden="true" />
            Suggest one
          </button>
        </div>
      </header>
      {q ? (
        <article className="animate-rise mt-5 overflow-hidden rounded-xl border border-line bg-surface">
          <div className="grid md:grid-cols-[1.05fr_1fr]">
            <button
              type="button"
              onClick={() => z(q.id)}
              className="relative block h-[190px] w-full overflow-hidden md:h-[292px]"
              aria-label={`Open ${q.title}`}
            >
              <img
                src={q.image}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#101318] backdrop-blur">
                Next up
              </span>
            </button>
            <div className="flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-semibold text-forest">
                    <Compass size={9} strokeWidth={2.2} aria-hidden="true" />
                    {" In the spirit of June"}
                  </span>
                  {q.spotsLeft <= 8 ? (
                    <span className="text-[10px] font-medium text-clay">
                      {q.spotsLeft}
                      {" spots left"}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-2.5 text-[22px] font-semibold leading-tight tracking-[-0.025em] tracking-[-0.01em] text-ink sm:text-[28px]">
                  {q.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-[1.6] text-muted">
                  {q.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-soft">
                  <span className="inline-flex items-center gap-1">
                    <CalendarBlank
                      size={11}
                      strokeWidth={1.9}
                      className="text-faint"
                      aria-hidden="true"
                    />
                    {q.weekday}
                    {", "}
                    {q.day}
                    {" June"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock
                      size={11}
                      strokeWidth={1.9}
                      className="text-faint"
                      aria-hidden="true"
                    />
                    {q.time}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin
                      size={11}
                      strokeWidth={1.9}
                      className="text-faint"
                      aria-hidden="true"
                    />
                    {q.place}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[
                    {
                      label: "Entry",
                      value: q.cost,
                    },
                    {
                      label: "Host",
                      value:
                        people
                          .find((J?: any) => J.id === q.hostId)
                          ?.name.split(" ")[0] ?? "Thursday",
                    },
                    {
                      label: "Circle",
                      value:
                        circles.find((J?: any) => J.id === q.circleId)?.name ??
                        "Thursday",
                    },
                  ].map((J?: any) => (
                    <div
                      key={J.label}
                      className="rounded-[7px] border border-line bg-surface-muted/60 px-2 py-1.5"
                    >
                      <p className="text-[8px] font-semibold tracking-[0.06em] text-faint uppercase">
                        {J.label}
                      </p>
                      <p className="mt-0.5 truncate text-[10.5px] font-medium text-ink-soft">
                        {J.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5">
                <div className="flex items-center gap-2">
                  <AvatarStack
                    onlineIds={onlineIds}
                    ids={ACTIVE_CIRCLE_MEMBER_IDS}
                    people={people}
                  />
                  <p className="text-[10.5px] text-muted">
                    <span className="font-semibold text-ink-soft">
                      {q.attendees}
                    </span>
                    {" going"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleEvent(q.id)}
                  aria-pressed={q.joined}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-[8px] border px-3 text-[11.5px] font-semibold transition-colors",
                    q.joined
                      ? "border-line-strong bg-surface text-muted hover:border-clay/30 hover:bg-clay-wash hover:text-clay"
                      : "border-forest bg-forest text-white hover:bg-forest-hover",
                  )}
                >
                  {q.joined ? (
                    <>
                      <Check size={12} strokeWidth={2.4} aria-hidden="true" />
                      {" Going"}
                    </>
                  ) : (
                    "Save my spot"
                  )}
                </button>
              </div>
            </div>
          </div>
        </article>
      ) : null}
      <div className="animate-rise mt-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[13px] font-semibold text-ink">Coming up</h2>
        <div className="flex gap-1">
          {EVENT_FILTERS.map((J?: any) => (
            <button
              key={J}
              type="button"
              onClick={() => g(J)}
              aria-pressed={y === J}
              className={cn(
                "h-6.5 rounded-full border px-2.5 text-[11px] font-medium transition-colors",
                y === J
                  ? "border-forest bg-forest text-white"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {J}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-line bg-surface">
        {v.length ? (
          <div className="divide-y divide-line/75">
            {v.map((J?: any) => {
              const te = people.find((he?: any) => he.id === J.hostId),
                Ne = circles.find((he?: any) => he.id === J.circleId);
              return (
                <div
                  key={J.id}
                  className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-surface-muted/40 sm:flex-row sm:items-center sm:px-5"
                >
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[8px] border border-line bg-surface-muted">
                    <span className="text-[8px] font-semibold tracking-[0.08em] text-faint uppercase">
                      {J.weekday}
                    </span>
                    <span className="text-[14px] font-semibold leading-none text-ink tabular-nums">
                      {J.day}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => z(J.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-[12.5px] font-semibold text-ink">
                        {J.title}
                      </p>
                      {J.joined ? (
                        <span className="rounded-full bg-forest-soft px-1.5 py-0.5 text-[8px] font-semibold text-forest">
                          Going
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10.5px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={9} strokeWidth={2} aria-hidden="true" />{" "}
                        {J.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={9} strokeWidth={2} aria-hidden="true" />{" "}
                        {J.place}
                      </span>
                    </p>
                    {te ? (
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-faint">
                        {"Hosted by "}
                        {te.name}
                        {Ne ? (
                          <span>
                            {"· in "}
                            {Ne.name}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                  </button>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <AvatarStack
                      onlineIds={onlineIds}
                      ids={ACTIVE_CIRCLE_MEMBER_IDS.slice(0, 3)}
                      people={people}
                    />
                    <span className="hidden w-[54px] text-[10px] text-faint sm:block">
                      {J.attendees}
                      {" going"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleEvent(J.id)}
                      aria-pressed={J.joined}
                      className={cn(
                        "inline-flex h-7 w-[70px] items-center justify-center gap-1 rounded-[6px] border text-[10.5px] font-semibold transition-colors",
                        J.joined
                          ? "border-line-strong bg-surface text-muted hover:border-clay/30 hover:bg-clay-wash hover:text-clay"
                          : "border-forest bg-forest text-white hover:bg-forest-hover",
                      )}
                    >
                      {J.joined ? "Going" : "RSVP"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={CalendarBlank}
            title="Nothing planned just yet"
            description="No gatherings match this filter. Clear it to see everything coming up."
            action={
              <button
                type="button"
                onClick={() => g("All")}
                className="h-8 rounded-[7px] border border-line-strong bg-surface px-3 text-[12px] font-semibold text-ink-soft hover:bg-surface-muted"
              >
                Show all gatherings
              </button>
            }
          />
        )}
        <div className="flex items-center justify-between gap-3 border-t border-line bg-surface-muted/50 px-4 py-2.5 sm:px-5">
          <p className="text-[10.5px] text-muted">
            Hosting is free. Thursday never charges for a gathering.
          </p>
          <button
            type="button"
            onClick={onSuggest}
            className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-forest hover:opacity-70"
          >
            Put something on
            <ArrowRight size={11} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>
      </div>
      <Modal open={!!_} onClose={() => z(null)} width="md" bare>
        {_ ? (
          <div>
            <div className="relative h-[160px]">
              <img
                src={_.image}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/5" />
              <button
                type="button"
                onClick={() => z(null)}
                aria-label="Close event"
                className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60"
              >
                <span className="text-[17px] leading-none">×</span>
              </button>
              <div className="absolute right-4 bottom-3 left-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#101318]">
                    {_.weekday}
                    {", "}
                    {_.day}
                    {" June"}
                  </span>
                  <span className="rounded-full bg-black/35 px-2 py-0.5 text-[8.5px] font-medium text-white backdrop-blur">
                    {_.cost}
                  </span>
                </div>
                <h2 className="mt-1.5 text-[21px] font-semibold leading-tight text-white tracking-[-0.02em]">
                  {_.title}
                </h2>
              </div>
            </div>
            <div className="px-4 py-4">
              <p className="text-[12.5px] leading-[1.7] text-ink-soft">
                {_.description}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {[
                  {
                    icon: Clock,
                    label: "When",
                    value: _.time,
                  },
                  {
                    icon: MapPin,
                    label: "Where",
                    value: _.place,
                  },
                  {
                    icon: UsersThree,
                    label: "Going",
                    value: `${_.attendees} people · ${_.spotsLeft} spots left`,
                  },
                  {
                    icon: Ticket,
                    label: "Entry",
                    value: _.cost,
                  },
                ].map((J?: any) => {
                  const Comp_te = J.icon;
                  return (
                    <div
                      key={J.label}
                      className="rounded-[8px] border border-line bg-surface-muted/60 px-2.5 py-2"
                    >
                      <p className="flex items-center gap-1 text-[8.5px] font-semibold tracking-[0.06em] text-faint uppercase">
                        <Comp_te size={9} strokeWidth={2} aria-hidden="true" />{" "}
                        {J.label}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium leading-snug text-ink-soft">
                        {J.value}
                      </p>
                    </div>
                  );
                })}
              </div>
              {C ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] border border-line p-2.5">
                  <div className="flex items-center gap-2.5">
                    <button type="button" onClick={() => onOpenPerson(C.id)}>
                      <Avatar person={C} size="sm" />
                    </button>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-[11.5px] font-semibold text-ink">
                        {C.name}
                        {C.verified ? (
                          <VerifiedBadge className="h-2.5 w-2.5" />
                        ) : null}
                      </p>
                      <p className="truncate text-[10px] text-muted">
                        Hosting · @{C.handle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onMessage(C.id)}
                      className="h-7 rounded-[6px] border border-line-strong bg-surface px-2.5 text-[10.5px] font-semibold text-ink-soft hover:bg-surface-muted"
                    >
                      Message
                    </button>
                    {j ? (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenCircle(j.id);
                          z(null);
                        }}
                        className="h-7 rounded-[6px] border border-forest/20 bg-forest-wash px-2.5 text-[10.5px] font-semibold text-forest hover:bg-forest-soft"
                      >
                        {j.name}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                <div className="flex items-center gap-2">
                  <AvatarStack
                    onlineIds={onlineIds} ids={ACTIVE_CIRCLE_MEMBER_IDS} people={people} />
                  <p className="text-[10px] text-muted">
                    {_.attendees}
                    {" people going"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => downloadIcsEvent(_)}
                    className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-line-strong bg-surface px-2.5 text-[11px] font-semibold text-ink-soft hover:bg-surface-muted"
                  >
                    <CalendarBlank size={12} strokeWidth={2} aria-hidden="true" />
                    Calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleEvent(_.id)}
                    aria-pressed={_.joined}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-[8px] border px-3.5 text-[11.5px] font-semibold transition-colors",
                      _.joined
                        ? "border-line-strong bg-surface text-muted hover:border-clay/30 hover:bg-clay-wash hover:text-clay"
                        : "border-forest bg-forest text-white hover:bg-forest-hover",
                    )}
                  >
                    {_.joined ? (
                      <>
                        <Check size={12} strokeWidth={2.4} aria-hidden="true" />
                        {" You're going"}
                      </>
                    ) : (
                      "RSVP"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
