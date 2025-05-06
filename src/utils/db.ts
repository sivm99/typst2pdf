import { Database } from "bun:sqlite";
import { randomUUID } from "crypto";

// Initialize or create the database

export type User = {
  id: number;
  github_id: string;
  name: string | null;
  avatar_url: string | null;
  token: string;
  created_at: string;
};

const db = new Database("./data/mydb.sqlite", { create: true });

// Create the `users` table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_id TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    token TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// -----------------------------
// User Queries
// -----------------------------

// Upsert user by GitHub ID
export function upsertUser({
  githubId,
  name,
  avatarUrl,
}: {
  githubId: string;
  name?: string;
  avatarUrl?: string;
}): User {
  // Try to fetch user first
  const existing = db
    .query(`SELECT * FROM users WHERE github_id = ?`)
    .get(githubId) as User;
  if (existing) return existing;

  const token = randomUUID();

  const insert = db.query(`
    INSERT INTO users (github_id, name, avatar_url, token)
    VALUES (?, ?, ?, ?)
  `);
  insert.run(githubId, name ?? null, avatarUrl ?? null, token);

  return db
    .query(`SELECT * FROM users WHERE github_id = ?`)
    .get(githubId) as User;
}

export function getUserByToken(token: string): User | undefined {
  return db.query(`SELECT * FROM users WHERE token = ?`).get(token) as
    | User
    | undefined;
}

// Get user by GitHub ID (optional helper)
export function getUserByGithubId(githubId: string): User | undefined {
  return db.query(`SELECT * FROM users WHERE github_id = ?`).get(githubId) as
    | User
    | undefined;
}

// (Optional) Refresh a token
export function refreshToken(githubId: string) {
  const newToken = randomUUID();
  db.query(`UPDATE users SET token = ? WHERE github_id = ?`).run(
    newToken,
    githubId,
  );
  return newToken;
}
