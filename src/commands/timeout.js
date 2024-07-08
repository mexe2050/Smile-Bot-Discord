const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Times out a user for a specified duration')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('duration')
                .setDescription('The duration of the timeout in minutes')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for the timeout')
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const guildMember = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!guildMember) {
            return interaction.reply(`Could not find user: ${user.tag}`);
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: 'I don\'t have permission to timeout members.', ephemeral: true });
        }

        await guildMember.timeout(duration * 60 * 1000, reason);
        await interaction.reply(`Timed out ${user.tag} for ${duration} minutes for reason: ${reason}`);
    },
};