
import { GraduationCap, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-center sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 font-semibold text-indigo-600 dark:text-indigo-400">
          <GraduationCap size={22} />
          SkillSwap Campus
        </div>

        <p className="flex flex-wrap items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
          Made for students, with
          <Heart size={14} className="text-rose-500" fill="currentColor" />
          and shared knowledge.
        </p>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} SkillSwap Campus
        </p>
      </div>
    </footer>
  );
}
