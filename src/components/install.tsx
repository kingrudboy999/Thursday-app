import { useEffect, useState } from "react";
import { cn } from "../lib/cn";
import {
  CheckCircle,
  DeviceMobile,
  DownloadSimple,
  Sparkle,
} from "../lib/icons";

export function InstallAppCard({ onToast }: any) {
  const [u, m] = useState<any>(null),
    [d, x] = useState<any>(false);
  useEffect(() => {
    const A = (y?: any) => {
        y.preventDefault();
        m(y);
      },
      T = () => x(true);
    window.addEventListener("beforeinstallprompt", A);
    window.addEventListener("appinstalled", T);
    window.matchMedia("(display-mode: standalone)").matches && x(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", A);
      window.removeEventListener("appinstalled", T);
    };
  }, []);
  const w = async () => {
    if (!u) {
      onToast(
        "Add Thursday to your home screen",
        "Open your browser menu and choose “Install app” or “Add to Home Screen”.",
      );
      return;
    }
    await u.prompt();
    (await u.userChoice).outcome === "accepted" &&
      (x(true),
      onToast(
        "Thursday is installed",
        "Open it from your home screen like any other app.",
      ));
    m(null);
  };
  return (
    <div className="px-4 py-3.5 sm:px-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest text-white">
          <DeviceMobile size={17} weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-ink">
            {d ? "Thursday is installed" : "Install Thursday"}
          </p>
          <p className="mt-0.5 text-[10.5px] leading-[1.55] text-muted">
            {d
              ? "You're using the installed app. Everything works offline once it has loaded."
              : "Add the app to your phone or desktop. It opens full screen and remembers your workspace."}
          </p>
        </div>
        {d ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-forest-soft px-2 py-1 text-[10px] font-semibold text-forest">
            <CheckCircle size={11} weight="fill" />
            {" Ready"}
          </span>
        ) : (
          <button
            type="button"
            onClick={w}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-[6px] bg-forest px-2.5 text-[10.5px] font-semibold text-white hover:bg-forest-hover"
          >
            Install
          </button>
        )}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a
          href="/downloads/thursday-offline.html"
          download="Thursday.html"
          className="flex items-start gap-2.5 rounded-lg border border-line p-2.5 transition-colors hover:border-line-strong hover:bg-surface-muted"
        >
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-muted">
            <DownloadSimple size={14} />
          </span>
          <span className="min-w-0">
            <span className="block text-[10.5px] font-semibold text-ink">
              Download Thursday.html
            </span>
            <span className="mt-0.5 block text-[9.5px] leading-[1.5] text-muted">
              The whole app in under 1 MB. Open in any browser, works offline.
            </span>
          </span>
        </a>
        <a
          href="/downloads/thursday-react-native.zip"
          download="thursday-react-native.zip"
          className="flex items-start gap-2.5 rounded-lg border border-line p-2.5 transition-colors hover:border-line-strong hover:bg-surface-muted"
        >
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-muted">
            <DownloadSimple size={14} />
          </span>
          <span className="min-w-0">
            <span className="block text-[10.5px] font-semibold text-ink">
              React Native source
            </span>
            <span className="mt-0.5 block text-[9.5px] leading-[1.5] text-muted">
              Native source with the size config included: ~24 MB APK instead of
              65 MB.
            </span>
          </span>
        </a>
      </div>
      <div
        className={cn(
          "mt-2 flex items-start gap-2 rounded-lg border px-2.5 py-2",
          "border-forest/15 bg-forest-wash",
        )}
      >
        <Sparkle
          size={12}
          weight="fill"
          className="mt-0.5 shrink-0 text-forest"
        />
        <p className="text-[9.5px] leading-[1.55] text-forest/90">
          Your posts, messages, and settings stay in this browser. Use “Export
          workspace” to keep a backup.
        </p>
      </div>
    </div>
  );
}
