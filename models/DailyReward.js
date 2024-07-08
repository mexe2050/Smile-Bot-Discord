const mongoose = require('mongoose');

const dailyRewardSchema = new mongoose.Schema({
    channelId: { type: String, required: true, unique: true },
    amount: { type: Number, required: true }
});

module.exports = mongoose.model('DailyReward', dailyRewardSchema);