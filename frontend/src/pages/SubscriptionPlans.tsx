import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, ExternalLink, RefreshCw, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import PlanCard from '../components/subscription/PlanCard';
import {
    useMySubscriptionQuery,
    useSubscriptionPlansQuery,
} from '../hooks/useSubscriptionQueries';
import type { SubscriptionPlanItem } from '../services/subscriptionApi';

type PlanTypeFilter = 'all' | 'free' | 'paid';

function formatDate(value?: string | null): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ContactFlowModal({
    open,
    plan,
    onClose,
}: {
    open: boolean;
    plan: SubscriptionPlanItem | null;
    onClose: () => void;
}) {
    if (!open || !plan) return null;

    const template = `I want to subscribe to: ${plan.name}. My phone: ____`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(template);
            toast.success('Template copied');
        } catch {
            toast.error('Copy failed');
        }
    };

    const openContact = () => {
        window.open(plan.contactCtaUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="w-full max-w-lg rounded-t-2xl border border-card-border bg-card p-5 shadow-xl dark:border-dark-border dark:bg-dark-surface sm:rounded-2xl"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-heading font-bold text-text dark:text-dark-text">Activate {plan.name}</h3>
                        <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-background dark:hover:bg-dark-bg">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-sm text-text-muted dark:text-dark-text/70">
                        To activate subscription, contact admin. You will get username/password after approval.
                    </p>

                    <div className="mt-4 rounded-xl border border-card-border/70 bg-background p-3 dark:border-dark-border/70 dark:bg-dark-bg">
                        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted dark:text-dark-text/60">Copyable template</p>
                        <p className="mt-2 text-sm text-text dark:text-dark-text">{template}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={handleCopy} className="btn-outline text-sm">
                            <Copy className="h-4 w-4" />
                            Copy text
                        </button>
                        <button type="button" onClick={openContact} className="btn-primary text-sm">
                            {plan.contactCtaLabel}
                            <ExternalLink className="h-4 w-4" />
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

function HowToSubscribeModal({
    open,
    plan,
    onClose,
}: {
    open: boolean;
    plan: SubscriptionPlanItem | null;
    onClose: () => void;
}) {
    if (!open || !plan) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className="w-full max-w-lg rounded-t-2xl border border-card-border bg-card p-5 shadow-xl dark:border-dark-border dark:bg-dark-surface sm:rounded-2xl"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-lg font-heading font-bold text-text dark:text-dark-text">How to subscribe</h3>
                        <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-background dark:hover:bg-dark-bg">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-text-muted dark:text-dark-text/70">
                        <li>Choose your preferred plan: {plan.name}.</li>
                        <li>Click contact button and message admin with your details.</li>
                        <li>Complete payment (if required) and send proof/reference.</li>
                        <li>Admin approves and activates your subscription.</li>
                    </ol>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default function SubscriptionPlansPage() {
    const { user } = useAuth();
    const plansQuery = useSubscriptionPlansQuery();
    const mySubscriptionQuery = useMySubscriptionQuery(Boolean(user));

    const [typeFilter, setTypeFilter] = useState<PlanTypeFilter>('all');
    const [search, setSearch] = useState('');
    const [showUnavailable] = useState(false);
    const [activePlan, setActivePlan] = useState<SubscriptionPlanItem | null>(null);
    const [showContactFlow, setShowContactFlow] = useState(false);
    const [showHowToSubscribe, setShowHowToSubscribe] = useState(false);

    const settings = plansQuery.data?.settings;
    const currency = settings?.currencyLabel || 'BDT';
    const title = settings?.pageTitle || 'Subscription Plans';
    const subtitle = settings?.pageSubtitle || 'Choose your plan and unlock premium features.';
    const headerBanner = settings?.headerBannerUrl || null;
    const defaultBanner = settings?.defaultPlanBannerUrl || null;

    const filteredItems = useMemo(() => {
        const q = search.trim().toLowerCase();
        const rows = plansQuery.data?.items || [];
        const visible = rows.filter((plan) => (showUnavailable ? true : plan.enabled));
        const typed = visible.filter((plan) => (typeFilter === 'all' ? true : plan.type === typeFilter));
        const searched = typed.filter((plan) => {
            if (!q) return true;
            return plan.name.toLowerCase().includes(q) || (plan.shortDescription || '').toLowerCase().includes(q);
        });
        const featuredFirst = settings?.showFeaturedFirst !== false;
        const sorted = [...searched].sort((a, b) => {
            if (featuredFirst && a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
            return a.displayOrder - b.displayOrder;
        });
        return sorted;
    }, [plansQuery.data?.items, search, settings?.showFeaturedFirst, showUnavailable, typeFilter]);

    const featured = useMemo(() => filteredItems.filter((item) => item.isFeatured), [filteredItems]);

    const showFaq = true;

    const openContact = (plan: SubscriptionPlanItem) => {
        setActivePlan(plan);
        setShowContactFlow(true);
    };

    const openHowTo = (plan: SubscriptionPlanItem) => {
        setActivePlan(plan);
        setShowHowToSubscribe(true);
    };

    return (
        <div className="section-container overflow-x-hidden py-6 sm:py-8">
            <div className="space-y-6">
                <section className="overflow-hidden rounded-2xl border border-card-border/70 bg-card shadow-sm dark:border-dark-border/70 dark:bg-dark-surface">
                    <div className="relative p-5 sm:p-7">
                        {headerBanner ? (
                            <img src={headerBanner} alt="Subscription banner" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-accent/70" />
                        <div className="relative z-10">
                            <h1 className="text-2xl font-heading font-bold text-white sm:text-3xl">{title}</h1>
                            <p className="mt-2 max-w-2xl text-sm text-white/85">{subtitle}</p>
                        </div>
                    </div>
                </section>

                {user && (
                    <section className="rounded-2xl border border-card-border/70 bg-card p-4 dark:border-dark-border/70 dark:bg-dark-surface">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted dark:text-dark-text/60">My Subscription</h2>
                        {mySubscriptionQuery.isLoading ? (
                            <div className="mt-2 h-14 animate-pulse rounded-xl bg-background dark:bg-dark-bg" />
                        ) : mySubscriptionQuery.data?.status === 'active' ? (
                            <p className="mt-2 text-sm text-text dark:text-dark-text">
                                {mySubscriptionQuery.data.planName || 'Active Plan'} • Expires {formatDate(mySubscriptionQuery.data.expiresAtUTC)} • {mySubscriptionQuery.data.daysLeft ?? 'N/A'} days left
                            </p>
                        ) : (
                            <p className="mt-2 text-sm text-text-muted dark:text-dark-text/70">
                                No active subscription yet. Contact admin to activate one.
                            </p>
                        )}
                    </section>
                )}

                <section className="rounded-2xl border border-card-border/70 bg-card p-4 dark:border-dark-border/70 dark:bg-dark-surface">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-[auto,auto,1fr]">
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setTypeFilter('all')} className={`tab-pill ${typeFilter === 'all' ? 'tab-pill-active' : 'tab-pill-inactive'}`}>All</button>
                            <button type="button" onClick={() => setTypeFilter('free')} className={`tab-pill ${typeFilter === 'free' ? 'tab-pill-active' : 'tab-pill-inactive'}`}>Free</button>
                            <button type="button" onClick={() => setTypeFilter('paid')} className={`tab-pill ${typeFilter === 'paid' ? 'tab-pill-active' : 'tab-pill-inactive'}`}>Paid</button>
                        </div>
                        <div className="relative md:col-span-2">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search plans..."
                                className="input-field h-10 pl-10"
                            />
                        </div>
                    </div>
                </section>

                {featured.length > 0 && (
                    <section>
                        <h2 className="mb-3 text-lg font-heading font-bold text-text dark:text-dark-text">Featured Plans</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {featured.map((plan) => (
                                <PlanCard
                                    key={`featured-${plan.id}`}
                                    plan={plan}
                                    defaultPlanBannerUrl={defaultBanner}
                                    currencyLabel={currency}
                                    onPrimaryCta={openContact}
                                    onHowToSubscribe={openHowTo}
                                />
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    {plansQuery.isLoading ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <div key={idx} className="h-[430px] animate-pulse rounded-2xl border border-card-border/70 bg-card/60 dark:border-dark-border/70 dark:bg-dark-surface/60" />
                            ))}
                        </div>
                    ) : plansQuery.isError ? (
                        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 text-sm text-danger">
                            <p>Could not load subscription plans right now.</p>
                            <button type="button" className="btn-secondary mt-3 text-sm" onClick={() => plansQuery.refetch()}>
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </button>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-card-border/70 bg-card/50 p-8 text-center text-sm text-text-muted dark:border-dark-border/70 dark:bg-dark-surface/40 dark:text-dark-text/70">
                            <p>No plans found.</p>
                            <button
                                type="button"
                                className="mt-3 text-sm font-medium text-primary hover:text-accent"
                                onClick={() => {
                                    setTypeFilter('all');
                                    setSearch('');
                                }}
                            >
                                Reset filters
                            </button>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: { opacity: 1, transition: { staggerChildren: 0.06 } },
                            }}
                            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {filteredItems.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    defaultPlanBannerUrl={defaultBanner}
                                    currencyLabel={currency}
                                    onPrimaryCta={openContact}
                                    onHowToSubscribe={openHowTo}
                                />
                            ))}
                        </motion.div>
                    )}
                </section>

                {showFaq && (
                    <section className="rounded-2xl border border-card-border/70 bg-card p-5 dark:border-dark-border/70 dark:bg-dark-surface">
                        <h2 className="mb-3 text-lg font-heading font-bold text-text dark:text-dark-text">FAQ</h2>
                        <div className="space-y-2 text-sm">
                            <details className="rounded-xl border border-card-border/70 p-3 dark:border-dark-border/70">
                                <summary className="cursor-pointer font-medium">How do I activate a paid plan?</summary>
                                <p className="mt-2 text-text-muted dark:text-dark-text/70">Use the contact button, send your info and payment details, then wait for admin approval.</p>
                            </details>
                            <details className="rounded-xl border border-card-border/70 p-3 dark:border-dark-border/70">
                                <summary className="cursor-pointer font-medium">When does validity start?</summary>
                                <p className="mt-2 text-text-muted dark:text-dark-text/70">Validity starts from admin activation time and lasts for the selected duration.</p>
                            </details>
                            <details className="rounded-xl border border-card-border/70 p-3 dark:border-dark-border/70">
                                <summary className="cursor-pointer font-medium">Can I switch plans later?</summary>
                                <p className="mt-2 text-text-muted dark:text-dark-text/70">Yes. Contact admin anytime to upgrade, renew, or change your plan.</p>
                            </details>
                        </div>
                    </section>
                )}
            </div>

            <ContactFlowModal open={showContactFlow} plan={activePlan} onClose={() => setShowContactFlow(false)} />
            <HowToSubscribeModal open={showHowToSubscribe} plan={activePlan} onClose={() => setShowHowToSubscribe(false)} />
        </div>
    );
}
