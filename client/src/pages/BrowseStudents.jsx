
import { useNavigate } from 'react-router-dom';
import { LoaderCircle, Users } from 'lucide-react';

import useStudents from '../hooks/useStudents';
import useRequests from '../hooks/useRequests';
import { useAuth } from '../context/AuthContext';
import { calculateMatchScore } from '../utils/matchScore';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import StudentList from '../components/StudentList';

export default function BrowseStudents() {
  const navigate = useNavigate();
  const {
    filteredStudents,
    courses,
    skills,
    search,
    setSearch,
    selectedCourse,
    setSelectedCourse,
    selectedSkill,
    setSelectedSkill,
    loading,
    error,
    clearFilters,
  } = useStudents();

  const { isAuthenticated, hasProfile, profile } = useAuth();

  // Only fetch requests if the user has a profile (avoids 403 noise otherwise)
  const { requests, sendRequest } = useRequests({ enabled: hasProfile });

  // IDs of students this user has already sent a request to
  const requestedIds = hasProfile
    ? requests
        .filter(
          (r) =>
            String(r.sender?._id || r.sender) === String(profile?._id)
        )
        .map((r) => String(r.recipient?._id || r.recipient))
    : [];

  // Match scores against the logged-in user's own profile (0 when not signed in or no profile)
  const matchScores = {};
  if (profile) {
    for (const student of filteredStudents) {
      const id = student._id || student.id;
      if (String(id) !== String(profile._id)) {
        matchScores[id] = calculateMatchScore(profile, student);
      }
    }
  }

  async function handleSendRequest(student) {
    if (!isAuthenticated) {
      navigate('/sign-in', {
        state: { from: { pathname: `/students/${student._id || student.id}` } },
      });
      return;
    }

    if (!hasProfile) {
      navigate('/profile', {
        state: { from: { pathname: '/students' } },
      });
      return;
    }

    // Fire and forget — optimistic UI via the requestedIds list
    try {
      await sendRequest({
        recipient: student._id || student.id,
        message: 'Hi! I would like to exchange skills with you.',
      });
    } catch {
      // If it fails (e.g. duplicate request), the user can go to the profile page for feedback
      navigate(`/students/${student._id || student.id}`);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <p className="font-semibold text-indigo-600 dark:text-indigo-400">
          SKILL EXCHANGE
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          Browse Students
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Find students to swap skills with. Filter by course or skill, then
          send a request to get started.
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, course, or skill…"
        />
      </div>

      {/* Filters */}
      <div className="mb-8">
        <FilterPanel
          courses={courses}
          skills={skills}
          selectedCourse={selectedCourse}
          selectedSkill={selectedSkill}
          onCourseChange={setSelectedCourse}
          onSkillChange={setSelectedSkill}
          onClear={clearFilters}
        />
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {filteredStudents.length === 0
            ? 'No students match your filters.'
            : `${filteredStudents.length} student${filteredStudents.length !== 1 ? 's' : ''} found`}
        </p>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
          <LoaderCircle size={26} className="animate-spin" />
          Loading students…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center dark:border-gray-700">
          <Users size={38} className="mx-auto text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No students found
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or clearing the filters.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <StudentList
          students={filteredStudents}
          matchScores={matchScores}
          requestedIds={requestedIds}
          onSendRequest={handleSendRequest}
        />
      )}
    </section>
  );
}
