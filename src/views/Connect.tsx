import { useState } from "react";
import { cn } from "../lib/cn";
import {
  At,
  Bell,
  BellRinging,
  ChatCircle,
  Check,
  Heart,
  UserPlus,
} from "../lib/icons";
import { WeeklyRecapCard } from "../components/features";
import { Avatar, EmptyState } from "../components/social";

export function NotificationsView({
  notices,
  people,
  posts = [],
  followingIds = [],
  onToggleFollow,
  onOpenPost,
  onMarkAllRead,
  onOpenPerson,
}: any) {
  const [x, w] = useState<any>("all"),
    A = notices.filter((v?: any) =>
      x === "mentions"
        ? v.type === "mention" || v.type === "comment"
        : x === "follows"
          ? v.type === "follow"
          : true,
    ),
    T = notices.filter((v?: any) => v.unread).length,
    y = A.filter((v?: any) => !["Yesterday", "Mon", "Sun"].includes(v.time)),
    g = A.filter((v?: any) => ["Yesterday", "Mon", "Sun"].includes(v.time)),
    R = (v?: any) =>
      v === "like"
        ? Heart
        : v === "follow"
          ? UserPlus
          : v === "mention"
            ? At
            : ChatCircle,
    z = (v?: any) => {
      const Comp_q = R(v.type),
        _ = v.personIds
          .map((C?: any) => people.find((U?: any) => U.id === C))
          .filter((C?: any) => !!C),
        j = _[0];
      return (
        <div
          key={v.id}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (v.type === "follow" || !v.postId) {
              if (j) onOpenPerson(j.id);
              return;
            }
            const target = posts.find((po: any) => po.id === v.postId);
            if (target) onOpenPost?.(target);
            else if (j) onOpenPerson(j.id);
          }}
          onKeyDown={(e?: any) => {
            if (e?.key === "Enter" || e?.key === " ") {
              e.preventDefault();
              j && onOpenPerson(j.id);
            }
          }}
          className={cn(
            "cursor-pointer",

            "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors sm:px-5",
            v.unread
              ? "bg-forest-wash/60 hover:bg-forest-wash"
              : "hover:bg-surface-muted",
          )}
        >
          <span className="relative mt-0.5 shrink-0">
            <Avatar person={j} size="md" />
            <span
              className={cn(
                "absolute -right-1 -bottom-1 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-surface",
                v.type === "like"
                  ? "bg-clay text-white"
                  : v.type === "follow"
                    ? "bg-forest text-white"
                    : "bg-sand text-white",
              )}
            >
              <Comp_q size={8} strokeWidth={2.6} aria-hidden="true" />
            </span>
          </span>
          <span className="min-w-0 flex-1 pt-0.5">
            <span className="block text-[12.5px] leading-[1.55] text-ink-soft">
              <span className="font-semibold text-ink">{j?.name}</span>
              {_.length > 1 ? (
                <span className="font-medium text-ink">
                  {" "}
                  {"and "}
                  {_.length - 1} {_.length === 2 ? "other" : "others"}
                </span>
              ) : null}{" "}
              {v.text}
            </span>
            <span className="mt-1 block text-[10.5px] text-faint">
              {v.time}
            </span>
          </span>
          {v.postImage ? (
            <img
              src={v.postImage}
              alt=""
              className="h-10 w-10 shrink-0 rounded-[6px] border border-line object-cover"
              loading="lazy"
            />
          ) : v.type === "follow" ? (
            <button
              type="button"
              onClick={(e?: any) => {
                e?.stopPropagation?.();
                if (j) onToggleFollow?.(j.id);
              }}
              aria-pressed={j ? followingIds.includes(j.id) : false}
              className={cn(
                "h-7 shrink-0 rounded-[7px] border px-2.5 text-[11px] font-semibold leading-7 transition-colors",
                j && followingIds.includes(j.id)
                  ? "border-line-strong bg-surface text-muted"
                  : "border-forest bg-forest text-white hover:bg-forest-hover",
              )}
            >
              {j && followingIds.includes(j.id) ? "Following" : "Follow back"}
            </button>
          ) : null}
          {v.unread ? (
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-forest" />
          ) : null}
        </div>
      );
    };
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pt-5 pb-10 sm:px-6 lg:px-8">
      <header className="animate-rise mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-forest" />
            <p className="text-[10.5px] font-semibold tracking-[0.13em] text-faint uppercase">
              Activity
            </p>
          </div>
          <h1 className="text-[24px] leading-[1.15] font-semibold tracking-[-0.03em] text-ink sm:text-[27px]">
            Notifications
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            Everything happening with you and the people you follow.
          </p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          disabled={T === 0}
          className="inline-flex h-8 items-center gap-1.5 self-start rounded-[7px] border border-line bg-surface px-2.5 text-[11.5px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink disabled:opacity-45 sm:self-auto"
        >
          <Check size={12} strokeWidth={2.2} aria-hidden="true" />
          {T ? "Mark all read" : "All caught up"}
        </button>
      </header>
      <div className="animate-rise mb-3.5">
        <WeeklyRecapCard people={people} onOpen={onOpenPerson} />
      </div>
      <div className="animate-rise overflow-hidden rounded-xl border border-line bg-surface">
        <div className="flex items-center gap-1 border-b border-line px-3 py-2 sm:px-4">
          {[
            {
              value: "all",
              label: "All",
              count: notices.length,
            },
            {
              value: "mentions",
              label: "Mentions",
              count: notices.filter(
                (v?: any) => v.type === "mention" || v.type === "comment",
              ).length,
            },
            {
              value: "follows",
              label: "Follows",
              count: notices.filter((v?: any) => v.type === "follow").length,
            },
          ].map((v?: any) => (
            <button
              key={v.value}
              type="button"
              onClick={() => w(v.value)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-[7px] px-2.5 text-[11.5px] font-medium transition-colors",
                x === v.value
                  ? "bg-canvas-deep text-ink"
                  : "text-muted hover:bg-surface-muted hover:text-ink",
              )}
            >
              {v.label}
              <span className="text-[10px] text-faint tabular-nums">
                {v.count}
              </span>
            </button>
          ))}
          <span className="ml-auto hidden items-center gap-1.5 text-[10.5px] text-faint sm:flex">
            <BellRinging size={11} strokeWidth={1.9} aria-hidden="true" />
            {T}
            {" unread"}
          </span>
        </div>
        {A.length ? (
          <div>
            {y.length ? (
              <>
                <p className="border-b border-line bg-surface-muted/60 px-4 py-1.5 text-[10px] font-semibold tracking-[0.1em] text-faint uppercase sm:px-5">
                  Today
                </p>
                <div className="divide-y divide-line/70">{y.map(z)}</div>
              </>
            ) : null}
            {g.length ? (
              <>
                <p className="border-y border-line bg-surface-muted/60 px-4 py-1.5 text-[10px] font-semibold tracking-[0.1em] text-faint uppercase sm:px-5">
                  Earlier
                </p>
                <div className="divide-y divide-line/70">{g.map(z)}</div>
              </>
            ) : null}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="Nothing here yet"
            description="When people mention you or start following, you'll see it in this space."
          />
        )}
      </div>
      <p className="mt-3 text-center text-[10.5px] text-faint">
        Notifications are delivered quietly. Thursday never sends marketing
        email.
      </p>
    </div>
  );
}
