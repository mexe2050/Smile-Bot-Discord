// events/guildMemberAdd.js
const WelcomeExit = require('../../models/WelcomeExit');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        const welcomeExit = await WelcomeExit.findOne({ guildId: member.guild.id });
        if (!welcomeExit || !welcomeExit.welcomeChannelId || !welcomeExit.welcomeMessage) return;

        const channel = member.guild.channels.cache.get(welcomeExit.welcomeChannelId);
        if (!channel) return;

        const message = welcomeExit.welcomeMessage.replace('{user}', member.user.toString());
        channel.send(message);
    },
};