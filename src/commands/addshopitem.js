const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ShopItem = require('../../models/ShopItem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addshopitem')
        .setDescription('Add a new item to the server\'s shop')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('The name of the item')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('price')
                .setDescription('The price of the item')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the item')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to assign when this item is purchased')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();
        const price = interaction.options.getInteger('price');
        const description = interaction.options.getString('description');
        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;

        try {
            // Check if an item with the same name already exists in this server
            const existingItem = await ShopItem.findOne({ name, guildId });
            if (existingItem) {
                return interaction.reply('An item with this name already exists in this server\'s shop. Please choose a different name.');
            }

            const newItem = new ShopItem({
                name,
                price,
                description,
                roleId: role ? role.id : null,
                guildId, // Add this line to include the server ID
            });

            await newItem.save();

            interaction.reply(`Successfully added ${name} to this server's shop for ${price} coins.${role ? ` It will assign the ${role.name} role when purchased.` : ''}`);
        } catch (error) {
            console.error('Error adding shop item:', error);
            interaction.reply('An error occurred while adding the item to the shop. Please try again later.');
        }
    },
};