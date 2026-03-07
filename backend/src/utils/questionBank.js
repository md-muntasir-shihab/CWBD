"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeRichHtml = sanitizeRichHtml;
exports.normalizeForSimilarity = normalizeForSimilarity;
exports.tokenize = tokenize;
exports.normalizeQuestionPayload = normalizeQuestionPayload;
exports.computeQualityScore = computeQualityScore;
exports.detectSimilarQuestions = detectSimilarQuestions;
exports.validateImageUrl = validateImageUrl;
var mongoose_1 = require("mongoose");
var BANGLA_STOPWORDS = new Set([
    'এবং',
    'কোন',
    'কোনটি',
    'যে',
    'এই',
    'সেই',
    'কি',
    'কী',
    'একটি',
    'হলো',
    'হয়',
    'নিম্নের',
    'নিম্নোক্ত',
    'উত্তর',
    'সঠিক',
    'ভুল',
]);
var EN_STOPWORDS = new Set([
    'the',
    'a',
    'an',
    'is',
    'are',
    'of',
    'to',
    'for',
    'and',
    'or',
    'in',
    'on',
    'with',
    'which',
    'what',
    'true',
    'false',
]);
var VALID_CORRECT_KEYS = new Set(['A', 'B', 'C', 'D', 'TRUE', 'FALSE']);
function clamp(num, min, max) {
    return Math.min(max, Math.max(min, num));
}
function toStringArray(value) {
    if (Array.isArray(value)) {
        return value
            .map(function (entry) { return String(entry || '').trim(); })
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map(function (entry) { return entry.trim(); })
            .filter(Boolean);
    }
    return [];
}
function asLocalizedText(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        var row = value;
        return {
            en: String(row.en || '').trim(),
            bn: String(row.bn || '').trim(),
        };
    }
    var text = String(value || '').trim();
    return { en: text, bn: '' };
}
function normalizeLocalizedOptionText(value) {
    return asLocalizedText(value);
}
function normalizeLanguageMode(payload, localized) {
    var explicit = String(payload.languageMode || payload.language_mode || '').trim().toUpperCase();
    if (explicit === 'EN' || explicit === 'BN' || explicit === 'BOTH') {
        return explicit;
    }
    var hasBn = Boolean(localized.questionText.bn) ||
        Boolean(localized.explanationText.bn) ||
        localized.optionsLocalized.some(function (item) { return Boolean(item.text.bn); });
    var hasEn = Boolean(localized.questionText.en) ||
        Boolean(localized.explanationText.en) ||
        localized.optionsLocalized.some(function (item) { return Boolean(item.text.en); });
    if (hasBn && hasEn)
        return 'BOTH';
    if (hasBn)
        return 'BN';
    return 'EN';
}
function normalizeOptionsLocalized(payload) {
    var keyOrder = new Map([
        ['A', 0],
        ['B', 1],
        ['C', 2],
        ['D', 3],
    ]);
    if (Array.isArray(payload.optionsLocalized)) {
        var rows = payload.optionsLocalized
            .map(function (entry, index) {
            var _a, _b, _c;
            var row = entry;
            var key = String(row.key || String.fromCharCode(65 + index))
                .trim()
                .toUpperCase();
            var text = normalizeLocalizedOptionText((_c = (_b = (_a = row.text) !== null && _a !== void 0 ? _a : row.value) !== null && _b !== void 0 ? _b : row.option) !== null && _c !== void 0 ? _c : '');
            if (!text.en && !text.bn && row.text && typeof row.text === 'string') {
                text.en = String(row.text).trim();
            }
            return {
                key: key,
                text: text,
                media_id: row.media_id && mongoose_1.default.Types.ObjectId.isValid(String(row.media_id))
                    ? new mongoose_1.default.Types.ObjectId(String(row.media_id))
                    : null,
            };
        })
            .filter(function (entry) { return entry.key && (entry.text.en || entry.text.bn); })
            .sort(function (a, b) { var _a, _b; return ((_a = keyOrder.get(a.key)) !== null && _a !== void 0 ? _a : 999) - ((_b = keyOrder.get(b.key)) !== null && _b !== void 0 ? _b : 999); });
        if (rows.length > 0)
            return rows;
    }
    if (Array.isArray(payload.options)) {
        var rows = payload.options
            .map(function (entry, index) {
            var row = entry;
            var key = String(row.key || String.fromCharCode(65 + index))
                .trim()
                .toUpperCase();
            var text = normalizeLocalizedOptionText(row.text);
            var banglaFallback = String(row.text_bn || row.textBn || '').trim();
            if (banglaFallback && !text.bn) {
                text.bn = banglaFallback;
            }
            return {
                key: key,
                text: text,
                media_id: row.media_id && mongoose_1.default.Types.ObjectId.isValid(String(row.media_id))
                    ? new mongoose_1.default.Types.ObjectId(String(row.media_id))
                    : null,
            };
        })
            .filter(function (entry) { return entry.key && (entry.text.en || entry.text.bn); })
            .sort(function (a, b) { var _a, _b; return ((_a = keyOrder.get(a.key)) !== null && _a !== void 0 ? _a : 999) - ((_b = keyOrder.get(b.key)) !== null && _b !== void 0 ? _b : 999); });
        if (rows.length > 0)
            return rows;
    }
    var legacy = ['A', 'B', 'C', 'D']
        .map(function (key) {
        var en = String(payload["option".concat(key)] ||
            payload["option_".concat(key.toLowerCase())] ||
            '').trim();
        var bn = String(payload["option".concat(key, "_bn")] ||
            payload["option_".concat(key.toLowerCase(), "_bn")] ||
            '').trim();
        return {
            key: key,
            text: { en: en, bn: bn },
            media_id: null,
        };
    })
        .filter(function (entry) { return entry.text.en || entry.text.bn; });
    return legacy;
}
function sanitizeRichHtml(raw) {
    var html = String(raw || '');
    if (!html)
        return '';
    return html
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
        .replace(/\s(href|src)\s*=\s*(['"])javascript:[^'"]*\2/gi, ' $1="#"')
        .trim();
}
function normalizeForSimilarity(raw) {
    var input = String(raw || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!input)
        return '';
    return input
        .split(' ')
        .filter(function (token) { return token && !BANGLA_STOPWORDS.has(token) && !EN_STOPWORDS.has(token); })
        .join(' ');
}
function tokenize(raw) {
    var normalized = normalizeForSimilarity(raw);
    if (!normalized)
        return new Set();
    return new Set(normalized.split(' ').filter(Boolean));
}
function tokenOverlap(a, b) {
    var setA = tokenize(a);
    var setB = tokenize(b);
    if (setA.size === 0 || setB.size === 0)
        return 0;
    var intersection = __spreadArray([], setA, true).filter(function (item) { return setB.has(item); }).length;
    var union = new Set(__spreadArray(__spreadArray([], setA, true), setB, true)).size;
    return union === 0 ? 0 : intersection / union;
}
function levenshteinDistance(a, b) {
    var left = normalizeForSimilarity(a);
    var right = normalizeForSimilarity(b);
    if (left === right)
        return 0;
    if (!left.length)
        return right.length;
    if (!right.length)
        return left.length;
    var matrix = Array.from({ length: left.length + 1 }, function () { return []; });
    for (var i = 0; i <= left.length; i += 1)
        matrix[i][0] = i;
    for (var j = 0; j <= right.length; j += 1)
        matrix[0][j] = j;
    for (var i = 1; i <= left.length; i += 1) {
        for (var j = 1; j <= right.length; j += 1) {
            var cost = left[i - 1] === right[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }
    return matrix[left.length][right.length];
}
function levenshteinRatio(a, b) {
    var left = normalizeForSimilarity(a);
    var right = normalizeForSimilarity(b);
    var maxLen = Math.max(left.length, right.length);
    if (maxLen === 0)
        return 1;
    var dist = levenshteinDistance(left, right);
    return clamp(1 - dist / maxLen, 0, 1);
}
function normalizeQuestionType(payload) {
    var explicit = String(payload.question_type || '').trim().toUpperCase();
    if (explicit === 'MCQ' || explicit === 'MULTI' || explicit === 'WRITTEN' || explicit === 'TF') {
        return explicit;
    }
    var legacy = String(payload.questionType || '').trim().toLowerCase();
    if (legacy === 'written')
        return 'WRITTEN';
    return 'MCQ';
}
function normalizeLegacyType(questionType) {
    return questionType === 'WRITTEN' ? 'written' : 'mcq';
}
function normalizeDifficulty(payload) {
    var raw = String(payload.difficulty || '')
        .trim()
        .toLowerCase();
    if (raw === 'easy' || raw === 'hard')
        return raw;
    return 'medium';
}
function normalizeOptions(payload) {
    if (Array.isArray(payload.options)) {
        var fromArray = payload.options
            .map(function (entry, index) {
            var row = entry;
            var key = String(row.key || String.fromCharCode(65 + index))
                .trim()
                .toUpperCase();
            return {
                key: key,
                text: String(row.text || '').trim(),
                media_id: row.media_id && mongoose_1.default.Types.ObjectId.isValid(String(row.media_id))
                    ? new mongoose_1.default.Types.ObjectId(String(row.media_id))
                    : null,
            };
        })
            .filter(function (entry) { return entry.text; });
        if (fromArray.length > 0)
            return fromArray;
    }
    var legacy = [
        { key: 'A', text: String(payload.optionA || payload.option_a || '').trim() },
        { key: 'B', text: String(payload.optionB || payload.option_b || '').trim() },
        { key: 'C', text: String(payload.optionC || payload.option_c || '').trim() },
        { key: 'D', text: String(payload.optionD || payload.option_d || '').trim() },
    ].filter(function (entry) { return entry.text; });
    return legacy;
}
function normalizeCorrectAnswers(payload) {
    var explicit = Array.isArray(payload.correct_answer)
        ? payload.correct_answer
        : toStringArray(payload.correct_answer);
    if (explicit.length > 0) {
        return explicit
            .map(function (answer) { return String(answer || '').trim().toUpperCase(); })
            .filter(function (answer) { return VALID_CORRECT_KEYS.has(answer); });
    }
    var legacy = String(payload.correctAnswer || payload.correct_option || '')
        .split(',')
        .map(function (answer) { return answer.trim().toUpperCase(); })
        .filter(Boolean);
    return legacy.filter(function (answer) { return VALID_CORRECT_KEYS.has(answer); });
}
function normalizeQuestionPayload(payload, fallbackStatus) {
    var _a, _b, _c, _d, _e, _f;
    if (fallbackStatus === void 0) { fallbackStatus = 'draft'; }
    var questionType = normalizeQuestionType(payload);
    var optionsLocalizedFromPayload = normalizeOptionsLocalized(payload);
    var options = optionsLocalizedFromPayload.map(function (opt) { return ({
        key: opt.key,
        text: opt.text.en || opt.text.bn || '',
        media_id: opt.media_id || null,
    }); });
    if (options.length === 0) {
        options = normalizeOptions(payload);
    }
    var optionsLocalized = optionsLocalizedFromPayload.length > 0
        ? optionsLocalizedFromPayload
        : options.map(function (opt) { return ({
            key: opt.key,
            text: { en: String(opt.text || '').trim(), bn: '' },
            media_id: opt.media_id || null,
        }); });
    var correctAnswers = normalizeCorrectAnswers(payload);
    var questionTextLocalizedInput = asLocalizedText(payload.questionText || payload.question_text_localized || '');
    var questionTextEn = questionTextLocalizedInput.en || String(payload.question_text || payload.question || '').trim();
    var questionTextBn = questionTextLocalizedInput.bn || String(payload.question_text_bn || payload.question_bn || '').trim();
    var questionTextLocalized = {
        en: questionTextEn,
        bn: questionTextBn,
    };
    var questionText = questionTextLocalized.en || questionTextLocalized.bn;
    var sanitizedHtml = sanitizeRichHtml(payload.question_html || '');
    var explanationTextLocalizedInput = asLocalizedText(payload.explanationText || payload.explanation_text_localized || '');
    var explanationEn = explanationTextLocalizedInput.en || String(payload.explanation || payload.explanation_text || '').trim();
    var explanationBn = explanationTextLocalizedInput.bn || String(payload.explanation_bn || '').trim();
    var explanationTextLocalized = {
        en: explanationEn,
        bn: explanationBn,
    };
    var explanation = explanationTextLocalized.en || explanationTextLocalized.bn;
    var marks = Number(payload.marks || 1);
    var negative = Number((_b = (_a = payload.negative_marks) !== null && _a !== void 0 ? _a : payload.negativeMarks) !== null && _b !== void 0 ? _b : 0);
    var estimated = Number(payload.estimated_time || 60);
    var tags = toStringArray(payload.tags);
    var skillTags = toStringArray(payload.skill_tags);
    var statusRaw = String(payload.status || fallbackStatus).trim().toLowerCase();
    var status = statusRaw === 'pending_review' || statusRaw === 'approved' || statusRaw === 'rejected' || statusRaw === 'archived'
        ? statusRaw
        : 'draft';
    var languageMode = normalizeLanguageMode(payload, {
        questionText: questionTextLocalized,
        explanationText: explanationTextLocalized,
        optionsLocalized: optionsLocalized,
    });
    var normalized = {
        class_level: String(payload.class_level || payload.class || '').trim(),
        department: String(payload.department || '').trim(),
        subject: String(payload.subject || '').trim(),
        chapter: String(payload.chapter || '').trim(),
        topic: String(payload.topic || '').trim(),
        question: questionText,
        question_text: questionText,
        questionText: questionTextLocalized,
        question_html: sanitizedHtml,
        question_type: questionType,
        questionType: normalizeLegacyType(questionType),
        options: options,
        optionsLocalized: optionsLocalized,
        correct_answer: correctAnswers,
        correctAnswer: correctAnswers[0] || undefined,
        explanation: explanation,
        explanation_text: explanation,
        explanationText: explanationTextLocalized,
        languageMode: languageMode,
        difficulty: normalizeDifficulty(payload),
        tags: tags,
        estimated_time: Number.isFinite(estimated) && estimated > 0 ? Math.round(estimated) : 60,
        skill_tags: skillTags,
        has_explanation: Boolean(explanationTextLocalized.en || explanationTextLocalized.bn),
        optionA: ((_c = options.find(function (opt) { return opt.key === 'A'; })) === null || _c === void 0 ? void 0 : _c.text) || '',
        optionB: ((_d = options.find(function (opt) { return opt.key === 'B'; })) === null || _d === void 0 ? void 0 : _d.text) || '',
        optionC: ((_e = options.find(function (opt) { return opt.key === 'C'; })) === null || _e === void 0 ? void 0 : _e.text) || '',
        optionD: ((_f = options.find(function (opt) { return opt.key === 'D'; })) === null || _f === void 0 ? void 0 : _f.text) || '',
        marks: Number.isFinite(marks) && marks > 0 ? marks : 1,
        negative_marks: Number.isFinite(negative) && negative >= 0 ? negative : 0,
        negativeMarks: Number.isFinite(negative) && negative >= 0 ? negative : 0,
        image_media_id: payload.image_media_id && mongoose_1.default.Types.ObjectId.isValid(String(payload.image_media_id))
            ? new mongoose_1.default.Types.ObjectId(String(payload.image_media_id))
            : null,
        media_alt_text_bn: String(payload.media_alt_text_bn || payload.alt_text || '').trim(),
        media_status: String(payload.media_status || '').trim().toLowerCase() === 'pending' ? 'pending' : 'approved',
        status: status,
        manual_flags: toStringArray(payload.manual_flags),
        questionImage: String(payload.questionImage || '').trim() || undefined,
    };
    var errors = [];
    if (!normalized.question) {
        errors.push('প্রশ্ন লিখতে হবে');
    }
    if (normalized.question_type !== 'WRITTEN') {
        if (normalized.options.length < 2) {
            errors.push('অপশনগুলি পূরণ করুন');
        }
        if (normalized.correct_answer.length < 1) {
            errors.push('সঠিক উত্তর নির্বাচন করুন');
        }
        else {
            var optionKeys_1 = new Set(normalized.options.map(function (opt) { return opt.key; }));
            var invalidCorrect = normalized.correct_answer.some(function (answer) { return !optionKeys_1.has(answer) && answer !== 'TRUE' && answer !== 'FALSE'; });
            if (invalidCorrect) {
                errors.push('সঠিক উত্তর নির্বাচন করুন');
            }
        }
    }
    if (normalized.question_type !== 'WRITTEN' && normalized.options.some(function (opt) { return !opt.text; })) {
        errors.push('অপশনগুলি পূরণ করুন');
    }
    if ((normalized.image_media_id || normalized.questionImage) && !normalized.media_alt_text_bn) {
        errors.push('ইমেজ ব্যবহার করলে alt text (বাংলা) দিতে হবে');
    }
    return { normalized: normalized, errors: errors };
}
function computeQualityScore(data) {
    var _a;
    var score = 0;
    var flags = [];
    var questionLength = data.question.length;
    if (questionLength >= 20)
        score += 20;
    else if (questionLength >= 8)
        score += 12;
    else
        flags.push('short_question');
    if (data.question_type === 'WRITTEN') {
        score += 15;
    }
    else {
        if (data.options.length >= 4)
            score += 20;
        else if (data.options.length >= 2)
            score += 14;
        else
            flags.push('missing_options');
        if (data.correct_answer.length >= 1)
            score += 12;
        else
            flags.push('missing_correct_answer');
    }
    if (data.subject)
        score += 6;
    else
        flags.push('missing_subject');
    if (data.chapter)
        score += 6;
    else
        flags.push('missing_chapter');
    if (data.class_level)
        score += 4;
    if (data.topic)
        score += 3;
    if (data.tags.length >= 3)
        score += 8;
    else if (data.tags.length > 0)
        score += 4;
    else
        flags.push('missing_tags');
    if (data.has_explanation || data.explanation.length > 10)
        score += 8;
    else
        flags.push('missing_explanation');
    if (data.estimated_time > 0 && data.estimated_time <= 600)
        score += 5;
    if ((data.image_media_id || data.questionImage) && data.media_alt_text_bn)
        score += 4;
    var usageCount = Number(data.usage_count || 0);
    if (usageCount > 0)
        score += 5;
    if (usageCount >= 20)
        score += 4;
    var avgCorrect = Number((_a = data.avg_correct_pct) !== null && _a !== void 0 ? _a : 0);
    if (Number.isFinite(avgCorrect) && avgCorrect > 0) {
        var balance = 1 - Math.abs(avgCorrect - 55) / 55;
        score += clamp(balance, 0, 1) * 8;
    }
    if (data.flagged_duplicate) {
        score -= 25;
        flags.push('duplicate_risk');
    }
    if (data.media_status === 'pending')
        flags.push('media_pending');
    return {
        score: Number(clamp(Math.round(score * 100) / 100, 0, 100)),
        flags: flags,
    };
}
function optionSimilarity(aOptions, bOptions) {
    if (aOptions.length === 0 || bOptions.length === 0)
        return 0;
    var aText = aOptions.map(function (entry) { return normalizeForSimilarity(entry.text); }).filter(Boolean);
    var bText = bOptions.map(function (entry) { return normalizeForSimilarity(entry.text); }).filter(Boolean);
    if (aText.length === 0 || bText.length === 0)
        return 0;
    var total = 0;
    var matched = 0;
    for (var _i = 0, aText_1 = aText; _i < aText_1.length; _i++) {
        var left = aText_1[_i];
        var best = 0;
        for (var _a = 0, bText_1 = bText; _a < bText_1.length; _a++) {
            var right = bText_1[_a];
            var ratio = levenshteinRatio(left, right);
            if (ratio > best)
                best = ratio;
        }
        total += best;
        matched += 1;
    }
    return matched === 0 ? 0 : total / matched;
}
function detectSimilarQuestions(incoming, existingRows, threshold) {
    if (threshold === void 0) { threshold = 0.82; }
    var matches = [];
    var incomingQuestion = incoming.question || '';
    for (var _i = 0, existingRows_1 = existingRows; _i < existingRows_1.length; _i++) {
        var row = existingRows_1[_i];
        var existingQuestion = String(row.question_text || row.question || '').trim();
        if (!existingQuestion)
            continue;
        var existingOptions = Array.isArray(row.options) && row.options.length > 0
            ? row.options
            : [
                { key: 'A', text: String(row.optionA || '') },
                { key: 'B', text: String(row.optionB || '') },
                { key: 'C', text: String(row.optionC || '') },
                { key: 'D', text: String(row.optionD || '') },
            ].filter(function (entry) { return entry.text; });
        var overlap = tokenOverlap(incomingQuestion, existingQuestion);
        var lev = levenshteinRatio(incomingQuestion, existingQuestion);
        var optSimilarity = optionSimilarity(incoming.options, existingOptions);
        var score = overlap * 0.45 + lev * 0.35 + optSimilarity * 0.2;
        if (score >= threshold) {
            matches.push({
                questionId: String(row._id),
                questionText: existingQuestion,
                score: Number(score.toFixed(4)),
                tokenOverlap: Number(overlap.toFixed(4)),
                levenshteinRatio: Number(lev.toFixed(4)),
                optionSimilarity: Number(optSimilarity.toFixed(4)),
            });
        }
    }
    return matches.sort(function (a, b) { return b.score - a.score; });
}
function validateImageUrl(rawUrl_1) {
    return __awaiter(this, arguments, void 0, function (rawUrl, maxBytes) {
        var url, controller_1, timeout, headResponse, mimeType, sizeHeader, sizeBytes, _a;
        if (maxBytes === void 0) { maxBytes = 5 * 1024 * 1024; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    url = String(rawUrl || '').trim();
                    if (!url)
                        return [2 /*return*/, { ok: true }];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    controller_1 = new AbortController();
                    timeout = setTimeout(function () { return controller_1.abort(); }, 4500);
                    return [4 /*yield*/, fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller_1.signal })];
                case 2:
                    headResponse = _b.sent();
                    clearTimeout(timeout);
                    if (!headResponse.ok) {
                        return [2 /*return*/, { ok: false, reason: "HTTP ".concat(headResponse.status) }];
                    }
                    mimeType = String(headResponse.headers.get('content-type') || '').toLowerCase();
                    sizeHeader = Number(headResponse.headers.get('content-length') || 0);
                    sizeBytes = Number.isFinite(sizeHeader) ? sizeHeader : 0;
                    if (mimeType && !mimeType.startsWith('image/')) {
                        return [2 /*return*/, { ok: false, reason: 'content_type_not_image', mimeType: mimeType }];
                    }
                    if (sizeBytes > 0 && sizeBytes > maxBytes) {
                        return [2 /*return*/, { ok: false, reason: 'image_too_large', sizeBytes: sizeBytes, mimeType: mimeType }];
                    }
                    return [2 /*return*/, { ok: true, mimeType: mimeType, sizeBytes: sizeBytes }];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, { ok: false, reason: 'image_url_unreachable' }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
