import { useState } from 'react';
import {
  Calendar,
  ExternalLink,
  LoaderCircle,
  Mail,
  MapPin,
  Sparkles,
  Video,
  X,
} from 'lucide-react';

const CAMPUS_SPOTS = [
  { id: 'lib-2f', name: 'Campus Library (2nd Floor Collab Area)', icon: '🏢' },
  { id: 'union-cafe', name: 'Student Union Cafe', icon: '☕' },
  { id: 'tech-lab', name: 'Computer Science & Tech Lab', icon: '💻' },
  { id: 'campus-quad', name: 'Campus Quad Outdoor Tables', icon: '🌳' },
  { id: 'virtual', name: 'Virtual Video Room (Google Meet)', icon: '🌐' },
];

export default function SessionSchedulerModal({
  partnerName = 'Partner',
  partnerEmail = '',
  defaultTopic = 'Skill Exchange Session',
  onClose,
  onSchedule,
  isSubmitting = false,
}) {
  const [selectedSpot, setSelectedSpot] = useState(CAMPUS_SPOTS[4].name);
  const [customSpot, setCustomSpot] = useState('');
  const [isVirtual, setIsVirtual] = useState(true);
  const [customMeetingLink, setCustomMeetingLink] = useState('');
  const [dateOption, setDateOption] = useState('tomorrow');
  const [customDate, setCustomDate] = useState('');
  const [time, setTime] = useState('16:30');
  const [duration, setDuration] = useState(45);
  const [topic, setTopic] = useState(defaultTopic);
  const [sendEmail, setSendEmail] = useState(true);

  function handleSpotChange(spotName) {
    setSelectedSpot(spotName);
    if (spotName.includes('Virtual') || spotName.includes('Google Meet')) {
      setIsVirtual(true);
    } else {
      setIsVirtual(false);
    }
  }

  function getCalculatedDateTime() {
    const today = new Date();
    let target = new Date();

    if (dateOption === 'today') {
      target = today;
    } else if (dateOption === 'tomorrow') {
      target.setDate(today.getDate() + 1);
    } else if (dateOption === 'weekend') {
      const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
      target.setDate(today.getDate() + daysUntilSaturday);
    } else if (dateOption === 'custom' && customDate) {
      const parsed = new Date(customDate);
      if (!isNaN(parsed.getTime())) {
        target = parsed;
      }
    }

    const [hours, mins] = time.split(':').map(Number);
    target.setHours(hours || 16, mins || 30, 0, 0);
    return target;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const finalSpot = customSpot.trim() || selectedSpot;
    const sessionDateTime = getCalculatedDateTime();

    onSchedule?.({
      spot: finalSpot,
      startTime: sessionDateTime.toISOString(),
      durationMinutes: duration,
      topic: topic.trim() || defaultTopic,
      isVirtual: isVirtual || finalSpot.toLowerCase().includes('virtual'),
      customMeetingLink: customMeetingLink.trim(),
      sendEmail,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(5px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Propose study session"
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 shadow-inner">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Schedule Study Session</h2>
              <p className="text-xs text-indigo-100">
                With {partnerName} {partnerEmail ? `(${partnerEmail})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Focus Topic */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Sparkles size={14} className="text-indigo-500" />
              Focus Topic & Agenda
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. React Props & State ⟷ Figma Auto-layout"
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white transition"
            />
          </div>

          {/* Campus Spot / Meeting Format */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <MapPin size={14} className="text-indigo-500" />
              Meeting Spot / Format
            </label>
            <select
              value={selectedSpot}
              onChange={(e) => handleSpotChange(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm font-medium text-gray-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-white transition"
            >
              {CAMPUS_SPOTS.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>

            {isVirtual ? (
              <div className="mt-2 rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <Video size={14} />
                    Google Meet Integration
                  </div>
                  <a
                    href="https://meet.google.com/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200 underline"
                  >
                    Launch Meet Room <ExternalLink size={10} />
                  </a>
                </div>
                <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  Your Google Calendar event will automatically link Google Meet. If you already have a meeting link (e.g. <code>meet.google.com/abc-defg-hij</code>), paste it below or leave blank to auto-generate:
                </p>
                <div className="mt-2 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="meet.google.com/... (optional)"
                    value={customMeetingLink}
                    onChange={(e) => setCustomMeetingLink(e.target.value)}
                    className="flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-emerald-600 dark:border-emerald-800 dark:bg-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const mockCode = `meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
                      setCustomMeetingLink(`https://${mockCode}`);
                    }}
                    className="rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 text-[11px] font-semibold px-2.5 py-1.5 transition"
                  >
                    Auto-Code
                  </button>
                </div>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Or specify another custom campus location..."
                value={customSpot}
                onChange={(e) => setCustomSpot(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-800 outline-none focus:border-indigo-500 focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition"
              />
            )}
          </div>

          {/* Date & Time */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <Calendar size={14} className="text-indigo-500" />
              Date & Schedule
            </label>
            <div className="mt-1.5 grid grid-cols-4 gap-2">
              {[
                { id: 'today', label: 'Today' },
                { id: 'tomorrow', label: 'Tomorrow' },
                { id: 'weekend', label: 'Weekend' },
                { id: 'custom', label: 'Custom' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDateOption(opt.id)}
                  className={`rounded-xl py-2 text-xs font-semibold transition ${
                    dateOption === opt.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {dateOption === 'custom' && (
              <input
                type="date"
                required
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-medium text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            )}

            <div className="mt-3 flex items-center gap-2">
              <div className="w-1/2">
                <span className="text-[11px] font-semibold text-gray-400">Start Time</span>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs font-semibold text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="w-1/2">
                <span className="text-[11px] font-semibold text-gray-400">Duration</span>
                <div className="mt-1 flex gap-1">
                  {[30, 45, 60].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                        duration === d
                          ? 'bg-indigo-100 text-indigo-700 font-bold dark:bg-indigo-950 dark:text-indigo-300'
                          : 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Automatic Calendar & Meeting Sync Info */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/30">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
                <Calendar size={13} />
              </div>
              <div className="text-xs">
                <span className="font-bold text-gray-900 dark:text-white">
                  Automatic Google Calendar & Meet Sync
                </span>
                <p className="mt-0.5 text-gray-500 dark:text-gray-400 leading-relaxed">
                  Scheduled automatically in the background. An iCalendar invite (`.ics` with Google Calendar RSVP) and video meeting link will be dispatched to {partnerName} ({partnerEmail || 'partner'}) and synced with your chat.
                </p>
              </div>
            </div>
          </div>

          {/* Email Services Toggle */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-900/60 dark:bg-indigo-950/30">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="mt-0.5 size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs">
                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Mail size={14} className="text-indigo-600 dark:text-indigo-400" />
                  Send Email Invite & Calendar File (.ics)
                </span>
                <p className="mt-0.5 text-gray-500 dark:text-gray-400 leading-relaxed">
                  Sends an automated email notification to {partnerName} with Google Calendar and video meeting buttons.
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={15} className="animate-spin" />
                  Scheduling Meeting…
                </>
              ) : (
                <>
                  <Calendar size={15} />
                  Confirm & Schedule Meeting
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
