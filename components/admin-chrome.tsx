'use client';

import { usePathname } from 'next/navigation';
import { AdminNav } from './admin-nav';

export function AdminChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hideChrome = path === '/admin/login';
  if (hideChrome) return <>{children}</>;
  return (
    <div className="min-h-screen bg-[color:var(--color-cream)]">
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
