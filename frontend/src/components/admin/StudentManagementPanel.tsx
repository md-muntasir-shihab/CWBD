import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    AdminStudentExamItem,
    AdminStudentGroup,
    AdminStudentItem,
    adminCreateStudent,
    adminCreateStudentGroup,
    adminCreateSubscriptionPlan,
    adminDeleteStudentGroup,
    adminGetStudentExams,
    adminGetStudentGroups,
    adminGetStudents,
    adminGetSubscriptionPlans,
    adminToggleSubscriptionPlan,
    adminUpdateStudent,
    adminUpdateStudentGroups,
    adminUpdateStudentGroup,
    adminUpdateStudentSubscription,
    adminUpdateSubscriptionPlan,
    adminMfaConfirm,
    adminRevealStudentPassword,
    AdminSubscriptionPlan,
} from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
    Plus, Search,
    CreditCard, Layers,
    ChevronLeft, ChevronRight,
    Edit, Trash2, CheckCircle, XCircle, Clock,
    X, RefreshCw, User, Mail, Hash, Phone, Crown, BookOpen, GraduationCap, Fingerprint, IdCard, Eye
} from 'lucide-react';

/* ── UI Components ── */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-900/65 border border-indigo-500/15 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-indigo-500/10 flex items-center justify-between z-10">
                    <h2 className="font-bold text-white text-lg tracking-tight">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-all duration-200">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

/* ── Form Components ── */

