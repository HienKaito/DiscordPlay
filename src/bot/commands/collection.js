import { SlashCommandBuilder } from 'discord.js';
import { collectionRepo } from '../../database/repositories.js';
import { createCollectionEmbed, createStatsEmbed, createPaginationButtons } from '../../utils/embed.js';
import { config } from '../../config.js';

export const data = new SlashCommandBuilder()
    .setName('collection')
    .setDescription('Xem bộ sưu tập nhân vật')
    .addUserOption(option =>
        option.setName('user')
            .setDescription('Xem collection của người khác')
            .setRequired(false)
    );

export async function execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild.members.fetch(targetUser.id);

    // Lấy collection
    const data = collectionRepo.getUserCollection(targetUser.id, 1, config.collectionPageSize);
    const stats = collectionRepo.getStats(targetUser.id);

    const totalPages = Math.ceil(data.total / config.collectionPageSize);

    const embed = createCollectionEmbed(member, data);

    const components = totalPages > 1
        ? [createPaginationButtons(1, totalPages)]
        : [];

    await interaction.reply({
        embeds: [embed],
        components,
        ephemeral: false
    });
}
