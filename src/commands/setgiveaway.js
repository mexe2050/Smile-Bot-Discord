const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const User = require('../../models/User');

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
        .addIntegerOption(option =>
            option.setName('coin_reward')
                .setDescription('Coin reward for the giveaway (optional)'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const prize = interaction.options.getString('prize');
            const durationString = interaction.options.getString('duration');
            const channel = interaction.options.getChannel('channel');
            const roleReward = interaction.options.getRole('role_reward');
            const coinReward = interaction.options.getInteger('coin_reward');

            const duration = ms(durationString);
            if (!duration || isNaN(duration)) {
                return await interaction.editReply('Please provide a valid duration!');
            }

            const endTime = Date.now() + duration;

            const embed = new EmbedBuilder()
                .setTitle('🎉 Giveaway! 🎉')
                .setDescription(`Prize: ${prize}`)
                .addFields(
                    { name: 'Ends At', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
                    { name: 'Hosted By', value: interaction.user.toString(), inline: true }
                )
                .setColor('#FF0000');

            if (roleReward) embed.addFields({ name: 'Role Reward', value: roleReward.toString(), inline: true });
            if (coinReward) embed.addFields({ name: 'Coin Reward', value: coinReward.toString(), inline: true });

            const message = await channel.send({ embeds: [embed] });
            await message.react('🎉');

            await interaction.editReply(`Giveaway started in ${channel}!`);

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

                    if (validUsers.size > 0) {
                        const winner = validUsers.random();

                        const endEmbed = new EmbedBuilder()
                            .setTitle('🎉 Giveaway Ended! 🎉')
                            .setDescription(`Prize: ${prize}`)
                            .addFields(
                                { name: 'Winner', value: winner.toString() },
                                { name: 'Ended', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                                { name: 'Hosted By', value: interaction.user.toString(), inline: true }
                            )
                            .setColor('#00FF00');

                        if (roleReward) endEmbed.addFields({ name: 'Role Reward', value: roleReward.toString(), inline: true });
                        if (coinReward) endEmbed.addFields({ name: 'Coin Reward', value: coinReward.toString(), inline: true });

                        await fetchedMessage.edit({ embeds: [endEmbed] });
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
                        
                        if (coinReward) {
                            try {
                                await User.findOneAndUpdate(
                                    { userId: winner.id, guildId: interaction.guild.id },
                                    { $inc: { balance: coinReward } },
                                    { upsert: true, new: true }
                                );
                                await channel.send(`${winner} has been awarded ${coinReward} coins!`);
                            } catch (error) {
                                console.error('Failed to add coins:', error);
                                await channel.send('There was an error giving the coin reward. Please contact an administrator.');
                            }
                        }

                        setTimeout(() => {
                            channel.send('The giveaway has concluded. Thank you all for participating!');
                        }, 20000);
                    } else {
                        await channel.send('No valid entries for the giveaway.');
                    }
                } catch (error) {
                    console.error('Error ending giveaway:', error);
                    await channel.send('There was an error ending the giveaway. Please contact an administrator.');
                }
            }, duration);

        } catch (error) {
            console.error('Error in setgiveaway command:', error);
            await interaction.editReply('There was an error setting up the giveaway.');
        }
    },
};
