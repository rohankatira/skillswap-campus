
import { Users } from 'lucide-react';
import StudentCard from './StudentCard';

export default function StudentList({
  students = [],
  matchScores = {},
  requestedIds = [],
  onSendRequest,
}) {
  if (!students.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-gray-700">
        <Users size={36} className="mx-auto text-gray-400" />
        <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">
          No students found
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {students.map((student) => {
        const id = student._id || student.id;

        return (
          <StudentCard
            key={id}
            student={student}
            matchScore={matchScores[id]}
            requestSent={requestedIds.some(
              (rid) => String(rid) === String(id)
            )}
            onSendRequest={onSendRequest}
          />
        );
      })}
    </div>
  );
}
