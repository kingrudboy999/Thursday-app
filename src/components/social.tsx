import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import {
  BookmarkSimple,
  CaretLeft,
  CaretRight,
  ChatCircle,
  DotsThree,
  Heart,
  Image,
  MapPin,
  MusicNotes,
  PaperPlaneTilt,
  Pause,
  Play,
  Plus,
  PushPin,
  Repeat,
  SealCheck,
  Smiley,
  Sparkle,
  UsersThree,
} from "../lib/icons";
import { formatCount } from "../lib/social";

export function Avatar({
  person,
  size = "md",
  online = false,
  ring = false,
  seen = false,
  className,
}: any) {
  const A = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-11 w-11",
    xl: "h-16 w-16",
  }[size];
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "inline-flex overflow-hidden rounded-full",
          ring && "ring-2 ring-offset-2",
          ring &&
            (seen
              ? "ring-line-strong ring-offset-canvas"
              : "ring-forest ring-offset-canvas"),
        )}
      >
        <img
          src={person.avatar}
          alt=""
          className={cn("img-reveal rounded-full object-cover", A)}
          loading="lazy"
        />
      </span>
      {online ? (
        <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-forest" />
      ) : null}
    </span>
  );
}
export function VerifiedBadge({ className }: any) {
  return (
    <SealCheck
      size={13}
      strokeWidth={2}
      className={cn("shrink-0 text-forest", className)}
      aria-label="Verified"
    />
  );
}
export function AuthorChip({
  person,
  time,
  showHandle = true,
  className,
}: any) {
  return (
    <p className={cn("truncate text-[12px] text-muted", className)}>
      {showHandle ? `@${person.handle}` : null}
      {showHandle && time ? (
        <span className="mx-1 text-line-strong">·</span>
      ) : null}
      {time ? <span className="tabular-nums">{time}</span> : null}
    </p>
  );
}
export function FollowButton({ following, onChange, size = "sm" }: any) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={following}
      className={cn(
        "shrink-0 rounded-[8px] border font-semibold transition-colors duration-150",
        size === "sm" ? "h-7 px-2.5 text-[11.5px]" : "h-9 px-3.5 text-[13px]",
        following
          ? "border-line-strong bg-surface text-muted hover:border-clay/30 hover:bg-clay-wash hover:text-clay"
          : "border-forest bg-forest text-white hover:bg-forest-hover",
      )}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
