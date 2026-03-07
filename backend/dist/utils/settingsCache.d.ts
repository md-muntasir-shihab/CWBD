/**
 * Simple in-memory TTL cache for public settings and /api/home response.
 * Safe invalidation after admin saves.
 */
declare class SettingsCache {
    private store;
    private defaultTtlMs;
    constructor(defaultTtlMs?: number);
    get<T>(key: string): T | null;
    set<T>(key: string, value: T, ttlMs?: number): void;
    invalidate(key: string): void;
    invalidatePrefix(prefix: string): void;
    clear(): void;
    get size(): number;
}
/** Shared instance — import this in controllers */
export declare const settingsCache: SettingsCache;
export {};
//# sourceMappingURL=settingsCache.d.ts.map