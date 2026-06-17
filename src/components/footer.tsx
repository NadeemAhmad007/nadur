'use client';

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
              K
            </div>
            <span className="text-sm font-semibold text-foreground">Kashmir360</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Browse
            </Link>
            <Link href="/join" className="hover:text-foreground transition-colors">
              Register
            </Link>
            <Link href="/auth/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </nav>
        </div>
        <p className="text-xs text-muted-foreground text-center sm:text-left mt-4">
          &copy; {new Date().getFullYear()} Kashmir360. Discover Dal Lake operators.
        </p>
      </div>
    </footer>
  );
}
