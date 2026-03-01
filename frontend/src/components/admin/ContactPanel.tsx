import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Trash2, RefreshCw, Mail } from 'lucide-react';
import { adminGetContactMessages, adminDeleteContactMessage } from '../../services/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Msg = Record<string, any>;

export default function ContactPanel() {
    const [messages, setMessages] = useState<Msg[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        setLoading(true);
        try { const r = await adminGetContactMessages({}); setMessages(r.data.messages || []); }
        catch { toast.error('Failed to load messages'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const onDelete = async (id: string) => {
        if (!confirm('Delete this message?')) return;
        try { await adminDeleteContactMessage(id); toast.success('Deleted'); fetch(); }
        catch { toast.error('Delete failed'); }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div><h2 className="text-lg font-bold text-white">Contact Messages</h2><p className="text-xs text-slate-500">View and manage contact form submissions</p></div>
                <button onClick={fetch} className="bg-white/5 hover:bg-white/10 text-slate-300 text-sm px-4 py-2 rounded-xl flex items-center gap-2"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /></div>
            ) : messages.length === 0 ? (
                <div className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-12 text-center">
                    <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No contact messages yet.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.map((m: Msg) => (
                        <div key={m._id} className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-5 space-y-2 hover:border-indigo-500/20 transition-colors">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-white text-sm">{m.subject || 'No Subject'}</h4>
                                    <p className="text-xs text-indigo-400">{m.name} • {m.email}</p>
                                    {m.phone && <p className="text-xs text-slate-500">{m.phone}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</span>
                                    <button onClick={() => onDelete(m._id)} className="p-1.5 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 whitespace-pre-line">{m.message}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
