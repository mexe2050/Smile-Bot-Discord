const mongoose = require('mongoose');

const welcomeExitSchema = new mongoose.Schema({
    guildId: String,
    welcomeChannelId: String,
    exitChannelId: String,
    welcomeMessage: String,
    exitMessage: String
});

module.exports = mongoose.model('WelcomeExit', welcomeExitSchema);