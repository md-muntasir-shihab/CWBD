"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeStudentProfileScore = computeStudentProfileScore;
function hasValue(value) {
    if (value === null || value === undefined)
        return false;
    if (typeof value === 'string')
        return value.trim().length > 0;
    if (value instanceof Date)
        return Number.isFinite(value.getTime());
    return true;
}
function computeStudentProfileScore(profileInput, userInput, threshold = 70) {
    const profile = (profileInput || {});
    const user = (userInput || {});
    const rules = [
        {
            key: 'photo',
            label: 'Profile photo',
            weight: 10,
            check: () => hasValue(profile.profile_photo_url) || hasValue(user.profile_photo),
        },
        {
            key: 'userId',
            label: 'Student ID',
            weight: 10,
            check: () => hasValue(profile.user_unique_id),
        },
        {
            key: 'name',
            label: 'Full name',
            weight: 10,
            check: () => hasValue(profile.full_name) || hasValue(user.full_name),
        },
        {
            key: 'phoneVerified',
            label: 'Phone',
            weight: 10,
            check: () => hasValue(profile.phone_number) || hasValue(profile.phone) || hasValue(user.phone_number),
        },
        {
            key: 'emailVerified',
            label: 'Email',
            weight: 10,
            check: () => hasValue(user.email),
        },
        {
            key: 'guardianPhone',
            label: 'Guardian phone',
            weight: 10,
            check: () => hasValue(profile.guardian_phone),
        },
        {
            key: 'address',
            label: 'Address',
            weight: 10,
            check: () => hasValue(profile.present_address) ||
                hasValue(profile.permanent_address) ||
                hasValue(profile.district),
        },
        {
            key: 'sscBatch',
            label: 'SSC batch',
            weight: 5,
            check: () => hasValue(profile.ssc_batch),
        },
        {
            key: 'hscBatch',
            label: 'HSC batch',
            weight: 5,
            check: () => hasValue(profile.hsc_batch),
        },
        {
            key: 'department',
            label: 'Department',
            weight: 5,
            check: () => hasValue(profile.department),
        },
        {
            key: 'collegeName',
            label: 'College name',
            weight: 5,
            check: () => hasValue(profile.college_name),
        },
        {
            key: 'dob',
            label: 'Date of birth',
            weight: 10,
            check: () => hasValue(profile.dob),
        },
    ];
    const breakdown = rules.map((rule) => {
        const completed = rule.check();
        return {
            key: rule.key,
            label: rule.label,
            weight: rule.weight,
            earned: completed ? rule.weight : 0,
            completed,
        };
    });
    const score = breakdown.reduce((sum, item) => sum + item.earned, 0);
    const missingFields = breakdown.filter((item) => !item.completed).map((item) => item.label);
    return {
        score,
        threshold: Math.max(0, Number(threshold || 70)),
        eligible: score >= Math.max(0, Number(threshold || 70)),
        breakdown,
        missingFields,
    };
}
//# sourceMappingURL=studentProfileScoreService.js.map