
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSession } from '../lib/authClient';
import { getMyProfile } from '../services/studentService';

/**
 * AuthContext — exposes session state globally via React Context.
 *
 * Usage in any component:
 *   const { session, user, isPending, isAuthenticated } = useAuth();
 *
 * Also exposes the logged-in user's Student profile:
 *   const { profile, profileLoading, hasProfile, refreshProfile, setProfile } = useAuth();
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: session, isPending, error, refetch } = useSession();

  const user = session?.user ?? null;
  const userId = user?.id ?? null;
  const isAuthenticated = !!session?.user;

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loadedForUserId, setLoadedForUserId] = useState(null);

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    setProfileLoading(true);
    try {
      const data = await getMyProfile();
      setProfile(data);
      return data;
    } catch {
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
      setLoadedForUserId(userId);
    }
  }, [userId]);

  // Load (or clear) the profile whenever the signed-in user changes.
  useEffect(() => {
    let ignore = false;
    if (!isPending) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshProfile().then(() => {
        if (ignore) return;
      });
    }
    return () => {
      ignore = true;
    };
  }, [isPending, refreshProfile]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isPending,
        error,
        isAuthenticated,
        refetch,
        profile,
        setProfile,
        profileLoading:
          isPending || profileLoading || (!!userId && loadedForUserId !== userId),
        hasProfile: !!profile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
