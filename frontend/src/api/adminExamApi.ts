import axios from "axios";

const api = axios.create({ baseURL: "/api/admin" });

export const listAdminExams = () => api.get("/exams").then((r) => r.data);
export const createAdminExam = (payload: any) => api.post("/exams", payload).then((r) => r.data);
export const updateAdminExam = (id: string, payload: any) => api.put(`/exams/${id}`, payload).then((r) => r.data);
export const listAdminExamQuestions = (id: string) => api.get(`/exams/${id}/questions`).then((r) => r.data);
export const createAdminQuestion = (id: string, payload: any) => api.post(`/exams/${id}/questions`, payload).then((r) => r.data);
export const getAdminResults = (id: string) => api.get(`/exams/${id}/results`).then((r) => r.data);
