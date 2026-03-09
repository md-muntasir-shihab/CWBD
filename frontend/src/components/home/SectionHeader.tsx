import { Link } from 'react-router-dom';
import { ArrowRight, type LucideIcon } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  icon?: LucideIcon;
}

export default function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all',
  icon: Icon,
}: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5 md:mb-6">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30">
              <Icon className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
            </div>
          )}
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-heading text-gray-900 dark:text-white leading-tight tracking-tight">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 ml-0 md:ml-0">
            {subtitle}
          </p>
        )}
      </div>
      {viewAllHref && (
        <Link
          to={viewAllHref}
          className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors group"
        >
          {viewAllLabel}
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
