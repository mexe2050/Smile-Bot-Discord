const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('setgiveaway')
    .setDescription('Set up a giveaway')
    .addStringOption(option => 
        option.setName('prize')
            .setDescription('The prize for the giveaway')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('duration')
            .setDescription('Duration of the giveaway (e.g. 1h, 1d, 1w)')
            .setRequired(true))
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('The channel to start the giveaway in')
            .setRequired(true))
    .addRoleOption(option =>
        option.setName('role_reward')
            .setDescription('Role to be given as a reward (optional)'))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const prize = interaction.options.getString('prize');
        const duration = ms(interaction.options.getString('duration'));
        const binanceReward = interaction.options.getString('binance_reward');
        const roleReward = interaction.options.getRole('role_reward');
        const channel = interaction.options.getChannel('channel');

        if (!duration) {
            return interaction.reply({ content: 'Please provide a valid duration!', ephemeral: true });
        }

        const endTime = Date.now() + duration;

        const embed = new EmbedBuilder()
            .setTitle('🎉 Giveaway! 🎉')
            .setDescription(`Prize: ${prize}`)
            .addFields(
                { name: 'Ends At', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
                { name: 'Hosted By', value: `${interaction.user}`, inline: true }
            )
            .setColor('#FF0000');

        if (binanceReward) {
            embed.addFields({ name: 'Binance Reward', value: binanceReward, inline: true });
        }

        if (roleReward) {
            embed.addFields({ name: 'Role Reward', value: roleReward.toString(), inline: true });
        }

        const button = new ButtonBuilder()
            .setCustomId('enter_giveaway')
            .setLabel('Enter Giveaway')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        const message = await channel.send({ embeds: [embed], components: [row] });

        await interaction.reply({ content: `Giveaway started in ${channel}!`, ephemeral: true });

        // Set up a timeout to end the giveaway
        setTimeout(async () => {
            const fetchedMessage = await channel.messages.fetch(message.id);
            const entrants = await fetchedMessage.reactions.cache.get('🎉').users.fetch();
            const winner = entrants.random();

            if (winner) {
                channel.send(`Congratulations ${winner}! You won the giveaway for ${prize}!`);
                if (binanceReward) {
                    channel.send(`You also won ${binanceReward} in Binance rewards!`);
                }
                if (roleReward) {
                    try {
                        await winner.roles.add(roleReward);
                        channel.send(`You have been given the ${roleReward} role!`);
                    } catch (error) {
                        console.error('Failed to add role:', error);
                        channel.send('There was an error giving the role reward. Please contact an administrator.');
                    }
                }
            } else {
                channel.send('No one entered the giveaway.');
            }

            // Disable the button
            const disabledRow = new ActionRowBuilder().addComponents(
                button.setDisabled(true).setLabel('Giveaway Ended')
            );
            await fetchedMessage.edit({ components: [disabledRow] });
        }, duration);
    },
};