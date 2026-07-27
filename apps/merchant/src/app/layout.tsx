import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/toaster';

export const metadata: Metadata = { title: '商家后台 - 优品商城' };

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
