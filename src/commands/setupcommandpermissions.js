const { SlashCommandBuilder } = require('discord.js');
const CommandPermissions = require('../../models/CommandPermissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupcommandpermissions')
        .setDescription('Set up roles that can use specific commands (Owner only)')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command to set permissions for')
                .setRequired(true)
                .addChoices(
                    { name: 'customembed', value: 'customembed' },
                    { name: 'kick', value: 'kick' },
                    { name: 'ban', value: 'ban' },
                    { name: 'timeout', value: 'timeout' },
                    { name: 'setreactionrole', value: 'setreactionrole' },
                    { name: 'setlevelupchannel', value: 'setlevelupchannel' },
                    { name: 'addshopitem', value: 'addshopitem' },
                    { name: 'setdailyreward', value: 'setdailyreward' },
                    { name: 'deleteshopitem', value: 'deleteshopitem' },
                    { name: 'setwelcome', value: 'setwelcome' },
                    { name: 'setexit', value: 'setexit' },
                ))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to give permission to')
                .setRequired(true)),
    async execute(interaction) {
        try {
            console.log(`setupcommandpermissions called by ${interaction.user.tag} (${interaction.user.id})`);
            console.log(`Guild owner ID: ${interaction.guild.ownerId}`);
            
            if (interaction.user.id !== interaction.guild.ownerId) {
                console.log('User is not the server owner. Permission denied.');
                return await interaction.reply({ content: 'Only the server owner can use this command.', ephemeral: true });
            }

            const command = interaction.options.getString('command');
            const role = interaction.options.getRole('role');

            console.log(`Setting up permissions for command: ${command}, role: ${role.name} (${role.id})`);

            const result = await CommandPermissions.findOneAndUpdate(
                { guildId: interaction.guild.id, commandName: command },
                { $addToSet: { roleIds: role.id } },
                { upsert: true, new: true }
            );

            console.log('Database update result:', result);

            await interaction.reply(`Role ${role.name} can now use the /${command} command in this server.`);
            console.log('Permission setup completed successfully.');
        } catch (error) {
            console.error('Error in setupcommandpermissions command:', error);

            if (error.code === 10062) {
                console.log('Interaction has already been acknowledged or timed out');
            } else {
                try {
                    await interaction.reply({ content: 'An error occurred while processing the command. Please try again later.', ephemeral: true });
                } catch (replyError) {
                    console.error('Error sending error response:', replyError);
                }
            }
        }
    },
};