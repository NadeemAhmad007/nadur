import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <WifiOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold">You are offline</h1>
        <p className="text-sm text-gray-600 mt-2">
          Previously viewed profiles are still available.
        </p>
        <Link href="/">
          <Button className="mt-6">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
