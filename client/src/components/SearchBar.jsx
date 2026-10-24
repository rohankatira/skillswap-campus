
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search students or skills...',
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:ring-indigo-950">
      <Search size={20} className="shrink-0 text-gray-400" />

      <input
        type="search"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        aria-label="Search students"
        className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange?.('')}
          aria-label="Clear search"
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-white"
        >
          <X size={17} />
        </button>
      )}
    </div>
  );
}