export function MediaFrame({
  icon: IconComp,
  label,
  count,
  active = false,
  activeClass = "text-forest",
  onClick,
  className,
}: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-[7px] py-1 pr-1.5 pl-1 text-[12px] font-medium text-muted transition-colors hover:text-ink",
        active && activeClass,
        className,
      )}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors group-hover:bg-black/[0.045]">
        <IconComp
          size={15}
          className={cn(
            "icon-tilt",
            active && "fill-current",
            active && IconComp === Heart && "like-pop",
          )}
          aria-hidden="true"
        />
      </span>
      {count !== undefined ? (
        <span className="tabular-nums">{count ? formatCount(count) : ""}</span>
      ) : null}
    </button>
  );
}
export function PostCard({
  post,
  author,
  people,
  circles,
  onOpen,
  onLike,
  onSave,
  onRepost,
  onOpenAuthor,
  onComment,
  onVote,
  onOpenCircle,
}: any) {
  const [v, q] = useState<any>(false),
    [_, j] = useState<any>(0),
    [C, U] = useState<any>(false),
    [J, te] = useState<any>(false),
    Ne = post.text.length > 220,
    he = Ne && !v ? `${post.text.slice(0, 215).trimEnd()}…` : post.text,
    K = post.images[_],
    ae = post.circleId
      ? circles?.find((pe?: any) => pe.id === post.circleId)
      : undefined,
    $ =
      post.poll?.options.reduce((pe?: any, le?: any) => pe + le.votes, 0) ?? 0,
    ye = post.poll?.votedOptionId,
    Ve = !!post.poll && !ye;
  return (
    <article className="animate-rise overflow-hidden border-b border-line bg-surface first:rounded-t-2xl last:rounded-b-2xl last:border-b-0 sm:border-x">
      <div className="flex items-start gap-2.5 px-4 pt-4 sm:px-5">
        <button
          type="button"
          onClick={onOpenAuthor}
          aria-label={`View ${author.name}'s profile`}
        >
          <Avatar person={author} size="md" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <button
                type="button"
                onClick={onOpenAuthor}
                className="flex max-w-full items-center gap-1 text-left"
              >
                <span className="truncate text-[13.5px] font-semibold text-ink hover:underline">
                  {author.name}
                </span>
                {author.verified ? <VerifiedBadge /> : null}
              </button>
              <AuthorChip person={author} time={post.time} className="mt-0.5" />
            </div>
            <button
              type="button"
              aria-label="Post options"
              className="-mt-1 -mr-1 inline-flex h-7 w-7 items-center justify-center rounded-full text-faint transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <DotsThree size={15} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      {post.pinned || ae ? (
        <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2 sm:px-5">
          {post.pinned ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-canvas-deep px-1.5 py-0.5 text-[10px] font-medium text-muted">
              <PushPin size={9} strokeWidth={2} aria-hidden="true" />
              {" Pinned"}
            </span>
          ) : null}
          {ae ? (
            <button
              type="button"
              onClick={() => onOpenCircle?.(ae.id)}
              className="inline-flex items-center gap-1 rounded-full border border-forest/15 bg-forest-wash px-1.5 py-0.5 text-[10px] font-medium text-forest transition-colors hover:bg-forest-soft"
            >
              <UsersThree size={9} strokeWidth={2} aria-hidden="true" />{" "}
              {ae.name}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="px-4 pt-2.5 sm:px-5">
        <p className="text-[13px] leading-[1.65] text-ink-soft">
          {he}
          {Ne && !v ? (
            <button
              type="button"
              onClick={() => q(true)}
              className="ml-1 text-[12.5px] font-semibold text-forest hover:opacity-70"
            >
              more
            </button>
          ) : null}
        </p>
        {post.place ? (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-faint">
            <MapPin size={11} strokeWidth={1.8} aria-hidden="true" />
            {post.place}
          </p>
        ) : null}
      </div>
      {post.poll ? (
        <div className="mx-4 mt-3 rounded-xl border border-line bg-surface-muted/50 p-3 sm:mx-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-[0.05em] text-muted uppercase">
              Poll
            </p>
            <span className="text-[10.5px] text-faint">{post.poll.closes}</span>
          </div>
          <div className="space-y-1.5">
            {post.poll.options.map((pe?: any) => {
              const le = $ ? Math.round((pe.votes / $) * 100) : 0,
                Ee = ye === pe.id;
              return (
                <button
                  key={pe.id}
                  type="button"
                  disabled={!Ve}
                  onClick={() => onVote?.(pe.id)}
                  aria-pressed={Ee}
                  className={cn(
                    "relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-[7px] border px-2.5 py-2 text-left transition-colors",
                    Ee
                      ? "border-forest/35 bg-forest-wash"
                      : "border-line bg-surface",
                    Ve && "hover:border-forest/30 hover:bg-forest-wash/50",
                  )}
                >
                  {ye ? (
                    <span
                      className="absolute inset-y-0 left-0 bg-forest/[0.07]"
                      style={{
                        width: `${le}%`,
                      }}
                      aria-hidden="true"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative flex items-center gap-1.5 text-[11.5px] font-medium",
                      Ee ? "text-forest" : "text-ink-soft",
                    )}
                  >
                    {Ee ? (
                      <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-forest text-white">
                        <Smiley size={7} strokeWidth={3} aria-hidden="true" />
                      </span>
                    ) : null}
                    {pe.label}
                  </span>
                  {ye ? (
                    <span className="relative text-[11px] font-medium text-muted tabular-nums">
                      {le}%
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[10.5px] text-faint">
            {$.toLocaleString()}
            {" votes"}
            {ye ? " · you voted" : " · one vote each"}
          </p>
        </div>
      ) : null}
      {post.music ? (
        <div className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface-muted/60 p-2.5 sm:mx-5">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[8px]">
            <img
              src={post.music.art}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => U((pe?: any) => !pe)}
              aria-label={C ? "Pause preview" : "Play preview"}
              className="absolute inset-0 flex items-center justify-center bg-black/35 text-white transition-colors hover:bg-black/50"
            >
              {C ? (
                <Pause size={16} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <Play
                  size={16}
                  strokeWidth={2.2}
                  className="ml-0.5 fill-current"
                  aria-hidden="true"
                />
              )}
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">
              <MusicNotes size={10} strokeWidth={2} aria-hidden="true" />
              {" Now playing"}
            </p>
            <p className="mt-0.5 truncate text-[12.5px] font-semibold text-ink">
              {post.music.title}
            </p>
            <p className="truncate text-[11px] text-muted">
              {post.music.artist}
              {" · "}
              {post.music.duration}
            </p>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-line">
              <div
                className={cn(
                  "h-full rounded-full bg-forest transition-[width] duration-1000",
                  C ? "w-2/3" : "w-1/4",
                )}
              />
            </div>
          </div>
        </div>
      ) : null}
      {K ? (
        <div
          className="group relative mt-3 select-none overflow-hidden border-y border-line"
          onDoubleClick={() => {
            post.liked || onLike();
            te(true);
            window.setTimeout(() => te(false), 700);
          }}
        >
          <button
            type="button"
            onClick={onOpen}
            className="block w-full"
            aria-label="Open post"
          >
            <img
              src={K}
              alt={post.imageAlt ?? ""}
              className="img-reveal aspect-[5/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.012]"
              loading="lazy"
            />
          </button>
          {J ? (
            <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <span className="like-pop inline-flex h-16 w-16 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md">
                <Heart size={34} weight="fill" aria-hidden="true" />
              </span>
            </span>
          ) : null}
          <span className="pointer-events-none absolute bottom-2.5 left-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/80 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            Double-tap to like
          </span>
          {post.images.length > 1 ? (
            <>
              <span className="absolute top-2.5 right-2.5 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur tabular-nums">
                {_ + 1}/{post.images.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  j(
                    (pe?: any) =>
                      (pe - 1 + post.images.length) % post.images.length,
                  )
                }
                aria-label="Previous photo"
                className="absolute top-1/2 left-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
              >
                <CaretLeft size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => j((pe?: any) => (pe + 1) % post.images.length)}
                aria-label="Next photo"
                className="absolute top-1/2 right-2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white"
              >
                <CaretRight size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1">
                {post.images.map((pe?: any, le?: any) => (
                  <button
                    key={le}
                    type="button"
                    onClick={() => j(le)}
                    aria-label={`Go to photo ${le + 1}`}
                    className={cn(
                      "h-1.5 rounded-full bg-white transition-all",
                      le === _
                        ? "w-4 opacity-100"
                        : "w-1.5 opacity-55 hover:opacity-80",
                    )}
                  />
                ))}
              </div>
            </>
          ) : (
            <span className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-black/45 px-2 py-1 text-[10px] font-medium tracking-[0.04em] text-white/90 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
              View post
            </span>
          )}
        </div>
      ) : null}
      <div className="px-3 pt-1.5 pb-3.5 sm:px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <MediaFrame
              icon={Heart}
              label={post.liked ? "Unlike post" : "Like post"}
              count={post.likes}
              active={post.liked}
              activeClass="text-clay"
              onClick={onLike}
            />
            <MediaFrame
              icon={ChatCircle}
              label="View comments"
              count={post.comments.length}
              onClick={onOpen}
            />
            <MediaFrame
              icon={Repeat}
              label="Repost"
              count={post.reposts}
              onClick={onRepost}
            />
            <MediaFrame
              icon={PaperPlaneTilt}
              label="Share post"
              onClick={onOpen}
            />
          </div>
          <MediaFrame
            icon={BookmarkSimple}
            label={post.saved ? "Remove from saved" : "Save post"}
            active={post.saved}
            activeClass="text-forest"
            onClick={onSave}
          />
        </div>
        {post.comments.length ? (
          <button
            type="button"
            onClick={onOpen}
            className="mt-1 flex w-full items-start gap-1.5 text-left"
          >
            <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-line-strong" />
            <span className="text-[11.5px] leading-[1.5] text-muted">
              <span className="font-semibold text-ink-soft">
                {post.comments[0].authorId === "me"
                  ? "You"
                  : (people
                      ?.find((pe?: any) => pe.id === post.comments[0].authorId)
                      ?.name.split(" ")[0] ?? "Someone")}
              </span>{" "}
              {post.comments[0].text}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onComment}
            className="mt-1 pl-1 text-[11.5px] font-medium text-faint hover:text-forest"
          >
            Be the first to comment
          </button>
        )}
      </div>
    </article>
  );
}
export function ComposerPrompt({ person, onOpen }: any) {
  return (
    <section className="animate-rise rounded-t-2xl border border-line bg-surface px-4 py-3.5 sm:px-5">
      <div className="flex items-center gap-3">
        <Avatar person={person} size="md" />
        <button
          type="button"
          onClick={onOpen}
          className="h-9 min-w-0 flex-1 truncate rounded-full border border-line bg-surface-muted/60 px-3.5 text-left text-[13px] text-faint transition-colors hover:border-line-strong hover:bg-surface-muted"
        >
          <span className="hidden sm:inline">
            Share something with your circle…
          </span>
          <span className="sm:hidden">Share something…</span>
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-forest"
          aria-label="Add a photo"
        >
          <Image size={16} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-2.5 flex items-center gap-1 pl-12">
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 rounded-[7px] px-2 py-1 text-[11.5px] font-medium text-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <Image size={13} strokeWidth={1.8} aria-hidden="true" />
          {" Photo"}
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 rounded-[7px] px-2 py-1 text-[11.5px] font-medium text-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <Sparkle size={13} strokeWidth={1.8} aria-hidden="true" />
          {" Moment"}
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 rounded-[7px] px-2 py-1 text-[11.5px] font-medium text-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <Smiley size={13} strokeWidth={1.8} aria-hidden="true" />
          {" Feeling"}
        </button>
        <span className="ml-auto hidden text-[10.5px] text-faint sm:block">
          Your circle · Anyone can reply
        </span>
      </div>
    </section>
  );
}
export function StoriesStrip({
  stories,
  people,
  onOpen,
  onCreate,
  seenIds,
}: any) {
  const w = useRef<any>(null);
  return (
    <section className="animate-rise rounded-xl border border-line bg-surface px-3 py-3">
      <div className="mb-2 flex items-center justify-between px-1.5">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[12px] font-semibold tracking-[0.02em] text-ink">
            Stories
          </h2>
          <span className="rounded-full bg-canvas-deep px-1.5 py-0.5 text-[10px] font-medium text-muted">
            {stories.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            w.current?.scrollBy({
              left: 220,
              behavior: "smooth",
            })
          }
          className="inline-flex h-6 items-center gap-0.5 rounded-[6px] px-1.5 text-[10.5px] font-medium text-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          {"Scroll "}
          <CaretRight size={11} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <div
        ref={w}
        className="no-scrollbar flex gap-3.5 overflow-x-auto px-1 pb-0.5"
      >
        <button
          type="button"
          onClick={onCreate}
          className="flex w-[54px] shrink-0 flex-col items-center gap-1.5 text-center"
        >
          <span className="relative inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border border-dashed border-line-strong bg-surface-muted text-muted transition-colors hover:border-forest/40 hover:text-forest">
            <Plus size={17} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="w-full truncate text-[10.5px] font-medium text-muted">
            Add story
          </span>
        </button>
        {stories.map((A?: any) => {
          const T = people.find((g?: any) => g.id === A.authorId);
          if (!T) return null;
          const y = seenIds.includes(A.id);
          return (
            <button
              key={A.id}
              type="button"
              onClick={() => onOpen(A.id)}
              className="flex w-[54px] shrink-0 flex-col items-center gap-1.5 text-center"
            >
              <Avatar
                person={T}
                size="xl"
                ring
                seen={y}
                className="[&_img]:h-[52px] [&_img]:w-[52px]"
              />
              <span
                className={cn(
                  "w-full truncate text-[10.5px]",
                  y ? "font-medium text-faint" : "font-semibold text-ink-soft",
                )}
              >
                {A.authorId === "me" ? "Your story" : T.name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
export function StoryBubble({
  person,
  following,
  onToggleFollow,
  onOpen,
  note,
  showFollow = true,
}: any) {
  return (
    <div className="flex items-center gap-2.5">
      <button type="button" onClick={onOpen} aria-label={`View ${person.name}`}>
        <Avatar person={person} size="sm" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
      >
        <span className="flex items-center gap-1">
          <span className="truncate text-[12.5px] font-semibold text-ink hover:underline">
            {person.name}
          </span>
          {person.verified ? <VerifiedBadge className="h-3 w-3" /> : null}
        </span>
        <span className="mt-0.5 block truncate text-[10.5px] text-muted">
          {note ?? `@${person.handle}`}
        </span>
      </button>
      {showFollow ? (
        <FollowButton following={following} onChange={onToggleFollow} />
      ) : null}
    </div>
  );
}
export function TopicCard({ topic, onOpen }: any) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-2.5 rounded-[8px] px-1.5 py-1.5 text-left transition-colors hover:bg-surface-muted"
    >
      <img
        src={topic.image}
        alt=""
        className="h-8 w-8 shrink-0 rounded-[6px] object-cover"
        loading="lazy"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold text-ink">
          {topic.label}
        </span>
        <span className="mt-0.5 block truncate text-[10.5px] text-muted">
          #{topic.tag}
          {" · "}
          {topic.posts}
        </span>
      </span>
      <CaretRight
        size={12}
        strokeWidth={2}
        className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </button>
  );
}
export function RailSection({ title, action, children, className }: any) {
  return (
    <section
      className={cn("rounded-xl border border-line bg-surface", className)}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-2.5">
        <h2 className="text-[12px] font-semibold tracking-[0.01em] text-ink">
          {title}
        </h2>
        {action}
      </div>
      <div className="px-2.5 pb-2">{children}</div>
    </section>
  );
}
export function SuggestedPeopleList({ people, onOpen }: any) {
  return (
    <RailSection
      title={
        <span className="inline-flex items-center gap-1.5">
          <UsersThree
            size={12}
            strokeWidth={1.9}
            className="text-forest"
            aria-hidden="true"
          />
          In your circle
        </span>
      }
      action={
        <span className="text-[10.5px] text-faint">
          {people.length}
          {" active"}
        </span>
      }
    >
      <div className="flex items-center gap-1.5 px-1.5 pt-1 pb-2">
        {people.slice(0, 5).map((m?: any, d?: any) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onOpen(m.id)}
            className="-ml-1 transition-transform duration-200 first:ml-0 hover:-translate-y-0.5"
            aria-label={`View ${m.name}`}
            style={{
              zIndex: people.length - d,
            }}
          >
            <span className="inline-flex rounded-full ring-2 ring-surface">
              <Avatar person={m} size="sm" />
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onOpen("maya")}
          className="-ml-1 inline-flex h-8 items-center rounded-full bg-canvas-deep px-2 text-[10.5px] font-semibold text-muted ring-2 ring-surface hover:text-ink"
        >
          +{people.length - 5}
        </button>
      </div>
      <p className="px-1.5 pb-2 text-[11px] leading-[1.5] text-muted">
        Five friends are sharing something new today. Join the conversation.
      </p>
    </RailSection>
  );
}
export function EmptyState({
  icon: IconComp,
  title,
  description,
  action,
}: any) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface text-muted">
        <IconComp size={18} strokeWidth={1.7} aria-hidden="true" />
      </span>
      <p className="text-[13.5px] font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-[280px] text-[12.5px] leading-relaxed text-muted">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
export function ToastBanner({ title, description, onDismiss, action }: any) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-toast fixed right-4 bottom-4 z-[80] flex w-[calc(100vw-32px)] max-w-[360px] items-start gap-2.5 rounded-[12px] border border-line bg-surface p-3.5 shadow-[0_14px_40px_rgba(29,33,28,0.16)] sm:right-6 sm:bottom-6"
    >
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest text-white">
        <Sparkle size={11} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink">{title}</p>
        {description ? (
          <p className="mt-0.5 text-[11.5px] leading-[1.5] text-muted">
            {description}
          </p>
        ) : null}
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1.5 text-[11.5px] font-semibold text-forest hover:opacity-70"
          >
            {action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="-mt-1 -mr-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-faint hover:bg-surface-muted hover:text-ink"
      >
        <span className="text-[15px] leading-none">×</span>
      </button>
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = "md",
  bare = false,
}: any) {
  if (
    (useEffect(() => {
      if (!open) return;
      const g = (z?: any) => {
        z.key === "Escape" && onClose();
      };
      document.addEventListener("keydown", g);
      const R = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", g);
        document.body.style.overflow = R;
      };
    }, [open, onClose]),
    !open)
  )
    return null;
  const y = {
    sm: "max-w-[420px]",
    md: "max-w-[550px]",
    lg: "max-w-[860px]",
  };
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/30 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(g?: any) => {
        g.target === g.currentTarget && onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title == "string" ? title : "Dialog"}
        className={cn(
          "animate-pop flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-[0_24px_80px_rgba(29,33,28,0.2)] sm:rounded-xl",
          y[width],
        )}
      >
        {bare ? null : (
          <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
              <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-ink">
                {title}
              </h2>
              {description ? (
                <p className="mt-0.5 text-[12px] text-muted">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mt-1 -mr-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <span className="text-[18px] leading-none">×</span>
            </button>
          </div>
        )}
        <div className="thin-scrollbar flex-1 overflow-y-auto">{children}</div>
        {footer ? (
          <div className="border-t border-line px-4 py-3 sm:px-5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
