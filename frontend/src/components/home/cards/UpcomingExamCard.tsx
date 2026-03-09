import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CalendarDays, Globe, Info } from 'lucide-react';
import { daysUntil, urgencyTone } from '../CountdownChip';
import type { ApiUniversityCardPreview } from '../../../services/api';

interface UpcomingExamCardProps {
  university: ApiUniversityCardPreview;
}

const accentTone: Record<string, string> = {
  danger: 'border-l-red-500',
  warning: 'border-l-amber-500',
  success: 'border-l-teal-500',
  muted: 'border-l-gray-400',
};

const chipTone: Record<string, string> = {
  danger: 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  success: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
  muted: 'bg-gray-200/60 text-gray-500 dark:bg-gray-700/60 dark:text-gray-400',
};

function pickExamDate(uni: ApiUniversityCardPreview): string | undefined {
  return uni.examDateScience || uni.examDateArts || uni.examDateBusiness
    || uni.scienceExamDate || uni.artsExamDate || uni.businessExamDate;
}

function pickExamUnit(uni: ApiUniversityCardPreview): string | null {
  if (uni.examDateScience || uni.scienceExamDate) return 'Science';
  if (uni.examDateArts || uni.artsExamDate) return 'Arts';
  if (uni.examDateBusiness || uni.businessExamDate) return 'Commerce';
  return null;
}

export default function UpcomingExamCard({ university: uni }: UpcomingExamCardProps) {
  const examDate = pickExamDate(uni);
  const days = daysUntil(examDate);
  const tone = urgencyTone(days);
  const unit = pickExamUnit(uni);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`snap-start shrink-0 w-[280px] sm:w-[300px] md:w-[320px] rounded-2xl border border-gray-200 dark:border-gray-700 border-l-4 ${accentTone[tone]} bg-white dark:bg-gray-900 shadow-card hover:shadow-card-hover transition-shadow flex flex-col overflow-hidden`}
    >
      {/* Header */}
      <div className="p-4 pb-3 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
          {uni.logoUrl ? (
            <img src={uni.logoUrl} alt={uni.shortForm} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{uni.shortForm?.slice(0, 3)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/universities/${uni.slug}`} className="block">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white leading-snug line-clamp-2 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              {uni.name}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium">
              {uni.category}
            </span>
            {unit && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-medium">
                {unit} Unit
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Exam date info */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
          <CalendarDays className="w-3.5 h-3.5" />
          {examDate
            ? new Date(examDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : 'TBD'}
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${chipTone[tone]}`}>
          <CalendarDays className="w-3 h-3" />
          {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `in ${days} days`}
        </span>
      </div>

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
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
        >
          <Info className="w-3.5 h-3.5" /> Details
        </Link>
      </div>
    </motion.div>
  );
}
