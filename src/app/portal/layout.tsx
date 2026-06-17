import { ToastProvider } from '@/components/ui/toast';
import { Sidebar, portalNav } from '@/components/ui/sidebar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar brand="My Profile" type="portal" groups={portalNav} />
        <main className="flex-1 lg:pl-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 pt-20 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
