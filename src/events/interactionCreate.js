const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        try {
            if (interaction.isCommand()) {
                await handleCommand(interaction);
            } else if (interaction.isButton()) {
                await handleButton(interaction);
            } else if (interaction.isModalSubmit()) {
                await handleModalSubmit(interaction);
            }
        } catch (error) {
            await handleError(interaction, error);
        }
    },
};

async function handleCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return;

    const restrictedCommands = ['customembed', 'kick', 'ban', 'timeout', 'setreactionrole', 'setlevelupchannel', 'addshopitem', 'setdailyreward', 'deleteshopitem', 'setwelcome', 'setexit', 'setgiveaway'];

    if (restrictedCommands.includes(interaction.commandName)) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }
    }

    await command.execute(interaction);
    console.log(`Command ${interaction.commandName} executed successfully`);
}

async function handleButton(interaction) {
    // Implement button handling logic here
    console.log('Button interaction:', interaction.customId);
}

async function handleModalSubmit(interaction) {
    // Implement modal submit handling logic here
    console.log('Modal submit:', interaction.customId);
}

async function handleError(interaction, error) {
    console.error(`Error handling interaction:`, error);
    const errorMessage = process.env.NODE_ENV === 'development' 
        ? `Error: ${error.message}` 
        : 'There was an error while executing this command!';
    
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(console.error);
    } else {
        await interaction.reply({ content: errorMessage, ephemeral: true }).catch(console.error);
    }
}