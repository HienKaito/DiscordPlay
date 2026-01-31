export const name = 'interactionCreate';

export async function execute(client, interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`[Command] Unknown command: ${interaction.commandName}`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`[Command] Error in ${interaction.commandName}:`, error);

            const reply = {
                content: '❌ Có lỗi xảy ra khi thực hiện lệnh!',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    }

    // Handle button interactions
    if (interaction.isButton()) {
        const customId = interaction.customId;
        const parts = customId.split('_');
        const action = parts[0];

        // Collection pagination
        if (action === 'collection') {
            const [, direction, pageStr] = parts;
            const currentPage = parseInt(pageStr);
            const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

            const { collectionRepo } = await import('../../database/repositories.js');
            const { createCollectionEmbed, createPaginationButtons } = await import('../../utils/embed.js');
            const { config } = await import('../../config.js');

            const member = await interaction.guild.members.fetch(interaction.user.id);
            const data = collectionRepo.getUserCollection(interaction.user.id, newPage, config.collectionPageSize);
            const totalPages = Math.ceil(data.total / config.collectionPageSize);

            const embed = createCollectionEmbed(member, data);
            const components = [createPaginationButtons(newPage, totalPages)];

            await interaction.update({ embeds: [embed], components });
        }

        // Trade buttons
        if (action === 'trade') {
            const [, tradeAction, tradeIdStr] = parts;
            const tradeId = parseInt(tradeIdStr);

            const { tradeService, getTradeErrorMessage } = await import('../../services/trade.service.js');
            const { tradeRepo } = await import('../../database/repositories.js');
            const {
                createTradeSelectEmbed,
                createTradeConfirmEmbed,
                createTradeCompleteEmbed,
                createTradeCancelledEmbed,
                createTradeButtons,
                createTradeSelectMenu
            } = await import('../../utils/embed.js');

            const trade = tradeRepo.getById(tradeId);
            if (!trade) {
                return interaction.reply({ content: '❌ Trade không tồn tại!', ephemeral: true });
            }

            const initiator = await client.users.fetch(trade.initiator_id);
            const target = await client.users.fetch(trade.target_id);

            // Accept trade
            if (tradeAction === 'accept') {
                if (interaction.user.id !== trade.target_id) {
                    return interaction.reply({ content: '❌ Chỉ người được mời mới có thể accept!', ephemeral: true });
                }

                const result = tradeService.acceptTrade(tradeId, interaction.user.id);
                if (!result.success) {
                    return interaction.reply({ content: getTradeErrorMessage(result.error), ephemeral: true });
                }

                const initiatorItems = tradeRepo.getUserItems(tradeId, trade.initiator_id);
                const targetItems = tradeRepo.getUserItems(tradeId, trade.target_id);
                const embed = createTradeSelectEmbed(trade, initiator, target, initiatorItems, targetItems);
                const buttons = createTradeButtons(tradeId, 'selecting');

                await interaction.update({ embeds: [embed], components: [buttons] });
            }

            // Decline trade
            if (tradeAction === 'decline') {
                if (interaction.user.id !== trade.target_id) {
                    return interaction.reply({ content: '❌ Chỉ người được mời mới có thể decline!', ephemeral: true });
                }

                tradeService.declineTrade(tradeId, interaction.user.id);
                const embed = createTradeCancelledEmbed('declined');
                await interaction.update({ embeds: [embed], components: [] });
            }

            // Open select menu
            if (tradeAction === 'select') {
                if (interaction.user.id !== trade.initiator_id && interaction.user.id !== trade.target_id) {
                    return interaction.reply({ content: '❌ Bạn không tham gia trade này!', ephemeral: true });
                }

                const characters = tradeService.getUserCollectionForTrade(interaction.user.id);
                if (characters.length === 0) {
                    return interaction.reply({ content: '❌ Bạn không có nhân vật nào để trade!', ephemeral: true });
                }

                const selectMenu = createTradeSelectMenu(tradeId, characters);
                await interaction.reply({
                    content: 'Chọn nhân vật bạn muốn đưa (có thể chọn 0 để gift):',
                    components: [selectMenu],
                    ephemeral: true
                });
            }

            // Confirm trade
            if (tradeAction === 'confirm') {
                if (interaction.user.id !== trade.initiator_id && interaction.user.id !== trade.target_id) {
                    return interaction.reply({ content: '❌ Bạn không tham gia trade này!', ephemeral: true });
                }

                const result = tradeService.confirmTrade(tradeId, interaction.user.id);
                if (!result.success) {
                    return interaction.reply({ content: getTradeErrorMessage(result.error), ephemeral: true });
                }

                if (result.completed) {
                    const embed = createTradeCompleteEmbed(initiator, target);
                    await interaction.update({ embeds: [embed], components: [] });
                } else {
                    // Update embed to show who confirmed
                    const updatedTrade = tradeRepo.getById(tradeId);
                    const initiatorItems = tradeRepo.getUserItems(tradeId, trade.initiator_id);
                    const targetItems = tradeRepo.getUserItems(tradeId, trade.target_id);
                    const embed = createTradeConfirmEmbed(updatedTrade, initiator, target, initiatorItems, targetItems);
                    const buttons = createTradeButtons(tradeId, 'confirming');
                    await interaction.update({ embeds: [embed], components: [buttons] });
                }
            }

            // Cancel trade
            if (tradeAction === 'cancel') {
                if (interaction.user.id !== trade.initiator_id && interaction.user.id !== trade.target_id) {
                    return interaction.reply({ content: '❌ Bạn không tham gia trade này!', ephemeral: true });
                }

                tradeService.cancelTrade(tradeId, interaction.user.id);
                const embed = createTradeCancelledEmbed('cancelled');
                await interaction.update({ embeds: [embed], components: [] });
            }
        }
    }

    // Handle select menu interactions
    if (interaction.isStringSelectMenu()) {
        const customId = interaction.customId;
        const parts = customId.split('_');

        if (parts[0] === 'trade' && parts[1] === 'items') {
            const tradeId = parseInt(parts[2]);
            const selectedIds = interaction.values.map(v => parseInt(v));

            const { tradeService, getTradeErrorMessage } = await import('../../services/trade.service.js');
            const { tradeRepo } = await import('../../database/repositories.js');
            const { createTradeConfirmEmbed, createTradeButtons } = await import('../../utils/embed.js');

            const result = tradeService.selectItems(tradeId, interaction.user.id, selectedIds);
            if (!result.success) {
                return interaction.reply({ content: getTradeErrorMessage(result.error), ephemeral: true });
            }

            await interaction.reply({ content: `✅ Đã chọn ${selectedIds.length} nhân vật!`, ephemeral: true });

            // Check if we should move to confirming
            const trade = tradeRepo.getById(tradeId);
            const initiatorItems = tradeRepo.getUserItems(tradeId, trade.initiator_id);
            const targetItems = tradeRepo.getUserItems(tradeId, trade.target_id);

            // If both have selected (or one selected for gift scenario), move to confirm
            // For simplicity, after any selection, update the trade message
            try {
                const channel = await client.channels.fetch(trade.channel_id);
                const message = await channel.messages.fetch(trade.message_id);

                const initiator = await client.users.fetch(trade.initiator_id);
                const target = await client.users.fetch(trade.target_id);

                // Move to confirming phase
                tradeService.moveToConfirming(tradeId);
                const embed = createTradeConfirmEmbed(trade, initiator, target, initiatorItems, targetItems);
                const buttons = createTradeButtons(tradeId, 'confirming');

                await message.edit({ embeds: [embed], components: [buttons] });
            } catch (err) {
                console.error('[Trade] Error updating trade message:', err);
            }
        }
    }
}
