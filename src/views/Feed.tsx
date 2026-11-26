import { useMemo, useState } from "react";
import { cn } from "../lib/cn";
import {
  ArrowRight,
  CalendarBlank,
  CaretDown,
  Compass,
  Play,
  Plus,
  Sparkle,
  UsersThree,
} from "../lib/icons";
import {
  GuideCard,
  ThursdayPromptCard,
  WeeklyRecapCard,
} from "../components/features";
import {
  Avatar,
  ComposerPrompt,
  EmptyState,
  PostCard,
  RailSection,
  StoriesStrip,
  StoryBubble,
  SuggestedPeopleList,
  TopicCard,
} from "../components/social";
import { CIRCLE_GUIDES, THURSDAY_PROMPTS } from "../lib/features";
import { SUGGESTED_PERSON_IDS, TOPICS, formatCount } from "../lib/social";
import { FEED_TABS, WEEKLY_PROMPT_BANNER } from "../lib/spaces";

export function FeedView({
  me,
  people,
  posts,
  stories,
  circles,
  events,
  reels,
  followingIds,
  seenStories,
  onToggleFollow,
  onLike,
  onSave,
  onRepost,
  onVote,
  onOpenPost,
  onOpenPerson,
  onOpenCircle,
  onOpenCircles,
  onOpenEvents,
  onOpenReels,
  onCompose,
  onOpenStory,
  onCreateStory,
  onExplore,
}: any) {
  const [$, ye] = useState<any>("for-you"),
    [Ve, pe] = useState<any>("latest"),
    [le, Ee] = useState<any>(false),
    [Ce, He] = useState<any>(null),
    V = circles.filter((h?: any) => h.joined),
    W = useMemo(() => {
      let h = posts;
      $ === "following"
        ? (h = posts.filter(
            (k?: any) =>
              k.authorId === "me" || followingIds.includes(k.authorId),
          ))
        : $ === "photos"
          ? (h = posts.filter((k?: any) => k.images.length > 0))
          : $ === "circles" && (h = posts.filter((k?: any) => k.circleId));
      return Ve === "top"
        ? [...h].sort((k?: any, D?: any) => D.likes - k.likes)
        : [...h];
    }, [$, posts, followingIds, Ve]),
    G = SUGGESTED_PERSON_IDS.map((h?: any) =>
      people.find((k?: any) => k.id === h),
    ).filter((h?: any) => !!h),
    X_local = people.filter(
      (h?: any) => h.id !== "me" && followingIds.includes(h.id),
    ),
    se = events.filter((h?: any) => !h.joined).slice(0, 2);
  return (
    <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-6 px-4 pt-6 pb-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:pb-10">
      <div className="min-w-0">
        <header className="animate-rise mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-forest" />
              <p className="text-[10.5px] font-semibold tracking-[0.13em] text-faint uppercase">
                Thursday, 18 June
              </p>
            </div>
            <h1 className="text-[24px] leading-[1.15] font-semibold tracking-[-0.03em] text-ink sm:text-[27px]">
              Good morning, Nora.
            </h1>
            <p className="mt-1 text-[13px] text-muted">
              Here's what your circle is sharing today.
            </p>
          </div>
          <button
            type="button"
            onClick={onCompose}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-forest bg-forest px-3 text-[12.5px] font-semibold text-white shadow-[0_1px_2px_rgba(29,33,28,0.12)] transition-colors hover:bg-forest-hover lg:hidden"
          >
            <Plus size={14} strokeWidth={2.3} aria-hidden="true" />
            Post
          </button>
        </header>
        <div className="space-y-4">
          <StoriesStrip
            stories={stories}
            people={people}
            onOpen={onOpenStory}
            onCreate={onCreateStory}
            seenIds={seenStories}
          />
          <div className="animate-rise flex items-center gap-3 rounded-xl border border-forest/15 bg-forest-wash px-3.5 py-2.5">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest text-white">
              <Sparkle size={13} strokeWidth={2} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-semibold text-ink">
                {WEEKLY_PROMPT_BANNER.title}
              </p>
              <p className="truncate text-[10.5px] text-muted">
                {WEEKLY_PROMPT_BANNER.body}
              </p>
            </div>
            <button
              type="button"
              onClick={onCompose}
              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[6px] border border-forest/20 bg-surface px-2 text-[10.5px] font-semibold text-forest transition-colors hover:bg-forest-soft"
            >
              Reply
              <ArrowRight size={10} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,19,24,0.04)]">
            <ComposerPrompt person={me} onOpen={onCompose} />
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 sm:px-5">
              <div className="no-scrollbar flex items-center gap-3.5 overflow-x-auto">
                {FEED_TABS.map((h?: any) => (
                  <button
                    key={h.value}
                    type="button"
                    onClick={() => ye(h.value)}
                    aria-current={$ === h.value ? "page" : undefined}
                    className={cn(
                      "relative shrink-0 py-2.5 text-[12.5px] font-semibold transition-colors",
                      $ === h.value ? "text-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    {h.label}
                    {$ === h.value ? (
                      <span className="absolute right-0 bottom-0 left-0 h-[2px] rounded-full bg-forest" />
                    ) : null}
                  </button>
                ))}
              </div>
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => Ee((h?: any) => !h)}
                  aria-haspopup="menu"
                  aria-expanded={le}
                  className="inline-flex items-center gap-1 rounded-[6px] px-1.5 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface-muted hover:text-ink"
                >
                  {Ve === "latest" ? "Latest" : "Top"}
                  <CaretDown size={11} strokeWidth={2} aria-hidden="true" />
                </button>
                {le ? (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => Ee(false)}
                      aria-label="Close sort menu"
                      tabIndex={-1}
                    />
                    <div
                      role="menu"
                      className="animate-pop absolute top-[calc(100%+4px)] right-0 z-40 w-[128px] rounded-[10px] border border-line bg-surface p-1 shadow-[0_10px_28px_rgba(29,33,28,0.12)]"
                    >
                      {[
                        {
                          value: "latest",
                          label: "Latest first",
                        },
                        {
                          value: "top",
                          label: "Most liked",
                        },
                      ].map((h?: any) => (
                        <button
                          key={h.value}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            pe(h.value);
                            Ee(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-[6px] px-2 py-1.5 text-[11px] transition-colors hover:bg-surface-muted",
                            Ve === h.value
                              ? "font-semibold text-forest"
                              : "text-ink-soft",
                          )}
                        >
                          {h.label}
                          {Ve === h.value ? (
                            <span className="h-1 w-1 rounded-full bg-forest" />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            {$ === "circles" ? (
              <div className="flex items-center gap-2 border-b border-line bg-surface-muted/50 px-4 py-2 sm:px-5">
                <UsersThree
                  size={11}
                  strokeWidth={2}
                  className="text-forest"
                  aria-hidden="true"
                />
                <p className="min-w-0 flex-1 truncate text-[10.5px] text-muted">
                  {"Showing posts from "}
                  {V.length
                    ? V.map((h?: any) => h.name).join(" and ")
                    : "your circles"}
                </p>
                <button
                  type="button"
                  onClick={onOpenCircles}
                  className="shrink-0 text-[10.5px] font-semibold text-forest hover:opacity-70"
                >
                  Manage
                </button>
              </div>
            ) : null}
            {W.length ? (
              W.map((h?: any) => {
                const k = people.find((D?: any) => D.id === h.authorId);
                return k ? (
                  <PostCard
                    key={h.id}
                    post={h}
                    author={k}
                    people={people}
                    circles={circles}
                    onOpen={() => onOpenPost(h)}
                    onLike={() => onLike(h.id)}
                    onSave={() => onSave(h.id)}
                    onRepost={() => onRepost(h.id)}
                    onOpenAuthor={() => onOpenPerson(k.id)}
                    onComment={() => onOpenPost(h)}
                    onVote={(D?: any) => onVote(h.id, D)}
                    onOpenCircle={onOpenCircle}
                  />
                ) : null;
              })
            ) : (
              <EmptyState
                icon={
                  $ === "photos"
                    ? Compass
                    : $ === "circles"
                      ? UsersThree
                      : Compass
                }
                title={
                  $ === "photos"
                    ? "No photos in this view"
                    : $ === "circles"
                      ? "Your circles are quiet"
                      : "Your following feed is quiet"
                }
                description={
                  $ === "circles"
                    ? "Join a circle or share the first post. Small rooms are meant to be used."
                    : "Follow a few more people to bring their posts into this view."
                }
                action={
                  <button
                    type="button"
                    onClick={
                      $ === "circles" ? onOpenCircles : () => ye("for-you")
                    }
                    className="h-8 rounded-[7px] border border-line-strong bg-surface px-3 text-[12px] font-semibold text-ink-soft hover:bg-surface-muted"
                  >
                    {$ === "circles" ? "Find a circle" : "Back to For you"}
                  </button>
                }
              />
            )}
            {W.length ? (
              <div className="flex items-center justify-center gap-2 px-4 py-3 text-[10.5px] text-faint">
                <span className="h-1 w-1 rounded-full bg-forest/60" />
                You're all caught up for now
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-center gap-1.5 pb-2 text-[10.5px] text-faint">
            <span>Thursday keeps the noise down.</span>
            <button
              type="button"
              onClick={onOpenCircles}
              className="font-medium text-muted hover:text-forest"
            >
              Find your people
            </button>
          </div>
        </div>
      </div>
      <aside className="hidden space-y-4 lg:block">
        <RailSection
          title={
            <span className="inline-flex items-center gap-1.5">
              <Play
                size={11}
                strokeWidth={2.2}
                className="text-forest"
                aria-hidden="true"
              />
              Reels for you
            </span>
          }
          action={
            <button
              type="button"
              onClick={onOpenReels}
              className="text-[10.5px] font-semibold text-forest hover:opacity-70"
            >
              Watch
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-1.5 px-1 pt-0.5">
            {reels.slice(0, 2).map((h?: any) => {
              const k = people.find((D?: any) => D.id === h.authorId);
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={onOpenReels}
                  className="group relative aspect-[9/13] overflow-hidden rounded-[7px] border border-line text-left"
                  aria-label={`Watch reel by ${k?.name}`}
                >
                  <img
                    src={h.poster}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                  <span className="absolute top-1.5 left-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur">
                    <Play size={8} strokeWidth={3} className="fill-current" />
                  </span>
                  <span className="absolute right-1.5 bottom-1.5 left-1.5">
                    <span className="block truncate text-[8.5px] font-semibold text-white">
                      {k?.name.split(" ")[0]}
                    </span>
                    <span className="block truncate text-[7.5px] text-white/60">
                      {formatCount(h.views)}
                      {" views"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </RailSection>
        <ThursdayPromptCard
          prompt={THURSDAY_PROMPTS[0]}
          onVote={(h?: any) => He(h)}
        />
        {Ce ? (
          <p className="px-1 text-[10px] text-forest">
            {"Your circle answered: "}
            {Ce}
          </p>
        ) : null}
        <RailSection
          title={
            <span className="inline-flex items-center gap-1.5">
              <Sparkle
                size={11}
                weight="fill"
                className="text-forest"
                aria-hidden="true"
              />
              Guides
            </span>
          }
          action={<span className="text-[9.5px] text-faint">3 saved</span>}
        >
          <div className="space-y-1.5 px-1 pt-0.5">
            {CIRCLE_GUIDES.slice(0, 2).map((h?: any) => (
              <GuideCard key={h.id} guide={h} onOpen={() => onExplore()} />
            ))}
          </div>
        </RailSection>
        <WeeklyRecapCard people={people} onOpen={onOpenPerson} />
        <RailSection
          title="People to know"
          action={
            <button
              type="button"
              onClick={onExplore}
              className="text-[10.5px] font-semibold text-forest hover:opacity-70"
            >
              See all
            </button>
          }
        >
          <div className="space-y-2.5 px-1 pt-0.5">
            {G.slice(0, 3).map((h?: any) => (
              <StoryBubble
                key={h.id}
                person={h}
                following={followingIds.includes(h.id)}
                onToggleFollow={() => onToggleFollow(h.id)}
                onOpen={() => onOpenPerson(h.id)}
              />
            ))}
          </div>
          <div className="mt-2.5 border-t border-line px-1 pt-2.5 pb-1">
            <p className="text-[10.5px] leading-[1.5] text-muted">
              {"Followed by "}
              <span className="font-medium text-ink-soft">Maya and Priya</span>
            </p>
          </div>
        </RailSection>
        <RailSection
          title="Today in Thursday"
          action={<span className="text-[10.5px] text-faint">Live</span>}
        >
          <div className="space-y-0.5 px-0.5 pt-0.5">
            {TOPICS.slice(0, 3).map((h?: any) => (
              <TopicCard key={h.tag} topic={h} onOpen={onExplore} />
            ))}
          </div>
        </RailSection>
        <RailSection
          title={
            <span className="inline-flex items-center gap-1.5">
              <UsersThree
                size={12}
                strokeWidth={1.9}
                className="text-forest"
                aria-hidden="true"
              />
              Your circles
            </span>
          }
          action={
            <button
              type="button"
              onClick={onOpenCircles}
              className="text-[10.5px] font-semibold text-forest hover:opacity-70"
            >
              Browse
            </button>
          }
        >
          <div className="space-y-1 px-1 pt-0.5">
            {V.slice(0, 3).map((h?: any) => (
              <button
                key={h.id}
                type="button"
                onClick={() => onOpenCircle(h.id)}
                className="flex w-full items-center gap-2 rounded-[7px] px-1 py-1.5 text-left transition-colors hover:bg-surface-muted"
              >
                <img
                  src={h.image}
                  alt=""
                  className="h-8 w-8 rounded-[6px] object-cover"
                  loading="lazy"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-semibold text-ink">
                    {h.name}
                  </span>
                  <span className="block truncate text-[10px] text-muted">
                    {formatCount(h.members)}
                    {" members"}
                  </span>
                </span>
                <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
              </button>
            ))}
            {V.length ? null : (
              <p className="px-1 pb-1 text-[10.5px] text-muted">
                Join a circle to see it here.
              </p>
            )}
          </div>
        </RailSection>
        <RailSection
          title={
            <span className="inline-flex items-center gap-1.5">
              <CalendarBlank
                size={12}
                strokeWidth={1.9}
                className="text-forest"
                aria-hidden="true"
              />
              Coming up
            </span>
          }
          action={
            <button
              type="button"
              onClick={onOpenEvents}
              className="text-[10.5px] font-semibold text-forest hover:opacity-70"
            >
              All
            </button>
          }
        >
          <div className="space-y-1.5 px-1 pt-0.5">
            {se.map((h?: any) => (
              <button
                key={h.id}
                type="button"
                onClick={onOpenEvents}
                className="flex w-full items-start gap-2 rounded-[7px] px-1 py-1.5 text-left transition-colors hover:bg-surface-muted"
              >
                <span className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-[6px] border border-line bg-surface-muted">
                  <span className="text-[7px] font-semibold tracking-[0.06em] text-faint uppercase">
                    {h.weekday}
                  </span>
                  <span className="text-[11.5px] font-semibold leading-none text-ink tabular-nums">
                    {h.day}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-semibold text-ink">
                    {h.title}
                  </span>
                  <span className="block truncate text-[10px] text-faint">
                    {h.place}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </RailSection>
        <SuggestedPeopleList
          people={
            X_local.length ? X_local : people.filter((h?: any) => h.id !== "me")
          }
          onOpen={onOpenPerson}
        />
        <nav
          className="flex flex-wrap gap-x-3 gap-y-1 px-2 text-[10px] text-faint"
          aria-label="Footer"
        >
          {["About", "Guidelines", "Privacy", "Help"].map((h?: any) => (
            <button key={h} type="button" className="hover:text-muted">
              {h}
            </button>
          ))}
          <span>© 2026 Thursday</span>
        </nav>
      </aside>
      <div className="space-y-3 pb-4 lg:hidden">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold text-ink">Your circles</h2>
          <button
            type="button"
            onClick={onOpenCircles}
            className="text-[11px] font-semibold text-forest"
          >
            See all
          </button>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
          {V.map((h?: any) => (
            <button
              key={h.id}
              type="button"
              onClick={() => onOpenCircle(h.id)}
              className="w-[142px] shrink-0 overflow-hidden rounded-xl border border-line bg-surface text-left"
            >
              <img
                src={h.image}
                alt=""
                className="h-14 w-full object-cover"
                loading="lazy"
              />
              <span className="block px-2 py-1.5">
                <span className="block truncate text-[11px] font-semibold text-ink">
                  {h.name}
                </span>
                <span className="block text-[8.5px] text-muted">
                  {formatCount(h.members)}
                  {" members"}
                </span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={onOpenCircles}
            className="flex w-[110px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong text-[10.5px] font-medium text-muted"
          >
            <Plus size={14} strokeWidth={2} aria-hidden="true" />
            Find more
          </button>
        </div>
        <div className="flex items-center justify-between px-1 pt-1">
          <h2 className="text-[13px] font-semibold text-ink">Coming up</h2>
          <button
            type="button"
            onClick={onOpenEvents}
            className="text-[11px] font-semibold text-forest"
          >
            All gatherings
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          {events.slice(0, 2).map((h?: any) => (
            <button
              key={h.id}
              type="button"
              onClick={onOpenEvents}
              className="flex w-full items-center gap-2.5 border-b border-line/70 px-3 py-2.5 text-left last:border-b-0"
            >
              <span className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-[6px] border border-line bg-surface-muted">
                <span className="text-[7px] font-semibold uppercase text-faint">
                  {h.weekday}
                </span>
                <span className="text-[11px] font-semibold leading-none text-ink">
                  {h.day}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11.5px] font-medium text-ink">
                  {h.title}
                </span>
                <span className="block truncate text-[10px] text-faint">
                  {h.place}
                  {" · "}
                  {h.attendees}
                  {" going"}
                </span>
              </span>
              <ArrowRight size={12} className="text-faint" aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between rounded-xl border border-line bg-surface-muted/60 px-3 py-2.5">
          <div className="flex -space-x-2">
            {people.slice(1, 5).map((h?: any) => (
              <span key={h.id} className="rounded-full ring-2 ring-surface">
                <Avatar person={h} size="xs" />
              </span>
            ))}
          </div>
          <p className="text-[10px] text-faint">
            12,480 people making quieter internet
          </p>
        </div>
      </div>
    </div>
  );
}
