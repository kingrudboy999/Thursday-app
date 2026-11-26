import { useEffect, useState } from "react";
import {
  checkBackendHealth,
  getClientId,
  pullWorkspaceFromRailway,
  pushWorkspaceToRailway,
} from "../lib/api";
import { cn } from "../lib/cn";
import {
  ArrowCounterClockwise,
  ArrowUpRight,
  Bell,
  BookmarkSimple,
  ChatCircle,
  Check,
  DeviceMobile,
  DownloadSimple,
  Keyboard,
  Lock,
  Moon,
  Palette,
  Shield,
  Sparkle,
  Sun,
  Trash,
  UploadSimple,
  UserCircle,
  UsersThree,
  Warning,
} from "../lib/icons";
import { QuietHoursCard } from "../components/features";
import { InstallAppCard } from "../components/install";
import { Avatar, VerifiedBadge } from "../components/social";
import {
  CIRCLE_GUIDES,
  CLOSE_FRIEND_IDS,
  INITIAL_DRAFTS,
} from "../lib/features";
import {
  DEFAULT_PREFERENCES,
  NOTIFICATION_TOGGLES,
  PRIVACY_TOGGLES,
} from "../lib/settings";

export function ToggleSwitch({ checked, onChange, label }: any) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[21px] w-[36px] shrink-0 items-center rounded-full border transition-colors duration-200",
        checked
          ? "border-forest bg-forest"
          : "border-line-strong bg-canvas-deep",
      )}
    >
      <span
        className={cn(
          "block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[17px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}
export function SettingsSectionCard({
  icon: IconComp,
  title,
  description,
  children,
  action,
}: any) {
  return (
    <section className="animate-rise overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-line bg-surface-muted text-muted">
            <IconComp size={14} strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[13.5px] font-semibold text-ink">{title}</h2>
            <p className="mt-0.5 text-[11.5px] leading-[1.5] text-muted">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function SettingsView({
  me,
  preferences,
  stats,
  draftsCount,
  savedGuidesCount,
  onUpdate,
  onEditProfile,
  onExport,
  onImportWorkspace,
  onReloadFromStorage,
  onReset,
  onToast,
  onOpenPerson,
  onBackHome,
}: any) {
  const [R, z] = useState<any>(false),
    [v, q] = useState<any>(preferences.quietHoursEnabled ?? true),
    [fromTime, setFromTime] = useState<string>(preferences.quietHoursFrom || "22:00"),
    [untilTime, setUntilTime] = useState<string>(preferences.quietHoursUntil || "07:30"),
    [syncCode, setSyncCode] = useState<string>(() => getClientId()),
    [syncBusy, setSyncBusy] = useState<boolean>(false),
    [backendLive, setBackendLive] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    checkBackendHealth().then((res) => {
      if (active) setBackendLive(res.ok);
    });
    return () => {
      active = false;
    };
  }, []);

  const _ = (C?: any, U?: any) =>
      onUpdate({
        ...preferences,
        notifications: {
          ...preferences.notifications,
          [C]: U,
        },
      }),
    j = (C?: any, U?: any) =>
      onUpdate({
        ...preferences,
        privacy: {
          ...preferences.privacy,
          [C]: U,
        },
      });
  return (
    <div className="mx-auto w-full max-w-[860px] px-4 pt-5 pb-24 sm:px-6 lg:px-8 lg:pb-10">
      <header className="animate-rise mb-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-forest" />
          <p className="text-[10.5px] font-semibold tracking-[0.13em] text-faint uppercase">
            Your space
          </p>
        </div>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-[23px] leading-[1.15] font-semibold tracking-[-0.03em] text-ink sm:text-[26px]">
              Settings
            </h1>
            <p className="mt-0.5 text-[12.5px] text-muted">
              Make Thursday feel like yours. Changes save on this device
              automatically.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line-strong bg-surface px-2.5 text-[11.5px] font-semibold text-ink-soft transition-colors hover:bg-surface-muted"
            >
              <UserCircle size={12} strokeWidth={2} />
              Edit profile
            </button>
            <button
              type="button"
              onClick={onBackHome}
              className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-forest px-3 text-[11.5px] font-semibold text-white transition-colors hover:bg-forest-hover"
            >
              Back to feed
            </button>
          </div>
        </div>
      </header>
      <div className="space-y-3.5">
        <SettingsSectionCard
          icon={UserCircle}
          title="Account"
          description="The identity your circle sees across Thursday."
          action={
            <span className="text-[8.5px] font-medium text-forest">
              Local account
            </span>
          }
        >
          <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
            <button
              type="button"
              onClick={() => onOpenPerson(me.id)}
              aria-label="Open your profile"
            >
              <Avatar person={me} size="xl" />
            </button>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onOpenPerson(me.id)}
                className="flex items-center gap-1 text-left"
              >
                <span className="truncate text-[13.5px] font-semibold text-ink">
                  {me.name}
                </span>
                {me.verified ? <VerifiedBadge /> : null}
              </button>
              <p className="mt-0.5 text-[11px] text-muted">
                @{me.handle}
                {" · "}
                {me.location}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-faint">
                <span className="inline-flex items-center gap-1">
                  <UsersThree size={9} strokeWidth={2} /> {stats.circles}
                  {" circles"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookmarkSimple size={9} strokeWidth={2} /> {stats.saved}
                  {" saved"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ChatCircle size={9} strokeWidth={2} /> {stats.conversations}
                  {" chats"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onEditProfile}
              className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[6px] border border-line-strong bg-surface px-2 text-[10.5px] font-semibold text-ink-soft hover:bg-surface-muted"
            >
              {"Edit "}
              <ArrowUpRight size={10} strokeWidth={2.2} />
            </button>
          </div>
        </SettingsSectionCard>
        <SettingsSectionCard
          icon={Palette}
          title="Appearance"
          description="Choose the surface that suits your light. Saved automatically."
        >
          <div className="grid gap-2.5 px-4 py-3.5 sm:grid-cols-2 sm:px-5">
            {[
              {
                value: "light",
                label: "White",
                description:
                  "Clean white surfaces, precise borders, forest accent.",
                icon: Sun,
                swatches: ["#f6f7f9", "#ffffff", "#1f6b52", "#101318"],
              },
              {
                value: "dark",
                label: "Dark",
                description: "Deep neutral charcoal with softened contrast.",
                icon: Moon,
                swatches: ["#0b0d11", "#171b21", "#6fc3a2", "#f2f4f7"],
              },
            ].map((C?: any) => {
              const U = C.icon,
                J = preferences.theme === C.value;
              return (
                <button
                  key={C.value}
                  type="button"
                  onClick={() => {
                    onUpdate({
                      ...preferences,
                      theme: C.value,
                    });
                    onToast(
                      `${C.label} theme on`,
                      "Your appearance preference is saved on this device.",
                    );
                  }}
                  aria-pressed={J}
                  className={cn(
                    "rounded-[11px] border p-2.5 text-left transition-colors",
                    J
                      ? "border-forest/45 bg-forest-wash ring-1 ring-forest/10"
                      : "border-line hover:border-line-strong hover:bg-surface-muted",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ink">
                      <U size={12} strokeWidth={2} /> {C.label}
                    </span>
                    {J ? (
                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-forest text-white">
                        <Check size={9} strokeWidth={3} />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[10.5px] leading-[1.5] text-muted">
                    {C.description}
                  </p>
                  <div className="mt-2 flex gap-1">
                    {C.swatches.map((te?: any) => (
                      <span
                        key={te}
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{
                          backgroundColor: te,
                        }}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3 sm:px-5">
            <div>
              <p className="text-[12px] font-medium text-ink">Reduce motion</p>
              <p className="mt-0.5 text-[10.5px] text-muted">
                Turn off entrance animations and easing across the app.
              </p>
            </div>
            <ToggleSwitch
              checked={preferences.reduceMotion}
              onChange={(C?: any) =>
                onUpdate({
                  ...preferences,
                  reduceMotion: C,
                })
              }
              label="Reduce motion"
            />
          </div>
        </SettingsSectionCard>
        <SettingsSectionCard
          icon={Bell}
          title="Notifications"
          description="What reaches you, and what stays in the app."
          action={
            <button
              type="button"
              onClick={() => {
                onUpdate({
                  ...preferences,
                  notifications: DEFAULT_PREFERENCES.notifications,
                });
                onToast("Notification preferences reset");
              }}
              className="shrink-0 text-[10px] font-semibold text-forest hover:opacity-70"
            >
              Reset
            </button>
          }
        >
          <div className="divide-y divide-line/70">
            {NOTIFICATION_TOGGLES.map((C?: any) => (
              <div
                key={C.key}
                className="flex items-start justify-between gap-4 px-4 py-2.5 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="text-[11.5px] font-medium text-ink">
                    {C.title}
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-[1.5] text-muted">
                    {C.description}
                  </p>
                </div>
                <ToggleSwitch
                  checked={preferences.notifications[C.key]}
                  onChange={(U?: any) => _(C.key, U)}
                  label={`Toggle ${C.title}`}
                />
              </div>
            ))}
          </div>
        </SettingsSectionCard>
        <SettingsSectionCard
          icon={Lock}
          title="Privacy & connections"
          description="You decide who can reach you and what they can see."
        >
          <div className="divide-y divide-line/70">
            {PRIVACY_TOGGLES.map((C?: any) => (
              <div
                key={C.key}
                className="flex items-start justify-between gap-4 px-4 py-2.5 sm:px-5"
              >
                <div className="min-w-0">
                  <p className="text-[11.5px] font-medium text-ink">
                    {C.title}
                  </p>
                  <p className="mt-0.5 text-[10.5px] leading-[1.5] text-muted">
                    {C.description}
                  </p>
                </div>
                <ToggleSwitch
                  checked={preferences.privacy[C.key]}
                  onChange={(U?: any) => j(C.key, U)}
                  label={`Toggle ${C.title}`}
                />
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 border-t border-line bg-forest-wash/60 px-4 py-2.5 sm:px-5">
            <Shield
              size={12}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-forest"
              aria-hidden="true"
            />
            <p className="text-[10.5px] leading-[1.55] text-forest/90">
              Thursday stores your data in this browser only. There are no
              trackers, ad networks, or third-party readers in this build.
            </p>
          </div>
        </SettingsSectionCard>
        <SettingsSectionCard
          icon={Bell}
          title="Quiet hours"
          description="Protect the edges of your day from notifications."
        >
          <div className="px-4 py-3.5 sm:px-5">
            <QuietHoursCard
              enabled={v}
              onChange={(enabledVal: boolean) => {
                q(enabledVal);
                onUpdate({ ...preferences, quietHoursEnabled: enabledVal });
              }}
              fromTime={fromTime}
              untilTime={untilTime}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="rounded-lg border border-line px-2.5 py-2">
                <span className="block text-[9px] font-semibold tracking-[0.06em] text-faint uppercase">
                  From
                </span>
                <input
                  type="time"
                  value={fromTime}
                  onChange={(e) => {
                    setFromTime(e.target.value);
                    onUpdate({ ...preferences, quietHoursFrom: e.target.value });
                  }}
                  className="mt-0.5 w-full bg-transparent text-[12px] font-medium text-ink focus:outline-none"
                />
              </label>
              <label className="rounded-lg border border-line px-2.5 py-2">
                <span className="block text-[9px] font-semibold tracking-[0.06em] text-faint uppercase">
                  Until
                </span>
                <input
                  type="time"
                  value={untilTime}
                  onChange={(e) => {
                    setUntilTime(e.target.value);
                    onUpdate({ ...preferences, quietHoursUntil: e.target.value });
                  }}
                  className="mt-0.5 w-full bg-transparent text-[12px] font-medium text-ink focus:outline-none"
                />
              </label>
            </div>
          </div>
        </SettingsSectionCard>
        <SettingsSectionCard
          icon={UsersThree}
          title="Your circle"
          description="Close friends, drafts, and guides you have collected."
        >
          <div className="grid grid-cols-3 gap-2 px-4 py-3.5 sm:px-5">
            {[
              {
                label: "Close friends",
                value: CLOSE_FRIEND_IDS.length,
                note: "see close stories",
              },
              {
                label: "Drafts",
                value: draftsCount ?? INITIAL_DRAFTS.length,
                note: "saved privately",
              },
              {
                label: "Guides",
                value: savedGuidesCount ?? CIRCLE_GUIDES.length,
                note: "saved to read",
              },
            ].map((C?: any) => (
              <div
                key={C.label}
                className="rounded-lg border border-line bg-surface-muted px-2.5 py-2"
              >
                <p className="text-[15px] font-semibold text-ink tabular-nums">
                  {C.value}
                </p>
                <p className="mt-0.5 text-[10px] font-medium text-ink-soft">
                  {C.label}
                </p>
                <p className="text-[9px] leading-tight text-faint">{C.note}</p>
              </div>
            ))}
          </div>
        </SettingsSectionCard>
        <SettingsSectionCard
          icon={DeviceMobile}
          title="Get the app"
          description="Install Thursday, or download a copy you own."
        >
          <InstallAppCard onToast={onToast} />
        </SettingsSectionCard>
        <SettingsSectionCard
          icon={DownloadSimple}
          title="Your data"
          description="Export, import, sync across devices via Railway, or start fresh."
          action={
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold",
                backendLive
                  ? "bg-forest-soft text-forest"
                  : "bg-surface-muted text-muted",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  backendLive ? "bg-forest" : "bg-faint",
                )}
              />
              {backendLive ? "Railway synced" : "Local mode"}
            </span>
          }
        >
          <div className="grid gap-2 px-4 py-3.5 sm:grid-cols-3 sm:px-5">
            <button
              type="button"
              onClick={onExport}
              className="flex items-start gap-2.5 rounded-[10px] border border-line p-2.5 text-left transition-colors hover:border-line-strong hover:bg-surface-muted"
            >
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface text-muted">
                <DownloadSimple size={13} strokeWidth={2} />
              </span>
              <span>
                <span className="block text-[11.5px] font-semibold text-ink">
                  Export my workspace
                </span>
                <span className="mt-0.5 block text-[10px] leading-[1.5] text-muted">
                  A JSON file with your posts, messages, circles, and settings.
                </span>
              </span>
            </button>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-line p-2.5 text-left transition-colors hover:border-line-strong hover:bg-surface-muted">
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-line bg-surface text-muted">
                <UploadSimple size={13} strokeWidth={2} />
              </span>
              <span>
                <span className="block text-[11.5px] font-semibold text-ink">
                  Import backup
                </span>
                <span className="mt-0.5 block text-[10px] leading-[1.5] text-muted">
                  Restore a previously exported Thursday JSON workspace file.
                </span>
              </span>
              <input
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  onImportWorkspace?.(text);
                  e.target.value = "";
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => z(true)}
              className="flex items-start gap-2.5 rounded-[10px] border border-line p-2.5 text-left transition-colors hover:border-clay/30 hover:bg-clay-wash"
            >
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-clay/20 bg-clay-wash text-clay">
                <ArrowCounterClockwise size={13} strokeWidth={2} />
              </span>
              <span>
                <span className="block text-[11.5px] font-semibold text-clay">
                  Reset workspace
                </span>
                <span className="mt-0.5 block text-[10px] leading-[1.5] text-muted">
                  Clear local changes and start fresh with the original Thursday
                  setup.
                </span>
              </span>
            </button>
          </div>
          <div className="flex flex-col gap-2 border-t border-line bg-surface-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-ink">
                Cross-device Railway sync code
              </p>
              <p className="text-[10px] text-muted">
                Save your workspace to Railway PostgreSQL or enter a code from another device.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                value={syncCode}
                onChange={(e) => setSyncCode(e.target.value)}
                aria-label="Sync code"
                className="h-7.5 w-32 rounded-[6px] border border-line-strong bg-surface px-2.5 font-mono text-[11px] text-ink focus:border-forest focus:outline-none"
              />
              <button
                type="button"
                disabled={syncBusy}
                onClick={async () => {
                  try {
                    setSyncBusy(true);
                    const res = await pushWorkspaceToRailway(syncCode);
                    setSyncCode(res.syncKey);
                    onToast(
                      "Workspace synced to Railway",
                      `Saved under code ${res.syncKey}.`,
                    );
                  } catch (err) {
                    onToast(
                      "Could not sync right now",
                      err instanceof Error ? err.message : "Try again shortly.",
                    );
                  } finally {
                    setSyncBusy(false);
                  }
                }}
                className="h-7.5 rounded-[6px] bg-forest px-2.5 text-[10.5px] font-semibold text-white hover:bg-forest-hover disabled:opacity-50"
              >
                Backup
              </button>
              <button
                type="button"
                disabled={syncBusy}
                onClick={async () => {
                  try {
                    setSyncBusy(true);
                    const res = await pullWorkspaceFromRailway(syncCode);
                    onToast(
                      "Workspace restored from Railway",
                      `Loaded ${res.restoredKeys} items for ${res.syncKey}.`,
                    );
                    onReloadFromStorage?.();
                  } catch (err) {
                    onToast(
                      "Could not restore",
                      err instanceof Error ? err.message : "Check your sync code.",
                    );
                  } finally {
                    setSyncBusy(false);
                  }
                }}
                className="h-7.5 rounded-[6px] border border-line-strong bg-surface px-2.5 text-[10.5px] font-semibold text-ink-soft hover:bg-surface-muted disabled:opacity-50"
              >
                Restore
              </button>
            </div>
          </div>
          {R ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-line bg-clay-wash px-4 py-2.5 sm:px-5">
              <Warning
                size={13}
                strokeWidth={2}
                className="shrink-0 text-clay"
                aria-hidden="true"
              />
              <p className="min-w-0 flex-1 text-[10.5px] leading-[1.5] text-clay">
                This removes every post, message, and preference stored in this
                browser. It cannot be undone.
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => z(false)}
                  className="h-6.5 rounded-[5px] border border-line-strong bg-surface px-2 text-[10px] font-semibold text-muted hover:text-ink"
                >
                  Keep it
                </button>
                <button
                  type="button"
                  onClick={() => {
                    z(false);
                    onReset();
                  }}
                  className="inline-flex h-6.5 items-center gap-1 rounded-[5px] bg-clay px-2 text-[10px] font-semibold text-white hover:opacity-90"
                >
                  <Trash size={9} strokeWidth={2.2} />
                  {" Reset everything"}
                </button>
              </div>
            </div>
          ) : null}
        </SettingsSectionCard>
        <SettingsSectionCard
          icon={Keyboard}
          title="Keyboard shortcuts"
          description="Move faster without the mouse."
        >
          <div className="grid grid-cols-1 gap-y-2 px-4 py-3.5 sm:grid-cols-2 sm:gap-x-8 sm:px-5">
            {[
              ["Open search", "⌘ K"],
              ["Create a post", "⌘ N"],
              ["Next reel", "↓"],
              ["Previous reel", "↑"],
              ["Close a dialog", "Esc"],
              ["Open settings", "G then S"],
            ].map(([C, U]) => (
              <div key={C} className="flex items-center justify-between gap-3">
                <span className="text-[10.5px] text-muted">{C}</span>
                <kbd className="rounded border border-line bg-surface-muted px-1.5 py-0.5 text-[8.5px] font-medium text-faint">
                  {U}
                </kbd>
              </div>
            ))}
          </div>
        </SettingsSectionCard>
        <div className="flex flex-col items-center justify-between gap-1.5 px-1 pt-1 sm:flex-row">
          <p className="flex items-center gap-1.5 text-[10px] text-faint">
            <Sparkle size={10} strokeWidth={2} aria-hidden="true" />
            Thursday 1.0 · An independent, quiet social space
          </p>
          <div className="flex items-center gap-3 text-[10px] text-faint">
            <button
              type="button"
              onClick={() =>
                onToast(
                  "Help is on its way",
                  "Write to hello@thursday.app and a person will reply.",
                )
              }
              className="hover:text-ink"
            >
              Help centre
            </button>
            <span className="h-2 w-px bg-line-strong" />
            <button
              type="button"
              onClick={() =>
                onToast(
                  "Community guidelines",
                  "Be kind, give credit, and take the photos down if someone asks.",
                )
              }
              className="hover:text-ink"
            >
              Guidelines
            </button>
            <span className="h-2 w-px bg-line-strong" />
            <button
              type="button"
              onClick={() =>
                onToast(
                  "Privacy",
                  "Everything in this build stays in your browser.",
                )
              }
              className="hover:text-ink"
            >
              Privacy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
