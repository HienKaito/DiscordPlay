import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { settingsRepo } from '../../database/repositories.js';

export const data = new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Set channel để spawn nhân vật (Admin only)')
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel để spawn nhân vật')
            .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    // Kiểm tra channel là text channel
    if (!channel.isTextBased()) {
        return interaction.reply({
            content: '❌ Vui lòng chọn một text channel!',
            ephemeral: true
        });
    }

    // Lưu vào database
    settingsRepo.setSpawnChannel(interaction.guildId, channel.id);

    await interaction.reply({
        content: `✅ Đã set spawn channel thành ${channel}!\nNhân vật sẽ xuất hiện ở đây mỗi 5 phút.`,
        ephemeral: true
    });
}
