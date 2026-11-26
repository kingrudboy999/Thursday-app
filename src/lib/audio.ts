import { useEffect, useState } from "react";

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new Ctor();
  }
  if (sharedCtx.state === "suspended") {
    sharedCtx.resume().catch(() => {});
  }
  return sharedCtx;
}

const TRACK_CHORDS: Record<string, { chords: number[][]; tempoMs: number; wave: OscillatorType }> = {
  audio_morning: {
    chords: [
      [261.63, 329.63, 392.0, 493.88],
      [220.0, 293.66, 349.23, 440.0],
      [174.61, 261.63, 329.63, 392.0],
      [196.0, 246.94, 293.66, 392.0],
    ],
    tempoMs: 2200,
    wave: "sine",
  },
  audio_rain: {
    chords: [
      [293.66, 349.23, 440.0, 523.25],
      [261.63, 329.63, 392.0, 493.88],
      [233.08, 293.66, 349.23, 440.0],
      [220.0, 277.18, 329.63, 415.3],
    ],
    tempoMs: 2600,
    wave: "triangle",
  },
  audio_guitar: {
    chords: [
      [196.0, 293.66, 392.0, 493.88],
      [220.0, 329.63, 392.0, 493.88],
      [261.63, 329.63, 392.0, 523.25],
      [293.66, 369.99, 440.0, 587.33],
    ],
    tempoMs: 1850,
    wave: "triangle",
  },
  audio_lofi: {
    chords: [
      [261.63, 311.13, 392.0, 466.16],
      [233.08, 293.66, 349.23, 440.0],
      [207.65, 261.63, 311.13, 392.0],
      [196.0, 246.94, 293.66, 369.99],
    ],
    tempoMs: 2100,
    wave: "sine",
  },
  audio_evening: {
    chords: [
      [174.61, 220.0, 261.63, 329.63],
      [164.81, 207.65, 246.94, 329.63],
      [146.83, 196.0, 246.94, 293.66],
      [196.0, 246.94, 329.63, 392.0],
    ],
    tempoMs: 2800,
    wave: "sine",
  },
};

function resolvePresetKey(idOrTitle: string): string {
  if (TRACK_CHORDS[idOrTitle]) return idOrTitle;
  const lower = (idOrTitle || "").toLowerCase();
  if (lower.includes("rain") || lower.includes("window")) return "audio_rain";
  if (lower.includes("guitar") || lower.includes("walk") || lower.includes("folk")) return "audio_guitar";
  if (lower.includes("side b") || lower.includes("beat") || lower.includes("tape") || lower.includes("crate"))
    return "audio_lofi";
  if (lower.includes("evening") || lower.includes("night") || lower.includes("ambient")) return "audio_evening";
  return "audio_morning";
}

type ActiveAmbient = {
  key: string;
  stop: () => void;
};

let currentAmbient: ActiveAmbient | null = null;
const ambientListeners = new Set<(activeKey: string | null) => void>();

function notifyAmbientListeners() {
  const key = currentAmbient?.key ?? null;
  ambientListeners.forEach((fn) => fn(key));
}

export function stopAmbientAudio() {
  if (currentAmbient) {
    const prev = currentAmbient;
    currentAmbient = null;
    prev.stop();
    notifyAmbientListeners();
  }
}

export function toggleAmbientAudio(key: string, hintTitle?: string): boolean {
  if (currentAmbient?.key === key) {
    stopAmbientAudio();
    return false;
  }
  stopAmbientAudio();
  const ctx = getAudioContext();
  if (!ctx) return false;

  const preset = TRACK_CHORDS[resolvePresetKey(hintTitle || key)] ?? TRACK_CHORDS.audio_morning;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.08, ctx.currentTime);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1150, ctx.currentTime);
  filter.connect(master);
  master.connect(ctx.destination);

  let step = 0;
  let stopped = false;

  const playChord = () => {
    if (stopped || !ctx || ctx.state === "closed") return;
    const notes = preset.chords[step % preset.chords.length];
    step += 1;
    const now = ctx.currentTime;
    const dur = preset.tempoMs / 1000;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = preset.wave;
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      osc.detune.setValueAtTime((idx - 1.5) * 3.5, now);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.24 / notes.length, now + idx * 0.06 + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + dur + 0.35);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now + idx * 0.06);
      osc.stop(now + dur + 0.4);
    });
  };

  playChord();
  const timer = window.setInterval(playChord, preset.tempoMs);
  const autoStop = window.setTimeout(() => {
    if (currentAmbient?.key === key) stopAmbientAudio();
  }, 45_000);

  currentAmbient = {
    key,
    stop: () => {
      stopped = true;
      window.clearInterval(timer);
      window.clearTimeout(autoStop);
      try {
        master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.08);
        window.setTimeout(() => {
          try {
            master.disconnect();
          } catch {}
        }, 250);
      } catch {}
    },
  };
  notifyAmbientListeners();
  return true;
}

