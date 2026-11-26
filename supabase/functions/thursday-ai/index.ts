/**
 * thursday-ai — Thursday's OpenRouter proxy, served from Supabase Edge Functions.
 *
 * Single-file deploy: the engine below is the same code that runs on Railway
 * (server/src/ai.ts), inlined because the deployment API only accepts one file.
 * Keep the two in sync — server/src/ai.ts is the source of truth.
 *
 *   GET  /thursday-ai/status   → pool health (labels only, never raw keys)
 *   POST /thursday-ai/chat     → { task?, prompt?|messages[], maxTokens? }
 *
 * No OpenRouter credential ever leaves the server.
 */

interface AiKeyState {
  key: string;
  index: number;
  label: string;
  calls: number;
  failures: number;
  consecutiveFailures: number;
  cooldownUntil: number;
  lastUsed: number;
  lastError?: string;
  totalLatencyMs: number;
}

interface AiModelState {
  id: string;
  label: string;
  calls: number;
  failures: number;
  consecutiveFailures: number;
  cooldownUntil: number;
  totalLatencyMs: number;
  lastError?: string;
}

const RAW_KEYS = [
  "OPENROUTER_KEY_REMOVED_01",
  "OPENROUTER_KEY_REMOVED_04",
  "OPENROUTER_KEY_REMOVED_03",
  "OPENROUTER_KEY_REMOVED_06",
  "OPENROUTER_KEY_REMOVED_08",
  "OPENROUTER_KEY_REMOVED_11",
  "OPENROUTER_KEY_REMOVED_09",
  "OPENROUTER_KEY_REMOVED_14",
  "OPENROUTER_KEY_REMOVED_16",
  "OPENROUTER_KEY_REMOVED_12",
  "OPENROUTER_KEY_REMOVED_02",
  "OPENROUTER_KEY_REMOVED_07",
  "OPENROUTER_KEY_REMOVED_13",
  "OPENROUTER_KEY_REMOVED_15",
  "OPENROUTER_KEY_REMOVED_05",
  "OPENROUTER_KEY_REMOVED_10",
];

/**
 * Extra keys can be injected without a redeploy via env vars.
 * Works on Node (Railway) and Deno (Supabase Edge Functions).
 */
function readEnv(): Record<string, string | undefined> {
  const g = globalThis as any;
  if (g.Deno?.env?.toObject) {
    try {
      return { ...Deno.env.toObject() };
    } catch {
      return {};
    }
  }
  return typeof process !== "undefined" && process.env ? { ...process.env } : {};
}

function collectKeys(): string[] {
  const extra: string[] = [];
  for (const [name, value] of Object.entries(readEnv())) {
    if (!value) continue;
    if (name === "OPENROUTER_API_KEYS") {
      extra.push(
        ...String(value)
          .split(/[\s,]+/)
          .map((k) => k.trim())
          .filter(Boolean),
      );
    } else if (/^OPENROUTER_API_KEY(_\d+)?$/.test(name)) {
      const clean = String(value).trim();
      if (clean) extra.push(clean);
    }
  }
  return Array.from(new Set([...RAW_KEYS, ...extra])).filter((k) =>
    k.startsWith("sk-or-"),
  );
}

const keys: AiKeyState[] = collectKeys().map((key, index) => ({
  key,
  index,
  label: `key-${String(index + 1).padStart(2, "0")}…${key.slice(-6)}`,
  calls: 0,
  failures: 0,
  consecutiveFailures: 0,
  cooldownUntil: 0,
  lastUsed: 0,
  totalLatencyMs: 0,
}));

/**
 * Ranked by measured reliability: models that reliably return `content`
 * (not pure reasoning traces) and answer fast come first.
 */
const MODEL_CATALOG: Array<{ id: string; label: string; reasoning?: boolean }> = [
  { id: "nvidia/nemotron-3.5-super-vl:free", label: "Nemotron 3.5 Super" },
  { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "Nemotron 3 Ultra" },
  { id: "baidu/ernie-5.5-flash-preview:free", label: "ERNIE 5.5 Flash" },
  { id: "particle-ai/particle-1:free", label: "Particle 1" },
  { id: "google/gemma-4-26b-a4b-it:free", label: "Gemma 4 26B" },
  { id: "liquid/lfm-3-1.7b:free", label: "LFM 3 1.7B" },
  { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B" },
  { id: "inclusionai/ling-3.2-flash:free", label: "Ling 3.2 Flash" },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    label: "Nemotron Nano Omni",
    reasoning: true,
  },
  {
    id: "nvidia/nemotron-3.5-lightning:free",
    label: "Nemotron 3.5 Lightning",
    reasoning: true,
  },
  {
    id: "recursive/flint-v1.0:free",
    label: "Flint 1.0",
    reasoning: true,
  },
];

