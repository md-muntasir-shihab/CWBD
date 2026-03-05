import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    adminNewsV2ExportLogs,
    adminNewsV2ExportNews,
    adminNewsV2ExportSources,
} from '../../../services/api';

type ExportFormat = 'csv' | 'xlsx';

function downloadBlob(blob: Blob, filename: string) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
}

export default function AdminNewsExportsSection() {
    const [format, setFormat] = useState<ExportFormat>('xlsx');

    const exportMutation = useMutation({
        mutationFn: async (type: 'news' | 'sources' | 'logs') => {
            if (type === 'news') return (await adminNewsV2ExportNews(format)).data as Blob;
            if (type === 'sources') return (await adminNewsV2ExportSources(format)).data as Blob;
            return (await adminNewsV2ExportLogs(format)).data as Blob;
        },
        onSuccess: (blob, type) => {
            downloadBlob(blob, `news-v2-${type}.${format}`);
            toast.success(`${type} export downloaded`);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Export failed'),
    });

    return (
        <div className="card-flat space-y-4 border border-cyan-500/20 p-4">
            <div>
                <h2 className="text-xl font-semibold">Exports</h2>
                <p className="text-sm text-slate-400">Download news items, source registry, and audit logs.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                    <span className="text-xs uppercase tracking-wide text-slate-400">Format</span>
                    <select className="input-field" value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
                        <option value="xlsx">XLSX</option>
                        <option value="csv">CSV</option>
                    </select>
                </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                    className="btn-primary"
                    onClick={() => exportMutation.mutate('news')}
                    disabled={exportMutation.isPending}
                >
                    Export News
                </button>
                <button
                    className="btn-outline"
                    onClick={() => exportMutation.mutate('sources')}
                    disabled={exportMutation.isPending}
                >
                    Export Sources
                </button>
                <button
                    className="btn-outline"
                    onClick={() => exportMutation.mutate('logs')}
                    disabled={exportMutation.isPending}
                >
                    Export Audit Logs
                </button>
            </div>
        </div>
    );
}
