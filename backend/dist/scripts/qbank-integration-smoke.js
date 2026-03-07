"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const questionBank_1 = require("../utils/questionBank");
function mapRow(row, mapping) {
    const out = {};
    for (const [target, source] of Object.entries(mapping)) {
        out[target] = row[source];
    }
    return out;
}
function runImportMappingIntegration() {
    const rawRows = [
        {
            প্রশ্ন: 'বাংলা সাহিত্যের প্রথম নারী কবি কে?',
            বিষয়: 'বাংলা',
            অধ্যায়: 'সাহিত্য',
            অপশন_A: 'চন্দ্রাবতী',
            অপশন_B: 'বেগম রোকেয়া',
            অপশন_C: 'কামিনী রায়',
            সঠিক_উত্তর: 'A',
        },
    ];
    const mapping = {
        question_text: 'প্রশ্ন',
        subject: 'বিষয়',
        chapter: 'অধ্যায়',
        optionA: 'অপশন_A',
        optionB: 'অপশন_B',
        optionC: 'অপশন_C',
        correctAnswer: 'সঠিক_উত্তর',
    };
    const mapped = rawRows.map((row) => mapRow(row, mapping));
    const normalized = (0, questionBank_1.normalizeQuestionPayload)(mapped[0], 'pending_review');
    assert_1.default.equal(normalized.errors.length, 0, 'Mapped payload should be valid');
    assert_1.default.equal(normalized.normalized.subject, 'বাংলা');
    assert_1.default.equal(normalized.normalized.correct_answer[0], 'A');
}
function runPickerCompatibilityIntegration() {
    const candidate = (0, questionBank_1.normalizeQuestionPayload)({
        question_text: 'বাংলাদেশের জাতীয় কবি কে?',
        subject: 'বাংলা',
        optionA: 'কাজী নজরুল ইসলাম',
        optionB: 'রবীন্দ্রনাথ ঠাকুর',
        correctAnswer: 'A',
    }, 'approved').normalized;
    const matches = (0, questionBank_1.detectSimilarQuestions)({ question: candidate.question, options: candidate.options }, [
        {
            _id: '65f1a50bd4f5f735d393d100',
            question: 'বাংলাদেশের জাতীয় কবি কে',
            optionA: 'কাজী নজরুল ইসলাম',
            optionB: 'রবীন্দ্রনাথ ঠাকুর',
        },
    ], 0.7);
    assert_1.default.ok(matches.length > 0, 'Picker candidate should detect similarity');
}
function run() {
    runImportMappingIntegration();
    runPickerCompatibilityIntegration();
    console.log('[qbank-integration-smoke] all checks passed');
}
run();
//# sourceMappingURL=qbank-integration-smoke.js.map