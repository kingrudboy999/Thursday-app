import { useMemo, useState } from "react";
import { cn } from "../lib/cn";
import {
  CalendarBlank,
  ChatCircle,
  Check,
  DotsThree,
  Image,
  LinkSimple,
  MapPin,
  PencilSimple,
  ShareNetwork,
  SquaresFour,
  UserPlus,
} from "../lib/icons";
import {
  ProfileVisitorsStrip,
  StoryHighlightsStrip,
} from "../components/features";
import {
  Avatar,
  EmptyState,
  PostCard,
  VerifiedBadge,
} from "../components/social";
import { STORY_HIGHLIGHTS } from "../lib/features";
import { formatCount } from "../lib/social";

export function ProfileView({
  person,
  isMe,
  posts,
  people,
  stories,
  onOpenStory,
  followingIds,
  onToggleFollow,
  onOpenPost,
  onLike,
  onSave,
  onRepost,
  onOpenPerson,
  onMessage,
  onShare,
  onEdit,
  circles,
  onVote,
  onOpenCircle,
  highlights = STORY_HIGHLIGHTS,
  visitors = [],
  onlineIds = [],
  onOpenHighlight,
  onAddHighlight,
  onToast,
}: any) {
  // A profile must never render a blank screen. If the person record is
  // missing (deleted, still syncing, or a stale id in the URL) we show a
  // recoverable state instead of throwing and unmounting the whole app.
  if (!person || !person.id) {
    return (
      <div className="mx-auto w-full max-w-[720px] px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-canvas-deep text-faint">
          <UserPlus size={22} />
        </div>
        <h2 className="text-[17px] font-semibold text-ink">
          This profile isn’t available
        </h2>
        <p className="mx-auto mt-1.5 max-w-[36ch] text-[13px] leading-relaxed text-muted">
          The person may have left Thursday, or the page is still catching up.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex h-9 items-center rounded-lg bg-forest px-4 text-[13px] font-semibold text-white transition-colors hover:bg-forest-hover"
        >
          Refresh
        </button>
      </div>
    );
  }

  const [te, Ne] = useState<any>("posts"),
    [menuOpen, setMenuOpen] = useState<boolean>(false),
    isOnline = onlineIds.includes(person.id),
    he = useMemo(
      () =>
        posts
          .filter((le?: any) => le.authorId === person.id)
          .slice()
          .sort((le?: any, Ee?: any) => +!!Ee.pinned - +!!le.pinned),
      [posts, person.id],
    ),
    K = posts.filter((le?: any) => le.liked),
    ae = he.flatMap((le?: any) =>
      (le.images ?? []).map((Ee?: any) => ({
        image: Ee,
        post: le,
      })),
    ),
    $ = followingIds.includes(person.id),
    ye = [
      {
        value: "posts",
        label: "Posts",
        count: he.length,
      },
      {
        value: "media",
        label: "Media",
        count: ae.length,
      },
      ...(isMe
        ? [
            {
              value: "likes",
              label: "Likes",
              count: K.length,
            },
          ]
        : []),
    ],
    Ve = te === "likes" ? K : he,
    pe = useMemo(() => {
      const le = stories ?? [];
      if (isMe) return le;
      const Ee = le.filter((Ce?: any) => Ce.authorId === person.id);
      return Ee.length
        ? Ee
        : le.filter((Ce?: any) => Ce.authorId !== person.id).slice(0, 4);
    }, [stories, isMe, person.id]);
  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pt-5 pb-10 sm:px-6 lg:px-8">
      <section className="animate-rise overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,19,24,0.04)]">
        <div className="relative">
          <img
            src={person.cover}
            alt=""
            className="h-[132px] w-full object-cover sm:h-[168px]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent" />
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={onShare}
              aria-label="Share profile"
              className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white/95 text-[#101318] shadow-sm backdrop-blur transition-colors hover:bg-white"
            >
              <ShareNetwork size={13} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-label="More profile options"
                aria-expanded={menuOpen}
                className="inline-flex h-7.5 w-7.5 items-center justify-center rounded-full bg-white/95 text-[#101318] shadow-sm backdrop-blur transition-colors hover:bg-white"
              >
                <DotsThree size={14} strokeWidth={2} aria-hidden="true" />
              </button>
              {menuOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close profile menu"
                    tabIndex={-1}
                  />
                  <div className="animate-pop absolute top-[calc(100%+6px)] right-0 z-40 w-[176px] rounded-[10px] border border-line bg-surface p-1 shadow-[0_12px_32px_rgba(29,33,28,0.16)]">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(`@${person.handle}`);
                        onToast?.("Handle copied", `@${person.handle} copied to clipboard.`);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[11.5px] text-ink-soft hover:bg-surface-muted"
                    >
                      Copy @{person.handle}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onShare();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[11.5px] text-ink-soft hover:bg-surface-muted"
                    >
                      Share profile
                    </button>
                    {isMe ? (
                      <button
                        type="button"
                        onClick={() => {
                          onEdit();
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[11.5px] text-ink-soft hover:bg-surface-muted"
                      >
                        Edit profile
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onMessage(person.id);
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[11.5px] text-ink-soft hover:bg-surface-muted"
                      >
                        Send message
                      </button>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 sm:px-5">
          <div className="flex items-end justify-between gap-3">
            <div className="-mt-9 sm:-mt-11">
              <span className="inline-flex rounded-full border-[3px] border-surface bg-surface">
                <Avatar
                  person={person}
                  size="xl"
                  online={isOnline}
                  className="[&_img]:h-[72px] [&_img]:w-[72px]"
                />
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 pb-1">
              {isMe ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line-strong bg-surface px-3 text-[12px] font-semibold text-ink-soft transition-colors hover:bg-surface-muted"
                >
                  <PencilSimple
                    size={12}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                  Edit profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onMessage(person.id)}
                    aria-label={`Message ${person.name}`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-line-strong bg-surface text-muted transition-colors hover:bg-surface-muted hover:text-ink"
                  >
                    <ChatCircle
                      size={14}
                      strokeWidth={1.9}
                      aria-hidden="true"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleFollow(person.id)}
                    aria-pressed={$}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-[8px] border px-3 text-[12px] font-semibold transition-colors",
                      $
                        ? "border-line-strong bg-surface text-muted hover:border-clay/30 hover:bg-clay-wash hover:text-clay"
                        : "border-forest bg-forest text-white hover:bg-forest-hover",
                    )}
                  >
                    {$ ? (
                      <Check size={12} strokeWidth={2.2} aria-hidden="true" />
                    ) : (
                      <UserPlus
                        size={12}
                        strokeWidth={2.1}
                        aria-hidden="true"
                      />
                    )}
                    {$ ? "Following" : "Follow"}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-center gap-1.5">
              <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
                {person.name}
              </h1>
              {person.verified ? <VerifiedBadge className="h-4 w-4" /> : null}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-muted">
              <span>@{person.handle}</span>
              {isOnline ? (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-forest">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest" />
                  Active now
                </span>
              ) : null}
            </p>
            <p className="mt-2.5 max-w-[540px] text-[13px] leading-[1.65] text-ink-soft">
              {person.bio}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} strokeWidth={1.8} aria-hidden="true" />
                {person.location}
              </span>
              <span className="inline-flex items-center gap-1 text-forest">
                <LinkSimple size={11} strokeWidth={1.8} aria-hidden="true" />
                {person.website}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarBlank size={11} strokeWidth={1.8} aria-hidden="true" />
                {person.joined}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <p className="text-[12px] text-muted">
                <span className="font-semibold text-ink">
                  {formatCount(person.following)}
                </span>{" "}
                following
              </p>
              <p className="text-[12px] text-muted">
                <span className="font-semibold text-ink">
                  {formatCount(person.followers)}
                </span>{" "}
                followers
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-soft px-2 py-0.5 text-[10px] font-medium text-forest">
                <span className="h-1 w-1 rounded-full bg-forest" />
                {isMe ? "Your profile" : $ ? "In your circle" : "New to you"}
              </span>
            </div>
          </div>
        </div>
        <StoryHighlightsStrip
          highlights={highlights}
          onOpen={(hl?: any) => {
            if (onOpenHighlight && hl) {
              onOpenHighlight(hl);
            } else {
              onOpenStory?.(pe[0]?.id ?? "");
            }
          }}
          onAdd={isMe ? onAddHighlight ?? onEdit : undefined}
        />
        <div className="flex items-center gap-1 border-t border-line px-3 sm:px-4">
          {ye.map((le?: any) => (
            <button
              key={le.value}
              type="button"
              onClick={() => Ne(le.value)}
              className={cn(
                "relative inline-flex h-10 items-center gap-1.5 px-3 text-[12px] font-semibold transition-colors",
                te === le.value ? "text-ink" : "text-muted hover:text-ink",
              )}
            >
              {le.label}
              <span className="text-[10px] font-medium text-faint tabular-nums">
                {le.count}
              </span>
              {te === le.value ? (
                <span className="absolute right-2 bottom-0 left-2 h-[2px] rounded-full bg-forest" />
              ) : null}
            </button>
          ))}
        </div>
      </section>
      <div className="mt-3.5">
        <ProfileVisitorsStrip
          people={people}
          visitors={visitors}
          onOpen={onOpenPerson}
        />
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        {te === "media" ? (
          ae.length ? (
            <div className="grid grid-cols-2 gap-1 p-1 sm:grid-cols-3">
              {ae.map((le?: any, Ee?: any) => (
                <button
                  key={`${le.image}-${Ee}`}
                  type="button"
                  onClick={() => onOpenPost(le.post)}
                  className="group relative aspect-square overflow-hidden rounded-[6px]"
                  aria-label="Open post media"
                >
                  <img
                    src={le.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Image}
              title="No photos yet"
              description={
                isMe
                  ? "Photos from your posts will live here."
                  : `${person.name.split(" ")[0]} hasn't shared any photos yet.`
              }
            />
          )
        ) : Ve.length ? (
          Ve.map((le?: any) => (
            <PostCard
              key={le.id}
              post={le}
              author={person}
              people={people}
              circles={circles}
              onOpen={() => onOpenPost(le)}
              onLike={() => onLike(le.id)}
              onSave={() => onSave(le.id)}
              onRepost={() => onRepost(le.id)}
              onOpenAuthor={() => onOpenPerson(person.id)}
              onComment={() => onOpenPost(le)}
              onVote={(Ee?: any) => onVote?.(le.id, Ee)}
              onOpenCircle={onOpenCircle}
            />
          ))
        ) : (
          <EmptyState
            icon={te === "likes" ? Check : SquaresFour}
            title={te === "likes" ? "No liked posts yet" : "No posts yet"}
            description={
              isMe
                ? "Share a first moment with your circle. It doesn't need to be polished."
                : `${person.name.split(" ")[0]} is still finding the words. Check back soon.`
            }
          />
        )}
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <p className="text-[10.5px] text-faint">
          {isMe
            ? "Only you can see your likes."
            : "Public profile · Visible to everyone on Thursday"}
        </p>
        <div className="flex items-center gap-1.5 text-[10px] text-faint">
          <span className="h-1 w-1 rounded-full bg-forest/60" />
          {"Joined "}
          {person.joined.replace("Joined ", "")}
        </div>
      </div>
    </div>
  );
}
