const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('customembed')
        .setDescription('Creates a custom embed')
        .addStringOption(option => 
            option.setName('color')
                .setDescription('The color of the embed (hex code)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('title')
                .setDescription('The title of the embed')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('description')
                .setDescription('The description of the embed')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('image')
                .setDescription('The image URL for the embed')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('field1_name')
                .setDescription('The name of the first field')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('field1_value')
                .setDescription('The value of the first field')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('field2_name')
                .setDescription('The name of the second field')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('field2_value')
                .setDescription('The value of the second field')
                .setRequired(false)),
    async execute(interaction) {
        const color = /^#[0-9A-F]{6}$/i.test(interaction.options.getString('color')) 
            ? interaction.options.getString('color') 
            : '#0099ff';
        const title = interaction.options.getString('title') || 'Custom Embed';
        const description = interaction.options.getString('description') || 'No description provided';
        const image = interaction.options.getString('image');
        const field1_name = interaction.options.getString('field1_name');
        const field1_value = interaction.options.getString('field1_value');
        const field2_name = interaction.options.getString('field2_name');
        const field2_value = interaction.options.getString('field2_value');

        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();

        if (image) embed.setImage(image);
        if (field1_name && field1_value) embed.addFields({ name: field1_name, value: field1_value, inline: true });
        if (field2_name && field2_value) embed.addFields({ name: field2_name, value: field2_value, inline: true });

        await interaction.reply({ embeds: [embed] });
    },
};