export function useAmbientAudio() {
  const [activeKey, setActiveKey] = useState<string | null>(currentAmbient?.key ?? null);
  useEffect(() => {
    ambientListeners.add(setActiveKey);
    return () => {
      ambientListeners.delete(setActiveKey);
    };
  }, []);
  return {
    activeKey,
    toggle: toggleAmbientAudio,
    stop: stopAmbientAudio,
  };
}

export function parseDurationSeconds(durationStr?: string): number {
  if (!durationStr) return 12;
  const parts = durationStr.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return Math.max(2, parts[0] * 60 + parts[1]);
  }
  return 12;
}

type ActiveVoicePlayback = {
  id: string;
  stop: () => void;
};

let activeVoice: ActiveVoicePlayback | null = null;

export function stopVoiceNotePlayback() {
  if (activeVoice) {
    const prev = activeVoice;
    activeVoice = null;
    prev.stop();
  }
}

export function playVoiceNote(
  id: string,
  audioUrl: string | undefined,
  durationStr: string | undefined,
  onProgress: (progress: number, playing: boolean) => void,
): boolean {
  if (activeVoice?.id === id) {
    stopVoiceNotePlayback();
    onProgress(0, false);
    return false;
  }
  stopVoiceNotePlayback();
  stopAmbientAudio();

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    const fallbackTotal = parseDurationSeconds(durationStr);
    let raf = 0;
    const tick = () => {
      const total = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : fallbackTotal;
      const pct = Math.min(1, audio.currentTime / Math.max(0.5, total));
      onProgress(pct, !audio.paused && !audio.ended);
      if (!audio.paused && !audio.ended) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    audio.onended = () => {
      window.cancelAnimationFrame(raf);
      activeVoice = null;
      onProgress(0, false);
    };
    audio.onerror = () => {
      window.cancelAnimationFrame(raf);
      activeVoice = null;
      onProgress(0, false);
    };
    audio
      .play()
      .then(() => {
        onProgress(0.02, true);
        raf = window.requestAnimationFrame(tick);
      })
      .catch(() => {
        onProgress(0, false);
      });
    activeVoice = {
      id,
      stop: () => {
        window.cancelAnimationFrame(raf);
        audio.pause();
        audio.currentTime = 0;
        onProgress(0, false);
      },
    };
    return true;
  }

  // Warm conversational cadence synthesis for sample/preset voice notes without recorded blob
  const ctx = getAudioContext();
  const totalSec = Math.min(18, parseDurationSeconds(durationStr));
  const startedAt = performance.now();
  let stopped = false;

  const syllableTimer = ctx
    ? window.setInterval(() => {
        if (stopped || !ctx || ctx.state === "closed") return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        const base = 175 + Math.sin(performance.now() / 340) * 32 + (Math.random() - 0.5) * 18;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(base, now);
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(520, now);
        filter.Q.setValueAtTime(2.2, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.22);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
      }, 280)
    : 0;

  const progressTimer = window.setInterval(() => {
    if (stopped) return;
    const elapsed = (performance.now() - startedAt) / 1000;
    if (elapsed >= totalSec) {
      stopVoiceNotePlayback();
      onProgress(0, false);
      return;
    }
    onProgress(Math.min(1, elapsed / totalSec), true);
  }, 80);

  onProgress(0.03, true);
  activeVoice = {
    id,
    stop: () => {
      stopped = true;
      if (syllableTimer) window.clearInterval(syllableTimer);
      window.clearInterval(progressTimer);
      onProgress(0, false);
    },
  };
  return true;
}

