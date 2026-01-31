import 'dotenv/config';

export const config = {
    // Discord
    token: process.env.DISCORD_TOKEN,

    // Spawn settings
    spawnIntervalMinutes: parseInt(process.env.SPAWN_INTERVAL_MINUTES) || 5,
    claimDurationMinutes: parseInt(process.env.CLAIM_DURATION_MINUTES) || 5,

    // Rarity settings (based on favorites count)
    rarity: {
        legendary: { minFavorites: 10000, chance: 0.005, color: 0xFFD700, emoji: '🟡' },
        epic: { minFavorites: 8000, chance: 0.025, color: 0x9900FF, emoji: '🟣' },
        rare: { minFavorites: 5000, chance: 0.07, color: 0x0066FF, emoji: '🔵' },
        uncommon: { minFavorites: 1000, chance: 0.20, color: 0x00FF00, emoji: '🟢' },
        common: { minFavorites: 0, chance: 0.70, color: 0xFFFFFF, emoji: '⚪' }
    },

    // AniList API
    anilistUrl: 'https://graphql.anilist.co',

    // Pagination
    collectionPageSize: 10
};
