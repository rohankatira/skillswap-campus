
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, MessageCircle, UserRound } from 'lucide-react';
import MatchScore from './MatchScore';

function SkillTags({ skills = [], color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  };

  if (!skills.length) {
    return <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Not specified</p>;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {skills.map((skill) => (
        <span
          key={skill}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[color]}`}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

export default function StudentCard({
  student,
  matchScore,
  onSendRequest,
  requestSent = false,
}) {
  if (!student) return null;

  const id = student._id || student.id;
  const name = student.name || 'Student';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const teachSkills = student.teachSkills || student.skillsToTeach || [];
  const learnSkills = student.learnSkills || student.skillsToLearn || [];

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={`${name}'s avatar`}
                className="size-12 rounded-full object-cover"
              />
            ) : (
              initials || <UserRound size={22} />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-semibold text-gray-900 dark:text-white">
              {name}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <GraduationCap size={15} />
              <span className="truncate">{student.course || 'Course not listed'}</span>
            </p>
          </div>
        </div>

        {matchScore !== undefined && matchScore > 0 && (
          <MatchScore score={matchScore} />
        )}
      </div>

      {student.bio && (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
          {student.bio}
        </p>
      )}

      <div className="mt-5">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
          <BookOpen size={15} className="text-indigo-500" />
          Can teach
        </h4>
        <SkillTags skills={teachSkills} color="indigo" />
      </div>

      <div className="mt-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
          <BookOpen size={15} className="text-emerald-500" />
          Wants to learn
        </h4>
        <SkillTags skills={learnSkills} color="emerald" />
      </div>

      {/* Action buttons pushed to the bottom */}
      <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
        {/* Profile button is a real link so right-click → new tab works */}
        <Link
          to={`/students/${id}`}
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <UserRound size={16} />
          Profile
        </Link>

        <button
          type="button"
          disabled={requestSent}
          onClick={() => onSendRequest?.(student)}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400 dark:disabled:bg-gray-600"
        >
          <MessageCircle size={16} />
          {requestSent ? 'Requested' : 'Connect'}
        </button>
      </div>
    </article>
  );
}
