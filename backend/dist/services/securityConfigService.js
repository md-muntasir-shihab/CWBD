"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecurityConfig = getSecurityConfig;
exports.invalidateSecurityConfigCache = invalidateSecurityConfigCache;
const securityCenterService_1 = require("./securityCenterService");
let cache = null;
async function getSecurityConfig(forceRefresh = false) {
    if (!forceRefresh && cache && Date.now() - cache.ts < 30000) {
        return cache.data;
    }
    const settings = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(forceRefresh);
    const data = {
        singleBrowserLogin: true,
        forceLogoutOnNewLogin: true,
        enable2faAdmin: settings.adminAccess.require2FAForAdmins,
        enable2faStudent: false,
        force2faSuperAdmin: settings.adminAccess.require2FAForAdmins,
        default2faMethod: 'email',
        otpExpiryMinutes: Math.max(1, Math.min(30, settings.loginProtection.lockoutMinutes)),
        maxOtpAttempts: settings.loginProtection.maxAttempts,
        ipChangeAlert: true,
        allowLegacyTokens: false,
        strictExamTabLock: settings.examProtection.logTabSwitch,
        strictTokenHashValidation: true,
        allowTestOtp: String(process.env.ALLOW_TEST_OTP ||
            (process.env.NODE_ENV === 'production' ? 'false' : 'true')).trim().toLowerCase() === 'true',
        testOtpCode: String(process.env.TEST_OTP_CODE || '123456'),
        passwordPolicy: settings.passwordPolicy,
        loginProtection: settings.loginProtection,
        session: settings.session,
        adminAccess: settings.adminAccess,
        siteAccess: settings.siteAccess,
        examProtection: settings.examProtection,
        logging: settings.logging,
        rateLimit: settings.rateLimit,
        panic: settings.panic,
    };
    cache = { data, ts: Date.now() };
    return data;
}
function invalidateSecurityConfigCache() {
    cache = null;
    (0, securityCenterService_1.invalidateSecuritySettingsCache)();
}
//# sourceMappingURL=securityConfigService.js.map