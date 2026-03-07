import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    adminDownloadExamResultImportTemplate,
    adminExportExamReport,
    adminExportExamResults,
    adminGetExams,
    adminImportExamResultsFile,
    type AdminExamCard,
} from '../../../services/api';

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

export function AdminExamsPage() {
    const [selectedExamId, setSelectedExamId] = useState('');
    const [groupId, setGroupId] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);

    const examsQuery = useQuery({
        queryKey: ['admin', 'exams', 'workspace'],
        queryFn: async () => (await adminGetExams({ limit: 200 })).data.exams || [],
    });

    const exams = useMemo<AdminExamCard[]>(
        () => (Array.isArray(examsQuery.data) ? examsQuery.data : []),
        [examsQuery.data],
    );

    const selectedExam = exams.find((exam) => String(exam._id) === selectedExamId) || null;

    const downloadTemplate = async (format: 'xlsx' | 'csv') => {
        if (!selectedExamId) {
            toast.error('Select an exam first.');
            return;
        }
        try {
            setBusy(true);
            const response = await adminDownloadExamResultImportTemplate(selectedExamId, format);
            const filename = `exam_results_import_template.${format}`;
            saveBlob(response.data as Blob, filename);
        } catch {
            toast.error('Failed to download template.');
        } finally {
            setBusy(false);
        }
    };

    const importResults = async () => {
        if (!selectedExamId) {
            toast.error('Select an exam first.');
            return;
        }
        if (!uploadFile) {
            toast.error('Choose a file to import.');
            return;
        }
        try {
            setBusy(true);
            const response = await adminImportExamResultsFile(selectedExamId, uploadFile);
            const payload = response.data as {
                imported?: number;
                invalid?: number;
                errors?: Array<{ rowNo?: number; registration_id?: string; reason?: string }>;
            };
            toast.success(`Import done. Imported: ${payload.imported || 0}, Invalid: ${payload.invalid || 0}`);
            if (Array.isArray(payload.errors) && payload.errors.length > 0) {
                const lines = [
                    'rowNo,registration_id,reason',
                    ...payload.errors.map((row) =>
                        `${Number(row.rowNo || 0)},"${String(row.registration_id || '').replace(/"/g, '""')}","${String(row.reason || '').replace(/"/g, '""')}"`
                    ),
                ];
                saveBlob(
                    new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }),
                    `${selectedExam?.title || 'exam'}_import_errors.csv`.replace(/\s+/g, '_'),
                );
            }
            setUploadFile(null);
        } catch {
            toast.error('Import failed.');
        } finally {
            setBusy(false);
        }
    };

    const exportReport = async (format: 'xlsx' | 'csv' | 'pdf') => {
        if (!selectedExamId) {
            toast.error('Select an exam first.');
            return;
        }
        try {
            setBusy(true);
            const response = await adminExportExamReport(selectedExamId, { format, groupId: groupId.trim() || undefined });
            const filename = `${selectedExam?.title || 'exam'}_report.${format}`;
            saveBlob(response.data as Blob, filename.replace(/\s+/g, '_'));
        } catch {
            toast.error('Export failed.');
        } finally {
            setBusy(false);
        }
    };

    const exportLegacyResult = async () => {
        if (!selectedExamId) {
            toast.error('Select an exam first.');
            return;
        }
        try {
            setBusy(true);
            const response = await adminExportExamResults(selectedExamId);
            const filename = `${selectedExam?.title || 'exam'}_results.xlsx`;
            saveBlob(response.data as Blob, filename.replace(/\s+/g, '_'));
        } catch {
            toast.error('Legacy export failed.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h2 className="text-lg font-bold">Exam Result Tools</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manual result import by registration_id and group/global report export.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <label className="block">
                    <span className="text-sm font-semibold">Select Exam</span>
                    <select
                        value={selectedExamId}
                        onChange={(event) => setSelectedExamId(event.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    >
                        <option value="">Choose an exam</option>
                        {exams.map((exam) => (
                            <option key={String(exam._id)} value={String(exam._id)}>
                                {exam.title}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => void downloadTemplate('xlsx')}
                        className="rounded-lg border border-indigo-300 dark:border-indigo-700 px-3 py-2 text-sm font-semibold"
                    >
                        Download Import Template (XLSX)
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => void downloadTemplate('csv')}
                        className="rounded-lg border border-indigo-300 dark:border-indigo-700 px-3 py-2 text-sm font-semibold"
                    >
                        Download Import Template (CSV)
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
                    <label className="block">
                        <span className="text-sm font-semibold">Import Result File</span>
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                        />
                    </label>
                    <button
                        type="button"
                        disabled={busy || !uploadFile}
                        onClick={() => void importResults()}
                        className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    >
                        Import Results
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
                <h3 className="text-base font-bold">Export Reports</h3>
                <label className="block">
                    <span className="text-sm font-semibold">Optional Group ID Filter</span>
                    <input
                        value={groupId}
                        onChange={(event) => setGroupId(event.target.value)}
                        placeholder="Leave blank for all groups"
                        className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <button type="button" disabled={busy} onClick={() => void exportReport('xlsx')} className="rounded-lg border px-3 py-2 text-sm font-semibold">Export XLSX</button>
                    <button type="button" disabled={busy} onClick={() => void exportReport('csv')} className="rounded-lg border px-3 py-2 text-sm font-semibold">Export CSV</button>
                    <button type="button" disabled={busy} onClick={() => void exportReport('pdf')} className="rounded-lg border px-3 py-2 text-sm font-semibold">Export PDF</button>
                    <button type="button" disabled={busy} onClick={() => void exportLegacyResult()} className="rounded-lg border px-3 py-2 text-sm font-semibold">Legacy Result XLSX</button>
                </div>
            </div>

            {examsQuery.isLoading ? <p className="text-sm text-slate-500">Loading exams...</p> : null}
            {examsQuery.isError ? <p className="text-sm text-rose-500">Failed to load exam list.</p> : null}
        </div>
    );
}
