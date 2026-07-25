import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: '优品商城 - 品质生活从这里开始',
  description: '优品商城，正品保障，极速物流，无忧售后',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <Header />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t bg-white py-8 text-center text-sm text-gray-500">
            <div className="mx-auto max-w-7xl px-4">
              <p>© 2025 优品商城 版权所有 | 模拟电商平台</p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
