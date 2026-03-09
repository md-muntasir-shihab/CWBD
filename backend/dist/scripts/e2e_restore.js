"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../config/db");
const Settings_1 = __importDefault(require("../models/Settings"));
const SecuritySettings_1 = __importDefault(require("../models/SecuritySettings"));
const User_1 = __importDefault(require("../models/User"));
const ActiveSession_1 = __importDefault(require("../models/ActiveSession"));
const BACKUP_PATH = path_1.default.resolve(process.cwd(), '.e2e-security-backup.json');
const SEEDED_EMAILS = [
    process.env.E2E_ADMIN_DESKTOP_EMAIL || 'e2e_admin_desktop@campusway.local',
    process.env.E2E_ADMIN_MOBILE_EMAIL || 'e2e_admin_mobile@campusway.local',
    process.env.E2E_STUDENT_DESKTOP_EMAIL || 'e2e_student_desktop@campusway.local',
    process.env.E2E_STUDENT_MOBILE_EMAIL || 'e2e_student_mobile@campusway.local',
    process.env.E2E_STUDENT_SESSION_EMAIL || 'e2e_student_session@campusway.local',
].map((item) => item.toLowerCase());
function shouldDeactivateUsers() {
    return process.argv.includes('--deactivate-users') || process.env.E2E_DEACTIVATE_USERS === 'true';
}
async function restoreSecurity() {
    try {
        const raw = await promises_1.default.readFile(BACKUP_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.security) {
            return { restored: false, reason: 'No security snapshot found in backup file.' };
        }
        await Settings_1.default.findOneAndUpdate({}, { $set: { security: parsed.security } }, { upsert: true });
        if (parsed.securitySettings) {
            await SecuritySettings_1.default.findOneAndUpdate({ key: 'global' }, { $set: parsed.securitySettings }, { upsert: true });
        }
        await promises_1.default.unlink(BACKUP_PATH).catch(() => { });
        return { restored: true };
    }
    catch {
        return { restored: false, reason: 'Backup file missing or invalid JSON.' };
    }
}
async function deactivateSeededUsers() {
    const users = await User_1.default.find({ email: { $in: SEEDED_EMAILS } }).select('_id').lean();
    const ids = users.map((u) => u._id);
    if (!ids.length)
        return 0;
    const updateResult = await User_1.default.updateMany({ _id: { $in: ids } }, { $set: { status: 'suspended' } });
    await ActiveSession_1.default.updateMany({ user_id: { $in: ids }, status: 'active' }, {
        $set: {
            status: 'terminated',
            terminated_reason: 'e2e_restore_deactivate',
            terminated_at: new Date(),
            termination_meta: { trigger: 'e2e_restore' },
        },
    });
    return Number(updateResult.modifiedCount || 0);
}
async function run() {
    try {
        await (0, db_1.connectDB)();
        const restore = await restoreSecurity();
        let deactivatedUsers = 0;
        if (shouldDeactivateUsers()) {
            deactivatedUsers = await deactivateSeededUsers();
        }
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({
            ok: true,
            message: 'E2E environment restored.',
            securityRestored: restore.restored,
            securityRestoreReason: restore.reason,
            deactivatedUsers,
        }, null, 2));
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('[e2e_restore] failed', error);
        process.exitCode = 1;
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
void run();
//# sourceMappingURL=e2e_restore.js.map