
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

/**
 * ThemeToggle — reads from and writes to ThemeContext.
 * Previously had its own isolated useState which caused the theme to
 * desync from the rest of the app after a page navigation.
 */
export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      {isDark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
