/**
 * Exam Model Bridge — maps between the modern (exam.model.ts → `exams` collection)
 * and the rich (Exam.ts → `exam_collection`) field names. The consolidation target
 * is the rich model; this bridge allows modern routes to transition incrementally.
 *
 * Usage: When migrating a modern route, replace `import { ExamModel } from '../models/exam.model'`
 * with `import { ExamModel } from '../services/examBridge'` — the query interface is identical.
 */
import Exam, { type IExam } from '../models/Exam';
/**
 * Map a modern-model payload to the rich model's field names.
 */
export declare function modernToRich(input: Record<string, unknown>): Record<string, unknown>;
/**
 * Map a rich model document to the modern field names (for API responses
 * consumed by modern frontend code).
 */
export declare function richToModern(doc: Record<string, unknown>): Record<string, unknown>;
export { Exam as ExamUnified, type IExam };
//# sourceMappingURL=examBridge.d.ts.map