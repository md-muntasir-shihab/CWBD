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
const SetRulesSchema = new mongoose_1.Schema({
    subject: { type: String, default: '' },
    moduleCategory: { type: String, default: '' },
    topics: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    difficultyMix: {
        type: new mongoose_1.Schema({
            easy: { type: Number, default: 0 },
            medium: { type: Number, default: 0 },
            hard: { type: Number, default: 0 },
        }, { _id: false }),
        default: { easy: 0, medium: 0, hard: 0 },
    },
    totalQuestions: { type: Number, default: 0 },
    defaultMarks: { type: Number, default: 1 },
    defaultNegativeMarks: { type: Number, default: 0 },
}, { _id: false });
const QuestionBankSetSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    mode: { type: String, enum: ['manual', 'rule_based'], required: true },
    rules: { type: SetRulesSchema, default: {} },
    selectedBankQuestionIds: { type: [String], default: [] },
    createdByAdminId: { type: String, required: true },
}, {
    timestamps: true,
    collection: 'question_bank_sets',
});
QuestionBankSetSchema.index({ createdByAdminId: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('QuestionBankSet', QuestionBankSetSchema);
//# sourceMappingURL=QuestionBankSet.js.map