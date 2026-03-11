"use strict";
// ═══════════════════════════════════════════════════════════════════════════
// Student Management OS — Domain Types & Enums
// Canonical type surface for the admin student management redesign.
// ═══════════════════════════════════════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.STUDENT_DETAIL_TABS = exports.WEAK_TOPIC_SEVERITY = exports.CRM_EVENT_CATEGORIES = exports.SECURITY_EVENT_TYPES = exports.GUARDIAN_VERIFICATION = exports.COMM_ELIGIBILITY = exports.PAYMENT_STATUSES = exports.SUBSCRIPTION_STATES = exports.STUDENT_STATUSES = void 0;
// ─── Student Status ──────────────────────────────────────────────────────
exports.STUDENT_STATUSES = ['active', 'suspended', 'blocked', 'pending'];
// ─── Subscription State ──────────────────────────────────────────────────
exports.SUBSCRIPTION_STATES = ['active', 'expired', 'pending', 'suspended', 'none'];
// ─── Payment Status ──────────────────────────────────────────────────────
exports.PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
// ─── Communication Eligibility ───────────────────────────────────────────
exports.COMM_ELIGIBILITY = ['eligible', 'no_phone', 'no_email', 'opted_out', 'blocked'];
// ─── Guardian Verification ───────────────────────────────────────────────
exports.GUARDIAN_VERIFICATION = ['unverified', 'pending', 'verified'];
// ─── Security Event Types ────────────────────────────────────────────────
exports.SECURITY_EVENT_TYPES = [
    'password_set_by_admin', 'password_changed_by_user', 'force_reset_enabled',
    'force_reset_disabled', 'session_revoked', 'account_suspended',
    'account_activated', 'account_blocked', 'login_attempt_failed',
    'login_success', '2fa_enabled', '2fa_disabled', 'credentials_resent',
];
// ─── CRM Timeline Event Categories ──────────────────────────────────────
exports.CRM_EVENT_CATEGORIES = [
    'note', 'call', 'message', 'email', 'sms',
    'subscription_assigned', 'subscription_expired', 'subscription_extended',
    'payment_verified', 'payment_rejected', 'payment_refunded',
    'exam_attempted', 'result_published', 'profile_updated',
    'guardian_updated', 'group_added', 'group_removed',
    'account_created', 'account_suspended', 'account_activated',
    'password_reset', 'credentials_sent', 'support_ticket',
    'import', 'system',
];
// ─── Weak-Topic Severity ────────────────────────────────────────────────
exports.WEAK_TOPIC_SEVERITY = ['low', 'medium', 'high', 'critical'];
// ─── Student Detail Tab IDs (13-tab contract) ───────────────────────────
exports.STUDENT_DETAIL_TABS = [
    'overview', 'profile', 'guardian', 'subscription', 'payments',
    'finance', 'exams', 'results', 'weak-topics', 'communication',
    'crm-timeline', 'security', 'support',
];
//# sourceMappingURL=studentManagement.js.map