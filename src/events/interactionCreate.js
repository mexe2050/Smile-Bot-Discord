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
            // allow the command to proceed (individual commands can still check for specific permissions)
            if (!hasPermission && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                // You can adjust this check. For now, we're using Administrator as a fallback
                return await interaction.reply({ 
                    content: 'You do not have permission to use this command.', 
                    ephemeral: true 
                });
            }

            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error while executing this command!', 
                ephemeral: true 
            });
        }
    },
};