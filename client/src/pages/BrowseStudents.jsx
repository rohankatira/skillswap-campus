
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, LoaderCircle, Users, Zap } from 'lucide-react';

import useStudents from '../hooks/useStudents';
import useRequests from '../hooks/useRequests';
import { useAuth } from '../context/AuthContext';
import { calculateMatchScore } from '../utils/matchScore';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import StudentList from '../components/StudentList';
import SpeedMatchCard from '../components/SpeedMatchCard';

const CATEGORY_CHIPS = [
  { label: 'All Skills', query: '' },
  { label: '💻 Tech & Code', query: 'web, react, python, javascript, node' },
  { label: '🎨 Design & UI/UX', query: 'figma, design, ui, ux, illustrator' },
  { label: '📐 Math & Science', query: 'calculus, statistics, physics, math' },
  { label: '🗣️ Languages', query: 'spanish, french, english, german, japanese' },
  { label: '💼 Career & Prep', query: 'interview, resume, consulting, leetcode' },
];

export default function BrowseStudents() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'speed'
  const [speedIndex, setSpeedIndex] = useState(0);

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

    try {
      await sendRequest({
        recipient: student._id || student.id,
        message: 'Hi! I would like to exchange skills with you.',
      });
    } catch {
      navigate(`/students/${student._id || student.id}`);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header with View Toggle */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-semibold text-indigo-600 dark:text-indigo-400">
            SKILL EXCHANGE
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            Browse Students
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Find students to swap skills with. Filter by category, or try Speed Match mode.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            <LayoutGrid size={15} />
            Grid View
          </button>

          <button
            type="button"
            onClick={() => setViewMode('speed')}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'speed'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            <Zap size={15} className="text-amber-300" />
            Speed Match
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORY_CHIPS.map((cat) => {
          const active = cat.query === '' ? search === '' : search.toLowerCase().includes(cat.query.split(',')[0]);
          return (
            <button
              key={cat.label}
              type="button"
              onClick={() => {
                setSearch(cat.query === '' ? '' : cat.query.split(',')[0]);
                setSpeedIndex(0);
              }}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setSpeedIndex(0);
          }}
          placeholder="Search by name, course, or skill…"
        />
      </div>

      {/* Filters (Grid Mode) */}
      {viewMode === 'grid' && (
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
      )}

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
      ) : viewMode === 'speed' ? (
        <SpeedMatchCard
          students={filteredStudents}
          currentIndex={speedIndex}
          onIndexChange={setSpeedIndex}
          matchScores={matchScores}
          requestedIds={requestedIds}
          onSendRequest={handleSendRequest}
          myProfile={profile}
        />
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
