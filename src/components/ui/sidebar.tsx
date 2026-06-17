'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Users, TicketCheck, BarChart3, Settings, LogOut,
  Menu, X, ChevronRight, Building2, ShieldCheck, UserCircle, QrCode,
  Tags, ChevronDown, Smartphone
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

interface SidebarProps {
  brand: string;
  logo?: string;
  groups: SidebarGroup[];
  type: 'admin' | 'portal';
}

export function Sidebar({ brand, logo, groups, type }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border shadow lg:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-16' : 'w-64',
          'lg:translate-x-0 lg:static lg:z-auto'
        )}
      >
        {/* Brand */}
        <div className={cn('flex h-16 items-center border-b border-sidebar-border px-4', collapsed && 'justify-center')}>
          <Link href={type === 'admin' ? '/admin' : '/portal'} className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              {logo || brand[0]}
            </div>
            {!collapsed && <span className="font-semibold text-sidebar-foreground">{brand}</span>}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto hidden lg:flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent"
          >
            <ChevronRight className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive(item.href)
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50',
                      collapsed && 'justify-center px-2'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={cn(
              'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors',
              collapsed && 'justify-center'
            )}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export const adminNav: SidebarGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Operators', href: '/admin/operators', icon: <Building2 className="h-4 w-4" /> },
      { label: 'Categories', href: '/admin/categories', icon: <Tags className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Approvals', href: '/admin?status=pending', icon: <ShieldCheck className="h-4 w-4" /> },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'WhatsApp', href: '/admin/whatsapp', icon: <Smartphone className="h-4 w-4" /> },
    ],
  },
];

export const portalNav: SidebarGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/portal', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Edit Profile', href: '/portal/edit', icon: <UserCircle className="h-4 w-4" /> },
      { label: 'QR Code', href: '/portal/qr', icon: <QrCode className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Browse Operators', href: '/', icon: <Building2 className="h-4 w-4" /> },
    ],
  },
];
