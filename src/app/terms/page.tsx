import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3 min-h-24">
          <Link href="/" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Kashmir360" className="h-56 w-auto object-contain" />
          <h1 className="text-lg font-semibold">Terms of Service</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 text-sm text-gray-700 space-y-4">
        <h2 className="text-base font-semibold">For Tourists</h2>
        <p>Kashmir360 is a discovery platform. All transactions, bookings, and agreements are between you and the operator. Kashmir360 does not facilitate payments or bookings in its current version.</p>
        <h2 className="text-base font-semibold">For Operators</h2>
        <p>By submitting a profile, you confirm that all information provided is accurate. Kashmir360 reserves the right to reject, suspend, or remove listings that violate our guidelines.</p>
        <h2 className="text-base font-semibold">Limitation of Liability</h2>
        <p>Kashmir360 is not liable for any disputes, damages, or losses arising from interactions between tourists and operators.</p>
        <h2 className="text-base font-semibold">Changes</h2>
        <p>We may update these terms. Continued use of the platform constitutes acceptance of the updated terms.</p>
      </main>
    </div>
  );
}
