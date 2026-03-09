export interface ImportPreviewResult {
    totalRows: number;
    previewRows: Record<string, string>[];
    detectedColumns: string[];
    suggestedMapping: Record<string, string>;
    validationErrors: {
        row: number;
        field: string;
        message: string;
    }[];
}
export interface ImportCommitOptions {
    mode: 'create_only' | 'upsert';
    dedupeField: 'userId' | 'phone' | 'email';
    mapping: Record<string, string>;
    rows: Record<string, string>[];
}
export interface ImportCommitResult {
    created: number;
    updated: number;
    skipped: number;
    errors: {
        row: number;
        message: string;
    }[];
}
export declare function parseFileBuffer(buffer: Buffer, mimetype: string): Promise<{
    rows: Record<string, string>[];
    columns: string[];
}>;
export declare function generatePreview(rows: Record<string, string>[], detectedColumns: string[]): Promise<ImportPreviewResult>;
export declare function commitImport(opts: ImportCommitOptions, _adminId: string): Promise<ImportCommitResult>;
export declare function exportStudents(filters: Record<string, unknown>, format: 'csv' | 'xlsx'): Promise<Buffer>;
export declare function generateTemplateXlsx(): Promise<Buffer>;
//# sourceMappingURL=studentImportExportService.d.ts.map