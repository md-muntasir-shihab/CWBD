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
const ImportExportLogSchema = new mongoose_1.Schema({
    direction: { type: String, enum: ['import', 'export'], required: true },
    category: {
        type: String,
        enum: [
            'students', 'guardians', 'phone_list', 'email_list',
            'audience_segment', 'result_recipients', 'failed_deliveries',
            'manual_send_list', 'notification_logs', 'other',
        ],
        required: true,
    },
    format: {
        type: String,
        enum: ['xlsx', 'csv', 'txt', 'json', 'vcf', 'clipboard'],
        required: true,
    },
    performedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    totalRows: { type: Number, default: 0 },
    successRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    filters: { type: mongoose_1.Schema.Types.Mixed },
    selectedFields: [{ type: String }],
    fileName: { type: String, trim: true },
    notes: { type: String, trim: true },
}, { timestamps: true });
ImportExportLogSchema.index({ direction: 1, category: 1, createdAt: -1 });
ImportExportLogSchema.index({ performedBy: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('ImportExportLog', ImportExportLogSchema);
//# sourceMappingURL=ImportExportLog.js.map