const { PermissionFlagsBits } = require('discord.js');
const CommandPermissions = require('../../models/CommandPermissions');

const publicCommands = ['setgiveaway', 'level', 'daily']; // Add other public commands here

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
    
        try {
            // Skip permission check for public commands
            if (!publicCommands.includes(interaction.commandName)) {
                // Universal permission check
                const commandPermissions = await CommandPermissions.findOne({ 
                    guildId: interaction.guild.id,
                    commandName: interaction.commandName 
                });
                let hasPermission = false;
                if (commandPermissions && commandPermissions.roleIds.length > 0) {
                    hasPermission = interaction.member.roles.cache.some(role => 
                        commandPermissions.roleIds.includes(role.id)
                    );
                } else {
                    // If no specific permissions are set, allow admin by default
                    hasPermission = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
                }
                
                if (!hasPermission) {
                    return interaction.reply({ 
                        content: 'You do not have permission to use this command.', 
                        ephemeral: true 
                    });
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