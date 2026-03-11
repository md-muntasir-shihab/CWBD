/**
 * Test-Send Service
 *
 * Dedicated service for admin test-send operations: preview, send, logs, retry.
 * Reuses provider/template primitives from notificationProviderService
 * but avoids the full campaign orchestration pipeline.
 */
export type TestSendChannel = 'sms' | 'email';
export type RecipientMode = 'student' | 'guardian' | 'student_guardian' | 'custom_phone' | 'custom_email';
export type MessageMode = 'template' | 'custom';
export interface TestSendPayload {
    channel: TestSendChannel;
    messageMode: MessageMode;
    templateKey?: string;
    customBody?: string;
    customSubject?: string;
    placeholders?: Record<string, string>;
    recipientMode: RecipientMode;
    studentId?: string;
    customPhone?: string;
    customEmail?: string;
    providerId?: string;
    logOnly?: boolean;
    adminId: string;
}
export interface PreviewResult {
    renderedBody: string;
    renderedSubject?: string;
    recipientDisplay: string;
    resolvedTo: string;
    providerName: string;
    channel: TestSendChannel;
    charCount: number;
    smsSegments?: number;
    estimatedCostBDT: number;
    duplicateWarning?: string;
}
export interface SendResultResponse {
    success: boolean;
    logId: string;
    jobId: string;
    status: 'sent' | 'failed' | 'logged';
    providerMessageId?: string;
    providerName: string;
    resolvedTo: string;
    costAmount: number;
    errorMessage?: string;
    financeSynced: boolean;
    timestamp: string;
}
interface PresetScenario {
    key: string;
    label: string;
    channel: TestSendChannel;
    templateKey?: string;
    recipientMode: RecipientMode;
    messageMode: MessageMode;
    placeholders?: Record<string, string>;
}
export declare function getTestSendMeta(): Promise<{
    providers: {
        _id: string;
        type: import("../models/NotificationProvider").NotificationProviderType;
        provider: import("../models/NotificationProvider").NotificationProviderName;
        displayName: string;
        isEnabled: boolean;
    }[];
    templates: {
        _id: string;
        templateKey: string;
        channel: import("../models/NotificationTemplate").NotificationChannel;
        subject: string | undefined;
        body: string;
        category: import("../models/NotificationTemplate").NotificationTemplateCategory;
        placeholdersAllowed: string[];
        isEnabled: boolean;
    }[];
    costConfig: {
        smsCostPerMessageBDT: number;
        emailCostPerMessageBDT: number;
    };
    defaults: {
        testSendPhoneNumber: string | undefined;
        testSendEmail: string | undefined;
    };
    autoSyncCostToFinance: boolean;
    presetScenarios: PresetScenario[];
}>;
export declare function previewTestSend(payload: TestSendPayload): Promise<PreviewResult>;
export declare function executeTestSend(payload: TestSendPayload): Promise<SendResultResponse>;
export declare function getTestSendLogs(params: {
    page?: number;
    limit?: number;
    channel?: string;
    status?: string;
}): Promise<{
    logs: {
        _id: string;
        jobId: string;
        channel: "email" | "sms";
        recipientMode: string;
        recipientDisplay: string;
        to: string;
        providerUsed: string;
        status: import("../models/NotificationDeliveryLog").DeliveryLogStatus;
        messageMode: string;
        templateKey: undefined;
        renderedPreview: string | undefined;
        costAmount: number;
        retryCount: number;
        errorMessage: string | undefined;
        financeSynced: boolean;
        createdAt: string;
    }[];
    total: number;
    page: number;
    limit: number;
}>;
export declare function retryTestSendLog(logId: string, adminId: string): Promise<SendResultResponse>;
export declare function searchStudentsForTestSend(q: string): Promise<{
    students: {
        _id: string;
        full_name: string;
        phone: string;
        email: string;
        guardian_phone: string;
        guardian_email: string;
    }[];
}>;
export {};
//# sourceMappingURL=testSendService.d.ts.map