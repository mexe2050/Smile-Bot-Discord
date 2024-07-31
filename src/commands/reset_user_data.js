const { SlashCommandBuilder } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove_my_data')
        .setDescription('Remove all of your data from the bot'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userId = interaction.user.id;

        try {
            const collections = await mongoose.connection.db.collections();
            let deletedCount = 0;

            for (let collection of collections) {
                const result = await collection.deleteMany({ userId: userId });
                deletedCount += result.deletedCount;

                // If the collection uses a different field for user ID, try that too
                const result2 = await collection.deleteMany({ user: userId });
                deletedCount += result2.deletedCount;
            }

            if (deletedCount > 0) {
                await interaction.editReply(`Your data has been removed. ${deletedCount} document(s) deleted.`);
            } else {
                await interaction.editReply('No data found associated with your user ID.');
            }
        } catch (error) {
            console.error('Error removing user data:', error);
            await interaction.editReply('There was an error removing your data. Please try again later or contact an administrator.');
        }
    },
};