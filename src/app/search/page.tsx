'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { OperatorCard } from '@/components/operator-card';
import type { Operator } from '@/types';
import { Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(`/api/operators?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => setResults(d.data))
      .finally(() => setLoading(false));
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-1">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <img src="/logo.png" alt="Kashmir360" className="h-10 w-auto" />
            <form onSubmit={handleSubmit} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search operators..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2C5F8A]"
                autoFocus
              />
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {!query ? (
          <p className="text-center text-gray-500 py-8 text-sm">Type to search operators</p>
        ) : loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse">
                <div className="aspect-[4/3] rounded-t-xl bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-sm mt-1">Try different keywords</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">{results.length} result{results.length !== 1 ? 's' : ''}</p>
            {results.length >= 20 && (
              <p className="text-xs text-gray-400 mb-3">Showing first {results.length} results. Refine your search for better results.</p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {results.map((op) => (
                <OperatorCard key={op.id} operator={op} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SearchContent />
    </Suspense>
  );
}
