
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  LoaderCircle,
  Send,
  UserPlus,
} from 'lucide-react';

import useRequests from '../hooks/useRequests';
import { useAuth } from '../context/AuthContext';
import ExchangeRequestCard from '../components/ExchangeRequestCard';

export default function MyRequests() {
  const { profile, hasProfile, profileLoading } = useAuth();
  const {
    requests,
    loading,
    error,
    acceptRequest,
    declineRequest,
  } = useRequests({ enabled: hasProfile });

  const [filter, setFilter] = useState('all');
  const [actionError, setActionError] = useState('');

  const visibleRequests = useMemo(
    () => requests.filter((r) => filter === 'all' || r.status === filter),
    [requests, filter]
  );

  async function handleAccept(request) {
    setActionError('');

    try {
      await acceptRequest(request._id || request.id);
    } catch (err) {
      setActionError(err.message || 'Could not accept the request.');
    }
  }

  async function handleDecline(request) {
    setActionError('');

    try {
      await declineRequest(request._id || request.id);
    } catch (err) {
      setActionError(err.message || 'Could not decline the request.');
    }
  }

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'declined', label: 'Declined' },
  ];

  if (profileLoading) {
    return (
      <div className="flex min-h-96 items-center justify-center gap-3 text-gray-500">
        <LoaderCircle size={24} className="animate-spin" />
        Loading...
      </div>
    );
  }

  if (!hasProfile) {
    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
          <UserPlus size={26} />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">
          Create your profile first
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          You need a student profile to send and receive skill exchange requests.
        </p>
        <Link
          to="/profile"
          state={{ from: { pathname: '/requests' } }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Create profile
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="font-semibold text-indigo-600 dark:text-indigo-400">
          YOUR CONNECTIONS
        </p>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          My Exchange Requests
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300">
          Track requests and manage your skill exchanges.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <Send className="text-indigo-600 dark:text-indigo-400" size={22} />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Total requests
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {requests.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <Clock className="text-amber-600 dark:text-amber-400" size={22} />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Pending
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {requests.filter((request) => request.status === 'pending').length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={22} />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Accepted
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {requests.filter((request) => request.status === 'accepted').length}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === item.value
                ? 'bg-indigo-600 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="mb-4 flex items-center gap-2 text-sm text-rose-600">
          <AlertCircle size={18} />
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
          <LoaderCircle size={24} className="animate-spin" />
          Loading requests...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : visibleRequests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-gray-700">
          <Send size={36} className="mx-auto text-gray-400" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No requests found
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Try another filter or browse students to start an exchange.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleRequests.map((request) => (
            <ExchangeRequestCard
              key={request._id || request.id}
              request={request}
              currentUserId={profile?._id}
              onAccept={handleAccept}
              onDecline={handleDecline}
            />
          ))}
        </div>
      )}
    </section>
  );
}
