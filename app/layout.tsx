import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { ToastProvider } from '@/components/ui/use-toast';

export const metadata: Metadata = {
  title: 'دفتر حسابات',
  description: 'أداة محاسبية تعمل دون اتصال',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-muted/30">
        <ToastProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 p-4 space-y-6">{children}</main>
          </div>
          <Toaster />
        </ToastProvider>
      </body>
    </html>
  );
}
