const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const ShopItem = require('../../models/ShopItem');
const CommandPermissions = require('../../models/CommandPermissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteshopitem')
        .setDescription('Delete an item from the shop'),
    async execute(interaction) {
        // Check if the user has permission to use this command
        const commandPermissions = await CommandPermissions.findOne({ commandName: 'deleteshopitem' });
        if (commandPermissions && commandPermissions.roleIds.length > 0) {
            const hasPermission = interaction.member.roles.cache.some(role => commandPermissions.roleIds.includes(role.id));
            if (!hasPermission) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }
        } else if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        await interaction.deferReply();

        const items = await ShopItem.find({});
        if (items.length === 0) {
            return interaction.editReply('There are no items in the shop to delete.');
        }

        const itemsPerPage = 5;
        const pages = Math.ceil(items.length / itemsPerPage);
        let currentPage = 0;

        const generateEmbed = (page) => {
            const startIndex = page * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            
            const pageItems = items.slice(startIndex, endIndex);

            const embed = new EmbedBuilder()
                .setTitle('Delete Shop Item')
                .setDescription('Select an item to delete:')
                .setColor('#FF0000')
                .setFooter({ text: `Page ${page + 1} of ${pages}` });

            pageItems.forEach((item, index) => {
                embed.addFields({ name: `${item.name}`, value: `Price: ${item.price} coins` });
            });

            return embed;
        };

        const generateButtons = (page) => {
            const startIndex = page * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const pageItems = items.slice(startIndex, endIndex);

            const buttons = pageItems.map((item, index) => 
                new ButtonBuilder()
                    .setCustomId(`delete_${item._id}`)
                    .setLabel(`Delete ${item.name}`)
                    .setStyle(ButtonStyle.Danger)
            );

            const row = new ActionRowBuilder().addComponents(buttons);

            const navigationRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === pages - 1)
            );

            return [row, navigationRow];
        };

        const message = await interaction.editReply({
            embeds: [generateEmbed(0)],
            components: generateButtons(0)
        });

        const collector = message.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
            }

            if (i.customId === 'prev_page') {
                currentPage--;
            } else if (i.customId === 'next_page') {
                currentPage++;
            } else if (i.customId.startsWith('delete_')) {
                const itemId = i.customId.split('_')[1];
                const deletedItem = await ShopItem.findByIdAndDelete(itemId);
                if (deletedItem) {
                    await i.update({ content: `The item "${deletedItem.name}" has been deleted from the shop.`, embeds: [], components: [] });
                } else {
                    await i.update({ content: 'Failed to delete the item. It may have already been removed.', embeds: [], components: [] });
                }
                return;
            }

            await i.update({
                embeds: [generateEmbed(currentPage)],
                components: generateButtons(currentPage)
            });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(console.error);
        });
    },
};