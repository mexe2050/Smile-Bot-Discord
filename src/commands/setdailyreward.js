const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const DailyReward = require('../../models/DailyReward');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setdailyreward')
        .setDescription('Set the daily reward amount for a channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to set the daily reward for')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of coins to give as a daily reward')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const amount = interaction.options.getInteger('amount');

        try {
            await DailyReward.findOneAndUpdate(
                { channelId: channel.id },
                { amount: amount },
                { upsert: true, new: true }
            );

            interaction.reply(`Successfully set the daily reward for ${channel} to ${amount} coins.`);
        } catch (error) {
            console.error('Error setting daily reward:', error);
            interaction.reply('An error occurred while setting the daily reward. Please try again later.');
        }
    },
};