import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { searchCharacter } from '../../services/anilist.service.js';
import { determineRarity, getRarityInfo, formatRarity } from '../../utils/rarity.js';

export const data = new SlashCommandBuilder()
    .setName('info')
    .setDescription('Xem thông tin nhân vật từ AniList')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('Tên nhân vật cần tìm')
            .setRequired(true)
    );

export async function execute(interaction) {
    await interaction.deferReply();

    const searchTerm = interaction.options.getString('name');

    try {
        const character = await searchCharacter(searchTerm);

        if (!character) {
            return interaction.editReply({
                content: `❌ Không tìm thấy nhân vật "${searchTerm}" trên AniList!`
            });
        }

        // Xác định rarity dựa trên favorites
        const rarity = determineRarity(character.favorites);
        const rarityInfo = getRarityInfo(rarity);

        const embed = new EmbedBuilder()
            .setTitle(character.nameRomaji)
            .setColor(rarityInfo.color)
            .setImage(character.imageUrl)
            .addFields(
                { name: 'Anime', value: character.sourceAnime || 'Unknown', inline: true },
                { name: 'Rarity', value: formatRarity(rarity), inline: true },
                { name: '❤️ Favorites', value: character.favorites.toLocaleString(), inline: true }
            )
            .setFooter({ text: `AniList ID: ${character.anilistId}` })
            .setTimestamp();

        if (character.nameNative) {
            embed.addFields({ name: 'Tên gốc', value: character.nameNative, inline: true });
        }

        if (character.gender) {
            embed.addFields({ name: 'Giới tính', value: character.gender, inline: true });
        }

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('[Info] Error:', error);
        await interaction.editReply({
            content: '❌ Có lỗi xảy ra khi tìm kiếm. Thử lại sau!'
        });
    }
}
