const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ReactionRole = require('../../models/ReactionRole');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listreactionroles')
        .setDescription('Lists all reaction roles for the current server'),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const reactionRoles = await ReactionRole.find({ guildId: interaction.guild.id });

        if (reactionRoles.length === 0) {
            return interaction.reply({ content: 'No reaction roles have been set up for this server.', ephemeral: true });
        }

        const groupedRoles = reactionRoles.reduce((acc, role) => {
            if (!acc[role.group]) {
                acc[role.group] = [];
            }
            acc[role.group].push(role);
            return acc;
        }, {});

        let reply = 'Reaction Roles:\n\n';

        for (const [group, roles] of Object.entries(groupedRoles)) {
            reply += `Group: ${group}\n`;
            for (const role of roles) {
                const guildRole = interaction.guild.roles.cache.get(role.roleId);
                reply += `  ${role.emoji} -> ${guildRole ? guildRole.name : 'Unknown Role'}\n`;
            }
            reply += '\n';
        }

        interaction.reply({ content: reply, ephemeral: true });
    },
};