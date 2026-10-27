import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  MessageCircle,
  Share2,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import {
  getMessages,
  sendMessage,
  getWorkspace,
  updateWorkspace,
} from '../services/chatService';
import { scheduleMeeting } from '../services/meetingService';
import { generateSwapRoadmap } from '../utils/roadmapGenerator';
import { downloadCalendarEvent, generateGoogleCalendarUrl } from '../utils/calendarExport';
import SessionSchedulerModal from './SessionSchedulerModal';

export default function ChatModal({ request, currentStudent, onClose }) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'roadmap' | 'notes' | 'video'
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const [sharedNotes, setSharedNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [roadmap, setRoadmap] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [emailNotificationBanner, setEmailNotificationBanner] = useState(null);
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [customMeetingLink, setCustomMeetingLink] = useState('');

  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const notesSaveTimeout = useRef(null);
  const requestId = request?._id || request?.id;

  // Derive the other participant's name & details
  const sender = typeof request?.sender === 'object' ? request.sender : null;
  const recipient = typeof request?.recipient === 'object' ? request.recipient : null;
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

  // Initial load: messages + workspace data
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);

    // Fetch shared notes & roadmap from backend
    getWorkspace(requestId)
      .then((data) => {
        if (data.sharedNotes) setSharedNotes(data.sharedNotes);
        if (data.savedRoadmap && data.savedRoadmap.length > 0) {
          setRoadmap(data.savedRoadmap);
        } else {
          // Initialize fresh custom roadmap
          const initial = generateSwapRoadmap(currentStudent, otherParticipant);
          setRoadmap(initial);
        }
      })
      .catch(() => {
        // Fallback local roadmap
        const initial = generateSwapRoadmap(currentStudent, otherParticipant);
        setRoadmap(initial);
      });

    return () => {
      clearInterval(pollRef.current);
      if (notesSaveTimeout.current) clearTimeout(notesSaveTimeout.current);
    };
  }, [fetchMessages, requestId, currentStudent, otherParticipant]);

  // Auto-scroll on new messages when in chat tab
  useEffect(() => {
    if (activeTab === 'chat') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Close on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Handle Shared Notes auto-save with 800ms debounce
  function handleNotesChange(newVal) {
    setSharedNotes(newVal);
    setNotesSaving(true);
    if (notesSaveTimeout.current) clearTimeout(notesSaveTimeout.current);
    notesSaveTimeout.current = setTimeout(async () => {
      try {
        await updateWorkspace(requestId, { sharedNotes: newVal });
      } catch (err) {
        console.error('Failed to sync notes', err);
      } finally {
        setNotesSaving(false);
      }
    }, 800);
  }

  // Handle Roadmap checkbox toggle
  async function toggleRoadmapItem(idx) {
    const updated = roadmap.map((item, i) =>
      i === idx ? { ...item, completed: !item.completed } : item
    );
    setRoadmap(updated);
    try {
      await updateWorkspace(requestId, { savedRoadmap: updated });
    } catch (err) {
      console.error('Failed to sync roadmap', err);
    }
  }

  // Share Roadmap into Chat
  async function shareRoadmapToChat() {
    const roadmapSummary = roadmap
      .map(
        (s) =>
          `📌 ${s.title} (${s.duration})\n` +
          s.goals.map((g) => `  • ${g}`).join('\n') +
          `\n  🎯 Deliverable: ${s.deliverable}`
      )
      .join('\n\n');

    await handleSendMessage(
      `✨ Shared AI Swap Roadmap for our sessions:\n\n${roadmapSummary}`,
      'roadmap_share',
      { roadmap }
    );
    setActiveTab('chat');
  }

  // Handle Send Message (text or structured)
  async function handleSendMessage(msgText, type = 'text', metadata = null) {
    const trimmed = (msgText || text).trim();
    if (!trimmed || sending) return;

    setSending(true);
    const optimistic = {
      _id: `opt-${Date.now()}`,
      text: trimmed,
      type,
      metadata,
      sender: {
        _id: currentId,
        name: currentStudent?.name,
        profileImage: currentStudent?.profileImage,
      },
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };

    setMessages((prev) => [...prev, optimistic]);
    if (!msgText) setText('');

    try {
      const saved = await sendMessage(requestId, trimmed, type, metadata);
      setMessages((prev) =>
        prev.map((m) => (m._id === optimistic._id ? saved : m))
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      if (!msgText) setText(trimmed);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  }

  // Submit session proposal with email invitation and Google Calendar integration
  async function handleScheduleSession(sessionData) {
    setScheduling(true);
    try {
      const res = await scheduleMeeting({
        requestId,
        topic: sessionData.topic,
        spot: sessionData.spot,
        startTime: sessionData.startTime,
        durationMinutes: sessionData.durationMinutes,
        isVirtual: sessionData.isVirtual,
        customMeetingLink: sessionData.customMeetingLink,
        sendEmail: sessionData.sendEmail,
      });

      if (res.postedMessage) {
        setMessages((prev) => [...prev, res.postedMessage]);
      } else {
        await fetchMessages();
      }

      const gCalUrl =
        res.googleCalendarUrl ||
        generateGoogleCalendarUrl({
          title: `SkillSwap: ${sessionData.topic} w/ ${otherName}`,
          description: `Skill exchange session on SkillSwap Campus.\nTopic: ${sessionData.topic}\nWith: ${otherName}`,
          location: res.meeting?.meetingLink || sessionData.customMeetingLink || sessionData.spot,
          meetingLink: res.meeting?.meetingLink || sessionData.customMeetingLink,
          startTime: sessionData.startTime,
          durationMinutes: sessionData.durationMinutes,
          attendeeEmail: otherParticipant?.email,
        });

      setEmailNotificationBanner({
        message:
          res.message ||
          `Meeting scheduled automatically! Calendar invite sent to ${otherParticipant?.email || otherName}.`,
        previewUrl: res.previewUrl,
        googleCalendarUrl: gCalUrl,
        meetingLink: res.meeting?.meetingLink || sessionData.customMeetingLink,
      });
      setShowScheduler(false);
    } catch (err) {
      console.warn('API schedule failed, fallback to local chat message:', err);
      const summaryText = `📅 Study Session Proposed: ${sessionData.spot} on ${new Date(
        sessionData.startTime
      ).toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })} (${sessionData.durationMinutes} mins) — "${sessionData.topic}"`;

      const fallbackGCal = generateGoogleCalendarUrl({
        title: `SkillSwap: ${sessionData.topic} w/ ${otherName}`,
        description: `Skill exchange session on SkillSwap Campus.\nTopic: ${sessionData.topic}\nWith: ${otherName}`,
        location: sessionData.customMeetingLink || sessionData.spot,
        meetingLink: sessionData.customMeetingLink,
        startTime: sessionData.startTime,
        durationMinutes: sessionData.durationMinutes,
        attendeeEmail: otherParticipant?.email,
      });

      await handleSendMessage(summaryText, 'session_proposal', {
        ...sessionData,
        googleCalendarUrl: fallbackGCal,
      });
      setShowScheduler(false);
    } finally {
      setScheduling(false);
    }
  }

  // 1-Click Google Meet Launch
  async function handleLaunchGoogleMeet() {
    window.open('https://meet.google.com/new', '_blank', 'noopener,noreferrer');
    const topic = `${currentStudent?.teachSkills?.[0] || 'Skill'} ⟷ ${otherParticipant?.teachSkills?.[0] || 'Exchange'} Study Call`;
    await handleSendMessage(
      `📹 I've started an instant Google Meet room. Click below to join with video & screen share!`,
      'call_invite',
      {
        link: 'https://meet.google.com/new',
        platform: 'Google Meet',
        topic,
      }
    );
    setActiveTab('chat');
  }

  // Share custom meeting link (Google Meet / Zoom / Teams)
  async function handleShareCustomCall(e) {
    e.preventDefault();
    const raw = customMeetingLink.trim();
    if (!raw) return;

    let formatted = raw;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `https://${formatted}`;
    }

    const platform = formatted.includes('zoom.us')
      ? 'Zoom'
      : formatted.includes('teams.microsoft')
      ? 'Microsoft Teams'
      : 'Google Meet';

    const topic = `${currentStudent?.teachSkills?.[0] || 'Skill'} ⟷ ${otherParticipant?.teachSkills?.[0] || 'Exchange'} Study Call`;

    await handleSendMessage(
      `📹 Here is our study call link. Click below to join with video & screen share!`,
      'call_invite',
      {
        link: formatted,
        platform,
        topic,
      }
    );
    setCustomMeetingLink('');
    setActiveTab('chat');
  }

  // Quick Icebreakers
  function insertIcebreaker(type) {
    const teachSkills = currentStudent?.teachSkills || currentStudent?.skillsToTeach || [];
    const myFirstSkill = teachSkills[0] || 'skills';

    if (type === 'hello') {
      setText(`Hi ${otherName}! 👋 Excited to connect and swap skills. When are you free for our first session?`);
    } else if (type === 'share_github') {
      setText(`Here is my portfolio / project link so you can check out what I've worked on! 🚀`);
    } else if (type === 'teach_intro') {
      setText(`I can walk you through the fundamentals of ${myFirstSkill} to start. Let me know what specific topics you'd love to learn!`);
    }
  }

  function handleCopyCode(codeString, id) {
    navigator.clipboard.writeText(codeString);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Render message bubble with rich card support
  function renderMessageContent(msg) {
    // 1. Session Proposal Card
    if (msg.type === 'session_proposal' && msg.metadata) {
      const { spot, startTime, durationMinutes, topic, emailSent, previewUrl, meetingLink } = msg.metadata;
      const dateObj = new Date(startTime);

      return (
        <div className="w-full rounded-2xl border border-indigo-200 bg-white p-4 shadow-sm dark:border-indigo-900/60 dark:bg-gray-900 text-gray-900 dark:text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <Calendar size={15} />
              Study Session Scheduled
            </div>
            {emailSent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <Mail size={11} />
                Email Invite Sent
              </span>
            )}
          </div>

          <h4 className="mt-2 text-sm font-semibold">{topic || 'Skill Swap Session'}</h4>

          <div className="mt-2.5 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
            <p className="flex items-center gap-1.5 font-medium">
              <MapPin size={14} className="text-rose-500 shrink-0" />
              <span>{spot}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Calendar size={14} className="text-indigo-500 shrink-0" />
              <span>
                {dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at{' '}
                {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({durationMinutes} mins)
              </span>
            </p>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {/* Direct Google Calendar Button */}
            <a
              href={
                msg.metadata.googleCalendarUrl ||
                generateGoogleCalendarUrl({
                  title: `SkillSwap: ${topic} w/ ${otherName}`,
                  description: `Skill exchange session on SkillSwap Campus.\nTopic: ${topic}\nLocation: ${spot}`,
                  location: meetingLink || spot,
                  meetingLink: meetingLink,
                  startTime: dateObj,
                  durationMinutes: durationMinutes || 45,
                  attendeeEmail: otherParticipant?.email,
                })
              }
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Calendar size={13} />
              Add to Google Calendar
            </a>

            {meetingLink ? (
              <a
                href={meetingLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Video size={13} />
                {meetingLink.includes('meet.google.com') ? 'Join Google Meet' : 'Join Video Call'}
              </a>
            ) : null}

            <button
              type="button"
              onClick={() =>
                downloadCalendarEvent({
                  title: `SkillSwap: ${topic} w/ ${otherName}`,
                  location: meetingLink || spot,
                  startTime: dateObj,
                  durationMinutes: durationMinutes || 45,
                  description: `Skill exchange session between ${currentStudent?.name} and ${otherName}.\nMeeting Link: ${meetingLink || spot}`,
                })
              }
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
              title="Download standard .ics file for Apple Calendar or Outlook"
            >
              .ics file
            </button>

            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                View Email <ExternalLink size={11} />
              </a>
            )}
          </div>
        </div>
      );
    }

    // 2. Call Invite Card (Google Meet / Zoom)
    if (msg.type === 'call_invite' && msg.metadata) {
      const { link, platform, topic } = msg.metadata;

      return (
        <div className="w-full rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/60 dark:bg-gray-900 text-gray-900 dark:text-white">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Study Call · {platform || 'Google Meet'}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              HD Screen Share Ready
            </span>
          </div>

          <h4 className="mt-2 text-sm font-semibold">{topic || 'Skill Exchange Live Call'}</h4>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Full screen sharing, audio, and presentation mode powered by {platform || 'Google Meet'}.
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition"
            >
              <Video size={14} />
              Join {platform || 'Google Meet'}
              <ExternalLink size={12} />
            </a>

            <button
              type="button"
              onClick={() => handleCopyCode(link, `call-${msg._id}`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 transition"
            >
              {copiedCodeId === `call-${msg._id}` ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              {copiedCodeId === `call-${msg._id}` ? 'Link Copied' : 'Copy Link'}
            </button>
          </div>
        </div>
      );
    }

    // 3. Code Block formatting (if text contains ```code```)
    if (msg.text.includes('```')) {
      const parts = msg.text.split('```');
      return (
        <div className="space-y-2">
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              return (
                <div key={index} className="relative rounded-lg bg-gray-950 p-3 text-xs font-mono text-emerald-400">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(part.trim(), `code-${msg._id}-${index}`)}
                    className="absolute right-2 top-2 rounded bg-gray-800 p-1 text-gray-300 hover:text-white"
                    title="Copy code"
                  >
                    {copiedCodeId === `code-${msg._id}-${index}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                  <pre className="overflow-x-auto whitespace-pre-wrap">{part.trim()}</pre>
                </div>
              );
            }
            return part ? <p key={index}>{part}</p> : null;
          })}
        </div>
      );
    }

    // Default plain text
    return <p className="whitespace-pre-wrap">{msg.text}</p>;
  }

  // Group messages by day
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
      role="dialog"
      aria-modal="true"
      aria-label={`Study room with ${otherName}`}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl shadow-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        style={{ height: 'min(700px, 92vh)' }}
      >
        {/* ── Top Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white shadow-inner">
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
            <div className="min-w-0">
              <h3 className="truncate font-bold leading-tight">{otherName}</h3>
              <p className="text-xs text-indigo-200">Exchange Study Room</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 rounded-xl bg-black/20 p-1 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                activeTab === 'chat' ? 'bg-white text-indigo-700 font-bold shadow' : 'text-indigo-100 hover:text-white'
              }`}
            >
              <MessageCircle size={14} />
              <span className="hidden sm:inline">Chat</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('roadmap')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                activeTab === 'roadmap' ? 'bg-white text-indigo-700 font-bold shadow' : 'text-indigo-100 hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">AI Roadmap</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                activeTab === 'notes' ? 'bg-white text-indigo-700 font-bold shadow' : 'text-indigo-100 hover:text-white'
              }`}
            >
              <FileText size={14} />
              <span className="hidden sm:inline">Notes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition ${
                activeTab === 'video' ? 'bg-emerald-600 text-white font-bold shadow' : 'text-indigo-100 hover:text-white'
              }`}
            >
              <Video size={14} className="text-emerald-300" />
              <span className="hidden sm:inline">Google Meet</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── TAB 1: CHAT ── */}
        {activeTab === 'chat' && (
          <div className="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
            {/* Email Notification Banner */}
            {/* Meeting & Email Notification Banner */}
            {emailNotificationBanner && (
              <div className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-blue-50 px-3.5 py-2.5 text-xs text-blue-900 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Calendar size={15} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="font-medium">{emailNotificationBanner.message}</span>
                </div>
                <div className="flex items-center gap-2">
                  {emailNotificationBanner.googleCalendarUrl && (
                    <a
                      href={emailNotificationBanner.googleCalendarUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 dark:text-blue-300 underline"
                    >
                      Google Calendar <ExternalLink size={11} />
                    </a>
                  )}
                  {emailNotificationBanner.meetingLink && (
                    <a
                      href={emailNotificationBanner.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 underline"
                    >
                      Meeting Link <ExternalLink size={11} />
                    </a>
                  )}
                  {emailNotificationBanner.previewUrl && (
                    <a
                      href={emailNotificationBanner.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 underline"
                    >
                      Email Preview <ExternalLink size={11} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setEmailNotificationBanner(null)}
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white p-0.5 ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {loading ? (
                <div className="flex h-full items-center justify-center gap-2 text-gray-400">
                  <LoaderCircle size={22} className="animate-spin" />
                  Loading conversation…
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-gray-400 p-6 text-center">
                  <div className="rounded-full bg-indigo-50 p-4 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                    <Sparkles size={28} />
                  </div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">Start Your Skill Exchange</h4>
                  <p className="max-w-xs text-xs text-gray-500">
                    Say hello, propose a study session spot, or launch a Google Meet call!
                  </p>
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.day}>
                    <div className="my-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                      <span className="text-[11px] font-medium text-gray-400">
                        {formatDateDivider(group.messages[0].createdAt)}
                      </span>
                      <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                    </div>

                    {group.messages.map((msg) => {
                      const msgSenderId = String(msg.sender?._id || msg.sender || '');
                      const isMe = msgSenderId === currentId;

                      return (
                        <div
                          key={msg._id}
                          className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} mb-2`}
                        >
                          <div className={`max-w-[85%] sm:max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                            <div
                              className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                              style={
                                isMe
                                  ? {
                                      background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                                      color: '#fff',
                                      borderBottomRightRadius: '4px',
                                      opacity: msg._optimistic ? 0.7 : 1,
                                    }
                                  : {
                                      background: 'var(--chat-bubble-other, #f3f4f6)',
                                      color: 'var(--chat-bubble-other-text, #111827)',
                                      borderBottomLeftRadius: '4px',
                                    }
                              }
                            >
                              {renderMessageContent(msg)}
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
              {error && <p className="text-center text-xs text-rose-500 py-1">{error}</p>}
              <div ref={bottomRef} />
            </div>

            {/* Quick Action Chips & Icebreakers */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-t border-gray-200 bg-white px-3 py-2 text-xs dark:border-gray-800 dark:bg-gray-900">
              <button
                type="button"
                onClick={handleLaunchGoogleMeet}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300 transition"
              >
                <Video size={13} />
                Start Google Meet
              </button>

              <button
                type="button"
                onClick={() => setShowScheduler(true)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-900/60 dark:bg-indigo-950/60 dark:text-indigo-300 transition"
              >
                <Calendar size={13} />
                Propose Session
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('roadmap')}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 font-semibold text-violet-700 hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/60 dark:text-violet-300 transition"
              >
                <Sparkles size={13} />
                AI Roadmap
              </button>

              <button
                type="button"
                onClick={() => insertIcebreaker('hello')}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 transition"
              >
                👋 Say Hi
              </button>

              <button
                type="button"
                onClick={() => insertIcebreaker('teach_intro')}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-600 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300 transition"
              >
                🎯 Propose Topics
              </button>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2 border-t border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
            >
              <textarea
                id="chat-message-input"
                rows={1}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message… (Shift+Enter for newline)"
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-indigo-900"
                style={{ minHeight: '40px', maxHeight: '120px' }}
                disabled={sending}
                aria-label="Chat message"
              />

              <button
                id="chat-send-btn"
                type="submit"
                disabled={!text.trim() || sending}
                aria-label="Send message"
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}
              >
                {sending ? <LoaderCircle size={18} className="animate-spin" /> : <ArrowUp size={18} />}
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 2: AI ROADMAP ── */}
        {activeTab === 'roadmap' && (
          <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50 p-5 dark:bg-gray-950">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                  <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                  Tailored Exchange Roadmap
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Custom 3-session syllabus generated for your mutual skills.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={shareRoadmapToChat}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                >
                  <Share2 size={13} />
                  Share to Chat
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              {roadmap.map((session, idx) => (
                <div
                  key={session.id || idx}
                  className={`rounded-2xl border p-4 transition shadow-sm ${
                    session.completed
                      ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                      : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleRoadmapItem(idx)}
                        className={`flex size-6 shrink-0 items-center justify-center rounded-lg border transition ${
                          session.completed
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-gray-300 bg-white hover:border-indigo-500 dark:border-gray-700 dark:bg-gray-800'
                        }`}
                      >
                        {session.completed && <Check size={14} />}
                      </button>
                      <h4 className={`text-sm font-bold ${session.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {session.title}
                      </h4>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {session.duration}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1.5 pl-8 text-xs text-gray-600 dark:text-gray-300">
                    {session.goals.map((goal, gIdx) => (
                      <li key={gIdx} className="list-disc">
                        {goal}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3.5 rounded-xl bg-gray-50 p-2.5 text-xs dark:bg-gray-800/60">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">🎯 Deliverable: </span>
                    <span className="text-gray-600 dark:text-gray-400">{session.deliverable}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: SHARED NOTES / SCRATCHPAD ── */}
        {activeTab === 'notes' && (
          <div className="flex flex-1 flex-col overflow-hidden bg-white p-5 dark:bg-gray-900">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                  <FileText size={18} className="text-indigo-600 dark:text-indigo-400" />
                  Collaborative Scratchpad
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Real-time notes, snippets, and study links saved for both of you.
                </p>
              </div>
              <span className="text-[11px] font-medium text-gray-400">
                {notesSaving ? 'Saving…' : '✓ Synced with partner'}
              </span>
            </div>

            <textarea
              value={sharedNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Jot down notes, code snippets, or session links here... Both of you can view and edit."
              className="flex-1 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
            />
          </div>
        )}

        {/* ── TAB 4: GOOGLE MEET & WORKSPACE CALL HUB ── */}
        {activeTab === 'video' && (
          <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50 p-5 dark:bg-gray-950">
            <div className="mx-auto w-full max-w-lg space-y-4">
              {/* Main 1-Click Launch Card */}
              <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
                    <Video size={26} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold leading-tight">Google Meet Live Room</h3>
                    <p className="text-xs text-emerald-100">
                      High-definition audio, zero lag, and 60fps screen sharing.
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleLaunchGoogleMeet}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-extrabold text-emerald-800 shadow-lg hover:bg-emerald-50 active:scale-95 transition"
                  >
                    <ExternalLink size={16} />
                    Launch Instant Google Meet & Invite {otherName}
                  </button>
                  <p className="mt-2.5 text-center text-[11px] text-emerald-100">
                    Opens Google Meet in a new tab & posts a 1-click Join button to chat
                  </p>
                </div>
              </div>

              {/* Paste Existing Link Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Already have a Meet or Zoom link?
                </h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Paste any Google Meet, Zoom, or Microsoft Teams link to share with {otherName}:
                </p>

                <form onSubmit={handleShareCustomCall} className="mt-3.5 flex gap-2">
                  <input
                    type="text"
                    value={customMeetingLink}
                    onChange={(e) => setCustomMeetingLink(e.target.value)}
                    placeholder="e.g. meet.google.com/abc-defg-hij or zoom.us/j/..."
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    type="submit"
                    disabled={!customMeetingLink.trim()}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 transition"
                  >
                    Share
                  </button>
                </form>
              </div>

              {/* Why Google Meet Perks */}
              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <span className="text-lg">🖥️</span>
                  <p className="mt-1 font-bold text-gray-800 dark:text-gray-200">Screen Share</p>
                  <p className="text-[10px] text-gray-500">VS Code, Figma & tabs</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <span className="text-lg">🎙️</span>
                  <p className="mt-1 font-bold text-gray-800 dark:text-gray-200">Noise Filtering</p>
                  <p className="text-[10px] text-gray-500">Filters campus chatter</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <span className="text-lg">🎓</span>
                  <p className="mt-1 font-bold text-gray-800 dark:text-gray-200">Zero Friction</p>
                  <p className="text-[10px] text-gray-500">Works on all devices</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Campus Spot Scheduler Modal */}
      {showScheduler && (
        <SessionSchedulerModal
          partnerName={otherName}
          partnerEmail={otherParticipant?.email}
          defaultTopic={`Skill Swap: ${currentStudent?.teachSkills?.[0] || 'Learning'} ⟷ ${otherParticipant?.teachSkills?.[0] || 'Exchange'}`}
          onClose={() => setShowScheduler(false)}
          onSchedule={handleScheduleSession}
          isSubmitting={scheduling}
        />
      )}
    </div>
  );
}
