import { Suspense } from 'react';
import { LoyaltyMembersConsole } from '@/components/loyalty-members';

export default function LoyaltyMembersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs font-mono text-[color:var(--color-ink-muted)]">Loading members…</div>}>
      <LoyaltyMembersConsole />
    </Suspense>
  );
}