const models: AiModelState[] = MODEL_CATALOG.map((m) => ({
  id: m.id,
  label: m.label,
  calls: 0,
  failures: 0,
  consecutiveFailures: 0,
  cooldownUntil: 0,
  totalLatencyMs: 0,
}));

const modelMeta = new Map(MODEL_CATALOG.map((m) => [m.id, m]));

const KEY_COOLDOWN_MS = 60_000;
const MODEL_COOLDOWN_MS = 45_000;
const MAX_ATTEMPTS = 7;

let keyCursor = 0;
let modelCursor = 0;

function pickKey(): AiKeyState | null {
  const now = Date.now();
  const n = keys.length;
  if (!n) return null;
  for (let i = 0; i < n; i++) {
    const candidate = keys[(keyCursor + i) % n];
    if (candidate.cooldownUntil <= now) {
      keyCursor = (keyCursor + i + 1) % n;
      return candidate;
    }
  }
  // Everything is cooling down — use whichever recovers soonest.
  const soonest = keys.reduce((a, b) =>
    a.cooldownUntil <= b.cooldownUntil ? a : b,
  );
  keyCursor = (keyCursor + 1) % n;
  return soonest;
}

function pickModel(excluded: Set<string>): AiModelState | null {
  const now = Date.now();
  const n = models.length;
  for (let i = 0; i < n; i++) {
    const candidate = models[(modelCursor + i) % n];
    if (excluded.has(candidate.id)) continue;
    if (candidate.cooldownUntil <= now) {
      modelCursor = (modelCursor + i + 1) % n;
      return candidate;
    }
  }
  const fallback = models.find(
    (m) => !excluded.has(m.id) && m.cooldownUntil <= now + 5_000,
  );
  return fallback ?? null;
}

type AiTask =
  | "chat"
  | "captions"
  | "summarize"
  | "rewrite"
  | "titles"
  | "thread"
  | "bio"
  | "reply"
  | "alt";

const TASK_STYLE: Record<AiTask, { system: string; temperature: number; maxTokens: number }> =
  {
    chat: {
      system:
        "You are Thursday's assistant — a warm, calm, editorial-minded helper inside a quiet social app.\n" +
        "Voice: unhurried, kind, specific. Never corporate, never breathless, no exclamation spam.\n" +
        "Be concise (2–5 sentences unless asked for more). Use plain language and short paragraphs.\n" +
        "Help with writing, ideas, recipes, studio practice, gatherings, and gentle app guidance.\n" +
        "If the user seems to want a copy-ready caption or bio, give exactly that with no preamble.",
      temperature: 0.7,
      maxTokens: 700,
    },
    captions: {
      system:
        "You write captions for Thursday, a calm photo-sharing app.\n" +
        "Return 3 options, each a single vivid sentence under 18 words, warm and observational.\n" +
        "Format exactly:\n1. …\n2. …\n3. …\nNo preamble, no hashtags unless asked.",
      temperature: 0.9,
      maxTokens: 260,
    },
    titles: {
      system:
        "You name things for Thursday, a quiet social app for small circles.\n" +
        "Return 5 short evocative titles (2–5 words) as a numbered list. No preamble.",
      temperature: 0.9,
      maxTokens: 220,
    },
    summarize: {
      system:
        "Summarize the supplied Thursday conversation or notes for a busy reader.\n" +
        "Return: one-sentence gist, then 3 bullet takeaways starting with '• '.\n" +
        "Stay faithful to the text. No invented facts. No preamble.",
      temperature: 0.3,
      maxTokens: 420,
    },
    rewrite: {
      system:
        "Rewrite the user's text to feel clearer and warmer while keeping their voice and every fact.\n" +
        "Return only the rewritten text, no commentary.",
      temperature: 0.55,
      maxTokens: 700,
    },
    thread: {
      system:
        "Turn the user's idea into a short Thursday thread of 3 posts.\n" +
        "Each post: one or two sentences, under 220 characters, conversational and calm.\n" +
        "Format exactly:\n1/ …\n2/ …\n3/ …\nNo preamble.",
      temperature: 0.8,
      maxTokens: 480,
    },
    bio: {
      system:
        "Write a short Thursday profile bio (max 160 characters) from the user's details.\n" +
        "Warm, specific, a little wry. Return only the bio text — no quotes, no preamble.",
      temperature: 0.85,
      maxTokens: 320,
    },
    reply: {
      system:
        "Suggest 3 natural, kind replies the user could send in this Thursday chat.\n" +
        "Each under 20 words, matching the tone of the conversation.\n" +
        "Format exactly:\n1. …\n2. …\n3. …\nNo preamble.",
      temperature: 0.85,
      maxTokens: 260,
    },
    alt: {
      system:
        "Write one descriptive alt-text sentence for the described image, screen-reader friendly.\n" +
        "Under 125 characters. Return only the sentence.",
      temperature: 0.4,
      maxTokens: 120,
    },
  };

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function extractContent(json: any): string {
  const choice = (json?.choices ?? [])[0] ?? {};
  const message = choice.message ?? {};
  let content: string = typeof message.content === "string" ? message.content : "";
  if (!content && typeof message.reasoning === "string") {
    // Reasoning-only models: salvage the final answer after the last heading.
    const reasoning = message.reasoning as string;
    const tail = reasoning.split(/\n\s*\n/).filter(Boolean).pop() ?? "";
    content = tail.trim();
  }
  return content
    .replace(/^\s*(?:assistant|answer)\s*:\s*/i, "")
    .trim();
}

