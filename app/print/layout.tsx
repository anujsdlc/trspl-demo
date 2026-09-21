export const metadata = { title: 'TRS · Document' };

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[color:var(--color-paper)] p-6">{children}</div>;
}
