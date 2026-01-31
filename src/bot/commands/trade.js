import { SlashCommandBuilder } from 'discord.js';
import { tradeService, getTradeErrorMessage } from '../../services/trade.service.js';
import { createTradeRequestEmbed, createTradeButtons } from '../../utils/embed.js';

export const data = new SlashCommandBuilder()
    .setName('trade')
    .setDescription('Giao dịch nhân vật với người chơi khác')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('Người bạn muốn trade')
            .setRequired(true)
    );

export async function execute(interaction) {
    const targetUser = interaction.options.getUser('user');

    // Không trade với bot
    if (targetUser.bot) {
        return interaction.reply({
            content: '❌ Bạn không thể trade với bot!',
            ephemeral: true
        });
    }

    // Tạm gửi message trước để lấy ID
    const reply = await interaction.reply({
        content: '🔄 Đang tạo trade request...',
        fetchReply: true
    });

    // Tạo trade
    const result = tradeService.createTradeRequest(
        interaction.user.id,
        targetUser.id,
        reply.id,
        interaction.channelId
    );

    if (!result.success) {
        return interaction.editReply({
            content: getTradeErrorMessage(result.error),
            components: []
        });
    }

    // Update message với embed và buttons
    const embed = createTradeRequestEmbed(interaction.user, targetUser, result.tradeId);
    const buttons = createTradeButtons(result.tradeId, 'request');

    await interaction.editReply({
        content: `<@${targetUser.id}>`,
        embeds: [embed],
        components: [buttons]
    });
}
