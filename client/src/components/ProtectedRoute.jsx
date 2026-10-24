
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * While the session is loading it shows a full-page spinner.
 * If there is no authenticated session it redirects to /sign-in,
 * preserving the intended destination so the user can be sent back
 * after signing in.
 *
 * Usage in App.jsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/requests" element={<MyRequests />} />
 *   </Route>
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isPending } = useAuth();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/sign-in"
        state={{ from: location }}
        replace
      />
    );
  }

  return children ?? null;
}
