const { SlashCommandBuilder } = require('discord.js');
const User = require('../../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Check your coin balance'),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });

            if (!user) {
                return interaction.editReply('You don\'t have any coins yet. Start chatting to earn some!');
            }

            await interaction.editReply(`Your current balance is ${user.balance} coins.`);
        } catch (error) {
            console.error('Error checking balance:', error);
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply('An error occurred while checking your balance. Please try again later.').catch(console.error);
            } else {
                await interaction.reply('An error occurred while checking your balance. Please try again later.').catch(console.error);
            }
        }
    },
};