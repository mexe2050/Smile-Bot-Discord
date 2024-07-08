const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    roleId: { type: String, required: false },
    guildId: { type: String, required: true }  // Add this line
});

// Create a compound index for name and guildId
shopItemSchema.index({ name: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('ShopItem', shopItemSchema);