const { PermissionFlagsBits } = require('discord.js');
const CommandPermissions = require('../../models/CommandPermissions');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
    
        try {
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
            }
            
            // If no custom permissions are set, or the user doesn't have the custom role,
            // check for Administrator permission
            if (!hasPermission && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({ 
                    content: 'You do not have permission to use this command.', 
                    ephemeral: true 
                });
            }
            
            // If we reach here, the user has permission, so execute the command
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            
            // Check if the interaction has already been replied to
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: 'There was an error while executing this command!', 
                    ephemeral: true 
                });
            }
        }
    },
  };