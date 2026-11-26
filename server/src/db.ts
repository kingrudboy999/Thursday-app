import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { INITIAL_SEED } from "./seed.js";

const { Pool } = pg;

export type CollectionKey =
  | "people"
  | "posts"
  | "stories"
  | "highlights"
  | "reels"
  | "circles"
  | "events"
  | "prompts"
  | "guides";

export interface UserPrivateState {
  me: any;
  followingIds: string[];
  conversations: any[];
  notifications: any[];
  drafts: any[];
  savedGuideIds: string[];
  guideSteps: Record<string, number[]>;
  promptVotes: Record<string, string>;
  preferences: any;
}

const DEFAULT_COLLECTIONS: Record<CollectionKey, any[]> = {
  people: structuredClone(INITIAL_SEED.people) as any[],
  posts: structuredClone(INITIAL_SEED.posts) as any[],
  stories: structuredClone(INITIAL_SEED.stories) as any[],
  highlights: structuredClone(INITIAL_SEED.highlights) as any[],
  reels: structuredClone(INITIAL_SEED.reels) as any[],
  circles: structuredClone(INITIAL_SEED.circles) as any[],
  events: structuredClone(INITIAL_SEED.events) as any[],
  prompts: structuredClone(INITIAL_SEED.prompts) as any[],
  guides: structuredClone(INITIAL_SEED.guides) as any[],
};

export function createDefaultUserState(): UserPrivateState {
  return {
    me: structuredClone(INITIAL_SEED.me),
    followingIds: Array.isArray(INITIAL_SEED.followingIds)
      ? [...INITIAL_SEED.followingIds]
      : ["maya", "priya", "jonah"],
    conversations: structuredClone(INITIAL_SEED.conversations || []) as any[],
    notifications: structuredClone(INITIAL_SEED.notifications || []) as any[],
    drafts: structuredClone(INITIAL_SEED.drafts || []) as any[],
    savedGuideIds: (INITIAL_SEED.guides || []).map((g: any) => g.id),
    guideSteps: {},
    promptVotes: {},
    preferences: structuredClone(INITIAL_SEED.preferences || {}),
  };
}

let pool: pg.Pool | null = null;
let usingPostgres = false;

const fallbackPath = path.resolve(process.cwd(), ".local-thursday-db.json");
let memoryStore: {
  collections: Record<CollectionKey, any[]>;
  users: Record<string, UserPrivateState>;
  workspaces: Record<string, { handle: string; displayName: string; snapshot: any; updatedAt: string }>;
} = {
  collections: structuredClone(DEFAULT_COLLECTIONS),
  users: {},
  workspaces: {},
};

function loadFallbackFromDisk() {
  try {
    if (fs.existsSync(fallbackPath)) {
      const parsed = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
      if (parsed?.collections) {
        memoryStore = {
          collections: { ...structuredClone(DEFAULT_COLLECTIONS), ...parsed.collections },
          users: parsed.users || {},
          workspaces: parsed.workspaces || {},
        };
      }
    }
  } catch {}
}

function saveFallbackToDisk() {
  try {
    fs.writeFileSync(fallbackPath, JSON.stringify(memoryStore));
  } catch {}
}

