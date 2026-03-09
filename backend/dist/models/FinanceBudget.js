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
const FinanceBudgetSchema = new mongoose_1.Schema({
    month: { type: String, required: true, trim: true, index: true }, // e.g. "2025-03"
    accountCode: { type: String, required: true, trim: true, uppercase: true },
    categoryLabel: { type: String, required: true, trim: true },
    amountLimit: { type: Number, required: true, min: 0 },
    alertThresholdPercent: { type: Number, default: 80, min: 0, max: 100 },
    direction: { type: String, enum: ['income', 'expense'], default: 'expense' },
    costCenterId: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    createdByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, collection: 'finance_budgets' });
FinanceBudgetSchema.index({ month: 1, accountCode: 1 }, { unique: true });
FinanceBudgetSchema.index({ month: 1, direction: 1 });
exports.default = mongoose_1.default.model('FinanceBudget', FinanceBudgetSchema);
//# sourceMappingURL=FinanceBudget.js.map