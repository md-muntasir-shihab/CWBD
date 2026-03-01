import { ApiListResponse, BackupRow, DueRow, ExpenseRow, FinanceSummary, NoticeRow, PlanRow, StaffPayoutRow, StudentDashboardProfile, StudentRow, TicketRow } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
const ADMIN_PATH = process.env.NEXT_PUBLIC_ADMIN_PATH || 'campusway-secure-admin';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH';

async function request<T>(url: string, token?: string, method: HttpMethod = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed (${res.status})`);
  }

  return (await res.json()) as T;
}

export async function getAdminStudents(token: string): Promise<ApiListResponse<StudentRow>> {
  return request<ApiListResponse<StudentRow>>(`/api/${ADMIN_PATH}/students?limit=20`, token);
}

export async function getAdminPlans(token: string): Promise<ApiListResponse<PlanRow>> {
  return request<ApiListResponse<PlanRow>>(`/api/${ADMIN_PATH}/subscription-plans`, token);
}

export async function getFinanceSummary(token: string): Promise<FinanceSummary> {
  return request<FinanceSummary>(`/api/${ADMIN_PATH}/finance/summary`, token);
}

export async function getExpenses(token: string): Promise<ApiListResponse<ExpenseRow>> {
  return request<ApiListResponse<ExpenseRow>>(`/api/${ADMIN_PATH}/expenses?limit=20`, token);
}

export async function getStaffPayouts(token: string): Promise<ApiListResponse<StaffPayoutRow>> {
  return request<ApiListResponse<StaffPayoutRow>>(`/api/${ADMIN_PATH}/staff-payouts?limit=20`, token);
}

export async function getDues(token: string): Promise<ApiListResponse<DueRow>> {
  return request<ApiListResponse<DueRow>>(`/api/${ADMIN_PATH}/dues?status=due&limit=20`, token);
}

export async function getNotices(token: string): Promise<ApiListResponse<NoticeRow>> {
  return request<ApiListResponse<NoticeRow>>(`/api/${ADMIN_PATH}/notices?limit=20`, token);
}

export async function getSupportTickets(token: string): Promise<ApiListResponse<TicketRow>> {
  return request<ApiListResponse<TicketRow>>(`/api/${ADMIN_PATH}/support-tickets?limit=20`, token);
}

export async function getBackups(token: string): Promise<ApiListResponse<BackupRow>> {
  return request<ApiListResponse<BackupRow>>(`/api/${ADMIN_PATH}/backups?limit=20`, token);
}

export async function runBackup(token: string, type: 'full' | 'incremental' = 'incremental', storage: 'local' | 's3' | 'both' = 'local'): Promise<{ message?: string }> {
  return request<{ message?: string }>(`/api/${ADMIN_PATH}/backups/run`, token, 'POST', { type, storage });
}

export async function createSupportTicket(token: string, payload: { subject: string; message: string; priority?: 'low' | 'medium' | 'high' }): Promise<{ message?: string }> {
  return request<{ message?: string }>(`/api/student/support-tickets`, token, 'POST', payload);
}

export async function getStudentProfile(token: string): Promise<StudentDashboardProfile> {
  return request<StudentDashboardProfile>(`/api/student/dashboard-profile`, token);
}

export async function getStudentNotices(token: string): Promise<ApiListResponse<NoticeRow>> {
  return request<ApiListResponse<NoticeRow>>(`/api/student/notices`, token);
}

export async function getStudentSupportTickets(token: string): Promise<ApiListResponse<TicketRow>> {
  return request<ApiListResponse<TicketRow>>(`/api/student/support-tickets`, token);
}
