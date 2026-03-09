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
const QuestionImportRowErrorSchema = new mongoose_1.Schema({
    rowNumber: { type: Number, required: true },
    reason: { type: String, required: true },
    payload: { type: mongoose_1.Schema.Types.Mixed, default: undefined },
}, { _id: false });
const QuestionImportJobSchema = new mongoose_1.Schema({
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    sourceFileName: { type: String, default: '' },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    totalRows: { type: Number, default: 0 },
    importedRows: { type: Number, default: 0 },
    skippedRows: { type: Number, default: 0 },
    failedRows: { type: Number, default: 0 },
    duplicateRows: { type: Number, default: 0 },
    rowErrors: { type: [QuestionImportRowErrorSchema], default: [] },
    options: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { timestamps: true, collection: 'question_import_jobs' });
QuestionImportJobSchema.index({ createdBy: 1, createdAt: -1 });
QuestionImportJobSchema.index({ status: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('QuestionImportJob', QuestionImportJobSchema);
//# sourceMappingURL=QuestionImportJob.js.map