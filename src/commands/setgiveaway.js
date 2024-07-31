const { Client, GatewayIntentBits, Collection, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions] });

client.commands = new Collection();

const giveawayCommand = {
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
        await interaction.deferReply({ ephemeral: true });

        try {
            const prize = interaction.options.getString('prize');
            const duration = ms(interaction.options.getString('duration'));
            const channel = interaction.options.getChannel('channel');
            const roleReward = interaction.options.getRole('role_reward');

            if (!duration) {
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

            const button = new ButtonBuilder()
                .setCustomId('enter_giveaway')
                .setLabel('Enter Giveaway')
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder().addComponents(button);

            const message = await channel.send({ embeds: [embed], components: [row] });

            await interaction.editReply({ content: `Giveaway started in ${channel}!`, ephemeral: true });

            // Set up a timeout to end the giveaway
            setTimeout(async () => {
                const fetchedMessage = await channel.messages.fetch(message.id);
                const entrants = await fetchedMessage.reactions.cache.get('🎉').users.fetch();
                const winner = entrants.random();

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

                if (winner) {
                    endEmbed.addFields({ name: 'Winner', value: winner.toString(), inline: true });
                    await channel.send(`Congratulations ${winner}! You won the giveaway for ${prize}!`);
                    if (roleReward) {
                        try {
                            await winner.roles.add(roleReward);
                            await channel.send(`You have been given the ${roleReward} role!`);
                        } catch (error) {
                            console.error('Failed to add role:', error);
                            await channel.send('There was an error giving the role reward. Please contact an administrator.');
                        }
                    }
                } else {
                    endEmbed.addFields({ name: 'Winner', value: 'No one entered the giveaway', inline: true });
                    await channel.send('No one entered the giveaway.');
                }

                // Disable the button and update the embed
                const disabledRow = new ActionRowBuilder().addComponents(
                    button.setDisabled(true).setLabel('Giveaway Ended')
                );
                await fetchedMessage.edit({ embeds: [endEmbed], components: [disabledRow] });
            }, duration);
        } catch (error) {
            console.error('Error in setgiveaway command:', error);
            await interaction.editReply({ content: 'There was an error while setting up the giveaway.', ephemeral: true });
        }
    },
};

client.commands.set(giveawayCommand.data.name, giveawayCommand);

client.once('ready', () => {
    console.log('Bot is ready!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);