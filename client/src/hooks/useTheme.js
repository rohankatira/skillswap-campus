
import { useCallback, useContext } from 'react';
import ThemeContext from '../context/ThemeContext';

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

export default useTheme;