/** Strip preambles, labels and char-count annotations small models leak. */
function cleanOutput(text: string, task: AiTask): string {
  let out = text.trim();

  // Remove wrapping quotes/fences the model added around the whole answer
  out = out.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").trim();

  // Drop a leading meta line ("Draft ideas:", "Here are 3 options:", "Sure!")
  out = out.replace(
    /^(?:sure|certainly|of course|okay|ok|absolutely)\b[^\n]*\n+/i,
    "",
  );
  out = out.replace(
    /^(?:here(?:'s| is| are)[^\n]*|draft(?:\s+ideas)?|suggestions?|options?|answer|response|output|result)\s*:\s*\n?/i,
    "",
  );

  // Remove "Option N:" / "Draft N:" / "Note:" prefixes and "Count: ..." tails
  out = out.replace(
    /^\s*(?:option|draft|choice|version|idea|answer|note|reply|candidate|result|output|final|bio)\s*\d*\s*:\s*/i,
    "",
  );
  out = out.split(/\n\s*(?:count|chars?|characters?|length)\s*:/i)[0];
  out = out.replace(/\s*(?:count|chars?|characters?|length)\s*:.*$/gim, "");

  // Strip markdown emphasis the small models sprinkle in: **bold**, *em*, `code`
  out = out.replace(/\*\*(.+?)\*\*/g, "$1").replace(/(?<!\*)\*(?!\s)([^*\n]+?)\*(?!\*)/g, "$1");
  out = out.replace(/`([^`\n]+)`/g, "$1");
  out = out.replace(/\*(?=\s*\d+[.)])/g, "");
  out = out.replace(/(?<=\n|^)\s*\*\s+/g, "- ");

  // Drop an opening line of pure meta-commentary ("Let's check character count
  // for: …", "We need 3 options …") and keep the real answer underneath.
  const metaLine = /^\s*(?:let'?s\s+(?:check|count|see|verify|look|craft|write|make|draft|aim)|we\s+(?:need|want|should|must)|i'?ll\s+(?:write|craft|draft|give)|the\s+user|character\s+count|under\s+\d+\s+characters?|target\s*[:=]|constraints?\s*:)/i;
  const ml = out.split(/\n/);
  if (ml.length > 1 && metaLine.test(ml[0]) && ml.slice(1).join(" ").trim().length > 24) {
    out = ml.slice(1).join("\n").trim();
  }

  // Remove trailing char/word count annotations like "(96 chars)"
  out = out.replace(/\s*\((?:\d+\s*(?:chars?|characters?)|\d+\s*words?)\)\s*$/gim, "");
  out = out.replace(/\s*[—-]\s*\d+\s*(?:chars?|characters?)\s*$/gim, "");

  // Remove numbered-prefix noise for single-value tasks
  if (task === "bio" || task === "alt" || task === "rewrite") {
    out = out.replace(/^\s*\d+[.)]\s*/, "");
    // If multiple draft lines leaked through, keep the first clean one
    const lines = out.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      const numbered = lines.filter((l) => /^\d+[.)]\s+/.test(l));
      if (numbered.length >= 1) {
        out = numbered[0].replace(/^\d+[.)]\s*/, "");
      } else {
        out = lines.find((l) => l.length > 12) ?? lines[0];
      }
    }
  }

  // Unwrap a wholly-quoted answer
  if (/^".*"$/s.test(out) && out.length > 3) {
    out = out.slice(1, -1).trim();
  }
  // Drop unmatched quote marks (models often open a quote they never close)
  const quoteChars = ['"', "\u201c", "\u201d"];
  for (const q of quoteChars) {
    const n = out.split(q).length - 1;
    if (n % 2 === 1) {
      // remove the last occurrence — the orphaned one
      const idx = out.lastIndexOf(q);
      if (idx > -1) out = (out.slice(0, idx) + out.slice(idx + 1)).trim();
    }
  }
  // Trim stray trailing operator/punctuation junk models append
  out = out.replace(/[\s=+*|>~^]+$/g, "").replace(/\s*[,;:]\s*$/g, "").trim();
  return out.trim();
}

/** Detect meta-commentary that small models leak instead of answering. */
function looksMeta(text: string): boolean {
  const head = text.slice(0, 220).toLowerCase();
  const tells = [
    "we need",
    "we need answer",
    "the user wants",
    "the user asks",
    "user says",
    "user wants",
    "let me ",
    "i need to ",
    "i should ",
    "key elements",
    "analyze the request",
    "step 1",
    "first, i",
    "draft ideas",
    "need exactly",
    "let's craft",
    "let's write",
    "let's make",
    "craft five",
    "craft three",
    "the options",
    "brainstorm",
    "here's a thinking",
    "thinking process",
    "let's check",
    "character count",
    "char count",
    "let's count",
    "check the count",
    "under 160",
    "within 160",
    "max 160",
    "exactly 160",
    "as an ai",
    "i cannot",
    "i'm unable",
  ];
  const hits = tells.filter((t) => head.includes(t)).length;
  if (hits >= 1 && head.length < 200) return true;
  if (hits >= 2) return true;
  // Echo-only answer: model just repeated the prompt
  return false;
}

/** Reject degenerate model output (token traces, counting loops, repetition). */
function looksDegenerate(text: string): boolean {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  // Token-by-token traces like "Q-u-i-e-t(5) space 6,"
  if (/(?:\b[a-z]\s*[-\u2010-\u2015]\s*){4,}/i.test(trimmed)) return true;
  if ((trimmed.match(/\bspace\s+\d+/gi) ?? []).length >= 2) return true;
  if ((trimmed.match(/\b\w+\(\d+\)/g) ?? []).length >= 2) return true;
  // Runaway repetition of the same short line
  const lines = trimmed.split(/\n+/).filter((l) => l.trim());
  if (lines.length >= 4) {
    const unique = new Set(lines.map((l) => l.trim().toLowerCase()));
    if (unique.size <= Math.ceil(lines.length / 3)) return true;
  }
  // Character spam
  if (/(.)\1{40,}/.test(trimmed)) return true;
  // Mostly non-word gibberish
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 4) {
    const odd = words.filter((w) => /^[^\p{L}\p{N}#@·•—–"'"'.,!?()\-]+$/u.test(w));
    if (odd.length / words.length > 0.4) return true;
  }
  return false;
}

interface AiGenerateResult {
  ok: boolean;
  text?: string;
  model?: string;
  modelLabel?: string;
  keyLabel?: string;
  latencyMs?: number;
  attempts?: number;
  error?: string;
  status?: number;
}

async function aiGenerate(options: {
  task?: AiTask;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<AiGenerateResult> {
  const task = (options.task ?? "chat") as AiTask;
  const style = TASK_STYLE[task] ?? TASK_STYLE.chat;
  const startedAt = Date.now();

  if (!keys.length) {
    return { ok: false, error: "No AI keys configured on the server." };
  }
  if (!Array.isArray(options.messages) || !options.messages.length) {
    return { ok: false, error: "No messages provided." };
  }

  const payloadMessages: ChatMessage[] = [
    { role: "system", content: style.system },
    ...options.messages.slice(-12).map((m) => ({
      role: (m.role === "assistant" ? "assistant" : m.role === "system" ? "system" : "user") as
        | "system"
        | "user"
        | "assistant",
      content: String(m.content ?? "").slice(0, 12_000),
    })),
  ];

  // Lists need room to finish; single values need room for poetic length.
  const listTasks = new Set<AiTask>(["captions", "titles", "reply", "thread", "summarize"]);
  const minTokens = listTasks.has(task)
    ? 460
    : task === "bio"
      ? 320
      : task === "alt"
        ? 160
        : 700;
  const finalMaxTokens = Math.max(options.maxTokens ?? 0, minTokens, style.maxTokens);

  const excludedModels = new Set<string>();
  let lastError = "All AI models were busy. Please try again in a moment.";
  let attempts = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const key = pickKey();
    const model = pickModel(excludedModels);
    if (!key || !model) break;
    attempts += 1;
    const meta = modelMeta.get(model.id);
    const callStart = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 32_000);
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${key.key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://thursday-app-lovat.vercel.app",
          "X-Title": "Thursday",
        },
        body: JSON.stringify({
          model: model.id,
          messages: payloadMessages,
          temperature: options.temperature ?? style.temperature,
          max_tokens: finalMaxTokens,
          // A little provider fallback keeps free-tier outages invisible.
          provider: { allow_fallbacks: true },
          ...(meta?.reasoning ? { reasoning: { exclude: true } } : {}),
        }),
      });
      clearTimeout(timeout);

      const latencyMs = Date.now() - callStart;

      if (!response.ok) {
        const body = await response.text();
        key.failures += 1;
        key.consecutiveFailures += 1;
        key.lastError = `HTTP ${response.status}`;
        model.failures += 1;
        model.consecutiveFailures += 1;
        model.lastError = `HTTP ${response.status}`;
        if (response.status === 429 || response.status === 402) {
          key.cooldownUntil = Date.now() + KEY_COOLDOWN_MS;
          model.cooldownUntil = Date.now() + MODEL_COOLDOWN_MS;
        } else if (response.status >= 500) {
          model.cooldownUntil = Date.now() + MODEL_COOLDOWN_MS;
        } else {
          (key as any).cooldownUntil = Date.now() + 15_000;
          model.cooldownUntil = Date.now() + MODEL_COOLDOWN_MS;
        }
        excludedModels.add(model.id);
        lastError =
          body.slice(0, 200) || `AI provider returned ${response.status}.`;
        continue;
      }

      const json = await response.json();
      const text = extractContent(json);

      const cleaned = text ? cleanOutput(text, task) : "";
      const lastUser = [...payloadMessages].reverse().find((m) => m.role === "user");
      const norm = (v: string) =>
        v.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
      // Single-value tasks must read as finished prose, not a cut-off fragment
      const singleValue = task === "bio" || task === "alt";
      const expectedCounts: Partial<Record<AiTask, number>> = {
        captions: 3,
        titles: 5,
        reply: 3,
        thread: 3,
      };
      const expected = expectedCounts[task];
      const countedItems = (cleaned.match(/(?:^|\n)\s*\d+[.)]\s+/g) ?? []).length;
      const incompleteList =
        typeof expected === "number" &&
        Boolean(cleaned) &&
        (countedItems < expected || /\n\s*\d+[.)]\s*$/.test(cleaned));
      // Free chat replies should end on a finished sentence and not carry an
      // unterminated quoted line — small models love to stop mid-quote.
      const unterminatedQuote =
        Boolean(cleaned) &&
        (cleaned.match(/["\u201c]/g) ?? []).length !==
          (cleaned.match(/["\u201d]/g) ?? []).length;
      const cutProse =
        task === "chat" &&
        Boolean(cleaned) &&
        !/[.!?…"'’”)]\s*$/.test(cleaned);
      const truncated =
        (singleValue &&
          Boolean(cleaned) &&
          !/[.!?…"'’”)]\s*$/.test(cleaned)) ||
        cutProse ||
        unterminatedQuote ||
        incompleteList;
      const echoed =
        Boolean(cleaned && lastUser) &&
        norm(cleaned).length > 12 &&
        (norm(lastUser!.content).includes(norm(cleaned)) ||
          norm(cleaned).includes(norm(lastUser!.content)));
      if (
        !cleaned ||
        looksDegenerate(cleaned) ||
        looksMeta(cleaned) ||
        echoed ||
        truncated
      ) {
        model.failures += 1;
        model.consecutiveFailures += 1;
        model.lastError = echoed
          ? "Echoed the prompt"
          : truncated
            ? "Cut off mid-sentence"
            : text
              ? "Weak response"
              : "Empty response";
        model.cooldownUntil = Date.now() + 20_000;
        excludedModels.add(model.id);
        lastError = echoed
          ? "That model only repeated the prompt — trying another."
          : truncated
            ? "That model trailed off — trying another."
            : text
              ? "That model lost the thread — trying another."
              : "That model returned an empty reply.";
        continue;
      }

      key.calls += 1;
      key.consecutiveFailures = 0;
      key.totalLatencyMs += latencyMs;
      key.lastUsed = Date.now();
      model.calls += 1;
      model.consecutiveFailures = 0;
      model.totalLatencyMs += latencyMs;

      return {
        ok: true,
        text: cleaned,
        model: model.id,
        modelLabel: model.label,
        keyLabel: key.label,
        latencyMs: Date.now() - startedAt,
        attempts,
      };
    } catch (err: any) {
      key.failures += 1;
      key.consecutiveFailures += 1;
      key.lastError = err?.name === "AbortError" ? "Timed out" : String(err?.message ?? err);
      model.failures += 1;
      model.consecutiveFailures += 1;
      model.lastError = key.lastError;
      model.cooldownUntil = Date.now() + MODEL_COOLDOWN_MS;
      if (err?.name === "AbortError") {
        key.cooldownUntil = Date.now() + 20_000;
      }
      excludedModels.add(model.id);
      lastError = "The AI took too long to answer. Trying another model…";
    }
  }

  return {
    ok: false,
    error: lastError,
    attempts,
    latencyMs: Date.now() - startedAt,
  };
}

function aiStatus() {
  const now = Date.now();
  return {
    ok: keys.length > 0,
    provider: "openrouter",
    keyCount: keys.length,
    availableKeys: keys.filter((k) => k.cooldownUntil <= now).length,
    modelCount: models.length,
    availableModels: models.filter((m) => m.cooldownUntil <= now).length,
    keys: keys.map((k) => ({
      label: k.label,
      calls: k.calls,
      failures: k.failures,
      cooling: k.cooldownUntil > now,
      readyInMs: Math.max(0, k.cooldownUntil - now),
      avgLatencyMs: k.calls ? Math.round(k.totalLatencyMs / k.calls) : null,
      lastError: k.lastError ?? null,
    })),
    models: models.map((m) => ({
      id: m.id,
      label: m.label,
      calls: m.calls,
      failures: m.failures,
      cooling: m.cooldownUntil > now,
      readyInMs: Math.max(0, m.cooldownUntil - now),
      avgLatencyMs: m.calls ? Math.round(m.totalLatencyMs / m.calls) : null,
      lastError: m.lastError ?? null,
    })),
  };
}

// ==================== HTTP layer ====================

const AI_TASKS = new Set<string>([
  "chat",
  "captions",
  "summarize",
  "rewrite",
  "titles",
  "thread",
  "bio",
  "reply",
  "alt",
]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-thursday-client-id, accept",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/thursday-ai/, "").replace(/\/+$/, "");

  try {
    if (path === "/status") {
      return json({ ok: true, provider: "openrouter", ...aiStatus() });
    }

    if (path === "/chat" && req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const task = String((body as any).task || "chat");
      if (!AI_TASKS.has(task)) {
        return json({ ok: false, error: "Unknown AI task." }, 400);
      }
      const raw = (body as any).messages;
      const messages = Array.isArray(raw)
        ? raw
        : typeof (body as any).prompt === "string"
          ? [{ role: "user", content: (body as any).prompt }]
          : [];
      if (!messages.length) {
        return json({ ok: false, error: "Nothing to send to the AI." }, 400);
      }

      const result = await aiGenerate({
        task: task as any,
        messages,
        maxTokens: Number.isFinite((body as any).maxTokens)
          ? Number((body as any).maxTokens)
          : undefined,
        temperature: Number.isFinite((body as any).temperature)
          ? Number((body as any).temperature)
          : undefined,
      });

      if (!result.ok) {
        return json(
          {
            ok: false,
            error: result.error || "The AI is resting. Try again shortly.",
            attempts: result.attempts,
          },
          503,
        );
      }
      return json({
        ok: true,
        text: result.text,
        model: result.model,
        modelLabel: result.modelLabel,
        latencyMs: result.latencyMs,
        attempts: result.attempts,
      });
    }

    return json({ ok: false, error: "Not found" }, 404);
  } catch (err) {
    return json({ ok: false, error: (err as Error)?.message || "AI request failed" }, 500);
  }
});
