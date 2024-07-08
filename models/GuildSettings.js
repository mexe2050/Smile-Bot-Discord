const mongoose = require('mongoose');

const guildSettingsSchema = new mongoose.Schema({
    guildId: String,
    levelUpReward: { type: Number, default: 1000 },
    dailyReward: { type: Number, default: 100 },
    dailyChannelId: String
});

module.exports = mongoose.model('GuildSettings', guildSettingsSchema);