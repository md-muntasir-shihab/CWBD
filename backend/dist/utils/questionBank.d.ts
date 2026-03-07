import mongoose from 'mongoose';
export type QBankQuestionType = 'MCQ' | 'MULTI' | 'WRITTEN' | 'TF';
export type LegacyQuestionType = 'mcq' | 'written';
export interface NormalizedQuestionOption {
    key: string;
    text: string;
    media_id?: mongoose.Types.ObjectId | null;
}
export interface LocalizedTextValue {
    en: string;
    bn: string;
}
export interface LocalizedOptionValue {
    key: string;
    text: LocalizedTextValue;
    media_id?: mongoose.Types.ObjectId | null;
}
export interface NormalizedQuestionPayload {
    class_level: string;
    department: string;
    subject: string;
    chapter: string;
    topic: string;
    question: string;
    question_text: string;
    questionText: LocalizedTextValue;
    question_html: string;
    question_type: QBankQuestionType;
    questionType: LegacyQuestionType;
    options: NormalizedQuestionOption[];
    optionsLocalized: LocalizedOptionValue[];
    correct_answer: string[];
    correctAnswer?: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    explanation_text: string;
    explanationText: LocalizedTextValue;
    languageMode: 'EN' | 'BN' | 'BOTH';
    difficulty: 'easy' | 'medium' | 'hard';
    tags: string[];
    estimated_time: number;
    skill_tags: string[];
    has_explanation: boolean;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    marks: number;
    negative_marks: number;
    negativeMarks: number;
    image_media_id?: mongoose.Types.ObjectId | null;
    media_alt_text_bn: string;
    media_status?: 'pending' | 'approved' | 'rejected';
    status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
    manual_flags: string[];
    questionImage?: string;
}
export interface SimilarityMatch {
    questionId: string;
    questionText: string;
    score: number;
    tokenOverlap: number;
    levenshteinRatio: number;
    optionSimilarity: number;
}
export interface QualityResult {
    score: number;
    flags: string[];
}
export declare function sanitizeRichHtml(raw: unknown): string;
export declare function normalizeForSimilarity(raw: unknown): string;
export declare function tokenize(raw: unknown): Set<string>;
export declare function normalizeQuestionPayload(payload: Record<string, unknown>, fallbackStatus?: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived'): {
    normalized: NormalizedQuestionPayload;
    errors: string[];
};
export declare function computeQualityScore(data: NormalizedQuestionPayload & {
    usage_count?: number;
    avg_correct_pct?: number | null;
    flagged_duplicate?: boolean;
}): QualityResult;
export declare function detectSimilarQuestions(incoming: {
    question: string;
    options: NormalizedQuestionOption[];
}, existingRows: Array<{
    _id: unknown;
    question?: string;
    question_text?: string;
    options?: NormalizedQuestionOption[];
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
}>, threshold?: number): SimilarityMatch[];
export declare function validateImageUrl(rawUrl: string, maxBytes?: number): Promise<{
    ok: boolean;
    reason?: string;
    mimeType?: string;
    sizeBytes?: number;
}>;
//# sourceMappingURL=questionBank.d.ts.map