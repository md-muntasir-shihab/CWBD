import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
    CreditCard,
    Download,
    Edit3,
    FileSpreadsheet,
    GraduationCap,
    ListOrdered,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    Upload,
} from 'lucide-react';
import {
    listAdminExams,
    getAdminExam,
    createAdminExam,
    updateAdminExam,
    deleteAdminExam,
    listAdminExamQuestions,
    createAdminQuestion,
    updateAdminQuestion,
    deleteAdminQuestion,
    getAdminExamResults,
    publishExamResults,
    listAdminPayments,
    verifyPayment,
    templateUrls,
} from '../../../api/adminExamApi';
import {
    adminDownloadExamResultImportTemplate,
    adminExportExamReport,
    adminExportExamResults,
    adminImportExamResultsFile,
    adminGetExams,
    type AdminExamCard,
} from '../../../services/api';

type AdminTab = 'list' | 'create' | 'edit' | 'questions' | 'results' | 'payments';

function saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
}

const defaultExamFields: Record<string, unknown> = {
    title: '', title_bn: '', description: '', description_bn: '',
    subject: '', examCategory: '',
    durationMinutes: 60,
    examWindowStartUTC: '', examWindowEndUTC: '',
    paymentRequired: false, priceBDT: 0,
    subscriptionRequired: false, subscriptionPlanId: '',
    attemptLimit: 1, allowReAttempt: false,
    negativeMarkingEnabled: false, negativePerWrong: 0,
    answerChangeLimit: null,
    shuffleQuestions: false, shuffleOptions: false,
    showTimer: true, showQuestionPalette: true, autoSubmitOnTimeout: true,
    solutionsEnabled: true, solutionReleaseRule: 'after_result_publish',
    resultPublishAtUTC: '',
    status: 'draft',
};

const defaultQuestionFields: Record<string, unknown> = {
    question_en: '', question_bn: '',
    optionA_en: '', optionA_bn: '', optionB_en: '', optionB_bn: '',
    optionC_en: '', optionC_bn: '', optionD_en: '', optionD_bn: '',
    correctKey: 'A', marks: 1, negativeMarks: 0,
    explanation_en: '', explanation_bn: '',
    questionImageUrl: '', explanationImageUrl: '',
    orderIndex: 0,
};

