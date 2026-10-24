
import { Sparkles } from 'lucide-react';

export default function MatchScore({ score = 0 }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-2 dark:bg-indigo-950/60"
      aria-label={`${safeScore}% match`}
    >
      <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
        {safeScore}% Match
      </span>
    </div>
  );
}
