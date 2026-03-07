"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var NewsSystemSettingsSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true, default: 'default' },
    config: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
    collection: 'news_system_settings',
});
exports.default = mongoose_1.default.model('NewsSystemSettings', NewsSystemSettingsSchema);
