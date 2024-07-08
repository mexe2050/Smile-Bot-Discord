const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ReactionRole = require('../../models/ReactionRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removereactionrole')
        .setDescription('Removes a reaction role')
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The ID of the message with the reaction role')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('emoji')
                .setDescription('The emoji of the reaction role to remove')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const messageId = interaction.options.getString('message');
        const emoji = interaction.options.getString('emoji');

        const reactionRole = await ReactionRole.findOneAndDelete({
            guildId: interaction.guild.id,
            messageId: messageId,
            emoji: emoji
        });

        if (!reactionRole) {
            return interaction.reply({ content: 'Could not find a reaction role with the specified message ID and emoji.', ephemeral: true });
        }

        const channel = interaction.guild.channels.cache.get(reactionRole.channelId);
        if (channel) {
            const message = await channel.messages.fetch(messageId).catch(() => null);
            if (message) {
                await message.reactions.cache.get(emoji)?.remove().catch(() => null);
            }
        }

        interaction.reply({ content: `Removed reaction role: ${emoji}`, ephemeral: true });
    },
};