export async function initDatabase(): Promise<{ mode: "postgres" | "file" }> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    loadFallbackFromDisk();
    return { mode: "file" };
  }

  const useSsl =
    databaseUrl.includes("rlwy.net") ||
    databaseUrl.includes("supabase") ||
    process.env.PGSSLMODE === "require";

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  });

  // Retry connection up to 8 times during container boot
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      await pool.query("SELECT 1");
      usingPostgres = true;
      break;
    } catch (err) {
      if (attempt === 8) {
        console.error("Postgres unreachable after retries; falling back to local store:", err);
        loadFallbackFromDisk();
        return { mode: "file" };
      }
      await new Promise((r) => setTimeout(r, attempt * 1000));
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS thursday_collections (
      collection_key TEXT PRIMARY KEY,
      items JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS thursday_user_state (
      client_id TEXT PRIMARY KEY,
      state JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS thursday_workspaces (
      sync_key TEXT PRIMARY KEY,
      handle TEXT,
      display_name TEXT,
      snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const [key, defaultItems] of Object.entries(DEFAULT_COLLECTIONS) as [CollectionKey, any[]][]) {
    await pool.query(
      `INSERT INTO thursday_collections (collection_key, items)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (collection_key) DO NOTHING`,
      [key, JSON.stringify(defaultItems)],
    );
  }

  return { mode: "postgres" };
}

export function getDbMode(): "postgres" | "file" {
  return usingPostgres ? "postgres" : "file";
}

export async function getCollection<T = any>(key: CollectionKey): Promise<T[]> {
  if (!usingPostgres || !pool) {
    return structuredClone(memoryStore.collections[key] ?? DEFAULT_COLLECTIONS[key]) as T[];
  }
  const { rows } = await pool.query(
    "SELECT items FROM thursday_collections WHERE collection_key = $1",
    [key],
  );
  if (!rows.length || !Array.isArray(rows[0].items)) {
    return structuredClone(DEFAULT_COLLECTIONS[key]) as T[];
  }
  return rows[0].items as T[];
}

export async function setCollection<T = any>(key: CollectionKey, items: T[]): Promise<T[]> {
  if (!usingPostgres || !pool) {
    memoryStore.collections[key] = structuredClone(items);
    saveFallbackToDisk();
    return items;
  }
  await pool.query(
    `INSERT INTO thursday_collections (collection_key, items, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (collection_key)
     DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
    [key, JSON.stringify(items)],
  );
  return items;
}

export async function updateCollection<T = any>(
  key: CollectionKey,
  updater: (current: T[]) => T[],
): Promise<T[]> {
  const current = await getCollection<T>(key);
  const next = updater(current);
  await setCollection(key, next);
  return next;
}

export async function getAllCollections(): Promise<Record<CollectionKey, any[]>> {
  if (!usingPostgres || !pool) {
    return structuredClone(memoryStore.collections);
  }
  const { rows } = await pool.query("SELECT collection_key, items FROM thursday_collections");
  const out = structuredClone(DEFAULT_COLLECTIONS);
  for (const row of rows) {
    if (row.collection_key in out && Array.isArray(row.items)) {
      out[row.collection_key as CollectionKey] = row.items;
    }
  }
  return out;
}

export async function getUserState(clientId: string): Promise<UserPrivateState> {
  const safeId = (clientId || "default").slice(0, 80);
  if (!usingPostgres || !pool) {
    if (!memoryStore.users[safeId]) {
      memoryStore.users[safeId] = createDefaultUserState();
      saveFallbackToDisk();
    }
    return structuredClone(memoryStore.users[safeId]);
  }
  const { rows } = await pool.query(
    "SELECT state FROM thursday_user_state WHERE client_id = $1",
    [safeId],
  );
  const defaults = createDefaultUserState();
  if (!rows.length || !rows[0].state) {
    await pool.query(
      `INSERT INTO thursday_user_state (client_id, state)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (client_id) DO NOTHING`,
      [safeId, JSON.stringify(defaults)],
    );
    return defaults;
  }
  return { ...defaults, ...rows[0].state };
}

export async function updateUserState(
  clientId: string,
  updater: (current: UserPrivateState) => UserPrivateState,
): Promise<UserPrivateState> {
  const safeId = (clientId || "default").slice(0, 80);
  const current = await getUserState(safeId);
  const next = updater(current);
  if (!usingPostgres || !pool) {
    memoryStore.users[safeId] = structuredClone(next);
    saveFallbackToDisk();
    return next;
  }
  await pool.query(
    `INSERT INTO thursday_user_state (client_id, state, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (client_id)
     DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()`,
    [safeId, JSON.stringify(next)],
  );
  return next;
}

export async function saveWorkspaceSnapshot(
  syncKey: string,
  handle: string,
  displayName: string,
  snapshot: any,
): Promise<{ syncKey: string; updatedAt: string }> {
  const cleaned = syncKey.toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 64);
  const nowIso = new Date().toISOString();
  if (!usingPostgres || !pool) {
    memoryStore.workspaces[cleaned] = {
      handle,
      displayName,
      snapshot,
      updatedAt: nowIso,
    };
    saveFallbackToDisk();
    return { syncKey: cleaned, updatedAt: nowIso };
  }
  await pool.query(
    `INSERT INTO thursday_workspaces (sync_key, handle, display_name, snapshot, updated_at)
     VALUES ($1, $2, $3, $4::jsonb, NOW())
     ON CONFLICT (sync_key)
     DO UPDATE SET
       handle = EXCLUDED.handle,
       display_name = EXCLUDED.display_name,
       snapshot = EXCLUDED.snapshot,
       updated_at = NOW()`,
    [cleaned, handle, displayName, JSON.stringify(snapshot)],
  );
  return { syncKey: cleaned, updatedAt: nowIso };
}

export async function getWorkspaceSnapshot(
  syncKey: string,
): Promise<{ syncKey: string; snapshot: any; updatedAt: string } | null> {
  const cleaned = syncKey.toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 64);
  if (!usingPostgres || !pool) {
    const item = memoryStore.workspaces[cleaned];
    return item ? { syncKey: cleaned, snapshot: item.snapshot, updatedAt: item.updatedAt } : null;
  }
  const { rows } = await pool.query(
    "SELECT sync_key, snapshot, updated_at FROM thursday_workspaces WHERE sync_key = $1",
    [cleaned],
  );
  if (!rows.length) return null;
  return {
    syncKey: rows[0].sync_key,
    snapshot: rows[0].snapshot,
    updatedAt:
      rows[0].updated_at instanceof Date
        ? rows[0].updated_at.toISOString()
        : String(rows[0].updated_at),
  };
}
