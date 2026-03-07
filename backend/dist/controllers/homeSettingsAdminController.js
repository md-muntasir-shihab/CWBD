"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicHomeSettings = exports.adminDeleteHomeSettings = exports.adminResetHomeSettingsSection = exports.adminUpdateHomeSettings = exports.adminGetHomeSettingsDefaults = exports.adminGetHomeSettings = void 0;
const HomeSettings_1 = __importDefault(require("../models/HomeSettings"));
const homeSettingsService_1 = require("../services/homeSettingsService");
const homeStream_1 = require("../realtime/homeStream");
const adminGetHomeSettings = async (_req, res) => {
    try {
        const settingsDoc = await (0, homeSettingsService_1.ensureHomeSettings)();
        const normalized = (0, homeSettingsService_1.mergeHomeSettings)((0, homeSettingsService_1.getHomeSettingsDefaults)(), settingsDoc.toObject());
        res.json({
            homeSettings: normalized,
            updatedAt: settingsDoc.updatedAt,
        });
    }
    catch (error) {
        console.error('adminGetHomeSettings error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.adminGetHomeSettings = adminGetHomeSettings;
const adminGetHomeSettingsDefaults = async (_req, res) => {
    try {
        res.json({
            defaults: (0, homeSettingsService_1.getHomeSettingsDefaults)(),
        });
    }
    catch (error) {
        console.error('adminGetHomeSettingsDefaults error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.adminGetHomeSettingsDefaults = adminGetHomeSettingsDefaults;
const adminUpdateHomeSettings = async (req, res) => {
    try {
        const settingsDoc = await (0, homeSettingsService_1.ensureHomeSettings)();
        const current = (0, homeSettingsService_1.mergeHomeSettings)((0, homeSettingsService_1.getHomeSettingsDefaults)(), settingsDoc.toObject());
        const merged = (0, homeSettingsService_1.mergeHomeSettings)(current, req.body);
        settingsDoc.set(merged);
        await settingsDoc.save();
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'home-updated',
            meta: { section: 'home-settings' },
        });
        res.json({
            message: 'Home settings updated successfully',
            homeSettings: (0, homeSettingsService_1.mergeHomeSettings)((0, homeSettingsService_1.getHomeSettingsDefaults)(), settingsDoc.toObject()),
            updatedAt: settingsDoc.updatedAt,
        });
    }
    catch (error) {
        console.error('adminUpdateHomeSettings error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.adminUpdateHomeSettings = adminUpdateHomeSettings;
const adminResetHomeSettingsSection = async (req, res) => {
    try {
        const section = String(req.body?.section || '').trim();
        if (!section || !(0, homeSettingsService_1.isResettableSection)(section)) {
            res.status(400).json({
                message: 'Invalid section key',
            });
            return;
        }
        const settingsDoc = await (0, homeSettingsService_1.ensureHomeSettings)();
        const defaults = (0, homeSettingsService_1.getHomeSettingsDefaults)();
        settingsDoc.set({ [section]: defaults[section] });
        await settingsDoc.save();
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'home-updated',
            meta: { section: `reset-${section}` },
        });
        res.json({
            message: `Section "${section}" reset successfully`,
            section,
            value: settingsDoc.get(section),
            updatedAt: settingsDoc.updatedAt,
        });
    }
    catch (error) {
        console.error('adminResetHomeSettingsSection error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.adminResetHomeSettingsSection = adminResetHomeSettingsSection;
const adminDeleteHomeSettings = async (_req, res) => {
    try {
        await HomeSettings_1.default.deleteMany({});
        const recreated = await (0, homeSettingsService_1.ensureHomeSettings)();
        (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'home-updated', meta: { section: 'reset-all' } });
        res.json({
            message: 'Home settings recreated from defaults',
            homeSettings: recreated,
        });
    }
    catch (error) {
        console.error('adminDeleteHomeSettings error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.adminDeleteHomeSettings = adminDeleteHomeSettings;
const getPublicHomeSettings = async (_req, res) => {
    try {
        const settingsDoc = await (0, homeSettingsService_1.ensureHomeSettings)();
        const normalized = (0, homeSettingsService_1.mergeHomeSettings)((0, homeSettingsService_1.getHomeSettingsDefaults)(), settingsDoc.toObject());
        res.json({
            homeSettings: normalized,
            updatedAt: settingsDoc.updatedAt,
        });
    }
    catch (error) {
        console.error('getPublicHomeSettings error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.getPublicHomeSettings = getPublicHomeSettings;
//# sourceMappingURL=homeSettingsAdminController.js.map