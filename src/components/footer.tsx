'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Kashmir360" className="h-48 w-auto object-contain" />
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Browse
            </Link>
            <Link href="/join" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Register
            </Link>
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Sign In
            </Link>
            <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Privacy
            </Link>
            <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Terms
            </Link>
          </nav>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-6 pt-6 border-t border-border/40">
          <p className="text-xs text-muted-foreground/70">
            &copy; {new Date().getFullYear()} Kashmir360. Connect Direct. Book Local.
          </p>
          <p className="text-[11px] text-muted-foreground/50">
            Srinagar, Jammu &amp; Kashmir
          </p>
        </div>
      </div>
    </footer>
  );
}
