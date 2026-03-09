import { Link } from 'react-router-dom';
import { Crown, AlertTriangle, CheckCircle } from 'lucide-react';
import DashboardSection from './DashboardSection';
import type { StudentDashboardFullResponse } from '../../../services/api';

interface Props {
    subscription: StudentDashboardFullResponse['subscription'];
    renewalCtaText?: string;
    renewalCtaUrl?: string;
}

export default function SubscriptionCard({ subscription, renewalCtaText, renewalCtaUrl }: Props) {
    const isActive = subscription.isActive;
    const expiryDate = subscription.expiryDate ? new Date(subscription.expiryDate) : null;
    const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86400000) : null;
    const isExpiring = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
    const isExpired = daysLeft !== null && daysLeft <= 0;

    return (
        <DashboardSection delay={0.12}>
            <div className={`rounded-2xl border p-4 ${
                isExpired
                    ? 'border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5'
                    : isExpiring
                        ? 'border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-amber-100 dark:bg-amber-500/15' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            <Crown className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{subscription.planName || 'Free Plan'}</p>
                            {expiryDate && (
                                <p className={`text-[10px] ${
                                    isExpired ? 'text-rose-600 dark:text-rose-400 font-bold' :
                                    isExpiring ? 'text-amber-600 dark:text-amber-400 font-bold' :
                                    'text-slate-500 dark:text-slate-400'
                                }`}>
                                    {isExpired ? 'Expired' : isExpiring ? `${daysLeft}d left` : `Exp: ${expiryDate.toLocaleDateString()}`}
                                </p>
                            )}
                        </div>
                    </div>
                    <div>
                        {isActive && !isExpired ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle className="w-3 h-3" /> Active
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                                <AlertTriangle className="w-3 h-3" /> {isExpired ? 'Expired' : 'Inactive'}
                            </span>
                        )}
                    </div>
                </div>
                {(isExpired || isExpiring || !isActive) && renewalCtaUrl && (
                    <Link to={renewalCtaUrl} className="mt-3 block w-full text-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 transition">
                        {renewalCtaText || 'Renew Subscription'}
                    </Link>
                )}
            </div>
        </DashboardSection>
    );
}
