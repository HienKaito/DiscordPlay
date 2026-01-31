import { spawnRepo, collectionRepo, characterRepo } from '../database/repositories.js';
import { createClaimedEmbed } from '../utils/embed.js';

/**
 * Claim Service - Xử lý logic claim character
 */

export async function handleClaim(reaction, user) {
    // Bỏ qua bot
    if (user.bot) return { success: false, reason: 'bot' };

    // Chỉ xử lý reaction ❤️
    if (reaction.emoji.name !== '❤️') return { success: false, reason: 'wrong_emoji' };

    const messageId = reaction.message.id;

    // Kiểm tra spawn còn active không
    const spawn = spawnRepo.getActiveSpawn(messageId);

    if (!spawn) {
        return { success: false, reason: 'expired_or_claimed' };
    }

    // Kiểm tra user đã sở hữu character này chưa
    if (collectionRepo.userOwnsCharacter(user.id, spawn.character_id)) {
        return { success: false, reason: 'already_owned' };
    }

    // Claim character
    const result = spawnRepo.claimSpawn(messageId, user.id);

    if (result.changes === 0) {
        return { success: false, reason: 'claim_failed' };
    }

    // Thêm vào collection
    collectionRepo.addToCollection(user.id, spawn.character_id, messageId);

    // Update embed message
    try {
        const character = characterRepo.getById(spawn.character_id);
        const claimedEmbed = createClaimedEmbed(character, user.displayName || user.username);

        // Fetch full message để edit
        const message = await reaction.message.fetch();
        await message.edit({ embeds: [claimedEmbed] });

        // Remove all reactions
        await message.reactions.removeAll();
    } catch (err) {
        console.error('[Claim] Error updating message:', err.message);
    }

    return {
        success: true,
        character: spawn
    };
}

/**
 * Lấy message lỗi theo reason
 */
export function getClaimErrorMessage(reason) {
    const messages = {
        'expired_or_claimed': '⏰ Nhân vật này đã hết hạn hoặc đã được claim!',
        'already_owned': '❌ Bạn đã sở hữu nhân vật này rồi!',
        'claim_failed': '❌ Có lỗi xảy ra khi claim. Thử lại sau!',
        'wrong_emoji': '',
        'bot': ''
    };
    return messages[reason] || '';
}
