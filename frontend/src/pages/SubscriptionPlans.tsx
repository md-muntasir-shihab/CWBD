import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock3, Copy, ExternalLink, Filter, Loader2, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { trackAnalyticsEvent } from '../services/api';
import {
    useMySubscription,
    useRequestSubscriptionPaymentMutation,
    useSubscriptionPlans,
} from '../hooks/useSubscriptionPlans';
import { useWebsiteSettings } from '../hooks/useWebsiteSettings';
import { normalizeInternalOrExternalUrl } from '../utils/url';

type PlanTypeFilter = 'all' | 'free' | 'paid';

function formatDate(value?: string | null): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number, symbol: string, locale: string): string {
    try {
        return new Intl.NumberFormat(locale || 'bn-BD', {
            style: 'currency',
            currency: 'BDT',
            currencyDisplay: 'symbol',
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${symbol}${Math.round(amount || 0)}`;
    }
}

function isHttpUrl(raw?: string): boolean {
    return /^https?:\/\//i.test(String(raw || '').trim());
}

export default function SubscriptionPlansPage() {
    const { user } = useAuth();
    const { data: websiteSettings } = useWebsiteSettings();
    const plansQuery = useSubscriptionPlans();
    const isLoggedIn = Boolean(user);
    const mySubscriptionQuery = useMySubscription(isLoggedIn);
    const requestPaymentMutation = useRequestSubscriptionPaymentMutation();

    const [typeFilter, setTypeFilter] = useState<PlanTypeFilter>('all');
    const [durationFilter, setDurationFilter] = useState<number>(0);
    const trackedViewsRef = useRef<Set<string>>(new Set());

    const title = websiteSettings?.subscriptionPageTitle || 'Subscription Plans';
    const subtitle = websiteSettings?.subscriptionPageSubtitle || 'Choose free or paid plans to unlock premium exam access.';
    const defaultBanner = websiteSettings?.subscriptionDefaultBannerUrl || websiteSettings?.logo || '/logo.png';
    const currencySymbol = websiteSettings?.pricingUi?.currencySymbol || '\u09F3';
    const currencyLocale = websiteSettings?.pricingUi?.currencyLocale || 'bn-BD';

    const plans = useMemo(() => {
        const rows = plansQuery.data || [];
        return rows.filter((plan) => {
            if (typeFilter !== 'all' && plan.type !== typeFilter) return false;
            if (durationFilter > 0 && Number(plan.durationDays || 0) !== durationFilter) return false;
            return true;
        });
    }, [plansQuery.data, durationFilter, typeFilter]);

    const durations = useMemo(() => {
        const values = new Set<number>();
        for (const plan of plansQuery.data || []) {
            const duration = Number(plan.durationDays || plan.durationValue || 0);
            if (duration > 0) values.add(duration);
        }
        return Array.from(values).sort((a, b) => a - b);
    }, [plansQuery.data]);

    const mySubscription = mySubscriptionQuery.data;
    const hasActivePlan = Boolean(mySubscription?.isActive);
    const isPendingPlan = mySubscription?.status === 'pending';
    const isSuspendedPlan = mySubscription?.status === 'suspended';
    const isExpiredPlan = mySubscription?.status === 'expired';

    useEffect(() => {
        plans.forEach((plan) => {
            if (trackedViewsRef.current.has(plan._id)) return;
            trackedViewsRef.current.add(plan._id);
            void trackAnalyticsEvent({
                eventName: 'subscription_plan_view',
                module: 'subscription',
                source: user ? 'student' : 'public',
                meta: { planId: plan._id, planName: plan.name, planType: plan.type },
            }).catch(() => undefined);
        });
    }, [plans, user]);

    const trackPlanClick = (plan: { _id: string; name: string; type: string }, action: string) => {
        void trackAnalyticsEvent({
            eventName: 'subscription_plan_click',
            module: 'subscription',
            source: user ? 'student' : 'public',
            meta: { planId: plan._id, planName: plan.name, planType: plan.type, action },
        }).catch(() => undefined);
    };

    const handleCopyPlan = async (payload: string) => {
        try {
            await navigator.clipboard.writeText(payload);
            toast.success('Plan info copied');
        } catch {
            toast.error('Unable to copy');
        }
    };

    const handleSharePlan = async (payload: { title: string; url: string }) => {
        try {
            if (navigator.share) {
                await navigator.share({ title: payload.title, url: payload.url });
                return;
            }
        } catch {
            // fallback to clipboard below
        }
        await handleCopyPlan(`${payload.title}\n${payload.url}`);
    };

    const activateFreePlan = async (planId: string) => {
        try {
            await requestPaymentMutation.mutateAsync({ planId, method: 'manual' });
            toast.success('Free plan request submitted');
        } catch {
            toast.error('Failed to activate free plan');
        }
    };

    return (
        <div className="min-h-screen bg-background dark:bg-slate-950">
            <section className="section-container py-10 md:py-14">
                <div className="rounded-3xl border border-card-border/70 bg-card/85 p-6 shadow-xl backdrop-blur dark:border-dark-border/70 dark:bg-slate-900/55 md:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                                <Filter className="h-3.5 w-3.5" />
                                Subscription
                            </p>
                            <h1 className="mt-3 text-3xl font-heading font-bold text-text dark:text-dark-text md:text-4xl">{title}</h1>
                            <p className="mt-2 max-w-2xl text-sm text-text-muted dark:text-dark-text/70">{subtitle}</p>
                        </div>
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-text-muted dark:text-dark-text/70">
                            {!isLoggedIn ? (
                                <p>Contact admin to subscribe and activate a plan.</p>
                            ) : hasActivePlan ? (
                                <p className="text-emerald-500 dark:text-emerald-300">
                                    Active: {mySubscription?.planName || 'Plan'} • Expires {formatDate(mySubscription?.expiresAtUTC)}
                                </p>
                            ) : isPendingPlan ? (
                                <p className="text-amber-500 dark:text-amber-300">Payment verification pending.</p>
                            ) : isSuspendedPlan ? (
                                <p className="text-rose-500 dark:text-rose-300">Subscription suspended. Contact support.</p>
                            ) : isExpiredPlan ? (
                                <p className="text-rose-500 dark:text-rose-300">Subscription expired. Renew to continue.</p>
                            ) : (
                                <p>No active subscription found.</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-[180px,220px,1fr]">
                        <div>
                            <label className="text-xs font-medium text-text-muted dark:text-dark-text/70">Plan Type</label>
                            <select
                                value={typeFilter}
                                onChange={(event) => setTypeFilter(event.target.value as PlanTypeFilter)}
                                className="mt-1 w-full rounded-xl border border-card-border/70 bg-surface px-3 py-2 text-sm text-text dark:border-dark-border/70 dark:bg-dark-surface dark:text-dark-text"
                            >
                                <option value="all">All</option>
                                <option value="free">Free</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-text-muted dark:text-dark-text/70">Duration</label>
                            <select
                                value={durationFilter}
                                onChange={(event) => setDurationFilter(Number(event.target.value || 0))}
                                className="mt-1 w-full rounded-xl border border-card-border/70 bg-surface px-3 py-2 text-sm text-text dark:border-dark-border/70 dark:bg-dark-surface dark:text-dark-text"
                            >
                                <option value={0}>Any</option>
                                {durations.map((dayCount) => (
                                    <option key={dayCount} value={dayCount}>
                                        {dayCount} days
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {plansQuery.isLoading ? (
                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, idx) => (
                            <div key={idx} className="h-80 animate-pulse rounded-2xl border border-card-border/70 bg-card/60 dark:border-dark-border/70 dark:bg-slate-900/40" />
                        ))}
                    </div>
                ) : null}

                {!plansQuery.isLoading && plans.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-card-border/70 bg-card/50 p-8 text-center text-sm text-text-muted dark:border-dark-border/70 dark:bg-slate-900/40 dark:text-dark-text/70">
                        No plans found for current filters.
                    </div>
                ) : null}

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan, index) => {
                        const planUrl = `/subscription-plans/${plan._id}`;
                        const fallbackCtaUrl = normalizeInternalOrExternalUrl(plan.contactCtaUrl) || '/contact';
                        const isPlanActive = Boolean(hasActivePlan && plan.name === mySubscription?.planName);
                        const price = Number(plan.priceBDT ?? plan.price ?? 0);
                        const priceLabel = plan.type === 'free' || price <= 0
                            ? 'Free'
                            : formatCurrency(price, currencySymbol, currencyLocale);
                        const banner = plan.bannerImageUrl || defaultBanner;
                        const features = Array.from(new Set([...(plan.features || []), ...(plan.includedModules || [])])).slice(0, 6);

                        return (
                            <motion.article
                                key={plan._id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04, duration: 0.22 }}
                                whileHover={{ y: -4 }}
                                className="group overflow-hidden rounded-2xl border border-card-border/70 bg-card/85 shadow-sm transition-shadow hover:shadow-xl dark:border-dark-border/70 dark:bg-slate-900/55"
                            >
                                <Link to={planUrl} className="block" onClick={() => trackPlanClick(plan, 'open_card')}>
                                    <div className="relative h-40 overflow-hidden rounded-t-2xl border-b border-card-border/70 dark:border-dark-border/70">
                                        <img src={banner} alt={plan.name} className="h-full w-full object-cover" loading="lazy" />
                                        <span className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-sm font-bold shadow-lg ${plan.type === 'free' ? 'bg-emerald-500/95 text-white' : 'bg-indigo-500/95 text-white'}`}>
                                            {priceLabel}
                                        </span>
                                    </div>
                                </Link>
                                <div className="space-y-3 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h2 className="text-lg font-bold text-text dark:text-dark-text">{plan.name}</h2>
                                            <p className="mt-1 text-sm text-text-muted dark:text-dark-text/70 break-words [overflow-wrap:anywhere]">
                                                {plan.shortDescription || plan.description || 'Subscription plan details are managed by admin.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                                        <p className="text-[11px] uppercase tracking-[0.12em] text-text-muted dark:text-dark-text/70">Price</p>
                                        <p className="text-2xl font-black text-primary">{priceLabel}</p>
                                    </div>

                                    <p className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        Valid for {plan.durationDays || plan.durationValue} {plan.durationUnit || 'days'}
                                    </p>

                                    <ul className="space-y-1.5">
                                        {features.length === 0 ? (
                                            <li className="text-xs text-text-muted dark:text-dark-text/70">Feature list will be updated by admin.</li>
                                        ) : features.map((feature, featureIndex) => (
                                            <li key={`${plan._id}-feature-${featureIndex}`} className="flex items-start gap-2 text-sm text-text-muted dark:text-dark-text/80">
                                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                                <span className="break-words [overflow-wrap:anywhere]">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                        {!isLoggedIn ? (
                                            <a href={fallbackCtaUrl} target={isHttpUrl(fallbackCtaUrl) ? '_blank' : undefined} rel={isHttpUrl(fallbackCtaUrl) ? 'noreferrer noopener' : undefined} className="btn-primary text-sm" onClick={() => trackPlanClick(plan, 'contact_cta_logged_out')}>
                                                {plan.contactCtaLabel || 'Contact to Subscribe'}
                                                {isHttpUrl(fallbackCtaUrl) ? <ExternalLink className="h-4 w-4" /> : null}
                                            </a>
                                        ) : isPlanActive ? (
                                            <button type="button" disabled className="btn-outline text-sm opacity-80 cursor-not-allowed">
                                                Active ✅ expires {formatDate(mySubscription?.expiresAtUTC)}
                                            </button>
                                        ) : plan.type === 'free' ? (
                                            <button type="button" onClick={() => { trackPlanClick(plan, 'activate_free_plan'); void activateFreePlan(plan._id); }} className="btn-primary text-sm" disabled={requestPaymentMutation.isPending}>
                                                {requestPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                                Get Free Plan
                                            </button>
                                        ) : (
                                            <a href={fallbackCtaUrl} target={isHttpUrl(fallbackCtaUrl) ? '_blank' : undefined} rel={isHttpUrl(fallbackCtaUrl) ? 'noreferrer noopener' : undefined} className="btn-primary text-sm" onClick={() => trackPlanClick(plan, 'contact_cta_logged_in')}>
                                                {plan.contactCtaLabel || 'Contact to Subscribe'}
                                                {isHttpUrl(fallbackCtaUrl) ? <ExternalLink className="h-4 w-4" /> : null}
                                            </a>
                                        )}
                                        <Link to={planUrl} className="btn-outline text-sm" onClick={() => trackPlanClick(plan, 'details_click')}>
                                            Details
                                        </Link>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => handleCopyPlan(`${plan.name} - ${priceLabel} - ${plan.durationDays} days`)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-card-border/70 px-2.5 py-1.5 text-xs text-text-muted hover:text-primary dark:border-dark-border/70 dark:text-dark-text/70"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            Copy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSharePlan({ title: plan.name, url: window.location.origin + planUrl })}
                                            className="inline-flex items-center gap-1 rounded-lg border border-card-border/70 px-2.5 py-1.5 text-xs text-text-muted hover:text-primary dark:border-dark-border/70 dark:text-dark-text/70"
                                        >
                                            <Share2 className="h-3.5 w-3.5" />
                                            Share
                                        </button>
                                    </div>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
