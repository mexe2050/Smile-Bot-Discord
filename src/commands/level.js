const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const User = require('../../models/User');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Shows the level and balance of a user')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to check (optional)')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('user') || interaction.user;
        let user = await User.findOne({ userId: targetUser.id, guildId: interaction.guild.id });

        if (!user) {
            user = new User({
                userId: targetUser.id,
                guildId: interaction.guild.id,
                xp: 0,
                level: 0,
                balance: 0
            });
            await user.save();
        }

        const maxXP = 1000 + (user.level * 200);

        try {
            const canvas = createCanvas(700, 250);
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = '#23272A';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // User info
            ctx.font = '28px sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`${targetUser.username}`, 250, 50);

            ctx.font = '24px sans-serif';
            ctx.fillText(`Level: ${user.level}`, 250, 100);
            ctx.fillText(`XP: ${user.xp} / ${maxXP}`, 250, 150);
            ctx.fillText(`Balance: ${user.balance} coins`, 250, 200);

            // XP Bar
            ctx.fillStyle = '#484B4E';
            ctx.fillRect(250, 220, 400, 20);
            ctx.fillStyle = '#7289DA';
            ctx.fillRect(250, 220, (user.xp / maxXP) * 400, 20);

            // Avatar
            const avatar = await loadImage(targetUser.displayAvatarURL({ extension: 'png', size: 128 }));
            ctx.drawImage(avatar, 50, 50, 150, 150);

            const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rank.png' });
            await interaction.editReply({ files: [attachment] });
        } catch (err) {
            console.error('Error generating rank card:', err);
            await interaction.editReply({ content: `An error occurred while generating the rank card: ${err.message}`, ephemeral: true });
        }
    },
};
