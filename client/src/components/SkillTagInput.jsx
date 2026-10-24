
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

/**
 * Tag-style input for a list of skills.
 * Type a skill and press Enter or comma to add it; click a suggestion to add it.
 */
export default function SkillTagInput({
  id,
  label,
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Type a skill and press Enter',
  tone = 'indigo',
  max = 20,
}) {
  const [draft, setDraft] = useState('');

  const chipClass =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900'
      : 'bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-900';

  const has = (skill) =>
    value.some((item) => item.toLowerCase() === skill.toLowerCase());

  function addSkill(raw) {
    const skill = raw.trim().slice(0, 50);
    if (!skill || has(skill) || value.length >= max) return;
    onChange([...value, skill]);
  }

  function addFromDraft() {
    draft.split(',').forEach(addSkill);
    setDraft('');
  }

  function removeSkill(skill) {
    onChange(value.filter((item) => item !== skill));
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addFromDraft();
    } else if (event.key === 'Backspace' && !draft && value.length) {
      removeSkill(value[value.length - 1]);
    }
  }

  const remainingSuggestions = suggestions.filter((skill) => !has(skill));

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>

      <div className="flex min-h-[46px] flex-wrap items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800">
        {value.map((skill) => (
          <span
            key={skill}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ring-1 ${chipClass}`}
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              aria-label={`Remove ${skill}`}
              className="rounded-full p-0.5 opacity-70 transition hover:opacity-100"
            >
              <X size={13} />
            </button>
          </span>
        ))}

        <input
          id={id}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addFromDraft}
          placeholder={value.length ? '' : placeholder}
          disabled={value.length >= max}
          className="min-w-[140px] flex-1 bg-transparent py-1 text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-white dark:placeholder-gray-500"
        />
      </div>

      {remainingSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {remainingSuggestions.slice(0, 8).map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => addSkill(skill)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
            >
              <Plus size={12} />
              {skill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
