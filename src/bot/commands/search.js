import { SlashCommandBuilder } from 'discord.js';
import { collectionRepo } from '../../database/repositories.js';
import { createSearchResultEmbed } from '../../utils/embed.js';

export const data = new SlashCommandBuilder()
    .setName('search')
    .setDescription('Tìm kiếm nhân vật trong bộ sưu tập')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('Tên nhân vật cần tìm')
            .setRequired(true)
    );

export async function execute(interaction) {
    const searchTerm = interaction.options.getString('name');

    // Tìm trong collection của user
    const results = collectionRepo.searchInCollection(interaction.user.id, searchTerm);

    const embed = createSearchResultEmbed(results, searchTerm);

    await interaction.reply({
        embeds: [embed],
        ephemeral: true
    });
}
