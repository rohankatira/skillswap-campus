
import { Check, Clock, MessageCircle, X } from 'lucide-react';

const statusStyles = {
  pending:
    'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  accepted:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  declined:
    'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
};

export default function ExchangeRequestCard({
  request,
  currentUserId,
  onAccept,
  onDecline,
  onMessage,
}) {
  if (!request) return null;

  const status = String(request.status || 'pending').toLowerCase();
  const statusClass = statusStyles[status] || statusStyles.pending;

  const sender =
    typeof request.sender === 'object'
      ? request.sender
      : { name: request.senderName || 'Student' };

  const recipient =
    typeof request.recipient === 'object'
      ? request.recipient
      : { name: request.recipientName || 'Student' };

  const recipientId = recipient?._id || recipient?.id || request.recipient;
  const isRecipient =
    currentUserId != null &&
    recipientId != null &&
    String(currentUserId) === String(recipientId);

  const createdDate = request.createdAt
    ? new Date(request.createdAt).toLocaleDateString()
    : null;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {sender.name} → {recipient.name}
          </h3>
          {createdDate && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Sent on {createdDate}
            </p>
          )}
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}
        >
          {status}
        </span>
      </div>

      {request.message && (
        <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {request.message}
        </p>
      )}

      {request.skillToTeach && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Offering:</span> {request.skillToTeach}
        </p>
      )}

      {request.skillToLearn && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Learning:</span> {request.skillToLearn}
        </p>
      )}

      {status === 'pending' && isRecipient && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onAccept?.(request)}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Check size={16} />
            Accept
          </button>

          <button
            type="button"
            onClick={() => onDecline?.(request)}
            className="flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950"
          >
            <X size={16} />
            Decline
          </button>
        </div>
      )}

      {status === 'accepted' && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onMessage?.(request)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-700 hover:to-violet-700 transition"
          >
            <MessageCircle size={16} />
            Study Room & Schedule Meeting
          </button>
        </div>
      )}

      {status === 'pending' && !isRecipient && (
        <p className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Clock size={16} />
          Waiting for a response
        </p>
      )}
    </article>
  );
}
