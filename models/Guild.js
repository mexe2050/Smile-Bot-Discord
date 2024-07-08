const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: String,
    levelUpChannelId: String
});

module.exports = mongoose.model('Guild', guildSchema);