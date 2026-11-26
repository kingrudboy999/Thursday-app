import { useEffect, useRef, useState } from "react";
import { BrandIcon, BrandLockup } from "../components/brand";
import { ThemeSegmentedControl } from "../components/social-shell";
import {
  type AuthUser,
  apiCheckHandle,
  apiDemoLogin,
  apiLogin,
  apiSignup,
  checkBackendHealth,
} from "../lib/api";
import { cn } from "../lib/cn";
import {
  ArrowRight,
  At,
  Check,
  CheckCircle,
  CircleNotch,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Lock,
  MapPin,
  Sparkle,
  UploadSimple,
  UsersThree,
  Warning,
} from "../lib/icons";

const PORTRAIT_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=320&h=320&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=320&h=320&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=320&h=320&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=320&h=320&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=320&h=320&fit=crop&crop=faces",
];

// Signing in as an invented person is gone with the rest of the fake
// accounts. Real accounts only.
export function AuthView({
  theme,
  onToggleTheme,
  onAuthenticated,
}: {
  theme: "light" | "dark";
  onToggleTheme: (next?: "light" | "dark") => void;
  onAuthenticated: (user: AuthUser, isNewSignup?: boolean) => void;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Sign-up fields
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState(PORTRAIT_PRESETS[0]);

  const [submitting, setSubmitting] = useState(false);
  const [quickLoadingId, setQuickLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveInfo, setLiveInfo] = useState<{
    ok: boolean;
    onlineCount: number;
  }>({ ok: true, onlineCount: 3 });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    checkBackendHealth().then((h) => {
      if (!active) return;
      setLiveInfo({
        ok: h.ok,
        onlineCount: Math.max(2, h.onlineUserIds?.length || 3),
      });
    });
    return () => {
      active = false;
    };
  }, []);

  // Auto-suggest handle from name until user edits handle directly
  useEffect(() => {
    if (mode === "signup" && !handleTouched && name.trim()) {
      const suggested = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 20);
      setHandle(suggested);
    }
  }, [name, mode, handleTouched]);

  // Live @handle availability check against Railway PostgreSQL
  useEffect(() => {
    if (mode !== "signup") return;
    const clean = handle
      .trim()
      .toLowerCase()
      .replace(/^@+/, "")
      .replace(/[^a-z0-9_]/g, "");
    if (clean.length < 2) {
      setHandleStatus("idle");
      return;
    }
    setHandleStatus("checking");
    const timer = window.setTimeout(async () => {
      const res = await apiCheckHandle(clean);
      setHandleStatus(res.available ? "available" : "taken");
    }, 320);
    return () => window.clearTimeout(timer);
  }, [handle, mode]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        const res = await apiLogin({ identifier, password });
        if (!res.ok || !res.data?.user) {
          setError(res.error || "Invalid email/@handle or password.");
          setSubmitting(false);
          return;
        }
        onAuthenticated(res.data.user, false);
      } else {
        const res = await apiSignup({
          name,
          handle,
          email,
          password,
          location: location.trim() || "Quiet corner",
          bio:
            bio.trim() ||
            "Sharing unhurried notes, studio moments, and small gatherings on Thursday.",
          avatar,
        });
        if (!res.ok || !res.data?.user) {
          setError(res.error || "Could not create account.");
          setSubmitting(false);
          return;
        }
        onAuthenticated(res.data.user, true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (accountId: string) => {
    setError(null);
    setQuickLoadingId(accountId);
    const res = await apiDemoLogin(accountId);
    setQuickLoadingId(null);
    if (!res.ok || !res.data?.user) {
      setError(res.error || "Could not sign in to circle account.");
      return;
    }
    onAuthenticated(res.data.user, false);
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {/* Calm Editorial Header */}
      <header className="border-b border-line bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1160px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLockup />
            <span className="hidden items-center gap-1.5 rounded-full border border-forest/20 bg-forest-wash px-2.5 py-0.5 text-[11px] font-medium text-forest sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-forest animate-pulse" />
              {liveInfo.ok
                ? `Live · ${liveInfo.onlineCount} in the room`
                : "Connecting…"}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeSegmentedControl theme={theme} onChange={onToggleTheme} />
          </div>
        </div>
      </header>

      {/* Main Split Editorial Layout */}
      <main className="mx-auto flex w-full max-w-[1160px] flex-1 items-center px-4 py-8 sm:px-6 lg:py-12 lg:px-8">
        <div className="grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Left Column: Editorial Story & Visual Showcase */}
          <section className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11.5px] font-medium text-muted shadow-2xs">
              <Sparkle size={13} className="text-clay" />
              <span>Designed for slower, real-time connection</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-[32px] sm:text-[40px] font-semibold leading-[1.12] tracking-[-0.035em] text-ink">
                A quieter place to share with your circle.
              </h1>
              <p className="max-w-[500px] text-[15px] leading-[1.65] text-muted">
                No algorithmic noise or endless strangers. Share unhurried photo
                notes, voice memos, short reels, small circles, and Thursday
                evening gatherings — all syncing live in real time.
              </p>
            </div>

            {/* Featured Studio Moment Card */}
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
              <div className="relative h-[190px] sm:h-[220px] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1100&h=620&fit=crop"
                  alt="Thursday ceramics studio table"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                  <UsersThree size={12} />
                  <span>Clay Club · Active right now</span>
                </div>
                <div className="absolute right-4 bottom-3.5 left-4 text-white">
                  <p className="text-[13.5px] font-medium leading-snug">
                    “A quieter place to share the unfinished version. No
                    metrics, no noise — just the people you actually know.”
                  </p>
                  <p className="mt-1 text-[11.5px] text-white/75">
                    The idea behind Thursday
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-line bg-surface-muted/40 px-2 py-3 text-center">
                <div className="px-2">
                  <p className="text-[13px] font-semibold text-ink">
                    Chronological
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Calm feed, zero rage-bait
                  </p>
                </div>
                <div className="px-2">
                  <p className="text-[13px] font-semibold text-ink">
                    Live Rooms
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Instant DMs, voice & calls
                  </p>
                </div>
                <div className="px-2">
                  <p className="text-[13px] font-semibold text-ink">
                    Small Circles
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Gatherings & field guides
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Right Column: Login & Sign Up Card */}
          <section className="lg:col-span-6">
            <div className="mx-auto w-full max-w-[460px] rounded-2xl border border-line bg-surface p-5 sm:p-7 shadow-card">
              {/* Segmented Mode Switcher */}
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <BrandIcon size={34} />
                  <div>
                    <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
                      {mode === "login" ? "Welcome back" : "Join Thursday"}
                    </h2>
                    <p className="text-[12px] text-muted">
                      {mode === "login"
                        ? "Sign in to your account"
                        : "Create your personal corner in seconds"}
                    </p>
                  </div>
                </div>
              </div>

              <div
                role="tablist"
                aria-label="Authentication mode"
                className="mb-5 grid grid-cols-2 rounded-xl border border-line bg-canvas p-1"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "login"}
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className={cn(
                    "h-9 rounded-lg text-[13px] font-semibold transition-all",
                    mode === "login"
                      ? "bg-surface text-ink shadow-2xs"
                      : "text-muted hover:text-ink",
                  )}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "signup"}
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className={cn(
                    "h-9 rounded-lg text-[13px] font-semibold transition-all",
                    mode === "signup"
                      ? "bg-surface text-ink shadow-2xs"
                      : "text-muted hover:text-ink",
                  )}
                >
                  Create account
                </button>
              </div>

              {error ? (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-clay/30 bg-clay-wash px-3.5 py-2.5 text-[12.5px] text-clay">
                  <Warning size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === "signup" ? (
                  <>
                    {/* Avatar Picker */}
                    <div className="rounded-xl border border-line bg-canvas/60 p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={avatar}
                          alt="Selected portrait"
                          className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-forest/25"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-ink">
                            Profile portrait
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            {PORTRAIT_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setAvatar(preset)}
                                className={cn(
                                  "h-6 w-6 overflow-hidden rounded-full border transition-transform",
                                  avatar === preset
                                    ? "scale-110 border-forest ring-2 ring-forest/30"
                                    : "border-line opacity-75 hover:opacity-100",
                                )}
                              >
                                <img
                                  src={preset}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="ml-1 inline-flex h-6 items-center gap-1 rounded-full border border-line-strong bg-surface px-2.5 text-[11px] font-medium text-ink-soft hover:border-forest hover:text-forest"
                            >
                              <UploadSimple size={11} />
                              <span>Upload</span>
                            </button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-ink-soft">
                          Full name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Adaeze Okafor"
                          className="h-10 w-full rounded-xl border border-line bg-canvas px-3 text-[13.5px] text-ink placeholder:text-faint focus:border-forest focus:bg-surface focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-1 flex items-center justify-between text-[11.5px] font-semibold text-ink-soft">
                          <span>Handle</span>
                          {handleStatus === "checking" ? (
                            <span className="text-[10.5px] font-normal text-faint">
                              Checking…
                            </span>
                          ) : handleStatus === "available" ? (
                            <span className="inline-flex items-center gap-0.5 text-[10.5px] font-medium text-forest">
                              <Check size={11} /> Available
                            </span>
                          ) : handleStatus === "taken" ? (
                            <span className="text-[10.5px] font-medium text-clay">
                              Taken
                            </span>
                          ) : null}
                        </label>
                        <div className="relative">
                          <At
                            size={14}
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                          />
                          <input
                            type="text"
                            required
                            value={handle}
                            onChange={(e) => {
                              setHandleTouched(true);
                              setHandle(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9_]/g, "")
                                  .slice(0, 24),
                              );
                            }}
                            placeholder="adaeze"
                            className="h-10 w-full rounded-xl border border-line bg-canvas pr-3 pl-8 text-[13.5px] text-ink placeholder:text-faint focus:border-forest focus:bg-surface focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-[11.5px] font-semibold text-ink-soft">
                        Email address
                      </label>
                      <div className="relative">
                        <EnvelopeSimple
                          size={15}
                          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                        />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="h-10 w-full rounded-xl border border-line bg-canvas pr-3 pl-9 text-[13.5px] text-ink placeholder:text-faint focus:border-forest focus:bg-surface focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-ink-soft">
                          City / Corner{" "}
                          <span className="font-normal text-faint">
                            (optional)
                          </span>
                        </label>
                        <div className="relative">
                          <MapPin
                            size={14}
                            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                          />
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Lagos · Lisbon · Portland"
                            className="h-10 w-full rounded-xl border border-line bg-canvas pr-3 pl-8 text-[13px] text-ink placeholder:text-faint focus:border-forest focus:bg-surface focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11.5px] font-semibold text-ink-soft">
                          Short bio{" "}
                          <span className="font-normal text-faint">
                            (optional)
                          </span>
                        </label>
                        <input
                          type="text"
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tea, film photos & slow walks"
                          className="h-10 w-full rounded-xl border border-line bg-canvas px-3 text-[13px] text-ink placeholder:text-faint focus:border-forest focus:bg-surface focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="mb-1 block text-[11.5px] font-semibold text-ink-soft">
                      Email or @handle
                    </label>
                    <div className="relative">
                      <EnvelopeSimple
                        size={15}
                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                      />
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="you@example.com or @yourhandle"
                        className="h-10 w-full rounded-xl border border-line bg-canvas pr-3 pl-9 text-[13.5px] text-ink placeholder:text-faint focus:border-forest focus:bg-surface focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1 flex items-center justify-between text-[11.5px] font-semibold text-ink-soft">
                    <span>Password</span>
                    {mode === "signup" ? (
                      <span className="text-[10.5px] font-normal text-faint">
                        Min. 6 characters
                      </span>
                    ) : null}
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={mode === "signup" ? 6 : 1}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === "signup"
                          ? "Create a strong password"
                          : "Enter your password"
                      }
                      className="h-10 w-full rounded-xl border border-line bg-canvas pr-10 pl-9 text-[13.5px] text-ink placeholder:text-faint focus:border-forest focus:bg-surface focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-faint hover:text-ink"
                    >
                      {showPassword ? (
                        <EyeSlash size={15} />
                      ) : (
                        <Eye size={15} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    (mode === "signup" && handleStatus === "taken")
                  }
                  className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-forest-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <CircleNotch size={16} className="animate-spin" />
                      <span>
                        {mode === "login"
                          ? "Signing in…"
                          : "Creating your space…"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === "login"
                          ? "Sign in to Thursday"
                          : "Create my Thursday account"}
                      </span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
