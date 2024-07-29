const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const TicketConfig = require('../../models/TicketConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupticket')
        .setDescription('Sets up the ticket creation message')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the ticket creation message')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('title')
                .setDescription('The title of the embed')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('description')
                .setDescription('The description of the embed')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('button1_text')
                .setDescription('The text for the first button')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('button2_text')
                .setDescription('The text for the second button')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('button3_text')
                .setDescription('The text for the third button')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reply_message1')
                .setDescription('The reply message for the first button')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reply_message2')
                .setDescription('The reply message for the second button')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('reply_message3')
                .setDescription('The reply message for the third button')
                .setRequired(true))
                .addStringOption(option => 
                    option.setName('category_id')
                        .setDescription('The ID of the category for ticket rooms')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('support_role')
                        .setDescription('The support role for tickets')
                        .setRequired(true))
                .addStringOption(option => 
                    option.setName('color')
                        .setDescription('The color of the embed (hex code)')
                        .setRequired(false)),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || '#0099ff';
        const button1Text = interaction.options.getString('button1_text');
        const button2Text = interaction.options.getString('button2_text');
        const button3Text = interaction.options.getString('button3_text');
        const replyMessage1 = interaction.options.getString('reply_message1');
        const replyMessage2 = interaction.options.getString('reply_message2');
        const replyMessage3 = interaction.options.getString('reply_message3');
        const categoryId = interaction.options.getString('category_id');
        const supportRole = interaction.options.getRole('support_role');

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket_1')
                    .setLabel(button1Text)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('create_ticket_2')
                    .setLabel(button2Text)
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('create_ticket_3')
                    .setLabel(button3Text)
                    .setStyle(ButtonStyle.Primary)
            );

        await channel.send({ embeds: [embed], components: [row] });

        // Save configuration to database
        await TicketConfig.findOneAndUpdate(
            { guildId: interaction.guild.id },
            {
                guildId: interaction.guild.id,
                categoryId,
                supportRoleId: supportRole.id,
                button1Text,
                button2Text,
                button3Text,
                replyMessage1,
                replyMessage2,
                replyMessage3
            },
            { upsert: true, new: true }
        );

        await interaction.reply({ content: `Ticket creation message has been set up in ${channel}.`, ephemeral: true });
    },
};