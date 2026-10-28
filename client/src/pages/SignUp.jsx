import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { signUp, authClient, setStoredAuthToken } from '../lib/authClient';
import { useAuth } from '../context/AuthContext';
import SocialAuthButtons from '../components/SocialAuthButtons';
import OtpVerificationCard from '../components/OtpVerificationCard';

export default function SignUp() {
  const navigate = useNavigate();
  const { isAuthenticated, refreshSession } = useAuth();

  // If already authenticated, redirect to profile
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);

    try {
      await signUp.email(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        },
        {
          onSuccess: () => {
            // Account created. Email verification OTP has been dispatched to email.
            setStep('otp');
            setIsLoading(false);
          },
          onError: (ctx) => {
            setError(ctx?.error?.message || 'Could not create account. Please try again.');
            setIsLoading(false);
          },
        }
      );
    } catch (err) {
      setError(err?.message || 'Could not create account. Please try again.');
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(otpCode) {
    setIsVerifyingOtp(true);
    setOtpError('');

    try {
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

      // Verification successful and session established
      navigate('/profile?welcome=1', { replace: true });
    } catch (err) {
      setOtpError(err?.message || 'Verification failed. Please check the code and try again.');
      setIsVerifyingOtp(false);
    }
  }

  async function handleResendOtp() {
    const { error: resendErr } = await authClient.emailOtp.sendVerificationOtp({
      email: form.email.trim(),
      type: 'email-verification',
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
          {step === 'otp' ? (
            <>
              <OtpVerificationCard
                email={form.email}
                title="Verify your email"
                subtitle="We've sent a 6-digit verification code to"
                onVerify={handleVerifyOtp}
                onResend={handleResendOtp}
                onBack={() => {
                  setStep('form');
                  setOtpError('');
                }}
                isVerifying={isVerifyingOtp}
                error={otpError}
                clearError={() => setOtpError('')}
              />
              <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
                Already verified or want to use another method?{' '}
                <Link
                  to="/sign-in"
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              {/* Logo + Title */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                  <GraduationCap size={28} />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create your account
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Join SkillSwap Campus and start sharing skills
                </p>
              </div>

              {/* Social Login Providers (Google, Facebook, Apple) */}
              <div className="mb-4">
                <SocialAuthButtons callbackUrl="/profile?welcome=1" onError={setError} />
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

              {/* Form */}
              <form id="sign-up-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Name */}
                <div>
                  <label
                    htmlFor="signup-name"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Full name
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      id="signup-name"
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      autoComplete="name"
                      required
                      placeholder="Alex Johnson"
                      className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-400"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="signup-email"
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
                      id="signup-email"
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
                  <label
                    htmlFor="signup-password"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                      placeholder="Min. 8 characters"
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

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      id="signup-confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                      placeholder="Repeat your password"
                      className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder-gray-400 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="signup-submit"
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending Verification Code…
                    </>
                  ) : (
                    'Create account & Verify Email'
                  )}
                </button>
              </form>

              {/* Terms */}
              <p className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
                By creating an account you agree to our{' '}
                <span className="text-indigo-500">Terms of Service</span>.
              </p>

              {/* Footer */}
              <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{' '}
                <Link
                  to="/sign-in"
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
