import { config } from '../config.js';

/**
 * Xác định rarity dựa trên số favorites của character
 */
export function determineRarity(favorites) {
    const { rarity } = config;

    if (favorites >= rarity.legendary.minFavorites) return 'legendary';
    if (favorites >= rarity.epic.minFavorites) return 'epic';
    if (favorites >= rarity.rare.minFavorites) return 'rare';
    if (favorites >= rarity.uncommon.minFavorites) return 'uncommon';
    return 'common';
}

/**
 * Lấy thông tin rarity (color, emoji)
 */
export function getRarityInfo(rarity) {
    return config.rarity[rarity] || config.rarity.common;
}

/**
 * Format rarity text với emoji
 */
export function formatRarity(rarity) {
    const info = getRarityInfo(rarity);
    return `${info.emoji} ${rarity.charAt(0).toUpperCase() + rarity.slice(1)}`;
}
