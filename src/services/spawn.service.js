import { fetchRandomCharacter } from './anilist.service.js';
import { determineRarity } from '../utils/rarity.js';
import { createSpawnEmbed } from '../utils/embed.js';
import { characterRepo, spawnRepo, settingsRepo } from '../database/repositories.js';
import { config } from '../config.js';

/**
 * Spawn Service - Xử lý logic spawn character
 */

export async function spawnCharacter(client) {
    // Lấy tất cả guilds có cấu hình spawn channel
    const spawnChannels = settingsRepo.getAllSpawnChannels();

    if (spawnChannels.length === 0) {
        console.log('[Spawn] No spawn channels configured');
        return;
    }

    try {
        // Fetch random character từ AniList
        const charData = await fetchRandomCharacter();

        // Xác định rarity
        const rarity = determineRarity(charData.favorites);
        charData.rarity = rarity;

        // Lưu/update character vào database
        characterRepo.upsert(charData);
        const character = characterRepo.getByAnilistId(charData.anilistId);

        // Tính thời gian hết hạn
        const expiresAt = new Date(Date.now() + config.claimDurationMinutes * 60 * 1000);

        // Spawn vào tất cả các channels đã cấu hình
        for (const { guild_id, spawn_channel_id } of spawnChannels) {
            try {
                const channel = await client.channels.fetch(spawn_channel_id);
                if (!channel) continue;

                const embed = createSpawnEmbed(character, expiresAt.getTime());
                const message = await channel.send({ embeds: [embed] });

                // Add reaction để claim
                await message.react('❤️');

                // Lưu spawn history (format SQLite: YYYY-MM-DD HH:MM:SS UTC)
                const expiresAtSQLite = expiresAt.toISOString().replace('T', ' ').slice(0, 19);
                spawnRepo.createSpawn(
                    character.id,
                    message.id,
                    spawn_channel_id,
                    guild_id,
                    expiresAtSQLite
                );

                console.log(`[Spawn] ${character.name_romaji} (${rarity}) spawned in ${guild_id}`);
            } catch (err) {
                console.error(`[Spawn] Error in guild ${guild_id}:`, err.message);
            }
        }
    } catch (error) {
        console.error('[Spawn] Error fetching character:', error.message);
    }
}
