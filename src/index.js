const { Client, IntentsBitField, Partials, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const TicketConfig = require('../models/TicketConfig');

const clientId = process.env.CLIENT_ID;
const token = process.env.BOT_TOKEN;
const mongoURI = process.env.MONGODB_URI;

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildPresences,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

client.commands = new Map();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

const User = require('../models/User');

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    try {
        const xpToAdd = Math.floor(Math.random() * 10) + 15;
        let user = await User.findOneAndUpdate(
            { userId: message.author.id, guildId: message.guild.id },
            { $inc: { xp: xpToAdd } },
            { upsert: true, new: true }
        );

        const maxXP = 1000 + (user.level * 200);
        if (user.xp >= maxXP) {
            user.level += 1;
            user.xp = 0;
            
            const coinsToAdd = user.level * 100;
            user.balance += coinsToAdd;
            
            await user.save();
            message.channel.send(`Congratulations ${message.author}! You've reached level ${user.level} and earned ${coinsToAdd} coins!`);
        }
    } catch (error) {
        console.error('Error awarding XP:', error);
    }
});

const reactionHandler = require('./events/reactionHandler');
client.on(reactionHandler.name, (...args) => reactionHandler.execute(...args));

const reactionRemoveHandler = require('./events/reactionRemoveHandler');
client.on(reactionRemoveHandler.name, (...args) => reactionRemoveHandler.execute(...args));

async function createTicket(interaction) {
    const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
    if (!config) {
        await interaction.reply({ content: 'Ticket system is not configured for this server.', ephemeral: true });
        return;
    }

    const guild = interaction.guild;
    const member = interaction.member;

    const channel = await guild.channels.create({
        name: `ticket-${member.user.username}`,
        type: ChannelType.GuildText,
        parent: config.categoryId,
        permissionOverwrites: [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel],
            },
            {
                id: member.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
                id: config.supportRoleId,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
        ],
    });

    const ticketType = interaction.customId.split('_')[2];
    let ticketReason = '';
    let replyMessage = '';

    switch (ticketType) {
        case '1':
            ticketReason = config.button1Text;
            replyMessage = config.replyMessage1;
            break;
        case '2':
            ticketReason = config.button2Text;
            replyMessage = config.replyMessage2;
            break;
        case '3':
            ticketReason = config.button3Text;
            replyMessage = config.replyMessage3;
            break;
    }

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('New Ticket')
        .setDescription(`${replyMessage}\n\nReason: ${ticketReason}`);

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('close_ticket_reason')
                .setLabel('Close with Reason')
                .setStyle(ButtonStyle.Danger)
        );

    await channel.send({ content: `Welcome ${member}!`, embeds: [embed], components: [row] });
    await interaction.reply({ content: `Your ticket has been created in ${channel}`, ephemeral: true });
}

async function closeTicket(interaction) {
    await interaction.channel.delete();
    await interaction.reply({ content: 'The ticket has been closed and the channel deleted.', ephemeral: true });
}

async function showCloseReasonModal(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('close_ticket_modal')
        .setTitle('Close Ticket');

    const reasonInput = new TextInputBuilder()
        .setCustomId('close_reason')
        .setLabel("Reason for closing the ticket")
        .setStyle(TextInputStyle.Paragraph);

    const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
}

async function closeTicketWithReason(interaction) {
    const reason = interaction.fields.getTextInputValue('close_reason');
    const config = await TicketConfig.findOne({ guildId: interaction.guild.id });
    
    const supportRole = interaction.guild.roles.cache.get(config.supportRoleId);
    supportRole.members.forEach(async (member) => {
        try {
            await member.send(`Ticket closed by ${interaction.user.tag}. Reason: ${reason}`);
        } catch (error) {
            console.error(`Failed to send DM to ${member.user.tag}:`, error);
        }
    });

    await interaction.channel.delete();
    await interaction.reply({ content: `The ticket has been closed. Reason: ${reason}`, ephemeral: true });
}

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            // Check if the user has permission to use the command
            const member = interaction.member;
            if (!member.permissions.has(PermissionFlagsBits.Administrator) && 
                !member.roles.cache.some(role => role.permissions.has(PermissionFlagsBits.ManageGuild))) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }

            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const errorMessage = 'There was an error while executing this command!';
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: errorMessage, ephemeral: true }).catch(console.error);
            } else {
                await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(console.error);
            }
        }
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('create_ticket_')) {
            await createTicket(interaction);
        } else if (interaction.customId === 'close_ticket') {
            await closeTicket(interaction);
        } else if (interaction.customId === 'close_ticket_reason') {
            await showCloseReasonModal(interaction);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'close_ticket_modal') {
            await closeTicketWithReason(interaction);
        }
    }

    if (interaction.isButton() && interaction.customId === 'enter_giveaway') {
        await interaction.deferUpdate();
        await interaction.message.react('🎉');
        await interaction.followUp({ content: 'You have entered the giveaway!', ephemeral: true });
    }
});

client.login(process.env.BOT_TOKEN);