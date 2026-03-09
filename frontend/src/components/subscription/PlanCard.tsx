import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, ExternalLink, Sparkles } from 'lucide-react';
import type { SubscriptionPlanItem } from '../../services/subscriptionApi';

type Props = {
  plan: SubscriptionPlanItem;
  defaultPlanBannerUrl?: string | null;
  currencyLabel: string;
  onPrimaryCta: (plan: SubscriptionPlanItem) => void;
  onHowToSubscribe: (plan: SubscriptionPlanItem) => void;
};

function formatPrice(plan: SubscriptionPlanItem, currencyLabel: string): string {
  if (plan.type === 'free' || plan.priceBDT <= 0) return 'Free';
  return `${currencyLabel} ${plan.priceBDT.toLocaleString()}`;
}

export default function PlanCard({
  plan,
  defaultPlanBannerUrl,
  currencyLabel,
  onPrimaryCta,
  onHowToSubscribe,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const banner = plan.bannerImageUrl || defaultPlanBannerUrl || '/logo.png';
  const features = useMemo(() => Array.from(new Set(plan.features || [])).filter(Boolean), [plan.features]);
  const collapsedFeatures = features.slice(0, 4);
  const visibleFeatures = expanded ? features.slice(0, 8) : collapsedFeatures;
  const canHover = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileHover={canHover ? { y: -6 } : undefined}
      className="overflow-hidden rounded-[18px] border border-card-border/80 bg-card shadow-sm transition-shadow hover:shadow-lg dark:border-dark-border/80 dark:bg-dark-surface"
      data-testid="subscription-plan-card"
    >
      <div className="relative h-40 overflow-hidden border-b border-card-border/60 dark:border-dark-border/60">
        <img src={banner} alt={plan.name} loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${plan.type === 'free' ? 'bg-emerald-500 text-white' : 'bg-primary text-white'}`}>
            {plan.type === 'free' ? 'Free' : 'Paid'}
          </span>
          {plan.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" />
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div>
          <h3 className="text-lg font-heading font-bold text-text dark:text-dark-text">{plan.name}</h3>
          {plan.shortDescription ? (
            <p className="mt-1 text-sm leading-relaxed text-text-muted dark:text-dark-text/70">{plan.shortDescription}</p>
          ) : null}
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted dark:text-dark-text/60">Price</p>
          <p className="mt-0.5 text-2xl font-black text-primary dark:text-primary-300">{formatPrice(plan, currencyLabel)}</p>
          <p className="mt-1 text-xs text-text-muted dark:text-dark-text/60">Valid for {plan.durationDays} days</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted dark:text-dark-text/60">Features</p>
          <ul className="space-y-1.5">
            {visibleFeatures.length > 0 ? (
              visibleFeatures.map((feature, index) => (
                <li key={`${plan.id}-feature-${index}`} className="flex items-start gap-2 text-sm text-text-muted dark:text-dark-text/75">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  <span className="break-words [overflow-wrap:anywhere]">{feature}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-text-muted dark:text-dark-text/70">Feature list will be updated by admin.</li>
            )}
          </ul>

          {features.length > 4 && (
            <button
              type="button"
              onClick={() => setExpanded((p) => !p)}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-accent"
            >
              {expanded ? 'Show less' : `Show more (${Math.min(features.length, 8) - 4})`}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => onPrimaryCta(plan)} className="btn-primary text-sm">
            {plan.contactCtaLabel || 'Contact to Subscribe'}
            <ExternalLink className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onHowToSubscribe(plan)} className="btn-outline text-sm">
            How to subscribe
          </button>
        </div>
      </div>
    </motion.article>
  );
}
