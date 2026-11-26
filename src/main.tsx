import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppErrorBoundary } from "./components/error-boundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        // Poll for a new worker so a stale bundle can never strand a client.
        window.setInterval(() => reg.update().catch(() => {}), 60_000);

        reg.addEventListener("updatefound", () => {
          const fresh = reg.installing;
          fresh?.addEventListener("statechange", () => {
            // Only reload once, and only when a previous worker was replaced.
            if (fresh.state === "activated" && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      })
      .catch(() => {});
  });
}
