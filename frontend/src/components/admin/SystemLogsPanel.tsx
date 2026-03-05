import { useState, useEffect } from 'react';
import { ScrollText, RefreshCw, AlertTriangle, CheckCircle, Info, Clock, Server, Database, Globe } from 'lucide-react';
import api, { adminGetAuditLogs } from '../../services/api';

interface LogEntry {
    _id: string;
    timestamp: string;
    action: string;
    actor_id: any;
    actor_role: string;
    target_id: string;
    target_type: string;
    ip_address: string;
    details: any;
}

export default function SystemLogsPanel() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [apiStatus, setApiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');
    const [filterAction, setFilterAction] = useState('');
    const [filterActor, setFilterActor] = useState('');
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await adminGetAuditLogs({
                page: 1,
                limit: 50,
                action: filterAction || undefined,
                actor: filterActor || undefined,
                dateFrom: filterFrom || undefined,
                dateTo: filterTo || undefined,
            });
            setLogs(res.data.logs || []);
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();

        // Check API health
        const checkHealth = async () => {
            try {
                const res = await api.get('/campusway-secure-admin/health');
                setApiStatus(res.status === 200 ? 'online' : 'offline');
                setDbStatus('online'); // if API is up, DB must be connected
            } catch {
                setApiStatus('offline');
                setDbStatus('offline');
            }
        };
        checkHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            fetchLogs();
        }, 300);
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterAction, filterActor, filterFrom, filterTo]);

    const getLevelFromAction = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes('delete') || lower.includes('suspend') || lower.includes('failed')) return 'error';
        if (lower.includes('update') || lower.includes('change')) return 'warn';
        if (lower.includes('create') || lower.includes('register') || lower.includes('grant')) return 'success';
        return 'info';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ScrollText className="w-5 h-5 text-cyan-400" />
                        System Logs
                    </h2>
                    <p className="text-xs text-slate-500">Monitor system health, API status, and recent events</p>
                </div>
                <button onClick={fetchLogs} disabled={loading}
                    className="px-3 py-2 text-sm text-slate-400 hover:text-white bg-white/5 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {/* System Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'API Server', status: apiStatus, icon: Server, port: ':5000' },
                    { label: 'MongoDB', status: dbStatus, icon: Database, port: ':27017' },
                    { label: 'Frontend (Vite)', status: 'online' as const, icon: Globe, port: ':5173' },
                ].map(s => (
                    <div key={s.label} className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-indigo-500/10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.status === 'online' ? 'bg-emerald-500/15' :
                                s.status === 'checking' ? 'bg-amber-500/15' : 'bg-red-500/15'
                                }`}>
                                <s.icon className={`w-5 h-5 ${s.status === 'online' ? 'text-emerald-400' :
                                    s.status === 'checking' ? 'text-amber-400' : 'text-red-400'
                                    }`} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">{s.label}</p>
                                <p className="text-[10px] text-slate-500">{s.port}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`relative flex h-2.5 w-2.5 ${s.status === 'online' ? '' : 'hidden'}`}>
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className={`text-xs uppercase tracking-wider font-semibold ${s.status === 'online' ? 'text-emerald-400' :
                                s.status === 'checking' ? 'text-amber-400' : 'text-red-400'
                                }`}>
                                {s.status}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 overflow-hidden">
                <div className="px-5 py-3 border-b border-indigo-500/10 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">Security & Audit Log</h3>
                    <span className="text-[10px] text-slate-500">{logs.length} entries</span>
                </div>
                <div className="grid grid-cols-1 gap-3 border-b border-indigo-500/10 px-5 py-3 md:grid-cols-4">
                    <input
                        value={filterAction}
                        onChange={(event) => setFilterAction(event.target.value)}
                        placeholder="Filter action"
                        className="rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-xs text-white"
                    />
                    <input
                        value={filterActor}
                        onChange={(event) => setFilterActor(event.target.value)}
                        placeholder="Actor ID"
                        className="rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-xs text-white"
                    />
                    <input
                        type="date"
                        value={filterFrom}
                        onChange={(event) => setFilterFrom(event.target.value)}
                        className="rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-xs text-white"
                    />
                    <input
                        type="date"
                        value={filterTo}
                        onChange={(event) => setFilterTo(event.target.value)}
                        className="rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-xs text-white"
                    />
                </div>
                <div className="divide-y divide-indigo-500/5 max-h-[400px] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No audit logs found.</div>
                    ) : logs.map(log => {
                        const lvl = getLevelFromAction(log.action) as 'info' | 'warn' | 'error' | 'success';

                        // Fallback actor info if populated or not
                        const actorName = log.actor_id?.username || log.actor_id?.email || log.actor_id || 'System';

                        return (
                            <div key={log._id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                                <div className="mt-0.5">
                                    {lvl === 'info' && <Info className="w-3.5 h-3.5 text-blue-400" />}
                                    {lvl === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                                    {lvl === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                                    {lvl === 'success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium">
                                        <span className="text-indigo-300">{actorName}</span>{' '}
                                        <span className="text-slate-400">({log.actor_role})</span> {log.action}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                                        Target: {log.target_type} ({log.target_id})
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </span>
                                        <span className="text-[10px] text-slate-600">·</span>
                                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <Globe className="w-3 h-3" />
                                            IP: {log.ip_address}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
