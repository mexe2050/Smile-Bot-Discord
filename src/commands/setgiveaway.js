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
            // Immediately acknowledge the interaction
            await interaction.deferReply({ ephemeral: true });

            const prize = interaction.options.getString('prize');
            const durationString = interaction.options.getString('duration');
            const channel = interaction.options.getChannel('channel');
            const roleReward = interaction.options.getRole('role_reward');
            const binanceReward = interaction.options.getString('binance_reward');

            const duration = ms(durationString);
            if (!duration || isNaN(duration)) {
                return await interaction.editReply('Please provide a valid duration!');
            }

            if (!channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.SendMessages)) {
                return await interaction.editReply('I don\'t have permission to send messages in that channel.');
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

            await interaction.editReply(`Giveaway started in ${channel}!`);

            // Schedule giveaway end
            setTimeout(async () => {
                try {
                    const fetchedMessage = await channel.messages.fetch(message.id);
                    const reaction = fetchedMessage.reactions.cache.get('🎉');
                    
                    if (!reaction || reaction.count <= 1) {
                        await channel.send('No one entered the giveaway.');
                        return;
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
                        const winner = validUsers.random();
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
                            await channel.send(`${winner} also won ${binanceReward} in Binance rewards!`);
                        }
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
            if (interaction.deferred) {
                await interaction.editReply({ content: 'There was an error while setting up the giveaway. Please try again.' }).catch(console.error);
            } else {
                await interaction.reply({ content: 'There was an error while setting up the giveaway. Please try again.', ephemeral: true }).catch(console.error);
            }
        }
    },
};