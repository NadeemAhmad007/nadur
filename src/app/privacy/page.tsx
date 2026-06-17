import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img src="/logo.png" alt="Kashmir360" className="w-5 h-5" />
          <h1 className="text-lg font-semibold">Privacy Policy</h1>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6 text-sm text-gray-700 space-y-4">
        <h2 className="text-base font-semibold">Information We Collect</h2>
        <p>Kashmir360 collects minimal data to connect tourists with Dal Lake operators.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Tourists:</strong> We do not collect personal data unless you sign in. Session IDs are random UUIDs stored in your browser for lead tracking. Favorites are stored in localStorage on your device.</li>
          <li><strong>Operators:</strong> We collect business name, WhatsApp number, descriptions, and photos you upload. This data is displayed publicly once approved.</li>
        </ul>
        <h2 className="text-base font-semibold">Data Sharing</h2>
        <p>We do not sell or share your data with third parties. Lead events contain no personal identifiable information (PII).</p>
        <h2 className="text-base font-semibold">Contact</h2>
        <p>For privacy concerns, reach out to us via WhatsApp.</p>
      </main>
    </div>
  );
}
