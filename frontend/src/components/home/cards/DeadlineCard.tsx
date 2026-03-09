import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Globe, ExternalLink } from 'lucide-react';
import CountdownChip, { DeadlineProgress, daysUntil, urgencyTone } from '../CountdownChip';
import type { ApiUniversityCardPreview } from '../../../services/api';

interface DeadlineCardProps {
  university: ApiUniversityCardPreview;
}

const borderTone: Record<string, string> = {
  danger: 'border-red-300 dark:border-red-700/60',
  warning: 'border-amber-300 dark:border-amber-700/60',
  success: 'border-emerald-300 dark:border-emerald-700/60',
  muted: 'border-gray-200 dark:border-gray-700',
};

export default function DeadlineCard({ university: uni }: DeadlineCardProps) {
  const endDate = uni.applicationEndDate || uni.applicationEnd;
  const startDate = uni.applicationStartDate || uni.applicationStart;
  const days = daysUntil(endDate);
  const tone = urgencyTone(days);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`snap-start shrink-0 w-[280px] sm:w-[300px] md:w-[320px] rounded-2xl border-2 ${borderTone[tone]} bg-white dark:bg-gray-900 shadow-card hover:shadow-card-hover transition-shadow flex flex-col overflow-hidden`}
    >
      {/* Header with logo + info */}
      <div className="p-4 pb-3 flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
          {uni.logoUrl ? (
            <img src={uni.logoUrl} alt={uni.shortForm} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{uni.shortForm?.slice(0, 3)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/universities/${uni.slug}`} className="block">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-snug line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {uni.name}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
              {uni.category}
            </span>
            {uni.clusterGroup && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">
                {uni.clusterGroup}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Deadline info */}
      <div className="px-4 pb-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Ends: {endDate ? new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBD'}
          </span>
          <CountdownChip targetDate={endDate} size="sm" />
        </div>
        <DeadlineProgress startDate={startDate} endDate={endDate} />
      </div>

      {/* Seats summary */}
      {(uni.totalSeats || uni.scienceSeats || uni.artsSeats || uni.businessSeats) && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
            <span>Total: <b className="text-gray-700 dark:text-gray-300">{uni.totalSeats || '—'}</b></span>
            {uni.scienceSeats && <span>· Sci: {uni.scienceSeats}</span>}
            {uni.artsSeats && <span>· Arts: {uni.artsSeats}</span>}
            {uni.businessSeats && <span>· Biz: {uni.businessSeats}</span>}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-auto px-4 pb-4 flex items-center gap-2">
        {(uni.admissionWebsite || uni.website) && (
          <a
            href={uni.admissionWebsite || uni.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" /> Official
          </a>
        )}
        <Link
          to={`/universities/${uni.slug}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Apply
        </Link>
      </div>
    </motion.div>
  );
}
