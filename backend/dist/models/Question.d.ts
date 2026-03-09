import mongoose, { Document } from 'mongoose';
export interface ISolutionContent {
    text?: string;
    imageUrl?: string;
    mathHtml?: string;
    pdfUrl?: string;
}
export interface ILocalizedText {
    en?: string;
    bn?: string;
}
export interface IQuestionOption {
    key: string;
    text: string;
    media_id?: mongoose.Types.ObjectId | null;
}
export interface ILocalizedQuestionOption {
    key: string;
    text: ILocalizedText;
    media_id?: mongoose.Types.ObjectId | null;
}
export interface IQuestion extends Document {
    exam?: mongoose.Types.ObjectId;
    university_id?: mongoose.Types.ObjectId;
    exam_pool_id?: string;
    class?: string;
    category?: 'Science' | 'Arts' | 'Commerce' | 'Mixed';
    subject?: string;
    chapter?: string;
    class_level?: string;
    department?: string;
    topic?: string;
    skill_tags?: string[];
    estimated_time?: number;
    question: string;
    question_text?: string;
    questionText?: ILocalizedText;
    question_html?: string;
    questionImage?: string;
    questionType: 'mcq' | 'written';
    question_type?: 'MCQ' | 'MULTI' | 'WRITTEN' | 'TF';
    options?: IQuestionOption[];
    optionsLocalized?: ILocalizedQuestionOption[];
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctAnswer?: 'A' | 'B' | 'C' | 'D';
    correct_answer?: string[];
    languageMode?: 'EN' | 'BN' | 'BOTH';
    max_attempt_select: number;
    tags: string[];
    assets: string[];
    explanation?: string;
    explanationText?: ILocalizedText;
    solutionImage?: string;
    solution?: ISolutionContent;
    explanation_text?: string;
    explanation_image_url?: string;
    explanation_formula?: string;
    has_explanation?: boolean;
    marks: number;
    negativeMarks?: number;
    negative_marks?: number;
    section?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    order: number;
    active: boolean;
    status?: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
    moderation_reason?: string;
    moderated_by?: mongoose.Types.ObjectId | null;
    moderated_at?: Date | null;
    locked?: boolean;
    locked_reason?: string;
    locked_by?: mongoose.Types.ObjectId | null;
    locked_at?: Date | null;
    archived_at?: Date | null;
    archived_by?: mongoose.Types.ObjectId | null;
    image_media_id?: mongoose.Types.ObjectId | null;
    media_status?: 'pending' | 'approved' | 'rejected';
    media_alt_text_bn?: string;
    quality_score?: number;
    quality_flags?: string[];
    flagged_duplicate?: boolean;
    duplicate_of_ids?: mongoose.Types.ObjectId[];
    manual_flags?: string[];
    revision_no?: number;
    previous_revision_id?: mongoose.Types.ObjectId | null;
    last_edited_by?: mongoose.Types.ObjectId | null;
    usage_count?: number;
    avg_correct_pct?: number | null;
    last_used_in_exam?: mongoose.Types.ObjectId | null;
    last_used_at?: Date | null;
    totalAttempted: number;
    totalCorrect: number;
    created_by?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IQuestion, {}, {}, {}, mongoose.Document<unknown, {}, IQuestion, {}, {}> & IQuestion & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Question.d.ts.map