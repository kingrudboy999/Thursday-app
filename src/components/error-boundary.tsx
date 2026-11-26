import { Component, type ReactNode } from "react";
import { ThursdayMark } from "./brand";

/**
 * Application-level error boundary.
 *
 * Before this existed, any render-time exception unmounted the whole tree and
 * the user was left looking at a blank page with no way out. Now a crash shows
 * a calm, recoverable screen and the error is logged for diagnosis.
 */
export class AppErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; info: string }
> {
  state = { error: null as Error | null, info: "" };

  static getDerivedStateFromError(error: Error) {
    return { error, info: "" };
  }

  componentDidCatch(error: Error, info: any) {
    this.setState({ info: String(info?.componentStack || "").slice(0, 600) });
    // Keep a breadcrumb so a user can report what happened without devtools.
    try {
      const key = "thursday:last-crash";
      localStorage.setItem(
        key,
        JSON.stringify({
          message: String(error?.message || error),
          stack: String(error?.stack || "").slice(0, 2000),
          componentStack: String(info?.componentStack || "").slice(0, 2000),
          at: new Date().toISOString(),
        }),
      );
    } catch {}
    console.error("Thursday crashed:", error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-16">
        <ThursdayMark size={52} className="shadow-[0_8px_28px_rgba(16,19,24,0.16)]" />
        <h1 className="mt-6 text-[20px] font-semibold tracking-[-0.02em] text-ink">
          Something slipped
        </h1>
        <p className="mt-2 max-w-[44ch] text-center text-[13.5px] leading-relaxed text-muted">
          A part of Thursday didn’t load properly. Your data is safe — reloading
          usually clears it.
        </p>
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center rounded-lg bg-forest px-5 text-[13.5px] font-semibold text-white transition-colors hover:bg-forest-hover"
          >
            Reload Thursday
          </button>
          <button
            type="button"
            onClick={() => {
              // Recover without a hard reload by clearing the error state.
              this.setState({ error: null, info: "" });
            }}
            className="inline-flex h-10 items-center rounded-lg border border-line bg-surface px-4 text-[13.5px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            Try again
          </button>
        </div>
        <details className="mt-8 w-full max-w-[560px] rounded-lg border border-line bg-surface">
          <summary className="cursor-pointer px-3.5 py-2.5 text-[11.5px] font-medium text-faint select-none">
            Technical details
          </summary>
          <pre className="thin-scrollbar max-h-[220px] overflow-auto border-t border-line px-3.5 py-3 text-[10.5px] leading-relaxed whitespace-pre-wrap text-muted">
            {String(error.stack || error.message)}
            {this.state.info ? `\n\nComponent stack:${this.state.info}` : ""}
          </pre>
        </details>
      </div>
    );
  }
}
