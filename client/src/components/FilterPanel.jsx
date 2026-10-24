
import { SlidersHorizontal, X } from 'lucide-react';

export default function FilterPanel({
  courses = [],
  skills = [],
  selectedCourse = '',
  selectedSkill = '',
  onCourseChange,
  onSkillChange,
  onClear,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
          <SlidersHorizontal size={18} />
          Filters
        </h2>

        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
        >
          <X size={15} />
          Clear
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Course
          </span>
          <select
            value={selectedCourse}
            onChange={(event) => onCourseChange?.(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          >
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Skill
          </span>
          <select
            value={selectedSkill}
            onChange={(event) => onSkillChange?.(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          >
            <option value="">All skills</option>
            {skills.map((skill) => (
              <option key={skill} value={skill}>
                {skill}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
