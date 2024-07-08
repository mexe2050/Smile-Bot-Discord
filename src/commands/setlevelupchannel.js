const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const Guild = require('../../models/Guild');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlevelupchannel')
        .setDescription('Sets the channel for level-up messages')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to send level-up messages')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply('You do not have permission to use this command.');
        }

        const channel = interaction.options.getChannel('channel');

        await Guild.findOneAndUpdate(
            { guildId: interaction.guild.id },
            { levelUpChannelId: channel.id },
            { upsert: true, new: true }
        );

        interaction.reply(`Level-up messages will now be sent in ${channel}.`);
    },
};