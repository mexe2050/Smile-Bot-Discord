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
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const prize = interaction.options.getString('prize');
            const durationString = interaction.options.getString('duration');
            const channel = interaction.options.getChannel('channel');
            const roleReward = interaction.options.getRole('role_reward');
            const binanceReward = interaction.options.getString('binance_reward');
            console.log('Binance Reward:', binanceReward);

            const duration = ms(durationString);
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
                embed.addFields({ name: '🪙 Binance Reward 🪙', value: binanceReward, inline: false });
            }

            const button = new ButtonBuilder()
                .setCustomId('enter_giveaway')
                .setLabel('Enter Giveaway')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            const message = await channel.send({ embeds: [embed], components: [row] });

            await interaction.editReply({ content: `Giveaway started in ${channel}!`, ephemeral: true });

            const collector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: duration });

            const participants = new Set();

            collector.on('collect', async (i) => {
                if (i.customId === 'enter_giveaway') {
                    await i.deferUpdate();
                    participants.add(i.user.id);
                    await i.followUp({ content: 'You have entered the giveaway!', ephemeral: true });
                }
            });

            // Schedule giveaway end
            setTimeout(async () => {
                try {
                    const fetchedMessage = await channel.messages.fetch(message.id);
                    
                    if (participants.size === 0) {
                        await channel.send('No one entered the giveaway.');
                        return;
                    }

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
                        endEmbed.addFields({ name: '🪙 Binance Reward 🪙', value: binanceReward, inline: false });
                    }

                    if (participants.size > 0) {
                        const winnerId = Array.from(participants)[Math.floor(Math.random() * participants.size)];
                        const winner = await interaction.client.users.fetch(winnerId);
                        endEmbed.addFields({ name: 'Winner', value: winner.toString() });

                        await fetchedMessage.edit({ embeds: [endEmbed], components: [] });

                        await channel.send(`Congratulations ${winner}! You won the giveaway for ${prize}!`);
                        
                        if (roleReward) {
                            try {
                                const member = await interaction.guild.members.fetch(winner.id);
                                await member.roles.add(roleReward);
                                await channel.send(`${winner} has been given the ${roleReward} role!`);
                            } catch (error) {
                                console.error('Failed to add role:', error);
                                await channel.send('There was an error giving the role reward. Please contact an administrator.');
                            }
                        }
                        
                        if (binanceReward) {
                            await channel.send(`🎊 ${winner} also won ${binanceReward} in Binance rewards! 🎊`);
                        }

                        // Add a 20-second delay before sending the final message
                        setTimeout(() => {
                            channel.send('The giveaway has concluded. Thank you all for participating!');
                        }, 20000);
                    } else {
                        endEmbed.addFields({ name: 'Winner', value: 'No winner' });
                        await fetchedMessage.edit({ embeds: [endEmbed], components: [] });
                        await channel.send('No one entered the giveaway.');
                    }
                } catch (error) {
                    console.error('Error ending giveaway:', error);
                    await channel.send('There was an error ending the giveaway. Please contact an administrator.');
                }
            }, duration);

        } catch (error) {
            console.error('Error in setgiveaway command:', error);
            const errorMessage = 'There was an error while setting up the giveaway.';
            if (interaction.deferred) {
                await interaction.editReply({ content: errorMessage, ephemeral: true }).catch(console.error);
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true }).catch(console.error);
            }
        }
    },
};
