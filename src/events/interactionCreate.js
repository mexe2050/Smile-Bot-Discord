const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            // List of commands that require special permissions
            const restrictedCommands = ['customembed', 'kick', 'ban', 'timeout', 'setreactionrole', 'setlevelupchannel', 'addshopitem', 'setdailyreward', 'deleteshopitem', 'setwelcome', 'setexit',];

            if (restrictedCommands.includes(interaction.commandName)) {
                // Check if the user has the required permissions (ADMINISTRATOR in this case)
                if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                    return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
                }
            }

            // Execute the command
            await command.execute(interaction);

            // If we reach here without throwing, the command was successful
            console.log(`Command ${interaction.commandName} executed successfully`);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);

            let errorMessage = 'There was an error while executing this command!';
            if (process.env.NODE_ENV === 'development') {
                errorMessage += ` Error: ${error.message}`;
            }

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },
};