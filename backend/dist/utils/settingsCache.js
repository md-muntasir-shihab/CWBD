"use strict";
/**
 * Simple in-memory TTL cache for public settings and /api/home response.
 * Safe invalidation after admin saves.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsCache = void 0;
class SettingsCache {
    constructor(defaultTtlMs = 30000) {
        this.store = new Map();
        this.defaultTtlMs = defaultTtlMs;
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }
    set(key, value, ttlMs) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
        });
    }
    invalidate(key) {
        this.store.delete(key);
    }
    invalidatePrefix(prefix) {
        for (const k of this.store.keys()) {
            if (k.startsWith(prefix)) {
                this.store.delete(k);
            }
        }
    }
    clear() {
        this.store.clear();
    }
    get size() {
        return this.store.size;
    }
}
/** Shared instance — import this in controllers */
exports.settingsCache = new SettingsCache(30000); // 30s default TTL
//# sourceMappingURL=settingsCache.js.map