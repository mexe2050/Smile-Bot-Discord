const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    balance: { type: Number, default: 0 },
    inventory: [{ 
        item: String, 
        quantity: Number 
    }],
    lastDaily: { type: Date, default: null }
});

module.exports = mongoose.model('User', userSchema);