/* ─── Notification Test-Send API Layer ──────────────────── */
import api from '../services/api';

// ─── Types ───────────────────────────────────────────────

export type TestSendChannel = 'sms' | 'email';
export type RecipientMode = 'student' | 'guardian' | 'student_guardian' | 'custom_phone' | 'custom_email';
export type MessageMode = 'template' | 'custom';

export interface TestSendProvider {
  _id: string;
  type: 'sms' | 'email';
  provider: string;
  displayName: string;
  isEnabled: boolean;
}

export interface TestSendTemplate {
  _id: string;
  templateKey: string;
  channel: string;
  subject?: string;
  body: string;
  category?: string;
  placeholdersAllowed: string[];
  isEnabled: boolean;
}

export interface TestSendMeta {
  providers: TestSendProvider[];
  templates: TestSendTemplate[];
  costConfig: { smsCostPerMessageBDT: number; emailCostPerMessageBDT: number };
  defaults: { testSendPhoneNumber?: string; testSendEmail?: string };
  autoSyncCostToFinance: boolean;
  presetScenarios: TestSendPreset[];
}

export interface TestSendPreset {
  key: string;
  label: string;
  channel: TestSendChannel;
  templateKey?: string;
  recipientMode: RecipientMode;
  messageMode: MessageMode;
  placeholders?: Record<string, string>;
}

export interface TestSendPreviewRequest {
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
}

export interface TestSendPreviewResult {
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

export interface TestSendRequest extends TestSendPreviewRequest {
  logOnly?: boolean;
}

export interface TestSendResult {
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

export interface TestSendLogItem {
  _id: string;
  jobId: string;
  channel: 'sms' | 'email';
  recipientMode: string;
  recipientDisplay: string;
  to: string;
  providerUsed: string;
  status: 'sent' | 'failed' | 'queued';
  messageMode: string;
  templateKey?: string;
  renderedPreview?: string;
  costAmount: number;
  retryCount: number;
  errorMessage?: string;
  financeSynced?: boolean;
  createdAt: string;
}

export interface TestSendLogsResponse {
  logs: TestSendLogItem[];
  total: number;
  page: number;
  limit: number;
}

// ─── API Functions ──────────────────────────────────────

const BASE = '/admin/notifications/test-send';

export const getTestSendMeta = () =>
  api.get<TestSendMeta>(`${BASE}/meta`).then(r => r.data);

export const previewTestSend = (data: TestSendPreviewRequest) =>
  api.post<TestSendPreviewResult>(`${BASE}/preview`, data).then(r => r.data);

export const executeTestSend = (data: TestSendRequest) =>
  api.post<TestSendResult>(`${BASE}/send`, data).then(r => r.data);

export const getTestSendLogs = (params: Record<string, string | number | undefined> = {}) =>
  api.get<TestSendLogsResponse>(`${BASE}/logs`, { params }).then(r => r.data);

export const retryTestSend = (logId: string) =>
  api.post<TestSendResult>(`${BASE}/logs/${logId}/retry`).then(r => r.data);

export const searchStudents = (q: string) =>
  api.get<{ students: { _id: string; full_name: string; phone?: string; email?: string; guardian_phone?: string; guardian_email?: string }[] }>(
    `${BASE}/search-students`, { params: { q } }
  ).then(r => r.data);
