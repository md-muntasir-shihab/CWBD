/* ─── Notification Campaign & Data Hub API Layer ──────────── */
import api from '../services/api';

// ─── Types ───────────────────────────────────────────────
export interface CampaignListItem {
  _id: string;
  campaignName: string;
  audienceType: string;
  channelType: string;
  status: string;
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
  estimatedCost?: number;
  actualCost?: number;
  createdAt: string;
}

export interface CampaignDetail extends CampaignListItem {
  audienceRef?: string;
  templateIds?: string[];
  customBody?: string;
  guardianTargeted?: boolean;
  triggerKey?: string;
  quietHoursApplied?: boolean;
  completedAt?: string;
}

export interface CampaignPreview {
  recipientCount: number;
  estimatedCost: number;
  sampleRendered?: { subject?: string; body: string };
  channelBreakdown?: { sms: number; email: number };
}

export interface DeliveryLog {
  _id: string;
  jobId: string;
  userId: string;
  channel: string;
  status: string;
  providerResponse?: string;
  costAmount: number;
  retryCount: number;
  guardianTargeted: boolean;
  createdAt: string;
}

export interface NotificationTemplate {
  _id: string;
  templateKey: string;
  name: string;
  channel: string;
  subject?: string;
  body: string;
  category?: string;
  versionNo?: number;
  isActive: boolean;
}

export interface NotificationSettings {
  _id?: string;
  dailySmsLimit: number;
  dailyEmailLimit: number;
  monthlySmsBudgetBDT: number;
  monthlyEmailBudgetBDT: number;
  quietHours: { enabled: boolean; startHour: number; endHour: number; timezone: string };
  duplicatePreventionWindowMinutes: number;
  maxRetryCount: number;
  retryDelayMinutes: number;
  triggerToggles: { triggerKey: string; enabled: boolean; channels: string[]; guardianIncluded: boolean }[];
  subscriptionReminderDays: number[];
  resultPublishAutoSend: boolean;
  testSendPhone?: string;
  testSendEmail?: string;
  autoSyncCostToFinance: boolean;
}

export interface ExportHistoryItem {
  _id: string;
  direction: 'import' | 'export';
  category: string;
  format: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  performedByName?: string;
  createdAt: string;
}

type Params = Record<string, string | number | boolean | undefined>;

// ─── Campaigns ──────────────────────────────────────────
export const listCampaigns = (params: Params = {}) =>
  api.get('/admin/notifications/campaigns', { params }).then(r => r.data);

export const getCampaign = (id: string) =>
  api.get(`/admin/notifications/campaigns/${id}`).then(r => r.data);

export const previewCampaign = (data: Record<string, unknown>) =>
  api.post('/admin/notifications/campaigns/preview', data).then(r => r.data);

export const sendCampaign = (data: Record<string, unknown>) =>
  api.post('/admin/notifications/campaigns/send', data).then(r => r.data);

export const retryCampaign = (id: string) =>
  api.post(`/admin/notifications/campaigns/${id}/retry`).then(r => r.data);

// ─── Delivery Logs ──────────────────────────────────────
export const getDeliveryLogs = (params: Params = {}) =>
  api.get('/admin/notifications/delivery-logs', { params }).then(r => r.data);

// ─── Templates ──────────────────────────────────────────
export const listTemplates = (params: Params = {}) =>
  api.get('/admin/notifications/templates', { params }).then(r => r.data);

export const createTemplate = (data: Record<string, unknown>) =>
  api.post('/admin/notifications/templates', data).then(r => r.data);

export const updateTemplate = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/notifications/templates/${id}`, data).then(r => r.data);

// ─── Settings ───────────────────────────────────────────
export const getNotificationSettings = () =>
  api.get('/admin/notifications/settings').then(r => r.data);

export const updateNotificationSettings = (data: Partial<NotificationSettings>) =>
  api.put('/admin/notifications/settings', data).then(r => r.data);

// ─── Data Hub ───────────────────────────────────────────
export const exportDataHub = (data: { category: string; format: string; filters?: Record<string, unknown> }) =>
  api.post('/admin/data-hub/export', data).then(r => r.data);

export const getExportHistory = (params: Params = {}) =>
  api.get('/admin/data-hub/history', { params }).then(r => r.data);

// ─── Trigger (internal) ────────────────────────────────
export const triggerNotification = (triggerKey: string) =>
  api.post('/admin/notifications/trigger', { triggerKey }).then(r => r.data);
