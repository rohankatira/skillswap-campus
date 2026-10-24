
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  LoaderCircle,
  MessageCircle,
  X,
} from 'lucide-react';
import { getMessages, sendMessage } from '../services/chatService';

/**
 * ChatModal — real-time-ish chat between two connected students.
 *
 * Props:
 *  request       — the accepted ExchangeRequest object
 *  currentStudent — { _id, name, profileImage } of the logged-in student
 *  onClose       — callback to close the modal
 */
export default function ChatModal({ request, currentStudent, onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const requestId = request?._id || request?.id;

  // Derive the other participant's name for the header
  const sender =
    typeof request?.sender === 'object' ? request.sender : null;
  const recipient =
    typeof request?.recipient === 'object' ? request.recipient : null;
  const currentId = String(currentStudent?._id || '');
  const otherParticipant =
    sender && String(sender._id) !== currentId ? sender : recipient;
  const otherName = otherParticipant?.name || 'Student';

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!requestId) return;
    try {
      const msgs = await getMessages(requestId);
      setMessages(msgs);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  // Initial load + polling every 3 s
  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    // Optimistic update
    const optimistic = {
      _id: `opt-${Date.now()}`,
      text: trimmed,
      sender: { _id: currentId, name: currentStudent?.name, profileImage: currentStudent?.profileImage },
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');

    try {
      const saved = await sendMessage(requestId, trimmed);
      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) => (m._id === optimistic._id ? saved : m))
      );
    } catch (err) {
      // Remove optimistic on error and restore text
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setText(trimmed);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose?.();
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDateDivider(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Group messages by day for date dividers
  const grouped = messages.reduce((acc, msg) => {
    const day = new Date(msg.createdAt).toDateString();
    if (!acc.length || acc[acc.length - 1].day !== day) {
      acc.push({ day, messages: [msg] });
    } else {
      acc[acc.length - 1].messages.push(msg);
    }
    return acc;
  }, []);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={`Chat with ${otherName}`}
    >
      {/* Modal panel */}
      <div
        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{
          height: 'min(600px, 90vh)',
          background: 'var(--chat-bg, #fff)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          }}
        >
          {/* Avatar */}
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.25)' }}
          >
            {otherParticipant?.profileImage ? (
              <img
                src={otherParticipant.profileImage}
                alt={otherName}
                className="size-10 rounded-full object-cover"
              />
            ) : (
              otherName.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate font-semibold text-white">{otherName}</p>
            <p className="text-xs text-indigo-200">Skill Exchange Partner</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            id="chat-modal-close"
            aria-label="Close chat"
            className="flex size-8 items-center justify-center rounded-full text-white transition hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Message list ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 dark:bg-gray-950 bg-gray-50">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-gray-400">
              <LoaderCircle size={22} className="animate-spin" />
              Loading conversation…
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400">
              <MessageCircle size={40} className="opacity-40" />
              <p className="text-sm">No messages yet. Say hello! 👋</p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.day}>
                {/* Date divider */}
                <div className="my-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                  <span className="text-xs text-gray-400">
                    {formatDateDivider(group.messages[0].createdAt)}
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                </div>

                {group.messages.map((msg, idx) => {
                  const msgSenderId = String(
                    msg.sender?._id || msg.sender || ''
                  );
                  const isMe = msgSenderId === currentId;
                  const showAvatar =
                    !isMe &&
                    (idx === group.messages.length - 1 ||
                      String(group.messages[idx + 1]?.sender?._id) !== msgSenderId);

                  return (
                    <div
                      key={msg._id}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      {/* Other person's avatar (only on last in run) */}
                      {!isMe && (
                        <div className="size-7 shrink-0">
                          {showAvatar ? (
                            <div
                              className="flex size-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                              style={{ background: '#4f46e5' }}
                            >
                              {(msg.sender?.name || 'S').charAt(0).toUpperCase()}
                            </div>
                          ) : null}
                        </div>
                      )}

                      <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                        <div
                          className="rounded-2xl px-4 py-2 text-sm leading-relaxed break-words"
                          style={
                            isMe
                              ? {
                                  background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                  color: '#fff',
                                  borderBottomRightRadius: '4px',
                                  opacity: msg._optimistic ? 0.7 : 1,
                                }
                              : {
                                  background: 'var(--chat-bubble-other, #e5e7eb)',
                                  color: 'var(--chat-bubble-other-text, #111827)',
                                  borderBottomLeftRadius: '4px',
                                }
                          }
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-gray-400 px-1">
                          {formatTime(msg.createdAt)}
                          {msg._optimistic && ' · Sending…'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {error && (
            <p className="text-center text-xs text-rose-500 py-1">{error}</p>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ── */}
        <form
          onSubmit={handleSend}
          className="flex items-end gap-3 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
        >
          <textarea
            id="chat-message-input"
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              // Auto-grow
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message… (Enter to send)"
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-indigo-900"
            style={{ minHeight: '42px', maxHeight: '120px' }}
            disabled={sending}
            aria-label="Chat message"
          />

          <button
            id="chat-send-btn"
            type="submit"
            disabled={!text.trim() || sending}
            aria-label="Send message"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            }}
          >
            {sending ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <ArrowUp size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
