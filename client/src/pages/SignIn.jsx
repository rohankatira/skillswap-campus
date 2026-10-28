import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { signIn, authClient, setStoredAuthToken } from '../lib/authClient';
import { useAuth } from '../context/AuthContext';
import SocialAuthButtons from '../components/SocialAuthButtons';
import OtpVerificationCard from '../components/OtpVerificationCard';

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, refreshSession } = useAuth();

  // Redirect back to the page the user tried to visit, or home
  const from = location.state?.from?.pathname || '/';

  // If already authenticated, redirect to destination
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Mode: 'password' | 'email-otp'
  const [authMode, setAuthMode] = useState('password');
  // View: 'credentials' | 'otp'
  const [view, setView] = useState('credentials');
  // Type of OTP being verified: 'sign-in' | 'email-verification'
  const [otpType, setOtpType] = useState('sign-in');

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  // Handle password-based sign in
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn.email(
        { email: form.email.trim(), password: form.password },
        {
          onSuccess: async (ctx) => {
            const token = ctx?.data?.token || ctx?.data?.session?.token;
            if (token) {
              setStoredAuthToken(token);
            }
            if (refreshSession) {
              await refreshSession(token);
            }
            navigate(from, { replace: true });
          },
          onError: async (ctx) => {
            const rawMsg = ctx?.error?.message || '';
            const isUnverified =
              rawMsg.toLowerCase().includes('not verified') ||
              ctx?.error?.code === 'EMAIL_NOT_VERIFIED';

            if (isUnverified) {
              // Trigger a fresh OTP so the user can verify immediately
              try {
                await authClient.emailOtp.sendVerificationOtp({
                  email: form.email.trim(),
                  type: 'email-verification',
                });
                setOtpType('email-verification');
                setView('otp');
              } catch {
                setError('Email is not verified. Please request a verification code.');
              }
            } else {
              setError(rawMsg || 'Invalid email or password.');
            }
            setIsLoading(false);
          },
        }
      );
    } catch (err) {
      setError(err?.message || 'Invalid email or password.');
      setIsLoading(false);
    }
  }

  // Handle requesting one-time login OTP
  async function handleOtpRequest(e) {
    e.preventDefault();
    if (!form.email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { error: sendErr } = await authClient.emailOtp.sendVerificationOtp({
        email: form.email.trim(),
        type: 'sign-in',
      });

      if (sendErr) {
        setError(sendErr.message || 'Could not send verification code.');
        setIsLoading(false);
        return;
      }

      setOtpType('sign-in');
      setView('otp');
      setIsLoading(false);
    } catch (err) {
      setError(err?.message || 'Could not send verification code.');
      setIsLoading(false);
    }
  }

  // Handle verifying OTP code
  async function handleVerifyOtp(otpCode) {
    setIsVerifyingOtp(true);
    setOtpError('');

    try {
      if (otpType === 'email-verification') {
        const verifyRes = await authClient.emailOtp.verifyEmail({
          email: form.email.trim(),
          otp: otpCode,
        });

        if (verifyRes?.error) {
          setOtpError(verifyRes.error.message || 'Invalid or expired verification code.');
          setIsVerifyingOtp(false);
          return;
        }

        const token = verifyRes?.data?.token || verifyRes?.data?.session?.token;
        if (token) {
          setStoredAuthToken(token);
        }
        if (refreshSession) {
          await refreshSession(token);
        }

        // Successfully verified email and authenticated
        navigate(from, { replace: true });
      } else {
        // Sign in with email OTP
        const signRes = await authClient.signIn.emailOtp({
          email: form.email.trim(),
          otp: otpCode,
        });

        if (signRes?.error) {
          setOtpError(signRes.error.message || 'Invalid or expired sign-in code.');
          setIsVerifyingOtp(false);
          return;
        }

        const token = signRes?.data?.token || signRes?.data?.session?.token;
        if (token) {
          setStoredAuthToken(token);
        }
        if (refreshSession) {
          await refreshSession(token);
        }

        // Authenticated!
        navigate(from, { replace: true });
      }
    } catch (err) {
      setOtpError(err?.message || 'Verification failed. Please try again.');
      setIsVerifyingOtp(false);
    }
  }

  // Resend OTP code
  async function handleResendOtp() {
    const { error: resendErr } = await authClient.emailOtp.sendVerificationOtp({
      email: form.email.trim(),
      type: otpType,
    });

    if (resendErr) {
      setOtpError(resendErr.message || 'Could not resend verification code.');
      throw resendErr;
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          {view === 'otp' ? (
            <OtpVerificationCard
              email={form.email}
              title={otpType === 'sign-in' ? 'Sign in with Code' : 'Verify your email'}
              subtitle={
                otpType === 'sign-in'
                  ? 'We sent a 6-digit login code to'
                  : 'Your email requires verification. We sent a 6-digit code to'
              }
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onBack={() => {
                setView('credentials');
                setOtpError('');
              }}
              isVerifying={isVerifyingOtp}
              error={otpError}
              clearError={() => setOtpError('')}
            />
          ) : (
            <>
              {/* Logo + Title */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                  <GraduationCap size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Welcome back
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Sign in to your SkillSwap Campus account
                </p>
              </div>

              {/* Social Login Providers (Google, Facebook, Apple) */}
              <div className="mb-4">
                <SocialAuthButtons callbackUrl={from} onError={setError} />
              </div>

              {/* Mode Toggle (Password vs Email OTP) */}
              <div className="mb-5 flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                <button
                  type="button"
                  id="tab-signin-password"
                  onClick={() => {
                    setAuthMode('password');
                    setError('');
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                    authMode === 'password'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Lock size={13} />
                  Password
                </button>
                <button
                  type="button"
                  id="tab-signin-otp"
                  onClick={() => {
                    setAuthMode('email-otp');
                    setError('');
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                    authMode === 'email-otp'
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <KeyRound size={13} />
                  Email Code (OTP)
                </button>
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Password Sign-In Form */}
              {authMode === 'password' ? (
                <form
                  id="sign-in-form"
                  onSubmit={handlePasswordSubmit}
                  className="space-y-4"
                  noValidate
                >
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="signin-email"
                      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />
                      <input
                        id="signin-email"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                        placeholder="you@university.edu"
                        className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-400"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label
                        htmlFor="signin-password"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('email-otp');
                          setError('');
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                      >
                        Sign in with OTP instead
                      </button>
                    </div>
                    <div className="relative">
                      <Lock
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />
                      <input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        required
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    id="signin-submit"
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Signing in…
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </button>
                </form>
              ) : (
                /* Email OTP Sign-In Form */
                <form onSubmit={handleOtpRequest} className="space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="signin-email-otp"
                      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        aria-hidden="true"
                      />
                      <input
                        id="signin-email-otp"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                        placeholder="you@university.edu"
                        className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-400"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      We&apos;ll send a secure 6-digit one-time code to this address.
                    </p>
                  </div>

                  <button
                    type="submit"
                    id="signin-otp-submit"
                    disabled={isLoading || !form.email.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending One-Time Code…
                      </>
                    ) : (
                      'Send Login Code (OTP)'
                    )}
                  </button>
                </form>
              )}

              {/* Footer */}
              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Don&apos;t have an account?{' '}
                <Link
                  to="/sign-up"
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Create one
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
