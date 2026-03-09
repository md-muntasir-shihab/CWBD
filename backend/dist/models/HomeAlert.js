"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const HomeAlertSchema = new mongoose_1.Schema({
    title: { type: String, default: '' },
    message: { type: String, required: true, trim: true },
    link: { type: String, default: '' },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    requireAck: { type: Boolean, default: false },
    target: {
        type: { type: String, enum: ['all', 'groups', 'users'], default: 'all' },
        groupIds: { type: [String], default: [] },
        userIds: { type: [String], default: [] },
    },
    metrics: {
        impressions: { type: Number, default: 0 },
        acknowledgements: { type: Number, default: 0 },
    },
    startAt: { type: Date },
    endAt: { type: Date },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
HomeAlertSchema.index({ isActive: 1, status: 1, priority: -1 });
HomeAlertSchema.index({ status: 1, startAt: 1, endAt: 1, priority: -1 });
exports.default = mongoose_1.default.model('HomeAlert', HomeAlertSchema);
//# sourceMappingURL=HomeAlert.js.map