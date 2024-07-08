// events/reactionHandler.js
const { Events } = require('discord.js');
const ReactionRole = require('../../models/ReactionRole');

module.exports = {
    name: Events.MessageReactionAdd,
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

        // Check for required role
        if (reactionRole.requiredRoleId && !member.roles.cache.has(reactionRole.requiredRoleId)) {
            await reaction.users.remove(user.id);
            return;
        }

        // Remove other reactions in the same group
        const groupReactions = await ReactionRole.find({
            guildId: message.guild.id,
            group: reactionRole.group,
            messageId: message.id
        });

        for (const groupReaction of groupReactions) {
            if (groupReaction.emoji !== emoji.name) {
                const oldReaction = message.reactions.cache.get(groupReaction.emoji);
                if (oldReaction) {
                    await oldReaction.users.remove(user.id);
                }
                if (member.roles.cache.has(groupReaction.roleId)) {
                    await member.roles.remove(groupReaction.roleId);
                }
            }
        }

        // Add the new role
        await member.roles.add(reactionRole.roleId);
        // In reactionHandler.js, update the required role check:

// Check for required role
if (reactionRole.requiredRoleId && !member.roles.cache.has(reactionRole.requiredRoleId)) {
    await reaction.users.remove(user.id);
    return;
}
    },
};