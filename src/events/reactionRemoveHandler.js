// events/reactionRemoveHandler.js
const { Events } = require('discord.js');
const ReactionRole = require('../../models/ReactionRole');

module.exports = {
    name: Events.MessageReactionRemove,
    async execute(reaction, user) {
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }

        if (user.bot) return;

        const { message, emoji } = reaction;
        const reactionRole = await ReactionRole.findOne({
            guildId: message.guild.id,
            messageId: message.id,
            emoji: emoji.name
        });

        if (!reactionRole) return;

        const member = await message.guild.members.fetch(user.id);

        // Remove the role when the reaction is removed
        if (member.roles.cache.has(reactionRole.roleId)) {
            await member.roles.remove(reactionRole.roleId);
        }
    },
};