export class VoiceRecorderSession {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];

  async start(): Promise<boolean> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return false;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.chunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) this.chunks.push(ev.data);
      };
      this.mediaRecorder.start(200);
      return true;
    } catch {
      this.cleanupStream();
      return false;
    }
  }

  async stop(): Promise<string | undefined> {
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
      this.cleanupStream();
      return undefined;
    }
    return new Promise((resolve) => {
      const rec = this.mediaRecorder!;
      rec.onstop = () => {
        this.cleanupStream();
        if (!this.chunks.length) {
          resolve(undefined);
          return;
        }
        const blob = new Blob(this.chunks, { type: rec.mimeType || "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(typeof reader.result === "string" ? reader.result : undefined);
        };
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(blob);
      };
      try {
        rec.stop();
      } catch {
        this.cleanupStream();
        resolve(undefined);
      }
    });
  }

  cancel() {
    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.onstop = null;
        this.mediaRecorder.stop();
      }
    } catch {}
    this.cleanupStream();
  }

  private cleanupStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }
}

export function playGentleCallTone(): () => void {
  const ctx = getAudioContext();
  if (!ctx) return () => {};
  let stopped = false;
  const ring = () => {
    if (stopped || !ctx || ctx.state === "closed") return;
    const now = ctx.currentTime;
    [392.0, 493.88].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.14);
      gain.gain.setValueAtTime(0.0001, now + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.035, now + i * 0.14 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.14);
      osc.stop(now + i * 0.14 + 0.7);
    });
  };
  ring();
  const id = window.setInterval(ring, 2400);
  return () => {
    stopped = true;
    window.clearInterval(id);
  };
}

/**
 * Reads an image file into a compressed JPEG data URL, sized for storage.
 *
 * Phone photos are the hard case, and the old version failed on them:
 *
 *  - iPhones frequently hand over HEIC. Browsers cannot decode HEIC, so the
 *    image errors out; the old code then resolved the *original* data URL, and
 *    that `data:image/heic;base64,…` string renders as nothing. The profile
 *    looked empty even though a value had been saved.
 *  - Truncated or corrupt JPEGs took the same path and stored bytes that no
 *    browser can draw.
 *  - A large photo could exceed the upload body limit, which fails the request
 *    while the UI still announced success.
 *
 * This now always yields a bounded JPEG, or rejects so the caller can explain
 * the problem instead of saving something that cannot be displayed.
 */
export async function readFileAsDataUrl(
  file: File,
  maxDimension = 1200,
): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("That file could not be read."));
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.readAsDataURL(file);
  });

  const looksLikeImage =
    file.type.startsWith("image/") || /^data:image\//.test(raw);
  if (!looksLikeImage) {
    throw new Error("Please choose an image file.");
  }

  const decoded = await loadImageElement(raw);
  if (!decoded) {
    // HEIC and other undecodable formats land here. Ask for a normal photo
    // rather than storing something the browser can never display.
    const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
    throw new Error(
      isHeic
        ? "iPhone HEIC photos can't be shown in the browser. In your camera settings choose “Most Compatible”, or pick a JPEG/PNG instead."
        : "That image couldn't be opened. Try a different photo.",
    );
  }

  const scale = Math.min(
    1,
    maxDimension / Math.max(decoded.width || 1, decoded.height || 1),
  );
  const width = Math.max(1, Math.round(decoded.width * scale));
  const height = Math.max(1, Math.round(decoded.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx2d = canvas.getContext("2d");
  if (!ctx2d) {
    throw new Error("This browser could not prepare that image.");
  }
  ctx2d.drawImage(decoded, 0, 0, width, height);

  // Step the quality down until the result is comfortably storable, so a busy
  // photo never turns into a multi-megabyte request.
  let quality = 0.84;
  let out = canvas.toDataURL("image/jpeg", quality);
  const softCap = 600_000;
  while (out.length > softCap && quality > 0.4) {
    quality -= 0.12;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  if (out.length > 2_500_000) {
    throw new Error("That image is too large. Try a smaller photo.");
  }
  return out;
}

function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof Image === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