export function AdminExamsPage() {
    const qc = useQueryClient();
    const [tab, setTab] = useState<AdminTab>('list');
    const [selectedExamId, setSelectedExamId] = useState('');
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState<Record<string, unknown>>({ ...defaultExamFields });
    const [questionForm, setQuestionForm] = useState<Record<string, unknown>>({ ...defaultQuestionFields });

    // --- Legacy state (kept for result import/export) ---
    const [groupId, setGroupId] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);

    // --- Queries ---
    const examsQuery = useQuery({ queryKey: ['admin-exams'], queryFn: listAdminExams });
    const questionsQuery = useQuery({
        queryKey: ['admin-exam-questions', selectedExamId],
        queryFn: () => listAdminExamQuestions(selectedExamId),
        enabled: Boolean(selectedExamId) && tab === 'questions',
    });
    const resultsQuery = useQuery({
        queryKey: ['admin-exam-results', selectedExamId],
        queryFn: () => getAdminExamResults(selectedExamId),
        enabled: Boolean(selectedExamId) && tab === 'results',
    });
    const paymentsQuery = useQuery({
        queryKey: ['admin-payments'],
        queryFn: listAdminPayments,
        enabled: tab === 'payments',
    });

    // Legacy exam list for import/export
    const legacyExamsQuery = useQuery({
        queryKey: ['admin', 'exams', 'workspace'],
        queryFn: async () => (await adminGetExams({ limit: 200 })).data.exams || [],
        enabled: tab === 'results',
    });
    const legacyExams = useMemo<AdminExamCard[]>(
        () => (Array.isArray(legacyExamsQuery.data) ? legacyExamsQuery.data : []),
        [legacyExamsQuery.data],
    );

    // --- Mutations ---
    const createMutation = useMutation({
        mutationFn: (data: Record<string, unknown>) => createAdminExam(data),
        onSuccess: () => { toast.success('Exam created'); qc.invalidateQueries({ queryKey: ['admin-exams'] }); setTab('list'); },
        onError: () => toast.error('Failed to create exam'),
    });
    const updateMutation = useMutation({
        mutationFn: (data: Record<string, unknown>) => updateAdminExam(selectedExamId, data),
        onSuccess: () => { toast.success('Exam updated'); qc.invalidateQueries({ queryKey: ['admin-exams'] }); setTab('list'); },
        onError: () => toast.error('Failed to update exam'),
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdminExam(id),
        onSuccess: () => { toast.success('Exam deleted'); qc.invalidateQueries({ queryKey: ['admin-exams'] }); },
        onError: () => toast.error('Failed to delete exam'),
    });
    const createQuestionMutation = useMutation({
        mutationFn: (data: Record<string, unknown>) => createAdminQuestion(selectedExamId, data),
        onSuccess: () => { toast.success('Question added'); qc.invalidateQueries({ queryKey: ['admin-exam-questions', selectedExamId] }); setQuestionForm({ ...defaultQuestionFields }); },
        onError: () => toast.error('Failed to add question'),
    });
    const updateQuestionMutation = useMutation({
        mutationFn: ({ qId, data }: { qId: string; data: Record<string, unknown> }) => updateAdminQuestion(selectedExamId, qId, data),
        onSuccess: () => { toast.success('Question updated'); qc.invalidateQueries({ queryKey: ['admin-exam-questions', selectedExamId] }); setEditingQuestionId(null); setQuestionForm({ ...defaultQuestionFields }); },
        onError: () => toast.error('Failed to update question'),
    });
    const deleteQuestionMutation = useMutation({
        mutationFn: (qId: string) => deleteAdminQuestion(selectedExamId, qId),
        onSuccess: () => { toast.success('Question deleted'); qc.invalidateQueries({ queryKey: ['admin-exam-questions', selectedExamId] }); },
        onError: () => toast.error('Failed to delete question'),
    });
    const publishMutation = useMutation({
        mutationFn: () => publishExamResults(selectedExamId),
        onSuccess: () => { toast.success('Results published'); qc.invalidateQueries({ queryKey: ['admin-exam-results', selectedExamId] }); },
        onError: () => toast.error('Publish failed'),
    });
    const verifyPaymentMutation = useMutation({
        mutationFn: ({ id, notes }: { id: string; notes?: string }) => verifyPayment(id, notes),
        onSuccess: () => { toast.success('Payment verified'); qc.invalidateQueries({ queryKey: ['admin-payments'] }); },
        onError: () => toast.error('Verification failed'),
    });

    const exams: Array<Record<string, unknown>> = Array.isArray(examsQuery.data) ? examsQuery.data : [];
    const filteredExams = useMemo(() => {
        if (!searchTerm.trim()) return exams;
        const q = searchTerm.toLowerCase();
        return exams.filter((e) => String(e.title || '').toLowerCase().includes(q) || String(e.subject || '').toLowerCase().includes(q));
    }, [exams, searchTerm]);

    const openEdit = useCallback(async (examId: string) => {
        setSelectedExamId(examId);
        try {
            const data = await getAdminExam(examId);
            setFormData(data);
        } catch {
            toast.error('Failed to load exam');
        }
        setTab('edit');
    }, []);

    const openQuestions = useCallback((examId: string) => {
        setSelectedExamId(examId);
        setTab('questions');
    }, []);

    const openResults = useCallback((examId: string) => {
        setSelectedExamId(examId);
        setTab('results');
    }, []);

    const setField = (key: string, value: unknown) => setFormData((prev) => ({ ...prev, [key]: value }));
    const setQField = (key: string, value: unknown) => setQuestionForm((prev) => ({ ...prev, [key]: value }));

    // --- Legacy helpers ---
    const downloadTemplate = async (format: 'xlsx' | 'csv') => {
        if (!selectedExamId) { toast.error('Select an exam first.'); return; }
        try {
            setBusy(true);
            const response = await adminDownloadExamResultImportTemplate(selectedExamId, format);
            saveBlob(response.data as Blob, `exam_results_import_template.${format}`);
        } catch { toast.error('Failed to download template.'); } finally { setBusy(false); }
    };
    const importResults = async () => {
        if (!selectedExamId) { toast.error('Select an exam first.'); return; }
        if (!uploadFile) { toast.error('Choose a file to import.'); return; }
        try {
            setBusy(true);
            const response = await adminImportExamResultsFile(selectedExamId, uploadFile);
            const payload = response.data as { imported?: number; invalid?: number; errors?: Array<{ rowNo?: number; registration_id?: string; reason?: string }> };
            toast.success(`Import done. Imported: ${payload.imported || 0}, Invalid: ${payload.invalid || 0}`);
            if (Array.isArray(payload.errors) && payload.errors.length > 0) {
                const lines = ['rowNo,registration_id,reason', ...payload.errors.map((row) =>
                    `${Number(row.rowNo || 0)},"${String(row.registration_id || '').replace(/"/g, '""')}","${String(row.reason || '').replace(/"/g, '""')}"`
                )];
                saveBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), 'import_errors.csv');
            }
            setUploadFile(null);
        } catch { toast.error('Import failed.'); } finally { setBusy(false); }
    };
    const exportReport = async (format: 'xlsx' | 'csv' | 'pdf') => {
        if (!selectedExamId) { toast.error('Select an exam first.'); return; }
        try {
            setBusy(true);
            const response = await adminExportExamReport(selectedExamId, { format, groupId: groupId.trim() || undefined });
            saveBlob(response.data as Blob, `exam_report.${format}`);
        } catch { toast.error('Export failed.'); } finally { setBusy(false); }
    };
    const exportLegacyResult = async () => {
        if (!selectedExamId) { toast.error('Select an exam first.'); return; }
        try {
            setBusy(true);
            const response = await adminExportExamResults(selectedExamId);
            saveBlob(response.data as Blob, 'exam_results.xlsx');
        } catch { toast.error('Legacy export failed.'); } finally { setBusy(false); }
    };

    const renderFormField = (label: string, key: string, type: 'text' | 'number' | 'datetime-local' | 'select' | 'checkbox' | 'textarea' = 'text', options?: string[]) => (
        <label key={key} className="block">
            <span className="text-xs font-semibold text-text-muted dark:text-dark-text/65 uppercase tracking-wider">{label}</span>
            {type === 'checkbox' ? (
                <input type="checkbox" checked={Boolean(formData[key])} onChange={(e) => setField(key, e.target.checked)} className="ml-2 mt-1" />
            ) : type === 'textarea' ? (
                <textarea value={String(formData[key] ?? '')} onChange={(e) => setField(key, e.target.value)} className="admin-input mt-1" rows={3} />
            ) : type === 'select' ? (
                <select value={String(formData[key] ?? '')} onChange={(e) => setField(key, e.target.value)} className="admin-input mt-1">
                    {options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            ) : (
                <input type={type} value={type === 'number' ? Number(formData[key] ?? 0) : String(formData[key] ?? '')} onChange={(e) => setField(key, type === 'number' ? Number(e.target.value) : e.target.value)} className="admin-input mt-1" />
            )}
        </label>
    );

    // ═══════════════════════════════════════════════
    // TAB: EXAM LIST
    // ═══════════════════════════════════════════════
    if (tab === 'list') {
        return (
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-text dark:text-dark-text">Exam Management</h2>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setTab('payments')} className="btn-secondary">
                            <CreditCard className="mr-1.5 h-4 w-4" />Payments
                        </button>
                        <button type="button" onClick={() => { setFormData({ ...defaultExamFields }); setTab('create'); }} className="btn-primary">
                            <Plus className="mr-1.5 h-4 w-4" />Create Exam
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search exams..." className="admin-input pl-9" />
                </div>

                {examsQuery.isLoading ? <p className="text-sm text-text-muted">Loading exams...</p> : null}
                {examsQuery.isError ? (
                    <div className="flex items-center gap-2 text-sm text-danger">
                        <AlertTriangle className="h-4 w-4" />Failed to load exams.
                        <button type="button" onClick={() => examsQuery.refetch()} className="btn-ghost"><RefreshCw className="h-3.5 w-3.5" /></button>
                    </div>
                ) : null}

                <div className="space-y-2">
                    {filteredExams.map((exam) => (
                        <div key={String(exam._id)} className="admin-panel-bg flex flex-wrap items-center gap-3 rounded-xl p-4">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-text dark:text-dark-text truncate">{String(exam.title)}</p>
                                <p className="text-xs text-text-muted dark:text-dark-text/60">{String(exam.subject || '')} &middot; {String(exam.status || 'draft')}</p>
                            </div>
                            <div className="flex gap-1.5">
                                <button type="button" onClick={() => openEdit(String(exam._id))} className="btn-ghost" title="Edit">
                                    <Edit3 className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => openQuestions(String(exam._id))} className="btn-ghost" title="Questions">
                                    <ListOrdered className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => openResults(String(exam._id))} className="btn-ghost" title="Results">
                                    <GraduationCap className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { if (window.confirm('Delete this exam?')) deleteMutation.mutate(String(exam._id)); }}
                                    className="btn-ghost text-danger"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {!examsQuery.isLoading && filteredExams.length === 0 ? (
                        <p className="text-center text-sm text-text-muted dark:text-dark-text/60 py-8">No exams found.</p>
                    ) : null}
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // TAB: CREATE / EDIT EXAM
    // ═══════════════════════════════════════════════
    if (tab === 'create' || tab === 'edit') {
        const isEdit = tab === 'edit';
        const saving = createMutation.isPending || updateMutation.isPending;
        return (
            <div className="space-y-4">
                <button type="button" onClick={() => setTab('list')} className="btn-ghost">
                    <ChevronLeft className="mr-1 h-4 w-4" />{isEdit ? 'Back to List' : 'Cancel'}
                </button>
                <h2 className="text-xl font-bold text-text dark:text-dark-text">{isEdit ? 'Edit Exam' : 'Create Exam'}</h2>

                <div className="admin-panel-bg rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Basic Info</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {renderFormField('Title (EN)', 'title')}
                        {renderFormField('Title (BN)', 'title_bn')}
                        {renderFormField('Subject', 'subject')}
                        {renderFormField('Category', 'examCategory')}
                        {renderFormField('Duration (min)', 'durationMinutes', 'number')}
                        {renderFormField('Status', 'status', 'select', ['draft', 'live', 'upcoming', 'ended', 'archived'])}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {renderFormField('Description (EN)', 'description', 'textarea')}
                        {renderFormField('Description (BN)', 'description_bn', 'textarea')}
                    </div>
                </div>

                <div className="admin-panel-bg rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Schedule & Access</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {renderFormField('Window Start (UTC)', 'examWindowStartUTC', 'datetime-local')}
                        {renderFormField('Window End (UTC)', 'examWindowEndUTC', 'datetime-local')}
                        {renderFormField('Attempt Limit', 'attemptLimit', 'number')}
                        {renderFormField('Result Publish At (UTC)', 'resultPublishAtUTC', 'datetime-local')}
                    </div>
                    <div className="flex flex-wrap gap-6">
                        {renderFormField('Allow Re-attempt', 'allowReAttempt', 'checkbox')}
                        {renderFormField('Payment Required', 'paymentRequired', 'checkbox')}
                        {renderFormField('Subscription Required', 'subscriptionRequired', 'checkbox')}
                    </div>
                    {formData.paymentRequired ? renderFormField('Price (BDT)', 'priceBDT', 'number') : null}
                    {formData.subscriptionRequired ? renderFormField('Subscription Plan ID', 'subscriptionPlanId') : null}
                </div>

                <div className="admin-panel-bg rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted">Rules</h3>
                    <div className="flex flex-wrap gap-6">
                        {renderFormField('Negative Marking', 'negativeMarkingEnabled', 'checkbox')}
                        {renderFormField('Shuffle Questions', 'shuffleQuestions', 'checkbox')}
                        {renderFormField('Shuffle Options', 'shuffleOptions', 'checkbox')}
                        {renderFormField('Show Timer', 'showTimer', 'checkbox')}
                        {renderFormField('Show Palette', 'showQuestionPalette', 'checkbox')}
                        {renderFormField('Auto-submit on Timeout', 'autoSubmitOnTimeout', 'checkbox')}
                        {renderFormField('Solutions Enabled', 'solutionsEnabled', 'checkbox')}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {formData.negativeMarkingEnabled ? renderFormField('Negative Per Wrong', 'negativePerWrong', 'number') : null}
                        {renderFormField('Answer Change Limit', 'answerChangeLimit', 'number')}
                        {renderFormField('Solution Release Rule', 'solutionReleaseRule', 'select', ['after_result_publish', 'immediately', 'never'])}
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={saving}
                        onClick={() => isEdit ? updateMutation.mutate(formData) : createMutation.mutate(formData)}
                        className="btn-primary"
                    >
                        {saving ? 'Saving...' : isEdit ? 'Update Exam' : 'Create Exam'}
                    </button>
                    <button type="button" onClick={() => setTab('list')} className="btn-secondary">Cancel</button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // TAB: QUESTIONS
    // ═══════════════════════════════════════════════
    if (tab === 'questions') {
        const questions: Array<Record<string, unknown>> = Array.isArray(questionsQuery.data) ? questionsQuery.data : [];
        const qSaving = createQuestionMutation.isPending || updateQuestionMutation.isPending;

        return (
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <button type="button" onClick={() => setTab('list')} className="btn-ghost">
                        <ChevronLeft className="mr-1 h-4 w-4" />Back
                    </button>
                    <div className="flex gap-2">
                        <a href={templateUrls.questions(selectedExamId)} className="btn-secondary">
                            <Download className="mr-1.5 h-4 w-4" />Template
                        </a>
                    </div>
                </div>
                <h2 className="text-xl font-bold text-text dark:text-dark-text">Questions ({questions.length})</h2>

                {/* Question form */}
                <div className="admin-panel-bg rounded-xl p-5 space-y-3">
                    <h3 className="text-sm font-bold text-text-muted">{editingQuestionId ? 'Edit Question' : 'Add Question'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <label className="block"><span className="text-xs font-semibold text-text-muted uppercase">Question (EN)</span>
                            <textarea value={String(questionForm.question_en ?? '')} onChange={(e) => setQField('question_en', e.target.value)} className="admin-input mt-1" rows={2} />
                        </label>
                        <label className="block"><span className="text-xs font-semibold text-text-muted uppercase">Question (BN)</span>
                            <textarea value={String(questionForm.question_bn ?? '')} onChange={(e) => setQField('question_bn', e.target.value)} className="admin-input mt-1" rows={2} />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(['A', 'B', 'C', 'D'] as const).map((key) => (
                            <label key={key} className="block">
                                <span className="text-xs font-semibold text-text-muted uppercase">Option {key} (EN)</span>
                                <input value={String(questionForm[`option${key}_en`] ?? '')} onChange={(e) => setQField(`option${key}_en`, e.target.value)} className="admin-input mt-1" />
                            </label>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <label className="block"><span className="text-xs font-semibold text-text-muted uppercase">Correct Key</span>
                            <select value={String(questionForm.correctKey ?? 'A')} onChange={(e) => setQField('correctKey', e.target.value)} className="admin-input mt-1">
                                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                            </select>
                        </label>
                        <label className="block"><span className="text-xs font-semibold text-text-muted uppercase">Marks</span>
                            <input type="number" value={Number(questionForm.marks ?? 1)} onChange={(e) => setQField('marks', Number(e.target.value))} className="admin-input mt-1" />
                        </label>
                        <label className="block"><span className="text-xs font-semibold text-text-muted uppercase">Neg. Marks</span>
                            <input type="number" step="0.25" value={Number(questionForm.negativeMarks ?? 0)} onChange={(e) => setQField('negativeMarks', Number(e.target.value))} className="admin-input mt-1" />
                        </label>
                        <label className="block"><span className="text-xs font-semibold text-text-muted uppercase">Order Index</span>
                            <input type="number" value={Number(questionForm.orderIndex ?? 0)} onChange={(e) => setQField('orderIndex', Number(e.target.value))} className="admin-input mt-1" />
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={qSaving}
                            onClick={() => {
                                if (editingQuestionId) {
                                    updateQuestionMutation.mutate({ qId: editingQuestionId, data: questionForm });
                                } else {
                                    createQuestionMutation.mutate(questionForm);
                                }
                            }}
                            className="btn-primary"
                        >
                            {qSaving ? 'Saving...' : editingQuestionId ? 'Update' : 'Add Question'}
                        </button>
                        {editingQuestionId ? (
                            <button type="button" onClick={() => { setEditingQuestionId(null); setQuestionForm({ ...defaultQuestionFields }); }} className="btn-secondary">Cancel</button>
                        ) : null}
                    </div>
                </div>

                {/* Question list */}
                {questionsQuery.isLoading ? <p className="text-sm text-text-muted">Loading questions...</p> : null}
                <div className="space-y-2">
                    {questions.map((q, idx) => (
                        <div key={String(q._id)} className="admin-panel-bg flex flex-wrap items-start gap-3 rounded-xl p-4">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">{idx + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-text dark:text-dark-text">{String(q.question_bn || q.question_en || 'No text')}</p>
                                <p className="text-xs text-text-muted mt-1">Correct: {String(q.correctKey)} &middot; Marks: {String(q.marks)}</p>
                            </div>
                            <div className="flex gap-1">
                                <button type="button" onClick={() => { setEditingQuestionId(String(q._id)); setQuestionForm(q); }} className="btn-ghost"><Edit3 className="h-4 w-4" /></button>
                                <button type="button" onClick={() => { if (window.confirm('Delete?')) deleteQuestionMutation.mutate(String(q._id)); }} className="btn-ghost text-danger"><Trash2 className="h-4 w-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // TAB: RESULTS
    // ═══════════════════════════════════════════════
    if (tab === 'results') {
        const results: Array<Record<string, unknown>> = Array.isArray(resultsQuery.data) ? resultsQuery.data : [];
        return (
            <div className="space-y-4">
                <button type="button" onClick={() => setTab('list')} className="btn-ghost">
                    <ChevronLeft className="mr-1 h-4 w-4" />Back
                </button>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-bold text-text dark:text-dark-text">Results ({results.length})</h2>
                    <button type="button" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending} className="btn-primary">
                        {publishMutation.isPending ? 'Publishing...' : 'Publish Results'}
                    </button>
                </div>

                {resultsQuery.isLoading ? <p className="text-sm text-text-muted">Loading results...</p> : null}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-card-border text-left text-xs uppercase text-text-muted">
                                <th className="px-3 py-2">#</th>
                                <th className="px-3 py-2">Student</th>
                                <th className="px-3 py-2">Score</th>
                                <th className="px-3 py-2">%</th>
                                <th className="px-3 py-2">Rank</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, idx) => (
                                <tr key={String(r._id)} className="border-b border-card-border/50">
                                    <td className="px-3 py-2">{idx + 1}</td>
                                    <td className="px-3 py-2">{String(r.studentName || r.userId || '')}</td>
                                    <td className="px-3 py-2">{String(r.obtainedMarks || 0)}/{String(r.totalMarks || 0)}</td>
                                    <td className="px-3 py-2">{String(r.percentage || 0)}%</td>
                                    <td className="px-3 py-2">{r.rank ? `#${String(r.rank)}` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legacy import/export section */}
                <div className="admin-panel-bg rounded-xl p-5 space-y-4">
                    <h3 className="text-base font-bold text-text dark:text-dark-text">Legacy Import/Export</h3>
                    <label className="block">
                        <span className="text-xs font-semibold uppercase text-text-muted">Select Legacy Exam</span>
                        <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} className="admin-input mt-1">
                            <option value="">Choose exam</option>
                            {legacyExams.map((exam) => <option key={String(exam._id)} value={String(exam._id)}>{exam.title}</option>)}
                        </select>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button type="button" disabled={busy} onClick={() => void downloadTemplate('xlsx')} className="btn-secondary"><FileSpreadsheet className="mr-1.5 h-4 w-4" />Import Template (XLSX)</button>
                        <button type="button" disabled={busy} onClick={() => void downloadTemplate('csv')} className="btn-secondary"><FileSpreadsheet className="mr-1.5 h-4 w-4" />Import Template (CSV)</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                        <label className="block">
                            <span className="text-xs font-semibold uppercase text-text-muted">Import Result File</span>
                            <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} className="admin-input mt-1" />
                        </label>
                        <button type="button" disabled={busy || !uploadFile} onClick={() => void importResults()} className="btn-primary"><Upload className="mr-1.5 h-4 w-4" />Import</button>
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-text-muted">Export Reports</h4>
                        <input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="Optional Group ID" className="admin-input" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <button type="button" disabled={busy} onClick={() => void exportReport('xlsx')} className="btn-secondary">XLSX</button>
                            <button type="button" disabled={busy} onClick={() => void exportReport('csv')} className="btn-secondary">CSV</button>
                            <button type="button" disabled={busy} onClick={() => void exportReport('pdf')} className="btn-secondary">PDF</button>
                            <button type="button" disabled={busy} onClick={() => void exportLegacyResult()} className="btn-secondary">Legacy XLSX</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════════
    // TAB: PAYMENTS
    // ═══════════════════════════════════════════════
    if (tab === 'payments') {
        const payments: Array<Record<string, unknown>> = Array.isArray(paymentsQuery.data) ? paymentsQuery.data : [];
        return (
            <div className="space-y-4">
                <button type="button" onClick={() => setTab('list')} className="btn-ghost">
                    <ChevronLeft className="mr-1 h-4 w-4" />Back
                </button>
                <h2 className="text-xl font-bold text-text dark:text-dark-text">Payments ({payments.length})</h2>

                {paymentsQuery.isLoading ? <p className="text-sm text-text-muted">Loading payments...</p> : null}

                <div className="space-y-2">
                    {payments.map((payment) => {
                        const isPaid = payment.status === 'paid';
                        return (
                            <div key={String(payment._id)} className="admin-panel-bg flex flex-wrap items-center gap-3 rounded-xl p-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-text dark:text-dark-text">{String(payment.userId || '')}</p>
                                    <p className="text-xs text-text-muted">{String(payment.method || '')} &middot; BDT {String(payment.amountBDT || payment.amount || 0)}</p>
                                </div>
                                <span className={isPaid ? 'badge-success' : 'badge-warning'}>{String(payment.status)}</span>
                                {!isPaid ? (
                                    <button
                                        type="button"
                                        disabled={verifyPaymentMutation.isPending}
                                        onClick={() => verifyPaymentMutation.mutate({ id: String(payment._id) })}
                                        className="btn-primary text-xs"
                                    >
                                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />Verify
                                    </button>
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
}
