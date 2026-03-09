import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptySectionProps {
  icon?: LucideIcon;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export default function EmptySection({
  icon: Icon = Inbox,
  message = 'Nothing to show right now',
  ctaLabel,
  ctaHref,
}: EmptySectionProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
      <div className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800/60 mb-3">
        <Icon className="w-8 h-8 opacity-50" />
      </div>
      <p className="text-sm font-medium">{message}</p>
      {ctaLabel && ctaHref && (
        <Link
          to={ctaHref}
          className="mt-3 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}
