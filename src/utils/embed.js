import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
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

/**
 * Tạo trade request embed
 */
export function createTradeRequestEmbed(initiator, target, tradeId) {
    return new EmbedBuilder()
        .setTitle('🔄 Trade Request')
        .setColor(0xFFA500)
        .setDescription(`**${initiator.displayName || initiator.username}** muốn trade với **${target.displayName || target.username}**`)
        .addFields(
            { name: '⏰ Thời gian', value: 'Hết hạn sau 1 phút', inline: true }
        )
        .setFooter({ text: `Trade ID: ${tradeId}` })
        .setTimestamp();
}

/**
 * Tạo trade select embed
 */
export function createTradeSelectEmbed(trade, initiator, target, initiatorItems, targetItems) {
    const formatItems = (items) => {
        if (items.length === 0) return '_Chưa chọn_';
        return items.map(i => {
            const rarityInfo = getRarityInfo(i.rarity);
            return `${rarityInfo.emoji} ${i.name_romaji}`;
        }).join('\n');
    };

    return new EmbedBuilder()
        .setTitle('🔄 Trade - Chọn nhân vật')
        .setColor(0x5865F2)
        .addFields(
            { name: `📤 ${initiator.displayName || initiator.username}`, value: formatItems(initiatorItems), inline: true },
            { name: `📥 ${target.displayName || target.username}`, value: formatItems(targetItems), inline: true }
        )
        .setFooter({ text: `Trade ID: ${trade.id} • Tối đa 3 nhân vật mỗi bên` })
        .setTimestamp();
}

/**
 * Tạo trade confirm embed
 */
export function createTradeConfirmEmbed(trade, initiator, target, initiatorItems, targetItems) {
    const formatItems = (items) => {
        if (items.length === 0) return '_Không có_';
        return items.map(i => {
            const rarityInfo = getRarityInfo(i.rarity);
            return `${rarityInfo.emoji} ${i.name_romaji}`;
        }).join('\n');
    };

    const initiatorStatus = trade.initiator_confirmed ? '✅' : '⏳';
    const targetStatus = trade.target_confirmed ? '✅' : '⏳';

    return new EmbedBuilder()
        .setTitle('🔄 Trade - Xác nhận')
        .setColor(0xFFD700)
        .addFields(
            { name: `${initiatorStatus} ${initiator.displayName || initiator.username} đưa`, value: formatItems(initiatorItems), inline: true },
            { name: `${targetStatus} ${target.displayName || target.username} đưa`, value: formatItems(targetItems), inline: true }
        )
        .setFooter({ text: 'Cả 2 bên cần xác nhận để hoàn tất trade' })
        .setTimestamp();
}

/**
 * Tạo trade complete embed
 */
export function createTradeCompleteEmbed(initiator, target) {
    return new EmbedBuilder()
        .setTitle('✅ Trade Hoàn Tất!')
        .setColor(0x00FF00)
        .setDescription(`**${initiator.displayName || initiator.username}** và **${target.displayName || target.username}** đã trade thành công!`)
        .setTimestamp();
}

/**
 * Tạo trade cancelled embed
 */
export function createTradeCancelledEmbed(reason = 'cancelled') {
    const messages = {
        'cancelled': 'Trade đã bị hủy.',
        'declined': 'Trade request bị từ chối.',
        'expired': 'Trade đã hết thời gian.'
    };

    return new EmbedBuilder()
        .setTitle('❌ Trade Cancelled')
        .setColor(0xFF0000)
        .setDescription(messages[reason] || messages['cancelled'])
        .setTimestamp();
}

/**
 * Tạo buttons cho trade
 */
export function createTradeButtons(tradeId, phase) {
    if (phase === 'request') {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`trade_accept_${tradeId}`)
                .setLabel('✅ Accept')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`trade_decline_${tradeId}`)
                .setLabel('❌ Decline')
                .setStyle(ButtonStyle.Danger)
        );
    }

    if (phase === 'selecting') {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`trade_select_${tradeId}`)
                .setLabel('📝 Chọn nhân vật')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`trade_cancel_${tradeId}`)
                .setLabel('❌ Hủy')
                .setStyle(ButtonStyle.Danger)
        );
    }

    if (phase === 'confirming') {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`trade_confirm_${tradeId}`)
                .setLabel('✅ Xác nhận')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`trade_cancel_${tradeId}`)
                .setLabel('❌ Hủy')
                .setStyle(ButtonStyle.Danger)
        );
    }

    return new ActionRowBuilder();
}

/**
 * Tạo select menu cho chọn nhân vật trade
 */
export function createTradeSelectMenu(tradeId, characters) {
    const options = characters.slice(0, 25).map(c => {
        const rarityInfo = getRarityInfo(c.rarity);
        return {
            label: c.name_romaji.substring(0, 100),
            description: `${c.source_anime}`.substring(0, 100),
            value: String(c.id),
            emoji: rarityInfo.emoji
        };
    });

    if (options.length === 0) {
        return null;
    }

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`trade_items_${tradeId}`)
            .setPlaceholder('Chọn nhân vật để trade (tối đa 3)')
            .setMinValues(0)
            .setMaxValues(Math.min(3, options.length))
            .addOptions(options)
    );
}
