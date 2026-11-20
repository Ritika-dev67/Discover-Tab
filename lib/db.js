// SQLite database (data/coy.db), created and seeded automatically on first use.
//
// Tables
//   profiles  the mock people. `liked_user` is PRIVATE: it is never selected for API output.
//   swipes    the logged-in user's swipes. One row per profile, so nobody can be swiped twice.
//   matches   mutual likes only.
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "coy.db");
const SEED_FILE = path.join(DATA_DIR, "seed.json");

// Columns that are safe to send to the client. `liked_user` is deliberately missing.
const PUBLIC_COLS = "id, name, age, photo, bio, location, interests";

function open() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id         INTEGER PRIMARY KEY,
      name       TEXT    NOT NULL,
      age        INTEGER NOT NULL,
      photo      TEXT    NOT NULL,
      bio        TEXT    NOT NULL,
      location   TEXT    NOT NULL,
      interests  TEXT    NOT NULL,              -- JSON array
      liked_user INTEGER NOT NULL DEFAULT 0     -- 1 = this person already liked the logged-in user
    );
    CREATE TABLE IF NOT EXISTS swipes (
      profile_id INTEGER PRIMARY KEY REFERENCES profiles(id),
      action     TEXT    NOT NULL CHECK (action IN ('like', 'pass')),
      created_at TEXT    NOT NULL
    );
    CREATE TABLE IF NOT EXISTS matches (
      profile_id INTEGER PRIMARY KEY REFERENCES profiles(id),
      created_at TEXT    NOT NULL
    );
  `);

  // Seed from data/seed.json the first time (empty profiles table).
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM profiles").get();
  if (n === 0) {
    const seed = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
    const insert = db.prepare(
      `INSERT INTO profiles (id, name, age, photo, bio, location, interests, liked_user)
       VALUES (@id, @name, @age, @photo, @bio, @location, @interests, @liked_user)`
    );
    db.transaction((rows) => {
      for (const p of rows) {
        insert.run({ ...p, interests: JSON.stringify(p.interests), liked_user: p.likedYou ? 1 : 0 });
      }
    })(seed);
  }
  return db;
}

// Reuse one connection (also survives Next.js dev hot reloads).
function conn() {
  if (!globalThis.__coyDb) globalThis.__coyDb = open();
  return globalThis.__coyDb;
}

function shape(row) {
  return { ...row, interests: JSON.parse(row.interests) };
}

// GET /feed: profiles the user has not swiped on yet.
export function getFeed() {
  const rows = conn()
    .prepare(`SELECT ${PUBLIC_COLS} FROM profiles WHERE id NOT IN (SELECT profile_id FROM swipes) ORDER BY id`)
    .all();
  return rows.map(shape);
}

// POST /swipe: records a swipe and creates a match only if the like is mutual.
// Returns { notFound } | { match: false, alreadySwiped? } | { match: true, profile }
export function recordSwipe(profileId, action) {
  const db = conn();
  const run = db.transaction(() => {
    const row = db.prepare(`SELECT ${PUBLIC_COLS}, liked_user FROM profiles WHERE id = ?`).get(profileId);
    if (!row) return { notFound: true };

    const now = new Date().toISOString();
    // PRIMARY KEY on profile_id: a second swipe on the same profile inserts nothing.
    const inserted = db.prepare("INSERT OR IGNORE INTO swipes (profile_id, action, created_at) VALUES (?, ?, ?)").run(profileId, action, now);
    if (inserted.changes === 0) return { match: false, alreadySwiped: true };

    if (action === "like" && row.liked_user === 1) {
      db.prepare("INSERT OR IGNORE INTO matches (profile_id, created_at) VALUES (?, ?)").run(profileId, now);
      const { liked_user, ...pub } = row; // PRIVACY: strip the private flag
      return { match: true, profile: shape(pub) };
    }
    return { match: false };
  });
  return run();
}

// GET /matches: mutual matches only, newest first.
export function getMatches() {
  const rows = conn()
    .prepare(
      `SELECT p.id, p.name, p.age, p.photo, p.bio, p.location, p.interests, m.created_at AS matchedAt
       FROM matches m JOIN profiles p ON p.id = m.profile_id
       ORDER BY m.created_at DESC, m.rowid DESC`
    )
    .all();
  return rows.map(shape);
}

// Demo helper: forget all swipes and matches (profiles stay).
export function resetDb() {
  const db = conn();
  db.transaction(() => {
    db.prepare("DELETE FROM matches").run();
    db.prepare("DELETE FROM swipes").run();
  })();
}