function StudentForm({ initial, onSave, plans, onClose }: {
    initial?: AdminStudentItem;
    onSave: (data: any) => Promise<void>;
    plans: AdminSubscriptionPlan[];
    onClose: () => void;
}) {
    const [form, setForm] = useState({
        full_name: initial?.fullName || '',
        username: initial?.username || '',
        email: initial?.email || '',
        phone_number: initial?.phoneNumber || '',
        user_id: initial?.userUniqueId || '',
        hsc_batch: initial?.batch || '',
        ssc_batch: initial?.ssc_batch || '',
        department: initial?.department || '',
        guardian_name: initial?.guardianName || '',
        guardian_number: initial?.guardianNumber || '',
        roll_number: initial?.rollNumber || '',
        registration_number: initial?.registrationNumber || '',
        status: initial?.status || 'active',
        planCode: initial?.subscription?.planCode || '',
        days: 365
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                fullName: form.full_name,
                username: form.username,
                email: form.email,
                phoneNumber: form.phone_number,
                userUniqueId: form.user_id,
                batch: form.hsc_batch,
                ssc_batch: form.ssc_batch,
                department: form.department,
                guardianName: form.guardian_name,
                guardianNumber: form.guardian_number,
                rollNumber: form.roll_number,
                registrationNumber: form.registration_number,
                status: form.status,
                subscription: !initial && form.planCode ? {
                    planCode: form.planCode,
                    isActive: true,
                    startDate: new Date().toISOString(),
                    expiryDate: new Date(Date.now() + form.days * 86400000).toISOString(),
                } : undefined
            };
            await onSave(payload);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Action failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Full Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 transition-all outline-none" placeholder="John Doe" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Username</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 transition-all outline-none" placeholder="johndoe123" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 transition-all outline-none" placeholder="john@example.com" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">HSC Batch</label>
                    <div className="relative">
                        <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input value={form.hsc_batch} onChange={e => setForm({ ...form, hsc_batch: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 transition-all outline-none" placeholder="2024" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input required value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="017..." />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">University ID (User ID)</label>
                    <div className="relative">
                        <Fingerprint className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input required value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="CW-1001" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">SSC Batch</label>
                    <div className="relative">
                        <GraduationCap className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input value={form.ssc_batch} onChange={e => setForm({ ...form, ssc_batch: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="2022" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Department</label>
                    <div className="relative">
                        <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="Science / Commerce / Arts" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Guardian Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input value={form.guardian_name} onChange={e => setForm({ ...form, guardian_name: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="Guardian Name" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Guardian Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input value={form.guardian_number} onChange={e => setForm({ ...form, guardian_number: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="Guardian Number" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Roll Number</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input value={form.roll_number} onChange={e => setForm({ ...form, roll_number: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="Roll" />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Registration Number</label>
                    <div className="relative">
                        <IdCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                        <input value={form.registration_number} onChange={e => setForm({ ...form, registration_number: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="Reg" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 px-3 text-sm text-white outline-none">
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="suspended">Suspended</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>
                {!initial && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-400">Initial Package</label>
                        <select value={form.planCode} onChange={e => setForm({ ...form, planCode: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 px-3 text-sm text-white outline-none">
                            <option value="">No Package</option>
                            {plans.map(p => <option key={p._id} value={p.code}>{p.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold hover:opacity-90 transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : initial ? 'Update Student' : 'Create Student'}
                </button>
            </div>
        </form>
    );
}

function GroupForm({ initial, onSave, onClose }: {
    initial?: AdminStudentGroup;
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
}) {
    const [name, setName] = useState(initial?.name || '');
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({ name });
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Group Name</label>
                <div className="relative">
                    <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="Medical Batch A" />
                </div>
            </div>
            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Group'}
                </button>
            </div>
        </form>
    );
}

function PlanForm({ initial, onSave, onClose }: {
    initial?: AdminSubscriptionPlan;
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
}) {
    const [form, setForm] = useState({
        name: initial?.name || '',
        code: initial?.code || '',
        durationDays: initial?.durationDays || 30,
        description: initial?.description || '',
    });
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(form);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Package Name</label>
                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 px-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="One Year Access" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-400">Code</label>
                    <input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 px-4 text-sm text-white focus:border-indigo-500/50 outline-none" placeholder="PRO1Y" disabled={!!initial} />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Duration (Days)</label>
                <input required type="number" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: Number(e.target.value) })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 px-4 text-sm text-white focus:border-indigo-500/50 outline-none" />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 px-4 text-sm text-white focus:border-indigo-500/50 outline-none h-20 resize-none" />
            </div>
            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Package'}
                </button>
            </div>
        </form>
    );
}

function RenewForm({ student, plans, onSave, onClose }: {
    student: AdminStudentItem;
    plans: AdminSubscriptionPlan[];
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
}) {
    const [form, setForm] = useState({
        planCode: student.subscription?.planCode || '',
        days: 365
    });
    const [loading, setLoading] = useState(false);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(form);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl mb-4">
                <p className="text-sm text-slate-300">Renewing subscription for <span className="text-white font-bold">{student.fullName}</span></p>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Select Package</label>
                <select value={form.planCode} onChange={e => setForm({ ...form, planCode: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 px-3 text-sm text-white outline-none">
                    <option value="">Select Package</option>
                    {plans.map(p => <option key={p._id} value={p.code}>{p.name} ({p.durationDays}d)</option>)}
                </select>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Additional Days</label>
                <input type="number" value={form.days} onChange={e => setForm({ ...form, days: Number(e.target.value) })} className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2 px-4 text-sm text-white focus:border-indigo-500/50 outline-none" />
            </div>
            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {loading ? 'Renewing...' : 'Confirm Renewal'}
                </button>
            </div>
        </form>
    );
}

function GroupAssignForm({ student, groups, onSave, onClose }: {
    student: AdminStudentItem;
    groups: AdminStudentGroup[];
    onSave: (groupSlugs: string[]) => Promise<void>;
    onClose: () => void;
}) {
    const [selected, setSelected] = useState<string[]>(student.groups?.map(g => g.slug) || []);
    const [loading, setLoading] = useState(false);

    const toggle = (slug: string) => {
        setSelected(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(selected);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {groups.map(g => (
                    <div key={g._id} onClick={() => toggle(g.slug)} className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${selected.includes(g.slug) ? 'bg-indigo-600/10 border-indigo-600' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                        <div className={`w-4 h-4 rounded flex items-center justify-center border ${selected.includes(g.slug) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}>
                            {selected.includes(g.slug) && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm text-slate-200">{g.name}</span>
                    </div>
                ))}
            </div>
            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {loading ? 'Updating...' : 'Update Groups'}
                </button>
            </div>
        </form>
    );
}

function PasswordRevealModal({
    student,
    onClose,
}: {
    student: AdminStudentItem;
    onClose: () => void;
}) {
    const [password, setPassword] = useState('');
    const [reason, setReason] = useState('');
    const [revealed, setRevealed] = useState('');
    const [loading, setLoading] = useState(false);

    const reveal = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!password.trim() || !reason.trim()) {
            toast.error('Admin password and reason are required');
            return;
        }
        setLoading(true);
        try {
            const mfaRes = await adminMfaConfirm(password.trim());
            const mfaToken = String(mfaRes.data?.mfaToken || '').trim();
            if (!mfaToken) {
                throw new Error('MFA token missing');
            }
            const revealRes = await adminRevealStudentPassword(student._id, {
                mfaToken,
                reason: reason.trim(),
            });
            setRevealed(String(revealRes.data?.password || ''));
            toast.success('Password revealed');
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Password reveal failed');
        } finally {
            setLoading(false);
        }
    };

    const copyPassword = async () => {
        if (!revealed) return;
        try {
            await navigator.clipboard.writeText(revealed);
            toast.success('Password copied');
        } catch {
            toast.error('Copy failed');
        }
    };

    return (
        <form onSubmit={reveal} className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">
                Superadmin-only operation. This action is fully audit logged with reason and MFA confirmation.
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Admin Password (for MFA confirm)</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2.5 px-3 text-sm text-white focus:border-indigo-500/50 outline-none"
                    placeholder="Enter your admin password"
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Reason</label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full h-24 bg-slate-950/65 border border-indigo-500/20 rounded-xl py-2.5 px-3 text-sm text-white focus:border-indigo-500/50 outline-none"
                    placeholder="Write why password reveal is needed"
                />
            </div>
            {revealed && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                    <p className="text-xs text-emerald-200">Revealed password for {student.fullName}</p>
                    <div className="mt-2 flex items-center gap-2">
                        <code className="flex-1 rounded-lg bg-slate-950/80 px-3 py-2 text-sm text-white">{revealed}</code>
                        <button type="button" onClick={() => void copyPassword()} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">
                            Copy
                        </button>
                    </div>
                </div>
            )}
            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 font-medium hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {loading ? 'Verifying...' : 'Reveal Password'}
                </button>
            </div>
        </form>
    );
}

type Tab = 'students' | 'groups' | 'plans';

function fmtDate(v?: string | null) {
    if (!v) return '-';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
}

export default function StudentManagementPanel() {
    const { user } = useAuth();
    const canRevealPasswords = user?.role === 'superadmin';
    const [tab, setTab] = useState<Tab>('students');
    const [students, setStudents] = useState<AdminStudentItem[]>([]);
    const [groups, setGroups] = useState<AdminStudentGroup[]>([]);
    const [plans, setPlans] = useState<AdminSubscriptionPlan[]>([]);
    const [examItems, setExamItems] = useState<AdminStudentExamItem[]>([]);
    const [examStudentName, setExamStudentName] = useState('');
    const [examOpen, setExamOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(false);

    // Modal States
    const [studentModal, setStudentModal] = useState<{ mode: 'add' | 'edit'; data?: AdminStudentItem } | null>(null);
    const [groupModal, setGroupModal] = useState<{ mode: 'add' | 'edit'; data?: AdminStudentGroup } | null>(null);
    const [planModal, setPlanModal] = useState<{ mode: 'add' | 'edit'; data?: AdminSubscriptionPlan } | null>(null);
    const [renewModal, setRenewModal] = useState<AdminStudentItem | null>(null);
    const [groupAssignModal, setGroupAssignModal] = useState<AdminStudentItem | null>(null);
    const [passwordRevealStudent, setPasswordRevealStudent] = useState<AdminStudentItem | null>(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminGetStudents({ page, limit: 20, search: search || undefined });
            setStudents(res.data.items || []);
            setPages(Math.max(1, Number(res.data.pages || 1)));
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to load students');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    const fetchGroups = useCallback(async () => {
        try {
            const res = await adminGetStudentGroups();
            setGroups(res.data.items || []);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to load groups');
        }
    }, []);

    const fetchPlans = useCallback(async () => {
        try {
            const res = await adminGetSubscriptionPlans();
            setPlans(res.data.items || []);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to load packages');
        }
    }, []);

    useEffect(() => { void fetchStudents(); }, [fetchStudents]);
    useEffect(() => { void fetchGroups(); void fetchPlans(); }, [fetchGroups, fetchPlans]);

    const handleRenew = async (data: any) => {
        if (!renewModal) return;
        try {
            await adminUpdateStudentSubscription(renewModal._id, data);
            toast.success('Subscription renewed');
            await fetchStudents();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Renewal failed');
        }
    };

    const handleAssignGroups = async (groupSlugs: string[]) => {
        if (!groupAssignModal) return;
        try {
            await adminUpdateStudentGroups(groupAssignModal._id, groupSlugs);
            toast.success('Groups updated');
            await fetchStudents();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Update failed');
        }
    };

    const handleDeleteGroup = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this group?')) return;
        try {
            await adminDeleteStudentGroup(id);
            toast.success('Group deleted');
            await fetchGroups();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Delete failed');
        }
    };

    const handleTogglePlan = async (id: string) => {
        try {
            await adminToggleSubscriptionPlan(id);
            toast.success('Status toggled');
            await fetchPlans();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Toggle failed');
        }
    };

    const openExams = async (student: AdminStudentItem) => {
        try {
            const res = await adminGetStudentExams(student._id);
            setExamItems(res.data.items || []);
            setExamStudentName(student.fullName);
            setExamOpen(true);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to load exam details');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Student Management</h1>
                    <p className="text-slate-400 text-sm mt-1">Manage enrollments, batches, and packages</p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
                    <button onClick={() => setTab('students')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === 'students' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Students</button>
                    <button onClick={() => setTab('groups')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === 'groups' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Groups</button>
                    <button onClick={() => setTab('plans')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${tab === 'plans' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>Packages</button>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder={`Search ${tab}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-slate-900/65 border border-indigo-500/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-indigo-500/30 outline-none transition-all"
                    />
                </div>
                <div className="flex items-center justify-end gap-3">
                    {tab === 'students' && (
                        <button onClick={() => setStudentModal({ mode: 'add' })} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
                            <Plus className="w-4 h-4" /> Add Student
                        </button>
                    )}
                    {tab === 'groups' && (
                        <button onClick={() => setGroupModal({ mode: 'add' })} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
                            <Plus className="w-4 h-4" /> New Group
                        </button>
                    )}
                    {tab === 'plans' && (
                        <button onClick={() => setPlanModal({ mode: 'add' })} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20">
                            <Plus className="w-4 h-4" /> Create Package
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-slate-400 text-sm">Loading data...</p>
                </div>
            ) : (
                <>
                    {tab === 'students' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {students.map(s => (
                                <div key={s._id} className="group bg-slate-900/65 border border-indigo-500/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden text-left">
                                    <div className="absolute top-0 right-0 p-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setStudentModal({ mode: 'edit', data: s })} className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => setRenewModal(s)} title="Renew Subscription" className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg text-indigo-400 hover:text-indigo-300 transition-all"><Clock className="w-4 h-4" /></button>
                                        {canRevealPasswords && (
                                            <button onClick={() => setPasswordRevealStudent(s)} title="Reveal Password" className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg text-amber-300 hover:text-amber-200 transition-all"><Eye className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${s.subscription?.isActive ? 'bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-[0_0_15px_rgba(251,191,36,0.4)] ring-2 ring-amber-400/50' : 'bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 text-indigo-400'}`}>
                                            {s.fullName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="text-white font-bold truncate">{s.fullName}</h3>
                                                {s.subscription?.isActive && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shadow-sm" />}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{s.email}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{s.status}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">Batch: {s.batch || 'N/A'}</span>
                                                {s.department && <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full font-medium">{s.department}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-indigo-500/5 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Package</p>
                                            <p className="text-xs text-slate-200 truncate">{s.subscription?.planName || 'None'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Expiry</p>
                                            <p className={`text-xs ${s.subscription?.daysLeft <= 0 ? 'text-rose-400' : 'text-slate-200'}`}>{fmtDate(s.subscription?.expiryDate)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                                        {s.groups.map(g => (
                                            <span key={g._id} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md whitespace-nowrap">{g.name}</span>
                                        ))}
                                        <button onClick={() => setGroupAssignModal(s)} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md hover:bg-indigo-500/20 whitespace-nowrap">+ Edit Groups</button>
                                        <button onClick={() => openExams(s)} className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-md hover:bg-amber-500/20 whitespace-nowrap">History</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'groups' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {groups.map(g => (
                                <div key={g._id} className="bg-slate-900/65 border border-indigo-500/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400"><Layers className="w-5 h-5" /></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setGroupModal({ mode: 'edit', data: g })} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-all"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDeleteGroup(g._id)} className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <h3 className="text-white font-bold">{g.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">{g.slug}</p>
                                    <div className="mt-4 pt-4 border-t border-indigo-500/5 flex items-center justify-between">
                                        <span className="text-xs text-slate-400">Total Students</span>
                                        <span className="text-sm font-bold text-white">{g.studentCount || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'plans' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {plans.map(p => (
                                <div key={p._id} className="bg-slate-900/65 border border-indigo-500/10 rounded-2xl p-5 hover:border-indigo-500/30 transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400"><CreditCard className="w-5 h-5" /></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setPlanModal({ mode: 'edit', data: p })} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-all"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleTogglePlan(p._id)} className={`p-1.5 rounded-lg transition-all ${p.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{p.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}</button>
                                        </div>
                                    </div>
                                    <h3 className="text-white font-bold">{p.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-bold">Code: {p.code}</p>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Duration</span>
                                            <span className="text-slate-200 font-bold">{p.durationDays} Days</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Status</span>
                                            <span className={`font-bold ${p.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>{p.isActive ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {tab === 'students' && (
                        <div className="flex items-center justify-between pt-6">
                            <p className="text-xs text-slate-500">Showing page {page} of {pages}</p>
                            <div className="flex gap-2">
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 bg-slate-900/65 border border-indigo-500/10 rounded-xl text-slate-400 hover:text-white disabled:opacity-50 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-2 bg-slate-900/65 border border-indigo-500/10 rounded-xl text-slate-400 hover:text-white disabled:opacity-50 transition-all"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {studentModal && (
                <Modal title={studentModal.mode === 'add' ? 'Add New Student' : 'Edit Student'} onClose={() => setStudentModal(null)}>
                    <StudentForm
                        initial={studentModal.data}
                        plans={plans}
                        onClose={() => setStudentModal(null)}
                        onSave={async (data) => {
                            if (studentModal.mode === 'add') await adminCreateStudent(data);
                            else await adminUpdateStudent(studentModal.data?._id!, data);
                            toast.success(`Student ${studentModal.mode === 'add' ? 'created' : 'updated'}`);
                            await fetchStudents();
                        }}
                    />
                </Modal>
            )}

            {groupModal && (
                <Modal title={groupModal.mode === 'add' ? 'Create New Group' : 'Edit Group'} onClose={() => setGroupModal(null)}>
                    <GroupForm
                        initial={groupModal.data}
                        onClose={() => setGroupModal(null)}
                        onSave={async (data) => {
                            if (groupModal.mode === 'add') await adminCreateStudentGroup(data);
                            else await adminUpdateStudentGroup(groupModal.data?._id!, data);
                            toast.success('Group saved');
                            await fetchGroups();
                        }}
                    />
                </Modal>
            )}

            {planModal && (
                <Modal title={planModal.mode === 'add' ? 'Create Package' : 'Edit Package'} onClose={() => setPlanModal(null)}>
                    <PlanForm
                        initial={planModal.data}
                        onClose={() => setPlanModal(null)}
                        onSave={async (data) => {
                            if (planModal.mode === 'add') await adminCreateSubscriptionPlan(data);
                            else await adminUpdateSubscriptionPlan(planModal.data?._id!, data);
                            toast.success('Package saved');
                            await fetchPlans();
                        }}
                    />
                </Modal>
            )}

            {renewModal && (
                <Modal title="Renew Subscription" onClose={() => setRenewModal(null)}>
                    <RenewForm student={renewModal} plans={plans} onClose={() => setRenewModal(null)} onSave={handleRenew} />
                </Modal>
            )}

            {groupAssignModal && (
                <Modal title="Assign Groups" onClose={() => setGroupAssignModal(null)}>
                    <GroupAssignForm student={groupAssignModal} groups={groups} onClose={() => setGroupAssignModal(null)} onSave={handleAssignGroups} />
                </Modal>
            )}

            {passwordRevealStudent && (
                <Modal title="Reveal Student Password" onClose={() => setPasswordRevealStudent(null)}>
                    <PasswordRevealModal student={passwordRevealStudent} onClose={() => setPasswordRevealStudent(null)} />
                </Modal>
            )}

            {examOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setExamOpen(false)}>
                    <div className="w-full max-w-2xl bg-slate-900/65 border border-indigo-500/20 rounded-2xl p-6 max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white text-lg font-bold">{examStudentName} - Exam History</h3>
                            <button onClick={() => setExamOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-all"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {examItems.length === 0 ? <div className="text-center py-10 text-slate-500 text-sm">No exam history recorded.</div> : examItems.map((r) => (
                                <div key={r.resultId} className="rounded-xl border border-indigo-500/10 bg-slate-950/65 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <p className="text-white font-bold">{r.examTitle}</p>
                                        <p className="text-xs text-slate-400 mt-1">{r.subject} • Attempt {r.attemptNo} • {new Date(r.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-right">
                                        <div>
                                            <p className="text-lg font-bold text-indigo-400">{r.percentage.toFixed(1)}%</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Marks: {r.obtainedMarks}/{r.totalMarks}</p>
                                        </div>
                                        <div className="px-3 py-1 bg-indigo-500/10 rounded-lg text-indigo-400 text-xs font-bold">Rank: {r.rank || 'N/A'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
