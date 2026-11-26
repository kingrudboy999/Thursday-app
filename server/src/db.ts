import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { hashPassword, normalizeEmail, normalizeHandle } from "./auth.js";
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
  | "guides"
  | "reports";

export interface AccountRecord {
  id: string;
  email: string;
  handle: string;
  passwordHash: string;
  profile: any;
  createdAt: string;
}

export interface ThreadRecord {
  id: string;
  participantIds: string[];
  messages: any[];
  meta: Record<
    string,
    {
      unread?: number;
      pinned?: boolean;
      muted?: boolean;
      archived?: boolean;
      request?: boolean;
      lastReadAt?: string;
    }
  >;
  updatedAt: string;
}

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
  visitors?: Array<{ personId: string; time: string }>;
  /** People you have blocked. Their content never reaches you. */
  blockedIds?: string[];
  /** People whose activity you follow quietly — still visible, no notifications. */
  mutedIds?: string[];
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
  // Moderation queue. Empty until someone reports something.
  reports: [],
};

export function createDefaultUserState(customMe?: any): UserPrivateState {
  const meProfile = customMe ? structuredClone(customMe) : structuredClone(INITIAL_SEED.me);
  return {
    me: meProfile,
    // Nobody is followed by default, and nobody "welcomed" you. A new account
    // starts genuinely empty: no invented friends, no canned notification
    // claiming two people you have never met said hello.
    followingIds: [],
    // Real DMs live in thursday_threads. Nothing is seeded here, so a new
    // account starts with a genuinely empty inbox instead of fake chats.
    conversations: [],
    notifications: [],
    drafts: [],
    savedGuideIds: (INITIAL_SEED.guides || []).map((g: any) => g.id),
    guideSteps: {},
    promptVotes: {},
    preferences: structuredClone(INITIAL_SEED.preferences || {}),
    blockedIds: [],
    mutedIds: [],
    // Profile visitors are recorded when somebody actually opens your profile.
    // Inventing three of them made an empty app feel populated at the cost of
    // being untrue.
    visitors: [],
  };
}

let pool: pg.Pool | null = null;
let usingPostgres = false;

const fallbackPath = path.resolve(process.cwd(), ".local-thursday-db.json");
let memoryStore: {
  collections: Record<CollectionKey, any[]>;
  users: Record<string, UserPrivateState>;
  accounts: Record<string, AccountRecord>;
  sessions: Record<string, { userId: string; expiresAt: string }>;
  threads: Record<string, ThreadRecord>;
  workspaces: Record<
    string,
    { handle: string; displayName: string; snapshot: any; updatedAt: string }
  >;
} = {
  collections: structuredClone(DEFAULT_COLLECTIONS),
  users: {},
  accounts: {},
  sessions: {},
  threads: {},
  workspaces: {},
};

function buildSeedAccounts(): AccountRecord[] {
  const defaultHash = hashPassword("thursday123");
  return (INITIAL_SEED.people || []).map((person: any) => {
    const handle = normalizeHandle(person.handle || person.id);
    const email =
      person.id === "me"
        ? "nora@thursday.app"
        : `${person.id}@thursday.app`;
    return {
      id: person.id,
      email,
      handle,
      passwordHash: defaultHash,
      profile: structuredClone(person),
      createdAt: new Date().toISOString(),
    };
  });
}

/**
 * Threads are never seeded.
 *
 * Earlier builds converted INITIAL_SEED.conversations into thread records, so
 * the inbox filled with people who could never reply — their messages had no
 * sender and no timestamp because they were static demo copy. Real threads are
 * created only when someone actually sends a message.
 */
function buildSeedThreads(): ThreadRecord[] {
  return [];
}

