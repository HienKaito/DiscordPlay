import { handleClaim, getClaimErrorMessage } from '../../services/claim.service.js';

export const name = 'messageReactionAdd';

export async function execute(client, reaction, user) {
    // Handle partial reactions
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('[Reaction] Error fetching partial:', error);
            return;
        }
    }

    // Chỉ xử lý reaction ❤️
    if (reaction.emoji.name !== '❤️') return;

    // Bỏ qua bot
    if (user.bot) return;

    // Xử lý claim
    const result = await handleClaim(reaction, user);

    if (result.success) {
        // Gửi DM thông báo thành công (optional, có thể bỏ nếu muốn)
        try {
            await user.send(`🎉 Bạn đã thu thập **${result.character.name_romaji}**!`);
        } catch (err) {
            // User có thể tắt DM, bỏ qua
        }
    } else if (result.reason && result.reason !== 'bot' && result.reason !== 'wrong_emoji') {
        const errorMsg = getClaimErrorMessage(result.reason);
        if (errorMsg) {
            try {
                await user.send(errorMsg);
            } catch (err) {
                // User có thể tắt DM
            }
        }
    }
}
