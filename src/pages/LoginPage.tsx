import { getGoogleAuthUrl } from '../lib/api';

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-canvas flex items-center justify-center px-4">
      {/* Decorative floating shapes */}
      <div className="absolute top-12 left-12 w-20 h-20 rounded-full bg-accent animate-float pointer-events-none" />
      <div className="absolute top-32 right-20 w-14 h-14 rounded-2xl bg-rose rotate-12 animate-floatSlow pointer-events-none" />
      <div className="absolute bottom-20 left-24 w-24 h-24 rounded-3xl bg-mint -rotate-6 animate-floatSlow pointer-events-none" />
      <div className="absolute bottom-32 right-16 w-16 h-16 rounded-full bg-sun animate-float pointer-events-none" />
      <div className="absolute top-1/2 left-8 w-10 h-10 rounded-lg bg-sky rotate-45 animate-wiggle pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-12 h-12 rounded-full bg-accent-soft animate-floatSlow pointer-events-none" />
      <div className="hidden md:block absolute top-20 left-1/3 w-6 h-6 rounded-full bg-rose pointer-events-none" />
      <div className="hidden md:block absolute bottom-1/4 right-1/3 w-8 h-8 rounded-lg bg-mint rotate-12 pointer-events-none" />

      {/* Main card */}
      <div className="relative z-10 w-full max-w-md animate-pop">
        <div className="bg-surface rounded-3xl border-2 border-ink-900 shadow-[8px_8px_0_0_rgba(124,58,237,1)] p-8 sm:p-10">
          {/* Logo/Emoji header */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center text-4xl shadow-card rotate-[-6deg]">
                ✨
              </div>
              <div className="absolute -top-2 -right-3 w-8 h-8 bg-rose rounded-full flex items-center justify-center text-sm rotate-12 text-white font-bold">
                ✓
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-2">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink-900">
              TaskPilot
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-center text-ink-500 text-base mb-1">
            Your day, beautifully organized
          </p>
          <p className="text-center text-ink-400 text-sm mb-8">
            Sign in to start checking things off ✓
          </p>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="group w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-ink-900 hover:bg-accent text-white rounded-2xl border-2 border-ink-900 transition-all font-semibold text-base shadow-[4px_4px_0_0_rgba(236,72,153,1)] hover:shadow-[6px_6px_0_0_rgba(236,72,153,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 active:shadow-[2px_2px_0_0_rgba(236,72,153,1)] active:translate-x-0 active:translate-y-0"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Decorative dots */}
          <div className="flex justify-center gap-1.5 mt-8">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <div className="w-2 h-2 rounded-full bg-rose" />
            <div className="w-2 h-2 rounded-full bg-mint" />
            <div className="w-2 h-2 rounded-full bg-sun" />
            <div className="w-2 h-2 rounded-full bg-sky" />
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-ink-400 mt-6">
            By signing in, you agree to keep things tidy.
          </p>
        </div>

        {/* Floating badge */}
        <div className="hidden sm:flex absolute -top-4 -right-4 bg-mint text-mint-ink px-4 py-2 rounded-full font-semibold text-sm shadow-card rotate-6 border-2 border-ink-900">
          ✦ Free forever
        </div>
      </div>
    </div>
  );
}
