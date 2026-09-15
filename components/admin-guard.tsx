'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (path === '/admin/login') { setChecked(true); setAuthed(true); return; }
    try {
      const raw = localStorage.getItem('trs.admin.auth');
      if (raw) {
        setAuthed(true);
      } else {
        router.replace('/admin/login');
      }
    } catch {
      router.replace('/admin/login');
    }
    setChecked(true);
  }, [path, router]);

  if (!checked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[color:var(--color-cream)]">
        <div className="text-xs font-mono text-[color:var(--color-ink-muted)]">Checking session…</div>
      </div>
    );
  }
  if (!authed) return null;
  return <>{children}</>;
}
