
import { useState } from 'react';
import {
  Bot,
  MessageCircle,
  Send,
  X,
  UserRound,
  Sparkles,
} from 'lucide-react';

const initialMessage = {
  role: 'bot',
  text: 'Hi! 👋 Welcome to SkillSwap Campus. I can help you understand how skill exchanges work. What would you like to know?',
};

function getBotResponse(message) {
  const text = message.toLowerCase();

  if (text.includes('match')) {
    return 'Matches help you find students whose skills align with what you want to learn. Check their teaching and learning skills on their profile.';
  }

  if (text.includes('request') || text.includes('connect')) {
    return 'Open a student profile and send an exchange request. The other student can accept or decline it. You can track requests on the My Requests page.';
  }

  if (text.includes('teach') || text.includes('skill')) {
    return 'Add skills you can teach and skills you want to learn to your student profile. This helps you discover useful learning partners.';
  }

  if (text.includes('profile') || text.includes('account')) {
    return 'Your profile should include your name, course, a short bio, skills you can teach, and skills you want to learn.';
  }

  if (text.includes('hello') || text.includes('hi')) {
    return 'Hello! 😊 Ready to discover a new skill or share something you know?';
  }

  if (text.includes('help')) {
    return 'I can help with finding matches, understanding exchange requests, creating a profile, and choosing skills to teach or learn.';
  }

  return 'Great question! Try asking me about finding skill matches, student profiles, teaching skills, or exchange requests.';
}

export default function SkillBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([initialMessage]);

  function handleSend(event) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) return;

    const userMessage = {
      role: 'user',
      text: trimmedMessage,
    };

    const botMessage = {
      role: 'bot',
      text: getBotResponse(trimmedMessage),
    };

    setMessages((previous) => [
      ...previous,
      userMessage,
      botMessage,
    ]);

    setMessage('');
  }

  return (
    <>
      {isOpen && (
        <section
          aria-label="SkillBot chat"
          className="fixed bottom-24 right-4 z-50 flex h-[min(520px,70vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900 sm:right-6"
        >
          <header className="flex items-center justify-between bg-indigo-600 px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-white/20 p-2">
                <Bot size={22} />
              </div>
              <div>
                <h2 className="font-semibold">SkillBot</h2>
                <p className="text-xs text-indigo-100">
                  Your SkillSwap assistant
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close SkillBot"
              className="rounded-lg p-2 hover:bg-white/15"
            >
              <X size={20} />
            </button>
          </header>

          <div
            className="flex-1 space-y-4 overflow-y-auto p-4"
            aria-live="polite"
          >
            {messages.map((item, index) => (
              <div
                key={`msg-${index}`}
                className={`flex items-start gap-2 ${
                  item.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {item.role === 'bot' && (
                  <div className="rounded-full bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    <Sparkles size={15} />
                  </div>
                )}

                <p
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm leading-6 ${
                    item.role === 'user'
                      ? 'rounded-br-sm bg-indigo-600 text-white'
                      : 'rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}
                >
                  {item.text}
                </p>

                {item.role === 'user' && (
                  <div className="rounded-full bg-gray-100 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <UserRound size={15} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-gray-200 p-3 dark:border-gray-800"
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask SkillBot..."
              aria-label="Message SkillBot"
              className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />

            <button
              type="submit"
              disabled={!message.trim()}
              aria-label="Send message"
              className="rounded-xl bg-indigo-600 p-3 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={17} />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close SkillBot' : 'Open SkillBot'}
        aria-expanded={isOpen}
        className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-4 font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-indigo-700 sm:right-6"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        <span>{isOpen ? 'Close' : 'SkillBot'}</span>
      </button>
    </>
  );
}
