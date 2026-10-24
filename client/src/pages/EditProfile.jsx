
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { saveMyProfile } from '../services/studentService';
import SkillTagInput from '../components/SkillTagInput';
import { MAX_BIO_LENGTH, SKILL_CATEGORIES } from '../utils/constants';

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-400';

function toForm(profile, user) {
  return {
    name: profile?.name || user?.name || '',
    course: profile?.course || '',
    bio: profile?.bio || '',
    teachSkills: profile?.teachSkills || [],
    learnSkills: profile?.learnSkills || [],
  };
}

export default function EditProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, profile, profileLoading, setProfile } = useAuth();

  const isNew = !profile;
  const isWelcome = searchParams.get('welcome') === '1';
  const redirectTo = location.state?.from?.pathname;

  const [form, setForm] = useState(() => toForm(profile, user));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fill the form once, after the profile finishes loading.
  const initialized = useRef(false);
  useEffect(() => {
    if (!profileLoading && !initialized.current) {
      initialized.current = true;
      setForm(toForm(profile, user));
    }
  }, [profileLoading, profile, user]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) return setError('Please enter your name.');
    if (!form.course.trim()) return setError('Please enter your course.');
    if (!form.teachSkills.length && !form.learnSkills.length) {
      return setError('Add at least one skill you can teach or want to learn.');
    }

    setSaving(true);
    setError('');

    try {
      const student = await saveMyProfile({
        name: form.name.trim(),
        course: form.course.trim(),
        bio: form.bio.trim(),
        teachSkills: form.teachSkills,
        learnSkills: form.learnSkills,
      });

      setProfile(student);

      if (isNew || redirectTo) {
        navigate(redirectTo || '/students', { replace: true });
      } else {
        setSaved(true);
      }
    } catch (err) {
      setError(err.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  }

  if (profileLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center gap-3 text-gray-500">
        <Loader2 className="animate-spin" size={24} />
        Loading your profile...
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        {isNew ? (
          <>
            <p className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Sparkles size={14} />
              {isWelcome ? 'Welcome to SkillSwap' : 'One last step'}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
              Create your student profile
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Tell other students what you can teach and what you want to learn.
              You need a profile to send and receive exchange requests.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold text-indigo-600 dark:text-indigo-400">
              YOUR PROFILE
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              Edit profile
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Keep your skills up to date to get better matches.{' '}
              <Link
                to={`/students/${profile._id}`}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                View public profile →
              </Link>
            </p>
          </>
        )}
      </div>

      <form
        id="profile-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8"
      >
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {saved && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <CheckCircle2 size={16} />
            Profile saved.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-name"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full name
            </label>
            <div className="relative">
              <UserRound
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                id="profile-name"
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                maxLength={100}
                required
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="profile-course"
              className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Course
            </label>
            <div className="relative">
              <GraduationCap
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-hidden="true"
              />
              <input
                id="profile-course"
                type="text"
                value={form.course}
                onChange={(e) => update('course', e.target.value)}
                maxLength={100}
                required
                placeholder="e.g. B.Tech Computer Science"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            Email
          </p>
          <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
            {user?.email}
          </p>
        </div>

        <div>
          <label
            htmlFor="profile-bio"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Bio <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="profile-bio"
            rows={4}
            value={form.bio}
            onChange={(e) => update('bio', e.target.value)}
            maxLength={MAX_BIO_LENGTH}
            placeholder="A short intro — what you're studying, what you enjoy, how you like to learn..."
            className={inputClass}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {form.bio.length}/{MAX_BIO_LENGTH}
          </p>
        </div>

        <SkillTagInput
          id="profile-teach-skills"
          label="Skills I can teach"
          value={form.teachSkills}
          onChange={(skills) => update('teachSkills', skills)}
          suggestions={SKILL_CATEGORIES}
          tone="indigo"
        />

        <SkillTagInput
          id="profile-learn-skills"
          label="Skills I want to learn"
          value={form.learnSkills}
          onChange={(skills) => update('learnSkills', skills)}
          suggestions={SKILL_CATEGORIES}
          tone="emerald"
        />

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 pt-6 dark:border-gray-800">
          {!isNew && (
            <Link
              to={`/students/${profile._id}`}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </Link>
          )}
          <button
            id="profile-submit"
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Saving…' : isNew ? 'Create profile' : 'Save changes'}
          </button>
        </div>
      </form>
    </section>
  );
}
