// models/ReactionRole.js
const mongoose = require('mongoose');

const reactionRoleSchema = new mongoose.Schema({
    guildId: String,
    channelId: String,
    group: String,
    emoji: String,
    roleId: String,
    requiredRoleId: String,
    messageId: String
});

module.exports = mongoose.model('ReactionRole', reactionRoleSchema);