import { type HomeSettingsShape, type IHomeSettings } from '../models/HomeSettings';
export declare function mergeHomeSettings(current: HomeSettingsShape, patch: unknown): HomeSettingsShape;
export declare function ensureHomeSettings(): Promise<IHomeSettings>;
export declare function getHomeSettingsDefaults(): HomeSettingsShape;
export declare function isResettableSection(value: string): value is keyof HomeSettingsShape;
//# sourceMappingURL=homeSettingsService.d.ts.map