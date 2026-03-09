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
const ExamEventSchema = new mongoose_1.Schema({
    attempt: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ExamSession', required: true },
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    exam: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Exam', required: true },
    eventType: {
        type: String,
        enum: ['save', 'tab_switch', 'fullscreen_exit', 'copy_attempt', 'submit', 'error', 'resume', 'warn_sent', 'admin_action', 'message_sent'],
        required: true
    },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' }
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'exam_audit_events' });
ExamEventSchema.index({ attempt: 1, createdAt: -1 });
ExamEventSchema.index({ exam: 1, eventType: 1 });
ExamEventSchema.index({ exam: 1, attempt: 1, createdAt: -1 });
exports.default = mongoose_1.default.model('ExamEvent', ExamEventSchema);
//# sourceMappingURL=ExamEvent.js.map