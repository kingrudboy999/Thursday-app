import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import {
  Bell,
  BookmarkSimple,
  CalendarBlank,
  CaretDown,
  CaretLeft,
  CaretRight,
  ChatCircle,
  Compass,
  EnvelopeSimple,
  GearSix,
  Heart,
  House,
  Image,
  List,
  MagnifyingGlass,
  MapPin,
  Moon,
  PaperPlaneTilt,
  Play,
  PlayCircle,
  Plus,
  Repeat,
  SlidersHorizontal,
  Sparkle,
  Sun,
  UserCircle,
  UsersThree,
  X,
} from "../lib/icons";
import { BrandLockup } from "./brand";
import {
  AudioLibraryModal,
  CloseFriendsPill,
  DraftsModal,
  PinPostButton,
  QuickReactionsBar,
} from "./features";
import {
  AuthorChip,
  Avatar,
  EmptyState,
  MediaFrame,
  Modal,
  VerifiedBadge,
} from "./social";
import { INITIAL_DRAFTS } from "../lib/features";
import { TOPICS, formatCount } from "../lib/social";

export const BROWSE_NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    icon: House,
  },
  {
    key: "explore",
    label: "Explore",
    icon: Compass,
  },
  {
    key: "reels",
    label: "Reels",
    icon: PlayCircle,
  },
  {
    key: "circles",
    label: "Circles",
    icon: UsersThree,
  },
  {
    key: "events",
    label: "Gatherings",
    icon: CalendarBlank,
  },
];
export const INBOX_NAV_ITEMS = [
  {
    key: "messages",
    label: "Messages",
    icon: EnvelopeSimple,
  },
  {
    key: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    key: "bookmarks",
    label: "Saved",
    icon: BookmarkSimple,
  },
];
export const ACCOUNT_NAV_ITEMS = [
  {
    key: "profile",
    label: "Profile",
    icon: UserCircle,
  },
  {
    key: "settings",
    label: "Settings",
    icon: GearSix,
  },
];
export const VIEW_TITLES = {
  home: "Home",
  explore: "Explore",
  reels: "Reels",
  circles: "Circles",
  events: "Gatherings",
  notifications: "Notifications",
  messages: "Messages",
  bookmarks: "Saved",
  profile: "Profile",
  settings: "Settings",
};
function SidebarNavItem({
  item,
  active,
  count,
  onClick,
  compact = false,
}: any) {
  const Comp_w = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-lg text-left transition-colors duration-150",
        compact ? "h-11 px-3 text-[13.5px]" : "h-9 px-3 text-[13px]",
        active
          ? "bg-forest-soft font-semibold text-forest"
          : "font-medium text-muted hover:bg-canvas-deep/70 hover:text-ink",
      )}
    >
      <Comp_w
        size={19}
        weight={active ? "fill" : "regular"}
        className={cn(
          "shrink-0",
          active ? "text-forest" : "text-faint group-hover:text-muted",
        )}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {count ? (
        <span
          className={cn(
            "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums",
            active ? "bg-forest text-white" : "bg-canvas-deep text-muted",
          )}
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </button>
  );
}
export function ThemeSegmentedControl({ theme, onChange }: any) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-line bg-canvas p-0.5",
      )}
      role="group"
      aria-label="Colour theme"
    >
      {[
        {
          value: "light",
          label: "Light",
          icon: Sun,
        },
        {
          value: "dark",
          label: "Dark",
          icon: Moon,
        },
      ].map((m?: any) => {
        const Comp_d = m.icon,
          x = theme === m.value;
        return (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            aria-pressed={x}
            aria-label={`${m.label} theme`}
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full transition-colors",
              x
                ? "bg-surface text-ink shadow-sm ring-1 ring-line"
                : "text-muted hover:text-ink",
            )}
          >
            <Comp_d
              size={13}
              weight={x ? "fill" : "regular"}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
export function DesktopSidebar({
  view,
  me,
  unreadNotices,
  unreadMessages,
  followingIds,
  people,
  circles,
  events,
  theme,
  onToggleTheme,
  onNavigate,
  onCreate,
  onOpenPerson,
}: any) {
  const q = people.filter(
      (j?: any) => j.id !== "me" && followingIds.includes(j.id),
    ),
    _ = (j?: any) =>
      j === "notifications"
        ? unreadNotices
        : j === "messages"
          ? unreadMessages
          : 0;
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden h-[100dvh] w-[264px] flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          aria-label="Thursday home"
        >
          <BrandLockup />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-3">
          <button
            type="button"
            onClick={onCreate}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-forest text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-forest-hover"
          >
            <Plus size={16} weight="bold" aria-hidden="true" />
            Create post
          </button>
        </div>
        <nav
          className="thin-scrollbar mt-4 min-h-0 flex-1 overflow-y-auto px-3 pb-4"
          aria-label="Main"
        >
          <div className="space-y-0.5">
            {BROWSE_NAV_ITEMS.map((j?: any) => (
              <SidebarNavItem
                key={j.key}
                item={j}
                active={view === j.key}
                count={_(j.key)}
                onClick={() => onNavigate(j.key)}
              />
            ))}
          </div>
          <div className="my-4 h-px bg-line" />
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
            Inbox
          </p>
          <div className="space-y-0.5">
            {INBOX_NAV_ITEMS.map((j?: any) => (
              <SidebarNavItem
                key={j.key}
                item={j}
                active={view === j.key}
                count={_(j.key)}
                onClick={() => onNavigate(j.key)}
              />
            ))}
          </div>
          <div className="my-4 h-px bg-line" />
          <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
            Account
          </p>
          <div className="space-y-0.5">
            {ACCOUNT_NAV_ITEMS.map((j?: any) => (
              <SidebarNavItem
                key={j.key}
                item={j}
                active={view === j.key}
                onClick={() => onNavigate(j.key)}
              />
            ))}
          </div>
          <div className="my-4 h-px bg-line" />
          <div className="px-1">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
                Following
              </p>
              <button
                type="button"
                onClick={() => onNavigate("explore")}
                className="text-[12px] font-medium text-muted hover:text-forest"
              >
                Find
              </button>
            </div>
            {q.slice(0, 3).map((j?: any) => (
              <button
                key={j.id}
                type="button"
                onClick={() => onOpenPerson(j.id)}
                className="flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left transition-colors hover:bg-canvas-deep/70"
              >
                <Avatar
                  person={j}
                  size="xs"
                  online={j.id === "maya" || j.id === "priya"}
                />
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-soft">
                  {j.name}
                </span>
                <CaretRight
                  size={12}
                  className="shrink-0 text-faint"
                  aria-hidden="true"
                />
              </button>
            ))}
            {q.length === 0 ? (
              <p className="px-2 text-[12px] leading-relaxed text-faint">
                Follow people to build your circle.
              </p>
            ) : null}
          </div>
          <div className="my-4 h-px bg-line" />
          <div className="px-1">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
                Your circles
              </p>
              <button
                type="button"
                onClick={() => onNavigate("circles")}
                className="text-[12px] font-medium text-muted hover:text-forest"
              >
                All
              </button>
            </div>
            {circles
              .filter((j?: any) => j.joined)
              .slice(0, 3)
              .map((j?: any) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => onNavigate("circles")}
                  className="flex h-9 w-full items-center gap-2.5 rounded-md px-2 text-left transition-colors hover:bg-canvas-deep/70"
                >
                  <img
                    src={j.image}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-[5px] object-cover"
                    loading="lazy"
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-soft">
                    {j.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-faint tabular-nums">
                    {formatCount(j.members)}
                  </span>
                </button>
              ))}
            {circles.filter((j?: any) => j.joined).length === 0 ? (
              <p className="px-2 text-[12px] leading-relaxed text-faint">
                Join a circle to see it here.
              </p>
            ) : null}
          </div>
          <div className="my-4 h-px bg-line" />
          <div className="px-1">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
                Coming up
              </p>
              <button
                type="button"
                onClick={() => onNavigate("events")}
                className="text-[12px] font-medium text-muted hover:text-forest"
              >
                All
              </button>
            </div>
            {events.slice(0, 2).map((j?: any) => (
              <button
                key={j.id}
                type="button"
                onClick={() => onNavigate("events")}
                className="flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-canvas-deep/70"
              >
                <span className="flex h-8 w-8 shrink-0 flex-col items-center justify-center rounded-md border border-line bg-canvas">
                  <span className="text-[8px] font-semibold tracking-[0.06em] text-faint uppercase">
                    {j.weekday}
                  </span>
                  <span className="text-[11px] font-semibold leading-none text-ink tabular-nums">
                    {j.day}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-medium text-ink-soft">
                    {j.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-faint">
                    {j.time}
                    {" · "}
                    {j.attendees}
                    {" going"}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <div className="my-4 h-px bg-line" />
          <div className="px-1">
            <p className="mb-2 px-2 text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
              Topics
            </p>
            <div className="flex flex-wrap gap-1.5 px-1">
              {TOPICS.slice(0, 4).map((j?: any) => (
                <button
                  key={j.tag}
                  type="button"
                  onClick={() => onNavigate("explore")}
                  className="rounded-full border border-line bg-canvas px-2 py-1 text-[11.5px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
                >
                  #{j.tag}
                </button>
              ))}
            </div>
          </div>
          <div className="h-8" />
        </nav>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface via-surface/70 via-45% to-transparent" />
      </div>
      <div className="shrink-0 border-t border-line p-3">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
            Theme
          </p>
          <ThemeSegmentedControl theme={theme} onChange={onToggleTheme} />
        </div>
        <button
          type="button"
          onClick={() => onOpenPerson("me")}
          className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-canvas-deep/70"
        >
          <Avatar person={me} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-semibold text-ink">
              {me.name}
            </span>
            <span className="block truncate text-[12px] text-muted">
              @{me.handle}
            </span>
          </span>
          <GearSix
            size={16}
            className="shrink-0 text-faint"
            aria-hidden="true"
          />
        </button>
      </div>
    </aside>
  );
}
export function TopBar({
  view,
  me,
  unreadNotices,
  unreadMessages,
  onSearch,
  onNavigate,
  onOpenPerson,
  mobileNavOpen,
  onOpenMobile,
}: any) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center gap-2 px-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenMobile}
          aria-label="Open navigation"
          aria-expanded={mobileNavOpen}
          className="-ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas-deep hover:text-ink lg:hidden"
        >
          <List size={21} aria-hidden="true" />
        </button>
        <div className="lg:hidden">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            aria-label="Thursday home"
          >
            <BrandLockup compact />
          </button>
        </div>
        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <span className="text-[13px] font-medium text-faint">Thursday</span>
          <span className="text-line-strong">/</span>
          <span className="truncate text-[13px] font-semibold text-ink">
            {VIEW_TITLES[view]}
          </span>
        </div>
        <div className="flex flex-1 justify-center px-1 sm:px-3">
          <button
            type="button"
            onClick={onSearch}
            className="hidden h-9 w-full max-w-[360px] items-center gap-2.5 rounded-lg border border-line bg-canvas px-3 text-left text-[13px] text-faint transition-colors hover:border-line-strong hover:bg-surface sm:flex"
            aria-label="Search Thursday"
          >
            <MagnifyingGlass size={15} aria-hidden="true" />
            <span className="flex-1 truncate">
              Search people, posts, or topics
            </span>
            <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[11px] font-medium text-faint">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={onSearch}
            aria-label="Search Thursday"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas-deep hover:text-ink sm:hidden"
          >
            <MagnifyingGlass size={19} aria-hidden="true" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onNavigate("messages")}
            aria-label="Messages"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas-deep hover:text-ink"
          >
            <EnvelopeSimple size={19} aria-hidden="true" />
            {unreadMessages ? (
              <span className="pulse-dot absolute top-2 right-2 h-2 w-2 rounded-full bg-clay ring-2 ring-surface" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onNavigate("notifications")}
            aria-label="Notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas-deep hover:text-ink"
          >
            <Bell size={19} aria-hidden="true" />
            {unreadNotices ? (
              <span className="pulse-dot absolute top-2 right-2 h-2 w-2 rounded-full bg-clay ring-2 ring-surface" />
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onOpenPerson("me")}
            aria-label="Your profile"
            className="ml-1.5 hidden rounded-full ring-1 ring-line transition-shadow hover:ring-line-strong sm:block"
          >
            <Avatar person={me} size="sm" />
          </button>
        </div>
      </div>
    </header>
  );
}
export function MobileBottomDock({ view, onNavigate, onCreate }: any) {
  const d = [
    {
      key: "home",
      label: "Home",
      icon: House,
    },
    {
      key: "explore",
      label: "Explore",
      icon: Compass,
    },
    {
      key: "reels",
      label: "Reels",
      icon: PlayCircle,
    },
    {
      key: "profile",
      label: "Profile",
      icon: UserCircle,
    },
  ];
  return (
    <nav
      aria-label="Mobile tabs"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto grid h-[60px] w-full max-w-[520px] grid-cols-5 items-center justify-items-center px-1">
        <MobileDockButton
          item={d[0]}
          active={view === d[0].key}
          onNavigate={onNavigate}
        />
        <MobileDockButton
          item={d[1]}
          active={view === d[1].key}
          onNavigate={onNavigate}
        />
        <button
          type="button"
          onClick={onCreate}
          aria-label="Create a post"
          className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-ink"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-forest text-white shadow-md transition-colors hover:bg-forest-hover">
            <Plus size={18} weight="bold" aria-hidden="true" />
          </span>
          <span className="leading-none">Create</span>
        </button>
        <MobileDockButton
          item={d[2]}
          active={view === d[2].key}
          onNavigate={onNavigate}
        />
        <MobileDockButton
          item={d[3]}
          active={view === d[3].key}
          onNavigate={onNavigate}
        />
      </div>
    </nav>
  );
}
function MobileDockButton({ item, active, onNavigate }: any) {
  const Comp_d = item.icon;
  return (
    <button
      type="button"
      onClick={() => onNavigate(item.key)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
        active ? "text-forest" : "text-faint hover:text-ink",
      )}
    >
      <span
        className={cn(
          "inline-flex h-7 w-9 items-center justify-center rounded-lg transition-colors",
          active && "bg-forest-soft",
        )}
      >
        <Comp_d
          size={19}
          weight={active ? "fill" : "regular"}
          aria-hidden="true"
        />
      </span>
      <span className="leading-none">{item.label}</span>
    </button>
  );
}
export function MobileDrawer({
  open,
  onClose,
  view,
  me,
  unreadNotices,
  unreadMessages,
  followingIds,
  people,
  circles,
  events,
  theme,
  onToggleTheme,
  onNavigate,
  onCreate,
  onOpenPerson,
}: any) {
  if (
    (useEffect(() => {
      if (!open) return;
      const U = (J?: any) => {
        J.key === "Escape" && onClose();
      };
      document.addEventListener("keydown", U);
      return () => document.removeEventListener("keydown", U);
    }, [open, onClose]),
    useEffect(() => {
      if (!open) return;
      const U = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = U;
      };
    }, [open]),
    !open)
  )
    return null;
  people.filter((U?: any) => U.id !== "me" && followingIds.includes(U.id))
    .length;
  const j = (U?: any) =>
      U === "notifications"
        ? unreadNotices
        : U === "messages"
          ? unreadMessages
          : 0,
    C = (U?: any) => {
      onNavigate(U);
      onClose();
    };
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation"
        className="animate-fade absolute inset-0 cursor-default bg-ink/45 backdrop-blur-[3px]"
      />
      <div className="animate-drawer relative flex h-[100dvh] w-[min(95vw,440px)] flex-col border-r border-line bg-surface shadow-[24px_0_80px_rgba(10,14,20,0.22)]">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <button
            type="button"
            onClick={() => C("home")}
            aria-label="Thursday home"
          >
            <BrandLockup />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas-deep hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="shrink-0 px-4 pt-3.5">
          <button
            type="button"
            onClick={() => {
              onCreate();
              onClose();
            }}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-forest text-[13.5px] font-semibold text-white shadow-sm transition-colors hover:bg-forest-hover"
          >
            <Plus size={16} weight="bold" aria-hidden="true" />
            Create post
          </button>
        </div>
        <nav
          className="thin-scrollbar relative min-h-0 flex-1 overflow-y-auto px-3 pt-4 pb-6"
          aria-label="Mobile"
        >
          <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
            Browse
          </p>
          <div className="space-y-0.5">
            {BROWSE_NAV_ITEMS.map((U?: any) => (
              <SidebarNavItem
                key={U.key}
                item={U}
                active={view === U.key}
                count={j(U.key)}
                compact
                onClick={() => C(U.key)}
              />
            ))}
          </div>
          <p className="mt-2.5 mb-1 px-3 text-[10.5px] font-semibold tracking-[0.1em] text-faint uppercase">
            Inbox
          </p>
          <div className="space-y-0.5">
            {INBOX_NAV_ITEMS.map((U?: any) => (
              <SidebarNavItem
                key={U.key}
                item={U}
                active={view === U.key}
                count={j(U.key)}
                compact
                onClick={() => C(U.key)}
              />
            ))}
          </div>
          <p className="mt-2.5 mb-1 px-3 text-[10.5px] font-semibold tracking-[0.1em] text-faint uppercase">
            Account
          </p>
          <div className="space-y-0.5">
            {ACCOUNT_NAV_ITEMS.map((U?: any) => (
              <SidebarNavItem
                key={U.key}
                item={U}
                active={view === U.key}
                compact
                onClick={() => C(U.key)}
              />
            ))}
          </div>
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between px-2">
              <p className="text-[11px] font-semibold tracking-[0.1em] text-faint uppercase">
                Your circles
              </p>
              <button
                type="button"
                onClick={() => C("circles")}
                className="text-[12px] font-medium text-forest"
              >
                {circles.filter((U?: any) => U.joined).length}
                {" joined"}
              </button>
            </div>
            {circles
              .filter((U?: any) => U.joined)
              .slice(0, 3)
              .map((U?: any) => (
                <button
                  key={U.id}
                  type="button"
                  onClick={() => C("circles")}
                  className="flex h-11 w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition-colors hover:bg-canvas-deep/70"
                >
                  <img
                    src={U.image}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-[6px] object-cover"
                    loading="lazy"
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-soft">
                    {U.name}
                  </span>
                  <CaretRight
                    size={12}
                    className="shrink-0 text-faint"
                    aria-hidden="true"
                  />
                </button>
              ))}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={() => C("explore")}
              className="flex h-9 flex-1 items-center justify-between gap-2 rounded-lg border border-line bg-canvas px-3 text-left transition-colors hover:border-line-strong"
            >
              <span className="flex items-center gap-2">
                <UsersThree
                  size={15}
                  className="text-forest"
                  aria-hidden="true"
                />
                <span className="text-[12px] font-semibold text-ink">
                  Find people
                </span>
              </span>
              <CaretRight size={13} className="text-faint" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => C("events")}
              aria-label={`Gatherings, next is ${events[0]?.title ?? "coming soon"}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-canvas text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              <CalendarBlank size={15} aria-hidden="true" />
            </button>
          </div>
        </nav>
        <div className="pointer-events-none absolute inset-x-0 bottom-[84px] h-8 bg-gradient-to-t from-surface to-transparent" />
        <div className="shrink-0 border-t border-line bg-surface px-2.5 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenPerson(me.id);
                onClose();
              }}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg p-1 text-left transition-colors hover:bg-canvas-deep/70"
            >
              <Avatar person={me} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-ink">
                  {me.name}
                </span>
                <span className="block truncate text-[10.5px] text-muted">
                  @{me.handle}
                </span>
              </span>
            </button>
            <ThemeSegmentedControl theme={theme} onChange={onToggleTheme} />
            <button
              type="button"
              onClick={() => C("settings")}
              aria-label="Open settings"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-canvas-deep hover:text-ink"
            >
              <GearSix size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
const AUDIENCE_OPTIONS = [
  {
    label: "Studio",
    value: "pottery",
  },
  {
    label: "Trail",
    value: "trail",
  },
  {
    label: "Coffee",
    value: "coffee",
  },
  {
    label: "Records",
    value: "vinyl",
  },
];
export function ComposerModal({
  open,
  onClose,
  me,
  onSubmit,
  photoOptions,
  onSaveDraft,
}: any) {
  const [A, T] = useState<any>(""),
    [y, g] = useState<any>(null),
    [R, z] = useState<any>("Anyone"),
    [v, q] = useState<any>(""),
    [_, j] = useState<any>(false),
    [C, U] = useState<any>(false);
  useEffect(() => {
    open && (T(""), g(null), z("Anyone"), q(""));
  }, [open]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create a post"
      description="A moment for your circle. Keep it simple."
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Avatar person={me} size="sm" />
            <div className="hidden sm:block">
              <p className="text-[11.5px] font-semibold text-ink">{me.name}</p>
              <p className="text-[10px] text-muted">
                {"Posting to "}
                {R.toLowerCase()}
              </p>
            </div>
            <div className="relative">
              <select
                value={R}
                onChange={(J?: any) => z(J.target.value)}
                aria-label="Audience"
                className="h-7 appearance-none rounded-[6px] border border-line bg-surface pr-6 pl-2 text-[10.5px] font-medium text-muted focus:border-forest focus:outline-none"
              >
                <option>Anyone</option>
                <option>Your circle</option>
                <option>Only you</option>
              </select>
              <CaretDown
                size={10}
                strokeWidth={2}
                className="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-faint"
                aria-hidden="true"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-[10.5px] text-faint tabular-nums sm:block">
              {A.length}/500
            </span>
            <button
              type="button"
              onClick={() => {
                (!A.trim() && !y) ||
                  (onSaveDraft?.(A.trim(), y ?? undefined), onClose());
              }}
              className="mr-1 text-[10.5px] font-semibold text-muted hover:text-ink"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={() => {
                if (!A.trim() && !y) {
                  q("Add a few words or a photo before posting.");
                  return;
                }
                onSubmit(A.trim(), y ?? undefined);
                onClose();
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-forest px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-forest-hover"
            >
              Post
              <Sparkle size={11} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-5">
        <div className="flex gap-3">
          <Avatar person={me} size="md" />
          <div className="min-w-0 flex-1">
            <textarea
              autoFocus
              value={A}
              maxLength={500}
              onChange={(J?: any) => {
                T(J.target.value);
                q("");
              }}
              rows={5}
              placeholder="What's on your mind, Nora?"
              aria-label="Post text"
              className="w-full resize-none bg-transparent text-[13px] leading-[1.65] text-ink outline-none placeholder:text-faint"
            />
            <div className="mt-1 flex items-center gap-1 border-t border-line pt-2.5">
              <button
                type="button"
                onClick={() => g(y ? null : photoOptions.studio)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[11px] font-medium transition-colors",
                  y
                    ? "bg-forest-soft text-forest"
                    : "text-muted hover:bg-surface-muted hover:text-ink",
                )}
                aria-pressed={!!y}
              >
                <Image size={13} strokeWidth={1.8} aria-hidden="true" />
                Photo
              </button>
              <button
                type="button"
                className="inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[11px] font-medium text-muted hover:bg-surface-muted hover:text-ink"
              >
                <MapPin size={13} strokeWidth={1.8} aria-hidden="true" />
                Place
              </button>
              <button
                type="button"
                className="inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2 text-[11px] font-medium text-muted hover:bg-surface-muted hover:text-ink"
              >
                <UsersThree size={13} strokeWidth={1.8} aria-hidden="true" />
                Tag people
              </button>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => j(true)}
                className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-line px-2 text-[10.5px] font-medium text-muted hover:text-ink"
              >
                {"Drafts "}
                <span className="rounded bg-canvas-deep px-1 text-[9px] text-faint">
                  {INITIAL_DRAFTS.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => U(true)}
                className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-line px-2 text-[10.5px] font-medium text-muted hover:text-ink"
              >
                Audio library
              </button>
              <CloseFriendsPill people={[me]} />
            </div>
            {y ? (
              <div className="relative mt-2.5 overflow-hidden rounded-[10px] border border-line">
                <img
                  src={y}
                  alt="Selected attachment"
                  className="h-44 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => g(null)}
                  aria-label="Remove photo"
                  className="absolute top-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink/65 text-white backdrop-blur hover:bg-ink/80"
                >
                  <X size={12} strokeWidth={2.2} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {AUDIENCE_OPTIONS.map((J?: any) => (
                  <button
                    key={J.value}
                    type="button"
                    onClick={() => g(photoOptions[J.value])}
                    className="group overflow-hidden rounded-[7px] border border-line"
                  >
                    <img
                      src={photoOptions[J.value]}
                      alt={J.label}
                      className="h-16 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
            {v ? (
              <p className="mt-2.5 rounded-[7px] border border-clay/20 bg-clay-wash px-2.5 py-1.5 text-[11px] text-clay">
                {v}
              </p>
            ) : (
              <p className="mt-2.5 text-[10px] leading-[1.5] text-faint">
                Keep it kind. Your post will appear in your circle's feed
                instantly.
              </p>
            )}
          </div>
        </div>
      </div>
      <DraftsModal
        open={_}
        onClose={() => j(false)}
        onPublish={(J?: any) => {
          onSubmit(J.text, J.image);
          onClose();
        }}
        onDelete={() => {}}
      />
      <AudioLibraryModal open={C} onClose={() => U(false)} />
    </Modal>
  );
}
export function PostDetailModal({
  post,
  author,
  me,
  people,
  onClose,
  onLike,
  onSave,
  onRepost,
  onAddComment,
  onOpenPerson,
  onVote,
  onTogglePinPost,
  onDelete,
}: any) {
  const [q, _] = useState<any>("");
  if (!post || !author) return null;
  const j = post.images[0];
  return (
    <Modal open={!!post} onClose={onClose} width="lg" bare>
      <div className="flex max-h-[88vh] flex-col sm:flex-row">
        {j ? (
          <div className="relative flex max-h-[42vh] shrink-0 items-center justify-center overflow-hidden bg-[#171a16] sm:max-h-none sm:w-[47%]">
            <img
              src={j}
              alt={post.imageAlt ?? ""}
              className="h-full max-h-[500px] w-full object-contain sm:object-cover"
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close post"
              className="absolute top-3 left-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur hover:bg-black/60 sm:hidden"
            >
              <X size={14} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <button type="button" onClick={() => onOpenPerson(author.id)}>
              <Avatar person={author} size="sm" />
            </button>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onOpenPerson(author.id)}
                className="flex items-center gap-1 text-left"
              >
                <span className="truncate text-[12.5px] font-semibold text-ink hover:underline">
                  {author.name}
                </span>
                {author.verified ? <VerifiedBadge className="h-3 w-3" /> : null}
              </button>
              <AuthorChip person={author} time={post.time} />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close post"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
            >
              <X size={15} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
          <div className="thin-scrollbar flex-1 overflow-y-auto">
            <div className="px-4 py-3">
              <p className="text-[13.5px] leading-[1.7] text-ink-soft">
                {post.text}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {post.place ? (
                  <span className="inline-flex items-center gap-1 text-[10.5px] text-faint">
                    <MapPin size={10} strokeWidth={1.9} aria-hidden="true" />
                    {post.place}
                  </span>
                ) : null}
                <span className="rounded-full bg-canvas-deep px-2 py-0.5 text-[8.5px] font-medium text-muted">
                  {post.topic}
                </span>
              </div>
            </div>
            {post.poll ? (
              <div className="mx-4 mb-3 rounded-xl border border-line bg-surface-muted/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-ink">
                    {post.poll.question}
                  </p>
                  <span className="text-[8.5px] text-faint">
                    {post.poll.closes}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {post.poll.options.map((C?: any) => {
                    const U = post.poll.options.reduce(
                        (Ne?: any, he?: any) => Ne + he.votes,
                        0,
                      ),
                      J = U ? Math.round((C.votes / U) * 100) : 0,
                      te = post.poll.votedOptionId === C.id;
                    return (
                      <button
                        key={C.id}
                        type="button"
                        disabled={!!post.poll.votedOptionId}
                        onClick={() => onVote?.(post.id, C.id)}
                        aria-pressed={te}
                        className={cn(
                          "relative flex w-full items-center justify-between overflow-hidden rounded-[7px] border px-2.5 py-2 text-left transition-colors",
                          te
                            ? "border-forest/35 bg-forest-wash"
                            : "border-line bg-surface",
                          !post.poll.votedOptionId &&
                            "hover:border-forest/30 hover:bg-forest-wash/50",
                        )}
                      >
                        {post.poll.votedOptionId ? (
                          <span
                            className="absolute inset-y-0 left-0 bg-forest/[0.07]"
                            style={{
                              width: `${J}%`,
                            }}
                            aria-hidden="true"
                          />
                        ) : null}
                        <span
                          className={cn(
                            "relative text-[11.5px] font-medium",
                            te ? "text-forest" : "text-ink-soft",
                          )}
                        >
                          {C.label}
                        </span>
                        {post.poll.votedOptionId ? (
                          <span className="relative text-[11px] text-muted tabular-nums">
                            {J}%
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[10px] text-faint">
                  {post.poll.options
                    .reduce((C?: any, U?: any) => C + U.votes, 0)
                    .toLocaleString()}
                  {" votes"}
                  {post.poll.votedOptionId
                    ? " · you voted"
                    : " · one vote each"}
                </p>
              </div>
            ) : null}
            {post.music ? (
              <div className="mx-4 mb-3 flex items-center gap-2.5 rounded-xl border border-line bg-surface-muted/60 p-2.5">
                <img
                  src={post.music.art}
                  alt=""
                  className="h-11 w-11 rounded-[7px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[8.5px] font-semibold tracking-[0.08em] text-muted uppercase">
                    Now playing
                  </p>
                  <p className="truncate text-[12px] font-semibold text-ink">
                    {post.music.title}
                  </p>
                  <p className="truncate text-[10.5px] text-muted">
                    {post.music.artist}
                    {" · "}
                    {post.music.duration}
                  </p>
                </div>
              </div>
            ) : null}
            {post.authorId === "me" ? (
              <div className="flex items-center justify-between gap-2 px-4 pb-1">
                <PinPostButton
                  pinned={!!post.pinned}
                  onToggle={() => onTogglePinPost?.(post.id)}
                />
                <button
                  type="button"
                  onClick={() => onDelete?.(post.id)}
                  className="text-[10px] font-semibold text-clay hover:opacity-70"
                >
                  Delete post
                </button>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-y border-line px-3 py-1">
              <div className="flex items-center gap-0.5">
                <MediaFrame
                  icon={Heart}
                  label="Like"
                  count={post.likes}
                  active={post.liked}
                  activeClass="text-clay"
                  onClick={onLike}
                />
                <span className="inline-flex items-center gap-1 px-1 text-[11.5px] text-muted">
                  <ChatCircle size={13} strokeWidth={1.9} aria-hidden="true" />
                  {post.comments.length}
                </span>
                <MediaFrame
                  icon={Repeat}
                  label="Repost"
                  count={post.reposts}
                  onClick={onRepost}
                />
                <MediaFrame icon={PaperPlaneTilt} label="Share" />
              </div>
              <MediaFrame
                icon={BookmarkSimple}
                label="Save"
                active={post.saved}
                onClick={onSave}
              />
            </div>
            <div className="divide-y divide-line/70">
              {post.comments.length ? (
                post.comments.map((C?: any) => {
                  const U = people.find((J?: any) => J.id === C.authorId);
                  return U ? (
                    <div key={C.id} className="flex gap-2.5 px-4 py-3">
                      <button type="button" onClick={() => onOpenPerson(U.id)}>
                        <Avatar person={U} size="sm" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenPerson(U.id)}
                            className="truncate text-[12px] font-semibold text-ink hover:underline"
                          >
                            {C.authorId === "me" ? "You" : U.name}
                          </button>
                          {U.verified ? (
                            <VerifiedBadge className="h-2.5 w-2.5" />
                          ) : null}
                          <span className="text-[10px] text-faint">
                            {"· "}
                            {C.time}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] leading-[1.55] text-ink-soft">
                          {C.text}
                        </p>
                        <div className="mt-1 flex items-center gap-3">
                          <button
                            type="button"
                            className="text-[10px] font-semibold text-muted hover:text-clay"
                          >
                            {"Like "}
                            {C.likes ? `(${C.likes})` : ""}
                          </button>
                          <button
                            type="button"
                            className="text-[10px] font-semibold text-muted hover:text-ink"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })
              ) : (
                <EmptyState
                  icon={ChatCircle}
                  title="Start the conversation"
                  description="A small reply is often the best part of a post."
                />
              )}
            </div>
          </div>
          <form
            onSubmit={(C?: any) => {
              C.preventDefault();
              q.trim() && (onAddComment(q.trim()), _(""));
            }}
            className="flex items-center gap-2 border-t border-line p-2.5"
          >
            <Avatar person={me} size="xs" />
            <input
              value={q}
              onChange={(C?: any) => _(C.target.value)}
              placeholder="Add a thoughtful reply…"
              aria-label="Add a comment"
              className="h-8 min-w-0 flex-1 rounded-full border border-line bg-surface-muted/60 px-3 text-[12px] text-ink transition-colors placeholder:text-faint hover:border-line-strong focus:border-forest focus:bg-surface focus:outline-none"
            />
            <button
              type="submit"
              disabled={!q.trim()}
              aria-label="Post comment"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-forest text-white transition-colors hover:bg-forest-hover disabled:opacity-40"
            >
              <PaperPlaneTilt size={13} strokeWidth={2} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}
export function StoryViewerModal({
  stories,
  people,
  index,
  onClose,
  onChange,
  onSeen,
  onReply,
}: any) {
  const T = stories[index],
    y = T ? people.find((_?: any) => _.id === T.authorId) : null,
    [g, R] = useState<any>(false),
    z = useRef<any>(null);
  if (
    (useEffect(() => {
      if (!T || (onSeen(T.id), g)) return;
      const _ = window.setTimeout(() => {
        index < stories.length - 1 ? onChange(index + 1) : onClose();
      }, 6500);
      return () => window.clearTimeout(_);
    }, [T, index, stories.length, onChange, onClose, onSeen, g]),
    useEffect(() => {
      const _ = (j?: any) => {
        j.key === "Escape" && onClose();
        j.key === "ArrowRight" &&
          (index < stories.length - 1 ? onChange(index + 1) : onClose());
        j.key === "ArrowLeft" && index > 0 && onChange(index - 1);
        j.key === " " && (j.preventDefault(), R((C?: any) => !C));
      };
      document.addEventListener("keydown", _);
      return () => document.removeEventListener("keydown", _);
    }, [index, stories.length, onChange, onClose]),
    !T || !y)
  )
    return null;
  const v = () =>
      index < stories.length - 1 ? onChange(index + 1) : onClose(),
    q = () => (index > 0 ? onChange(index - 1) : onClose());
  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#050806]"
      role="dialog"
      aria-modal="true"
      aria-label={`Story from ${y.name}`}
      onTouchStart={(_?: any) => {
        z.current = _.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(_?: any) => {
        const j = z.current;
        if (((z.current = null), j === null)) return;
        const C = (_.changedTouches[0]?.clientX ?? j) - j;
        C < -50 && v();
        C > 50 && q();
      }}
    >
      <img
        src={T.image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
      />
      <div className="absolute inset-0 bg-[#050806]/45" />
      <img
        src={T.image}
        alt={T.caption}
        className="story-image absolute inset-0 z-[1] h-full w-full object-cover"
        onClick={() => R((_?: any) => !_)}
      />
      <button
        type="button"
        onClick={() => R((_?: any) => !_)}
        aria-label={g ? "Resume story" : "Pause story"}
        className="absolute inset-0 z-[2] cursor-default"
        data-no-ripple
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[132px] bg-gradient-to-b from-black/75 via-black/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[210px] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
      <header className="absolute inset-x-0 top-0 z-20 px-3.5 pt-[max(0.8rem,env(safe-area-inset-top))] sm:px-6">
        <div className="mx-auto flex w-full max-w-[540px] gap-1">
          {stories.map((_?: any, j?: any) => (
            <span
              key={_.id}
              className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
            >
              <span
                className={cn(
                  "block h-full rounded-full bg-white",
                  j < index
                    ? "w-full"
                    : j === index
                      ? g
                        ? "w-1/2"
                        : "w-full animate-[story_6.5s_linear]"
                      : "w-0",
                )}
              />
            </span>
          ))}
        </div>
        <div className="mx-auto mt-3 flex w-full max-w-[540px] items-center gap-2.5">
          <Avatar person={y} size="sm" ring seen />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[13px] font-semibold text-white drop-shadow">
              {y.name}
              {y.verified ? <VerifiedBadge className="text-white/80" /> : null}
            </p>
            <p className="truncate text-[11px] text-white/65 drop-shadow">
              {T.authorId === "me" ? "Your story" : "2h ago"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close story"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55"
          >
            <X size={17} weight="bold" aria-hidden="true" />
          </button>
        </div>
      </header>
      <button
        type="button"
        onClick={q}
        aria-label="Previous story"
        className="absolute top-1/2 left-3 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55 sm:inline-flex"
      >
        <CaretLeft size={20} weight="bold" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={v}
        aria-label="Next story"
        className="absolute top-1/2 right-3 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55 sm:inline-flex"
      >
        <CaretRight size={20} weight="bold" aria-hidden="true" />
      </button>
      {g ? (
        <span className="pointer-events-none absolute top-1/2 left-1/2 z-20 inline-flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md">
          <Play size={22} weight="fill" aria-hidden="true" />
        </span>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 z-20 px-3.5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
        <div className="mx-auto w-full max-w-[540px]">
          <p className="text-[15px] leading-[1.45] font-medium text-white text-balance drop-shadow sm:text-[17px]">
            {T.caption}
          </p>
          <div className="mt-3">
            <QuickReactionsBar
              personName={y.name}
              onSend={(_?: any) => {
                onReply?.(y.id, _);
                onClose();
              }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-white/45">
            <span>Tap to pause · arrows to navigate</span>
            <button
              type="button"
              onClick={onClose}
              className="font-medium text-white/60 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
export function SearchPaletteModal({
  open,
  onClose,
  people,
  posts,
  topics,
  onOpenPerson,
  onOpenPost,
  onOpenTopic,
  onNavigate,
  onCreate,
}: any) {
  const [R, z] = useState<any>("");
  useEffect(() => {
    open && z("");
  }, [open]);
  const v = useMemo(() => {
      const j = R.trim().toLowerCase();
      return j
        ? people.filter(
            (C?: any) =>
              C.name.toLowerCase().includes(j) ||
              C.handle.toLowerCase().includes(j),
          )
        : people.filter((C?: any) => C.id !== "me").slice(0, 4);
    }, [people, R]),
    q = useMemo(() => {
      const j = R.trim().toLowerCase();
      return j
        ? posts.filter(
            (C?: any) =>
              C.text.toLowerCase().includes(j) ||
              C.topic.toLowerCase().includes(j),
          )
        : [];
    }, [posts, R]),
    _ = topics.filter((j?: any) =>
      R.trim() ? j.label.toLowerCase().includes(R.trim().toLowerCase()) : true,
    );
  return open ? (
    <div className="fixed inset-0 z-[65] flex items-start justify-center bg-ink/30 px-4 pt-[10vh] backdrop-blur-[2px]">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close search"
        tabIndex={-1}
      />
      <div className="animate-pop relative w-full max-w-[560px] overflow-hidden rounded-xl border border-line bg-surface shadow-[0_24px_80px_rgba(29,33,28,0.2)]">
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <MagnifyingGlass
            size={16}
            strokeWidth={1.9}
            className="text-faint"
            aria-hidden="true"
          />
          <input
            autoFocus
            value={R}
            onChange={(j?: any) => z(j.target.value)}
            onKeyDown={(j?: any) => {
              j.key === "Escape" && onClose();
              j.key === "Enter" && v[0] && (onOpenPerson(v[0].id), onClose());
            }}
            placeholder="Search people, posts, or topics…"
            aria-label="Search"
            className="h-12 min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-faint"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-line bg-surface-muted px-1.5 py-0.5 text-[10px] text-faint hover:text-ink"
          >
            esc
          </button>
        </div>
        <div className="thin-scrollbar max-h-[440px] overflow-y-auto p-2">
          {v.length ? (
            <>
              <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
                People
              </p>
              {v.slice(0, 4).map((j?: any) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => {
                    onOpenPerson(j.id);
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-surface-muted"
                >
                  <Avatar person={j} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[12.5px] font-medium text-ink">
                      {j.name}
                      {j.verified ? (
                        <VerifiedBadge className="h-3 w-3" />
                      ) : null}
                    </span>
                    <span className="text-[10.5px] text-muted">
                      @{j.handle}
                      {" · "}
                      {formatCount(j.followers)}
                      {" followers"}
                    </span>
                  </span>
                  <CaretRight
                    size={12}
                    className="text-faint"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </>
          ) : null}
          {q.length ? (
            <>
              <p className="mt-1 px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
                Posts
              </p>
              {q.slice(0, 3).map((j?: any) => (
                <button
                  key={j.id}
                  type="button"
                  onClick={() => {
                    onOpenPost(j);
                    onClose();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-surface-muted"
                >
                  {j.images[0] ? (
                    <img
                      src={j.images[0]}
                      alt=""
                      className="h-8 w-8 rounded-[6px] object-cover"
                    />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-[12px] text-ink-soft">
                      {j.text}
                    </span>
                    <span className="text-[10px] text-faint">
                      {j.topic}
                      {" · "}
                      {j.time}
                    </span>
                  </span>
                </button>
              ))}
            </>
          ) : null}
          {_.length ? (
            <>
              <p className="mt-1 px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
                Topics
              </p>
              <div className="grid grid-cols-2 gap-1">
                {_.slice(0, 4).map((j?: any) => (
                  <button
                    key={j.tag}
                    type="button"
                    onClick={() => {
                      onOpenTopic();
                      onClose();
                    }}
                    className="flex items-center gap-2 rounded-[7px] px-2.5 py-2 text-left transition-colors hover:bg-surface-muted"
                  >
                    <img
                      src={j.image}
                      alt=""
                      className="h-7 w-7 rounded-[5px] object-cover"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[11.5px] font-medium text-ink-soft">
                        {j.label}
                      </span>
                      <span className="block truncate text-[8.5px] text-faint">
                        #{j.tag}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
          {!v.length && !q.length ? (
            <p className="px-3 py-8 text-center text-[12px] text-muted">
              Nothing found for “{R}”. Try a name or a topic.
            </p>
          ) : null}
          {R ? null : (
            <>
              <div className="my-1.5 h-px bg-line" />
              <p className="px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-faint uppercase">
                Quick actions
              </p>
              {[
                {
                  label: "Create a post",
                  view: "create",
                  icon: Plus,
                },
                {
                  label: "See what's happening",
                  view: "explore",
                  icon: Compass,
                },
                {
                  label: "Watch reels",
                  view: "reels",
                  icon: Play,
                },
                {
                  label: "Browse circles",
                  view: "circles",
                  icon: UsersThree,
                },
                {
                  label: "Find a gathering",
                  view: "events",
                  icon: CalendarBlank,
                },
                {
                  label: "Open your saved posts",
                  view: "bookmarks",
                  icon: BookmarkSimple,
                },
                {
                  label: "Settings & preferences",
                  view: "settings",
                  icon: SlidersHorizontal,
                },
              ].map((j?: any) => {
                const C = j.icon;
                return (
                  <button
                    key={j.label}
                    type="button"
                    onClick={() => {
                      if (j.view === "create") {
                        onCreate();
                        onClose();
                        return;
                      }
                      onNavigate(j.view);
                      onClose();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-surface-muted"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] border border-line bg-surface-muted text-muted">
                      <C size={13} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <span className="text-[12px] font-medium text-ink-soft">
                      {j.label}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-line bg-surface-muted px-3.5 py-2 text-[10px] text-faint">
          <span>Press ↵ to open the first result</span>
          <span className="flex items-center gap-1">
            <Sparkle size={9} strokeWidth={2} aria-hidden="true" />
            Private by default
          </span>
        </div>
      </div>
    </div>
  ) : null;
}
export function EditProfileModal({ open, onClose, me, onSave }: any) {
  const [x, w] = useState<any>(me.name),
    [A, T] = useState<any>(me.bio),
    [y, g] = useState<any>(me.location),
    [R, z] = useState<any>(me.website);
  useEffect(() => {
    open && (w(me.name), T(me.bio), g(me.location), z(me.website));
  }, [open, me]);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit profile"
      description="How the rest of Thursday sees you."
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-[7px] border border-line-strong bg-surface px-3 text-[12px] font-semibold text-ink-soft hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              x.trim() &&
                (onSave({
                  name: x.trim(),
                  bio: A.trim(),
                  location: y.trim(),
                  website: R.trim(),
                }),
                onClose());
            }}
            className="h-8 rounded-[7px] bg-forest px-3.5 text-[12px] font-semibold text-white hover:bg-forest-hover"
          >
            Save profile
          </button>
        </div>
      }
    >
      <div className="space-y-3.5 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3 rounded-[10px] border border-line bg-surface-muted/60 p-3">
          <Avatar person={me} size="lg" />
          <div>
            <p className="text-[12px] font-medium text-ink">{x || me.name}</p>
            <p className="mt-0.5 text-[10px] text-faint">
              Changing your photo is coming soon
            </p>
          </div>
        </div>
        {[
          {
            label: "Name",
            value: x,
            set: w,
            max: 40,
          },
          {
            label: "Location",
            value: y,
            set: g,
            max: 40,
          },
          {
            label: "Website",
            value: R,
            set: z,
            max: 60,
          },
        ].map((v?: any) => (
          <label key={v.label} className="block space-y-1.5">
            <span className="text-[11.5px] font-medium text-ink-soft">
              {v.label}
            </span>
            <input
              value={v.value}
              onChange={(q?: any) => v.set(q.target.value)}
              maxLength={v.max}
              className="h-9 w-full rounded-[8px] border border-line-strong bg-surface px-3 text-[12.5px] text-ink transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/10"
            />
          </label>
        ))}
        <label className="block space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-medium text-ink-soft">Bio</span>
            <span className="text-[10px] text-faint">{A.length}/160</span>
          </div>
          <textarea
            value={A}
            onChange={(v?: any) => T(v.target.value)}
            maxLength={160}
            rows={4}
            className="w-full resize-none rounded-[8px] border border-line-strong bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink transition-colors focus:border-forest focus:outline-none focus:ring-2 focus:ring-forest/10"
          />
        </label>
      </div>
    </Modal>
  );
}
