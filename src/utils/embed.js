import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getRarityInfo, formatRarity } from './rarity.js';
import { config } from '../config.js';

/**
 * Tạo spawn embed cho character
 */
export function createSpawnEmbed(character, expiresAt) {
    const rarityInfo = getRarityInfo(character.rarity);
    const timeLeft = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000 / 60));

    const embed = new EmbedBuilder()
        .setTitle(character.name_romaji || character.nameRomaji)
        .setColor(rarityInfo.color)
        .setImage(character.image_url || character.imageUrl)
        .addFields(
            { name: 'Anime', value: character.source_anime || character.sourceAnime || 'Unknown', inline: true },
            { name: 'Rarity', value: formatRarity(character.rarity), inline: true }
        )
        .setFooter({ text: `React ❤️ để claim • Hết hạn sau ${timeLeft} phút` })
        .setTimestamp();

    if (character.name_native || character.nameNative) {
        embed.addFields({ name: 'Tên gốc', value: character.name_native || character.nameNative, inline: true });
    }

    return embed;
}

/**
 * Update spawn embed khi đã được claim
 */
export function createClaimedEmbed(character, claimerName) {
    const rarityInfo = getRarityInfo(character.rarity);

    return new EmbedBuilder()
        .setTitle(character.name_romaji || character.nameRomaji)
        .setColor(rarityInfo.color)
        .setImage(character.image_url || character.imageUrl)
        .addFields(
            { name: 'Anime', value: character.source_anime || character.sourceAnime || 'Unknown', inline: true },
            { name: 'Rarity', value: formatRarity(character.rarity), inline: true },
            { name: '✅ Claimed by', value: claimerName, inline: false }
        )
        .setFooter({ text: 'Đã được thu thập!' })
        .setTimestamp();
}

/**
 * Tạo collection embed với pagination
 */
export function createCollectionEmbed(user, data) {
    const { characters, total, page, pageSize } = data;
    const totalPages = Math.ceil(total / pageSize);

    const embed = new EmbedBuilder()
        .setTitle(`📚 Bộ sưu tập của ${user.displayName}`)
        .setColor(0x5865F2)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: `Trang ${page}/${totalPages} • Tổng: ${total} nhân vật` });

    if (characters.length === 0) {
        embed.setDescription('Chưa có nhân vật nào. React ❤️ vào spawn để thu thập!');
    } else {
        const list = characters.map((c, i) => {
            const rarityInfo = getRarityInfo(c.rarity);
            return `${rarityInfo.emoji} **${c.name_romaji}** - ${c.source_anime}`;
        }).join('\n');
        embed.setDescription(list);
    }

    return embed;
}

/**
 * Tạo pagination buttons
 */
export function createPaginationButtons(currentPage, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`collection_prev_${currentPage}`)
            .setLabel('◀️ Trước')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage <= 1),
        new ButtonBuilder()
            .setCustomId(`collection_next_${currentPage}`)
            .setLabel('Sau ▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage >= totalPages)
    );
}

/**
 * Tạo stats embed
 */
export function createStatsEmbed(user, stats) {
    const embed = new EmbedBuilder()
        .setTitle(`📊 Thống kê của ${user.displayName}`)
        .setColor(0x5865F2)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            { name: '🟡 Legendary', value: String(stats.legendary || 0), inline: true },
            { name: '🟣 Epic', value: String(stats.epic || 0), inline: true },
            { name: '🔵 Rare', value: String(stats.rare || 0), inline: true },
            { name: '🟢 Uncommon', value: String(stats.uncommon || 0), inline: true },
            { name: '⚪ Common', value: String(stats.common || 0), inline: true },
            { name: '📚 Tổng', value: String(stats.total || 0), inline: true }
        );

    return embed;
}

/**
 * Tạo search result embed
 */
export function createSearchResultEmbed(characters, searchTerm) {
    const embed = new EmbedBuilder()
        .setTitle(`🔍 Kết quả tìm kiếm: "${searchTerm}"`)
        .setColor(0x5865F2);

    if (characters.length === 0) {
        embed.setDescription('Không tìm thấy nhân vật nào trong bộ sưu tập của bạn.');
    } else {
        const list = characters.map(c => {
            const rarityInfo = getRarityInfo(c.rarity);
            return `${rarityInfo.emoji} **${c.name_romaji}** - ${c.source_anime}`;
        }).join('\n');
        embed.setDescription(list);
        embed.setFooter({ text: `Tìm thấy ${characters.length} kết quả` });
    }

    return embed;
}
