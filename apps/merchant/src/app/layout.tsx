import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: '商家后台 - 优品商城' };

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
