import { useQuery } from '@tanstack/react-query';
import { CreditCard, Wallet } from 'lucide-react';
import { getStudentMePayments } from '../../services/api';

export default function StudentPayments() {
    const paymentsQuery = useQuery({
        queryKey: ['student-hub', 'payments'],
        queryFn: async () => (await getStudentMePayments()).data,
    });

    if (paymentsQuery.isLoading) {
        return <div className="h-48 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/60 animate-pulse" />;
    }

    if (paymentsQuery.isError) {
        return (
            <div className="rounded-2xl border border-rose-300/40 bg-rose-50/70 dark:bg-rose-500/10 p-4 text-sm text-rose-700 dark:text-rose-200">
                Payment records could not be loaded.
            </div>
        );
    }

    const summary = paymentsQuery.data?.summary;
    const items = paymentsQuery.data?.items || [];

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h1 className="text-2xl font-bold">Payments</h1>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                        <p className="text-xs text-slate-500 inline-flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Total paid</p>
                        <p className="font-bold text-lg">BDT {Number(summary?.totalPaid || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                        <p className="text-xs text-slate-500">Pending amount</p>
                        <p className="font-bold text-lg">BDT {Number(summary?.pendingAmount || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
                        <p className="text-xs text-slate-500 inline-flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Pending entries</p>
                        <p className="font-bold text-lg">{summary?.pendingCount || 0}</p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
                <h2 className="text-lg font-bold">Payment history</h2>
                <div className="mt-3 space-y-3">
                    {items.length === 0 ? (
                        <p className="text-sm text-slate-500">No payment entries available.</p>
                    ) : (
                        items.map((item) => (
                            <div key={item._id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <p className="font-semibold capitalize">{item.status}  -  {item.method}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(item.createdAt).toLocaleString()}</p>
                                    {item.reference ? <p className="text-xs text-slate-500 dark:text-slate-400">Ref: {item.reference}</p> : null}
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">BDT {Number(item.amount || 0).toLocaleString()}</p>
                                    <p className="text-xs text-slate-500">{item.status === 'paid' && item.paidAt ? `Paid at ${new Date(item.paidAt).toLocaleString()}` : 'Pending verification'}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}


