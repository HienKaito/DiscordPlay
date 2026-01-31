import db from './db.js';

export const characterRepo = {
    // Get character by AniList ID
    getByAnilistId(anilistId) {
        return db.prepare('SELECT * FROM characters WHERE anilist_id = ?').get(anilistId);
    },

    // Insert or update character
    upsert(character) {
        const stmt = db.prepare(`
            INSERT INTO characters (anilist_id, name_romaji, name_english, name_native, image_url, source_anime, gender, favorites, rarity)
            VALUES (@anilistId, @nameRomaji, @nameEnglish, @nameNative, @imageUrl, @sourceAnime, @gender, @favorites, @rarity)
            ON CONFLICT(anilist_id) DO UPDATE SET
                name_romaji = @nameRomaji,
                name_english = @nameEnglish,
                image_url = @imageUrl,
                favorites = @favorites,
                rarity = @rarity,
                cached_at = CURRENT_TIMESTAMP
        `);
        return stmt.run(character);
    },

    // Get character by internal ID
    getById(id) {
        return db.prepare('SELECT * FROM characters WHERE id = ?').get(id);
    }
};

export const collectionRepo = {
    // Add character to user's collection
    addToCollection(userId, characterId, spawnMessageId) {
        const stmt = db.prepare(`
            INSERT OR IGNORE INTO collections (user_id, character_id, spawn_message_id)
            VALUES (?, ?, ?)
        `);
        return stmt.run(userId, characterId, spawnMessageId);
    },

    // Check if user owns character
    userOwnsCharacter(userId, characterId) {
        const result = db.prepare('SELECT 1 FROM collections WHERE user_id = ? AND character_id = ?').get(userId, characterId);
        return !!result;
    },

    // Get user's collection with pagination
    getUserCollection(userId, page = 1, pageSize = 10) {
        const offset = (page - 1) * pageSize;
        const characters = db.prepare(`
            SELECT c.*, col.claimed_at
            FROM collections col
            JOIN characters c ON col.character_id = c.id
            WHERE col.user_id = ?
            ORDER BY col.claimed_at DESC
            LIMIT ? OFFSET ?
        `).all(userId, pageSize, offset);

        const total = db.prepare('SELECT COUNT(*) as count FROM collections WHERE user_id = ?').get(userId);

        return { characters, total: total.count, page, pageSize };
    },

    // Search characters in collection
    searchInCollection(userId, searchTerm) {
        return db.prepare(`
            SELECT c.*, col.claimed_at
            FROM collections col
            JOIN characters c ON col.character_id = c.id
            WHERE col.user_id = ? 
            AND (c.name_romaji LIKE ? OR c.name_english LIKE ? OR c.name_native LIKE ?)
            ORDER BY c.rarity DESC
            LIMIT 10
        `).all(userId, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    },

    // Get collection stats
    getStats(userId) {
        return db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN c.rarity = 'legendary' THEN 1 ELSE 0 END) as legendary,
                SUM(CASE WHEN c.rarity = 'epic' THEN 1 ELSE 0 END) as epic,
                SUM(CASE WHEN c.rarity = 'rare' THEN 1 ELSE 0 END) as rare,
                SUM(CASE WHEN c.rarity = 'uncommon' THEN 1 ELSE 0 END) as uncommon,
                SUM(CASE WHEN c.rarity = 'common' THEN 1 ELSE 0 END) as common
            FROM collections col
            JOIN characters c ON col.character_id = c.id
            WHERE col.user_id = ?
        `).get(userId);
    }
};

export const spawnRepo = {
    // Create spawn record
    createSpawn(characterId, messageId, channelId, guildId, expiresAt) {
        const stmt = db.prepare(`
            INSERT INTO spawn_history (character_id, message_id, channel_id, guild_id, expires_at)
            VALUES (?, ?, ?, ?, ?)
        `);
        return stmt.run(characterId, messageId, channelId, guildId, expiresAt);
    },

    // Get active spawn by message ID
    getActiveSpawn(messageId) {
        return db.prepare(`
            SELECT sh.*, c.*
            FROM spawn_history sh
            JOIN characters c ON sh.character_id = c.id
            WHERE sh.message_id = ? AND sh.claimed_by IS NULL AND sh.expires_at > datetime('now')
        `).get(messageId);
    },

    // Mark spawn as claimed
    claimSpawn(messageId, userId) {
        const stmt = db.prepare(`
            UPDATE spawn_history 
            SET claimed_by = ?, claimed_at = CURRENT_TIMESTAMP 
            WHERE message_id = ? AND claimed_by IS NULL
        `);
        return stmt.run(userId, messageId);
    }
};

export const settingsRepo = {
    // Get spawn channel for guild
    getSpawnChannel(guildId) {
        const result = db.prepare('SELECT spawn_channel_id FROM server_settings WHERE guild_id = ?').get(guildId);
        return result?.spawn_channel_id;
    },

    // Set spawn channel for guild
    setSpawnChannel(guildId, channelId) {
        const stmt = db.prepare(`
            INSERT INTO server_settings (guild_id, spawn_channel_id)
            VALUES (?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET spawn_channel_id = ?, updated_at = CURRENT_TIMESTAMP
        `);
        return stmt.run(guildId, channelId, channelId);
    },

    // Get all guilds with spawn channels
    getAllSpawnChannels() {
        return db.prepare('SELECT guild_id, spawn_channel_id FROM server_settings WHERE spawn_channel_id IS NOT NULL').all();
    }
};
