import { API_BASE_URL, getAuthToken, getClientId } from "./api";

/**
 * Client for Thursday's AI proxy.
 *
 * Nothing secret lives here: the browser talks to our own API, and the server
 * rotates across 16 OpenRouter keys and 11 free models behind the scenes.
 */

export type AiTask =
  | "chat"
  | "captions"
  | "summarize"
  | "rewrite"
  | "titles"
  | "thread"
  | "bio"
  | "reply"
  | "alt";

export interface AiTurn {
  role: "user" | "assistant";
  content: string;
  at?: string;
  modelLabel?: string;
  latencyMs?: number;
}

export interface AiReply {
  ok: boolean;
  text?: string;
  model?: string;
  modelLabel?: string;
  latencyMs?: number;
  attempts?: number;
  error?: string;
}

export interface AiKeyHealth {
  label: string;
  calls: number;
  failures: number;
  cooling: boolean;
  readyInMs: number;
  avgLatencyMs: number;
  lastError?: string;
}

export interface AiModelHealth {
  id?: string;
  label: string;
  calls: number;
  failures: number;
  cooling: boolean;
  avgLatencyMs: number;
  lastError?: string;
}

export interface AiStatus {
  keyCount: number;
  availableKeys: number;
  modelCount: number;
  availableModels: number;
  keys: AiKeyHealth[];
  models: AiModelHealth[];
  reachable: boolean;
}

const TASK_PARAMS: Partial<
  Record<AiTask, { maxTokens?: number; temperature?: number }>
> = {
  chat: { maxTokens: 700, temperature: 0.7 },
  captions: { maxTokens: 320, temperature: 0.9 },
  titles: { maxTokens: 260, temperature: 0.9 },
  summarize: { maxTokens: 480, temperature: 0.35 },
  rewrite: { maxTokens: 700, temperature: 0.55 },
  thread: { maxTokens: 520, temperature: 0.8 },
  bio: { maxTokens: 340, temperature: 0.85 },
  reply: { maxTokens: 300, temperature: 0.85 },
  alt: { maxTokens: 160, temperature: 0.4 },
};

async function post<T>(path: string, body: unknown, signal?: AbortSignal) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Thursday-Client-Id": getClientId(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json: json as T | null };
}

/** Ask the AI once. Returns a normalised reply; never throws. */
export async function aiAsk(opts: {
  task?: AiTask;
  prompt?: string;
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<AiReply> {
  const task = opts.task ?? "chat";
  const tune = TASK_PARAMS[task] || {};
  try {
    const { json } = await post<any>(
      "/api/ai/chat",
      {
        task,
        ...(opts.prompt ? { prompt: opts.prompt } : {}),
        ...(opts.messages ? { messages: opts.messages } : {}),
        maxTokens: opts.maxTokens ?? tune.maxTokens,
        temperature: opts.temperature ?? tune.temperature,
      },
      opts.signal,
    );
    if (json?.ok) {
      return {
        ok: true,
        text: String(json.text || "").trim(),
        model: json.model,
        modelLabel: json.modelLabel,
        latencyMs: json.latencyMs,
        attempts: json.attempts,
      };
    }
    return {
      ok: false,
      error:
        json?.error ||
        "Every free model is resting right now. Give it a moment and try again.",
      attempts: json?.attempts,
    };
  } catch (err: any) {
    if (err?.name === "AbortError") return { ok: false, error: "aborted" };
    return {
      ok: false,
      error: "Couldn't reach Thursday AI. Check your connection.",
    };
  }
}

/** Health of the rotating key/model pool — powers the "AI engine" panel. */
export async function aiStatus(): Promise<AiStatus> {
  const empty: AiStatus = {
    keyCount: 0,
    availableKeys: 0,
    modelCount: 0,
    availableModels: 0,
    keys: [],
    models: [],
    reachable: false,
  };
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/api/ai/status`, {
      headers: {
        "X-Thursday-Client-Id": getClientId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return empty;
    const json = await res.json().catch(() => null);
    if (!json) return empty;
    return {
      keyCount: Number(json.keyCount || 0),
      availableKeys: Number(json.availableKeys || 0),
      modelCount: Number(json.modelCount || 0),
      availableModels: Number(json.availableModels || 0),
      keys: Array.isArray(json.keys) ? json.keys : [],
      models: Array.isArray(json.models) ? json.models : [],
      reachable: true,
    };
  } catch {
    return empty;
  }
}

/** Split a list-style reply ("1. …", "• …", "— …") into clean lines. */
export function splitList(text = ""): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*(?:\d+[.)/]|[-•*—])\s*/, "").trim())
    .filter(Boolean);
}

export interface AiAction {
  task: AiTask;
  label: string;
  hint: string;
  placeholder: string;
  /** Copy reads as a list of choices the user can pick from. */
  list?: boolean;
  accent: "forest" | "clay" | "sand" | "sage";
}

export const AI_ACTIONS: AiAction[] = [
  {
    task: "captions",
    label: "Caption a moment",
    hint: "Describe the photo or scene — get three caption options.",
    placeholder:
      "A bowl of lemons on the windowsill, morning light, my grandmother's tablecloth",
    list: true,
    accent: "clay",
  },
  {
    task: "bio",
    label: "Write a profile bio",
    hint: "A few details about you become a 160-character bio.",
    placeholder:
      "I restore old cameras in Lisbon, teach Saturday workshops, terrible at keeping plants alive",
    accent: "forest",
  },
  {
    task: "titles",
    label: "Name something",
    hint: "Circles, gatherings, playlists, zines — five titles to choose from.",
    placeholder: "A monthly supper club for six neighbours who barely know each other",
    list: true,
    accent: "sand",
  },
  {
    task: "summarize",
    label: "Summarise a thread",
    hint: "Paste a long conversation, get the gist plus three takeaways.",
    placeholder: "Paste the messages or notes you want condensed…",
    accent: "sage",
  },
  {
    task: "rewrite",
    label: "Say it more clearly",
    hint: "Keeps your voice, removes the fog.",
    placeholder: "Paste the post or message you want to smooth out…",
    accent: "forest",
  },
  {
    task: "reply",
    label: "Draft a reply",
    hint: "Three warm ways to answer a message.",
    placeholder: "Paste the message you're answering…",
    list: true,
    accent: "clay",
  },
  {
    task: "thread",
    label: "Shape a thread",
    hint: "One idea becomes a calm three-post thread.",
    placeholder: "The case for walking meetings instead of video calls",
    list: true,
    accent: "sand",
  },
  {
    task: "alt",
    label: "Describe for accessibility",
    hint: "A screen-reader sentence for an image.",
    placeholder: "Photo of two people laughing at a kitchen table, flour everywhere",
    accent: "sage",
  },
];

export const AI_STARTERS = [
  "Help me write a kind message to a friend who's been quiet lately.",
  "Ideas for a small gathering that doesn't feel like homework.",
  "Rewrite this to sound less formal: “Please be advised the studio closes at six.”",
  "What should I cook for six people on a Thursday night?",
];
