
import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

/**
 * Better Auth client instance.
 *
 * `baseURL` points to the Express server hosting the auth routes.
 * Equipped with:
 *   - Social authentication (Google, Facebook, Apple)
 *   - Email + Password authentication
 *   - Email OTP verification & OTP sign-in plugin
 */
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  plugins: [
    emailOTPClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, getSession, emailOtp } = authClient;

