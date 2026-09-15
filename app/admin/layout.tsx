import { AdminNav } from '@/components/admin-nav';
import { AdminGuard } from '@/components/admin-guard';
import { AdminChrome } from '@/components/admin-chrome';

export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <AdminGuard>
      <AdminChrome>{children}</AdminChrome>
    </AdminGuard>
  );
}
