const mongoose = require('mongoose');

const ticketConfigSchema = new mongoose.Schema({
    guildId: String,
    categoryId: String,
    supportRoleId: String,
    button1Text: String,
    button2Text: String,
    button3Text: String,
    replyMessage1: String,
    replyMessage2: String,
    replyMessage3: String
});

module.exports = mongoose.model('TicketConfig', ticketConfigSchema);