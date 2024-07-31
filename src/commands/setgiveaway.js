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
        .addStringOption(option =>
            option.setName('binance_reward')
                .setDescription('Binance reward for the giveaway (optional)'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const prize = interaction.options.getString('prize');
            const durationString = interaction.options.getString('duration');
            const duration = ms(durationString);
            const channel = interaction.options.getChannel('channel');
            const roleReward = interaction.options.getRole('role_reward');
            const binanceReward = interaction.options.getString('binance_reward');

            if (!duration || isNaN(duration)) {
                return await interaction.editReply({ content: 'Please provide a valid duration!', ephemeral: true });
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

            if (roleReward) {
                embed.addFields({ name: 'Role Reward', value: roleReward.toString(), inline: true });
            }

            if (binanceReward) {
                embed.addFields({ name: 'Binance Reward', value: binanceReward, inline: true });
            }

            const button = new ButtonBuilder()
                .setCustomId('enter_giveaway')
                .setLabel('Enter Giveaway')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            const message = await channel.send({ embeds: [embed], components: [row] });

            await interaction.editReply({ content: `Giveaway started in ${channel}!`, ephemeral: true });

            // Schedule giveaway end
            setTimeout(async () => {
                try {
                    const fetchedMessage = await channel.messages.fetch(message.id);
                    const reaction = fetchedMessage.reactions.cache.get('🎉');
                    
                    if (!reaction) {
                        return channel.send('No one entered the giveaway.');
                    }

                    const users = await reaction.users.fetch();
                    const validUsers = users.filter(user => !user.bot);

                    const endEmbed = new EmbedBuilder()
                        .setTitle('🎉 Giveaway Ended! 🎉')
                        .setDescription(`Prize: ${prize}`)
                        .addFields(
                            { name: 'Ended', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                            { name: 'Hosted By', value: `${interaction.user}`, inline: true }
                        )
                        .setColor('#00FF00');

                    if (roleReward) {
                        endEmbed.addFields({ name: 'Role Reward', value: roleReward.toString(), inline: true });
                    }

                    if (binanceReward) {
                        endEmbed.addFields({ name: 'Binance Reward', value: binanceReward, inline: true });
                    }

                    if (validUsers.size > 0) {
                        const winners = validUsers.random();
                        endEmbed.addFields({ name: 'Winner', value: winners.toString() });

                        await fetchedMessage.edit({ embeds: [endEmbed], components: [] });

                        channel.send(`Congratulations ${winners}! You won the giveaway for ${prize}!`);
                        if (roleReward) {
                            try {
                                await winners.roles.add(roleReward);
                                channel.send(`You have been given the ${roleReward} role!`);
                            } catch (error) {
                                console.error('Failed to add role:', error);
                                channel.send('There was an error giving the role reward. Please contact an administrator.');
                            }
                        }
                        if (binanceReward) {
                            channel.send(`You also won ${binanceReward} in Binance rewards!`);
                        }

                        // Add a 20-second delay before doing anything else
                        setTimeout(() => {
                            // Any additional actions you want to perform after 20 seconds
                            channel.send('The giveaway has concluded. Thank you all for participating!');
                        }, 20000); // 20000 milliseconds = 20 seconds
                    } else {
                        endEmbed.addFields({ name: 'Winner', value: 'No winner' });
                        await fetchedMessage.edit({ embeds: [endEmbed], components: [] });
                        channel.send('No one entered the giveaway.');
                    }
                } catch (error) {
                    console.error('Error ending giveaway:', error);
                    channel.send('There was an error ending the giveaway. Please contact an administrator.');
                }
            }, duration);

        } catch (error) {
            console.error('Error in setgiveaway command:', error);
            await interaction.editReply({ content: 'There was an error while setting up the giveaway.', ephemeral: true }).catch(console.error);
        }
    },
};