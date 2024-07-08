const mongoose = require('mongoose');

const commandPermissionsSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    commandName: { type: String, required: true },
    roleIds: [{ type: String }]
});

commandPermissionsSchema.index({ guildId: 1, commandName: 1 }, { unique: true });

module.exports = mongoose.model('CommandPermissions', commandPermissionsSchema);