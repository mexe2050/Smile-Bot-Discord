// commands/setreactionrole.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ReactionRole = require('../../models/ReactionRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setreactionrole')
        .setDescription('Sets up a reaction role')
        .addStringOption(option => 
            option.setName('group')
                .setDescription('The group for the reaction role')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('emoji')
                .setDescription('The emoji for the reaction')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('The role to assign')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The ID of the message to add the reaction to')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('requiredrole')
                .setDescription('The role required to use this reaction role (optional)')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const group = interaction.options.getString('group');
        const emoji = interaction.options.getString('emoji');
        const role = interaction.options.getRole('role');
        const messageId = interaction.options.getString('message');
        const requiredRole = interaction.options.getRole('requiredrole');

        const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
        if (!message) {
            return interaction.reply({ content: 'Could not find the specified message.', ephemeral: true });
        }

        const existingReactionRole = await ReactionRole.findOne({
            guildId: interaction.guild.id,
            group: group,
            messageId: messageId,
            emoji: emoji
        });

        if (existingReactionRole) {
            return interaction.reply({ content: 'A reaction role with this emoji already exists in this group for this message.', ephemeral: true });
        }

        try {
            await message.react(emoji);
        } catch (error) {
            return interaction.reply({ content: 'Failed to add reaction. Please make sure the emoji is valid.', ephemeral: true });
        }

        const newReactionRole = new ReactionRole({
            guildId: interaction.guild.id,
            channelId: interaction.channel.id,
            group,
            emoji,
            roleId: role.id,
            requiredRoleId: requiredRole ? requiredRole.id : null,
            messageId
        });
        await newReactionRole.save();

        let replyContent = `Reaction role set: ${emoji} -> ${role.name} in group ${group}`;
        if (requiredRole) {
            replyContent += `\nRequired role: ${requiredRole.name}`;
        }

        interaction.reply({ content: replyContent, ephemeral: true });
    },
};