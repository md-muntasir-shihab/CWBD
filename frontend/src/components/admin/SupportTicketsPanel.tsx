import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    adminCreateNotice,
    adminGetNotices,
    adminGetSupportTickets,
    adminReplySupportTicket,
    adminToggleNotice,
    adminUpdateSupportTicketStatus,
} from '../../services/api';
import { RefreshCw } from 'lucide-react';

export default function SupportTicketsPanel() {
    const [loading, setLoading] = useState(false);
    const [tickets, setTickets] = useState<any[]>([]);
    const [notices, setNotices] = useState<any[]>([]);
    const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
    const [noticeForm, setNoticeForm] = useState({
        title: '',
        message: '',
        target: 'all' as 'all' | 'groups' | 'students',
        startAt: '',
        endAt: '',
    });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [ticketRes, noticeRes] = await Promise.all([
                adminGetSupportTickets({ page: 1, limit: 20 }),
                adminGetNotices({ page: 1, limit: 10 }),
            ]);
            setTickets(ticketRes.data.items || []);
            setNotices(noticeRes.data.items || []);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load support data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const updateStatus = async (id: string, status: string) => {
        try {
            await adminUpdateSupportTicketStatus(id, { status: status as any });
            toast.success('Status updated');
            await load();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Status update failed');
        }
    };

    const reply = async (id: string) => {
        const message = (replyDraft[id] || '').trim();
        if (!message) return toast.error('Reply message is required');
        try {
            await adminReplySupportTicket(id, message);
            setReplyDraft((prev) => ({ ...prev, [id]: '' }));
            toast.success('Reply sent');
            await load();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Reply failed');
        }
    };

    const createNotice = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!noticeForm.title || !noticeForm.message) return toast.error('Title and message are required');
        try {
            await adminCreateNotice({
                title: noticeForm.title,
                message: noticeForm.message,
                target: noticeForm.target,
                startAt: noticeForm.startAt || undefined,
                endAt: noticeForm.endAt || undefined,
            });
            setNoticeForm((prev) => ({ ...prev, title: '', message: '' }));
            toast.success('Notice published');
            await load();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Notice create failed');
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                        <h2 className="text-xl font-bold text-white">Support & Notices</h2>
                        <p className="text-sm text-slate-400">Manage student tickets and publish notices from one place.</p>
                    </div>
                    <button onClick={() => void load()} className="inline-flex items-center gap-1 rounded-xl border border-indigo-500/20 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <form onSubmit={createNotice} className="rounded-2xl border border-indigo-500/10 bg-slate-900/50 p-4 space-y-2">
                    <h3 className="text-white font-semibold">Create Announcement</h3>
                    <input value={noticeForm.title} onChange={(e) => setNoticeForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Notice title" className="w-full rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                    <textarea value={noticeForm.message} onChange={(e) => setNoticeForm((prev) => ({ ...prev, message: e.target.value }))} placeholder="Notice message" className="h-24 w-full rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <select value={noticeForm.target} onChange={(e) => setNoticeForm((prev) => ({ ...prev, target: e.target.value as any }))} className="rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-sm text-white">
                            <option value="all">All</option>
                            <option value="groups">Groups</option>
                            <option value="students">Students</option>
                        </select>
                        <input type="datetime-local" value={noticeForm.startAt} onChange={(e) => setNoticeForm((prev) => ({ ...prev, startAt: e.target.value }))} className="rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                        <input type="datetime-local" value={noticeForm.endAt} onChange={(e) => setNoticeForm((prev) => ({ ...prev, endAt: e.target.value }))} className="rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-sm text-white" />
                    </div>
                    <button type="submit" className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Create Notice</button>
                </form>

                <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/50 p-4">
                    <h3 className="mb-2 text-white font-semibold">Recent Notices</h3>
                    <div className="space-y-2">
                        {notices.length === 0 ? <p className="text-sm text-slate-500">No notices found.</p> : notices.map((notice) => (
                            <div key={notice._id} className="rounded-lg border border-indigo-500/10 bg-slate-950/60 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-white">{notice.title}</p>
                                    <button onClick={() => adminToggleNotice(notice._id).then(() => load()).catch((e) => toast.error(e.response?.data?.message || 'Toggle failed'))} className={`rounded px-2 py-1 text-xs ${notice.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                        {notice.isActive ? 'Active' : 'Inactive'}
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">{notice.message}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/50 p-4">
                <h3 className="mb-2 text-white font-semibold">Support Tickets</h3>
                <div className="space-y-3">
                    {tickets.length === 0 ? <p className="text-sm text-slate-500">No support tickets found.</p> : tickets.map((ticket) => (
                        <div key={ticket._id} className="rounded-xl border border-indigo-500/10 bg-slate-950/60 p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-sm font-semibold text-white">{ticket.ticketNo} - {ticket.subject}</p>
                                    <p className="text-xs text-slate-400">{ticket.studentId?.full_name || ticket.studentId?.username || 'Unknown student'}</p>
                                </div>
                                <select value={ticket.status} onChange={(e) => updateStatus(ticket._id, e.target.value)} className="rounded-lg border border-indigo-500/20 bg-slate-900 px-2 py-1 text-xs text-white">
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                            <p className="mt-2 text-xs text-slate-400">{ticket.message}</p>
                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                <input value={replyDraft[ticket._id] || ''} onChange={(e) => setReplyDraft((prev) => ({ ...prev, [ticket._id]: e.target.value }))} placeholder="Write reply..." className="flex-1 rounded-lg border border-indigo-500/20 bg-slate-900 px-3 py-2 text-xs text-white" />
                                <button onClick={() => void reply(ticket._id)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Reply</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
