import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">404</h1>
        <p className="text-gray-600 mt-2">This page could not be found</p>
        <p className="text-sm text-gray-500 mt-1">
          The operator may no longer be listed, or the link is incorrect.
        </p>
        <div className="mt-6 space-y-2">
          <Link href="/">
            <Button className="w-full">Browse Operators</Button>
          </Link>
          <Link href="/join">
            <Button variant="outline" className="w-full">Register Your Business</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
