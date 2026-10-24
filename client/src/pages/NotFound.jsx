
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
          <Search size={38} />
        </div>

        <p className="mt-7 text-sm font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
          ERROR 404
        </p>

        <h1 className="mt-3 text-4xl font-extrabold text-gray-900 dark:text-white">
          Page not found
        </h1>

        <p className="mt-4 leading-7 text-gray-600 dark:text-gray-300">
          Sorry, we couldn't find the page you're looking for. It may
          have moved or the address may be incorrect.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            <Home size={18} />
            Go home
          </Link>

          <Link
            to="/students"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ArrowLeft size={18} />
            Browse students
          </Link>
        </div>
      </div>
    </section>
  );
}
