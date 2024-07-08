const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../../models/User');
const ShopItem = require('../../models/ShopItem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('buy')
        .setDescription('Buy an item from the shop')
        .addStringOption(option =>
            option.setName('item')
                .setDescription('The item to buy')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('quantity')
                .setDescription('The quantity to buy')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        const itemName = interaction.options.getString('item').toLowerCase();
        const quantity = interaction.options.getInteger('quantity') || 1;

        if (quantity <= 0) {
            return interaction.editReply('Please enter a valid quantity greater than 0.');
        }

        try {
            const item = await ShopItem.findOne({ name: itemName });

            if (!item) {
                const availableItems = await ShopItem.find().select('name -_id');
                const itemList = availableItems.map(i => i.name).join(', ');
                return interaction.editReply(`That item doesn't exist in the shop. Available items are: ${itemList}`);
            }

            const totalCost = item.price * quantity;

            const user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });

            if (!user) {
                return interaction.editReply('You don\'t have an account yet. Start chatting to create one!');
            }

            if (user.balance < totalCost) {
                return interaction.editReply(`You don't have enough coins to buy this item. You need ${totalCost} coins, but you only have ${user.balance} coins.`);
            }

            // Update the user's balance and inventory
            user.balance -= totalCost;
            const inventoryItem = user.inventory.find(i => i.item === itemName);
            if (inventoryItem) {
                inventoryItem.quantity += quantity;
            } else {
                user.inventory.push({ item: itemName, quantity: quantity });
            }
            await user.save();

            // Assign role if the item has an associated role
            if (item.roleId) {
                const role = interaction.guild.roles.cache.get(item.roleId);
                if (role) {
                    try {
                        await interaction.member.roles.add(role);
                    } catch (error) {
                        console.error('Failed to assign role:', error);
                        await interaction.followUp('The item was purchased, but there was an error assigning the role. Please contact an administrator.');
                    }
                } else {
                    await interaction.followUp('The associated role for this item could not be found. Please contact an administrator.');
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Purchase Successful!')
                .setDescription(`You bought ${quantity} ${item.name}(s) for ${totalCost} coins.`)
                .addFields(
                    { name: 'Item', value: item.name, inline: true },
                    { name: 'Quantity', value: quantity.toString(), inline: true },
                    { name: 'Total Cost', value: totalCost.toString(), inline: true },
                    { name: 'New Balance', value: user.balance.toString(), inline: true }
                )
                .setTimestamp();

            if (item.roleId) {
                embed.addFields({ name: 'Role', value: 'A new role has been assigned to you!', inline: true });
            }

            interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error processing purchase:', error);
            interaction.editReply('An error occurred while processing your purchase. Please try again later.');
        }
    },
};