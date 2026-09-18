import { ERPShell } from '@/components/erp/erp-shell';

export default function ERPLayout({ children }: LayoutProps<'/admin/erp'>) {
  return <ERPShell>{children}</ERPShell>;
}
