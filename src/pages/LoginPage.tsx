import { getGoogleAuthUrl } from '../lib/api';

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-canvas">
      {/* Subtle background accents */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent-softer pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-rose-softer pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-2 h-2 rounded-full bg-accent pointer-events-none animate-floatSlow" />
      <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-rose pointer-events-none animate-float" />
      <div className="absolute bottom-1/3 right-1/3 w-2 h-2 rounded-full bg-mint pointer-events-none animate-floatSlow" />

      {/* Grid layout: brand on left (desktop), form on right */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left side — Brand & pitch */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16 py-12 lg:py-0">
          <div className="max-w-md w-full">
            {/* Logo mark */}
            <div className="flex items-center gap-2.5 mb-10">
              <div className="relative">
                <div className="w-9 h-9 bg-ink-900 rounded-lg" />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-md" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-ink-900">TaskPilot</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.05] mb-5">
              Make today
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">actually</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-accent/30 -z-0" />
              </span>
              {' '}
              <span className="text-accent">happen.</span>
            </h1>

            {/* Subline */}
            <p className="text-base sm:text-lg text-ink-500 leading-relaxed mb-8 max-w-sm">
              A calm space for the things you keep meaning to do. No clutter. No noise. Just progress.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-ink-200 text-xs font-medium text-ink-700">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Smart priorities
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-ink-200 text-xs font-medium text-ink-700">
                <span className="w-1.5 h-1.5 rounded-full bg-rose" />
                Recurring tasks
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-ink-200 text-xs font-medium text-ink-700">
                <span className="w-1.5 h-1.5 rounded-full bg-mint" />
                Tag everything
              </span>
            </div>
          </div>
        </div>

        {/* Right side — Sign-in card */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16 py-12 lg:py-0">
          <div className="w-full max-w-sm animate-pop">
            <div className="bg-surface rounded-2xl border border-ink-200 shadow-[0_24px_48px_-12px_rgba(124,58,237,0.18)] p-8">
              <div className="mb-7">
                <h2 className="text-2xl font-semibold tracking-tight text-ink-900 mb-1.5">
                  Welcome
                </h2>
                <p className="text-sm text-ink-500">
                  Sign in to pick up where you left off.
                </p>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-surface hover:bg-ink-100 text-ink-900 border border-ink-200 hover:border-ink-300 rounded-xl transition-all font-medium text-sm shadow-card hover:shadow-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-ink-200" />
                <span className="text-[11px] uppercase tracking-wider text-ink-400 font-medium">
                  Private &amp; secure
                </span>
                <div className="flex-1 h-px bg-ink-200" />
              </div>

              {/* Trust line */}
              <p className="text-xs text-ink-500 leading-relaxed text-center">
                Your tasks stay yours. We only use Google for sign-in — nothing more.
              </p>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-ink-400 mt-6">
              By continuing, you agree to our terms &amp; privacy notes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
