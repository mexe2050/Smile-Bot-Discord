const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a user from the server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for kicking the user')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const guildMember = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!guildMember) {
            return interaction.reply(`Could not find user: ${user.tag}`);
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: 'I don\'t have permission to kick members.', ephemeral: true });
        }

        await guildMember.kick(reason);
        await interaction.reply(`Kicked ${user.tag} for reason: ${reason}`);
    },
};