import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: '管理后台 - 优品商城' };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
