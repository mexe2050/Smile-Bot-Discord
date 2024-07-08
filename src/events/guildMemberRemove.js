const WelcomeExit = require('../../models/WelcomeExit');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        const welcomeExit = await WelcomeExit.findOne({ guildId: member.guild.id });
        if (!welcomeExit || !welcomeExit.exitChannelId || !welcomeExit.exitMessage) return;

        const channel = member.guild.channels.cache.get(welcomeExit.exitChannelId);
        if (!channel) return;

        const message = welcomeExit.exitMessage.replace('{user}', member.user.toString());
        channel.send(message);
    },
};