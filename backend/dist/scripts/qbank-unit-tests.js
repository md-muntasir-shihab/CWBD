"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const questionBank_1 = require("../utils/questionBank");
function runNormalizePayloadTest() {
    const result = (0, questionBank_1.normalizeQuestionPayload)({
        question_text: 'বাংলা ভাষার প্রথম ব্যাকরণ গ্রন্থ কোনটি?',
        subject: 'বাংলা',
        chapter: 'ব্যাকরণ',
        optionA: 'শব্দতত্ত্ব',
        optionB: 'ভাষাতত্ত্ব',
        optionC: 'ব্যাকরণ কৌমুদী',
        optionD: 'বাংলা ব্যাকরণ',
        correctAnswer: 'C',
        tags: 'ব্যাকরণ, প্রাথমিক',
        estimated_time: 70,
    }, 'pending_review');
    assert_1.default.equal(result.errors.length, 0, 'Payload should be valid');
    assert_1.default.equal(result.normalized.question, 'বাংলা ভাষার প্রথম ব্যাকরণ গ্রন্থ কোনটি?');
    assert_1.default.equal(result.normalized.correct_answer[0], 'C');
    assert_1.default.equal(result.normalized.tags.length, 2);
    assert_1.default.equal(result.normalized.status, 'pending_review');
}
function runDuplicateDetectionTest() {
    const matches = (0, questionBank_1.detectSimilarQuestions)({
        question: 'বাংলা ব্যাকরণের জনক কে?',
        options: [
            { key: 'A', text: 'ঈশ্বরচন্দ্র বিদ্যাসাগর' },
            { key: 'B', text: 'ড. মুহম্মদ শহীদুল্লাহ' },
        ],
    }, [
        {
            _id: '65f1a50bd4f5f735d393d001',
            question: 'বাংলা ব্যাকরণের জনক কে',
            optionA: 'ঈশ্বরচন্দ্র বিদ্যাসাগর',
            optionB: 'ড. মুহম্মদ শহীদুল্লাহ',
        },
        {
            _id: '65f1a50bd4f5f735d393d002',
            question: 'বাংলাদেশের রাজধানী কী?',
            optionA: 'ঢাকা',
            optionB: 'চট্টগ্রাম',
        },
    ], 0.8);
    assert_1.default.ok(matches.length >= 1, 'Should detect at least one similar question');
    assert_1.default.ok(matches[0].score >= 0.8, 'Top score should respect threshold');
}
function runQualityScoreTest() {
    const normalized = (0, questionBank_1.normalizeQuestionPayload)({
        question_text: 'পদার্থের তিনটি অবস্থা কী কী?',
        subject: 'পদার্থবিজ্ঞান',
        chapter: 'পদার্থ',
        class_level: 'SSC',
        optionA: 'ঠোস, তরল, গ্যাস',
        optionB: 'আলো, তাপ, শব্দ',
        correctAnswer: 'A',
        explanation: 'ঠোস, তরল ও গ্যাস পদার্থের তিনটি প্রধান অবস্থা।',
        tags: 'বিজ্ঞান, অবস্থা',
    }, 'draft').normalized;
    const quality = (0, questionBank_1.computeQualityScore)({
        ...normalized,
        flagged_duplicate: false,
        usage_count: 2,
        avg_correct_pct: 58,
    });
    assert_1.default.ok(quality.score > 40, 'Quality score should be above baseline');
}
function runSanitizerTest() {
    const dirty = '<p onclick=\"alert(1)\">Hello</p><script>alert(2)</script>';
    const clean = (0, questionBank_1.sanitizeRichHtml)(dirty);
    assert_1.default.ok(!clean.includes('<script'), 'Script tags must be stripped');
    assert_1.default.ok(!clean.includes('onclick'), 'Event attributes must be stripped');
}
function run() {
    runNormalizePayloadTest();
    runDuplicateDetectionTest();
    runQualityScoreTest();
    runSanitizerTest();
    console.log('[qbank-unit-tests] all tests passed');
}
run();
//# sourceMappingURL=qbank-unit-tests.js.map