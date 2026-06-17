import { ToastProvider } from '@/components/ui/toast';
import { Sidebar, adminNav } from '@/components/ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar brand="Kashmir360" type="admin" groups={adminNav} />
        <main className="flex-1 lg:pl-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-20 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
