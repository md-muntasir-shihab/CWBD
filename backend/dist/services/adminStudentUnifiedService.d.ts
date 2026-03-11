import type { AdminStudentUnifiedPayload } from '../types/studentManagement';
/**
 * Fetch the full unified detail payload for a single student.
 * This is the canonical read model consumed by the admin detail page.
 */
export declare function getUnifiedStudentDetail(studentId: string): Promise<AdminStudentUnifiedPayload | null>;
//# sourceMappingURL=adminStudentUnifiedService.d.ts.map