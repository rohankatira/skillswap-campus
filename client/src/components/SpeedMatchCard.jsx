import { useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

export default function SpeedMatchCard({
  students = [],
  currentIndex = 0,
  onIndexChange,
  matchScores = {},
  requestedIds = [],
  onSendRequest,
  myProfile,
}) {
  const student = students[currentIndex];

  // Keyboard navigation: Left/Right arrows
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' && currentIndex < students.length - 1) {
        onIndexChange(currentIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onIndexChange(currentIndex - 1);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, students.length, onIndexChange]);

  if (!student) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-800">
        <Sparkles size={36} className="mx-auto text-gray-400" />
        <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">All caught up!</h3>
        <p className="mt-1 text-sm text-gray-500">No more students matching your filters.</p>
      </div>
    );
  }

  const id = student._id || student.id;
  const score = matchScores[id] || 0;
  const isRequested = requestedIds.includes(String(id));

  // Compute what you teach them vs what they teach you
  const myTeach = (myProfile?.teachSkills || []).map((s) => s.toLowerCase());
  const myLearn = (myProfile?.learnSkills || []).map((s) => s.toLowerCase());
  const theirTeach = (student.teachSkills || student.skillsToTeach || []);
  const theirLearn = (student.learnSkills || student.skillsToLearn || []);

  const youCanTeachThem = myTeach.length
    ? theirLearn.filter((s) => myTeach.includes(s.toLowerCase()))
    : [];
  const theyCanTeachYou = myLearn.length
    ? theirTeach.filter((s) => myLearn.includes(s.toLowerCase()))
    : [];

  return (
    <div className="mx-auto max-w-xl">
      {/* Top Pagination Bar */}
      <div className="mb-4 flex items-center justify-between px-2 text-xs text-gray-500 dark:text-gray-400">
        <span>
          Student <strong>{currentIndex + 1}</strong> of <strong>{students.length}</strong>
        </span>
        <span className="hidden sm:inline text-gray-400">
          Tip: Use ⬅️ ➡️ arrow keys to navigate
        </span>
      </div>

      {/* Main Focus Card */}
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 transition">
        {/* Banner with gradient accent */}
        <div className="relative h-28 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 p-4">
          <div className="absolute right-4 top-4">
            {score > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-indigo-700 shadow dark:bg-gray-900 dark:text-indigo-300">
                <Sparkles size={13} className="text-amber-500" />
                {score}% Compatibility Match
              </div>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 pt-0">
          <div className="-mt-12 flex items-end justify-between">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-indigo-100 text-2xl font-bold text-indigo-700 shadow-md dark:border-gray-900 dark:bg-indigo-950 dark:text-indigo-300">
              {student.avatar || student.profileImage ? (
                <img
                  src={student.avatar || student.profileImage}
                  alt={student.name}
                  className="size-full object-cover"
                />
              ) : (
                (student.name || 'S').charAt(0).toUpperCase()
              )}
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {student.name}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
              <GraduationCap size={16} />
              {student.course || 'Student'}
            </p>
          </div>

          {student.bio && (
            <p className="mt-3.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              "{student.bio}"
            </p>
          )}

          {/* Mutual Compatibility Radar / Breakdown */}
          <div className="mt-6 rounded-2xl bg-indigo-50/60 p-4 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              <Sparkles size={14} />
              Mutual Exchange Breakdown
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800/80">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  🎯 You can teach {student.name}:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {youCanTeachThem.length ? (
                    youCanTeachThem.map((s) => (
                      <span key={s} className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">
                      {theirLearn.slice(0, 2).join(', ') || 'Various skills'}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800/80">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  💡 {student.name} can teach you:
                </span>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {theyCanTeachYou.length ? (
                    theyCanTeachYou.map((s) => (
                      <span key={s} className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">
                      {theirTeach.slice(0, 2).join(', ') || 'Various skills'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation & Action Controls */}
          <div className="mt-6 flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => onIndexChange(currentIndex - 1)}
              className="flex size-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition"
              title="Previous student"
            >
              <ChevronLeft size={22} />
            </button>

            <button
              type="button"
              disabled={isRequested}
              onClick={() => onSendRequest?.(student)}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 font-bold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition transform active:scale-95"
            >
              <MessageCircle size={18} />
              {isRequested ? 'Request Sent' : '⚡ Propose Swap'}
            </button>

            <button
              type="button"
              disabled={currentIndex >= students.length - 1}
              onClick={() => onIndexChange(currentIndex + 1)}
              className="flex size-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition"
              title="Next student"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
