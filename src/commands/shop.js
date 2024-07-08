const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ShopItem = require('../../models/ShopItem');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('View the server\'s shop'),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            // Filter items by the current server's ID
            const items = await ShopItem.find({ guildId: interaction.guild.id });
            console.log('Found items:', JSON.stringify(items, null, 2));

            if (items.length === 0) {
                return interaction.editReply('There are currently no items in this server\'s shop.');
            }

            const itemsPerPage = 10;
            const pages = Math.ceil(items.length / itemsPerPage);
            let currentPage = 0;

            const generateEmbed = (page) => {
                const startIndex = page * itemsPerPage;
                const endIndex = startIndex + itemsPerPage;
                const pageItems = items.slice(startIndex, endIndex);

                const embed = new EmbedBuilder()
                    .setTitle(`${interaction.guild.name}'s Shop`)
                    .setDescription('Here are the available items:')
                    .setColor('#0099ff')
                    .setFooter({ text: `Page ${page + 1} of ${pages}` });

                pageItems.forEach((item, index) => {
                    embed.addFields({
                        name: `${startIndex + index + 1}. ${item.name} - ${item.price} coins`,
                        value: item.description || 'No description available'
                    });
                });

                return embed;
            };

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev_page')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('next_page')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pages <= 1)
                );

            const initialMessage = await interaction.editReply({
                embeds: [generateEmbed(0)],
                components: [row]
            });

            const collector = initialMessage.createMessageComponentCollector({ time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id === interaction.user.id) {
                    if (i.customId === 'next_page') {
                        currentPage++;
                    } else if (i.customId === 'prev_page') {
                        currentPage--;
                    }

                    row.components[0].setDisabled(currentPage === 0);
                    row.components[1].setDisabled(currentPage === pages - 1);

                    await i.update({
                        embeds: [generateEmbed(currentPage)],
                        components: [row]
                    });
                }
            });

            collector.on('end', () => {
                row.components.forEach(button => button.setDisabled(true));
                initialMessage.edit({ components: [row] }).catch(console.error);
            });

        } catch (error) {
            console.error(`Error executing shop command:`, error);
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: 'There was an error while displaying the shop!', ephemeral: true }).catch(console.error);
            } else {
                await interaction.reply({ content: 'There was an error while displaying the shop!', ephemeral: true }).catch(console.error);
            }
        }
    },
};