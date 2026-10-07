export const INIT_SCHEMA_SQL = `
-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pages table
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  learning_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  current_version_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chats table (1-to-1 with pages)
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  page_id TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL DEFAULT 'claude-3-5-sonnet',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

-- Messages table (1-to-many with chats)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  attachment_name TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);

-- JSON versions table (1-to-many with pages)
CREATE TABLE IF NOT EXISTS json_versions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL,
  version_no INTEGER NOT NULL,
  json TEXT NOT NULL,
  valid INTEGER NOT NULL DEFAULT 1,
  errors TEXT,
  source_message_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (source_message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('outline_section_threshold', '4');

-- Indexes for performance & lookups
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_page_id ON chats(page_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_json_versions_page_id ON json_versions(page_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_json_versions_page_version ON json_versions(page_id, version_no);
`;
