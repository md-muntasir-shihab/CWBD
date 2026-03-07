import api from '../services/api';

// Students
export const getStudentsList = (filters: {
  q?: string; status?: string; group?: string; page?: number; limit?: number;
  profileScoreMin?: number; subscriptionStatus?: string; expiringDays?: number;
}) => api.get('/admin/students-v2', { params: filters }).then(r => r.data);

export const getStudentById = (id: string) =>
  api.get(`/admin/students-v2/${id}`).then(r => r.data);

export const updateStudent = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/students-v2/${id}`, data).then(r => r.data);

export const suspendStudent = (id: string) =>
  api.post(`/admin/students-v2/${id}/suspend`).then(r => r.data);

export const activateStudent = (id: string) =>
  api.post(`/admin/students-v2/${id}/activate`).then(r => r.data);

export const resetStudentPassword = (id: string, data: { newPassword: string }) =>
  api.post(`/admin/students-v2/${id}/reset-password`, data).then(r => r.data);

export const bulkDeleteStudents = (ids: string[]) =>
  api.post('/admin/students-v2/bulk-delete', { ids }).then(r => r.data);

export const bulkUpdateStudents = (ids: string[], update: Record<string, unknown>) =>
  api.post('/admin/students-v2/bulk-update', { ids, update }).then(r => r.data);

export const exportStudents = (filters: Record<string, unknown>, format: 'csv' | 'xlsx') =>
  api.get('/admin/students-v2/export', { params: { ...filters, format }, responseType: 'blob' }).then(r => r.data as Blob);

export const importStudentsPreview = (formData: FormData) =>
  api.post('/admin/students-v2/import/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data);

export const importStudentsCommit = (data: {
  mode: string; dedupeField: string; mapping: Record<string, string>; rows: Record<string, string>[];
}) => api.post('/admin/students-v2/import/commit', data).then(r => r.data);

// Groups
export const getStudentGroups = (q?: string) =>
  api.get('/admin/student-groups', { params: { q } }).then(r => r.data);

export const createStudentGroup = (data: Record<string, unknown>) =>
  api.post('/admin/student-groups', data).then(r => r.data);

export const updateStudentGroup = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/student-groups/${id}`, data).then(r => r.data);

export const deleteStudentGroup = (id: string) =>
  api.delete(`/admin/student-groups/${id}`).then(r => r.data);

export const addGroupMembers = (groupId: string, studentIds: string[]) =>
  api.post(`/admin/student-groups/${groupId}/members/add`, { studentIds }).then(r => r.data);

export const removeGroupMembers = (groupId: string, studentIds: string[]) =>
  api.post(`/admin/student-groups/${groupId}/members/remove`, { studentIds }).then(r => r.data);

// Subscriptions
export const getSubscriptions = (filters: { status?: string; q?: string; page?: number; limit?: number }) =>
  api.get('/admin/subscriptions-v2', { params: filters }).then(r => r.data);

export const assignSubscription = (studentId: string, data: { planId: string; startDate?: string; notes?: string }) =>
  api.post(`/admin/subscriptions-v2/users/${studentId}/assign`, data).then(r => r.data);

export const extendSubscription = (studentId: string, days: number, notes?: string) =>
  api.post(`/admin/subscriptions-v2/users/${studentId}/extend`, { days, notes }).then(r => r.data);

export const expireSubscriptionNow = (studentId: string) =>
  api.post(`/admin/subscriptions-v2/users/${studentId}/expire-now`).then(r => r.data);

export const toggleAutoRenew = (studentId: string) =>
  api.post(`/admin/subscriptions-v2/users/${studentId}/toggle-auto-renew`).then(r => r.data);

// Notification Providers
export const getProviders = () =>
  api.get('/admin/notification-providers').then(r => r.data);

export const createProvider = (data: Record<string, unknown>) =>
  api.post('/admin/notification-providers', data).then(r => r.data);

export const updateProvider = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/notification-providers/${id}`, data).then(r => r.data);

export const deleteProvider = (id: string) =>
  api.delete(`/admin/notification-providers/${id}`).then(r => r.data);

export const testProvider = (id: string, studentId: string) =>
  api.post(`/admin/notification-providers/${id}/test-send`, { studentId }).then(r => r.data);

// Notification Templates
export const getTemplates = () =>
  api.get('/admin/notification-templates').then(r => r.data);

export const createTemplate = (data: Record<string, unknown>) =>
  api.post('/admin/notification-templates', data).then(r => r.data);

export const updateTemplate = (id: string, data: Record<string, unknown>) =>
  api.put(`/admin/notification-templates/${id}`, data).then(r => r.data);

export const deleteTemplate = (id: string) =>
  api.delete(`/admin/notification-templates/${id}`).then(r => r.data);

// Send Notification
export const sendNotification = (data: Record<string, unknown>) =>
  api.post('/admin/notifications-v2/send', data).then(r => r.data);

export const getNotificationJobs = (page?: number) =>
  api.get('/admin/notifications-v2/jobs', { params: { page } }).then(r => r.data);

export const getNotificationLogs = (filters: Record<string, unknown>) =>
  api.get('/admin/notifications-v2/logs', { params: filters }).then(r => r.data);

export const retryFailedJob = (jobId: string) =>
  api.post(`/admin/notifications-v2/jobs/${jobId}/retry-failed`).then(r => r.data);

// Contact Timeline
export const getContactTimeline = (studentId: string) =>
  api.get(`/admin/student-contact-timeline/${studentId}`).then(r => r.data);

export const addTimelineEntry = (studentId: string, data: { type: string; content: string; linkedId?: string }) =>
  api.post(`/admin/student-contact-timeline/${studentId}`, data).then(r => r.data);

export const deleteTimelineEntry = (studentId: string, entryId: string) =>
  api.delete(`/admin/student-contact-timeline/${studentId}/${entryId}`).then(r => r.data);

// Student Settings
export const getStudentSettings = () =>
  api.get('/admin/student-settings').then(r => r.data);

export const updateStudentSettings = (data: Record<string, unknown>) =>
  api.put('/admin/student-settings', data).then(r => r.data);
