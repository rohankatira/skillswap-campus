import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MapPin,
  Sparkles,
  Video,
  Zap,
} from 'lucide-react';

const LIVE_PULSES = [
  '⚡ Liam swapped Figma with Maya for Python · 4m ago',
  '📍 Alex & Sofia scheduled a study session at Library 2nd Floor · 12m ago',
  '🧠 David generated an AI Swap Roadmap for React & Data Science · 26m ago',
  '✨ 16 peer skill exchanges active on campus this week',
];

const bentoFeatures = [
  {
    icon: Sparkles,
    badge: 'Instant Structure',
    title: 'AI Swap Roadmap Generator',
    description:
      'Never wonder what to teach. Generates a tailored 3-session syllabus with deliverables based on your exact mutual skills.',
    gradient: 'from-indigo-500/10 to-violet-500/10',
    border: 'hover:border-indigo-500/50',
  },
  {
    icon: Video,
    badge: 'All-In-One Workspace',
    title: 'Collaborative Study Rooms',
    description:
      'Zero-setup embedded video calls, collaborative live scratchpad, and code snippet formatting right inside your exchange window.',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    border: 'hover:border-emerald-500/50',
  },
  {
    icon: MapPin,
    badge: 'Real-World Meetups',
    title: 'Campus Spot Scheduler',
    description:
      'Pick campus study spots like Library 2nd Floor or Student Union Cafe with 1-click Google & Apple Calendar (.ics) export.',
    gradient: 'from-amber-500/10 to-orange-500/10',
    border: 'hover:border-amber-500/50',
  },
  {
    icon: Zap,
    badge: 'Fast Discovery',
    title: 'Speed Swap Matchmaker',
    description:
      'Discover learning partners with interactive match radar, mutual complement breakdown, and instant swap proposals.',
    gradient: 'from-pink-500/10 to-rose-500/10',
    border: 'hover:border-pink-500/50',
  },
];

export default function Home() {
  const [pulseIdx, setPulseIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPulseIdx((prev) => (prev + 1) % LIVE_PULSES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      {/* ── Live Campus Pulse Ticker ── */}
      <div className="border-b border-indigo-100 bg-indigo-50/80 px-4 py-2.5 text-xs text-indigo-950 dark:border-indigo-950/50 dark:bg-indigo-950/40 dark:text-indigo-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-600 dark:text-indigo-400">
              Campus Pulse:
            </span>
            <span className="truncate font-medium transition-all duration-300">
              {LIVE_PULSES[pulseIdx]}
            </span>
          </div>
          <Link
            to="/students"
            className="hidden sm:inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            Explore matches <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
              <Sparkles size={16} className="text-amber-300" />
              Modern Peer-to-Peer Learning on Campus
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Swap skills.
              <span className="block bg-gradient-to-r from-indigo-200 via-white to-violet-200 bg-clip-text text-transparent">
                Master anything together.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-indigo-100 sm:text-lg">
              Connect with fellow university students to teach what you know and learn what you need.
              Powered by custom AI roadmaps, live study rooms, and campus spot scheduling.
            </p>

            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link
                to="/students"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-indigo-700 shadow-xl transition hover:bg-indigo-50 active:scale-95"
              >
                <Zap size={18} className="text-indigo-600" />
                Find Learning Partners
                <ArrowRight size={18} />
              </Link>

              <a
                href="#how-it-works"
                className="rounded-xl border border-white/30 bg-white/5 px-6 py-3.5 font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Interactive Feature Visual Preview Card */}
          <div className="mx-auto w-full max-w-md rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="size-3 rounded-full bg-rose-400" />
                <span className="size-3 rounded-full bg-amber-400" />
                <span className="size-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-semibold text-white/80">SkillSwap Live Study Room</span>
              </div>
              <span className="rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                ● Live Call & Notes
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-white/10 p-3.5 text-xs text-white">
                <p className="font-bold text-indigo-200">🧠 AI Swap Roadmap Generated</p>
                <p className="mt-1 text-white/90">
                  Maya teaches Figma Components ⟷ Liam teaches React & Tailwind CSS
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3.5 text-xs text-white">
                <p className="font-bold text-amber-200">📍 Study Session Confirmed</p>
                <p className="mt-1 text-white/90">
                  Campus Library 2nd Floor · Tomorrow at 4:30 PM (45m)
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-3.5 text-xs text-white">
                <p className="font-bold text-emerald-200">✓ Shared Scratchpad Synced</p>
                <p className="mt-1 font-mono text-[11px] text-white/80">
                  const Button = () =&gt; &lt;div className="p-4"&gt;...&lt;/div&gt;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modern Bento Grid Section ── */}
      <section
        id="how-it-works"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            THE MODERN CAMPUS EXCHANGE
          </p>
          <h2 className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Everything you need for productive peer learning
          </h2>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-300">
            No more awkward conversations or scattered tools. SkillSwap provides the complete structure from discovery to meeting.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {bentoFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <article
                key={feat.title}
                className={`group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-7 shadow-sm transition hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 ${feat.border}`}
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex rounded-2xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
                    <Icon size={26} />
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {feat.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold text-gray-900 dark:text-white">
                  {feat.title}
                </h3>

                <p className="mt-2.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {feat.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-8 text-white sm:flex-row sm:items-center sm:p-12 shadow-xl">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to find your learning partner?
            </h2>
            <p className="mt-2 text-sm text-indigo-100 sm:text-base">
              Try Speed Match mode or browse students across your campus.
            </p>
          </div>

          <Link
            to="/students"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-indigo-700 shadow-md transition hover:bg-indigo-50 active:scale-95"
          >
            Launch Speed Match
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
