"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const User_1 = __importDefault(require("../models/User"));
const UserSubscription_1 = __importDefault(require("../models/UserSubscription"));
dotenv_1.default.config();
function normalizeCode(raw) {
    return String(raw || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function deriveStatusFromCache(raw) {
    const isActive = Boolean(raw.isActive);
    const expiryDate = raw.expiryDate ? new Date(String(raw.expiryDate)) : null;
    if (isActive && expiryDate && expiryDate.getTime() > Date.now())
        return 'active';
    if (isActive && !expiryDate)
        return 'active';
    if (!isActive && expiryDate && expiryDate.getTime() <= Date.now())
        return 'expired';
    return 'pending';
}
async function migratePlans() {
    const plans = await SubscriptionPlan_1.default.find();
    let updated = 0;
    for (const plan of plans) {
        const priceBDT = Math.max(0, Number(plan.priceBDT ?? plan.price ?? 0));
        const type = plan.type || (priceBDT <= 0 ? 'free' : 'paid');
        const durationDays = Math.max(1, Number(plan.durationDays ?? plan.durationValue ?? 30));
        const displayOrder = Number(plan.displayOrder ?? plan.sortOrder ?? plan.priority ?? 100);
        const enabled = plan.enabled ?? plan.isActive ?? true;
        const code = normalizeCode(plan.code || plan.name);
        if (!code)
            continue;
        plan.code = code;
        plan.type = type === 'free' ? 'free' : 'paid';
        plan.priceBDT = plan.type === 'free' ? 0 : priceBDT;
        plan.price = plan.priceBDT;
        plan.durationDays = durationDays;
        plan.durationValue = Number(plan.durationValue || durationDays);
        plan.durationUnit = plan.durationUnit === 'months' ? 'months' : 'days';
        plan.enabled = enabled;
        plan.isActive = enabled;
        plan.displayOrder = displayOrder;
        plan.sortOrder = displayOrder;
        plan.priority = Number(plan.priority || displayOrder);
        plan.contactCtaLabel = String(plan.contactCtaLabel || 'Contact to Subscribe');
        plan.contactCtaUrl = String(plan.contactCtaUrl || '/contact');
        await plan.save();
        updated += 1;
    }
    return { total: plans.length, updated };
}
async function migrateUserSubscriptions() {
    const users = await User_1.default.find({ role: 'student' }).select('_id createdAt subscription');
    let created = 0;
    let skipped = 0;
    for (const user of users) {
        const cache = (user.subscription || {});
        const planCode = normalizeCode(cache.planCode || cache.plan);
        const planName = String(cache.planName || '').trim();
        if (!planCode && !planName) {
            skipped += 1;
            continue;
        }
        const plan = await SubscriptionPlan_1.default.findOne(planCode
            ? { code: planCode }
            : { name: planName }).lean();
        if (!plan?._id) {
            skipped += 1;
            continue;
        }
        const existing = await UserSubscription_1.default.findOne({ userId: user._id }).lean();
        if (existing) {
            skipped += 1;
            continue;
        }
        const startAtUTC = cache.startDate ? new Date(String(cache.startDate)) : (user.createdAt || new Date());
        const expiryFromCache = cache.expiryDate ? new Date(String(cache.expiryDate)) : null;
        const expiresAtUTC = expiryFromCache && !Number.isNaN(expiryFromCache.getTime())
            ? expiryFromCache
            : new Date(startAtUTC.getTime() + Math.max(1, Number(plan.durationDays || 30)) * 24 * 60 * 60 * 1000);
        const status = deriveStatusFromCache(cache);
        await UserSubscription_1.default.create({
            userId: user._id,
            planId: plan._id,
            status,
            startAtUTC,
            expiresAtUTC,
            notes: 'Migrated from legacy user.subscription cache',
        });
        created += 1;
    }
    return { totalUsers: users.length, created, skipped };
}
async function run() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri)
        throw new Error('MONGODB_URI (or MONGO_URI) is required');
    await mongoose_1.default.connect(uri);
    console.log('[migrate:subscription-plans-v2] connected');
    const [planResult, userResult] = await Promise.all([
        migratePlans(),
        migrateUserSubscriptions(),
    ]);
    console.log('[migrate:subscription-plans-v2] plans', planResult);
    console.log('[migrate:subscription-plans-v2] user_subscriptions', userResult);
    await mongoose_1.default.disconnect();
    console.log('[migrate:subscription-plans-v2] done');
}
run().catch(async (error) => {
    console.error('[migrate:subscription-plans-v2] failed', error);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
//# sourceMappingURL=migrate-subscription-plans-v2.js.map