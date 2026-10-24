
import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth client instance.
 *
 * `baseURL` must point to the Express server that hosts the auth routes.
 * All auth API calls will go to http://localhost:5000/api/auth/*
 *
 * Use this client in any React component to:
 *   - authClient.signIn.email({ email, password })
 *   - authClient.signUp.email({ email, password, name })
 *   - authClient.signOut()
 *   - authClient.useSession()          ← reactive session hook
 *   - authClient.getSession()          ← async session getter
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
