/**
 * Data Hub Service — Category-wise import/export extensions
 *
 * Builds on top of studentImportExportService to provide:
 * - Guardian-only export (phone + email + name)
 * - Phone-only / email-only list export
 * - Audience segment export
 * - Result recipients export
 * - Failed delivery export
 * - Copy-ready TXT output
 * - Manual send helper list generation
 * - Import/export audit logging
 */
import mongoose from 'mongoose';
import type { ImportExportCategory, ImportExportFormat } from '../models/ImportExportLog';
export interface ExportOptions {
    category: ImportExportCategory;
    format: ImportExportFormat;
    filters?: Record<string, unknown>;
    selectedFields?: string[];
    adminId: string;
}
export interface ExportResult {
    buffer?: Buffer;
    text?: string;
    data?: Record<string, unknown>[];
    fileName: string;
    mimeType: string;
    rowCount: number;
}
export declare function exportPhoneList(opts: ExportOptions): Promise<ExportResult>;
export declare function exportEmailList(opts: ExportOptions): Promise<ExportResult>;
export declare function exportGuardianList(opts: ExportOptions): Promise<ExportResult>;
export declare function exportAudienceSegment(opts: ExportOptions & {
    groupId: string;
}): Promise<ExportResult>;
export declare function exportFailedDeliveries(opts: ExportOptions & {
    jobId?: string;
}): Promise<ExportResult>;
export declare function exportManualSendList(opts: ExportOptions & {
    channel: 'sms' | 'email';
    includeGuardians?: boolean;
}): Promise<ExportResult>;
export declare function getImportExportHistory(opts: {
    direction?: 'import' | 'export';
    category?: string;
    page?: number;
    limit?: number;
}): Promise<{
    logs: (mongoose.FlattenMaps<import("../models/ImportExportLog").IImportExportLog> & Required<{
        _id: mongoose.Types.ObjectId;
    }> & {
        __v: number;
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}>;
//# sourceMappingURL=dataHubService.d.ts.map