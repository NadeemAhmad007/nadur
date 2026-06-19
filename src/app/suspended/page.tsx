import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold">Profile Suspended</h1>
        <p className="text-sm text-gray-600 mt-2">
          This operator profile is currently not available. Please contact Kasheer360 support for more information.
        </p>
        <Link href="/">
          <Button className="mt-6">Browse Other Operators</Button>
        </Link>
      </div>
    </div>
  );
}
