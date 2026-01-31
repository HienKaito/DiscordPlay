-- Characters table (cached from AniList)
CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anilist_id INTEGER UNIQUE NOT NULL,
    name_romaji TEXT NOT NULL,
    name_english TEXT,
    name_native TEXT,
    image_url TEXT NOT NULL,
    source_anime TEXT,
    description TEXT,
    gender TEXT,
    favorites INTEGER DEFAULT 0,
    rarity TEXT CHECK(rarity IN ('common','uncommon','rare','epic','legendary')),
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Server settings
CREATE TABLE IF NOT EXISTS server_settings (
    guild_id TEXT PRIMARY KEY,
    spawn_channel_id TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User collections
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    character_id INTEGER NOT NULL,
    claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    spawn_message_id TEXT,
    FOREIGN KEY (character_id) REFERENCES characters(id),
    UNIQUE(user_id, character_id)
);

-- Spawn history
CREATE TABLE IF NOT EXISTS spawn_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    message_id TEXT UNIQUE NOT NULL,
    channel_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    spawned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    claimed_by TEXT,
    claimed_at DATETIME,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_spawn_expires ON spawn_history(expires_at);
CREATE INDEX IF NOT EXISTS idx_spawn_message ON spawn_history(message_id);

-- Trade sessions
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    initiator_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','selecting','confirming','completed','cancelled','expired')),
    initiator_confirmed INTEGER DEFAULT 0,
    target_confirmed INTEGER DEFAULT 0,
    message_id TEXT,
    channel_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
);

-- Trade items (characters being traded)
CREATE TABLE IF NOT EXISTS trade_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    character_id INTEGER NOT NULL,
    FOREIGN KEY (trade_id) REFERENCES trades(id),
    FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE INDEX IF NOT EXISTS idx_trades_users ON trades(initiator_id, target_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
