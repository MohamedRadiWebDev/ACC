'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'لوحة التحكم' },
  { href: '/treasury', label: 'الخزنة' },
  { href: '/treasury-count', label: 'جرد الخزينة' },
  { href: '/banks', label: 'البنوك' },
  { href: '/digital-wallets', label: 'المحافظ الرقمية' },
  { href: '/revenue', label: 'الايراد' },
  { href: '/advances', label: 'السلف' },
  { href: '/custody', label: 'العهد' },
  { href: '/reconciliation', label: 'المطابقة' },
  { href: '/reports', label: 'التقارير' },
  { href: '/import-export', label: 'استيراد/تصدير' },
  { href: '/settings', label: 'الإعدادات' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-white border-l border-border shadow-sm p-4 flex flex-col space-y-4">
      <div className="text-xl font-bold text-primary">دفتر الشركة</div>
      <nav className="flex-1 space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'block rounded px-3 py-2 text-sm hover:bg-primary/10',
              pathname === link.href ? 'bg-primary/20 text-primary-foreground' : 'text-foreground'
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="text-xs text-muted-foreground">يعمل دون اتصال باستخدام IndexedDB</div>
    </aside>
  );
}
