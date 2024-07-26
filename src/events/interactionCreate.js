module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isCommand()) return;
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            console.log(`User ${interaction.user.tag} attempting to use command: ${interaction.commandName}`);
            
            // Defer the reply immediately
            await interaction.deferReply({ ephemeral: true });

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
            
            if (!hasPermission && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                console.log(`User ${interaction.user.tag} denied permission for command: ${interaction.commandName}`);
                return interaction.editReply({ 
                    content: 'You do not have permission to use this command.',
                    ephemeral: true 
                });
            }
            
            console.log(`Executing command ${interaction.commandName} for user ${interaction.user.tag}`);
            await command.execute(interaction);
            
            console.log(`Command ${interaction.commandName} executed successfully for user ${interaction.user.tag}`);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName} for user ${interaction.user.tag}:`, error);
            
            let errorMessage = 'There was an error while executing this command!';
            if (process.env.NODE_ENV === 'development') {
                errorMessage += ` Error: ${error.message}`;
            }
            
            await interaction.editReply({ content: errorMessage, ephemeral: true }).catch(console.error);
        }
    },
};