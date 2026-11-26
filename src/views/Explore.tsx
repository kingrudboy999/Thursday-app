import { useMemo, useState } from "react";
import { cn } from "../lib/cn";
import {
  BookmarkSimple,
  Heart,
  MagnifyingGlass,
  Sparkle,
  X,
} from "../lib/icons";
import {
  Avatar,
  EmptyState,
  FollowButton,
  PostCard,
  VerifiedBadge,
} from "../components/social";
import { EXPLORE_ITEMS, TOPICS, formatCount } from "../lib/social";

export function ExploreView({
  people,
  followingIds,
  onToggleFollow,
  onOpenPerson,
}: any) {
  const [x, w] = useState<any>(""),
    [A, T] = useState<any>("All"),
    y = ["All", ...TOPICS.map((v?: any) => v.label)],
    g = useMemo(() => {
      const v = x.trim().toLowerCase();
      return EXPLORE_ITEMS.filter((q?: any) => {
        const _ = A === "All" || q.topic === A,
          j =
            !v ||
            q.title.toLowerCase().includes(v) ||
            q.topic.toLowerCase().includes(v) ||
            (people
              .find((C?: any) => C.id === q.authorId)
              ?.name.toLowerCase()
              .includes(v) ??
              false);
        return _ && j;
      });
    }, [x, A, people]),
    R = useMemo(() => {
      const v = x.trim().toLowerCase();
      return v
        ? people.filter(
            (q?: any) =>
              q.id !== "me" &&
              (q.name.toLowerCase().includes(v) ||
                q.handle.toLowerCase().includes(v) ||
                q.bio.toLowerCase().includes(v)),
          )
        : [];
    }, [x, people]),
    z = people.filter(
      (v?: any) => v.id !== "me" && !followingIds.includes(v.id),
    );
  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 pt-5 pb-10 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-forest" />
          <p className="text-[10.5px] font-semibold tracking-[0.13em] text-faint uppercase">
            Look around
          </p>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-[24px] leading-[1.15] font-semibold tracking-[-0.03em] text-ink sm:text-[27px]">
              Explore
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Good things made and found by people in your circle.
            </p>
          </div>
          <div className="relative w-full sm:w-[300px]">
            <MagnifyingGlass
              size={15}
              strokeWidth={1.9}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
              aria-hidden="true"
            />
            <input
              value={x}
              onChange={(v?: any) => w(v.target.value)}
              placeholder="Search people, topics, moments"
              aria-label="Search explore"
              className="h-9 w-full rounded-[10px] border border-line bg-surface pr-8 pl-8.5 text-[12.5px] text-ink shadow-[0_1px_1px_rgba(29,33,28,0.02)] transition-colors placeholder:text-faint hover:border-line-strong focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/10"
            />
            {x ? (
              <button
                type="button"
                onClick={() => w("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-faint hover:bg-canvas-deep hover:text-ink"
              >
                <X size={12} strokeWidth={2} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <div className="no-scrollbar animate-rise mt-4 flex gap-1.5 overflow-x-auto pb-1">
        {y.map((v?: any) => (
          <button
            key={v}
            type="button"
            onClick={() => T(v)}
            aria-pressed={A === v}
            className={cn(
              "h-7 shrink-0 rounded-full border px-3 text-[11.5px] font-medium transition-colors",
              A === v
                ? "border-forest bg-forest text-white"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {v}
          </button>
        ))}
      </div>
      {R.length ? (
        <section className="animate-rise mt-5">
          <h2 className="mb-2 text-[12px] font-semibold text-ink">
            People matching “{x}”
          </h2>
          <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
            {R.map((v?: any) => (
              <div
                key={v.id}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5"
              >
                <button type="button" onClick={() => onOpenPerson(v.id)}>
                  <Avatar person={v} size="md" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPerson(v.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="flex items-center gap-1">
                    <span className="truncate text-[12.5px] font-semibold text-ink">
                      {v.name}
                    </span>
                    {v.verified ? <VerifiedBadge /> : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-muted">
                    {formatCount(v.followers)}
                    {" followers · @"}
                    {v.handle}
                  </span>
                </button>
                <FollowButton
                  following={followingIds.includes(v.id)}
                  onChange={() => onToggleFollow(v.id)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="animate-rise mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-ink">
            {A === "All" ? "Moments worth a look" : A}
          </h2>
          <span className="text-[10.5px] text-faint">
            {g.length}
            {" results"}
          </span>
        </div>
        {g.length ? (
          <div className="grid grid-cols-2 items-start gap-2.5 sm:grid-cols-3 sm:gap-3">
            {g.map((v?: any, q?: any) => {
              const _ = people.find((j?: any) => j.id === v.authorId);
              return (
                <button
                  key={`${v.image}-${q}`}
                  type="button"
                  onClick={() => onOpenPerson(v.authorId)}
                  className="group relative block w-full overflow-hidden rounded-xl border border-line bg-surface text-left break-inside-avoid"
                  aria-label={`View moment by ${_?.name}`}
                >
                  <img
                    src={v.image}
                    alt={v.title}
                    className={cn(
                      "w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]",
                      v.tall
                        ? "h-[280px] sm:h-[320px]"
                        : "h-[150px] sm:h-[178px]",
                    )}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                  <div className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#101318] backdrop-blur">
                    {v.topic}
                  </div>
                  <div className="absolute right-0 bottom-0 left-0 p-3">
                    <p className="line-clamp-2 text-[12px] leading-snug font-medium text-white">
                      {v.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {_ ? (
                        <img
                          src={_.avatar}
                          alt=""
                          className="h-4 w-4 rounded-full object-cover ring-1 ring-white/40"
                        />
                      ) : null}
                      <span className="truncate text-[10px] text-white/75">
                        {_?.name}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-surface">
            <EmptyState
              icon={MagnifyingGlass}
              title="Nothing here for that search"
              description="Try another topic, or clear the search to see everything happening in Thursday."
              action={
                <button
                  type="button"
                  onClick={() => {
                    w("");
                    T("All");
                  }}
                  className="h-8 rounded-[7px] border border-line-strong bg-surface px-3 text-[12px] font-semibold text-ink-soft hover:bg-surface-muted"
                >
                  Show everything
                </button>
              }
            />
          </div>
        )}
      </section>
      {x ? null : (
        <section className="animate-rise mt-7">
          <div className="mb-3 flex items-center gap-2">
            <Sparkle
              size={14}
              strokeWidth={1.9}
              className="text-forest"
              aria-hidden="true"
            />
            <h2 className="text-[13px] font-semibold text-ink">
              People you may know
            </h2>
          </div>
          <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
            {z.slice(0, 4).map((v?: any) => (
              <div
                key={v.id}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-3"
              >
                <button type="button" onClick={() => onOpenPerson(v.id)}>
                  <Avatar person={v} size="lg" />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onOpenPerson(v.id)}
                    className="flex max-w-full items-center gap-1 text-left"
                  >
                    <span className="truncate text-[12.5px] font-semibold text-ink">
                      {v.name}
                    </span>
                    {v.verified ? <VerifiedBadge /> : null}
                  </button>
                  <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted">
                    {v.bio}
                  </p>
                </div>
                <FollowButton
                  following={false}
                  onChange={() => onToggleFollow(v.id)}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
export function BookmarksView({
  posts,
  people,
  onLike,
  onSave,
  onRepost,
  onOpenPost,
  onOpenPerson,
  onExplore,
  circles,
  onVote,
  onOpenCircle,
}: any) {
  const z = posts.filter((v?: any) => v.saved);
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-5 pb-10 sm:px-6 lg:px-8">
      <header className="animate-rise mb-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-forest" />
          <p className="text-[10.5px] font-semibold tracking-[0.13em] text-faint uppercase">
            Collected
          </p>
        </div>
        <h1 className="text-[24px] leading-[1.15] font-semibold tracking-[-0.03em] text-ink sm:text-[27px]">
          Saved
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          {"The moments you wanted to keep, "}
          {z.length === 1 ? "one post" : `${z.length} posts`}
          {" collected."}
        </p>
      </header>
      <div className="animate-rise overflow-hidden rounded-xl border border-line bg-surface">
        {z.length ? (
          z.map((v?: any) => {
            const q = people.find((_?: any) => _.id === v.authorId);
            return q ? (
              <PostCard
                key={v.id}
                post={v}
                author={q}
                people={people}
                circles={circles}
                onOpen={() => onOpenPost(v)}
                onLike={() => onLike(v.id)}
                onSave={() => onSave(v.id)}
                onRepost={() => onRepost(v.id)}
                onOpenAuthor={() => onOpenPerson(q.id)}
                onComment={() => onOpenPost(v)}
                onVote={(_?: any) => onVote?.(v.id, _)}
                onOpenCircle={onOpenCircle}
              />
            ) : null;
          })
        ) : (
          <EmptyState
            icon={BookmarkSimple}
            title="Nothing saved yet"
            description="Tap the bookmark on any post to keep it here. Good for recipes, trails, and things you want to come back to."
            action={
              <button
                type="button"
                onClick={onExplore}
                className="inline-flex h-8 items-center gap-1.5 rounded-[7px] bg-forest px-3 text-[12px] font-semibold text-white hover:bg-forest-hover"
              >
                <Heart size={12} strokeWidth={2} aria-hidden="true" />
                Find something to save
              </button>
            }
          />
        )}
      </div>
      {z.length ? (
        <p className="mt-3 text-center text-[10.5px] text-faint">
          Saved posts are private to you. Only you can see this collection.
        </p>
      ) : null}
    </div>
  );
}