function loadFallbackFromDisk() {
  try {
    if (fs.existsSync(fallbackPath)) {
      const parsed = JSON.parse(fs.readFileSync(fallbackPath, "utf8"));
      if (parsed?.collections) {
        memoryStore = {
          collections: {
            ...structuredClone(DEFAULT_COLLECTIONS),
            ...parsed.collections,
          },
          users: parsed.users || {},
          accounts: parsed.accounts || {},
          sessions: parsed.sessions || {},
          threads: parsed.threads || {},
          workspaces: parsed.workspaces || {},
        };
      }
    }
    if (Object.keys(memoryStore.accounts).length === 0) {
      for (const acc of buildSeedAccounts()) {
        memoryStore.accounts[acc.id] = acc;
      }
    }
    if (Object.keys(memoryStore.threads).length === 0) {
      for (const th of buildSeedThreads()) {
        memoryStore.threads[th.id] = th;
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
    max: 12,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 8_000,
  });

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

    CREATE TABLE IF NOT EXISTS thursday_accounts (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      handle TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      profile JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS thursday_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS thursday_threads (
      id TEXT PRIMARY KEY,
      participant_ids TEXT[] NOT NULL,
      messages JSONB NOT NULL DEFAULT '[]'::jsonb,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb,
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

  for (const [key, defaultItems] of Object.entries(DEFAULT_COLLECTIONS) as [
    CollectionKey,
    any[],
  ][]) {
    await pool.query(
      `INSERT INTO thursday_collections (collection_key, items)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (collection_key) DO NOTHING`,
      [key, JSON.stringify(defaultItems)],
    );
  }

  // Seed canonical member accounts if not yet present
  const existingAccCount = await pool.query("SELECT COUNT(*)::int AS cnt FROM thursday_accounts");
  if ((existingAccCount.rows[0]?.cnt ?? 0) === 0) {
    for (const acc of buildSeedAccounts()) {
      await pool.query(
        `INSERT INTO thursday_accounts (id, email, handle, password_hash, profile)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT (id) DO NOTHING`,
        [acc.id, acc.email, acc.handle, acc.passwordHash, JSON.stringify(acc.profile)],
      );
    }
  }

  // Threads are not seeded. See buildSeedThreads() for why.
  for (const th of buildSeedThreads()) {
    await pool.query(
      `INSERT INTO thursday_threads (id, participant_ids, messages, meta, updated_at)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [th.id, th.participantIds, JSON.stringify(th.messages), JSON.stringify(th.meta)],
    );
  }

  // Backfill a join date on profiles created before signup started setting one.
  // The people directory is what the profile page renders, so that is the copy
  // that has to carry "Joined"; patching user state alone left new accounts
  // looking broken.
  try {
    const stamp = new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const joinedLabel = `Joined ${stamp}`;

    await updateCollection("people", (people: any[]) => {
      let patched = 0;
      const next = people.map((person: any) => {
        if (!person?.id || person.joined) return person;
        patched += 1;
        return { ...person, joined: joinedLabel };
      });
      if (patched) console.log(`[db] backfilled join date on ${patched} profile(s)`);
      return next;
    });

    // Keep per-account state in step with the directory.
    const { rows } = await pool.query(
      `SELECT client_id, state->'me' AS me FROM thursday_user_state`,
    );
    for (const row of rows) {
      const me = row.me || {};
      if (!me.id || me.joined) continue;
      await pool.query(
        `UPDATE thursday_user_state
            SET state = jsonb_set(state, '{me,joined}', to_jsonb($2::text))
          WHERE client_id = $1`,
        [row.client_id, joinedLabel],
      );
    }
  } catch (err) {
    console.warn("[db] joined backfill skipped:", (err as Error)?.message);
  }

  // One-time cleanup: earlier builds inserted demo conversations as if they
  // were real threads. Real messages have no createdAt either, so the only
  // safe marker is the seed's own conversation ids (conv_maya, conv_priya, …).
  // Threads people actually create get ids like conv_maya_me_1795708264674,
  // so an exact-id comparison can never touch a real conversation.
  try {
    const demoIds: string[] = (INITIAL_SEED.conversations || [])
      .map((c: any) => String(c?.id || ""))
      .filter(Boolean);
    if (demoIds.length) {
      const removed = await pool.query(
        `DELETE FROM thursday_threads WHERE id = ANY($1::text[]) RETURNING id`,
        [demoIds],
      );
      if (removed.rowCount) {
        console.log(`[db] removed ${removed.rowCount} demo conversation(s)`);
      }
    }
  } catch (err) {
    console.warn("[db] demo thread cleanup skipped:", (err as Error)?.message);
  }

  return { mode: "postgres" };
}

export function getDbMode(): "postgres" | "file" {
  return usingPostgres ? "postgres" : "file";
}

// ==================== ACCOUNTS & SESSIONS ====================

export async function findAccountByIdentifier(identifier: string): Promise<AccountRecord | null> {
  const cleanEmail = normalizeEmail(identifier);
  const cleanHandle = normalizeHandle(identifier);
  if (!usingPostgres || !pool) {
    const found = Object.values(memoryStore.accounts).find(
      (a) => a.email === cleanEmail || a.handle === cleanHandle || a.id === identifier,
    );
    return found ? structuredClone(found) : null;
  }
  const { rows } = await pool.query(
    `SELECT id, email, handle, password_hash, profile, created_at
     FROM thursday_accounts
     WHERE email = $1 OR handle = $2 OR id = $3
     LIMIT 1`,
    [cleanEmail, cleanHandle, identifier],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    email: r.email,
    handle: r.handle,
    passwordHash: r.password_hash,
    profile: r.profile,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  };
}

export async function isHandleTaken(handle: string): Promise<boolean> {
  const clean = normalizeHandle(handle);
  if (!clean) return true;
  const existing = await findAccountByIdentifier(clean);
  return Boolean(existing);
}

export async function createAccount(account: AccountRecord): Promise<AccountRecord> {
  if (!usingPostgres || !pool) {
    memoryStore.accounts[account.id] = structuredClone(account);
    saveFallbackToDisk();
    return account;
  }
  await pool.query(
    `INSERT INTO thursday_accounts (id, email, handle, password_hash, profile)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [
      account.id,
      account.email,
      account.handle,
      account.passwordHash,
      JSON.stringify(account.profile),
    ],
  );
  return account;
}

export async function updateAccountPassword(
  userId: string,
  passwordHash: string,
): Promise<void> {
  if (!usingPostgres || !pool) {
    if (memoryStore.accounts[userId]) {
      memoryStore.accounts[userId].passwordHash = passwordHash;
      saveFallbackToDisk();
    }
    return;
  }
  await pool.query(
    `UPDATE thursday_accounts SET password_hash = $2 WHERE id = $1`,
    [userId, passwordHash],
  );
}

export async function getAccountById(userId: string): Promise<AccountRecord | null> {
  if (!usingPostgres || !pool) {
    const found = memoryStore.accounts[userId];
    return found ? structuredClone(found) : null;
  }
  const { rows } = await pool.query(
    `SELECT id, email, handle, password_hash, profile, created_at
       FROM thursday_accounts WHERE id = $1 LIMIT 1`,
    [userId],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    email: r.email,
    handle: r.handle,
    passwordHash: r.password_hash,
    profile: r.profile,
    createdAt: r.created_at,
  };
}

/**
 * Deletes an account and everything that belonged to it. Deliberately thorough:
 * a half-deleted account that still appears in the directory is worse than one
 * that cannot be deleted at all.
 */
export async function deleteAccountCompletely(userId: string): Promise<void> {
  if (!usingPostgres || !pool) {
    delete memoryStore.accounts[userId];
    delete memoryStore.users[userId];
    for (const [token, session] of Object.entries(memoryStore.sessions)) {
      if (session.userId === userId) delete memoryStore.sessions[token];
    }
    for (const [id, thread] of Object.entries(memoryStore.threads)) {
      if (thread.participantIds.includes(userId)) delete memoryStore.threads[id];
    }
    const collections = memoryStore.collections as Record<string, any[]>;
    for (const key of Object.keys(collections)) {
      if (Array.isArray(collections[key])) {
        collections[key] = collections[key].filter(
          (item: any) => item?.id !== userId && item?.authorId !== userId,
        );
      }
    }
    saveFallbackToDisk();
    return;
  }

  await pool.query(`DELETE FROM thursday_sessions WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM thursday_user_state WHERE client_id = $1`, [userId]);
  await pool.query(`DELETE FROM thursday_accounts WHERE id = $1`, [userId]);
  await pool.query(
    `DELETE FROM thursday_threads WHERE $1 = ANY(participant_ids)`,
    [userId],
  );
  // Remove them from the shared directory and anything they authored.
  const { rows } = await pool.query(
    `SELECT collection_key, items FROM thursday_collections`,
  );
  for (const row of rows) {
    const items: any[] = Array.isArray(row.items) ? row.items : [];
    const kept = items.filter(
      (item: any) => item?.id !== userId && item?.authorId !== userId,
    );
    if (kept.length !== items.length) {
      await pool.query(
        `UPDATE thursday_collections SET items = $2::jsonb WHERE collection_key = $1`,
        [row.collection_key, JSON.stringify(kept)],
      );
    }
  }
}

export async function updateAccountProfile(userId: string, profile: any): Promise<void> {
  if (!usingPostgres || !pool) {
    if (memoryStore.accounts[userId]) {
      memoryStore.accounts[userId].profile = structuredClone(profile);
      saveFallbackToDisk();
    }
    return;
  }
  await pool.query(
    `UPDATE thursday_accounts SET profile = $2::jsonb WHERE id = $1`,
    [userId, JSON.stringify(profile)],
  );
}

export async function createSession(token: string, userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  if (!usingPostgres || !pool) {
    memoryStore.sessions[token] = { userId, expiresAt };
    saveFallbackToDisk();
    return;
  }
  await pool.query(
    `INSERT INTO thursday_sessions (token, user_id, expires_at)
     VALUES ($1, $2, $3::timestamptz)`,
    [token, userId, expiresAt],
  );
}

export async function deleteSession(token: string): Promise<void> {
  if (!usingPostgres || !pool) {
    delete memoryStore.sessions[token];
    saveFallbackToDisk();
    return;
  }
  await pool.query("DELETE FROM thursday_sessions WHERE token = $1", [token]);
}

export async function getAccountBySessionToken(token: string): Promise<AccountRecord | null> {
  if (!token) return null;
  if (!usingPostgres || !pool) {
    const sess = memoryStore.sessions[token];
    if (!sess || new Date(sess.expiresAt).getTime() < Date.now()) return null;
    const acc = memoryStore.accounts[sess.userId];
    return acc ? structuredClone(acc) : null;
  }
  const { rows } = await pool.query(
    `SELECT a.id, a.email, a.handle, a.password_hash, a.profile, a.created_at
     FROM thursday_sessions s
     JOIN thursday_accounts a ON a.id = s.user_id
     WHERE s.token = $1 AND s.expires_at > NOW()
     LIMIT 1`,
    [token],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    email: r.email,
    handle: r.handle,
    passwordHash: r.password_hash,
    profile: r.profile,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  };
}

// ==================== SHARED REAL-TIME THREADS ====================

export async function getThreadsForUser(userId: string): Promise<ThreadRecord[]> {
  if (!usingPostgres || !pool) {
    return Object.values(memoryStore.threads)
      .filter((t) => t.participantIds.includes(userId))
      .map((t) => structuredClone(t));
  }
  const { rows } = await pool.query(
    `SELECT id, participant_ids, messages, meta, updated_at
     FROM thursday_threads
     WHERE $1 = ANY(participant_ids)
     ORDER BY updated_at DESC`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    participantIds: r.participant_ids,
    messages: r.messages || [],
    meta: r.meta || {},
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  }));
}

export async function getThreadById(threadId: string): Promise<ThreadRecord | null> {
  if (!usingPostgres || !pool) {
    const t = memoryStore.threads[threadId];
    return t ? structuredClone(t) : null;
  }
  const { rows } = await pool.query(
    `SELECT id, participant_ids, messages, meta, updated_at
     FROM thursday_threads WHERE id = $1 LIMIT 1`,
    [threadId],
  );
  if (!rows.length) return null;
  const r = rows[0];
  return {
    id: r.id,
    participantIds: r.participant_ids,
    messages: r.messages || [],
    meta: r.meta || {},
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
  };
}

export async function findOrCreateThread(
  userA: string,
  userB: string,
  preferredId?: string,
): Promise<ThreadRecord> {
  const existingList = await getThreadsForUser(userA);
  const existing = existingList.find((t) => t.participantIds.includes(userB));
  if (existing) return existing;

  const pair = [userA, userB].sort();
  const id = preferredId || `conv_${pair.join("_")}_${Date.now()}`;
  const record: ThreadRecord = {
    id,
    participantIds: [userA, userB],
    messages: [],
    meta: {
      [userA]: { unread: 0, pinned: false, muted: false, archived: false, request: false },
      [userB]: { unread: 0, pinned: false, muted: false, archived: false, request: false },
    },
    updatedAt: new Date().toISOString(),
  };
  await saveThread(record);
  return record;
}

export async function saveThread(thread: ThreadRecord): Promise<ThreadRecord> {
  thread.updatedAt = new Date().toISOString();
  if (!usingPostgres || !pool) {
    memoryStore.threads[thread.id] = structuredClone(thread);
    saveFallbackToDisk();
    return thread;
  }
  await pool.query(
    `INSERT INTO thursday_threads (id, participant_ids, messages, meta, updated_at)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, NOW())
     ON CONFLICT (id)
     DO UPDATE SET
       participant_ids = EXCLUDED.participant_ids,
       messages = EXCLUDED.messages,
       meta = EXCLUDED.meta,
       updated_at = NOW()`,
    [thread.id, thread.participantIds, JSON.stringify(thread.messages), JSON.stringify(thread.meta)],
  );
  return thread;
}

export async function deleteThreadForUser(threadId: string, userId: string): Promise<void> {
  const thread = await getThreadById(threadId);
  if (!thread) return;
  if (!usingPostgres || !pool) {
    delete memoryStore.threads[threadId];
    saveFallbackToDisk();
    return;
  }
  await pool.query("DELETE FROM thursday_threads WHERE id = $1 AND $2 = ANY(participant_ids)", [
    threadId,
    userId,
  ]);
}

export function formatThreadForUser(thread: ThreadRecord, userId: string, onlineIds: Set<string>) {
  const otherId = thread.participantIds.find((id) => id !== userId) || userId;
  const userMeta = thread.meta?.[userId] || {};
  const otherMeta = thread.meta?.[otherId] || {};
  return {
    id: thread.id,
    personId: otherId,
    unread: Number(userMeta.unread || 0),
    online: onlineIds.has(otherId),
    lastActive: onlineIds.has(otherId) ? "Active now" : "Active recently",
    pinned: Boolean(userMeta.pinned),
    muted: Boolean(userMeta.muted),
    archived: Boolean(userMeta.archived),
    request: Boolean(userMeta.request),
    otherLastReadAt: otherMeta.lastReadAt || null,
    messages: (thread.messages || []).map((m: any) => ({
      ...m,
      from: (m.senderId ? m.senderId === userId : m.from === "me") ? "me" : "them",
    })),
  };
}

// ==================== COLLECTIONS & USER STATE ====================

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

export async function getUserState(clientId: string, customMe?: any): Promise<UserPrivateState> {
  const safeId = (clientId || "me").slice(0, 80);
  if (!usingPostgres || !pool) {
    if (!memoryStore.users[safeId]) {
      memoryStore.users[safeId] = createDefaultUserState(customMe);
      saveFallbackToDisk();
    }
    return structuredClone(memoryStore.users[safeId]);
  }
  const { rows } = await pool.query(
    "SELECT state FROM thursday_user_state WHERE client_id = $1",
    [safeId],
  );
  const defaults = createDefaultUserState(customMe);
  if (!rows.length || !rows[0].state) {
    await pool.query(
      `INSERT INTO thursday_user_state (client_id, state)
       VALUES ($1, $2::jsonb)
       ON CONFLICT (client_id) DO NOTHING`,
      [safeId, JSON.stringify(defaults)],
    );
    return defaults;
  }
  const stored = rows[0].state;
  return {
    ...defaults,
    ...stored,
    me: customMe ? { ...stored.me, ...customMe } : stored.me || defaults.me,
    // Older rows still carry the demo conversations from previous builds.
    // They are never merged back in, so the inbox drains itself instead of
    // needing a manual database edit.
    conversations: [],
    blockedIds: Array.isArray(stored.blockedIds) ? stored.blockedIds : [],
    mutedIds: Array.isArray(stored.mutedIds) ? stored.mutedIds : [],
  };
}

export async function updateUserState(
  clientId: string,
  updater: (current: UserPrivateState) => UserPrivateState,
): Promise<UserPrivateState> {
  const safeId = (clientId || "me").slice(0, 80);
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

/**
 * Follower counts, computed from who actually follows whom.
 *
 * The profile object carried a `followers` number that was written once and
 * then drifted: it started at an invented 1, only moved when the follow button
 * was pressed by that one person, and was never true for anybody else. So the
 * profile showed a different number to its own owner than to a visitor.
 *
 * The source of truth is the follow edge -- `followingIds` on each user's state.
 * Counting those edges can never disagree with the list of people you follow.
 */
export async function getFollowGraph(): Promise<{
  followers: Record<string, number>;
  following: Record<string, string[]>;
}> {
  const followers: Record<string, number> = {};
  const following: Record<string, string[]> = {};
  const addEdges = (ownerId: string, followingIds: unknown) => {
    const ids = Array.isArray(followingIds)
      ? followingIds.filter((x: unknown): x is string => typeof x === "string" && !!x)
      : [];
    following[ownerId] = ids;
    for (const targetId of ids) followers[targetId] = (followers[targetId] || 0) + 1;
  };

  if (!usingPostgres || !pool) {
    for (const [ownerId, state] of Object.entries(memoryStore.users)) {
      addEdges(ownerId, state.followingIds);
    }
    return { followers, following };
  }

  const { rows } = await pool.query(
    `SELECT client_id, state->'followingIds' AS following FROM thursday_user_state`,
  );
  for (const row of rows) addEdges(row.client_id, row.following);
  return { followers, following };
}

/** Follower counts only. Kept for callers that do not need the full graph. */
export async function getFollowerCounts(): Promise<Record<string, number>> {
  const { followers } = await getFollowGraph();
  return followers;
}

export async function pushNotificationToUser(
  targetUserId: string,
  notice: {
    id?: string;
    type: "like" | "comment" | "follow" | "mention";
    actorId: string;
    text: string;
    postId?: string;
    postImage?: string;
  },
): Promise<any | null> {
  if (!targetUserId || targetUserId === notice.actorId) return null;
  const fullNotice = {
    id: notice.id || `notice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: notice.type,
    personIds: [notice.actorId],
    text: notice.text,
    time: "Just now",
    unread: true,
    postId: notice.postId,
    postImage: notice.postImage,
  };
  await updateUserState(targetUserId, (curr) => ({
    ...curr,
    notifications: [fullNotice, ...(curr.notifications || []).slice(0, 49)],
  }));
  return fullNotice;
}

export async function recordProfileVisit(
  targetUserId: string,
  visitorUserId: string,
): Promise<Array<{ personId: string; time: string }>> {
  if (!targetUserId || !visitorUserId || targetUserId === visitorUserId) {
    const st = await getUserState(targetUserId);
    return st.visitors || [];
  }
  const updated = await updateUserState(targetUserId, (curr) => {
    const filtered = (curr.visitors || []).filter((v) => v.personId !== visitorUserId);
    return {
      ...curr,
      visitors: [{ personId: visitorUserId, time: "Just now" }, ...filtered].slice(0, 12),
    };
  });
  return updated.visitors || [];
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
