
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Users,
  Handshake,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Share Your Skills',
    description:
      'Teach what you know and help other students grow.',
  },
  {
    icon: Users,
    title: 'Find Learning Partners',
    description:
      'Discover students who share your interests and goals.',
  },
  {
    icon: Handshake,
    title: 'Exchange Knowledge',
    description:
      'Connect with other students and learn together.',
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">
              <Sparkles size={16} />
              Learn together. Grow together.
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              Your skills are
              <span className="block text-indigo-200">
                worth sharing.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-indigo-100 sm:text-lg">
              SkillSwap Campus connects students who want to teach
              what they know and learn something new from others.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/students"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
              >
                Find students
                <ArrowRight size={18} />
              </Link>

              <a
                href="#how-it-works"
                className="rounded-xl border border-white/40 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                How it works
              </a>
            </div>
          </div>

          <div className="mx-auto flex size-64 items-center justify-center rounded-full border border-white/20 bg-white/10 sm:size-80">
            <div className="flex size-48 items-center justify-center rounded-full bg-white/10 sm:size-64">
              <div className="flex size-36 items-center justify-center rounded-3xl bg-white text-indigo-600 shadow-2xl sm:size-48">
                <Handshake size={100} strokeWidth={1.4} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
      >
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="font-semibold text-indigo-600 dark:text-indigo-400">
            WHY SKILLSWAP?
          </p>
          <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            Knowledge grows when shared
          </h2>
          <p className="mt-4 leading-7 text-gray-600 dark:text-gray-300">
            Turn your strengths into opportunities to learn from your
            campus community.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                <Icon size={25} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h3>

              <p className="mt-2 leading-7 text-gray-600 dark:text-gray-300">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-gray-100 p-8 dark:bg-gray-900 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ready to discover a new skill?
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Find your next learning partner today.
            </p>
          </div>

          <Link
            to="/students"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            Explore students
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
