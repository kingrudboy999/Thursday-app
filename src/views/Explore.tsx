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
  posts = [],
  circles = [],
  meId = "me",
  onlineIds = [],
  followingIds,
  onToggleFollow,
  onOpenPerson,
  onOpenPost,
  onLike,
  onSave,
  onRepost,
  onVote,
  onOpenCircle,
}: any) {
  const [query, setQuery] = useState<any>(""),
    [activeTopic, setActiveTopic] = useState<any>("All"),
    topicLabels = ["All", ...TOPICS.map((t: any) => t.label)],
    search = query.trim().toLowerCase().replace(/^#/, "");

  // Live photo posts authored by real accounts (server-backed)
  const liveMoments = useMemo(() => {
    return (posts || [])
      .filter(
        (p: any) =>
          (p.images?.length || p.voice || p.text) &&
          p.authorId !== meId &&
          !people.find((x: any) => x.id === p.authorId)?.isSeedPhoto,
      )
      .map((p: any) => ({
        id: p.id,
        postId: p.id,
        image: p.images?.[0],
        title: p.text || "A moment shared in Thursday",
        authorId: p.authorId,
        topic: p.topic || p.circleId
          ? circles.find((c: any) => c.id === p.circleId)?.name || "Circles"
          : p.tags?.[0] || "Moments",
        createdAt: p.createdAt,
        live: true,
      }))
      .filter((m: any) => Boolean(m.image));
  }, [posts, people, circles, meId]);

  const curated = useMemo(
    () => EXPLORE_ITEMS.map((item: any) => ({ ...item, live: false })),
    [],
  );

  const allMoments = useMemo(
    () => [...liveMoments, ...curated],
    [liveMoments, curated],
  );

  const matchesTopic = (item: any) => {
    if (activeTopic === "All") return true;
    const topicMeta = TOPICS.find((t: any) => t.label === activeTopic);
    const needle = (topicMeta?.tag || activeTopic).toLowerCase();
    const hay = `${item.topic || ""} ${item.title || ""}`.toLowerCase();
    return hay.includes(needle) || item.topic === activeTopic;
  };

  const visibleMoments = useMemo(() => {
    return allMoments.filter((item: any) => {
      const author = people.find((p: any) => p.id === item.authorId);
      const textMatch =
        !search ||
        item.title?.toLowerCase().includes(search) ||
        item.topic?.toLowerCase().includes(search) ||
        author?.name?.toLowerCase().includes(search);
      return matchesTopic(item) && textMatch;
    });
  }, [allMoments, search, activeTopic, people]);

  const peopleMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? people.filter(
          (p: any) =>
            p.id !== meId &&
            (p.name?.toLowerCase().includes(q) ||
              p.handle?.toLowerCase().includes(q) ||
              p.bio?.toLowerCase().includes(q)),
        )
      : [];
  }, [query, people, meId]);

  const suggestions = people.filter(
    (p: any) => p.id !== meId && !followingIds.includes(p.id),
  );

  const liveCount = liveMoments.length;

  return (
    <div className="mx-auto w-full max-w-[1080px] px-4 pt-5 pb-10 sm:px-6 lg:px-8">
      <header className="animate-rise">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-forest" />
          <p className="text-[10.5px] font-semibold tracking-[0.13em] text-faint uppercase">
            Look around
          </p>
          {liveCount ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-forest/20 bg-forest-wash px-1.5 py-0.5 text-[10px] font-medium text-forest">
              <span className="h-1 w-1 animate-pulse rounded-full bg-forest" />
              {liveCount} new in real time
            </span>
          ) : null}
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
              value={query}
              onChange={(e: any) => setQuery(e.target.value)}
              placeholder="Search people, topics, moments"
              aria-label="Search explore"
              className="h-9 w-full rounded-[10px] border border-line bg-surface pr-8 pl-8.5 text-[12.5px] text-ink shadow-[0_1px_1px_rgba(29,33,28,0.02)] transition-colors placeholder:text-faint hover:border-line-strong focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/10"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
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
        {topicLabels.map((label: any) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTopic(label)}
            aria-pressed={activeTopic === label}
            className={cn(
              "h-7 shrink-0 rounded-full border px-3 text-[11.5px] font-medium transition-colors",
              activeTopic === label
                ? "border-forest bg-forest text-white"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {peopleMatches.length ? (
        <section className="animate-rise mt-5">
          <h2 className="mb-2 text-[12px] font-semibold text-ink">
            People matching “{query}”
          </h2>
          <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2">
            {peopleMatches.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5"
              >
                <button type="button" onClick={() => onOpenPerson(p.id)}>
                  <Avatar
                    person={p}
                    size="md"
                    online={onlineIds.includes(p.id)}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenPerson(p.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="flex items-center gap-1">
                    <span className="truncate text-[12.5px] font-semibold text-ink">
                      {p.name}
                    </span>
                    {p.verified ? <VerifiedBadge /> : null}
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] text-muted">
                    {onlineIds.includes(p.id) ? "Active now · " : ""}
                    {formatCount(p.followers)}
                    {" followers · @"}
                    {p.handle}
                  </span>
                </button>
                <FollowButton
                  following={followingIds.includes(p.id)}
                  onChange={() => onToggleFollow(p.id)}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <section className="animate-rise mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-ink">
            {activeTopic === "All" ? "Moments worth a look" : activeTopic}
          </h2>
          <span className="text-[10.5px] text-faint">
            {visibleMoments.length}
            {" results"}
          </span>
        </div>
        {visibleMoments.length ? (
          <div className="grid grid-cols-2 items-start gap-2.5 sm:grid-cols-3 sm:gap-3">
            {visibleMoments.map((m: any, i: number) => {
              const author = people.find((p: any) => p.id === m.authorId);
              return (
                <button
                  key={`${m.id ?? m.image}-${i}`}
                  type="button"
                  onClick={() =>
                    m.live && m.postId
                      ? onOpenPost?.(m.postId)
                      : onOpenPerson(m.authorId)
                  }
                  className="group relative block w-full overflow-hidden rounded-xl border border-line bg-surface text-left break-inside-avoid"
                  aria-label={`View moment by ${author?.name ?? "someone"}`}
                >
                  {/* Cards keep a tidy rhythm, but the photo inside is shown
                      whole rather than zoomed to fill a fixed height. */}
                  <img
                    src={m.image}
                    alt={m.title}
                    className={cn(
                      "w-full object-contain",
                      m.tall
                        ? "h-[280px] sm:h-[320px]"
                        : "h-[150px] sm:h-[178px]",
                    )}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#101318] backdrop-blur">
                    {m.live ? (
                      <span className="h-1 w-1 rounded-full bg-forest" />
                    ) : null}
                    {m.topic}
                  </div>
                  <div className="absolute right-0 bottom-0 left-0 p-3">
                    <p className="line-clamp-2 text-[12px] leading-snug font-medium text-white">
                      {m.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {author ? (
                        <img
                          src={author.avatar}
                          alt=""
                          className="h-4 w-4 rounded-full object-cover ring-1 ring-white/40"
                        />
                      ) : null}
                      <span className="truncate text-[10px] text-white/75">
                        {author?.name ?? "Thursday"}
                        {m.live && onlineIds.includes(m.authorId)
                          ? " · online now"
                          : ""}
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
                    setQuery("");
                    setActiveTopic("All");
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
      {search ? null : (
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
            {suggestions.slice(0, 4).map((p: any) => (
              <div
                key={p.id}
                className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-3"
              >
                <button type="button" onClick={() => onOpenPerson(p.id)}>
                  <Avatar
                    person={p}
                    size="lg"
                    online={onlineIds.includes(p.id)}
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onOpenPerson(p.id)}
                    className="flex max-w-full items-center gap-1 text-left"
                  >
                    <span className="truncate text-[12.5px] font-semibold text-ink">
                      {p.name}
                    </span>
                    {p.verified ? <VerifiedBadge /> : null}
                  </button>
                  <p className="mt-0.5 line-clamp-1 text-[10.5px] text-muted">
                    {onlineIds.includes(p.id) ? "Active now · " : ""}
                    {p.bio}
                  </p>
                </div>
                <FollowButton
                  following={followingIds.includes(p.id)}
                  onChange={() => onToggleFollow(p.id)}
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
  meId = "me",
  onlineIds = [],
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
