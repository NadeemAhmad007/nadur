'use client';

import Link from 'next/link';
import { Compass, MessageCircle, Mail, Sparkles } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Kashmir360" className="h-24 w-auto object-contain" />
            </Link>
            <p className="text-xs text-muted-foreground/70 leading-relaxed max-w-xs">
              Connect directly with verified houseboats, shikara rides, artisans, guides, and local businesses across Srinagar, Kashmir.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Explore</h4>
            <nav className="space-y-2.5">
              <Link href="/" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Browse Operators
              </Link>
              <Link href="/search" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Search
              </Link>
              <Link href="/favorites" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Favorites
              </Link>
              <Link href="/join" className="block text-sm text-muted-foreground hover:text-accent transition-colors">
                Register Your Business
              </Link>
            </nav>
          </div>

          {/* Connect */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-4">Connect</h4>
            <div className="space-y-3">
              <a
                href="mailto:kashmir360d@gmail.com"
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-accent transition-colors"
              >
                <Mail className="h-4 w-4" />
                kashmir360d@gmail.com
              </a>
              <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Compass className="h-4 w-4 shrink-0" />
                <span>Srinagar, Jammu &amp; Kashmir</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60 pt-2">
                <Sparkles className="h-3 w-3 text-accent" />
                <span>100% direct connection — no middlemen</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-10 pt-6 border-t border-border/40">
          <p className="text-xs text-muted-foreground/70">
            &copy; {new Date().getFullYear()} Kashmir360. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-xs text-muted-foreground/60 hover:text-accent transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-xs text-muted-foreground/60 hover:text-accent transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
