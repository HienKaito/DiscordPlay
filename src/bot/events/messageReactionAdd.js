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
    const channel = reaction.message.channel;

    if (result.success) {
        // Gửi thông báo vào channel
        await channel.send(`🎉 <@${user.id}> đã thu thập **${result.character.name_romaji}**!`);
    } else if (result.reason && result.reason !== 'bot' && result.reason !== 'wrong_emoji') {
        const errorMsg = getClaimErrorMessage(result.reason);
        if (errorMsg) {
            // Gửi lỗi vào channel (tự xóa sau 5 giây)
            const msg = await channel.send(`<@${user.id}> ${errorMsg}`);
            setTimeout(() => msg.delete().catch(() => { }), 5000);
        }
    }
}
