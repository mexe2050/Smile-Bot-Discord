const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const WelcomeExit = require('../../models/WelcomeExit');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Set the welcome channel and message')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send welcome messages')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('The welcome message (use {user} for username)')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply('You do not have permission to use this command.');
        }

        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');

        await WelcomeExit.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { welcomeChannelId: channel.id, welcomeMessage: message },
            { upsert: true, new: true }
        );

        interaction.reply(`Welcome channel set to ${channel} with message: ${message}`);
    },
};