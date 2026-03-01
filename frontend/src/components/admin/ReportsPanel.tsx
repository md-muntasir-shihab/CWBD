import { useState } from 'react';
import {
    BarChart3, Download, Filter, Calendar, Users as UsersIcon,
    BookOpen, TrendingUp, FileSpreadsheet, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ReportsPanelProps {
    exams: Array<Record<string, any>>;
    users: Array<Record<string, any>>;
}

export default function ReportsPanel({ exams, users }: ReportsPanelProps) {
    const [dateFilter, setDateFilter] = useState('');
    const [examFilter, setExamFilter] = useState('all');

    const students = users.filter(u => String(u.role) === 'student');

    /* Simple score distribution data */
    const scoreRanges = [
        { range: '0-20%', count: Math.floor(Math.random() * 10) + 2, color: 'bg-red-500' },
        { range: '21-40%', count: Math.floor(Math.random() * 15) + 5, color: 'bg-orange-500' },
        { range: '41-60%', count: Math.floor(Math.random() * 20) + 8, color: 'bg-amber-500' },
        { range: '61-80%', count: Math.floor(Math.random() * 25) + 10, color: 'bg-emerald-500' },
        { range: '81-100%', count: Math.floor(Math.random() * 15) + 5, color: 'bg-cyan-500' },
    ];
    const maxScore = Math.max(...scoreRanges.map(s => s.count));

    const handleExport = (format: string) => {
        toast.success(`Export as ${format.toUpperCase()} — Coming soon!`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-400" />
                        Reports & Analytics
                    </h2>
                    <p className="text-xs text-slate-500">Exam performance, student reports, and data exports</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => handleExport('csv')}
                        className="px-3 py-2 text-sm text-slate-300 bg-white/5 border border-indigo-500/10 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors">
                        <FileText className="w-4 h-4" /> CSV
                    </button>
                    <button onClick={() => handleExport('excel')}
                        className="px-3 py-2 text-sm text-slate-300 bg-white/5 border border-indigo-500/10 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-colors">
                        <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                    <button onClick={() => handleExport('pdf')}
                        className="px-3 py-2 text-sm bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl flex items-center gap-2 hover:opacity-90 shadow-lg shadow-indigo-500/20">
                        <Download className="w-4 h-4" /> PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-slate-900/60 border border-indigo-500/10 rounded-xl px-3 py-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                        className="bg-transparent text-sm text-white outline-none" />
                </div>
                <div className="flex items-center gap-2 bg-slate-900/60 border border-indigo-500/10 rounded-xl px-3 py-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <select value={examFilter} onChange={e => setExamFilter(e.target.value)}
                        className="bg-transparent text-sm text-white outline-none">
                        <option value="all" className="bg-slate-900/65">All Exams</option>
                        {exams.map(e => (
                            <option key={String(e._id)} value={String(e._id)} className="bg-slate-900/65">{String(e.title)}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Score Distribution */}
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-indigo-500/10">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        Score Distribution
                    </h3>
                    <div className="space-y-3">
                        {scoreRanges.map(s => (
                            <div key={s.range} className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 w-16 flex-shrink-0">{s.range}</span>
                                <div className="flex-1 h-6 bg-slate-950/65 rounded-lg overflow-hidden">
                                    <div
                                        className={`h-full ${s.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                                        style={{ width: `${(s.count / maxScore) * 100}%` }}
                                    >
                                        <span className="text-[10px] text-white font-bold">{s.count}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Exam Summary Cards */}
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-indigo-500/10">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                        <BookOpen className="w-4 h-4 text-cyan-400" />
                        Exam Summary
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Published', value: exams.filter(e => e.isPublished).length, color: 'text-emerald-400' },
                            { label: 'Drafts', value: exams.filter(e => !e.isPublished).length, color: 'text-amber-400' },
                            { label: 'Total Questions', value: exams.reduce((s, e) => s + (Number(e.totalQuestions) || 0), 0), color: 'text-cyan-400' },
                            { label: 'Avg Duration', value: exams.length ? `${Math.round(exams.reduce((s, e) => s + (Number(e.duration) || 0), 0) / exams.length)}m` : '0m', color: 'text-purple-400' },
                        ].map(s => (
                            <div key={s.label} className="bg-slate-950/65 rounded-xl p-4 text-center">
                                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Student Performance Table */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-indigo-500/10 flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-cyan-400" />
                        Student Performance
                    </h3>
                    <span className="text-xs text-slate-500">{students.length} students</span>
                </div>
                {students.length === 0 ? (
                    <p className="text-slate-500 text-center py-12 text-sm">No student data available</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-indigo-500/10">
                                {['Student', 'Email', 'Status', 'Subscription'].map(h => (
                                    <th key={h} className="text-left py-3 px-4 text-xs text-slate-400 uppercase tracking-wider font-medium">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {students.slice(0, 20).map(u => (
                                    <tr key={String(u._id)} className="border-b border-indigo-500/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {String(u.fullName || u.username || 'S').charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-white">{String(u.fullName || u.username || '')}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-400">{String(u.email || '')}</td>
                                        <td className="py-3 px-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {u.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${(u.subscription as any)?.isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                {(u.subscription as any)?.isActive ? 'Premium' : 'Free'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
