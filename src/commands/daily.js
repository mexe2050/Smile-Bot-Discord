const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');
const DailyReward = require('../../models/DailyReward');

const COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Claim your daily coins'),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            let user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });

            if (!user) {
                user = new User({
                    userId: interaction.user.id,
                    guildId: interaction.guild.id,
                    balance: 0,
                    lastDaily: null
                });
            }

            const now = Date.now();
            const lastDaily = user.lastDaily ? user.lastDaily.getTime() : 0;

            if (lastDaily && now - lastDaily < COOLDOWN) {
                const timeLeft = COOLDOWN - (now - lastDaily);
                const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
                const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                return interaction.editReply(`You can claim your daily reward again in ${hoursLeft} hours and ${minutesLeft} minutes.`);
            }

            const dailyReward = await DailyReward.findOne({ channelId: interaction.channelId });

            if (!dailyReward) {
                return interaction.editReply('Daily rewards are not set up for this channel.');
            }

            const DAILY_AMOUNT = dailyReward.amount;

            user.balance += DAILY_AMOUNT;
            user.lastDaily = new Date(now);
            await user.save();

            await interaction.editReply(`You've claimed your daily reward of ${DAILY_AMOUNT} coins in this channel! Your new balance is ${user.balance} coins.`);
        } catch (error) {
            console.error('Error in daily command:', error);
            if (interaction.deferred) {
                await interaction.editReply('An error occurred while processing your daily reward. Please try again later.');
            } else {
                await interaction.reply({ content: 'An error occurred while processing your daily reward. Please try again later.', ephemeral: true });
            }
        }
    },
};