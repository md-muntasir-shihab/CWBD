/**
 * defaultSetup.ts
 * ---------------
 * Runs ONCE on first server boot (when ALLOW_DEFAULT_SETUP=true in .env).
 * Creates:
 *   1. Super Admin account
 *   2. Test Student account (with 7-day subscription)
 *   3. Demo Exam (30 min, 5 sample questions)
 *   4. INITIAL_ACCESS_INFO.txt in project root (outside public/)
 *
 * Idempotent — checks for existence before creating anything.
 * The text file is written only once; subsequent runs are no-ops.
 */
export declare function runDefaultSetup(): Promise<void>;
//# sourceMappingURL=defaultSetup.d.ts.map