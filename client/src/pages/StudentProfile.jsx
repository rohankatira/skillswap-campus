
import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  LoaderCircle,
  LogIn,
  MessageCircle,
  Pencil,
  UserPlus,
  UserRound,
} from 'lucide-react';

import useStudents from '../hooks/useStudents';
import useRequests from '../hooks/useRequests';
import { useAuth } from '../context/AuthContext';
import MatchScore from '../components/MatchScore';

export default function StudentProfile() {
  const { id } = useParams();
  const location = useLocation();
  const { students, loading, error } = useStudents();
  const { sendRequest } = useRequests({ enabled: false });
  const { isAuthenticated, profile, hasProfile, profileLoading } = useAuth();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  const student = students.find(
    (item) => String(item._id || item.id) === String(id)
  );

  const isOwnProfile =
    hasProfile && student && String(profile._id) === String(student._id || student.id);

  async function handleSendRequest(event) {
    event.preventDefault();

    if (!student || sending) return;

    setSending(true);
    setFeedback('');
    setSent(false);

    try {
      const studentId = student._id || student.id;

      // Sender is determined on the server from the signed-in session.
      await sendRequest({
        recipient: studentId,
        message:
          message.trim() ||
          'Hi! I would like to exchange skills with you.',
      });

      setSent(true);
      setFeedback('Your exchange request has been sent.');
      setMessage('');
    } catch (err) {
      setFeedback(err.message || 'Could not send the request.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center gap-3 text-gray-500">
        <LoaderCircle className="animate-spin" size={24} />
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-rose-600 dark:text-rose-400">{error}</p>
        <Link to="/students" className="mt-4 inline-block text-indigo-600">
          Back to students
        </Link>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <UserRound size={40} className="mx-auto text-gray-400" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          Student not found
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          This profile may have been removed or the link may be incorrect.
        </p>
        <Link
          to="/students"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700"
        >
          <ArrowLeft size={17} />
          Browse students
        </Link>
      </div>
    );
  }

  const teachSkills = student.teachSkills || student.skillsToTeach || [];
  const learnSkills = student.learnSkills || student.skillsToLearn || [];
  const initials = (student.name || 'Student')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        to="/students"
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
      >
        <ArrowLeft size={17} />
        Back to students
      </Link>

      <article className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-500" />

        <div className="px-6 pb-7 sm:px-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex size-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-indigo-100 text-2xl font-bold text-indigo-700 dark:border-gray-900 dark:bg-indigo-950 dark:text-indigo-300">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={`${student.name}'s avatar`}
                  className="size-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            {student.matchScore !== undefined && (
              <MatchScore score={student.matchScore} />
            )}
          </div>

          <h1 className="mt-5 text-3xl font-bold text-gray-900 dark:text-white">
            {student.name || 'Student'}
          </h1>

          <p className="mt-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <GraduationCap size={18} />
            {student.course || 'Course not specified'}
          </p>

          <p className="mt-5 leading-7 text-gray-600 dark:text-gray-300">
            {student.bio || 'This student has not added a bio yet.'}
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl bg-indigo-50 p-5 dark:bg-indigo-950/40">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <BookOpen size={19} className="text-indigo-600 dark:text-indigo-400" />
                Skills to teach
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {teachSkills.length ? (
                  teachSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-white px-3 py-1.5 text-sm text-indigo-700 dark:bg-gray-900 dark:text-indigo-300"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No skills listed.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl bg-emerald-50 p-5 dark:bg-emerald-950/30">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <BookOpen size={19} className="text-emerald-600 dark:text-emerald-400" />
                Skills to learn
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {learnSkills.length ? (
                  learnSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-white px-3 py-1.5 text-sm text-emerald-700 dark:bg-gray-900 dark:text-emerald-300"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No skills listed.</p>
                )}
              </div>
            </div>
          </div>

          {profileLoading ? (
            <div className="mt-8 flex items-center gap-2 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-800">
              <LoaderCircle size={16} className="animate-spin" />
              Checking your account...
            </div>
          ) : !isAuthenticated ? (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-300">
                Sign in to request a skill exchange with {student.name || 'this student'}.
              </p>
              <Link
                to="/sign-in"
                state={{ from: location }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                <LogIn size={18} />
                Sign in
              </Link>
            </div>
          ) : !hasProfile ? (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-300">
                Create your student profile to send exchange requests.
              </p>
              <Link
                to="/profile"
                state={{ from: location }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                <UserPlus size={18} />
                Create profile
              </Link>
            </div>
          ) : isOwnProfile ? (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-300">
                This is your public profile.
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Pencil size={18} />
                Edit profile
              </Link>
            </div>
          ) : (
          <form
            onSubmit={handleSendRequest}
            className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Request a skill exchange
            </h2>

            <label
              htmlFor="request-message"
              className="mt-4 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Message (optional)
            </label>

            <textarea
              id="request-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Hi! I'd love to learn from you..."
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />

            {feedback && (
              <p
                role="status"
                className={`mt-3 text-sm ${
                  sent
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {feedback}{' '}
                {sent && (
                  <Link to="/requests" className="font-medium underline">
                    View my requests
                  </Link>
                )}
              </p>
            )}

            <button
              id="send-request-btn"
              type="submit"
              disabled={sending}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageCircle size={18} />
              {sending ? 'Sending...' : 'Send exchange request'}
            </button>
          </form>
          )}
        </div>
      </article>
    </section>
  );
}
