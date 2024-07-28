const { PermissionFlagsBits } = require('discord.js');





module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
    
        try {
           
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