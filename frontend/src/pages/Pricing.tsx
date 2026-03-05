import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPublicSubscriptionPlans, AdminSubscriptionPlan } from '../services/api';
import { useWebsiteSettings } from '../hooks/useWebsiteSettings';

function useCurrencyFormatter() {
    const { data: settings } = useWebsiteSettings();
    const currencyCode = settings?.pricingUi?.currencyCode || 'BDT';
    const currencySymbol = settings?.pricingUi?.currencySymbol || '\u09F3';
    const locale = settings?.pricingUi?.currencyLocale || 'bn-BD';
    const displayMode = settings?.pricingUi?.displayMode || 'symbol';

    const formatter = useMemo(() => new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: displayMode === 'code' ? 'code' : 'symbol',
        maximumFractionDigits: 0,
    }), [locale, currencyCode, displayMode]);

    return (amount: number) => {
        if (!Number.isFinite(amount)) return `${currencySymbol}0`;
        try {
            return formatter.format(amount);
        } catch {
            return `${currencySymbol}${Math.round(amount)}`;
        }
    };
}

function durationLabel(plan: AdminSubscriptionPlan): string {
    const value = Number(plan.durationValue || plan.durationDays || 0);
    const unit = plan.durationUnit || 'days';
    return `${value} ${unit}`;
}

export default function PricingPage() {
    const [activeIndex, setActiveIndex] = useState(0);
    const formatCurrency = useCurrencyFormatter();

    const plansQuery = useQuery({
        queryKey: ['public-subscription-plans'],
        queryFn: async () => (await getPublicSubscriptionPlans()).data.items || [],
    });

    const plans = useMemo(() => {
        const sorted = [...(plansQuery.data || [])].sort((a, b) => {
            const left = Number(a.sortOrder ?? a.priority ?? 100);
            const right = Number(b.sortOrder ?? b.priority ?? 100);
            return left - right;
        });
        return sorted;
    }, [plansQuery.data]);

    const activePlan = plans[activeIndex] || null;

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-[#061226] sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 text-center">
                    <p className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-500">
                        <Sparkles className="h-3.5 w-3.5" />
                        Pricing Plans
                    </p>
                    <h1 className="mt-4 text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">Choose Your Subscription</h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Plans are activated manually by admin after confirmation.</p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl dark:border-white/10 dark:bg-slate-900/65 sm:p-6">
                    {plansQuery.isLoading ? (
                        <div className="grid gap-4 sm:grid-cols-3">
                            {[0, 1, 2].map((idx) => (
                                <div key={idx} className="h-48 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/5" />
                            ))}
                        </div>
                    ) : plans.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-white/20">
                            <p className="text-sm text-slate-500 dark:text-slate-300">No active plans found.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-white/10 dark:bg-slate-950/60 sm:grid-cols-3">
                                {plans.map((plan, idx) => (
                                    <button
                                        key={plan._id}
                                        type="button"
                                        onClick={() => setActiveIndex(idx)}
                                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${idx === activeIndex
                                            ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-md'
                                            : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/5'}`}
                                    >
                                        {plan.name}
                                    </button>
                                ))}
                            </div>

                            {activePlan && (
                                <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-950/50">
                                        <p className="text-sm font-semibold text-indigo-500">{activePlan.code.toUpperCase()}</p>
                                        <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{activePlan.name}</h2>
                                        <p className="mt-4 text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(Number(activePlan.price || 0))}</p>
                                        <p className="mt-1 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">per {durationLabel(activePlan)}</p>
                                        {activePlan.description ? (
                                            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{activePlan.description}</p>
                                        ) : null}
                                        <div className="mt-6 space-y-2">
                                            <Link to="/contact" className="block rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-3 text-center text-sm font-semibold text-white hover:opacity-90">
                                                Contact Admin to Subscribe
                                            </Link>
                                            <p className="text-center text-xs text-slate-500 dark:text-slate-400">No online payment gateway enabled.</p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-950/50">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Included Features</h3>
                                        <ul className="mt-4 space-y-2">
                                            {[(activePlan.features || []), (activePlan.includedModules || [])]
                                                .flat()
                                                .filter(Boolean)
                                                .map((feature, index) => (
                                                    <li key={`${feature}-${index}`} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                                                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                        </ul>
                                        {((activePlan.features || []).length + (activePlan.includedModules || []).length) === 0 ? (
                                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Feature list will be updated by admin.</p>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
