import { ArrowUpRight } from 'lucide-react';
import { getGoogleAuthUrl } from '../lib/api';

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <div className="min-h-screen bg-canvas text-ink-900 relative overflow-hidden">
      {/* Subtle decorative marks — single dots, kept far from the content */}
      <div className="absolute top-10 right-12 w-1.5 h-1.5 rounded-full bg-rose pointer-events-none" />
      <div className="absolute bottom-12 right-8 w-1.5 h-1.5 rounded-full bg-mint pointer-events-none" />
      <div className="absolute top-1/2 right-16 w-1 h-1 rounded-full bg-accent pointer-events-none" />

      {/* Top bar */}
      <header className="px-6 sm:px-10 lg:px-16 pt-6 sm:pt-8">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 bg-ink-900 rounded-md" />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-sm" />
          </div>
          <span className="text-sm font-semibold tracking-tight">TaskPilot</span>
        </div>
      </header>

      {/* Hero */}
      <main className="px-6 sm:px-10 lg:px-16 min-h-[calc(100vh-6rem)] flex flex-col justify-center max-w-5xl">
        {/* Tiny eyebrow */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8 animate-fadeIn">
          <div className="w-6 h-px bg-ink-900" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-ink-700 font-semibold">
            A task app, but quieter
          </span>
        </div>

        {/* Huge headline */}
        <h1 className="font-bold tracking-[-0.04em] leading-[0.92] text-[clamp(3.25rem,12vw,9rem)] mb-10 sm:mb-12">
          <span className="block animate-fadeIn">Less list.</span>
          <span className="block animate-fadeIn" style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}>
            More
          </span>
          <span
            className="block text-accent italic animate-fadeIn"
            style={{ animationDelay: '120ms', animationFillMode: 'backwards' }}
          >
            done.
          </span>
        </h1>

        {/* Divider */}
        <div className="h-px w-16 bg-ink-900 mb-8" />

        {/* CTA */}
        <div className="animate-fadeIn" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
          <button
            onClick={handleGoogleSignIn}
            className="group inline-flex items-center gap-3 pl-4 pr-3 py-3 bg-ink-900 text-canvas hover:bg-accent rounded-full transition-colors duration-200 font-medium text-[15px]"
          >
            <svg className="w-4 h-4" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            <span>Continue with Google</span>
            <span className="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-full bg-canvas text-ink-900 group-hover:bg-ink-900 group-hover:text-canvas transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </button>

          <p className="text-sm text-ink-500 mt-5 max-w-md">
            No clutter. No nagging. Just the things you've been meaning to do.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-6 left-6 sm:left-10 lg:left-16 right-6 sm:right-10 lg:right-16 flex items-center justify-between text-[11px] text-ink-400 uppercase tracking-[0.12em]">
        <span>Private &amp; secure</span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-mint" />
          <span>Online</span>
        </span>
      </footer>
    </div>
  );
}
