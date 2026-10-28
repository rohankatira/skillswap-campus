import { useState } from 'react';
import { Loader2, AlertCircle, HelpCircle, X, ExternalLink, Copy, Check } from 'lucide-react';
import { authClient } from '../lib/authClient';

export default function SocialAuthButtons({ callbackUrl = '/', onError }) {
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [missingProviderNotice, setMissingProviderNotice] = useState(null);
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  function handleProviderMissing(provider) {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    const isProduction =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    const envLocation = isProduction
      ? 'your deployed backend environment variables (e.g. Render / Railway)'
      : 'server/.env';

    const msg = `${providerName} login is not configured yet. It requires ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET in ${envLocation}.`;
    setMissingProviderNotice({
      provider,
      providerName,
      title: `${providerName} credentials not configured`,
      message: msg,
      isSetupNeeded: true,
    });
    if (onError) onError(msg);
  }

  async function handleSocialSignIn(provider) {
    setLoadingProvider(provider);
    setMissingProviderNotice(null);
    if (onError) onError('');

    const isProduction =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    const currentApiUrl = (import.meta.env.VITE_API_URL || '').trim();
    const isLocalApiInProd = isProduction && currentApiUrl !== '' && currentApiUrl.includes('localhost');

    // Immediate check: deployed on Vercel/production but VITE_API_URL is still pointing to localhost
    if (isLocalApiInProd) {
      const msg =
        'Backend API URL is not configured for production. In Vercel Project Settings > Environment Variables, add VITE_API_URL with your deployed backend URL (e.g. https://your-server.onrender.com), then redeploy.';
      setMissingProviderNotice({
        provider,
        providerName: 'Backend Connection',
        title: 'VITE_API_URL not configured in Vercel',
        message: msg,
        isConfigIssue: true,
      });
      if (onError) onError(msg);
      setLoadingProvider(null);
      return;
    }

    // Ensure callbackURL is an absolute URL pointing back to the React frontend
    const resolvedCallbackUrl = callbackUrl.startsWith('http')
      ? callbackUrl
      : `${window.location.origin}${callbackUrl.startsWith('/') ? callbackUrl : '/' + callbackUrl}`;

    try {
      const res = await authClient.signIn.social(
        {
          provider,
          callbackURL: resolvedCallbackUrl,
        },
        {
          onError: (ctx) => {
            const rawMessage = ctx?.error?.message || '';
            const code = ctx?.error?.code || '';
            const isMissingProvider =
              code === 'PROVIDER_NOT_FOUND' ||
              rawMessage.toLowerCase().includes('not enabled') ||
              rawMessage.toLowerCase().includes('not found') ||
              rawMessage.toLowerCase().includes('client_id');

            if (isMissingProvider) {
              handleProviderMissing(provider);
            } else {
              const friendlyMsg = rawMessage || `Could not connect to ${provider}. Please try again.`;
              setMissingProviderNotice({
                provider,
                providerName: provider,
                title: `Sign-in Error`,
                message: friendlyMsg,
              });
              if (onError) onError(friendlyMsg);
            }
            setLoadingProvider(null);
          },
        }
      );

      // If better-fetch returned an error object rather than throwing
      if (res?.error) {
        const rawMessage = res.error.message || '';
        const code = res.error.code || '';
        if (
          code === 'PROVIDER_NOT_FOUND' ||
          rawMessage.toLowerCase().includes('not found') ||
          rawMessage.toLowerCase().includes('not enabled')
        ) {
          handleProviderMissing(provider);
        } else {
          setMissingProviderNotice({
            provider,
            providerName: provider,
            title: `Sign-in Error`,
            message: rawMessage || `Could not connect to ${provider}.`,
          });
          if (onError) onError(rawMessage);
        }
        setLoadingProvider(null);
      }
    } catch (err) {
      console.error(`[SocialAuth] Error during ${provider} sign-in:`, err);
      const isNetworkError =
        err?.message?.includes('Failed to fetch') ||
        err?.name === 'TypeError' ||
        err?.message?.includes('NetworkError');

      if (isNetworkError) {
        const targetUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const msg = isProduction
          ? `Cannot connect to backend at ${targetUrl}. Please make sure your backend is deployed, running, and VITE_API_URL is set in Vercel.`
          : `Cannot connect to backend server at ${targetUrl}. Please ensure the server is running (npm run dev in /server).`;
        setMissingProviderNotice({
          provider,
          providerName: 'Server Connection',
          title: 'Backend Server Unreachable',
          message: msg,
          isServerUnreachable: true,
        });
        if (onError) onError(msg);
      } else {
        handleProviderMissing(provider);
      }
      setLoadingProvider(null);
    }
  }

  function handleCopySnippet(text) {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  }

  return (
    <div className="w-full space-y-3">
      {/* Notice Banner */}
      {missingProviderNotice && (
        <div
          role="alert"
          className="relative rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 space-y-1">
              <p className="font-semibold">
                {missingProviderNotice.title || `${missingProviderNotice.providerName} Notice`}
              </p>
              <p className="text-amber-800 dark:text-amber-300">
                {missingProviderNotice.message}
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowSetupGuide(true)}
                  className="inline-flex items-center gap-1 font-semibold text-indigo-700 underline hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <HelpCircle size={13} />
                  View setup guide & instructions
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMissingProviderNotice(null)}
              className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200"
              aria-label="Dismiss alert"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Setup Guide Modal */}
      {showSetupGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                How to Enable Social Login & Production Deploy
              </h3>
              <button
                type="button"
                onClick={() => setShowSetupGuide(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-gray-600 dark:text-gray-300">
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/40">
                <p className="font-semibold text-indigo-950 dark:text-indigo-200">
                  Step 1: Link Frontend to Backend in Vercel
                </p>
                <p className="mt-1 text-[11px] text-indigo-800 dark:text-indigo-300">
                  In your <strong>Vercel Dashboard &gt; Project Settings &gt; Environment Variables</strong>, add:
                </p>
                <div className="mt-1.5 font-mono text-[11px] bg-indigo-900 text-indigo-100 dark:bg-black rounded p-2">
                  VITE_API_URL=https://your-backend-server.onrender.com
                </div>
                <p className="mt-1 text-[10px] text-indigo-700 dark:text-indigo-400">
                  * Replace with your live backend URL (no trailing slash). Then trigger a <strong>Redeploy</strong> in Vercel.
                </p>
              </div>

              <div className="space-y-3">
                {/* Google */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Step 2: Google OAuth Credentials</span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Google Cloud Console <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    In your OAuth 2.0 Web Client, add:
                  </p>
                  <ul className="mt-1 list-disc pl-4 space-y-1 text-[11px] text-gray-600 dark:text-gray-300">
                    <li>
                      <strong>Authorized JavaScript Origins:</strong><br />
                      <code className="rounded bg-gray-200 px-1 text-gray-800 dark:bg-gray-700 dark:text-gray-200">{typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}</code> and your backend URL
                    </li>
                    <li>
                      <strong>Authorized Redirect URI:</strong><br />
                      <code className="rounded bg-gray-200 px-1 text-gray-800 dark:bg-gray-700 dark:text-gray-200">https://your-backend-server.onrender.com/api/auth/callback/google</code>
                    </li>
                  </ul>
                </div>

                {/* Facebook */}
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Step 3: Facebook OAuth (Optional)</span>
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Meta for Developers <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Add Valid OAuth Redirect URI in Facebook Login:
                    <code className="mx-1 block mt-1 rounded bg-gray-200 px-1 py-0.5 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      https://your-backend-server.onrender.com/api/auth/callback/facebook
                    </code>
                  </p>
                </div>
              </div>

              {/* Code snippet for Backend */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    Step 4: Set on Backend Host (Render/Railway):
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopySnippet(
                        `CLIENT_ORIGIN=${typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}\nBETTER_AUTH_URL=https://your-backend-server.onrender.com\nGOOGLE_CLIENT_ID=your-google-client-id\nGOOGLE_CLIENT_SECRET=your-google-client-secret`
                      )
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey ? 'Copied' : 'Copy env snippet'}
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-gray-900 p-3 font-mono text-[11px] text-emerald-400 dark:bg-black">
                  {`CLIENT_ORIGIN=${typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}\nBETTER_AUTH_URL=https://your-backend-server.onrender.com\nGOOGLE_CLIENT_ID=your-google-client-id\nGOOGLE_CLIENT_SECRET=your-google-client-secret`}
                </pre>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setShowSetupGuide(false)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
              >
                Got it, close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Buttons: Google & Facebook */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google */}
        <button
          type="button"
          id="social-signin-google"
          disabled={!!loadingProvider}
          onClick={() => handleSocialSignIn('google')}
          className="group relative flex h-11 items-center justify-center gap-2.5 rounded-xl border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          title="Sign in with Google"
        >
          {loadingProvider === 'google' ? (
            <Loader2 size={16} className="animate-spin text-gray-500 dark:text-gray-400" />
          ) : (
            <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Google</span>
        </button>

        {/* Facebook */}
        <button
          type="button"
          id="social-signin-facebook"
          disabled={!!loadingProvider}
          onClick={() => handleSocialSignIn('facebook')}
          className="group relative flex h-11 items-center justify-center gap-2.5 rounded-xl border border-gray-300 bg-white px-4 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          title="Sign in with Facebook"
        >
          {loadingProvider === 'facebook' ? (
            <Loader2 size={16} className="animate-spin text-[#1877F2]" />
          ) : (
            <svg className="h-4.5 w-4.5 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          )}
          <span>Facebook</span>
        </button>
      </div>

      <div className="relative my-4 flex items-center justify-center">
        <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        <span className="absolute bg-white px-3 text-xs uppercase tracking-wider text-gray-400 dark:bg-gray-900 dark:text-gray-500">
          Or continue with
        </span>
      </div>
    </div>
  );
}
