const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../models/User'); // Adjust the path as needed

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reset_user_data')
        .setDescription('Reset all user data')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to reset data for (leave empty to reset your own data)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const targetUser = interaction.options.getUser('user') || interaction.user;

        try {
            // Find and delete the user's data
            const result = await User.findOneAndDelete({ 
                userId: targetUser.id, 
                guildId: interaction.guild.id 
            });

            if (result) {
                // If data was found and deleted
                await interaction.editReply(`User data for ${targetUser.tag} has been reset.`);
            } else {
                // If no data was found
                await interaction.editReply(`No data found for ${targetUser.tag}. Nothing to reset.`);
            }

            // Optionally, you can create a new empty document for the user
            const newUser = new User({
                userId: targetUser.id,
                guildId: interaction.guild.id,
                // Add any default values you want
                xp: 0,
                level: 0,
                balance: 0,
                // Reset any other fields you have
            });
            await newUser.save();

        } catch (error) {
            console.error('Error resetting user data:', error);
            await interaction.editReply('There was an error trying to reset the user data. Please try again later.');
        }
    },
};