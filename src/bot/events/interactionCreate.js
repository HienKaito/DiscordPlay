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

    // Handle button interactions (pagination)
    if (interaction.isButton()) {
        const [action, direction, pageStr] = interaction.customId.split('_');

        if (action === 'collection') {
            const currentPage = parseInt(pageStr);
            const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

            // Import dynamically to avoid circular deps
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
    }
}
