import { useState, useRef, useEffect } from 'react';
import { Mail, ArrowLeft, RotateCw, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function OtpVerificationCard({
  email,
  title = 'Verify your email',
  subtitle = 'We sent a 6-digit verification code to',
  onVerify,
  onResend,
  onBack,
  isVerifying = false,
  error = '',
  clearError,
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const inputRefs = useRef([]);

  // Auto-focus first input box
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Cooldown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  function handleInputChange(index, e) {
    const val = e.target.value;
    if (clearError) clearError();
    setResendMessage('');

    // Handle single character
    if (/^\d$/.test(val)) {
      const nextDigits = [...digits];
      nextDigits[index] = val;
      setDigits(nextDigits);

      // Auto-advance
      if (index < 5 && inputRefs.current[index + 1]) {
        inputRefs.current[index + 1].focus();
      }

      // If all 6 filled, trigger verify automatically
      if (nextDigits.every((d) => d !== '')) {
        onVerify(nextDigits.join(''));
      }
    } else if (val === '') {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    if (clearError) clearError();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      inputRefs.current[5]?.focus();
      onVerify(pasted);
    }
  }

  async function handleResendClick() {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setResendMessage('');
    if (clearError) clearError();

    try {
      if (onResend) {
        await onResend();
      }
      setResendCooldown(30);
      setResendMessage('A new verification code was sent to your email.');
    } catch {
      // handled by parent
    } finally {
      setIsResending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    const fullOtp = digits.join('');
    if (fullOtp.length !== 6) return;
    onVerify(fullOtp);
  }

  return (
    <div className="w-full">
      {/* Icon & Title */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
          <ShieldCheck size={28} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          {subtitle} <span className="font-semibold text-gray-800 dark:text-gray-200">{email}</span>
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resend Success Banner */}
      {resendMessage && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400"
        >
          <Mail size={16} className="mt-0.5 shrink-0" />
          <span>{resendMessage}</span>
        </div>
      )}

      {/* OTP Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Enter 6-Digit Code
          </label>
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isVerifying}
                aria-label={`Digit ${idx + 1}`}
                className="h-13 w-11 sm:h-14 sm:w-12 rounded-xl border border-gray-300 bg-white text-center text-xl font-bold text-gray-900 shadow-sm transition focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-indigo-400"
              />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="btn-verify-otp"
          disabled={isVerifying || digits.some((d) => d === '')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900"
        >
          {isVerifying ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying Code…
            </>
          ) : (
            'Verify & Continue'
          )}
        </button>

        {/* Resend and Navigation */}
        <div className="flex flex-col items-center gap-3 pt-2 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <span>Didn&apos;t receive the code?</span>
            {resendCooldown > 0 ? (
              <span className="font-medium text-gray-400 dark:text-gray-500">
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendClick}
                disabled={isResending}
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400"
              >
                {isResending ? (
                  <>
                    <RotateCw size={13} className="animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Resend code'
                )}
              </button>
            )}
          </div>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isVerifying}
              className="inline-flex items-center gap-1 text-xs text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
            >
              <ArrowLeft size={13} />
              Use a different email address
            </button>
          )}
        </div>

        {/* Developer helper badge */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 text-center text-xs text-indigo-700 dark:border-indigo-950 dark:bg-indigo-950/30 dark:text-indigo-300">
          💡 <strong>Tip:</strong> If you are testing locally, check your backend server terminal or Ethereal email preview to see your 6-digit code.
        </div>
      </form>
    </div>
  );
}
