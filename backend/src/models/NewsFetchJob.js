"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var NewsFetchJobSchema = new mongoose_1.Schema({
    sourceIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'NewsSource' }],
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending' },
    startedAt: { type: Date },
    endedAt: { type: Date },
    fetchedCount: { type: Number, default: 0 },
    createdCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    jobErrors: [
        {
            sourceId: { type: String, default: '' },
            message: { type: String, required: true },
        },
    ],
    trigger: { type: String, enum: ['manual', 'scheduled', 'test'], default: 'manual' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
    collection: 'news_fetch_jobs',
});
NewsFetchJobSchema.index({ createdAt: -1, status: 1 });
exports.default = mongoose_1.default.model('NewsFetchJob', NewsFetchJobSchema);
