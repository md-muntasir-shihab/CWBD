import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import { useWebsiteSettings } from '../hooks/useWebsiteSettings';
import { useSubscriptionPlanById } from '../hooks/useSubscriptionPlans';
import { normalizeInternalOrExternalUrl } from '../utils/url';

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

export default function SubscriptionPlanDetailPage() {
    const params = useParams<{ planId: string }>();
    const { data: websiteSettings } = useWebsiteSettings();
    const planQuery = useSubscriptionPlanById(params.planId || '');

    const plan = planQuery.data;
    const defaultBanner = websiteSettings?.subscriptionDefaultBannerUrl || websiteSettings?.logo || '/logo.png';
    const currencySymbol = websiteSettings?.pricingUi?.currencySymbol || '\u09F3';
    const currencyLocale = websiteSettings?.pricingUi?.currencyLocale || 'bn-BD';

    if (planQuery.isLoading) {
        return (
            <div className="section-container py-20">
                <div className="mx-auto max-w-3xl rounded-2xl border border-card-border/70 bg-card/70 p-10 text-center dark:border-dark-border/70 dark:bg-slate-900/50">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="mt-3 text-sm text-text-muted dark:text-dark-text/70">Loading plan details...</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="section-container py-20">
                <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-card-border/70 bg-card/70 p-10 text-center dark:border-dark-border/70 dark:bg-slate-900/50">
                    <h1 className="text-2xl font-bold text-text dark:text-dark-text">Plan not found</h1>
                    <Link to="/subscription-plans" className="btn-primary mt-4 inline-flex">
                        Back to Subscription Plans
                    </Link>
                </div>
            </div>
        );
    }

    const price = Number(plan.priceBDT ?? plan.price ?? 0);
    const priceLabel = plan.type === 'free' || price <= 0
        ? 'Free'
        : formatCurrency(price, currencySymbol, currencyLocale);
    const ctaUrl = normalizeInternalOrExternalUrl(plan.contactCtaUrl) || '/contact';
    const features = Array.from(new Set([...(plan.features || []), ...(plan.includedModules || [])]));
    const tags = (plan.tags || []).filter(Boolean);

    return (
        <div className="section-container py-10 md:py-14">
            <Link to="/subscription-plans" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                <ArrowLeft className="h-4 w-4" />
                Back to plans
            </Link>

            <article className="overflow-hidden rounded-3xl border border-card-border/70 bg-card/80 shadow-xl dark:border-dark-border/70 dark:bg-slate-900/55">
                <div className="h-56 w-full border-b border-card-border/70 dark:border-dark-border/70 md:h-72">
                    <img src={plan.bannerImageUrl || defaultBanner} alt={plan.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-6 md:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-heading font-bold text-text dark:text-dark-text">{plan.name}</h1>
                            <p className="mt-2 text-sm text-text-muted dark:text-dark-text/70">{plan.shortDescription || plan.description || 'This plan unlocks premium CampusWay features.'}</p>
                        </div>
                        <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-right">
                            <p className="text-xs font-medium text-text-muted dark:text-dark-text/70">Price</p>
                            <p className="text-2xl font-bold text-primary">{priceLabel}</p>
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-text-muted dark:text-dark-text/70">
                                <CalendarClock className="h-3.5 w-3.5" />
                                Valid for {plan.durationDays || plan.durationValue} {plan.durationUnit || 'days'}
                            </p>
                        </div>
                    </div>

                    {tags.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                                <span key={tag} className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    ) : null}

                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-text dark:text-dark-text">Plan Features</h2>
                        <ul className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            {features.length === 0 ? (
                                <li className="text-sm text-text-muted dark:text-dark-text/70">Feature list will be updated by admin.</li>
                            ) : features.map((feature, index) => (
                                <li key={`${plan._id}-feature-${index}`} className="flex items-start gap-2 rounded-xl border border-card-border/60 bg-surface/80 px-3 py-2 text-sm text-text-muted dark:border-dark-border/70 dark:bg-dark-surface/60 dark:text-dark-text/80">
                                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link to="/subscription-plans" className="btn-outline">
                            Browse Other Plans
                        </Link>
                        <a
                            href={ctaUrl}
                            target={isHttpUrl(ctaUrl) ? '_blank' : undefined}
                            rel={isHttpUrl(ctaUrl) ? 'noopener noreferrer' : undefined}
                            className="btn-primary"
                        >
                            {plan.contactCtaLabel || 'Contact to Subscribe'}
                            {isHttpUrl(ctaUrl) ? <ExternalLink className="h-4 w-4" /> : null}
                        </a>
                    </div>
                </div>
            </article>
        </div>
    );
}
